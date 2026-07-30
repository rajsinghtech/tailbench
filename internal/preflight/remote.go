package preflight

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"os/exec"
	"strings"
)

type CommandRunner interface {
	Run(ctx context.Context, name string, args ...string) ([]byte, error)
}

type ExecCommandRunner struct{}

func (ExecCommandRunner) Run(ctx context.Context, name string, args ...string) ([]byte, error) {
	command := exec.CommandContext(ctx, name, args...)
	return command.Output()
}

// CommandRemoteChecker performs read-only authentication checks. Command
// output is discarded so account IDs, emails, subscriptions, and tokens never
// become diagnostics.
type CommandRemoteChecker struct {
	Runner       CommandRunner
	StateBackend string
}

func (c CommandRemoteChecker) Check(ctx context.Context, provider string) ([]Check, error) {
	checks, _, err := c.CheckWithIdentity(ctx, provider)
	return checks, err
}

func (c CommandRemoteChecker) CheckWithIdentity(
	ctx context.Context,
	provider string,
) ([]Check, CloudIdentity, error) {
	runner := c.Runner
	if runner == nil {
		runner = ExecCommandRunner{}
	}

	checks := make([]Check, 0, 2)
	pulumiCheck := checkPulumiBackend(ctx, runner, c.StateBackend)
	checks = append(checks, pulumiCheck)

	name, args, detail, remediation, err := cloudIdentityCommand(provider)
	if err != nil {
		return checks, CloudIdentity{}, err
	}
	cloudCheck, output := runRemoteCheck(
		ctx,
		runner,
		"cloud-auth",
		name,
		args,
		detail,
		remediation,
	)
	var identity CloudIdentity
	if cloudCheck.Status == StatusPassed {
		identity, err = parseCloudIdentity(provider, output)
		if err != nil {
			cloudCheck.Status = StatusFailed
			cloudCheck.Detail = err.Error()
			cloudCheck.Remediation = remediation
		}
	}
	checks = append(checks, cloudCheck)
	return checks, identity, nil
}

func checkPulumiBackend(
	ctx context.Context,
	runner CommandRunner,
	stateBackend string,
) Check {
	stateBackend = strings.TrimSpace(stateBackend)
	switch {
	case stateBackend == "", strings.HasPrefix(stateBackend, "file://"):
		return Check{
			Name:   "pulumi-auth",
			Status: StatusSkipped,
			Detail: "Pulumi authentication is not required for the local state backend",
			Remote: true,
		}
	case strings.HasPrefix(stateBackend, "s3://"),
		strings.HasPrefix(stateBackend, "gs://"),
		strings.HasPrefix(stateBackend, "azblob://"):
		return Check{
			Name:   "pulumi-auth",
			Status: StatusSkipped,
			Detail: "Pulumi account authentication is not required for the object-store state backend",
			Remote: true,
		}
	default:
		check := Check{
			Name:   "pulumi-auth",
			Status: StatusPassed,
			Detail: "Pulumi authentication succeeded for the configured state backend",
			Remote: true,
		}
		output, err := runner.Run(ctx, "pulumi", "whoami", "--verbose", "--output", "json")
		if err != nil {
			check.Status = StatusFailed
			check.Detail = fmt.Sprintf("pulumi authentication check failed: %v", err)
			check.Remediation = fmt.Sprintf(
				"run pulumi login %s and verify the selected backend",
				stateBackend,
			)
			return check
		}
		if err := verifyPulumiBackend(output, stateBackend); err != nil {
			check.Status = StatusFailed
			check.Detail = err.Error()
			check.Remediation = fmt.Sprintf(
				"run pulumi login %s so the configured state backend is selected",
				stateBackend,
			)
		}
		return check
	}
}

func verifyPulumiBackend(output []byte, configured string) error {
	var identity struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(output, &identity); err != nil {
		return fmt.Errorf("parse Pulumi backend identity: %w", err)
	}
	selected, err := url.Parse(strings.TrimSpace(identity.URL))
	if err != nil || selected.Host == "" {
		return fmt.Errorf("parse Pulumi backend identity: backend URL is unavailable")
	}
	expected, err := url.Parse(configured)
	if err != nil || expected.Host == "" {
		return fmt.Errorf("parse configured Pulumi state backend")
	}
	if pulumiBackendHostsMatch(expected.Hostname(), selected.Hostname()) {
		return nil
	}
	return fmt.Errorf("pulumi authentication check selected a different state backend")
}

func pulumiBackendHostsMatch(expected, selected string) bool {
	expected = strings.ToLower(expected)
	selected = strings.ToLower(selected)
	if expected == selected {
		return true
	}
	for _, prefix := range []string{"api.", "app."} {
		expectedSuffix, expectedMatch := strings.CutPrefix(expected, prefix)
		if !expectedMatch {
			continue
		}
		for _, selectedPrefix := range []string{"api.", "app."} {
			selectedSuffix, selectedMatch := strings.CutPrefix(selected, selectedPrefix)
			if selectedMatch && expectedSuffix == selectedSuffix {
				return true
			}
		}
	}
	return false
}

func runRemoteCheck(
	ctx context.Context,
	runner CommandRunner,
	checkName, executable string,
	args []string,
	successDetail, remediation string,
) (Check, []byte) {
	check := Check{Name: checkName, Status: StatusPassed, Detail: successDetail, Remote: true}
	output, err := runner.Run(ctx, executable, args...)
	if err != nil {
		check.Status = StatusFailed
		check.Detail = fmt.Sprintf("%s authentication check failed: %v", executable, err)
		check.Remediation = remediation
	}
	return check, output
}

func cloudIdentityCommand(provider string) (string, []string, string, string, error) {
	switch provider {
	case "aws", "eks":
		return "aws",
			[]string{"sts", "get-caller-identity", "--output", "json"},
			"AWS authentication succeeded",
			"authenticate the AWS CLI and verify sts:GetCallerIdentity permission",
			nil
	case "gcp", "gke":
		return "gcloud",
			[]string{"auth", "list", "--filter=status:ACTIVE", "--format=value(account)"},
			"Google Cloud authentication succeeded",
			"authenticate gcloud and select an account and project",
			nil
	case "azure", "aks":
		return "az",
			[]string{"account", "show", "--query", "id", "--output", "tsv"},
			"Azure authentication succeeded",
			"authenticate the Azure CLI and select a subscription",
			nil
	default:
		return "", nil, "", "", fmt.Errorf("unsupported provider %q", provider)
	}
}

func parseCloudIdentity(provider string, output []byte) (CloudIdentity, error) {
	switch provider {
	case "aws", "eks":
		var value struct {
			Account string `json:"Account"`
		}
		if err := json.Unmarshal(output, &value); err != nil {
			return CloudIdentity{}, fmt.Errorf("parse AWS account identity: %w", err)
		}
		value.Account = strings.TrimSpace(value.Account)
		if value.Account == "" {
			return CloudIdentity{}, fmt.Errorf("parse AWS account identity: account is empty")
		}
		return CloudIdentity{Account: value.Account}, nil
	case "azure", "aks":
		subscription := strings.TrimSpace(string(output))
		if subscription == "" {
			return CloudIdentity{}, fmt.Errorf("parse Azure subscription identity: subscription is empty")
		}
		return CloudIdentity{Subscription: subscription}, nil
	case "gcp", "gke":
		// The selected project is part of the effective configuration and is
		// copied into the manifest by the command boundary. Avoid retaining the
		// active-account email emitted by this authentication check.
		return CloudIdentity{}, nil
	default:
		return CloudIdentity{}, fmt.Errorf("parse cloud identity: unsupported provider %q", provider)
	}
}
