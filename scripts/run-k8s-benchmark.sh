#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/config/defaults.sh"
source "$TAILBENCH_ROOT/config/aws.sh"
source "$TAILBENCH_ROOT/config/gcp.sh"
source "$TAILBENCH_ROOT/config/eks.sh"
source "$TAILBENCH_ROOT/config/gke.sh"
source "$TAILBENCH_ROOT/lib/provider.sh"
source "$TAILBENCH_ROOT/lib/iperf.sh"
source "$TAILBENCH_ROOT/lib/tailscale.sh"
source "$TAILBENCH_ROOT/lib/eks.sh"
source "$TAILBENCH_ROOT/lib/gke.sh"
source "$TAILBENCH_ROOT/lib/k8s.sh"

# Ensure kubeconfig points to the right cluster for this provider
if [[ "${CLOUD_PROVIDER:-}" == "gcp" ]]; then
  gke_get_kubeconfig 2>/dev/null || true
elif [[ "${CLOUD_PROVIDER:-}" == "aws" ]]; then
  eks_get_kubeconfig 2>/dev/null || true
fi

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

# Deploy iperf3 pod — use the right AZ/zone depending on provider
K8S_AZ="${GCP_ZONE:-${AWS_AZ:-}}"
k8s_deploy_iperf_pod "$K8S_AZ"
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

# Compute summaries (reuse existing iperf library function)
pod_to_ec2_summary=$(iperf_compute_summary "$k8s_pod_to_ec2_runs")
ec2_to_pod_summary=$(iperf_compute_summary "$k8s_ec2_to_pod_runs")

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

# ============================================================
# Phase 2: Tailscale sidecar pod ↔ EC2 over Tailscale mesh
# ============================================================

if [[ -z "${TS_AUTHKEY:-}" ]]; then
  log_warn "TS_AUTHKEY not set — skipping Tailscale sidecar benchmark"
  exit 0
fi

log_info "=== K8s Tailscale sidecar benchmark for $instance_type ==="

# Get EC2's Tailscale IP (still running from run-benchmark.sh phase 3)
server_ts_ip=$(ts_get_ip "$server_name")
log_info "EC2 Tailscale IP: $server_ts_ip"

# Create secret and deploy sidecar pod
k8s_create_ts_secret "$TS_AUTHKEY"
k8s_deploy_ts_iperf_pod "$K8S_AZ"
k8s_wait_for_ts_pod 240

# Wait for sidecar to get a Tailscale IP
sidecar_ts_ip=$(k8s_get_ts_ip)
log_info "sidecar Tailscale IP: $sidecar_ts_ip"

# Wait for direct peering
log_info "waiting for direct connection between sidecar and EC2"
kubectl exec "$K8S_TS_POD_NAME" -n "$EKS_NAMESPACE" -c ts-sidecar \
  -- tailscale ping --c 1 "$server_ts_ip" >/dev/null 2>&1 || true
sleep 5

# Start iperf3 server on EC2 for sidecar tests
iperf_start_server "$server_name"

# --- Sidecar → EC2 over Tailscale ---
log_info "--- K8s Tailscale Phase: Sidecar → EC2 ---"
k8s_ts_pod_to_ec2_runs="[]"
for i in $(seq 1 "$IPERF_ITERATIONS"); do
  log_info "sidecar→ec2 iteration $i/$IPERF_ITERATIONS"
  raw=$(k8s_ts_exec iperf3 -c "$server_ts_ip" -p "$IPERF_PORT" \
    -t "$IPERF_DURATION" -P "$IPERF_PARALLEL" -J 2>/dev/null) || {
    log_warn "sidecar→ec2 iteration $i failed, skipping"
    continue
  }
  entry=$(echo "$raw" | jq '{
    bandwidth_mbps: (.end.sum_sent.bits_per_second / 1000000),
    retransmits: .end.sum_sent.retransmits,
    duration_sec: .end.sum_sent.seconds,
    bytes_transferred: .end.sum_sent.bytes
  }')
  k8s_ts_pod_to_ec2_runs=$(echo "$k8s_ts_pod_to_ec2_runs" | jq --argjson e "$entry" '. + [$e]')
  [[ $i -lt "$IPERF_ITERATIONS" ]] && sleep 30
done

iperf_stop_server "$server_name"

# --- EC2 → Sidecar over Tailscale ---
log_info "--- K8s Tailscale Phase: EC2 → Sidecar ---"
k8s_ts_ec2_to_pod_runs="[]"
for i in $(seq 1 "$IPERF_ITERATIONS"); do
  log_info "ec2→sidecar iteration $i/$IPERF_ITERATIONS"
  raw=$(cloud_ssh "$server_name" "iperf3 -c $sidecar_ts_ip -p $IPERF_PORT \
    -t $IPERF_DURATION -P $IPERF_PARALLEL -J" 2>/dev/null) || {
    log_warn "ec2→sidecar iteration $i failed, skipping"
    continue
  }
  entry=$(echo "$raw" | jq '{
    bandwidth_mbps: (.end.sum_sent.bits_per_second / 1000000),
    retransmits: .end.sum_sent.retransmits,
    duration_sec: .end.sum_sent.seconds,
    bytes_transferred: .end.sum_sent.bytes
  }')
  k8s_ts_ec2_to_pod_runs=$(echo "$k8s_ts_ec2_to_pod_runs" | jq --argjson e "$entry" '. + [$e]')
  [[ $i -lt "$IPERF_ITERATIONS" ]] && sleep 30
done

# Cleanup sidecar
k8s_cleanup_ts_pod

# Check if we got any results
ts_pod_count=$(echo "$k8s_ts_pod_to_ec2_runs" | jq 'length')
ts_ec2_count=$(echo "$k8s_ts_ec2_to_pod_runs" | jq 'length')
if [[ "$ts_pod_count" -eq 0 && "$ts_ec2_count" -eq 0 ]]; then
  log_error "all Tailscale sidecar iterations failed — skipping result merge"
  exit 0
fi

# Compute summaries
ts_pod_to_ec2_summary=$(iperf_compute_summary "$k8s_ts_pod_to_ec2_runs")
ts_ec2_to_pod_summary=$(iperf_compute_summary "$k8s_ts_ec2_to_pod_runs")

ts_pod_to_ec2_avg=$(echo "$ts_pod_to_ec2_summary" | jq '.bandwidth_mbps_avg')
ts_ec2_to_pod_avg=$(echo "$ts_ec2_to_pod_summary" | jq '.bandwidth_mbps_avg')

ts_pod_overhead=$(echo "$baseline_avg $ts_pod_to_ec2_avg" | awk '{printf "%.1f", (1 - $2/$1) * 100}')
ts_ec2_overhead=$(echo "$baseline_avg $ts_ec2_to_pod_avg" | awk '{printf "%.1f", (1 - $2/$1) * 100}')

# Merge Tailscale sidecar results
ts_data=$(jq -n \
  --argjson pod_to_ec2_runs "$k8s_ts_pod_to_ec2_runs" \
  --argjson pod_to_ec2_summary "$ts_pod_to_ec2_summary" \
  --argjson ec2_to_pod_runs "$k8s_ts_ec2_to_pod_runs" \
  --argjson ec2_to_pod_summary "$ts_ec2_to_pod_summary" \
  --arg sidecar_ts_ip "$sidecar_ts_ip" \
  --argjson pod_to_ec2_overhead "$ts_pod_overhead" \
  --argjson ec2_to_pod_overhead "$ts_ec2_overhead" \
  '{
    k8s_tailscale_pod_to_ec2_tcp: {
      runs: $pod_to_ec2_runs,
      summary: $pod_to_ec2_summary
    },
    k8s_tailscale_ec2_to_pod_tcp: {
      runs: $ec2_to_pod_runs,
      summary: $ec2_to_pod_summary
    },
    k8s_tailscale_config: {
      sidecar_ts_ip: $sidecar_ts_ip,
      mode: "kernel"
    },
    k8s_tailscale_overhead: {
      pod_to_ec2_vs_baseline_pct: $pod_to_ec2_overhead,
      ec2_to_pod_vs_baseline_pct: $ec2_to_pod_overhead
    }
  }')

tmp_result=$(mktemp)
jq --argjson ts "$ts_data" '. + $ts' "$result_file" > "$tmp_result"
mv "$tmp_result" "$result_file"

log_info "Tailscale sidecar results merged into $result_file"
log_info "sidecar→ec2: ${ts_pod_to_ec2_avg} Mbps (${ts_pod_overhead}% overhead)"
log_info "ec2→sidecar: ${ts_ec2_to_pod_avg} Mbps (${ts_ec2_overhead}% overhead)"
