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

func TestManagerDefaults(t *testing.T) {
	m := &Manager{
		OrgClientID:     "test-id",
		OrgClientSecret: "test-secret",
		Tag:             "tag:bench",
	}
	assert.Equal(t, "tag:bench", m.Tag)
}
