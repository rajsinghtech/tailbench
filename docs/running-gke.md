# Running tailbench on GKE

Operator runbook for the GCP managed-Kubernetes variant, in order:
prerequisites, credentials, configuration, a scoped first run, report
generation, and teardown. [running.md](running.md) covers what is common to all
six variants; everything below is specific to GKE.

## What this binary is

`tailbench-gcp-k8s` provisions a single long-lived **GKE cluster**, then for
each selected machine type adds a 2-node node pool, schedules a server and a
client bench pod onto it, benchmarks them, and deletes the pool. Benchmarks run
through `kubectl exec` into the pods — there is no SSH and there are no VMs you
log into.

| | |
|---|---|
| Binary | `dist/tailbench-gcp-k8s` |
| Build tags | `gcp,k8s` (`make build-gcp-k8s`) |
| Provider value | `gke` |
| Environment | `container` (Kubernetes), not `vm` |
| Result directory | `gke/<family>/results/<type>-<mode>.json` |
| Runtime CLIs | `pulumi`, `gcloud`, `kubectl`, `helm` |

The provider value, not the filename, is what determines result directories and
Pulumi stack names. `--provider` is optional; if given it must be `gke`, or
startup fails (`cmd/tailbench/main.go:72-77`, `cmd/tailbench/gcp_k8s.go:10`).

## Prerequisites

Four CLIs are shelled out to at run time, and all four must be on `PATH`:

| CLI | Used for | Called from |
|---|---|---|
| `pulumi` | All infrastructure (Automation API shells out to it) | `internal/provider/gke.go` |
| `gcloud` | Machine-type discovery, cluster credentials, node-pool cleanup | `gcp_instances.go:20`, `gke.go:124`, `gke.go:304-319` |
| `kubectl` | `apply -k` for the L7 bench and ProxyGroup manifests | `internal/k8s/util.go:51`, `internal/k8s/proxygroup.go:66` |
| `helm` | Installing the Tailscale operator chart | `internal/k8s/operator.go:207-227` |

`mise install` provisions all of them plus the Go toolchain at the pinned
versions (`mise.toml`). Helm is pinned to 3.x on purpose: the operator install
uses classic `helm repo add` + `helm upgrade --install`, which Helm 4 deprecates.

One more binary is needed that `mise.toml` does not pin: **`gke-gcloud-auth-plugin`**.
`gcloud container clusters get-credentials` writes a kubeconfig whose user block
is an `exec` credential plugin, and client-go honors `ExecProvider` natively
(`k8s.io/client-go/rest/transport.go` imports
`plugin/pkg/client/auth/exec`), so tailbench itself runs that helper as a
subprocess on every API call. Install it with
`gcloud components install gke-gcloud-auth-plugin`. (The helper's name is
gcloud's behavior, not something this repository sets; nothing in the codebase
references it, which is why it is a common first-run failure.)

Verify everything at once, from the repository root:

```bash
# CLIs present
for c in pulumi gcloud kubectl helm gke-gcloud-auth-plugin; do
  command -v "$c" >/dev/null && echo "ok   $c" || echo "MISSING $c"
done

# gcloud is authenticated and pointed at a project you can use
gcloud auth list --filter=status:ACTIVE --format='value(account)'
gcloud config get-value project

# Application Default Credentials exist (Pulumi's GCP provider uses these,
# and they are separate from `gcloud auth login`)
gcloud auth application-default print-access-token >/dev/null \
  && echo "ok   ADC" || echo "MISSING ADC — run: gcloud auth application-default login"

# The two APIs this variant calls
gcloud services list --enabled --project "$YOUR_PROJECT" \
  --filter='config.name:(compute.googleapis.com OR container.googleapis.com)' \
  --format='value(config.name)'

# Tailscale credentials are readable from .env
test -f .env && grep -c '^OAUTH_CLIENT_' .env
```

Only two GCP APIs are actually exercised: **Compute Engine**
(`compute.googleapis.com`) for the VPC, subnetwork, and `gcloud compute
machine-types list`, and **Kubernetes Engine** (`container.googleapis.com`) for
the cluster, node pools, and `get-credentials`. Nothing in `gke.go` touches any
other GCP service.

The identity behind ADC needs to create and delete VPC networks and
subnetworks, create and delete GKE clusters and node pools, fetch cluster
credentials, and list machine types. Node pools are created with the
`cloud-platform` OAuth scope (`gke.go:87-89`, `gke.go:171-173`), so the node
service account must be usable. Work out the exact role grants against your own
org policy — this document deliberately does not prescribe a binding list.

## Build

```bash
make build-gcp-k8s     # writes dist/tailbench-gcp-k8s
./dist/tailbench-gcp-k8s --version
```

A bare `go build ./cmd/tailbench/` fails by design; the `gcp,k8s` tag pair is
what selects `internal/provider/gke.go` and `cmd/tailbench/gcp_k8s.go`.
Compiling the Pulumi SDKs is memory-hungry — build one variant at a time.

## Credentials

Three independent systems. Each fails differently, and none of them substitutes
for another.

### 1. Tailscale OAuth (`.env`)

```bash
cp .env.example .env
$EDITOR .env      # OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET
```

`config.yaml` references the file through `env_file: .env` and expands
`${VAR}` placeholders under `tailscale:` (`internal/config/config.go:243-258`).
A missing `.env` is not fatal — expansion falls back to the process environment
— so `--dry-run` and `--version` work without it.

The client must be org-level and able to create tailnets, auth keys, the policy
file, and devices; tailbench creates and deletes real ephemeral tailnets, so use
disposable org credentials. Credentials are validated only when there is no
cached tailnet at `.tailbench/tailnet.json`
(`internal/orchestrator/orchestrator.go:48-78`, `:181-216`).

### 2. The gcloud CLI (and ADC)

GCP needs **two** logins that are easy to confuse:

- `gcloud auth login` — authenticates the `gcloud` command itself, used for
  machine-type discovery, `get-credentials`, and node-pool cleanup.
- `gcloud auth application-default login` — writes Application Default
  Credentials, which is what the Pulumi GCP provider picks up.
  `gke.go:107-108` sets only `gcp:project` and `gcp:zone` as stack config and
  supplies no credentials, so the provider falls back to its default credential
  chain.

Having one without the other produces a run that lists instance types
successfully and then fails inside the first Pulumi operation, or the reverse.

### 3. The Pulumi state backend

Local by default and needs nothing. Pulumi Cloud needs `PULUMI_ACCESS_TOKEN`
(an entry in `.env` is enough — the Pulumi CLI inherits tailbench's environment)
or a prior `pulumi login`; this is checked at startup, before any provisioning
(`internal/provider/backend.go:59-77`). Object-store backends authenticate
through the cloud credentials you already have.

## Configure config.yaml

Only these keys change behavior for this variant.

| Key | Default | What breaks if wrong |
|---|---|---|
| `gcp.project` | `tailscale-sandbox` (`config.go:306`) | **Read this row.** The default is an upstream author's project. Left alone, dry-run lists zero instance types and a real run fails inside `SetupNetworking`. |
| `gcp.zone` | `us-central1-a` (`config.go:307`) | Cluster location, node-pool location, and the `region` on every result (`gke.go:68`, `orchestrator.go:824-826`). Must be a **zone**, not a region — the region is derived by trimming the last `-x` segment. |
| `benchmark.modes` | `["l4-kernel"]` when empty (`config.go:342-344`) | Modes are filtered by environment; VM-only entries are silently skipped here. See the mode table below. |
| `l7_endpoints.cluster_label` | `app.kubernetes.io/part-of=tailbench-l7` (`config.go:297`) | Label selector used to find the Ingress, the LoadBalancer Service, and the baseline echo pod. Change it and every L7/LB mode reports "no endpoint configured". |
| `l7_endpoints.ingress_fqdn` | empty | Pins the `l7-ingress-*` target instead of discovering it from the cluster. |
| `l7_endpoints.serve_fqdn` | empty | Only consulted by `l7-serve-*`, which is VM-only. Irrelevant here. |
| `state_backend` | empty (local) | See the next section. Rejected at parse time if unusable (`config.go:175-194`). |
| `images.bench` / `images.tailscale` | `ghcr.io/rajsinghtech/tailbench-tools:latest`, `ghcr.io/tailscale/tailscale:latest` | The two containers in each bench pod (`internal/k8s/pods.go:54-83`). |

`aws.*` and `azure.*` keys are read into the config struct but are never used by
this binary.

### The default project is not yours

`gcp.project` defaults to `tailscale-sandbox`, which is not a project a fresh
operator has access to. The failure has two faces, depending on how far you get:

- **`--dry-run`**: `gcloud compute machine-types list --project=tailscale-sandbox`
  exits non-zero, so each family prints
  `[dry-run]   <family>: error listing instances: gcloud list machine-types: …`
  and the run ends with `0 instance types selected`
  (`gcp_instances.go:18-24`, `orchestrator.go:302-319`).
- **A real run**: the first Pulumi operation in `SetupNetworking` fails with a
  GCP permission or not-found error naming the project, before anything is
  created (`gke.go:61-113`).

Set it explicitly. There is no CLI flag for the project — `config.yaml` (or
`--config` pointing at your own copy) is the only way.

### Which modes this binary runs

`ModeAppliesTo` gates modes by environment, and this binary always runs with
`env == "container"` (`orchestrator.go:412-415`, `internal/benchmark/modes.go:43-53`).

| Mode | On GKE |
|---|---|
| `l4-kernel` | Runs. iperf3 + MTR, pod-to-pod baseline vs. tailnet. |
| `l4-userspace` | Runs (no environment gate). |
| `tsnet-userspace` | Accepted, then skipped — the tsnet runner is not implemented (`orchestrator.go:800-802`). |
| `l4-lb` | Runs. Kubernetes-only. |
| `l7-ingress-h1`, `l7-ingress-h2` | Run. Kubernetes-only. |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | Run. Kubernetes-only. |
| `l7-serve-h1`, `l7-serve-h2` | **Skipped** — VM-only. |
| `forward-pps-exit`, `relay-throughput` | **Skipped** — VM-only. |

"Skipped" means silently filtered out, not rejected: an unapplicable mode is
dropped by `pendingModesForInstance` and again by `runModeLoop`
(`orchestrator.go:657-661`, `:906-927`). Only an *unrecognized* mode name is a
startup error (`orchestrator.go:84-92`).

This matters because the committed `config.yaml` ships
`modes: [l4-kernel, l7-serve-h1, l7-serve-h2]` — two of those three are VM-only.
Run this binary against the stock file and you measure `l4-kernel` and nothing
else. For a Kubernetes-shaped run, set something like:

```yaml
benchmark:
  modes:
    - l4-kernel
    - l4-lb
    - l7-ingress-h1
    - l7-ingress-h2
```

The `forward-pps-exit-k8s` / `-opton` pair is an A/B: identical sweeps through
the operator's egress ProxyGroup with
`TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS` absent and set to `"true"`
(`manifests/proxygroup/base` vs. `manifests/proxygroup/overlays/on`). Each arm
writes its own result file so they resume independently. Topology, sweep
methodology, the `limiting_resource` honesty rule, and the reproducibility
caveats are in
[cost-forward-pps-plan.md](cost-forward-pps-plan.md) — not repeated here.

## Choose a state backend

| Value | Where state lives | Consequence |
|---|---|---|
| *(empty, default)* | `state/gke/` in this checkout | Stacks are invisible from any other machine or clone. An interrupted run can only be resumed or destroyed from here. Stale Pulumi locks are swept at startup. |
| `pulumi.com` | Pulumi Cloud (`https://api.pulumi.com`) | Stacks survive a machine swap. Needs `PULUMI_ACCESS_TOKEN` or `pulumi login`, checked at startup. No lock sweep — the service manages leases. |
| `s3://…`, `gs://…`, `azblob://…` | Object storage | Same durability benefit; authenticates through your existing cloud credentials. |
| `file://…` | An explicit local or mounted path | Local semantics, chosen directory. |

For local state the orchestrator creates `state/gke` and deletes any
`state/*/.pulumi/locks/*.json` left by a crashed run — those locks are what
otherwise makes every subsequent Pulumi operation fail with `exit status 255`.
Remote backends skip both steps (`orchestrator.go:120-148`).

Because a GKE cluster is expensive and long-lived, a remote backend is worth
more here than for the VM variants: losing local state means the cluster keeps
billing with no supported way to tear it down.

```bash
./dist/tailbench-gcp-k8s --state-backend pulumi.com --family c3
```

Stack names are already provider-qualified (`tailbench-gke-cluster`,
`tailbench-gke-<safe-type>`), so one backend can hold every provider's stacks.

## Dry run

```bash
./dist/tailbench-gcp-k8s --dry-run
./dist/tailbench-gcp-k8s --dry-run --family c3 --filter '^c3-standard-(4|8)$'
```

Dry-run prints the provider, the configured modes, and every machine type that
`--family`/`--filter` select, then exits without creating anything. It does
**not** create the cluster, the tailnet, or any Pulumi stack.

It does still shell out to `gcloud compute machine-types list`
(`orchestrator.go:302`), so it needs an authenticated gcloud and a real
`gcp.project` — which makes it the cheapest test of GCP auth you have.

Two things dry-run does not tell you: it prints `modes:` verbatim from config
without applying the container/VM filter, so VM-only entries appear in the list
even though the real run will skip them; and it queries `gcloud` directly rather
than the instance cache, so its selection can differ from a run that is reusing
`.tailbench/instances/gke-<family>.json`.

The full flag set is small — there is no `--modes` flag:

```text
-cleanup-networking  -config  -dry-run  -family  -filter  -provider  -state-backend
```

`--version` works but is handled before flag parsing (`cmd/tailbench/main.go:44-49`).

## Run

Scope the first run hard. A GKE run is materially more expensive than a VM run,
for two reasons that stack:

- The **cluster** is long-lived. It keeps a `default-pool` of one `e2-small`
  node (`gke.go:83-90`) and bills a GKE cluster management fee on top of node
  cost, continuously, whether or not a benchmark is running. It is not deleted
  at the end of a run — only `--cleanup-networking` removes it.
- Each instance type gets a **2-node** pool of that machine type
  (`gke.go:164-178`), created and destroyed per type. `--family all` means all
  seven GCP families (`c4`, `c4a`, `c3d`, `n4`, `c3`, `n2`, `c2`), each with
  every `<family>-standard-N` size — dozens of pool create/destroy cycles, each
  of which also waits up to 10 minutes for nodes to become Ready
  (`gke.go:210`).

So start with one type:

```bash
./dist/tailbench-gcp-k8s --family c3 --filter '^c3-standard-4$'
```

then widen:

```bash
./dist/tailbench-gcp-k8s --family c3
./dist/tailbench-gcp-k8s                 # every family — know what this costs
```

`--filter` is a Go regex matched against the machine-type name; `--family` must
name one of the seven families or the run is rejected with the valid list rather
than silently selecting nothing (`orchestrator.go:327-339`).

Note that `gke/` in this repository already contains results for `c2`, `c3`,
`c3d`, `c4`, `n2`, and `n4` across `l4-kernel`, `l4-lb`, and `l7-ingress-*`.
Because resume is filesystem-driven, a broad rerun with those modes will skip
almost everything and cost nothing. If you want fresh numbers, delete the
result files you intend to re-measure.

## What happens during a run

Ordered, with the GKE-specific steps called out. Steps 2, 4, 5, and 7 do not
exist in the VM variants.

1. **Tailnet.** Reuses `.tailbench/tailnet.json` if present, otherwise creates a
   fresh ephemeral tailnet and saves it. The ACL is refreshed on every run and,
   because this is a K8s provider, includes `tag:k8s` ownership, a `0.0.0.0/0`
   route auto-approver, and the `tailscale.com/cap/kubernetes` grant that lets
   the operator's API-server proxy impersonate `system:masters`
   (`orchestrator.go:161-216`, `internal/tailnet/tailnet.go:160-220`).
   **Only on first creation** is HTTPS enabled on the tailnet
   (`orchestrator.go:210-215`) — see the trap in Troubleshooting.
   An auth key is issued and an ephemeral `tailbench-orchestrator` tsnet node
   joins the tailnet.
2. **Cluster (`SetupNetworking`).** One Pulumi stack, `tailbench-gke-cluster`,
   creates a custom-mode VPC, a `10.0.0.0/20` subnetwork in the zone's region,
   and a zonal GKE cluster with `initial_node_count: 1`, `e2-small` nodes, and
   deletion protection off (`gke.go:56-101`). This stack is reused across runs
   and is a no-op on subsequent runs.
3. **Kubeconfig.** `gcloud container clusters get-credentials <cluster> --zone
   <zone> --project <project> --quiet` writes to a temp `KUBECONFIG`, which is
   read, base64-encoded, and held in memory for the rest of the run
   (`gke.go:118-139`). The `tailbench` namespace is created
   (`gke.go:141-147`, `internal/k8s/pods.go:19`).
4. **Tailscale operator.** `helm repo add`/`update`, then `helm upgrade
   --install tailscale-operator` into the `tailscale` namespace with
   `apiServerProxyConfig.mode=true`, `allowImpersonation=true`, hostname
   `tailbench-gke-operator`, and the OAuth client
   (`gke.go:368-384`, `internal/k8s/operator.go:194-235`). A `tailbench-admin`
   ClusterRoleBinding maps the orchestrator's tag to `cluster-admin`
   (`operator.go:169-192`). A previous install is torn down first: the Helm
   release, `ts-*` StatefulSets and Services, every Secret in the namespace,
   service accounts, and the operator's cluster roles/bindings
   (`operator.go:99-165`). `--cleanup-networking` forces this reinstall path
   (`k8s_enabled.go:50`). Failure here is a **warning**, not an error — the run
   continues and L7 modes fail later.
   Note that GKE does *not* wait for the API-server proxy: it uses the direct
   kubeconfig for exec and only records the FQDN (`gke.go:379-382`).
5. **Manifests.** If any forwarding-pps mode is configured, `kubectl apply -k
   manifests/proxygroup/base` creates the `tailbench-egress` ProxyGroup
   (`replicas: 1`) and the `common` / `common-accept-routes` ProxyClasses. If
   any Fortio mode is configured, `kubectl apply -k manifests/l7-bench` creates
   the `bench-echo` Fortio Deployment, a `bench-baseline` tools pod, a ClusterIP
   Service, an `ingressClassName: tailscale` Ingress, and a
   `loadBalancerClass: tailscale` Service — the last two are provisioned by the
   Tailscale operator, not by GCP. The run then polls up to 3 minutes for the LB
   FQDN (`k8s_enabled.go:41-97`).
6. **Instance discovery.** `gcloud compute machine-types list` per family,
   filtered to `^<family>-standard-[0-9]+$` in the configured zone, cached at
   `.tailbench/instances/gke-<family>.json`. The cache is bypassed by
   `--cleanup-networking` (`orchestrator.go:1023-1043`).
7. **Per machine type**, in ascending vCPU order:
   - Skip entirely if every applicable mode already has a result file.
   - `DestroyPair` as a pre-cleanup, then `CreatePair`: a Pulumi stack
     `tailbench-gke-<safe-type>` adds a `bench-pool` node pool with
     `node_count: 2` labeled `tailbench-pool=<safe-type>`; wait up to 10 minutes
     for 2 Ready nodes; write the `tailbench-auth` Secret; deploy
     `tb-gke-server-<safe-type>` and `tb-gke-client-<safe-type>` pods pinned to
     that pool with pod anti-affinity so they land on different nodes
     (`gke.go:157-274`). Each pod is a privileged `sysctler` init container plus
     a `bench` container and a `tailscale` sidecar sharing one network namespace
     (`internal/k8s/pods.go:34-87`).
   - A quota error here marks the **whole family** skipped for the rest of the
     run. On GKE, `IsQuotaError` also matches `insufficient` and `Unschedulable`
     (`gke.go:348-358`), so an unschedulable node pool is treated as quota.
   - Because `PairOutput.Namespace` is non-empty, benchmarking routes to
     `runK8sBenchmark` (`orchestrator.go:562-563`), which builds four
     `kubectl exec` executors — bench and tailscale containers on each pod — via
     SPDY (`k8s_enabled.go:139-175`, `internal/k8s/kubeexec.go:74-134`). No SSH
     is involved anywhere in this variant.
   - Each pending mode runs and writes
     `gke/<family>/results/<type>-<mode>.json`.
   - `DestroyPair`: delete both pods, destroy the node-pool stack, then a
     `gcloud container node-pools delete --async` fallback for anything the
     stack missed (`gke.go:276-321`).
8. **Aggregate.** A completed pass calls `result.Aggregate` automatically
   (`orchestrator.go:548`).
9. **Teardown of the cluster happens only with `--cleanup-networking`**
   (`orchestrator.go:552-557`).

### How L7 endpoints are resolved

`resolveEndpoints` (`orchestrator.go:843-881`) decides what each Fortio mode
points at:

- `l7-ingress-*` — `l7_endpoints.ingress_fqdn` if set, otherwise the first
  Ingress in the `tailbench` namespace matching `cluster_label` that has a
  LoadBalancer hostname or IP. Target is `https://<fqdn>`.
- `l4-lb` — the first `type: LoadBalancer` Service matching `cluster_label` with
  a LoadBalancer hostname or IP. Target is `http://<fqdn>:8080`.
- Baselines for both are the **echo pod's IP**, `http://<pod-ip>:8080`, not a
  cluster-local Service name. This is deliberate: the Tailscale sidecar sets
  `TS_ACCEPT_DNS=true` and hijacks DNS inside the bench pods, so
  `bench-echo.tailbench.svc` does not resolve from where the load generator runs
  (`orchestrator.go:854-855`, `:878`; `internal/k8s/pods.go:80`).

Each target is warmed up with `curl` (20 attempts, `-k` for HTTPS) before
measurement; a target that never answers causes the mode to be skipped rather
than recorded (`orchestrator.go:883-903`).

## Generate the report

A successful run aggregates on its own. To rebuild the dashboard from result
files already on disk, without touching GCP:

```bash
go run ./cmd/pricing-refresh   # optional: refresh internal/pricing/data.json
go run ./cmd/aggregate/        # writes website/data.generated.js
```

Both must run **from the repository root** — `cmd/aggregate` resolves its input
directory with `os.Getwd()`. Aggregation walks `gcp`, `aws`, `azure`, `gke`,
`eks`, and `aks`, so one command re-emits the whole dashboard
(`internal/result/aggregator.go:15-21`).

Prices are injected at aggregation time, never stored in result JSON, so
re-pricing all history is just a re-aggregate. `gke` results are priced from the
`gcp` table — GKE runs GCP machine types — and the zone collapses to its region
for lookup (`internal/pricing/pricing.go:74-98`). Node-pool node cost is what is
priced; the cluster management fee and the `default-pool` node are not modeled.

Then open `website/index.html`. It loads `data.generated.js` through a plain
`<script src>` tag, so `file://` works; Chart.js comes from a CDN, so rendering
needs internet access (`website/index.html:275-276`).

## Resume and interruption

There is no database. A unit of work is skipped if and only if its result file
exists, so `Ctrl-C` is safe and rerunning the same command continues where it
stopped (`orchestrator.go:657-667`, `:906-927`). SIGINT and SIGTERM cancel the
context; the in-flight node pool is destroyed on the way out.

What survives an interruption, deliberately:

| Artifact | Where | Removed by |
|---|---|---|
| GKE cluster + VPC | Pulumi stack `tailbench-gke-cluster` | `--cleanup-networking` |
| Tailnet | `.tailbench/tailnet.json` | `--cleanup-networking` |
| Instance-type cache | `.tailbench/instances/gke-<family>.json` | `--cleanup-networking` (bypassed, then rewritten) |
| Results | `gke/<family>/results/` | Deleting the files |

`l4-kernel` additionally honors a legacy no-suffix path, `<type>.json`, so
results written before modes were suffixed still count as done.

To force one measurement to rerun, delete just that file:

```bash
rm gke/c3/results/c3-standard-4-l4-lb.json
./dist/tailbench-gcp-k8s --family c3 --filter '^c3-standard-4$'
```

A crashed run can leave a Pulumi lock behind. With local state it is swept
automatically at the next start; with a remote backend it is not, and
`pulumi cancel` on the affected stack is the fix.

## Teardown

**The cluster is the expensive thing.** Node pools come and go with each
instance type, but `tailbench-gke-cluster` — control plane, VPC, subnetwork, and
a permanently running `e2-small` `default-pool` node — persists after every
normal run and bills continuously. Nothing deletes it implicitly.

```bash
./dist/tailbench-gcp-k8s --cleanup-networking --family c3 --filter '^c3-standard-4$'
```

That single flag does four separate things
(`orchestrator.go:219-231`, `:552-557`, `:1035`; `k8s_enabled.go:50`):

1. Forces a full Tailscale operator reinstall at the start of the run.
2. Bypasses the instance-type cache.
3. Destroys the cluster stack — cluster, subnetwork, VPC — after the run.
4. Deletes the ephemeral tailnet and removes `.tailbench/tailnet.json`.

Because teardown happens *after* the benchmark loop, scope the run narrowly when
all you want is cleanup.

Then confirm nothing is left, especially after a crashed run where Pulumi state
may be incomplete:

```bash
gcloud container clusters list --project "$YOUR_PROJECT"
gcloud container node-pools list --cluster <cluster> --zone <zone> --project "$YOUR_PROJECT"
gcloud compute networks list --project "$YOUR_PROJECT" --filter='name~tailbench'
```

Node pools have a `gcloud`-based fallback delete keyed on the
`tailbench-pool=<safe-type>` label, but it is skipped entirely when
`p.clusterName` is empty — which is the case in any process that did not itself
run `SetupNetworking` (`gke.go:300-302`). Check by hand after a crash.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `[dry-run] c4: error listing instances: gcloud list machine-types: …`, then `0 instance types selected` | `gcp.project` is still `tailscale-sandbox`, or gcloud is unauthenticated | Set `gcp.project` in `config.yaml`; `gcloud auth login` |
| Real run fails in `SetupNetworking` with a GCP permission/not-found error | Same wrong project, or ADC missing/insufficient | `gcloud auth application-default login`; enable `compute.googleapis.com` and `container.googleapis.com` |
| `get-credentials: … : exit status 1` right after the cluster is created | gcloud cannot fetch credentials for that cluster (wrong project, missing `container.clusters.get`) | Run the same `gcloud container clusters get-credentials` by hand to see the real message |
| `exec: "gke-gcloud-auth-plugin": executable file not found in $PATH`, or every Kubernetes call fails with an auth error | The kubeconfig gcloud wrote uses an exec credential plugin that is not installed | `gcloud components install gke-gcloud-auth-plugin` |
| Process exits 1 with no output whatsoever | Pulumi's `logging` package `init()` calls `slog.SetDefault`, which redirects the stdlib logger to a discarding handler | `main.restoreStandardLogger()` must run first in `main()` (`cmd/tailbench/main.go:36-49`). Seeing this means that call was moved or removed |
| Any Pulumi operation fails with `exit status 255` | Stale lock file from a crashed run | Local state: swept automatically at startup (`orchestrator.go:134-146`). Remote: `pulumi cancel` the stack |
| `state_backend is Pulumi Cloud … but no credentials were found` at startup | `pulumi.com` selected without a token | Put `PULUMI_ACCESS_TOKEN` in `.env`, or `pulumi login` |
| Only `l4-kernel` ever runs | Stock `config.yaml` modes are `l4-kernel`, `l7-serve-h1`, `l7-serve-h2` — the last two are VM-only and silently filtered | Set container modes: `l4-lb`, `l7-ingress-h1`, `l7-ingress-h2` |
| `unknown benchmark mode "…"` at startup | Typo in `benchmark.modes` | Use a name from the printed list; validation is name-only and happens before provisioning (`orchestrator.go:84-92`) |
| `skip <type> (all mode results exist)` for everything | Filesystem resume — `gke/` already has results for those modes | Delete the specific result files you want re-measured |
| `operator install: … (L7 modes may not work)` | Helm failed; install errors are warnings, not fatal | Check `helm` is on `PATH` and 3.x; rerun with `--cleanup-networking` to force a clean reinstall |
| `skipping mode l4-lb: no endpoint configured` | No matching LoadBalancer Service found | Confirm the operator is running, that `manifests/l7-bench` applied, and that `l7_endpoints.cluster_label` still matches the manifests' `app.kubernetes.io/part-of: tailbench-l7` |
| `endpoint warm-up failed` on `l7-ingress-h2` | The tailnet has no HTTPS certs, so the operator cannot serve TLS | HTTPS is enabled **only when the tailnet is first created** (`orchestrator.go:210-215`). A `.tailbench/tailnet.json` left behind by a VM run is reused without it. Delete that file (or run `--cleanup-networking`) and let the K8s binary create the tailnet |
| `wait for nodes: expected 2 ready nodes, timed out` | No capacity or quota for that machine type in the zone | Treated as a quota error, so the whole family is skipped for the rest of the run; try a different zone or family |
| `quota exceeded for <type>, skipping family <family>` | `IsQuotaError` matched | Expected behavior — larger sizes in the family are assumed to also fail. Request quota or narrow `--family` |
| `ProxyGroup <name> statefulset not ready after 5m` | Operator too old for the ProxyGroup CRD, or the ProxyClass re-roll is stuck | `kubectl -n tailscale get proxygroup,statefulset` and check the operator log; the chart is unpinned and floats on latest |
| `forward-pps-exit-k8s` never reaches the sink | Known mismatch: the egress Service is annotated with the orchestrator-generated hostname `tb-gke-s-<type>-<suffix>` (`orchestrator.go:425`, `k8s_enabled.go:214-215`), but the server pod actually joins the tailnet as `tb-gke-server-<type>` (`gke.go:219`, `internal/k8s/pods.go:78`) | No workaround from configuration; the two names must be reconciled in code |
| Panic with a slice-bounds error at startup of `SetupNetworking` | `gcp.zone` has no `-` — a region was written where a zone is required | Use e.g. `us-central1-a`, not `us-central1` (`gke.go:68`) |

Related reading: [running.md](running.md) for shared behavior,
[cost-forward-pps-plan.md](cost-forward-pps-plan.md) for the forwarding-pps
design, and [`../README.md`](../README.md) for the full flag and configuration
reference.
