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
PROVIDER_LIST=()

# Org-level token for tailnet creation (separate from per-tailnet token)
ORG_ACCESS_TOKEN=""

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") [OPTIONS]

Run Tailscale performance benchmarks across cloud instance types.

Options:
  --provider <gcp|aws|azure>       Cloud provider (default: gcp)
  --providers <gcp,aws,azure>      Run multiple providers in parallel (comma-separated)
  --filter <regex>                  Only test instance types matching regex
  --family <name|all>               Select instance family (default: all)
  --create-tailnet                  Create an ephemeral API-only tailnet for the run
  --dry-run                         Preview what would run without executing
  -h, --help                        Show this help

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
    --provider)   PROVIDER_LIST=("$2"); shift 2 ;;
    --providers)  IFS=',' read -ra PROVIDER_LIST <<< "$2"; shift 2 ;;
    --filter)     FILTER="$2"; shift 2 ;;
    --family)     FAMILY="$2"; shift 2 ;;
    --create-tailnet) CREATE_TAILNET=true; shift ;;
    --dry-run)    DRY_RUN=true; shift ;;
    -h|--help)    usage ;;
    *)            log_error "Unknown option: $1"; usage ;;
  esac
done

# Default to gcp if no provider specified
if (( ${#PROVIDER_LIST[@]} == 0 )); then
  PROVIDER_LIST=("${CLOUD_PROVIDER:-gcp}")
fi

# Validate provider names
for p in "${PROVIDER_LIST[@]}"; do
  case "$p" in
    gcp|aws|azure) ;;
    *) log_error "Unknown provider: $p (expected gcp, aws, or azure)"; exit 1 ;;
  esac
done

# ── Per-provider work ───────────────────────────────────────────────
# Runs everything provider-specific: source libs, check auth, setup
# networking, iterate instances, teardown networking.
# In multi-provider mode this runs in a forked subprocess.
_run_provider() {
  local provider="$1"
  export CLOUD_PROVIDER="$provider"

  # Each subprocess gets its own cleanup file
  export TAILBENCH_CLEANUP_FILE="/tmp/tailbench-cleanup-$$-$provider"

  source "$TAILBENCH_ROOT/lib/provider.sh"
  source "$TAILBENCH_ROOT/lib/cleanup.sh"

  setup_cleanup_trap

  # Validate prereqs
  require_cmd jq curl $(cloud_required_cmds)
  cloud_check_auth

  # Setup provider networking
  cloud_setup_networking
  _original_exit_trap=$(trap -p EXIT | sed "s/^trap -- '//;s/' EXIT$//")
  trap "$_original_exit_trap; cloud_teardown_networking" EXIT

  # Build instance list
  mapfile -t instances < <(get_instance_list "$FAMILY" 2>/dev/null | grep .)
  if (( ${#instances[@]} == 0 )); then
    valid_families=$(get_provider_families)
    log_error "[$provider] No instances found for family '$FAMILY' in $CLOUD_REGION (valid families: $valid_families, or all)"
    return 1
  fi

  if [[ -n "$FILTER" ]]; then
    filtered=()
    for inst in "${instances[@]}"; do
      if [[ "$inst" =~ $FILTER ]]; then
        filtered+=("$inst")
      fi
    done
    instances=("${filtered[@]}")
  fi

  local total=${#instances[@]}
  if (( total == 0 )); then
    log_error "[$provider] No instances matched filter"
    return 1
  fi

  log_info "[$provider] Region: $CLOUD_REGION | Zone: $CLOUD_ZONE"
  log_info "[$provider] Will test $total instance type(s): ${instances[*]}"

  # Refresh authkey for this subprocess
  ts_maybe_refresh_key

  # Track results
  declare -a result_lines=()
  declare -A skipped_families=()
  local successes=0 failures=0 skipped=0

  for i in "${!instances[@]}"; do
    local n=$(( i + 1 ))
    local inst="${instances[$i]}"
    local family
    family=$(get_instance_family "$inst")

    # Skip if family hit quota
    if [[ -n "${skipped_families[$family]:-}" ]]; then
      log_warn "[$provider][$n/$total] Skipping $inst (family $family hit quota limit)"
      skipped=$(( skipped + 1 ))
      result_lines+=("$(printf '%-20s SKIPPED (quota)' "$inst")")
      continue
    fi

    log_info "[$provider] === [$n/$total] Testing $inst ==="

    local safe_inst="${inst//_/-}"
    safe_inst="${safe_inst,,}"
    local SERVER_NAME="${INSTANCE_PREFIX}-${safe_inst}-server"
    local CLIENT_NAME="${INSTANCE_PREFIX}-${safe_inst}-client"
    local SERVER_LAN_IP="" CLIENT_LAN_IP="" SERVER_TS_IP="" CLIENT_TS_IP=""
    local step_failed=""

    # Provision
    if [[ -z "$step_failed" ]]; then
      local provision_rc=0
      local provision_output
      provision_output=$("$TAILBENCH_ROOT/scripts/provision-pair.sh" "$inst") || provision_rc=$?
      if (( provision_rc == 0 )); then
        eval "$(echo "$provision_output" | grep -E '^[A-Z_]+=')"
      elif (( provision_rc == 2 )); then
        log_error "[$provider] Provisioning hit quota limit for $inst"
        skipped_families[$family]=1
        step_failed="quota"
      else
        log_error "[$provider] Provisioning failed for $inst"
        step_failed="provision"
      fi
    fi

    # Run benchmark
    if [[ -z "$step_failed" ]]; then
      if ! "$TAILBENCH_ROOT/scripts/run-benchmark.sh" \
          "$inst" "$SERVER_NAME" "$CLIENT_NAME" \
          "$SERVER_LAN_IP" "$CLIENT_LAN_IP" \
          "$SERVER_TS_IP" "$CLIENT_TS_IP"; then
        log_error "[$provider] Benchmark failed for $inst"
        step_failed="benchmark"
      fi
    fi

    # Teardown (always attempt)
    "$TAILBENCH_ROOT/scripts/teardown-pair.sh" "$SERVER_NAME" "$CLIENT_NAME" || true

    if [[ -z "$step_failed" ]]; then
      log_info "[$provider][$n/$total] $inst completed successfully"
      successes=$(( successes + 1 ))

      local result_file="$TAILBENCH_ROOT/$provider/$family/results/$inst.json"
      if [[ -f "$result_file" ]]; then
        local baseline tailscale_bw overhead
        baseline=$(jq -r '.baseline_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$result_file")
        tailscale_bw=$(jq -r '.tailscale_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$result_file")
        overhead=$(jq -r '.overhead.bandwidth_pct | . * 10 | round / 10' "$result_file")
        result_lines+=("$(printf '%-20s %-17s %-18s %s%%' "$inst" "$baseline" "$tailscale_bw" "$overhead")")
      fi
    elif [[ "$step_failed" == "quota" ]]; then
      log_warn "[$provider][$n/$total] $inst QUOTA exceeded"
      failures=$(( failures + 1 ))
      result_lines+=("$(printf '%-20s QUOTA (provision)' "$inst")")
    else
      log_error "[$provider][$n/$total] $inst FAILED at $step_failed"
      failures=$(( failures + 1 ))
      result_lines+=("$(printf '%-20s FAILED (%s)' "$inst" "$step_failed")")
    fi

    ts_maybe_refresh_key
  done

  # Generate aggregated results for this provider
  log_info "[$provider] Generating aggregated results..."
  "$TAILBENCH_ROOT/scripts/generate-results.sh"

  # Print provider summary
  echo ""
  echo "=== Tailbench Results ($provider) ==="
  printf '%-20s %-17s %-18s %s\n' "Instance Type" "Baseline (Gbps)" "Tailscale (Gbps)" "Overhead"
  printf '%-20s %-17s %-18s %s\n' "-------------" "---------------" "----------------" "--------"
  for line in "${result_lines[@]}"; do
    echo "$line"
  done
  echo "=== $successes passed, $failures failed, $skipped skipped (of $total) ==="

  if [[ $failures -gt 0 ]]; then
    return 1
  fi
}

# ── Dry-run ─────────────────────────────────────────────────────────
if $DRY_RUN; then
  if $CREATE_TAILNET; then
    echo "[tailnet] CREATE ephemeral tailnet: ${TAILNET_PREFIX}-<timestamp>"
    echo "[tailnet] GET access token for new tailnet"
    echo "[tailnet] UPDATE ACL policy"
    echo ""
  fi

  for p in "${PROVIDER_LIST[@]}"; do
    (
      export CLOUD_PROVIDER="$p"
      source "$TAILBENCH_ROOT/lib/provider.sh"

      mapfile -t instances < <(get_instance_list "$FAMILY" 2>/dev/null | grep .)
      if [[ -n "$FILTER" ]]; then
        filtered=()
        for inst in "${instances[@]}"; do
          [[ "$inst" =~ $FILTER ]] && filtered+=("$inst")
        done
        instances=("${filtered[@]}")
      fi

      local_total=${#instances[@]}
      echo "--- $p ($CLOUD_REGION) ---"
      for i in "${!instances[@]}"; do
        n=$(( i + 1 ))
        inst="${instances[$i]}"
        family=$(get_instance_family "$inst")
        vcpus=$(get_instance_vcpus "$inst")
        echo "[$n/$local_total] $inst (family=$family, vcpus=$vcpus)"
        echo "  provision-pair.sh $inst"
        echo "  run-benchmark.sh $inst <server> <client> <s_lan> <c_lan> <s_ts> <c_ts>"
        echo "  teardown-pair.sh <server> <client>"
        echo "  -> $p/$family/results/$inst.json"
      done
      echo ""
    )
  done

  echo "generate-results.sh"
  if $CREATE_TAILNET; then
    echo ""
    echo "[tailnet] DELETE ephemeral tailnet"
  fi
  exit 0
fi

# ── Shared setup (credentials, tailnet) ─────────────────────────────
if [[ -z "${TS_OAUTH_CLIENT_ID:-}" || -z "${TS_OAUTH_CLIENT_SECRET:-}" ]]; then
  log_error "TS_OAUTH_CLIENT_ID and TS_OAUTH_CLIENT_SECRET must be set"
  exit 1
fi

# Tailnet lifecycle
if $CREATE_TAILNET; then
  log_info "Obtaining org-level access token..."
  ORG_ACCESS_TOKEN=$(tailnet_get_access_token "$TS_OAUTH_CLIENT_ID" "$TS_OAUTH_CLIENT_SECRET")

  tailnet_name="${TAILNET_PREFIX}-$(date +%s)"
  tailnet_create "$ORG_ACCESS_TOKEN" "$tailnet_name"

  tailnet_dns="$TAILNET_DNS_NAME"
  org_token="$ORG_ACCESS_TOKEN"
  trap_tailnet_cleanup() {
    log_info "Cleaning up ephemeral tailnet: $tailnet_dns"
    tailnet_delete "$org_token" "$tailnet_dns" || log_warn "Tailnet already deleted (auto-cleanup) or requires manual removal"
  }
  trap trap_tailnet_cleanup EXIT

  log_info "Obtaining tailnet access token..."
  TAILNET_ACCESS_TOKEN=$(tailnet_get_access_token "$TAILNET_OAUTH_CLIENT_ID" "$TAILNET_OAUTH_CLIENT_SECRET")

  acl_policy=$(jq -n --arg tag "$TS_TAG" '{
    acls: [{action: "accept", src: [$tag], dst: [($tag + ":*")]}],
    tagOwners: {($tag): [$tag]}
  }')
  tailnet_update_acl "$TAILNET_ACCESS_TOKEN" "$TAILNET_DNS_NAME" "$acl_policy"

  export TS_OAUTH_CLIENT_ID="$TAILNET_OAUTH_CLIENT_ID"
  export TS_OAUTH_CLIENT_SECRET="$TAILNET_OAUTH_CLIENT_SECRET"
  log_info "Switched to ephemeral tailnet credentials"
fi

# Get per-tailnet OAuth token and auth key
TS_ACCESS_TOKEN=$(tailnet_get_access_token "$TS_OAUTH_CLIENT_ID" "$TS_OAUTH_CLIENT_SECRET")
log_info "OAuth token acquired"
ts_create_authkey
export TS_ACCESS_TOKEN TS_AUTHKEY TS_AUTHKEY_CREATED TS_TAG

# ── Dispatch providers ──────────────────────────────────────────────
if (( ${#PROVIDER_LIST[@]} == 1 )); then
  # Single provider: run inline (no subprocess), identical to old behavior
  _run_provider "${PROVIDER_LIST[0]}"
else
  # Multi-provider: fork one subprocess per provider
  log_dir="$TAILBENCH_ROOT/.run/logs"
  mkdir -p "$log_dir"

  declare -A provider_pids=()
  for p in "${PROVIDER_LIST[@]}"; do
    log_info "Starting provider $p (log: .run/logs/$p.log)"
    _run_provider "$p" > "$log_dir/$p.log" 2>&1 &
    provider_pids[$p]=$!
  done

  declare -A provider_exit=()
  any_failed=false
  for p in "${PROVIDER_LIST[@]}"; do
    if wait "${provider_pids[$p]}"; then
      provider_exit[$p]=0
    else
      provider_exit[$p]=$?
      any_failed=true
    fi
  done

  # Print each provider's output
  for p in "${PROVIDER_LIST[@]}"; do
    echo ""
    echo "=========================================="
    echo "  Provider: $p (exit ${provider_exit[$p]})"
    echo "=========================================="
    cat "$log_dir/$p.log"
  done

  echo ""
  echo "Per-provider logs: $log_dir/"

  if $any_failed; then
    exit 1
  fi
fi
