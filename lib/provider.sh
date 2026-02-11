#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CLOUD_PROVIDER="${CLOUD_PROVIDER:-gcp}"

case "$CLOUD_PROVIDER" in
  gcp)
    source "$TAILBENCH_ROOT/config/gcp.sh"
    source "$TAILBENCH_ROOT/lib/gcp.sh"
    CLOUD_REGION="${GCP_REGION}"
    CLOUD_ZONE="${GCP_ZONE}"
    _cloud_prefix="gcp"
    ;;
  aws)
    source "$TAILBENCH_ROOT/config/aws.sh"
    source "$TAILBENCH_ROOT/lib/aws.sh"
    CLOUD_REGION="${AWS_REGION}"
    CLOUD_ZONE="${AWS_AZ}"
    _cloud_prefix="aws"
    ;;
  azure)
    source "$TAILBENCH_ROOT/config/azure.sh"
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

get_instance_family()    { "${_cloud_prefix}_get_instance_family" "$@"; }
get_instance_vcpus()     { "${_cloud_prefix}_get_instance_vcpus" "$@"; }
cloud_is_quota_error()   { "${_cloud_prefix}_is_quota_error" "$@"; }

get_instance_list() {
  local family="$1"
  if [[ "$family" == "all" ]]; then
    local families
    families=$(get_provider_families)
    for f in $families; do
      "${_cloud_prefix}_list_instances" "$f" 2>/dev/null || true
    done
  else
    "${_cloud_prefix}_list_instances" "$family"
  fi
}

get_provider_families() {
  "${_cloud_prefix}_list_families"
}
