# K8s Benchmark Providers Design

Add EKS, GKE, and AKS providers to tailbench that provision managed Kubernetes clusters, deploy benchmark pods with Tailscale kernel-mode sidecars, and run the same iperf3/mtr benchmark suite used for VM tests. Results measure both container-specific overhead (CNI baseline vs Tailscale) and enable direct comparison against VM results for the same underlying instance type.

## Architecture

Three new providers (`eks`, `gke`, `aks`) implement the existing `Provider` interface. A shared `internal/k8s/` package holds common pod specs, sidecar configuration, and the kubectl exec transport. The orchestrator and runner require refactoring to support a non-SSH executor transport.

```
Orchestrator
├── aws (VM)     ├── gcp (VM)     ├── azure (VM)
├── eks (K8s)    ├── gke (K8s)    ├── aks (K8s)
│                                  │
└── internal/k8s/ (shared)
    ├── pods.go        — pod spec builder (bench + TS sidecar)
    ├── kubeexec.go    — KubeExecExecutor
    └── images.go      — container image constants
```

## Provider Lifecycle

Each K8s provider maps to the `Provider` interface:

### SetupNetworking — Create cluster

Provisions a managed K8s cluster via Pulumi in its own VPC. Includes a small default node pool for system pods. Returns `NetworkingOutput` containing cluster name, kubeconfig (base64), and namespace.

| Cloud | Pulumi Package | Cluster Type |
|-------|---------------|--------------|
| EKS | `pulumi-eks` | `eks.Cluster` |
| GKE | `pulumi-gcp` | `container.Cluster` |
| AKS | `pulumi-azure-native` | `containerservice.ManagedCluster` |

### CreatePair(instanceType) — Node group + pods

1. Create a dedicated node group with 2 nodes of `instanceType`
2. Wait for nodes Ready (timeout: `ReadyTimeout` from config, default 300s)
3. Create K8s Secret `tailbench-auth` with the Tailscale auth key
4. Deploy server pod on node 1, client pod on node 2 (pod anti-affinity)
5. Wait for pods Running (timeout: `ReadyTimeout`)
6. Return `PairOutput` with pod IPs and K8s metadata

Anti-affinity rule ensures server and client land on different nodes so benchmarks measure real network traffic, not loopback.

K8s providers ignore the SSH-specific fields in `PairOptions` (`SSHKeyPath`, `SSHPubKey`, `SSHUser`). The auth key is passed through `PairOptions.UserData` as a raw string (not cloud-init). Pod hostnames are computed by the orchestrator (via `safeHostname()`) and passed through `PairOptions` — the same way VM hostnames are computed today. The K8s pod spec builder in `internal/k8s/pods.go` receives the pre-computed hostname, so it does not need access to `safeHostname()`.

### Orchestrator: runProvider() changes for K8s

The orchestrator's `runProvider()` loop currently renders cloud-init for every provider and passes it as `PairOptions.UserData`. For K8s providers, this must be skipped:

```go
var userData string
if isK8sProvider(providerName) {
    // K8s providers receive the raw auth key — no cloud-init
    userData = authKey
} else {
    userData = cloudinit.Render(authKey, serverHostname, clientHostname, ...)
}
```

Detection uses the provider name (e.g., `eks`, `gke`, `aks`). The rest of `runProvider()` (family iteration, resume logic, result writing) remains unchanged.

### PairOutput for K8s

Existing `PairOutput` fields are reused where applicable. New fields are added for K8s:

```go
type PairOutput struct {
    // Existing fields (used by both VM and K8s)
    ServerName  string // pod name for K8s, VM hostname for VMs
    ClientName  string
    ServerLANIP string // pod CIDR IP (baseline benchmark target)
    ClientLANIP string
    StackName   string

    // Existing fields (VM-only, empty for K8s)
    ServerIP         string // public IP (SSH target) — empty for K8s
    ClientIP         string
    ServerInstanceID string
    ClientInstanceID string
    ServerENIID      string
    ClientENIID      string

    // New fields (K8s-only, empty for VMs)
    Namespace  string // K8s namespace
    Kubeconfig string // base64-encoded kubeconfig
}
```

The orchestrator uses `Namespace` and `Kubeconfig` (non-empty) to detect K8s providers and construct `KubeExecExecutor` instead of SSH clients.

### DestroyPair(instanceType) — Cleanup

Delete pods and the dedicated node group for that instance type.

### TeardownNetworking — Delete cluster

Destroy the entire cluster Pulumi stack.

### ListFamilies / ListInstances / GetVCPUs

Reuse the same cloud CLI commands as the corresponding VM providers. Instance types are identical — they're just used as K8s node sizes instead of standalone VMs.

### IsQuotaError

Detect node pool provisioning failures: insufficient capacity, quota exceeded, SKU not available. Reuse the same error strings as the corresponding VM provider plus K8s-specific scheduling errors.

## Pod Specification

Kernel-mode Tailscale sidecar (userspace=false), matching existing patterns from `kubernetes-manifests/`.

### Init container — sysctl setup

```yaml
initContainers:
- name: sysctler
  image: ghcr.io/tailscale/tailscale:latest
  command: ["/bin/sh", "-c"]
  args:
    - >-
      sysctl -w net.ipv4.ip_forward=1 &&
      if sysctl net.ipv6.conf.all.forwarding; then
        sysctl -w net.ipv6.conf.all.forwarding=1;
      fi
  securityContext:
    privileged: true
```

### Containers

```yaml
containers:
- name: bench
  image: tailbench-tools:latest
  command: ["sleep", "infinity"]

- name: tailscale
  image: ghcr.io/tailscale/tailscale:latest
  securityContext:
    privileged: true
  env:
    - name: TS_USERSPACE
      value: "false"
    - name: TS_KUBE_SECRET
      value: ""
    - name: TS_STATE_DIR
      value: "/dev/shm"
    - name: TS_DEBUG_FIREWALL_MODE
      value: "auto"
    - name: TS_AUTHKEY
      valueFrom:
        secretKeyRef:
          name: tailbench-auth
          key: TS_AUTHKEY
    - name: TS_HOSTNAME
      value: "tb-{provider}-{role}-{safeType}"
    - name: TS_EXTRA_ARGS
      value: "--advertise-tags=tag:bench --accept-routes"
    - name: TS_ACCEPT_DNS
      value: "true"
```

Key decisions:
- `privileged: true` for kernel-mode networking
- `TS_STATE_DIR: /dev/shm` — ephemeral tmpfs, no persistence needed for short-lived benchmark pods
- `TS_KUBE_SECRET: ""` — no K8s secret state storage
- Auth key injected via K8s Secret created by the provider from the orchestrator's tailnet auth key

### RBAC

Each K8s provider creates a dedicated namespace (`tailbench`) with a ServiceAccount that has permission to create/read secrets (for `tailbench-auth`). The kubeconfig from the managed cluster has admin access, which covers all operations.

### Benchmark image

```dockerfile
FROM ubuntu:24.04
RUN apt-get update && apt-get install -y iperf3 mtr-tiny jq curl && rm -rf /var/lib/apt/lists/*
CMD ["sleep", "infinity"]
```

The benchmark image is a prerequisite — built and pushed manually before running K8s benchmarks. Each cloud needs the image in its registry (ECR, Artifact Registry, ACR). Image URIs are configured via `BENCH_IMAGE` env var.

## Benchmark Runner Changes

The runner currently depends on `*sshclient.Client`. We introduce an `Executor` interface to make the transport pluggable.

### Executor interface

```go
// internal/benchmark/executor.go
type Executor interface {
    Run(ctx context.Context, cmd string) (stdout, stderr string, err error)
    Close() error
}
```

The signature matches the existing `sshclient.Client.Run()` return values (stdout, stderr, error) so the SSHExecutor wrapper is trivial.

### Implementations

**SSHExecutor** — wraps existing `*sshclient.Client`. Delegates directly, no behavior change.

**KubeExecExecutor** — uses `client-go`'s `remotecommand` package:

```go
type KubeExecExecutor struct {
    clientset  *kubernetes.Clientset
    restConfig *rest.Config
    namespace  string
    podName    string
    container  string // "bench"
}
```

### Runner struct changes

The `Runner` struct fields change from concrete SSH types to the `Executor` interface:

```go
type Runner struct {
    Server Executor  // was *sshclient.Client
    Client Executor  // was *sshclient.Client
    Config RunConfig
}
```

All helper functions (`startIPerfServer`, `runIPerfTest`, `runMTR`, `collectSystemConfig`, etc.) that currently take `*sshclient.Client` are updated to take `Executor`. Since `Executor.Run()` has the same signature as `sshclient.Client.Run()`, these changes are mechanical — only the parameter type changes, not the call sites.

### Tailscale setup: VM vs K8s paths

The runner's `RunFull()` currently calls `TailscaleUp()`, `GetTailscaleIP()`, `WaitForPeer()`, and `WaitForDirect()` mid-benchmark. For K8s, Tailscale is already running via the sidecar — these calls need to behave differently.

Solution: Add a `SkipTailscaleSetup bool` field to `RunConfig`. When true (set by K8s providers):
- Skip `TailscaleUp()` (sidecar handles auth via env vars)
- `GetTailscaleIP()` still runs — it executes `tailscale ip -4` which works identically via kubectl exec into the `tailscale` container
- `WaitForPeer()` and `WaitForDirect()` still run unchanged

For `GetTailscaleIP` and `WaitForPeer`/`WaitForDirect`, the K8s provider provides a second executor targeting the `tailscale` container (not `bench`). The runner needs a `TailscaleExecutor` field alongside `Server`/`Client` for Tailscale-specific commands:

```go
type Runner struct {
    Server          Executor
    Client          Executor
    ServerTailscale Executor // targets tailscale container (K8s) or same SSH client (VM)
    ClientTailscale Executor
    Config          RunConfig
}
```

For VM providers, `ServerTailscale == Server` (same SSH connection). For K8s, it's a separate `KubeExecExecutor` targeting the `tailscale` container.

### LAN verification adaptation

`verifyLAN()` currently checks `nc -z -w 2 {ip} 22` (SSH port). For K8s pods, port 22 isn't open. Change to `ping -c 1 -W 2 {ip}` which verifies L3 reachability and works for both VM and K8s. The purpose of `verifyLAN` is a connectivity gate before starting iperf3, not a service readiness check — ping is sufficient.

### System config collection

Some host-level commands (`ethtool -k`, `cat /sys/devices/system/cpu/.../scaling_governor`) return incomplete or misleading data inside containers. For K8s benchmarks:
- `kernel_version`, `tcp_congestion_control`, `tcp_rmem`, `tcp_wmem`, `mtu_*` — still valid (shared kernel)
- `cpu_governor` — may show "unknown" (no cpufreq in container), acceptable
- `gro_udp_forwarding` — skip if ethtool unavailable, report as "unknown"
- Add new field: `container_runtime` — detect via `/proc/1/cgroup` or similar

### Result differentiation

Add `Environment` field to `BenchmarkResult`:

```go
type BenchmarkResult struct {
    // ... existing fields ...
    Environment string `json:"environment"` // "vm" or "container"
}
```

The orchestrator sets this field in `runBenchmark()` after `RunFull()` returns, alongside the other metadata fields (cloud_provider, instance_type, etc.). Detection: `pair.Namespace != ""` → `"container"`, else `"vm"`.

## Orchestrator Changes

The orchestrator requires changes in `runBenchmark()`:

### Current flow (VM)
1. `sshclient.DialWithKeyFile()` to server and client public IPs
2. `WaitForReady()` — polls for `/tmp/tailbench-ready`
3. Construct `benchmark.Runner` with SSH clients
4. Call `runner.RunFull()`

### New flow (K8s)
1. Detect K8s provider: `pair.Namespace != ""` (non-empty = K8s)
2. Parse kubeconfig from `pair.Kubeconfig`
3. Construct `KubeExecExecutor` for bench container and tailscale container on each pod
4. Skip `WaitForReady()` — pods are already Running (CreatePair waited)
5. Construct `benchmark.Runner` with KubeExec executors and `SkipTailscaleSetup: true`
6. Call `runner.RunFull()`

The provider detection is a simple branch in `runBenchmark()`. All other orchestrator code (tailnet management, result writing, resume logic, auth key refresh) remains unchanged.

## Config Additions

K8s providers are activated via `CLOUD_PROVIDER` just like VM providers:

```
CLOUD_PROVIDER=gcp,gke      # run both VM and K8s on GCP
CLOUD_PROVIDER=eks,gke,aks   # K8s only, all three clouds
CLOUD_PROVIDER=aws,eks       # AWS VMs + EKS containers
```

Additional environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `BENCH_IMAGE` | `tailbench-tools:latest` | Benchmark container image (full registry URI) |
| `TS_IMAGE` | `ghcr.io/tailscale/tailscale:latest` | Tailscale sidecar image |

No separate `ENABLE_*` flags — inclusion in `CLOUD_PROVIDER` is sufficient.

## Cloud-Specific Details

| | EKS | GKE | AKS |
|---|---|---|---|
| Pulumi package | `pulumi-eks` | `pulumi-gcp` | `pulumi-azure-native` |
| Node group | Managed node group | Node pool | Agent pool |
| Container registry | ECR | Artifact Registry | ACR |
| Kubeconfig | `eks.Cluster.kubeconfig` | `gcloud container clusters get-credentials` | `az aks get-credentials` |
| Networking | VPC + 2 subnets (AZ req) | VPC-native with alias IPs | VNet + subnet |

## New Packages

- `internal/provider/eks.go` — EKS provider implementation
- `internal/provider/gke.go` — GKE provider implementation
- `internal/provider/aks.go` — AKS provider implementation
- `internal/k8s/pods.go` — shared pod spec builder (init container, bench container, TS sidecar)
- `internal/k8s/kubeexec.go` — KubeExecExecutor implementation
- `internal/k8s/images.go` — container image constants
- `internal/benchmark/executor.go` — Executor interface, SSHExecutor wrapper
- `docker/tailbench-tools/Dockerfile` — benchmark container image

## Dependencies

New Go modules:
- `k8s.io/client-go` — K8s API client, remotecommand for kubectl exec
- `k8s.io/apimachinery` — K8s types
- Cloud-specific Pulumi providers for EKS/GKE/AKS (if not already present)
