package app

import (
	"bytes"
	"context"
	"errors"
	"io"
	"strings"
	"testing"
)

type fakeRuntime struct {
	run func(context.Context) error
}

func (r fakeRuntime) Run(ctx context.Context) error {
	return r.run(ctx)
}

func TestRuntimeExecutorMapsConfigurationFailureBeforeStart(t *testing.T) {
	t.Parallel()

	var starts int
	execute := NewRuntimeExecutor(RuntimeDependencies{
		Provider: "aws",
		Workload: "vm",
		LoadConfig: func(args []string) (PreparedRun, error) {
			if got, want := strings.Join(args, " "), "--config missing.yaml"; got != want {
				t.Fatalf("load args = %q, want %q", got, want)
			}
			return PreparedRun{}, errors.New(`read "missing.yaml": no such file`)
		},
		NewRuntime: func(any, io.Writer) (Runtime, error) {
			starts++
			return nil, errors.New("must not run")
		},
	})
	a := testApplication(execute)

	var stdout, stderr bytes.Buffer
	code := a.Run(
		context.Background(),
		[]string{"--config", "missing.yaml"},
		&stdout,
		&stderr,
	)

	if code != ExitUsage {
		t.Fatalf("exit code = %d, want %d", code, ExitUsage)
	}
	if starts != 0 {
		t.Fatalf("runtime starts = %d, want 0", starts)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_CONFIG",
		"configuration",
		"no",
		"fix the named flag or configuration path and retry",
	)
	if !strings.Contains(stderr.String(), "missing.yaml") {
		t.Fatalf("stderr = %q, want failing path", stderr.String())
	}
}

func TestRuntimeExecutorPreservesClassifiedLoadError(t *testing.T) {
	t.Parallel()

	classified := &UserError{
		Code:             "TB_PREREQUISITE",
		ExitStatus:       ExitPrerequisite,
		Stage:            "preflight",
		Cause:            errors.New("environment file is unavailable"),
		Remediation:      "create .env or pass credentials through the environment",
		ResourcesChanged: false,
	}
	execute := NewRuntimeExecutor(RuntimeDependencies{
		Provider: "aws",
		Workload: "vm",
		LoadConfig: func([]string) (PreparedRun, error) {
			return PreparedRun{}, classified
		},
		NewRuntime: func(any, io.Writer) (Runtime, error) {
			return nil, errors.New("must not run")
		},
	})
	a := testApplication(execute)

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), nil, &stdout, &stderr)

	if code != ExitPrerequisite {
		t.Fatalf("exit code = %d, want %d", code, ExitPrerequisite)
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_PREREQUISITE",
		"preflight",
		"no",
		"create .env or pass credentials through the environment",
	)
}

func TestRuntimeExecutorRejectsMissingSecretsBeforeConstruction(t *testing.T) {
	t.Parallel()

	var starts int
	execute := NewRuntimeExecutor(RuntimeDependencies{
		Provider: "aws",
		Workload: "vm",
		LoadConfig: func([]string) (PreparedRun, error) {
			return PreparedRun{
				Value:                "opaque config",
				MissingPrerequisites: []string{"OAUTH_CLIENT_ID", "OAUTH_CLIENT_SECRET"},
			}, nil
		},
		NewRuntime: func(any, io.Writer) (Runtime, error) {
			starts++
			return nil, errors.New("must not run")
		},
	})
	a := testApplication(execute)

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), nil, &stdout, &stderr)

	if code != ExitPrerequisite {
		t.Fatalf("exit code = %d, want %d", code, ExitPrerequisite)
	}
	if starts != 0 {
		t.Fatalf("runtime starts = %d, want 0", starts)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_PREREQUISITE",
		"preflight",
		"no",
		"set the required values before running: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET",
	)
}

func TestRuntimeExecutorMapsConstructionFailureAsUsage(t *testing.T) {
	t.Parallel()

	execute := NewRuntimeExecutor(RuntimeDependencies{
		Provider: "aws",
		Workload: "vm",
		LoadConfig: func([]string) (PreparedRun, error) {
			return PreparedRun{Value: "opaque config"}, nil
		},
		NewRuntime: func(any, io.Writer) (Runtime, error) {
			return nil, errors.New(`requested provider "gcp" does not match "aws"`)
		},
	})
	a := testApplication(execute)

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), nil, &stdout, &stderr)

	if code != ExitUsage {
		t.Fatalf("exit code = %d, want %d", code, ExitUsage)
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_CONFIG",
		"configuration",
		"no",
		"correct the provider or workload configuration and retry",
	)
}

func TestRuntimeExecutorPreservesRunFailureAndMarksPossibleChanges(t *testing.T) {
	t.Parallel()

	providerErr := errors.New("AccessDenied: ec2:RunInstances is not authorized")
	execute := NewRuntimeExecutor(RuntimeDependencies{
		Provider: "aws",
		Workload: "vm",
		LoadConfig: func([]string) (PreparedRun, error) {
			return PreparedRun{Value: "opaque config"}, nil
		},
		NewRuntime: func(any, io.Writer) (Runtime, error) {
			return fakeRuntime{run: func(context.Context) error {
				return providerErr
			}}, nil
		},
	})
	a := testApplication(execute)

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), nil, &stdout, &stderr)

	if code != ExitRunFailed {
		t.Fatalf("exit code = %d, want %d", code, ExitRunFailed)
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_RUN_FAILED",
		"run",
		"yes",
		"inspect the diagnostic, verify existing resources, and retry",
	)
	if !strings.Contains(stderr.String(), providerErr.Error()) {
		t.Fatalf("stderr = %q, want original provider error", stderr.String())
	}
	for _, want := range []string{"status: failed", "provider: aws", "workload: vm"} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("stdout = %q, want %q", stdout.String(), want)
		}
	}
}

func TestRuntimeExecutorMapsCancellationToInterrupt(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	execute := NewRuntimeExecutor(RuntimeDependencies{
		Provider: "aws",
		Workload: "vm",
		LoadConfig: func([]string) (PreparedRun, error) {
			return PreparedRun{Value: "opaque config"}, nil
		},
		NewRuntime: func(any, io.Writer) (Runtime, error) {
			return fakeRuntime{run: func(context.Context) error {
				return context.Canceled
			}}, nil
		},
	})
	a := testApplication(execute)

	var stdout, stderr bytes.Buffer
	code := a.Run(ctx, nil, &stdout, &stderr)

	if code != ExitInterrupted {
		t.Fatalf("exit code = %d, want %d", code, ExitInterrupted)
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_INTERRUPTED",
		"run",
		"yes",
		"inspect recoverable state before resuming or cleaning up",
	)
	if !strings.Contains(stdout.String(), "status: interrupted") {
		t.Fatalf("stdout = %q, want interrupted summary", stdout.String())
	}
}

func TestRuntimeExecutorReturnsSuccessSummary(t *testing.T) {
	t.Parallel()

	execute := NewRuntimeExecutor(RuntimeDependencies{
		Provider: "aws",
		Workload: "vm",
		LoadConfig: func([]string) (PreparedRun, error) {
			return PreparedRun{Value: "opaque config"}, nil
		},
		NewRuntime: func(any, io.Writer) (Runtime, error) {
			return fakeRuntime{run: func(context.Context) error {
				return nil
			}}, nil
		},
	})
	a := testApplication(execute)

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), nil, &stdout, &stderr)

	if code != ExitOK {
		t.Fatalf("exit code = %d, want %d", code, ExitOK)
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
	for _, want := range []string{
		"status: succeeded",
		"provider: aws",
		"workload: vm",
		"benchmark: succeeded",
	} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("stdout = %q, want %q", stdout.String(), want)
		}
	}
}
