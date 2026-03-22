package tailnet

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTailnetLifecycleE2E(t *testing.T) {
	clientID := os.Getenv("TS_OAUTH_CLIENT_ID")
	clientSecret := os.Getenv("TS_OAUTH_CLIENT_SECRET")
	if clientID == "" || clientSecret == "" {
		t.Skip("TS_OAUTH_CLIENT_ID and TS_OAUTH_CLIENT_SECRET required for e2e test")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	mgr := &Manager{
		OrgClientID:     clientID,
		OrgClientSecret: clientSecret,
		Tag:             "tag:bench",
	}

	// 1. Create tailnet
	name := fmt.Sprintf("tailbench-e2e-%d", time.Now().Unix())
	t.Logf("Creating tailnet: %s", name)

	info, err := mgr.CreateTailnet(ctx, name)
	require.NoError(t, err, "CreateTailnet failed")
	require.NotEmpty(t, info.DNSName, "DNSName empty")
	require.NotEmpty(t, info.OAuthClientID, "OAuthClientID empty")
	require.NotEmpty(t, info.OAuthClientSecret, "OAuthClientSecret empty")
	t.Logf("Created tailnet: %s (client_id: %s...)", info.DNSName, info.OAuthClientID[:8])

	// Always clean up
	defer func() {
		t.Log("Deleting tailnet...")
		delErr := mgr.DeleteTailnet(context.Background(), info.DNSName)
		if delErr != nil {
			t.Logf("WARNING: DeleteTailnet failed: %v", delErr)
		} else {
			t.Log("Tailnet deleted")
		}
	}()

	// 2. Setup ACL
	t.Log("Setting up ACL...")
	err = mgr.SetupACL(ctx, info.OAuthClientID, info.OAuthClientSecret, false)
	require.NoError(t, err, "SetupACL failed")
	t.Log("ACL set")

	// 3. Create auth key
	t.Log("Creating auth key...")
	authKey, err := mgr.CreateAuthKey(ctx, info.OAuthClientID, info.OAuthClientSecret)
	require.NoError(t, err, "CreateAuthKey failed")
	assert.True(t, len(authKey) > 20, "auth key too short: %d chars", len(authKey))
	t.Logf("Auth key created: %s...", authKey[:12])

	t.Log("E2E tailnet lifecycle test passed")
}
