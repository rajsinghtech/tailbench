#!/usr/bin/env bash
# GKE-specific operations: cluster discovery, kubeconfig, cluster info

gke_discover_cluster() {
  local cluster
  cluster=$(gcloud container clusters list \
    --project "$GCP_PROJECT" \
    --zone "$GCP_ZONE" \
    --filter "name=$GKE_CLUSTER_NAME" \
    --format "value(name)" 2>/dev/null) || true

  if [[ -z "$cluster" ]]; then
    log_error "GKE cluster '$GKE_CLUSTER_NAME' not found in $GCP_ZONE"
    log_error "Run scripts/setup-gke-cluster.sh first"
    return 1
  fi
  log_info "discovered GKE cluster: $cluster"
}

gke_get_kubeconfig() {
  log_info "configuring kubeconfig for $GKE_CLUSTER_NAME"
  gcloud container clusters get-credentials "$GKE_CLUSTER_NAME" \
    --project "$GCP_PROJECT" \
    --zone "$GCP_ZONE" 2>/dev/null
}

gke_get_cluster_info() {
  local version
  version=$(gcloud container clusters describe "$GKE_CLUSTER_NAME" \
    --project "$GCP_PROJECT" \
    --zone "$GCP_ZONE" \
    --format "value(currentMasterVersion)" 2>/dev/null) || true

  GKE_K8S_VERSION="${version%%[-+]*}"  # strip trailing -gke.xxx suffix
  log_info "GKE cluster version: $GKE_K8S_VERSION"
}

gke_get_node_machine_type() {
  local machine_type
  machine_type=$(kubectl get nodes \
    -o jsonpath='{.items[0].metadata.labels.beta\.kubernetes\.io/instance-type}' 2>/dev/null) || true
  if [[ -n "$machine_type" ]]; then
    GKE_NODE_MACHINE_TYPE="$machine_type"
  fi
  echo "$GKE_NODE_MACHINE_TYPE"
}

gke_ensure_node_pool() {
  local target_type="$1"
  local current_type
  current_type=$(gke_get_node_machine_type 2>/dev/null) || true

  if [[ "$current_type" == "$target_type" ]]; then
    log_info "GKE node pool already uses $target_type"
    return 0
  fi

  # Delete all non-default node pools
  local pools
  pools=$(gcloud container node-pools list \
    --cluster "$GKE_CLUSTER_NAME" \
    --project "$GCP_PROJECT" \
    --zone "$GCP_ZONE" \
    --format "value(name)" 2>/dev/null) || true

  for pool in $pools; do
    [[ -z "$pool" ]] && continue
    log_info "deleting node pool $pool"
    gcloud container node-pools delete "$pool" \
      --cluster "$GKE_CLUSTER_NAME" \
      --project "$GCP_PROJECT" \
      --zone "$GCP_ZONE" \
      --quiet 2>&1 | while IFS= read -r line; do log_info "gcloud: $line"; done || true
  done

  local pool_name="tb-${target_type//\//-}"
  log_info "creating node pool $pool_name with $target_type"
  gcloud container node-pools create "$pool_name" \
    --cluster "$GKE_CLUSTER_NAME" \
    --project "$GCP_PROJECT" \
    --zone "$GCP_ZONE" \
    --machine-type "$target_type" \
    --num-nodes 1 \
    --no-enable-autoupgrade \
    --no-enable-autorepair \
    --labels project=tailbench \
    2>&1 | while IFS= read -r line; do log_info "gcloud: $line"; done

  # Wait for node to be ready
  kubectl wait node --all --for=condition=Ready --timeout=300s >/dev/null

  # Wait for GKE DaemonSets to finish pulling images
  log_info "waiting for DaemonSets to become ready..."
  kubectl rollout status daemonset/fluentbit-gke -n kube-system --timeout=120s >/dev/null 2>&1 || true
  kubectl rollout status daemonset/gke-metrics-agent -n kube-system --timeout=120s >/dev/null 2>&1 || true
  kubectl rollout status daemonset/pdcsi-node -n kube-system --timeout=120s >/dev/null 2>&1 || true

  log_info "node pool ready with $target_type"
  GKE_NODE_MACHINE_TYPE="$target_type"
}
