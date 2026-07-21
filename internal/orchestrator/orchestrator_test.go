package orchestrator

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/result"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCompletedForwardModeDoesNotNeedRouter(t *testing.T) {
	root := t.TempDir()
	resultDir := filepath.Join(root, "gcp", "c4", "results")
	require.NoError(t, os.MkdirAll(resultDir, 0o755))
	require.NoError(t, os.WriteFile(
		filepath.Join(resultDir, "c4-standard-4-forward-pps-exit.json"),
		[]byte("{}"),
		0o644,
	))

	pending := pendingModesForInstance(
		root,
		"gcp",
		"c4",
		"c4-standard-4",
		[]string{"forward-pps-exit", "l7-serve-h1"},
		"vm",
	)

	assert.Equal(t, []string{"l7-serve-h1"}, pending)
	assert.False(t, hasForwardMode(pending))
}

func TestForwardPPSTestConfigRecordsEffectiveSettings(t *testing.T) {
	pps := &result.PPSResult{
		LossThresholdPct: 0.25,
		Sizes: []result.PPSSizeResult{
			{DatagramBytes: 96},
			{DatagramBytes: 512},
			{DatagramBytes: 1200},
		},
	}

	assert.Equal(t, &result.TestConfig{
		PPSDatagramSizes:    []int{96, 512, 1200},
		PPSLossThresholdPct: 0.25,
	}, forwardPPSTestConfig(pps))
	assert.Nil(t, forwardPPSTestConfig(nil))
}

func TestBenchmarkRunConfigPropagatesPPSSettings(t *testing.T) {
	o := &Orchestrator{cfg: &config.Config{
		PPSDatagramSizes:    []int{96, 512, 1200},
		PPSLossThresholdPct: 0.25,
		PPSDurationSec:      9,
		PPSMaxRatePPS:       750_000,
	}}

	got := o.benchmarkRunConfig("auth-key", "server", "client")
	assert.Equal(t, []int{96, 512, 1200}, got.PPSDatagramSizes)
	assert.Equal(t, 0.25, got.PPSLossThresholdPct)
	assert.Equal(t, 9, got.PPSDurationSec)
	assert.Equal(t, 750_000, got.PPSMaxRatePPS)
	assert.Equal(t, "auth-key", got.AuthKey)
	assert.Equal(t, "server", got.ServerHostname)
	assert.Equal(t, "client", got.ClientHostname)
	assert.True(t, got.SkipTailscaleSetup)
}
