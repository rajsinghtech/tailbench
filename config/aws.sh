#!/usr/bin/env bash
# AWS configuration

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_AZ="${AWS_AZ:-us-east-1a}"

# Networking — auto-created if empty (see lib/aws.sh aws_setup_networking)
AWS_VPC_ID="${AWS_VPC_ID:-}"
AWS_SUBNET_ID="${AWS_SUBNET_ID:-}"
AWS_SG_ID="${AWS_SG_ID:-}"

# SSH key pair
AWS_KEY_NAME="${AWS_KEY_NAME:-raj_macbook}"
AWS_SSH_KEY_PATH="${AWS_SSH_KEY_PATH:-$HOME/.ssh/raj_macbook.pem}"
AWS_SSH_USER="${AWS_SSH_USER:-ubuntu}"

# Ubuntu 24.04 LTS AMIs (us-east-1)
AWS_AMI_AMD64="${AWS_AMI_AMD64:-ami-0136735c2bb5cf5bf}"
AWS_AMI_ARM64="${AWS_AMI_ARM64:-ami-00cdb36f35bd8af7d}"
