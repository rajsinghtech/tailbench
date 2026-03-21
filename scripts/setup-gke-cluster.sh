#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/config/gcp.sh"
source "$TAILBENCH_ROOT/config/gke.sh"

require_cmd gcloud kubectl

log_info "=== GKE Cluster Setup for Tailbench ==="

# Check if cluster already exists
if gcloud container clusters list \
    --project "$GCP_PROJECT" \
    --zone "$GCP_ZONE" \
    --filter "name=$GKE_CLUSTER_NAME" \
    --format "value(name)" 2>/dev/null | grep -q "$GKE_CLUSTER_NAME"; then
  log_info "GKE cluster $GKE_CLUSTER_NAME already exists"
  gcloud container clusters get-credentials "$GKE_CLUSTER_NAME" \
    --project "$GCP_PROJECT" --zone "$GCP_ZONE" 2>/dev/null
  kubectl create namespace "$GKE_NAMESPACE" 2>/dev/null || true
  kubectl wait node --all --for=condition=Ready --timeout=120s >/dev/null
  log_info "cluster is ready"
  exit 0
fi

log_info "creating GKE cluster $GKE_CLUSTER_NAME in $GCP_ZONE"
gcloud container clusters create "$GKE_CLUSTER_NAME" \
  --project "$GCP_PROJECT" \
  --zone "$GCP_ZONE" \
  --network "$GCP_NETWORK" \
  --subnetwork "$GCP_SUBNET" \
  --machine-type "$GKE_NODE_MACHINE_TYPE" \
  --num-nodes 1 \
  --no-enable-autoupgrade \
  --no-enable-autorepair \
  --no-enable-basic-auth \
  --labels project=tailbench \
  --node-labels project=tailbench \
  2>&1 | while IFS= read -r line; do log_info "gcloud: $line"; done

gcloud container clusters get-credentials "$GKE_CLUSTER_NAME" \
  --project "$GCP_PROJECT" --zone "$GCP_ZONE" 2>/dev/null

kubectl create namespace "$GKE_NAMESPACE" 2>/dev/null || true
kubectl wait node --all --for=condition=Ready --timeout=120s >/dev/null

log_info "=== GKE Setup Complete ==="
log_info "cluster:   $GKE_CLUSTER_NAME"
log_info "namespace: $GKE_NAMESPACE"
log_info "zone:      $GCP_ZONE"
log_info "node type: $GKE_NODE_MACHINE_TYPE"
log_info ""
log_info "Run benchmarks with: ./scripts/orchestrate.sh --provider gcp --family <family> --k8s"
