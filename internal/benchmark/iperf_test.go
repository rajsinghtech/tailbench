package benchmark

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const sampleIPerfJSON = `{
  "end": {
    "sum_sent": {
      "bits_per_second": 5000000000,
      "retransmits": 42,
      "seconds": 10.0,
      "bytes": 6250000000
    }
  }
}`

func TestParseIPerfJSON(t *testing.T) {
	run, err := ParseIPerfJSON([]byte(sampleIPerfJSON))
	require.NoError(t, err)
	assert.InDelta(t, 5000.0, run.BandwidthMbps, 0.01)
	assert.Equal(t, 42, run.Retransmits)
	assert.InDelta(t, 10.0, run.DurationSec, 0.01)
	assert.Equal(t, int64(6250000000), run.BytesTransferred)
}

func TestParseIPerfJSON_InvalidJSON(t *testing.T) {
	_, err := ParseIPerfJSON([]byte(`not json`))
	require.Error(t, err)
}

func TestParseIPerfJSON_WithError(t *testing.T) {
	data := []byte(`{"error": "the server is busy running a test"}`)
	_, err := ParseIPerfJSON(data)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "the server is busy running a test")
}

func TestIPerfError_WithError(t *testing.T) {
	data := []byte(`{"error": "unable to connect"}`)
	err := IPerfError(data)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "unable to connect")
}

func TestIPerfError_NoError(t *testing.T) {
	err := IPerfError([]byte(sampleIPerfJSON))
	require.NoError(t, err)
}

func TestIPerfPort(t *testing.T) {
	assert.Equal(t, 15201, IPerfPort)
}
