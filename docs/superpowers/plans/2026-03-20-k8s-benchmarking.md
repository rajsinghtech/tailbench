# Kubernetes Container Benchmarking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `--k8s` flag to tailbench that runs iperf3 between EKS pods and EC2 instances to measure container networking overhead.

**Architecture:** Bolt-on phase within existing orchestrate.sh pipeline. Long-lived EKS cluster in the same VPC as benchmark EC2 instances. New `run-k8s-benchmark.sh` script merges K8s results into existing per-instance JSON files. Provider-agnostic `lib/k8s.sh` wraps kubectl; AWS-specific `lib/eks.sh` handles EKS discovery/kubeconfig.

**Tech Stack:** Bash, kubectl, aws CLI (eks), jq, networkstatic/iperf3 container image

**Spec:** `docs/superpowers/specs/2026-03-20-k8s-benchmarking-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `config/eks.sh` | EKS config defaults (cluster name, namespace, node type) |
| `lib/eks.sh` | EKS-specific: cluster discovery by tag, kubeconfig setup, cluster info |
| `lib/k8s.sh` | Provider-agnostic kubectl wrappers: pod deploy, wait, exec, cleanup |
| `manifests/iperf3-pod.yaml` | iperf3 pod spec (server mode, kubectl exec for client) |
| `scripts/run-k8s-benchmark.sh` | K8s benchmark orchestration: deploy pod, run both directions, merge results |
| `scripts/setup-k8s-cluster.sh` | One-time EKS cluster provisioning in tailbench VPC |

### Modified Files
| File | Changes |
|------|---------|
| `scripts/orchestrate.sh` | `--k8s` flag parsing, source k8s/eks libs, call run-k8s-benchmark.sh, dry-run output |
| `website/index.html` | K8s badge, two new columns, detail section, filter toggle |

---

### Task Dependencies

Tasks 1-4 are independent and can be done in any order. Task 5 depends on 1, 2, 3, 4. Task 6 depends on 1, 2, 3, 5. Task 7 depends on 1. Task 8 is independent. Task 9 depends on all.

---

### Task 1: EKS Configuration Defaults

**Files:**
- Create: `config/eks.sh`

- [ ] **Step 1: Create config/eks.sh**

```bash
#!/usr/bin/env bash
# EKS configuration

EKS_CLUSTER_NAME="${EKS_CLUSTER_NAME:-tailbench-eks}"
EKS_NAMESPACE="${EKS_NAMESPACE:-tailbench}"
EKS_NODE_INSTANCE_TYPE="${EKS_NODE_INSTANCE_TYPE:-m5.xlarge}"
EKS_SUBNET_CIDR="${EKS_SUBNET_CIDR:-10.0.2.0/24}"
EKS_SUBNET_CIDR_AZ2="${EKS_SUBNET_CIDR_AZ2:-10.0.3.0/24}"
```

- [ ] **Step 2: Verify syntax**

Run: `bash -n config/eks.sh`
Expected: No output (clean parse)

- [ ] **Step 3: Commit**

```bash
git add config/eks.sh
git commit -m "Add EKS configuration defaults"
```

---

### Task 2: lib/eks.sh — EKS Cluster Discovery and Kubeconfig

**Files:**
- Create: `lib/eks.sh`
- Reference: `lib/aws.sh:57-237` (aws_setup_networking pattern)
- Reference: `lib/common.sh:73-80` (require_cmd pattern)

- [ ] **Step 1: Create lib/eks.sh with cluster discovery and kubeconfig functions**

```bash
#!/usr/bin/env bash
# EKS-specific operations: cluster discovery, kubeconfig, cluster info

eks_discover_cluster() {
  local cluster
  cluster=$(aws eks list-clusters \
    --region "$AWS_REGION" \
    --query 'clusters[?@==`'"$EKS_CLUSTER_NAME"'`]' \
    --output text 2>/dev/null) || true

  if [[ -z "$cluster" ]]; then
    log_error "EKS cluster '$EKS_CLUSTER_NAME' not found in $AWS_REGION"
    log_error "Run scripts/setup-k8s-cluster.sh first"
    return 1
  fi
  log_info "discovered EKS cluster: $cluster"
}

eks_get_kubeconfig() {
  log_info "configuring kubeconfig for $EKS_CLUSTER_NAME"
  aws eks update-kubeconfig \
    --region "$AWS_REGION" \
    --name "$EKS_CLUSTER_NAME" \
    --alias "$EKS_CLUSTER_NAME" \
    >/dev/null
}

eks_get_cluster_info() {
  local info
  info=$(aws eks describe-cluster \
    --region "$AWS_REGION" \
    --name "$EKS_CLUSTER_NAME" \
    --query 'cluster.{version:version,platformVersion:platformVersion}' \
    --output json)

  EKS_K8S_VERSION=$(echo "$info" | jq -r '.version')
  log_info "EKS cluster version: $EKS_K8S_VERSION"
}

eks_get_node_instance_type() {
  local node_type
  node_type=$(kubectl get nodes -o jsonpath='{.items[0].metadata.labels.node\.kubernetes\.io/instance-type}' 2>/dev/null) || true
  if [[ -n "$node_type" ]]; then
    EKS_NODE_INSTANCE_TYPE="$node_type"
  fi
  echo "$EKS_NODE_INSTANCE_TYPE"
}
```

- [ ] **Step 2: Verify syntax**

Run: `bash -n lib/eks.sh`
Expected: No output (clean parse)

- [ ] **Step 3: Commit**

```bash
git add lib/eks.sh
git commit -m "Add EKS cluster discovery and kubeconfig library"
```

---

### Task 3: lib/k8s.sh — Provider-Agnostic Kubectl Wrappers

**Files:**
- Create: `lib/k8s.sh`
- Reference: `lib/iperf.sh:63-86` (iperf_run_client pattern)
- Reference: `lib/common.sh:73-80` (require_cmd)

- [ ] **Step 1: Create lib/k8s.sh**

```bash
#!/usr/bin/env bash
# Provider-agnostic Kubernetes operations for benchmarking

K8S_POD_NAME="${K8S_POD_NAME:-tailbench-iperf3}"
K8S_MANIFEST_DIR="$TAILBENCH_ROOT/manifests"

k8s_check_prereqs() {
  require_cmd kubectl
  if ! kubectl cluster-info &>/dev/null; then
    log_error "kubectl cannot reach cluster — run eks_get_kubeconfig first"
    return 1
  fi
}

k8s_ensure_namespace() {
  if ! kubectl get namespace "$EKS_NAMESPACE" &>/dev/null 2>&1; then
    log_info "creating namespace $EKS_NAMESPACE"
    kubectl create namespace "$EKS_NAMESPACE"
  fi
}

k8s_deploy_iperf_pod() {
  local az="${1:-$AWS_AZ}"
  log_info "deploying iperf3 pod in namespace $EKS_NAMESPACE"
  sed "s/REPLACE_AZ/$az/" "$K8S_MANIFEST_DIR/iperf3-pod.yaml" \
    | kubectl apply -n "$EKS_NAMESPACE" -f -
}

k8s_wait_for_pod() {
  local max_wait="${1:-120}"
  log_info "waiting for pod $K8S_POD_NAME to be Running (timeout: ${max_wait}s)"
  if ! kubectl wait pod/"$K8S_POD_NAME" \
    -n "$EKS_NAMESPACE" \
    --for=condition=Ready \
    --timeout="${max_wait}s" 2>/dev/null; then
    log_error "pod $K8S_POD_NAME not ready after ${max_wait}s"
    kubectl describe pod "$K8S_POD_NAME" -n "$EKS_NAMESPACE" 2>/dev/null || true
    return 1
  fi
  log_info "pod $K8S_POD_NAME is Running"
}

k8s_get_pod_ip() {
  local ip
  ip=$(kubectl get pod "$K8S_POD_NAME" \
    -n "$EKS_NAMESPACE" \
    -o jsonpath='{.status.podIP}')
  if [[ -z "$ip" ]]; then
    log_error "could not get pod IP for $K8S_POD_NAME"
    return 1
  fi
  echo "$ip"
}

k8s_exec() {
  kubectl exec "$K8S_POD_NAME" \
    -n "$EKS_NAMESPACE" \
    -- "$@"
}

k8s_cleanup_pod() {
  log_info "cleaning up pod $K8S_POD_NAME"
  kubectl delete pod "$K8S_POD_NAME" \
    -n "$EKS_NAMESPACE" \
    --ignore-not-found \
    --wait=false >/dev/null 2>&1 || true
}
```

- [ ] **Step 2: Verify syntax**

Run: `bash -n lib/k8s.sh`
Expected: No output (clean parse)

- [ ] **Step 3: Commit**

```bash
git add lib/k8s.sh
git commit -m "Add provider-agnostic Kubernetes operations library"
```

---

### Task 4: iperf3 Pod Manifest

**Files:**
- Create: `manifests/iperf3-pod.yaml`

- [ ] **Step 1: Create the manifest directory and pod spec**

```bash
mkdir -p manifests
```

Write `manifests/iperf3-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: tailbench-iperf3
  labels:
    app: tailbench-iperf3
spec:
  nodeSelector:
    topology.kubernetes.io/zone: REPLACE_AZ
  terminationGracePeriodSeconds: 5
  containers:
  - name: iperf3
    image: networkstatic/iperf3:latest
    command: ["iperf3", "-s", "-p", "15201"]
    ports:
    - containerPort: 15201
      protocol: TCP
    resources:
      requests:
        cpu: "2"
        memory: "1Gi"
      limits:
        cpu: "4"
        memory: "2Gi"
```

The `REPLACE_AZ` placeholder is substituted by `k8s_deploy_iperf_pod()` via `sed`. The pod runs iperf3 in server mode by default. For pod→EC2 direction, `k8s_exec` runs iperf3 as a client.

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('manifests/iperf3-pod.yaml'))"`
Expected: No output (clean parse). If python3/yaml unavailable: `kubectl apply --dry-run=client -f manifests/iperf3-pod.yaml` (requires kubectl).

- [ ] **Step 3: Commit**

```bash
git add manifests/iperf3-pod.yaml
git commit -m "Add iperf3 pod manifest for K8s benchmarks"
```

---

### Task 5: scripts/run-k8s-benchmark.sh — K8s Benchmark Execution

**Files:**
- Create: `scripts/run-k8s-benchmark.sh`
- Reference: `scripts/run-benchmark.sh:16-22` (argument handling pattern)
- Reference: `scripts/run-benchmark.sh:177-260` (result JSON assembly pattern)
- Reference: `lib/iperf.sh:63-86` (iperf_run_client)
- Reference: `lib/iperf.sh:136-142` (result parsing)

- [ ] **Step 1: Create run-k8s-benchmark.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/config/defaults.sh"
source "$TAILBENCH_ROOT/config/aws.sh"
source "$TAILBENCH_ROOT/config/eks.sh"
source "$TAILBENCH_ROOT/lib/provider.sh"
source "$TAILBENCH_ROOT/lib/iperf.sh"
source "$TAILBENCH_ROOT/lib/eks.sh"
source "$TAILBENCH_ROOT/lib/k8s.sh"

usage() {
  echo "Usage: $0 <instance_type> <server_name> <server_lan_ip> <result_file>"
  exit 1
}

[[ $# -eq 4 ]] || usage

instance_type="$1"
server_name="$2"
server_lan_ip="$3"
result_file="$4"

log_info "=== K8s benchmark for $instance_type ==="

# Deploy iperf3 pod
k8s_deploy_iperf_pod "$AWS_AZ"
k8s_wait_for_pod 180

pod_ip=$(k8s_get_pod_ip)
log_info "pod IP: $pod_ip"

# Restart iperf3 server on EC2 (stopped by run-benchmark.sh)
iperf_start_server "$server_name"

# --- Pod → EC2 (iperf3 client in pod, server on EC2) ---
log_info "--- K8s Phase: Pod → EC2 ---"
k8s_pod_to_ec2_runs="[]"
for i in $(seq 1 "$IPERF_ITERATIONS"); do
  log_info "pod→ec2 iteration $i/$IPERF_ITERATIONS"
  raw=$(k8s_exec iperf3 -c "$server_lan_ip" -p "$IPERF_PORT" \
    -t "$IPERF_DURATION" -P "$IPERF_PARALLEL" -J 2>/dev/null) || {
    log_warn "pod→ec2 iteration $i failed, skipping"
    continue
  }
  entry=$(echo "$raw" | jq '{
    bandwidth_mbps: (.end.sum_sent.bits_per_second / 1000000),
    retransmits: .end.sum_sent.retransmits,
    duration_sec: .end.sum_sent.seconds,
    bytes_transferred: .end.sum_sent.bytes
  }')
  k8s_pod_to_ec2_runs=$(echo "$k8s_pod_to_ec2_runs" | jq --argjson e "$entry" '. + [$e]')
  [[ $i -lt "$IPERF_ITERATIONS" ]] && sleep 30
done

iperf_stop_server "$server_name"

# --- EC2 → Pod (iperf3 client on EC2, server in pod) ---
log_info "--- K8s Phase: EC2 → Pod ---"
k8s_ec2_to_pod_runs="[]"
for i in $(seq 1 "$IPERF_ITERATIONS"); do
  log_info "ec2→pod iteration $i/$IPERF_ITERATIONS"
  raw=$(cloud_ssh "$server_name" "iperf3 -c $pod_ip -p $IPERF_PORT \
    -t $IPERF_DURATION -P $IPERF_PARALLEL -J" 2>/dev/null) || {
    log_warn "ec2→pod iteration $i failed, skipping"
    continue
  }
  entry=$(echo "$raw" | jq '{
    bandwidth_mbps: (.end.sum_sent.bits_per_second / 1000000),
    retransmits: .end.sum_sent.retransmits,
    duration_sec: .end.sum_sent.seconds,
    bytes_transferred: .end.sum_sent.bytes
  }')
  k8s_ec2_to_pod_runs=$(echo "$k8s_ec2_to_pod_runs" | jq --argjson e "$entry" '. + [$e]')
  [[ $i -lt "$IPERF_ITERATIONS" ]] && sleep 30
done

# Cleanup pod
k8s_cleanup_pod

# Guard against empty runs (all iterations failed)
pod_to_ec2_count=$(echo "$k8s_pod_to_ec2_runs" | jq 'length')
ec2_to_pod_count=$(echo "$k8s_ec2_to_pod_runs" | jq 'length')
if [[ "$pod_to_ec2_count" -eq 0 && "$ec2_to_pod_count" -eq 0 ]]; then
  log_error "all K8s benchmark iterations failed — skipping result merge"
  exit 1
fi

# Compute summaries
compute_summary() {
  local runs="$1"
  echo "$runs" | jq '{
    bandwidth_mbps_avg: ([.[].bandwidth_mbps] | add / length),
    bandwidth_mbps_min: ([.[].bandwidth_mbps] | min),
    bandwidth_mbps_max: ([.[].bandwidth_mbps] | max),
    bandwidth_mbps_stddev: (
      ([.[].bandwidth_mbps] | add / length) as $avg |
      ([.[].bandwidth_mbps | . - $avg | . * .] | add / length | sqrt)
    ),
    retransmits_avg: ([.[].retransmits] | add / length | round)
  }'
}

pod_to_ec2_summary=$(compute_summary "$k8s_pod_to_ec2_runs")
ec2_to_pod_summary=$(compute_summary "$k8s_ec2_to_pod_runs")

# Read baseline for overhead calculation
baseline_avg=$(jq '.baseline_tcp.summary.bandwidth_mbps_avg' "$result_file")
pod_to_ec2_avg=$(echo "$pod_to_ec2_summary" | jq '.bandwidth_mbps_avg')
ec2_to_pod_avg=$(echo "$ec2_to_pod_summary" | jq '.bandwidth_mbps_avg')

pod_to_ec2_overhead=$(echo "$baseline_avg $pod_to_ec2_avg" | awk '{printf "%.1f", (1 - $2/$1) * 100}')
ec2_to_pod_overhead=$(echo "$baseline_avg $ec2_to_pod_avg" | awk '{printf "%.1f", (1 - $2/$1) * 100}')

# Get cluster info
node_type=$(eks_get_node_instance_type)

# Merge K8s results into existing result JSON
k8s_data=$(jq -n \
  --argjson pod_to_ec2_runs "$k8s_pod_to_ec2_runs" \
  --argjson pod_to_ec2_summary "$pod_to_ec2_summary" \
  --argjson ec2_to_pod_runs "$k8s_ec2_to_pod_runs" \
  --argjson ec2_to_pod_summary "$ec2_to_pod_summary" \
  --arg cluster_name "$EKS_CLUSTER_NAME" \
  --arg k8s_version "${EKS_K8S_VERSION:-unknown}" \
  --arg node_type "$node_type" \
  --arg pod_ip "$pod_ip" \
  --argjson pod_to_ec2_overhead "$pod_to_ec2_overhead" \
  --argjson ec2_to_pod_overhead "$ec2_to_pod_overhead" \
  '{
    k8s_config: {
      cluster_name: $cluster_name,
      k8s_version: $k8s_version,
      cni: "aws-vpc-cni",
      node_instance_type: $node_type,
      pod_ip: $pod_ip
    },
    k8s_pod_to_ec2_tcp: {
      runs: $pod_to_ec2_runs,
      summary: $pod_to_ec2_summary
    },
    k8s_ec2_to_pod_tcp: {
      runs: $ec2_to_pod_runs,
      summary: $ec2_to_pod_summary
    },
    k8s_overhead: {
      pod_to_ec2_vs_baseline_pct: $pod_to_ec2_overhead,
      ec2_to_pod_vs_baseline_pct: $ec2_to_pod_overhead
    }
  }')

# Merge into existing result file
tmp_result=$(mktemp)
jq --argjson k8s "$k8s_data" '. + $k8s' "$result_file" > "$tmp_result"
mv "$tmp_result" "$result_file"

log_info "K8s results merged into $result_file"
log_info "pod→ec2: ${pod_to_ec2_avg} Mbps (${pod_to_ec2_overhead}% overhead)"
log_info "ec2→pod: ${ec2_to_pod_avg} Mbps (${ec2_to_pod_overhead}% overhead)"
```

- [ ] **Step 2: Make executable and verify syntax**

Run: `chmod +x scripts/run-k8s-benchmark.sh && bash -n scripts/run-k8s-benchmark.sh`
Expected: No output (clean parse)

- [ ] **Step 3: Commit**

```bash
git add scripts/run-k8s-benchmark.sh
git commit -m "Add K8s benchmark execution script"
```

---

### Task 6: Integrate --k8s Flag into orchestrate.sh

**Files:**
- Modify: `scripts/orchestrate.sh:57-70` (flag parsing)
- Modify: `scripts/orchestrate.sh:5-7` (library sourcing)
- Modify: `scripts/orchestrate.sh:222-256` (after ENA Express phase, add K8s phase)
- Modify: `scripts/orchestrate.sh:378-431` (dry-run output)

- [ ] **Step 1: Add --k8s flag to CLI parsing**

In `scripts/orchestrate.sh`, add to the case statement (after `--dry-run` line):

```bash
    --k8s)        K8S=true; shift ;;
```

Add default near the top with other flag defaults:

```bash
K8S="${K8S:-false}"
```

- [ ] **Step 2: Add `--k8s` to the usage() function**

In the Options section of `usage()` (around lines 20-53), add:

```
  --k8s               Run K8s benchmark phase (requires pre-provisioned EKS cluster)
```

- [ ] **Step 3: Source K8s libraries inside _run_provider()**

Inside `_run_provider()`, after `source "$TAILBENCH_ROOT/lib/provider.sh"` (around line 96), add:

```bash
if [[ "$K8S" == "true" && "$provider" == "aws" ]]; then
  source "$TAILBENCH_ROOT/config/eks.sh"
  source "$TAILBENCH_ROOT/lib/eks.sh"
  source "$TAILBENCH_ROOT/lib/k8s.sh"
fi
```

This ensures provider.sh is already loaded (for `cloud_ssh` etc.) before K8s libs are sourced.

- [ ] **Step 4: Add EKS setup to provider initialization**

Inside `_run_provider()`, after `cloud_setup_networking` is called, add the K8s cluster setup (kubeconfig, validation):

```bash
if [[ "$K8S" == "true" && "$provider" == "aws" ]]; then
  eks_discover_cluster
  eks_get_kubeconfig
  eks_get_cluster_info
  k8s_check_prereqs
  k8s_ensure_namespace
fi
```

- [ ] **Step 5: Add K8s awareness to skip-if-cached logic**

In the skip-if-exists block (around line 167-182), add after the `ena_needs_run` check:

```bash
local k8s_needs_run=false
if [[ "$K8S" == "true" && "$provider" == "aws" ]]; then
  if ! jq -e '.k8s_pod_to_ec2_tcp' "$existing_result" &>/dev/null; then
    k8s_needs_run=true
  fi
fi
```

And modify the skip condition (line 172) from:
```bash
if [[ -f "$existing_result" && "$ena_needs_run" == "false" ]]; then
```
to:
```bash
if [[ -f "$existing_result" && "$ena_needs_run" == "false" && "$k8s_needs_run" == "false" ]]; then
```

- [ ] **Step 6: Add K8s phase to per-instance loop**

After the ENA Express block (around line 256), before teardown, add. Note: uses UPPERCASE variable names matching orchestrate.sh conventions (`$SERVER_NAME`, `$SERVER_LAN_IP`):

```bash
# --- K8s benchmark phase ---
if [[ -z "$step_failed" && "$K8S" == "true" && "$provider" == "aws" ]]; then
  local result_file="$TAILBENCH_ROOT/$provider/$family/results/$inst.json"
  if [[ -f "$result_file" ]]; then
    log_info "[$inst] running K8s benchmark"
    "$TAILBENCH_ROOT/scripts/run-k8s-benchmark.sh" \
      "$inst" "$SERVER_NAME" "$SERVER_LAN_IP" "$result_file" || {
      log_warn "[$inst] K8s benchmark failed"
    }
  else
    log_warn "[$inst] skipping K8s benchmark — no result file found"
  fi
fi
```

- [ ] **Step 7: Add K8s to dry-run output**

In the dry-run block (around line 413-417, after ENA Express dry-run), add:

```bash
if [[ "$K8S" == "true" && "$p" == "aws" ]]; then
  echo "  [K8s] deploy iperf3 pod on $EKS_CLUSTER_NAME"
  echo "  run-k8s-benchmark.sh $inst <server> <s_lan> <result_file>"
  echo "  -> pod↔ec2 results merged into $p/$family/results/$inst.json"
fi
```

- [ ] **Step 8: Verify syntax**

Run: `bash -n scripts/orchestrate.sh`
Expected: No output (clean parse)

- [ ] **Step 9: Test dry-run output**

Run: `./scripts/orchestrate.sh --provider aws --family c6in --k8s --dry-run`
Expected: Output should show K8s phase lines for each instance type

- [ ] **Step 10: Commit**

```bash
git add scripts/orchestrate.sh
git commit -m "Add --k8s flag for container benchmarking phase"
```

---

### Task 7: scripts/setup-k8s-cluster.sh — One-Time EKS Provisioning

**Files:**
- Create: `scripts/setup-k8s-cluster.sh`
- Reference: `lib/aws.sh:138-163` (VPC/subnet creation pattern)
- Reference: `lib/aws.sh:197-220` (security group rules pattern)

- [ ] **Step 1: Create setup-k8s-cluster.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/config/aws.sh"
source "$TAILBENCH_ROOT/config/eks.sh"

require_cmd aws kubectl

log_info "=== EKS Cluster Setup for Tailbench ==="

# Discover existing VPC
AWS_VPC_ID=$(aws ec2 describe-vpcs \
  --region "$AWS_REGION" \
  --filters "Name=tag:Project,Values=tailbench" \
  --query 'Vpcs[0].VpcId' --output text)

if [[ "$AWS_VPC_ID" == "None" || -z "$AWS_VPC_ID" ]]; then
  log_error "tailbench VPC not found — run a benchmark first to create it"
  exit 1
fi
log_info "found VPC: $AWS_VPC_ID"

# Discover existing security group
AWS_SG_ID=$(aws ec2 describe-security-groups \
  --region "$AWS_REGION" \
  --filters "Name=tag:Project,Values=tailbench" "Name=vpc-id,Values=$AWS_VPC_ID" \
  --query 'SecurityGroups[0].GroupId' --output text)

log_info "found security group: $AWS_SG_ID"

# Create EKS worker subnet (same AZ as benchmarks)
EKS_SUBNET_ID=$(aws ec2 describe-subnets \
  --region "$AWS_REGION" \
  --filters "Name=tag:Name,Values=tailbench-eks-subnet" "Name=vpc-id,Values=$AWS_VPC_ID" \
  --query 'Subnets[0].SubnetId' --output text 2>/dev/null) || true

if [[ "$EKS_SUBNET_ID" == "None" || -z "$EKS_SUBNET_ID" ]]; then
  log_info "creating EKS worker subnet ($EKS_SUBNET_CIDR) in $AWS_AZ"
  EKS_SUBNET_ID=$(aws ec2 create-subnet \
    --region "$AWS_REGION" \
    --vpc-id "$AWS_VPC_ID" \
    --cidr-block "$EKS_SUBNET_CIDR" \
    --availability-zone "$AWS_AZ" \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=tailbench-eks-subnet},{Key=Project,Value=tailbench}]' \
    --query 'Subnet.SubnetId' --output text)

  # Enable auto-assign public IP for EKS nodes
  aws ec2 modify-subnet-attribute \
    --region "$AWS_REGION" \
    --subnet-id "$EKS_SUBNET_ID" \
    --map-public-ip-on-launch
else
  log_info "found existing EKS subnet: $EKS_SUBNET_ID"
fi

# Create second AZ subnet (EKS control plane requires multi-AZ)
AWS_AZ2="${AWS_REGION}b"
EKS_SUBNET_ID_AZ2=$(aws ec2 describe-subnets \
  --region "$AWS_REGION" \
  --filters "Name=tag:Name,Values=tailbench-eks-subnet-az2" "Name=vpc-id,Values=$AWS_VPC_ID" \
  --query 'Subnets[0].SubnetId' --output text 2>/dev/null) || true

if [[ "$EKS_SUBNET_ID_AZ2" == "None" || -z "$EKS_SUBNET_ID_AZ2" ]]; then
  log_info "creating EKS AZ2 subnet ($EKS_SUBNET_CIDR_AZ2) in $AWS_AZ2"
  EKS_SUBNET_ID_AZ2=$(aws ec2 create-subnet \
    --region "$AWS_REGION" \
    --vpc-id "$AWS_VPC_ID" \
    --cidr-block "$EKS_SUBNET_CIDR_AZ2" \
    --availability-zone "$AWS_AZ2" \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=tailbench-eks-subnet-az2},{Key=Project,Value=tailbench}]' \
    --query 'Subnet.SubnetId' --output text)
else
  log_info "found existing AZ2 subnet: $EKS_SUBNET_ID_AZ2"
fi

# Associate subnets with the VPC route table (for internet access)
RTB_ID=$(aws ec2 describe-route-tables \
  --region "$AWS_REGION" \
  --filters "Name=vpc-id,Values=$AWS_VPC_ID" "Name=association.main,Values=true" \
  --query 'RouteTables[0].RouteTableId' --output text)

aws ec2 associate-route-table --region "$AWS_REGION" \
  --route-table-id "$RTB_ID" --subnet-id "$EKS_SUBNET_ID" >/dev/null 2>&1 || true
aws ec2 associate-route-table --region "$AWS_REGION" \
  --route-table-id "$RTB_ID" --subnet-id "$EKS_SUBNET_ID_AZ2" >/dev/null 2>&1 || true

# Create IAM role for EKS cluster (if not exists)
EKS_CLUSTER_ROLE="tailbench-eks-cluster-role"
if ! aws iam get-role --role-name "$EKS_CLUSTER_ROLE" &>/dev/null; then
  log_info "creating EKS cluster IAM role"
  aws iam create-role \
    --role-name "$EKS_CLUSTER_ROLE" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{"Effect": "Allow", "Principal": {"Service": "eks.amazonaws.com"}, "Action": "sts:AssumeRole"}]
    }' >/dev/null
  aws iam attach-role-policy --role-name "$EKS_CLUSTER_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy
fi

EKS_CLUSTER_ROLE_ARN=$(aws iam get-role --role-name "$EKS_CLUSTER_ROLE" \
  --query 'Role.Arn' --output text)

# Create IAM role for EKS nodes (if not exists)
EKS_NODE_ROLE="tailbench-eks-node-role"
if ! aws iam get-role --role-name "$EKS_NODE_ROLE" &>/dev/null; then
  log_info "creating EKS node IAM role"
  aws iam create-role \
    --role-name "$EKS_NODE_ROLE" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{"Effect": "Allow", "Principal": {"Service": "ec2.amazonaws.com"}, "Action": "sts:AssumeRole"}]
    }' >/dev/null
  aws iam attach-role-policy --role-name "$EKS_NODE_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy
  aws iam attach-role-policy --role-name "$EKS_NODE_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
  aws iam attach-role-policy --role-name "$EKS_NODE_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
fi

EKS_NODE_ROLE_ARN=$(aws iam get-role --role-name "$EKS_NODE_ROLE" \
  --query 'Role.Arn' --output text)

# Create EKS cluster
EXISTING_CLUSTER=$(aws eks describe-cluster \
  --region "$AWS_REGION" \
  --name "$EKS_CLUSTER_NAME" \
  --query 'cluster.status' --output text 2>/dev/null) || true

if [[ "$EXISTING_CLUSTER" == "ACTIVE" ]]; then
  log_info "EKS cluster $EKS_CLUSTER_NAME already exists and is ACTIVE"
else
  log_info "creating EKS cluster $EKS_CLUSTER_NAME (this takes ~10-15 minutes)"
  aws eks create-cluster \
    --region "$AWS_REGION" \
    --name "$EKS_CLUSTER_NAME" \
    --role-arn "$EKS_CLUSTER_ROLE_ARN" \
    --resources-vpc-config "subnetIds=$EKS_SUBNET_ID,$EKS_SUBNET_ID_AZ2,securityGroupIds=$AWS_SG_ID" \
    --tags Project=tailbench \
    >/dev/null

  log_info "waiting for cluster to become ACTIVE..."
  aws eks wait cluster-active \
    --region "$AWS_REGION" \
    --name "$EKS_CLUSTER_NAME"
  log_info "cluster is ACTIVE"
fi

# Configure kubeconfig
aws eks update-kubeconfig \
  --region "$AWS_REGION" \
  --name "$EKS_CLUSTER_NAME" \
  --alias "$EKS_CLUSTER_NAME" >/dev/null

# Create node group
EXISTING_NG=$(aws eks describe-nodegroup \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME" \
  --nodegroup-name tailbench-nodes \
  --query 'nodegroup.status' --output text 2>/dev/null) || true

if [[ "$EXISTING_NG" == "ACTIVE" ]]; then
  log_info "node group tailbench-nodes already exists and is ACTIVE"
else
  log_info "creating managed node group (this takes ~3-5 minutes)"
  aws eks create-nodegroup \
    --region "$AWS_REGION" \
    --cluster-name "$EKS_CLUSTER_NAME" \
    --nodegroup-name tailbench-nodes \
    --node-role "$EKS_NODE_ROLE_ARN" \
    --instance-types "$EKS_NODE_INSTANCE_TYPE" \
    --scaling-config minSize=1,maxSize=2,desiredSize=1 \
    --subnets "$EKS_SUBNET_ID" \
    --tags Project=tailbench \
    >/dev/null

  log_info "waiting for node group to become ACTIVE..."
  aws eks wait nodegroup-active \
    --region "$AWS_REGION" \
    --cluster-name "$EKS_CLUSTER_NAME" \
    --nodegroup-name tailbench-nodes
  log_info "node group is ACTIVE"
fi

# Add security group rule: allow iperf3 from pod subnet to benchmark SG
log_info "adding security group rule for pod→EC2 iperf3 traffic"
aws ec2 authorize-security-group-ingress \
  --region "$AWS_REGION" \
  --group-id "$AWS_SG_ID" \
  --protocol tcp --port 15201 \
  --cidr "$EKS_SUBNET_CIDR" >/dev/null 2>&1 || true

# Also allow benchmark SG → pod subnet (EC2→pod direction)
# EKS node SG is managed by EKS, get it
EKS_NODE_SG=$(aws ec2 describe-security-groups \
  --region "$AWS_REGION" \
  --filters "Name=tag:kubernetes.io/cluster/$EKS_CLUSTER_NAME,Values=owned" \
  --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null) || true

if [[ -n "$EKS_NODE_SG" && "$EKS_NODE_SG" != "None" ]]; then
  log_info "adding cross-SG rules for EC2↔pod traffic"
  aws ec2 authorize-security-group-ingress \
    --region "$AWS_REGION" \
    --group-id "$EKS_NODE_SG" \
    --protocol tcp --port 15201 \
    --source-group "$AWS_SG_ID" >/dev/null 2>&1 || true
fi

# Create namespace
kubectl create namespace "$EKS_NAMESPACE" 2>/dev/null || true

# Verify VPC CNI
log_info "verifying VPC CNI"
kubectl get daemonset aws-node -n kube-system >/dev/null 2>&1 \
  && log_info "aws-vpc-cni is active" \
  || log_warn "aws-vpc-cni not detected — pods may not get VPC IPs"

# Verify node is ready
kubectl wait node --all --for=condition=Ready --timeout=120s >/dev/null
log_info "node is Ready"

# Summary
log_info "=== EKS Setup Complete ==="
log_info "cluster:   $EKS_CLUSTER_NAME"
log_info "namespace: $EKS_NAMESPACE"
log_info "subnet:    $EKS_SUBNET_ID ($EKS_SUBNET_CIDR in $AWS_AZ)"
log_info "node type: $EKS_NODE_INSTANCE_TYPE"
log_info ""
log_info "Run benchmarks with: ./scripts/orchestrate.sh --provider aws --family <family> --k8s"
```

- [ ] **Step 2: Make executable and verify syntax**

Run: `chmod +x scripts/setup-k8s-cluster.sh && bash -n scripts/setup-k8s-cluster.sh`
Expected: No output (clean parse)

- [ ] **Step 3: Commit**

```bash
git add scripts/setup-k8s-cluster.sh
git commit -m "Add one-time EKS cluster provisioning script"
```

---

### Task 8: Dashboard — K8s Badge, Columns, and Detail Section

**Files:**
- Modify: `website/index.html:270-281` (CSS — add k8s-tag style)
- Modify: `website/index.html:750-763` (table columns — add K8s columns)
- Modify: `website/index.html:811` (table row — add K8s badge)
- Modify: `website/index.html:861-951` (detail view — add K8s section)
- Modify: `website/index.html:667-680` (filter pills — add K8s toggle)

- [ ] **Step 1: Add CSS for K8s badge**

Add after the `.ena-tag` CSS block (around line 281):

```css
.k8s-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: #e67e22;
  color: #fff;
  margin-left: 4px;
  vertical-align: middle;
}
```

- [ ] **Step 2: Add K8s columns to table head**

In the column definitions (around line 763, before the `overhead` column push), add:

```javascript
if (data.some(d => d.k8s_pod_to_ec2_tcp)) {
  cols.push({key:'k8s_pod_to_ec2', label:'K8s→EC2'});
  cols.push({key:'k8s_ec2_to_pod', label:'EC2→K8s'});
}
```

- [ ] **Step 3: Add K8s badge to table rows**

In the instance type cell (around line 811), after the ENA Express badge:

```javascript
+ (d.k8s_pod_to_ec2_tcp ? '<span class="k8s-tag">K8s</span>' : '')
```

- [ ] **Step 4: Add K8s cell values to table rows**

In the row rendering, add cells for the K8s columns (after baseline/tailscale cells):

```javascript
if (data.some(d => d.k8s_pod_to_ec2_tcp)) {
  const k8sPod = d.k8s_pod_to_ec2_tcp ? (d.k8s_pod_to_ec2_tcp.summary.bandwidth_mbps_avg / 1000).toFixed(1) : '—';
  const k8sEc2 = d.k8s_ec2_to_pod_tcp ? (d.k8s_ec2_to_pod_tcp.summary.bandwidth_mbps_avg / 1000).toFixed(1) : '—';
  html += '<td>' + k8sPod + (k8sPod !== '—' ? ' Gbps' : '') + '</td>';
  html += '<td>' + k8sEc2 + (k8sEc2 !== '—' ? ' Gbps' : '') + '</td>';
}
```

- [ ] **Step 5: Add K8s section to detail view**

In `renderDetail()` (around line 896), add after existing detail grid:

```javascript
if (d.k8s_pod_to_ec2_tcp) {
  html += '<div class="detail-section" style="border: 2px solid #e67e22; border-radius: 8px; padding: 16px; margin-top: 16px;">';
  html += '<h3 style="color: #e67e22; margin-top: 0;">Kubernetes (' + (d.k8s_config?.cni || 'unknown CNI') + ')</h3>';
  html += '<div class="detail-grid">';

  // Pod → EC2
  html += '<div><h4>Pod → EC2</h4>';
  html += '<p>Avg: ' + (d.k8s_pod_to_ec2_tcp.summary.bandwidth_mbps_avg / 1000).toFixed(1) + ' Gbps</p>';
  d.k8s_pod_to_ec2_tcp.runs.forEach(function(r, i) {
    html += '<p class="detail-run">Run ' + (i+1) + ': ' + (r.bandwidth_mbps / 1000).toFixed(1) + ' Gbps</p>';
  });
  if (d.k8s_overhead) {
    html += '<p><span class="overhead-badge" style="background: #e74c3c;">' + d.k8s_overhead.pod_to_ec2_vs_baseline_pct + '% vs baseline</span></p>';
  }
  html += '</div>';

  // EC2 → Pod
  html += '<div><h4>EC2 → Pod</h4>';
  html += '<p>Avg: ' + (d.k8s_ec2_to_pod_tcp.summary.bandwidth_mbps_avg / 1000).toFixed(1) + ' Gbps</p>';
  d.k8s_ec2_to_pod_tcp.runs.forEach(function(r, i) {
    html += '<p class="detail-run">Run ' + (i+1) + ': ' + (r.bandwidth_mbps / 1000).toFixed(1) + ' Gbps</p>';
  });
  if (d.k8s_overhead) {
    html += '<p><span class="overhead-badge" style="background: #e74c3c;">' + d.k8s_overhead.ec2_to_pod_vs_baseline_pct + '% vs baseline</span></p>';
  }
  html += '</div>';

  html += '</div>'; // detail-grid
  html += '<p style="font-size: 12px; opacity: 0.7; margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 8px;">';
  html += 'Cluster: ' + (d.k8s_config?.cluster_name || '') + ' | K8s ' + (d.k8s_config?.k8s_version || '') + ' | Node: ' + (d.k8s_config?.node_instance_type || '');
  html += '</p>';
  html += '</div>'; // detail-section
}
```

- [ ] **Step 6: Add K8s filter toggle**

In the filter pills area (around line 680), add after the provider pills:

```javascript
// K8s filter toggle
const k8sFilter = document.createElement('div');
k8sFilter.className = 'filter-group';
k8sFilter.innerHTML = '<span class="filter-label">Show:</span>';
const k8sPill = document.createElement('span');
k8sPill.className = 'pill' + (filterK8s ? ' active' : '');
k8sPill.textContent = 'K8s Only';
k8sPill.style.background = filterK8s ? '#e67e22' : '';
k8sPill.onclick = function() {
  filterK8s = !filterK8s;
  updateHash();
  render();
};
k8sFilter.appendChild(k8sPill);
```

Add `filterK8s` state variable and hash parsing alongside existing filter state. In the data filtering logic, add:

```javascript
if (filterK8s) {
  filtered = filtered.filter(d => d.k8s_pod_to_ec2_tcp);
}
```

- [ ] **Step 7: Verify dashboard loads**

Open `website/index.html` in a browser. Verify:
- No JavaScript errors in console
- Existing data still renders correctly
- K8s columns only appear if any data has k8s fields (should not appear with current data)

- [ ] **Step 8: Commit**

```bash
git add website/index.html
git commit -m "Add K8s benchmark results to dashboard"
```

---

### Task 9: End-to-End Dry Run Verification

**Files:** None (verification only)

- [ ] **Step 1: Verify all new files parse cleanly**

Run:
```bash
for f in config/eks.sh lib/eks.sh lib/k8s.sh scripts/run-k8s-benchmark.sh scripts/setup-k8s-cluster.sh; do
  bash -n "$f" && echo "OK: $f" || echo "FAIL: $f"
done
```
Expected: All OK

- [ ] **Step 2: Verify orchestrate.sh dry-run with --k8s**

Run: `./scripts/orchestrate.sh --provider aws --family c6in --k8s --dry-run`
Expected: Output includes K8s phase lines for each instance type

- [ ] **Step 3: Verify orchestrate.sh dry-run without --k8s still works**

Run: `./scripts/orchestrate.sh --provider aws --family c6in --dry-run`
Expected: No K8s output, existing behavior unchanged

- [ ] **Step 4: Verify generate-results.sh still works**

Run: `./scripts/generate-results.sh`
Expected: Generates data.generated.js with existing results, no errors
