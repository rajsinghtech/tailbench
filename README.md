# Tailbench

Automated Tailscale network overhead benchmarking across GCP, AWS, and Azure. Measures iperf3 throughput and MTR latency over baseline LAN vs Tailscale CGNAT, displayed on a static dashboard.

## Quick Start

```bash
export TS_OAUTH_CLIENT_ID="..."
export TS_OAUTH_CLIENT_SECRET="..."

# Build
go build -o tailbench ./cmd/tailbench/

# Single instance test (GCP default)
./tailbench --filter '^c3-standard-4$'

# AWS — all families
./tailbench --provider aws

# Azure — specific family
./tailbench --provider azure --family dsv5

# All three providers in parallel
./tailbench --providers gcp,aws,azure

# Skip ephemeral tailnet, use existing credentials
./tailbench --provider aws --no-create-tailnet

# Dry run
./tailbench --provider aws --dry-run
```

## Options

| Flag | Description |
|------|-------------|
| `--provider <gcp\|aws\|azure>` | Single provider (default: gcp) |
| `--providers <gcp,aws,azure>` | Run multiple providers in parallel |
| `--filter <regex>` | Only test matching instance types |
| `--family <name\|all>` | Instance family (default: all) |
| `--create-tailnet` | Create ephemeral tailnet (default) |
| `--no-create-tailnet` | Use existing tailnet credentials directly |
| `--cleanup-networking` | Tear down provider networking after run |
| `--dry-run` | Preview without executing |

### Families per provider

| GCP | AWS | Azure |
|-----|-----|-------|
| c4, c4a, c3d, n4, c3, n2, c2 | c8gn, c6in, c7i, c7gn, c8g, c6i, m6i, c7g, m7g | dsv5, dasv5, dpsv6, dsv4, fsv2, fasv6, falsv6, famsv6, fasv7, falsv7, famsv7, esv4 |

Instance types within each family are discovered dynamically from each provider's API.

## What It Does

For each instance type, creates a pair of identical VMs in the same zone/subnet using Pulumi, then:

1. **Baseline**: 3x iperf3 runs over LAN IP (multi-stream + single-stream) + MTR trace
2. Installs Tailscale and waits for a direct connection (warns if DERP-relayed)
3. **Tailscale**: 3x iperf3 runs over CGNAT IP (multi-stream + single-stream) + MTR trace
4. Computes overhead percentage and writes result JSON
5. Destroys the VM pair stack and moves to the next type

If provisioning hits a quota error, remaining instance types in that family are automatically skipped. Existing results are skipped for resume support.

Results go to `<provider>/<family>/results/<type>.json` and are aggregated into `website/data.generated.js`.

## Architecture

The Go binary uses **Pulumi Automation API** for infrastructure provisioning and **native Go SSH** for benchmark execution:

- **Networking stacks** (long-lived): VPC/VNet per provider, created once and reused
- **VM pair stacks** (ephemeral): 2 identical VMs per instance type, created and destroyed per test
- **tailscale-client-go-v2**: manages auth keys, ACLs, and ephemeral tailnet lifecycle
- **Cloud-init**: single shell template embedded in the binary — installs Tailscale, iperf3, mtr, tunes TCP/GRO

```
cmd/tailbench/          # CLI entry point
internal/
├── config/             # CLI flags, env var defaults
├── provider/           # Provider interface + GCP/AWS/Azure Pulumi implementations
├── tailnet/            # Tailscale API: tailnets, auth keys, ACLs
├── cloudinit/          # Embedded cloud-init template
├── sshclient/          # SSH client with retry and wait-for-ready
├── benchmark/          # iperf3/MTR parsers, Tailscale helpers, benchmark runner
├── result/             # Result types, writer, data.generated.js aggregator
└── orchestrator/       # Main loop: iterate instances, multi-provider, resume
website/                # Static dashboard (index.html + data.generated.js)
```

## Networking

**GCP** uses the pre-existing default VPC. No setup needed.

**AWS** and **Azure** networking is managed by Pulumi stacks that persist across runs. On the first run, resources are created declaratively. Subsequent runs are no-ops (Pulumi detects no changes).

| | AWS | Azure |
|-|-----|-------|
| **Creates** | VPC, subnet, IGW, route table, security group, cluster placement group | VNet + subnet, NSG with SSH/internal/WireGuard rules |
| **CIDR** | 10.0.0.0/16 (VPC), 10.0.1.0/24 (subnet) | 10.0.0.0/16 (VNet), 10.0.1.0/24 (subnet) |
| **State** | Local Pulumi state (`file://./state`) | Local Pulumi state (`file://./state`) |

Use `--cleanup-networking` to destroy networking stacks after the run:

```bash
./tailbench --provider aws --cleanup-networking
```

## Performance Optimizations

Each VM is configured via cloud-init with Tailscale's recommended performance best practices:

- **UDP GRO forwarding** (`ethtool -K $NETDEV rx-udp-gro-forwarding on`) — highest-impact optimization for Tailscale throughput
- **TCP BBR** congestion control + 64MB buffer tuning
- **CPU governor** pinned to performance mode
- **AWS cluster placement group** — removes the 5 Gbps single-flow cap between instances

See [Tailscale KB: Performance best practices](https://tailscale.com/kb/1320/performance-best-practices).

## Ephemeral Tailnets

By default, the orchestrator:

1. Creates an API-only tailnet using org-level OAuth credentials
2. Gets new OAuth credentials from the created tailnet
3. Applies a minimal ACL policy allowing tagged devices to communicate
4. Runs all benchmarks using the ephemeral tailnet
5. Deletes the tailnet on exit (including on Ctrl-C / SIGTERM)

Requires org-level OAuth credentials with `tailnets` scope.

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `TS_OAUTH_CLIENT_ID` | Tailscale OAuth client ID |
| `TS_OAUTH_CLIENT_SECRET` | Tailscale OAuth client secret |

### Tailscale

| Variable | Default | Description |
|----------|---------|-------------|
| `TS_TAG` | `tag:bench` | ACL tag for benchmark nodes |

### GCP

| Variable | Default |
|----------|---------|
| `GCP_PROJECT` | `tailscale-sandbox` |
| `GCP_ZONE` | `us-central1-a` |

### AWS

| Variable | Default |
|----------|---------|
| `AWS_REGION` | `us-east-1` |
| `AWS_AZ` | `us-east-1a` |
| `AWS_KEY_NAME` | `raj_macbook` |
| `AWS_SSH_KEY_PATH` | `~/.ssh/raj_macbook.pem` |

### Azure

| Variable | Default |
|----------|---------|
| `AZURE_LOCATION` | `eastus` |
| `AZURE_RESOURCE_GROUP` | `tailbench-rg` |

### Test Parameters

| Variable | Default | Description |
|----------|---------|-------------|
| `IPERF_DURATION` | `30` | Seconds per iperf3 run |
| `IPERF_PARALLEL` | `4` | Parallel TCP streams |
| `IPERF_ITERATIONS` | `3` | Runs per test |
| `MTR_CYCLES` | `100` | MTR probe count |

## Requirements

- **Go 1.22+**
- **Pulumi CLI** on PATH (for plugin management)
- At least one cloud provider CLI, authenticated:
  - GCP: `gcloud` — also used for instance type listing
  - AWS: `aws` — also used for instance type listing
  - Azure: `az` — also used for instance type listing

## Dashboard

Open `website/index.html` locally or visit the deployed GitHub Pages site.
