#!/usr/bin/env bash
# AWS configuration

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_AZ="${AWS_AZ:-us-east-1a}"

# Networking — set these or let the provider use defaults
AWS_VPC_ID="${AWS_VPC_ID:-}"
AWS_SUBNET_ID="${AWS_SUBNET_ID:-}"
AWS_SG_ID="${AWS_SG_ID:-}"

# SSH key pair
AWS_KEY_NAME="${AWS_KEY_NAME:-tailbench}"
AWS_SSH_KEY_PATH="${AWS_SSH_KEY_PATH:-$HOME/.ssh/tailbench.pem}"
AWS_SSH_USER="${AWS_SSH_USER:-ubuntu}"

# Ubuntu 24.04 LTS AMIs (us-east-1)
AWS_AMI_AMD64="${AWS_AMI_AMD64:-ami-0f9de6e2d2f067fca}"
AWS_AMI_ARM64="${AWS_AMI_ARM64:-ami-0c518311db5a6ec3a}"
