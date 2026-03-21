#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"
source "$TAILBENCH_ROOT/lib/tailscale.sh"
source "$TAILBENCH_ROOT/lib/tailnet.sh"

FILTER=""
DRY_RUN=false
FAMILY="all"
CREATE_TAILNET=true
CLEANUP_NETWORKING=false
K8S="${K8S:-false}"
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
  --create-tailnet                  Create an ephemeral API-only tailnet (default)
  --no-create-tailnet               Use existing tailnet credentials directly
  --cleanup-networking              Tear down provider networking after run
  --dry-run                         Preview what would run without executing
  --k8s               Run K8s benchmark phase (requires pre-provisioned EKS cluster)
  -h, --help                        Show this help

Provider families:
  gcp:   c4, c4a, c3d, n4, c3, n2, c2
  aws:   c6in, c7i, c7gn, c8g, c6i, m6i, c7g, m7g
  azure: dsv5, dasv5, dpsv6, dsv4, fsv2, fasv6, fasv7, esv4

Required environment variables:
  TS_OAUTH_CLIENT_ID     Tailscale OAuth client ID
  TS_OAUTH_CLIENT_SECRET Tailscale OAuth client secret
  TS_TAG                 Tailscale ACL tag (default: tag:bench)

Tailnet creation is on by default. Use --no-create-tailnet to skip it.
When tailnet creation is enabled:
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
    --create-tailnet)    CREATE_TAILNET=true; shift ;;
    --no-create-tailnet) CREATE_TAILNET=false; shift ;;
    --cleanup-networking) CLEANUP_NETWORKING=true; shift ;;
    --dry-run)    DRY_RUN=true; shift ;;
    --k8s)        K8S=true; shift ;;
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
  if [[ "$K8S" == "true" && "$provider" == "aws" ]]; then
    source "$TAILBENCH_ROOT/config/eks.sh"
    source "$TAILBENCH_ROOT/lib/eks.sh"
    source "$TAILBENCH_ROOT/lib/k8s.sh"
  fi
  source "$TAILBENCH_ROOT/lib/cleanup.sh"

  setup_cleanup_trap

  # Validate prereqs
  require_cmd jq curl $(cloud_required_cmds)
  cloud_check_auth

  # Setup provider networking (discovers existing or creates new)
  cloud_setup_networking

  if [[ "$K8S" == "true" && "$provider" == "aws" ]]; then
    if ! eks_discover_cluster 2>/dev/null; then
      log_info "EKS cluster not found — provisioning via setup-k8s-cluster.sh"
      "$TAILBENCH_ROOT/scripts/setup-k8s-cluster.sh"
    fi
    eks_get_kubeconfig
    eks_get_cluster_info
    k8s_check_prereqs
    k8s_ensure_namespace
  fi

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

  # Status file for cross-provider summary
  local status_dir="$TAILBENCH_ROOT/.run"
  mkdir -p "$status_dir"
  local status_file="$status_dir/$provider.status"
  : > "$status_file"
  echo "start_ts=$(date +%s)" >> "$status_file"

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
      echo "$inst|SKIPPED|quota" >> "$status_file"
      continue
    fi

    # Skip if result already exists (resume support)
    local existing_result="$TAILBENCH_ROOT/$provider/$family/results/$inst.json"
    local ena_needs_run=false
    if [[ "$provider" == "aws" ]] && aws_supports_ena_express "$inst"; then
      local ena_result_check="$TAILBENCH_ROOT/$provider/$family/results/$inst-ena-express.json"
      [[ ! -f "$ena_result_check" ]] && ena_needs_run=true
    fi
    local k8s_needs_run=false
    if [[ "$K8S" == "true" && "$provider" == "aws" ]]; then
      if ! jq -e '.k8s_pod_to_ec2_tcp and .k8s_tailscale_pod_to_ec2_tcp' "$existing_result" &>/dev/null; then
        k8s_needs_run=true
      fi
    fi
    if [[ -f "$existing_result" && "$ena_needs_run" == "false" && "$k8s_needs_run" == "false" ]]; then
      log_info "[$provider][$n/$total] Skipping $inst (result already exists)"
      successes=$(( successes + 1 ))
      local baseline tailscale_bw overhead
      baseline=$(jq -r '.baseline_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$existing_result")
      tailscale_bw=$(jq -r '.tailscale_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$existing_result")
      overhead=$(jq -r '.overhead.bandwidth_pct | . * 10 | round / 10' "$existing_result")
      result_lines+=("$(printf '%-20s %-17s %-18s %s%%' "$inst" "$baseline" "$tailscale_bw" "$overhead")")
      echo "$inst|OK|cached" >> "$status_file"
      continue
    fi

    log_info "[$provider] === [$n/$total] Testing $inst ==="

    local safe_inst="${inst//_/-}"
    safe_inst="${safe_inst,,}"
    local SERVER_NAME="${INSTANCE_PREFIX}-${safe_inst}-server"
    local CLIENT_NAME="${INSTANCE_PREFIX}-${safe_inst}-client"
    local SERVER_LAN_IP="" CLIENT_LAN_IP=""
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

    # Run benchmark (skip if standard result already exists from a previous run)
    if [[ -z "$step_failed" ]]; then
      if [[ -f "$existing_result" ]]; then
        log_info "[$provider][$n/$total] Standard result exists, skipping to ENA Express"
      elif ! "$TAILBENCH_ROOT/scripts/run-benchmark.sh" \
          "$inst" "$SERVER_NAME" "$CLIENT_NAME" \
          "$SERVER_LAN_IP" "$CLIENT_LAN_IP"; then
        log_error "[$provider] Benchmark failed for $inst"
        step_failed="benchmark"
      fi
    fi

    # ENA Express interleaved run (AWS only, eligible instance types)
    if [[ -z "$step_failed" && "$provider" == "aws" ]] && aws_supports_ena_express "$inst"; then
      local ena_result="$TAILBENCH_ROOT/$provider/$family/results/$inst-ena-express.json"
      if [[ -f "$ena_result" ]]; then
        log_info "[$provider][$n/$total] Skipping ENA Express for $inst (result exists)"
      else
        log_info "[$provider][$n/$total] Enabling ENA Express on $inst pair"
        local ena_failed=""
        if aws_enable_ena_express "$SERVER_NAME" && aws_enable_ena_express "$CLIENT_NAME"; then
          sleep 5
          log_info "[$provider][$n/$total] Running ENA Express benchmark for $inst"
          if ! ENA_EXPRESS=true "$TAILBENCH_ROOT/scripts/run-benchmark.sh" \
              "$inst" "$SERVER_NAME" "$CLIENT_NAME" \
              "$SERVER_LAN_IP" "$CLIENT_LAN_IP"; then
            log_error "[$provider] ENA Express benchmark failed for $inst"
            ena_failed="benchmark"
          fi
        else
          log_error "[$provider] Failed to enable ENA Express on $inst"
          ena_failed="ena-setup"
        fi

        if [[ -z "$ena_failed" && -f "$ena_result" ]]; then
          local ena_baseline ena_ts_bw ena_overhead
          ena_baseline=$(jq -r '.baseline_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$ena_result")
          ena_ts_bw=$(jq -r '.tailscale_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$ena_result")
          ena_overhead=$(jq -r '.overhead.bandwidth_pct | . * 10 | round / 10' "$ena_result")
          result_lines+=("$(printf '%-20s %-17s %-18s %s%%' "$inst (ENA)" "$ena_baseline" "$ena_ts_bw" "$ena_overhead")")
          echo "$inst-ena-express|OK|" >> "$status_file"
        elif [[ -n "$ena_failed" ]]; then
          result_lines+=("$(printf '%-20s FAILED (%s)' "$inst (ENA)" "$ena_failed")")
          echo "$inst-ena-express|FAILED|$ena_failed" >> "$status_file"
        fi
      fi
    fi

    # --- K8s benchmark phase ---
    if [[ -z "$step_failed" && "$K8S" == "true" && "$provider" == "aws" ]]; then
      local result_file="$TAILBENCH_ROOT/$provider/$family/results/$inst.json"
      if [[ -f "$result_file" ]]; then
        log_info "[$inst] running K8s benchmark"
        "$TAILBENCH_ROOT/scripts/run-k8s-benchmark.sh" \
          "$inst" "$SERVER_NAME" "$SERVER_LAN_IP" "$result_file" || {
          log_warn "[$inst] K8s benchmark failed"
        }
      else
        log_warn "[$inst] skipping K8s benchmark — no result file found"
      fi
    fi

    # Teardown (always attempt)
    "$TAILBENCH_ROOT/scripts/teardown-pair.sh" "$SERVER_NAME" "$CLIENT_NAME" || true

    if [[ -z "$step_failed" ]]; then
      log_info "[$provider][$n/$total] $inst completed successfully"
      successes=$(( successes + 1 ))
      echo "$inst|OK|" >> "$status_file"

      local result_file="$TAILBENCH_ROOT/$provider/$family/results/$inst.json"
      if [[ -f "$result_file" ]]; then
        local baseline tailscale_bw overhead
        baseline=$(jq -r '.baseline_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$result_file")
        tailscale_bw=$(jq -r '.tailscale_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$result_file")
        overhead=$(jq -r '.overhead.bandwidth_pct | . * 10 | round / 10' "$result_file")
        result_lines+=("$(printf '%-20s %-17s %-18s %s%%' "$inst" "$baseline" "$tailscale_bw" "$overhead")")
      fi
    elif [[ "$step_failed" == "quota" ]]; then
      log_warn "[$provider][$n/$total] $inst QUOTA exceeded (skipping)"
      skipped=$(( skipped + 1 ))
      echo "$inst|SKIPPED|quota" >> "$status_file"
      result_lines+=("$(printf '%-20s SKIPPED (quota)' "$inst")")
    else
      log_error "[$provider][$n/$total] $inst FAILED at $step_failed"
      failures=$(( failures + 1 ))
      echo "$inst|FAILED|$step_failed" >> "$status_file"
      result_lines+=("$(printf '%-20s FAILED (%s)' "$inst" "$step_failed")")
    fi

    ts_maybe_refresh_key
  done

  # Write status file footer
  echo "end_ts=$(date +%s)" >> "$status_file"
  echo "successes=$successes" >> "$status_file"
  echo "failures=$failures" >> "$status_file"
  echo "skipped=$skipped" >> "$status_file"

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

  # Tear down networking only when explicitly requested
  if [[ "$CLEANUP_NETWORKING" == "true" ]]; then
    cloud_teardown_networking
  fi

  if [[ $failures -gt 0 ]]; then
    return 1
  fi
}

# ── Cross-provider summary ──────────────────────────────────────────
_print_cross_provider_summary() {
  local status_dir="$TAILBENCH_ROOT/.run"
  local total_ok=0 total_fail=0 total_skip=0

  echo ""
  echo "=========================================="
  echo "  Cross-Provider Summary"
  echo "=========================================="

  for p in "${PROVIDER_LIST[@]}"; do
    local sf="$status_dir/$p.status"
    if [[ ! -f "$sf" ]]; then
      echo ""
      echo "  [$p] (no status file)"
      continue
    fi

    # Read timing
    local start_ts end_ts elapsed_str=""
    start_ts=$(grep '^start_ts=' "$sf" | cut -d= -f2)
    end_ts=$(grep '^end_ts=' "$sf" | cut -d= -f2)
    if [[ -n "$start_ts" && -n "$end_ts" ]]; then
      local elapsed=$(( end_ts - start_ts ))
      local mins=$(( elapsed / 60 ))
      local secs=$(( elapsed % 60 ))
      elapsed_str=" (${mins}m$(printf '%02d' $secs)s)"
    fi

    local p_ok p_fail p_skip
    p_ok=$(grep '^successes=' "$sf" | cut -d= -f2)
    p_fail=$(grep '^failures=' "$sf" | cut -d= -f2)
    p_skip=$(grep '^skipped=' "$sf" | cut -d= -f2)
    p_ok="${p_ok:-0}"; p_fail="${p_fail:-0}"; p_skip="${p_skip:-0}"

    total_ok=$(( total_ok + p_ok ))
    total_fail=$(( total_fail + p_fail ))
    total_skip=$(( total_skip + p_skip ))

    echo ""
    echo "  [$p]${elapsed_str}"
    printf '  %-25s %-10s %s\n' "Instance" "Status" "Step"

    # Read instance lines (lines containing |)
    while IFS='|' read -r inst status step; do
      [[ -z "$inst" ]] && continue
      printf '  %-25s %-10s %s\n' "$inst" "$status" "$step"
    done < <(grep '|' "$sf")

    echo "  --- $p_ok passed, $p_fail failed, $p_skip skipped ---"
  done

  echo ""
  echo "=========================================="
  echo "  Overall: $total_ok passed, $total_fail failed, $total_skip skipped"
  echo "=========================================="
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
      echo "[networking] DISCOVER existing or CREATE new"
      for i in "${!instances[@]}"; do
        n=$(( i + 1 ))
        inst="${instances[$i]}"
        family=$(get_instance_family "$inst")
        vcpus=$(get_instance_vcpus "$inst")
        echo "[$n/$local_total] $inst (family=$family, vcpus=$vcpus)"
        echo "  provision-pair.sh $inst"
        echo "  run-benchmark.sh $inst <server> <client> <s_lan> <c_lan>"
        echo "  teardown-pair.sh <server> <client>"
        echo "  -> $p/$family/results/$inst.json"
        if [[ "$p" == "aws" ]] && aws_supports_ena_express "$inst"; then
          echo "  [ENA Express] enable SRD on both ENIs"
          echo "  run-benchmark.sh $inst <server> <client> <s_lan> <c_lan> (ENA Express)"
          echo "  -> $p/$family/results/$inst-ena-express.json"
        fi
        if [[ "$K8S" == "true" && "$p" == "aws" ]]; then
          echo "  [K8s] deploy iperf3 pod on ${EKS_CLUSTER_NAME:-<eks-cluster>}"
          echo "  run-k8s-benchmark.sh $inst <server> <s_lan> <result_file>"
          echo "  -> pod↔ec2 results merged into $p/$family/results/$inst.json"
        fi
      done
      if $CLEANUP_NETWORKING; then
        echo "[networking] CLEANUP"
      fi
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
    acls: [{action: "accept", src: ["*"], dst: ["*:*"]}],
    tagOwners: {($tag): [$tag]},
    ssh: [],
    nodeAttrs: []
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

  # Cross-provider summary
  _print_cross_provider_summary

  echo ""
  echo "Per-provider logs: $log_dir/"

  if $any_failed; then
    exit 1
  fi
fi
