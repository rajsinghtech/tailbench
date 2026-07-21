package orchestrator

import (
	"os"
	"path/filepath"
	"testing"

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
