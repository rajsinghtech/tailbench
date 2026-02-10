#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/lib/gcp.sh"
source "$TAILBENCH_ROOT/lib/tailscale.sh"
source "$TAILBENCH_ROOT/lib/iperf.sh"
source "$TAILBENCH_ROOT/lib/mtr.sh"
source "$TAILBENCH_ROOT/config/instances.sh"

usage() {
  echo "Usage: $0 <instance_type> <server_name> <client_name> <server_lan_ip> <client_lan_ip> <server_ts_ip> <client_ts_ip>" >&2
  exit 1
}

[[ $# -eq 7 ]] || usage

instance_type="$1"
server_name="$2"
client_name="$3"
server_lan_ip="$4"
client_lan_ip="$5"
server_ts_ip="$6"
client_ts_ip="$7"

require_cmd jq gcloud awk

log_info "Starting benchmark for $instance_type"
log_info "Server: $server_name ($server_lan_ip / $server_ts_ip)"
log_info "Client: $client_name ($client_lan_ip / $client_ts_ip)"

# Start iperf server
iperf_start_server "$server_name" "$GCP_ZONE"
sleep 2

# Baseline TCP test (LAN)
log_info "Running baseline TCP test"
baseline_runs=$(iperf_run_test "$client_name" "$GCP_ZONE" "$server_lan_ip" \
  "$IPERF_DURATION" "$IPERF_PARALLEL" "$IPERF_ITERATIONS")

# Tailscale TCP test
log_info "Running Tailscale TCP test"
tailscale_runs=$(iperf_run_test "$client_name" "$GCP_ZONE" "$server_ts_ip" \
  "$IPERF_DURATION" "$IPERF_PARALLEL" "$IPERF_ITERATIONS")

# Baseline MTR
log_info "Running baseline MTR"
baseline_mtr=$(mtr_run_and_parse "$client_name" "$GCP_ZONE" "$server_lan_ip" "$MTR_CYCLES")

# Tailscale MTR
log_info "Running Tailscale MTR"
tailscale_mtr=$(mtr_run_and_parse "$client_name" "$GCP_ZONE" "$server_ts_ip" "$MTR_CYCLES")

# Stop iperf server
iperf_stop_server "$server_name" "$GCP_ZONE"

# Compute summaries
compute_summary() {
  local runs="$1"
  local bw_values
  bw_values=$(echo "$runs" | jq -r '.[].bandwidth_mbps')

  local avg min max stddev avg_retransmits
  avg=$(echo "$runs" | jq '[.[].bandwidth_mbps] | add / length')
  min=$(echo "$runs" | jq '[.[].bandwidth_mbps] | min')
  max=$(echo "$runs" | jq '[.[].bandwidth_mbps] | max')
  stddev=$(echo "$bw_values" | compute_stddev)
  avg_retransmits=$(echo "$runs" | jq '[.[].retransmits] | add / length')

  jq -n \
    --argjson avg "$avg" \
    --argjson min "$min" \
    --argjson max "$max" \
    --argjson stddev "$stddev" \
    --argjson avg_retransmits "$avg_retransmits" \
    '{
      bandwidth_mbps_avg: $avg,
      bandwidth_mbps_min: $min,
      bandwidth_mbps_max: $max,
      bandwidth_mbps_stddev: $stddev,
      retransmits_avg: $avg_retransmits
    }'
}

baseline_summary=$(compute_summary "$baseline_runs")
tailscale_summary=$(compute_summary "$tailscale_runs")

# Overhead
baseline_bw_avg=$(echo "$baseline_summary" | jq '.bandwidth_mbps_avg')
tailscale_bw_avg=$(echo "$tailscale_summary" | jq '.bandwidth_mbps_avg')
baseline_retransmits_avg=$(echo "$baseline_summary" | jq '.retransmits_avg')
tailscale_retransmits_avg=$(echo "$tailscale_summary" | jq '.retransmits_avg')

bandwidth_overhead=$(jq -n --argjson b "$baseline_bw_avg" --argjson t "$tailscale_bw_avg" \
  'if $b == 0 then 0 else (($b - $t) / $b * 100) end')
retransmits_overhead=$(jq -n --argjson b "$baseline_retransmits_avg" --argjson t "$tailscale_retransmits_avg" \
  'if $b == 0 then 0 else (($t - $b) / (if $b == 0 then 1 else $b end) * 100) end')

# Tailscale version
ts_version=$(gcp_ssh "$server_name" "tailscale version | head -1" | tr -d '[:space:]')
log_info "Tailscale version: $ts_version"

# Instance family
family=$(get_instance_family "$instance_type")
today=$(date +%Y-%m-%d)

# Assemble result JSON
result=$(jq -n \
  --arg provider "gcp" \
  --arg family "$family" \
  --arg type "$instance_type" \
  --arg region "$GCP_REGION" \
  --arg zone "$GCP_ZONE" \
  --arg date "$today" \
  --arg ts_version "$ts_version" \
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
  --argjson baseline_mtr "$baseline_mtr" \
  --argjson tailscale_mtr "$tailscale_mtr" \
  '{
    cloud_provider: $provider,
    instance_family: $family,
    instance_type: $type,
    region: $region,
    zone: $zone,
    date: $date,
    tailscale_version: $ts_version,
    test_config: {
      iperf_duration_sec: $duration,
      iperf_parallel_streams: $parallel,
      iperf_iterations: $iterations,
      mtr_cycles: $mtr_cycles
    },
    baseline_tcp: {runs: $baseline_runs, summary: $baseline_summary},
    tailscale_tcp: {runs: $tailscale_runs, summary: $tailscale_summary},
    overhead: {bandwidth_pct: $bw_overhead, retransmits_pct: $retransmits_overhead},
    baseline_mtr: $baseline_mtr,
    tailscale_mtr: $tailscale_mtr
  }')

# Write output
outdir="$TAILBENCH_ROOT/gcp/$family/results"
mkdir -p "$outdir"
outfile="$outdir/$instance_type.json"
echo "$result" | jq '.' > "$outfile"

log_info "Results written to gcp/$family/results/$instance_type.json"
log_info "Baseline: $(echo "$baseline_summary" | jq -r '.bandwidth_mbps_avg | round') Mbps"
log_info "Tailscale: $(echo "$tailscale_summary" | jq -r '.bandwidth_mbps_avg | round') Mbps"
log_info "Bandwidth overhead: $(printf '%.1f' "$(echo "$bandwidth_overhead" | tr -d '\n')")%"
