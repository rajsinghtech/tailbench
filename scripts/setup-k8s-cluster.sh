#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/config/aws.sh"
source "$TAILBENCH_ROOT/config/eks.sh"

require_cmd aws kubectl

log_info "=== EKS Cluster Setup for Tailbench ==="

# Discover existing VPC
AWS_VPC_ID=$(aws ec2 describe-vpcs \
  --region "$AWS_REGION" \
  --filters "Name=tag:Project,Values=tailbench" \
  --query 'Vpcs[0].VpcId' --output text)

if [[ "$AWS_VPC_ID" == "None" || -z "$AWS_VPC_ID" ]]; then
  log_error "tailbench VPC not found — run a benchmark first to create it"
  exit 1
fi
log_info "found VPC: $AWS_VPC_ID"

# Discover existing security group
AWS_SG_ID=$(aws ec2 describe-security-groups \
  --region "$AWS_REGION" \
  --filters "Name=tag:Project,Values=tailbench" "Name=vpc-id,Values=$AWS_VPC_ID" \
  --query 'SecurityGroups[0].GroupId' --output text)

log_info "found security group: $AWS_SG_ID"

# Create EKS worker subnet (same AZ as benchmarks)
EKS_SUBNET_ID=$(aws ec2 describe-subnets \
  --region "$AWS_REGION" \
  --filters "Name=tag:Name,Values=tailbench-eks-subnet" "Name=vpc-id,Values=$AWS_VPC_ID" \
  --query 'Subnets[0].SubnetId' --output text 2>/dev/null) || true

if [[ "$EKS_SUBNET_ID" == "None" || -z "$EKS_SUBNET_ID" ]]; then
  log_info "creating EKS worker subnet ($EKS_SUBNET_CIDR) in $AWS_AZ"
  EKS_SUBNET_ID=$(aws ec2 create-subnet \
    --region "$AWS_REGION" \
    --vpc-id "$AWS_VPC_ID" \
    --cidr-block "$EKS_SUBNET_CIDR" \
    --availability-zone "$AWS_AZ" \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=tailbench-eks-subnet},{Key=Project,Value=tailbench}]' \
    --query 'Subnet.SubnetId' --output text)

  # Enable auto-assign public IP for EKS nodes
  aws ec2 modify-subnet-attribute \
    --region "$AWS_REGION" \
    --subnet-id "$EKS_SUBNET_ID" \
    --map-public-ip-on-launch
else
  log_info "found existing EKS subnet: $EKS_SUBNET_ID"
fi

# Create second AZ subnet (EKS control plane requires multi-AZ)
AWS_AZ2="${AWS_REGION}b"
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

# Associate subnets with the VPC route table (for internet access)
RTB_ID=$(aws ec2 describe-route-tables \
  --region "$AWS_REGION" \
  --filters "Name=vpc-id,Values=$AWS_VPC_ID" "Name=association.main,Values=true" \
  --query 'RouteTables[0].RouteTableId' --output text)

aws ec2 associate-route-table --region "$AWS_REGION" \
  --route-table-id "$RTB_ID" --subnet-id "$EKS_SUBNET_ID" >/dev/null 2>&1 || true
aws ec2 associate-route-table --region "$AWS_REGION" \
  --route-table-id "$RTB_ID" --subnet-id "$EKS_SUBNET_ID_AZ2" >/dev/null 2>&1 || true

# Create IAM role for EKS cluster (if not exists)
EKS_CLUSTER_ROLE="tailbench-eks-cluster-role"
if ! aws iam get-role --role-name "$EKS_CLUSTER_ROLE" &>/dev/null; then
  log_info "creating EKS cluster IAM role"
  aws iam create-role \
    --role-name "$EKS_CLUSTER_ROLE" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{"Effect": "Allow", "Principal": {"Service": "eks.amazonaws.com"}, "Action": "sts:AssumeRole"}]
    }' >/dev/null
  aws iam attach-role-policy --role-name "$EKS_CLUSTER_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy
fi

EKS_CLUSTER_ROLE_ARN=$(aws iam get-role --role-name "$EKS_CLUSTER_ROLE" \
  --query 'Role.Arn' --output text)

# Create IAM role for EKS nodes (if not exists)
EKS_NODE_ROLE="tailbench-eks-node-role"
if ! aws iam get-role --role-name "$EKS_NODE_ROLE" &>/dev/null; then
  log_info "creating EKS node IAM role"
  aws iam create-role \
    --role-name "$EKS_NODE_ROLE" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{"Effect": "Allow", "Principal": {"Service": "ec2.amazonaws.com"}, "Action": "sts:AssumeRole"}]
    }' >/dev/null
  aws iam attach-role-policy --role-name "$EKS_NODE_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy
  aws iam attach-role-policy --role-name "$EKS_NODE_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
  aws iam attach-role-policy --role-name "$EKS_NODE_ROLE" \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
fi

EKS_NODE_ROLE_ARN=$(aws iam get-role --role-name "$EKS_NODE_ROLE" \
  --query 'Role.Arn' --output text)

# Create EKS cluster
EXISTING_CLUSTER=$(aws eks describe-cluster \
  --region "$AWS_REGION" \
  --name "$EKS_CLUSTER_NAME" \
  --query 'cluster.status' --output text 2>/dev/null) || true

if [[ "$EXISTING_CLUSTER" == "ACTIVE" ]]; then
  log_info "EKS cluster $EKS_CLUSTER_NAME already exists and is ACTIVE"
else
  log_info "creating EKS cluster $EKS_CLUSTER_NAME (this takes ~10-15 minutes)"
  aws eks create-cluster \
    --region "$AWS_REGION" \
    --name "$EKS_CLUSTER_NAME" \
    --role-arn "$EKS_CLUSTER_ROLE_ARN" \
    --resources-vpc-config "subnetIds=$EKS_SUBNET_ID,$EKS_SUBNET_ID_AZ2,securityGroupIds=$AWS_SG_ID" \
    --tags Project=tailbench \
    >/dev/null

  log_info "waiting for cluster to become ACTIVE..."
  aws eks wait cluster-active \
    --region "$AWS_REGION" \
    --name "$EKS_CLUSTER_NAME"
  log_info "cluster is ACTIVE"
fi

# Configure kubeconfig
aws eks update-kubeconfig \
  --region "$AWS_REGION" \
  --name "$EKS_CLUSTER_NAME" \
  --alias "$EKS_CLUSTER_NAME" >/dev/null

# Create node group
EXISTING_NG=$(aws eks describe-nodegroup \
  --region "$AWS_REGION" \
  --cluster-name "$EKS_CLUSTER_NAME" \
  --nodegroup-name tailbench-nodes \
  --query 'nodegroup.status' --output text 2>/dev/null) || true

if [[ "$EXISTING_NG" == "ACTIVE" ]]; then
  log_info "node group tailbench-nodes already exists and is ACTIVE"
else
  log_info "creating managed node group (this takes ~3-5 minutes)"
  aws eks create-nodegroup \
    --region "$AWS_REGION" \
    --cluster-name "$EKS_CLUSTER_NAME" \
    --nodegroup-name tailbench-nodes \
    --node-role "$EKS_NODE_ROLE_ARN" \
    --instance-types "$EKS_NODE_INSTANCE_TYPE" \
    --scaling-config minSize=1,maxSize=2,desiredSize=1 \
    --subnets "$EKS_SUBNET_ID" \
    --tags Project=tailbench \
    >/dev/null

  log_info "waiting for node group to become ACTIVE..."
  aws eks wait nodegroup-active \
    --region "$AWS_REGION" \
    --cluster-name "$EKS_CLUSTER_NAME" \
    --nodegroup-name tailbench-nodes
  log_info "node group is ACTIVE"
fi

# Add security group rule: allow iperf3 from pod subnet to benchmark SG
log_info "adding security group rule for pod→EC2 iperf3 traffic"
aws ec2 authorize-security-group-ingress \
  --region "$AWS_REGION" \
  --group-id "$AWS_SG_ID" \
  --protocol tcp --port 15201 \
  --cidr "$EKS_SUBNET_CIDR" >/dev/null 2>&1 || true

# Also allow benchmark SG → pod subnet (EC2→pod direction)
# EKS node SG is managed by EKS, get it
EKS_NODE_SG=$(aws ec2 describe-security-groups \
  --region "$AWS_REGION" \
  --filters "Name=tag:kubernetes.io/cluster/$EKS_CLUSTER_NAME,Values=owned" \
  --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null) || true

if [[ -n "$EKS_NODE_SG" && "$EKS_NODE_SG" != "None" ]]; then
  log_info "adding cross-SG rules for EC2↔pod traffic"
  aws ec2 authorize-security-group-ingress \
    --region "$AWS_REGION" \
    --group-id "$EKS_NODE_SG" \
    --protocol tcp --port 15201 \
    --source-group "$AWS_SG_ID" >/dev/null 2>&1 || true
fi

# Create namespace
kubectl create namespace "$EKS_NAMESPACE" 2>/dev/null || true

# Verify VPC CNI
log_info "verifying VPC CNI"
kubectl get daemonset aws-node -n kube-system >/dev/null 2>&1 \
  && log_info "aws-vpc-cni is active" \
  || log_warn "aws-vpc-cni not detected — pods may not get VPC IPs"

# Verify node is ready
kubectl wait node --all --for=condition=Ready --timeout=120s >/dev/null
log_info "node is Ready"

# Summary
log_info "=== EKS Setup Complete ==="
log_info "cluster:   $EKS_CLUSTER_NAME"
log_info "namespace: $EKS_NAMESPACE"
log_info "subnet:    $EKS_SUBNET_ID ($EKS_SUBNET_CIDR in $AWS_AZ)"
log_info "node type: $EKS_NODE_INSTANCE_TYPE"
log_info ""
log_info "Run benchmarks with: ./scripts/orchestrate.sh --provider aws --family <family> --k8s"
