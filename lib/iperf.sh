#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"

iperf_start_server() {
  local instance="$1"
  log_info "Starting iperf3 server on $instance"
  cloud_ssh "$instance" "pkill iperf3 2>/dev/null || true; sleep 1; iperf3 -s -D"
  # Verify server is listening
  retry 5 2 cloud_ssh "$instance" "ss -tlnp | grep -q 5201" 2>/dev/null
}

iperf_stop_server() {
  local instance="$1"
  log_info "Stopping iperf3 server on $instance"
  cloud_ssh "$instance" "pkill iperf3 2>/dev/null || true"
}

iperf_run_client() {
  local instance="$1" target_ip="$2" duration="$3" parallel="$4"
  local result
  result=$(cloud_ssh "$instance" "iperf3 -c $target_ip -t $duration -P $parallel -J 2>&1")
  # Check for iperf3-level error in JSON
  local err
  err=$(echo "$result" | jq -r '.error // empty' 2>/dev/null) || true
  if [[ -n "$err" ]]; then
    log_error "iperf3 error: $err"
    return 1
  fi
  echo "$result"
}

iperf_run_test() {
  local instance="$1" target_ip="$2" duration="$3" parallel="$4" iterations="$5"
  local results="[]"

  for (( i=1; i<=iterations; i++ )); do
    log_info "iperf3 iteration $i/$iterations: $instance -> $target_ip"
    local raw="" attempt=0 max_retries=3
    while (( attempt < max_retries )); do
      raw=$(iperf_run_client "$instance" "$target_ip" "$duration" "$parallel") || true

      # Check for iperf3 error response
      local iperf_err=""
      iperf_err=$(echo "$raw" | jq -r '.error // empty' 2>/dev/null) || true
      if [[ -n "$iperf_err" ]]; then
        log_warn "iperf3 error (attempt $((attempt+1))/$max_retries): $iperf_err"
        attempt=$(( attempt + 1 ))
        sleep 5
        continue
      fi

      # Validate required fields exist
      local bps=""
      bps=$(echo "$raw" | jq '.end.sum_sent.bits_per_second // empty' 2>/dev/null) || true
      if [[ -z "$bps" ]]; then
        log_warn "iperf3 missing expected fields (attempt $((attempt+1))/$max_retries)"
        log_warn "Raw output (first 200 chars): ${raw:0:200}"
        attempt=$(( attempt + 1 ))
        sleep 5
        continue
      fi

      break
    done

    if (( attempt >= max_retries )); then
      log_error "iperf3 failed after $max_retries retries for $instance -> $target_ip"
      return 1
    fi

    local entry
    entry=$(echo "$raw" | jq '{
      bandwidth_mbps: (.end.sum_sent.bits_per_second / 1000000),
      retransmits: .end.sum_sent.retransmits,
      duration_sec: .end.sum_sent.seconds,
      bytes_transferred: .end.sum_sent.bytes
    }')
    results=$(echo "$results" | jq --argjson e "$entry" '. + [$e]')
    if (( i < iterations )); then
      sleep 2
    fi
  done

  echo "$results"
}

iperf_compute_summary() {
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
