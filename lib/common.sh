#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/config/defaults.sh"

log_info()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]  $*" >&2; }
log_warn()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN]  $*" >&2; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $*" >&2; }

retry() {
  local max="$1" delay="$2"
  shift 2
  local attempt=1
  while (( attempt <= max )); do
    if "$@"; then
      return 0
    fi
    log_warn "Attempt $attempt/$max failed: $*"
    attempt=$(( attempt + 1 ))
    sleep "$delay"
  done
  log_error "All $max attempts failed: $*"
  return 1
}

wait_for_ssh() {
  local instance="$1" zone="$2"
  local attempt=0
  log_info "Waiting for SSH on $instance..."
  while (( attempt < SSH_RETRIES )); do
    if gcloud compute ssh "$instance" --zone="$zone" --project="$GCP_PROJECT" \
         --command="true" --ssh-flag="-o StrictHostKeyChecking=no" \
         --ssh-flag="-o ConnectTimeout=5" --quiet 2>/dev/null; then
      log_info "SSH ready on $instance"
      return 0
    fi
    attempt=$(( attempt + 1 ))
    sleep 5
  done
  log_error "SSH timeout on $instance after $SSH_RETRIES attempts"
  return 1
}

wait_for_port() {
  local host="$1" port="$2" timeout="${3:-$SSH_TIMEOUT}"
  local deadline=$(( $(date +%s) + timeout ))
  log_info "Waiting for $host:$port..."
  while (( $(date +%s) < deadline )); do
    if nc -z -w2 "$host" "$port" 2>/dev/null; then
      log_info "Port $port open on $host"
      return 0
    fi
    sleep 1
  done
  log_error "Timeout waiting for $host:$port"
  return 1
}

wait_for_ready() {
  local instance="$1" zone="$2"
  local deadline=$(( $(date +%s) + READY_TIMEOUT ))
  log_info "Waiting for $instance to be ready..."
  while (( $(date +%s) < deadline )); do
    if gcloud compute ssh "$instance" --zone="$zone" --project="$GCP_PROJECT" \
         --ssh-flag="-o StrictHostKeyChecking=no" --quiet \
         --command="test -f /tmp/tailbench-ready" 2>/dev/null; then
      log_info "$instance is ready"
      return 0
    fi
    sleep 5
  done
  log_error "Timeout waiting for $instance readiness"
  return 1
}

require_cmd() {
  for cmd in "$@"; do
    if ! command -v "$cmd" &>/dev/null; then
      log_error "Required command not found: $cmd"
      exit 1
    fi
  done
}

cleanup_register() {
  local instance="$1"
  echo "$instance" >> "${TAILBENCH_CLEANUP_FILE:-/tmp/tailbench-cleanup-$$}"
}

compute_stddev() {
  awk '{sum+=$1; sumsq+=$1*$1; n++} END {
    if (n<2) {print 0; exit}
    mean=sum/n
    variance=(sumsq - n*mean*mean)/(n-1)
    if (variance<0) variance=0
    printf "%.4f\n", sqrt(variance)
  }'
}
