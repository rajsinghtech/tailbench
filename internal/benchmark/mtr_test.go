package benchmark

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const sampleMTROutput = `Start: 2024-01-15T10:00:00+0000
HOST: ip-10-0-1-100            Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- ip-10-0-1-1             0.0%    10    0.3   0.3   0.2   0.5   0.1
  2.|-- 100.64.0.1              0.0%    10    1.2   1.1   0.9   1.5   0.2
  3.|-- ip-10-0-2-100           0.0%    10    0.8   0.9   0.7   1.2   0.1
`

func TestParseMTR(t *testing.T) {
	res, err := ParseMTR(sampleMTROutput, "10.0.2.100")
	require.NoError(t, err)
	assert.Equal(t, "10.0.2.100", res.TargetIP)
	require.Len(t, res.Hops, 3)

	h := res.Hops[0]
	assert.Equal(t, 1, h.Hop)
	assert.Equal(t, "ip-10-0-1-1", h.Host)
	assert.InDelta(t, 0.0, h.LossPct, 0.01)
	assert.Equal(t, 10, h.Snt)
	assert.InDelta(t, 0.3, h.LastMs, 0.01)
	assert.InDelta(t, 0.3, h.AvgMs, 0.01)
	assert.InDelta(t, 0.2, h.BestMs, 0.01)
	assert.InDelta(t, 0.5, h.WorstMs, 0.01)
	assert.InDelta(t, 0.1, h.StdevMs, 0.01)

	h3 := res.Hops[2]
	assert.Equal(t, 3, h3.Hop)
	assert.Equal(t, "ip-10-0-2-100", h3.Host)
}

func TestParseMTR_Empty(t *testing.T) {
	res, err := ParseMTR("", "10.0.0.1")
	require.NoError(t, err)
	assert.Equal(t, "10.0.0.1", res.TargetIP)
	assert.Empty(t, res.Hops)
}
