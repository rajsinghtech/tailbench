# Running tailbench on AKS

Operator runbook for the Azure Kubernetes Service variant. It covers only what
`tailbench-azure-k8s` does; see `README.md` for the project overview,
`docs/running.md` for the command surface shared by all six variants, and
`docs/cost-forward-pps-plan.md` for the forwarding-pps design notes.

## What this binary is

`tailbench-azure-k8s` is the only executable that speaks to AKS. It links the
Azure Pulumi SDK and the Kubernetes code paths, and it accepts exactly one
provider value. Renaming the file does not change its identity: a configured or
`--provider`-supplied value that does not match is rejected while the local plan
is built (`internal/plan/build.go:34-42`), by `doctor`
(`cmd/tailbench/main.go:1555-1573`), and again by the provider factory
(`cmd/tailbench/main.go:1740-1745`).

| Property | Value |
|---|---|
| Binary | `./dist/tailbench-azure-k8s` |
| Build tags | `azure,k8s` |
| Provider value | `aks` (`cmd/tailbench/azure_k8s.go:10`) |
| Workload | `kubernetes` (`cmd/tailbench/main.go:1712-1719`) |
| Environment | `container` — benchmarks run in pods, not VMs (`internal/orchestrator/orchestrator.go:621-624`) |
| Result dir | `aks/<family>/results/<type>-<mode>.json` (`internal/orchestrator/orchestrator.go:1123`) |

Unlike the VM variants there is no SSH anywhere in this path. Every command
reaches the workload through the Kubernetes exec subresource
(`internal/k8s/kubeexec.go:74-108`), and the orchestrator picks that route
purely because `PairOutput.Namespace` is non-empty
(`internal/orchestrator/orchestrator.go:1007-1009`, set at
`internal/provider/aks.go:257`).

### The command surface

The binary is no longer flags-only. `run` is the default when no subcommand is
given (`internal/app/app.go:253-303`).

| Command | Side effects | Purpose |
|---|---|---|
| `init` | writes `config.yaml` and `.env.example` | Seed a checkout safely |
| `run` (default) | **provisions billable Azure resources** | Execute the benchmark |
| `plan` | none | Preview the work, free and offline |
| `doctor` | none | Check local tools |
| `doctor --remote` | read-only cloud calls | Check credentials before committing |
| `status RUN_ID` | none | Read persisted run state |
| `results RUN_ID` | none | Read persisted result metadata and paths |
| `resume RUN_ID` | provisions | Continue only unfinished work |
| `cleanup RUN_ID` | destroys | Tear down what a named run owns |

Failures print a structured block on stderr and exit with a typed status
(`internal/app/types.go:6-12`, rendered by `internal/app/render.go:141-170`):

```text
[TB_PREREQUISITE] stage: doctor
cause: one or more prerequisite checks failed
resources changed: no
next: follow each failed check remediation and rerun doctor
```

| Exit | Meaning |
|---|---|
| 0 | ok |
| 1 | the run failed |
| 2 | usage error |
| 3 | prerequisite missing |
| 4 | refused (guardrail, declined confirmation, `init` would overwrite) |
| 5 | recovery problem (bad run ID, unreadable manifest) |
| 130 | interrupted |

`--output json` emits the same report as machine-readable JSON, `--log-file
PATH` appends redacted progress to a file, and `--quiet` suppresses progress
while leaving confirmations and fatal diagnostics visible
(`internal/app/app.go:199-251`, `:316-354`).

## Prerequisites

`doctor` replaces the hand-rolled checks this section used to list. It reports
only what it actually verifies, and it exits 3 when anything fails
(`cmd/tailbench/main.go:1524-1532`).

```bash
mise install                              # provisions the pinned toolchain

./dist/tailbench-azure-k8s doctor         # local: tools on PATH only
./dist/tailbench-azure-k8s doctor --remote  # adds read-only cloud checks
```

Local `doctor` looks for exactly four executables on `PATH` — `pulumi`, `az`,
`kubectl`, `helm` (`internal/preflight/preflight.go:216-235`, `:84-101`) — and
explicitly does **not** read credential values
(`internal/preflight/preflight.go:103-113`). Typical output:

```text
TAILBENCH DOCTOR — LOCAL CHECKS ONLY
provider: aks
workload: kubernetes
ready: false
[PASSED] pulumi (local): /home/you/.pulumi/bin/pulumi
[FAILED] az (local): executable not found on PATH
  next: install az and ensure it is available on PATH
[PASSED] kubectl (local): /usr/local/bin/kubectl
[PASSED] helm (local): /usr/local/bin/helm
[SKIPPED] credentials (local): credential values are not read during local checks
```

`doctor --remote` first requires `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` to
resolve to non-empty values (`cmd/tailbench/main.go:1492-1500`, `:1701-1710`) —
which means it loads `env_file`, so a missing `.env` fails here — then runs two
read-only commands: `pulumi whoami` and `az account show --query id --output
tsv` (`internal/preflight/remote.go:44-52`, `:98-121`). The subscription ID is
captured into the run manifest; nothing else from those outputs is retained
(`internal/preflight/remote.go:123-151`).

What `doctor` does not cover, and you still have to check yourself:

```bash
go version                      # only needed to build, never to run

# The resource group must ALREADY EXIST — tailbench never creates it
az group show --name tailbench-rg --output table

# SKU discovery must work in your configured location. plan does not need
# this, but a real run does.
az vm list-skus --location eastus --resource-type virtualMachines \
  --query "[?family=='standardDSv4Family'].name" --output tsv | head

# Quota for the SKU family you intend to benchmark, and for a two-node pool
```

## Build

```bash
make build-azure-k8s      # writes ./dist/tailbench-azure-k8s (Makefile:93-95)
```

A bare `go build ./cmd/tailbench/` fails on purpose — the guard files in
`cmd/tailbench` break any build that selects zero or more than one cloud tag.
Compiling the Pulumi SDKs is memory-heavy, so build one variant at a time rather
than `make build`.

Editors need the tag too. Without `-tags=azure,k8s`, gopls reports
`compiledProviderName` and `newCompiledProvider` as undefined and treats
`internal/provider/aks.go` as excluded. `GOFLAGS='-tags=azure,k8s'` in a shell
achieves the same for ad-hoc `go vet` / `go test`.

`--help` and `--version` are answered before any configuration is loaded
(`internal/app/app.go:43-50`), so they work in an empty directory:

```bash
./dist/tailbench-azure-k8s --help
./dist/tailbench-azure-k8s --version
```

Two flag layers exist. `--output`, `--log-file`, and `--quiet` are consumed by
the command boundary and may appear anywhere in the argument list
(`internal/app/app.go:199-251`). Everything else is parsed by the configuration
loader: `-config`, `-provider`, `-family`, `-filter`, `-dry-run`,
`-cleanup-networking`, `-yes`, `-max-cost-usd`, `-max-duration`,
`-max-instance-types`, `-max-concurrent-resources`, `-cleanup-policy`, and
`-state-backend` (`internal/config/config.go:271-284`).

Two things the help text does not tell you:

- **`--state-backend` is real but undocumented in `--help`.** It is registered
  at `internal/config/config.go:283-284` and omitted from the help body at
  `internal/app/app.go:166-181`.
- **There is still no `--modes` flag.** Benchmark modes come only from
  `config.yaml`.

## Credentials

Three systems authenticate independently. `plan`, local `doctor`, `status`,
`results`, `--help`, and `--version` need none of them. `run`, `resume`,
`cleanup`, and `doctor --remote` need all three.

**1. Tailscale OAuth (`.env`).** `config.yaml` declares `env_file: .env` and
expands `${OAUTH_CLIENT_ID}` / `${OAUTH_CLIENT_SECRET}` into the `tailscale:`
block (`internal/config/config.go:160-166`, `:306-315`, `:332-333`). `.env` is
gitignored and absent from a fresh clone, so copy the template `init` writes:

```bash
cp .env.example .env
$EDITOR .env
```

Two behaviors changed here and are worth internalizing:

- **Secrets are loaded only on the execution path.** `config.ParseLocalArgs`
  never opens `env_file` and never expands the secret fields
  (`internal/config/config.go:249-266`, `:304-315`, `:331-334`). That is what
  makes `plan` and local `doctor` credential-free.
- **A missing `env_file` is now fatal for a run.** The loader returns a
  `LoadError` of kind `environment-file` (`internal/config/config.go:311-314`,
  `internal/config/errors.go:8-11`), which the command layer surfaces as
  `TB_PREREQUISITE`, exit 3 (`cmd/tailbench/main.go:1413-1430`). It no longer
  silently falls back to the process environment. Either create the file or
  remove `env_file:` from `config.yaml`.

Both values must be non-empty before the orchestrator is even constructed
(`cmd/tailbench/main.go:935-943`, `:1701-1710`).

*Decide first: create a tailnet, or join one.* Get this right before anything
else — an AKS run that gets it wrong has already paid for a cluster.

**Option A — create an ephemeral tailnet (`create_tailnet: true`).** Tailbench
POSTs to `/api/v2/organizations/-/tailnets`
(`internal/tailnet/tailnet.go:63-104`); the response carries a *per-tailnet*
OAuth client that the orchestrator swaps into the config
(`internal/orchestrator/orchestrator.go:389-390`). The credentials you configure
are therefore used **only** for tailnet create and delete — the ACL, auth keys,
device cleanup, tailnet settings, and the OAuth secret handed to the Tailscale
operator all come from the returned client (`internal/provider/aks.go:369-379`).

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

Two smaller differences on the join path: stale-device cleanup is skipped (the
`tb-aks-` / `tailbench-aks-operator` sweep is inside the `create_tailnet` branch,
`internal/orchestrator/orchestrator.go:609-623`), and no cleanup policy will ever
delete a tailnet tailbench merely joined (`:263-310`).

Either way the client must be able to write auth keys, the policy file, and
devices. Under Option A tailbench creates and deletes real tailnets, so use
disposable org credentials.

**2. The Azure CLI.** Both Pulumi's `azure-native` provider and tailbench's own
`az` invocations use the ambient Azure credentials. Nothing in the code sets a
subscription, tenant, or credential — `internal/provider/aks.go:69-81` passes
only the project, backend URL, work dir and an empty
`PULUMI_CONFIG_PASSPHRASE`. So `az login` (or the standard `ARM_*` /
service-principal environment) must already select the right subscription.

Permissions must cover what the code actually does, in the configured resource
group:

- create and delete a `Microsoft.ContainerService` managed cluster with a
  system-assigned identity (`internal/provider/aks.go:87-103`);
- create and delete agent pools on that cluster
  (`internal/provider/aks.go:172-186`, `:295-325`);
- fetch cluster user credentials, which is what `az aks get-credentials` calls
  (`internal/provider/aks.go:130-140`);
- read VM SKUs in the subscription for `az vm list-skus`
  (`internal/provider/azure_instances.go:41-48`).

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

**No credential-wrapping Make targets for this variant.** The Makefile defines
`plan-aws`, `doctor-aws`, `doctor-aws-remote`, and `bench-aws`, which wrap
`./dist/tailbench-aws` — the AWS *VM* binary — in `esc run` so AWS credentials
come from a [Pulumi ESC](https://www.pulumi.com/docs/esc/) environment while
Tailscale OAuth still comes from `.env` (`Makefile:26`, `:118-137`). The pattern
generalizes and needs no tailbench support, but no AKS targets exist:

```bash
esc run <your-esc-env> -- ./dist/tailbench-azure-k8s doctor --remote
```

## Configure config.yaml

`init` writes a safe starting point into the current directory and refuses to
clobber an existing `config.yaml` or `.env.example` (exit 4,
`cmd/tailbench/main.go:163-256`):

```bash
./dist/tailbench-azure-k8s init
```

The generated file is provider-specific — it pins `providers: [aks]` and an
`azure:` block with `location`, `resource_group`, and `ssh_user`
(`cmd/tailbench/main.go:258-311`) — and it is deliberately non-provisioning:
`dry_run: true`, `max_cost_usd: 10`, `max_duration: 45m`,
`max_instance_types: 1`, `max_concurrent_resources: 1`,
`cleanup_policy: always`. A bare invocation therefore plans instead of running.
`config.example.yaml` at the repository root is the same idea, checked in.

Two defaults in the generated file need attention before an AKS run:

- `create_tailnet: true`, with a commented-out `tailnet_dns_name` alternative
  (`cmd/tailbench/main.go:288-297`). Keep it only if your OAuth client is
  org-level and permitted to create tailnets; otherwise flip it to `false` and
  uncomment `tailnet_dns_name`. Both paths start the tsnet server and mint the
  auth key the operator readiness wait needs
  (`internal/orchestrator/orchestrator.go:230`, `:434-453`;
  `internal/k8s/operator.go:239-253`), so either works for AKS. Setting neither
  is refused at startup (`internal/orchestrator/orchestrator.go:174-179`).
- `benchmark.modes: [l4-kernel]` — correct for AKS, and see the mode rules
  below before adding anything.

Only these keys affect this variant.

| Key | Default | Effect if wrong |
|---|---|---|
| `azure.location` | `eastus` (`internal/config/config.go:450`) | Cluster region and the `az vm list-skus --location` argument. Also recorded as both `region` and `zone` on every result (`internal/orchestrator/orchestrator.go:1340-1343`). The checked-in price catalog only curates `eastus`, so any other location silently falls back to `eastus` prices during `plan` (`internal/pricing/pricing.go:143-146`). |
| `azure.resource_group` | `tailbench-rg` (`internal/config/config.go:451`) | **Must already exist.** Nothing in the repo creates a resource group — there is no `NewResourceGroup` call anywhere. A missing RG fails the first `stack.Up` with an Azure resource-group error. Teardown never deletes it either. |
| `providers` | `[]` → compiled provider | `[]` resolves to `aks` (`internal/config/config.go:495-497`). Any other value is rejected while the plan is built. |
| `benchmark.modes` | `["l4-kernel"]` when empty (`internal/config/config.go:487-489`) | The only way to select modes. See the mode table below — a list containing any VM-only mode is refused. |
| `tailscale.create_tailnet` | `true` in the generated config (`cmd/tailbench/main.go:288-297`) | `true` creates and deletes an ephemeral tailnet, which needs an org-level client permitted to create tailnets. With `tailnet_dns_name` also empty, startup fails; see above. |
| `tailscale.tailnet_dns_name` | `""` (`internal/config/config.go:411`) | With `create_tailnet: false`, joins that tailnet instead of creating one (`internal/orchestrator/orchestrator.go:239-261`), which is how an AKS run works without tailnet-create permission. **The named tailnet's policy file is replaced wholesale** — see [Credentials](#credentials). Ignored when `create_tailnet: true`. |
| `l7_endpoints.cluster_label` | `app.kubernetes.io/part-of=tailbench-l7` (`internal/config/config.go:432`) | Selects the Ingress, the LoadBalancer Service, and the echo pod used as the L7 baseline (`internal/orchestrator/orchestrator.go:1399-1437`). It must match the labels in `manifests/l7-bench/*.yaml`; a mismatch silently yields no endpoint and the mode fails. |
| `l7_endpoints.ingress_fqdn` | `""` | Overrides Ingress discovery. Leave empty to discover from the cluster. |
| `l7_endpoints.serve_fqdn` | `""` | Irrelevant here — it only feeds `l7-serve-*`, which are VM-only. |
| `azure.ssh_user`, `azure.ssh_pub_key_file` | `azureuser`; the key is now generated when the file is unset | VM-variant keys. Unused by AKS: there is no SSH in this path, and `AKSProvider` never calls `ResolveSSHPublicKey` — see below. |
| `ssh.ready_timeout` | `300` seconds (`internal/config/config.go:446`) | VM-variant key. Read only at `internal/orchestrator/orchestrator.go:1085`, inside the SSH benchmark path this binary never reaches. |
| `state_backend` | `""` → local | See the next section. |
| `dry_run` | `false` in `config.yaml`, `true` in the generated one | `true` routes an unqualified invocation to `plan` (`internal/config/config.go:458`, `cmd/tailbench/main.go:1395-1411`). |
| `max_cost_usd` | `10` (`internal/config/config.go:74`) | Guardrail ceiling; `--yes` requires it to be set explicitly here or on the command line. |
| `max_duration` | `45m` (`internal/config/config.go:75`) | Hard timeout on the whole run. Exceeding it is `TB_DURATION_LIMIT`. |
| `max_instance_types` | `1` (`internal/config/config.go:76`) | Refuses a plan with more instance types carrying pending work. |
| `max_concurrent_resources` | `1` (`internal/config/config.go:77`) | Must be at least 1. |
| `cleanup_policy` | `always` (`internal/config/config.go:381`) | `always`, `on-success`, or `manual`. **This now controls whether the cluster is destroyed** — see Teardown. |

The `pps_*` keys under `benchmark:` apply only if you enable the
`forward-pps-exit-k8s*` modes; defaults are supplied by the runner
(`internal/benchmark/runner.go:67-80`).

**No generated SSH key here.** The VM variants now generate an ed25519 key pair
when none is configured and persist the private half to
`.tailbench/ssh/<name>.pem`, so a node whose cloud-init dies before
`tailscale up` is still reachable
(`internal/provider/sshkey.go:87-96`, wired at `internal/provider/azure.go:82-88`
for `tailbench-azure`). `AKSProvider` calls neither `ResolveSSHPublicKey` nor
`EnsureSSHKey` — grep `internal/provider/aks.go` and you will find no SSH at
all. Node pools are created without SSH access and benchmarks run through
`kubectl exec`, so when a node misbehaves the tools are `kubectl describe node`,
`kubectl get events`, and the Azure portal — not an out-of-band SSH session.

### Which modes this binary actually runs

`ModeAppliesTo(mode, "container")` decides applicability
(`internal/benchmark/modes.go:43-53`). Two independent checks now act on it, and
they are not equally permissive:

- `validateWorkloadConfig` (`internal/orchestrator/k8s_enabled.go:30-52`) —
  formerly `return nil` — rejects a list where **no** configured mode applies to
  `container`, and logs the VM-only modes it will skip for a mixed list. It
  deliberately still accepts a mixed list so one `config.yaml` can serve every
  binary.
- **The guardrail layer is stricter, and it runs first.** `guardrail.Check`
  raises an `incompatible-mode` violation for *every* configured mode the plan
  marks not-applicable (`internal/guardrail/guardrail.go:48-62`), and any
  violation refuses the run with `TB_SAFETY_LIMIT`, exit 4
  (`cmd/tailbench/main.go:903-919`).

The practical consequence: on this binary, `benchmark.modes` must contain
**only** container-applicable modes. The repository's own `config.yaml` ships
`l4-kernel, l7-serve-h1, l7-serve-h2`, and `run` refuses it outright. `plan`
still accepts it and labels the two VM-only entries `not-applicable`, so use
`plan` to see exactly which entries to remove.

| Mode | On AKS |
|---|---|
| `l4-kernel` | Runs. iperf3 + MTR, pod IP baseline vs. Tailscale IP. |
| `l4-userspace` | Runs, but see the caveat below. |
| `l4-lb` | Runs. Container-only. Fortio against the Tailscale LoadBalancer Service. |
| `l7-ingress-h1`, `l7-ingress-h2` | Runs. Container-only. Fortio against the Tailscale Ingress. |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | Runs. Container-only. Egress ProxyGroup A/B. |
| `l7-serve-h1`, `l7-serve-h2` | VM-only. `plan` marks them `not-applicable`; `run` refuses the whole list. |
| `forward-pps-exit`, `relay-throughput` | VM-only. Same treatment. |
| `tsnet-userspace` | Rejected while building the plan: "is not implemented; remove it before running" (`internal/plan/build.go:63-68`). |

Caveat on `l4-userspace`: `PodConfig.Userspace` is never set to `true` anywhere
in the repo, so `TS_USERSPACE` is always `false` on the sidecar
(`internal/k8s/pods.go:31`, `:68`; `internal/provider/aks.go:225-237`). The mode
is accepted and writes a result labelled `l4-userspace`, but the sidecar runs in
kernel mode. Treat that result as unverified.

## Choose a state backend

Empty (the default) keeps Pulumi state under `./state/aks`
(`internal/provider/backend.go:16-21`, wired at `cmd/tailbench/azure_k8s.go:14`).
That ties the cluster stack to one checkout on one machine.

| Value | Backend | Consequence |
|---|---|---|
| *(empty)* | `file://<repo>/state/aks` | Stacks invisible from any other checkout or host. An interrupted run on another machine cannot be resumed or torn down from here — the AKS cluster leaks. |
| `pulumi.com` | `https://api.pulumi.com` | Stacks survive machine swaps. Needs `PULUMI_ACCESS_TOKEN` or a prior `pulumi login`, checked at startup (`internal/provider/backend.go:59-75`). |
| `azblob://…`, `s3://…`, `gs://…` | Object storage | Same portability; authenticates via the cloud credentials already required. |
| `file://…` | Explicit path | Same as the default, at a location you choose. |

`internal/orchestrator/orchestrator.go:197-214` shows the only remaining
difference at startup: a local backend creates `state/aks`, a remote backend
skips that and logs that stacks persist across machines. **Stale Pulumi locks
are no longer swept on startup.** Removing them is now an explicit,
manifest-scoped step — see Teardown.

Stack names are provider-qualified and run-scoped —
`tailbench-aks-cluster-<runsuffix>` (`internal/provider/aks.go:46-48`) and
`tailbench-aks-<safeType>-<runsuffix>` (`:50-53`, suffix from
`internal/provider/run_scope.go:8-36`) — so one shared backend safely holds every
provider's and every run's stacks. Note that `AKSProvider.StateDir` holds the
backend **URL**, not a directory; the local scratch path Pulumi needs comes from
`WorkDir` (`internal/provider/backend.go:30-38`).

```bash
./dist/tailbench-azure-k8s plan --state-backend pulumi.com
```

## Plan (dry run)

```bash
./dist/tailbench-azure-k8s plan
./dist/tailbench-azure-k8s plan --filter '^Standard_D[24]s_v4$'
./dist/tailbench-azure-k8s plan --output json
```

`plan` is genuinely side-effect-free. It parses configuration with
`config.ParseLocalArgs`, which does not open `env_file`, expand secrets, or read
SSH keys (`internal/config/config.go:256-266`), and it resolves instance types
from the **checked-in price catalog** rather than from Azure
(`internal/plan/build.go:82-118`, `internal/plan/catalog.go:11-23`,
`internal/pricing.List`). It creates no `.tailbench/`, no `state/`, and no
Pulumi stacks.

**Correcting the previous version of this runbook: `plan` does not need `az`,
and does not need an Azure login.** The old `--dry-run` path called
`ListInstances` and therefore shelled out to `az vm list-skus`; the current one
does not touch Azure at all. `az` is still required for a real `run`, and
`doctor` still checks for it on `PATH`.

`--dry-run` on the command line and `dry_run: true` in YAML are compatibility
aliases that route to `plan` (`internal/app/app.go:273-277`,
`cmd/tailbench/main.go:1395-1411`).

Text output names the provider, region, each configured mode with its
applicability, and every selected instance type with its per-mode action
(`run`, `skip-existing`, `not-applicable`), plus the cost estimate, guardrails,
required tools, and required credentials (`internal/plan/render.go`).

### Family names are the least guessable part

Azure family selectors are neither Azure VM size names nor the family names that
appear in result paths. Three different strings are involved, and on Azure alone
they are not all the same:

1. **The `--family` selector** — one of twelve fixed strings that map to Azure
   SKU families for `az vm list-skus`
   (`internal/provider/azure_instances.go:22-27`, `:34-36`, `:55-59`). This is
   `provider.InstanceFamilyGroup`, the vCPU digit stripped out
   (`internal/provider/families.go:38-71`).
2. **The result-directory family**, derived per instance type by stripping
   `Standard_`, dropping `_` and `-`, and lowercasing, with the vCPU digit
   deliberately kept (`internal/provider/families.go:6-36`).
3. **The Azure SKU family**, used verbatim in the `az vm list-skus` filter.

| `--family` selector | Azure SKU family | Result-dir family |
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

Worked example, verified against results already checked into this repository:
`--family dsv4` selects sizes such as `Standard_D2s_v4`, whose results land in
`aks/d2sv4/results/`. Likewise `--family dpsv6` reaches `Standard_D2ps_v6` →
`aks/d2psv6/`.

`plan` and `run` agree on this vocabulary. The catalog carries both values per
instance — `Family` (per size) and `FamilyGroup` (the group selector), both
derived from `internal/provider` rather than a private copy
(`internal/plan/catalog.go:12-32`, `internal/plan/types.go:15-24`) — and
`selectInstances` matches `--family` against either
(`internal/plan/build.go:158-172`). Before that, `--family dsv4` matched nothing
locally and the guardrails refused the run as `no-runnable-work`.

One asymmetry survives: because `selectInstances` also accepts the per-size
value, `--family d4sv4` plans successfully but then fails at run time, where
`azureFamilyToSKU` has no such key and instance listing returns
`unknown azure family: d4sv4` (`internal/provider/azure_instances.go:55-59`).
**Use the group selector from the table**, or skip `--family` entirely and scope
with `--filter`.

`--filter` is a Go regex matched against the **full Azure size name** in both
stages (`internal/plan/build.go:168-170`,
`internal/orchestrator/orchestrator.go:584-597`), so it must include the
`Standard_` prefix: `--filter '^Standard_D4s_v4$'`, not `--filter '^d4sv4$'`.

One more limitation of the local plan: the catalog currently curates 13 Azure
sizes in `eastus` only (`internal/pricing/data.json`). A filter that matches a
real Azure SKU absent from the catalog resolves to nothing, and `plan` warns
"no matching instances are present in the checked-in local price catalog".
Refresh the catalog with `go run ./cmd/pricing-refresh` if you need more.

At run time two further SKU filters apply before you see anything
(`internal/provider/azure_instances.go:66`): constrained-vCPU SKUs (names
matching `[0-9]-[0-9]`, e.g. `Standard_D4-2s_v5`) and any name containing
`is_v` are dropped. The remaining list is sorted by vCPU count ascending, and
vCPUs are parsed from the first digit run in the name
(`internal/provider/azure_instances.go:72`, `:76-83`).

## Run

```bash
# Start small: one instance type, one mode. Confirm interactively.
./dist/tailbench-azure-k8s run --filter '^Standard_D4s_v4$'

# Noninteractive, with the cost ceiling stated explicitly.
./dist/tailbench-azure-k8s run --filter '^Standard_D4s_v4$' \
  --max-cost-usd 5 --max-duration 60m --yes

# Two instance types requires raising the limit deliberately.
./dist/tailbench-azure-k8s run --filter '^Standard_D[24]s_v4$' \
  --max-instance-types 2 --max-cost-usd 10 --yes
```

The order of operations matters, and is the main safety property of the new
CLI. `run` builds the local plan and evaluates the guardrails **before** any
secret is loaded, any Pulumi state directory is created, or any run manifest is
written (`cmd/tailbench/main.go:899-943`). A refused run leaves the working
directory untouched.

Guardrails and their violation codes (`internal/guardrail/guardrail.go:28-117`):

| Code | Refuses when |
|---|---|
| `no-runnable-work` | No instance type has pending applicable work |
| `incompatible-mode` | Any configured mode does not apply to `container` |
| `noninteractive-cost-required` | `--yes` without an explicit `--max-cost-usd` |
| `max-instance-types` | More pending instance types than the limit (default 1) |
| `cost-estimate-unavailable` | Selected work has no local price |
| `max-cost-usd` | Estimated upper bound exceeds the ceiling (default $10) |
| `max-concurrent-resources` | Limit below 1 |
| `cleanup-policy` | Not `always`, `on-success`, or `manual` |

If the guardrails pass and `--yes` was not given, the run prints a confirmation
block — provider, region, pending instance types against the limit, the exact
instance types and modes, the maximum topology, the duration limit, the
estimated cost upper bound, the ceiling, and the cleanup policy — and waits for
`y` (`internal/guardrail/guardrail.go:119-173`). Anything else is `TB_DECLINED`,
exit 4. The confirmation is written to the non-suppressible channel, so
`--quiet` does not hide it.

**Cost scoping matters much more here than on the VM variants.** A VM run
provisions two VMs, benchmarks them, and destroys them. An AKS run additionally
creates a managed cluster: `SetupNetworking` builds it with a one-node
`Standard_B2s` system pool (`internal/provider/aks.go:87-103`) that lives for
the whole run, and every instance type in the selection adds a **two-node**
`bench` agent pool (`internal/provider/aks.go:172-186`; `Count: 2` because the
client and server pods have hard anti-affinity, `:238`). The local cost estimate
is per-hour times the duration limit and covers only the two benchmark nodes —
it does **not** include the system pool, the AKS control plane, load balancers,
or egress (`internal/plan/build.go:235-274`).

So: scope with `--filter`, confirm with `plan`, and let a single instance type
finish end-to-end before widening. The default `--max-instance-types 1` enforces
exactly that.

Interrupt handling: `main` runs under a SIGINT/SIGTERM-cancelable context
(`cmd/tailbench/main.go:66-68`), the per-instance loop checks `ctx.Err()` before
each iteration (`internal/orchestrator/orchestrator.go:604-607`), and the run is
additionally wrapped in `--max-duration` (`cmd/tailbench/main.go:994-995`).
Cancellation persists recoverable state and exits 130; hitting the duration
limit yields `TB_DURATION_LIMIT` (`cmd/tailbench/main.go:1295-1302`).

## What happens during a run

Ordered, with the AKS-specific steps that the VM variants do not have marked.

1. **Logger restore.** `restoreStandardLogger()` runs first in `main`
   (`cmd/tailbench/main.go:52-62`). Pulumi's `logging` package has an `init()`
   that calls `slog.SetDefault`, which also redirects the standard library
   logger into a discarding handler. Without this call every `log.Printf` and
   `log.Fatalf` vanishes and startup failures exit non-zero with no output.
2. **Command routing.** `--help` / `--version` short-circuit; `--output`,
   `--log-file`, `--quiet` are stripped; the first non-flag argument selects a
   subcommand; `dry_run: true` reroutes the default command to `plan`
   (`internal/app/app.go:35-61`, `:253-303`, `cmd/tailbench/main.go:1395-1411`).
3. **Local plan and guardrails.** Configuration is parsed without secrets, the
   plan is built from the local catalog, and the guardrails either allow the run
   or refuse it with `TB_SAFETY_LIMIT` (`cmd/tailbench/main.go:899-919`).
4. **Execution configuration.** Only now is `env_file` opened, `${VAR}`
   expanded, and the SSH public key looked up; `OAUTH_CLIENT_ID` /
   `OAUTH_CLIENT_SECRET` must be non-empty (`cmd/tailbench/main.go:921-943`).
   `state_backend` is normalized and rejected here if unusable
   (`internal/config/config.go:397-402`).
5. **Confirmation**, unless `--yes`.
6. **Remote preflight.** `pulumi whoami` and `az account show`; a failure is
   `TB_PREREQUISITE`, exit 3, with nothing provisioned
   (`cmd/tailbench/main.go:979-982`, `:1063-1071`).
7. **Run manifest.** A run ID of the shape `tb_YYYY-MM-DD_hex` is generated
   (`internal/runstate/store.go:22`, `:64-73`) and
   `.tailbench/runs/<run-id>/` is created with `manifest.json`,
   `events.jsonl`, `plan.json`, `effective-config.redacted.yaml`,
   `summary.json`, and `logs/tailbench.log`
   (`internal/runstate/store.go:25-32`, `:79-159`). The recorded configuration
   has credentials stripped (`internal/config/snapshot.go:20-44`). Work items
   come straight from the plan, one per instance-type/mode pair
   (`internal/lifecycle/lifecycle.go:642-661`).
8. **Orchestrator construction.** Mode names, Pulumi Cloud credentials, and the
   workload/mode compatibility check, in that order
   (`internal/orchestrator/orchestrator.go:156-179`).
9. **State backend prep.** Local: create `state/aks`. Remote: skip and log
   (`internal/orchestrator/orchestrator.go:197-214`). No lock sweep either way.
10. **Tailnet — one of two branches**
    (`internal/orchestrator/orchestrator.go:230-430`). With
    `create_tailnet: true`, a managed run never reuses `.tailbench/tailnet.json`
    and never writes it (`:278-283`, `:359-361`); it creates
    `tailbench-<run-suffix>` instead (`:314-319`) and swaps in the per-tailnet
    OAuth client the API returned (`:389-390`). With `create_tailnet: false` plus
    `tailnet_dns_name`, nothing is created and the configured client is used
    throughout (`:239-261`).

    The ACL is written on **either** path, **replacing the tailnet's whole policy
    file**; the K8s branch adds `tag:k8s`, a `0.0.0.0/0` route auto-approver, the
    `tailscale.com/cap/kubernetes` impersonation grant, and a grant toward
    `tag:bench-service` (`internal/tailnet/tailnet.go:160-225`).
    **K8s-specific:** HTTPS is enabled for the operator's API-server proxy, gated
    by `needsTailnetHTTPS()`, which is unconditionally true for a K8s provider
    (`internal/orchestrator/orchestrator.go:1606-1615`; call sites `:254-260`,
    `:336-342`, `:420-427`). It used to be applied only where a tailnet was
    created, which is why a joined or cached tailnet could leave the proxy
    unreachable.
11. **Auth key + tsnet.** Shared by both branches: a reusable ephemeral auth key
    is issued, and the orchestrator joins the tailnet as
    `tailbench-orchestrator` with node state under
    `.tailbench/runs/<run-id>/tsnet`
    (`internal/orchestrator/orchestrator.go:434-453`).
12. **`SetupNetworking` — K8s-specific.** Pulumi stack
    `tailbench-aks-cluster-<runsuffix>` creates a `ManagedCluster` with a
    system-assigned identity and a one-node `Standard_B2s` `System` pool, tagged
    with `TailbenchRunID` and `TailbenchExpiresAt`
    (`internal/provider/aks.go:55-67`, `:83-120`). Then `az aks get-credentials
    --overwrite-existing` writes a kubeconfig to a temp file, which is read,
    base64-encoded, and held **in memory only**
    (`internal/provider/aks.go:124-147`). Finally the `tailbench` namespace is
    created (`:149-155`).
13. **Stale device cleanup.** Tailnet devices matching `tb-aks-` and
    `tailbench-aks-operator` are removed — but **only under
    `create_tailnet: true`**; the sweep is inside that branch
    (`internal/orchestrator/orchestrator.go:609-623`).
14. **Operator install — K8s-specific.** `helm repo add` + `helm upgrade
    --install tailscale-operator` into namespace `tailscale`, with
    `apiServerProxyConfig.mode=true`,
    `apiServerProxyConfig.allowImpersonation=true`,
    `operatorConfig.hostname=tailbench-aks-operator`,
    `operatorConfig.defaultTags={<tag>}`, and
    `proxyConfig.defaultTags=tag:bench-service`
    (`internal/k8s/operator.go:195-235`, arguments at `:207-227`). Before that,
    a `tailbench-admin`
    ClusterRoleBinding grants `cluster-admin` to the tailnet tag (`:169-192`),
    and any previous operator install is cleaned up (`:101-165`). The run then
    waits up to 10 minutes for
    `tailbench-aks-operator.<tailnet>.ts.net:443/healthz` to answer over tsnet
    (`internal/k8s/operator.go:239-271`, `internal/provider/aks.go:369-387`).
    **This failure is now fatal**: `setupK8s` collects it and `runProvider`
    returns immediately (`internal/orchestrator/k8s_enabled.go:77-90`,
    `internal/orchestrator/orchestrator.go:574-577`). It used to be a warning
    that let the run continue.
15. **Manifest deploy — K8s-specific.** If a container forward-pps mode is
    configured, `kubectl apply -k manifests/proxygroup/base` creates the
    `tailbench-egress` ProxyGroup and its ProxyClasses
    (`internal/orchestrator/k8s_enabled.go:66-73`, `:100-106`,
    `internal/k8s/proxygroup.go:49-66`). If a container Fortio mode is
    configured, `kubectl apply -k manifests/l7-bench` creates the `bench-echo`
    Deployment, the `bench-baseline` tools Deployment, a ClusterIP Service, a
    `ingressClassName: tailscale` Ingress, and a
    `loadBalancerClass: tailscale` LoadBalancer Service — all in namespace
    `tailbench` (`internal/orchestrator/k8s_enabled.go:57-64`, `:108-115`,
    `internal/k8s/util.go:37-52`). Both helpers now also require
    `ModeAppliesTo(mode, "container")`, so a VM-only Fortio mode such as
    `l7-serve-h1` no longer deploys the L7 manifests for a benchmark that never
    runs. The run then polls up to 3 minutes for the LB FQDN
    (`internal/orchestrator/k8s_enabled.go:117-136`).
16. **Instance discovery.** Cached at `.tailbench/instances/aks-<family>.json`
    (`internal/orchestrator/orchestrator.go:1587-1592`, `:1669-1678`). The cache
    is bypassed whenever `cfg.CleanupNetworking` is true
    (`:1599`), and that is now derived from the cleanup policy
    (`internal/config/config.go:457`) — so under the default
    `cleanup_policy: always` the cache is written but never read, and every run
    calls `az vm list-skus`.
17. **Per instance type.** Compute pending modes from existing result files →
    pre-cleanup `DestroyPair` → `CreatePair` → benchmark → `DestroyPair`
    (`internal/orchestrator/orchestrator.go:603-821`). `CreatePair` creates the
    two-node `bench` agent pool with node labels `tailbench-pool=<safeType>` and
    `tailbench-run=<runsuffix>`, waits up to 10 minutes for 2 ready nodes,
    writes the `tailbench-auth` Secret, and deploys the
    `tb-aks-server-<safeType>-<runsuffix>` and `tb-aks-client-…` pods
    (`internal/provider/aks.go:167-259`). Each pod is a privileged `sysctler`
    init container plus a `bench` container and a `tailscale` sidecar sharing
    the pod network namespace (`internal/k8s/pods.go:34-87`).
18. **Benchmarks — K8s-specific transport.** Four exec executors are built
    (server/client × `bench`/`tailscale` container), plus an optional baseline
    executor found by the fixed label
    `app.kubernetes.io/part-of=tailbench-l7-baseline`
    (`internal/orchestrator/k8s_enabled.go:181-226`). Each mode's result file is
    written as it completes (`internal/orchestrator/orchestrator.go:1345-1350`),
    and each mode's start/finish is recorded in the manifest as a work-item
    transition (`:1104-1115`, `:1128-1131`).
19. **Teardown**, per `cleanup_policy` — see that section.
20. **Aggregate.** Reaching the end of the instance loop calls
    `result.Aggregate` automatically
    (`internal/orchestrator/orchestrator.go:823-826`).

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
(`internal/orchestrator/k8s_enabled.go:229-296`). Each arm writes its own result
file, so an interrupted A/B resumes independently.

The egress Service is now pointed at `pair.ServerName` — the pod's actual
`TS_HOSTNAME`, `tb-aks-server-<safeType>[-<runsuffix>]`
(`internal/provider/aks.go:213`, `:228`) — rather than the orchestrator's
VM-style `tb-aks-s-<type>-<suffix>`, which no pod ever registers and which
therefore resolved to nothing
(`internal/orchestrator/k8s_enabled.go:218-222`, `:255-261`). Topology, sweep
methodology, the honesty rule around `limiting_resource`, and the
reproducibility caveats are in `docs/cost-forward-pps-plan.md`.

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
(`internal/pricing/pricing.go:77-91`) and `eastus` as the canonical fallback
region (`:40-43`, `:122-127`). Re-pricing all history is therefore just a
re-aggregate:

```bash
go run ./cmd/pricing-refresh     # refresh internal/pricing/data.json
go run ./cmd/aggregate/          # re-inject price_per_hour
```

To see which result files a specific run produced, without re-reading the whole
tree, use the manifest-side view:

```bash
./dist/tailbench-azure-k8s results tb_2026-07-28_a1b2c3
```

It prints the run ID, status, cloud subscription, binary version and commit, the
plan hash, and one line per work item with its status and result path
(`internal/summary/report.go:170-249`).

View the dashboard by opening `website/index.html`. It loads
`data.generated.js` via `<script src>`, so `file://` works
(`website/index.html:276`) — but it also loads Chart.js from a CDN
(`website/index.html:275`), so rendering needs internet access.

## Resume and interruption

There are now two layers, and they answer different questions.

**Layer 1 — the run manifest** (`.tailbench/runs/<run-id>/`) records what one
approved run intended, what it changed, and what it still owns. It is versioned
(`schema_version: 1`) and rejected if the schema does not match
(`internal/runstate/store.go:177-184`). Reading it costs nothing:

```bash
./dist/tailbench-azure-k8s status  tb_2026-07-28_a1b2c3
./dist/tailbench-azure-k8s results tb_2026-07-28_a1b2c3
```

`status` prints the run status, benchmark and cleanup outcomes, whether the run
is recoverable, work counts by state, the number of tracked resources, any
recorded failures, and — when recoverable — the exact `status` / `resume` /
`cleanup` commands to use (`internal/summary/report.go:48-144`). Both commands
are pure local readers; an unknown or malformed run ID is `TB_RECOVERY`, exit 5
(`cmd/tailbench/main.go:1329-1393`).

```bash
./dist/tailbench-azure-k8s resume tb_2026-07-28_a1b2c3
./dist/tailbench-azure-k8s resume tb_2026-07-28_a1b2c3 --yes
```

`resume` reloads the credential-free effective configuration recorded for the
run, re-injects the secrets currently in your environment, forces `Yes` and
clears `DryRun`, and narrows the selection to exactly the unfinished work — it
rewrites `--family` to `all` and `--filter` to an anchored alternation of the
affected instance types, restricts modes to those still outstanding, and raises
`max_instance_types` if needed to fit (`cmd/tailbench/main.go:313-437`,
`:861-895`). It refuses with `TB_RECOVERY` if the manifest is not marked
recoverable or nothing is unfinished
(`internal/lifecycle/lifecycle.go:198-201`), and if the manifest's provider does
not match this binary (`cmd/tailbench/main.go:334-344`). Without `--yes` it
prints its own confirmation naming the run ID, provider, unfinished work count,
duration limit, and cleanup policy.

**Layer 2 — result files on disk**, which is still how work is actually skipped
and which is independent of any manifest. A mode is done when its result file
exists:

- Before provisioning, `pendingModesForInstance` checks
  `aks/<family>/results/<type>-<mode>.json` for each applicable mode and skips
  the whole instance type when none are pending
  (`internal/orchestrator/orchestrator.go:1470-1491`, `:625-629`).
- Inside the mode loop the same check runs again per mode, on the suffixed path
  only (`:1123-1127`).
- `l4-kernel` additionally honors a legacy no-suffix path
  `aks/<family>/results/<type>.json` — **as an alternative, not a second
  requirement**. Requiring both made `l4-kernel` permanently pending (no legacy
  file exists in any provider tree), so every rerun provisioned a pair, skipped
  every mode, and destroyed it. Fixed at
  `internal/orchestrator/orchestrator.go:1482-1487`.

`plan` reads the same files and reports satisfied work as `skip-existing`
(`internal/plan/build.go:107-114`, `:178-193`), so the plan and the run now
agree. To re-measure something, delete its result file:

```bash
rm aks/d4sv4/results/Standard_D4s_v4-l4-lb.json
./dist/tailbench-azure-k8s run --filter '^Standard_D4s_v4$'
```

Cached state, and what invalidates it:

| Cache | Path | Status under a managed run |
|---|---|---|
| Tailnet | `.tailbench/tailnet.json` | Neither read nor written. Every run owns a fresh tailnet (`internal/orchestrator/orchestrator.go:278-283`, `:359-361`). |
| Instance list | `.tailbench/instances/aks-<family>.json` | Written, but only read when `cleanup_policy: manual` (`:1596-1607`, `internal/config/config.go:457`). Delete the file to force a refresh. |
| tsnet node state | `.tailbench/runs/<run-id>/tsnet` | Scoped to the run, so concurrent runs cannot corrupt each other (`:449-454`). |

The AKS cluster itself: `SetupNetworking` is an upsert, so re-running the *same*
run ID reuses its `tailbench-aks-cluster-<runsuffix>` stack. A crashed run
leaves the cluster and possibly the `bench` node pool behind — the next run's
pre-cleanup `DestroyPair` handles the pool
(`internal/orchestrator/orchestrator.go:703-707`,
`internal/provider/aks.go:262-292`), and `cleanup RUN_ID` handles the cluster.

## Teardown

**The cluster is still the expensive long-lived thing**, but the default
behavior has inverted. `cleanup_policy` now decides, and it defaults to `always`
(`internal/config/config.go:381`). `cfg.CleanupNetworking` is derived from it —
`cleanupPolicy != "manual"` (`internal/config/config.go:457`) — so
`--cleanup-networking` no longer switches teardown on; it only forces the policy
to `always` (`internal/config/config.go:385-387`).

| `cleanup_policy` | Bench pool | AKS cluster | Run-owned tailnet |
|---|---|---|---|
| `always` (default) | destroyed | destroyed | deleted |
| `on-success` | destroyed only if the benchmark succeeded | same | same |
| `manual` | left running | left running | left running |

The mechanics: `shouldCleanup` gates every destructive step
(`internal/orchestrator/orchestrator.go:841-852`); the pair is destroyed at
`:785-807`, `TeardownNetworking` destroys the cluster stack at `:494-529`, and
the tailnet deletion runs in a deferred block at `:229-273`.

With `manual` — or after any run that failed to clean up — the standalone
command takes over:

```bash
./dist/tailbench-azure-k8s cleanup tb_2026-07-28_a1b2c3
./dist/tailbench-azure-k8s cleanup tb_2026-07-28_a1b2c3 --yes
./dist/tailbench-azure-k8s cleanup tb_2026-07-28_a1b2c3 --recover-pulumi-locks
```

`cleanup` refuses unless **every** uncleaned resource in the manifest is
attributed to that run ID with certain ownership
(`cmd/tailbench/main.go:472-487`); on AKS that holds because the provider
reports run-scoped resources whenever a run ID is set
(`internal/provider/aks.go:43`). It then destroys each recorded instance type's
pair, tears down networking, and deletes any recorded tailnet
(`cmd/tailbench/main.go:642-731`). It needs the same credentials a run does —
`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET` (`:511-521`), plus the remote preflight
(`:588-593`). Unlike `run`, its `--yes` does not require `--max-cost-usd`; no
guardrail is evaluated (`cmd/tailbench/main.go:733-766`).

Note that a fresh `cleanup` process has never called `SetupNetworking`, so it
holds no kubeconfig and no cluster name. Pod deletion and the `az aks nodepool`
fallback are therefore skipped (`internal/provider/aks.go:266-270`, `:296-298`);
the Pulumi stacks still destroy the agent pool and the cluster, which removes
the pods with them.

`--recover-pulumi-locks` replaces the old startup lock sweep. It removes only
lock files under `<state>/aks/.pulumi/locks` whose path names a stack that this
run recorded, refuses symlinks and non-regular files, and refuses any path
outside that root (`internal/recovery/pulumi_locks.go:13-110`). Without
`--yes` it lists the exact paths before asking
(`cmd/tailbench/main.go:555-564`). One caveat: the lock root is derived from
`cfg.StateDir`, which is always `file://<root>/state`
(`internal/config/config.go:460`, `cmd/tailbench/main.go:789-794`), not from
`state_backend`. With a custom `file://` backend or a remote backend, use
`pulumi cancel` against the stack instead.

Verify afterwards, and check the AKS node resource group is gone too:

```bash
az aks list --resource-group tailbench-rg --output table
az group list --query "[?starts_with(name, 'MC_')].name" --output tsv
```

The resource group itself is never deleted by tailbench. Neither are result
files, `website/data.generated.js`, `.tailbench/runs/`, nor local Pulumi state
under `state/aks` — remove those by hand if you want a clean slate. `make clean`
only removes `dist/` and `.tools/` (`Makefile:106-107`).

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `[TB_PREREQUISITE] stage: doctor`, exit 3 | A required executable is missing from `PATH` | Read the `[FAILED]` line; `mise install` provisions `pulumi`, `az`, `kubectl`, and `helm`. |
| `[TB_PREREQUISITE] stage: preflight`, exit 3, before anything is provisioned | `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` empty, or `pulumi whoami` / `az account show` failed | `cp .env.example .env` and fill it in; then `doctor --remote` to isolate which cloud check fails (`cmd/tailbench/main.go:935-943`, `internal/preflight/remote.go:98-121`). |
| `[TB_PREREQUISITE]` naming `load environment file` | `env_file:` points at a file that does not exist | A missing env file is fatal now, not a fallback. Create it or drop `env_file:` (`internal/config/config.go:311-314`, `cmd/tailbench/main.go:1418-1428`). |
| `[TB_SAFETY_LIMIT] … incompatible-mode`, exit 4 | `benchmark.modes` contains a VM-only mode | Remove `l7-serve-*`, `forward-pps-exit`, `relay-throughput` from the list for this binary. The repo's own `config.yaml` trips this. Confirm with `plan`, which labels them `not-applicable` (`internal/guardrail/guardrail.go:48-62`). |
| `[TB_SAFETY_LIMIT] … no-runnable-work`, exit 4 | Every selected instance/mode pair is already satisfied, or the family/filter matched nothing in the local catalog | Check `plan` output. Delete a result file to re-measure, widen `--filter`, or drop `--family` (`internal/guardrail/guardrail.go:41-47`). |
| `[TB_SAFETY_LIMIT] … max-instance-types` or `max-cost-usd` | The plan exceeds a deliberate ceiling | Narrow `--filter`, or raise `--max-instance-types` / `--max-cost-usd` explicitly. Both defaults are conservative on purpose. |
| `[TB_SAFETY_LIMIT] … noninteractive-cost-required` | `--yes` without an explicit cost ceiling | Add `--max-cost-usd`, or set `max_cost_usd:` in `config.yaml` (`internal/guardrail/guardrail.go:63-69`). |
| `[TB_CONFIG] stage: configuration`, exit 2 | Bad flag, unreadable/unparseable `config.yaml`, invalid `state_backend`, `max_duration`, or `cleanup_policy` | The cause names the offending value (`cmd/tailbench/main.go:1203-1214`, `internal/config/config.go:206-225`, `:346-395`). |
| `[TB_RECOVERY]`, exit 5 | Unknown or malformed run ID, unreadable manifest, provider mismatch, or nothing left to resume | Run IDs look like `tb_YYYY-MM-DD_hex`; list `.tailbench/runs/` (`internal/runstate/store.go:22`, `cmd/tailbench/main.go:1379-1393`). |
| Binary exits non-zero with no output whatsoever | Pulumi's `logging` `init()` called `slog.SetDefault`, discarding the standard logger | `restoreStandardLogger()` must be the first statement in `main` (`cmd/tailbench/main.go:61`). If you added code that runs before it, or that re-enters Pulumi's logger setup, move or remove it. |
| Pulumi fails with `exit status 255` | Stale lock file from a crashed run | Locks are no longer swept at startup. Use `cleanup RUN_ID --recover-pulumi-locks` for a local default backend, or `pulumi cancel` for a remote or custom backend. |
| `unknown azure family: <x>` while listing instances, after `plan` succeeded | `--family` was given the per-size result-dir family (`d4sv4`) or a raw Azure size. `plan` accepts both the per-size and the group value; SKU discovery accepts only the group value | Use one of the twelve group selectors from the family table (`dsv4`, not `d4sv4`), or use `--filter` instead (`internal/provider/azure_instances.go:22-27`, `:55-59`). |
| Azure error about the resource group on the first `stack.Up` | `azure.resource_group` does not exist | Create it yourself. Tailbench never creates a resource group. |
| `plan` warns "no matching instances are present in the checked-in local price catalog" | The filter or family matched nothing the catalog knows | The catalog curates 13 `eastus` Azure sizes. Widen the filter or run `go run ./cmd/pricing-refresh` (`internal/plan/build.go:146-151`). |
| `setup kubernetes workload: install Tailscale operator: …` ends the run | `helm` missing, chart repo unreachable, the OAuth client lacks scope, or the proxy never became reachable | This is fatal now, not a warning (`internal/orchestrator/orchestrator.go:574-577`). Confirm helm 3, and that the OAuth client can write devices and the policy file. |
| Operator proxy never becomes reachable | HTTPS not enabled, or DNS/tsnet trouble | `EnableHTTPS` now runs on all three tailnet paths — create, cached reuse, and join — because `needsTailnetHTTPS()` is unconditionally true for a K8s provider (`internal/orchestrator/orchestrator.go:1606-1615`; call sites `:254-260`, `:336-342`, `:420-427`). If the proxy still never answers, check the operator pods and that `tag:k8s` and the impersonation grant landed in the ACL (`internal/tailnet/tailnet.go:170-220`). |
| `no tailnet configured: set tailscale.create_tailnet: true …`, at startup | Neither `create_tailnet: true` nor `tailscale.tailnet_dns_name` is set. Not the `init` default any more — `init` now writes `create_tailnet: true` (`cmd/tailbench/main.go:288-297`) | Set one of them (`internal/orchestrator/orchestrator.go:174-179`). |
| `create tailnet: tailnet creation failed (HTTP 403): {"message":"actor does not have permission to create tailnets"}` | The OAuth client cannot create tailnets. Scope `all` on a tailnet-scoped client is **not** enough; this needs an org-level permission that is not a published scope | Use an org-level client that may create tailnets, or switch to `create_tailnet: false` plus `tailscale.tailnet_dns_name` (`internal/tailnet/tailnet.go:86-88`). |
| The joined tailnet's ACL rules are gone after a run | `SetupACL` replaces the whole policy file with the allow-all benchmark policy (`internal/tailnet/tailnet.go:150-152`, `:160-228`) | Restore from the policy-file version history in the admin console, and point `tailnet_dns_name` at a dedicated benchmark tailnet. |
| Devices named `tb-aks-…` or `tailbench-aks-operator` pile up on a joined tailnet | Stale-device cleanup only runs under `create_tailnet: true` | Delete them in the admin console (`internal/orchestrator/orchestrator.go:609-623`). |
| L7 modes log `no endpoint configured or discovered` | Ingress/LB FQDN not discovered | Check `l7_endpoints.cluster_label` matches `manifests/l7-bench/*.yaml`, that the operator is running, and that the 3-minute LB wait was enough (`internal/orchestrator/k8s_enabled.go:117-136`). Set `l7_endpoints.ingress_fqdn` to bypass discovery. |
| L7 baseline missing, only Tailscale numbers recorded | The baseline pod lookup uses a **fixed** label, not `cluster_label` | The selector `app.kubernetes.io/part-of=tailbench-l7-baseline` is hardcoded (`internal/orchestrator/k8s_enabled.go:202`). Keep that label on the `bench-baseline` Deployment if you edit the manifests. |
| `endpoint warm-up failed`, mode skipped | Endpoint not answering within 20 attempts | Warm-up uses `curl -k` for HTTPS, so certificate issues are not the cause (`internal/orchestrator/orchestrator.go:1439-1458`). Check the echo Deployment and the operator proxy pods. |
| `ProxyGroup statefulset not ready after 5m` | Operator version lacks the ProxyGroup CRD, or the ProxyClass patch was rejected | The chart is installed with no `--version` pin, so it floats on whatever the repo serves (`internal/k8s/operator.go:207-227`). Confirm the operator supports `ProxyGroup`/`ProxyClass`, then re-apply. |
| Node pool creation conflicts with a delete in progress | `cleanupNodePool` deletes with `--no-wait`, so `DestroyPair` returns before the pool is gone (`internal/provider/aks.go:315-322`) | Wait for `az aks nodepool show … --name bench` to stop reporting a provisioning state, then re-run. Only one `bench` pool can exist per cluster — the pool name is fixed even though stack names vary. |
| Bench pods stuck `Pending` | Hard anti-affinity requires two distinct nodes (`internal/provider/aks.go:238`) | The `bench` pool is created with `Count: 2`; confirm both nodes are Ready with label `tailbench-pool=<safeType>`. |
| `quota exceeded for <type>, skipping family <x>` | `IsQuotaError` matched `QuotaExceeded`, `SkuNotAvailable`, `AllocationFailed`, or `Unschedulable` (`internal/provider/aks.go:355-364`) | Request quota, or pick another family. The skip is now group-wide — see below. |
| A run reports `succeeded` but nothing new appeared in `aks/` | Every configured mode was already satisfied | Guardrails should refuse this first (`no-runnable-work`); if it slipped through, check `results RUN_ID` for `skipped` work items. |
| Dashboard shows no new data | `website/data.generated.js` not regenerated, or aggregate run from the wrong directory | `go run ./cmd/aggregate/` from the repo root only (`cmd/aggregate/main.go:11`). |
| Dashboard renders but charts are blank | Chart.js is loaded from a CDN (`website/index.html:275`) | View with internet access. |

**The quota-skip defect is fixed.** The skip map is now keyed on
`provider.InstanceFamilyGroup` (`internal/orchestrator/orchestrator.go:609-617`,
`:744-746`), which for Azure strips the vCPU digit run to yield the group-wide
selector: `Standard_D4s_v4` → group `dsv4`. A denial on one size therefore skips
every remaining size in that SKU family, matching AWS and GCP. `GetInstanceFamily`
still returns the *per-size* value (`d4sv4`) because result paths depend on it —
`aks/d2sv4/`, `aks/d4psv6/` are committed in this repository. The two values are
deliberately different; see the comments at `internal/provider/families.go:16-19`
and `:38-46`.
