#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"

mtr_run() {
  local instance="$1" zone="$2" target_ip="$3" cycles="$4"
  log_info "Running MTR from $instance to $target_ip ($cycles cycles)"
  gcp_ssh "$instance" "sudo mtr --json --report --report-cycles $cycles --no-dns $target_ip"
}

mtr_parse() {
  local json="$1"
  echo "$json" | jq '[.report.hubs | to_entries[] | {
    hop: (.key + 1),
    host: .value.host,
    loss_pct: .value["Loss%"],
    snt: .value.Snt,
    last_ms: .value.Last,
    avg_ms: .value.Avg,
    best_ms: .value.Best,
    worst_ms: .value.Wrst,
    stdev_ms: .value.StDev
  }]'
}

mtr_run_and_parse() {
  local instance="$1" zone="$2" target_ip="$3" cycles="$4"
  local raw hops
  raw=$(mtr_run "$instance" "$zone" "$target_ip" "$cycles")
  hops=$(mtr_parse "$raw")
  jq -n --arg ip "$target_ip" --argjson hops "$hops" \
    '{target_ip: $ip, hops: $hops}'
}
