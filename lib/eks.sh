#!/usr/bin/env bash
# EKS-specific operations: cluster discovery, kubeconfig, cluster info

eks_discover_cluster() {
  local cluster
  cluster=$(aws eks list-clusters \
    --region "$AWS_REGION" \
    --query 'clusters[?@==`'"$EKS_CLUSTER_NAME"'`]' \
    --output text 2>/dev/null) || true

  if [[ -z "$cluster" ]]; then
    log_error "EKS cluster '$EKS_CLUSTER_NAME' not found in $AWS_REGION"
    log_error "Run scripts/setup-k8s-cluster.sh first"
    return 1
  fi
  log_info "discovered EKS cluster: $cluster"
}

eks_get_kubeconfig() {
  log_info "configuring kubeconfig for $EKS_CLUSTER_NAME"
  aws eks update-kubeconfig \
    --region "$AWS_REGION" \
    --name "$EKS_CLUSTER_NAME" \
    --alias "$EKS_CLUSTER_NAME" \
    >/dev/null
}

eks_get_cluster_info() {
  local info
  info=$(aws eks describe-cluster \
    --region "$AWS_REGION" \
    --name "$EKS_CLUSTER_NAME" \
    --query 'cluster.{version:version,platformVersion:platformVersion}' \
    --output json)

  EKS_K8S_VERSION=$(echo "$info" | jq -r '.version')
  log_info "EKS cluster version: $EKS_K8S_VERSION"
}

eks_get_node_instance_type() {
  local node_type
  node_type=$(kubectl get nodes -o jsonpath='{.items[0].metadata.labels.node\.kubernetes\.io/instance-type}' 2>/dev/null) || true
  if [[ -n "$node_type" ]]; then
    EKS_NODE_INSTANCE_TYPE="$node_type"
  fi
  echo "$EKS_NODE_INSTANCE_TYPE"
}
