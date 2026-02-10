#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/lib/gcp.sh"
source "$TAILBENCH_ROOT/lib/tailscale.sh"
source "$TAILBENCH_ROOT/lib/cleanup.sh"
source "$TAILBENCH_ROOT/config/defaults.sh"
source "$TAILBENCH_ROOT/config/regions.sh"
source "$TAILBENCH_ROOT/config/instances.sh"

instance_type="${1:?Usage: provision-pair.sh <instance_type>}"

server_name="${INSTANCE_PREFIX}-${instance_type}-server"
client_name="${INSTANCE_PREFIX}-${instance_type}-client"

cleanup_register "$server_name"
cleanup_register "$client_name"

log_info "Creating pair: $server_name + $client_name ($instance_type)"

gcp_create_instance "$server_name" "$instance_type" \
  --metadata-from-file=startup-script="$TAILBENCH_ROOT/scripts/setup-instance.sh" &
gcp_create_instance "$client_name" "$instance_type" \
  --metadata-from-file=startup-script="$TAILBENCH_ROOT/scripts/setup-instance.sh" &
wait

wait_for_ssh "$server_name" "$GCP_ZONE"
wait_for_ssh "$client_name" "$GCP_ZONE"

wait_for_ready "$server_name" "$GCP_ZONE"
wait_for_ready "$client_name" "$GCP_ZONE"

ts_up "$server_name" "$GCP_ZONE" "${INSTANCE_PREFIX}-${instance_type}-server"
ts_up "$client_name" "$GCP_ZONE" "${INSTANCE_PREFIX}-${instance_type}-client"

server_lan_ip=$(gcp_get_internal_ip "$server_name")
client_lan_ip=$(gcp_get_internal_ip "$client_name")

server_ts_ip=$(ts_get_ip "$server_name" "$GCP_ZONE")
client_ts_ip=$(ts_get_ip "$client_name" "$GCP_ZONE")

ts_wait_for_peer "$client_name" "$GCP_ZONE" "$server_ts_ip"

log_info "Pair provisioned successfully"

echo "SERVER_NAME=$server_name"
echo "CLIENT_NAME=$client_name"
echo "SERVER_LAN_IP=$server_lan_ip"
echo "CLIENT_LAN_IP=$client_lan_ip"
echo "SERVER_TS_IP=$server_ts_ip"
echo "CLIENT_TS_IP=$client_ts_ip"
