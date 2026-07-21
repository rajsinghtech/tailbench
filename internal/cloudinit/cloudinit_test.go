package cloudinit

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRender(t *testing.T) {
	out, err := Render(Config{
		AuthKey:  "tskey-auth-abc123",
		Hostname: "tb-c4-standard-4-server",
	})
	require.NoError(t, err)
	assert.Contains(t, out, "tskey-auth-abc123")
	assert.Contains(t, out, "tb-c4-standard-4-server")
	assert.Contains(t, out, "tailbench-ready")
	assert.Contains(t, out, "rx-udp-gro-forwarding")
	assert.Contains(t, out, "tcp_congestion_control=bbr")
}

func TestRenderNoAuthKey(t *testing.T) {
	out, err := Render(Config{})
	require.NoError(t, err)
	assert.NotContains(t, out, "tailscale up")
	assert.Contains(t, out, "tailbench-ready")
}

func TestRenderExitNode(t *testing.T) {
	out, err := Render(Config{
		AuthKey:           "tskey-auth-abc123",
		Hostname:          "tb-c4-standard-4-router",
		AdvertiseExitNode: true,
	})
	require.NoError(t, err)
	assert.Contains(t, out, "tailscale up --authkey=tskey-auth-abc123")
	assert.Contains(t, out, "--advertise-exit-node")

	// A plain node must not advertise an exit node.
	plain, err := Render(Config{AuthKey: "tskey-auth-abc123", Hostname: "tb-c4-standard-4-server"})
	require.NoError(t, err)
	assert.NotContains(t, plain, "--advertise-exit-node")
}
