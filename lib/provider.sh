#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CLOUD_PROVIDER="${CLOUD_PROVIDER:-gcp}"

case "$CLOUD_PROVIDER" in
  gcp)
    source "$TAILBENCH_ROOT/config/gcp.sh"
    source "$TAILBENCH_ROOT/config/gcp-instances.sh"
    source "$TAILBENCH_ROOT/lib/gcp.sh"
    CLOUD_REGION="${GCP_REGION}"
    CLOUD_ZONE="${GCP_ZONE}"
    _cloud_prefix="gcp"
    ;;
  aws)
    source "$TAILBENCH_ROOT/config/aws.sh"
    source "$TAILBENCH_ROOT/config/aws-instances.sh"
    source "$TAILBENCH_ROOT/lib/aws.sh"
    CLOUD_REGION="${AWS_REGION}"
    CLOUD_ZONE="${AWS_AZ}"
    _cloud_prefix="aws"
    ;;
  azure)
    source "$TAILBENCH_ROOT/config/azure.sh"
    source "$TAILBENCH_ROOT/config/azure-instances.sh"
    source "$TAILBENCH_ROOT/lib/azure.sh"
    CLOUD_REGION="${AZURE_LOCATION}"
    CLOUD_ZONE="${AZURE_LOCATION}"
    _cloud_prefix="azure"
    ;;
  *)
    echo "Unknown CLOUD_PROVIDER: $CLOUD_PROVIDER (expected gcp, aws, or azure)" >&2
    exit 1
    ;;
esac

export CLOUD_PROVIDER CLOUD_REGION CLOUD_ZONE

cloud_create_instance() { "${_cloud_prefix}_create_instance" "$@"; }
cloud_delete_instance()  { "${_cloud_prefix}_delete_instance" "$@"; }
cloud_get_internal_ip()  { "${_cloud_prefix}_get_internal_ip" "$@"; }
cloud_ssh()              { "${_cloud_prefix}_ssh" "$@"; }
cloud_scp()              { "${_cloud_prefix}_scp" "$@"; }
cloud_instance_exists()  { "${_cloud_prefix}_instance_exists" "$@"; }
cloud_check_auth()           { "${_cloud_prefix}_check_auth"; }
cloud_required_cmds()        { "${_cloud_prefix}_required_cmds"; }
cloud_setup_networking()     { "${_cloud_prefix}_setup_networking"; }
cloud_teardown_networking()  { "${_cloud_prefix}_teardown_networking"; }

get_instance_family() { "${_cloud_prefix}_get_instance_family" "$@"; }
get_instance_vcpus()  { "${_cloud_prefix}_get_instance_vcpus" "$@"; }

get_instance_list() {
  local family="$1"
  case "$CLOUD_PROVIDER" in
    gcp)
      case "$family" in
        c3)  echo "${GCP_C3_INSTANCES[*]}" ;;
        n2)  echo "${GCP_N2_INSTANCES[*]}" ;;
        all) echo "${GCP_ALL_INSTANCES[*]}" ;;
        *)   return 1 ;;
      esac
      ;;
    aws)
      case "$family" in
        c6i) echo "${AWS_C6I_INSTANCES[*]}" ;;
        m6i) echo "${AWS_M6I_INSTANCES[*]}" ;;
        c7g) echo "${AWS_C7G_INSTANCES[*]}" ;;
        m7g) echo "${AWS_M7G_INSTANCES[*]}" ;;
        all) echo "${AWS_ALL_INSTANCES[*]}" ;;
        *)   return 1 ;;
      esac
      ;;
    azure)
      case "$family" in
        dv5)  echo "${AZURE_DV5_INSTANCES[*]}" ;;
        fv2)  echo "${AZURE_FV2_INSTANCES[*]}" ;;
        ev5)  echo "${AZURE_EV5_INSTANCES[*]}" ;;
        all)  echo "${AZURE_ALL_INSTANCES[*]}" ;;
        *)    return 1 ;;
      esac
      ;;
  esac
}

get_provider_families() {
  case "$CLOUD_PROVIDER" in
    gcp)   echo "c3 n2" ;;
    aws)   echo "c6i m6i c7g m7g" ;;
    azure) echo "dv5 fv2 ev5" ;;
  esac
}
