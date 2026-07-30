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
other provider (`cmd/tailbench/main.go:1740-1745`), `validateCompiledProvider`
rejects a mismatched `--provider` or `providers:`
(`cmd/tailbench/main.go:1555-1573`), and `plan.Build` rejects it again before any
plan is produced (`internal/plan/build.go:34-42`). Renaming the executable does
not change its identity: the provider name is a build-tag constant, and even the
binary name printed in remediation text is derived from it
(`cmd/tailbench/main.go:1721-1738`).

| Property | Value |
|---|---|
| Binary | `./dist/tailbench-aws-k8s` |
| Build tags | `aws,k8s` (`Makefile:87-89`) |
| Make target | `make build-aws-k8s` |
| Provider value | `eks` (`cmd/tailbench/aws_k8s.go:10`) |
| Workload | `kubernetes` (`cmd/tailbench/main.go:1712-1719`) |
| Environment | `container` — benchmarks run in pods, not on VMs (`internal/orchestrator/orchestrator.go:620-623`) |
| Result dir | `eks/<family>/results/<type>-<mode>.json` (`internal/result/writer.go:57-70`) |
| Run state | `.tailbench/runs/<run-id>/` (`internal/runstate/store.go:25-31`) |

Two consequences of `environment: container` shape everything below:

- Benchmarks execute through the Kubernetes API (`kubectl exec` semantics via
  client-go SPDY), never over SSH. The orchestrator routes to the K8s path when
  `PairOutput.Namespace != ""` (`internal/orchestrator/orchestrator.go:1007-1008`),
  and builds four executors — bench and tailscale containers on each of the two
  pods — in `internal/orchestrator/k8s_enabled.go:183-198` using
  `k8s.NewKubeExecExecutor` (`internal/k8s/kubeexec.go:37`).
- The set of valid benchmark modes is different, and a mode list with no
  container mode is now rejected. See
  [Configure config.yaml](#configure-configyaml).

### Command surface and exit codes

The CLI is command-based. A bare invocation is `run`, and every other command is
named explicitly (`cmd/tailbench/main.go:149-159`,
`internal/app/app.go:253-303`).

| Command | What it does | Touches the cloud? |
|---|---|---|
| `init` | Writes a safe `config.yaml` and `.env.example`; refuses to overwrite either (`cmd/tailbench/main.go:163-256`) | no |
| `run` (default) | Plans, checks guardrails, confirms, then provisions and benchmarks (`cmd/tailbench/main.go:897-1044`) | yes |
| `plan` | Builds a side-effect-free local plan (`cmd/tailbench/main.go:1432-1448`) | no |
| `doctor` | Local prerequisite checks; `--remote` adds read-only auth checks (`cmd/tailbench/main.go:1450-1534`) | only with `--remote` |
| `status RUN_ID` | Reads a persisted manifest (`cmd/tailbench/main.go:1329-1377`) | no |
| `results RUN_ID` | Reads persisted result metadata and paths (same executor) | no |
| `resume RUN_ID` | Continues only the unfinished work of a run (`cmd/tailbench/main.go:313-438`) | yes |
| `cleanup RUN_ID` | Destroys the resources that run owns (`cmd/tailbench/main.go:440-640`) | yes |

Output flags are parsed before anything else and are valid on every command
(`internal/app/app.go:199-251`): `--output text|json`, `--log-file PATH`,
`--quiet`, plus `--help`/`--version`, which never load configuration
(`internal/app/app.go:43-50`). The final report goes to stdout; progress and
diagnostics go to stderr, and `--quiet` suppresses progress but not safety
prompts or fatal diagnostics (`internal/app/app.go:82-107`, `:316-354`). Both the
`--log-file` sink and stderr are passed through a credential redactor
(`internal/app/redact.go:11-37`).

Exit codes (`internal/app/types.go:5-13`):

| Code | Name | Meaning |
|---|---|---|
| 0 | `ExitOK` | success |
| 1 | `ExitRunFailed` | the requested work failed |
| 2 | `ExitUsage` | bad flags, bad config, or an unplannable selection |
| 3 | `ExitPrerequisite` | a missing tool, credential, or env file |
| 4 | `ExitRefused` | a guardrail violation or a declined confirmation |
| 5 | `ExitRecovery` | a run ID could not be loaded or repaired |
| 130 | `ExitInterrupted` | SIGINT/SIGTERM |

Failures print a fixed four-part diagnostic — code, stage, cause, whether
resources changed, and what to do next — with the run ID and log path appended
when they exist (`internal/app/render.go:141-170`):

```text
[TB_RECOVERY] stage: status
cause: run not found: tb_2026-01-01_abcdef
resources changed: no
next: verify the run ID and inspect .tailbench/runs for a versioned manifest
run ID: tb_2026-01-01_abcdef
```

## Prerequisites

`mise.toml` pins the whole toolchain; `mise install` provisions it. The EKS
variant needs more runtime CLIs than the VM variants: `pulumi` plus `kubectl`
(for `kubectl apply -k`) and `helm` (for the Tailscale operator chart).

| Tool | Needed for | Verified in code |
|---|---|---|
| Go (version in `go.mod`) | building only | — |
| `pulumi` | Automation API drives every stack | `internal/provider/eks.go:217-228` |
| `aws` | instance discovery **and** kubeconfig generation | `internal/provider/aws_instances.go:20-31`, `internal/provider/eks.go:238-245` |
| `kubectl` | `apply -k` of the L7 and ProxyGroup manifests | `internal/k8s/util.go:51`, `internal/k8s/proxygroup.go:66` |
| `helm` (3.x) | installs the Tailscale operator chart | `internal/k8s/operator.go:206-226` |

Helm is pinned to 3.x on purpose: the operator install uses classic
`helm repo add` + `helm upgrade --install`, which Helm 4 deprecates in favour of
OCI registries (`mise.toml`).

Do not hand-roll a verification block — `doctor` is the supported check, and its
local mode reads nothing but `PATH`:

```bash
./dist/tailbench-aws-k8s doctor
```

```text
TAILBENCH DOCTOR — LOCAL CHECKS ONLY
provider: eks
workload: kubernetes
ready: true
[PASSED] pulumi (local): /home/you/.pulumi/bin/pulumi
[PASSED] aws (local): /usr/bin/aws
[PASSED] kubectl (local): /usr/local/bin/kubectl
[PASSED] helm (local): /usr/local/bin/helm
[SKIPPED] credentials (local): credential values are not read during local checks
```

The four tools it looks for are exactly the four in the table above
(`internal/preflight/preflight.go:216-235`); credentials are deliberately
skipped, not read (`:103-113`). A failed check prints its own `next:` line
(`:207-211`), and the command exits 3.

`doctor --remote` adds two read-only authentication probes — `pulumi whoami`
and `aws sts get-caller-identity --output json`
(`internal/preflight/remote.go:44-79`, `:98-106`). Nothing is created, and
command output is discarded apart from the AWS account ID, which is parsed for
the run manifest and never printed (`internal/preflight/remote.go:22-27`,
`:123-136`). Unlike local mode, `--remote` loads secrets first and fails with
`TB_PREREQUISITE` if `OAUTH_CLIENT_ID` or `OAUTH_CLIENT_SECRET` is empty
(`cmd/tailbench/main.go:1491-1501`).

```bash
./dist/tailbench-aws-k8s doctor --remote
./dist/tailbench-aws-k8s --output json doctor      # machine-readable report
```

Five things `doctor` does **not** cover, and you should still check by hand:

- **The tailnet decision.** Neither `tailscale.create_tailnet` nor
  `tailscale.tailnet_dns_name` is inspected, and the Tailscale API is never
  called — not even by `--remote`, which only checks the values are non-empty.
  Whether your OAuth client may *create* a tailnet is discovered at run time as
  an HTTP 403. See [Credentials](#credentials).
- **Helm's major version.** It only asserts that `helm` is on `PATH`; the
  operator install needs 3.x.
- **The region in `config.yaml`.** `aws sts get-caller-identity` succeeds
  regardless of whether `aws.region` is usable or the instance type is offered
  in `aws.az`.
- **Durable AWS authentication.** The kubeconfig produced during a run embeds an
  exec credential plugin that invokes `aws`, so the CLI must stay on `PATH` and
  stay authenticated for the run's whole duration — see
  [Credentials](#credentials).
- **EKS service quotas.** Nothing is queried; a quota denial surfaces during
  `CreatePair` (see [Run](#run)).

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

**Which commands load secrets at all.** `plan`, local `doctor`, and the
command-routing pass use `config.ParseLocalArgs`, which never opens `env_file`,
never expands the OAuth placeholders, and never reads SSH keys from your home
directory (`internal/config/config.go:256-266`, `:304-315`, `:329-334`,
`:464-485`). Only `run`, `resume`, `cleanup`, and `doctor --remote` go through
`config.ParseArgs` and resolve secrets (`:249-254`). A missing `env_file` is a
hard `TB_PREREQUISITE` on those paths (`cmd/tailbench/main.go:1413-1430`), and an
empty `OAUTH_CLIENT_ID`/`OAUTH_CLIENT_SECRET` is another
(`cmd/tailbench/main.go:1701-1710`, `:935-943`).

**Tailscale OAuth** — supplied through `.env`, which `config.yaml` references via
`env_file:` and expands into the `${VAR}` placeholders under `tailscale:`
(`internal/config/config.go:306-315`, `:322-334`).

```bash
./dist/tailbench-aws-k8s init   # writes config.yaml and .env.example
cp .env.example .env
$EDITOR .env                    # OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET
```

*Decide first: create a tailnet, or join one.* This is the setup decision to get
right before anything else — an EKS run that gets it wrong has already paid for a
cluster.

**Option A — create an ephemeral tailnet (`create_tailnet: true`).** Tailbench
POSTs to `/api/v2/organizations/-/tailnets`
(`internal/tailnet/tailnet.go:63-104`); the response carries a *per-tailnet*
OAuth client that the orchestrator swaps into the config
(`internal/orchestrator/orchestrator.go:389-390`). The credentials you configure
are therefore used **only** for tailnet create and delete — the ACL, auth keys,
device cleanup, tailnet settings, and the OAuth secret handed to the Tailscale
operator all come from the returned client
(`internal/provider/eks.go:461-469`).

That create call needs an org-level permission that is **not one of the published
OAuth scopes**. A client with scope `all` that is scoped to a single tailnet is
not enough — it fails with:

```text
create tailnet: tailnet creation failed (HTTP 403): {"message":"actor does not have permission to create tailnets"}
```

**Option B — join the tailnet the OAuth client already belongs to
(`create_tailnet: false` plus `tailscale.tailnet_dns_name`).** Tailbench then
creates and deletes no tailnet. It sets the ACL, mints the auth key, starts tsnet,
and installs the operator against the tailnet you named
(`internal/orchestrator/orchestrator.go:239-261`, `:434-453`;
`internal/config/config.go:21-22`, `:93-94`, `:410-411`):

```yaml
tailscale:
  create_tailnet: false
  tailnet_dns_name: example-name.ts.net
  oauth_client_id: ${OAUTH_CLIENT_ID}
  oauth_client_secret: ${OAUTH_CLIENT_SECRET}
  tag: tag:bench
```

Before `tailnet_dns_name` existed, `create_tailnet: false` was not a working
configuration — no auth key was minted and every pod failed with
`auth key is empty`.

> **`tailnet_dns_name` REPLACES the tailnet's policy file.** `SetupACL` calls
> `PolicyFile().Set(...)` with a freshly built allow-all benchmark policy
> (`internal/tailnet/tailnet.go:150-152`, `buildACL` at `:160-228`). Nothing is
> merged; whatever the tailnet's policy file contained is gone. For the K8s
> variants that policy is unusually broad — it adds `tag:k8s`, a `0.0.0.0/0`
> route auto-approver, and a `tailscale.com/cap/kubernetes` grant that lets the
> orchestrator impersonate `system:masters` through the operator's API-server
> proxy (`internal/tailnet/tailnet.go:201-226`). Point this only at a tailnet
> dedicated to benchmarking. Tailscale keeps policy-file version history, so a
> mistake is recoverable from the admin console.

**Setting neither is a startup error** — `orchestrator.New` refuses with
`no tailnet configured: …` (`internal/orchestrator/orchestrator.go:174-179`),
checked there rather than at parse time so `plan` and `doctor` keep working.

Two smaller differences on the join path: stale-device cleanup is skipped (the
`tb-eks-` / `tailbench-eks-operator` sweep is inside the `create_tailnet` branch,
`internal/orchestrator/orchestrator.go:609-623`), and no cleanup policy will ever
delete a tailnet tailbench merely joined (`:263-310`).

Either way the client must be able to write auth keys, the policy file, and
devices. Under Option A tailbench creates and deletes real tailnets, so use
disposable org credentials.

**AWS** — the Pulumi program sets only `aws:region`
(`internal/provider/eks.go:221-223`, `:316-318`), so the AWS provider and the
`aws` CLI both resolve credentials from the ambient environment (profile, env
vars, instance role) in the usual way. Two things must hold for the whole run,
not just at startup:

- The credentials must stay valid, because `aws ec2 describe-instance-types` and
  `aws eks update-kubeconfig` are invoked at run time.
- The kubeconfig that `aws eks update-kubeconfig` produces is consumed verbatim
  by client-go (`internal/provider/eks.go:247-257`,
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
(`internal/provider/eks.go:164-207`, `:288-304`). Role creation and
managed-policy attachment are the permissions most often missing from a
developer role. No precise policy document is given here — grant what your
organization's guardrails allow for these actions.

*Pulumi ESC.* The Makefile has credential-wrapping targets that take AWS
credentials from a [Pulumi ESC](https://www.pulumi.com/docs/esc/) environment via
`esc run`, while Tailscale OAuth still comes from `.env` through `env_file:`:
`plan-aws`, `doctor-aws`, `doctor-aws-remote`, and `bench-aws`, with
`ESC_ENV`/`FILTER`/`MAX_COST`/`MAX_DURATION`/`MAX_TYPES`/`YES` overrides
(`Makefile:26`, `:30-34`, `:118-137`). **They all invoke `./dist/tailbench-aws` —
the VM binary — so none of them runs this variant.** The pattern generalizes
without any tailbench support; there is simply no `bench-aws-k8s` target:

```bash
esc run <your-esc-env> -- ./dist/tailbench-aws-k8s doctor --remote
```

**Pulumi state backend** — only needed when `state_backend` selects Pulumi Cloud.
`provider.CheckBackendCredentials` fails at startup if neither
`PULUMI_ACCESS_TOKEN` nor `~/.pulumi/credentials.json` is present
(`internal/provider/backend.go:59-75`), and it is called from
`orchestrator.New` before any provider is constructed
(`internal/orchestrator/orchestrator.go:163-165`). The token can live in `.env`;
the Pulumi CLI inherits tailbench's environment, so no separate `pulumi login` is
needed.

## Configure config.yaml

`init` writes a safe starting point rather than asking you to copy the
repository's own file:

```bash
./dist/tailbench-aws-k8s init
```

It creates `config.yaml` (mode 0644) and `.env.example` (mode 0600), and refuses
with `TB_INIT_EXISTS` and exit 4 rather than overwriting either
(`cmd/tailbench/main.go:174-212`). The generated config is deliberately
non-provisioning: `dry_run: true`, `max_cost_usd: 10`,
`max_instance_types: 1`, and `cleanup_policy: always`
(`cmd/tailbench/main.go:279-310`). A fuller annotated template is checked in as
`config.example.yaml`.

Only these keys affect the EKS variant. Everything under `gcp:`, `azure:`, and
`ssh:` is inert here, and so is `aws.key_name`.

`aws.key_name` deserves a note because it changed for the VM variant. On
`tailbench-aws`, an empty `key_name` now makes the provider generate an ed25519
key pair, register it as an EC2 `KeyPair`, and write the private key to
`.tailbench/ssh/<name>.pem`
(`internal/provider/aws.go:87-114`, `internal/provider/sshkey.go:34-67`). **None
of that happens here.** `EKSProvider` has no `KeyName` field,
`cmd/tailbench/aws_k8s.go:12-17` does not pass one, and `EnsureSSHKey` is never
called from `internal/provider/eks.go` — the node group is created without remote
access and benchmarks run through `kubectl exec`, not SSH. There is consequently
no generated key to fall back on when a node misbehaves; use
`kubectl describe node` and the EC2 console instead.

`ssh.ready_timeout` is likewise VM-only: it is read at
`internal/orchestrator/orchestrator.go:1085`, inside the SSH benchmark path this
binary never reaches.

| Key | Default | What it does / what breaks |
|---|---|---|
| `providers` | `[]` → the compiled provider (`internal/config/config.go:495-497`) | Leave empty, or set `[eks]`. Any other value fails before the plan is built (`internal/plan/build.go:34-42`). |
| `aws.region` | `us-west-2` (`internal/config/config.go:445`) | Region for the cluster, node groups, instance discovery, the plan's price lookup, and the recorded result `region` (`internal/orchestrator/orchestrator.go:1337-1339`). |
| `aws.az` | `us-west-2a` (`internal/config/config.go:446`) | AZ of subnet 1. EKS needs two AZs, so a second is **derived by rewriting the last character**: `…a` → `…b`, `…b` → `…c` (`internal/provider/eks.go:93-96`). Node groups only ever land in subnet 1 (`:291`), so the chosen instance type must be offered in `aws.az` itself. |
| `benchmark.modes` | `["l4-kernel"]` when empty (`internal/config/config.go:487-489`) | The only source of modes — **there is no `--modes` flag**. See the mode table below. |
| `l7_endpoints.cluster_label` | `app.kubernetes.io/part-of=tailbench-l7` (`internal/config/config.go:432`) | Label selector used to find the Ingress, the LoadBalancer Service, and the echo pod IP. Must match the labels in `manifests/l7-bench/*.yaml`; a mismatch makes every L7 mode fail with "no endpoint configured or discovered". |
| `l7_endpoints.ingress_fqdn` | `""` | Pins the L7 ingress target instead of discovering it (`internal/orchestrator/orchestrator.go:1401-1408`). Leave empty for normal use. |
| `l7_endpoints.serve_fqdn` | `""` | VM-only (`l7-serve-*`). Ignored by this binary. |
| `images.bench` / `images.tailscale` | `ghcr.io/rajsinghtech/tailbench-tools:latest` / `ghcr.io/tailscale/tailscale:latest` (`internal/config/config.go:454-455`) | Container images for the two bench pods (`internal/provider/eks.go:351-363`). Both are recorded in the run manifest (`cmd/tailbench/main.go:1026-1029`). |
| `tailscale.create_tailnet` | `true` in the `init` template (`cmd/tailbench/main.go:288-297`) | `true` creates and deletes an ephemeral tailnet, which needs an org-level client permitted to create tailnets. With `tailnet_dns_name` also empty, `orchestrator.New` refuses to start (`internal/orchestrator/orchestrator.go:174-179`). |
| `tailscale.tailnet_dns_name` | `""` (`internal/config/config.go:411`) | With `create_tailnet: false`, joins that tailnet instead of creating one (`internal/orchestrator/orchestrator.go:239-261`). The tsnet server and `o.tailnetDNS` — both required by the operator install (`internal/orchestrator/k8s_enabled.go:71-72`, `internal/provider/eks.go:472`) — are populated on this path too, so EKS runs work without tailnet-create permission. **The named tailnet's policy file is replaced wholesale**; see [Credentials](#credentials). Ignored when `create_tailnet: true`. |
| `tailscale.tag` | `tag:bench` (`internal/config/config.go:411`) | Becomes the operator's default tag and the subject of the `tailbench-admin` ClusterRoleBinding that grants cluster-admin (`internal/k8s/operator.go:168-192`, `:220`). |
| `state_backend` | `""` → local | See [Choose a state backend](#choose-a-state-backend). |
| `dry_run` | `false` in the repo's `config.yaml`, `true` in the `init` template | Compatibility alias for the `plan` command (`cmd/tailbench/main.go:1395-1411`). |
| `max_cost_usd` | `10.0` (`internal/config/config.go:74`) | Ceiling on the plan's estimated upper bound. Setting it here or via `--max-cost-usd` also satisfies the `--yes` requirement (`:336-348`). |
| `max_duration` | `45m` (`internal/config/config.go:75`) | Wall-clock bound; the run context is created with this timeout (`cmd/tailbench/main.go:994-995`). |
| `max_instance_types` | `1` (`internal/config/config.go:76`) | Refuses a plan whose pending work spans more instance types than this (`internal/guardrail/guardrail.go:70-80`). |
| `max_concurrent_resources` | `1` (`internal/config/config.go:77`) | Must be at least 1 (`internal/guardrail/guardrail.go:98-104`). |
| `cleanup_policy` | `always` (`internal/config/config.go:381`) | `always`, `on-success`, or `manual` (`internal/orchestrator/orchestrator.go:841-852`). Also derives `CleanupNetworking`: anything other than `manual` tears down provider networking at the end of the run (`internal/config/config.go:457`). |
| `benchmark.pps_*` | sizes 64/340/1400, 0.1% loss, 15s, 2M pps ceiling | Only used by `forward-pps-*` modes. |

### Which modes this binary accepts

`ModeAppliesTo` (`internal/benchmark/modes.go:43-53`) gates modes by environment.
For `container`:

| Mode | Status on `tailbench-aws-k8s` |
|---|---|
| `l4-kernel` | runs (iperf3 + MTR, pod-to-pod) |
| `l4-userspace` | runs |
| `l4-lb` | K8s-only; runs here |
| `l7-ingress-h1`, `l7-ingress-h2` | K8s-only; run here |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | K8s-only; run here |
| `l7-serve-h1`, `l7-serve-h2` | VM-only — skipped by the orchestrator, **refused by the guardrail** |
| `forward-pps-exit`, `relay-throughput` | VM-only — same |
| `tsnet-userspace` | **rejected at plan time**: "is not implemented; remove it before running" (`internal/plan/build.go:63-68`) |

Three separate checks now act on the mode list, in this order:

1. **`plan.Build`** rejects an unknown mode name and rejects `tsnet-userspace`
   outright (`internal/plan/build.go:59-68`), both with `TB_PLAN` and exit 2.
2. **`guardrail.Check`** adds an `incompatible-mode` violation for every
   configured mode that does not apply to `kubernetes`
   (`internal/guardrail/guardrail.go:48-62`). Any violation refuses the run with
   `TB_SAFETY_LIMIT` and exit 4 (`cmd/tailbench/main.go:903-919`).
3. **`validateWorkloadConfig`** in the k8s build errors when *no* configured mode
   applies to `container`, and logs the VM-only modes it will skip when the list
   is mixed (`internal/orchestrator/k8s_enabled.go:30-52`). It runs inside
   `orchestrator.New` (`internal/orchestrator/orchestrator.go:166-168`), i.e.
   after the guardrail.

The mixed list is accepted at layer 3 on purpose, so one `config.yaml` can serve
every binary — but layer 2 refuses it first on a `run`. **Practical consequence:
the repository's own `config.yaml` (`l4-kernel`, `l7-serve-h1`, `l7-serve-h2`)
plans fine on this binary and reports the two `l7-serve` modes as
`not-applicable`, but `run` refuses it with `incompatible-mode`.** Edit
`benchmark.modes` before your first EKS run:

```yaml
benchmark:
  modes:
    - l4-kernel
    - l4-lb
    - l7-ingress-h1
    - l7-ingress-h2
```

The older failure mode is gone in both directions. A list of only VM modes used
to provision a cluster, measure nothing, and report success; it is now an error
(`internal/orchestrator/k8s_enabled.go:40-46`). And the L7 bench manifests are no
longer deployed for a VM-only fortio mode, because `hasL7Modes` and
`hasForwardPPSModes` check applicability as well as tool
(`internal/orchestrator/k8s_enabled.go:57-73`).

The `forward-pps-exit-k8s` / `forward-pps-exit-k8s-opton` pair is an A/B: the same
UDP sweep through an operator-managed egress ProxyGroup with
`TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS` absent and set to `"true"`
(`manifests/proxygroup/base`, `manifests/proxygroup/overlays/on`). Each arm
writes its own result file so an interrupted run resumes them independently. See
[docs/cost-forward-pps-plan.md](cost-forward-pps-plan.md) for the topology, sweep
methodology, `limiting_resource` semantics, and reproducibility caveats.

## Choose a state backend

Pulumi state is where the record of your cluster lives. For EKS this matters more
than for the VM variants: a lost state file means an orphaned cluster that
tailbench can no longer destroy.

| `state_backend` | Stacks live in | Startup behaviour | Consequence |
|---|---|---|---|
| `""` (default) | `./state/eks` under this checkout | `MkdirAll` only (`internal/orchestrator/orchestrator.go:208-214`) | Invisible from any other checkout or host. A crashed run can only be resumed or torn down from this directory. |
| `pulumi.com` | Pulumi Cloud (normalized to `https://api.pulumi.com`) | Credential check; no local state dir (`internal/provider/backend.go:59-75`, `internal/orchestrator/orchestrator.go:204-207`) | Stacks survive machine swaps. Needs `PULUMI_ACCESS_TOKEN` or `pulumi login`. |
| `s3://…`, `gs://…`, `azblob://…` | Object storage | Same as above | Authenticated by the cloud credentials you already have. |
| `file://…` | The path you name | Local path handling | An explicit local or mounted directory. |

**Stale Pulumi locks are no longer swept at startup.** Lock removal is an
explicit, manifest-scoped recovery step that only touches locks belonging to
stacks the named run recorded:

```bash
./dist/tailbench-aws-k8s cleanup <run-id> --recover-pulumi-locks
```

The candidate paths are discovered by `recovery.FindPulumiLocks`, which refuses
symlinks and non-regular files (`internal/recovery/pulumi_locks.go:13-60`), are
printed in the confirmation prompt before anything is deleted
(`cmd/tailbench/main.go:555-564`), and are removed as a recorded lifecycle step
(`cmd/tailbench/main.go:796-849`). Remote backends manage their own leases; use
`pulumi cancel` there.

Stack names are provider-qualified and, when a run ID exists, run-scoped as well:
`tailbench-eks-cluster-<suffix>` and `tailbench-eks-<safeType>-<suffix>`, where
the suffix is the hex tail of the run ID
(`internal/provider/eks.go:52-59`, `internal/provider/run_scope.go:8-36`). One
backend therefore safely holds every provider's stacks *and* every run's.
`WorkDir` is separate from the backend URL — Pulumi always needs a real local
path for project and stack settings, so remote backends get scratch space under
`.tailbench/pulumi/eks` (`internal/provider/backend.go:30-38`).

An unusable value is rejected at parse time
(`internal/config/config.go:206-225`), not partway into the first stack
operation.

```bash
./dist/tailbench-aws-k8s plan --state-backend pulumi.com --family c7i
```

Recommendation for EKS: use a remote backend. The cluster outlives any single
run, and the ability to tear it down from a different machine is worth the setup.

## Dry run

The dry-run preview is now the `plan` command. `--dry-run` and `dry_run: true`
still work — both route to the same executor before any execution-only
configuration is read (`internal/app/app.go:273-277`,
`cmd/tailbench/main.go:1395-1411`) — but `plan` is the spelling to learn.

```bash
./dist/tailbench-aws-k8s plan
./dist/tailbench-aws-k8s plan --family c7i
./dist/tailbench-aws-k8s plan --family c7i --filter '^c7i\.(2)?xlarge$'
./dist/tailbench-aws-k8s --output json plan            # the full Plan struct
```

**It is genuinely side-effect-free.** `plan` parses with
`config.ParseLocalArgs`, so no env file is opened, no secret is expanded, and no
SSH key is read (`internal/config/config.go:256-266`, `:304-315`, `:464-485`).
No Pulumi workspace, tsnet server, or state directory is created, and — unlike
the old `--dry-run` — **no AWS CLI call is made**: instance types and prices come
from the checked-in catalog in `internal/pricing`
(`internal/plan/build.go:78-87`, `internal/plan/catalog.go:12-32`). The legacy
`DryRun` branch inside the orchestrator is now inert for the same reason
(`internal/orchestrator/orchestrator.go:189-195`).

A plan reports, in order (`internal/plan/render.go`,
`internal/plan/types.go:37-55`): the provider, workload, region/zone, the
selector, **per-mode applicability**, then **per-instance actions**
(`run`, `skip-existing`, `not-applicable`) with the catalog `$/hour`, then the
maximum topology, the cost estimate, the guardrails, and the required tools and
credentials.

```text
selector: family=c7i filter="^c7i\\.(2)?xlarge$"
configured modes:
  - l4-kernel: applicable
  - l7-serve-h1: not-applicable: mode does not apply to kubernetes workloads
instances:
  - c7i.xlarge (4 vCPUs, estimated $0.17850/hour)
      l4-kernel: skip-existing: result already exists
  - c7i.2xlarge (8 vCPUs, estimated $0.35700/hour)
      l4-kernel: run
maximum resources: compute=2 servers=0 clients=0 routers=0 clusters=1 node-pools=1 load-balancers=0
estimated maximum compute rate: $0.71400/hour
estimated upper bound for 45m0s: $0.54 (guardrail $10.00)
guardrails: duration=45m0s instance-types=1 concurrent-topologies=1 cleanup=always
required tools: pulumi, aws, kubectl, helm
required credentials for execution: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, AWS CLI authenticated identity
```

Three things to know:

- **The `maximum resources:` line is the safety contract.** For a Kubernetes
  workload it is fixed at one cluster, one node pool, one operator, and two
  compute resources, plus one load balancer when an `l4-lb` or `l7-ingress` mode
  is planned (`internal/plan/build.go:229-236`).
- **Cost is an estimate from a hand-seeded catalog**, priced as the most
  expensive selected type times the compute count times `max_duration`
  (`internal/plan/build.go:239-278`). It excludes network transfer, storage,
  taxes, discounts, and **the EKS control-plane charge**.
- **An unrecognized `--family` is no longer an error.** It resolves to zero
  instances and a warning — "no matching instances are present in the checked-in
  local price catalog" (`internal/plan/build.go:146-151`) — and only becomes a
  refusal at `run`, as the `no-runnable-work` guardrail violation. Valid values
  are listed under [Run](#run).

## Run

```bash
# Start small: one instance type, one cluster, one node group
./dist/tailbench-aws-k8s run --filter '^c7i\.xlarge$'

# Equivalent — run is the default command
./dist/tailbench-aws-k8s --filter '^c7i\.xlarge$'
```

Valid `--family` values for this provider: `c8gn`, `c6in`, `c7i`, `c7gn`, `c8g`,
`c6i`, `m6i`, `c7g`, `m7g` (`internal/provider/aws_instances.go:16-18`).
`--filter` is a Go regex matched against the full instance type
(`internal/plan/build.go:44-51`, `internal/orchestrator/orchestrator.go:584-597`).

A `run` evaluates the plan and the guardrails **before** loading any secret
(`cmd/tailbench/main.go:897-934`). If the guardrails pass, it prints a
confirmation block and waits on stdin (`internal/guardrail/guardrail.go:119-172`,
`cmd/tailbench/main.go:945-977`):

```text
TAILBENCH EXECUTION CONFIRMATION
provider: eks
workload: kubernetes
region: us-west-2
pending instance types: 1 (limit 1)
instance types: c7i.xlarge
modes: l4-kernel
maximum topology: compute=2 clusters=1 load-balancers=0
duration limit: 45m0s
estimated cost upper bound: $0.13
cost ceiling: $10.00
cleanup policy: always
Proceed? [y/N]: 
```

Anything other than `y`/`yes` — including EOF from a non-interactive shell —
is `TB_DECLINED` and exit 4. To skip the prompt, pass `--yes`, which
**requires an explicitly configured cost ceiling**: `--yes` without either
`--max-cost-usd` or `max_cost_usd:` in the config is the
`noninteractive-cost-required` violation (`internal/guardrail/guardrail.go:63-69`,
`internal/config/config.go:336-345`).

```bash
./dist/tailbench-aws-k8s run --filter '^c7i\.xlarge$' --yes --max-cost-usd 15
```

The other guardrails that can refuse a run before anything is provisioned
(`internal/guardrail/guardrail.go:28-117`), all reported as `TB_SAFETY_LIMIT`
with exit 4:

| Code | Trigger |
|---|---|
| `no-runnable-work` | every selected instance already has results, or nothing matched |
| `incompatible-mode` | a configured mode does not apply to `kubernetes` |
| `noninteractive-cost-required` | `--yes` without an explicit cost ceiling |
| `max-instance-types` | pending work spans more types than `--max-instance-types` (default 1) |
| `cost-estimate-unavailable` | selected types are absent from the price catalog |
| `max-cost-usd` | estimated upper bound exceeds the ceiling |
| `max-concurrent-resources` | the concurrency limit is below 1 |
| `cleanup-policy` | the policy string is not `always`/`on-success`/`manual` |

Once approved, `doctor --remote` runs, a run ID is minted, and the manifest
directory is created before the first cloud call
(`cmd/tailbench/main.go:979-1033`). The run context carries `--max-duration` as a
hard timeout; hitting it is `TB_DURATION_LIMIT`
(`cmd/tailbench/main.go:1295-1298`).

### Cost scoping

A cluster is far more expensive than a VM pair, and it is expensive even when
nothing is running on it:

- The **EKS control plane bills per cluster-hour** for as long as the cluster
  exists, independent of node groups. It is **not** in the plan's cost estimate,
  which prices only compute (`internal/plan/build.go:239-278`). Budget for it
  separately.
- Each instance type provisions a node group of **two nodes of that type**, fixed
  at min/desired/max = 2 (`internal/provider/eks.go:294-298`).
- Node groups are created and destroyed per instance type, but every iteration
  pays the full EKS node-group create/delete latency on top of the benchmark
  time.

The `--max-instance-types 1` default is what keeps `--family c6in` from walking
every size in the family unattended; raise it deliberately, and confirm the
selection with `plan` first.

Quota failures are contagious by design: when `IsQuotaError` matches during
`CreatePair`, the whole family group is marked skipped for the rest of the run,
on the assumption that larger sizes in the same group will also be over quota
(`internal/orchestrator/orchestrator.go:744-746`). For EKS the matcher is wider
than for EC2 — it also treats `insufficient` and `Unschedulable` as quota errors
(`internal/provider/eks.go:446-456`), so a scheduling failure can skip a family
too.

## What happens during a run

The EKS lifecycle has three steps the VM variants do not have: cluster creation,
Tailscale operator install, and manifest deploys.

1. **Startup.** `restoreStandardLogger()` runs first, undoing Pulumi's
   `slog.SetDefault` takeover of the standard logger; without it every
   `log.Printf` and `log.Fatalf` is silently discarded
   (`cmd/tailbench/main.go:52-63`). The command layer then plans, checks
   guardrails, confirms, and runs remote preflight, as described above.
2. **Run state.** A run ID of the form `tb_YYYY-MM-DD_<hex>`
   (`internal/runstate/store.go:22`) names a new directory under
   `.tailbench/runs/`, created 0700, holding `manifest.json`, `events.jsonl`,
   `plan.json`, `effective-config.redacted.yaml`, and `logs/tailbench.log`
   (`internal/runstate/store.go:25-31`, `:98-140`). Progress is tee'd into that
   log through the redactor (`cmd/tailbench/main.go:1138-1156`).
3. **State preparation.** For a local backend, `state/eks` is created. Remote
   backends skip it. Neither sweeps locks
   (`internal/orchestrator/orchestrator.go:197-214`).
4. **Tailnet**, one of two branches
   (`internal/orchestrator/orchestrator.go:230-430`). With
   `create_tailnet: true`, a manifest-managed run always creates its **own**
   tailnet rather than reusing `.tailbench/tailnet.json`, so cleanup ownership
   stays unambiguous (`:277-283`, `:314-330`), and swaps in the per-tailnet OAuth
   client the API returned (`:389-390`). With `create_tailnet: false` plus
   `tailnet_dns_name`, nothing is created and the configured client is used
   throughout (`:239-261`).

   Both branches then write the ACL with the K8s branch enabled — `tag:k8s`
   owner, a `0.0.0.0/0` route auto-approver, and a `tailscale.com/cap/kubernetes`
   grant allowing impersonation as `system:masters`
   (`internal/tailnet/tailnet.go:160-226`) — **replacing whatever policy file was
   there**. HTTPS is enabled for the operator's API-server proxy, gated by
   `needsTailnetHTTPS()`, which is unconditionally true for a K8s provider
   (`internal/orchestrator/orchestrator.go:1606-1615`; call sites `:254-260`,
   `:336-342`, `:420-427`). An ephemeral auth key is minted and a tsnet node
   named `tailbench-orchestrator` joins, with node state kept under
   `.tailbench/runs/<run-id>/tsnet` (`:434-453`).
5. **Cluster (`SetupNetworking`).** Long-lived Pulumi stack
   `tailbench-eks-cluster-<suffix>` (`internal/provider/eks.go:89-272`) creating:
   a VPC `10.0.0.0/16` with DNS hostnames and support; two public subnets
   (`10.0.1.0/24` in `aws.az`, `10.0.2.0/24` in the derived AZ) with
   `MapPublicIpOnLaunch`; an internet gateway, a default route, and two route
   table associations; a cluster IAM role with `AmazonEKSClusterPolicy`; the EKS
   cluster itself; and a node IAM role with `AmazonEKSWorkerNodePolicy`,
   `AmazonEKS_CNI_Policy`, and `AmazonEC2ContainerRegistryReadOnly`. Every
   resource is tagged `Project`, `TailbenchProvider`, `TailbenchRunID`, and
   `TailbenchExpiresAt` (`internal/provider/eks.go:61-73`). Then
   `aws eks update-kubeconfig` writes a kubeconfig to a **temporary file**, which
   is read, base64-encoded into memory, and deleted (`:232-252`) — your
   `~/.kube/config` is not modified. Finally the `tailbench` namespace is
   ensured.
6. **Stale device cleanup.** Tailnet devices matching `tb-eks-` and
   `tailbench-eks-operator` are deleted, on the assumption they are leftovers
   from a crashed run — but **only under `create_tailnet: true`**; the sweep is
   inside that branch (`internal/orchestrator/orchestrator.go:609-623`).
7. **Tailscale operator install** (`internal/orchestrator/k8s_enabled.go:75-90`
   → `internal/provider/eks.go:461-479` → `internal/k8s/operator.go:64-97`).
   Unconditional for this variant — it happens even when only `l4-kernel` is
   configured. It creates the `tailscale` namespace, a `tailbench-admin`
   ClusterRoleBinding mapping the tailnet tag group to `cluster-admin`, and
   `helm upgrade --install tailscale-operator` from
   `https://pkgs.tailscale.com/helmcharts` with `apiServerProxyConfig.mode=true`,
   `apiServerProxyConfig.allowImpersonation=true`, hostname
   `tailbench-eks-operator`, and `proxyConfig.defaultTags=tag:bench-service`
   (`internal/k8s/operator.go:206-226`). It then waits up to 10 minutes for
   `https://tailbench-eks-operator.<tailnet>/healthz` over the tailnet
   (`internal/k8s/operator.go:239-272`). Failure is a warning that is collected
   into the setup error, not an immediate abort
   (`internal/orchestrator/k8s_enabled.go:86-89`).
8. **Manifest deploys** (`internal/orchestrator/k8s_enabled.go:92-138`), each via
   `kubectl apply -k`, and each gated on a mode that actually applies to
   `container` (`:57-73`):
   - If any container `forward-pps-*` mode is configured:
     `manifests/proxygroup/base` — ProxyClasses `common` and
     `common-accept-routes`, and a single-replica egress `ProxyGroup` named
     `tailbench-egress`.
   - If any container fortio mode is configured: `manifests/l7-bench` — a
     `bench-echo` fortio Deployment and Service, a `bench-baseline` tools
     Deployment, an `Ingress` with `ingressClassName: tailscale`, and a
     `bench-echo-lb` Service with `loadBalancerClass: tailscale`. Both the
     Ingress and the LoadBalancer are served by the Tailscale operator — **no AWS
     ELB is created by these manifests**. The orchestrator then polls up to 3
     minutes for the LB FQDN.
9. **Instance discovery.** `aws ec2 describe-instance-types` per family, with
   transient-failure retry, cached at `.tailbench/instances/eks-<family>.json`
   and keyed by family so a narrow cache cannot satisfy a later `--family all`
   (`internal/orchestrator/orchestrator.go:1583-1640`). The cache is bypassed
   whenever `CleanupNetworking` is set — which is the default, since it is
   derived from `cleanup_policy` (`:1597-1608`, `internal/config/config.go:457`).
10. **Per instance type**, in ascending vCPU order:
    - Pending modes computed from existing result files; the type is skipped
      entirely if none remain
      (`internal/orchestrator/orchestrator.go:619-630`).
    - Pre-cleanup `DestroyPair`, then `CreatePair`: ephemeral Pulumi stack
      `tailbench-eks-<safeType>-<suffix>` with one EKS managed node group — two
      nodes, AMI type `AL2023_x86_64_STANDARD` or `AL2023_ARM_64_STANDARD` for
      Graviton, labelled `tailbench-pool=<safeType>` and `tailbench-run`
      (`internal/provider/eks.go:288-304`). It waits up to 10 minutes for two
      Ready nodes, upserts the `tailbench-auth` secret holding the auth key, and
      deploys two pods — `tb-eks-server-<safeType>-<suffix>` and
      `tb-eks-client-<safeType>-<suffix>` — pinned to the pool by nodeSelector
      and kept on separate nodes by required anti-affinity (`:329-375`). Each pod
      is a privileged `sysctler` init container (enables IP forwarding), a
      `bench` container, and a `tailscale` sidecar sharing the pod network
      namespace (`internal/k8s/pods.go:34-87`).
    - Benchmarks run through the Kubernetes API against those containers. L7
      baselines deliberately target pod IPs rather than Service names, because
      the Tailscale sidecar hijacks DNS inside the bench pods
      (`internal/orchestrator/orchestrator.go:1409-1411`, `:1434`); a separate
      sidecar-free `bench-baseline` pod is used as the baseline load generator
      when it can be found (`internal/orchestrator/k8s_enabled.go:200-208`).
    - Teardown of the pair is governed by `cleanup_policy`, not by an
      unconditional destroy: `always` destroys it, `on-success` destroys it only
      when no benchmark error has been recorded, `manual` leaves it running
      (`internal/orchestrator/orchestrator.go:785-806`, `:841-852`).
    - The auth key is refreshed every 30 minutes of wall clock (`:809-819`).
11. **Aggregation.** A completed `runProvider` calls `result.Aggregate`
    automatically, rewriting `website/data.generated.js` (`:823-826`).
12. **Teardown.** `TeardownNetworking` — destroying the cluster stack — runs when
    `CleanupNetworking` is set and the cleanup policy allows it
    (`internal/orchestrator/orchestrator.go:494-527`). With the default
    `cleanup_policy: always`, that means **every successful run destroys its own
    cluster and tailnet.** See [Teardown](#teardown).

### Endpoint resolution for L7 modes

`resolveEndpoints` (`internal/orchestrator/orchestrator.go:1399-1436`) decides
what each fortio mode targets:

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
answers fails the mode rather than recording it
(`internal/orchestrator/orchestrator.go:1146-1157`, `:1439-1458`).

The `forward-pps-exit-k8s` sink is resolved separately, and correctly: the egress
Service is annotated with `pair.ServerName` — the pod's real `TS_HOSTNAME`,
`tb-eks-server-<type>[-<run suffix>]` — rather than the orchestrator's VM-style
`tb-eks-s-<type>-<suffix>`, which no pod ever registers
(`internal/orchestrator/k8s_enabled.go:216-222`, `:258-262`,
`internal/provider/eks.go:339`, `internal/k8s/pods.go:78`).

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

For the result files a *specific* run produced — including their paths and
per-mode status — use the local reader rather than the filesystem:

```bash
./dist/tailbench-aws-k8s results <run-id>
./dist/tailbench-aws-k8s --output json results <run-id>
```

It renders the run's binary version, commit, plan hash, cloud identity, and one
line per work item (`internal/summary/report.go:204-249`), all from the manifest
— no cloud call and no credentials.

Price is derived at aggregation time, never stored in the result JSON: each
record is looked up in the curated dataset and a synthetic `price_per_hour` is
injected (`internal/result/aggregator.go:54-63`). `eks` prices resolve through
the `aws` dataset, since EKS nodes are EC2 instances
(`internal/pricing/pricing.go:80-90`). Re-pricing all history is therefore just a
re-aggregate:

```bash
go run ./cmd/pricing-refresh   # regenerate internal/pricing/data.json
go run ./cmd/aggregate/        # re-inject price_per_hour
```

View the dashboard by opening `website/index.html`. It loads
`data.generated.js` with a plain `<script src>`, so `file://` works — but Chart.js
comes from a CDN (`website/index.html:275`), so the charts need internet access.

## Resume and interruption

Two independent layers now decide what still needs doing.

**Layer 1 — the result files.** A unit of work is done if and only if its result
file exists. `pendingModesForInstance` skips an instance type entirely when every
applicable mode already has `eks/<family>/results/<type>-<mode>.json`
(`internal/orchestrator/orchestrator.go:1461-1491`), and `runModeLoop` re-checks
per mode (`:1121-1127`). For `l4-kernel`, **either** the mode-suffixed file
**or** the legacy no-suffix `<type>.json` satisfies it
(`:1482-1487`). That is a fix: requiring both made `l4-kernel` permanently
pending — no legacy file exists in any provider tree — so every rerun
re-provisioned a pair, skipped every mode, and destroyed it again, contradicting
the plan's own `skip-existing`.

To re-measure something, delete its result file. To re-measure everything for one
type, delete `eks/<family>/results/<type>-*.json`.

**Layer 2 — the run manifest.** Every `run` writes a versioned manifest under
`.tailbench/runs/<run-id>/` recording the plan, the effective (redacted) config,
the work items, the provider resources with their cleanup owner and ownership
certainty, and a JSONL event log
(`internal/runstate/store.go:79-160`, `internal/runstate/types.go:73-105`).
Three commands read or act on it:

```bash
./dist/tailbench-aws-k8s status <run-id>    # local read; work counts + recovery commands
./dist/tailbench-aws-k8s results <run-id>   # local read; result paths and per-mode status
./dist/tailbench-aws-k8s resume <run-id>    # re-run only the unfinished work
./dist/tailbench-aws-k8s cleanup <run-id>   # destroy what this run owns
```

`status` and `results` never touch the cloud (`cmd/tailbench/main.go:1329-1377`).
`resume` reloads the snapshotted config, narrows `--family`/`--filter`/modes to
exactly the pending, running, and failed work items
(`cmd/tailbench/main.go:861-895`), confirms unless `--yes` is passed, and then
continues. A run with nothing unfinished is `ErrNotRecoverable`
(`internal/lifecycle/lifecycle.go:23`, `cmd/tailbench/main.go:875-877`).
`cleanup` refuses outright if any tracked resource lacks certain ownership by
that run (`cmd/tailbench/main.go:472-487`) — it will not delete something it
cannot prove it created.

Other facts about interruption:

- `SIGINT`/`SIGTERM` cancel the run context (`cmd/tailbench/main.go:66-68`), the
  loop checks `ctx.Err()` between instance types
  (`internal/orchestrator/orchestrator.go:603-606`), the manifest records
  `interrupted`, and the process exits 130
  (`cmd/tailbench/main.go:1258-1262`, `:1299-1301`).
- After a crash the **cluster and node group survive** unless cleanup ran. The
  next `resume` or `run` clears an interrupted node-group operation via
  pre-cleanup `DestroyPair` and `stack.Cancel`
  (`internal/provider/eks.go:406-408`). A stale Pulumi lock is no longer swept
  implicitly — see [Choose a state backend](#choose-a-state-backend).
- Caches that persist between runs: `.tailbench/instances/eks-<family>.json`
  (bypassed whenever cleanup is enabled) and `.tailbench/pulumi/eks` for remote
  backends. `.tailbench/tailnet.json` is only used by runs without a run ID;
  a manifest-managed run always creates and owns its own tailnet
  (`internal/orchestrator/orchestrator.go:277-283`).

## Teardown

**The cluster is the expensive long-lived thing.** Node groups come and go with
each instance type, but the cluster stack — the VPC, subnets, IAM roles, and the
EKS control plane — is the item that keeps billing when you walk away. What has
changed is who destroys it, and when.

`cleanup_policy` now governs teardown of *everything*, and its default is
`always` (`internal/config/config.go:381`,
`internal/orchestrator/orchestrator.go:841-852`):

| Policy | Per-instance topology | Provider networking + tailnet |
|---|---|---|
| `always` (default) | destroyed after each type | destroyed at end of run |
| `on-success` | destroyed only when no benchmark error was recorded | same condition |
| `manual` | left running | left running |

`CleanupNetworking` is derived, not independent: it is true for any policy other
than `manual` (`internal/config/config.go:457`). `--cleanup-networking` therefore
does not "add" teardown to a default run — it forces the policy to `always`
(`internal/config/config.go:385-387`) and additionally bypasses the instance-type
cache (`internal/orchestrator/orchestrator.go:1599`) and forces a Tailscale
operator reinstall instead of skipping when one is already running
(`internal/orchestrator/k8s_enabled.go:73`, `internal/k8s/operator.go:70-73`).

So the ordinary path is: a run that completes destroys its own node groups,
cluster, and tailnet. The failure paths are what `cleanup RUN_ID` exists for:

```bash
./dist/tailbench-aws-k8s status <run-id>     # what is still tracked
./dist/tailbench-aws-k8s cleanup <run-id>    # destroy it
```

`cleanup` destroys each recorded instance type's pair, tears down provider
networking, and deletes the run-owned tailnet, in that order
(`cmd/tailbench/main.go:642-731`). It requires certain ownership for every
uncleaned resource, prints a confirmation naming the run and the count, and
accepts `--yes` and `--recover-pulumi-locks`
(`cmd/tailbench/main.go:440-539`, `:546-586`).

Use `cleanup_policy: manual` deliberately when you want the cluster to persist
across several runs — and then own the teardown yourself.

Afterwards, confirm nothing is left. These are AWS-side spot checks, not
something tailbench performs:

```bash
aws eks list-clusters --region us-west-2
aws ec2 describe-instances --region us-west-2 \
  --filters Name=tag:Project,Values=tailbench \
  --query 'Reservations[].Instances[].InstanceId'
pulumi stack ls   # against whichever backend you configured
```

Tagging makes this tractable: every EKS resource carries `Project=tailbench`,
`TailbenchProvider=eks`, `TailbenchRunID`, and `TailbenchExpiresAt`
(`internal/provider/eks.go:61-73`), so an abandoned run is identifiable by run ID
even without the state backend.

If the state backend was local and that checkout is gone, Pulumi can no longer
destroy the stack and the AWS resources must be removed by hand. This is the
argument for a remote backend.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Exits non-zero with no output at all | Pulumi's `logging` package `init()` calls `slog.SetDefault`, which redirects the standard logger to a discarding handler | `restoreStandardLogger()` must be the first statement in `main()` (`cmd/tailbench/main.go:57-63`). If you changed `main.go`, put it back. |
| `[TB_PREREQUISITE]` naming a tool | `doctor` could not find `pulumi`, `aws`, `kubectl`, or `helm` on `PATH` (`internal/preflight/preflight.go:84-101`) | Install it, or run `mise install`. Each failed check prints its own `next:` line. |
| `[TB_PREREQUISITE] cause: required values are missing: OAUTH_CLIENT_ID, …` | No Tailscale OAuth credentials for a run-class command (`cmd/tailbench/main.go:1701-1710`) | `./dist/tailbench-aws-k8s init`, then `cp .env.example .env` and fill it in. |
| `[TB_PREREQUISITE]` naming the env file | `env_file:` points at a file that does not exist; only `run`/`resume`/`cleanup`/`doctor --remote` open it (`cmd/tailbench/main.go:1413-1430`) | Create it, or drop `env_file:` and export the values instead. `plan` and local `doctor` work either way. |
| `[TB_SAFETY_LIMIT] … no-runnable-work` | Every selected instance already has results, or the selector matched nothing (`internal/guardrail/guardrail.go:41-47`) | Run `plan` to see the per-instance actions; widen `--family`/`--filter`, or delete the result files you want to re-measure. |
| `[TB_SAFETY_LIMIT] … incompatible-mode` | A VM-only mode (`l7-serve-*`, `forward-pps-exit`, `relay-throughput`) is in `benchmark.modes` on this binary (`internal/guardrail/guardrail.go:48-62`) | Replace them with container modes — see [Which modes this binary accepts](#which-modes-this-binary-accepts). |
| `[TB_SAFETY_LIMIT] … max-instance-types` | Pending work spans more types than the default limit of 1 | Narrow `--filter`, or raise `--max-instance-types` deliberately. |
| `[TB_SAFETY_LIMIT] … noninteractive-cost-required` | `--yes` without an explicit ceiling (`internal/guardrail/guardrail.go:63-69`) | Add `--max-cost-usd`, or set `max_cost_usd:` in `config.yaml`. |
| `[TB_PLAN] cause: benchmark mode "tsnet-userspace" is not implemented` | The mode has no runner (`internal/plan/build.go:63-68`) | Remove it from `benchmark.modes`. |
| `[TB_PLAN] cause: requested provider "aws", but this binary was compiled for "eks"` | `--provider` or `providers:` does not match the build | Use `--provider eks`, or drop the flag and let the compiled default apply. |
| `[TB_CONFIG] cause: read configuration …` or `invalid state_backend …` | Missing/unparseable `config.yaml`, or a backend value Pulumi cannot use (`internal/config/config.go:206-225`, `:293-301`) | Fix the path or the value. Both are rejected at parse time, before any stack operation. |
| `[TB_RECOVERY] cause: run not found: …` | The run ID does not exist under `.tailbench/runs`, or has a wrong shape (`internal/runstate/store.go:22`, `:365-370`) | Run IDs look like `tb_YYYY-MM-DD_<hex>`. List `.tailbench/runs/` to find it. |
| `[TB_RECOVERY] … lacks certain cleanup ownership` | The manifest cannot prove the run created a tracked resource (`cmd/tailbench/main.go:472-487`) | Inspect with `status`, then delete the resource by hand — `cleanup` deliberately will not guess. |
| Pulumi fails with `exit status 255` | Stale lock file from a crashed run; locks are no longer swept at startup | `cleanup <run-id> --recover-pulumi-locks` (`internal/recovery/pulumi_locks.go:13-60`). On a remote backend run `pulumi cancel` for the stack. |
| `no configured benchmark mode runs on a kubernetes binary` | Every configured mode is VM-only (`internal/orchestrator/k8s_enabled.go:40-46`) | Add a container mode. This previously provisioned a cluster, measured nothing, and reported success. |
| `config: skipping VM-only mode(s) …` in the log | Informational: a mixed mode list reached the orchestrator, e.g. through `resume` (`internal/orchestrator/k8s_enabled.go:47-50`) | Nothing to fix; it names exactly what will and will not be measured. |
| `no tailnet configured: set tailscale.create_tailnet: true …`, at startup | Neither `create_tailnet: true` nor `tailscale.tailnet_dns_name` is set. Not the `init` default any more — `init` now writes `create_tailnet: true` (`cmd/tailbench/main.go:288-297`) | Set one of them (`internal/orchestrator/orchestrator.go:174-179`). |
| `create tailnet: tailnet creation failed (HTTP 403): {"message":"actor does not have permission to create tailnets"}` | The OAuth client cannot create tailnets. Scope `all` on a tailnet-scoped client is **not** enough; this needs an org-level permission that is not a published scope | Use an org-level client that may create tailnets, or switch to `create_tailnet: false` plus `tailscale.tailnet_dns_name` (`internal/tailnet/tailnet.go:86-88`). |
| The joined tailnet's ACL rules are gone after a run | `SetupACL` replaces the whole policy file with the allow-all benchmark policy (`internal/tailnet/tailnet.go:150-152`, `:160-228`) | Restore from the policy-file version history in the admin console, and point `tailnet_dns_name` at a dedicated benchmark tailnet. |
| `operator proxy tailbench-eks-operator.<tailnet> not reachable after 10m0s`, then L7 modes fail | Historically HTTPS was enabled only when tailbench created the tailnet | No longer expected: `needsTailnetHTTPS()` is true for every K8s provider and is applied on all three tailnet paths — create, cached reuse, and join (`internal/orchestrator/orchestrator.go:1606-1615`, call sites `:254-260`, `:336-342`, `:420-427`). If it still happens, check whether HTTPS is blocked at the org level; the run now fails with `enable HTTPS: …` in that case. |
| Second run on a reused cluster loses the operator | Stale-device cleanup deletes the `tailbench-eks-operator` device (`internal/orchestrator/orchestrator.go:609-623`), but the install is skipped while its pod is still Running (`internal/k8s/operator.go:70-73`) | Force a reinstall with `--cleanup-networking` (`internal/orchestrator/k8s_enabled.go:73`) — note this also destroys the cluster and tailnet — or delete the operator Helm release before rerunning. Under `create_tailnet: false` the sweep does not run at all, so the device survives instead. |
| `mode l4-lb: no endpoint configured or discovered` | The LoadBalancer/Ingress FQDN was not discovered: label mismatch against `l7_endpoints.cluster_label`, manifests not deployed, or the operator is not running | Check the labels in `manifests/l7-bench/*.yaml` against your `cluster_label`, and confirm the operator pods are Running in the `tailscale` namespace. |
| `wait for nodes: expected 2 ready nodes, timed out after 10m0s` | The instance type is not offered in `aws.az`, or capacity is unavailable — node groups only use subnet 1 (`internal/provider/eks.go:291`) | Change `aws.az`, or narrow `--filter` to types available there. |
| A whole family is skipped after one failure | `IsQuotaError` matched; for EKS it also matches `insufficient` and `Unschedulable` (`internal/provider/eks.go:446-456`) | Request a quota increase, or rerun that family later. A scheduling failure can trigger this too — check the preceding error. |
| `create EKS cluster` fails on an IAM error | The role running tailbench cannot create roles or attach the AWS-managed EKS policies | Grant role creation plus managed-policy attachment for the policies listed in [Credentials](#credentials). |
| `[TB_DURATION_LIMIT]` | The run hit `--max-duration` (default 45m) (`cmd/tailbench/main.go:1295-1298`) | Raise the limit, or narrow the selection. State was saved: `status`, then `resume` or `cleanup`. |
| Exit 130 with no error text | `SIGINT`/`SIGTERM` (`internal/app/types.go:12`) | Resources may still exist. `status <run-id>`, then `resume` or `cleanup`. |
| `plan` reports `(none resolved from local catalog)` | An unrecognized `--family`, or types absent from `internal/pricing/data.json` (`internal/plan/build.go:146-151`) | Use a valid family (see [Run](#run)); refresh the catalog with `go run ./cmd/pricing-refresh` if the type is genuinely new. |
| New results are missing from the dashboard | Aggregation not rerun, or run from the wrong directory | `go run ./cmd/aggregate/` **from the repo root** (`cmd/aggregate/main.go`). |
| Dashboard renders tables but no charts | Chart.js loads from a CDN (`website/index.html:275`) | View it with internet access. |
