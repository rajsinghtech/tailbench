package preflight

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
)

// stubDoer answers each request by path so a test never reaches the network.
type stubDoer struct {
	responses map[string]stubResponse
	requests  []*http.Request
	bodies    []string
}

type stubResponse struct {
	status int
	body   string
	err    error
}

func (d *stubDoer) Do(req *http.Request) (*http.Response, error) {
	body := ""
	if req.Body != nil {
		raw, err := io.ReadAll(req.Body)
		if err != nil {
			return nil, err
		}
		body = string(raw)
	}
	d.requests = append(d.requests, req)
	d.bodies = append(d.bodies, body)

	response, ok := d.responses[req.URL.Path]
	if !ok {
		return nil, errors.New("unexpected request path " + req.URL.Path)
	}
	if response.err != nil {
		return nil, response.err
	}
	status := response.status
	if status == 0 {
		status = http.StatusOK
	}
	return &http.Response{
		StatusCode: status,
		Body:       io.NopCloser(strings.NewReader(response.body)),
		Header:     make(http.Header),
	}, nil
}

const (
	tokenPath    = "/api/v2/oauth/token"
	settingsPath = "/api/v2/tailnet/-/settings"

	testClientID     = "ktest1CNTRL"
	testClientSecret = "tskey-client-ktest1CNTRL-secretvalue"
	testAccessToken  = "tskey-api-ktest1CNTRL-accesstokenvalue"
)

func okToken() stubResponse {
	return stubResponse{
		status: http.StatusOK,
		body:   `{"access_token":"` + testAccessToken + `","token_type":"Bearer","expires_in":3600}`,
	}
}

func TestAPITailscaleCheckerChecks(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		request    TailscaleRequest
		responses  map[string]stubResponse
		wantStatus map[string]Status
		wantDetail map[string]string
		wantPaths  []string
	}{
		{
			name: "valid credentials without l7-serve skip the https probe",
			request: TailscaleRequest{
				OAuthClientID:     testClientID,
				OAuthClientSecret: testClientSecret,
				Modes:             []string{"l4-kernel"},
				Workload:          "vm",
			},
			responses: map[string]stubResponse{tokenPath: okToken()},
			wantStatus: map[string]Status{
				"tailscale-auth":           StatusPassed,
				"tailscale-https":          StatusSkipped,
				"tailscale-tailnet-create": StatusSkipped,
			},
			wantDetail: map[string]string{
				"tailscale-https":          "no l7-serve benchmark mode is configured",
				"tailscale-tailnet-create": "create_tailnet is false",
			},
			wantPaths: []string{tokenPath},
		},
		{
			name: "invalid credentials fail auth and stop the https probe",
			request: TailscaleRequest{
				OAuthClientID:     testClientID,
				OAuthClientSecret: testClientSecret,
				Modes:             []string{"l7-serve-h2"},
				Workload:          "vm",
			},
			responses: map[string]stubResponse{
				tokenPath: {status: http.StatusUnauthorized, body: `{"message":"invalid client"}`},
			},
			wantStatus: map[string]Status{
				"tailscale-auth":  StatusFailed,
				"tailscale-https": StatusSkipped,
			},
			wantDetail: map[string]string{
				"tailscale-auth":  "HTTP 401",
				"tailscale-https": "OAuth token exchange did not succeed",
			},
			wantPaths: []string{tokenPath},
		},
		{
			name: "missing credentials skip every probe",
			request: TailscaleRequest{
				Modes:    []string{"l7-serve-h1"},
				Workload: "vm",
			},
			responses: map[string]stubResponse{},
			wantStatus: map[string]Status{
				"tailscale-auth":  StatusSkipped,
				"tailscale-https": StatusSkipped,
			},
			wantDetail: map[string]string{
				"tailscale-auth": "no Tailscale OAuth client credentials were supplied",
			},
			wantPaths: nil,
		},
		{
			name: "https enabled passes for an l7-serve mode",
			request: TailscaleRequest{
				OAuthClientID:     testClientID,
				OAuthClientSecret: testClientSecret,
				Modes:             []string{"l4-kernel", "l7-serve-h2"},
				Workload:          "vm",
			},
			responses: map[string]stubResponse{
				tokenPath:    okToken(),
				settingsPath: {status: http.StatusOK, body: `{"devicesApprovalOn":false,"httpsEnabled":true}`},
			},
			wantStatus: map[string]Status{
				"tailscale-auth":  StatusPassed,
				"tailscale-https": StatusPassed,
			},
			wantDetail: map[string]string{
				"tailscale-https": "HTTPS certificates are enabled",
			},
			wantPaths: []string{tokenPath, settingsPath},
		},
		{
			name: "https disabled fails and names the cloud-init symptom",
			request: TailscaleRequest{
				OAuthClientID:     testClientID,
				OAuthClientSecret: testClientSecret,
				Modes:             []string{"l7-serve-h1"},
				Workload:          "vm",
			},
			responses: map[string]stubResponse{
				tokenPath:    okToken(),
				settingsPath: {status: http.StatusOK, body: `{"httpsEnabled":false}`},
			},
			wantStatus: map[string]Status{
				"tailscale-auth":  StatusPassed,
				"tailscale-https": StatusFailed,
			},
			wantDetail: map[string]string{
				"tailscale-https": "tailscale serve --bg --https=443",
			},
			wantPaths: []string{tokenPath, settingsPath},
		},
		{
			name: "kubernetes workload probes https without an l7-serve mode",
			request: TailscaleRequest{
				OAuthClientID:     testClientID,
				OAuthClientSecret: testClientSecret,
				Modes:             []string{"l4-lb"},
				Workload:          "kubernetes",
			},
			responses: map[string]stubResponse{
				tokenPath:    okToken(),
				settingsPath: {status: http.StatusOK, body: `{"httpsEnabled":false}`},
			},
			wantStatus: map[string]Status{"tailscale-https": StatusFailed},
			wantPaths:  []string{tokenPath, settingsPath},
		},
		{
			name: "missing httpsEnabled field reports unknown rather than disabled",
			request: TailscaleRequest{
				OAuthClientID:     testClientID,
				OAuthClientSecret: testClientSecret,
				Modes:             []string{"l7-serve-h2"},
				Workload:          "vm",
			},
			responses: map[string]stubResponse{
				tokenPath:    okToken(),
				settingsPath: {status: http.StatusOK, body: `{"devicesApprovalOn":true}`},
			},
			wantStatus: map[string]Status{"tailscale-https": StatusWarning},
			wantDetail: map[string]string{
				"tailscale-https": "did not report httpsEnabled",
			},
			wantPaths: []string{tokenPath, settingsPath},
		},
		{
			name: "unreadable settings report unknown rather than disabled",
			request: TailscaleRequest{
				OAuthClientID:     testClientID,
				OAuthClientSecret: testClientSecret,
				Modes:             []string{"l7-serve-h2"},
				Workload:          "vm",
			},
			responses: map[string]stubResponse{
				tokenPath:    okToken(),
				settingsPath: {status: http.StatusForbidden, body: `{"message":"forbidden"}`},
			},
			wantStatus: map[string]Status{"tailscale-https": StatusWarning},
			wantDetail: map[string]string{
				"tailscale-https": "HTTP 403",
			},
			wantPaths: []string{tokenPath, settingsPath},
		},
		{
			name: "create_tailnet skips the https probe and names the 403",
			request: TailscaleRequest{
				OAuthClientID:     testClientID,
				OAuthClientSecret: testClientSecret,
				CreateTailnet:     true,
				Modes:             []string{"l7-serve-h2"},
				Workload:          "vm",
			},
			responses: map[string]stubResponse{tokenPath: okToken()},
			wantStatus: map[string]Status{
				"tailscale-auth":           StatusPassed,
				"tailscale-https":          StatusSkipped,
				"tailscale-tailnet-create": StatusSkipped,
			},
			wantDetail: map[string]string{
				"tailscale-https":          "create_tailnet is true",
				"tailscale-tailnet-create": "403 actor does not have permission to create tailnets",
			},
			wantPaths: []string{tokenPath},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			doer := &stubDoer{responses: test.responses}
			checks := APITailscaleChecker{BaseURL: "https://api.example.test", Client: doer}.
				CheckTailscale(context.Background(), test.request)

			byName := make(map[string]Check, len(checks))
			for _, check := range checks {
				if !check.Remote {
					t.Fatalf("check %q is not labeled remote", check.Name)
				}
				byName[check.Name] = check
			}
			for _, name := range []string{
				"tailscale-auth",
				"tailscale-https",
				"tailscale-tailnet-create",
			} {
				if _, ok := byName[name]; !ok {
					t.Fatalf("missing %q check: %#v", name, checks)
				}
			}
			for name, want := range test.wantStatus {
				if got := byName[name].Status; got != want {
					t.Fatalf("%s status = %q, want %q (detail=%q)", name, got, want, byName[name].Detail)
				}
			}
			for name, want := range test.wantDetail {
				if !strings.Contains(byName[name].Detail, want) {
					t.Fatalf("%s detail = %q, want it to contain %q", name, byName[name].Detail, want)
				}
			}

			var paths []string
			for _, req := range doer.requests {
				paths = append(paths, req.URL.Path)
			}
			if strings.Join(paths, ",") != strings.Join(test.wantPaths, ",") {
				t.Fatalf("request paths = %v, want %v", paths, test.wantPaths)
			}

			for _, check := range checks {
				for _, secret := range []string{testClientSecret, testAccessToken} {
					if strings.Contains(check.Detail, secret) ||
						strings.Contains(check.Remediation, secret) {
						t.Fatalf("check %q leaked a credential: %#v", check.Name, check)
					}
				}
			}
		})
	}
}

func TestAPITailscaleCheckerPostsClientCredentialsGrant(t *testing.T) {
	t.Parallel()

	doer := &stubDoer{responses: map[string]stubResponse{tokenPath: okToken()}}
	checks := APITailscaleChecker{Client: doer}.CheckTailscale(context.Background(), TailscaleRequest{
		OAuthClientID:     testClientID,
		OAuthClientSecret: testClientSecret,
		Workload:          "vm",
	})
	if checks[0].Status != StatusPassed {
		t.Fatalf("auth check = %#v", checks[0])
	}
	if len(doer.requests) != 1 {
		t.Fatalf("requests = %d, want 1", len(doer.requests))
	}
	req := doer.requests[0]
	if req.Method != http.MethodPost {
		t.Fatalf("method = %q, want POST", req.Method)
	}
	if req.URL.String() != DefaultTailscaleAPIBaseURL+tokenPath {
		t.Fatalf("url = %q", req.URL.String())
	}
	for _, want := range []string{
		"grant_type=client_credentials",
		"client_id=" + testClientID,
	} {
		if !strings.Contains(doer.bodies[0], want) {
			t.Fatalf("token request body = %q, want %q", doer.bodies[0], want)
		}
	}
}

func TestAPITailscaleCheckerRedactsCredentialsEchoedByTheAPI(t *testing.T) {
	t.Parallel()

	doer := &stubDoer{responses: map[string]stubResponse{
		tokenPath: {
			status: http.StatusBadRequest,
			body:   `{"message":"unknown client_secret ` + testClientSecret + `"}`,
		},
	}}
	checks := APITailscaleChecker{Client: doer}.CheckTailscale(context.Background(), TailscaleRequest{
		OAuthClientID:     testClientID,
		OAuthClientSecret: testClientSecret,
		Workload:          "vm",
	})
	if checks[0].Status != StatusFailed {
		t.Fatalf("auth check = %#v", checks[0])
	}
	if strings.Contains(checks[0].Detail, testClientSecret) {
		t.Fatalf("auth detail leaked the client secret: %q", checks[0].Detail)
	}
	if !strings.Contains(checks[0].Detail, "[redacted]") {
		t.Fatalf("auth detail = %q, want a redaction marker", checks[0].Detail)
	}
	if !strings.Contains(checks[0].Remediation, tailscaleOAuthConsole) {
		t.Fatalf("auth remediation = %q, want the OAuth console URL", checks[0].Remediation)
	}
}

func TestDoctorLocalRunNeverCallsTheTailscaleChecker(t *testing.T) {
	t.Parallel()

	doer := &stubDoer{responses: map[string]stubResponse{}}
	report := Doctor(context.Background(), Request{
		Provider:         "aws",
		Workload:         "vm",
		Finder:           fakeFinder{"pulumi": true, "aws": true},
		Remote:           false,
		TailscaleChecker: APITailscaleChecker{Client: doer},
		Tailscale: TailscaleRequest{
			OAuthClientID:     testClientID,
			OAuthClientSecret: testClientSecret,
			Modes:             []string{"l7-serve-h2"},
		},
	})

	if len(doer.requests) != 0 {
		t.Fatalf("local doctor made %d remote requests", len(doer.requests))
	}
	for _, name := range []string{"tailscale-auth", "tailscale-https", "tailscale-tailnet-create"} {
		if _, ok := report.CheckNamed(name); ok {
			t.Fatalf("local doctor reported remote check %q", name)
		}
	}
}

func TestDoctorRemoteFailsWhenTailnetHTTPSIsDisabled(t *testing.T) {
	t.Parallel()

	doer := &stubDoer{responses: map[string]stubResponse{
		tokenPath:    okToken(),
		settingsPath: {status: http.StatusOK, body: `{"httpsEnabled":false}`},
	}}
	report := Doctor(context.Background(), Request{
		Provider: "aws",
		Workload: "vm",
		Finder:   fakeFinder{"pulumi": true, "aws": true},
		Remote:   true,
		RemoteChecker: CommandRemoteChecker{Runner: outputCommandRunner{
			outputs: map[string][]byte{
				"pulumi whoami": []byte("operator\n"),
				"aws sts get-caller-identity --output json": []byte(`{"Account":"123456789012"}`),
			},
			errors: map[string]error{},
		}},
		TailscaleChecker: APITailscaleChecker{Client: doer},
		Tailscale: TailscaleRequest{
			OAuthClientID:     testClientID,
			OAuthClientSecret: testClientSecret,
			Modes:             []string{"l7-serve-h2"},
			Workload:          "vm",
		},
	})

	if report.Ready {
		t.Fatal("report ready with HTTPS disabled on the tailnet")
	}
	check, ok := report.CheckNamed("tailscale-https")
	if !ok || check.Status != StatusFailed || !check.Remote {
		t.Fatalf("tailscale-https check = %#v, found %t", check, ok)
	}

	text := new(strings.Builder)
	if err := report.WriteText(text); err != nil {
		t.Fatal(err)
	}
	jsonData, err := json.Marshal(report)
	if err != nil {
		t.Fatal(err)
	}
	for _, rendered := range []string{text.String(), string(jsonData)} {
		for _, secret := range []string{testClientSecret, testAccessToken} {
			if strings.Contains(rendered, secret) {
				t.Fatalf("rendered report leaked a credential: %s", rendered)
			}
		}
	}
}

func TestDoctorRemoteWarningDoesNotBlockReadiness(t *testing.T) {
	t.Parallel()

	doer := &stubDoer{responses: map[string]stubResponse{
		tokenPath:    okToken(),
		settingsPath: {status: http.StatusForbidden, body: `{"message":"forbidden"}`},
	}}
	report := Doctor(context.Background(), Request{
		Provider: "aws",
		Workload: "vm",
		Finder:   fakeFinder{"pulumi": true, "aws": true},
		Remote:   true,
		RemoteChecker: CommandRemoteChecker{Runner: outputCommandRunner{
			outputs: map[string][]byte{
				"pulumi whoami": []byte("operator\n"),
				"aws sts get-caller-identity --output json": []byte(`{"Account":"123456789012"}`),
			},
			errors: map[string]error{},
		}},
		TailscaleChecker: APITailscaleChecker{Client: doer},
		Tailscale: TailscaleRequest{
			OAuthClientID:     testClientID,
			OAuthClientSecret: testClientSecret,
			Modes:             []string{"l7-serve-h2"},
			Workload:          "vm",
		},
	})

	if !report.Ready {
		t.Fatalf("an unknown HTTPS state blocked readiness: %#v", report.Checks)
	}
	check, ok := report.CheckNamed("tailscale-https")
	if !ok || check.Status != StatusWarning {
		t.Fatalf("tailscale-https check = %#v, found %t", check, ok)
	}
}
