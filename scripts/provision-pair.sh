#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/lib/provider.sh"
source "$TAILBENCH_ROOT/lib/tailscale.sh"
source "$TAILBENCH_ROOT/lib/cleanup.sh"

instance_type="${1:?Usage: provision-pair.sh <instance_type>}"

# Sanitize for DNS-safe VM and Tailscale hostnames (Azure types have underscores)
safe_name="${instance_type//_/-}"
safe_name="${safe_name,,}"

server_name="${INSTANCE_PREFIX}-${safe_name}-server"
client_name="${INSTANCE_PREFIX}-${safe_name}-client"

cleanup_register "$server_name"
cleanup_register "$client_name"

log_info "Creating pair: $server_name + $client_name ($instance_type)"

cloud_create_instance "$server_name" "$instance_type" "$TAILBENCH_ROOT/scripts/setup-instance.sh" &
cloud_create_instance "$client_name" "$instance_type" "$TAILBENCH_ROOT/scripts/setup-instance.sh" &
wait

wait_for_ssh "$server_name"
wait_for_ssh "$client_name"

wait_for_ready "$server_name"
wait_for_ready "$client_name"

ts_up "$server_name" "$server_name"
ts_up "$client_name" "$client_name"

server_lan_ip=$(cloud_get_internal_ip "$server_name")
client_lan_ip=$(cloud_get_internal_ip "$client_name")

server_ts_ip=$(ts_get_ip "$server_name")
client_ts_ip=$(ts_get_ip "$client_name")

ts_wait_for_peer "$client_name" "$server_ts_ip"

log_info "Pair provisioned successfully"

echo "SERVER_NAME=$server_name"
echo "CLIENT_NAME=$client_name"
echo "SERVER_LAN_IP=$server_lan_ip"
echo "CLIENT_LAN_IP=$client_lan_ip"
echo "SERVER_TS_IP=$server_ts_ip"
echo "CLIENT_TS_IP=$client_ts_ip"
