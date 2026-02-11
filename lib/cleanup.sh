#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TAILBENCH_CLEANUP_FILE="${TAILBENCH_CLEANUP_FILE:-/tmp/tailbench-cleanup-$$}"

cleanup_handler() {
  if [[ ! -f "$TAILBENCH_CLEANUP_FILE" ]]; then
    return 0
  fi
  log_info "Running cleanup..."
  while IFS= read -r instance; do
    [[ -z "$instance" ]] && continue
    cloud_delete_instance "$instance" || true
  done < "$TAILBENCH_CLEANUP_FILE"
  rm -f "$TAILBENCH_CLEANUP_FILE"
  log_info "Cleanup complete"
}

setup_cleanup_trap() {
  trap cleanup_handler EXIT INT TERM
}
