#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# IP cache — avoids repeated describe-instances calls
declare -gA _AWS_PUBLIC_IP_CACHE=() 2>/dev/null || true
declare -gA _AWS_INSTANCE_ID_CACHE=() 2>/dev/null || true

_aws_is_graviton() {
  local instance_type="$1"
  local family="${instance_type%%.*}"
  [[ "$family" == *g* ]]
}

_aws_get_ami() {
  local instance_type="$1"
  if _aws_is_graviton "$instance_type"; then
    echo "$AWS_AMI_ARM64"
  else
    echo "$AWS_AMI_AMD64"
  fi
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
