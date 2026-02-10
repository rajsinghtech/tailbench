#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# IP cache — avoids repeated az queries
declare -gA _AZURE_PUBLIC_IP_CACHE=() 2>/dev/null || true

_azure_resolve_public_ip() {
  local name="$1"
  if [[ -n "${_AZURE_PUBLIC_IP_CACHE[$name]:-}" ]]; then
    echo "${_AZURE_PUBLIC_IP_CACHE[$name]}"
    return
  fi
  local ip
  ip=$(az vm show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$name" \
    --show-details \
    --query 'publicIps' \
    --output tsv 2>/dev/null)
  if [[ -z "$ip" ]]; then
    return 1
  fi
  _AZURE_PUBLIC_IP_CACHE[$name]="$ip"
  echo "$ip"
}

azure_create_instance() {
  local name="$1" size="$2" startup_script="$3"

  log_info "Creating Azure VM $name ($size) in $AZURE_LOCATION"

  local args=(
    az vm create
    --resource-group "$AZURE_RESOURCE_GROUP"
    --name "$name"
    --location "$AZURE_LOCATION"
    --size "$size"
    --image "$AZURE_IMAGE"
    --admin-username "$AZURE_SSH_USER"
    --ssh-key-values "$AZURE_SSH_PUB_KEY_PATH"
    --custom-data "$startup_script"
    --os-disk-size-gb 50
    --storage-sku Premium_LRS
    --public-ip-sku Standard
    --tags Project=tailbench
    --output json
    --no-wait
  )

  [[ -n "$AZURE_VNET" ]] && args+=(--vnet-name "$AZURE_VNET")
  [[ -n "$AZURE_SUBNET" ]] && args+=(--subnet "$AZURE_SUBNET")
  [[ -n "$AZURE_NSG" ]] && args+=(--nsg "$AZURE_NSG")

  "${args[@]}"

  log_info "Waiting for $name to be running..."
  az vm wait \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$name" \
    --created

  # Cache public IP
  local ip
  ip=$(az vm show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$name" \
    --show-details \
    --query 'publicIps' \
    --output tsv 2>/dev/null)
  [[ -n "$ip" ]] && _AZURE_PUBLIC_IP_CACHE[$name]="$ip"

  log_info "Azure VM $name is running"
}

azure_delete_instance() {
  local name="$1"
  log_info "Deleting Azure VM $name and associated resources"
  az vm delete \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$name" \
    --yes \
    --force-deletion true \
    --output none 2>/dev/null || true

  # Clean up associated resources
  for res_type in nic public-ip disk; do
    local res_name="${name}"
    case "$res_type" in
      nic)       res_name="${name}VMNic"; az network nic delete --resource-group "$AZURE_RESOURCE_GROUP" --name "$res_name" --output none 2>/dev/null || true ;;
      public-ip) res_name="${name}PublicIP"; az network public-ip delete --resource-group "$AZURE_RESOURCE_GROUP" --name "$res_name" --output none 2>/dev/null || true ;;
      disk)      az disk delete --resource-group "$AZURE_RESOURCE_GROUP" --name "${name}_OsDisk_1" --yes --output none 2>/dev/null || true ;;
    esac
  done
}

azure_get_internal_ip() {
  local name="$1"
  az vm show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$name" \
    --show-details \
    --query 'privateIps' \
    --output tsv
}

azure_ssh() {
  local name="$1"
  shift
  local ip
  ip=$(_azure_resolve_public_ip "$name")
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o LogLevel=ERROR \
    -i "$AZURE_SSH_KEY_PATH" \
    "${AZURE_SSH_USER}@${ip}" "$@"
}

azure_scp() {
  local name="$1" src="$2" dest="$3"
  local ip
  ip=$(_azure_resolve_public_ip "$name")
  scp -o StrictHostKeyChecking=no -o LogLevel=ERROR \
    -i "$AZURE_SSH_KEY_PATH" \
    "$src" "${AZURE_SSH_USER}@${ip}:${dest}"
}

azure_instance_exists() {
  local name="$1"
  az vm show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$name" \
    --output none 2>/dev/null
}

azure_check_auth() {
  if ! az account show &>/dev/null; then
    log_error "Azure not authenticated. Run: az login"
    return 1
  fi
}

azure_required_cmds() {
  echo "az ssh scp"
}
