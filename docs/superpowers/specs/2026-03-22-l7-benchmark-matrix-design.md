# Full Transport Benchmark Matrix Design

## Overview

Extend tailbench to benchmark all Tailscale transport modes: tsnet (userspace WireGuard via Go), L4 (kernel/userspace WireGuard, operator Service LB), and L7 (operator Ingress, `tailscale serve`). Covers HTTP/1.1 vs HTTP/2, userspace vs kernel networking, and HA ProxyGroup scaling.

## Problem

Current tailbench only measures pod-to-pod / VM-to-VM throughput over kernel-mode Tailscale using iperf3. This misses the overhead introduced by:
- L7 HTTP reverse proxying (TLS termination, identity header injection)
- Operator-managed proxy pods (Service LB, Ingress)
- HTTP version differences (1.1 vs 2)
- Userspace vs kernel WireGuard
- tsnet Go-level networking (userspace WireGuard, no TUN device)
- ProxyGroup HA routing

## Benchmark Mode Matrix

| Mode | Environment | Tool | HTTP Version | Description |
|------|------------|------|-------------|-------------|
| `tsnet-userspace` | VM or Pod | fortio (Go API) | N/A | tsnet.Dial() — userspace WireGuard via Go net stack, no kernel TUN |
| `l4-kernel` | VM or Pod | iperf3 | N/A (raw TCP) | Kernel WireGuard via TUN device, direct Tailscale IP |
| `l4-userspace` | VM or Pod | iperf3 | N/A (raw TCP) | Userspace WireGuard (gVisor netstack), direct Tailscale IP |
| `l4-lb` | K8s only | fortio | N/A (TCP passthrough) | Operator Service LB, TCP DNAT through proxy pod |
| `l7-ingress-h1` | K8s only | fortio | HTTP/1.1 | Operator Ingress, TLS term, HTTP/1.1 reverse proxy to backend |
| `l7-ingress-h2` | K8s only | fortio | HTTP/2 (client→proxy) | Operator Ingress, HTTP/2 on client leg, HTTP/1.1 to backend |
| `l7-serve-h1` | VM only | fortio | HTTP/1.1 | `tailscale serve --https`, long-lived LE cert |
| `l7-serve-h2` | VM only | fortio | HTTP/2 (client→proxy) | `tailscale serve --https`, h2 client, HTTP/1.1 to backend |

**Note on HTTP/2 modes**: The `tailscale serve` reverse proxy (Go `httputil.ReverseProxy`) does not support end-to-end HTTP/2 to the backend. The h2 modes test HTTP/2 on the client-to-proxy leg only; the proxy always makes HTTP/1.1 connections to the backend. This is the expected behavior — these modes measure the overhead delta of h2 negotiation and multiplexing vs HTTP/1.1 on the client side.

**Note on tsnet**: This is NOT "L3" in the OSI sense. tsnet provides a full TCP/UDP stack via Go's userspace WireGuard implementation (wireguard-go + gVisor netstack). The key difference from `l4-userspace` is that tsnet bypasses `tailscaled` entirely — the WireGuard tunnel runs in-process.

Each mode includes a **baseline** test (same tool, direct pod IP / LAN IP, no Tailscale) to compute overhead delta.

### HA Dimension (K8s L7 only)

| HA Mode | Config |
|---------|--------|
| Single replica | Default Ingress, no ProxyGroup |
| ProxyGroup (2 replicas) | `tailscale.com/proxy-group: bench-ingress` |
| ProxyGroup (3 replicas) | Same, scaled up |

**Minimum operator version**: ProxyGroup with Ingress requires Tailscale operator v1.76+. The ProxyGroup CRD must be of type `ingress`.

### gRPC (deferred)

Fortio supports gRPC natively. gRPC over L4 should work; over L7 it is known broken (issues #9725, #18483). gRPC modes will be added as a follow-up after the HTTP matrix is validated.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────┐
│                  tailbench orchestrator              │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Provider  │  │Benchmark │  │  Result Pipeline  │  │
│  │ (existing)│  │  Runner  │  │   (existing)      │  │
│  └────┬─────┘  └────┬─────┘  └───────────────────┘  │
│       │              │                               │
│  ┌────┴─────┐  ┌────┴─────────────────┐             │
│  │L7 Resource│  │  Mode Dispatcher     │             │
│  │ Manager   │  │  ├─ IperfRunner      │  (existing) │
│  └──────────┘  │  ├─ FortioRunner      │  (new)      │
│                │  └─ TsnetRunner       │  (new)      │
│                └───────────────────────┘             │
└─────────────────────────────────────────────────────┘
```

### Long-Lived Infrastructure

```
K8s Cluster                          VM
┌──────────────────────┐   ┌──────────────────────────┐
│ fortio echo server   │   │ fortio echo server       │
│ (Deployment)         │   │ + tailscale serve --https │
│        │             │   │ (long-lived, cert cached) │
│   ClusterIP Service  │   └──────────────────────────┘
│        │             │
│   ┌────┴────┐        │
│   │ Ingress │ (L7)   │  ← long-lived, cert cached
│   │ Svc LB  │ (L4)   │  ← long-lived
│   └─────────┘        │
└──────────────────────┘
```

### New Code Components

1. **`internal/benchmark/fortio.go`** — Fortio load generator: shells out to `fortio load -json`, parses JSON result into `FortioResult`
2. **`internal/benchmark/tsnet_runner.go`** — In-process tsnet benchmark: uses fortio's Go library (`fortio.org/fortio/fhttp`) to run load through a `tsnet.Dial()` transport. Does NOT use the `Executor` interface (which is shell-based); instead operates at the Go `net.Conn` level directly
3. **`internal/k8s/ingress.go`** — Discover long-lived Ingress and Service LB resources by label query
4. **`internal/benchmark/modes.go`** — `BenchmarkMode` enum and dispatcher that routes to IperfRunner, FortioRunner, or TsnetRunner based on mode
5. **`internal/result/types.go`** — Extended with `TransportMode`, `HTTPVersion`, `HAMode`, `FortioResult`

### Benchmarking Tool: fortio

[fortio](https://github.com/fortio/fortio) (from the Istio project) chosen because:
- Built-in echo server (no separate backend needed)
- Supports HTTP/1.1, HTTP/2, gRPC
- Constant-QPS mode for consistent latency measurement
- JSON output for structured result parsing
- **Go library** (`fortio.org/fortio/fhttp`) for in-process use with tsnet
- Lightweight, deploys as a single binary/container
- Purpose-built for service mesh/proxy overhead measurement

### Fortio Installation

- **K8s bench container**: Update `ghcr.io/rajsinghtech/tailbench-tools` Dockerfile to include fortio binary alongside iperf3/mtr. The bench container runs fortio as the load client.
- **K8s echo server**: Separate `fortio/fortio:latest` Deployment (long-lived) as the backend target.
- **VM client**: Install fortio via cloud-init script (extend `internal/cloudinit/cloudinit.go` to include `apt-get install fortio` or download binary).
- **VM serve endpoint**: Long-lived VM with fortio pre-installed.
- **tsnet mode**: No installation needed — uses fortio's Go library as a dependency in the tailbench binary.

## Execution Flows

### Orchestrator Mode Dispatch

The orchestrator's `runProvider` loop gains an inner loop over configured `modes`. For each instance type:

```
for each instance_type:
    create_pair()
    for each mode in config.benchmark.modes:
        if mode not applicable to this environment: skip
        dispatch to appropriate runner
        write result to <rootDir>/<provider>/<family>/results/<instanceType>-<mode>.json
    destroy_pair()
```

Modes are filtered by environment: `l4-lb`, `l7-ingress-*` only run on K8s providers; `l7-serve-*` only on VM providers; `tsnet-userspace`, `l4-kernel`, `l4-userspace` run on both.

### tsnet-userspace

1. Orchestrator's tsnet server establishes connection to fortio echo server via `tsnet.Dial("tcp", "<target>:8080")`
2. Fortio Go library (`fhttp.RunHTTPTest`) runs load through the tsnet transport
3. This bypasses the shell-based `Executor` interface entirely — runs in-process
4. Baseline: same test via standard `net.Dial()` (no WireGuard)

### L4 kernel/userspace (VM/Pod)

1. Existing iperf3 flow: server listens on Tailscale IP, client connects
2. **Userspace toggle mechanism**:
   - **K8s pods**: Deploy a second pair with `TS_USERSPACE=true` in the sidecar env. Modify `BuildPod()` to accept a `userspace bool` parameter. This requires two separate pod pairs (kernel and userspace cannot coexist on the same pod).
   - **VMs**: Restart `tailscaled` with `--tun=userspace-networking` flag via SSH executor
3. Baseline: iperf3 over pod IP / LAN IP

### L4 LoadBalancer (K8s)

1. Discover Service LB FQDN from long-lived resource (label: `app.kubernetes.io/part-of: tailbench-l7`)
2. Fortio client pod: `fortio load -json -qps 0 -c 16 -t 30s http://<fqdn>:8080`
3. Baseline: fortio against ClusterIP directly (same cluster, no Tailscale proxy)

### L7 Ingress (K8s)

1. Discover Ingress FQDN from long-lived resource
2. **TLS cert warm-up**: Make a single HTTPS request and wait for successful TLS handshake (up to 60s) before starting benchmark. If cert not ready, retry with backoff.
3. Fortio client pod:
   - HTTP/1.1: `fortio load -json -qps 0 -c 16 -t 30s https://<fqdn>`
   - HTTP/2: `fortio load -json -qps 0 -c 16 -t 30s -h2 https://<fqdn>`
4. Baseline: fortio against ClusterIP (bypassing both Ingress and Tailscale)

**Note**: The baseline bypasses both the Tailscale tunnel and the HTTP reverse proxy. To isolate just the Tailscale overhead from the reverse proxy overhead, compare `l7-ingress-h1` results with `l4-lb` results (same Tailscale tunnel, with vs without HTTP proxy).

### L7 Serve (VM)

1. Long-lived VM running fortio echo + `tailscale serve --https=443 http://localhost:8080`
2. **TLS cert warm-up**: Same as K8s — verify HTTPS handshake succeeds before benchmark
3. Ephemeral client VM runs fortio against `https://<machine>.tailnet.ts.net`
4. Baseline: fortio against LAN IP directly

## Result Schema Extension

```go
type BenchmarkResult struct {
    // existing fields...
    TransportMode string `json:"transport_mode"` // "tsnet-userspace", "l4-kernel", etc.
    HTTPVersion   string `json:"http_version"`   // "1.1", "2", ""
    HAMode        string `json:"ha_mode"`         // "single", "proxygroup-2", ""

    FortioResult *FortioResult `json:"fortio_result,omitempty"`
}

type FortioResult struct {
    QPS            float64     `json:"qps"`
    AvgLatencyMs   float64     `json:"avg_latency_ms"`
    P50LatencyMs   float64     `json:"p50_latency_ms"`
    P90LatencyMs   float64     `json:"p90_latency_ms"`
    P99LatencyMs   float64     `json:"p99_latency_ms"`
    P999LatencyMs  float64     `json:"p999_latency_ms"`
    StatusCodes    map[int]int `json:"status_codes"`
    BytesPerSec    float64     `json:"bytes_per_sec"`
    ConnectionErrs int         `json:"connection_errors"`
}

// L7Overhead extends the existing Overhead concept for latency-based metrics
type L7Overhead struct {
    QPS struct {
        Baseline  float64 `json:"baseline"`
        Tailscale float64 `json:"tailscale"`
        DeltaPct  float64 `json:"delta_pct"`
    } `json:"qps"`
    P50Latency struct {
        Baseline  float64 `json:"baseline_ms"`
        Tailscale float64 `json:"tailscale_ms"`
        DeltaPct  float64 `json:"delta_pct"`
    } `json:"p50_latency"`
    P99Latency struct {
        Baseline  float64 `json:"baseline_ms"`
        Tailscale float64 `json:"tailscale_ms"`
        DeltaPct  float64 `json:"delta_pct"`
    } `json:"p99_latency"`
}
```

### Result File Paths

Results are written per mode to avoid collisions:

```
<rootDir>/<provider>/<family>/results/<instanceType>-<mode>.json
```

Example: `results/gke/n2-standard/results/n2-standard-4-l7-ingress-h1.json`

The aggregator in `internal/result/aggregator.go` must be updated to:
- Glob `*-<mode>.json` patterns
- Group results by `TransportMode` in the output

## Config Extension

```yaml
benchmark:
  # existing iperf config preserved
  iperf_duration: 30
  iperf_parallel: 4
  iperf_iterations: 3

  # new fortio config
  fortio_duration: 30
  fortio_connections: 16
  fortio_qps: 0          # 0 = max throughput
  fortio_iterations: 3

  modes:
    - tsnet-userspace
    - l4-kernel
    - l4-userspace
    - l4-lb
    - l7-ingress-h1
    - l7-ingress-h2
    - l7-serve-h1
    - l7-serve-h2

l7_endpoints:
  ingress_fqdn: ""      # discovered from cluster labels, or set explicitly
  serve_fqdn: ""        # must be set explicitly (long-lived VM hostname)
  cluster_label: "app.kubernetes.io/part-of=tailbench-l7"  # label selector for discovery
```

**Mode-endpoint requirements**: `l7-ingress-*` requires either `ingress_fqdn` or discoverable Ingress resource in cluster. `l7-serve-*` requires `serve_fqdn`. If a mode is listed but its endpoint is not configured/discoverable, the orchestrator skips it with a warning.

## ACL Requirements

The existing `tailnet.SetupACL()` uses `client.PolicyFile().Set()` which is a full replace. The new ACL fields must be merged into the existing policy document:

```jsonc
{
  // existing fields preserved...
  "grants": [
    // existing grants...
    {
      "src": ["tag:bench"],
      "dst": ["tag:bench-service"],
      "ip": ["*"]
    }
  ],
  "nodeAttrs": [
    {
      "target": ["tag:k8s"],
      "attr": ["funnel"]
    }
  ]
}
```

**Note**: Service auto-approval for the operator is handled via the `tailscale.com/tags` annotation on the Service/Ingress resource itself, not via an `autoApprovers.services` ACL field. The operator assigns the tag specified in the annotation when creating the proxy pod. ACL grants then control access to that tag.

## Long-Lived Resource Management

### K8s Ingress + Service LB

Deployed as Flux-managed resources in kubernetes-manifests repo:

```yaml
# fortio echo server
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bench-echo
  namespace: tailbench
  labels:
    app.kubernetes.io/part-of: tailbench-l7
    app: bench-echo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bench-echo
  template:
    metadata:
      labels:
        app: bench-echo
    spec:
      containers:
      - name: fortio
        image: fortio/fortio:latest
        args: ["server"]
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8079
          name: grpc
---
# ClusterIP for backend
apiVersion: v1
kind: Service
metadata:
  name: bench-echo
  namespace: tailbench
  labels:
    app.kubernetes.io/part-of: tailbench-l7
spec:
  selector:
    app: bench-echo
  ports:
  - port: 8080
    targetPort: 8080
    name: http
---
# L7 Ingress (Tailscale operator)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bench-echo-ingress
  namespace: tailbench
  labels:
    app.kubernetes.io/part-of: tailbench-l7
spec:
  ingressClassName: tailscale
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bench-echo
            port:
              number: 8080
---
# L4 Service LoadBalancer (Tailscale operator)
apiVersion: v1
kind: Service
metadata:
  name: bench-echo-lb
  namespace: tailbench
  labels:
    app.kubernetes.io/part-of: tailbench-l7
  annotations:
    tailscale.com/expose: "true"
    tailscale.com/hostname: bench-echo-lb
    tailscale.com/tags: "tag:bench-service"
spec:
  type: LoadBalancer
  loadBalancerClass: tailscale
  selector:
    app: bench-echo
  ports:
  - port: 8080
    targetPort: 8080
    name: http
```

### Long-Lived Resource Discovery

The orchestrator discovers long-lived resources by querying the cluster:

1. List Ingress resources with label `app.kubernetes.io/part-of=tailbench-l7`
2. Extract the tailnet FQDN from the Ingress status (or via `tailscale.com/hostname` annotation)
3. List Service LBs with the same label for L4 endpoint discovery
4. Store discovered FQDNs for the benchmark run

**Tailnet alignment**: Long-lived resources must be on the same tailnet as the benchmark run. If tailbench creates ephemeral tailnets per run, the long-lived resources won't be reachable. The solution: use tailnet persistence (`.tailbench/tailnet.json`) so the same tailnet is reused across runs — this is already implemented.

### VM Serve Endpoint

Provisioned once, state persisted to `.tailbench/serve-endpoints.json`:

```bash
# On long-lived VM:
fortio server -http-port 8080 &
tailscale serve --https=443 http://localhost:8080
```

## Error Handling

- **Let's Encrypt rate limits**: Detect cert failures (HTTP 502, TLS handshake timeout), skip L7 tests gracefully, log warning. Rate limits: 50 certs/week per tailnet domain, 5/week for same hostname.
- **HTTP/2 failures on L7**: Known limitation (issues #9725, #18483). Capture the failure as a data point (status code, error message) rather than aborting. The `l7-ingress-h2` mode may produce partial results — this is expected and valuable data.
- **TLS cert warm-up**: Before L7 benchmarks, make a single HTTPS request with 60s timeout. Retry with exponential backoff (1s, 2s, 4s...) up to 5 attempts. Fail the mode with clear error if cert never provisions.
- **ProxyGroup readiness**: Wait for all replicas to reach Ready state (poll every 5s, timeout 120s) before benchmarking.
- **Fortio result parsing**: Fortio outputs JSON natively (`-json` flag), parse directly into `FortioResult`. If parse fails, log raw output and skip.
- **Long-lived resource discovery**: Label-based query (`app.kubernetes.io/part-of: tailbench-l7`), fail with clear error if resources not found. Suggest running manifests deployment.
- **tsnet dial failures**: Retry with backoff, distinguish between DNS resolution and connection errors.
- **Mode skip logic**: If a mode's prerequisites aren't met (endpoint not configured, wrong environment), skip gracefully with a log message rather than failing the entire run.

## Implementation Order

1. Fortio runner (`fortio.go`) — parse JSON output, run load tests via Executor
2. Result schema extension — `TransportMode`, `FortioResult`, `L7Overhead`
3. Config extension — modes list, fortio settings, l7_endpoints
4. Mode dispatcher (`modes.go`) — route modes to appropriate runner, inner loop in orchestrator
5. K8s manifests for long-lived resources (Ingress, Service LB, fortio echo)
6. Update tailbench-tools Docker image to include fortio binary
7. L7 Ingress benchmark flow (K8s) with TLS warm-up
8. L4 LB benchmark flow (K8s)
9. L7 Serve benchmark flow (VM) with TLS warm-up
10. tsnet runner (`tsnet_runner.go`) — in-process Go library approach
11. L4 userspace mode toggle (pod rebuild / tailscaled restart)
12. HA ProxyGroup testing — scale replicas, wait for ready, benchmark
13. ACL extension in tailnet manager
14. Result file path convention and aggregator updates
15. Website updates for new result types
