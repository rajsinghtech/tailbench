#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"

# Non-default port avoids conflicts with the Ubuntu iperf3 systemd service
IPERF_PORT="${IPERF_PORT:-15201}"

# Wait for SSH to become responsive (needed after iperf3 depletes Azure network credits)
_wait_for_ssh() {
  local instance="$1" max_wait="${2:-180}"
  local elapsed=0
  while (( elapsed < max_wait )); do
    if cloud_ssh "$instance" "true" 2>/dev/null; then
      return 0
    fi
    sleep 10
    elapsed=$(( elapsed + 10 ))
    if (( elapsed % 30 == 0 )); then
      log_info "Waiting for SSH on $instance (${elapsed}s/${max_wait}s)..."
    fi
  done
  log_error "SSH to $instance not responsive after ${max_wait}s"
  return 1
}

_iperf_kill_all() {
  local instance="$1"
  # Use pkill without -f to avoid matching this SSH session's own command line
  cloud_ssh "$instance" "
    sudo systemctl stop iperf3 2>/dev/null || true
    sudo systemctl mask iperf3 2>/dev/null || true
    pkill -9 -x iperf3 2>/dev/null || true
    sleep 1
  " 2>/dev/null || true
}

iperf_start_server() {
  local instance="$1"
  log_info "Starting iperf3 server on $instance"
  _iperf_kill_all "$instance"
  cloud_ssh "$instance" "setsid iperf3 -s -p ${IPERF_PORT} </dev/null >/tmp/iperf3-server.log 2>&1 &" 2>/dev/null || true
  local attempt=0
  while (( attempt < 15 )); do
    if cloud_ssh "$instance" "ss -tlnp | grep -q ':${IPERF_PORT} '" 2>/dev/null; then
      log_info "iperf3 server listening on $instance:${IPERF_PORT}"
      return 0
    fi
    attempt=$(( attempt + 1 ))
    sleep 2
  done
  log_error "iperf3 server failed to start on $instance"
  return 1
}

iperf_stop_server() {
  local instance="$1"
  log_info "Stopping iperf3 server on $instance"
  cloud_ssh "$instance" "pkill -9 -x iperf3 2>/dev/null || true" 2>/dev/null || true
}

iperf_run_client() {
  local instance="$1" target_ip="$2" duration="$3" parallel="$4"
  local timeout_sec=$(( duration + 30 ))

  # Run iperf3 synchronously over SSH. If SSH drops mid-test (Azure network
  # credit exhaustion), the retry loop in iperf_run_test handles it.
  local result
  result=$(cloud_ssh "$instance" "timeout $timeout_sec iperf3 -c $target_ip -p ${IPERF_PORT} -t $duration -P $parallel -J" 2>/dev/null) || true

  if [[ -z "$result" ]]; then
    # SSH may have dropped — wait for it to recover before returning
    _wait_for_ssh "$instance" 180 || true
    log_error "iperf3 produced no output on $instance"
    return 1
  fi

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
  local server_instance="${6:-}"
  local results="[]"

  for (( i=1; i<=iterations; i++ )); do
    log_info "iperf3 iteration $i/$iterations: $instance -> $target_ip"
    local raw="" attempt=0 max_retries=3
    while (( attempt < max_retries )); do
      # Clean state on both sides before each attempt
      _iperf_kill_all "$instance"
      if [[ -n "$server_instance" ]]; then
        iperf_start_server "$server_instance" || true
        sleep 3
      fi

      raw=$(iperf_run_client "$instance" "$target_ip" "$duration" "$parallel") || true

      local iperf_err=""
      iperf_err=$(echo "$raw" | jq -r '.error // empty' 2>/dev/null) || true
      if [[ -n "$iperf_err" ]]; then
        log_warn "iperf3 error (attempt $((attempt+1))/$max_retries): $iperf_err"
        attempt=$(( attempt + 1 ))
        # Wait for network credits to recover
        log_info "Waiting 60s for network credits to recover..."
        sleep 60
        continue
      fi

      local bps=""
      bps=$(echo "$raw" | jq '.end.sum_sent.bits_per_second // empty' 2>/dev/null) || true
      if [[ -z "$bps" ]]; then
        log_warn "iperf3 missing expected fields (attempt $((attempt+1))/$max_retries)"
        log_warn "Raw output (first 300 chars): ${raw:0:300}"
        attempt=$(( attempt + 1 ))
        sleep 60
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

    # Cooldown between iterations for network credit recovery
    if (( i < iterations )); then
      log_info "Cooldown between iterations (30s)..."
      sleep 30
      # Ensure SSH is responsive before next iteration
      _wait_for_ssh "$instance" 120 || true
      _wait_for_ssh "$server_instance" 120 || true
    fi
  done

  echo "$results"
}

iperf_overhead_pct() {
  echo "$1 $2" | awk '{printf "%.1f", (1 - $2/$1) * 100}'
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
