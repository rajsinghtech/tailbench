#!/usr/bin/env bash
# Provider-agnostic Kubernetes operations for benchmarking

K8S_POD_NAME="${K8S_POD_NAME:-tailbench-iperf3}"
K8S_NAMESPACE="${K8S_NAMESPACE:-tailbench}"
K8S_MANIFEST_DIR="$TAILBENCH_ROOT/manifests"

k8s_check_prereqs() {
  require_cmd kubectl
  if ! kubectl cluster-info &>/dev/null; then
    log_error "kubectl cannot reach cluster — run the provider's get_kubeconfig first"
    return 1
  fi
}

k8s_ensure_namespace() {
  if ! kubectl get namespace "$K8S_NAMESPACE" &>/dev/null 2>&1; then
    log_info "creating namespace $K8S_NAMESPACE"
    kubectl create namespace "$K8S_NAMESPACE"
  fi
}

k8s_get_node_type() {
  case "${CLOUD_PROVIDER:-aws}" in
    gcp)   gke_get_node_machine_type ;;
    azure) aks_get_node_vm_size ;;
    *)     eks_get_node_instance_type ;;
  esac
}

k8s_deploy_iperf_pod() {
  local az="${1:-}"
  log_info "deploying iperf3 pod in namespace $K8S_NAMESPACE"
  # Delete first to allow node selector changes across runs
  kubectl delete pod "$K8S_POD_NAME" -n "$K8S_NAMESPACE" --ignore-not-found --wait=false >/dev/null 2>&1 || true
  if [[ -n "$az" ]]; then
    sed "s/REPLACE_AZ/$az/" "$K8S_MANIFEST_DIR/iperf3-pod.yaml"
  else
    grep -v "REPLACE_AZ\|topology.kubernetes.io/zone" "$K8S_MANIFEST_DIR/iperf3-pod.yaml"
  fi | kubectl apply -n "$K8S_NAMESPACE" -f -
}

k8s_wait_for_pod() {
  local max_wait="${1:-120}"
  log_info "waiting for pod $K8S_POD_NAME to be Running (timeout: ${max_wait}s)"
  if ! kubectl wait pod/"$K8S_POD_NAME" \
    -n "$K8S_NAMESPACE" \
    --for=condition=Ready \
    --timeout="${max_wait}s" 2>/dev/null; then
    log_error "pod $K8S_POD_NAME not ready after ${max_wait}s"
    kubectl describe pod "$K8S_POD_NAME" -n "$K8S_NAMESPACE" 2>/dev/null || true
    return 1
  fi
  log_info "pod $K8S_POD_NAME is Running"
}

k8s_get_pod_ip() {
  local ip
  ip=$(kubectl get pod "$K8S_POD_NAME" \
    -n "$K8S_NAMESPACE" \
    -o jsonpath='{.status.podIP}')
  if [[ -z "$ip" ]]; then
    log_error "could not get pod IP for $K8S_POD_NAME"
    return 1
  fi
  echo "$ip"
}

k8s_exec() {
  kubectl exec "$K8S_POD_NAME" \
    -n "$K8S_NAMESPACE" \
    -- "$@"
}

_k8s_run_iperf_test() {
  local exec_fn="$1" label="$2" target_ip="$3" duration="$4" parallel="$5" iterations="$6"
  local results="[]"
  for (( i=1; i<=iterations; i++ )); do
    log_info "iperf3 iteration $i/$iterations: $label -> $target_ip (P$parallel)"
    local raw="" attempt=0
    while (( attempt < 3 )); do
      raw=$("$exec_fn" iperf3 -c "$target_ip" -p "$IPERF_PORT" -t "$duration" -P "$parallel" -J 2>/dev/null) || true
      local err="" bps=""
      err=$(echo "$raw" | jq -r '.error // empty' 2>/dev/null) || true
      bps=$(echo "$raw" | jq '.end.sum_sent.bits_per_second // empty' 2>/dev/null) || true
      if [[ -n "$err" ]]; then
        log_warn "iperf3 error (attempt $((attempt+1))/3): $err"
        attempt=$(( attempt + 1 )); sleep 60; continue
      fi
      if [[ -z "$bps" ]]; then
        log_warn "iperf3 missing fields (attempt $((attempt+1))/3): ${raw:0:200}"
        attempt=$(( attempt + 1 )); sleep 60; continue
      fi
      break
    done
    if (( attempt >= 3 )); then
      log_error "iperf3 failed after 3 retries ($label -> $target_ip)"; return 1
    fi
    local entry
    entry=$(echo "$raw" | jq '{
      bandwidth_mbps: (.end.sum_sent.bits_per_second / 1000000),
      retransmits: .end.sum_sent.retransmits,
      duration_sec: .end.sum_sent.seconds,
      bytes_transferred: .end.sum_sent.bytes
    }')
    results=$(echo "$results" | jq --argjson e "$entry" '. + [$e]')
    if (( i < iterations )); then
      log_info "Cooldown between iterations (30s)..."
      sleep 30
    fi
  done
  echo "$results"
}

k8s_iperf_run_test() {
  _k8s_run_iperf_test k8s_exec "pod" "$@"
}

k8s_ts_iperf_run_test() {
  _k8s_run_iperf_test k8s_ts_exec "sidecar" "$@"
}

k8s_cleanup_pod() {
  log_info "cleaning up pod $K8S_POD_NAME"
  kubectl delete pod "$K8S_POD_NAME" \
    -n "$K8S_NAMESPACE" \
    --ignore-not-found \
    --wait=false >/dev/null 2>&1 || true
}

# --- Tailscale sidecar pod functions ---

K8S_TS_POD_NAME="${K8S_TS_POD_NAME:-tailbench-iperf3-ts}"
K8S_TS_SECRET_NAME="tailbench-ts-authkey"

k8s_create_ts_secret() {
  local authkey="$1"
  kubectl delete secret "$K8S_TS_SECRET_NAME" \
    -n "$K8S_NAMESPACE" --ignore-not-found >/dev/null 2>&1 || true
  kubectl create secret generic "$K8S_TS_SECRET_NAME" \
    -n "$K8S_NAMESPACE" \
    --from-literal=authkey="$authkey"
  log_info "created secret $K8S_TS_SECRET_NAME"
}

k8s_deploy_ts_iperf_pod() {
  local az="${1:-}"
  log_info "deploying Tailscale sidecar iperf3 pod"
  if [[ -n "$az" ]]; then
    sed "s/REPLACE_AZ/$az/" "$K8S_MANIFEST_DIR/iperf3-tailscale-pod.yaml"
  else
    grep -v "REPLACE_AZ\|topology.kubernetes.io/zone" "$K8S_MANIFEST_DIR/iperf3-tailscale-pod.yaml"
  fi | kubectl apply -n "$K8S_NAMESPACE" -f -
}

k8s_wait_for_ts_pod() {
  local max_wait="${1:-180}"
  local attempt=0 interval=3
  local max_attempts=$(( max_wait / interval ))
  log_info "waiting for pod $K8S_TS_POD_NAME containers to start (timeout: ${max_wait}s)"
  # Can't use --for=condition=Ready because the sidecar won't be Ready
  # until Tailscale connects. Instead wait for pod phase=Running and
  # the iperf3 container to be started.
  while (( attempt < max_attempts )); do
    local phase
    phase=$(kubectl get pod "$K8S_TS_POD_NAME" -n "$K8S_NAMESPACE" \
      -o jsonpath='{.status.phase}' 2>/dev/null) || true
    if [[ "$phase" == "Running" ]]; then
      local iperf_ready
      iperf_ready=$(kubectl get pod "$K8S_TS_POD_NAME" -n "$K8S_NAMESPACE" \
        -o jsonpath='{.status.containerStatuses[?(@.name=="iperf3")].ready}' 2>/dev/null) || true
      if [[ "$iperf_ready" == "true" ]]; then
        log_info "pod $K8S_TS_POD_NAME is Running, iperf3 container ready"
        return 0
      fi
    fi
    attempt=$(( attempt + 1 ))
    sleep "$interval"
  done
  log_error "pod $K8S_TS_POD_NAME not running after ${max_wait}s"
  kubectl describe pod "$K8S_TS_POD_NAME" -n "$K8S_NAMESPACE" 2>/dev/null || true
  return 1
}

k8s_get_ts_ip() {
  local ip="" attempt=0 max=30
  while (( attempt < max )); do
    ip=$(kubectl exec "$K8S_TS_POD_NAME" -n "$K8S_NAMESPACE" \
      -c ts-sidecar -- tailscale ip -4 2>/dev/null) || true
    if [[ -n "$ip" && "$ip" =~ ^100\. ]]; then
      echo "$ip"
      return 0
    fi
    attempt=$(( attempt + 1 ))
    sleep 3
  done
  log_error "sidecar did not get Tailscale IP after $max attempts"
  return 1
}

k8s_ts_exec() {
  kubectl exec "$K8S_TS_POD_NAME" \
    -n "$K8S_NAMESPACE" \
    -c iperf3 \
    -- "$@"
}

k8s_cleanup_ts_pod() {
  log_info "cleaning up sidecar pod and secret"
  kubectl delete pod "$K8S_TS_POD_NAME" \
    -n "$K8S_NAMESPACE" \
    --ignore-not-found \
    --wait=false >/dev/null 2>&1 || true
  kubectl delete secret "$K8S_TS_SECRET_NAME" \
    -n "$K8S_NAMESPACE" \
    --ignore-not-found >/dev/null 2>&1 || true
}
