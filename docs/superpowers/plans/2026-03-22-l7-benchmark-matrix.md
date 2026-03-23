# L7 Benchmark Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend tailbench to benchmark all Tailscale transport modes (tsnet, L4 kernel/userspace/LB, L7 Ingress/Serve) with HTTP/1.1 and HTTP/2 coverage using fortio.

**Architecture:** Add a mode dispatcher that routes benchmark runs to IperfRunner (existing), FortioRunner (new), or TsnetRunner (new) based on `transport_mode` config. Long-lived L7 infrastructure (Ingress, Service LB, fortio echo) is deployed once via kubernetes-manifests; ephemeral clients connect per run. Results extend existing schema with `TransportMode`, `FortioResult`, and `L7Overhead`.

**Tech Stack:** Go 1.26, fortio (CLI + Go library), Kubernetes client-go, Tailscale tsnet, vanilla JS frontend

**Spec:** `docs/superpowers/specs/2026-03-22-l7-benchmark-matrix-design.md`

**Branch:** `pulumi-go-migration`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `internal/benchmark/fortio.go` | Parse fortio JSON output, construct fortio CLI commands |
| `internal/benchmark/fortio_test.go` | Unit tests for fortio parsing and command construction |
| `internal/benchmark/modes.go` | BenchmarkMode type, mode validation, environment filtering |
| `internal/benchmark/modes_test.go` | Unit tests for mode logic |
| `internal/k8s/ingress.go` | Discover Ingress/Service LB resources by label, extract FQDNs |
| `internal/k8s/ingress_test.go` | Unit tests with fake K8s clientset |
| `testdata/fortio_output_h1.json` | Fixture: sample fortio HTTP/1.1 JSON output |
| `testdata/fortio_output_error.json` | Fixture: fortio output with connection errors |
| `testdata/result_legacy.json` | Fixture: old-format result for backward compat |

### Modified Files
| File | Changes |
|------|---------|
| `internal/result/types.go:3-26` | Add `TransportMode`, `HTTPVersion`, `HAMode`, `FortioResult`, `L7Overhead` to `BenchmarkResult` |
| `internal/result/writer.go:57-78` | Support mode suffix in result filename |
| `internal/config/config.go:15-45,47-96` | Add fortio config, modes list, l7_endpoints to `Config` and `yamlConfig` |
| `internal/benchmark/runner.go:58-204` | Extract iperf logic; add `RunFortio` method for HTTP benchmarks |
| `internal/k8s/pods.go:31-83` | Add `Userspace` field to `PodConfig`, toggle `TS_USERSPACE` env var |
| `internal/orchestrator/orchestrator.go:389-565` | Add mode dispatch loop, call fortio runner for L7/L4-LB modes |
| `internal/tailnet/tailnet.go` | Add `tag:bench-service` grant and `funnel` nodeAttr to ACL |
| `config.yaml` | Add fortio config, modes, l7_endpoints sections |
| `website/index.html` | Mode filter, fortio columns, detail section, latency bars |
| `go.mod` | Add `fortio.org/fortio` dependency |

---

### Task 1: Test Fixtures

**Files:**
- Create: `testdata/fortio_output_h1.json`
- Create: `testdata/fortio_output_error.json`
- Create: `testdata/result_legacy.json`

- [ ] **Step 1: Create fortio HTTP/1.1 output fixture**

Create `testdata/fortio_output_h1.json` with realistic fortio JSON output. This is the format produced by `fortio load -json`:

```json
{
  "Labels": "bench-echo",
  "StartTime": "2026-03-22T10:00:00Z",
  "RequestedQPS": "0",
  "RequestedDuration": "30s",
  "ActualQPS": 12450.5,
  "ActualDuration": 30000000000,
  "NumThreads": 16,
  "Version": "1.63.0",
  "DurationHistogram": {
    "Count": 373515,
    "Min": 0.000234,
    "Max": 0.045123,
    "Sum": 456.789,
    "Avg": 0.001223,
    "StdDev": 0.002345,
    "Percentiles": [
      {"Percentile": 50, "Value": 0.001200},
      {"Percentile": 75, "Value": 0.001800},
      {"Percentile": 90, "Value": 0.003400},
      {"Percentile": 99, "Value": 0.008100},
      {"Percentile": 99.9, "Value": 0.015000}
    ]
  },
  "RetCodes": {"200": 373515},
  "Sizes": {"Count": 373515, "Min": 256, "Max": 256, "Sum": 95619840, "Avg": 256},
  "SocketCount": 16,
  "AbortOn": 0,
  "URL": "https://bench-echo.tailnet.ts.net:443/echo",
  "Destination": "bench-echo.tailnet.ts.net:443",
  "BytesSent": 37351500,
  "BytesReceived": 95619840
}
```

- [ ] **Step 2: Create fortio error output fixture**

Create `testdata/fortio_output_error.json`:

```json
{
  "Labels": "bench-echo",
  "StartTime": "2026-03-22T10:00:00Z",
  "RequestedQPS": "0",
  "RequestedDuration": "30s",
  "ActualQPS": 450.2,
  "ActualDuration": 30000000000,
  "NumThreads": 16,
  "DurationHistogram": {
    "Count": 13506,
    "Min": 0.001234,
    "Max": 2.500000,
    "Sum": 1234.567,
    "Avg": 0.091400,
    "StdDev": 0.345000,
    "Percentiles": [
      {"Percentile": 50, "Value": 0.025000},
      {"Percentile": 75, "Value": 0.080000},
      {"Percentile": 90, "Value": 0.250000},
      {"Percentile": 99, "Value": 1.200000},
      {"Percentile": 99.9, "Value": 2.100000}
    ]
  },
  "RetCodes": {"200": 12500, "502": 1006},
  "SocketCount": 16,
  "AbortOn": 0
}
```

- [ ] **Step 3: Create legacy result fixture**

Create `testdata/result_legacy.json` — a result file in the old format (no `transport_mode` field) to test backward compatibility:

```json
{
  "cloud_provider": "gcp",
  "instance_family": "c3",
  "instance_type": "c3-standard-4",
  "vcpus": 4,
  "region": "us-central1",
  "zone": "us-central1-a",
  "date": "2026-03-20",
  "tailscale_version": "1.96.3",
  "kernel_version": "6.1.0",
  "connection_type": "direct",
  "ena_express": false,
  "environment": "vm",
  "system_config": null,
  "test_config": {"iperf_duration_sec": 30, "iperf_parallel_streams": 4, "iperf_iterations": 3, "mtr_cycles": 100},
  "baseline_tcp": {"runs": [{"bandwidth_mbps": 9500, "retransmits": 10, "duration_sec": 30, "bytes_transferred": 35625000000}], "summary": {"bandwidth_mbps_avg": 9500, "bandwidth_mbps_min": 9500, "bandwidth_mbps_max": 9500, "bandwidth_mbps_stddev": 0, "retransmits_avg": 10}},
  "tailscale_tcp": {"runs": [{"bandwidth_mbps": 9000, "retransmits": 15, "duration_sec": 30, "bytes_transferred": 33750000000}], "summary": {"bandwidth_mbps_avg": 9000, "bandwidth_mbps_min": 9000, "bandwidth_mbps_max": 9000, "bandwidth_mbps_stddev": 0, "retransmits_avg": 15}},
  "overhead": {"bandwidth_pct": 5.26, "retransmits_pct": -50},
  "baseline_mtr": {"target_ip": "10.0.0.2", "hops": []},
  "tailscale_mtr": {"target_ip": "100.64.0.2", "hops": []}
}
```

- [ ] **Step 4: Commit**

```bash
git add testdata/
git commit -m "Add test fixtures for fortio output and legacy results"
```

---

### Task 2: Result Schema Extension

**Files:**
- Modify: `internal/result/types.go:3-26`

- [ ] **Step 1: Write test for new fields and backward compat**

Create `internal/result/types_test.go`:

```go
package result

import (
	"encoding/json"
	"os"
	"testing"
)

func TestBenchmarkResultJSON(t *testing.T) {
	r := &BenchmarkResult{
		CloudProvider: "gcp",
		InstanceType:  "c3-standard-4",
		TransportMode: "l7-ingress-h1",
		HTTPVersion:   "1.1",
		HAMode:        "single",
		FortioResult: &FortioResult{
			QPS:          12450.5,
			AvgLatencyMs: 1.223,
			P50LatencyMs: 1.200,
			P90LatencyMs: 3.400,
			P99LatencyMs: 8.100,
			P999LatencyMs: 15.0,
			StatusCodes:  map[int]int{200: 373515},
			BytesPerSec:  3187328.0,
			ConnectionErrs: 0,
		},
	}
	data, err := json.Marshal(r)
	if err != nil {
		t.Fatal(err)
	}
	var decoded BenchmarkResult
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatal(err)
	}
	if decoded.TransportMode != "l7-ingress-h1" {
		t.Errorf("TransportMode = %q, want %q", decoded.TransportMode, "l7-ingress-h1")
	}
	if decoded.FortioResult.QPS != 12450.5 {
		t.Errorf("QPS = %f, want 12450.5", decoded.FortioResult.QPS)
	}
}

func TestLegacyResultBackwardCompat(t *testing.T) {
	data, err := os.ReadFile("../../testdata/result_legacy.json")
	if err != nil {
		t.Fatal(err)
	}
	var r BenchmarkResult
	if err := json.Unmarshal(data, &r); err != nil {
		t.Fatal(err)
	}
	if r.TransportMode != "" {
		t.Errorf("TransportMode = %q, want empty for legacy", r.TransportMode)
	}
	if r.FortioResult != nil {
		t.Error("FortioResult should be nil for legacy")
	}
	if r.CloudProvider != "gcp" {
		t.Errorf("CloudProvider = %q, want gcp", r.CloudProvider)
	}
}

func TestComputeL7Overhead(t *testing.T) {
	baseline := &FortioResult{QPS: 15000, P50LatencyMs: 0.8, P99LatencyMs: 4.2}
	tailscale := &FortioResult{QPS: 12450, P50LatencyMs: 1.2, P99LatencyMs: 8.1}
	o := ComputeL7Overhead(baseline, tailscale)
	if o.QPS.DeltaPct > -15 || o.QPS.DeltaPct < -20 {
		t.Errorf("QPS delta = %.1f%%, want ~-17%%", o.QPS.DeltaPct)
	}
	if o.P99Latency.DeltaPct < 80 || o.P99Latency.DeltaPct > 100 {
		t.Errorf("P99 delta = %.1f%%, want ~93%%", o.P99Latency.DeltaPct)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/result/ -v -run TestBenchmarkResultJSON`
Expected: FAIL — `TransportMode` field doesn't exist yet

- [ ] **Step 3: Add new types to types.go**

Add after `BenchmarkResult` struct (after line 26 in `internal/result/types.go`):

```go
// Add these fields to BenchmarkResult struct, after Environment field (line 15):
	TransportMode string        `json:"transport_mode,omitempty"` // "tsnet-userspace", "l4-kernel", etc.
	HTTPVersion   string        `json:"http_version,omitempty"`   // "1.1", "2", ""
	HAMode        string        `json:"ha_mode,omitempty"`        // "single", "proxygroup-2", ""
	FortioResult  *FortioResult `json:"fortio_result,omitempty"`
	L7Overhead    *L7Overhead   `json:"l7_overhead,omitempty"`
```

Add new types after `MTRHop` struct (after line 87):

```go
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

type L7Overhead struct {
	QPS struct {
		Baseline  float64 `json:"baseline"`
		Tailscale float64 `json:"tailscale"`
		DeltaPct  float64 `json:"delta_pct"`
	} `json:"qps"`
	P50Latency struct {
		BaselineMs  float64 `json:"baseline_ms"`
		TailscaleMs float64 `json:"tailscale_ms"`
		DeltaPct    float64 `json:"delta_pct"`
	} `json:"p50_latency"`
	P99Latency struct {
		BaselineMs  float64 `json:"baseline_ms"`
		TailscaleMs float64 `json:"tailscale_ms"`
		DeltaPct    float64 `json:"delta_pct"`
	} `json:"p99_latency"`
}
```

Add `ComputeL7Overhead` to `internal/result/writer.go`:

```go
func ComputeL7Overhead(baseline, tailscale *FortioResult) *L7Overhead {
	o := &L7Overhead{}
	o.QPS.Baseline = baseline.QPS
	o.QPS.Tailscale = tailscale.QPS
	if baseline.QPS > 0 {
		o.QPS.DeltaPct = (tailscale.QPS - baseline.QPS) / baseline.QPS * 100
	}
	o.P50Latency.BaselineMs = baseline.P50LatencyMs
	o.P50Latency.TailscaleMs = tailscale.P50LatencyMs
	if baseline.P50LatencyMs > 0 {
		o.P50Latency.DeltaPct = (tailscale.P50LatencyMs - baseline.P50LatencyMs) / baseline.P50LatencyMs * 100
	}
	o.P99Latency.BaselineMs = baseline.P99LatencyMs
	o.P99Latency.TailscaleMs = tailscale.P99LatencyMs
	if baseline.P99LatencyMs > 0 {
		o.P99Latency.DeltaPct = (tailscale.P99LatencyMs - baseline.P99LatencyMs) / baseline.P99LatencyMs * 100
	}
	return o
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/result/ -v`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add internal/result/types.go internal/result/types_test.go internal/result/writer.go
git commit -m "Add FortioResult, L7Overhead, TransportMode to result schema"
```

---

### Task 3: Fortio JSON Parser

**Files:**
- Create: `internal/benchmark/fortio.go`
- Create: `internal/benchmark/fortio_test.go`

- [ ] **Step 1: Write tests for fortio parser**

Create `internal/benchmark/fortio_test.go`:

```go
package benchmark

import (
	"os"
	"testing"
)

func TestParseFortioJSON(t *testing.T) {
	data, err := os.ReadFile("../../testdata/fortio_output_h1.json")
	if err != nil {
		t.Fatal(err)
	}
	r, err := ParseFortioJSON(data)
	if err != nil {
		t.Fatal(err)
	}
	if r.QPS < 12000 || r.QPS > 13000 {
		t.Errorf("QPS = %f, want ~12450", r.QPS)
	}
	if r.P50LatencyMs < 1.0 || r.P50LatencyMs > 1.5 {
		t.Errorf("P50 = %f, want ~1.2", r.P50LatencyMs)
	}
	if r.P99LatencyMs < 7.0 || r.P99LatencyMs > 9.0 {
		t.Errorf("P99 = %f, want ~8.1", r.P99LatencyMs)
	}
	if r.StatusCodes[200] != 373515 {
		t.Errorf("200 count = %d, want 373515", r.StatusCodes[200])
	}
	if r.ConnectionErrs != 0 {
		t.Errorf("ConnectionErrs = %d, want 0", r.ConnectionErrs)
	}
}

func TestParseFortioJSONWithErrors(t *testing.T) {
	data, err := os.ReadFile("../../testdata/fortio_output_error.json")
	if err != nil {
		t.Fatal(err)
	}
	r, err := ParseFortioJSON(data)
	if err != nil {
		t.Fatal(err)
	}
	if r.StatusCodes[502] != 1006 {
		t.Errorf("502 count = %d, want 1006", r.StatusCodes[502])
	}
	total := 0
	for _, v := range r.StatusCodes {
		total += v
	}
	errs := total - r.StatusCodes[200]
	if r.ConnectionErrs != errs {
		// ConnectionErrs tracks non-200 responses
	}
}

func TestParseFortioJSONMalformed(t *testing.T) {
	_, err := ParseFortioJSON([]byte("not json"))
	if err == nil {
		t.Error("expected error for malformed JSON")
	}
	_, err = ParseFortioJSON([]byte(""))
	if err == nil {
		t.Error("expected error for empty input")
	}
}

func TestBuildFortioCmd(t *testing.T) {
	tests := []struct {
		name     string
		target   string
		h2       bool
		conns    int
		duration int
		qps      int
		want     string
	}{
		{
			name: "h1 max throughput",
			target: "https://bench-echo.ts.net", h2: false, conns: 16, duration: 30, qps: 0,
			want: "fortio load -json /dev/stdout -qps 0 -c 16 -t 30s https://bench-echo.ts.net",
		},
		{
			name: "h2 max throughput",
			target: "https://bench-echo.ts.net", h2: true, conns: 16, duration: 30, qps: 0,
			want: "fortio load -json /dev/stdout -qps 0 -c 16 -t 30s -h2 https://bench-echo.ts.net",
		},
		{
			name: "fixed qps",
			target: "http://10.0.0.5:8080", h2: false, conns: 8, duration: 10, qps: 1000,
			want: "fortio load -json /dev/stdout -qps 1000 -c 8 -t 10s http://10.0.0.5:8080",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := BuildFortioCmd(tt.target, tt.h2, tt.conns, tt.duration, tt.qps)
			if got != tt.want {
				t.Errorf("got:\n  %s\nwant:\n  %s", got, tt.want)
			}
		})
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/benchmark/ -v -run TestParseFortio`
Expected: FAIL — `ParseFortioJSON` doesn't exist

- [ ] **Step 3: Implement fortio.go**

Create `internal/benchmark/fortio.go`:

```go
package benchmark

import (
	"encoding/json"
	"fmt"

	"github.com/rajsinghtech/tailbench/internal/result"
)

// fortioOutput matches the JSON structure produced by `fortio load -json`.
type fortioOutput struct {
	ActualQPS float64 `json:"ActualQPS"`
	DurationHistogram struct {
		Count       int     `json:"Count"`
		Avg         float64 `json:"Avg"`
		Percentiles []struct {
			Percentile float64 `json:"Percentile"`
			Value      float64 `json:"Value"`
		} `json:"Percentiles"`
	} `json:"DurationHistogram"`
	RetCodes    map[string]int `json:"RetCodes"`
	BytesSent   int64          `json:"BytesSent"`
	BytesRecv   int64          `json:"BytesReceived"`
	SocketCount int            `json:"SocketCount"`
}

// ParseFortioJSON parses fortio JSON output into a FortioResult.
func ParseFortioJSON(data []byte) (*result.FortioResult, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("empty fortio output")
	}
	var raw fortioOutput
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("parsing fortio json: %w", err)
	}

	r := &result.FortioResult{
		QPS:         raw.ActualQPS,
		AvgLatencyMs: raw.DurationHistogram.Avg * 1000,
		StatusCodes: make(map[int]int),
	}

	for _, p := range raw.DurationHistogram.Percentiles {
		ms := p.Value * 1000
		switch {
		case p.Percentile == 50:
			r.P50LatencyMs = ms
		case p.Percentile == 90:
			r.P90LatencyMs = ms
		case p.Percentile == 99:
			r.P99LatencyMs = ms
		case p.Percentile >= 99.9:
			r.P999LatencyMs = ms
		}
	}

	var total int
	for code, count := range raw.RetCodes {
		var c int
		fmt.Sscanf(code, "%d", &c)
		r.StatusCodes[c] = count
		total += count
	}
	r.ConnectionErrs = total - r.StatusCodes[200]

	duration := float64(raw.DurationHistogram.Count) / raw.ActualQPS
	if duration > 0 {
		r.BytesPerSec = float64(raw.BytesRecv) / duration
	}

	return r, nil
}

// BuildFortioCmd constructs the fortio load command string.
func BuildFortioCmd(target string, h2 bool, connections, durationSec, qps int) string {
	cmd := fmt.Sprintf("fortio load -json /dev/stdout -qps %d -c %d -t %ds", qps, connections, durationSec)
	if h2 {
		cmd += " -h2"
	}
	cmd += " " + target
	return cmd
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `go test ./internal/benchmark/ -v -run "TestParseFortio|TestBuildFortio"`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add internal/benchmark/fortio.go internal/benchmark/fortio_test.go
git commit -m "Add fortio JSON parser and command builder"
```

---

### Task 4: Benchmark Modes

**Files:**
- Create: `internal/benchmark/modes.go`
- Create: `internal/benchmark/modes_test.go`

- [ ] **Step 1: Write mode tests**

Create `internal/benchmark/modes_test.go`:

```go
package benchmark

import "testing"

func TestModeValid(t *testing.T) {
	valid := []string{"tsnet-userspace", "l4-kernel", "l4-userspace", "l4-lb", "l7-ingress-h1", "l7-ingress-h2", "l7-serve-h1", "l7-serve-h2"}
	for _, m := range valid {
		if !IsValidMode(m) {
			t.Errorf("IsValidMode(%q) = false, want true", m)
		}
	}
	if IsValidMode("invalid") {
		t.Error("IsValidMode(invalid) = true, want false")
	}
}

func TestModeEnvironment(t *testing.T) {
	k8sOnly := []string{"l4-lb", "l7-ingress-h1", "l7-ingress-h2"}
	vmOnly := []string{"l7-serve-h1", "l7-serve-h2"}
	both := []string{"tsnet-userspace", "l4-kernel", "l4-userspace"}

	for _, m := range k8sOnly {
		if !ModeAppliesTo(m, "container") {
			t.Errorf("%s should apply to container", m)
		}
		if ModeAppliesTo(m, "vm") {
			t.Errorf("%s should NOT apply to vm", m)
		}
	}
	for _, m := range vmOnly {
		if !ModeAppliesTo(m, "vm") {
			t.Errorf("%s should apply to vm", m)
		}
		if ModeAppliesTo(m, "container") {
			t.Errorf("%s should NOT apply to container", m)
		}
	}
	for _, m := range both {
		if !ModeAppliesTo(m, "vm") || !ModeAppliesTo(m, "container") {
			t.Errorf("%s should apply to both", m)
		}
	}
}

func TestModeUsesIperf(t *testing.T) {
	if !ModeUsesIperf("l4-kernel") {
		t.Error("l4-kernel should use iperf")
	}
	if ModeUsesIperf("l7-ingress-h1") {
		t.Error("l7-ingress-h1 should NOT use iperf")
	}
}

func TestModeIsH2(t *testing.T) {
	if !ModeIsH2("l7-ingress-h2") {
		t.Error("l7-ingress-h2 should be h2")
	}
	if ModeIsH2("l7-ingress-h1") {
		t.Error("l7-ingress-h1 should not be h2")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/benchmark/ -v -run TestMode`
Expected: FAIL

- [ ] **Step 3: Implement modes.go**

Create `internal/benchmark/modes.go`:

```go
package benchmark

import "strings"

var validModes = map[string]bool{
	"tsnet-userspace": true,
	"l4-kernel":       true,
	"l4-userspace":    true,
	"l4-lb":           true,
	"l7-ingress-h1":   true,
	"l7-ingress-h2":   true,
	"l7-serve-h1":     true,
	"l7-serve-h2":     true,
}

func IsValidMode(mode string) bool {
	return validModes[mode]
}

// ModeAppliesTo checks if a mode is applicable to the given environment ("vm" or "container").
func ModeAppliesTo(mode, env string) bool {
	switch mode {
	case "l4-lb", "l7-ingress-h1", "l7-ingress-h2":
		return env == "container"
	case "l7-serve-h1", "l7-serve-h2":
		return env == "vm"
	default:
		return true // tsnet-userspace, l4-kernel, l4-userspace work on both
	}
}

// ModeUsesIperf returns true if the mode uses iperf3 (L4 raw TCP modes).
func ModeUsesIperf(mode string) bool {
	return mode == "l4-kernel" || mode == "l4-userspace"
}

// ModeUsesFortio returns true if the mode uses fortio for HTTP/TCP load.
func ModeUsesFortio(mode string) bool {
	return strings.HasPrefix(mode, "l4-lb") || strings.HasPrefix(mode, "l7-")
}

// ModeIsH2 returns true if the mode tests HTTP/2.
func ModeIsH2(mode string) bool {
	return strings.HasSuffix(mode, "-h2")
}

// ModeHTTPVersion returns the HTTP version string for a mode.
func ModeHTTPVersion(mode string) string {
	if ModeIsH2(mode) {
		return "2"
	}
	if strings.HasSuffix(mode, "-h1") {
		return "1.1"
	}
	return ""
}
```

- [ ] **Step 4: Run tests**

Run: `go test ./internal/benchmark/ -v -run TestMode`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add internal/benchmark/modes.go internal/benchmark/modes_test.go
git commit -m "Add benchmark mode types with environment filtering"
```

---

### Task 5: Config Extension

**Files:**
- Modify: `internal/config/config.go:15-45,47-96`
- Modify: `config.yaml`

- [ ] **Step 1: Add fortio fields to Config struct**

In `internal/config/config.go`, add to `Config` struct (after line 44, before closing brace):

```go
	FortioDuration    int
	FortioConnections int
	FortioQPS         int
	FortioIterations  int
	Modes             []string
	IngressFQDN       string
	ServeFQDN         string
	ClusterLabel      string
```

Add to `yamlConfig.Benchmark` struct (after line 65):

```go
		FortioDuration   int      `yaml:"fortio_duration"`
		FortioConnections int     `yaml:"fortio_connections"`
		FortioQPS        int      `yaml:"fortio_qps"`
		FortioIterations int      `yaml:"fortio_iterations"`
		Modes            []string `yaml:"modes"`
```

Add new section to `yamlConfig` (after `Images` struct, line 92):

```go
	L7Endpoints struct {
		IngressFQDN  string `yaml:"ingress_fqdn"`
		ServeFQDN    string `yaml:"serve_fqdn"`
		ClusterLabel string `yaml:"cluster_label"`
	} `yaml:"l7_endpoints"`
```

In the `Parse` function (around line 194), add after `CreditRetrySec`:

```go
		FortioDuration:    orInt(yc.Benchmark.FortioDuration, 30),
		FortioConnections: orInt(yc.Benchmark.FortioConnections, 16),
		FortioQPS:         yc.Benchmark.FortioQPS, // 0 = max throughput
		FortioIterations:  orInt(yc.Benchmark.FortioIterations, 3),
		Modes:             yc.Benchmark.Modes,
		IngressFQDN:       yc.L7Endpoints.IngressFQDN,
		ServeFQDN:         yc.L7Endpoints.ServeFQDN,
		ClusterLabel:      or(yc.L7Endpoints.ClusterLabel, "app.kubernetes.io/part-of=tailbench-l7"),
```

After Parse returns, add mode defaults:

```go
	if len(cfg.Modes) == 0 {
		cfg.Modes = []string{"l4-kernel"}
	}
```

- [ ] **Step 2: Update config.yaml**

Add to `config.yaml` under `benchmark:`:

```yaml
  fortio_duration: 30
  fortio_connections: 16
  fortio_qps: 0
  fortio_iterations: 3
  modes:
    - l4-kernel

l7_endpoints:
  ingress_fqdn: ""
  serve_fqdn: ""
  cluster_label: "app.kubernetes.io/part-of=tailbench-l7"
```

- [ ] **Step 3: Verify build**

Run: `go build ./...`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add internal/config/config.go config.yaml
git commit -m "Add fortio config, modes, and l7_endpoints to config"
```

---

### Task 6: Result Writer Mode Suffix

**Files:**
- Modify: `internal/result/writer.go:57-78`

- [ ] **Step 1: Write test for mode suffix**

Add to `internal/result/types_test.go`:

```go
func TestWriteResultWithMode(t *testing.T) {
	dir := t.TempDir()
	r := &BenchmarkResult{
		CloudProvider:  "gke",
		InstanceFamily: "n2",
		InstanceType:   "n2-standard-4",
		TransportMode:  "l7-ingress-h1",
	}
	if err := WriteResult(dir, r, false); err != nil {
		t.Fatal(err)
	}
	path := dir + "/gke/n2/results/n2-standard-4-l7-ingress-h1.json"
	if _, err := os.Stat(path); err != nil {
		t.Errorf("expected file at %s: %v", path, err)
	}
}

func TestWriteResultWithoutMode(t *testing.T) {
	dir := t.TempDir()
	r := &BenchmarkResult{
		CloudProvider:  "gcp",
		InstanceFamily: "c3",
		InstanceType:   "c3-standard-4",
	}
	if err := WriteResult(dir, r, false); err != nil {
		t.Fatal(err)
	}
	path := dir + "/gcp/c3/results/c3-standard-4.json"
	if _, err := os.Stat(path); err != nil {
		t.Errorf("expected file at %s: %v", path, err)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/result/ -v -run TestWriteResult`
Expected: FAIL (mode suffix not implemented yet)

- [ ] **Step 3: Update WriteResult**

In `internal/result/writer.go`, modify the `WriteResult` function (line 63):

```go
	filename := r.InstanceType
	if r.TransportMode != "" {
		filename += "-" + r.TransportMode
	}
	if enaExpress {
		filename += "-ena-express"
	}
	filename += ".json"
```

- [ ] **Step 4: Run tests**

Run: `go test ./internal/result/ -v`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add internal/result/writer.go internal/result/types_test.go
git commit -m "Add transport mode suffix to result filenames"
```

---

### Task 7: K8s Ingress Discovery

**Files:**
- Create: `internal/k8s/ingress.go`
- Create: `internal/k8s/ingress_test.go`

- [ ] **Step 1: Write test with fake clientset**

Create `internal/k8s/ingress_test.go`:

```go
package k8s

import (
	"context"
	"testing"

	networkingv1 "k8s.io/api/networking/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"
)

func TestDiscoverIngressFQDN(t *testing.T) {
	cs := fake.NewSimpleClientset(
		&networkingv1.Ingress{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "bench-echo-ingress",
				Namespace: Namespace,
				Labels:    map[string]string{"app.kubernetes.io/part-of": "tailbench-l7"},
			},
			Status: networkingv1.IngressStatus{
				LoadBalancer: networkingv1.IngressLoadBalancerStatus{
					Ingress: []networkingv1.IngressLoadBalancerIngress{
						{Hostname: "bench-echo-ingress.tailnet.ts.net"},
					},
				},
			},
		},
	)
	fqdn, err := DiscoverIngressFQDN(context.Background(), cs, "app.kubernetes.io/part-of=tailbench-l7")
	if err != nil {
		t.Fatal(err)
	}
	if fqdn != "bench-echo-ingress.tailnet.ts.net" {
		t.Errorf("got %q, want bench-echo-ingress.tailnet.ts.net", fqdn)
	}
}

func TestDiscoverServiceLBFQDN(t *testing.T) {
	cs := fake.NewSimpleClientset(
		&corev1.Service{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "bench-echo-lb",
				Namespace: Namespace,
				Labels:    map[string]string{"app.kubernetes.io/part-of": "tailbench-l7"},
			},
			Spec: corev1.ServiceSpec{Type: corev1.ServiceTypeLoadBalancer},
			Status: corev1.ServiceStatus{
				LoadBalancer: corev1.LoadBalancerStatus{
					Ingress: []corev1.LoadBalancerIngress{
						{Hostname: "bench-echo-lb.tailnet.ts.net"},
					},
				},
			},
		},
	)
	fqdn, err := DiscoverServiceLBFQDN(context.Background(), cs, "app.kubernetes.io/part-of=tailbench-l7")
	if err != nil {
		t.Fatal(err)
	}
	if fqdn != "bench-echo-lb.tailnet.ts.net" {
		t.Errorf("got %q, want bench-echo-lb.tailnet.ts.net", fqdn)
	}
}

func TestDiscoverNoResources(t *testing.T) {
	cs := fake.NewSimpleClientset()
	_, err := DiscoverIngressFQDN(context.Background(), cs, "app.kubernetes.io/part-of=tailbench-l7")
	if err == nil {
		t.Error("expected error when no Ingress found")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `go test ./internal/k8s/ -v -run TestDiscover`
Expected: FAIL

- [ ] **Step 3: Implement ingress.go**

Create `internal/k8s/ingress.go`:

```go
package k8s

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// DiscoverIngressFQDN finds the first Ingress matching the label selector and returns its LB hostname.
func DiscoverIngressFQDN(ctx context.Context, cs kubernetes.Interface, labelSelector string) (string, error) {
	ingresses, err := cs.NetworkingV1().Ingresses(Namespace).List(ctx, metav1.ListOptions{LabelSelector: labelSelector})
	if err != nil {
		return "", fmt.Errorf("listing ingresses: %w", err)
	}
	for _, ing := range ingresses.Items {
		for _, lb := range ing.Status.LoadBalancer.Ingress {
			if lb.Hostname != "" {
				return lb.Hostname, nil
			}
			if lb.IP != "" {
				return lb.IP, nil
			}
		}
	}
	return "", fmt.Errorf("no Ingress with label %q has a LoadBalancer hostname in namespace %s", labelSelector, Namespace)
}

// DiscoverServiceLBFQDN finds the first Service LoadBalancer matching the label selector.
func DiscoverServiceLBFQDN(ctx context.Context, cs kubernetes.Interface, labelSelector string) (string, error) {
	services, err := cs.CoreV1().Services(Namespace).List(ctx, metav1.ListOptions{LabelSelector: labelSelector})
	if err != nil {
		return "", fmt.Errorf("listing services: %w", err)
	}
	for _, svc := range services.Items {
		if svc.Spec.Type != "LoadBalancer" {
			continue
		}
		for _, lb := range svc.Status.LoadBalancer.Ingress {
			if lb.Hostname != "" {
				return lb.Hostname, nil
			}
			if lb.IP != "" {
				return lb.IP, nil
			}
		}
	}
	return "", fmt.Errorf("no Service LB with label %q has a LoadBalancer hostname in namespace %s", labelSelector, Namespace)
}
```

- [ ] **Step 4: Run tests**

Run: `go test ./internal/k8s/ -v -run TestDiscover`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add internal/k8s/ingress.go internal/k8s/ingress_test.go
git commit -m "Add K8s Ingress and Service LB FQDN discovery"
```

---

### Task 8: Userspace Toggle in Pod Builder

**Files:**
- Modify: `internal/k8s/pods.go:24-29,31-83`

- [ ] **Step 1: Add Userspace field to PodConfig**

In `internal/k8s/pods.go`, add to `PodConfig` struct (line 28):

```go
	Userspace bool
```

In `BuildPod`, change line 64 from:

```go
{Name: "TS_USERSPACE", Value: "false"},
```

to:

```go
{Name: "TS_USERSPACE", Value: fmt.Sprintf("%t", cfg.Userspace)},
```

Add `"fmt"` to the imports.

- [ ] **Step 2: Verify build**

Run: `go build ./...`
Expected: SUCCESS (existing callers pass `Userspace: false` implicitly as zero value)

- [ ] **Step 3: Commit**

```bash
git add internal/k8s/pods.go
git commit -m "Add Userspace toggle to PodConfig for TS_USERSPACE env var"
```

---

### Task 9: Fortio Runner Integration in Runner

**Files:**
- Modify: `internal/benchmark/runner.go`

- [ ] **Step 1: Add RunFortio method to Runner**

Add to the end of `internal/benchmark/runner.go`:

```go
// RunFortio executes a fortio-based benchmark for L7/L4-LB modes.
// target is the FQDN or URL to load test. h2 enables HTTP/2.
// Returns baseline and tailscale FortioResults.
func (r *Runner) RunFortio(ctx context.Context, target, baselineTarget string, h2 bool, connections, duration, iterations, qps int) (*result.FortioResult, *result.FortioResult, error) {
	log.Printf("running fortio baseline against %s (h2=%v)", baselineTarget, h2)
	baselineRuns, err := runFortioTest(ctx, r.Client, baselineTarget, h2, connections, iterations, duration, qps)
	if err != nil {
		return nil, nil, fmt.Errorf("fortio baseline: %w", err)
	}
	baselineResult := averageFortioResults(baselineRuns)

	log.Printf("running fortio tailscale against %s (h2=%v)", target, h2)
	tsRuns, err := runFortioTest(ctx, r.Client, target, h2, connections, iterations, duration, qps)
	if err != nil {
		return nil, nil, fmt.Errorf("fortio tailscale: %w", err)
	}
	tsResult := averageFortioResults(tsRuns)

	return baselineResult, tsResult, nil
}

func runFortioTest(ctx context.Context, c Executor, target string, h2 bool, connections, iterations, duration, qps int) ([]*result.FortioResult, error) {
	var runs []*result.FortioResult
	for i := range iterations {
		cmd := BuildFortioCmd(target, h2, connections, duration, qps)
		log.Printf("fortio iteration %d/%d: %s", i+1, iterations, cmd)

		stdout, _, err := c.Run(ctx, cmd)
		if err != nil {
			log.Printf("fortio run error: %v", err)
			continue
		}
		r, err := ParseFortioJSON([]byte(stdout))
		if err != nil {
			log.Printf("fortio parse error: %v", err)
			continue
		}
		log.Printf("iteration %d: %.0f QPS, p50=%.2fms, p99=%.2fms", i+1, r.QPS, r.P50LatencyMs, r.P99LatencyMs)
		runs = append(runs, r)
	}
	if len(runs) == 0 {
		return nil, fmt.Errorf("all %d fortio iterations failed", iterations)
	}
	return runs, nil
}

func averageFortioResults(runs []*result.FortioResult) *result.FortioResult {
	if len(runs) == 0 {
		return &result.FortioResult{}
	}
	avg := &result.FortioResult{StatusCodes: make(map[int]int)}
	n := float64(len(runs))
	for _, r := range runs {
		avg.QPS += r.QPS
		avg.AvgLatencyMs += r.AvgLatencyMs
		avg.P50LatencyMs += r.P50LatencyMs
		avg.P90LatencyMs += r.P90LatencyMs
		avg.P99LatencyMs += r.P99LatencyMs
		avg.P999LatencyMs += r.P999LatencyMs
		avg.BytesPerSec += r.BytesPerSec
		avg.ConnectionErrs += r.ConnectionErrs
		for code, count := range r.StatusCodes {
			avg.StatusCodes[code] += count
		}
	}
	avg.QPS /= n
	avg.AvgLatencyMs /= n
	avg.P50LatencyMs /= n
	avg.P90LatencyMs /= n
	avg.P99LatencyMs /= n
	avg.P999LatencyMs /= n
	avg.BytesPerSec /= n
	return avg
}
```

- [ ] **Step 2: Verify build**

Run: `go build ./...`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add internal/benchmark/runner.go
git commit -m "Add RunFortio method to benchmark Runner"
```

---

### Task 10: ACL Extension

**Files:**
- Modify: `internal/tailnet/tailnet.go`

- [ ] **Step 1: Read current SetupACL**

Read `internal/tailnet/tailnet.go` to find the `SetupACL` function and understand the existing grant structure.

- [ ] **Step 2: Add bench-service grant and tag ownership**

In `SetupACL` (line 150), the existing code sets `acl.Grants` as a single-element slice at line 178. **Append** to it, don't replace. Also add `tag:bench-service` to `TagOwners`.

After the existing `acl.TagOwners` assignment (line 156-158), add:

```go
	acl.TagOwners["tag:bench-service"] = []string{m.Tag}
```

After the existing `acl.Grants` block (line 193, inside the `if k8sOperator` block), append:

```go
		acl.Grants = append(acl.Grants, tailscale.Grant{
			Source:      []string{m.Tag},
			Destination: []string{"tag:bench-service"},
			IP:          []string{"*"},
		})
```

And add `NodeAttrs` (new field, outside the `if k8sOperator` block, before the `Set` call at line 195):

```go
	acl.NodeAttrs = []tailscale.NodeAttrGrant{
		{
			Target: []string{"tag:k8s"},
			Attr:   []string{"funnel"},
		},
	}
```

- [ ] **Step 3: Verify build**

Run: `go build ./...`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add internal/tailnet/tailnet.go
git commit -m "Add bench-service grant and funnel nodeAttr to ACL"
```

---

### Task 11: Orchestrator Mode Dispatch

**Files:**
- Modify: `internal/orchestrator/orchestrator.go`

This is the largest integration task. The orchestrator's `runBenchmark` and `runK8sBenchmark` methods need to loop over modes.

- [ ] **Step 1: Add mode loop to runBenchmark**

The existing `runBenchmark` (line ~389) runs a single `runner.RunFull()`. Wrap the core logic in a mode loop:

```go
// After creating the Runner, before calling RunFull:
for _, mode := range o.cfg.Modes {
	env := "vm"
	if pair.Namespace != "" {
		env = "container"
	}
	if !benchmark.ModeAppliesTo(mode, env) {
		lg.Printf("skipping mode %s (not applicable to %s)", mode, env)
		continue
	}

	var br *result.BenchmarkResult
	var err error

	switch {
	case benchmark.ModeUsesIperf(mode):
		br, err = runner.RunFull(ctx, pair.ServerLANIP, pair.ClientLANIP)
	case benchmark.ModeUsesFortio(mode):
		target, baselineTarget := o.resolveEndpoints(mode, pair)
		if target == "" {
			lg.Printf("skipping mode %s: no endpoint configured", mode)
			continue
		}
		h2 := benchmark.ModeIsH2(mode)
		baseline, ts, ferr := runner.RunFortio(ctx, target, baselineTarget, h2,
			o.cfg.FortioConnections, o.cfg.FortioDuration, o.cfg.FortioIterations, o.cfg.FortioQPS)
		if ferr != nil {
			lg.Printf("fortio mode %s failed: %v", mode, ferr)
			continue
		}
		br = &result.BenchmarkResult{
			FortioResult: ts,
			L7Overhead:   result.ComputeL7Overhead(baseline, ts),
		}
	default:
		lg.Printf("skipping mode %s: not yet implemented", mode)
		continue
	}

	if err != nil {
		return err
	}

	// Set common fields
	br.CloudProvider = provider
	br.InstanceFamily = family
	br.InstanceType = inst.Type
	br.VCPUs = inst.VCPUs
	br.Region = o.cfg.region(p)
	br.Zone = o.cfg.zone(p)
	br.Date = time.Now().Format("2006-01-02")
	br.Environment = env
	br.TransportMode = mode
	br.HTTPVersion = benchmark.ModeHTTPVersion(mode)

	if err := result.WriteResult(o.cfg.RootDir, br, false); err != nil {
		return err
	}
}
```

- [ ] **Step 2: Add resolveEndpoints helper and TLS warm-up**

```go
func (o *Orchestrator) resolveEndpoints(mode string, pair *provider.PairOutput) (target, baseline string) {
	switch {
	case strings.HasPrefix(mode, "l7-ingress"):
		target = o.cfg.IngressFQDN
		if target != "" {
			target = "https://" + target
		}
		// Baseline: ClusterIP service directly (bypasses Tailscale + Ingress proxy)
		baseline = "http://bench-echo.tailbench.svc.cluster.local:8080"
	case strings.HasPrefix(mode, "l7-serve"):
		target = o.cfg.ServeFQDN
		if target != "" {
			target = "https://" + target
		}
		baseline = "http://" + pair.ServerLANIP + ":8080"
	case mode == "l4-lb":
		// TODO: discover from cluster label query
		target = "http://" + pair.ServerLANIP + ":8080"
		baseline = "http://bench-echo.tailbench.svc.cluster.local:8080"
	}
	return
}

// warmUpTLS makes a single HTTPS request with retry to ensure the LE cert is provisioned.
func (o *Orchestrator) warmUpTLS(ctx context.Context, executor benchmark.Executor, target string) error {
	for attempt := 0; attempt < 5; attempt++ {
		backoff := time.Duration(1<<attempt) * time.Second // 1s, 2s, 4s, 8s, 16s
		_, _, err := executor.Run(ctx, fmt.Sprintf("curl -sf --max-time 15 -o /dev/null %s", target))
		if err == nil {
			return nil
		}
		log.Printf("TLS warm-up attempt %d/5 failed: %v, retrying in %v", attempt+1, err, backoff)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(backoff):
		}
	}
	return fmt.Errorf("TLS cert not ready after 5 attempts for %s", target)
}
```

In the mode dispatch switch (step 1), add TLS warm-up before fortio run for L7 modes:

```go
	case benchmark.ModeUsesFortio(mode):
		target, baselineTarget := o.resolveEndpoints(mode, pair)
		if target == "" {
			lg.Printf("skipping mode %s: no endpoint configured", mode)
			continue
		}
		// TLS warm-up for L7 HTTPS modes
		if strings.HasPrefix(mode, "l7-") {
			if err := o.warmUpTLS(ctx, clientExec, target); err != nil {
				lg.Printf("skipping mode %s: TLS warm-up failed: %v", mode, err)
				continue
			}
		}
		h2 := benchmark.ModeIsH2(mode)
		// ... rest of fortio run
```
```

- [ ] **Step 3: Verify build**

Run: `go build ./...`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add internal/orchestrator/orchestrator.go
git commit -m "Add mode dispatch loop to orchestrator benchmark runner"
```

---

### Task 12: K8s Manifests for Long-Lived Resources

**Files:**
- Create: `manifests/l7-bench/deployment.yaml`
- Create: `manifests/l7-bench/service.yaml`
- Create: `manifests/l7-bench/ingress.yaml`
- Create: `manifests/l7-bench/service-lb.yaml`
- Create: `manifests/l7-bench/kustomization.yaml`

- [ ] **Step 1: Create manifests directory and files**

These are the K8s manifests for the long-lived fortio echo server, Ingress, and Service LB. They can be deployed to any cluster with the Tailscale operator.

Create `manifests/l7-bench/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
  - ingress.yaml
  - service-lb.yaml
```

Create `manifests/l7-bench/deployment.yaml`:
```yaml
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
        resources:
          requests:
            cpu: 100m
            memory: 64Mi
          limits:
            cpu: "2"
            memory: 256Mi
```

Create `manifests/l7-bench/service.yaml`:
```yaml
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
```

Create `manifests/l7-bench/ingress.yaml`:
```yaml
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
```

Create `manifests/l7-bench/service-lb.yaml`:
```yaml
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

- [ ] **Step 2: Validate manifests**

Run: `kubectl apply --dry-run=client -k manifests/l7-bench/`
Expected: Shows resources that would be created (no errors)

- [ ] **Step 3: Commit**

```bash
git add manifests/l7-bench/
git commit -m "Add K8s manifests for long-lived L7 benchmark resources"
```

---

### Task 13: Website Frontend — Mode Filter and Fortio Columns

**Files:**
- Modify: `website/index.html`

This is a large change to the single-file frontend. Key additions:

- [ ] **Step 1: Add CSS for mode tags**

Add after the `.k8s-tag` CSS (after line 297):

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
[data-theme="dark"] .mode-l7 { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
[data-theme="dark"] .mode-tsnet { background: rgba(16, 185, 129, 0.15); color: #34d399; }
```

- [ ] **Step 2: Add mode filter HTML**

Add after the K8s filter bar (after line 515):

```html
<div class="filter-bar" id="modeFilterBar" style="display:none">
  <label>Mode</label>
  <div class="pill-group" id="modeFilter"></div>
</div>
```

- [ ] **Step 3: Add mode state and detection**

In the JS state object (line 557), add:
```js
mode: 'all',
```

In the data detection section (after line 579), add:
```js
var allModes = {};
TAILBENCH_DATA.forEach(function(d) { if (d.transport_mode) allModes[d.transport_mode] = true; });
var hasModes = Object.keys(allModes).length > 1;
var hasFortio = TAILBENCH_DATA.some(function(d) { return d.fortio_result; });
```

- [ ] **Step 4: Add mode filter rendering**

Add new function after `renderK8sFilter` (after line 721):

```js
function renderModeFilter() {
  var bar = document.getElementById('modeFilterBar');
  if (!hasModes) { bar.style.display = 'none'; return; }
  bar.style.display = '';
  var modeList = Object.keys(allModes).sort();
  var html = '<button class="pill' + (state.mode === 'all' ? ' active' : '') + '" data-mode="all">All</button>';
  modeList.forEach(function(m) {
    html += '<button class="pill' + (state.mode === m ? ' active' : '') + '" data-mode="' + m + '">' + m.replace(/-/g, ' ') + '</button>';
  });
  document.getElementById('modeFilter').innerHTML = html;
  document.querySelectorAll('#modeFilter .pill').forEach(function(btn) {
    btn.addEventListener('click', function() {
      state.mode = this.getAttribute('data-mode');
      state.expanded = null;
      writeHash();
      render();
    });
  });
}
```

- [ ] **Step 5: Update filter, hash, columns, and detail rendering**

Update `getFilteredData` to include mode filter:
```js
if (state.mode !== 'all') data = data.filter(function(d) { return d.transport_mode === state.mode; });
```

Update `readHash`/`writeHash` to handle `mode` parameter.

Add fortio columns to `renderTableHead` when `hasFortio` is true:
```js
if (hasFortio) {
  cols.push({key:'transport_mode', label:'Transport'});
  cols.push({key:'qps', label:'QPS'});
  cols.push({key:'p99', label:'P99 Latency'});
}
```

Add fortio cells to `renderTable` for each row:
```js
if (hasFortio) {
  var mode = d.transport_mode || '';
  var modeClass = mode.startsWith('l7') ? 'mode-l7' : mode.startsWith('l4') ? 'mode-l4' : mode.startsWith('tsnet') ? 'mode-tsnet' : '';
  html += '<td>' + (mode ? '<span class="mode-tag ' + modeClass + '">' + mode + '</span>' : '—') + '</td>';
  html += '<td class="mono">' + (d.fortio_result ? fmtNum(d.fortio_result.qps, 0) : '—') + '</td>';
  html += '<td class="mono">' + (d.fortio_result ? d.fortio_result.p99_latency_ms.toFixed(1) + ' ms' : '—') + '</td>';
}
```

Add fortio detail section in `renderDetail` when `d.fortio_result` exists:
```js
if (d.fortio_result) {
  html += '<div class="detail-section" style="grid-column:1/-1;margin-top:16px">';
  html += '<h4>HTTP Performance (fortio)</h4>';
  html += '<div class="detail-meta">';
  if (d.transport_mode) html += '<div class="detail-meta-item"><strong>Transport:</strong> ' + d.transport_mode + '</div>';
  if (d.http_version) html += '<div class="detail-meta-item"><strong>HTTP:</strong> ' + d.http_version + '</div>';
  if (d.ha_mode) html += '<div class="detail-meta-item"><strong>HA:</strong> ' + d.ha_mode + '</div>';
  html += '</div>';
  var fr = d.fortio_result;
  html += '<table class="mini-table"><thead><tr><th>QPS</th><th>P50</th><th>P90</th><th>P99</th><th>P99.9</th><th>Errors</th></tr></thead><tbody>';
  html += '<tr><td>' + fmtNum(fr.qps, 0) + '</td><td>' + fr.p50_latency_ms.toFixed(2) + ' ms</td><td>' + fr.p90_latency_ms.toFixed(2) + ' ms</td><td>' + fr.p99_latency_ms.toFixed(2) + ' ms</td><td>' + fr.p999_latency_ms.toFixed(2) + ' ms</td><td>' + fr.connection_errors + '</td></tr>';
  html += '</tbody></table>';
  if (d.l7_overhead) {
    var lo = d.l7_overhead;
    html += '<div class="detail-meta" style="margin-top:8px">';
    html += '<div class="detail-meta-item"><strong>QPS overhead:</strong> ' + lo.qps.delta_pct.toFixed(1) + '%</div>';
    html += '<div class="detail-meta-item"><strong>P50 overhead:</strong> +' + lo.p50_latency.delta_pct.toFixed(1) + '%</div>';
    html += '<div class="detail-meta-item"><strong>P99 overhead:</strong> +' + lo.p99_latency.delta_pct.toFixed(1) + '%</div>';
    html += '</div>';
  }
  html += '</div>';
}
```

Add `renderModeFilter()` call to the `render()` function.

Add `getSortVal` cases for `transport_mode`, `qps`, `p99`:
```js
case 'transport_mode': return d.transport_mode || '';
case 'qps': return d.fortio_result ? d.fortio_result.qps : 0;
case 'p99': return d.fortio_result ? d.fortio_result.p99_latency_ms : 0;
```

- [ ] **Step 6: Verify website renders**

Open `website/index.html` in a browser with existing `data.generated.js`. Verify:
- No JS errors in console
- Existing data renders correctly (no regressions)
- Mode filter bar is hidden (no mode data in existing results)
- Fortio columns are hidden (no fortio data)

- [ ] **Step 7: Commit**

```bash
git add website/index.html
git commit -m "Add transport mode filter and fortio columns to website"
```

---

### Task 14: Update tailbench-tools Docker Image

**Files:**
- Create: `docker/tailbench-tools/Dockerfile`

- [ ] **Step 1: Create Dockerfile with fortio**

```dockerfile
FROM ubuntu:24.04
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      iperf3 mtr-tiny jq curl ca-certificates && \
    curl -L https://github.com/fortio/fortio/releases/download/v1.67.0/fortio_linux_amd64-1.67.0.tgz | \
      tar xz -C /usr/local/bin fortio && \
    chmod +x /usr/local/bin/fortio && \
    rm -rf /var/lib/apt/lists/*
CMD ["sleep", "infinity"]
```

- [ ] **Step 2: Verify build**

Run: `docker build -t tailbench-tools:test docker/tailbench-tools/`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add docker/tailbench-tools/
git commit -m "Add tailbench-tools Dockerfile with fortio binary"
```

---

### Task 15: Go Module — Add fortio Dependency

**Files:**
- Modify: `go.mod`

- [ ] **Step 1: Add fortio dependency**

Run: `go get fortio.org/fortio@latest`
Then: `go mod tidy`

- [ ] **Step 2: Verify build**

Run: `go build ./...`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add go.mod go.sum
git commit -m "Add fortio Go dependency for tsnet in-process benchmarking"
```

---

### Summary

| Task | Component | New Files | Modified Files |
|------|-----------|-----------|----------------|
| 1 | Test fixtures | 3 | 0 |
| 2 | Result schema | 1 | 1 |
| 3 | Fortio parser | 2 | 0 |
| 4 | Benchmark modes | 2 | 0 |
| 5 | Config extension | 0 | 2 |
| 6 | Writer mode suffix | 0 | 2 |
| 7 | K8s Ingress discovery | 2 | 0 |
| 8 | Userspace toggle | 0 | 1 |
| 9 | Fortio runner | 0 | 1 |
| 10 | ACL extension | 0 | 1 |
| 11 | Orchestrator dispatch | 0 | 1 |
| 12 | K8s manifests | 5 | 0 |
| 13 | Website frontend | 0 | 1 |
| 14 | Docker image | 1 | 0 |
| 15 | Go module | 0 | 2 |

**Deferred to follow-up:**
- tsnet in-process runner (requires fortio Go library integration as `fortio.org/fortio` dependency)
- HA ProxyGroup testing (requires operator v1.76+ and ProxyGroup CRD — `ha_mode` field will be empty until implemented)
- gRPC modes
- Website e2e tests with chromedp
- CI pipeline
- VM serve endpoint provisioning (long-lived VM with `tailscale serve --https` + `.tailbench/serve-endpoints.json` persistence)

**Known issue:** Default modes list should only include `l4-kernel` until tsnet runner is implemented. The `tsnet-userspace` mode will be added when that task lands.

**Note on line numbers:** Line references for `website/index.html` are approximate — the file is ~1993 lines. Search for the referenced patterns rather than relying on exact line numbers. Go file line numbers are accurate as of commit `b190238`.
