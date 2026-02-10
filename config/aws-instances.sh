#!/usr/bin/env bash
# AWS instance types to benchmark

# Intel x86 — Compute optimized
AWS_C6I_INSTANCES=(
  c6i.xlarge
  c6i.2xlarge
  c6i.4xlarge
  c6i.8xlarge
  c6i.12xlarge
)

# Intel x86 — General purpose
AWS_M6I_INSTANCES=(
  m6i.xlarge
  m6i.2xlarge
  m6i.4xlarge
  m6i.8xlarge
  m6i.12xlarge
)

# Graviton ARM — Compute optimized
AWS_C7G_INSTANCES=(
  c7g.xlarge
  c7g.2xlarge
  c7g.4xlarge
  c7g.8xlarge
  c7g.12xlarge
)

# Graviton ARM — General purpose
AWS_M7G_INSTANCES=(
  m7g.xlarge
  m7g.2xlarge
  m7g.4xlarge
  m7g.8xlarge
  m7g.12xlarge
)

AWS_ALL_INSTANCES=(
  "${AWS_C6I_INSTANCES[@]}"
  "${AWS_M6I_INSTANCES[@]}"
  "${AWS_C7G_INSTANCES[@]}"
  "${AWS_M7G_INSTANCES[@]}"
)

aws_get_instance_family() {
  local instance_type="$1"
  echo "${instance_type%%.*}"
}

aws_get_instance_vcpus() {
  local instance_type="$1"
  local size="${instance_type##*.}"
  case "$size" in
    xlarge)   echo 4 ;;
    2xlarge)  echo 8 ;;
    4xlarge)  echo 16 ;;
    8xlarge)  echo 32 ;;
    12xlarge) echo 48 ;;
    16xlarge) echo 64 ;;
    24xlarge) echo 96 ;;
    *)        echo 0 ;;
  esac
}
