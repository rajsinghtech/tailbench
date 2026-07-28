# Running tailbench on GCP virtual machines

This runbook covers `tailbench-gcp`, the Compute Engine VM variant. It is
sequential: prerequisites through teardown. For the GKE variant see
[running-gke.md](running-gke.md); for the other clouds see
[running.md](running.md).

## What this binary is

`tailbench-gcp` provisions a pair of identical Compute Engine instances per
selected machine type, benchmarks the LAN path against the Tailscale path
between them, destroys the pair, and moves on to the next type. Benchmarks are
driven over SSH through the orchestrator's own tsnet node — there is no
Kubernetes involved, and none of the Kubernetes SDKs are linked into this
binary.

| | |
|---|---|
| Binary | `dist/tailbench-gcp` |
| Build tags | `gcp` |
| Make target | `make build-gcp` |
| Provider value | `gcp` |
| Environment | `vm` |
| Runtime cloud CLI | `gcloud` |
| Result directory | `gcp/<family>/results/<type>-<mode>.json` |
| Pulumi stack names | `tailbench-gcp-<instance-type>` |

The provider value, not the executable name, decides all of the above. An
explicit `--provider` that is not `gcp` is rejected at startup
(`cmd/tailbench/main.go:72-77`), so renaming the executable changes nothing.

## Prerequisites

`mise.toml` pins every tool; `mise install` provisions them. The VM variant
needs only three of them at run time — `kubectl` and `helm` are for the `*-k8s`
variants.

| Tool | Why | Where it is used |
|---|---|---|
| Go (version from `go.mod`, currently 1.26.5) | Building from source | `make build-gcp` |
| Pulumi CLI 3.x | The Automation API shells out to it | `internal/provider/gcp.go:154-175` |
| `gcloud` | Instance-type discovery | `internal/provider/gcp_instances.go:18-35` |

Note that `gcloud` is needed even for `--dry-run`: instance discovery shells out
to `gcloud compute machine-types list`, and `--dry-run` calls the same code path
(`internal/orchestrator/orchestrator.go:284-322`). The comment in `mise.toml`
that groups GCP with AWS as "discover through the Go SDK" is wrong for this
variant — GCP discovery is a `gcloud` subprocess.

Verify the whole toolchain in one pass:

```bash
go version                                  # must satisfy the go directive in go.mod
pulumi version                              # Automation API dependency
gcloud version                              # instance discovery dependency

gcloud auth list                            # an account must be marked ACTIVE
gcloud config get-value project             # informational; tailbench uses gcp.project, not this
gcloud auth application-default print-access-token >/dev/null \
  && echo "application-default credentials OK"

# Does the project tailbench will use actually answer? Substitute your values.
gcloud compute machine-types list \
  --project=YOUR_PROJECT \
  --filter="zone:us-central1-a AND name ~ '^c4-standard-[0-9]+$'" \
  --format='value(name)'
```

The last command is exactly what tailbench runs
(`internal/provider/gcp_instances.go:19-21`). If it prints nothing or errors,
the run will find zero instance types.

The Compute Engine API (`compute.googleapis.com`) must be enabled on the
project. That is the only Google API this variant touches: `gcp.go` imports
nothing but `pulumi-gcp/.../compute`, and `gcp_instances.go` shells out only to
`gcloud compute machine-types list`.

## Build

```bash
make build-gcp            # writes dist/tailbench-gcp
./dist/tailbench-gcp --version
make verify-deps VARIANT=gcp
```

Exactly one cloud build tag is required; a bare `go build ./cmd/tailbench/`
fails on purpose. `make verify-deps VARIANT=gcp` asserts that the binary links
`pulumi-gcp` and neither of the other two cloud SDKs
(`scripts/verify-deps.sh:26`).

## Credentials

Three independent systems. Each fails in its own way, and satisfying one says
nothing about the others.

### 1. Tailscale OAuth

Goes in `.env`, which `config.yaml` references through `env_file:` and expands
into the `${VAR}` placeholders under `tailscale:`.

```bash
cp .env.example .env
$EDITOR .env    # OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET
```

The client must be org-level and able to create tailnets, auth keys, the policy
file, and devices — tailbench creates and deletes real tailnets, so use
disposable org credentials. A missing `.env` is not fatal at parse time
(`internal/config/config.go:252-257`); the failure surfaces later, and only when
there is no cached tailnet to fall back on
(`internal/orchestrator/orchestrator.go:48-78, 160-238`).

### 2. The gcloud CLI — two separate credentials

This variant uses two different Google credentials, and they are configured by
two different commands:

| Credential | Set up with | Consumed by |
|---|---|---|
| User/service-account credential | `gcloud auth login` (or `gcloud auth activate-service-account`) | `gcloud compute machine-types list` — instance discovery and `--dry-run` |
| Application Default Credentials | `gcloud auth application-default login` (or `GOOGLE_APPLICATION_CREDENTIALS` pointing at a key file) | The Pulumi GCP provider, during `CreatePair` / `DestroyPair` |

`gcloud auth login` alone is **not** enough. Tailbench sets only
`gcp:project`, `gcp:zone`, and `gcp:region` on the stack
(`internal/provider/gcp.go:159-167`) and never sets a credentials value — no
file in this repository references `GOOGLE_CREDENTIALS` or
`GOOGLE_APPLICATION_CREDENTIALS` — so the Pulumi GCP provider is left to its own
credential resolution, which lands on ADC. The resolution order itself is
Pulumi/Terraform provider behavior rather than tailbench code, so treat the
exact precedence as external to this repo; what is verifiable here is that
tailbench supplies nothing.

Required capability, derived from the resources actually created (see
[What happens during a run](#what-happens-during-a-run)): create, read, and
delete Compute Engine instances and their boot disks in `gcp.project`; read
machine types; and, only for the three-node modes, create and delete a firewall
rule on the `default` network. Map that onto whatever least-privilege role your
organization permits — this document deliberately does not prescribe a role
binding.

### 3. The Pulumi state backend

Local by default and needs no credentials. Pulumi Cloud needs
`PULUMI_ACCESS_TOKEN` or a prior `pulumi login`; tailbench checks at startup and
refuses to begin without it (`internal/provider/backend.go:59-77`). Object-store
backends (`gs://`, `s3://`, `azblob://`) authenticate through the same cloud
credentials you already configured. See
[Choose a state backend](#choose-a-state-backend).

## Configure config.yaml

Two keys are specific to this variant.

| Key | Default | What it does | What breaks if it is wrong |
|---|---|---|---|
| `gcp.project` | `tailscale-sandbox` (`internal/config/config.go:306`) | The project every instance, disk, and machine-type query goes to | Discovery fails, the run benchmarks nothing, and exits 0 — see the trap below |
| `gcp.zone` | `us-central1-a` (`internal/config/config.go:307`) | Instance placement, the machine-type discovery filter, and the source of the derived region | A zone where the family is unavailable yields an empty instance list; a value with no `-` in it panics at result-write time |

### The `tailscale-sandbox` trap

**`gcp.project` defaults to `tailscale-sandbox`, an upstream author's project you
almost certainly cannot access.** `config.yaml` ships with that value on line 67,
and `internal/config/config.go:306` falls back to the same string when the key is
absent. This is the GCP equivalent of the `aws.key_name: raj_macbook` trap.

The failure is quiet rather than loud. `listGCPInstances` returns an error,
`listInstancesCached` logs it as a warning and continues to the next family
(`internal/orchestrator/orchestrator.go:1051-1060`), every family fails the same
way, and `runProvider` then reports:

```text
[gcp] found 0 instance types to benchmark
```

...aggregates nothing, and exits 0. No error, no non-zero status, no cloud
resources — just a run that did nothing. Under `--dry-run` the same condition is
visible directly:

```text
[dry-run]   c4: error listing instances: gcloud list machine-types: exit status 1
[dry-run]   0 instance types selected
[dry-run]   nothing would run — check --family/--filter against the families listed above
```

Set it before anything else:

```yaml
gcp:
  project: your-project-id
  zone: us-central1-a
```

### Zone and region

There is no region key. The region is derived from the zone by truncating at the
last `-`, in two places: `cmd/tailbench/gcp.go:16-18` for the Pulumi
`gcp:region` config, and `internal/orchestrator/orchestrator.go:825-826` for the
`region` and `zone` fields written into every result JSON. `us-central1-a`
therefore yields region `us-central1`, zone `us-central1-a`.

That derived region is what the pricing lookup is keyed on. `pricing.Lookup`
collapses a GCP zone to its region and, on a miss, falls back to the canonical
region `us-central1` with a log line
(`internal/pricing/pricing.go:33-38, 88-98, 111-121`). The embedded dataset
currently carries GCP prices for `us-central1` only, so **a benchmark run in any
other region is priced with `us-central1` numbers**. Note also the second-order
effect on results: `region` participates in the pricing key, so a zone typo
silently changes the price attached to a result.

The orchestrator's region derivation is unguarded — `GCPZone[:strings.LastIndex(GCPZone, "-")]`
panics if the zone contains no `-`. Any real zone name does, so this only bites
on a malformed value, but it panics after provisioning rather than at startup.

### Keys that are not variant-specific but still matter

- `benchmark.modes` — the only place modes come from. There is no `--modes`
  flag. Empty defaults to `["l4-kernel"]` (`internal/config/config.go:342-344`).
- `tailscale.create_tailnet`, `tailscale.tag` — leave `create_tailnet: true`
  unless you are benchmarking an existing tailnet.
- `state_backend` — see the next section.
- `aws.*` and `azure.*` are ignored by this binary.

### Things you cannot configure

The VPC network and subnetwork are hardcoded to `default`
(`cmd/tailbench/gcp.go:19`). There is no config key, no flag, and no environment
variable for them. `SetupNetworking` creates nothing — it just echoes those two
names back (`internal/provider/gcp.go:35-40`). Consequences:

- The project must have a usable `default` network with a subnet in `gcp.zone`'s
  region.
- Tailbench creates no firewall rule for a normal two-node run, so the network
  must already permit ICMP (the LAN reachability check,
  `internal/benchmark/runner.go:237-243`) and TCP/UDP 15201 (`IPerfPort`,
  `internal/benchmark/iperf.go:10`) between instances in the subnet. An
  auto-mode `default` network's built-in internal-allow and ICMP rules satisfy
  this; a project whose default network was deleted or hardened does not.
- Instances are created with an external IP
  (`internal/provider/gcp.go:122-125`), which cloud-init needs to install
  Tailscale, iperf3, mtr, and fortio.

## Choose a state backend

Set `state_backend:` in `config.yaml` or pass `--state-backend`.

| Value | Backend | Consequence |
|---|---|---|
| *(empty, default)* | `file://<repo-root>/state/gcp` | Stacks exist only in this checkout on this machine. Another machine cannot resume or destroy them, so an interrupted run leaks instances. Tailbench creates the directory and sweeps stale Pulumi lock files at startup (`internal/orchestrator/orchestrator.go:129-146`) |
| `pulumi.com` | Pulumi Cloud, normalized to `https://api.pulumi.com` | Stacks survive machine swaps. Requires `PULUMI_ACCESS_TOKEN` (an `.env` entry works) or `pulumi login`, checked at startup |
| `gs://bucket/prefix` | Google Cloud Storage | Same durability, authenticated by the Google credentials you already have |
| `s3://…`, `azblob://…` | Object storage on another cloud | Works; needs that cloud's credentials |
| `file://…` | An explicit local or mounted path | Local semantics at a path you choose |

Remote backends skip both the local `state/` directory creation and the stale
lock sweep — the service manages its own leases
(`internal/orchestrator/orchestrator.go:120-127`). Stack names are already
provider-qualified, so one bucket can safely hold every provider's stacks. An
unrecognized value is rejected at parse time
(`internal/config/config.go:175-194`).

```bash
./dist/tailbench-gcp --state-backend gs://tailbench-state/pulumi --family c4
```

## Dry run

Always do this first. It prints the provider, the configured modes, and every
instance type `--family` and `--filter` select, then exits without touching any
cloud resource.

```bash
./dist/tailbench-gcp --dry-run
./dist/tailbench-gcp --dry-run --family c4a
./dist/tailbench-gcp --dry-run --filter '^c4-standard-(2|4)$'
```

Dry run needs no Tailscale credentials, but it **does** need working `gcloud`
auth and a correct `gcp.project`, because it calls `ListInstances` for real
(`internal/orchestrator/orchestrator.go:302`). That makes it the cheapest test
of your GCP setup. It also bypasses the instance-type cache, so it always
reflects what `gcloud` reports right now.

An unrecognized `--family` is an error listing the valid families, not an empty
selection (`internal/orchestrator/orchestrator.go:327-339`).

## Run

```bash
./dist/tailbench-gcp                                  # every family, every configured mode
./dist/tailbench-gcp --family c4a                     # one family
./dist/tailbench-gcp --filter '^c4-standard-4$'        # one machine type
./dist/tailbench-gcp --config ./config.gcp.yaml        # alternate config
```

The complete flag set is `-cleanup-networking`, `-config`, `-dry-run`,
`-family`, `-filter`, `-provider`, `-state-backend`, plus `--version`, which is
scanned out of `os.Args` before flag parsing and so does not appear in `--help`
(`cmd/tailbench/main.go:44-49`). Both `-flag` and `--flag` spellings work.

### Scoping cost

Each selected machine type provisions two instances (three for the forwarding
and relay modes) for the duration of its benchmarks, then destroys them. Cost is
therefore roughly *number of selected types x nodes per type x
instance-hour price x benchmark duration*. Two levers control the numerator:

- `--family` picks one family. Available families for this provider are `c4`,
  `c4a`, `c3d`, `n4`, `c3`, `n2`, `c2`
  (`internal/provider/gcp_instances.go:14-16`). `c4a` is Arm (Axion); the
  provider branches on it to select an `arm64` Ubuntu 24.04 image, and `c4`,
  `c4a`, and `n4` additionally get `hyperdisk-balanced` boot disks instead of
  `pd-ssd` (`internal/provider/gcp.go:42-52`).
- `--filter` is a Go regular expression matched against the machine type name.
  Anchor it (`^…$`) unless you mean a prefix match.

Discovery only ever returns `-standard-` shapes: the filter is
`^<family>-standard-[0-9]+$` (`internal/provider/gcp_instances.go:19`), so
`highcpu`, `highmem`, `lssd`, and `metal` variants are never benchmarked.
Results come back sorted ascending by vCPU count
(`internal/provider/gcp_instances.go:33`), so an unfiltered family run walks
from the smallest type upward — a useful property if you intend to interrupt it.

### Modes this binary accepts and rejects

Modes come from `benchmark.modes` in `config.yaml` only.

| Mode | VM binary | Notes |
|---|---|---|
| `l4-kernel` | accepted | iperf3 + MTR, LAN baseline vs Tailscale. The default when `modes` is empty |
| `l4-userspace` | accepted | See the caveat below |
| `l7-serve-h1`, `l7-serve-h2` | accepted | fortio over `tailscale serve`; cloud-init installs fortio and starts the echo server |
| `forward-pps-exit` | accepted, opt-in | Adds a third VM |
| `relay-throughput` | accepted, opt-in | Adds a third VM; needs Tailscale >= 1.86 |
| `tsnet-userspace` | accepted by validation | Never produces a result — the run loop logs `skipping mode tsnet-userspace: tsnet runner not yet implemented` (`internal/orchestrator/orchestrator.go:800-802`) |
| `l4-lb` | **rejected** | Kubernetes-only |
| `l7-ingress-h1`, `l7-ingress-h2` | **rejected** | Kubernetes-only |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | **rejected** | Kubernetes-only |

Rejection happens at startup, before anything is provisioned, with
`kubernetes-only benchmark mode "…" requires a k8s-enabled binary`
(`internal/orchestrator/k8s_disabled.go:16-23`). The container/VM split itself is
`benchmark.ModeAppliesTo` (`internal/benchmark/modes.go:43-53`). An entirely
unknown mode name is rejected separately, also at startup
(`internal/orchestrator/orchestrator.go:84-92`).

Caveat on `l4-userspace`: it is routed through the same `ModeUsesIperf` branch
as `l4-kernel` and calls `runner.RunFull` with identical arguments
(`internal/benchmark/modes.go:55-57`,
`internal/orchestrator/orchestrator.go:672-679`). Nothing in the code path
switches Tailscale into userspace networking. It therefore writes a second
result file measuring the same thing as `l4-kernel`.

### The three-node modes

`forward-pps-exit` and `relay-throughput` are VM-only and opt-in. Each makes
`CreatePair` append a third `router` instance and create a firewall rule
allowing TCP/UDP 15201 and UDP 41642 from `0.0.0.0/0` on the `default` network
(`internal/provider/gcp.go:78-94`; `41642` is `benchmark.RelayUDPPort`). The
rule belongs to the ephemeral pair stack, so it is destroyed with the pair.

The router is the device under test — its type, vCPUs, and price land on the
result. Note the wide source range on that rule: it is required because the
client reaches the sink's public IP through the exit node, but it is worth
knowing about before enabling these modes in a shared project. Topology, sweep
methodology, and caveats are in
[cost-forward-pps-plan.md](cost-forward-pps-plan.md).

## What happens during a run

1. `restoreStandardLogger()` runs first, undoing Pulumi's `slog.SetDefault`
   takeover of the standard logger. Without it every `log.Printf` and
   `log.Fatalf` is silently discarded (`cmd/tailbench/main.go:36-49`).
2. Config is parsed: `config.yaml`, then `.env`, then CLI flags. The state
   backend is normalized and rejected here if unusable.
3. Startup validation: mode names, Kubernetes-only modes, and Pulumi Cloud
   credentials (`internal/orchestrator/orchestrator.go:94-117`).
4. For a local backend, `state/gcp` is created and stale Pulumi lock files under
   `state/*/.pulumi/locks/*.json` are swept — these are what otherwise cause
   every later operation to fail with `exit status 255`
   (`internal/orchestrator/orchestrator.go:129-146`).
5. The tailnet is reused from `.tailbench/tailnet.json` if present, otherwise
   created; the ACL is (re)applied either way. An auth key is minted and the
   orchestrator's own ephemeral tsnet node joins as `tailbench-orchestrator`
   (`internal/orchestrator/orchestrator.go:160-262`).
6. `SetupNetworking` is a no-op for GCP: it returns `network=default`,
   `subnet=default` without creating anything
   (`internal/provider/gcp.go:35-40`).
7. Stale tailnet devices whose hostname starts with `tb-gcp-` are deleted
   (`internal/orchestrator/orchestrator.go:362-372`).
8. Instance types are listed, using the disk cache at
   `.tailbench/instances/gcp-<family>.json` when present
   (`internal/orchestrator/orchestrator.go:1023-1074`), then narrowed by
   `--filter`.
9. For each machine type, in ascending vCPU order:
   - Modes whose result file already exists are dropped; if none remain, the
     type is skipped without provisioning anything.
   - Cloud-init is rendered per node — Tailscale, iperf3, mtr, jq, curl, BBR and
     UDP GRO tuning, `tailscale set --ssh`, and (for `l7-serve-*`) fortio plus
     `tailscale serve` (`internal/cloudinit/setup.sh.tmpl`).
   - `DestroyPair` runs first as a pre-cleanup, then `CreatePair` brings up the
     Pulumi stack `tailbench-gcp-<type>`: two (or three) `compute.Instance`
     resources in `gcp.zone`, each with a 50 GB boot disk, an ephemeral external
     IP, the label `project=tailbench`, the startup script as metadata, and an
     `ssh-keys` metadata entry (`internal/provider/gcp.go:68-201`).
   - The orchestrator SSHes to each node as `root` over tsnet and waits for
     `/tmp/tailbench-ready` (`internal/orchestrator/orchestrator.go:566-613`,
     `internal/sshclient/sshclient.go:83-98`).
   - Each pending mode runs and writes
     `gcp/<family>/results/<type>-<mode>.json`.
   - `DestroyPair` tears the stack down. The auth key is refreshed if it is
     older than 1800 s.
10. `result.Aggregate` regenerates `website/data.generated.js`
    (`internal/orchestrator/orchestrator.go:548`).
11. `TeardownNetworking` is a no-op for GCP, so `--cleanup-networking` only
    affects the tailnet and the instance cache
    (`internal/provider/gcp.go:218-220`).

### How SSH works, and what is not load-bearing

Nothing about GCP's SSH story matters here. Cloud-init runs
`tailscale set --ssh`, and the orchestrator dials `root@<hostname>:22` through
the tsnet interface with `ssh.Password("tailscale")`
(`internal/sshclient/sshclient.go:19-27`) — a placeholder, since Tailscale SSH
authorizes on tailnet identity via the ACL's SSH rule granting `tag:bench` to
`tag:bench` as `root` (`internal/tailnet/tailnet.go:173-182`).

The `ssh-keys` instance metadata is built from `GCPProvider.SSHUser` and
`SSHPubKey` (`internal/provider/gcp.go:129`), and the factory never populates
either field (`cmd/tailbench/gcp.go:19`) — the metadata value is literally `:`.
So:

- No GCP SSH key, key pair, or `~/.ssh` content is required.
- OS Login settings are irrelevant to how tailbench connects.
- No firewall rule for port 22 is needed; the SSH session arrives over the
  tailnet.

Not verified: whether a project that enforces OS Login by org policy rejects the
degenerate `ssh-keys` metadata value at instance-create time. Existing results
under `gcp/` show the current form works on a normal project.

## Generate the report

A successful run aggregates automatically
(`internal/orchestrator/orchestrator.go:548`). Regenerate manually after editing
or deleting result files:

```bash
go run ./cmd/aggregate/
```

Run it **from the repository root**. It aggregates relative to `os.Getwd()`
(`cmd/aggregate/main.go:11`), walking `gcp`, `aws`, `azure`, `gke`, `eks`, and
`aks` and writing `website/data.generated.js`
(`internal/result/aggregator.go:15-21`).

Price is injected at aggregation time, not stored in the result JSON: each
record is looked up by provider, region, and instance type in the curated
dataset and gains a synthetic `price_per_hour`
(`internal/result/aggregator.go:54-63`). Re-pricing all history is just a
re-aggregate:

```bash
go run ./cmd/pricing-refresh    # regenerate internal/pricing/data.json
go run ./cmd/aggregate/         # re-inject price_per_hour
```

The embedded GCP dataset covers `us-central1` `-standard-` types only, so a type
outside it gets no price and the dashboard's cost columns stay empty for that
row.

View the dashboard by opening `website/index.html` in a browser. It loads
`data.generated.js` through a plain `<script src>`, so `file://` works
(`website/index.html:276`) — but it also loads Chart.js from a CDN
(`website/index.html:275`), so the charts need internet access. The tables
render either way.

## Resume and interruption

Resume is filesystem-driven; there is no database. Work is skipped if and only
if its result file already exists.

- Ctrl-C (SIGINT) or SIGTERM cancels the run's context
  (`cmd/tailbench/main.go:60-61`). The in-flight instance pair is the risk: if
  the process dies between `CreatePair` and `DestroyPair`, those instances
  survive. See [Teardown](#teardown).
- Rerunning the same command continues where it stopped. Types with all modes
  done are skipped before any instance is provisioned
  (`internal/orchestrator/orchestrator.go:416-420`), and individual completed
  modes are skipped inside the loop
  (`internal/orchestrator/orchestrator.go:663-667`).
- `l4-kernel` also honors a legacy no-suffix path, `<type>.json`, for backward
  compatibility (`internal/orchestrator/orchestrator.go:918-924`).
- To re-measure something, delete its result file and rerun:

  ```bash
  rm gcp/c4/results/c4-standard-4-l4-kernel.json
  ./dist/tailbench-gcp --filter '^c4-standard-4$'
  ```

- The tailnet is reused across runs from `.tailbench/tailnet.json` and is only
  deleted by `--cleanup-networking`, so an interrupted run does not orphan a
  tailnet (`internal/orchestrator/orchestrator.go:167-180, 219-231`).
- The instance-type cache at `.tailbench/instances/gcp-<family>.json` is keyed by
  family, so a `--family c4` run cannot silently satisfy a later `--family all`
  (`internal/orchestrator/orchestrator.go:1019-1028`). Delete the file, or pass
  `--cleanup-networking`, to force rediscovery.

## Teardown

Instance pairs are destroyed after each type as a normal part of the run, and
`CreatePair` is preceded by a `DestroyPair` pre-cleanup, so simply rerunning the
same command cleans up a crashed iteration
(`internal/orchestrator/orchestrator.go:489-491`).

For the rest:

```bash
./dist/tailbench-gcp --cleanup-networking
```

For this variant that flag does less than its name suggests. It deletes the
tailnet and `.tailbench/tailnet.json`, and bypasses the instance-type cache. It
does **not** delete any GCP resource, because `TeardownNetworking` is a no-op —
this variant never created shared networking in the first place
(`internal/provider/gcp.go:218-220`).

To confirm nothing was left behind, look for the label tailbench puts on every
instance (`internal/provider/gcp.go:131-133`) and for its stacks:

```bash
gcloud compute instances list --project=YOUR_PROJECT \
  --filter='labels.project=tailbench'
pulumi stack ls                     # against your configured backend
```

If the run used the default local backend and the checkout is gone, that state
is gone with it and leftover instances must be deleted by hand — which is the
argument for a remote backend.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Run exits 0 having benchmarked nothing; log says `found 0 instance types to benchmark` | `gcp.project` is still `tailscale-sandbox`, or `gcloud` is unauthenticated, or the Compute Engine API is disabled. Discovery errors are logged as warnings and swallowed | Set `gcp.project`, then confirm with the `gcloud compute machine-types list` command in [Prerequisites](#prerequisites) |
| No output at all, exit status 1 | Something logged through the standard logger before `restoreStandardLogger()`, or a build that lost it. Pulumi's `logging` package `init()` calls `slog.SetDefault`, which discards `log.Printf` | Confirm `restoreStandardLogger()` is still the first statement in `main()` (`cmd/tailbench/main.go:41-42`) |
| `exit status 255` from every Pulumi operation | Stale lock file under `state/*/.pulumi/locks/*.json` from a crashed run | Rerun — startup sweeps them for local backends (`internal/orchestrator/orchestrator.go:134-146`). For a remote backend use `pulumi cancel` |
| `kubernetes-only benchmark mode "l4-lb" requires a k8s-enabled binary` | A container-only mode is in `benchmark.modes` | Remove it, or use `tailbench-gcp-k8s` |
| `unknown benchmark mode "…"` at startup | Typo in `benchmark.modes` | The error lists every valid mode |
| `unknown family "…" for provider gcp` | `--family` is not one of `c4 c4a c3d n4 c3 n2 c2` | Use a listed family, or `all` |
| `--filter` selects nothing | Regex not anchored the way you expect, or the shape is not a `-standard-` type | Discovery only returns `^<family>-standard-[0-9]+$` (`internal/provider/gcp_instances.go:19`); test with `--dry-run` |
| `quota exceeded for <type>, skipping family <family>` | `provider.IsQuotaError` matched `QUOTA_EXCEEDED`, `ZONE_RESOURCE_POOL_EXHAUSTED`, or similar (`internal/provider/gcp_instances.go:45-52`) | The whole family is skipped for the rest of the run. Raise the quota, or rerun with `--family` for the remaining families |
| `ZONE_RESOURCE_POOL_EXHAUSTED` on a large type | Capacity, not quota — but it is classified as a quota error, so the family is skipped | Retry later or change `gcp.zone` |
| `stack up` fails on external IP or a constraint | Instances are created with an ephemeral external IP; an org policy may forbid it | Instances need outbound internet for cloud-init to install Tailscale. There is no config key to disable the external IP |
| SSH never connects; log repeats `waiting for tb-gcp-…` | Cloud-init did not finish or Tailscale never came up — usually no outbound internet, or a bad auth key | Check the instance's serial console output; confirm `/tmp/tailbench-ready` never appeared |
| `LAN verification failed` | Baseline ping between the two instances is blocked in the `default` network | Tailbench creates no firewall rule for a two-node run; the network must already allow ICMP and TCP/UDP 15201 internally |
| `state_backend is Pulumi Cloud (…) but no credentials were found` | `state_backend: pulumi.com` without a token | Set `PULUMI_ACCESS_TOKEN` in `.env` or run `pulumi login` (`internal/provider/backend.go:59-77`) |
| `missing Tailscale credentials` | No `.env`, and no cached `.tailbench/tailnet.json` to fall back on | `cp .env.example .env` and fill it in |
| A result carries a surprising `price_per_hour`, or none | The pricing dataset holds GCP prices for `us-central1` only and falls back to it for other regions | Check `internal/pricing/data.json`; regenerate with `go run ./cmd/pricing-refresh` |
| Dashboard renders tables but no charts | Chart.js is loaded from a CDN (`website/index.html:275`) | View it with internet access |
