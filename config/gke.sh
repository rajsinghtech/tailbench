#!/usr/bin/env bash
# GKE configuration

GKE_CLUSTER_NAME="${GKE_CLUSTER_NAME:-tailbench-gke}"
GKE_NAMESPACE="${GKE_NAMESPACE:-tailbench}"
K8S_NAMESPACE="$GKE_NAMESPACE"
GKE_NODE_MACHINE_TYPE="${GKE_NODE_MACHINE_TYPE:-n2-standard-4}"
