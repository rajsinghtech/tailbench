package tailnet

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	tailscale "tailscale.com/client/tailscale/v2"
)

func TestACLPolicy(t *testing.T) {
	tag := "tag:bench"
	acl := tailscale.ACL{
		ACLs: []tailscale.ACLEntry{
			{Action: "accept", Source: []string{"*"}, Destination: []string{"*:*"}},
		},
		TagOwners: map[string][]string{tag: {tag}},
	}
	data, err := json.Marshal(acl)
	require.NoError(t, err)
	s := string(data)
	assert.Contains(t, s, `"tagOwners"`)
	assert.Contains(t, s, `"tag:bench"`)
	assert.Contains(t, s, `"accept"`)
}

func TestManagerDefaults(t *testing.T) {
	m := &Manager{
		OrgClientID:     "test-id",
		OrgClientSecret: "test-secret",
		Tag:             "tag:bench",
	}
	assert.Equal(t, "tag:bench", m.Tag)
}
