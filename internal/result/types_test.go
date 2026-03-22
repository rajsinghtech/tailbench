package result

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

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
