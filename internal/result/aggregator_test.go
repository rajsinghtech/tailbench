package result

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAggregate(t *testing.T) {
	dir := t.TempDir()
	r1 := &BenchmarkResult{CloudProvider: "gcp", InstanceFamily: "c4", InstanceType: "c4-standard-4"}
	r2 := &BenchmarkResult{CloudProvider: "aws", InstanceFamily: "c6in", InstanceType: "c6in.xlarge"}
	require.NoError(t, WriteResult(dir, r1, false))
	require.NoError(t, WriteResult(dir, r2, false))

	require.NoError(t, Aggregate(dir))

	data, err := os.ReadFile(filepath.Join(dir, "website", "data.generated.js"))
	require.NoError(t, err)
	content := string(data)
	assert.True(t, strings.HasPrefix(content, "const TAILBENCH_DATA = "))
	assert.True(t, strings.HasSuffix(strings.TrimSpace(content), ";"))
	assert.Contains(t, content, "c4-standard-4")
	assert.Contains(t, content, "c6in.xlarge")
}

func TestAggregateEmpty(t *testing.T) {
	dir := t.TempDir()
	require.NoError(t, Aggregate(dir))

	data, err := os.ReadFile(filepath.Join(dir, "website", "data.generated.js"))
	require.NoError(t, err)
	content := string(data)
	assert.Contains(t, content, "const TAILBENCH_DATA = ")
}

func TestAggregateInjectsForwardingOptimization(t *testing.T) {
	dir := t.TempDir()
	baseline := forwardingResult(
		"forward-pps-exit-k8s",
		"off",
		[]PPSSizeResult{
			{Label: "64", DatagramBytes: 64, UsablePPS: 500_000},
			{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 812_000},
			{Label: "mtu", DatagramBytes: 1400, UsablePPS: 1_000_000},
		},
	)
	optimized := forwardingResult(
		"forward-pps-exit-k8s-opton",
		"on",
		[]PPSSizeResult{
			{Label: "64", DatagramBytes: 64, UsablePPS: 625_000},
			{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 1_089_704},
			{Label: "mtu", DatagramBytes: 1400, UsablePPS: 900_000},
			{Label: "extra", DatagramBytes: 1200, UsablePPS: 950_000},
		},
	)
	require.NoError(t, WriteResult(dir, baseline, false))
	require.NoError(t, WriteResult(dir, optimized, false))

	require.NoError(t, Aggregate(dir))
	results := readAggregatedResults(t, dir)
	require.Len(t, results, 2)

	var got *BenchmarkResult
	for i := range results {
		if results[i].TransportMode == forwardPPSK8SOptimizedMode {
			got = &results[i]
		}
	}
	require.NotNil(t, got)
	require.NotNil(t, got.ForwardingOptimization)
	comparison := got.ForwardingOptimization
	assert.Equal(t, "on", comparison.State)
	assert.Equal(t, forwardPPSK8SBaselineMode, comparison.BaselineMode)
	assert.Equal(t, 812_000.0, comparison.BaselineUsablePPS)
	assert.InDelta(t, 34.2, comparison.GainPct, 0.000_001)
	require.Len(t, comparison.Sizes, 3)
	assert.Equal(t, "64", comparison.Sizes[0].Label)
	assert.InDelta(t, 25.0, comparison.Sizes[0].GainPct, 0.000_001)
	assert.Equal(t, "imix-avg", comparison.Sizes[1].Label)
	assert.InDelta(t, 34.2, comparison.Sizes[1].GainPct, 0.000_001)
	assert.Equal(t, "mtu", comparison.Sizes[2].Label)
	assert.InDelta(t, -10.0, comparison.Sizes[2].GainPct, 0.000_001)
}

func TestAggregateForwardingOptimizationSkipsUnpairableResults(t *testing.T) {
	tests := []struct {
		name    string
		results []*BenchmarkResult
	}{
		{
			name: "baseline only",
			results: []*BenchmarkResult{
				forwardingResult(
					"forward-pps-exit-k8s",
					"off",
					[]PPSSizeResult{{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 100}},
				),
			},
		},
		{
			name: "VM mode only",
			results: []*BenchmarkResult{
				forwardingResult(
					"forward-pps-exit",
					"",
					[]PPSSizeResult{{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 100}},
				),
			},
		},
		{
			name: "stale aggregate field on optimized arm",
			results: []*BenchmarkResult{
				func() *BenchmarkResult {
					result := forwardingResult(
						"forward-pps-exit-k8s-opton",
						"on",
						[]PPSSizeResult{{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 100}},
					)
					result.ForwardingOptimization = &ForwardingOptimization{
						State:             "on",
						BaselineMode:      "forward-pps-exit-k8s",
						BaselineUsablePPS: 50,
						GainPct:           100,
					}
					return result
				}(),
			},
		},
		{
			name: "zero baseline",
			results: []*BenchmarkResult{
				forwardingResult(
					"forward-pps-exit-k8s",
					"off",
					[]PPSSizeResult{{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 0}},
				),
				forwardingResult(
					"forward-pps-exit-k8s-opton",
					"on",
					[]PPSSizeResult{{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 100}},
				),
			},
		},
		{
			name: "different identity",
			results: []*BenchmarkResult{
				forwardingResult(
					"forward-pps-exit-k8s",
					"off",
					[]PPSSizeResult{{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 100}},
				),
				func() *BenchmarkResult {
					result := forwardingResult(
						"forward-pps-exit-k8s-opton",
						"on",
						[]PPSSizeResult{{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 150}},
					)
					result.InstanceType = "c3-standard-16"
					return result
				}(),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			for _, result := range tt.results {
				require.NoError(t, WriteResult(dir, result, false))
			}
			require.NoError(t, Aggregate(dir))

			for _, result := range readAggregatedResults(t, dir) {
				assert.Nil(t, result.ForwardingOptimization)
			}
		})
	}
}

func forwardingResult(mode, optimizationState string, sizes []PPSSizeResult) *BenchmarkResult {
	return &BenchmarkResult{
		CloudProvider:        "gke",
		InstanceFamily:       "c3",
		InstanceType:         "c3-standard-8",
		Environment:          "container",
		TransportMode:        mode,
		ForwardOptimizations: optimizationState,
		ForwardPPS:           &PPSResult{Sizes: sizes, LossThresholdPct: 0.1},
	}
}

func readAggregatedResults(t *testing.T, rootDir string) []BenchmarkResult {
	t.Helper()
	data, err := os.ReadFile(filepath.Join(rootDir, "website", "data.generated.js"))
	require.NoError(t, err)
	jsonData := strings.TrimPrefix(string(data), "const TAILBENCH_DATA = ")
	jsonData = strings.TrimSuffix(strings.TrimSpace(jsonData), ";")

	var results []BenchmarkResult
	require.NoError(t, json.Unmarshal([]byte(jsonData), &results))
	return results
}
