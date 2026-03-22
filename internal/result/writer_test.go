package result

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestComputeSummary(t *testing.T) {
	runs := []IPerfRun{
		{BandwidthMbps: 10000, Retransmits: 10},
		{BandwidthMbps: 12000, Retransmits: 20},
		{BandwidthMbps: 11000, Retransmits: 15},
	}
	s := ComputeSummary(runs)
	assert.InDelta(t, 11000, s.BandwidthMbpsAvg, 0.1)
	assert.InDelta(t, 10000, s.BandwidthMbpsMin, 0.1)
	assert.InDelta(t, 12000, s.BandwidthMbpsMax, 0.1)
	assert.InDelta(t, 816.5, s.BandwidthMbpsStddev, 1.0)
	assert.InDelta(t, 15, s.RetransmitsAvg, 0.1)
}

func TestComputeSummaryEmpty(t *testing.T) {
	s := ComputeSummary(nil)
	assert.Zero(t, s.BandwidthMbpsAvg)
}

func TestComputeOverhead(t *testing.T) {
	assert.InDelta(t, 10.0, ComputeOverhead(100, 90), 0.01)
	assert.InDelta(t, 0.0, ComputeOverhead(100, 100), 0.01)
	assert.InDelta(t, 0.0, ComputeOverhead(0, 0), 0.01)
}

func TestWriteResult(t *testing.T) {
	dir := t.TempDir()
	r := &BenchmarkResult{
		CloudProvider:  "gcp",
		InstanceFamily: "c4",
		InstanceType:   "c4-standard-4",
	}
	require.NoError(t, WriteResult(dir, r, false))

	data, err := os.ReadFile(filepath.Join(dir, "gcp", "c4", "results", "c4-standard-4.json"))
	require.NoError(t, err)

	var loaded BenchmarkResult
	require.NoError(t, json.Unmarshal(data, &loaded))
	assert.Equal(t, "c4-standard-4", loaded.InstanceType)
}

func TestWriteResultENAExpress(t *testing.T) {
	dir := t.TempDir()
	r := &BenchmarkResult{
		CloudProvider:  "aws",
		InstanceFamily: "c6in",
		InstanceType:   "c6in.xlarge",
	}
	require.NoError(t, WriteResult(dir, r, true))

	_, err := os.Stat(filepath.Join(dir, "aws", "c6in", "results", "c6in.xlarge-ena-express.json"))
	require.NoError(t, err)
}
