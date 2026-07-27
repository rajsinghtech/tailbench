package tailnet

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestACLPolicy(t *testing.T) {
	tag := "tag:bench"
	acl := buildACL(tag, false, false)
	data, err := json.Marshal(acl)
	require.NoError(t, err)
	s := string(data)
	assert.Contains(t, s, `"tagOwners"`)
	assert.Contains(t, s, `"tag:bench"`)
	assert.Contains(t, s, `"accept"`)
}

func TestACLExitNodeAutoApprover(t *testing.T) {
	tag := "tag:bench"

	// Exit-node approver is present even for the plain VM case (no SSH, no K8s).
	acl := buildACL(tag, false, false)
	require.NotNil(t, acl.AutoApprovers)
	assert.Equal(t, []string{tag}, acl.AutoApprovers.ExitNode)
	assert.Empty(t, acl.AutoApprovers.Routes, "no route approver without the operator")

	// K8s operator case keeps the 0.0.0.0/0 route approver AND the exit-node one.
	k8s := buildACL(tag, false, true)
	require.NotNil(t, k8s.AutoApprovers)
	assert.Equal(t, []string{tag}, k8s.AutoApprovers.ExitNode)
	assert.Equal(t, []string{tag}, k8s.AutoApprovers.Routes["0.0.0.0/0"])
}

func TestACLPeerRelayGrant(t *testing.T) {
	tag := "tag:bench"

	acl := buildACL(tag, false, false)
	require.NotEmpty(t, acl.Grants, "peer-relay grant must exist even without the K8s operator")
	found := false
	for _, g := range acl.Grants {
		if _, ok := g.App["tailscale.com/cap/relay"]; ok {
			found = true
			assert.Equal(t, []string{tag}, g.Source)
			assert.Equal(t, []string{tag}, g.Destination)
		}
	}
	assert.True(t, found, "expected a tailscale.com/cap/relay grant")

	// The K8s operator case must keep BOTH the relay grant and the existing
	// kubernetes-impersonation + bench-service grants, not overwrite them.
	k8s := buildACL(tag, false, true)
	relayFound, kubeFound, benchFound := false, false, false
	for _, g := range k8s.Grants {
		if _, ok := g.App["tailscale.com/cap/relay"]; ok {
			relayFound = true
		}
		if _, ok := g.App["tailscale.com/cap/kubernetes"]; ok {
			kubeFound = true
		}
		if len(g.Destination) == 1 && g.Destination[0] == "tag:bench-service" {
			benchFound = true
		}
	}
	assert.True(t, relayFound, "K8s ACL must still grant peer-relay")
	assert.True(t, kubeFound, "K8s ACL must still grant kubernetes impersonation")
	assert.True(t, benchFound, "K8s ACL must still grant bench-service access")
}

func TestManagerDefaults(t *testing.T) {
	m := &Manager{
		OrgClientID:     "test-id",
		OrgClientSecret: "test-secret",
		Tag:             "tag:bench",
	}
	assert.Equal(t, "tag:bench", m.Tag)
}
