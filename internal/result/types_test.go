package result

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBenchmarkResultJSON(t *testing.T) {
	r := &BenchmarkResult{
		CloudProvider: "gcp",
		InstanceType:  "c3-standard-4",
		TransportMode: "l7-ingress-h1",
		HTTPVersion:   "1.1",
		HAMode:        "single",
		FortioResult: &FortioResult{
			QPS:            12450.5,
			AvgLatencyMs:   1.223,
			P50LatencyMs:   1.200,
			P90LatencyMs:   3.400,
			P99LatencyMs:   8.100,
			P999LatencyMs:  15.0,
			StatusCodes:    map[int]int{200: 373515},
			BytesPerSec:    3187328.0,
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

func TestBenchmarkResultRoundTrip(t *testing.T) {
	data, err := os.ReadFile("../../gcp/c4/results/c4-standard-4.json")
	if err != nil {
		t.Skipf("test fixture not found: %v", err)
	}

	var r BenchmarkResult
	require.NoError(t, json.Unmarshal(data, &r))

	assert.Equal(t, "gcp", r.CloudProvider)
	assert.Equal(t, "c4", r.InstanceFamily)
	assert.NotZero(t, r.BaselineTCP.Summary.BandwidthMbpsAvg)
	assert.NotZero(t, r.TailscaleTCP.Summary.BandwidthMbpsAvg)
	assert.NotEmpty(t, r.BaselineMTR.Hops)
	assert.NotNil(t, r.BaselineTCPSingle)
	assert.NotNil(t, r.TailscaleTCPSingle)
	assert.NotNil(t, r.SystemConfig)
	assert.NotEmpty(t, r.SystemConfig.TCPCongestionControl)

	// Round-trip
	out, err := json.Marshal(r)
	require.NoError(t, err)
	var r2 BenchmarkResult
	require.NoError(t, json.Unmarshal(out, &r2))
	assert.Equal(t, r.CloudProvider, r2.CloudProvider)
	assert.InDelta(t, r.Overhead.BandwidthPct, r2.Overhead.BandwidthPct, 0.001)
}
