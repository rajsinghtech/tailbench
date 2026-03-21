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

eks_ensure_node_group() {
  local target_type="$1"
  local current_type
  current_type=$(eks_get_node_instance_type 2>/dev/null) || true

  if [[ "$current_type" == "$target_type" ]]; then
    log_info "EKS node group already uses $target_type"
    return 0
  fi

  # Delete existing node group via AWS API (no drain, no PDB issues)
  local existing_ng
  existing_ng=$(aws eks list-nodegroups \
    --region "$AWS_REGION" \
    --cluster-name "$EKS_CLUSTER_NAME" \
    --query 'nodegroups[0]' --output text 2>/dev/null) || true

  if [[ -n "$existing_ng" && "$existing_ng" != "None" ]]; then
    log_info "deleting node group $existing_ng ($current_type) to replace with $target_type"
    aws eks delete-nodegroup \
      --region "$AWS_REGION" \
      --cluster-name "$EKS_CLUSTER_NAME" \
      --nodegroup-name "$existing_ng" >/dev/null
    log_info "waiting for node group deletion..."
    aws eks wait nodegroup-deleted \
      --region "$AWS_REGION" \
      --cluster-name "$EKS_CLUSTER_NAME" \
      --nodegroup-name "$existing_ng" 2>/dev/null || true
    log_info "node group deleted"
  fi

  # Find the EKS subnet in the benchmark AZ
  local eks_subnet
  eks_subnet=$(aws ec2 describe-subnets \
    --region "$AWS_REGION" \
    --filters "Name=tag:Name,Values=tailbench-eks-subnet" \
    --query 'Subnets[0].SubnetId' --output text)

  local ng_config
  ng_config=$(mktemp /tmp/tailbench-ng-XXXXXX.yaml)
  cat > "$ng_config" <<EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: ${EKS_CLUSTER_NAME}
  region: ${AWS_REGION}

managedNodeGroups:
  - name: tailbench-nodes
    instanceType: ${target_type}
    desiredCapacity: 1
    minSize: 1
    maxSize: 2
    subnets:
      - ${eks_subnet}
    labels:
      Project: tailbench
    updateConfig:
      maxUnavailable: 1
EOF

  log_info "creating node group with $target_type"
  eksctl create nodegroup -f "$ng_config" 2>&1 | while IFS= read -r line; do log_info "eksctl: $line"; done
  rm -f "$ng_config"

  # Wait for node to be ready
  kubectl wait node --all --for=condition=Ready --timeout=180s >/dev/null
  log_info "node group ready with $target_type"
  EKS_NODE_INSTANCE_TYPE="$target_type"
}
