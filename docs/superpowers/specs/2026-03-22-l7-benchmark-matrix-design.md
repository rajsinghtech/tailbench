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

## Frontend Changes (website/index.html)

The existing website is a single-page vanilla JS app (~1120 lines) that renders `TAILBENCH_DATA` from `data.generated.js` as a filterable table with expandable detail rows. Changes needed:

### New Filter: Transport Mode

Add a new filter row between the existing Family and K8s filters:

```html
<div class="filter-bar" id="modeFilterBar">
  <label>Mode</label>
  <div class="pill-group" id="modeFilter">
    <!-- Dynamically populated from data -->
    <!-- Pills: All | L4 Kernel | L4 Userspace | L4 LB | L7 Ingress | L7 Serve | tsnet -->
  </div>
</div>
```

Detection logic (mirrors existing pattern for K8s/single-stream):
```js
var hasL7 = TAILBENCH_DATA.some(function(d) { return d.transport_mode && d.transport_mode.startsWith('l7-'); });
var hasFortio = TAILBENCH_DATA.some(function(d) { return d.fortio_result; });
var modes = {};
TAILBENCH_DATA.forEach(function(d) { if (d.transport_mode) modes[d.transport_mode] = true; });
```

Mode filter bar only shown when multiple transport modes exist in data. State persisted in URL hash as `mode=l7-ingress-h1`.

### Table Columns: L7 Metrics

When L7/fortio data is present, add new columns to the main table:

| Column | Sort Key | Content |
|--------|----------|---------|
| Transport | `transport_mode` | Mode tag (pill-style, color coded) |
| QPS | `qps` | Requests/sec from fortio |
| P50 Latency | `p50` | Median latency (ms) |
| P99 Latency | `p99` | Tail latency (ms) |
| HTTP | `http_version` | "1.1" or "2" badge |

These columns are **conditionally shown** (like the existing K8s columns) — only rendered when any entry in filtered data has `fortio_result`:

```js
var showFortio = filteredData.some(function(d) { return d.fortio_result; });
```

For entries without fortio data (pure iperf3 L4 tests), these cells show "—".

### Transport Mode Tags (CSS)

```css
.mode-tag {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 5px;
  border-radius: 4px;
  margin-left: 6px;
}
.mode-l4 { background: rgba(37, 99, 235, 0.1); color: var(--accent); }
.mode-l7 { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.mode-tsnet { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.mode-http2 { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
```

### Latency Bar Visualization

For L7 results, replace the bandwidth bar with a latency bar in the detail view:

```js
// Latency bars: lower is better, scale from 0 to maxLatency
var maxLat = Math.max(...filteredData.map(d => d.fortio_result ? d.fortio_result.p99_latency_ms : 0));
var barW = maxLat ? (entry.fortio_result.p50_latency_ms / maxLat * 85).toFixed(1) : 0;
```

Color scheme: green (<10ms), yellow (10-50ms), red (>50ms) — different from BW overhead thresholds.

### Detail Row: Fortio Section

When a result has `fortio_result`, the expandable detail row includes a new section:

```
┌─────────────────────────────────────────────────────────┐
│ HTTP Performance (fortio)                               │
│                                                         │
│ Transport: L7 Ingress   HTTP: 1.1   HA: single         │
│ Duration: 30s   Connections: 16   Target QPS: max       │
│                                                         │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Run  QPS      P50     P90     P99     P999   Errs   │ │
│ │ #1   12,450   1.2ms   3.4ms   8.1ms   15ms   0     │ │
│ │ #2   12,380   1.3ms   3.5ms   8.3ms   16ms   0     │ │
│ │ #3   12,510   1.1ms   3.3ms   7.9ms   14ms   0     │ │
│ │ Avg  12,447   1.2ms   3.4ms   8.1ms   15ms   0     │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                         │
│ Status Codes: 200: 374,100 | 502: 0                    │
│                                                         │
│ Overhead vs Baseline:                                   │
│  QPS: 15,200 → 12,447 (-18.1%)                         │
│  P50: 0.8ms → 1.2ms (+50%)                             │
│  P99: 4.2ms → 8.1ms (+93%)                             │
└─────────────────────────────────────────────────────────┘
```

### Stats Row Update

The 4 stat cards adapt based on filtered data:

- **If L7 mode filtered**: Replace "Avg BW Overhead" with "Avg P99 Latency", replace "Best/Highest Overhead" with "Lowest/Highest P99"
- **Mixed modes**: Show BW overhead stats (existing), add a 5th "L7 Avg QPS" card (grid changes to `repeat(5, 1fr)`)

### Data Generation Pipeline

`cmd/aggregate/main.go` → `result.Aggregate()` already walks all `*.json` files per provider. The new file path convention (`<instanceType>-<mode>.json`) is compatible — the aggregator uses `filepath.WalkDir` and matches `*.json`. No aggregator code changes needed for file discovery.

The `data.generated.js` format remains the same (`const TAILBENCH_DATA = [...]`). New fields (`transport_mode`, `http_version`, `ha_mode`, `fortio_result`) are simply additional JSON keys on each result object. The website JS reads them dynamically.

### URL Hash State Extension

```js
var state = {
  provider: 'all',
  family: 'all',
  mode: 'all',        // NEW
  sortKey: 'ts_bw',
  sortDir: 'desc',
  expanded: null,
  filterK8s: false
};
```

## Testing Strategy

### Unit Tests

**`internal/benchmark/fortio_test.go`**:
- Parse sample fortio JSON output (embed test fixtures)
- Verify `FortioResult` fields are correctly populated
- Test malformed JSON handling (empty output, truncated, non-JSON)
- Test fortio command construction for each mode (HTTP/1.1, HTTP/2, different QPS/connection counts)

**`internal/benchmark/modes_test.go`**:
- Verify mode dispatch routes to correct runner
- Test mode filtering by environment (L7 Ingress skipped for VMs, L7 Serve skipped for K8s)
- Test mode prerequisite checking (endpoint configured, etc.)

**`internal/benchmark/tsnet_runner_test.go`**:
- Test tsnet transport construction
- Verify fortio Go library integration with custom dialer
- Mock tsnet.Dial for unit testing without real tailnet

**`internal/result/types_test.go`**:
- Test `L7Overhead` computation
- Test `FortioResult` JSON round-trip serialization
- Verify backward compatibility — old results (no `transport_mode`) still parse correctly

**`internal/k8s/ingress_test.go`**:
- Test label-based resource discovery (mock K8s clientset)
- Test FQDN extraction from Ingress status and Service LB status
- Test missing resource handling (clear error messages)

**`internal/config/config_test.go`**:
- Test new config fields parse correctly
- Test mode validation (reject unknown modes)
- Test `l7_endpoints` optional/required logic per mode

### Integration Tests

**`internal/benchmark/fortio_integration_test.go`** (build tag: `integration`):
- Spin up a local fortio echo server
- Run fortio load against it via the FortioRunner
- Verify result parsing end-to-end
- Test HTTP/1.1 and HTTP/2 modes

**`internal/benchmark/tsnet_integration_test.go`** (build tag: `integration`):
- Create two tsnet servers in-process
- Run fortio load through tsnet.Dial transport
- Verify connectivity and result collection

### End-to-End Tests

**`e2e/l7_benchmark_test.go`** (build tag: `e2e`):
- Requires real K8s cluster with Tailscale operator
- Deploy fortio echo server + Ingress + Service LB
- Wait for TLS cert provisioning
- Run full benchmark through orchestrator with all L7 modes
- Verify result files written with correct transport_mode
- Verify aggregation includes new results
- Tear down test resources

**`e2e/website_test.go`** (build tag: `e2e`):
- Generate `data.generated.js` from test fixture results (mix of L4 and L7)
- Serve index.html via httptest server
- Use chromedp (headless Chrome) to verify:
  - Mode filter pills render correctly
  - Fortio columns appear when L7 data present
  - Fortio columns hidden when only L4 data
  - Detail row shows fortio section for L7 entries
  - Sort by QPS/P99 works
  - URL hash persistence for mode filter

### Test Fixtures

Create `testdata/` directory with:

```
testdata/
├── fortio_output_h1.json      # Sample fortio HTTP/1.1 JSON output
├── fortio_output_h2.json      # Sample fortio HTTP/2 JSON output
├── fortio_output_error.json   # Fortio output with connection errors
├── result_l4_kernel.json      # Complete L4 kernel result
├── result_l7_ingress_h1.json  # Complete L7 Ingress HTTP/1.1 result
├── result_l7_serve_h2.json    # Complete L7 Serve HTTP/2 result
├── result_tsnet.json          # Complete tsnet result
└── result_legacy.json         # Old-format result (no transport_mode) for backward compat
```

### CI Pipeline

Add to existing CI (if present) or create `.github/workflows/test.yml`:

```yaml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-go@v5
        with: { go-version: '1.22' }
      - run: go test ./internal/...

  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-go@v5
      - run: |
          # Install fortio for integration tests
          go install fortio.org/fortio@latest
      - run: go test -tags=integration ./internal/...

  website:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-go@v5
      - run: |
          # Generate test data and validate website renders
          go run cmd/aggregate/main.go
          # Basic HTML validation
          npx html-validate website/index.html
```

### Test Coverage Targets

| Package | Target | Key Coverage Areas |
|---------|--------|--------------------|
| `benchmark/fortio` | 90% | JSON parsing, command construction, error paths |
| `benchmark/modes` | 85% | Mode dispatch, filtering, prerequisite checks |
| `benchmark/tsnet_runner` | 75% | Transport setup (mocked), integration with fortio lib |
| `k8s/ingress` | 85% | Discovery, FQDN extraction, error handling |
| `result/types` | 90% | Serialization, overhead computation, backward compat |
| `config` | 85% | New field parsing, validation |

## Implementation Order

1. Fortio runner (`fortio.go`) + unit tests — parse JSON output, run load tests via Executor
2. Result schema extension — `TransportMode`, `FortioResult`, `L7Overhead` + serialization tests
3. Config extension — modes list, fortio settings, l7_endpoints + validation tests
4. Mode dispatcher (`modes.go`) + unit tests — route modes to appropriate runner, inner loop in orchestrator
5. K8s manifests for long-lived resources (Ingress, Service LB, fortio echo)
6. Update tailbench-tools Docker image to include fortio binary
7. L7 Ingress benchmark flow (K8s) with TLS warm-up + integration test
8. L4 LB benchmark flow (K8s)
9. L7 Serve benchmark flow (VM) with TLS warm-up
10. tsnet runner (`tsnet_runner.go`) + integration test — in-process Go library approach
11. L4 userspace mode toggle (pod rebuild / tailscaled restart)
12. HA ProxyGroup testing — scale replicas, wait for ready, benchmark
13. ACL extension in tailnet manager
14. Result file path convention and aggregator updates
15. Website frontend changes — mode filter, fortio columns, detail section, latency bars
16. Website e2e tests — chromedp validation of new UI elements
17. Test fixtures and CI pipeline updates
