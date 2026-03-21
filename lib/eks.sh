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

  # Delete ALL existing node groups via AWS API (no drain, no PDB issues)
  local ng_list
  ng_list=$(aws eks list-nodegroups \
    --region "$AWS_REGION" \
    --cluster-name "$EKS_CLUSTER_NAME" \
    --query 'nodegroups[]' --output text 2>/dev/null) || true

  for ng in $ng_list; do
    [[ "$ng" == "None" || -z "$ng" ]] && continue
    log_info "deleting node group $ng"
    aws eks delete-nodegroup \
      --region "$AWS_REGION" \
      --cluster-name "$EKS_CLUSTER_NAME" \
      --nodegroup-name "$ng" >/dev/null 2>&1 || true
  done
  # Wait for all to finish deleting
  for ng in $ng_list; do
    [[ "$ng" == "None" || -z "$ng" ]] && continue
    log_info "waiting for $ng deletion..."
    aws eks wait nodegroup-deleted \
      --region "$AWS_REGION" \
      --cluster-name "$EKS_CLUSTER_NAME" \
      --nodegroup-name "$ng" 2>/dev/null || true
  done

  # Clean up orphaned eksctl CF stacks for nodegroups
  local stacks
  stacks=$(aws cloudformation list-stacks \
    --region "$AWS_REGION" \
    --stack-status-filter CREATE_COMPLETE DELETE_IN_PROGRESS \
    --query 'StackSummaries[?contains(StackName,`'"$EKS_CLUSTER_NAME"'-nodegroup`)].StackName' \
    --output text 2>/dev/null) || true
  for stack in $stacks; do
    [[ -z "$stack" || "$stack" == "None" ]] && continue
    log_info "cleaning up CF stack $stack"
    aws cloudformation update-termination-protection --region "$AWS_REGION" \
      --no-enable-termination-protection --stack-name "$stack" 2>/dev/null || true
    aws cloudformation delete-stack --region "$AWS_REGION" \
      --stack-name "$stack" 2>/dev/null || true
  done
  for stack in $stacks; do
    [[ -z "$stack" || "$stack" == "None" ]] && continue
    aws cloudformation wait stack-delete-complete --region "$AWS_REGION" \
      --stack-name "$stack" 2>/dev/null || true
  done

  # Use a unique name per instance type to avoid eksctl name conflicts
  local ng_name="tb-${target_type//\./-}"

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
  - name: ${ng_name}
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

  log_info "creating node group $ng_name with $target_type"
  eksctl create nodegroup -f "$ng_config" 2>&1 | while IFS= read -r line; do log_info "eksctl: $line"; done
  rm -f "$ng_config"

  # Wait for node to be ready
  kubectl wait node --all --for=condition=Ready --timeout=300s >/dev/null
  log_info "node group ready with $target_type"
  EKS_NODE_INSTANCE_TYPE="$target_type"
}
