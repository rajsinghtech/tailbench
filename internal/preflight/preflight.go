package preflight

import (
	"context"
	"fmt"
	"io"
	"os/exec"
	"strings"
)

const SchemaVersion = 1

type Status string

const (
	StatusPassed  Status = "passed"
	StatusFailed  Status = "failed"
	StatusWarning Status = "warning"
	StatusSkipped Status = "skipped"
)

type Check struct {
	Name        string `json:"name"`
	Status      Status `json:"status"`
	Detail      string `json:"detail,omitempty"`
	Remediation string `json:"remediation,omitempty"`
	Remote      bool   `json:"remote"`
}

type CloudIdentity struct {
	Account      string
	Project      string
	Subscription string
}

type Report struct {
	SchemaVersion int           `json:"schema_version"`
	Provider      string        `json:"provider"`
	Workload      string        `json:"workload"`
	Remote        bool          `json:"remote"`
	Ready         bool          `json:"ready"`
	Checks        []Check       `json:"checks"`
	Identity      CloudIdentity `json:"-"`
}

type Finder interface {
	Find(name string) (string, error)
}

type RemoteChecker interface {
	Check(ctx context.Context, provider string) ([]Check, error)
}

type IdentityRemoteChecker interface {
	CheckWithIdentity(ctx context.Context, provider string) ([]Check, CloudIdentity, error)
}

type Request struct {
	Provider      string
	Workload      string
	Finder        Finder
	Remote        bool
	RemoteChecker RemoteChecker
}

type PathFinder struct{}

func (PathFinder) Find(name string) (string, error) {
	return exec.LookPath(name)
}

func Doctor(ctx context.Context, request Request) *Report {
	report := &Report{
		SchemaVersion: SchemaVersion,
		Provider:      request.Provider,
		Workload:      request.Workload,
		Remote:        request.Remote,
		Ready:         true,
	}
	finder := request.Finder
	if finder == nil {
		finder = PathFinder{}
	}
	for _, tool := range requiredTools(request.Provider, request.Workload) {
		path, err := finder.Find(tool)
		if err != nil {
			report.Checks = append(report.Checks, Check{
				Name:        tool,
				Status:      StatusFailed,
				Detail:      "executable not found on PATH",
				Remediation: fmt.Sprintf("install %s and ensure it is available on PATH", tool),
			})
			report.Ready = false
			continue
		}
		report.Checks = append(report.Checks, Check{
			Name:   tool,
			Status: StatusPassed,
			Detail: path,
		})
	}

	credentialCheck := Check{
		Name:   "credentials",
		Status: StatusSkipped,
		Detail: "credential values are not read during local checks",
	}
	if request.Remote {
		credentialCheck.Status = StatusPassed
		credentialCheck.Detail = "required credential values were supplied; values are not displayed"
		credentialCheck.Remote = true
	}
	report.Checks = append(report.Checks, credentialCheck)

	if request.Remote {
		if request.RemoteChecker == nil {
			report.Checks = append(report.Checks, Check{
				Name:        "remote",
				Status:      StatusFailed,
				Detail:      "remote checker is unavailable for this build",
				Remediation: "use a provider binary that supports remote preflight",
				Remote:      true,
			})
			report.Ready = false
		} else {
			var (
				checks   []Check
				identity CloudIdentity
				err      error
			)
			if checker, ok := request.RemoteChecker.(IdentityRemoteChecker); ok {
				checks, identity, err = checker.CheckWithIdentity(ctx, request.Provider)
			} else {
				checks, err = request.RemoteChecker.Check(ctx, request.Provider)
			}
			if err != nil {
				report.Checks = append(report.Checks, Check{
					Name:        "remote",
					Status:      StatusFailed,
					Detail:      err.Error(),
					Remediation: "repair authentication or connectivity and rerun doctor --remote",
					Remote:      true,
				})
				report.Ready = false
			} else {
				report.Identity = identity
				for index := range checks {
					checks[index].Remote = true
					if checks[index].Status == StatusFailed {
						report.Ready = false
					}
				}
				report.Checks = append(report.Checks, checks...)
			}
		}
	}
	return report
}

func (r *Report) CheckNamed(name string) (Check, bool) {
	if r == nil {
		return Check{}, false
	}
	for _, check := range r.Checks {
		if check.Name == name {
			return check, true
		}
	}
	return Check{}, false
}

func (r *Report) WriteText(dst io.Writer) error {
	if r == nil {
		return fmt.Errorf("doctor report is nil")
	}
	label := "LOCAL CHECKS ONLY"
	if r.Remote {
		label = "LOCAL AND EXPLICIT REMOTE CHECKS"
	}
	if _, err := fmt.Fprintf(dst, "TAILBENCH DOCTOR — %s\n", label); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(
		dst,
		"provider: %s\nworkload: %s\nready: %t\n",
		r.Provider,
		r.Workload,
		r.Ready,
	); err != nil {
		return err
	}
	for _, check := range r.Checks {
		scope := "local"
		if check.Remote {
			scope = "remote"
		}
		if _, err := fmt.Fprintf(
			dst,
			"[%s] %s (%s): %s\n",
			strings.ToUpper(string(check.Status)),
			check.Name,
			scope,
			check.Detail,
		); err != nil {
			return err
		}
		if check.Remediation != "" {
			if _, err := fmt.Fprintf(dst, "  next: %s\n", check.Remediation); err != nil {
				return err
			}
		}
	}
	return nil
}

func requiredTools(provider, workload string) []string {
	tools := []string{"pulumi", providerCLI(provider)}
	if workload == "kubernetes" {
		tools = append(tools, "kubectl", "helm")
	}
	return tools
}

func providerCLI(provider string) string {
	switch provider {
	case "aws", "eks":
		return "aws"
	case "gcp", "gke":
		return "gcloud"
	case "azure", "aks":
		return "az"
	default:
		return provider
	}
}
