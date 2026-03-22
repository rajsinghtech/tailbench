#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/config/azure.sh"
source "$TAILBENCH_ROOT/config/aks.sh"

require_cmd az kubectl

log_info "=== AKS Cluster Setup for Tailbench ==="

# Check if cluster already exists
if az aks list \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --query "[?name=='$AKS_CLUSTER_NAME'].name" \
    --output tsv 2>/dev/null | grep -q "$AKS_CLUSTER_NAME"; then
  log_info "AKS cluster $AKS_CLUSTER_NAME already exists"
  az aks get-credentials \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$AKS_CLUSTER_NAME" \
    --overwrite-existing >/dev/null
  kubectl create namespace "$AKS_NAMESPACE" 2>/dev/null || true
  kubectl wait node --all --for=condition=Ready --timeout=120s >/dev/null
  log_info "cluster is ready"
  exit 0
fi

# Ensure resource group exists
az group create --name "$AZURE_RESOURCE_GROUP" --location "$AZURE_LOCATION" >/dev/null 2>&1 || true

# Discover existing tailbench VNet/subnet
local_subnet=""
if [[ -n "${AZURE_VNET:-}" && -n "${AZURE_SUBNET:-}" ]]; then
  local_subnet=$(az network vnet subnet show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --vnet-name "$AZURE_VNET" \
    --name "$AZURE_SUBNET" \
    --query id --output tsv 2>/dev/null) || true
fi

log_info "creating AKS cluster $AKS_CLUSTER_NAME in $AZURE_LOCATION"

AKS_CREATE_ARGS=(
  --resource-group "$AZURE_RESOURCE_GROUP"
  --name "$AKS_CLUSTER_NAME"
  --location "$AZURE_LOCATION"
  --node-count 1
  --node-vm-size "$AKS_NODE_VM_SIZE"
  --no-ssh-key
  --tags project=tailbench
  --network-plugin azure
)

if [[ -n "$local_subnet" ]]; then
  AKS_CREATE_ARGS+=(--vnet-subnet-id "$local_subnet")
fi

az aks create "${AKS_CREATE_ARGS[@]}" 2>&1 | while IFS= read -r line; do log_info "az: $line"; done

az aks get-credentials \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$AKS_CLUSTER_NAME" \
  --overwrite-existing >/dev/null

kubectl create namespace "$AKS_NAMESPACE" 2>/dev/null || true
kubectl wait node --all --for=condition=Ready --timeout=120s >/dev/null

log_info "=== AKS Setup Complete ==="
log_info "cluster:   $AKS_CLUSTER_NAME"
log_info "namespace: $AKS_NAMESPACE"
log_info "location:  $AZURE_LOCATION"
log_info "node size: $AKS_NODE_VM_SIZE"
log_info ""
log_info "Run benchmarks with: ./scripts/orchestrate.sh --provider azure --family <family> --k8s"
