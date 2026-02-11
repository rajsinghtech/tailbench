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
  local ip="" attempt=0 max=15
  while (( attempt < max )); do
    ip=$(cloud_ssh "$instance" "tailscale ip -4 2>/dev/null" 2>/dev/null) || true
    if [[ -n "$ip" && "$ip" =~ ^100\. ]]; then
      echo "$ip"
      return 0
    fi
    attempt=$(( attempt + 1 ))
    sleep 2
  done
  log_error "Failed to get Tailscale IP for $instance after $max attempts"
  cloud_ssh "$instance" "tailscale status 2>&1" >&2 || true
  return 1
}

ts_wait_for_peer() {
  local instance="$1" peer_ip="$2"
  local max_attempts=45
  local attempt=1
  log_info "Waiting for $instance to reach peer $peer_ip via Tailscale"
  while (( attempt <= max_attempts )); do
    local output=""
    output=$(cloud_ssh "$instance" "tailscale ping -c 1 --timeout 5s $peer_ip 2>&1" 2>/dev/null) || true
    if echo "$output" | grep -q "pong"; then
      log_info "Peer $peer_ip reachable from $instance (attempt $attempt)"
      return 0
    fi
    if (( attempt % 10 == 1 )); then
      local status=""
      status=$(cloud_ssh "$instance" "tailscale status --json 2>&1" 2>/dev/null) || true
      local peer_count self_status
      peer_count=$(echo "$status" | jq '.Peer | length' 2>/dev/null) || peer_count="?"
      self_status=$(echo "$status" | jq -r '.Self.Online' 2>/dev/null) || self_status="?"
      log_warn "Attempt $attempt/$max_attempts: no pong. online=$self_status peers=$peer_count"
    else
      log_warn "Attempt $attempt/$max_attempts: no pong"
    fi
    attempt=$(( attempt + 1 ))
    sleep 3
  done
  log_error "Peer $peer_ip unreachable after $max_attempts attempts"
  cloud_ssh "$instance" "tailscale status 2>&1" >&2 || true
  cloud_ssh "$instance" "tailscale netcheck 2>&1" >&2 || true
  return 1
}

ts_wait_for_direct() {
  local instance="$1" peer_ip="$2"
  local max_attempts=30
  local attempt=1
  log_info "Waiting for direct connection from $instance to $peer_ip"
  while (( attempt <= max_attempts )); do
    local output
    output=$(cloud_ssh "$instance" "tailscale ping -c 1 $peer_ip 2>&1") || true
    if [[ -n "$output" ]] && ! echo "$output" | grep -qi "DERP"; then
      log_info "Direct connection confirmed: $instance -> $peer_ip"
      log_info "  ping output: $output"
      echo "direct"
      return 0
    fi
    if (( attempt <= 3 || attempt % 10 == 0 )); then
      log_warn "Attempt $attempt/$max_attempts: still relayed — $output"
    else
      log_warn "Attempt $attempt/$max_attempts: connection still relayed"
    fi
    attempt=$(( attempt + 1 ))
    sleep 3
  done
  # Log diagnostic info on failure
  log_warn "Could not establish direct connection after $max_attempts attempts"
  cloud_ssh "$instance" "tailscale status 2>&1" >&2 || true
  cloud_ssh "$instance" "tailscale netcheck --verbose 2>&1" >&2 || true
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
  # Brief pause to let the control server register the node
  sleep 2
}
