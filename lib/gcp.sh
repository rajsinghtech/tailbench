#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

gcp_create_instance() {
  local name="$1" machine_type="$2" startup_script="$3"

  log_info "Creating instance $name ($machine_type) in $GCP_ZONE"
  gcloud compute instances create "$name" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --machine-type="$machine_type" \
    --image-family="$GCP_IMAGE_FAMILY" \
    --image-project="$GCP_IMAGE_PROJECT" \
    --network="$GCP_NETWORK" \
    --subnet="$GCP_SUBNET" \
    --scopes=cloud-platform \
    --boot-disk-size=50GB \
    --boot-disk-type=pd-ssd \
    --metadata-from-file=startup-script="$startup_script" \
    --quiet
}

gcp_delete_instance() {
  local name="$1"
  log_info "Deleting instance $name"
  gcloud compute instances delete "$name" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --quiet 2>/dev/null || true
}

gcp_get_internal_ip() {
  local name="$1"
  gcloud compute instances describe "$name" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --format='get(networkInterfaces[0].networkIP)'
}

gcp_ssh() {
  local name="$1"
  shift
  gcloud compute ssh "$name" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --ssh-flag="-o StrictHostKeyChecking=no" \
    --ssh-flag="-o ConnectTimeout=10" \
    --ssh-flag="-o LogLevel=ERROR" \
    --quiet \
    --command="$*"
}

gcp_scp() {
  local name="$1" src="$2" dest="$3"
  gcloud compute scp \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --quiet \
    "$src" "$name:$dest"
}

gcp_instance_exists() {
  local name="$1"
  gcloud compute instances describe "$name" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    &>/dev/null
}

gcp_check_auth() {
  if ! gcloud auth print-access-token &>/dev/null; then
    log_error "gcloud not authenticated. Run: gcloud auth login"
    return 1
  fi
}

gcp_required_cmds() {
  echo "gcloud"
}

gcp_setup_networking() {
  # GCP uses the pre-existing default network; nothing to create.
  :
}

gcp_teardown_networking() {
  :
}

gcp_get_instance_family() {
  local instance_type="$1"
  echo "${instance_type%%-*}"
}

gcp_get_instance_vcpus() {
  local instance_type="$1"
  echo "${instance_type##*-}"
}
