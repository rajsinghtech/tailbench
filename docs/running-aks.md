# Running tailbench on AKS

Operator runbook for the Azure Kubernetes Service variant. It covers only what
`tailbench-azure-k8s` does; see `README.md` for the project overview and
`docs/cost-forward-pps-plan.md` for the forwarding-pps design notes.

## What this binary is

`tailbench-azure-k8s` is the only executable that speaks to AKS. It links the
Azure Pulumi SDK and the Kubernetes code paths, and it accepts exactly one
provider value. Renaming the file does not change its identity: an explicit
`--provider` that does not match is rejected at startup
(`cmd/tailbench/main.go:72-76`).

| Property | Value |
|---|---|
| Binary | `./dist/tailbench-azure-k8s` |
| Build tags | `azure,k8s` |
| Provider value | `aks` (`cmd/tailbench/azure_k8s.go:10`) |
| Environment | `container` — benchmarks run in pods, not VMs (`internal/orchestrator/orchestrator.go:412-415`) |
| Result dir | `aks/<family>/results/<type>-<mode>.json` (`internal/orchestrator/orchestrator.go:663`) |

Unlike the VM variants there is no SSH anywhere in this path. Every command
reaches the workload through the Kubernetes exec subresource
(`internal/k8s/kubeexec.go:74-108`), and the orchestrator picks that route
purely because `PairOutput.Namespace` is non-empty
(`internal/orchestrator/orchestrator.go:562-563`, set at
`internal/provider/aks.go:225`).

## Prerequisites

Four independent things must be present: the Go toolchain to build, the Pulumi
CLI (the Automation API shells out to it), the Kubernetes CLIs, and an
authenticated `az`. `mise.toml` pins all of them and documents why each is
needed; `mise install` provisions the lot.

`az` is not optional even for `--dry-run`: instance discovery goes through
`az vm list-skus` (`internal/provider/azure_instances.go:44-45`), unlike AWS and
GCP which discover through their Go SDKs. `kubectl` is used for `apply -k`
(`internal/k8s/util.go:51`, `internal/k8s/proxygroup.go:66`) and `helm` for the
operator chart (`internal/k8s/operator.go:207-227`).

Verify everything before a run:

```bash
mise install

go version                      # must satisfy the `go` directive in go.mod
pulumi version                  # Automation API shells out to this
kubectl version --client
helm version --short

# Azure CLI: logged in, and pointed at the subscription that owns the RG
az account show --output table

# The resource group must ALREADY EXIST — tailbench never creates it
az group show --name tailbench-rg --output table

# SKU discovery must work in your configured location, or --dry-run fails
az vm list-skus --location eastus --resource-type virtualMachines \
  --query "[?family=='standardDSv4Family'].name" --output tsv | head

# Tailscale credentials (not needed for --dry-run or --version)
test -f .env && grep -E '^OAUTH_CLIENT_(ID|SECRET)=' .env
```

## Build

```bash
make build-azure-k8s      # writes ./dist/tailbench-azure-k8s
```

A bare `go build ./cmd/tailbench/` fails on purpose — the guard files in
`cmd/tailbench` break any build that selects zero or more than one cloud tag.
Compiling the Pulumi SDKs is memory-heavy, so build one variant at a time rather
than `make build`.

Editors need the tag too. Without `-tags=azure,k8s`, gopls reports
`compiledProviderName` and `newCompiledProvider` as undefined and treats
`internal/provider/aks.go` as excluded. `GOFLAGS='-tags=azure,k8s'` in a shell
achieves the same for ad-hoc `go vet` / `go test`.

Verify the flag surface with the built binary:

```bash
./dist/tailbench-azure-k8s --help
./dist/tailbench-azure-k8s --version
```

The full flag list is `-cleanup-networking`, `-config`, `-dry-run`, `-family`,
`-filter`, `-provider`, `-state-backend` (`internal/config/config.go:219-227`).
There is **no `-modes` flag** — benchmark modes come only from `config.yaml`.
`--version` works but is not in the flag list: it is scanned out of `os.Args`
before flag parsing (`cmd/tailbench/main.go:43-49`).

## Credentials

Three systems authenticate independently. A run needs all three; `--dry-run`
needs only Azure.

**1. Tailscale OAuth (`.env`).** `config.yaml` declares `env_file: .env` and
expands `${OAUTH_CLIENT_ID}` / `${OAUTH_CLIENT_SECRET}` into the `tailscale:`
block (`internal/config/config.go:243-258`, `:274-275`). `.env` is gitignored
and absent from a fresh clone, so copy the template:

```bash
cp .env.example .env
$EDITOR .env
```

A missing env file is not fatal — expansion falls back to the process
environment (`internal/config/config.go:248-257`). The OAuth client must be
org-level and able to create tailnets, auth keys, the policy file, and devices;
tailbench creates and deletes real tailnets, so use disposable org credentials.
The check runs only when there is no cached tailnet
(`internal/orchestrator/orchestrator.go:48-78`, called at `:184`).

**2. The Azure CLI.** Both Pulumi's `azure-native` provider and tailbench's own
`az` invocations use the ambient Azure credentials. Nothing in the code sets a
subscription, tenant, or credential — `internal/provider/aks.go:41-53` passes
only the project, backend URL, work dir and an empty
`PULUMI_CONFIG_PASSPHRASE`. So `az login` (or the standard `ARM_*` /
service-principal environment) must already select the right subscription.

Permissions must cover what the code actually does, in the configured resource
group:

- create and delete a `Microsoft.ContainerService` managed cluster with a
  system-assigned identity (`internal/provider/aks.go:59-74`);
- create and delete agent pools on that cluster
  (`internal/provider/aks.go:139-149`, `:266-271`);
- fetch cluster user credentials, which is what `az aks get-credentials` calls
  (`internal/provider/aks.go:101-106`);
- read VM SKUs in the subscription for `az vm list-skus`
  (`internal/provider/azure_instances.go:44-45`).

Once the kubeconfig is in hand, the orchestrator acts as a cluster
administrator: it creates a `tailbench-admin` ClusterRoleBinding granting
`cluster-admin` to the tailnet tag (`internal/k8s/operator.go:169-192`),
installs a Helm release, and creates namespaces, secrets, pods and services.
This runbook deliberately does not prescribe a built-in Azure role — map the
operations above to your organization's model.

**3. The Pulumi state backend.** Only Pulumi Cloud is credential-checked, and it
fails fast at startup rather than partway through provisioning
(`internal/provider/backend.go:59-75`). Object-store backends authenticate
through the same Azure credentials the provider already needs.
`PULUMI_ACCESS_TOKEN` can live in `.env` — the Pulumi CLI inherits tailbench's
environment.

## Configure config.yaml

Only these keys affect this variant.

| Key | Default | Effect if wrong |
|---|---|---|
| `azure.location` | `eastus` (`internal/config/config.go:308`) | Cluster region and the `az vm list-skus --location` argument. A location with no SKUs in the selected family yields an empty instance list and a run that benchmarks nothing. Also recorded as both `region` and `zone` on every result (`internal/orchestrator/orchestrator.go:830-832`). |
| `azure.resource_group` | `tailbench-rg` (`internal/config/config.go:309`) | **Must already exist.** Nothing in the repo creates a resource group — there is no `NewResourceGroup` call anywhere. A missing RG fails the first `stack.Up` with an Azure resource-group error. Teardown never deletes it either. |
| `providers` | `[]` → compiled provider | `[]` resolves to `aks` (`internal/config/config.go:350-352`). Any other value is rejected by `compiledProviderFactory`. |
| `benchmark.modes` | `["l4-kernel"]` when empty (`internal/config/config.go:342-344`) | The only way to select modes. See the mode table below — the shipped `config.yaml` list is VM-oriented and mostly no-ops here. |
| `l7_endpoints.cluster_label` | `app.kubernetes.io/part-of=tailbench-l7` (`internal/config/config.go:297`) | Selects the Ingress, the LoadBalancer Service, and the echo pod used as the L7 baseline (`internal/orchestrator/orchestrator.go:845-879`). It must match the labels in `manifests/l7-bench/*.yaml`; a mismatch silently yields no endpoint and the mode is skipped. |
| `l7_endpoints.ingress_fqdn` | `""` | Overrides Ingress discovery. Leave empty to discover from the cluster. |
| `l7_endpoints.serve_fqdn` | `""` | Irrelevant here — it only feeds `l7-serve-*`, which are VM-only. |
| `azure.ssh_user`, `azure.ssh_pub_key_file` | `azureuser`, autodetected | VM-variant keys. Unused by AKS: there is no SSH in this path. |
| `state_backend` | `""` → local | See the next section. |

The `pps_*` keys under `benchmark:` apply only if you enable the
`forward-pps-exit-k8s*` modes; defaults are supplied by the runner
(`internal/benchmark/runner.go:67-80`).

### Which modes this binary actually runs

`ModeAppliesTo(mode, "container")` decides
(`internal/benchmark/modes.go:43-53`). A K8s binary is permissive: it does
**not** reject VM-only modes — `validateWorkloadConfig` is a no-op in K8s builds
(`internal/orchestrator/k8s_enabled.go:21`), so VM-only modes are silently
skipped at runtime. Only the VM binaries reject the other direction
(`internal/orchestrator/k8s_disabled.go:16-23`).

| Mode | On AKS |
|---|---|
| `l4-kernel` | Runs. iperf3 + MTR, pod IP baseline vs. Tailscale IP. |
| `l4-userspace` | Runs, but see the caveat below. |
| `l4-lb` | Runs. K8s-only. Fortio against the Tailscale LoadBalancer Service. |
| `l7-ingress-h1`, `l7-ingress-h2` | Runs. K8s-only. Fortio against the Tailscale Ingress. |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | Runs. K8s-only. Egress ProxyGroup A/B. |
| `l7-serve-h1`, `l7-serve-h2` | **Silently skipped** — VM-only. |
| `forward-pps-exit`, `relay-throughput` | **Silently skipped** — VM-only. |
| `tsnet-userspace` | Skipped at runtime everywhere: "tsnet runner not yet implemented" (`internal/orchestrator/orchestrator.go:800-802`). |

Two consequences worth internalizing:

- The `modes` list shipped in `config.yaml` is `l4-kernel`, `l7-serve-h1`,
  `l7-serve-h2`. Run it unedited against AKS and only `l4-kernel` executes.
- If **every** configured mode is VM-only, `pendingModesForInstance` returns
  empty for every instance and the run logs `skip <type> (all mode results
  exist)` for all of them (`internal/orchestrator/orchestrator.go:416-420`) —
  which reads like a completed resume, not a misconfiguration.

Caveat on `l4-userspace`: `PodConfig.Userspace` is never set to `true` anywhere
in the repo, so `TS_USERSPACE` is always `false` on the sidecar
(`internal/k8s/pods.go:31`, `:68`; `internal/provider/aks.go:193-205`). The mode
is accepted and writes a result labelled `l4-userspace`, but the sidecar runs in
kernel mode. Treat that result as unverified.

## Choose a state backend

Empty (the default) keeps Pulumi state under `./state/aks`
(`internal/provider/BackendURL`, `internal/provider/backend.go:16-21`, wired at
`cmd/tailbench/azure_k8s.go:13`). That ties the cluster stack to one checkout on
one machine.

| Value | Backend | Consequence |
|---|---|---|
| *(empty)* | `file://<repo>/state/aks` | Stacks invisible from any other checkout or host. An interrupted run on another machine cannot be resumed or torn down from here — the AKS cluster leaks. Stale Pulumi locks are swept automatically on startup. |
| `pulumi.com` | `https://api.pulumi.com` | Stacks survive machine swaps. Needs `PULUMI_ACCESS_TOKEN` or a prior `pulumi login`, checked at startup. No local lock sweep — Pulumi Cloud manages leases. |
| `azblob://…`, `s3://…`, `gs://…` | Object storage | Same portability; authenticates via the cloud credentials already required. No local lock sweep. |
| `file://…` | Explicit path | Same as the default, at a location you choose. |

Both behaviors are in `internal/orchestrator/orchestrator.go:120-148`: a local
backend creates `state/aks` and globs `state/*/.pulumi/locks/*.json`, removing
any leftovers (these are the cause of Pulumi failing with `exit status 255`
after a crash); a remote backend returns before either step.

Stack names are already provider-qualified — `tailbench-aks-cluster`
(`internal/provider/aks.go:56`) and `tailbench-aks-<safeType>`
(`:136`) — so one shared backend safely holds every provider's stacks. Note that
`AKSProvider.StateDir` holds the backend **URL**, not a directory; the local
scratch path Pulumi needs comes from `WorkDir`
(`internal/provider/backend.go:30-38`).

```bash
./dist/tailbench-azure-k8s --state-backend pulumi.com --dry-run
```

## Dry run

```bash
./dist/tailbench-azure-k8s --dry-run
./dist/tailbench-azure-k8s --dry-run --family dsv4
./dist/tailbench-azure-k8s --dry-run --filter '^Standard_D[24]s_v4$'
```

`--dry-run` prints the provider, the configured modes, and every instance type
that `--family` and `--filter` select, then exits without touching any cloud
resource (`internal/orchestrator/orchestrator.go:284-322`). It still calls
`ListInstances`, which shells out to `az vm list-skus`
(`:302` → `internal/provider/azure_instances.go:44`), so **dry run requires a
logged-in `az`** even though it creates nothing. It does not need Tailscale
credentials.

An unrecognized `--family` is rejected with the list of valid families rather
than silently selecting nothing (`internal/orchestrator/orchestrator.go:327-339`).

### Family names are the least guessable part

Azure family selectors are neither Azure VM size names nor the family names that
appear in result paths. Three different strings are involved:

1. **The `--family` selector** — one of twelve fixed strings
   (`internal/provider/azure_instances.go:34-36`).
2. **The Azure SKU family** it maps to, used verbatim in the `az vm list-skus`
   filter (`internal/provider/azure_instances.go:22-27`, `:56-59`).
3. **The result-directory family**, derived per instance type by stripping
   `Standard_`, dropping `_` and `-`, and lowercasing
   (`internal/provider/families.go:16-31`).

| `--family` selector | Azure SKU family | Result-dir family shape |
|---|---|---|
| `dsv5` | `standardDSv5Family` | `d<n>sv5` |
| `dasv5` | `standardDASv5Family` | `d<n>asv5` |
| `dpsv6` | `StandardDpsv6Family` | `d<n>psv6` |
| `dsv4` | `standardDSv4Family` | `d<n>sv4` |
| `fsv2` | `standardFSv2Family` | `f<n>sv2` |
| `fasv6` | `StandardFasv6Family` | `f<n>asv6` |
| `falsv6` | `StandardFalsv6Family` | `f<n>alsv6` |
| `famsv6` | `StandardFamsv6Family` | `f<n>amsv6` |
| `fasv7` | `StandardFasv7Family` | `f<n>asv7` |
| `falsv7` | `StandardFalsv7Family` | `f<n>alsv7` |
| `famsv7` | `StandardFamsv7Family` | `f<n>amsv7` |
| `esv4` | `standardESv4Family` | `e<n>sv4` |

Worked example, verified against results already checked into this repo:
`--family dsv4` queries `standardDSv4Family`, which returns sizes such as
`Standard_D2s_v4`, whose results land in `aks/d2sv4/results/`. Likewise
`Standard_D2ps_v6` → `aks/d2psv6/`. The actual size names come from Azure at
run time, not from tailbench.

Two SKU filters run before you see anything
(`internal/provider/azure_instances.go:66`): constrained-vCPU SKUs (names
matching `[0-9]-[0-9]`, e.g. `Standard_D4-2s_v5`) and any name containing
`is_v` are dropped. The remaining list is sorted by vCPU count ascending, and
vCPUs are parsed from the first digit run in the name
(`internal/provider/azure_instances.go:72`, `:76-83`).

`--filter` is a Go regex matched against the **full Azure size name**, so it
must include the `Standard_` prefix: `--filter '^Standard_D4s_v4$'`, not
`--filter '^d4sv4$'`.

## Run

```bash
# Start small: one instance type, one mode.
./dist/tailbench-azure-k8s --filter '^Standard_D4s_v4$'

# One SKU family.
./dist/tailbench-azure-k8s --family dsv4

# Everything (expensive — read below first).
./dist/tailbench-azure-k8s
```

**Cost scoping matters much more here than on the VM variants.** A VM run
provisions two VMs, benchmarks them, and destroys them. An AKS run additionally
keeps a managed cluster alive: `SetupNetworking` creates the cluster with a
one-node `Standard_B2s` system pool (`internal/provider/aks.go:59-74`) that
persists for the entire run — and beyond it, because the cluster stack is only
destroyed when `--cleanup-networking` is passed
(`internal/orchestrator/orchestrator.go:552-557`). On top of that, every
instance type in the selection creates a **two-node** `bench` agent pool
(`internal/provider/aks.go:139-149`; `Count: 2` because the client and server
pods have hard anti-affinity, `:206`).

So an unfiltered run over all twelve families is: one long-lived cluster, plus
two nodes of every SKU Azure lists in your location, sequentially, plus the
cluster-creation and node-pool-creation latency for each. Scope with `--family`
and `--filter` first, confirm with `--dry-run`, and let a single instance type
finish end-to-end before widening.

Interrupt handling is clean: `main` runs under a SIGINT/SIGTERM-cancelable
context (`cmd/tailbench/main.go:59-60`), and the per-instance loop checks
`ctx.Err()` before each iteration (`internal/orchestrator/orchestrator.go:400-402`).

## What happens during a run

Ordered, with the AKS-specific steps that the VM variants do not have marked.

1. **Logger restore.** `restoreStandardLogger()` runs first in `main`
   (`cmd/tailbench/main.go:36-49`). Pulumi's `logging` package has an `init()`
   that calls `slog.SetDefault`, which also redirects the standard library
   logger into a discarding handler. Without this call every `log.Printf` and
   `log.Fatalf` vanishes and startup failures exit 1 with no output at all.
2. **Config.** `config.yaml` (or `--config`), then `.env`, then CLI flags;
   `state_backend` is normalized and rejected here if unusable
   (`internal/config/config.go:232-267`).
3. **Startup validation.** Unknown mode names, Pulumi Cloud credentials, then
   the provider factory (`internal/orchestrator/orchestrator.go:94-117`).
4. **State backend prep.** Local: create `state/aks`, sweep stale Pulumi locks.
   Remote: skip both (`:120-148`).
5. **Tailnet.** Reuse `.tailbench/tailnet.json` if present, otherwise create a
   new ephemeral tailnet and save it (`:167-203`). The ACL is rewritten on every
   run; the K8s branch additionally adds `tag:k8s`, a `0.0.0.0/0` route
   auto-approver, and the `tailscale.com/cap/kubernetes` impersonation grant
   (`internal/tailnet/tailnet.go:201-220`). **K8s-specific:** on a *newly
   created* tailnet only, HTTPS is enabled for the operator's API-server proxy
   (`internal/orchestrator/orchestrator.go:210-215`).
6. **Auth key + tsnet.** A reusable ephemeral auth key is issued, and the
   orchestrator itself joins the tailnet as `tailbench-orchestrator`
   (`:233-261`).
7. **`SetupNetworking` — K8s-specific.** Pulumi stack `tailbench-aks-cluster`
   creates a `ManagedCluster` with a system-assigned identity and a one-node
   `Standard_B2s` `System` pool. Then `az aks get-credentials --overwrite-existing`
   writes a kubeconfig to a temp file, which is read, base64-encoded, and held
   **in memory only** (`internal/provider/aks.go:95-118`). Finally the
   `tailbench` namespace is created (`:120-126`, `internal/k8s/pods.go:19`).
8. **Stale device cleanup.** Tailnet devices matching `tb-aks-` and
   `tailbench-aks-operator` are removed
   (`internal/orchestrator/orchestrator.go:361-372`).
9. **Operator install — K8s-specific.** `helm repo add` + `helm upgrade --install
   tailscale-operator` into namespace `tailscale`, with
   `apiServerProxyConfig.mode=true`, `allowImpersonation=true`,
   `operatorConfig.hostname=tailbench-aks-operator`, and
   `proxyConfig.defaultTags=tag:bench-service`
   (`internal/k8s/operator.go:207-227`). Before that, a `tailbench-admin`
   ClusterRoleBinding grants `cluster-admin` to the tailnet tag (`:169-192`), and
   any previous operator install is cleaned up (`:101-165`). The run then waits
   up to 10 minutes for `tailbench-aks-operator.<tailnet>.ts.net:443/healthz` to
   answer over tsnet (`:239-272`, `internal/provider/aks.go:325-329`). A failure
   here is a warning, not a fatal error
   (`internal/orchestrator/k8s_enabled.go:51-53`).
10. **Manifest deploy — K8s-specific.** If any `forward-pps-*` mode is
    configured, `kubectl apply -k manifests/proxygroup/base` creates the
    `tailbench-egress` ProxyGroup and the `common` / `common-accept-routes`
    ProxyClasses (`internal/orchestrator/k8s_enabled.go:61-66`,
    `internal/k8s/proxygroup.go:49-67`). If any Fortio mode is configured,
    `kubectl apply -k manifests/l7-bench` creates the `bench-echo` Deployment,
    the `bench-baseline` tools Deployment, a ClusterIP Service, a
    `ingressClassName: tailscale` Ingress, and a
    `loadBalancerClass: tailscale` LoadBalancer Service — all in namespace
    `tailbench` (`internal/k8s/util.go:38-52`, `manifests/l7-bench/`). The run
    then polls up to 3 minutes for the LB FQDN
    (`internal/orchestrator/k8s_enabled.go:76-96`).
11. **Instance discovery.** Cached at `.tailbench/instances/aks-<family>.json`
    (`internal/orchestrator/orchestrator.go:1023-1028`); the cache is bypassed
    and rewritten when `--cleanup-networking` is set (`:1035`). A cache miss
    calls `az vm list-skus`.
12. **Per instance type.** Compute pending modes from existing result files →
    pre-cleanup `DestroyPair` → `CreatePair` → benchmark → `DestroyPair`
    (`:399-546`). `CreatePair` creates the two-node `bench` agent pool with node
    label `tailbench-pool=<safeType>`, waits up to 10 minutes for 2 ready nodes,
    writes the `tailbench-auth` Secret, and deploys the `tb-aks-server-<type>`
    and `tb-aks-client-<type>` pods (`internal/provider/aks.go:139-227`). Each
    pod is a privileged `sysctler` init container plus a `bench` container and a
    `tailscale` sidecar sharing the pod network namespace
    (`internal/k8s/pods.go:34-87`).
13. **Benchmarks — K8s-specific transport.** Four exec executors are built
    (server/client × `bench`/`tailscale` container), plus an optional baseline
    executor found by the fixed label
    `app.kubernetes.io/part-of=tailbench-l7-baseline`
    (`internal/orchestrator/k8s_enabled.go:139-175`). Each mode's result file is
    written as it completes (`internal/orchestrator/orchestrator.go:835-838`).
14. **Aggregate.** A run that reaches the end of the instance loop calls
    `result.Aggregate` automatically (`:548`).
15. **Teardown.** Only with `--cleanup-networking`: `TeardownNetworking`
    destroys the cluster stack (`:552-557`), then the deferred tailnet deletion
    runs (`:219-231`).

Azure materializes the actual node VMs and their supporting infrastructure in
AKS's own node resource group. Tailbench neither names nor manages it — nothing
in `internal/provider/aks.go` references it.

### The forwarding-pps A/B pair

`forward-pps-exit-k8s` and `forward-pps-exit-k8s-opton` measure UDP packets per
second forwarded through the operator's `tailbench-egress` ProxyGroup, with
`TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS` off and on respectively. Each
pass applies the matching kustomize variant (`base` vs `overlays/on`), waits for
the proxy StatefulSet to actually re-roll before measuring, samples the proxy
pod's cgroup CPU during the sweep, and records
`limiting_resource: "proxy-cpu"` if the pod was throttled
(`internal/orchestrator/k8s_enabled.go:181-254`). Each arm writes its own result
file, so an interrupted A/B resumes independently. Topology, sweep methodology,
the honesty rule around `limiting_resource`, and the reproducibility caveats are
in `docs/cost-forward-pps-plan.md`.

## Generate the report

A successful run aggregates automatically. To re-aggregate by hand — after
deleting results, refreshing prices, or copying result files in from another
machine:

```bash
go run ./cmd/aggregate/          # MUST run from the repo root
```

`cmd/aggregate` uses `os.Getwd()` as the root (`cmd/aggregate/main.go:11`), and
`result.Aggregate` walks `gcp`, `aws`, `azure`, `gke`, `eks`, `aks` beneath it
(`internal/result/aggregator.go:15-21`). Run it from anywhere else and it finds
nothing.

Price is derived at aggregation, never stored in the result JSON. Each record is
looked up in the curated dataset, with `aks` aliasing to `azure`
(`internal/pricing/pricing.go:74-85`) and `eastus` as the canonical fallback
region (`:34-38`). Re-pricing all history is therefore just a re-aggregate:

```bash
go run ./cmd/pricing-refresh     # refresh internal/pricing/data.json
go run ./cmd/aggregate/          # re-inject price_per_hour
```

View the dashboard by opening `website/index.html`. It loads
`data.generated.js` via `<script src>`, so `file://` works
(`website/index.html:276`) — but it also loads Chart.js from a CDN
(`website/index.html:275`), so rendering needs internet access.

## Resume and interruption

Resume is filesystem-driven. There is no database and no run journal: work is
skipped if and only if the result file already exists.

- Before provisioning, `pendingModesForInstance` checks
  `aks/<family>/results/<type>-<mode>.json` for each applicable mode and skips
  the whole instance type when none are pending
  (`internal/orchestrator/orchestrator.go:906-927`, `:416-420`).
- Inside the mode loop the same check runs again per mode (`:663-667`).
- `l4-kernel` additionally honors a legacy no-suffix path
  `aks/<family>/results/<type>.json` (`:918-924`).

To re-measure something, delete its result file:

```bash
rm aks/d4sv4/results/Standard_D4s_v4-l4-lb.json
./dist/tailbench-azure-k8s --filter '^Standard_D4s_v4$'
```

Two pieces of cached state survive across runs and are **not** invalidated by
deleting results:

| Cache | Path | Invalidated by |
|---|---|---|
| Tailnet | `.tailbench/tailnet.json` | `--cleanup-networking` only (`:219-231`) |
| Instance list | `.tailbench/instances/aks-<family>.json` | `--cleanup-networking` (`:1035`), or delete the file |

The AKS cluster itself also survives: `SetupNetworking` is an upsert, so a
second run reuses the existing `tailbench-aks-cluster` stack. A crashed run
leaves the cluster and possibly the `bench` node pool behind — the next run's
pre-cleanup `DestroyPair` handles the pool
(`internal/orchestrator/orchestrator.go:489-491`,
`internal/provider/aks.go:230-251`).

## Teardown

**The cluster is the expensive long-lived thing.** Destroying a pair only
removes the two-node `bench` agent pool. The managed cluster and its
`Standard_B2s` system pool keep billing until you explicitly tear them down, and
a normal run never does — `TeardownNetworking` is called only when
`--cleanup-networking` is set (`internal/orchestrator/orchestrator.go:552-557`).

There is no standalone teardown command. `--cleanup-networking` is a flag on a
run, and it does three things: force-reinstall the operator at the *start*
(`internal/orchestrator/k8s_enabled.go:50`), destroy the cluster stack at the
end, and delete the tailnet plus `.tailbench/tailnet.json` in a deferred step
(`internal/orchestrator/orchestrator.go:219-231`).

To tear down without benchmarking anything, pair it with a filter that matches
no instance type. The instance loop then does nothing and teardown still runs:

```bash
./dist/tailbench-azure-k8s --cleanup-networking --filter '^$'
```

Be aware of what that still does: `SetupNetworking` runs first, so if the
cluster is already gone this **creates** one before destroying it; the operator
is reinstalled; and `az vm list-skus` is called because the instance cache is
bypassed.

Verify afterwards, and check the AKS node resource group is gone too:

```bash
az aks list --resource-group tailbench-rg --output table
az group list --query "[?starts_with(name, 'MC_')].name" --output tsv
```

The resource group itself is never deleted by tailbench. Neither are result
files, `website/data.generated.js`, or local Pulumi state under `state/aks` —
remove those by hand if you want a clean slate. `make clean` only removes
`dist/` and `.tools/`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Binary exits 1 with no output whatsoever | Pulumi's `logging` `init()` called `slog.SetDefault`, discarding the standard logger | `restoreStandardLogger()` must be the first statement in `main` (`cmd/tailbench/main.go:41`). If you have added code that runs before it, or that re-enters Pulumi's logger setup, move or remove it. |
| Pulumi fails with `exit status 255` | Stale lock file from a crashed run | On a local backend these are swept at startup (`internal/orchestrator/orchestrator.go:134-146`). On a remote backend they are not — use `pulumi cancel` against the stack. |
| `--dry-run` fails listing instances | `az` not logged in, wrong subscription, or `azure.location` has no SKUs | Dry run still calls `az vm list-skus` (`internal/provider/azure_instances.go:44`). Run the `az account show` / `az vm list-skus` checks from Prerequisites. |
| `unknown azure family: <x>` | `--family` was given a result-dir family (`d4sv4`) or a raw Azure size | Use one of the twelve selectors in the family table (`internal/provider/azure_instances.go:34-36`, `:56-59`). |
| Azure error about the resource group on the first `stack.Up` | `azure.resource_group` does not exist | Create it yourself. Tailbench never creates a resource group. |
| `found 0 instance types to benchmark` | `--filter` does not match Azure's full size names | Filter against `Standard_…`: `--filter '^Standard_D4s_v4$'`. Confirm with `--dry-run`. |
| Every instance logs `skip <type> (all mode results exist)` on a fresh checkout | All configured modes are VM-only, so no mode applies to `container` | Check `benchmark.modes` against the mode table. The shipped `config.yaml` default is VM-oriented. |
| `operator install: … (L7 modes may not work)` | `helm` missing from `PATH`, chart repo unreachable, or the OAuth client lacks scope | Install helm 3 (`mise install`), and confirm the OAuth client can write devices and the policy file. The failure is non-fatal, so the run continues and later L7 modes silently skip. |
| Operator proxy never becomes reachable | HTTPS was never enabled on a *reused* tailnet | `EnableHTTPS` runs only on the branch that creates a new tailnet (`internal/orchestrator/orchestrator.go:210-215`). A `.tailbench/tailnet.json` cached from an earlier VM-only run never got it. Delete the cache (or run `--cleanup-networking` once) to force a fresh tailnet. |
| L7 modes log `no endpoint configured` | Ingress/LB FQDN not discovered | Check `l7_endpoints.cluster_label` matches `manifests/l7-bench/*.yaml`, that the operator is running, and that the 3-minute LB wait was enough (`internal/orchestrator/k8s_enabled.go:76-96`). Set `l7_endpoints.ingress_fqdn` to bypass discovery. |
| L7 baseline missing, only Tailscale numbers recorded | The baseline pod lookup uses a **fixed** label, not `cluster_label` | The selector `app.kubernetes.io/part-of=tailbench-l7-baseline` is hardcoded (`internal/orchestrator/k8s_enabled.go:160`). Keep that label on the `bench-baseline` Deployment if you edit the manifests. |
| `endpoint warm-up failed`, mode skipped | Endpoint not answering within 20 attempts | Warm-up uses `curl -k` for HTTPS, so certificate issues are not the cause (`internal/orchestrator/orchestrator.go:885-891`). Check the echo Deployment and the operator proxy pods. |
| `ProxyGroup statefulset not ready after 5m` | Operator version lacks the ProxyGroup CRD, or the ProxyClass patch was rejected | The chart floats on `latest` (`internal/k8s/operator.go:212-213`). Confirm the operator supports `ProxyGroup`/`ProxyClass`, then re-apply. |
| Node pool creation conflicts with a delete in progress | `cleanupNodePool` deletes with `--no-wait`, so `DestroyPair` returns before the pool is gone (`internal/provider/aks.go:266-271`) | Wait for `az aks nodepool show … --name bench` to stop reporting a provisioning state, then re-run. Only one `bench` pool can exist at a time — the pool name is fixed even though stack names vary per instance type. |
| Bench pods stuck `Pending` | Hard anti-affinity requires two distinct nodes (`internal/provider/aks.go:206`) | The `bench` pool is created with `Count: 2`; confirm both nodes are Ready with label `tailbench-pool=<safeType>`. |
| `quota exceeded for <type>, skipping family <x>` | `IsQuotaError` matched `QuotaExceeded`, `SkuNotAvailable`, `AllocationFailed`, or `Unschedulable` (`internal/provider/aks.go:300-309`) | Request quota, or pick another family. **On Azure the family skip barely helps** — see below. |
| Dashboard shows no new data | `website/data.generated.js` not regenerated, or aggregate run from the wrong directory | `go run ./cmd/aggregate/` from the repo root only (`cmd/aggregate/main.go:11`). |
| Dashboard renders but charts are blank | Chart.js is loaded from a CDN (`website/index.html:275`) | View with internet access. |

One subtlety behind the quota row: the "skip the rest of the family" behavior
keys `skippedFamilies` on `GetInstanceFamily`
(`internal/orchestrator/orchestrator.go:404-408`), which for Azure returns the
*per-size* family (`d4sv4`), not the `--family` selector (`dsv4`). AWS and GCP
derive a family shared by every size in the group, so their skip covers the
whole family; on AKS it effectively skips only that one size. Expect a quota
wall to be hit once per size rather than once per family.
