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

All variants use the Pulumi core SDK and Automation API. Keeping all variants in one Go module means `go mod download` can still download modules that a particular binary does not compile or link.

## Quick start

Build only the variant you need:

```bash
make build-gcp
make build-aws-k8s
```

The binaries are written under `dist/`. If `providers` is absent or empty in `config.yaml`, each binary defaults to its compiled provider:

```bash
./dist/tailbench-gcp --filter '^c3-standard-4$'
./dist/tailbench-aws --family c7i --dry-run
./dist/tailbench-aws-k8s --provider eks --family c7i
```

An explicit provider must match the binary. For example, `tailbench-aws --provider gcp` fails rather than silently using AWS. Renaming an executable does not change its provider identity.

The local aggregate targets are deliberately sequential, including when invoked through `make -j`:

```bash
make build
make test GO_TEST_FLAGS=-p=1
make lint
make verify-deps
```

Compiling Pulumi SDKs is memory intensive; prefer a single variant target during normal development.

## Configuration and modes

Tailbench reads `config.yaml` by default. Use `--config`, `--provider`, `--family`, `--filter`, `--dry-run`, and `--cleanup-networking` to override the supported command-line settings.

Provider values remain `aws`, `eks`, `azure`, `aks`, `gcp`, and `gke`. These values—not executable names—continue to determine result directories, local Pulumi state paths, and stack naming. Results remain under:

```text
<provider>/<family>/results/<instance-type>-<mode>.json
```

VM binaries support VM modes such as `l4-kernel` and `l7-serve-*`. They reject Kubernetes-only modes such as `l4-lb` and `l7-ingress-*`. The `*-k8s` binaries retain pod execution, operator installation, load-balancer discovery, and L7 manifest deployment.

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

Local Pulumi state remains in `state/<provider>`. Generated benchmark data continues to aggregate into `website/data.generated.js`.

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

The Makefile is the supported developer interface:

```bash
make help
make fmt
make test-azure
make lint-gcp-k8s
make verify-deps VARIANT=aws
```

`make golangci-lint` is the only target that installs the pinned linter into `.tools/bin`; build targets do not download tools. `make clean` removes only `dist/` and `.tools/`.

Exactly one cloud tag—`aws`, `azure`, or `gcp`—is required. Adding `k8s` selects that cloud's managed Kubernetes implementation. New provider implementation code must use the mutually exclusive cloud/workload constraint, keep shared interfaces and dependency-free helpers untagged, and update `scripts/verify-deps.sh` whenever dependency boundaries change. Every supported tag combination must remain covered by CI.

The CI matrix lints, tests, verifies dependencies, and builds each variant independently. It does not run Pulumi updates or cloud provisioning. Tagged releases package the six Linux AMD64 executables separately and publish SHA-256 checksums.

## Dashboard

Open `website/index.html` locally to view aggregated results, or use the repository's deployed GitHub Pages site.
