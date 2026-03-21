#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/config/aws.sh"
source "$TAILBENCH_ROOT/config/eks.sh"

require_cmd eksctl kubectl aws

log_info "=== EKS Cluster Setup for Tailbench ==="

# Discover existing tailbench VPC
AWS_VPC_ID=$(aws ec2 describe-vpcs \
  --region "$AWS_REGION" \
  --filters "Name=tag:Project,Values=tailbench" \
  --query 'Vpcs[0].VpcId' --output text)

if [[ "$AWS_VPC_ID" == "None" || -z "$AWS_VPC_ID" ]]; then
  log_error "tailbench VPC not found — run a benchmark first to create networking"
  exit 1
fi
log_info "found VPC: $AWS_VPC_ID"

# Discover existing benchmark security group
AWS_SG_ID=$(aws ec2 describe-security-groups \
  --region "$AWS_REGION" \
  --filters "Name=tag:Project,Values=tailbench" "Name=vpc-id,Values=$AWS_VPC_ID" \
  --query 'SecurityGroups[0].GroupId' --output text)
log_info "found security group: $AWS_SG_ID"

# Check if cluster already exists
if eksctl get cluster --name "$EKS_CLUSTER_NAME" --region "$AWS_REGION" &>/dev/null; then
  log_info "EKS cluster $EKS_CLUSTER_NAME already exists"
else
  # Create EKS subnets in the tailbench VPC (eksctl needs them pre-created
  # since we're using an existing VPC, not letting eksctl create one)
  AWS_AZ2="${AWS_REGION}b"

  EKS_SUBNET_ID=$(aws ec2 describe-subnets \
    --region "$AWS_REGION" \
    --filters "Name=tag:Name,Values=tailbench-eks-subnet" "Name=vpc-id,Values=$AWS_VPC_ID" \
    --query 'Subnets[0].SubnetId' --output text 2>/dev/null) || true

  if [[ "$EKS_SUBNET_ID" == "None" || -z "$EKS_SUBNET_ID" ]]; then
    log_info "creating EKS subnet ($EKS_SUBNET_CIDR) in $AWS_AZ"
    EKS_SUBNET_ID=$(aws ec2 create-subnet \
      --region "$AWS_REGION" \
      --vpc-id "$AWS_VPC_ID" \
      --cidr-block "$EKS_SUBNET_CIDR" \
      --availability-zone "$AWS_AZ" \
      --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=tailbench-eks-subnet},{Key=Project,Value=tailbench}]' \
      --query 'Subnet.SubnetId' --output text)
    aws ec2 modify-subnet-attribute --region "$AWS_REGION" \
      --subnet-id "$EKS_SUBNET_ID" --map-public-ip-on-launch
  else
    log_info "found existing EKS subnet: $EKS_SUBNET_ID"
  fi

  EKS_SUBNET_ID_AZ2=$(aws ec2 describe-subnets \
    --region "$AWS_REGION" \
    --filters "Name=tag:Name,Values=tailbench-eks-subnet-az2" "Name=vpc-id,Values=$AWS_VPC_ID" \
    --query 'Subnets[0].SubnetId' --output text 2>/dev/null) || true

  if [[ "$EKS_SUBNET_ID_AZ2" == "None" || -z "$EKS_SUBNET_ID_AZ2" ]]; then
    log_info "creating EKS AZ2 subnet ($EKS_SUBNET_CIDR_AZ2) in $AWS_AZ2"
    EKS_SUBNET_ID_AZ2=$(aws ec2 create-subnet \
      --region "$AWS_REGION" \
      --vpc-id "$AWS_VPC_ID" \
      --cidr-block "$EKS_SUBNET_CIDR_AZ2" \
      --availability-zone "$AWS_AZ2" \
      --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=tailbench-eks-subnet-az2},{Key=Project,Value=tailbench}]' \
      --query 'Subnet.SubnetId' --output text)
  else
    log_info "found existing AZ2 subnet: $EKS_SUBNET_ID_AZ2"
  fi

  # Find the route table with an IGW route (used by the benchmark subnet)
  # The main route table only has local — nodes need internet to reach EKS API
  IGW_ID=$(aws ec2 describe-internet-gateways \
    --region "$AWS_REGION" \
    --filters "Name=attachment.vpc-id,Values=$AWS_VPC_ID" \
    --query 'InternetGateways[0].InternetGatewayId' --output text)
  RTB_ID=$(aws ec2 describe-route-tables \
    --region "$AWS_REGION" \
    --filters "Name=vpc-id,Values=$AWS_VPC_ID" "Name=route.gateway-id,Values=$IGW_ID" \
    --query 'RouteTables[0].RouteTableId' --output text)
  if [[ -z "$RTB_ID" || "$RTB_ID" == "None" ]]; then
    log_error "no route table with IGW found in VPC — nodes won't be able to reach EKS API"
    exit 1
  fi
  log_info "associating EKS subnets with route table $RTB_ID (has IGW $IGW_ID)"
  aws ec2 associate-route-table --region "$AWS_REGION" \
    --route-table-id "$RTB_ID" --subnet-id "$EKS_SUBNET_ID" >/dev/null 2>&1 || true
  aws ec2 associate-route-table --region "$AWS_REGION" \
    --route-table-id "$RTB_ID" --subnet-id "$EKS_SUBNET_ID_AZ2" >/dev/null 2>&1 || true

  log_info "creating EKS cluster $EKS_CLUSTER_NAME via eksctl"
  eksctl create cluster \
    --name "$EKS_CLUSTER_NAME" \
    --region "$AWS_REGION" \
    --vpc-public-subnets "$EKS_SUBNET_ID,$EKS_SUBNET_ID_AZ2" \
    --node-type "$EKS_NODE_INSTANCE_TYPE" \
    --nodes 1 \
    --nodes-min 1 \
    --nodes-max 2 \
    --node-labels "Project=tailbench" \
    --tags "Project=tailbench" \
    --ssh-access=false \
    --kubeconfig "$HOME/.kube/config" \
    --set-kubeconfig-context
fi

# Ensure kubeconfig is set
aws eks update-kubeconfig \
  --region "$AWS_REGION" \
  --name "$EKS_CLUSTER_NAME" \
  --alias "$EKS_CLUSTER_NAME" >/dev/null

# Add SG rule: allow iperf3 from pod subnet to benchmark SG
log_info "adding security group rules for iperf3 traffic"
aws ec2 authorize-security-group-ingress \
  --region "$AWS_REGION" \
  --group-id "$AWS_SG_ID" \
  --protocol tcp --port 15201 \
  --cidr "$EKS_SUBNET_CIDR" >/dev/null 2>&1 || true

# Cross-SG rule: benchmark SG → EKS node SG
EKS_NODE_SG=$(aws ec2 describe-security-groups \
  --region "$AWS_REGION" \
  --filters "Name=tag:kubernetes.io/cluster/$EKS_CLUSTER_NAME,Values=owned" \
  --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null) || true

if [[ -n "$EKS_NODE_SG" && "$EKS_NODE_SG" != "None" ]]; then
  aws ec2 authorize-security-group-ingress \
    --region "$AWS_REGION" \
    --group-id "$EKS_NODE_SG" \
    --protocol tcp --port 15201 \
    --source-group "$AWS_SG_ID" >/dev/null 2>&1 || true
fi

# Create namespace
kubectl create namespace "$EKS_NAMESPACE" 2>/dev/null || true

# Verify
kubectl wait node --all --for=condition=Ready --timeout=120s >/dev/null
log_info "node is Ready"

kubectl get daemonset aws-node -n kube-system >/dev/null 2>&1 \
  && log_info "aws-vpc-cni is active" \
  || log_warn "aws-vpc-cni not detected"

log_info "=== EKS Setup Complete ==="
log_info "cluster:   $EKS_CLUSTER_NAME"
log_info "namespace: $EKS_NAMESPACE"
log_info "node type: $EKS_NODE_INSTANCE_TYPE"
log_info ""
log_info "Run benchmarks with: ./scripts/orchestrate.sh --provider aws --family <family> --k8s"
