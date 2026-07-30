# Running tailbench on GKE

Operator runbook for the GCP managed-Kubernetes variant, in order:
prerequisites, credentials, configuration, a scoped first run, report
generation, and teardown. [running.md](running.md) covers what is common to all
six variants; everything below is specific to GKE.

## What this binary is

`tailbench-gcp-k8s` provisions a **GKE cluster**, then for each selected machine
type adds a 2-node node pool, schedules a server and a client bench pod onto it,
benchmarks them, and deletes the pool. Benchmarks run through `kubectl exec` into
the pods — there is no SSH and there are no VMs you log into.

| | |
|---|---|
| Binary | `dist/tailbench-gcp-k8s` |
| Build tags | `gcp,k8s` (`make build-gcp-k8s`) |
| Provider value | `gke` |
| Workload | `kubernetes`; benchmark environment `container`, not `vm` |
| Result directory | `gke/<family>/results/<type>-<mode>.json` |
| Runtime CLIs | `pulumi`, `gcloud`, `kubectl`, `helm` |

The provider value, not the filename, is what determines result directories and
Pulumi stack names. `--provider` is optional; if given it must be `gke`, or the
command fails before doing anything (`cmd/tailbench/gcp_k8s.go:10`,
`cmd/tailbench/main.go:1555-1573`, `cmd/tailbench/main.go:1740-1745`,
`internal/plan/build.go:34-42`).

### The command surface

This is a subcommand CLI. `run` is the default when no subcommand is given
(`cmd/tailbench/main.go:140-159`; help text at `internal/app/app.go:140-181`).

| Command | Side effects | Use |
|---|---|---|
| `init` | writes `config.yaml` and `.env.example` in the working directory | Start a checkout safely |
| `plan` | none | See what a run would do, for free |
| `doctor` | none | Check local tools |
| `doctor --remote` | read-only cloud calls | Check credentials before committing |
| `run` (default) | **creates billable GCP resources** | Execute the benchmark |
| `status RUN_ID` | none | Read persisted run state |
| `results RUN_ID` | none | Read persisted result metadata and paths |
| `resume RUN_ID` | provisions | Continue only that run's unfinished work |
| `cleanup RUN_ID` | destroys | Tear down what that run owns |

Global output flags apply to every command: `--output text|json`, `--log-file
PATH`, `--quiet`, `--help`, `--version` (`internal/app/app.go:199-251`).
`--help` and `--version` are answered before any configuration is read
(`internal/app/app.go:43-50`).

Failures print a structured block and exit with a typed status
(`internal/app/render.go:141-170`, `internal/app/types.go:6-12`):

```text
[TB_PREREQUISITE] stage: preflight
cause: ...
resources changed: no
next: ...
run ID: tb_2026-07-28_1f9c04
```

| Exit | Meaning |
|---|---|
| 0 | ok |
| 1 | run failed |
| 2 | usage or configuration error |
| 3 | prerequisite missing |
| 4 | refused (guardrail, declined confirmation, `init` would overwrite) |
| 5 | recovery/manifest problem |
| 130 | interrupted |

### Every run owns its own cluster

This is the single biggest thing to understand before spending money. Pulumi
stack names, GCP resource names, and pod names are **scoped to the run ID**
(`internal/provider/gke.go:47-54`, `internal/provider/run_scope.go:8-36`), and
every `run` and `resume` sets a run ID before the provider is constructed
(`cmd/tailbench/main.go:1131`, `cmd/tailbench/main.go:1157`). So the cluster
stack for run `tb_2026-07-28_1f9c04` is `tailbench-gke-cluster-1f9c04`, not a
shared `tailbench-gke-cluster`.

Two consequences:

- A cluster is **not** reused between runs. Each `run` creates a VPC, a
  subnetwork, and a GKE cluster from scratch, and — under the default
  `cleanup_policy: always` — destroys them at the end.
- Nothing is orphaned by accident *if* the run finishes. A run that dies mid-way
  leaves a cluster billing until you call `cleanup RUN_ID`, which is why the run
  ID is printed on every failure.

## Prerequisites

`doctor` replaces hand-rolled verification. It checks that the four CLIs this
variant shells out to are on `PATH` and reports each with its resolved path
(`internal/preflight/preflight.go:84-101`, `:216-235`):

```bash
./dist/tailbench-gcp-k8s doctor
```

```text
TAILBENCH DOCTOR — LOCAL CHECKS ONLY
provider: gke
workload: kubernetes
ready: true
[PASSED] pulumi (local): /home/you/.pulumi/bin/pulumi
[PASSED] gcloud (local): /home/you/google-cloud-sdk/bin/gcloud
[PASSED] kubectl (local): /usr/local/bin/kubectl
[PASSED] helm (local): /usr/local/bin/helm
[SKIPPED] credentials (local): credential values are not read during local checks
```

A failed check is reported with remediation and exits 3
(`cmd/tailbench/main.go:1524-1532`). Local `doctor` never opens the environment
file (`internal/config/config.go:256-261`).

| CLI | Used for | Called from |
|---|---|---|
| `pulumi` | All infrastructure (Automation API shells out to it) | `internal/provider/gke.go` |
| `gcloud` | Machine-type discovery, cluster credentials, node-pool cleanup | `internal/provider/gcp_instances.go:18-24`, `gke.go:158-160`, `gke.go:344-368` |
| `kubectl` | `apply -k` for the L7 bench and ProxyGroup manifests | `internal/k8s/util.go:38-52`, `internal/k8s/proxygroup.go:49-68` |
| `helm` | Installing the Tailscale operator chart | `internal/k8s/operator.go:195-235` |

`mise install` provisions all of them plus the Go toolchain at the pinned
versions (`mise.toml`). Helm is pinned to 3.x on purpose: the operator install
uses classic `helm repo add` + `helm upgrade --install`, which Helm 4 deprecates.

`doctor --remote` adds two read-only authentication probes — `pulumi whoami` and
`gcloud auth list --filter=status:ACTIVE --format=value(account)`
(`internal/preflight/remote.go:44-78`, `:98-121`). It loads the environment file
first and refuses with `TB_PREREQUISITE` if `OAUTH_CLIENT_ID` /
`OAUTH_CLIENT_SECRET` are missing (`cmd/tailbench/main.go:1491-1501`,
`:1701-1710`). The active account is deliberately not retained in the report for
GCP (`internal/preflight/remote.go:143-147`).

```bash
./dist/tailbench-gcp-k8s doctor --remote
```

### What doctor does not check

Four things are still on you, and all four are common first-run failures.

**`gke-gcloud-auth-plugin`.** `mise.toml` does not pin it and `doctor` does not
look for it. `gcloud container clusters get-credentials` writes a kubeconfig
whose user block is an `exec` credential plugin, and client-go honors
`ExecProvider` natively (`k8s.io/client-go@v0.35.3/rest/transport.go:25` imports
`k8s.io/client-go/plugin/pkg/client/auth/exec`), so tailbench runs that helper as
a subprocess on every API call. Install it with `gcloud components install
gke-gcloud-auth-plugin`. Nothing in this repository references the plugin by
name — it is gcloud's own behavior — which is why the failure is opaque.

**Application Default Credentials.** `doctor --remote` checks that the `gcloud`
CLI is authenticated, which is a *different* credential from ADC. See
[Credentials](#credentials).

**API enablement.** Only two GCP APIs are exercised: **Compute Engine**
(`compute.googleapis.com`) for the VPC, subnetwork, and `gcloud compute
machine-types list`, and **Kubernetes Engine** (`container.googleapis.com`) for
the cluster, node pools, and `get-credentials`. Nothing in `gke.go` touches any
other GCP service.

```bash
gcloud services list --enabled --project "$YOUR_PROJECT" \
  --filter='config.name:(compute.googleapis.com OR container.googleapis.com)' \
  --format='value(config.name)'
```

**IAM.** The identity behind ADC needs to create and delete VPC networks and
subnetworks, create and delete GKE clusters and node pools, fetch cluster
credentials, and list machine types. Node pools are created with the
`cloud-platform` OAuth scope (`gke.go:113-119`, `gke.go:205-215`), so the node
service account must be usable. Work out the exact role grants against your own
org policy — this document deliberately does not prescribe a binding list.

## Build

```bash
make build-gcp-k8s     # writes dist/tailbench-gcp-k8s
./dist/tailbench-gcp-k8s --version
```

A bare `go build ./cmd/tailbench/` fails by design; the `gcp,k8s` tag pair is
what selects `internal/provider/gke.go` and `cmd/tailbench/gcp_k8s.go`
(`Makefile:99-101`). Compiling the Pulumi SDKs is memory-hungry — build one
variant at a time.

## Credentials

Three independent systems. Each fails differently, and none of them substitutes
for another. None of them is needed for `plan`, local `doctor`, `status`,
`results`, or `--version`.

### 1. Tailscale OAuth (`.env`)

```bash
cp .env.example .env
$EDITOR .env      # OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET
```

`config.yaml` references the file through `env_file: .env` and expands `${VAR}`
placeholders under `tailscale:`. The file is opened **only** when secrets are
being resolved — that is, for `run`, `resume`, `cleanup`, and `doctor --remote`
(`internal/config/config.go:304-334`). Local commands use
`config.ParseLocalArgs`, which never reads it
(`internal/config/config.go:256-261`).

A missing `env_file` is now a typed prerequisite failure rather than a silent
fallback: it exits 3 with `TB_PREREQUISITE`
(`cmd/tailbench/main.go:1413-1430`). Empty OAuth values are rejected before
provisioning by `missingRunPrerequisites` (`cmd/tailbench/main.go:935-943`,
`:1701-1710`) — including when `create_tailnet: false`.

#### Decide first: create a tailnet, or join one

Get this right before anything else — a GKE run that gets it wrong has already
paid for a cluster.

**Option A — create an ephemeral tailnet (`create_tailnet: true`).** Tailbench
POSTs to `/api/v2/organizations/-/tailnets`
(`internal/tailnet/tailnet.go:63-104`); the response carries a *per-tailnet*
OAuth client that the orchestrator swaps into the config
(`internal/orchestrator/orchestrator.go:389-390`). The credentials you configure
are therefore used **only** for tailnet create and delete — the ACL, auth keys,
device cleanup, tailnet settings, and the OAuth secret handed to the Tailscale
operator all come from the returned client
(`internal/provider/gke.go:418-428`).

That create call needs an org-level permission that is **not one of the published
OAuth scopes**. A client with scope `all` that is scoped to a single tailnet is
not enough — it fails with:

```text
create tailnet: tailnet creation failed (HTTP 403): {"message":"actor does not have permission to create tailnets"}
```

Nothing local catches this: `plan` never contacts Tailscale, and `doctor
--remote` only checks that the values are non-empty.

**Option B — join the tailnet the OAuth client already belongs to
(`create_tailnet: false` plus `tailscale.tailnet_dns_name`).** Tailbench then
creates and deletes no tailnet. It sets the ACL, mints the auth key, starts
tsnet, and installs the operator against the tailnet you named
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

Either way the client must be able to write auth keys, the policy file, and
devices. Under Option A tailbench creates and deletes real ephemeral tailnets, so
use disposable org credentials.

Two further notes on Option A. A manifest-managed run **never reuses
`.tailbench/tailnet.json`**: when a run ID is set the cached tailnet is
deliberately ignored so cleanup ownership stays unambiguous, and the run creates
its own `tailbench-<run-suffix>` tailnet
(`internal/orchestrator/orchestrator.go:276-283`, `:305-356`). Since every `run`
sets a run ID, that cache is now only reachable by embedding the orchestrator
directly.

And on Option B, two things do **not** happen: stale-device cleanup is skipped —
the `tb-gke-` / `tailbench-gke-operator` sweep is inside the `create_tailnet`
branch (`internal/orchestrator/orchestrator.go:609-623`) — and no cleanup policy
will ever delete a tailnet tailbench merely joined (`:263-310`).

There is also no credential-wrapping Make target for this variant. The Makefile
defines `plan-aws`, `doctor-aws`, `doctor-aws-remote`, and `bench-aws`, which
wrap `./dist/tailbench-aws` in `esc run` so AWS credentials come from a
[Pulumi ESC](https://www.pulumi.com/docs/esc/) environment while Tailscale OAuth
still comes from `.env` (`Makefile:26`, `:118-137`). The pattern generalizes
without tailbench support — `esc run <env> -- ./dist/tailbench-gcp-k8s …` — but
no GKE targets exist.

### 2. The gcloud CLI (and ADC)

GCP needs **two** logins that are easy to confuse:

- `gcloud auth login` — authenticates the `gcloud` command itself, used for
  machine-type discovery, `get-credentials`, and node-pool cleanup. This is what
  `doctor --remote` probes.
- `gcloud auth application-default login` — writes Application Default
  Credentials, which is what the Pulumi GCP provider picks up. `gke.go:137-142`
  sets only `gcp:project` and `gcp:zone` as stack config and supplies no
  credentials, so the provider falls back to its default credential chain.

Having one without the other produces a run that passes `doctor --remote` and
then fails inside the first Pulumi operation, or the reverse.

### 3. The Pulumi state backend

Local by default and needs nothing. Pulumi Cloud needs `PULUMI_ACCESS_TOKEN` (an
entry in `.env` is enough — the Pulumi CLI inherits tailbench's environment) or a
prior `pulumi login` (`internal/provider/backend.go:59-75`). Object-store
backends authenticate through the cloud credentials you already have.

This check now runs when the orchestrator is constructed
(`internal/orchestrator/orchestrator.go:163`), which happens *after* the run
manifest is created (`cmd/tailbench/main.go:1157`). A missing token therefore
surfaces as a failed run with a run ID rather than a pre-startup error — nothing
is provisioned, but `.tailbench/runs/<run-id>/` exists.

## Configure config.yaml

`init` writes a safe starting configuration plus a secret template into the
current directory and refuses to overwrite either file
(`cmd/tailbench/main.go:163-256`, `:258-311`):

```bash
mkdir my-bench && cd my-bench
/path/to/dist/tailbench-gcp-k8s init
```

It produces `config.yaml` pinned to `providers: [gke]`, `create_tailnet: true`,
`modes: [l4-kernel]`, `gcp.project: YOUR_GCP_PROJECT_ID`, `dry_run: true`,
`max_cost_usd: 10`, `max_duration: 45m`, `max_instance_types: 1`,
`max_concurrent_resources: 1`, `cleanup_policy: always` — plus a 3-line
`.env.example`. Rerunning it exits 4 with `TB_INIT_EXISTS`. The repository also
ships a checked-in [`../config.example.yaml`](../config.example.yaml) with the
same safety posture.

The `tailscale:` block it writes now defaults to `create_tailnet: true`, with
comments naming the 403 a tailnet-scoped OAuth client hits and a commented-out
`tailnet_dns_name` alternative (`cmd/tailbench/main.go:288-297`). Confirm which
of the two you want before a run — see
[Decide first: create a tailnet, or join one](#decide-first-create-a-tailnet-or-join-one).
Setting neither is refused at startup
(`internal/orchestrator/orchestrator.go:174-179`).

Because the generated file sets `dry_run: true`, an unqualified invocation of
that config plans instead of provisioning. That is intentional; see
[Dry run](#dry-run).

Only these keys change behavior for this variant.

| Key | Default | What breaks if wrong |
|---|---|---|
| `gcp.project` | `tailscale-sandbox` (`config.go:448`) | **Read this row.** The default is an upstream author's project. `plan` cannot detect it — see below. A real run fails inside `SetupNetworking`. |
| `gcp.zone` | `us-central1-a` (`config.go:449`) | Cluster location, node-pool location, the `region` on every result, and the region `plan` prices against (`gke.go:96`, `orchestrator.go:1333-1345`, `internal/plan/build.go:333-349`). Must be a **zone**, not a region. |
| `benchmark.modes` | `["l4-kernel"]` when empty (`config.go:487-489`) | Determines what is measured, and whether a run is allowed at all. See the mode table below. |
| `l7_endpoints.cluster_label` | `app.kubernetes.io/part-of=tailbench-l7` (`config.go:432`) | Label selector used to find the Ingress, the LoadBalancer Service, and the baseline echo pod. Change it and every L7/LB mode reports "no endpoint configured". |
| `l7_endpoints.ingress_fqdn` | empty | Pins the `l7-ingress-*` target instead of discovering it from the cluster. |
| `l7_endpoints.serve_fqdn` | empty | Only consulted by `l7-serve-*`, which is VM-only. Irrelevant here. |
| `state_backend` | empty (local) | See the next section. Rejected at parse time if unusable (`config.go:206-225`). |
| `images.bench` / `images.tailscale` | `ghcr.io/rajsinghtech/tailbench-tools:latest`, `ghcr.io/tailscale/tailscale:latest` | The two containers in each bench pod (`internal/k8s/pods.go:54-83`). |
| `tailscale.create_tailnet` | `true` in the generated config (`cmd/tailbench/main.go:288-297`) | `true` creates and deletes an ephemeral tailnet, which needs an org-level client permitted to create tailnets. With `tailnet_dns_name` also empty, startup fails (`internal/orchestrator/orchestrator.go:174-179`). |
| `tailscale.tailnet_dns_name` | empty (`internal/config/config.go:411`) | With `create_tailnet: false`, joins that tailnet instead of creating one (`internal/orchestrator/orchestrator.go:239-261`) — how a GKE run works without tailnet-create permission. **The named tailnet's policy file is replaced wholesale.** Ignored when `create_tailnet: true`. |
| `azure.*`, `aws.*`, `ssh.*` | — | Ignored by this binary. In particular the generated SSH key pair the VM variants now create (`internal/provider/sshkey.go:87-96`) has no GKE equivalent: `internal/provider/gke.go` never calls it, node pools get no SSH access, and benchmarks run through `kubectl exec`. |

The execution guardrails are also configuration, and each has a matching flag
(`internal/config/config.go:73-82`, `:336-395`):

| Key | Flag | Default |
|---|---|---|
| `max_cost_usd` | `--max-cost-usd` | 10, and **not** counted as explicitly set |
| `max_duration` | `--max-duration` | `45m` |
| `max_instance_types` | `--max-instance-types` | 1 |
| `max_concurrent_resources` | `--max-concurrent-resources` | 1 |
| `cleanup_policy` | `--cleanup-policy` | `always` |
| `dry_run` | `--dry-run` | false |

`aws.*` and `azure.*` keys are read into the config struct but are never used by
this binary.

### The default project is not yours

`gcp.project` defaults to `tailscale-sandbox`, which is not a project a fresh
operator has access to. What changed since the flag-only CLI: **`plan` no longer
catches this.** The local planner resolves instance types from the checked-in
price catalog and only reads `gcp.zone` for the region
(`internal/plan/build.go:333-349`, `internal/plan/catalog.go:12-24`), so a wrong
project produces a completely normal-looking plan.

It fails at run time instead, in the first Pulumi operation inside
`SetupNetworking`, with a GCP permission or not-found error naming the project
(`gke.go:84-147`). The run manifest exists at that point; the cluster does not.

`doctor --remote` does not resolve the project either — it only proves that
`gcloud` has an active account. Set the project explicitly. There is no CLI flag
for it; `config.yaml` (or `--config` pointing at your own copy) is the only way.

### Which modes this binary runs

`ModeAppliesTo` gates modes by environment, and this binary always runs with
`env == "container"` (`internal/benchmark/modes.go:43-53`,
`internal/orchestrator/orchestrator.go:621-624`).

| Mode | On GKE |
|---|---|
| `l4-kernel` | Runs. iperf3 + MTR, pod-to-pod baseline vs. tailnet. |
| `l4-userspace` | Runs (no environment gate). |
| `l4-lb` | Runs. Kubernetes-only. |
| `l7-ingress-h1`, `l7-ingress-h2` | Run. Kubernetes-only. |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | Run. Kubernetes-only. |
| `l7-serve-h1`, `l7-serve-h2` | Not applicable — VM-only. |
| `forward-pps-exit`, `relay-throughput` | Not applicable — VM-only. |
| `tsnet-userspace` | **Rejected at plan time**: the runner is not implemented (`internal/plan/build.go:63-68`). |

Three layers now police this list, in the order you will hit them:

1. **`plan`** labels each configured mode `applicable` or `not-applicable` and
   marks each per-instance mode `run`, `skip-existing`, or `not-applicable`
   (`internal/plan/build.go:58-118`). An unrecognized name, or
   `tsnet-userspace`, is a hard `TB_PLAN` error (exit 2).
2. **Guardrails**, evaluated on `run` before any secret is loaded, raise
   `incompatible-mode` for *every* configured mode that does not apply to this
   workload, and `no-runnable-work` when nothing is left to do
   (`internal/guardrail/guardrail.go:41-62`). Both refuse the run with
   `TB_SAFETY_LIMIT`, exit 4.
3. **`validateWorkloadConfig`** in the orchestrator rejects a mode list where no
   configured mode applies to `container`, and logs the VM-only modes it will
   skip for a mixed list (`internal/orchestrator/k8s_enabled.go:30-52`). This
   replaces the old `return nil`, which silently measured `l4-kernel` and
   nothing else.

A consequence worth stating plainly: **the checked-in `config.yaml` ships
`modes: [l4-kernel, l7-serve-h1, l7-serve-h2]`, and `run` refuses it** with two
`incompatible-mode` violations, because two of the three are VM-only. The
orchestrator layer is the one that tolerates a mixed list so a single file can
serve every binary; the guardrail layer above it does not, so in practice a GKE
`run` needs a container-only mode list:

```yaml
benchmark:
  modes:
    - l4-kernel
    - l4-lb
    - l7-ingress-h1
    - l7-ingress-h2
```

L7 bench manifests are now deployed only when a fortio mode actually applies to
`container`; a VM-only mode such as `l7-serve-h1` no longer drags
`manifests/l7-bench` onto the cluster for a benchmark that never runs
(`internal/orchestrator/k8s_enabled.go:57-73`).

The `forward-pps-exit-k8s` / `-opton` pair is an A/B: identical sweeps through
the operator's egress ProxyGroup with
`TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS` absent and set to `"true"`
(`manifests/proxygroup/base` vs. `manifests/proxygroup/overlays/on`,
`internal/k8s/proxygroup.go:49-68`). Each arm writes its own result file so they
resume independently. Topology, sweep methodology, the `limiting_resource`
honesty rule, and the reproducibility caveats are in
[cost-forward-pps-plan.md](cost-forward-pps-plan.md) — not repeated here.

## Choose a state backend

| Value | Where state lives | Consequence |
|---|---|---|
| *(empty, default)* | `state/gke/` in this checkout | Stacks are invisible from any other machine or clone. An interrupted run can only be resumed or destroyed from here. |
| `pulumi.com` | Pulumi Cloud (`https://api.pulumi.com`) | Stacks survive a machine swap. Needs `PULUMI_ACCESS_TOKEN` or `pulumi login`. |
| `s3://…`, `gs://…`, `azblob://…` | Object storage | Same durability benefit; authenticates through your existing cloud credentials. |
| `file://…` | An explicit local or mounted path | Local semantics, chosen directory. |

Resolution is `BackendURL(configured, localStateDir, providerName)` — empty means
per-provider file state, anything else is used as-is
(`internal/provider/backend.go:16-21`). Pulumi still needs a real local directory
for project and stack settings, so a remote backend gets scratch space under
`.tailbench/pulumi/gke` (`internal/provider/backend.go:30-38`).

**Stale Pulumi locks are no longer swept at startup.** That sweep is gone
(`internal/orchestrator/orchestrator.go:197-214`); removing a lock is now the
explicit, manifest-scoped `cleanup RUN_ID --recover-pulumi-locks`, which only
touches lock files belonging to stacks that run recorded
(`cmd/tailbench/main.go:522-539`, `internal/recovery/pulumi_locks.go:13-62`).
Lock recovery resolves `<root>/state/gke/.pulumi/locks` from the local state
directory, not from `state_backend` (`cmd/tailbench/main.go:789-794`), so it is a
no-op against a remote backend — use `pulumi cancel` there.

Because a GKE cluster is expensive, a remote backend is worth more here than for
the VM variants: losing local state means the cluster keeps billing with no
supported way to tear it down.

```bash
./dist/tailbench-gcp-k8s plan --state-backend pulumi.com --family c3
```

Stack names are provider-qualified *and* run-qualified
(`tailbench-gke-cluster-<run-suffix>`, `tailbench-gke-<safe-type>-<run-suffix>`),
so one backend holds every provider's stacks and every run's stacks without
collision.

## Dry run

This is the `plan` command. `--dry-run` and YAML `dry_run: true` are
compatibility aliases that route to the same executor
(`internal/app/app.go:273-277`, `cmd/tailbench/main.go:1395-1411`) — including
when the subcommand is spelled `run`, so `run` against a `dry_run: true` config
plans and provisions nothing.

```bash
./dist/tailbench-gcp-k8s plan
./dist/tailbench-gcp-k8s plan --family c3 --filter '^c3-standard-(4|8)$'
./dist/tailbench-gcp-k8s plan --output json
./dist/tailbench-gcp-k8s --family c3 --dry-run          # compatibility spelling
```

`plan` is side-effect-free by construction: it parses configuration with
`config.ParseLocalArgs`, which does not open `env_file`, expand secrets, or read
SSH keys (`internal/config/config.go:256-261`, `cmd/tailbench/main.go:1203-1231`,
`:1432-1448`). It creates no state directory, no Pulumi stack, no tailnet, and
makes no cloud call.

```text
TAILBENCH LOCAL PLAN
SIDE EFFECTS: none
provider: gke
workload: kubernetes
region: us-central1
zone: us-central1-a
selector: family=c3 filter="^c3-standard-(4|8)$"
configured modes:
  - l4-kernel: applicable
  - l4-lb: applicable
instances:
  - c3-standard-4 (4 vCPUs, estimated $0.20960/hour)
      l4-kernel: skip-existing: result already exists
      l4-lb: skip-existing: result already exists
maximum resources: compute=0 servers=0 clients=0 routers=0 clusters=0 node-pools=0 load-balancers=0
estimated maximum compute rate: unavailable
price data: Indicative on-demand Linux prices (USD/hour) … (updated 2026-07-24)
guardrails: duration=45m0s instance-types=1 concurrent-topologies=1 cleanup=always
required tools: pulumi, gcloud, kubectl, helm
required credentials for execution: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, gcloud authenticated account and project
```

Two things the old `--dry-run` did that this does not:

- **It no longer prints modes verbatim.** Each configured mode is labelled
  `applicable` / `not-applicable` with a reason, and each instance gets a
  per-mode action of `run`, `skip-existing`, or `not-applicable`
  (`internal/plan/build.go:58-118`). What you see is what the run will do.
- **It no longer shells out to `gcloud compute machine-types list`.** Instance
  types, vCPU counts, and prices come from the checked-in catalog in
  `internal/pricing` (`internal/plan/catalog.go:12-24`). That makes `plan` work
  with no cloud auth at all, and it also means `plan` is no longer a test of your
  GCP credentials — `doctor --remote` is. It also means the plan's instance list
  can differ from what the run discovers: the run still queries `gcloud` for the
  live list (`internal/orchestrator/orchestrator.go:1602-1673`).

An unrecognized `--family` is also no longer rejected with the valid list. It
simply matches nothing in the catalog, and `plan` says so:

```text
instances:
  (none resolved from local catalog)
warning: no matching instances are present in the checked-in local price catalog; use doctor --remote to verify provider availability
```

`plan` still exits 0 there (`internal/plan/build.go:146-151`); the following
`run` is what refuses, with `TB_SAFETY_LIMIT` / `no-runnable-work`. A malformed
`--filter` regex is a `TB_PLAN` error, exit 2.

The selection flags are unchanged and there is still no `--modes` flag:

```text
--config  --provider  --family  --filter  --dry-run  --cleanup-networking  --state-backend
```

## Run

```bash
./dist/tailbench-gcp-k8s run --family c3 --filter '^c3-standard-4$'
```

`run` does the local plan and evaluates guardrails **before** loading any secret
or constructing anything (`cmd/tailbench/main.go:897-943`). If the guardrails
allow it, you get an interactive confirmation on a channel that `--quiet` cannot
suppress (`internal/guardrail/guardrail.go:119-173`,
`internal/app/app.go:316-354`):

```text
TAILBENCH EXECUTION CONFIRMATION
provider: gke
workload: kubernetes
region: us-central1
pending instance types: 1 (limit 1)
instance types: c3-standard-4
modes: l4-lb
maximum topology: compute=2 clusters=1 load-balancers=1
duration limit: 45m0s
estimated cost upper bound: $0.31
cost ceiling: $10.00
cleanup policy: always
Proceed? [y/N]:
```

Anything other than `y`/`yes` exits 4 with `TB_DECLINED`. For automation, `--yes`
skips the prompt — but `--yes` **requires an explicitly configured
`--max-cost-usd`** (or `max_cost_usd:` in YAML); the built-in default of 10 does
not count as approval (`internal/config/config.go:336-345`,
`internal/guardrail/guardrail.go:63-69`):

```bash
./dist/tailbench-gcp-k8s run --family c3 --filter '^c3-standard-4$' \
  --max-cost-usd 10 --max-duration 90m --yes
```

Only after confirmation does the remote preflight run, and only after that is the
run manifest created (`cmd/tailbench/main.go:979-1033`).

### Cost scoping

A GKE run is materially more expensive than a VM run, for three reasons that
stack:

- Every run builds its **own cluster**: a custom-mode VPC, a `10.0.0.0/20`
  subnetwork, and a zonal GKE cluster with a one-node `e2-small` `default-pool`
  (`gke.go:87-131`). You pay the GKE cluster management fee and the control-plane
  creation latency on every run, not once.
- Each instance type gets a **2-node** pool of that machine type
  (`gke.go:200-216`), created and destroyed per type, each waiting up to 10
  minutes for nodes to become Ready (`gke.go:245`).
- The estimate in the confirmation prices only the bench nodes: the hourly rate
  of the most expensive selected type times a fixed multiplier of 2 for a
  Kubernetes workload (`internal/plan/build.go:229-236`, `:239-278`). The
  `default-pool` node, the cluster management fee, and load balancers are not
  modeled; network transfer, storage, taxes, discounts, and control-plane charges
  are listed as excluded (`internal/plan/build.go:270-276`).

The guardrail defaults are deliberately tight — one instance type, 45 minutes.
**45 minutes is short for GKE**: cluster creation, operator install, node-pool
creation, and the benchmark itself all run inside one `context.WithTimeout`
(`cmd/tailbench/main.go:994`). Expect to raise `--max-duration` for anything past
a single mode on a single type, and expect `TB_DURATION_LIMIT` if you do not
(`cmd/tailbench/main.go:1295-1298`).

Widening is a matter of raising the instance-type ceiling explicitly:

```bash
./dist/tailbench-gcp-k8s run --family c3 --max-instance-types 4 --max-duration 3h
```

`--family` must name one of the seven GCP families — `c4`, `c4a`, `c3d`, `n4`,
`c3`, `n2`, `c2` (`internal/provider/gcp_instances.go:14-16`) — and `--filter` is
a Go regex matched against the machine-type name.

Note that `gke/` in this repository already contains results for `c2`, `c3`,
`c3d`, `c4`, `n2`, and `n4` across `l4-kernel`, `l4-lb`, and `l7-ingress-*`.
Because resume is filesystem-driven, a broad rerun with those modes skips almost
everything and costs nothing — `plan` shows it as `skip-existing`, and the
guardrails will then refuse the run outright with `no-runnable-work`. If you want
fresh numbers, delete the result files you intend to re-measure. `c4a` has no
results at all and is the cheapest family to exercise from scratch.

## What happens during a run

Ordered. Steps 1–5 touch nothing outside this directory.

1. **Local plan.** `config.ParseLocalArgs` → `plan.Build`. No secrets, no cloud
   (`cmd/tailbench/main.go:1203-1231`).
2. **Guardrails.** Violations abort with `TB_SAFETY_LIMIT`, exit 4, before any
   credential is read (`cmd/tailbench/main.go:903-919`).
3. **Execution config.** Now the environment file is opened and `${VAR}` expanded
   (`cmd/tailbench/main.go:921-943`).
4. **Confirmation**, unless `--yes` (`cmd/tailbench/main.go:945-977`).
5. **Remote preflight.** `pulumi whoami` + `gcloud auth list`
   (`cmd/tailbench/main.go:979-982`, `:1063-1071`).
6. **Run manifest.** `.tailbench/runs/<run-id>/` is created with `manifest.json`,
   `plan.json` (plus its sha256), `effective-config.redacted.yaml`,
   `events.jsonl`, `summary.json`, and `logs/tailbench.log`
   (`cmd/tailbench/main.go:1006-1033`, `internal/runstate/store.go:25-32`,
   `:79-159`). One work item is recorded per instance-type/mode pair, pre-marked
   `skipped` for anything the plan resolved as `skip-existing` or
   `not-applicable` (`internal/lifecycle/lifecycle.go:642-661`). A resource
   expiry stamp of `max_duration + 1h` is computed here and lands on GCP resource
   labels (`cmd/tailbench/main.go:1131-1137`).
7. **Tailnet**, one of two branches
   (`internal/orchestrator/orchestrator.go:230-430`). With
   `create_tailnet: true`, a run-owned ephemeral tailnet named
   `tailbench-<run-suffix>` is created — never the cached one (`:276-356`) — and
   the per-tailnet OAuth client it returns replaces the configured one
   (`:389-390`). With `create_tailnet: false` plus `tailnet_dns_name`, nothing is
   created and the configured client is used throughout (`:239-261`).

   On either path the ACL is written, **replacing the tailnet's whole policy
   file**: `tag:k8s` ownership, a `0.0.0.0/0` route auto-approver, and the
   `tailscale.com/cap/kubernetes` grant that lets the operator's API-server proxy
   impersonate `system:masters` (`internal/tailnet/tailnet.go:160-228`). HTTPS is
   enabled because this is a K8s provider, so `needsTailnetHTTPS()` is
   unconditionally true (`orchestrator.go:1606-1615`; call sites `:254-260`,
   `:336-342`, `:420-427`). It is now applied on all three tailnet paths — create,
   cached reuse, and join — which retires the old "stale tailnet has no certs"
   trap for good rather than only because a created tailnet is always new. An
   auth key is issued and an ephemeral `tailbench-orchestrator` tsnet node joins,
   with its node state under `.tailbench/runs/<run-id>/tsnet` (`:434-453`).
8. **Cluster (`SetupNetworking`).** Pulumi stack
   `tailbench-gke-cluster-<run-suffix>` creates the VPC, the subnetwork in the
   zone's region, and a zonal GKE cluster with `initial_node_count: 1`,
   `e2-small` nodes, and deletion protection off (`gke.go:84-131`). Every
   resource carries `project`, `tailbench_provider`, `tailbench_run_id`, and
   `tailbench_expires_at` labels (`gke.go:56-68`).
9. **Kubeconfig.** `gcloud container clusters get-credentials <cluster> --zone
   <zone> --project <project> --quiet` writes to a temp `KUBECONFIG`, which is
   read, base64-encoded, and held in memory for the rest of the run
   (`gke.go:152-173`). The `tailbench` namespace is created (`gke.go:175-181`).
10. **Stale device cleanup.** Tailnet devices matching `tb-gke-` and
    `tailbench-gke-operator` are deleted — but **only under
    `create_tailnet: true`**; the sweep is inside that branch
    (`orchestrator.go:609-623`).
11. **Tailscale operator.** `helm repo add`/`update`, then `helm upgrade
    --install tailscale-operator` into the `tailscale` namespace with
    `apiServerProxyConfig.mode=true`, `allowImpersonation=true`, hostname
    `tailbench-gke-operator`, and the OAuth client (`gke.go:418-434`,
    `internal/k8s/operator.go:195-235`). A `tailbench-admin` ClusterRoleBinding
    maps the orchestrator's tag to `cluster-admin`
    (`internal/k8s/operator.go:169-192`). A previous install is torn down first
    (`:99-165`). Failure here is a **warning**, not an error — the run continues
    and L7 modes fail later (`k8s_enabled.go:86-89`). GKE does not wait for the
    API-server proxy: it uses the direct kubeconfig for exec and only records the
    FQDN (`gke.go:429-432`).
12. **Manifests.** `kubectl apply -k manifests/proxygroup/base` if a
    forwarding-pps mode applies here, and `kubectl apply -k manifests/l7-bench`
    if a fortio mode applies here — both gated on `ModeAppliesTo(mode,
    "container")` (`k8s_enabled.go:57-73`, `:97-112`). The L7 bundle creates the
    `bench-echo` Fortio Deployment, a `bench-baseline` tools pod, a ClusterIP
    Service, an `ingressClassName: tailscale` Ingress, and a `loadBalancerClass:
    tailscale` Service — the last two provisioned by the Tailscale operator, not
    by GCP. The run then polls up to 3 minutes for the LB FQDN
    (`k8s_enabled.go:114-138`).
13. **Instance discovery.** `gcloud compute machine-types list` per family,
    filtered to `^<family>-standard-[0-9]+$` in the configured zone, with up to
    three retries on transient errors, cached at
    `.tailbench/instances/gke-<family>.json`
    (`orchestrator.go:1593-1687`). The cache is bypassed whenever
    `cfg.CleanupNetworking` is true — which, under the default `cleanup_policy:
    always`, is every run (`config.go:457`, `orchestrator.go:1605`).
14. **Per machine type**, in ascending vCPU order:
    - Skip entirely if every applicable mode already has a result file
      (`orchestrator.go:619-630`).
    - `DestroyPair` as a pre-cleanup, then `CreatePair`: Pulumi stack
      `tailbench-gke-<safe-type>-<run-suffix>` adds a `bench-pool` node pool with
      `node_count: 2` labeled `tailbench-pool=<safe-type>` and
      `tailbench-run=<run-suffix>`; wait up to 10 minutes for 2 Ready nodes;
      write the `tailbench-auth` Secret; deploy `tb-gke-server-<safe-type>` and
      `tb-gke-client-<safe-type>` pods (both run-suffixed) pinned to that pool
      with pod anti-affinity so they land on different nodes
      (`gke.go:193-309`). Each pod is a privileged `sysctler` init container plus
      a `bench` container and a `tailscale` sidecar sharing one network namespace
      (`internal/k8s/pods.go:34-87`).
    - A quota error here marks the **whole family group** skipped for the rest of
      the run. The key is `provider.InstanceFamilyGroup`, which for GCP equals
      `GetInstanceFamily` — GKE behavior is unchanged, but the invariant now
      holds identically on every provider (`internal/provider/families.go:38-54`,
      `orchestrator.go:609-617`, `:744-747`). On GKE, `IsQuotaError` also matches
      `insufficient` and `Unschedulable` (`gke.go:398-408`), so an unschedulable
      node pool counts as quota.
    - Because `PairOutput.Namespace` is non-empty, benchmarking routes to
      `runK8sBenchmark` (`orchestrator.go:1006-1009`), which builds four `kubectl
      exec` executors — bench and tailscale containers on each pod — over SPDY
      (`k8s_enabled.go:181-223`, `internal/k8s/kubeexec.go:37-134`). No SSH is
      involved anywhere in this variant.
    - Each pending mode runs and writes
      `gke/<family>/results/<type>-<mode>.json`, with the manifest work item
      transitioning running → succeeded/failed as it goes
      (`orchestrator.go:1102-1358`).
    - `DestroyPair`, subject to `cleanup_policy`: delete both pods, destroy the
      node-pool stack, then a `gcloud container node-pools delete --async`
      fallback for anything the stack missed (`gke.go:311-368`,
      `orchestrator.go:785-807`).
15. **Aggregate.** The pass calls `result.Aggregate` before returning
    (`orchestrator.go:823-826`).
16. **Teardown**, subject to `cleanup_policy`: the cluster stack and then the
    tailnet (`orchestrator.go:494-529`, `:229-274`).

### How L7 endpoints are resolved

`resolveEndpoints` (`orchestrator.go:1405-1443`) decides what each fortio mode
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
  (`orchestrator.go:1415-1417`, `:1440`; `internal/k8s/pods.go:80`).

Each target is warmed up with `curl` (20 attempts, `-k` for HTTPS) before
measurement; a target that never answers fails that mode rather than recording it
(`orchestrator.go:1445-1465`).

The `forward-pps-exit-k8s` sink is resolved separately, and the name mismatch
that used to break it is fixed. The egress Service is annotated with
`pair.ServerName` — the pod's real `TS_HOSTNAME`,
`tb-gke-server-<type>[-<run-suffix>]` — rather than the VM-style
`tb-gke-s-<type>-<suffix>` hostname the orchestrator generates and never registers
on a K8s run (`internal/orchestrator/k8s_enabled.go:216-222`, `:255-262`;
`gke.go:254`; `internal/k8s/pods.go:78`).

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
for lookup (`internal/pricing/pricing.go:77-104`). Node-pool node cost is what is
priced; the cluster management fee and the `default-pool` node are not modeled.
That is the same catalog `plan` quotes from, so a plan estimate and a dashboard
price agree by construction.

To see what one specific run produced, without re-reading the whole tree:

```bash
./dist/tailbench-gcp-k8s results tb_2026-07-28_1f9c04
./dist/tailbench-gcp-k8s results tb_2026-07-28_1f9c04 --output json
```

That reads only `.tailbench/runs/<run-id>/manifest.json` and prints each work
item's instance type, mode, status, and result path
(`internal/summary/report.go:146-249`).

Then open `website/index.html`. It loads `data.generated.js` through a plain
`<script src>` tag, so `file://` works; Chart.js comes from a CDN, so rendering
needs internet access (`website/index.html:275-276`).

## Resume and interruption

Two mechanisms now operate together.

**Filesystem resume** is unchanged in spirit and fixed in detail. A mode is done
when its result file exists at `gke/<family>/results/<type>-<mode>.json`; for
`l4-kernel`, the legacy no-suffix `<type>.json` also counts. It is a *fallback*,
not a second requirement — requiring both made `l4-kernel` permanently pending,
so every rerun provisioned a pair, skipped every mode, and destroyed it
(`internal/orchestrator/orchestrator.go:1467-1497`). `plan` uses the same
two-candidate rule, so plan and run now agree
(`internal/plan/build.go:182-197`).

**Manifest resume** is new. Every approved run writes a versioned recovery bundle
under `.tailbench/runs/<run-id>/`; run IDs look like `tb_2026-07-28_1f9c04` and
are validated against that shape (`internal/runstate/store.go:22`, `:64-73`).

```bash
./dist/tailbench-gcp-k8s status  tb_2026-07-28_1f9c04
./dist/tailbench-gcp-k8s results tb_2026-07-28_1f9c04
./dist/tailbench-gcp-k8s resume  tb_2026-07-28_1f9c04
./dist/tailbench-gcp-k8s cleanup tb_2026-07-28_1f9c04
```

`status` and `results` are pure local readers — no cloud, no credentials
(`cmd/tailbench/main.go:1329-1377`). `status` prints run status, benchmark and
cleanup outcomes separately, work counts, tracked resource count, recorded
failures, and — when the run is recoverable — the exact resume and cleanup
commands.

`resume` reloads the redacted effective configuration from the manifest, takes
current secrets from your environment, narrows `--family`/`--filter`/modes to
exactly the unfinished work, raises `--max-instance-types` to fit it, and reruns
under the same run ID and therefore the same run-scoped stacks
(`cmd/tailbench/main.go:313-438`, `:861-895`). Work counts as unfinished when it
is pending, running, failed, or cleanup-pending
(`internal/lifecycle/lifecycle.go:712-724`). Resume prompts for confirmation
unless `--yes` is passed, and a run with nothing unfinished is rejected rather
than restarted.

SIGINT and SIGTERM cancel the context (`cmd/tailbench/main.go:66`); the manifest
is marked `interrupted`, the process exits 130, and the failure block names the
run ID and the three recovery commands (`cmd/tailbench/main.go:1279-1302`).

What survives an interruption:

| Artifact | Where | Removed by |
|---|---|---|
| GKE cluster + VPC | stack `tailbench-gke-cluster-<run-suffix>` | `cleanup RUN_ID`, or a subsequent run/resume that completes with `cleanup_policy: always` |
| Node pool + bench pods | stack `tailbench-gke-<safe-type>-<run-suffix>` | same |
| Tailnet | run-owned `tailbench-<run-suffix>` | same |
| Run manifest | `.tailbench/runs/<run-id>/` | deleting the directory |
| Instance-type cache | `.tailbench/instances/gke-<family>.json` | deleting the file; bypassed and rewritten each run under `cleanup_policy: always` |
| Results | `gke/<family>/results/` | deleting the files |

To force one measurement to rerun, delete just that file:

```bash
rm gke/c3/results/c3-standard-4-l4-lb.json
./dist/tailbench-gcp-k8s run --family c3 --filter '^c3-standard-4$'
```

A crashed run can leave a Pulumi lock behind. There is no startup sweep; recover
it explicitly and only for the stacks that run recorded:

```bash
./dist/tailbench-gcp-k8s cleanup tb_2026-07-28_1f9c04 --recover-pulumi-locks
```

The confirmation lists every lock path it would remove before removing anything
(`cmd/tailbench/main.go:546-568`).

## Teardown

**The cluster is the expensive thing**, and under the default policy it is
already gone. `cleanup_policy` is now the switch that decides:

| `cleanup_policy` | Node pools | Cluster, VPC, tailnet |
|---|---|---|
| `always` (default) | destroyed after each instance type | destroyed at the end of the run |
| `on-success` | destroyed only if the benchmark had no error | same condition |
| `manual` | left running | left running |

`shouldCleanup` implements this (`internal/orchestrator/orchestrator.go:841-852`),
and `cfg.CleanupNetworking` is now *derived* — it is true for any policy except
`manual` (`internal/config/config.go:457`). The `--cleanup-networking` flag and
the `cleanup_networking:` YAML key survive as a way to force
`cleanup_policy: always`, which is all they now do
(`internal/config/config.go:381-387`). They no longer need to be passed for the
cluster to be torn down.

So the way to *keep* a cluster between runs is the opposite of what it used to
be:

```bash
./dist/tailbench-gcp-k8s run --cleanup-policy manual \
  --family c3 --filter '^c3-standard-4$'
```

and the way to tear down what that left behind is:

```bash
./dist/tailbench-gcp-k8s cleanup tb_2026-07-28_1f9c04
```

`cleanup` refuses unless **every** unclean resource in the manifest names that
run as its cleanup owner and is marked ownership-certain
(`cmd/tailbench/main.go:472-487`). GKE sets that flag from
`RunScopedResources()`, which is true exactly when the run had a run ID
(`gke.go:44`, `orchestrator.go:831-834`) — so a manifest written by a run that
somehow had no ID cannot be cleaned by this path. `cleanup` destroys each
recorded instance type's pair, then networking, then the run-owned tailnet
(`cmd/tailbench/main.go:642-731`), and reports `cleanup: succeeded` /
`status: cleaned` on the way out.

Then confirm nothing is left, especially after a crash where Pulumi state may be
incomplete. The run-ID label is the cheapest way to find orphans
(`gke.go:56-68`, `gke.go:210-213`):

```bash
gcloud container clusters list --project "$YOUR_PROJECT" \
  --filter='resourceLabels.tailbench_provider=gke'
gcloud compute networks list --project "$YOUR_PROJECT" --filter='name~tailbench'
gcloud container node-pools list --cluster <cluster> --zone <zone> \
  --project "$YOUR_PROJECT"
```

The node-pool `gcloud` fallback delete is keyed on the
`tailbench-pool=<safe-type>` label, and it is still skipped entirely when
`p.clusterName` is empty — which is the case in any process that did not itself
run `SetupNetworking` (`gke.go:344-347`). A `cleanup RUN_ID` invocation is
exactly such a process: it constructs a fresh provider and calls `DestroyPair`
without `SetupNetworking`, so if the node-pool stack is also missing, nothing
happens. Check by hand after a crash.

## Troubleshooting

Every failure prints `[TB_<CODE>] stage / cause / resources changed / next`, plus
the run ID and log path when one exists.

| Symptom | Cause | Fix |
|---|---|---|
| `[TB_PREREQUISITE] … executable not found on PATH` | One of `pulumi`, `gcloud`, `kubectl`, `helm` is missing | `mise install`, or install the named tool; rerun `doctor` |
| `[TB_PREREQUISITE] … required values are missing: OAUTH_CLIENT_ID` | `.env` absent or empty; required even with `create_tailnet: false`, because the join path still mints an auth key with those credentials | `cp .env.example .env` and fill it in (`cmd/tailbench/main.go:1701-1710`) |
| `no tailnet configured: set tailscale.create_tailnet: true …`, at startup | Neither `create_tailnet: true` nor `tailscale.tailnet_dns_name` is set. Not the `init` default any more — `init` now writes `create_tailnet: true` (`cmd/tailbench/main.go:288-297`) | Set one of them (`internal/orchestrator/orchestrator.go:174-179`) |
| `create tailnet: tailnet creation failed (HTTP 403): {"message":"actor does not have permission to create tailnets"}` | The OAuth client cannot create tailnets. Scope `all` on a tailnet-scoped client is **not** enough; this needs an org-level permission that is not a published scope | Use an org-level client that may create tailnets, or switch to `create_tailnet: false` plus `tailscale.tailnet_dns_name` (`internal/tailnet/tailnet.go:86-88`) |
| The joined tailnet's ACL rules are gone after a run | `SetupACL` replaces the whole policy file with the allow-all benchmark policy (`internal/tailnet/tailnet.go:150-152`, `:160-228`) | Restore from the policy-file version history in the admin console, and point `tailnet_dns_name` at a dedicated benchmark tailnet |
| Devices named `tb-gke-…` or `tailbench-gke-operator` pile up on a joined tailnet | Stale-device cleanup only runs under `create_tailnet: true` | Delete them in the admin console (`internal/orchestrator/orchestrator.go:609-623`) |
| `[TB_PREREQUISITE] … load environment file …: no such file` | `env_file:` names a file that does not exist | Create it, or remove `env_file:` and export the values (`cmd/tailbench/main.go:1413-1430`) |
| `[TB_PREREQUISITE] … gcloud authentication check failed` from `doctor --remote` | No active gcloud account | `gcloud auth login` — and separately `gcloud auth application-default login` |
| `[TB_SAFETY_LIMIT] … no-runnable-work` | Every selected mode/type already has a result, or `--family` matched nothing in the catalog | Delete the result files to re-measure, widen the selector, or use `results RUN_ID` to inspect existing output |
| `[TB_SAFETY_LIMIT] … incompatible-mode: mode "l7-serve-h1" does not apply to kubernetes workloads` | Stock `config.yaml` mode list on a K8s binary | Use container modes: `l4-kernel`, `l4-lb`, `l7-ingress-h1`, `l7-ingress-h2` |
| `[TB_SAFETY_LIMIT] … max-instance-types` | Plan has more pending types than the limit (default 1) | Narrow `--family`/`--filter`, or raise `--max-instance-types` deliberately |
| `[TB_SAFETY_LIMIT] … --yes requires an explicitly configured --max-cost-usd` | Automation without an approved ceiling | Add `--max-cost-usd N` or `max_cost_usd:` in YAML |
| `[TB_CONFIG] … invalid state_backend` / `invalid cleanup_policy` / `max_duration must be greater than zero` | Bad configuration value | Fix the named key; validation is at parse time (`internal/config/config.go:206-225`, `:346-395`) |
| `[TB_PLAN] benchmark mode "tsnet-userspace" is not implemented` | Mode listed in `benchmark.modes` | Remove it (`internal/plan/build.go:63-68`) |
| `[TB_PLAN] invalid instance filter` | Malformed `--filter` regex | Fix the regex |
| `[TB_RECOVERY] invalid run ID "…"` / `run not found` | Typo, or the manifest was deleted | Run IDs are `tb_YYYY-MM-DD_hex`; list `.tailbench/runs/` |
| `[TB_RECOVERY] resource "…" lacks certain cleanup ownership` | Manifest resource is not provably owned by that run | Do not force it; find and delete the resources by their `tailbench_run_id` label |
| `[TB_DURATION_LIMIT]` | Work exceeded `--max-duration` (default 45m) | Raise it; GKE cluster creation alone eats a large share of 45 minutes |
| Nothing happens; a plan is printed instead of a run | `dry_run: true` in the selected config, or `--dry-run` | Both alias to `plan`, even when the subcommand is `run` (`cmd/tailbench/main.go:1395-1411`) |
| Run fails in `SetupNetworking` with a GCP permission/not-found error naming the project | `gcp.project` is still `tailscale-sandbox`, or ADC missing/insufficient. `plan` cannot detect this | Set `gcp.project`; `gcloud auth application-default login`; enable `compute.googleapis.com` and `container.googleapis.com` |
| `get-credentials: … : exit status 1` right after the cluster is created | gcloud cannot fetch credentials (wrong project, missing `container.clusters.get`) | Run the same `gcloud container clusters get-credentials` by hand to see the real message |
| `exec: "gke-gcloud-auth-plugin": executable file not found in $PATH`, or every Kubernetes call fails with an auth error | The kubeconfig gcloud wrote uses an exec credential plugin that is not installed, and `doctor` does not check for it | `gcloud components install gke-gcloud-auth-plugin` |
| Process exits 1 with no output whatsoever | Pulumi's `logging` package `init()` calls `slog.SetDefault`, redirecting the stdlib logger to a discarding handler | `main.restoreStandardLogger()` must run first in `main()` (`cmd/tailbench/main.go:52-61`). Seeing this means that call was moved or removed |
| Any Pulumi operation fails with `exit status 255` | Stale lock file from a crashed run; there is no startup sweep any more | `cleanup RUN_ID --recover-pulumi-locks` for local state; `pulumi cancel` for a remote backend |
| `state_backend is Pulumi Cloud … but no credentials were found` | `pulumi.com` selected without a token | Put `PULUMI_ACCESS_TOKEN` in `.env`, or `pulumi login`. Reported as a run failure with a run ID, since the check runs at orchestrator construction |
| `no configured benchmark mode runs on a kubernetes binary` | Every configured mode is VM-only | Add a container mode. Reachable via `resume`, whose modes come from the manifest rather than from re-evaluated guardrails (`internal/orchestrator/k8s_enabled.go:40-46`) |
| `skip <type> (all mode results exist)` | Filesystem resume — `gke/` already has results for those modes | Delete the specific result files you want re-measured |
| `operator install: … (L7 modes may not work)` | Helm failed; install errors are warnings, not fatal | Check `helm` is on `PATH` and 3.x |
| `skipping mode l4-lb: no endpoint configured` | No matching LoadBalancer Service found | Confirm the operator is running, that `manifests/l7-bench` applied, and that `l7_endpoints.cluster_label` still matches the manifests' `app.kubernetes.io/part-of: tailbench-l7` |
| `wait for nodes: expected 2 ready nodes, timed out` | No capacity or quota for that machine type in the zone | Treated as a quota error, so the whole family is skipped for the rest of the run; try a different zone or family |
| `quota exceeded for <type>, skipping family <family>` | `IsQuotaError` matched | Expected behavior — larger sizes in the family are assumed to also fail. Request quota or narrow `--family` |
| `ProxyGroup <name> statefulset not ready after 5m` | Operator too old for the ProxyGroup CRD, or the ProxyClass re-roll is stuck | `kubectl -n tailscale get proxygroup,statefulset` and check the operator log; the chart is unpinned and floats on latest |
| Panic with a slice-bounds error at startup of `SetupNetworking` | `gcp.zone` has no `-` — a region was written where a zone is required | Use e.g. `us-central1-a`, not `us-central1` (`gke.go:96`) |

Related reading: [running.md](running.md) for shared behavior,
[cost-forward-pps-plan.md](cost-forward-pps-plan.md) for the forwarding-pps
design, and [`../README.md`](../README.md) for the full command and configuration
reference.
