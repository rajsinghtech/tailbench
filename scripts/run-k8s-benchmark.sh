#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/config/defaults.sh"
source "$TAILBENCH_ROOT/config/aws.sh"
source "$TAILBENCH_ROOT/config/gcp.sh"
source "$TAILBENCH_ROOT/config/azure.sh"
source "$TAILBENCH_ROOT/config/eks.sh"
source "$TAILBENCH_ROOT/config/gke.sh"
source "$TAILBENCH_ROOT/config/aks.sh"
source "$TAILBENCH_ROOT/lib/provider.sh"
source "$TAILBENCH_ROOT/lib/iperf.sh"
source "$TAILBENCH_ROOT/lib/tailscale.sh"
source "$TAILBENCH_ROOT/lib/eks.sh"
source "$TAILBENCH_ROOT/lib/gke.sh"
source "$TAILBENCH_ROOT/lib/aks.sh"
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

case "${CLOUD_PROVIDER:-aws}" in
  gcp)   gke_get_kubeconfig 2>/dev/null || true ;;
  azure) aks_get_kubeconfig 2>/dev/null || true ;;
  *)     eks_get_kubeconfig 2>/dev/null || true ;;
esac

# AZ/zone for pod node affinity; AKS uses empty (no zone selector)
case "${CLOUD_PROVIDER:-aws}" in
  gcp)   K8S_AZ="$GCP_ZONE" ;;
  azure) K8S_AZ="" ;;
  *)     K8S_AZ="$AWS_AZ" ;;
esac

# Provider-agnostic cluster metadata
case "${CLOUD_PROVIDER:-aws}" in
  gcp)   K8S_CLUSTER_NAME="$GKE_CLUSTER_NAME"; K8S_VERSION="${GKE_K8S_VERSION:-unknown}" ;;
  azure) K8S_CLUSTER_NAME="$AKS_CLUSTER_NAME"; K8S_VERSION="${AKS_K8S_VERSION:-unknown}" ;;
  *)     K8S_CLUSTER_NAME="$EKS_CLUSTER_NAME"; K8S_VERSION="${EKS_K8S_VERSION:-unknown}" ;;
esac

log_info "=== K8s benchmark for $instance_type ==="
k8s_deploy_iperf_pod "$K8S_AZ"
k8s_wait_for_pod 180

pod_ip=$(k8s_get_pod_ip)
log_info "pod IP: $pod_ip"

# ── Phase 1: Pod → VM ────────────────────────────────────────────────
log_info "=== K8s Phase 1: Pod → VM ==="
iperf_start_server "$server_name"

log_info "Running pod→vm TCP test (multi-stream)"
k8s_pod_to_vm_runs=$(k8s_iperf_run_test "$server_lan_ip" "$IPERF_DURATION" "$IPERF_PARALLEL" "$IPERF_ITERATIONS")

log_info "Running pod→vm TCP test (single-stream)"
k8s_pod_to_vm_single_runs=$(k8s_iperf_run_test "$server_lan_ip" "$IPERF_DURATION" 1 "$IPERF_ITERATIONS")

iperf_stop_server "$server_name"

# ── Phase 2: VM → Pod ────────────────────────────────────────────────
# Pod's iperf3 server is the container entrypoint — always running on $IPERF_PORT
log_info "=== K8s Phase 2: VM → Pod ==="

log_info "Running vm→pod TCP test (multi-stream)"
k8s_vm_to_pod_runs=$(iperf_run_test "$server_name" "$pod_ip" "$IPERF_DURATION" "$IPERF_PARALLEL" "$IPERF_ITERATIONS")

log_info "Running vm→pod TCP test (single-stream)"
k8s_vm_to_pod_single_runs=$(iperf_run_test "$server_name" "$pod_ip" "$IPERF_DURATION" 1 "$IPERF_ITERATIONS")

k8s_cleanup_pod

if [[ "$(echo "$k8s_pod_to_vm_runs" | jq 'length')" -eq 0 && \
      "$(echo "$k8s_vm_to_pod_runs" | jq 'length')" -eq 0 ]]; then
  log_error "all K8s benchmark iterations failed — skipping result merge"
  exit 1
fi

k8s_pod_to_vm_summary=$(iperf_compute_summary "$k8s_pod_to_vm_runs")
k8s_pod_to_vm_single_summary=$(iperf_compute_summary "$k8s_pod_to_vm_single_runs")
k8s_vm_to_pod_summary=$(iperf_compute_summary "$k8s_vm_to_pod_runs")
k8s_vm_to_pod_single_summary=$(iperf_compute_summary "$k8s_vm_to_pod_single_runs")

baseline_avg=$(jq '.baseline_tcp.summary.bandwidth_mbps_avg' "$result_file")
baseline_single_avg=$(jq '.baseline_tcp_single.summary.bandwidth_mbps_avg' "$result_file")

pod_to_vm_avg=$(echo "$k8s_pod_to_vm_summary" | jq '.bandwidth_mbps_avg')
pod_to_vm_single_avg=$(echo "$k8s_pod_to_vm_single_summary" | jq '.bandwidth_mbps_avg')
vm_to_pod_avg=$(echo "$k8s_vm_to_pod_summary" | jq '.bandwidth_mbps_avg')
vm_to_pod_single_avg=$(echo "$k8s_vm_to_pod_single_summary" | jq '.bandwidth_mbps_avg')

node_type=$(k8s_get_node_type)

k8s_data=$(jq -n \
  --arg cluster_name "$K8S_CLUSTER_NAME" \
  --arg k8s_version "$K8S_VERSION" \
  --arg node_type "$node_type" \
  --arg pod_ip "$pod_ip" \
  --argjson pod_to_vm_runs "$k8s_pod_to_vm_runs" \
  --argjson pod_to_vm_summary "$k8s_pod_to_vm_summary" \
  --argjson pod_to_vm_single_runs "$k8s_pod_to_vm_single_runs" \
  --argjson pod_to_vm_single_summary "$k8s_pod_to_vm_single_summary" \
  --argjson vm_to_pod_runs "$k8s_vm_to_pod_runs" \
  --argjson vm_to_pod_summary "$k8s_vm_to_pod_summary" \
  --argjson vm_to_pod_single_runs "$k8s_vm_to_pod_single_runs" \
  --argjson vm_to_pod_single_summary "$k8s_vm_to_pod_single_summary" \
  --argjson pod_to_vm_overhead "$(iperf_overhead_pct "$baseline_avg" "$pod_to_vm_avg")" \
  --argjson pod_to_vm_single_overhead "$(iperf_overhead_pct "$baseline_single_avg" "$pod_to_vm_single_avg")" \
  --argjson vm_to_pod_overhead "$(iperf_overhead_pct "$baseline_avg" "$vm_to_pod_avg")" \
  --argjson vm_to_pod_single_overhead "$(iperf_overhead_pct "$baseline_single_avg" "$vm_to_pod_single_avg")" \
  '{
    k8s_config: {
      cluster_name: $cluster_name,
      k8s_version: $k8s_version,
      cni: (if env.CLOUD_PROVIDER == "gcp" then "gke-vpc-native" elif env.CLOUD_PROVIDER == "azure" then "azure-cni" else "aws-vpc-cni" end),
      node_instance_type: $node_type,
      pod_ip: $pod_ip
    },
    k8s_pod_to_vm_tcp:        {runs: $pod_to_vm_runs,        summary: $pod_to_vm_summary},
    k8s_pod_to_vm_tcp_single: {runs: $pod_to_vm_single_runs, summary: $pod_to_vm_single_summary},
    k8s_vm_to_pod_tcp:        {runs: $vm_to_pod_runs,        summary: $vm_to_pod_summary},
    k8s_vm_to_pod_tcp_single: {runs: $vm_to_pod_single_runs, summary: $vm_to_pod_single_summary},
    k8s_overhead: {
      pod_to_vm_vs_baseline_pct:        $pod_to_vm_overhead,
      pod_to_vm_single_vs_baseline_pct: $pod_to_vm_single_overhead,
      vm_to_pod_vs_baseline_pct:        $vm_to_pod_overhead,
      vm_to_pod_single_vs_baseline_pct: $vm_to_pod_single_overhead
    }
  }')

tmp=$(mktemp); jq --argjson k8s "$k8s_data" '. + $k8s' "$result_file" > "$tmp" && mv "$tmp" "$result_file"

log_info "K8s results merged into $result_file"
log_info "pod→vm:  $(echo "$pod_to_vm_avg" | jq -r 'round') Mbps multi / $(echo "$pod_to_vm_single_avg" | jq -r 'round') Mbps single"
log_info "vm→pod:  $(echo "$vm_to_pod_avg" | jq -r 'round') Mbps multi / $(echo "$vm_to_pod_single_avg" | jq -r 'round') Mbps single"

# ============================================================
# Phase 3: Tailscale sidecar pod ↔ VM over Tailscale mesh
# ============================================================

if [[ -z "${TS_AUTHKEY:-}" ]]; then
  log_warn "TS_AUTHKEY not set — skipping Tailscale sidecar benchmark"
  exit 0
fi

log_info "=== K8s Tailscale sidecar benchmark for $instance_type ==="

server_ts_ip=$(ts_get_ip "$server_name")
log_info "VM Tailscale IP: $server_ts_ip"

k8s_create_ts_secret "$TS_AUTHKEY"
k8s_deploy_ts_iperf_pod "$K8S_AZ"
k8s_wait_for_ts_pod 240

sidecar_ts_ip=$(k8s_get_ts_ip)
log_info "sidecar Tailscale IP: $sidecar_ts_ip"

log_info "waiting for direct connection between sidecar and VM"
kubectl exec "$K8S_TS_POD_NAME" -n "$K8S_NAMESPACE" -c ts-sidecar \
  -- tailscale ping --c 1 "$server_ts_ip" >/dev/null 2>&1 || true
sleep 5

# ── Phase 3a: Sidecar → VM (via Tailscale) ──────────────────────────
log_info "=== K8s Tailscale Phase 3a: Sidecar → VM ==="
iperf_start_server "$server_name"

log_info "Running sidecar→vm Tailscale TCP test (multi-stream)"
k8s_ts_pod_to_vm_runs=$(k8s_ts_iperf_run_test "$server_ts_ip" "$IPERF_DURATION" "$IPERF_PARALLEL" "$IPERF_ITERATIONS")

log_info "Running sidecar→vm Tailscale TCP test (single-stream)"
k8s_ts_pod_to_vm_single_runs=$(k8s_ts_iperf_run_test "$server_ts_ip" "$IPERF_DURATION" 1 "$IPERF_ITERATIONS")

iperf_stop_server "$server_name"

# ── Phase 3b: VM → Sidecar (via Tailscale) ──────────────────────────
log_info "=== K8s Tailscale Phase 3b: VM → Sidecar ==="

log_info "Running vm→sidecar Tailscale TCP test (multi-stream)"
k8s_ts_vm_to_pod_runs=$(iperf_run_test "$server_name" "$sidecar_ts_ip" "$IPERF_DURATION" "$IPERF_PARALLEL" "$IPERF_ITERATIONS")

log_info "Running vm→sidecar Tailscale TCP test (single-stream)"
k8s_ts_vm_to_pod_single_runs=$(iperf_run_test "$server_name" "$sidecar_ts_ip" "$IPERF_DURATION" 1 "$IPERF_ITERATIONS")

k8s_cleanup_ts_pod

if [[ "$(echo "$k8s_ts_pod_to_vm_runs" | jq 'length')" -eq 0 && \
      "$(echo "$k8s_ts_vm_to_pod_runs" | jq 'length')" -eq 0 ]]; then
  log_error "all Tailscale sidecar iterations failed — skipping result merge"
  exit 0
fi

ts_pod_to_vm_summary=$(iperf_compute_summary "$k8s_ts_pod_to_vm_runs")
ts_pod_to_vm_single_summary=$(iperf_compute_summary "$k8s_ts_pod_to_vm_single_runs")
ts_vm_to_pod_summary=$(iperf_compute_summary "$k8s_ts_vm_to_pod_runs")
ts_vm_to_pod_single_summary=$(iperf_compute_summary "$k8s_ts_vm_to_pod_single_runs")

ts_pod_to_vm_avg=$(echo "$ts_pod_to_vm_summary" | jq '.bandwidth_mbps_avg')
ts_pod_to_vm_single_avg=$(echo "$ts_pod_to_vm_single_summary" | jq '.bandwidth_mbps_avg')
ts_vm_to_pod_avg=$(echo "$ts_vm_to_pod_summary" | jq '.bandwidth_mbps_avg')
ts_vm_to_pod_single_avg=$(echo "$ts_vm_to_pod_single_summary" | jq '.bandwidth_mbps_avg')

ts_data=$(jq -n \
  --argjson pod_to_vm_runs "$k8s_ts_pod_to_vm_runs" \
  --argjson pod_to_vm_summary "$ts_pod_to_vm_summary" \
  --argjson pod_to_vm_single_runs "$k8s_ts_pod_to_vm_single_runs" \
  --argjson pod_to_vm_single_summary "$ts_pod_to_vm_single_summary" \
  --argjson vm_to_pod_runs "$k8s_ts_vm_to_pod_runs" \
  --argjson vm_to_pod_summary "$ts_vm_to_pod_summary" \
  --argjson vm_to_pod_single_runs "$k8s_ts_vm_to_pod_single_runs" \
  --argjson vm_to_pod_single_summary "$ts_vm_to_pod_single_summary" \
  --arg sidecar_ts_ip "$sidecar_ts_ip" \
  --argjson pod_to_vm_overhead "$(iperf_overhead_pct "$baseline_avg" "$ts_pod_to_vm_avg")" \
  --argjson pod_to_vm_single_overhead "$(iperf_overhead_pct "$baseline_single_avg" "$ts_pod_to_vm_single_avg")" \
  --argjson vm_to_pod_overhead "$(iperf_overhead_pct "$baseline_avg" "$ts_vm_to_pod_avg")" \
  --argjson vm_to_pod_single_overhead "$(iperf_overhead_pct "$baseline_single_avg" "$ts_vm_to_pod_single_avg")" \
  '{
    k8s_tailscale_pod_to_vm_tcp:        {runs: $pod_to_vm_runs,        summary: $pod_to_vm_summary},
    k8s_tailscale_pod_to_vm_tcp_single: {runs: $pod_to_vm_single_runs, summary: $pod_to_vm_single_summary},
    k8s_tailscale_vm_to_pod_tcp:        {runs: $vm_to_pod_runs,        summary: $vm_to_pod_summary},
    k8s_tailscale_vm_to_pod_tcp_single: {runs: $vm_to_pod_single_runs, summary: $vm_to_pod_single_summary},
    k8s_tailscale_config: {sidecar_ts_ip: $sidecar_ts_ip, mode: "kernel"},
    k8s_tailscale_overhead: {
      pod_to_vm_vs_baseline_pct:        $pod_to_vm_overhead,
      pod_to_vm_single_vs_baseline_pct: $pod_to_vm_single_overhead,
      vm_to_pod_vs_baseline_pct:        $vm_to_pod_overhead,
      vm_to_pod_single_vs_baseline_pct: $vm_to_pod_single_overhead
    }
  }')

tmp=$(mktemp); jq --argjson ts "$ts_data" '. + $ts' "$result_file" > "$tmp" && mv "$tmp" "$result_file"

log_info "Tailscale sidecar results merged into $result_file"
log_info "sidecar→vm:  $(echo "$ts_pod_to_vm_avg" | jq -r 'round') Mbps multi / $(echo "$ts_pod_to_vm_single_avg" | jq -r 'round') Mbps single"
log_info "vm→sidecar:  $(echo "$ts_vm_to_pod_avg" | jq -r 'round') Mbps multi / $(echo "$ts_vm_to_pod_single_avg" | jq -r 'round') Mbps single"
