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
