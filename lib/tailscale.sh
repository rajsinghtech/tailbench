#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/config/defaults.sh"

TS_ACCESS_TOKEN="${TS_ACCESS_TOKEN:-}"
TS_AUTHKEY="${TS_AUTHKEY:-}"
TS_AUTHKEY_CREATED="${TS_AUTHKEY_CREATED:-0}"
TS_TAG="${TS_TAG:-tag:bench}"
TS_API="https://api.tailscale.com/api/v2"

ts_get_oauth_token() {
  local response
  response=$(curl -s -X POST "$TS_API/oauth/token" \
    -d "grant_type=client_credentials" \
    -d "client_id=${TS_OAUTH_CLIENT_ID}" \
    -d "client_secret=${TS_OAUTH_CLIENT_SECRET}")

  TS_ACCESS_TOKEN=$(echo "$response" | jq -r '.access_token')
  if [[ -z "$TS_ACCESS_TOKEN" || "$TS_ACCESS_TOKEN" == "null" ]]; then
    log_error "Failed to obtain OAuth token: $response"
    return 1
  fi
  log_info "OAuth token acquired"
}

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

ts_remove_device() {
  local device_id="$1"
  curl -s -X DELETE "$TS_API/device/$device_id" \
    -H "Authorization: Bearer $TS_ACCESS_TOKEN"
  log_info "Removed device $device_id"
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
