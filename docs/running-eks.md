# Running tailbench on EKS

Operator runbook for the AWS Kubernetes variant. It covers everything from a
fresh clone to a published dashboard, and calls out the places where the EKS
variant behaves differently from the VM variants.

Read [README.md](../README.md) first for the project-wide picture; this document
only covers `eks`.

## What this binary is

`tailbench-aws-k8s` is the only executable that speaks to EKS. The build tags
select which `internal/provider/<cloud>.go` compiles, so this binary links the
AWS Pulumi SDK and the Kubernetes client, and no other cloud's SDK. The provider
value it accepts is `eks`, not `aws` — `main.compiledProviderFactory` rejects any
other `--provider` value, and renaming the executable does not change its
identity (`cmd/tailbench/main.go:72-77`).

| Property | Value |
|---|---|
| Binary | `./dist/tailbench-aws-k8s` |
| Build tags | `aws,k8s` (`Makefile:67-69`) |
| Make target | `make build-aws-k8s` |
| Provider value | `eks` (`cmd/tailbench/aws_k8s.go:10`) |
| Environment | `container` — benchmarks run in pods, not on VMs (`internal/orchestrator/orchestrator.go:412-415`) |
| Result dir | `eks/<family>/results/<type>-<mode>.json` (`internal/orchestrator/orchestrator.go:663`) |

Two consequences of `environment: container` shape everything below:

- Benchmarks execute through the Kubernetes API (`kubectl exec` semantics via
  client-go SPDY), never over SSH. The orchestrator routes to the K8s path when
  `PairOutput.Namespace != ""` (`internal/orchestrator/orchestrator.go:562-563`),
  and builds four executors — bench and tailscale containers on each of the two
  pods — in `internal/orchestrator/k8s_enabled.go:141-156` using
  `k8s.NewKubeExecExecutor` (`internal/k8s/kubeexec.go:37-59`).
- The set of valid benchmark modes is different. See
  [Configure config.yaml](#configure-configyaml).

## Prerequisites

`mise.toml` pins the whole toolchain; `mise install` provisions it. The EKS
variant needs more runtime CLIs than the VM variants: `pulumi` plus `kubectl`
(for `kubectl apply -k`) and `helm` (for the Tailscale operator chart).

| Tool | Needed for | Verified in code |
|---|---|---|
| Go (version in `go.mod`) | building only | — |
| `pulumi` | Automation API drives every stack | `internal/provider/eks.go:181-190` |
| `aws` | instance discovery **and** kubeconfig generation | `internal/provider/aws_instances.go:24-29`, `internal/provider/eks.go:200-207` |
| `kubectl` | `apply -k` of the L7 and ProxyGroup manifests | `internal/k8s/util.go:51`, `internal/k8s/proxygroup.go:66` |
| `helm` (3.x) | installs the Tailscale operator chart | `internal/k8s/operator.go:207-227` |

Helm is pinned to 3.x on purpose: the operator install uses classic
`helm repo add` + `helm upgrade --install`, which Helm 4 deprecates in favour of
OCI registries (`mise.toml`).

Verify every dependency before a run:

```bash
# Toolchain
go version
pulumi version
kubectl version --client
helm version --short
aws --version

# AWS authentication and reachability (region must match aws.region below)
aws sts get-caller-identity
aws eks list-clusters --region "$(awk '/^aws:/{f=1} f&&/region:/{print $2; exit}' config.yaml)"

# Instance discovery — this is the exact call --dry-run makes
aws ec2 describe-instance-types --region us-west-2 \
  --filters Name=instance-type,Values=c7i.* \
  --query 'InstanceTypes[0].InstanceType' --output text

# Tailscale credentials
test -f .env && grep -q '^OAUTH_CLIENT_ID=.\+' .env && echo ".env has OAUTH_CLIENT_ID"
```

Note that instance discovery shells out to the `aws` CLI rather than using the Go
SDK (`internal/provider/aws_instances.go:20-56`), so the CLI is required even for
`--dry-run`.

## Build

```bash
make build-aws-k8s
./dist/tailbench-aws-k8s --version
make verify-deps VARIANT=aws-k8s   # optional: asserts no foreign cloud SDK is linked
```

A bare `go build ./cmd/tailbench/` fails by design — the guard files reference an
undefined symbol so a mis-tagged build breaks at compile time rather than
producing a binary with the wrong provider. Compiling the Pulumi SDKs is
memory-intensive; build one variant at a time.

Editors need the tags too. `.vscode/settings.json` pins `-tags=aws`; change it to
`-tags=aws,k8s` when working on this variant, or export
`GOFLAGS='-tags=aws,k8s'` for a shell session. Without a tag, gopls reports
`compiledProviderName` and `newCompiledProvider` as undefined — false positives.

## Credentials

Three independent credential systems are involved. None of them substitutes for
another, and each fails in a different place.

**Tailscale OAuth** — supplied through `.env`, which `config.yaml` references via
`env_file:` and expands into the `${VAR}` placeholders under `tailscale:`
(`internal/config/config.go:243-258`, `:274-275`). The client must be org-level
and able to create tailnets, write auth keys, the policy file, and devices;
tailbench creates and deletes real tailnets, so use disposable org credentials.

```bash
cp .env.example .env
$EDITOR .env   # OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET
```

A missing `.env` is not fatal — expansion falls back to the process environment
(`internal/config/config.go:248-257`). Credentials are only demanded when a run
needs to create a tailnet: `validateCredentials`
(`internal/orchestrator/orchestrator.go:48-78`) is reached only when
`.tailbench/tailnet.json` is absent (`:168-184`). `--dry-run` and `--version`
never need them.

**AWS** — the Pulumi program sets only `aws:region`
(`internal/provider/eks.go:185`, `:272-274`), so the AWS provider and the `aws`
CLI both resolve credentials from the ambient environment (profile, env vars,
instance role) in the usual way. Two things must hold for the whole run, not just
at startup:

- The credentials must stay valid, because `aws ec2 describe-instance-types` and
  `aws eks update-kubeconfig` are invoked at run time.
- The kubeconfig that `aws eks update-kubeconfig` produces is consumed verbatim
  by client-go (`internal/provider/eks.go:209-218`,
  `internal/k8s/pods.go:184-194`). Whatever authentication it embeds must keep
  working for the run's duration — with the AWS CLI's default output that means
  an exec credential plugin invoking `aws`, so the CLI must stay on `PATH` and
  stay authenticated.

The IAM capability required follows from the resources the code creates (see
[What happens during a run](#what-happens-during-a-run)): EC2 networking (VPC,
subnets, internet gateway, route tables), IAM role creation plus attachment of
the AWS-managed `AmazonEKSClusterPolicy`, `AmazonEKSWorkerNodePolicy`,
`AmazonEKS_CNI_Policy`, and `AmazonEC2ContainerRegistryReadOnly` policies, EKS
cluster creation, and EKS managed node group creation
(`internal/provider/eks.go:71-176`, `:246-260`). Role creation and managed-policy
attachment are the permissions most often missing from a developer role. No
precise policy document is given here — grant what your organization's guardrails
allow for these actions.

**Pulumi state backend** — only needed when `state_backend` selects Pulumi Cloud.
`provider.CheckBackendCredentials` fails at startup if neither
`PULUMI_ACCESS_TOKEN` nor `~/.pulumi/credentials.json` is present
(`internal/provider/backend.go`). The token can live in `.env`; the Pulumi CLI
inherits tailbench's environment, so no separate `pulumi login` is needed.

## Configure config.yaml

Only these keys affect the EKS variant. Everything under `gcp:`, `azure:`, and
`ssh:` is inert here, and so is `aws.key_name` — it is never read by
`internal/provider/eks.go`, because there is no SSH.

| Key | Default | What it does / what breaks |
|---|---|---|
| `providers` | `[]` → the compiled provider (`internal/config/config.go:350-352`) | Leave empty, or set `[eks]`. Any other value fails at startup (`cmd/tailbench/main.go:73-75`). |
| `aws.region` | `us-west-2` (`internal/config/config.go:303`) | Region for the cluster, node groups, instance discovery, and the recorded result `region` (`internal/orchestrator/orchestrator.go:827-829`). |
| `aws.az` | `us-west-2a` (`internal/config/config.go:304`) | AZ of subnet 1. EKS needs two AZs, so a second is **derived by rewriting the last character**: `…a` → `…b`, `…b` → `…c` (`internal/provider/eks.go:64-68`). Node groups only ever land in subnet 1 (`:249`), so the chosen instance type must be offered in `aws.az` itself. |
| `benchmark.modes` | `["l4-kernel"]` when empty (`internal/config/config.go:342-344`) | The only source of modes — **there is no `--modes` flag**. See the mode table below. |
| `l7_endpoints.cluster_label` | `app.kubernetes.io/part-of=tailbench-l7` (`internal/config/config.go:297`) | Label selector used to find the Ingress, the LoadBalancer Service, and the echo pod IP. Must match the labels in `manifests/l7-bench/*.yaml`; a mismatch makes every L7 mode skip with "no endpoint configured". |
| `l7_endpoints.ingress_fqdn` | `""` | Pins the L7 ingress target instead of discovering it (`internal/orchestrator/orchestrator.go:846-849`). Leave empty for normal use. |
| `l7_endpoints.serve_fqdn` | `""` | VM-only (`l7-serve-*`). Ignored by this binary. |
| `images.bench` / `images.tailscale` | `ghcr.io/rajsinghtech/tailbench-tools:latest` / `ghcr.io/tailscale/tailscale:latest` (`internal/config/config.go:312-313`) | Container images for the two bench pods (`internal/provider/eks.go:301-322`). |
| `tailscale.create_tailnet` | `true` | Must stay `true`. The tsnet server and tailnet DNS name are only populated inside that branch (`internal/orchestrator/orchestrator.go:160-262`), and the operator install needs both (`internal/orchestrator/k8s_enabled.go:44-51`, `internal/provider/eks.go:418`). |
| `tailscale.tag` | `tag:bench` (`internal/config/config.go:276`) | Becomes the operator's default tag and the subject of the `tailbench-admin` ClusterRoleBinding that grants cluster-admin (`internal/k8s/operator.go:169-192`, `:220`). |
| `state_backend` | `""` → local | See [Choose a state backend](#choose-a-state-backend). |
| `benchmark.pps_*` | sizes 64/340/1400, 0.1% loss, 15s, 2M pps ceiling | Only used by `forward-pps-*` modes. |

### Which modes this binary accepts

`ModeAppliesTo` (`internal/benchmark/modes.go:43-53`) gates modes by environment.
For `container`:

| Mode | Status on `tailbench-aws-k8s` |
|---|---|
| `l4-kernel` | runs (iperf3 + MTR, pod-to-pod) |
| `l4-userspace` | runs |
| `tsnet-userspace` | accepted, but the runner is not implemented — logged and skipped (`internal/orchestrator/orchestrator.go:800-802`) |
| `l4-lb` | K8s-only; runs here |
| `l7-ingress-h1`, `l7-ingress-h2` | K8s-only; run here |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | K8s-only; run here |
| `l7-serve-h1`, `l7-serve-h2` | VM-only — **silently skipped** |
| `forward-pps-exit`, `relay-throughput` | VM-only — **silently skipped** |

The silence is the trap. VM binaries reject K8s-only modes at startup
(`internal/orchestrator/k8s_disabled.go:16-23`), but the K8s build's
`validateWorkloadConfig` is a no-op (`internal/orchestrator/k8s_enabled.go:21`),
so VM-only modes in `config.yaml` are accepted, printed by `--dry-run`, and then
quietly dropped by `ModeAppliesTo` in both `pendingModesForInstance`
(`internal/orchestrator/orchestrator.go:906-927`) and `runModeLoop` (`:658-661`).

The shipped `config.yaml` lists `l4-kernel`, `l7-serve-h1`, `l7-serve-h2`. On
this binary that means **only `l4-kernel` runs** — while the L7 manifests still
get deployed, because that decision keys off `ModeUsesFortio` without an
environment check (`internal/orchestrator/k8s_enabled.go:23-30`, `:68-74`). Edit
`benchmark.modes` before your first EKS run:

```yaml
benchmark:
  modes:
    - l4-kernel
    - l4-lb
    - l7-ingress-h1
    - l7-ingress-h2
```

The `forward-pps-exit-k8s` / `forward-pps-exit-k8s-opton` pair is an A/B: the same
UDP sweep through an operator-managed egress ProxyGroup with
`TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS` absent and set to `"true"`
(`manifests/proxygroup/base`, `manifests/proxygroup/overlays/on`). Each arm
writes its own result file so an interrupted run resumes them independently. See
[docs/cost-forward-pps-plan.md](cost-forward-pps-plan.md) for the topology, sweep
methodology, `limiting_resource` semantics, and reproducibility caveats — and
read the known-issue note in [Troubleshooting](#troubleshooting) before relying
on these two modes.

## Choose a state backend

Pulumi state is where the record of your cluster lives. For EKS this matters more
than for the VM variants: a lost state file means an orphaned cluster that
tailbench can no longer destroy.

| `state_backend` | Stacks live in | Startup behaviour | Consequence |
|---|---|---|---|
| `""` (default) | `./state/eks` under this checkout | `MkdirAll` plus a sweep of stale `state/*/.pulumi/locks/*.json` (`internal/orchestrator/orchestrator.go:129-146`) | Invisible from any other checkout or host. A crashed run can only be resumed or torn down from this directory. |
| `pulumi.com` | Pulumi Cloud (normalized to `https://api.pulumi.com`) | Credential check; no local state dir, no lock sweep (`:122-127`) | Stacks survive machine swaps. Needs `PULUMI_ACCESS_TOKEN` or `pulumi login`. |
| `s3://…`, `gs://…`, `azblob://…` | Object storage | Same as above | Authenticated by the cloud credentials you already have. |
| `file://…` | The path you name | Local path handling and lock sweep | An explicit local or mounted directory. |

Stack names are already provider-qualified (`tailbench-eks-cluster`,
`tailbench-eks-<type>`), so one backend safely holds every provider's stacks.
`WorkDir` is separate from the backend URL — Pulumi always needs a real local
path for project and stack settings, so remote backends get scratch space under
`.tailbench/pulumi/eks` (`internal/provider/backend.go`).

An unusable value is rejected at parse time
(`internal/config/config.go:175-194`), not partway into the first stack
operation.

```bash
./dist/tailbench-aws-k8s --state-backend pulumi.com --family c7i
```

Recommendation for EKS: use a remote backend. The cluster outlives any single
run, and the ability to tear it down from a different machine is worth the setup.

## Dry run

```bash
./dist/tailbench-aws-k8s --dry-run
./dist/tailbench-aws-k8s --dry-run --family c7i
./dist/tailbench-aws-k8s --dry-run --family c7i --filter '^c7i\.(2)?xlarge$'
```

Dry run prints the provider, the configured modes, and every instance type that
`--family` and `--filter` select, then exits without touching any cloud
resources. An unrecognized `--family` is an error listing the valid families
rather than a silent empty selection
(`internal/orchestrator/orchestrator.go:327-339`).

Two things to know:

- **Dry run still calls the AWS CLI.** `ListInstances` runs
  `aws ec2 describe-instance-types` (`internal/orchestrator/orchestrator.go:302`,
  `internal/provider/aws_instances.go:24-29`), so AWS auth is required even
  though nothing is created. Tailscale credentials are not — the dry-run branch
  returns before any tailnet work (`:153-155`).
- **The modes it prints are the configured modes, not the applicable ones.** It
  echoes `cfg.Modes` verbatim (`:297`). VM-only entries shown there will be
  skipped during the real run. Cross-check against the mode table above.

Full flag list (`--help`): `-cleanup-networking`, `-config`, `-dry-run`,
`-family`, `-filter`, `-provider`, `-state-backend`. `--version` works but is
scanned out of `os.Args` before flag parsing, so it is not listed
(`cmd/tailbench/main.go:44-49`).

## Run

```bash
# Start small: one instance type, one cluster, one node group
./dist/tailbench-aws-k8s --filter '^c7i\.xlarge$'

# One family
./dist/tailbench-aws-k8s --family c7i

# Everything (expensive — read the cost note first)
./dist/tailbench-aws-k8s
```

Valid `--family` values for this provider: `c8gn`, `c6in`, `c7i`, `c7gn`, `c8g`,
`c6i`, `m6i`, `c7g`, `m7g` (`internal/provider/aws_instances.go:17`). `--filter`
is a Go regex matched against the full instance type
(`internal/orchestrator/orchestrator.go:341-350`, `:385-393`).

### Cost scoping

A cluster is far more expensive than a VM pair, and it is expensive even when
nothing is running on it:

- The **EKS control plane bills per cluster-hour** for as long as the cluster
  exists, independent of node groups. Tailbench creates it once and reuses it
  across runs — it is destroyed only by `--cleanup-networking`
  (`internal/orchestrator/orchestrator.go:552-557`). An interrupted run that you
  never return to leaves it billing.
- Each instance type provisions a node group of **two nodes of that type**, fixed
  at min/desired/max = 2 (`internal/provider/eks.go:252-256`). `--family c6in`
  with no filter therefore walks every `c6in` size in sequence, two at a time,
  up to `c6in.32xlarge`.
- Node groups are created and destroyed per instance type, but every iteration
  pays the full EKS node-group create/delete latency on top of the benchmark
  time.

So: scope with `--filter` first, confirm the selection with `--dry-run`, and
budget for the control plane separately from the nodes. Run `--cleanup-networking`
when you are finished — see [Teardown](#teardown).

Quota failures are contagious by design: when `IsQuotaError` matches during
`CreatePair`, the whole family is marked skipped for the rest of the run, on the
assumption that larger sizes in the same family will also be over quota
(`internal/orchestrator/orchestrator.go:506-508`). For EKS the matcher is wider
than for EC2 — it also treats `insufficient` and `Unschedulable` as quota errors
(`internal/provider/eks.go:392-402`), so a scheduling failure can skip a family
too.

## What happens during a run

The EKS lifecycle has three steps the VM variants do not have: cluster creation,
Tailscale operator install, and manifest deploys.

1. **Startup.** `restoreStandardLogger()` runs first, undoing Pulumi's
   `slog.SetDefault` takeover of the standard logger; without it every
   `log.Printf` and `log.Fatalf` is silently discarded
   (`cmd/tailbench/main.go:36-49`). Config is parsed, `--version` handled, modes
   name-validated, and the state backend's credentials checked
   (`internal/orchestrator/orchestrator.go:94-117`).
2. **State preparation.** For a local backend, `state/eks` is created and stale
   Pulumi lock files are swept — they are the cause of Pulumi's "exit status 255"
   (`:129-146`). Remote backends skip both.
3. **Tailnet.** Reused from `.tailbench/tailnet.json` if present, otherwise
   created and cached (`:168-203`). The ACL is written with the K8s branch
   enabled: `tag:k8s` owner, a `0.0.0.0/0` route auto-approver, and a
   `tailscale.com/cap/kubernetes` grant allowing impersonation as
   `system:masters` (`internal/tailnet/tailnet.go:201-226`). On a **newly
   created** tailnet only, HTTPS is enabled for the operator's API-server proxy
   (`internal/orchestrator/orchestrator.go:210-215`). An ephemeral auth key is
   minted and a tsnet node named `tailbench-orchestrator` joins the tailnet.
4. **Cluster (`SetupNetworking`).** Long-lived Pulumi stack
   `tailbench-eks-cluster` (`internal/provider/eks.go:61-230`) creating: a VPC
   `10.0.0.0/16` with DNS hostnames and support; two public subnets
   (`10.0.1.0/24` in `aws.az`, `10.0.2.0/24` in the derived AZ) with
   `MapPublicIpOnLaunch`; an internet gateway, a default route, and two route
   table associations; a cluster IAM role with `AmazonEKSClusterPolicy`; the EKS
   cluster itself; and a node IAM role with `AmazonEKSWorkerNodePolicy`,
   `AmazonEKS_CNI_Policy`, and `AmazonEC2ContainerRegistryReadOnly`. Then
   `aws eks update-kubeconfig` writes a kubeconfig to a **temporary file**, which
   is read, base64-encoded into memory, and deleted (`:194-214`) — your
   `~/.kube/config` is not modified. Finally the `tailbench` namespace is
   ensured.
5. **Stale device cleanup.** Tailnet devices matching `tb-eks-` and
   `tailbench-eks-operator` are deleted, on the assumption they are leftovers
   from a crashed run (`internal/orchestrator/orchestrator.go:362-371`).
6. **Tailscale operator install** (`internal/orchestrator/k8s_enabled.go:41-54`
   → `internal/provider/eks.go:407-425` → `internal/k8s/operator.go:64-97`).
   Unconditional for this variant — it happens even when only `l4-kernel` is
   configured. It creates the `tailscale` namespace, a `tailbench-admin`
   ClusterRoleBinding mapping the tailnet tag group to `cluster-admin`, and
   `helm upgrade --install tailscale-operator` from
   `https://pkgs.tailscale.com/helmcharts` with `apiServerProxyConfig.mode=true`,
   `allowImpersonation=true`, hostname `tailbench-eks-operator`, and
   `proxyConfig.defaultTags=tag:bench-service`. It then waits up to 10 minutes
   for `https://tailbench-eks-operator.<tailnet>/healthz` over the tailnet
   (`internal/k8s/operator.go:239-272`). Failure is a warning, not an error — the
   run continues with L7 modes likely broken.
7. **Manifest deploys** (`internal/orchestrator/k8s_enabled.go:56-96`), each via
   `kubectl apply -k`:
   - If any `forward-pps-*` mode is configured: `manifests/proxygroup/base` —
     ProxyClasses `common` and `common-accept-routes`, and a single-replica
     egress `ProxyGroup` named `tailbench-egress`.
   - If any fortio mode is configured: `manifests/l7-bench` — a `bench-echo`
     fortio Deployment and Service, a `bench-baseline` tools Deployment, an
     `Ingress` with `ingressClassName: tailscale`, and a `bench-echo-lb` Service
     with `loadBalancerClass: tailscale`. Both the Ingress and the LoadBalancer
     are served by the Tailscale operator — **no AWS ELB is created by these
     manifests**. The orchestrator then polls up to 3 minutes for the LB FQDN.
8. **Instance discovery.** Cached at `.tailbench/instances/eks-<family>.json`,
   keyed by family so a narrow cache cannot satisfy a later `--family all`
   (`internal/orchestrator/orchestrator.go:1023-1074`).
9. **Per instance type**, in ascending vCPU order:
   - Pending modes computed from existing result files; the type is skipped
     entirely if none remain (`:410-421`).
   - Pre-cleanup `DestroyPair`, then `CreatePair`: ephemeral Pulumi stack
     `tailbench-eks-<safeType>` with one EKS managed node group — two nodes,
     AMI type `AL2023_x86_64_STANDARD` or `AL2023_ARM_64_STANDARD` for Graviton,
     labelled `tailbench-pool=<safeType>` (`internal/provider/eks.go:246-260`).
     It waits up to 10 minutes for two Ready nodes, upserts the `tailbench-auth`
     secret holding the auth key, and deploys two pods —
     `tb-eks-server-<safeType>` and `tb-eks-client-<safeType>` — pinned to the
     pool by nodeSelector and kept on separate nodes by required anti-affinity
     (`:288-331`). Each pod is a privileged `sysctler` init container (enables IP
     forwarding), a `bench` container, and a `tailscale` sidecar sharing the pod
     network namespace (`internal/k8s/pods.go:34-87`).
   - Benchmarks run through the Kubernetes API against those containers. L7
     baselines deliberately target pod IPs rather than Service names, because the
     Tailscale sidecar hijacks DNS inside the bench pods
     (`internal/orchestrator/orchestrator.go:853-855`, `:878`); a separate
     sidecar-free `bench-baseline` pod is used as the baseline load generator
     when it can be found (`internal/orchestrator/k8s_enabled.go:158-166`,
     `internal/benchmark/runner.go:500-508`).
   - `DestroyPair` deletes both pods, destroys the node-group stack, and removes
     it from the workspace (`internal/provider/eks.go:347-365`).
   - The auth key is refreshed every 30 minutes of wall clock
     (`internal/orchestrator/orchestrator.go:536-545`).
10. **Aggregation.** A completed `runProvider` calls `result.Aggregate`
    automatically, rewriting `website/data.generated.js` (`:548`).
11. **Teardown.** `TeardownNetworking` — destroying the cluster stack — runs only
    when `--cleanup-networking` is set (`:552-557`).

### Endpoint resolution for L7 modes

`resolveEndpoints` (`internal/orchestrator/orchestrator.go:843-881`) decides what
each fortio mode targets:

| Mode | Tailscale target | Baseline target |
|---|---|---|
| `l7-ingress-h1`, `l7-ingress-h2` | `https://<Ingress LB hostname>`, discovered by `cluster_label` unless `ingress_fqdn` is set | echo pod IP, `http://<podIP>:8080` |
| `l4-lb` | `http://<Service LB hostname>:8080`, discovered by `cluster_label` | echo pod IP, `http://<podIP>:8080` |

Discovery reads `status.loadBalancer.ingress` on objects in the `tailbench`
namespace carrying `l7_endpoints.cluster_label`
(`internal/k8s/ingress.go`). Because both objects use Tailscale's
Ingress/LoadBalancer classes, the hostnames returned are tailnet FQDNs, which is
why the tailnet needs HTTPS enabled for the ingress modes to work. Every fortio
target is warmed up with retries before measurement, and a target that never
answers causes the mode to be skipped rather than recorded
(`internal/orchestrator/orchestrator.go:686-689`, `:883-903`).

## Generate the report

A successful run aggregates automatically. Do it by hand after editing, moving,
or deleting result files:

```bash
# MUST be run from the repo root — cmd/aggregate uses os.Getwd()
go run ./cmd/aggregate/
```

`result.Aggregate` walks `gcp`, `aws`, `azure`, `gke`, `eks`, `aks`, merges every
`*/**/results/*.json`, and writes `website/data.generated.js`
(`internal/result/aggregator.go:15-21`).

Price is derived at aggregation time, never stored in the result JSON: each
record is looked up in the curated dataset and a synthetic `price_per_hour` is
injected (`internal/result/aggregator.go:54-63`). `eks` prices resolve through
the `aws` dataset, since EKS nodes are EC2 instances
(`internal/pricing/pricing.go:71-85`). Re-pricing all history is therefore just a
re-aggregate:

```bash
go run ./cmd/pricing-refresh   # regenerate internal/pricing/data.json
go run ./cmd/aggregate/        # re-inject price_per_hour
```

View the dashboard by opening `website/index.html`. It loads
`data.generated.js` with a plain `<script src>`, so `file://` works — but Chart.js
comes from a CDN (`website/index.html:275-276`), so the charts need internet
access.

## Resume and interruption

Resume is filesystem-driven. There is no database: a unit of work is considered
done if and only if its result file exists.

- `pendingModesForInstance` skips an instance type entirely when every applicable
  mode already has `eks/<family>/results/<type>-<mode>.json`
  (`internal/orchestrator/orchestrator.go:906-927`), and `runModeLoop` re-checks
  per mode (`:662-667`). `l4-kernel` additionally honours a legacy
  no-suffix path, `<type>.json` (`:918-924`).
- To re-measure something, delete its result file. To re-measure everything for
  one type, delete `eks/<family>/results/<type>-*.json`.
- The run is cancelable: `SIGINT`/`SIGTERM` cancel the context
  (`cmd/tailbench/main.go:60-61`) and the loop checks `ctx.Err()` between
  instance types (`internal/orchestrator/orchestrator.go:400-402`).
- After a crash, the **cluster and node group survive**. A local backend sweeps
  stale Pulumi locks on the next start (`:134-146`); the next run's pre-cleanup
  `DestroyPair` (`:489-491`) and `stack.Cancel` (`internal/provider/eks.go:277`)
  clear an interrupted node-group operation.
- Caches that persist between runs: `.tailbench/tailnet.json` (the tailnet, only
  deleted by `--cleanup-networking`), `.tailbench/instances/eks-<family>.json`
  (bypassed by `--cleanup-networking`), and `.tailbench/pulumi/eks` for remote
  backends.

## Teardown

**The cluster is the expensive long-lived thing.** Node groups come and go with
each instance type, but `tailbench-eks-cluster` — the VPC, subnets, IAM roles,
and the EKS control plane — is created once and reused indefinitely. Nothing
destroys it automatically. If you walk away after a run, you keep paying for the
control plane.

```bash
./dist/tailbench-aws-k8s --cleanup-networking --filter 'match-nothing'
```

`--cleanup-networking` does four things at once
(`internal/orchestrator/orchestrator.go:219-231`, `:552-557`,
`:1035`, `internal/orchestrator/k8s_enabled.go:50`):

- destroys the `tailbench-eks-cluster` stack at the end of the run;
- deletes the tailnet and removes `.tailbench/tailnet.json`;
- bypasses the instance-type cache;
- forces a Tailscale operator reinstall rather than skipping when one is already
  running.

There is no teardown-only flag, so a cleanup invocation still walks the run loop.
A `--filter` that matches no instance type gives you teardown without
provisioning anything new.

Afterwards, confirm nothing is left:

```bash
aws eks list-clusters --region us-west-2
aws ec2 describe-vpcs --region us-west-2 \
  --filters Name=cidr,Values=10.0.0.0/16 --query 'Vpcs[].VpcId'
pulumi stack ls   # against whichever backend you configured
```

If the state backend was local and that checkout is gone, Pulumi can no longer
destroy the stack and the AWS resources must be removed by hand. This is the
argument for a remote backend.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Exits non-zero with no output at all | Pulumi's `logging` package `init()` calls `slog.SetDefault`, which redirects the standard logger to a discarding handler | `restoreStandardLogger()` must be the first statement in `main()` (`cmd/tailbench/main.go:36-49`). If you changed `main.go`, put it back. |
| Pulumi fails with `exit status 255` | Stale lock file from a crashed run | Local backends sweep `state/*/.pulumi/locks/*.json` at startup (`internal/orchestrator/orchestrator.go:134-146`). On a remote backend run `pulumi cancel` for the stack. |
| `requested provider "aws", but this binary was compiled for provider "eks"` | `--provider` or `providers:` does not match the build | Use `--provider eks`, or drop the flag and let the compiled default apply (`cmd/tailbench/main.go:73-75`). |
| `missing Tailscale credentials: … are empty` | No `.tailbench/tailnet.json` and no OAuth credentials | `cp .env.example .env` and fill it in (`internal/orchestrator/orchestrator.go:48-78`). |
| `operator proxy tailbench-eks-operator.<tailnet> not reachable after 10m0s`, then L7 modes fail | HTTPS is only enabled when tailbench **creates** the tailnet. A tailnet cached by an earlier VM run never got it (`internal/orchestrator/orchestrator.go:210-215`) | Delete `.tailbench/tailnet.json` and rerun so a fresh tailnet is created with HTTPS, or enable HTTPS for the tailnet in the Tailscale admin console. |
| Second run on a reused cluster loses the operator | Stale-device cleanup deletes the `tailbench-eks-operator` device every run (`:362-371`), but the install is skipped while its pod is still Running (`internal/k8s/operator.go:70-73`) | Force a reinstall with `--cleanup-networking` (`internal/orchestrator/k8s_enabled.go:50`) — note this also destroys the cluster and tailnet — or delete the operator Helm release before rerunning. |
| `skipping mode l4-lb: no endpoint configured` | The LoadBalancer/Ingress FQDN was not discovered: label mismatch against `l7_endpoints.cluster_label`, manifests not deployed, or the operator is not running | Check the labels in `manifests/l7-bench/*.yaml` against your `cluster_label`, and confirm the operator pods are Running in the `tailscale` namespace. |
| Modes listed in `config.yaml` never produce results, no error | VM-only modes on a K8s binary are silently dropped; `validateWorkloadConfig` is a no-op in `k8s` builds (`internal/orchestrator/k8s_enabled.go:21`, `internal/benchmark/modes.go:43-53`) | Replace `l7-serve-*` / `forward-pps-exit` / `relay-throughput` with the container-only modes. |
| `wait for nodes: expected 2 ready nodes, timed out after 10m0s` | The instance type is not offered in `aws.az`, or capacity is unavailable — node groups only use subnet 1 (`internal/provider/eks.go:249`, `:289`) | Change `aws.az`, or narrow `--filter` to types available there. |
| A whole family is skipped after one failure | `IsQuotaError` matched; for EKS it also matches `insufficient` and `Unschedulable` (`internal/provider/eks.go:392-402`) | Request a quota increase, or rerun that family later. A scheduling failure can trigger this too — check the preceding error. |
| `create EKS cluster` fails on an IAM error | The role running tailbench cannot create roles or attach the AWS-managed EKS policies | Grant role creation plus managed-policy attachment for the policies listed in [Credentials](#credentials). |
| `--dry-run` prints `error listing instances` | `aws` CLI missing, unauthenticated, or wrong region (`internal/provider/aws_instances.go:24-31`) | Run the verification block in [Prerequisites](#prerequisites). |
| `forward-pps-exit-k8s` cannot reach the sink | Known mismatch: the egress Service is annotated with the orchestrator's VM-style hostname `tb-eks-s-<type>-<suffix>` (`internal/orchestrator/k8s_enabled.go:210-215`), but the server pod's actual tailnet device is `tb-eks-server-<type>` (`internal/provider/eks.go:298`) | No configuration workaround. Treat these two modes as unverified on EKS until the hostname is sourced from `PairOutput.ServerName`. |
| New results are missing from the dashboard | Aggregation not rerun, or run from the wrong directory | `go run ./cmd/aggregate/` **from the repo root** (`cmd/aggregate/main.go`). |
| Dashboard renders tables but no charts | Chart.js loads from a CDN (`website/index.html:275`) | View it with internet access. |
