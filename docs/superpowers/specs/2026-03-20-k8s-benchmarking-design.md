# Kubernetes Container Benchmarking — Design Spec

## Overview

Extend tailbench to benchmark container networking performance by running iperf3 tests between Kubernetes pods and EC2 instances colocated in the same VPC. This measures the overhead introduced by the container networking layer (CNI) compared to bare-metal VM baselines already captured by existing benchmarks.

**Phase 1**: Pod↔EC2 iperf3 over VPC fabric (measures CNI overhead)
**Phase 2** (future): Tailscale sidecar pod↔EC2 iperf3 over Tailscale mesh (measures containerized Tailscale overhead)

## Architecture

### Approach: Bolt-On Phase

K8s benchmarking is an additional phase within the existing `orchestrate.sh` pipeline, triggered by a `--k8s` flag. This follows the same pattern as the ENA Express phase — optional, runs after the core VM benchmarks, extends the same result JSON.

### Execution Model

A new `scripts/run-k8s-benchmark.sh` handles the K8s test phase. This keeps `run-benchmark.sh` untouched. The orchestrator calls it from the per-instance loop (after the standard benchmark, before teardown) — the same slot where ENA Express sits today.

`run-k8s-benchmark.sh` takes: instance_type, server_name, server_lan_ip, result_file_path. It deploys the iperf3 pod, runs both directions, and merges K8s results into the existing result JSON via `jq '. + {k8s_config: ..., k8s_pod_to_ec2_tcp: ...}' existing.json > tmp && mv tmp existing.json`.

The `--k8s` flag is a script-global variable (`K8S=true`), inherited by `_run_provider()` subshells — same pattern as `DRY_RUN`, `FILTER`, etc.

### Cluster Strategy

- **Long-lived EKS cluster**, pre-provisioned in the same VPC as the benchmark EC2 instances
- A one-time `setup-k8s-cluster.sh` script handles provisioning
- Benchmark runs discover the cluster by tag (`Project=tailbench`) and configure kubeconfig
- Pods are ephemeral — deployed per benchmark run, cleaned up after

### Network Topology

```
┌────────────────────────────── AWS VPC (tailbench) ──────────────────────────────┐
│                                                                                  │
│  Subnet A: 10.0.1.0/24 (us-east-1a)     Subnet B: 10.0.2.0/24 (us-east-1a)   │
│  ┌──────────────────────┐                 ┌──────────────────────────────┐       │
│  │  EC2 Instances        │                 │  EKS Worker Nodes + Pods     │       │
│  │  (ephemeral/run)      │                 │                              │       │
│  │  ┌────────────────┐   │   iperf3 TCP    │  ┌────────────────────────┐  │       │
│  │  │ server         │◄──┼─────────────────┼──┤ iperf3 pod             │  │       │
│  │  │ 10.0.1.x       │   │                 │  │ 10.0.2.x (VPC IP)     │  │       │
│  │  └────────────────┘   │                 │  └────────────────────────┘  │       │
│  └──────────────────────┘                 └──────────────────────────────┘       │
│                                                                                  │
│  Subnet C: 10.0.3.0/24 (us-east-1b)  — EKS control plane requirement           │
│  (no benchmark resources, satisfies EKS multi-AZ subnet requirement)            │
│                                                                                  │
│  Security group: intra-SG rule + ingress from 10.0.2.0/24 on TCP 5201          │
│  EKS uses aws-vpc-cni → pods get real VPC IPs → no NAT/overlay                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Subnet topology**: The existing VPC has subnet A (`10.0.1.0/24`) for EC2 instances. `setup-k8s-cluster.sh` creates:
- Subnet B (`10.0.2.0/24`, same AZ) for EKS worker nodes and pods
- Subnet C (`10.0.3.0/24`, different AZ) to satisfy EKS multi-AZ requirement for the control plane

**Security group**: The existing SG allows all intra-SG traffic. Since pods are not in the SG, `setup-k8s-cluster.sh` adds an ingress rule allowing TCP 5201 (iperf3 port) from `10.0.2.0/24` (the pod subnet CIDR). The EKS node group SG also needs a rule allowing traffic from the benchmark SG.

The EKS VPC CNI assigns pods real VPC IP addresses, so traffic between pods and EC2 instances stays on the VPC fabric with no overlay or NAT — a clean measurement of CNI overhead only.

## Test Flow

Existing phases (unchanged):
1. Provision EC2 pair (server + client)
2. Baseline iperf3 (LAN, no Tailscale)
3. Tailscale setup + iperf3
4. ENA Express (if supported)

New phases (when `--k8s` flag is set):
5. Restart iperf3 server on EC2 (stopped by run-benchmark.sh after phase 3)
6. Deploy iperf3 pod on EKS cluster, wait for Running status (includes image pull)
7. **Pod→EC2**: `kubectl exec` iperf3 client in pod → EC2 server LAN IP
8. **EC2→Pod**: SSH iperf3 client on EC2 → pod's VPC IP (pod runs iperf3 server)
9. Merge K8s results into existing result JSON
10. Clean up pod (`kubectl delete`)

Phase 2 (future):
11. Deploy Tailscale sidecar pod (using manifests similar to ../kubernetes-manifests)
12. Sidecar↔EC2 iperf3 over Tailscale mesh

### Dry-run output

When `--dry-run --k8s` is set, print the K8s phase preview (same format as ENA Express dry-run output):
```
  K8s benchmark:
    Cluster: tailbench-eks
    Pod→EC2: iperf3 from pod to server LAN IP
    EC2→Pod: iperf3 from EC2 to pod VPC IP
```

## New Files

```
tailbench/
├── lib/
│   ├── k8s.sh                  # Provider-agnostic kubectl wrappers
│   └── eks.sh                  # EKS-specific: cluster discovery, kubeconfig
├── scripts/
│   ├── run-k8s-benchmark.sh    # K8s benchmark execution (called from orchestrate.sh)
│   └── setup-k8s-cluster.sh    # One-time EKS provisioning helper
├── manifests/
│   └── iperf3-pod.yaml         # iperf3 pod spec (runs as both server and client)
```

Note: `manifests/tailscale-sidecar.yaml` is Phase 2 and not created in Phase 1.

### Modified Files

- `config/aws.sh` — add defaults:
  ```
  EKS_CLUSTER_NAME="${EKS_CLUSTER_NAME:-tailbench-eks}"
  EKS_NAMESPACE="${EKS_NAMESPACE:-tailbench}"
  ```
- `scripts/orchestrate.sh` — add `--k8s` flag parsing, source k8s/eks libs, call `run-k8s-benchmark.sh` in the per-instance loop (after standard benchmark, before teardown)
- `website/index.html` — K8s badge, columns, detail section, filter toggle
- `scripts/generate-results.sh` — no changes needed (K8s data merged into existing JSON files)

### lib/k8s.sh — Core Functions

Provider-agnostic, works with any Kubernetes cluster (EKS, GKE, AKS):

```
k8s_deploy_iperf_pod()     # kubectl apply -f manifests/iperf3-pod.yaml
k8s_wait_for_pod()         # Poll until pod is Running (handles image pull latency)
k8s_get_pod_ip()           # Extract pod IP for VPC-routed traffic
k8s_exec()                 # kubectl exec wrapper
k8s_cleanup_pod()          # kubectl delete pod
```

### lib/eks.sh — AWS EKS-Specific

```
eks_get_kubeconfig()       # aws eks update-kubeconfig
eks_discover_cluster()     # Find cluster in benchmark VPC by tag
eks_get_cluster_info()     # Version, CNI, node instance type
```

### Prerequisites

When `--k8s` is active, check for `kubectl` in addition to existing required commands. This is checked at startup (same pattern as `aws_required_cmds()`).

## Pod Manifest

`manifests/iperf3-pod.yaml` uses the `networkstatic/iperf3` image (widely used, multi-arch). The pod runs iperf3 in server mode by default (`iperf3 -s`). For the pod→EC2 direction, `kubectl exec` runs iperf3 in client mode against the EC2 LAN IP.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: tailbench-iperf3
  namespace: tailbench
  labels:
    app: tailbench-iperf3
spec:
  nodeSelector:
    topology.kubernetes.io/zone: us-east-1a  # Same AZ as EC2 instances
  containers:
  - name: iperf3
    image: networkstatic/iperf3:latest
    command: ["iperf3", "-s"]
    ports:
    - containerPort: 5201
```

For EC2→Pod: the pod already runs iperf3 server. The EC2 instance runs `iperf3 -c <pod_ip>`.
For Pod→EC2: `kubectl exec tailbench-iperf3 -- iperf3 -c <ec2_lan_ip>` while iperf3 server is running on EC2.

## Data Model

Results are **merged into the existing per-instance JSON file** (e.g., `aws/c6in/results/c6in.xlarge.json`). The `run-k8s-benchmark.sh` script reads the existing JSON, adds K8s fields, and writes it back. This keeps results unified per instance type (unlike ENA Express which uses separate files because it represents a different network configuration).

```json
{
  "instance_type": "c6in.xlarge",
  // ... existing fields ...

  "k8s_config": {
    "cluster_name": "tailbench-eks",
    "k8s_version": "1.31",
    "cni": "aws-vpc-cni",
    "node_instance_type": "m5.xlarge",
    "pod_ip": "10.0.2.47"
  },

  "k8s_pod_to_ec2_tcp": {
    "runs": [
      { "bandwidth_mbps": 9200, "retransmits": 12, "duration_sec": 30, "bytes_transferred": 34500000000 }
    ],
    "summary": {
      "bandwidth_mbps_avg": 9150,
      "bandwidth_mbps_min": 9100,
      "bandwidth_mbps_max": 9300,
      "bandwidth_mbps_stddev": 82,
      "retransmits_avg": 10
    }
  },

  "k8s_ec2_to_pod_tcp": {
    // Same structure as above
  },

  "k8s_overhead": {
    "pod_to_ec2_vs_baseline_pct": 70.3,
    "ec2_to_pod_vs_baseline_pct": 71.0
  }
}
```

**Overhead baseline**: `k8s_overhead` percentages are computed against `baseline_tcp` (LAN, no Tailscale) from the same instance type's result. This measures how much slower pod↔EC2 traffic is compared to raw VM-to-VM LAN.

Phase 2 will add `k8s_tailscale_tcp` and `k8s_tailscale_overhead` following the same pattern.

## Dashboard

### Table View
- Orange "K8s" badge on rows with container results (same pattern as ENA Express amber badge)
- Two new columns: **K8s→EC2** and **EC2→K8s** showing bandwidth in Gbps
- Rows without K8s data show "—" in those columns
- Columns sortable like existing ones

### Detail View (row expand)
- Orange-bordered section showing K8s results
- Per-direction breakdown: Pod→EC2 and EC2→Pod
- Individual run data, overhead vs baseline percentage
- Cluster metadata: name, K8s version, CNI, node instance type

### Filters
- "K8s Only" toggle pill in the filter bar to show only instances with container data
- URL hash persistence for the filter state

### Implementation note
Dashboard changes are substantial (new columns, badge, detail section, filter). Consider implementing as a separate step from the shell-side work to keep changes reviewable.

## EKS Cluster Setup

`scripts/setup-k8s-cluster.sh` is a one-time provisioning script:

1. Discover existing tailbench VPC by `Project=tailbench` tag
2. Create subnet B (`10.0.2.0/24`) in the benchmark AZ (us-east-1a) for EKS workers/pods
3. Create subnet C (`10.0.3.0/24`) in a second AZ (us-east-1b) for EKS control plane multi-AZ requirement
4. Create EKS cluster in the VPC with subnets B and C
5. Create managed node group (m5.xlarge) pinned to subnet B (same AZ as benchmarks)
6. Add security group ingress rule: TCP 5201 from `10.0.2.0/24` to the benchmark SG
7. Add cross-SG rules: benchmark SG ↔ EKS node SG for iperf3 traffic
8. Tag cluster with `Project=tailbench` for discovery
9. Create `tailbench` namespace
10. Verify aws-vpc-cni is active and pods get VPC IPs

This is run manually before benchmark runs — not part of the automated pipeline.

## Scope

### In scope (Phase 1)
- `--k8s` flag on orchestrate.sh
- `scripts/run-k8s-benchmark.sh`
- EKS cluster provisioning helper script
- lib/k8s.sh and lib/eks.sh
- iperf3 pod manifest
- Pod↔EC2 bidirectional iperf3 benchmarks
- JSON schema extension (merged into existing files)
- Dashboard: K8s badge, columns, detail section, filter
- Dry-run output for K8s phase
- `kubectl` prerequisite check

### In scope (Phase 2 — future)
- Tailscale sidecar pod manifest
- Sidecar↔EC2 iperf3 over Tailscale
- Dashboard: Tailscale sidecar results section

### Out of scope
- GKE / AKS support (future, uses same lib/k8s.sh)
- Pod-to-pod benchmarks (same cluster)
- Cluster autoscaling or multi-node-group testing
- Service mesh benchmarks
