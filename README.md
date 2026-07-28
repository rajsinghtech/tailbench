# Tailbench

Tailbench measures Tailscale networking overhead on virtual machines and managed Kubernetes clusters in AWS, Azure, and GCP. It uses Pulumi Automation API for infrastructure, then records iperf3, MTR, and Fortio results without combining every cloud SDK into one executable.

## Executables

Each executable contains exactly one Pulumi cloud provider SDK family. The managed Kubernetes binaries are cloud-specific: EKS uses AWS, AKS uses Azure, and GKE uses GCP.

| Executable | Build tags | Accepted provider | Infrastructure | Runtime cloud CLI |
|---|---|---|---|---|
| `tailbench-aws` | `aws` | `aws` | EC2 virtual machines | `aws` |
| `tailbench-aws-k8s` | `aws,k8s` | `eks` | EKS cluster and node groups | `aws` |
| `tailbench-azure` | `azure` | `azure` | Azure virtual machines | `az` |
| `tailbench-azure-k8s` | `azure,k8s` | `aks` | AKS cluster and node pools | `az` |
| `tailbench-gcp` | `gcp` | `gcp` | Compute Engine virtual machines | `gcloud` |
| `tailbench-gcp-k8s` | `gcp,k8s` | `gke` | GKE cluster and node pools | `gcloud` |

All variants use the Pulumi core SDK and Automation API. Keeping all variants in one Go module means a dependency download can still fetch modules that a particular binary does not compile or link.

## Quick start

Build only the variant you need, and only on a machine sized for its cloud SDK
graph. For example, select the AWS VM binary:

```bash
make build-aws
```

The binaries are written under `dist/`. If `providers` is absent or empty in a
configuration file, each binary defaults to its compiled provider.

Supply Tailscale credentials before any command that contacts Tailscale.
`config.yaml` references them through `env_file: .env`, which is gitignored and
therefore absent from a fresh clone:

```bash
cp .env.example .env
$EDITOR .env   # OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET
```

The local commands need none of that. Start with the local planner: it reads the
selected configuration, the checked-in price catalog, and existing result files.
It does not load the environment file, initialize Pulumi or Tailscale, call cloud
APIs, create state directories, or delete locks:

```bash
# Side-effect-free: no credentials or remote calls.
./dist/tailbench-aws plan --config config.example.yaml \
  --family c7i --filter '^c7i\.large$'

# Side-effect-free compatibility alias for plan.
./dist/tailbench-aws --config config.example.yaml \
  --family c7i --filter '^c7i\.large$' --dry-run

# Local checks only. Missing tools are reported with remediation.
./dist/tailbench-aws doctor --config config.example.yaml
```

`--dry-run` prints the provider, the configured modes, and every instance type that `--family` and `--filter` select, then exits without touching any cloud. An unrecognized `--family` is rejected with the list of valid families rather than selecting nothing.

An explicit provider must match the binary. For example, `tailbench-aws --provider gcp` fails rather than silently using AWS. Renaming an executable does not change its provider identity.

`doctor --remote` is opt-in. It loads the configured credential source and
performs read-only Pulumi, Tailscale-value, and cloud CLI checks. `run`, or an
invocation with no subcommand and `dry_run: false`, can provision billable
resources. Tailbench prints the selected topology, duration, estimated cost
bound, and cleanup policy before an interactive run. Automation requires both
`--yes` and an explicitly configured `--max-cost-usd`:

```bash
# Provisioning: creates billable AWS resources.
./dist/tailbench-aws run --config tailbench.yaml \
  --family c7i --filter '^c7i\.large$' \
  --max-cost-usd 10 --max-duration 45m \
  --max-instance-types 1 --max-concurrent-resources 1 --yes
```

Approved execution creates a versioned recovery bundle under
`.tailbench/runs/<run-id>/`. The final summary always reports benchmark and
cleanup outcomes separately. Use `status`, `results`, `resume`, or `cleanup`
with that run ID; these commands never allocate a second run ID.

Do not run the aggregate targets on a normal developer workstation:

```bash
make build
make test
make lint
make verify-deps
```

Those targets cover all six mutually exclusive cloud SDK graphs. They are
reserved for CI or a dedicated build host even though the Makefile runs them
sequentially. For local work, select one exact target such as `make build-aws`,
`make test-aws`, or `make lint-aws`. Use
`make verify-deps VARIANT=aws` rather than the all-variant form. A single variant
can still be resource intensive, so start it only on an appropriately sized
machine.

## Step-by-step runbooks

The sections below are reference material. For a sequential walkthrough — prerequisites, credentials, configuration, a scoped first run, report generation, teardown, and troubleshooting — use the runbook for your cloud:

| Cloud | VMs | Managed Kubernetes |
|---|---|---|
| AWS | [docs/running-aws.md](docs/running-aws.md) | [docs/running-eks.md](docs/running-eks.md) |
| Azure | [docs/running-azure.md](docs/running-azure.md) | [docs/running-aks.md](docs/running-aks.md) |
| GCP | [docs/running-gcp.md](docs/running-gcp.md) | [docs/running-gke.md](docs/running-gke.md) |

[docs/running.md](docs/running.md) covers what is common to all six.

## Configuration and modes

Tailbench reads `config.yaml` by default. Copy
[`config.example.yaml`](config.example.yaml) and
[`.env.example`](.env.example) rather than placing real credentials in a
checked-in file. CLI values for `--provider`, `--family`, and `--filter`
override the selected YAML file. Secret expansion and environment-file loading
happen only for remote checks and execution.

`dry_run: true` and the CLI `--dry-run` flag both route to the side-effect-free
local plan. Use `plan` in new automation; `--dry-run` remains the compatibility
spelling.

Execution also accepts `max_cost_usd`, `max_duration`,
`max_instance_types`, `max_concurrent_resources`, and `cleanup_policy`.
The safe cleanup policy is `always`; the other accepted values are
`on-success` and `manual`.

Provider values remain `aws`, `eks`, `azure`, `aks`, `gcp`, and `gke`. These values—not executable names—continue to determine result directories, local Pulumi state paths, and stack naming. Results remain under:

```text
<provider>/<family>/results/<instance-type>-<mode>.json
```

VM binaries support VM modes such as `l4-kernel` and `l7-serve-*`. They reject Kubernetes-only modes such as `l4-lb` and `l7-ingress-*`. The `*-k8s` binaries retain pod execution, operator installation, load-balancer discovery, and L7 manifest deployment.

The Kubernetes-only modes also include `forward-pps-exit-k8s` and `forward-pps-exit-k8s-opton`, an A/B pair that measures UDP packets-per-second forwarded through an operator egress ProxyGroup with the experimental `TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS` env var off and on. Each mode writes its own result file per instance type (`<type>-forward-pps-exit-k8s.json` and `<type>-forward-pps-exit-k8s-opton.json`), so the two arms resume independently. See [docs/cost-forward-pps-plan.md](docs/cost-forward-pps-plan.md) for the topology, sweep methodology, and caveats.

Instance types are discovered dynamically. Current family defaults include:

| GCP/GKE | AWS/EKS | Azure/AKS |
|---|---|---|
| c4, c4a, c3d, n4, c3, n2, c2 | c8gn, c6in, c7i, c7gn, c8g, c6i, m6i, c7g, m7g | dsv5, dasv5, dpsv6, dsv4, fsv2, fasv6, falsv6, famsv6, fasv7, falsv7, famsv7, esv4 |

## Runtime prerequisites

Every binary requires:

- the Go version declared in `go.mod` to build from source;
- the Pulumi CLI on `PATH` at runtime;
- authenticated Tailscale credentials configured in `config.yaml` or its referenced environment file;
- the applicable authenticated cloud CLI shown in the executable table.

The managed Kubernetes variants also require permissions to create clusters, node pools or node groups, load balancers, and the resources used by the Tailscale Kubernetes operator. Cloud and Pulumi CLIs are runtime prerequisites and are not embedded in release archives.

## Infrastructure lifecycle

For each selected instance type, Tailbench provisions a server/client pair, runs the applicable benchmark modes, writes compatible JSON results, and destroys the pair. Provider networking or cluster infrastructure is reused unless `--cleanup-networking` is set. Existing results are skipped for resume support, and quota failures skip the remaining types in the affected family.

Generated benchmark data continues to aggregate into `website/data.generated.js`.

### Pulumi state backend

By default, Pulumi state is local: `state/<provider>`, gitignored. That ties a run to one checkout on one machine — a second machine cannot see, resume, or tear down those stacks, so interrupted runs leak cloud resources.

Set `state_backend` in `config.yaml` (or `--state-backend`) to keep stacks alive across machines:

```bash
./dist/tailbench-aws --state-backend pulumi.com --family c7i
./dist/tailbench-gcp --state-backend s3://tailbench-state/pulumi
```

| Value | Backend |
|---|---|
| *(empty)* | Local `./state/<provider>` |
| `pulumi.com` | Pulumi Cloud (normalizes to `https://api.pulumi.com`) |
| `s3://…`, `gs://…`, `azblob://…` | Object storage |
| `file://…` | An explicit local or mounted path |

Pulumi Cloud needs `PULUMI_ACCESS_TOKEN` or a prior `pulumi login`; tailbench checks at startup and fails immediately with instructions rather than partway through provisioning. The token can live in `.env` — the Pulumi CLI inherits tailbench's environment.

Stack names are provider-qualified (`tailbench-<provider>-<type>`), so one backend can safely hold every provider's stacks. An unrecognized backend value is rejected at startup.

## Forwarding pps (exit-node sizing)

For **subnet routers and exit nodes** the bottleneck is per-packet CPU work
(WireGuard does an AEAD op per datagram and a single tunnel is pinned to one
core), so the sizing metric is **packets/second, not Gbps** — and it must be
**measured** with small UDP packets, never derived from TCP throughput.

The `forward-pps-exit` mode (VM only, opt-in) provisions a **third node** — a
router advertising `--advertise-exit-node` — and measures the router's usable
forwarding pps on the path `client -> router (exit node) -> server (sink public
IP)`. The router is the device under test; its instance type, vCPUs, and price
are what the result records.

- **Usable pps** = the highest offered UDP rate sustaining **≤0.1% loss**, found
  by an RFC-2544-style binary search (`iperf3 -u -b <bits/s>`, single stream),
  reported at **64 B** (worst case), an **IMIX-average** size (headline), and
  **~MTU** (best case).
- Enable it by adding `forward-pps-exit` to `benchmark.modes` in `config.yaml`
  (see the `pps_*` tuning keys there), then run e.g.
  `./dist/tailbench-aws --filter '^c6in\.xlarge$'`.
- The dashboard shows **Usable pps** and **pps/$** columns, rendered **only when
  forwarding data exists**. This is exit-node **forwarding** pps — distinct from
  endpoint-to-endpoint host pps (see `docs/cost-forward-pps-plan.md`).

## Peer relay (relay-node sizing)

Tailscale peer relays (>= 1.86) let a node in your tailnet relay WireGuard
traffic between two peers that can't connect directly — tried **before**
falling back to Tailscale's shared DERP servers. Like an exit node, a relay
does per-packet crypto for *other peers'* traffic, so it's CPU/packet-rate
bound and pinned to one core per tunnel.

The `relay-throughput` mode (VM only, opt-in) provisions a **third node** —
a router advertising `--relay-server-port` — and measures the same
client/server pair's connection in three states, each confirmed via
`tailscale ping` before it's measured (a state that can't be confirmed is
skipped, never mislabeled):

- **Direct** — the ceiling.
- **Peer relay** — the direct path blocked, relay available.
- **DERP** — direct blocked *and* the relay also blocked; the baseline peer
  relays improve on.

Each state records TCP throughput, usable pps (64 B / IMIX-average / ~MTU,
the same RFC-2544-style sweep as `forward-pps-exit`), and round-trip
latency.

- Enable it by adding `relay-throughput` to `benchmark.modes` in
  `config.yaml`, then run e.g.
  `./dist/tailbench-aws --filter '^c6in\.xlarge$'`.
- Requires Tailscale >= 1.86 on all three nodes.
- The dashboard shows relay throughput / pps / per-`$` columns, rendered
  **only when relay data exists**.

## Instance pricing

Each result is annotated at aggregation time with an on-demand **$/hr** price
from a curated dataset (`internal/pricing/data.json`) — no price is stored in the
result JSON, so re-pricing every historical result is just a re-aggregate. Prices
assume **Linux, shared tenancy, on-demand** in each provider's canonical region.
Refresh them (no cloud credentials required) with:

```bash
go run ./cmd/pricing-refresh   # AWS bulk list + Azure retail; GCP curated
go run ./cmd/aggregate/        # re-inject price_per_hour into data.generated.js
```

## Development

The Makefile is the supported developer interface. Select exactly one provider
variant for any local build, test, lint, or dependency-boundary check:

```bash
make help
make fmt
make test-aws
make lint-aws
make verify-deps VARIANT=aws
```

Never use `go run ./cmd/tailbench` as a diagnostic shortcut; it compiles a
complete tagged binary while hiding that cost in the invocation. Do not run
`make build`, `make test`, `make lint`, an untagged Go equivalent, or a
hand-written all-variant loop on a normal workstation. CI and dedicated build
hosts own aggregate verification.

`make golangci-lint` installs the pinned linter into `.tools/bin` when it is
absent, so it may download dependencies. Build targets do not intentionally
install tools, although Go may download missing modules. `make clean` removes
only `dist/` and `.tools/`.

Exactly one cloud tag—`aws`, `azure`, or `gcp`—is required. Adding `k8s` selects that cloud's managed Kubernetes implementation. New provider implementation code must use the mutually exclusive cloud/workload constraint, keep shared interfaces and dependency-free helpers untagged, and update `scripts/verify-deps.sh` whenever dependency boundaries change. Every supported tag combination must remain covered by CI.

The CI matrix lints, tests, verifies dependencies, and builds each variant
independently. It does not run Pulumi updates or cloud provisioning. Tagged
releases package the six Linux AMD64 executables separately and publish SHA-256
checksums. See [Contributing to Tailbench](CONTRIBUTING.md) for the local safety
checklist and the CI/build-host boundary.

## Dashboard

Open `website/index.html` locally to view aggregated results, or use the repository's deployed GitHub Pages site.
