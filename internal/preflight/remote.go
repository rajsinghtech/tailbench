package preflight

import (
	"context"
	"encoding/json"
	"fmt"
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
	Runner CommandRunner
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
	pulumiCheck, _ := runRemoteCheck(
		ctx,
		runner,
		"pulumi-auth",
		"pulumi",
		[]string{"whoami"},
		"Pulumi authentication succeeded",
		"run pulumi login and verify the selected backend",
	)
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
