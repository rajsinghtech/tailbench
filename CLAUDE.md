# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Tailbench measures Tailscale network overhead by provisioning VM/K8s pairs across
GCP, AWS, and Azure, running benchmarks (iperf3, MTR, fortio) over baseline LAN
vs. Tailscale CGNAT, and publishing results to a static dashboard. See `README.md`
for user-facing usage, flags, and environment variables.

## One Binary Per Cloud (read this before building)

`cmd/tailbench` **requires exactly one cloud build tag** — `aws`, `azure`, or `gcp`,
optionally plus `k8s`. A bare `go build ./cmd/tailbench/` fails on purpose: the
guard files `invalid_no_cloud.go` / `invalid_multiple_clouds.go` reference an
undefined symbol so a mis-tagged build breaks at compile time rather than
producing a binary with the wrong provider. Six variants result:

| Binary | Tags | Provider |
|---|---|---|
| `tailbench-aws` | `aws` | `aws` |
| `tailbench-aws-k8s` | `aws,k8s` | `eks` |
| `tailbench-azure` | `azure` | `azure` |
| `tailbench-azure-k8s` | `azure,k8s` | `aks` |
| `tailbench-gcp` | `gcp` | `gcp` |
| `tailbench-gcp-k8s` | `gcp,k8s` | `gke` |

The tag selects which `internal/provider/<cloud>.go` compiles, and **every Pulumi
import lives behind those tags**. `compiledProviderName` and
`newCompiledProvider` come from the tagged file in `cmd/tailbench`.
`scripts/verify-deps.sh` and `scripts/verify-binary.sh` enforce that no binary
links a foreign cloud SDK.

**gopls needs a tag.** Without one it reports `compiledProviderName` /
`newCompiledProvider` as undefined and treats every `internal/provider/<cloud>.go`
as excluded — all false positives. `.vscode/settings.json` pins `-tags=aws`; edit
the tag there to work on another variant. For other editors or a shell session,
`GOFLAGS=-tags=aws` achieves the same (verified: a command-line `-tags` still
overrides `GOFLAGS`, so this does not interfere with `make build-gcp`).

## Pulumi Hijacks the Standard Logger (must-know)

`pulumi/sdk/v3/go/common/util/logging` declares `primary slog.Handler =
discardHandler{}` and has an **`init()`** that calls `slog.SetDefault`. Go's
`slog.SetDefault` also redirects the standard library logger — `log.SetOutput` to
an slog `handlerWriter`, plus `log.SetFlags(0)`. Pulumi's own CLI configures that
handler from its flags; the Automation API never does, so it stays discarding.

Consequence in any Pulumi-linked binary — which is all six: **every `log.Printf`
and `log.Fatalf` is silently dropped.** Startup failures exit 1 with no output at
all, `logger.Logger` (which wraps `log.Printf`) emits nothing, and
`optup.ProgressStreams(log.Writer())` streams into the discarding writer.
`fmt.Printf` is unaffected, which is why `--dry-run` output appeared while
everything else vanished.

`main.restoreStandardLogger()` undoes this and **must run first in `main()`**,
before anything logs. Do not remove it, and be aware that any future call into
Pulumi code that re-runs `rebuildLogger()` would re-break logging.

## Build, Test, Lint

The Makefile is the supported interface. The repository contains six large,
mutually exclusive cloud SDK graphs. A normal developer workstation must
compile, test, or lint at most one provider variant.

```bash
# Read target names; this does not compile provider graphs.
make help

# Examples: choose one variant, do not run this whole block.
make build-aws
make test-aws
make lint-aws
make verify-deps VARIANT=aws
```

Before starting any build, test, lint, dependency download, or release command,
name the exact single target and obtain explicit user approval. A single target
must run only on a machine sized for its SDK graph. `make lint-<variant>` may
download the pinned linter when it is absent, and Go may download missing
modules.

Never run `make build`, `make test`, `make lint`, an untagged repository-wide Go
equivalent, or a hand-written all-variant loop on a normal workstation. Those
operations belong in CI or on a dedicated build host. Never use
`go run ./cmd/tailbench` as an ad-hoc diagnostic command because it hides a full
tagged compilation behind the invocation.

`make fmt` checks formatting without compiling a provider graph.
`make test-website` runs only the Node.js dashboard tests. Agents still need
approval before starting any test command.

- **Go 1.26.5** is required by `go.mod`; `mise.toml` pins the same version, so
  bump both together.
- `mise.toml` also pins Node, golangci-lint, and the CLIs the code shells out to
  at run time (`pulumi`, `kubectl`, `helm`, `aws`, `gcloud`, `az`). It defines no
  tasks — the Makefile is the task runner.
- The repo has its own **`.golangci.yml`** (schema `version: "2"`, `default: none`
  plus an explicit enable list). Do not swap in a different linter binary — the
  Makefile pins v2.11.4 into `.tools/bin` and `make lint-*` invokes that path
  directly, so a `golangci-lint` elsewhere on `PATH` is not what CI runs.
- The Tailscale live E2E test (`internal/tailnet/tailnet_e2e_test.go`) is gated by
  `TS_OAUTH_CLIENT_ID` and `TS_OAUTH_CLIENT_SECRET`. When present, the test creates
  and deletes a real ephemeral tailnet. Keep those variables absent during
  ordinary tests. Run the live test only with explicit approval and disposable
  organization credentials.

If a long-running command is interrupted, verify its recorded process group and
compiler descendants are gone before reporting it stopped. See `CONTRIBUTING.md`
for the checklist and process-inspection guidance.

## Module Path Gotcha

The Go module is `github.com/rajsinghtech/tailbench` (declared in `go.mod`), but
this checkout lives under a `rshade/tailbench` directory (a fork). **All internal
imports use the `rajsinghtech` path** — do not rewrite import paths to match the
directory.

## Running

Each tagged binary reads `config.yaml` by default. The `plan` command and the
compatibility `--dry-run` flag use `config.ParseLocalArgs`: they do not open
`env_file`, expand secrets, inspect SSH keys, initialize Pulumi or Tailscale,
call cloud APIs, create state directories, or remove locks. A YAML
`dry_run: true` value takes the same path, including when the user spells the
command as `run`.

`doctor` performs local tool and configuration checks. `doctor --remote` is the
explicit credential-loading, read-only remote-check path. `run`, or the legacy
no-subcommand invocation with `dry_run: false`, is the provisioning path. It
evaluates the local plan and guardrails before loading secrets, requires an
interactive confirmation or `--yes`, and requires an explicit cost ceiling
with `--yes`. Approved runs persist under `.tailbench/runs/<run-id>/`; `status`
and `results` are local readers, while `resume` and `cleanup` operate on the
same named manifest.

An explicit `--provider` must match the binary's compiled provider or startup
fails — renaming the executable does not change its identity.

## Architecture

The entry point (`cmd/tailbench/main.go`) identifies the compiled provider and
delegates command parsing, output, and exit mapping to `internal/app`. Local
planning lives in `internal/plan`; prerequisite checks live in
`internal/preflight`. Only the approved execution path resolves secrets,
constructs the provider-backed orchestrator, and calls `Run(ctx)` under a
SIGINT/SIGTERM-cancelable context.

### The orchestrator loop (read this first)

`orchestrator.Run` → `runProvider` (one per provider, run in parallel goroutines when
multiple providers) drives the whole benchmark. For each provider it:

1. Sets up **networking** (long-lived Pulumi stack, reused across runs).
2. For K8s providers, installs the Tailscale operator and deploys L7 bench manifests.
3. Lists instance types (disk-cached in `.tailbench/instances/<provider>.json`).
4. For each instance type: pre-cleanup → `CreatePair` (ephemeral Pulumi stack) →
   run benchmarks → `DestroyPair` → next type.
5. Aggregates all results into `website/data.generated.js`.

Two invariants that shape most of the code:

- **Resume is filesystem-driven.** There is no database. `pendingModesForInstance`
  and `runModeLoop` skip work by checking for existing
  `<provider>/<family>/results/<type>-<mode>.json` files. Runs are idempotent and
  interruptible. `l4-kernel` also honors a legacy no-suffix path (`<type>.json`) for
  backward compatibility — preserve this when touching result paths.
- **Quota errors skip the rest of a family.** When `provider.IsQuotaError(err)` is
  true during `CreatePair`, the whole family is marked skipped for the remainder of
  the run (larger instances in the same family will also be over quota).

### Provider abstraction

`internal/provider/provider.go` defines the `Provider` interface (the seam every cloud
implements): `SetupNetworking`, `CreatePair`, `DestroyPair`, `TeardownNetworking`,
`ListFamilies`, `ListInstances`, `GetVCPUs`, `IsQuotaError`. Implementations:

Each implementation file carries a build tag, so exactly one compiles into a given
binary and the other clouds' Pulumi SDKs are never linked:

- **VM providers**: `gcp.go`, `aws.go`, `azure.go` — provision 2 identical VMs via
  Pulumi Automation API; benchmarks run over native Go SSH (through tsnet).
- **K8s providers**: `gke.go`, `eks.go`, `aks.go` — additionally implement the
  optional `K8sOperatorProvider` interface (install operator, expose API-server-proxy
  FQDN). Benchmarks run via `kubectl exec` (`internal/k8s/kubeexec.go`), NOT SSH.
  `PairOutput.Namespace != ""` is how the orchestrator detects a K8s pair and routes
  to `runK8sBenchmark`.

`families.go` maps instance types → families and holds **two** derivations that are
easy to confuse: `GetInstanceFamily` is the *result-path* family (per size on Azure:
`Standard_D4s_v4` → `d4sv4`) and `InstanceFamilyGroup` is the *selector and quota*
group (`dsv4`). `--family`, `ListFamilies`, and the quota-skip key use the group; the
result path uses the per-size value. Adding a third caller means picking one deliberately.

Two Pulumi stack lifecycles: **networking** stacks are long-lived (per provider,
created once, no-op on subsequent runs); **VM-pair** stacks are ephemeral (per instance
type, created and destroyed each iteration).

**State backend is configurable** via `state_backend:` / `--state-backend`
(`internal/provider/backend.go`):

- Empty (default) → `file://<root>/state/<provider>`, per provider.
- `pulumi.com` → normalized to `https://api.pulumi.com`; `s3://`, `gs://`, `azblob://`,
  and explicit `file://` URLs also work. Remote backends skip the local state
  `MkdirAll` — the service manages its own leases.

Stale Pulumi lock files from a crashed run are **not** swept at startup. Removing
them is an explicit, manifest-scoped recovery action:
`cleanup <run-id> --recover-pulumi-locks`, which only removes locks belonging to
stacks the named run recorded (`internal/recovery/pulumi_locks.go`).

Two things keep this simple: **stack names are already provider-qualified**
(`tailbench-<provider>-*`), so one shared backend holds every provider's stacks without
collision; and **`WorkDir` is decoupled from the backend URL** — Pulumi always needs a
real local path for project/stack settings, so remote backends get scratch space under
`.tailbench/pulumi/<provider>`. The `Provider.StateDir` field holds the *backend URL*,
not a directory, despite the name.

Validation is front-loaded: `config.normalizeStateBackend` rejects unusable values at
parse time, and `provider.CheckBackendCredentials` fails at startup when Pulumi Cloud is
selected without `PULUMI_ACCESS_TOKEN` or `~/.pulumi/credentials.json`.

### Tailnet identity and credentials

**Two OAuth identities, and conflating them is the recurring bug.** The client from
config reaches `tailnet.Manager.OrgClientID/OrgClientSecret` and is used *only* by
`getOrgToken` → `CreateTailnet` / `DeleteTailnet` (`internal/tailnet/tailnet.go:29`,
`:63`, `:107`). `CreateTailnet` returns a **per-tailnet** OAuth client, which the
orchestrator writes back over `cfg.OAuthClientID/Secret`
(`internal/orchestrator/orchestrator.go:323`, `:389`); `SetupACL`, `EnableHTTPS`,
`CreateAuthKey`, and `CleanupStaleDevices` all run with that one. Tailnet creation needs
an organization-level permission that is **not** a published Tailscale scope — a
tailnet-scoped client with scope `all` still gets `403 actor does not have permission to
create tailnets` — so the deployment choice is an org-level client, or
`create_tailnet: false` + `tailscale.tailnet_dns_name`.

**Three tailnet paths converge on one auth-key step.** Anything tailnet-wide has to be
asserted on all three, or it silently applies to some runs only:

1. **Join** (`orchestrator.go:239`) — `create_tailnet: false` + `tailnet_dns_name`.
   No create, no delete, no `ResourceRecord`, and the cleanup defer is deliberately
   skipped. Before `tailnet_dns_name` existed, `create_tailnet: false` had nothing to
   join and every instance failed with "auth key is empty".
2. **Reuse** (`orchestrator.go:312`) — a cached `.tailbench/tailnet.json`. Manifest
   runs (`RunID != ""`) never reuse; cleanup ownership would be ambiguous.
3. **Create** (`orchestrator.go:342`) — the ephemeral tailnet.

`New()` refuses a config with neither setting (`orchestrator.go:174`) rather than letting
the failure land after the networking stack is already built.

`SetupACL` **replaces the whole policy file** (`internal/tailnet/tailnet.go:150`,
`buildACL` at `:160`) — on the join path exactly as on the create path. Never suggest
pointing tailbench at a shared tailnet.

`needsTailnetHTTPS() = hasK8sProviders() || hasL7ServeMode(modes)`
(`orchestrator.go:1614`). It is deliberately not K8s-only: cloud-init's
`tailscale serve --https=443` blocks forever when the tailnet has HTTPS disabled, so a VM
run with `l7-serve-*` hangs until `ssh.ready_timeout` fires.

### Benchmark modes

`internal/benchmark/modes.go` is the mode registry. A **mode** (e.g. `l4-kernel`,
`l4-lb`, `l7-ingress-h1`, `l7-serve-h2`, `tsnet-userspace`) determines which tool runs
and where it applies:

- `ModeUsesIperf` (l4-kernel/userspace) → `Runner.RunFull` (iperf3 + MTR).
- `ModeUsesFortio` (l4-lb, l7-*) → `Runner.RunFortio` (HTTP load, L7 overhead).
- `ModeAppliesTo(mode, env)` gates modes by environment: `l4-lb`/`l7-ingress` only
  run in `container` (K8s), `l7-serve` only in `vm`. `runModeLoop` iterates configured
  modes and skips inapplicable or already-done ones.

Endpoint resolution for L7 modes lives in `resolveEndpoints` — ingress/LB FQDNs are
discovered from the cluster (`internal/k8s`), serve URLs are built from the tailnet
DNS name. Baselines deliberately use pod/LAN IPs because the Tailscale sidecar hijacks
DNS inside bench pods.

### Supporting packages

- `internal/app` — shared command routing, stable exits, diagnostics, progress
  routing, and text/JSON report boundary.
- `internal/config` — staged YAML + CLI merge. Local parsing deliberately leaves
  secrets unresolved; execution parsing loads `env_file` and SSH material.
- `internal/plan` — deterministic, serializable local plans built from config,
  provider identity, checked-in prices, benchmark modes, and existing results.
- `internal/preflight` — local prerequisite probes and explicit read-only remote
  CLI checks.
- `internal/tailnet` — Tailscale v2 API: create/delete ephemeral tailnets, auth keys,
  ACLs, stale-device cleanup. Tailnet state is cached in `.tailbench/tailnet.json` and
  reused across runs (only deleted with `--cleanup-networking`).
- `internal/cloudinit` — embedded `setup.sh.tmpl` (Go `embed`); installs Tailscale,
  iperf3, mtr, fortio and applies Tailscale performance tuning (UDP GRO, BBR, CPU
  governor). Rendered per-VM in the orchestrator.
- `internal/sshclient` — SSH over the tsnet interface, with retry and wait-for-ready.
  `WaitForReady` takes its own bound from `ssh.ready_timeout` (default 300s,
  `internal/config/config.go:446`) instead of inheriting only the whole-run deadline, and
  its timeout error names the recipe — key under `.tailbench/ssh/`, then
  `cloud-init status --long` and `/var/log/cloud-init-output.log`
  (`internal/sshclient/sshclient.go:92`). Keep both properties: an unbounded wait turns a
  cloud-init hang into the most expensive and least informative failure the tool can have.
- `internal/benchmark` — parsers (`iperf.go`, `mtr.go`, `fortio.go`), the `Executor`
  interface (SSH or kubectl-exec), and `Runner` orchestrating a single benchmark.
- `internal/result` — `types.go` (the `BenchmarkResult` JSON schema), `writer.go`
  (per-result files), `aggregator.go` (combines all result JSON → `data.generated.js`).
- `internal/k8s` — operator install, L7 manifest deploy, FQDN/pod discovery, kubeexec.
- `internal/logger` — provider-prefixed structured step logging.

### Data flow to the dashboard

Per-benchmark → `result.WriteResult` → `<provider>/<family>/results/<type>-<mode>.json`
→ `result.Aggregate` → `website/data.generated.js` → static `website/index.html`.
The `website/` directory is deployed to GitHub Pages and built into a container image;
both are driven by the CI workflows below.

**Price is derived at aggregation, not stored.** `result.Aggregate` looks each record up
in `internal/pricing` (`Lookup(provider, region, type)`) and injects a synthetic
`price_per_hour` into the emitted map — the `BenchmarkResult` schema has no price field, so
re-pricing all history is just a re-aggregate. `cmd/pricing-refresh` regenerates the curated
`internal/pricing/data.json` from public price APIs (AWS bulk list, Azure retail; GCP
curated) with no cloud credentials. See README "Instance pricing".

**Forwarding pps** (`forward-pps-exit` mode) *is* on the schema: `BenchmarkResult.ForwardPPS`
(a `PPSResult` of per-size usable pps) + `ForwardRole`. The dashboard gates its Usable-pps and
pps/$ columns on `d.forward_pps` existing — only measured forwarding data is ever charted.

## CI / Deployment

- `.github/workflows/ci.yml` — on pull requests and pushes to `main`, checks
  formatting and the dashboard, then lints, tests, verifies dependencies, and
  builds each provider variant in a separate matrix job.
- `.github/workflows/release.yml` — for version tags, builds and packages all six
  Linux AMD64 binaries and publishes SHA-256 checksums.
- `.github/workflows/deploy-pages.yml` — deploys `website/` to GitHub Pages on
  relevant pushes to `main` or a manual dispatch.
- `.github/workflows/docker-publish.yml` — builds and pushes the multi-architecture
  website container on relevant pushes to `main` or a manual dispatch.

CI and release workflows own all-variant compilation. Do not reproduce their
matrix locally. None of these workflows provisions benchmark infrastructure.

If result JSON changes, `website/data.generated.js` may need regeneration through
the standalone aggregator. Name that exact operation and obtain approval before
running it; do not invoke the tagged Tailbench entry point as a shortcut.

## Conventions Specific to This Repo

- **Result path shape is load-bearing**: `<provider>/<family>/results/<type>-<mode>.json`.
  The resume logic, aggregator, and legacy `l4-kernel` fallback all depend on it.
- **Hostnames** are derived, not arbitrary: `tb-<provider>-<s|c>-<safeType>-<suffix>`
  (`safeHostname` lowercases and replaces `.`/`_` with `-`). Device cleanup matches the
  `tb-<provider>-` prefix — keep the scheme if you rename.
- **Generated SSH keys are reused, never regenerated.** When no public key is configured,
  `provider.ResolveSSHPublicKey` / `EnsureSSHKey` (`internal/provider/sshkey.go:35`) mint an
  ed25519 pair once into `.tailbench/ssh/<scopedName>.pem` (0600) and reuse it forever after;
  regenerating would change the public key, make Pulumi replace the key-pair resource, and
  invalidate a private key an operator already saved. Providers with no key-pair resource
  (GCP, Azure) resolve in **both** `SetupNetworking` and `CreatePair`, because `resume` can
  reach `CreatePair` without a preceding `SetupNetworking` in the same process. The key
  exists only for the case where cloud-init dies before `tailscale up` — benchmarks
  themselves use Tailscale SSH.
- **New provider**: implement the `Provider` interface in a build-tagged
  `internal/provider/<cloud>.go`, add the matching tagged `cmd/tailbench/<cloud>.go`
  defining `compiledProviderName` and `newCompiledProvider`, register families in
  `provider/families.go`, and add the variant to the `Makefile`, `scripts/verify-deps.sh`,
  `scripts/verify-binary.sh`, and the `ci.yml`/`release.yml` matrices. There is no
  central provider switch — `main.compiledProviderFactory` accepts only the one
  provider the binary was compiled for.
- **New benchmark mode**: add it to `validModes` and the `ModeUsesX`/`ModeAppliesTo`
  helpers in `modes.go`, then wire the run branch in `orchestrator.runModeLoop`.
- **Forwarding modes** (e.g. `forward-pps-exit`) additionally need a **3rd node**: they set
  `PairOptions.WantRouter` so each provider's `CreatePair` appends a `router` VM (and open the
  iperf port), the router's cloud-init sets `AdvertiseExitNode`, the ACL auto-approves the exit
  node (`tailnet.buildACL`), and the client is pointed at it at runtime via
  `benchmark.SetExitNode` before `Runner.RunForwardingPPS`. The router is the device under
  test — its type/vCPUs/price land on the result. v1 uses the same instance type for all three
  nodes; `PPSResult.LimitingResource` flags when the offered-rate ceiling (not the node) capped
  the measurement.

## The Recurring Defect Class Here

Most bugs found in this codebase have one shape: **the check that exists verifies a
weaker property than the operation needs.** When adding or reviewing a guard, ask what
the guarded operation actually requires, not what is cheap to assert:

- `doctor --remote` ran `pulumi whoami` and `aws sts get-caller-identity`
  (`internal/preflight/remote.go:47`, `:102`) — credential *presence and identity*. The
  run needs *capability*: permission to create tailnets, to run instances. A green doctor
  still preceded a `403`.
- The local plan reported `compute=0` for an instance whose results all existed, while
  `pendingModesForInstance` disagreed and a pair was provisioned anyway
  (`internal/orchestrator/orchestrator.go:1528`). Two answers to "is there work here".
- `validateWorkloadConfig` was `return nil` in `k8s_enabled.go` while `guardrail.Check`
  refused the same mode list with `incompatible-mode`. The lenient layer is the one
  `resume` goes through.
- Family derivation lived in three places with two meanings — result path (per size on
  Azure) versus quota/selector group — so the quota skip keyed on the wrong one skipped a
  single size instead of the family (`internal/provider/families.go:6`, `:47`).
