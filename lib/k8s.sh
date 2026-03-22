#!/usr/bin/env bash
# Provider-agnostic Kubernetes operations for benchmarking

K8S_POD_NAME="${K8S_POD_NAME:-tailbench-iperf3}"
K8S_MANIFEST_DIR="$TAILBENCH_ROOT/manifests"

k8s_check_prereqs() {
  require_cmd kubectl
  if ! kubectl cluster-info &>/dev/null; then
    log_error "kubectl cannot reach cluster — run eks_get_kubeconfig first"
    return 1
  fi
}

k8s_ensure_namespace() {
  if ! kubectl get namespace "$EKS_NAMESPACE" &>/dev/null 2>&1; then
    log_info "creating namespace $EKS_NAMESPACE"
    kubectl create namespace "$EKS_NAMESPACE"
  fi
}

k8s_deploy_iperf_pod() {
  local az="${1:-$AWS_AZ}"
  log_info "deploying iperf3 pod in namespace $EKS_NAMESPACE"
  # Delete first to allow node selector changes across runs
  kubectl delete pod "$K8S_POD_NAME" -n "$EKS_NAMESPACE" --ignore-not-found --wait=false >/dev/null 2>&1 || true
  sed "s/REPLACE_AZ/$az/" "$K8S_MANIFEST_DIR/iperf3-pod.yaml" \
    | kubectl apply -n "$EKS_NAMESPACE" -f -
}

k8s_wait_for_pod() {
  local max_wait="${1:-120}"
  log_info "waiting for pod $K8S_POD_NAME to be Running (timeout: ${max_wait}s)"
  if ! kubectl wait pod/"$K8S_POD_NAME" \
    -n "$EKS_NAMESPACE" \
    --for=condition=Ready \
    --timeout="${max_wait}s" 2>/dev/null; then
    log_error "pod $K8S_POD_NAME not ready after ${max_wait}s"
    kubectl describe pod "$K8S_POD_NAME" -n "$EKS_NAMESPACE" 2>/dev/null || true
    return 1
  fi
  log_info "pod $K8S_POD_NAME is Running"
}

k8s_get_pod_ip() {
  local ip
  ip=$(kubectl get pod "$K8S_POD_NAME" \
    -n "$EKS_NAMESPACE" \
    -o jsonpath='{.status.podIP}')
  if [[ -z "$ip" ]]; then
    log_error "could not get pod IP for $K8S_POD_NAME"
    return 1
  fi
  echo "$ip"
}

k8s_exec() {
  kubectl exec "$K8S_POD_NAME" \
    -n "$EKS_NAMESPACE" \
    -- "$@"
}

k8s_cleanup_pod() {
  log_info "cleaning up pod $K8S_POD_NAME"
  kubectl delete pod "$K8S_POD_NAME" \
    -n "$EKS_NAMESPACE" \
    --ignore-not-found \
    --wait=false >/dev/null 2>&1 || true
}

# --- Tailscale sidecar pod functions ---

K8S_TS_POD_NAME="${K8S_TS_POD_NAME:-tailbench-iperf3-ts}"
K8S_TS_SECRET_NAME="tailbench-ts-authkey"

k8s_create_ts_secret() {
  local authkey="$1"
  kubectl delete secret "$K8S_TS_SECRET_NAME" \
    -n "$EKS_NAMESPACE" --ignore-not-found >/dev/null 2>&1 || true
  kubectl create secret generic "$K8S_TS_SECRET_NAME" \
    -n "$EKS_NAMESPACE" \
    --from-literal=authkey="$authkey"
  log_info "created secret $K8S_TS_SECRET_NAME"
}

k8s_deploy_ts_iperf_pod() {
  local az="${1:-$AWS_AZ}"
  log_info "deploying Tailscale sidecar iperf3 pod"
  sed "s/REPLACE_AZ/$az/" "$K8S_MANIFEST_DIR/iperf3-tailscale-pod.yaml" \
    | kubectl apply -n "$EKS_NAMESPACE" -f -
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
    phase=$(kubectl get pod "$K8S_TS_POD_NAME" -n "$EKS_NAMESPACE" \
      -o jsonpath='{.status.phase}' 2>/dev/null) || true
    if [[ "$phase" == "Running" ]]; then
      local iperf_ready
      iperf_ready=$(kubectl get pod "$K8S_TS_POD_NAME" -n "$EKS_NAMESPACE" \
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
  kubectl describe pod "$K8S_TS_POD_NAME" -n "$EKS_NAMESPACE" 2>/dev/null || true
  return 1
}

k8s_get_ts_ip() {
  local ip="" attempt=0 max=30
  while (( attempt < max )); do
    ip=$(kubectl exec "$K8S_TS_POD_NAME" -n "$EKS_NAMESPACE" \
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
    -n "$EKS_NAMESPACE" \
    -c iperf3 \
    -- "$@"
}

k8s_cleanup_ts_pod() {
  log_info "cleaning up sidecar pod and secret"
  kubectl delete pod "$K8S_TS_POD_NAME" \
    -n "$EKS_NAMESPACE" \
    --ignore-not-found \
    --wait=false >/dev/null 2>&1 || true
  kubectl delete secret "$K8S_TS_SECRET_NAME" \
    -n "$EKS_NAMESPACE" \
    --ignore-not-found >/dev/null 2>&1 || true
}
