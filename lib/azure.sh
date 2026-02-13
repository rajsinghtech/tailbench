#!/usr/bin/env bash
set -euo pipefail

# Azure CLI (Python) needs UTF-8 encoding when stdout is not a terminal
export PYTHONIOENCODING=utf-8

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

  local create_output create_rc=0
  create_output=$("${args[@]}" 2>&1) || create_rc=$?
  if (( create_rc != 0 )); then
    log_error "az vm create failed for $name (exit $create_rc): $create_output"
    return 1
  fi

  log_info "Waiting for $name to be running..."
  local wait_output wait_rc=0
  wait_output=$(az vm wait \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$name" \
    --created \
    --timeout 300 2>&1) || wait_rc=$?
  if (( wait_rc != 0 )); then
    local error_msg
    error_msg=$(az vm get-instance-view \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --name "$name" \
      --query "instanceView.statuses[?level=='Error'].message" \
      --output tsv 2>/dev/null) || true
    log_error "VM $name provisioning failed: ${error_msg:-unknown error}"
    [[ -n "$wait_output" ]] && log_error "az vm wait: $wait_output"
    return 1
  fi

  # Cache public IP (|| true to avoid set -e killing the subshell)
  local ip
  ip=$(az vm show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$name" \
    --show-details \
    --query 'publicIps' \
    --output tsv 2>/dev/null) || true
  if [[ -n "$ip" ]]; then
    _AZURE_PUBLIC_IP_CACHE[$name]="$ip"
  else
    log_warn "Could not resolve public IP for $name"
  fi

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

  # Clean up associated resources (retry NIC/IP after 10s if reserved)
  local res_name attempt
  res_name="${name}VMNic"
  for attempt in 1 2; do
    if output=$(az network nic delete --resource-group "$AZURE_RESOURCE_GROUP" --name "$res_name" --output none 2>&1); then
      break
    fi
    if [[ "$output" == *NicReservedForAnotherVm* ]] && (( attempt == 1 )); then
      sleep 10
    else
      log_warn "Failed to delete NIC $res_name: $output"
      break
    fi
  done
  res_name="${name}PublicIP"
  if ! output=$(az network public-ip delete --resource-group "$AZURE_RESOURCE_GROUP" --name "$res_name" --output none 2>&1); then
    log_warn "Failed to delete public IP $res_name: $output"
  fi
  # Disk names vary; try both naming patterns
  local disk_deleted=false
  for disk_pattern in "${name}_OsDisk_1" "${name}_disk1"; do
    az disk list --resource-group "$AZURE_RESOURCE_GROUP" --query "[?starts_with(name, '${disk_pattern}')].name" --output tsv 2>/dev/null | while read -r disk; do
      az disk delete --resource-group "$AZURE_RESOURCE_GROUP" --name "$disk" --yes --output none 2>/dev/null && disk_deleted=true
    done
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
  ip=$(_azure_resolve_public_ip "$name") || true
  if [[ -z "$ip" ]]; then
    echo "ERROR: Cannot resolve public IP for VM $name" >&2
    return 1
  fi
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o ConnectTimeout=10 -o ServerAliveInterval=15 -o ServerAliveCountMax=4 \
    -o IdentitiesOnly=yes -o LogLevel=ERROR \
    -i "$AZURE_SSH_KEY_PATH" \
    "${AZURE_SSH_USER}@${ip}" "$@"
}

azure_scp() {
  local name="$1" src="$2" dest="$3"
  local ip
  ip=$(_azure_resolve_public_ip "$name")
  scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o LogLevel=ERROR \
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
  # Strip Standard_ prefix, remove first digit sequence, remove _ and -, lowercase
  # Standard_D4s_v4 → D4s_v4 → Ds_v4 → Dsv4 → dsv4
  # Standard_F4s_v2 → F4s_v2 → Fs_v2 → Fsv2 → fsv2
  # Standard_E4s_v4 → E4s_v4 → Es_v4 → Esv4 → esv4
  local name="${instance_type#Standard_}"
  echo "$name" | sed 's/[0-9][0-9]*//' | tr -d '_-' | tr '[:upper:]' '[:lower:]'
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
    dsv5)  echo "standardDSv5Family" ;;
    dasv5) echo "standardDASv5Family" ;;
    dpsv6) echo "StandardDpsv6Family" ;;
    dsv4)  echo "standardDSv4Family" ;;
    fsv2)  echo "standardFSv2Family" ;;
    fasv6)  echo "StandardFasv6Family" ;;
    falsv6) echo "StandardFalsv6Family" ;;
    famsv6) echo "StandardFamsv6Family" ;;
    fasv7)  echo "StandardFasv7Family" ;;
    falsv7) echo "StandardFalsv7Family" ;;
    famsv7) echo "StandardFamsv7Family" ;;
    esv4)   echo "standardESv4Family" ;;
    *)      return 1 ;;
  esac
}

azure_list_families() {
  echo "dsv5 dasv5 dpsv6 dsv4 fsv2 fasv6 falsv6 famsv6 fasv7 falsv7 famsv7 esv4"
}

azure_list_instances() {
  local family="$1"
  local sku_family
  sku_family=$(_azure_family_to_sku_family "$family") || return 1
  local json
  json=$(az vm list-skus \
    --location "$AZURE_LOCATION" \
    --resource-type virtualMachines \
    --query "[?family=='${sku_family}' && !(restrictions[?type=='Location'])].{name:name,vcpus:capabilities[?name=='vCPUs'].value|[0]}" \
    --output json)
  while IFS=$'\t' read -r name vcpus; do
    [[ -z "$name" ]] && continue
    # Skip constrained vCPU variants (e.g., Standard_E16-4s_v6)
    [[ "$name" =~ [0-9]-[0-9] ]] && continue
    # Skip isolated variants (e.g., Standard_E192is_v6)
    [[ "$name" == *is_v* ]] && continue
    _AZURE_VCPU_CACHE[$name]="$vcpus"
    echo "$name"
  done < <(echo "$json" | jq -r 'sort_by(.vcpus | tonumber) | .[] | "\(.name)\t\(.vcpus)"')
}

azure_is_quota_error() {
  local stderr="$1"
  [[ "$stderr" == *QuotaExceeded* ]] || \
  [[ "$stderr" == *OperationNotAllowed*quota* ]] || \
  [[ "$stderr" == *SkuNotAvailable* ]] || \
  [[ "$stderr" == *AllocationFailed* ]] || \
  [[ "$stderr" == *"sufficient capacity"* ]]
}

azure_setup_networking() {
  if [[ -n "$AZURE_VNET" ]]; then
    log_info "Using pre-existing Azure networking (vnet=$AZURE_VNET)"
    return 0
  fi

  # Check for existing tailbench VNet
  if az network vnet show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name tailbench-vnet \
    --output none 2>/dev/null; then

    AZURE_VNET="tailbench-vnet"
    AZURE_SUBNET="tailbench-subnet"
    AZURE_NSG="tailbench-nsg"

    export AZURE_VNET AZURE_SUBNET AZURE_NSG
    _AZURE_NETWORKING_AUTO_CREATED=false

    log_info "Azure networking reused (vnet=$AZURE_VNET subnet=$AZURE_SUBNET nsg=$AZURE_NSG)"
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

  # Allow WireGuard UDP for Tailscale direct connections
  az network nsg rule create \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --nsg-name "$AZURE_NSG" \
    --name AllowWireGuardUDP \
    --priority 1200 \
    --protocol Udp \
    --destination-port-ranges 41641 \
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
