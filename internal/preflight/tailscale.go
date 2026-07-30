package preflight

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// DefaultTailscaleAPIBaseURL is the public Tailscale control API.
const DefaultTailscaleAPIBaseURL = "https://api.tailscale.com"

const (
	tailscaleOAuthConsole = "https://login.tailscale.com/admin/settings/oauth"
	tailscaleDNSConsole   = "https://login.tailscale.com/admin/dns"

	// Responses are only ever used to build a one-line diagnostic, so read a
	// bounded prefix rather than whatever the server decides to send.
	tailscaleBodyLimit = 4096
)

const tailscaleAuthRemediation = "verify the Tailscale OAuth client at " +
	tailscaleOAuthConsole +
	" is current and unrevoked, then set OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET to its values"

const tailscaleHTTPSRemediation = "enable HTTPS certificates for the tailnet at " +
	tailscaleDNSConsole +
	" (HTTPS Certificates -> Enable), or remove the l7-serve modes from benchmark.modes"

// HTTPDoer is the injectable seam for the read-only Tailscale API probes. It
// mirrors CommandRunner: production uses http.DefaultClient and tests supply a
// stub, so preflight never reaches the network from a test.
type HTTPDoer interface {
	Do(req *http.Request) (*http.Response, error)
}

// TailscaleRequest carries the credentials and configuration the Tailscale
// probes need. It is populated only on the explicit remote path; local doctor
// leaves it zero and never reads credentials.
type TailscaleRequest struct {
	OAuthClientID     string
	OAuthClientSecret string
	CreateTailnet     bool
	Modes             []string
	Workload          string
}

// TailscaleChecker performs read-only Tailscale capability checks. It is a
// separate seam from RemoteChecker because Tailscale is reached over HTTP
// rather than by shelling out to a CLI.
type TailscaleChecker interface {
	CheckTailscale(ctx context.Context, request TailscaleRequest) []Check
}

// APITailscaleChecker verifies Tailscale capability, not merely credential
// presence, against the Tailscale v2 API. Every call is read-only: it exchanges
// the OAuth credentials for a token and reads tailnet settings. It never
// creates a tailnet, a key, or a device, and it never places a credential or a
// token in a check detail.
type APITailscaleChecker struct {
	BaseURL string
	Client  HTTPDoer
}

func (c APITailscaleChecker) CheckTailscale(ctx context.Context, request TailscaleRequest) []Check {
	token, authCheck := c.checkAuth(ctx, request)
	return []Check{
		authCheck,
		c.checkHTTPS(ctx, request, token),
		tailnetCreateCheck(request),
	}
}

// checkAuth exchanges the configured OAuth client credentials for an API token.
// A present-but-invalid or revoked credential is otherwise only discovered once
// a run has already started provisioning.
func (c APITailscaleChecker) checkAuth(
	ctx context.Context,
	request TailscaleRequest,
) (string, Check) {
	check := Check{Name: "tailscale-auth", Remote: true}
	clientID := strings.TrimSpace(request.OAuthClientID)
	clientSecret := strings.TrimSpace(request.OAuthClientSecret)
	if clientID == "" || clientSecret == "" {
		check.Status = StatusSkipped
		check.Detail = "no Tailscale OAuth client credentials were supplied"
		check.Remediation = tailscaleAuthRemediation
		return "", check
	}

	form := url.Values{}
	form.Set("grant_type", "client_credentials")
	form.Set("client_id", clientID)
	form.Set("client_secret", clientSecret)
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.endpoint("/api/v2/oauth/token"),
		strings.NewReader(form.Encode()),
	)
	if err != nil {
		check.Status = StatusFailed
		check.Detail = "build Tailscale OAuth token request: " + err.Error()
		check.Remediation = tailscaleAuthRemediation
		return "", check
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	status, body, err := c.send(req)
	if err != nil {
		check.Status = StatusFailed
		check.Detail = "Tailscale OAuth token exchange failed: " +
			redactSecrets(err.Error(), clientID, clientSecret)
		check.Remediation = tailscaleAuthRemediation
		return "", check
	}
	if status != http.StatusOK {
		check.Status = StatusFailed
		check.Detail = fmt.Sprintf(
			"Tailscale rejected the OAuth client credentials (HTTP %d)%s",
			status,
			apiFailureDetail(body, clientID, clientSecret),
		)
		check.Remediation = tailscaleAuthRemediation
		return "", check
	}

	var payload struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		check.Status = StatusFailed
		check.Detail = "Tailscale OAuth token response was not valid JSON"
		check.Remediation = tailscaleAuthRemediation
		return "", check
	}
	token := strings.TrimSpace(payload.AccessToken)
	if token == "" {
		check.Status = StatusFailed
		check.Detail = "Tailscale OAuth token response contained no access token"
		check.Remediation = tailscaleAuthRemediation
		return "", check
	}

	check.Status = StatusPassed
	check.Detail = "OAuth client credentials were exchanged for a Tailscale API token; " +
		"credential and token values are not displayed"
	return token, check
}

// checkHTTPS reads the tailnet HTTPS setting when the run needs it. Cloud-init
// runs `tailscale serve --bg --https=443`, which blocks indefinitely when the
// tailnet has no HTTPS certificates, so the node never writes
// /tmp/tailbench-ready and every instance bills for the full run duration with
// no visible cause.
func (c APITailscaleChecker) checkHTTPS(
	ctx context.Context,
	request TailscaleRequest,
	token string,
) Check {
	check := Check{Name: "tailscale-https", Status: StatusSkipped, Remote: true}
	if !requiresTailnetHTTPS(request) {
		check.Detail = "no l7-serve benchmark mode is configured, " +
			"so tailnet HTTPS certificates are not required"
		return check
	}
	if request.CreateTailnet {
		// The tailnet that will serve does not exist yet, and the orchestrator
		// enables HTTPS on it right after creating it. Reading the credential's
		// current tailnet would report the wrong tailnet's setting.
		check.Detail = "create_tailnet is true: Tailbench creates the benchmark tailnet " +
			"and enables HTTPS on it, so the credential's current tailnet is not the one that serves"
		return check
	}
	if token == "" {
		check.Detail = "tailnet HTTPS state was not read because the OAuth token exchange did not succeed"
		check.Remediation = tailscaleAuthRemediation
		return check
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		c.endpoint("/api/v2/tailnet/-/settings"),
		nil,
	)
	if err != nil {
		check.Status = StatusWarning
		check.Detail = "build tailnet settings request: " + err.Error()
		check.Remediation = tailscaleHTTPSRemediation
		return check
	}
	req.Header.Set("Authorization", "Bearer "+token)

	status, body, err := c.send(req)
	if err != nil {
		check.Status = StatusWarning
		check.Detail = "tailnet settings request failed, so HTTPS state is unknown: " +
			redactSecrets(err.Error(), token, request.OAuthClientID, request.OAuthClientSecret)
		check.Remediation = tailscaleHTTPSRemediation
		return check
	}
	if status != http.StatusOK {
		check.Status = StatusWarning
		check.Detail = fmt.Sprintf(
			"tailnet settings could not be read (HTTP %d), so HTTPS state is unknown%s",
			status,
			apiFailureDetail(body, token, request.OAuthClientID, request.OAuthClientSecret),
		)
		check.Remediation = tailscaleHTTPSRemediation
		return check
	}

	// Decode loosely: an unexpected or renamed field must read as "unknown"
	// rather than silently decoding to false and blocking a valid run.
	var settings map[string]json.RawMessage
	if err := json.Unmarshal(body, &settings); err != nil {
		check.Status = StatusWarning
		check.Detail = "tailnet settings response was not a JSON object, so HTTPS state is unknown"
		check.Remediation = tailscaleHTTPSRemediation
		return check
	}
	raw, ok := settings["httpsEnabled"]
	if !ok {
		check.Status = StatusWarning
		check.Detail = "tailnet settings response did not report httpsEnabled, so HTTPS state is unknown"
		check.Remediation = tailscaleHTTPSRemediation
		return check
	}
	var enabled bool
	if err := json.Unmarshal(raw, &enabled); err != nil {
		check.Status = StatusWarning
		check.Detail = "tailnet settings reported a non-boolean httpsEnabled, so HTTPS state is unknown"
		check.Remediation = tailscaleHTTPSRemediation
		return check
	}
	if !enabled {
		check.Status = StatusFailed
		check.Detail = "HTTPS certificates are disabled on the tailnet. Cloud-init runs " +
			"`tailscale serve --bg --https=443`, which blocks until HTTPS is enabled, so no node " +
			"ever writes /tmp/tailbench-ready and every instance bills for the whole run"
		check.Remediation = tailscaleHTTPSRemediation
		return check
	}
	check.Status = StatusPassed
	check.Detail = "HTTPS certificates are enabled on the tailnet"
	return check
}

// tailnetCreateCheck reports whether the credential can create tailnets.
//
// Tailscale exposes no read-only way to introspect an OAuth client's
// organization permissions: the token response reports scope "all" for both an
// org-level client and a tailnet-scoped one, and the only definitive probe is
// POST /api/v2/organizations/-/tailnets, which really creates a tailnet. Doctor
// stays read-only, so this check names the failure and its remedy instead of
// pretending to verify it.
func tailnetCreateCheck(request TailscaleRequest) Check {
	check := Check{Name: "tailscale-tailnet-create", Status: StatusSkipped, Remote: true}
	if !request.CreateTailnet {
		check.Detail = "create_tailnet is false: Tailbench joins the configured " +
			"tailscale.tailnet_dns_name and never creates a tailnet"
		return check
	}
	check.Detail = "cannot be verified read-only: Tailscale has no permission-introspection " +
		"endpoint, and the only proof is POST /api/v2/organizations/-/tailnets, which really " +
		"creates a tailnet. A tailnet-scoped OAuth client reports scope \"all\" and still fails " +
		"at that call with `403 actor does not have permission to create tailnets`"
	check.Remediation = "create the OAuth client at the organization level (" +
		tailscaleOAuthConsole + "), or set tailscale.create_tailnet: false and " +
		"tailscale.tailnet_dns_name to an existing benchmark tailnet"
	return check
}

// requiresTailnetHTTPS mirrors orchestrator.needsTailnetHTTPS: l7-serve modes
// run `tailscale serve --https` on the VM, and the Kubernetes operator's API
// server proxy needs tailnet certificates too.
func requiresTailnetHTTPS(request TailscaleRequest) bool {
	if request.Workload == "kubernetes" {
		return true
	}
	for _, mode := range request.Modes {
		if strings.HasPrefix(strings.TrimSpace(mode), "l7-serve") {
			return true
		}
	}
	return false
}

func (c APITailscaleChecker) endpoint(path string) string {
	base := strings.TrimSpace(c.BaseURL)
	if base == "" {
		base = DefaultTailscaleAPIBaseURL
	}
	return strings.TrimSuffix(base, "/") + path
}

func (c APITailscaleChecker) doer() HTTPDoer {
	if c.Client != nil {
		return c.Client
	}
	return http.DefaultClient
}

func (c APITailscaleChecker) send(req *http.Request) (int, []byte, error) {
	resp, err := c.doer().Do(req)
	if err != nil {
		return 0, nil, err
	}
	if resp.Body == nil {
		return resp.StatusCode, nil, nil
	}
	defer func() { _ = resp.Body.Close() }()
	body, err := io.ReadAll(io.LimitReader(resp.Body, tailscaleBodyLimit))
	if err != nil {
		return resp.StatusCode, nil, fmt.Errorf("read Tailscale API response: %w", err)
	}
	return resp.StatusCode, body, nil
}

// apiFailureDetail renders a bounded, credential-free suffix for a failed API
// call so operators see the control-plane message without any secret it echoed.
func apiFailureDetail(body []byte, secrets ...string) string {
	message := strings.TrimSpace(string(body))
	if message == "" {
		return ""
	}
	message = strings.Join(strings.Fields(message), " ")
	if len(message) > 200 {
		message = message[:200] + "..."
	}
	return ": " + redactSecrets(message, secrets...)
}

func redactSecrets(text string, secrets ...string) string {
	for _, secret := range secrets {
		secret = strings.TrimSpace(secret)
		if len(secret) < 4 {
			continue
		}
		text = strings.ReplaceAll(text, secret, "[redacted]")
	}
	return text
}
