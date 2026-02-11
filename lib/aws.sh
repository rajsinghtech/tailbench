#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# IP cache — avoids repeated describe-instances calls
declare -gA _AWS_PUBLIC_IP_CACHE=() 2>/dev/null || true
declare -gA _AWS_INSTANCE_ID_CACHE=() 2>/dev/null || true

_AWS_NETWORKING_AUTO_CREATED="${_AWS_NETWORKING_AUTO_CREATED:-false}"

# AMI cache (per-run)
_AWS_AMI_AMD64_CACHED=""
_AWS_AMI_ARM64_CACHED=""

_aws_is_graviton() {
  local instance_type="$1"
  local family="${instance_type%%.*}"
  [[ "$family" == *g* ]]
}

_aws_lookup_ami() {
  local arch="$1" # amd64 or arm64
  aws ec2 describe-images \
    --region "$AWS_REGION" \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-${arch}-server-*" \
              "Name=state,Values=available" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text 2>/dev/null
}

_aws_get_ami() {
  local instance_type="$1"
  if _aws_is_graviton "$instance_type"; then
    if [[ -z "$_AWS_AMI_ARM64_CACHED" ]]; then
      _AWS_AMI_ARM64_CACHED=$(_aws_lookup_ami arm64) || true
      if [[ -z "$_AWS_AMI_ARM64_CACHED" || "$_AWS_AMI_ARM64_CACHED" == "None" ]]; then
        log_warn "Dynamic AMI lookup failed for arm64, using hardcoded fallback"
        _AWS_AMI_ARM64_CACHED="${AWS_AMI_ARM64:-ami-00cdb36f35bd8af7d}"
      fi
    fi
    echo "$_AWS_AMI_ARM64_CACHED"
  else
    if [[ -z "$_AWS_AMI_AMD64_CACHED" ]]; then
      _AWS_AMI_AMD64_CACHED=$(_aws_lookup_ami amd64) || true
      if [[ -z "$_AWS_AMI_AMD64_CACHED" || "$_AWS_AMI_AMD64_CACHED" == "None" ]]; then
        log_warn "Dynamic AMI lookup failed for amd64, using hardcoded fallback"
        _AWS_AMI_AMD64_CACHED="${AWS_AMI_AMD64:-ami-0136735c2bb5cf5bf}"
      fi
    fi
    echo "$_AWS_AMI_AMD64_CACHED"
  fi
}

aws_setup_networking() {
  if [[ -n "$AWS_SUBNET_ID" ]]; then
    log_info "Using pre-existing AWS networking (subnet=$AWS_SUBNET_ID)"
    return 0
  fi

  log_info "Creating AWS networking resources..."

  # VPC
  AWS_VPC_ID=$(aws ec2 create-vpc \
    --region "$AWS_REGION" \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=tailbench-vpc},{Key=Project,Value=tailbench}]' \
    --query 'Vpc.VpcId' --output text)
  log_info "Created VPC $AWS_VPC_ID"

  aws ec2 modify-vpc-attribute \
    --region "$AWS_REGION" \
    --vpc-id "$AWS_VPC_ID" \
    --enable-dns-hostnames '{"Value":true}'

  # Subnet
  AWS_SUBNET_ID=$(aws ec2 create-subnet \
    --region "$AWS_REGION" \
    --vpc-id "$AWS_VPC_ID" \
    --cidr-block 10.0.1.0/24 \
    --availability-zone "$AWS_AZ" \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=tailbench-subnet},{Key=Project,Value=tailbench}]' \
    --query 'Subnet.SubnetId' --output text)
  log_info "Created subnet $AWS_SUBNET_ID"

  aws ec2 modify-subnet-attribute \
    --region "$AWS_REGION" \
    --subnet-id "$AWS_SUBNET_ID" \
    --map-public-ip-on-launch

  # Internet gateway
  _AWS_IGW_ID=$(aws ec2 create-internet-gateway \
    --region "$AWS_REGION" \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=tailbench-igw},{Key=Project,Value=tailbench}]' \
    --query 'InternetGateway.InternetGatewayId' --output text)
  log_info "Created internet gateway $_AWS_IGW_ID"

  aws ec2 attach-internet-gateway \
    --region "$AWS_REGION" \
    --internet-gateway-id "$_AWS_IGW_ID" \
    --vpc-id "$AWS_VPC_ID"

  # Route table
  _AWS_RTB_ID=$(aws ec2 create-route-table \
    --region "$AWS_REGION" \
    --vpc-id "$AWS_VPC_ID" \
    --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=tailbench-rtb},{Key=Project,Value=tailbench}]' \
    --query 'RouteTable.RouteTableId' --output text)

  aws ec2 create-route \
    --region "$AWS_REGION" \
    --route-table-id "$_AWS_RTB_ID" \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id "$_AWS_IGW_ID" >/dev/null

  _AWS_RTB_ASSOC_ID=$(aws ec2 associate-route-table \
    --region "$AWS_REGION" \
    --route-table-id "$_AWS_RTB_ID" \
    --subnet-id "$AWS_SUBNET_ID" \
    --query 'AssociationId' --output text)

  # Security group
  AWS_SG_ID=$(aws ec2 create-security-group \
    --region "$AWS_REGION" \
    --group-name tailbench-sg \
    --description "tailbench benchmark security group" \
    --vpc-id "$AWS_VPC_ID" \
    --tag-specifications 'ResourceType=security-group,Tags=[{Key=Name,Value=tailbench-sg},{Key=Project,Value=tailbench}]' \
    --query 'GroupId' --output text)
  log_info "Created security group $AWS_SG_ID"

  aws ec2 authorize-security-group-ingress \
    --region "$AWS_REGION" \
    --group-id "$AWS_SG_ID" \
    --protocol tcp --port 22 --cidr 0.0.0.0/0 >/dev/null

  aws ec2 authorize-security-group-ingress \
    --region "$AWS_REGION" \
    --group-id "$AWS_SG_ID" \
    --protocol all --source-group "$AWS_SG_ID" >/dev/null

  # Export for subprocesses (provision-pair.sh re-sources config/aws.sh)
  export AWS_VPC_ID AWS_SUBNET_ID AWS_SG_ID
  _AWS_NETWORKING_AUTO_CREATED=true

  log_info "AWS networking ready (vpc=$AWS_VPC_ID subnet=$AWS_SUBNET_ID sg=$AWS_SG_ID)"
}

aws_teardown_networking() {
  if [[ "$_AWS_NETWORKING_AUTO_CREATED" != "true" ]]; then
    return 0
  fi

  log_info "Tearing down auto-created AWS networking..."

  # Wait for instances in the VPC to terminate
  local instance_ids
  instance_ids=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters "Name=vpc-id,Values=$AWS_VPC_ID" \
              "Name=instance-state-name,Values=pending,running,stopping,shutting-down" \
    --query 'Reservations[].Instances[].InstanceId' \
    --output text 2>/dev/null) || true
  if [[ -n "$instance_ids" && "$instance_ids" != "None" ]]; then
    log_info "Waiting for instances to terminate before VPC cleanup..."
    # shellcheck disable=SC2086
    aws ec2 wait instance-terminated \
      --region "$AWS_REGION" \
      --instance-ids $instance_ids 2>/dev/null || true
  fi

  # Security group
  aws ec2 delete-security-group \
    --region "$AWS_REGION" \
    --group-id "$AWS_SG_ID" 2>/dev/null || true

  # Route table
  if [[ -n "${_AWS_RTB_ASSOC_ID:-}" ]]; then
    aws ec2 disassociate-route-table \
      --region "$AWS_REGION" \
      --association-id "$_AWS_RTB_ASSOC_ID" 2>/dev/null || true
  fi
  if [[ -n "${_AWS_RTB_ID:-}" ]]; then
    aws ec2 delete-route-table \
      --region "$AWS_REGION" \
      --route-table-id "$_AWS_RTB_ID" 2>/dev/null || true
  fi

  # Internet gateway
  if [[ -n "${_AWS_IGW_ID:-}" ]]; then
    aws ec2 detach-internet-gateway \
      --region "$AWS_REGION" \
      --internet-gateway-id "$_AWS_IGW_ID" \
      --vpc-id "$AWS_VPC_ID" 2>/dev/null || true
    aws ec2 delete-internet-gateway \
      --region "$AWS_REGION" \
      --internet-gateway-id "$_AWS_IGW_ID" 2>/dev/null || true
  fi

  # Subnet
  aws ec2 delete-subnet \
    --region "$AWS_REGION" \
    --subnet-id "$AWS_SUBNET_ID" 2>/dev/null || true

  # VPC
  aws ec2 delete-vpc \
    --region "$AWS_REGION" \
    --vpc-id "$AWS_VPC_ID" 2>/dev/null || true

  log_info "AWS networking teardown complete"
}

_aws_resolve_instance_id() {
  local name="$1"
  if [[ -n "${_AWS_INSTANCE_ID_CACHE[$name]:-}" ]]; then
    echo "${_AWS_INSTANCE_ID_CACHE[$name]}"
    return
  fi
  local id
  id=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters "Name=tag:Name,Values=$name" "Name=instance-state-name,Values=running,pending" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text)
  if [[ -z "$id" || "$id" == "None" ]]; then
    return 1
  fi
  _AWS_INSTANCE_ID_CACHE[$name]="$id"
  echo "$id"
}

_aws_resolve_public_ip() {
  local name="$1"
  if [[ -n "${_AWS_PUBLIC_IP_CACHE[$name]:-}" ]]; then
    echo "${_AWS_PUBLIC_IP_CACHE[$name]}"
    return
  fi
  local ip
  ip=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters "Name=tag:Name,Values=$name" "Name=instance-state-name,Values=running" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)
  if [[ -z "$ip" || "$ip" == "None" ]]; then
    return 1
  fi
  _AWS_PUBLIC_IP_CACHE[$name]="$ip"
  echo "$ip"
}

aws_create_instance() {
  local name="$1" instance_type="$2" startup_script="$3"
  local ami
  ami=$(_aws_get_ami "$instance_type")

  log_info "Creating AWS instance $name ($instance_type) in $AWS_AZ"

  local args=(
    aws ec2 run-instances
    --region "$AWS_REGION"
    --image-id "$ami"
    --instance-type "$instance_type"
    --key-name "$AWS_KEY_NAME"
    --placement "AvailabilityZone=$AWS_AZ"
    --user-data "file://$startup_script"
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$name},{Key=Project,Value=tailbench}]"
    --block-device-mappings "DeviceName=/dev/sda1,Ebs={VolumeSize=50,VolumeType=gp3}"
    --associate-public-ip-address
    --count 1
    --output text
    --query 'Instances[0].InstanceId'
  )

  [[ -n "$AWS_SUBNET_ID" ]] && args+=(--subnet-id "$AWS_SUBNET_ID")
  [[ -n "$AWS_SG_ID" ]] && args+=(--security-group-ids "$AWS_SG_ID")

  local instance_id
  instance_id=$("${args[@]}")
  _AWS_INSTANCE_ID_CACHE[$name]="$instance_id"

  log_info "Waiting for $name ($instance_id) to be running..."
  aws ec2 wait instance-running \
    --region "$AWS_REGION" \
    --instance-ids "$instance_id"

  # Cache the public IP
  local ip
  ip=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --instance-ids "$instance_id" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)
  [[ -n "$ip" && "$ip" != "None" ]] && _AWS_PUBLIC_IP_CACHE[$name]="$ip"

  log_info "AWS instance $name is running"
}

aws_delete_instance() {
  local name="$1"
  local instance_id
  instance_id=$(_aws_resolve_instance_id "$name" 2>/dev/null) || {
    log_warn "Instance $name not found, skipping delete"
    return 0
  }
  log_info "Terminating AWS instance $name ($instance_id)"
  aws ec2 terminate-instances \
    --region "$AWS_REGION" \
    --instance-ids "$instance_id" \
    --output text >/dev/null 2>&1 || true
}

aws_get_internal_ip() {
  local name="$1"
  aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters "Name=tag:Name,Values=$name" "Name=instance-state-name,Values=running" \
    --query 'Reservations[0].Instances[0].PrivateIpAddress' \
    --output text
}

aws_ssh() {
  local name="$1"
  shift
  local ip
  ip=$(_aws_resolve_public_ip "$name")
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o LogLevel=ERROR \
    -i "$AWS_SSH_KEY_PATH" \
    "${AWS_SSH_USER}@${ip}" "$@"
}

aws_scp() {
  local name="$1" src="$2" dest="$3"
  local ip
  ip=$(_aws_resolve_public_ip "$name")
  scp -o StrictHostKeyChecking=no -o LogLevel=ERROR \
    -i "$AWS_SSH_KEY_PATH" \
    "$src" "${AWS_SSH_USER}@${ip}:${dest}"
}

aws_instance_exists() {
  local name="$1"
  _aws_resolve_instance_id "$name" >/dev/null 2>&1
}

aws_check_auth() {
  if ! aws sts get-caller-identity &>/dev/null; then
    log_error "AWS not authenticated. Configure credentials with: aws configure"
    return 1
  fi
}

aws_required_cmds() {
  echo "aws ssh scp"
}
