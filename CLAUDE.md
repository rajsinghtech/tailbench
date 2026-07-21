# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Tailbench measures Tailscale network overhead by provisioning VM/K8s pairs across
GCP, AWS, and Azure, running benchmarks (iperf3, MTR, fortio) over baseline LAN
vs. Tailscale CGNAT, and publishing results to a static dashboard. See `README.md`
for user-facing usage, flags, and environment variables.

## Build, Test, Lint

There is **no Makefile**. Use `go` directly.

```bash
# Build the main binary
go build -o tailbench ./cmd/tailbench/

# Build the standalone aggregator (regenerates website/data.generated.js from result JSON)
go build -o aggregate ./cmd/aggregate/

# Run all unit tests
go test ./...

# Run a single package's tests
go test ./internal/benchmark/

# Run a single test by name
go test ./internal/result/ -run TestAggregate -v

# Lint (no repo golangci config; use defaults). Per user global config, prefer:
~/.local/bin/golangci-lint-versions/golangci-lint run ./...
# or plain:
go vet ./...
```

- **Go 1.26+** required (`go.mod` declares `go 1.26.1`; README says 1.22+ but the
  toolchain directive is authoritative).
- The Tailscale live E2E test (`internal/tailnet/tailnet_e2e_test.go`) is gated by
  the presence of `TS_OAUTH_CLIENT_ID` / `TS_OAUTH_CLIENT_SECRET` env vars — it
  self-skips when unset, so `go test ./...` is safe without credentials. It creates
  and deletes a real ephemeral tailnet, so only run it with disposable org creds.

## Module Path Gotcha

The Go module is `github.com/rajsinghtech/tailbench` (declared in `go.mod`), but
this checkout lives under a `rshade/tailbench` directory (a fork). **All internal
imports use the `rajsinghtech` path** — do not rewrite import paths to match the
directory.

## Running

`./tailbench` reads `config.yaml` by default; CLI flags (`--provider`, `--family`,
`--filter`, `--dry-run`, `--cleanup-networking`, `--config`) override YAML values.
Secrets come from an `.env` file referenced by `env_file:` in `config.yaml`, expanded
via `${VAR}` syntax (see `internal/config/config.go`). Always validate changes with
`./tailbench --dry-run` first — it lists what would be provisioned without touching
any cloud.

## Architecture

The entry point (`cmd/tailbench/main.go`) is thin: parse config → build orchestrator
→ `Run(ctx)` under a SIGINT/SIGTERM-cancelable context. Everything of substance lives
in `internal/orchestrator/orchestrator.go`, the central control loop.

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

- **VM providers**: `gcp.go`, `aws.go`, `azure.go` — provision 2 identical VMs via
  Pulumi Automation API; benchmarks run over native Go SSH (through tsnet).
- **K8s providers**: `gke.go`, `eks.go`, `aks.go` — additionally implement the
  optional `K8sOperatorProvider` interface (install operator, expose API-server-proxy
  FQDN). Benchmarks run via `kubectl exec` (`internal/k8s/kubeexec.go`), NOT SSH.
  `PairOutput.Namespace != ""` is how the orchestrator detects a K8s pair and routes
  to `runK8sBenchmark`.

`families.go` maps instance types → families and is the source of truth for
`GetInstanceFamily`.

Two Pulumi stack lifecycles: **networking** stacks are long-lived (per provider,
created once, no-op on subsequent runs); **VM-pair** stacks are ephemeral (per instance
type, created and destroyed each iteration). State is local per provider
(`file://./state/<provider>`). Stale Pulumi lock files (from crashed runs) are swept on
startup — see the `lockPattern` glob in `Run`.

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

- `internal/config` — YAML + `.env` + CLI-flag merge; `or`/`orInt` implement
  precedence with sane defaults. This is the single place defaults are defined.
- `internal/tailnet` — Tailscale v2 API: create/delete ephemeral tailnets, auth keys,
  ACLs, stale-device cleanup. Tailnet state is cached in `.tailbench/tailnet.json` and
  reused across runs (only deleted with `--cleanup-networking`).
- `internal/cloudinit` — embedded `setup.sh.tmpl` (Go `embed`); installs Tailscale,
  iperf3, mtr, fortio and applies Tailscale performance tuning (UDP GRO, BBR, CPU
  governor). Rendered per-VM in the orchestrator.
- `internal/sshclient` — SSH over the tsnet interface, with retry and wait-for-ready.
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

- `.github/workflows/deploy-pages.yml` — deploys `website/` to GitHub Pages on push to
  `main` when `website/**` changes.
- `.github/workflows/docker-publish.yml` — builds/pushes the `website` container to
  `ghcr.io/<owner>/tailbench` (multi-arch) on `website/**` changes.

Both workflows trigger only on `website/**` paths — Go code changes do not run CI here.
If you change result JSON, regenerate `website/data.generated.js` (run `tailbench`, or
`go run ./cmd/aggregate/`) so the dashboard reflects it.

## Conventions Specific to This Repo

- **Result path shape is load-bearing**: `<provider>/<family>/results/<type>-<mode>.json`.
  The resume logic, aggregator, and legacy `l4-kernel` fallback all depend on it.
- **Hostnames** are derived, not arbitrary: `tb-<provider>-<s|c>-<safeType>-<suffix>`
  (`safeHostname` lowercases and replaces `.`/`_` with `-`). Device cleanup matches the
  `tb-<provider>-` prefix — keep the scheme if you rename.
- **New provider**: implement the `Provider` interface, add a case in
  `orchestrator.buildProvider`, and register families in `provider/families.go`.
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
