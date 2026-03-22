#!/usr/bin/env bash
# AKS-specific operations: cluster discovery, kubeconfig, cluster info

aks_discover_cluster() {
  local cluster
  cluster=$(az aks list \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --query "[?name=='$AKS_CLUSTER_NAME'].name" \
    --output tsv 2>/dev/null) || true

  if [[ -z "$cluster" ]]; then
    log_error "AKS cluster '$AKS_CLUSTER_NAME' not found in $AZURE_RESOURCE_GROUP"
    log_error "Run scripts/setup-aks-cluster.sh first"
    return 1
  fi
  log_info "discovered AKS cluster: $cluster"
}

aks_get_kubeconfig() {
  log_info "configuring kubeconfig for $AKS_CLUSTER_NAME"
  az aks get-credentials \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$AKS_CLUSTER_NAME" \
    --overwrite-existing \
    >/dev/null
}

aks_get_cluster_info() {
  local version
  version=$(az aks show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$AKS_CLUSTER_NAME" \
    --query kubernetesVersion \
    --output tsv 2>/dev/null) || true

  AKS_K8S_VERSION="${version}"
  log_info "AKS cluster version: $AKS_K8S_VERSION"
}

aks_get_node_vm_size() {
  local vm_size
  vm_size=$(kubectl get nodes \
    -o jsonpath='{.items[0].metadata.labels.beta\.kubernetes\.io/instance-type}' 2>/dev/null) || true
  if [[ -n "$vm_size" ]]; then
    AKS_NODE_VM_SIZE="$vm_size"
  fi
  echo "$AKS_NODE_VM_SIZE"
}

aks_family_to_vm_size() {
  local family="$1"
  case "$family" in
    dsv5)  echo "Standard_D4s_v4" ;;  # v5 not available in sandbox, use v4
    dasv5) echo "Standard_D4as_v5" ;;
    dpsv6) echo "Standard_D4ps_v6" ;;
    dsv4)  echo "Standard_D4s_v4" ;;
    fsv2)  echo "Standard_F4s_v2" ;;
    fasv6) echo "Standard_F4as_v6" ;;
    falsv6) echo "Standard_F4als_v6" ;;
    famsv6) echo "Standard_F4ams_v6" ;;
    fasv7) echo "Standard_F4as_v7" ;;
    falsv7) echo "Standard_F4als_v7" ;;
    famsv7) echo "Standard_F4ams_v7" ;;
    esv4)  echo "Standard_E4s_v4" ;;
    *)     echo "Standard_D4s_v5" ;;
  esac
}

aks_ensure_node_pool() {
  local target_type="$1"
  local current_type
  current_type=$(aks_get_node_vm_size 2>/dev/null) || true

  if [[ "$current_type" == "$target_type" ]]; then
    log_info "AKS node pool already uses $target_type"
    return 0
  fi

  # Delete existing tb-* node pools
  local pools
  pools=$(az aks nodepool list \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --cluster-name "$AKS_CLUSTER_NAME" \
    --query "[?starts_with(name,'tb')].name" \
    --output tsv 2>/dev/null) || true

  for pool in $pools; do
    [[ -z "$pool" ]] && continue
    log_info "deleting node pool $pool"
    az aks nodepool delete \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --cluster-name "$AKS_CLUSTER_NAME" \
      --name "$pool" \
      --no-wait \
      2>&1 | while IFS= read -r line; do log_info "az: $line"; done || true
  done
  # Wait for deletions
  for pool in $pools; do
    [[ -z "$pool" ]] && continue
    log_info "waiting for $pool deletion..."
    local attempts=0
    while (( attempts < 30 )); do
      local status
      status=$(az aks nodepool show \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --cluster-name "$AKS_CLUSTER_NAME" \
        --name "$pool" \
        --query provisioningState --output tsv 2>/dev/null) || true
      [[ -z "$status" ]] && break  # deleted
      sleep 10
      attempts=$(( attempts + 1 ))
    done
  done

  # Scale down the system node pool (we'll use a user pool for benchmarks)
  local pool_name="tb${target_type//[^a-zA-Z0-9]/}"
  pool_name="${pool_name:0:12}"  # AKS pool names max 12 chars, lowercase
  pool_name="${pool_name,,}"

  log_info "creating node pool $pool_name with $target_type"
  az aks nodepool add \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --cluster-name "$AKS_CLUSTER_NAME" \
    --name "$pool_name" \
    --node-count 1 \
    --node-vm-size "$target_type" \
    --mode User \
    --labels project=tailbench \
    2>&1 | while IFS= read -r line; do log_info "az: $line"; done

  # Wait for node to be ready
  kubectl wait node --all --for=condition=Ready --timeout=300s >/dev/null

  # Wait for AKS DaemonSets to settle
  log_info "waiting for DaemonSets to become ready..."
  kubectl rollout status daemonset/azure-cni-networkmonitor -n kube-system --timeout=120s >/dev/null 2>&1 || true
  kubectl rollout status daemonset/kube-proxy -n kube-system --timeout=120s >/dev/null 2>&1 || true

  log_info "node pool ready with $target_type"
  AKS_NODE_VM_SIZE="$target_type"
}
