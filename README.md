# Tailbench

Automated Tailscale network overhead benchmarking across GCP, AWS, and Azure. Measures iperf3 throughput and MTR latency over baseline LAN vs Tailscale CGNAT, displayed on a static dashboard.

## Quick Start

```bash
export TS_OAUTH_CLIENT_ID="..."
export TS_OAUTH_CLIENT_SECRET="..."

# Single instance test (GCP default)
./scripts/orchestrate.sh --filter '^c3-standard-4$'

# AWS — all families
./scripts/orchestrate.sh --provider aws

# Azure — specific family
./scripts/orchestrate.sh --provider azure --family dsv5

# All three providers in parallel
./scripts/orchestrate.sh --providers gcp,aws,azure

# Skip ephemeral tailnet, use existing credentials
./scripts/orchestrate.sh --provider aws --no-create-tailnet

# Dry run
./scripts/orchestrate.sh --provider aws --dry-run
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
| c4, c4a, c3d, n4, c3, n2, c2 | c6in, c7i, c7gn, c8g, c6i, m6i, c7g, m7g | dsv5, dasv5, dpsv6, dsv4, fsv2, fasv6, esv4 |

Families are ordered with current-gen and network-optimized families first. Instance types within each family are discovered dynamically from each provider's API.

## What It Does

For each instance type, creates a pair of identical VMs in the same zone/subnet, then:

1. Waits for a direct Tailscale connection (warns if traffic is DERP-relayed)
2. **Baseline**: 3x iperf3 runs over LAN IP + MTR trace
3. **Tailscale**: 3x iperf3 runs over CGNAT IP + MTR trace
4. Computes overhead percentage and writes result JSON
5. Tears down the pair and moves to the next type

If provisioning hits a quota error, remaining instance types in that family are automatically skipped.

Results go to `<provider>/<family>/results/<type>.json` and are aggregated into `website/data.generated.js`.

## Networking

**GCP** uses the pre-existing default VPC. No setup needed.

**AWS** and **Azure** networking persists across runs by default. On the first run, a VPC/VNet is created and tagged `Project=tailbench`. Subsequent runs discover the existing resources and reuse them, avoiding redundant create/delete cycles.

| | AWS | Azure |
|-|-----|-------|
| **Creates** | VPC, subnet, internet gateway, route table, security group, cluster placement group | VNet + subnet, NSG with SSH and internal traffic rules |
| **Discovery** | Tag query (`Project=tailbench`) to resolve VPC, subnet, SG, IGW, route table, placement group | Name-based lookup (`tailbench-vnet`) |
| **CIDR** | 10.0.0.0/16 (VPC), 10.0.1.0/24 (subnet) | 10.0.0.0/16 (VNet), 10.0.1.0/24 (subnet) |
| **Tagging** | All resources tagged `Project=tailbench` | All resources tagged `Project=tailbench` |
| **Cleanup** | Waits for instances to terminate, then deletes in reverse order | Deletes NSG, then VNet |

Networking is **not** torn down on exit. Use `--cleanup-networking` to explicitly delete networking resources after the run completes:

```bash
./scripts/orchestrate.sh --provider aws --cleanup-networking
```

To manually find leftover resources:

```bash
# AWS
aws ec2 describe-vpcs --filters "Name=tag:Project,Values=tailbench" --query 'Vpcs[].VpcId'

# Azure
az network vnet list --resource-group tailbench-rg --query "[?tags.Project=='tailbench'].name"
```

To use your own pre-existing networking instead, set the relevant env vars (see below).

## Performance Optimizations

Each benchmark instance is configured with Tailscale's recommended performance best practices during provisioning (`scripts/setup-instance.sh`):

- **UDP GRO forwarding** (`ethtool -K $NETDEV rx-udp-gro-forwarding on rx-gro-list off`) — Coalesces incoming UDP packets in the kernel before handing them to userspace, reducing per-packet overhead for WireGuard traffic. Requires kernel 6.2+. This is the single highest-impact optimization for Tailscale throughput.
- **AWS cluster placement group** — Instances in the same benchmark pair are placed in a cluster placement group, removing the 5 Gbps single-flow cap between instances within the same AZ.

These optimizations reflect what a production Tailscale deployment should apply. See [Tailscale KB: Performance best practices](https://tailscale.com/kb/1320/performance-best-practices) for the full list.

## AMI Selection (AWS)

AMIs are resolved dynamically via `aws ec2 describe-images` for Ubuntu 24.04 Noble in the configured region. Graviton instances automatically get the arm64 AMI. Results are cached per-run. Falls back to hardcoded us-east-1 AMIs if the lookup fails.

## Ephemeral Tailnets

With `--create-tailnet`, the orchestrator:

1. Creates an API-only tailnet using org-level OAuth credentials
2. Gets new OAuth credentials from the created tailnet
3. Applies a minimal ACL policy allowing tagged devices to communicate
4. Runs all benchmarks using the ephemeral tailnet
5. Deletes the tailnet on exit

Requires org-level OAuth credentials with `tailnets` scope.

## Multi-Provider Mode

`--providers gcp,aws,azure` forks one subprocess per provider. Each runs independently with its own networking lifecycle and cleanup. Logs go to `.run/logs/<provider>.log`. The run fails if any provider fails.

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

| Variable | Default | Description |
|----------|---------|-------------|
| `GCP_PROJECT` | `tailscale-sandbox` | GCP project ID |
| `GCP_ZONE` | `us-central1-a` | Compute zone |
| `GCP_REGION` | `us-central1` | Compute region |
| `GCP_NETWORK` | `default` | VPC network |
| `GCP_SUBNET` | `default` | Subnet |

### AWS

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | `us-east-1` | AWS region |
| `AWS_AZ` | `us-east-1a` | Availability zone |
| `AWS_KEY_NAME` | `raj_macbook` | EC2 key pair name |
| `AWS_SSH_KEY_PATH` | `~/.ssh/raj_macbook.pem` | Private key path |
| `AWS_VPC_ID` | *(empty)* | VPC ID — auto-created if empty |
| `AWS_SUBNET_ID` | *(empty)* | Subnet ID — auto-created if empty |
| `AWS_SG_ID` | *(empty)* | Security group — auto-created if empty |

### Azure

| Variable | Default | Description |
|----------|---------|-------------|
| `AZURE_LOCATION` | `eastus` | Azure region |
| `AZURE_RESOURCE_GROUP` | `tailbench-rg` | Resource group (must already exist) |
| `AZURE_SSH_KEY_PATH` | `~/.ssh/id_ed25519` | Private key path |
| `AZURE_SSH_PUB_KEY_PATH` | `~/.ssh/id_ed25519.pub` | Public key path |
| `AZURE_VNET` | *(empty)* | VNet name — auto-created if empty |
| `AZURE_SUBNET` | *(empty)* | Subnet name — auto-created if empty |
| `AZURE_NSG` | *(empty)* | NSG name — auto-created if empty |

### Test Parameters

All overridable via environment:

| Variable | Default | Description |
|----------|---------|-------------|
| `IPERF_DURATION` | `30` | Seconds per iperf3 run |
| `IPERF_PARALLEL` | `4` | Parallel TCP streams |
| `IPERF_ITERATIONS` | `3` | Runs per test |
| `MTR_CYCLES` | `100` | MTR probe count |
| `INSTANCE_PREFIX` | `tb` | VM name prefix |
| `SSH_TIMEOUT` | `60` | SSH connection timeout (seconds) |
| `SSH_RETRIES` | `30` | SSH connection retry attempts |
| `READY_TIMEOUT` | `300` | Max wait for instance readiness (seconds) |

## Structure

```
config/     # Provider config, region defaults, test parameters
lib/        # Shell libraries (provider abstraction, tailscale, iperf, mtr)
scripts/    # Orchestration, provisioning, benchmarking, teardown
website/    # Static dashboard (index.html + data.generated.js)
```

## CI

GitHub Actions workflow runs benchmarks on:
- **Manual dispatch** — pick provider, family, filter, and auth method
- **Weekly schedule** — Monday 6 AM UTC, creates ephemeral tailnet by default

Supports OAuth client credentials and GitHub OIDC token exchange. Results are committed to the repo and the dashboard is deployed to GitHub Pages.

## Dashboard

Open `website/index.html` locally or visit the deployed GitHub Pages site.

## Requirements

At least one provider CLI, authenticated:
- GCP: `gcloud` (`gcloud auth login`)
- AWS: `aws` (`aws configure` or env vars)
- Azure: `az` (`az login`)

Plus: `jq`, `curl`, `ssh`, `scp`
