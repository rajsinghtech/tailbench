#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/lib/tailscale.sh"
source "$TAILBENCH_ROOT/lib/tailnet.sh"
source "$TAILBENCH_ROOT/lib/cleanup.sh"
source "$TAILBENCH_ROOT/config/defaults.sh"
source "$TAILBENCH_ROOT/config/regions.sh"
source "$TAILBENCH_ROOT/config/instances.sh"

FILTER=""
DRY_RUN=false
FAMILY="all"
CREATE_TAILNET=false
TAILNET_PREFIX="${TAILNET_PREFIX:-tailbench}"

# Org-level token for tailnet creation (separate from per-tailnet token)
ORG_ACCESS_TOKEN=""

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") [OPTIONS]

Run Tailscale performance benchmarks across GCP instance types.

Options:
  --filter <regex>       Only test instance types matching regex
  --family <c3|n2|all>   Select instance family (default: all)
  --create-tailnet       Create an ephemeral API-only tailnet for the run
  --dry-run              Preview what would run without executing
  -h, --help             Show this help

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
    --filter)          FILTER="$2"; shift 2 ;;
    --family)          FAMILY="$2"; shift 2 ;;
    --create-tailnet)  CREATE_TAILNET=true; shift ;;
    --dry-run)         DRY_RUN=true; shift ;;
    -h|--help)         usage ;;
    *)                 log_error "Unknown option: $1"; usage ;;
  esac
done

# Validate prereqs
require_cmd gcloud jq curl

if ! gcloud auth print-access-token &>/dev/null; then
  log_error "gcloud not authenticated. Run: gcloud auth login"
  exit 1
fi

if [[ -z "${TS_OAUTH_CLIENT_ID:-}" || -z "${TS_OAUTH_CLIENT_SECRET:-}" ]]; then
  log_error "TS_OAUTH_CLIENT_ID and TS_OAUTH_CLIENT_SECRET must be set"
  exit 1
fi

# Build instance list
case "$FAMILY" in
  c3)  instances=("${GCP_C3_INSTANCES[@]}") ;;
  n2)  instances=("${GCP_N2_INSTANCES[@]}") ;;
  all) instances=("${ALL_INSTANCES[@]}") ;;
  *)   log_error "Unknown family: $FAMILY (use c3, n2, or all)"; exit 1 ;;
esac

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
    echo "[$n/$total] $inst"
    echo "  provision-pair.sh $inst"
    echo "  run-benchmark.sh $inst <server> <client> <s_lan> <c_lan> <s_ts> <c_ts>"
    echo "  teardown-pair.sh <server> <client>"
  done
  echo ""
  echo "generate-results.sh"
  if $CREATE_TAILNET; then
    echo ""
    echo "[tailnet] DELETE ephemeral tailnet"
  fi
  exit 0
fi

# Setup GCP cleanup trap
setup_cleanup_trap

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
    tailnet_delete "$org_token" "$tailnet_dns" || log_warn "Failed to delete tailnet (may require manual cleanup)"
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
export GCP_PROJECT GCP_ZONE GCP_REGION

# Track results for summary table
declare -a result_lines=()
successes=0
failures=0

for i in "${!instances[@]}"; do
  n=$(( i + 1 ))
  inst="${instances[$i]}"
  log_info "=== [$n/$total] Testing $inst ==="

  SERVER_NAME="${INSTANCE_PREFIX}-${inst}-server"
  CLIENT_NAME="${INSTANCE_PREFIX}-${inst}-client"
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
    (( successes++ ))

    family=$(get_instance_family "$inst")
    result_file="$TAILBENCH_ROOT/gcp/$family/results/$inst.json"
    if [[ -f "$result_file" ]]; then
      baseline=$(jq -r '.baseline_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$result_file")
      tailscale=$(jq -r '.tailscale_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$result_file")
      overhead=$(jq -r '.overhead.bandwidth_pct | . * 10 | round / 10' "$result_file")
      result_lines+=("$(printf '%-20s %-17s %-18s %s%%' "$inst" "$baseline" "$tailscale" "$overhead")")
    fi
  else
    log_error "[$n/$total] $inst FAILED at $step_failed"
    (( failures++ ))
    result_lines+=("$(printf '%-20s FAILED (%s)' "$inst" "$step_failed")")
  fi

  ts_maybe_refresh_key
done

# Generate aggregated results
log_info "Generating aggregated results..."
"$TAILBENCH_ROOT/scripts/generate-results.sh"

# Print summary
echo ""
echo "=== Tailbench Results ==="
printf '%-20s %-17s %-18s %s\n' "Instance Type" "Baseline (Gbps)" "Tailscale (Gbps)" "Overhead"
printf '%-20s %-17s %-18s %s\n' "-------------" "---------------" "----------------" "--------"
for line in "${result_lines[@]}"; do
  echo "$line"
done
echo "=== $successes/$total tests completed successfully ==="

if (( failures > 0 )); then
  exit 1
fi
