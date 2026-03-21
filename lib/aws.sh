#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# IP cache — avoids repeated describe-instances calls
declare -gA _AWS_PUBLIC_IP_CACHE=() 2>/dev/null || true
declare -gA _AWS_INSTANCE_ID_CACHE=() 2>/dev/null || true
declare -gA _AWS_VCPU_CACHE=() 2>/dev/null || true

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

  # Check for existing tailbench VPC
  local existing_vpc
  existing_vpc=$(aws ec2 describe-vpcs \
    --region "$AWS_REGION" \
    --filters "Name=tag:Project,Values=tailbench" \
    --query 'Vpcs[0].VpcId' --output text 2>/dev/null) || true

  if [[ -n "$existing_vpc" && "$existing_vpc" != "None" ]]; then
    log_info "Discovered existing tailbench VPC $existing_vpc"
    AWS_VPC_ID="$existing_vpc"

    AWS_SUBNET_ID=$(aws ec2 describe-subnets \
      --region "$AWS_REGION" \
      --filters "Name=vpc-id,Values=$AWS_VPC_ID" "Name=tag:Name,Values=tailbench-subnet" \
      --query 'Subnets[0].SubnetId' --output text)

    AWS_SG_ID=$(aws ec2 describe-security-groups \
      --region "$AWS_REGION" \
      --filters "Name=vpc-id,Values=$AWS_VPC_ID" "Name=tag:Name,Values=tailbench-sg" \
      --query 'SecurityGroups[0].GroupId' --output text)

    _AWS_IGW_ID=$(aws ec2 describe-internet-gateways \
      --region "$AWS_REGION" \
      --filters "Name=attachment.vpc-id,Values=$AWS_VPC_ID" "Name=tag:Project,Values=tailbench" \
      --query 'InternetGateways[0].InternetGatewayId' --output text)

    # Find tagged route table, fall back to any VPC route table
    _AWS_RTB_ID=$(aws ec2 describe-route-tables \
      --region "$AWS_REGION" \
      --filters "Name=vpc-id,Values=$AWS_VPC_ID" "Name=tag:Project,Values=tailbench" \
      --query 'RouteTables[0].RouteTableId' --output text 2>/dev/null) || true
    if [[ -z "$_AWS_RTB_ID" || "$_AWS_RTB_ID" == "None" ]]; then
      _AWS_RTB_ID=$(aws ec2 describe-route-tables \
        --region "$AWS_REGION" \
        --filters "Name=vpc-id,Values=$AWS_VPC_ID" \
        --query 'RouteTables[0].RouteTableId' --output text)
    fi

    _AWS_RTB_ASSOC_ID=$(aws ec2 describe-route-tables \
      --region "$AWS_REGION" \
      --filters "Name=route-table-id,Values=$_AWS_RTB_ID" \
      --query 'RouteTables[0].Associations[0].RouteTableAssociationId' --output text 2>/dev/null) || true

    # Ensure the IGW default route exists (may be missing after partial teardown)
    local has_igw_route
    has_igw_route=$(aws ec2 describe-route-tables \
      --region "$AWS_REGION" \
      --filters "Name=route-table-id,Values=$_AWS_RTB_ID" \
      --query 'RouteTables[0].Routes[?DestinationCidrBlock==`0.0.0.0/0`].GatewayId' \
      --output text 2>/dev/null) || true
    if [[ -z "$has_igw_route" || "$has_igw_route" == "None" ]]; then
      log_warn "Missing IGW route in route table $_AWS_RTB_ID, adding..."
      aws ec2 create-route \
        --region "$AWS_REGION" \
        --route-table-id "$_AWS_RTB_ID" \
        --destination-cidr-block 0.0.0.0/0 \
        --gateway-id "$_AWS_IGW_ID" >/dev/null 2>&1 || true
    fi

    AWS_PLACEMENT_GROUP=$(aws ec2 describe-placement-groups \
      --region "$AWS_REGION" \
      --filters "Name=tag:Project,Values=tailbench" \
      --query 'PlacementGroups[0].GroupName' --output text 2>/dev/null) || true
    [[ "$AWS_PLACEMENT_GROUP" == "None" ]] && AWS_PLACEMENT_GROUP=""

    export AWS_VPC_ID AWS_SUBNET_ID AWS_SG_ID AWS_PLACEMENT_GROUP
    _AWS_NETWORKING_AUTO_CREATED=false

    log_info "AWS networking reused (vpc=$AWS_VPC_ID subnet=$AWS_SUBNET_ID sg=$AWS_SG_ID pg=${AWS_PLACEMENT_GROUP:-none})"
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

  # Tailscale WireGuard UDP — needed for direct connections between instances
  aws ec2 authorize-security-group-ingress \
    --region "$AWS_REGION" \
    --group-id "$AWS_SG_ID" \
    --protocol udp --port 41641 --cidr 0.0.0.0/0 >/dev/null

  aws ec2 authorize-security-group-ingress \
    --region "$AWS_REGION" \
    --group-id "$AWS_SG_ID" \
    --protocol all --source-group "$AWS_SG_ID" >/dev/null

  # Cluster placement group — removes the 5 Gbps single-flow cap between instances
  AWS_PLACEMENT_GROUP="tailbench-pg-$(date +%s)"
  aws ec2 create-placement-group \
    --region "$AWS_REGION" \
    --group-name "$AWS_PLACEMENT_GROUP" \
    --strategy cluster \
    --tag-specifications 'ResourceType=placement-group,Tags=[{Key=Name,Value=tailbench-pg},{Key=Project,Value=tailbench}]' \
    --output text >/dev/null
  log_info "Created placement group $AWS_PLACEMENT_GROUP"

  # Export for subprocesses (provision-pair.sh re-sources config/aws.sh)
  export AWS_VPC_ID AWS_SUBNET_ID AWS_SG_ID AWS_PLACEMENT_GROUP
  _AWS_NETWORKING_AUTO_CREATED=true

  log_info "AWS networking ready (vpc=$AWS_VPC_ID subnet=$AWS_SUBNET_ID sg=$AWS_SG_ID pg=$AWS_PLACEMENT_GROUP)"
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

  local output

  # Security group
  if ! output=$(aws ec2 delete-security-group \
    --region "$AWS_REGION" \
    --group-id "$AWS_SG_ID" 2>&1); then
    log_warn "Failed to delete security group $AWS_SG_ID: $output"
  fi

  # Route table
  if [[ -n "${_AWS_RTB_ASSOC_ID:-}" ]]; then
    if ! output=$(aws ec2 disassociate-route-table \
      --region "$AWS_REGION" \
      --association-id "$_AWS_RTB_ASSOC_ID" 2>&1); then
      log_warn "Failed to disassociate route table $_AWS_RTB_ASSOC_ID: $output"
    fi
  fi
  if [[ -n "${_AWS_RTB_ID:-}" ]]; then
    if ! output=$(aws ec2 delete-route-table \
      --region "$AWS_REGION" \
      --route-table-id "$_AWS_RTB_ID" 2>&1); then
      log_warn "Failed to delete route table $_AWS_RTB_ID: $output"
    fi
  fi

  # Internet gateway
  if [[ -n "${_AWS_IGW_ID:-}" ]]; then
    if ! output=$(aws ec2 detach-internet-gateway \
      --region "$AWS_REGION" \
      --internet-gateway-id "$_AWS_IGW_ID" \
      --vpc-id "$AWS_VPC_ID" 2>&1); then
      log_warn "Failed to detach internet gateway $_AWS_IGW_ID: $output"
    fi
    if ! output=$(aws ec2 delete-internet-gateway \
      --region "$AWS_REGION" \
      --internet-gateway-id "$_AWS_IGW_ID" 2>&1); then
      log_warn "Failed to delete internet gateway $_AWS_IGW_ID: $output"
    fi
  fi

  # Subnet
  if ! output=$(aws ec2 delete-subnet \
    --region "$AWS_REGION" \
    --subnet-id "$AWS_SUBNET_ID" 2>&1); then
    log_warn "Failed to delete subnet $AWS_SUBNET_ID: $output"
  fi

  # VPC
  if ! output=$(aws ec2 delete-vpc \
    --region "$AWS_REGION" \
    --vpc-id "$AWS_VPC_ID" 2>&1); then
    log_warn "Failed to delete VPC $AWS_VPC_ID: $output"
  fi

  # Placement group
  if [[ -n "${AWS_PLACEMENT_GROUP:-}" ]]; then
    if ! output=$(aws ec2 delete-placement-group \
      --region "$AWS_REGION" \
      --group-name "$AWS_PLACEMENT_GROUP" 2>&1); then
      log_warn "Failed to delete placement group $AWS_PLACEMENT_GROUP: $output"
    fi
  fi

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
    --placement "AvailabilityZone=$AWS_AZ${AWS_PLACEMENT_GROUP:+,GroupName=$AWS_PLACEMENT_GROUP}"
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
  local output
  if ! output=$(aws ec2 terminate-instances \
    --region "$AWS_REGION" \
    --instance-ids "$instance_id" \
    --output text 2>&1); then
    log_warn "Failed to terminate instance $name ($instance_id): $output"
  fi
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
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o ServerAliveInterval=15 \
    -o ServerAliveCountMax=4 -o LogLevel=ERROR \
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

aws_get_instance_family() {
  local instance_type="$1"
  echo "${instance_type%%.*}"
}

aws_get_instance_vcpus() {
  local instance_type="$1"
  if [[ -n "${_AWS_VCPU_CACHE[$instance_type]:-}" ]]; then
    echo "${_AWS_VCPU_CACHE[$instance_type]}"
    return
  fi
  local vcpus
  vcpus=$(aws ec2 describe-instance-types \
    --region "$AWS_REGION" \
    --instance-types "$instance_type" \
    --query "InstanceTypes[0].VCpuInfo.DefaultVCpus" \
    --output text)
  _AWS_VCPU_CACHE[$instance_type]="$vcpus"
  echo "$vcpus"
}

aws_is_quota_error() {
  local stderr="$1"
  [[ "$stderr" == *VcpuLimitExceeded* ]] || \
  [[ "$stderr" == *InstanceLimitExceeded* ]]
}

aws_list_families() {
  echo "c8gn c6in c7i c7gn c8g c6i m6i c7g m7g"
}

aws_list_instances() {
  local family="$1"
  local json
  json=$(aws ec2 describe-instance-types \
    --region "$AWS_REGION" \
    --filters "Name=instance-type,Values=${family}.*" \
    --query "sort_by(InstanceTypes,&VCpuInfo.DefaultVCpus)[].[InstanceType,VCpuInfo.DefaultVCpus]" \
    --output json)
  while IFS=$'\t' read -r name vcpus; do
    [[ -z "$name" ]] && continue
    _AWS_VCPU_CACHE[$name]="$vcpus"
    echo "$name"
  done < <(echo "$json" | jq -r '.[] | "\(.[0])\t\(.[1])"')
}

aws_ena_express_families() {
  echo "c6in c7gn c8gn c7i c8g"
}

# Minimum vCPU count for ENA Express support per family
# From: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ena-express.html
_aws_ena_express_min_vcpus() {
  local family="$1"
  case "$family" in
    c7gn)  echo 16 ;;  # c7gn.4xlarge
    c6in)  echo 32 ;;  # c6in.8xlarge
    c8gn)  echo 32 ;;  # c8gn.8xlarge
    c7i)   echo 48 ;;  # c7i.12xlarge
    c8g)   echo 48 ;;  # c8g.12xlarge
    *)     echo 9999 ;; # unknown — don't attempt
  esac
}

aws_supports_ena_express() {
  local instance_type="$1"
  local family="${instance_type%%.*}"
  local ena_fams=" $(aws_ena_express_families) "
  [[ "$ena_fams" != *" $family "* ]] && return 1
  local vcpus
  vcpus=$(aws_get_instance_vcpus "$instance_type")
  local min_vcpus
  min_vcpus=$(_aws_ena_express_min_vcpus "$family")
  (( vcpus >= min_vcpus ))
}

aws_enable_ena_express() {
  local name="$1"
  local instance_id
  instance_id=$(_aws_resolve_instance_id "$name") || {
    log_error "Cannot resolve instance $name for ENA Express"
    return 1
  }

  local eni_id
  eni_id=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --instance-ids "$instance_id" \
    --query 'Reservations[0].Instances[0].NetworkInterfaces[0].NetworkInterfaceId' \
    --output text)

  if [[ -z "$eni_id" || "$eni_id" == "None" ]]; then
    log_error "No ENI found for instance $name ($instance_id)"
    return 1
  fi

  log_info "Enabling ENA Express (SRD) on $name ENI $eni_id"
  aws ec2 modify-network-interface-attribute \
    --region "$AWS_REGION" \
    --network-interface-id "$eni_id" \
    --ena-srd-specification 'EnaSrdEnabled=true,EnaSrdUdpSpecification={EnaSrdUdpEnabled=true}'
}
