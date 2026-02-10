#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"

mtr_run() {
  local instance="$1" target_ip="$2" cycles="$3"
  log_info "Running MTR from $instance to $target_ip ($cycles cycles)"
  cloud_ssh "$instance" "sudo mtr --report --report-cycles $cycles --no-dns $target_ip 2>/dev/null"
}

# Parse MTR text report into JSON array of hops
# Input format:
#   1.|-- 10.128.0.1                 0.0%     3    0.3   0.3   0.2   0.5   0.0
mtr_parse() {
  local text="$1"
  echo "$text" | awk '
    /^[[:space:]]*[0-9]+\.[|]--/ {
      gsub(/[|]--/, "")
      hop = $1 + 0
      host = $2
      gsub(/%/, "", $3)
      loss = $3 + 0
      snt = $4 + 0
      last = $5 + 0
      avg = $6 + 0
      best = $7 + 0
      worst = $8 + 0
      stdev = $9 + 0
      if (n > 0) printf ","
      printf "{\"hop\":%d,\"host\":\"%s\",\"loss_pct\":%.1f,\"snt\":%d,\"last_ms\":%.3f,\"avg_ms\":%.3f,\"best_ms\":%.3f,\"worst_ms\":%.3f,\"stdev_ms\":%.3f}", \
        hop, host, loss, snt, last, avg, best, worst, stdev
      n++
    }
    BEGIN { printf "[" }
    END { printf "]" }
  '
}

mtr_run_and_parse() {
  local instance="$1" target_ip="$2" cycles="$3"
  local raw hops
  raw=$(mtr_run "$instance" "$target_ip" "$cycles")
  hops=$(mtr_parse "$raw")
  if ! echo "$hops" | jq -e '.' >/dev/null 2>&1; then
    log_warn "MTR parse failed, using empty hops"
    hops="[]"
  fi
  jq -n --arg ip "$target_ip" --argjson hops "$hops" \
    '{target_ip: $ip, hops: $hops}'
}
