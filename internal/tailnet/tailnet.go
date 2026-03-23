package tailnet

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	tailscale "tailscale.com/client/tailscale/v2"
)

const defaultBaseURL = "https://api.tailscale.com"

type Manager struct {
	OrgClientID     string
	OrgClientSecret string
	Tag             string
	BaseURL         string // defaults to https://api.tailscale.com
}

type TailnetInfo struct {
	DNSName           string
	OAuthClientID     string
	OAuthClientSecret string
}

// getOrgToken gets an OAuth access token using org-level credentials.
func (m *Manager) getOrgToken(ctx context.Context) (string, error) {
	baseURL := m.BaseURL
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	data := fmt.Sprintf("grant_type=client_credentials&client_id=%s&client_secret=%s",
		m.OrgClientID, m.OrgClientSecret)
	req, err := http.NewRequestWithContext(ctx, "POST", baseURL+"/api/v2/oauth/token",
		bytes.NewBufferString(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("oauth token failed (HTTP %d): %s", resp.StatusCode, body)
	}
	var result struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}
	return result.AccessToken, nil
}

// CreateTailnet creates an ephemeral API-only tailnet.
// The tailnet creation API is not in the v2 client, so we call it directly.
func (m *Manager) CreateTailnet(ctx context.Context, name string) (*TailnetInfo, error) {
	token, err := m.getOrgToken(ctx)
	if err != nil {
		return nil, fmt.Errorf("get org token: %w", err)
	}
	baseURL := m.BaseURL
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	payload, _ := json.Marshal(map[string]string{"displayName": name})
	req, err := http.NewRequestWithContext(ctx, "POST",
		baseURL+"/api/v2/organizations/-/tailnets", bytes.NewBuffer(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("tailnet creation failed (HTTP %d): %s", resp.StatusCode, body)
	}
	var result struct {
		DNSName     string `json:"dnsName"`
		OAuthClient struct {
			ID     string `json:"id"`
			Secret string `json:"secret"`
		} `json:"oauthClient"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}
	return &TailnetInfo{
		DNSName:           result.DNSName,
		OAuthClientID:     result.OAuthClient.ID,
		OAuthClientSecret: result.OAuthClient.Secret,
	}, nil
}

// DeleteTailnet deletes an ephemeral tailnet by DNS name.
func (m *Manager) DeleteTailnet(ctx context.Context, dnsName string) error {
	token, err := m.getOrgToken(ctx)
	if err != nil {
		return fmt.Errorf("get org token: %w", err)
	}
	baseURL := m.BaseURL
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	req, err := http.NewRequestWithContext(ctx, "DELETE",
		baseURL+"/api/v2/tailnet/"+dnsName, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 404 {
		return nil // already deleted or auto-cleaned
	}
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("tailnet deletion failed (HTTP %d): %s", resp.StatusCode, body)
	}
	return nil
}

// newTailscaleClient creates a tailscale v2 client with OAuth credentials.
func newTailscaleClient(clientID, clientSecret string) *tailscale.Client {
	return &tailscale.Client{
		Auth: &tailscale.OAuth{
			ClientID:     clientID,
			ClientSecret: clientSecret,
		},
	}
}

// SetupACL sets the permissive benchmark ACL policy with tagOwners.
// When tsnetSSH is true, adds SSH rules so tagged nodes can SSH into each other.
// When k8sOperator is true, adds auto-approvers for Tailscale Services (operator API server proxy).
func (m *Manager) SetupACL(ctx context.Context, clientID, clientSecret string, tsnetSSH, k8sOperator bool) error {
	client := newTailscaleClient(clientID, clientSecret)
	acl := tailscale.ACL{
		ACLs: []tailscale.ACLEntry{
			{Action: "accept", Source: []string{"*"}, Destination: []string{"*:*"}},
		},
		TagOwners: map[string][]string{
			m.Tag: {m.Tag},
		},
	}
	acl.TagOwners["tag:bench-service"] = []string{m.Tag}
	if tsnetSSH {
		acl.SSH = []tailscale.ACLSSH{
			{
				Action:      "accept",
				Source:      []string{m.Tag},
				Destination: []string{m.Tag},
				Users:       []string{"root", "autogroup:nonroot"},
			},
		}
	}
	if k8sOperator {
		acl.AutoApprovers = &tailscale.ACLAutoApprovers{
			Routes: map[string][]string{
				"0.0.0.0/0": {m.Tag},
			},
		}
		// Grant the orchestrator tag the tailscale.com/cap/kubernetes app cap
		// so the operator API server proxy can impersonate as system:masters.
		acl.Grants = []tailscale.Grant{
			{
				Source:      []string{m.Tag},
				Destination: []string{m.Tag},
				IP:          []string{"*"},
				App: map[string][]map[string]any{
					"tailscale.com/cap/kubernetes": {
						{
							"impersonate": map[string]any{
								"groups": []string{"system:masters"},
							},
						},
					},
				},
			},
		}
		acl.Grants = append(acl.Grants, tailscale.Grant{
			Source:      []string{m.Tag},
			Destination: []string{"tag:bench-service"},
			IP:          []string{"*"},
		})
	}
	return client.PolicyFile().Set(ctx, acl, "")
}

// EnableHTTPS enables HTTPS certificates on the tailnet.
// MagicDNS is already enabled on ephemeral tailnets.
func (m *Manager) EnableHTTPS(ctx context.Context, clientID, clientSecret string) error {
	client := newTailscaleClient(clientID, clientSecret)
	httpsEnabled := true
	return client.TailnetSettings().Update(ctx, tailscale.UpdateTailnetSettingsRequest{
		HTTPSEnabled: &httpsEnabled,
	})
}

// CreateAuthKey creates a reusable, ephemeral, preauthorized auth key.
func (m *Manager) CreateAuthKey(ctx context.Context, clientID, clientSecret string) (string, error) {
	client := newTailscaleClient(clientID, clientSecret)
	key, err := client.Keys().CreateAuthKey(ctx, tailscale.CreateKeyRequest{
		Capabilities: tailscale.KeyCapabilities{
			Devices: struct {
				Create struct {
					Reusable      bool     `json:"reusable"`
					Ephemeral     bool     `json:"ephemeral"`
					Tags          []string `json:"tags"`
					Preauthorized bool     `json:"preauthorized"`
				} `json:"create"`
			}{
				Create: struct {
					Reusable      bool     `json:"reusable"`
					Ephemeral     bool     `json:"ephemeral"`
					Tags          []string `json:"tags"`
					Preauthorized bool     `json:"preauthorized"`
				}{
					Reusable:      true,
					Ephemeral:     true,
					Preauthorized: true,
					Tags:          []string{m.Tag},
				},
			},
		},
		ExpirySeconds: 3600,
	})
	if err != nil {
		return "", fmt.Errorf("create auth key: %w", err)
	}
	return key.Key, nil
}
