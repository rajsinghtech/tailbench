#!/usr/bin/env bash
# AKS configuration

AKS_CLUSTER_NAME="${AKS_CLUSTER_NAME:-tailbench-aks}"
AKS_NAMESPACE="${AKS_NAMESPACE:-tailbench}"
AKS_NODE_VM_SIZE="${AKS_NODE_VM_SIZE:-Standard_D4s_v4}"

# Alias so lib/k8s.sh (which uses EKS_NAMESPACE) works unchanged
EKS_NAMESPACE="$AKS_NAMESPACE"
