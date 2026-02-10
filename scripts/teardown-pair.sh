#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/lib/provider.sh"

server_name="${1:?Usage: teardown-pair.sh <server_name> <client_name>}"
client_name="${2:?Usage: teardown-pair.sh <server_name> <client_name>}"

log_info "Tearing down $server_name and $client_name"
cloud_delete_instance "$server_name" || true
cloud_delete_instance "$client_name" || true
log_info "Teardown complete"
