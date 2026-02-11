#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TS_ACCESS_TOKEN="${TS_ACCESS_TOKEN:-}"
TS_AUTHKEY="${TS_AUTHKEY:-}"
TS_AUTHKEY_CREATED="${TS_AUTHKEY_CREATED:-0}"
TS_TAG="${TS_TAG:-tag:bench}"
TS_API="https://api.tailscale.com/api/v2"

ts_create_authkey() {
  local response
  response=$(curl -s -X POST "$TS_API/tailnet/-/keys" \
    -H "Authorization: Bearer $TS_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"capabilities\": {
        \"devices\": {
          \"create\": {
            \"reusable\": true,
            \"ephemeral\": true,
            \"preauthorized\": true,
            \"tags\": [\"$TS_TAG\"]
          }
        }
      }
    }")

  TS_AUTHKEY=$(echo "$response" | jq -r '.key')
  if [[ -z "$TS_AUTHKEY" || "$TS_AUTHKEY" == "null" ]]; then
    log_error "Failed to create authkey: $response"
    return 1
  fi
  TS_AUTHKEY_CREATED=$(date +%s)
  log_info "Auth key created"
}

ts_get_ip() {
  local instance="$1"
  cloud_ssh "$instance" "tailscale ip -4" 2>/dev/null
}

ts_wait_for_peer() {
  local instance="$1" peer_ip="$2"
  log_info "Waiting for $instance to reach peer $peer_ip via Tailscale"
  retry 30 2 cloud_ssh "$instance" "tailscale ping -c 1 $peer_ip" 2>/dev/null
}

ts_wait_for_direct() {
  local instance="$1" peer_ip="$2"
  local max_attempts=15
  local attempt=1
  log_info "Waiting for direct connection from $instance to $peer_ip"
  while (( attempt <= max_attempts )); do
    local output
    output=$(cloud_ssh "$instance" "tailscale ping -c 1 $peer_ip 2>&1") || true
    if echo "$output" | grep -q "via direct"; then
      log_info "Direct connection confirmed: $instance -> $peer_ip"
      echo "direct"
      return 0
    fi
    log_warn "Attempt $attempt/$max_attempts: connection still relayed"
    attempt=$(( attempt + 1 ))
    sleep 2
  done
  log_warn "Could not establish direct connection after $max_attempts attempts (using DERP relay)"
  echo "relayed"
  return 0
}

ts_maybe_refresh_key() {
  local now
  now=$(date +%s)
  if (( now - TS_AUTHKEY_CREATED >= AUTHKEY_REFRESH_INTERVAL )); then
    log_info "Refreshing auth key (interval elapsed)"
    ts_create_authkey
  fi
}

ts_up() {
  local instance="$1" hostname="$2"
  log_info "Bringing up Tailscale on $instance as $hostname"
  retry 3 5 cloud_ssh "$instance" "sudo tailscale up --authkey=$TS_AUTHKEY --hostname=$hostname" >&2
}
