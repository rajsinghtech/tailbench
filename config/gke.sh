#!/usr/bin/env bash
# GKE configuration

GKE_CLUSTER_NAME="${GKE_CLUSTER_NAME:-tailbench-gke}"
GKE_NAMESPACE="${GKE_NAMESPACE:-tailbench}"
GKE_NODE_MACHINE_TYPE="${GKE_NODE_MACHINE_TYPE:-n2-standard-4}"

# Alias so lib/k8s.sh (which uses EKS_NAMESPACE) works unchanged
EKS_NAMESPACE="$GKE_NAMESPACE"
