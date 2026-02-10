#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"

iperf_start_server() {
  local instance="$1"
  log_info "Starting iperf3 server on $instance"
  cloud_ssh "$instance" "pkill iperf3 2>/dev/null || true; iperf3 -s -D"
}

iperf_stop_server() {
  local instance="$1"
  log_info "Stopping iperf3 server on $instance"
  cloud_ssh "$instance" "pkill iperf3 2>/dev/null || true"
}

iperf_run_client() {
  local instance="$1" target_ip="$2" duration="$3" parallel="$4"
  cloud_ssh "$instance" "iperf3 -c $target_ip -t $duration -P $parallel -J"
}

iperf_parse_bandwidth() {
  local json="$1"
  echo "$json" | jq '.end.sum_sent.bits_per_second / 1000000'
}

iperf_parse_retransmits() {
  local json="$1"
  echo "$json" | jq '.end.sum_sent.retransmits'
}

iperf_parse_bytes() {
  local json="$1"
  echo "$json" | jq '.end.sum_sent.bytes'
}

iperf_parse_duration() {
  local json="$1"
  echo "$json" | jq '.end.sum_sent.seconds'
}

iperf_run_test() {
  local instance="$1" target_ip="$2" duration="$3" parallel="$4" iterations="$5"
  local results="[]"

  for (( i=1; i<=iterations; i++ )); do
    log_info "iperf3 iteration $i/$iterations: $instance -> $target_ip"
    local raw
    raw=$(iperf_run_client "$instance" "$target_ip" "$duration" "$parallel")
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
