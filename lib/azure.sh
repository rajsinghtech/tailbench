#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

_AZURE_NETWORKING_AUTO_CREATED="${_AZURE_NETWORKING_AUTO_CREATED:-false}"

# IP cache — avoids repeated az queries
declare -gA _AZURE_PUBLIC_IP_CACHE=() 2>/dev/null || true
declare -gA _AZURE_VCPU_CACHE=() 2>/dev/null || true

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
    --custom-data @"$startup_script"
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

  "${args[@]}" >/dev/null

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
  local output
  if ! output=$(az vm delete \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$name" \
    --yes \
    --force-deletion true \
    --output none 2>&1); then
    log_warn "Failed to delete VM $name: $output"
  fi

  # Clean up associated resources
  local res_name
  res_name="${name}VMNic"
  if ! output=$(az network nic delete --resource-group "$AZURE_RESOURCE_GROUP" --name "$res_name" --output none 2>&1); then
    log_warn "Failed to delete NIC $res_name: $output"
  fi
  res_name="${name}PublicIP"
  if ! output=$(az network public-ip delete --resource-group "$AZURE_RESOURCE_GROUP" --name "$res_name" --output none 2>&1); then
    log_warn "Failed to delete public IP $res_name: $output"
  fi
  if ! output=$(az disk delete --resource-group "$AZURE_RESOURCE_GROUP" --name "${name}_OsDisk_1" --yes --output none 2>&1); then
    log_warn "Failed to delete disk ${name}_OsDisk_1: $output"
  fi
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

azure_get_instance_family() {
  local instance_type="$1"
  local name="${instance_type#Standard_}"
  local letter="${name%%[0-9]*}"
  letter="${letter%s}"
  local suffix="${name##*_}"
  echo "${letter}${suffix}"
}

azure_get_instance_vcpus() {
  local instance_type="$1"
  if [[ -n "${_AZURE_VCPU_CACHE[$instance_type]:-}" ]]; then
    echo "${_AZURE_VCPU_CACHE[$instance_type]}"
    return
  fi
  local name="${instance_type#Standard_}"
  local num
  num=$(echo "$name" | grep -oE '[0-9]+' | head -1)
  echo "${num:-0}"
}

_azure_family_to_sku_family() {
  local family="${1,,}"
  case "$family" in
    dv5)  echo "standardDv5Family" ;;
    fv2)  echo "standardFSv2Family" ;;
    ev5)  echo "standardEv5Family" ;;
    *)    return 1 ;;
  esac
}

azure_list_families() {
  echo "dv5 fv2 ev5"
}

azure_list_instances() {
  local family="$1"
  local sku_family
  sku_family=$(_azure_family_to_sku_family "$family") || return 1
  local json
  json=$(az vm list-skus \
    --location "$AZURE_LOCATION" \
    --resource-type virtualMachines \
    --query "[?family=='${sku_family}' && restrictions[0]==null].{name:name,vcpus:capabilities[?name=='vCPUs'].value|[0]}" \
    --output json)
  while IFS=$'\t' read -r name vcpus; do
    [[ -z "$name" ]] && continue
    _AZURE_VCPU_CACHE[$name]="$vcpus"
    echo "$name"
  done < <(echo "$json" | jq -r 'sort_by(.vcpus | tonumber) | .[] | "\(.name)\t\(.vcpus)"')
}

azure_setup_networking() {
  if [[ -n "$AZURE_VNET" ]]; then
    log_info "Using pre-existing Azure networking (vnet=$AZURE_VNET)"
    return 0
  fi

  log_info "Creating Azure networking resources..."

  AZURE_VNET="tailbench-vnet"
  AZURE_SUBNET="tailbench-subnet"
  AZURE_NSG="tailbench-nsg"

  # VNet + subnet in one call
  az network vnet create \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$AZURE_VNET" \
    --location "$AZURE_LOCATION" \
    --address-prefix 10.0.0.0/16 \
    --subnet-name "$AZURE_SUBNET" \
    --subnet-prefix 10.0.1.0/24 \
    --tags Project=tailbench \
    --output none

  # NSG
  az network nsg create \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$AZURE_NSG" \
    --location "$AZURE_LOCATION" \
    --tags Project=tailbench \
    --output none

  az network nsg rule create \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --nsg-name "$AZURE_NSG" \
    --name AllowSSH \
    --priority 1000 \
    --protocol Tcp \
    --destination-port-ranges 22 \
    --access Allow \
    --direction Inbound \
    --output none

  az network nsg rule create \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --nsg-name "$AZURE_NSG" \
    --name AllowVNetInternal \
    --priority 1100 \
    --protocol '*' \
    --source-address-prefixes VirtualNetwork \
    --destination-address-prefixes VirtualNetwork \
    --access Allow \
    --direction Inbound \
    --output none

  # Export for subprocesses
  export AZURE_VNET AZURE_SUBNET AZURE_NSG
  _AZURE_NETWORKING_AUTO_CREATED=true

  log_info "Azure networking ready (vnet=$AZURE_VNET subnet=$AZURE_SUBNET nsg=$AZURE_NSG)"
}

azure_teardown_networking() {
  if [[ "$_AZURE_NETWORKING_AUTO_CREATED" != "true" ]]; then
    return 0
  fi

  log_info "Tearing down auto-created Azure networking..."
  local output

  if ! output=$(az network nsg delete \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$AZURE_NSG" \
    --output none 2>&1); then
    log_warn "Failed to delete NSG $AZURE_NSG: $output"
  fi

  if ! output=$(az network vnet delete \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$AZURE_VNET" \
    --output none 2>&1); then
    log_warn "Failed to delete VNet $AZURE_VNET: $output"
  fi

  log_info "Azure networking teardown complete"
}
