#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/lib/provider.sh"
source "$TAILBENCH_ROOT/lib/tailscale.sh"
source "$TAILBENCH_ROOT/lib/iperf.sh"
source "$TAILBENCH_ROOT/lib/mtr.sh"

usage() {
  echo "Usage: $0 <instance_type> <server_name> <client_name> <server_lan_ip> <client_lan_ip>" >&2
  exit 1
}

[[ $# -eq 5 ]] || usage

instance_type="$1"
server_name="$2"
client_name="$3"
server_lan_ip="$4"
client_lan_ip="$5"

require_cmd jq awk $(cloud_required_cmds)

log_info "Starting benchmark for $instance_type"
log_info "Server: $server_name ($server_lan_ip)"
log_info "Client: $client_name ($client_lan_ip)"

# Verify iperf3 is available on both instances
for node in "$server_name" "$client_name"; do
  if ! cloud_ssh "$node" "which iperf3" >/dev/null 2>&1; then
    log_warn "iperf3 not found on $node, installing..."
    cloud_ssh "$node" "sudo apt-get update -qq && sudo apt-get install -y -qq iperf3" >/dev/null 2>&1
  fi
done

# ── Phase 1: Baseline (LAN) — before Tailscale ──────────────────────
log_info "=== Phase 1: Baseline (LAN, no Tailscale) ==="

# Wait for LAN connectivity between instances (VPC fabric may need time)
log_info "Verifying LAN connectivity: $client_name -> $server_lan_ip"
lan_ok=false
for attempt in $(seq 1 20); do
  if cloud_ssh "$client_name" "nc -z -w 2 $server_lan_ip 22" 2>/dev/null; then
    log_info "LAN connectivity confirmed (attempt $attempt)"
    lan_ok=true
    break
  fi
  if (( attempt % 5 == 0 )); then
    log_warn "LAN not reachable yet (attempt $attempt/20), waiting..."
  fi
  sleep 3
done
if ! $lan_ok; then
  log_error "LAN connectivity failed after 20 attempts ($client_name -> $server_lan_ip)"
  # Try ping for diagnostics
  cloud_ssh "$client_name" "ping -c 2 $server_lan_ip 2>&1" || true
  cloud_ssh "$client_name" "ip route 2>&1" || true
  return 1
fi

iperf_start_server "$server_name"
sleep 2

log_info "Running baseline TCP test (multi-stream)"
baseline_runs=$(iperf_run_test "$client_name" "$server_lan_ip" \
  "$IPERF_DURATION" "$IPERF_PARALLEL" "$IPERF_ITERATIONS" "$server_name")

log_info "Running baseline TCP test (single stream)"
baseline_single_runs=$(iperf_run_test "$client_name" "$server_lan_ip" \
  "$IPERF_DURATION" 1 "$IPERF_ITERATIONS" "$server_name")

log_info "Running baseline MTR"
baseline_mtr=$(mtr_run_and_parse "$client_name" "$server_lan_ip" "$MTR_CYCLES") || {
  log_warn "Baseline MTR failed (non-fatal), using empty result"
  baseline_mtr='{"avg_ms":null,"min_ms":null,"max_ms":null,"loss_pct":null}'
}

iperf_stop_server "$server_name"

# ── Phase 2: Tailscale setup ────────────────────────────────────────
log_info "=== Phase 2: Tailscale setup ==="

ts_up "$server_name" "$server_name"
ts_up "$client_name" "$client_name"

server_ts_ip=$(ts_get_ip "$server_name")
client_ts_ip=$(ts_get_ip "$client_name")
log_info "Server TS: $server_ts_ip, Client TS: $client_ts_ip"

ts_wait_for_peer "$client_name" "$server_ts_ip"

connection_type=$(ts_wait_for_direct "$client_name" "$server_ts_ip")
if [[ "$connection_type" == "relayed" ]]; then
  log_warn "Benchmarking over DERP relay — results will not reflect direct path performance"
fi

# ── Phase 3: Tailscale benchmark ────────────────────────────────────
log_info "=== Phase 3: Tailscale benchmark ==="

iperf_start_server "$server_name"
sleep 2

log_info "Running Tailscale TCP test (multi-stream)"
tailscale_runs=$(iperf_run_test "$client_name" "$server_ts_ip" \
  "$IPERF_DURATION" "$IPERF_PARALLEL" "$IPERF_ITERATIONS" "$server_name")

log_info "Running Tailscale TCP test (single stream)"
tailscale_single_runs=$(iperf_run_test "$client_name" "$server_ts_ip" \
  "$IPERF_DURATION" 1 "$IPERF_ITERATIONS" "$server_name")

log_info "Running Tailscale MTR"
tailscale_mtr=$(mtr_run_and_parse "$client_name" "$server_ts_ip" "$MTR_CYCLES") || {
  log_warn "Tailscale MTR failed (non-fatal), using empty result"
  tailscale_mtr='{"avg_ms":null,"min_ms":null,"max_ms":null,"loss_pct":null}'
}

iperf_stop_server "$server_name"

# ── Results ─────────────────────────────────────────────────────────

# Multi-stream summaries
baseline_summary=$(iperf_compute_summary "$baseline_runs")
tailscale_summary=$(iperf_compute_summary "$tailscale_runs")

baseline_bw_avg=$(echo "$baseline_summary" | jq '.bandwidth_mbps_avg')
tailscale_bw_avg=$(echo "$tailscale_summary" | jq '.bandwidth_mbps_avg')
baseline_retransmits_avg=$(echo "$baseline_summary" | jq '.retransmits_avg')
tailscale_retransmits_avg=$(echo "$tailscale_summary" | jq '.retransmits_avg')

bandwidth_overhead=$(jq -n --argjson b "$baseline_bw_avg" --argjson t "$tailscale_bw_avg" \
  'if $b == 0 then 0 else (($b - $t) / $b * 100) end')
retransmits_overhead=$(jq -n --argjson b "$baseline_retransmits_avg" --argjson t "$tailscale_retransmits_avg" \
  'if $b == 0 then 0 else (($t - $b) / $b * 100) end')

# Single-stream summaries
baseline_single_summary=$(iperf_compute_summary "$baseline_single_runs")
tailscale_single_summary=$(iperf_compute_summary "$tailscale_single_runs")

baseline_single_bw_avg=$(echo "$baseline_single_summary" | jq '.bandwidth_mbps_avg')
tailscale_single_bw_avg=$(echo "$tailscale_single_summary" | jq '.bandwidth_mbps_avg')
baseline_single_retransmits_avg=$(echo "$baseline_single_summary" | jq '.retransmits_avg')
tailscale_single_retransmits_avg=$(echo "$tailscale_single_summary" | jq '.retransmits_avg')

bandwidth_overhead_single=$(jq -n --argjson b "$baseline_single_bw_avg" --argjson t "$tailscale_single_bw_avg" \
  'if $b == 0 then 0 else (($b - $t) / $b * 100) end')
retransmits_overhead_single=$(jq -n --argjson b "$baseline_single_retransmits_avg" --argjson t "$tailscale_single_retransmits_avg" \
  'if $b == 0 then 0 else (($t - $b) / $b * 100) end')

# Collect system config from server
ts_version=$(cloud_ssh "$server_name" "tailscale version | head -1" | tr -d '[:space:]')
kernel_version=$(cloud_ssh "$server_name" "uname -r" | tr -d '[:space:]')
kernel_full=$(cloud_ssh "$server_name" "uname -a" | tr -d '\n')
tcp_cc=$(cloud_ssh "$server_name" "sysctl -n net.ipv4.tcp_congestion_control" | tr -d '[:space:]')
cpu_governor=$(cloud_ssh "$server_name" "cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null || echo unknown" | tr -d '[:space:]')
netdev_server=$(cloud_ssh "$server_name" "ip -o route get 8.8.8.8 | cut -f 5 -d ' '" | tr -d '[:space:]')
gro_udp_fwd=$(cloud_ssh "$server_name" "ethtool -k $netdev_server 2>/dev/null | grep rx-udp-gro-forwarding | awk '{print \$2}'" | tr -d '[:space:]')
mtu_underlay=$(cloud_ssh "$server_name" "ip -o link show $netdev_server | grep -oP 'mtu \\K[0-9]+'" | tr -d '[:space:]')
mtu_tailscale=$(cloud_ssh "$server_name" "ip -o link show tailscale0 2>/dev/null | grep -oP 'mtu \\K[0-9]+'" | tr -d '[:space:]')
tcp_rmem=$(cloud_ssh "$server_name" "sysctl -n net.ipv4.tcp_rmem" | tr -d '\n')
tcp_wmem=$(cloud_ssh "$server_name" "sysctl -n net.ipv4.tcp_wmem" | tr -d '\n')

# Normalize booleans
[[ "$gro_udp_fwd" == "on" ]] && gro_udp_fwd_bool="true" || gro_udp_fwd_bool="false"

log_info "Tailscale version: $ts_version"
log_info "Kernel version: $kernel_version"
log_info "Connection type: $connection_type"
log_info "TCP CC: $tcp_cc, CPU governor: $cpu_governor, GRO fwd: $gro_udp_fwd"

family=$(get_instance_family "$instance_type")
vcpus=$(get_instance_vcpus "$instance_type")
today=$(date +%Y-%m-%d)

result=$(jq -n \
  --arg provider "$CLOUD_PROVIDER" \
  --arg family "$family" \
  --arg type "$instance_type" \
  --argjson vcpus "$vcpus" \
  --arg region "$CLOUD_REGION" \
  --arg zone "$CLOUD_ZONE" \
  --arg date "$today" \
  --arg ts_version "$ts_version" \
  --arg kernel_version "$kernel_version" \
  --arg kernel_full "$kernel_full" \
  --arg connection_type "$connection_type" \
  --arg tcp_cc "$tcp_cc" \
  --arg cpu_governor "$cpu_governor" \
  --argjson gro_udp_fwd "$gro_udp_fwd_bool" \
  --argjson mtu_underlay "${mtu_underlay:-0}" \
  --argjson mtu_tailscale "${mtu_tailscale:-0}" \
  --arg tcp_rmem "$tcp_rmem" \
  --arg tcp_wmem "$tcp_wmem" \
  --argjson duration "$IPERF_DURATION" \
  --argjson parallel "$IPERF_PARALLEL" \
  --argjson iterations "$IPERF_ITERATIONS" \
  --argjson mtr_cycles "$MTR_CYCLES" \
  --argjson baseline_runs "$baseline_runs" \
  --argjson baseline_summary "$baseline_summary" \
  --argjson tailscale_runs "$tailscale_runs" \
  --argjson tailscale_summary "$tailscale_summary" \
  --argjson bw_overhead "$bandwidth_overhead" \
  --argjson retransmits_overhead "$retransmits_overhead" \
  --argjson baseline_single_runs "$baseline_single_runs" \
  --argjson baseline_single_summary "$baseline_single_summary" \
  --argjson tailscale_single_runs "$tailscale_single_runs" \
  --argjson tailscale_single_summary "$tailscale_single_summary" \
  --argjson bw_overhead_single "$bandwidth_overhead_single" \
  --argjson retransmits_overhead_single "$retransmits_overhead_single" \
  --argjson baseline_mtr "$baseline_mtr" \
  --argjson tailscale_mtr "$tailscale_mtr" \
  '{
    cloud_provider: $provider,
    instance_family: $family,
    instance_type: $type,
    vcpus: $vcpus,
    region: $region,
    zone: $zone,
    date: $date,
    tailscale_version: $ts_version,
    kernel_version: $kernel_version,
    connection_type: $connection_type,
    system_config: {
      tcp_congestion_control: $tcp_cc,
      cpu_governor: $cpu_governor,
      gro_udp_forwarding: $gro_udp_fwd,
      mtu_underlay: $mtu_underlay,
      mtu_tailscale: $mtu_tailscale,
      tcp_rmem: $tcp_rmem,
      tcp_wmem: $tcp_wmem,
      kernel_full: $kernel_full
    },
    test_config: {
      iperf_duration_sec: $duration,
      iperf_parallel_streams: $parallel,
      iperf_iterations: $iterations,
      mtr_cycles: $mtr_cycles
    },
    baseline_tcp: {runs: $baseline_runs, summary: $baseline_summary},
    tailscale_tcp: {runs: $tailscale_runs, summary: $tailscale_summary},
    overhead: {bandwidth_pct: $bw_overhead, retransmits_pct: $retransmits_overhead},
    baseline_tcp_single: {runs: $baseline_single_runs, summary: $baseline_single_summary},
    tailscale_tcp_single: {runs: $tailscale_single_runs, summary: $tailscale_single_summary},
    overhead_single: {bandwidth_pct: $bw_overhead_single, retransmits_pct: $retransmits_overhead_single},
    baseline_mtr: $baseline_mtr,
    tailscale_mtr: $tailscale_mtr
  }')

outdir="$TAILBENCH_ROOT/$CLOUD_PROVIDER/$family/results"
mkdir -p "$outdir"
outfile="$outdir/$instance_type.json"
echo "$result" | jq '.' > "$outfile"

log_info "Results written to $CLOUD_PROVIDER/$family/results/$instance_type.json"
log_info "Baseline (multi): $(echo "$baseline_summary" | jq -r '.bandwidth_mbps_avg | round') Mbps"
log_info "Tailscale (multi): $(echo "$tailscale_summary" | jq -r '.bandwidth_mbps_avg | round') Mbps"
log_info "Baseline (single): $(echo "$baseline_single_summary" | jq -r '.bandwidth_mbps_avg | round') Mbps"
log_info "Tailscale (single): $(echo "$tailscale_single_summary" | jq -r '.bandwidth_mbps_avg | round') Mbps"
log_info "BW overhead (multi): $(printf '%.1f' "$(echo "$bandwidth_overhead" | tr -d '\n')")%"
log_info "BW overhead (single): $(printf '%.1f' "$(echo "$bandwidth_overhead_single" | tr -d '\n')")%"
