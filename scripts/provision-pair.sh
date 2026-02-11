#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/lib/provider.sh"

instance_type="${1:?Usage: provision-pair.sh <instance_type>}"

# Sanitize for DNS-safe VM and Tailscale hostnames (Azure types have underscores)
safe_name="${instance_type//_/-}"
safe_name="${safe_name,,}"

server_name="${INSTANCE_PREFIX}-${safe_name}-server"
client_name="${INSTANCE_PREFIX}-${safe_name}-client"

log_info "Creating pair: $server_name + $client_name ($instance_type)"

server_err=$(mktemp)
client_err=$(mktemp)

cloud_create_instance "$server_name" "$instance_type" "$TAILBENCH_ROOT/scripts/setup-instance.sh" 2>"$server_err" &
pid_server=$!
cloud_create_instance "$client_name" "$instance_type" "$TAILBENCH_ROOT/scripts/setup-instance.sh" 2>"$client_err" &
pid_client=$!

create_failed=false
quota_hit=false

if ! wait "$pid_server"; then
  create_failed=true
  log_error "Failed to create server $server_name: $(cat "$server_err")"
  cloud_is_quota_error "$(cat "$server_err")" && quota_hit=true
fi
if ! wait "$pid_client"; then
  create_failed=true
  log_error "Failed to create client $client_name: $(cat "$client_err")"
  cloud_is_quota_error "$(cat "$client_err")" && quota_hit=true
fi

rm -f "$server_err" "$client_err"
if $create_failed; then
  if $quota_hit; then exit 2; fi
  exit 1
fi

wait_for_ssh "$server_name"
wait_for_ssh "$client_name"

wait_for_ready "$server_name"
wait_for_ready "$client_name"

server_lan_ip=$(cloud_get_internal_ip "$server_name")
client_lan_ip=$(cloud_get_internal_ip "$client_name")

log_info "Pair ready: server=$server_lan_ip client=$client_lan_ip"

echo "SERVER_NAME=$server_name"
echo "CLIENT_NAME=$client_name"
echo "SERVER_LAN_IP=$server_lan_ip"
echo "CLIENT_LAN_IP=$client_lan_ip"
