#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/lib/tailscale.sh"
source "$TAILBENCH_ROOT/lib/tailnet.sh"

FILTER=""
DRY_RUN=false
FAMILY="all"
CREATE_TAILNET=false
TAILNET_PREFIX="${TAILNET_PREFIX:-tailbench}"
export CLOUD_PROVIDER="${CLOUD_PROVIDER:-gcp}"

# Org-level token for tailnet creation (separate from per-tailnet token)
ORG_ACCESS_TOKEN=""

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") [OPTIONS]

Run Tailscale performance benchmarks across cloud instance types.

Options:
  --provider <gcp|aws|azure>  Cloud provider (default: gcp)
  --filter <regex>             Only test instance types matching regex
  --family <name|all>          Select instance family (default: all)
  --create-tailnet             Create an ephemeral API-only tailnet for the run
  --dry-run                    Preview what would run without executing
  -h, --help                   Show this help

Provider families:
  gcp:   c3, n2
  aws:   c6i, m6i, c7g, m7g
  azure: dv5, fv2, ev5

Required environment variables:
  TS_OAUTH_CLIENT_ID     Tailscale OAuth client ID
  TS_OAUTH_CLIENT_SECRET Tailscale OAuth client secret
  TS_TAG                 Tailscale ACL tag (default: tag:bench)

When --create-tailnet is used:
  - An API-only tailnet is created for the benchmark run
  - OAuth credentials from the new tailnet are used for auth keys
  - The tailnet is deleted on exit (including on failure/Ctrl-C)
  - Requires org-level OAuth credentials with 'tailnets' scope
EOF
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --provider)        export CLOUD_PROVIDER="$2"; shift 2 ;;
    --filter)          FILTER="$2"; shift 2 ;;
    --family)          FAMILY="$2"; shift 2 ;;
    --create-tailnet)  CREATE_TAILNET=true; shift ;;
    --dry-run)         DRY_RUN=true; shift ;;
    -h|--help)         usage ;;
    *)                 log_error "Unknown option: $1"; usage ;;
  esac
done

# Source provider after parsing --provider flag
source "$TAILBENCH_ROOT/lib/provider.sh"
source "$TAILBENCH_ROOT/lib/cleanup.sh"

# Validate prereqs
require_cmd jq curl $(cloud_required_cmds)

# Build instance list
instance_list=$(get_instance_list "$FAMILY") || {
  valid_families=$(get_provider_families)
  log_error "Unknown family '$FAMILY' for $CLOUD_PROVIDER (valid: $valid_families, or all)"
  exit 1
}
read -ra instances <<< "$instance_list"

if [[ -n "$FILTER" ]]; then
  filtered=()
  for inst in "${instances[@]}"; do
    if [[ "$inst" =~ $FILTER ]]; then
      filtered+=("$inst")
    fi
  done
  instances=("${filtered[@]}")
fi

total=${#instances[@]}
if (( total == 0 )); then
  log_error "No instances matched filter"
  exit 1
fi

log_info "Provider: $CLOUD_PROVIDER | Region: $CLOUD_REGION | Zone: $CLOUD_ZONE"
log_info "Will test $total instance type(s): ${instances[*]}"

# Dry-run: just show the plan
if $DRY_RUN; then
  if $CREATE_TAILNET; then
    echo "[tailnet] CREATE ephemeral tailnet: ${TAILNET_PREFIX}-<timestamp>"
    echo "[tailnet] GET access token for new tailnet"
    echo "[tailnet] UPDATE ACL policy"
    echo ""
  fi
  for i in "${!instances[@]}"; do
    n=$(( i + 1 ))
    inst="${instances[$i]}"
    family=$(get_instance_family "$inst")
    vcpus=$(get_instance_vcpus "$inst")
    echo "[$n/$total] $inst (family=$family, vcpus=$vcpus)"
    echo "  provision-pair.sh $inst"
    echo "  run-benchmark.sh $inst <server> <client> <s_lan> <c_lan> <s_ts> <c_ts>"
    echo "  teardown-pair.sh <server> <client>"
    echo "  -> $CLOUD_PROVIDER/$family/results/$inst.json"
  done
  echo ""
  echo "generate-results.sh"
  if $CREATE_TAILNET; then
    echo ""
    echo "[tailnet] DELETE ephemeral tailnet"
  fi
  exit 0
fi

# Validate credentials (not needed for dry-run)
cloud_check_auth

if [[ -z "${TS_OAUTH_CLIENT_ID:-}" || -z "${TS_OAUTH_CLIENT_SECRET:-}" ]]; then
  log_error "TS_OAUTH_CLIENT_ID and TS_OAUTH_CLIENT_SECRET must be set"
  exit 1
fi

# Setup cleanup trap
setup_cleanup_trap

# Setup provider networking (auto-creates VPC/VNet if needed)
cloud_setup_networking
_original_exit_trap=$(trap -p EXIT | sed "s/^trap -- '//;s/' EXIT$//")
trap "$_original_exit_trap; cloud_teardown_networking" EXIT

# Tailnet lifecycle
if $CREATE_TAILNET; then
  # Get org-level access token
  log_info "Obtaining org-level access token..."
  ORG_ACCESS_TOKEN=$(tailnet_get_access_token "$TS_OAUTH_CLIENT_ID" "$TS_OAUTH_CLIENT_SECRET")

  # Create ephemeral tailnet
  tailnet_name="${TAILNET_PREFIX}-$(date +%s)"
  tailnet_create "$ORG_ACCESS_TOKEN" "$tailnet_name"

  # Register tailnet deletion on exit
  tailnet_dns="$TAILNET_DNS_NAME"
  org_token="$ORG_ACCESS_TOKEN"
  trap_tailnet_cleanup() {
    log_info "Cleaning up ephemeral tailnet: $tailnet_dns"
    # API-only tailnets may auto-delete when all devices disconnect, so 404 is expected
    tailnet_delete "$org_token" "$tailnet_dns" || log_warn "Tailnet already deleted (auto-cleanup) or requires manual removal"
  }
  # Chain with existing cleanup trap
  original_cleanup=$(trap -p EXIT | sed "s/^trap -- '//;s/' EXIT$//")
  trap "$original_cleanup; trap_tailnet_cleanup" EXIT

  # Get access token for the new tailnet
  log_info "Obtaining tailnet access token..."
  TAILNET_ACCESS_TOKEN=$(tailnet_get_access_token "$TAILNET_OAUTH_CLIENT_ID" "$TAILNET_OAUTH_CLIENT_SECRET")

  # Apply minimal ACL policy to allow tagged devices to communicate
  acl_policy=$(jq -n --arg tag "$TS_TAG" '{
    acls: [{action: "accept", src: [$tag], dst: [($tag + ":*")]}],
    tagOwners: {($tag): [$tag]}
  }')
  tailnet_update_acl "$TAILNET_ACCESS_TOKEN" "$TAILNET_DNS_NAME" "$acl_policy"

  # Override the tailscale.sh credentials with the new tailnet's credentials
  export TS_OAUTH_CLIENT_ID="$TAILNET_OAUTH_CLIENT_ID"
  export TS_OAUTH_CLIENT_SECRET="$TAILNET_OAUTH_CLIENT_SECRET"
  log_info "Switched to ephemeral tailnet credentials"
fi

# Get per-tailnet OAuth token and auth key
ts_get_oauth_token
ts_create_authkey
export TS_ACCESS_TOKEN TS_AUTHKEY TS_AUTHKEY_CREATED TS_TAG
export CLOUD_PROVIDER CLOUD_REGION CLOUD_ZONE

# Track results for summary table
declare -a result_lines=()
successes=0
failures=0

for i in "${!instances[@]}"; do
  n=$(( i + 1 ))
  inst="${instances[$i]}"
  log_info "=== [$n/$total] Testing $inst ==="

  safe_inst="${inst//_/-}"
  safe_inst="${safe_inst,,}"
  SERVER_NAME="${INSTANCE_PREFIX}-${safe_inst}-server"
  CLIENT_NAME="${INSTANCE_PREFIX}-${safe_inst}-client"
  SERVER_LAN_IP="" CLIENT_LAN_IP="" SERVER_TS_IP="" CLIENT_TS_IP=""
  step_failed=""

  # Provision
  if [[ -z "$step_failed" ]]; then
    if provision_output=$("$TAILBENCH_ROOT/scripts/provision-pair.sh" "$inst"); then
      eval "$(echo "$provision_output" | grep -E '^[A-Z_]+=')"
    else
      log_error "Provisioning failed for $inst"
      step_failed="provision"
    fi
  fi

  # Run benchmark
  if [[ -z "$step_failed" ]]; then
    if ! "$TAILBENCH_ROOT/scripts/run-benchmark.sh" \
        "$inst" "$SERVER_NAME" "$CLIENT_NAME" \
        "$SERVER_LAN_IP" "$CLIENT_LAN_IP" \
        "$SERVER_TS_IP" "$CLIENT_TS_IP"; then
      log_error "Benchmark failed for $inst"
      step_failed="benchmark"
    fi
  fi

  # Teardown (always attempt)
  "$TAILBENCH_ROOT/scripts/teardown-pair.sh" "$SERVER_NAME" "$CLIENT_NAME" || true

  if [[ -z "$step_failed" ]]; then
    log_info "[$n/$total] $inst completed successfully"
    successes=$(( successes + 1 ))

    family=$(get_instance_family "$inst")
    result_file="$TAILBENCH_ROOT/$CLOUD_PROVIDER/$family/results/$inst.json"
    if [[ -f "$result_file" ]]; then
      baseline=$(jq -r '.baseline_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$result_file")
      tailscale=$(jq -r '.tailscale_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$result_file")
      overhead=$(jq -r '.overhead.bandwidth_pct | . * 10 | round / 10' "$result_file")
      result_lines+=("$(printf '%-20s %-17s %-18s %s%%' "$inst" "$baseline" "$tailscale" "$overhead")")
    fi
  else
    log_error "[$n/$total] $inst FAILED at $step_failed"
    failures=$(( failures + 1 ))
    result_lines+=("$(printf '%-20s FAILED (%s)' "$inst" "$step_failed")")
  fi

  ts_maybe_refresh_key
done

# Generate aggregated results
log_info "Generating aggregated results..."
"$TAILBENCH_ROOT/scripts/generate-results.sh"

# Print summary
echo ""
echo "=== Tailbench Results ($CLOUD_PROVIDER) ==="
printf '%-20s %-17s %-18s %s\n' "Instance Type" "Baseline (Gbps)" "Tailscale (Gbps)" "Overhead"
printf '%-20s %-17s %-18s %s\n' "-------------" "---------------" "----------------" "--------"
for line in "${result_lines[@]}"; do
  echo "$line"
done
echo "=== $successes/$total tests completed successfully ==="

if [[ $failures -gt 0 ]]; then
  exit 1
fi
