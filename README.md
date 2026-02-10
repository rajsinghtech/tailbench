# Tailbench

Tailscale network overhead benchmarking across GCP instance types. Measures iperf3 throughput and MTR latency over baseline LAN vs Tailscale CGNAT, displayed on a dashboard.

## Quick Start

```bash
export TS_OAUTH_CLIENT_ID="..."
export TS_OAUTH_CLIENT_SECRET="..."
export TS_TAG="tag:bench"

# Single instance test
./scripts/orchestrate.sh --filter '^c3-standard-4$'

# Full suite with ephemeral tailnet
./scripts/orchestrate.sh --create-tailnet

# Dry run
./scripts/orchestrate.sh --dry-run
```

## Options

| Flag | Description |
|------|-------------|
| `--filter <regex>` | Only test matching instance types |
| `--family <c3\|n2\|all>` | Instance family (default: all) |
| `--create-tailnet` | Create/destroy an ephemeral API-only tailnet |
| `--dry-run` | Preview without executing |

## What It Does

For each instance type, creates a pair of identical GCP VMs, then:

1. **Baseline**: 3x iperf3 runs over LAN IP + MTR trace
2. **Tailscale**: 3x iperf3 runs over CGNAT IP + MTR trace
3. Computes overhead percentage and writes result JSON
4. Tears down the pair and moves to the next type

Results go to `gcp/<family>/results/<type>.json` and are aggregated into `website/data.generated.js` for the dashboard.

## Structure

```
config/     # Instance types, GCP region, test parameters
lib/        # Shell libraries (gcp, tailscale, iperf, mtr, cleanup)
scripts/    # Executable scripts (orchestrate, provision, benchmark, teardown)
website/    # Static dashboard (index.html + data.generated.js)
```

## Dashboard

Open `website/index.html` in a browser. Deployed to GitHub Pages on push to main.

## Requirements

- `gcloud` CLI (authenticated)
- `jq`, `curl`
- Tailscale OAuth client with device creation scope (or org-level with `tailnets` scope for `--create-tailnet`)
