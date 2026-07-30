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

`plan` — and its `--dry-run` alias — prints the provider, each configured mode with its applicability, and every instance type that `--family` and `--filter` select, then exits without touching any cloud. An unrecognized `--family` is not rejected outright: the plan warns that nothing matched the local catalog, and the `no-runnable-work` guardrail then refuses the run before anything is provisioned.

An explicit provider must match the binary. For example, `tailbench-aws --provider gcp` fails rather than silently using AWS. Renaming an executable does not change its provider identity.

`doctor --remote` is opt-in. It loads the configured credential source and
performs read-only Pulumi, Tailscale-value, and cloud CLI checks. `run`, or an
invocation with no subcommand and `dry_run: false`, can provision billable
resources. Tailbench prints the selected topology, duration, cost estimate, and
cleanup policy before an interactive run. With `cleanup_policy: always`, the
duration estimate is presented as an upper bound. With `on-success` or
`manual`, it is only an execution-window estimate: resources can remain
billable after `max_duration`, so Tailbench explicitly reports that no lifetime
cost upper bound is available. Automation requires both `--yes` and an
explicitly configured `--max-cost-usd`:

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

### Repeatable AWS invocations

The Makefile also wraps the four AWS commands above, so the selector and the
guardrails stay identical between planning and running. AWS credentials come
from a Pulumi ESC environment (`esc run`), while Tailscale OAuth still comes
from `.env` through `env_file:`. All four expect `make build-aws` to have run
already:

```bash
make plan-aws            # side-effect-free plan
make doctor-aws          # local prerequisite checks
make doctor-aws-remote   # read-only remote checks, through ESC
make bench-aws           # PROVISIONS; prints the plan and waits for confirmation
make bench-aws YES=1     # noninteractive, which requires the cost ceiling
```

Each value is a Make variable with a default: `ESC_ENV=tailscale-phase-2/aws-oidc`,
`FILTER=^c6in\.large$`, `MAX_COST=5`, `MAX_DURATION=45m`, `MAX_TYPES=1`. Override
them on the command line, for example
`make bench-aws FILTER='^c6in\.(large|xlarge)$' MAX_TYPES=2 MAX_COST=15`. Only
`bench-aws` provisions anything: `plan-aws` reaches no network at all, and
`doctor-aws-remote` is read-only. Equivalent targets do not yet exist for the
other five variants — invoke those binaries directly, as shown above.

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

### Tailscale credentials and the tailnet

Benchmark nodes join a tailnet with an auth key, and an auth key has to be
minted against a tailnet, so `tailscale:` must describe one of two models.
Configuring neither is refused at startup, before anything is provisioned
(`internal/orchestrator/orchestrator.go:174`):

| `create_tailnet` | Also set | What tailbench does |
|---|---|---|
| `true` | — | Creates an ephemeral tailnet, and deletes it under the run's cleanup policy |
| `false` | `tailnet_dns_name: example.ts.net` | Joins the tailnet the configured OAuth client already belongs to; creates and deletes nothing |

Which model you can use is decided by the OAuth client you are able to issue.
The client in `.env` is used **only** to create and delete tailnets:
`CreateTailnet` returns a second, per-tailnet OAuth client
(`internal/tailnet/tailnet.go:63`), and every later call — policy file, HTTPS,
auth keys, stale-device cleanup — is made with that one instead. Creating a
tailnet needs an organization-level permission that is not one of the published
Tailscale OAuth scopes, so a tailnet-scoped client still fails with
`403 actor does not have permission to create tailnets` even when it holds scope
`all`. If you cannot issue an org-level client, use `create_tailnet: false` with
`tailnet_dns_name`.

> **Warning:** on both paths, tailbench **replaces the tailnet's entire policy
> file** with an allow-all benchmark ACL (`internal/tailnet/tailnet.go:150-160`).
> Joining is not read-only. Point `tailnet_dns_name` at a tailnet dedicated to
> benchmarking, never at one carrying real traffic.

Tailbench also enables HTTPS on the tailnet whenever the run needs it — for the
Kubernetes operator's API-server proxy, and for any `l7-serve-*` mode on VMs
(`internal/orchestrator/orchestrator.go:1614`). Without HTTPS, cloud-init blocks
indefinitely in `tailscale serve --https=443` and the node never reports ready.

## Infrastructure lifecycle

For each selected instance type, Tailbench provisions a server/client pair, runs the applicable benchmark modes, writes compatible JSON results, and destroys the pair. Existing results are skipped for resume support, and quota failures skip the remaining types in the affected family.

Provider networking and cluster infrastructure are **no longer reused by default**. `cleanup_networking` is derived from `cleanup_policy` (`internal/config/config.go:457`), which defaults to `always`, so a completed run also tears down its networking stack and the tailnet it created. Set `cleanup_policy: manual` to keep them for the next run — note that the instance-type cache is only read when networking is being kept.

Generated benchmark data continues to aggregate into `website/data.generated.js`.

### SSH access to benchmark nodes

Benchmarks themselves run over Tailscale SSH, so a cloud SSH key is only needed
for the failure that matters most: cloud-init dying before `tailscale up`, which
otherwise leaves a billed instance with no way in at all.

When no public key is configured, tailbench generates an ed25519 key pair,
writes the private half to `.tailbench/ssh/<name>.pem` with mode `0600`
(`.tailbench/` is gitignored), and installs the public half on every node it
creates (`internal/provider/sshkey.go:35`). An existing key is reused and never
regenerated: a new public key would make Pulumi replace the key-pair resource
and would silently invalidate a private key you had already saved.

| Provider | Configure your own key with | Otherwise |
|---|---|---|
| AWS/EKS | `aws.key_name` — an existing EC2 key pair, used as-is | Generates the key and creates the EC2 key pair from it |
| Azure/AKS | `azure.ssh_pub_key_file` — a path, whose read errors are fatal | Generates the key and embeds it in each VM |
| GCP/GKE | *(no configuration key)* | Always generates; login user defaults to `ubuntu` |

`ssh.ready_timeout` (default 300 seconds) bounds the wait for
`/tmp/tailbench-ready`. On expiry the error names the diagnostic recipe: connect
with the saved key, then read `cloud-init status --long` and
`/var/log/cloud-init-output.log`.

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

### Reading the overhead number

The dashboard's headline overhead is `overhead.bandwidth_pct`, derived from the
**multi-stream** iperf3 run (`benchmark.iperf_parallel`, 4 by default). The
checked-in `c6in` results (`aws/c6in/results/*-l4-kernel.json`, `us-west-2`)
show why that number should be read with care:

| Instance | vCPUs | Baseline, 1 → 4 streams | Tailscale, 1 → 4 streams |
|---|---|---|---|
| `c6in.large` | 2 | 9.5 → 24.8 Gbps (2.6x) | 3.15 → 3.24 Gbps (1.03x) |
| `c6in.2xlarge` | 8 | 9.5 → 37.4 Gbps (3.9x) | 3.96 → 4.25 Gbps (1.07x) |
| `c6in.8xlarge` | 32 | 9.5 → 37.9 Gbps (4.0x) | 6.18 → 6.34 Gbps (1.03x) |
| `c6in.32xlarge` | 128 | 9.5 → 37.7 Gbps (4.0x) | 5.70 → 5.79 Gbps (1.02x) |

Across the whole family — every size from 2 to 128 vCPUs, plus `c6in.metal` —
Tailscale TCP throughput gains only **1.02x to 1.13x** from four parallel
streams versus one, and plateaus near 6 Gbps. The non-Tailscale baseline is a
flat ~9.5 Gbps on a single stream and scales to 24.8–37.9 Gbps on four. So the
multi-stream overhead sits at 83–89% at every size, and what moves inside that
band is mostly how far the *baseline* scaled out, not what the crypto path cost.
The single-stream comparison is the fairer read: `overhead_single` in the same
result files ranges from 66.7% at 2 vCPUs to 34.7% at 32, which is the figure
that actually tracks vCPU count. It is recorded in the result JSON but not
charted.

This is an observation about these result files, not a vendor claim — rerun the
family yourself before generalizing it. It is also the empirical reason this
repository sizes exit nodes and relay nodes in **packets per second** rather
than Gbps: a parallel-stream Gbps figure is largely a statement about the
instance, while the per-packet crypto work is what actually bounds a forwarding
node.
