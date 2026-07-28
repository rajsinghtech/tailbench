package preflight

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"
)

type outputCommandRunner struct {
	outputs map[string][]byte
	errors  map[string]error
}

func (r outputCommandRunner) Run(
	_ context.Context,
	name string,
	args ...string,
) ([]byte, error) {
	key := strings.Join(append([]string{name}, args...), " ")
	if err := r.errors[key]; err != nil {
		return nil, err
	}
	return r.outputs[key], nil
}

func TestCommandRemoteCheckerCapturesIdentityWithoutRenderingIt(t *testing.T) {
	runner := outputCommandRunner{
		outputs: map[string][]byte{
			"pulumi whoami": []byte("operator@example.com\n"),
			"aws sts get-caller-identity --output json": []byte(
				`{"UserId":"AIDAEXAMPLE","Account":"123456789012","Arn":"arn:aws:iam::123456789012:user/operator"}`,
			),
		},
		errors: map[string]error{},
	}
	report := Doctor(context.Background(), Request{
		Provider: "aws",
		Workload: "vm",
		Finder:   fakeFinder{"pulumi": true, "aws": true},
		Remote:   true,
		RemoteChecker: CommandRemoteChecker{
			Runner: runner,
		},
	})

	if !report.Ready {
		t.Fatalf("report = %#v, want ready", report)
	}
	if report.Identity.Account != "123456789012" {
		t.Fatalf("identity = %#v", report.Identity)
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
		for _, secretIdentity := range []string{
			"123456789012",
			"AIDAEXAMPLE",
			"operator@example.com",
		} {
			if strings.Contains(rendered, secretIdentity) {
				t.Fatalf("rendered preflight leaked identity %q: %s", secretIdentity, rendered)
			}
		}
	}
}

func TestCommandRemoteCheckerReportsMalformedIdentityAsFailedPreflight(t *testing.T) {
	runner := outputCommandRunner{
		outputs: map[string][]byte{
			"pulumi whoami": []byte("operator\n"),
			"aws sts get-caller-identity --output json": []byte(
				`{"Account":`,
			),
		},
		errors: map[string]error{},
	}
	report := Doctor(context.Background(), Request{
		Provider: "aws",
		Workload: "vm",
		Finder:   fakeFinder{"pulumi": true, "aws": true},
		Remote:   true,
		RemoteChecker: CommandRemoteChecker{
			Runner: runner,
		},
	})

	if report.Ready {
		t.Fatal("malformed cloud identity reported ready")
	}
	check, ok := report.CheckNamed("cloud-auth")
	if !ok || check.Status != StatusFailed {
		t.Fatalf("cloud check = %#v, found %t", check, ok)
	}
	if !strings.Contains(check.Detail, "parse AWS account identity") {
		t.Fatalf("cloud check detail = %q", check.Detail)
	}
}

func TestCommandRemoteCheckerPreservesCommandFailureWithoutOutput(t *testing.T) {
	commandErr := errors.New("exit status 1")
	runner := outputCommandRunner{
		outputs: map[string][]byte{},
		errors: map[string]error{
			"pulumi whoami": commandErr,
			"aws sts get-caller-identity --output json": commandErr,
		},
	}
	report := Doctor(context.Background(), Request{
		Provider: "aws",
		Workload: "vm",
		Finder:   fakeFinder{"pulumi": true, "aws": true},
		Remote:   true,
		RemoteChecker: CommandRemoteChecker{
			Runner: runner,
		},
	})

	if report.Ready {
		t.Fatal("failed commands reported ready")
	}
	for _, name := range []string{"pulumi-auth", "cloud-auth"} {
		check, ok := report.CheckNamed(name)
		if !ok || check.Status != StatusFailed || !strings.Contains(check.Detail, commandErr.Error()) {
			t.Fatalf("%s check = %#v, found %t", name, check, ok)
		}
	}
}
