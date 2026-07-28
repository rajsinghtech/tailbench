package app

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestHelpBypassesExecutionAndFilesystemWrites(t *testing.T) {
	t.Parallel()

	var calls int
	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		calls++
		return RunOutcome{Status: StatusSucceeded, Started: true}
	})
	logPath := filepath.Join(t.TempDir(), "must-not-exist.log")

	var stdout, stderr bytes.Buffer
	code := a.Run(
		context.Background(),
		[]string{"--config", "missing.yaml", "--log-file", logPath, "--help"},
		&stdout,
		&stderr,
	)

	if code != ExitOK {
		t.Fatalf("exit code = %d, want %d", code, ExitOK)
	}
	if calls != 0 {
		t.Fatalf("executor calls = %d, want 0", calls)
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
	if !strings.Contains(stdout.String(), "Usage: tailbench-aws") {
		t.Fatalf("stdout = %q, want usage", stdout.String())
	}
	if !strings.Contains(stdout.String(), "Compiled provider: aws") {
		t.Fatalf("stdout = %q, want compiled provider", stdout.String())
	}
	if _, err := os.Stat(logPath); !os.IsNotExist(err) {
		t.Fatalf("help created log file %q", logPath)
	}
}

func TestVersionBypassesExecutionAndConfiguration(t *testing.T) {
	t.Parallel()

	var calls int
	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		calls++
		return RunOutcome{Status: StatusSucceeded, Started: true}
	})

	var stdout, stderr bytes.Buffer
	code := a.Run(
		context.Background(),
		[]string{"--config", "missing.yaml", "--version"},
		&stdout,
		&stderr,
	)

	if code != ExitOK {
		t.Fatalf("exit code = %d, want %d", code, ExitOK)
	}
	if calls != 0 {
		t.Fatalf("executor calls = %d, want 0", calls)
	}
	if got, want := stdout.String(), "tailbench-aws 1.2.3 (commit abc123, built 2026-07-24)\n"; got != want {
		t.Fatalf("stdout = %q, want %q", got, want)
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestSubcommandsRouteWithoutReachingDefaultExecutor(t *testing.T) {
	t.Parallel()

	var defaultCalls int
	var planArgs, doctorArgs []string
	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		defaultCalls++
		return RunOutcome{Status: StatusSucceeded, Started: true}
	})
	a.Commands = map[string]ExecutorFunc{
		"plan": func(_ context.Context, args []string, _ io.Writer) RunOutcome {
			planArgs = append([]string(nil), args...)
			return RunOutcome{Status: StatusSucceeded}
		},
		"doctor": func(_ context.Context, args []string, _ io.Writer) RunOutcome {
			doctorArgs = append([]string(nil), args...)
			return RunOutcome{Status: StatusSucceeded}
		},
	}

	var planOut, planErr bytes.Buffer
	if code := a.Run(
		context.Background(),
		[]string{"plan", "--family", "c7i"},
		&planOut,
		&planErr,
	); code != ExitOK {
		t.Fatalf("plan exit code = %d, want %d", code, ExitOK)
	}

	var doctorOut, doctorErr bytes.Buffer
	if code := a.Run(
		context.Background(),
		[]string{"doctor", "--remote"},
		&doctorOut,
		&doctorErr,
	); code != ExitOK {
		t.Fatalf("doctor exit code = %d, want %d", code, ExitOK)
	}

	if defaultCalls != 0 {
		t.Fatalf("default executor calls = %d, want 0", defaultCalls)
	}
	if got, want := strings.Join(planArgs, " "), "--family c7i"; got != want {
		t.Fatalf("plan args = %q, want %q", got, want)
	}
	if got, want := strings.Join(doctorArgs, " "), "--remote"; got != want {
		t.Fatalf("doctor args = %q, want %q", got, want)
	}
}

func TestDryRunAliasesPlan(t *testing.T) {
	t.Parallel()

	var defaultCalls, planCalls int
	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		defaultCalls++
		return RunOutcome{Status: StatusSucceeded, Started: true}
	})
	a.Commands = map[string]ExecutorFunc{
		"plan": func(_ context.Context, args []string, _ io.Writer) RunOutcome {
			planCalls++
			if got, want := strings.Join(args, " "), "--family c7i --dry-run"; got != want {
				t.Fatalf("plan args = %q, want %q", got, want)
			}
			return RunOutcome{Status: StatusSucceeded}
		},
	}

	var stdout, stderr bytes.Buffer
	code := a.Run(
		context.Background(),
		[]string{"--family", "c7i", "--dry-run"},
		&stdout,
		&stderr,
	)

	if code != ExitOK {
		t.Fatalf("exit code = %d, want %d", code, ExitOK)
	}
	if defaultCalls != 0 || planCalls != 1 {
		t.Fatalf("default calls = %d, plan calls = %d; want 0, 1", defaultCalls, planCalls)
	}
}

func TestUnknownSubcommandReportsUsage(t *testing.T) {
	t.Parallel()

	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		return RunOutcome{Status: StatusSucceeded, Started: true}
	})
	a.Commands = map[string]ExecutorFunc{"plan": a.Execute}

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), []string{"explode"}, &stdout, &stderr)

	if code != ExitUsage {
		t.Fatalf("exit code = %d, want %d", code, ExitUsage)
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_USAGE",
		"command",
		"no",
		"run --help to list supported commands",
	)
}

func TestInvalidOutputReportsUsageErrorExactlyOnce(t *testing.T) {
	t.Parallel()

	var calls int
	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		calls++
		return RunOutcome{Status: StatusSucceeded, Started: true}
	})

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), []string{"--output", "xml"}, &stdout, &stderr)

	if code != ExitUsage {
		t.Fatalf("exit code = %d, want %d", code, ExitUsage)
	}
	if calls != 0 {
		t.Fatalf("executor calls = %d, want 0", calls)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	assertDiagnostic(t, stderr.String(), "TB_USAGE", "arguments", "no", "use --output text or --output json")
	if count := strings.Count(stderr.String(), "[TB_USAGE]"); count != 1 {
		t.Fatalf("error rendered %d times, want once: %q", count, stderr.String())
	}
}

func TestMissingLogFilePathReportsSpecificRemediation(t *testing.T) {
	t.Parallel()

	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		return RunOutcome{Status: StatusSucceeded, Started: true}
	})

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), []string{"--log-file="}, &stdout, &stderr)

	if code != ExitUsage {
		t.Fatalf("exit code = %d, want %d", code, ExitUsage)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_USAGE",
		"arguments",
		"no",
		"pass a non-empty writable path with --log-file PATH",
	)
}

func TestUnwritableLogFileReportsOutputFailure(t *testing.T) {
	t.Parallel()

	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		return RunOutcome{Status: StatusSucceeded, Started: true}
	})

	var stdout, stderr bytes.Buffer
	code := a.Run(
		context.Background(),
		[]string{"--log-file", t.TempDir()},
		&stdout,
		&stderr,
	)

	if code != ExitUsage {
		t.Fatalf("exit code = %d, want %d", code, ExitUsage)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_LOG_FILE",
		"output",
		"no",
		"choose a writable --log-file path",
	)
}

func TestTypedFailurePreservesSafeCauseAndRemediation(t *testing.T) {
	t.Parallel()

	a := testApplication(func(_ context.Context, args []string, _ io.Writer) RunOutcome {
		if got, want := strings.Join(args, " "), "--config missing.yaml --family c7i"; got != want {
			t.Fatalf("executor args = %q, want %q", got, want)
		}
		return RunOutcome{
			Status: StatusFailed,
			Error: &UserError{
				Code:             "TB_CONFIG",
				ExitStatus:       ExitUsage,
				Stage:            "configuration",
				Cause:            errors.New(`read "missing.yaml": bearer super-secret-token`),
				Remediation:      "create the file or pass --config PATH",
				ResourcesChanged: false,
			},
		}
	})

	var stdout, stderr bytes.Buffer
	code := a.Run(
		context.Background(),
		[]string{"--config", "missing.yaml", "--family", "c7i"},
		&stdout,
		&stderr,
	)

	if code != ExitUsage {
		t.Fatalf("exit code = %d, want %d", code, ExitUsage)
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
		"create the file or pass --config PATH",
	)
	if !strings.Contains(stderr.String(), `read "missing.yaml"`) {
		t.Fatalf("stderr = %q, want original safe provider detail", stderr.String())
	}
	if strings.Contains(stderr.String(), "super-secret-token") {
		t.Fatalf("stderr leaked secret: %q", stderr.String())
	}
	if !strings.Contains(stderr.String(), "[REDACTED]") {
		t.Fatalf("stderr = %q, want redaction marker", stderr.String())
	}
}

func TestProviderCauseIsBounded(t *testing.T) {
	t.Parallel()

	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		return RunOutcome{
			Status: StatusFailed,
			Error: &UserError{
				Code:             "TB_RUN_FAILED",
				ExitStatus:       ExitRunFailed,
				Stage:            "provisioning",
				Cause:            errors.New(strings.Repeat("provider detail ", 1000)),
				Remediation:      "inspect the durable log",
				ResourcesChanged: false,
			},
		}
	})

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), nil, &stdout, &stderr)

	if code != ExitRunFailed {
		t.Fatalf("exit code = %d, want %d", code, ExitRunFailed)
	}
	if !strings.Contains(stderr.String(), "[truncated]") {
		t.Fatalf("stderr = %q, want truncation marker", stderr.String())
	}
	if stderr.Len() > maxRenderedCauseBytes+512 {
		t.Fatalf("stderr length = %d, cause was not bounded", stderr.Len())
	}
}

func TestMissingSecretsMapsToPreflightExitWithoutResources(t *testing.T) {
	t.Parallel()

	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		return RunOutcome{
			Status: StatusFailed,
			Error: &UserError{
				Code:             "TB_PREREQUISITE",
				ExitStatus:       ExitPrerequisite,
				Stage:            "preflight",
				Cause:            errors.New("required Tailscale credentials are missing"),
				Remediation:      "set OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET",
				ResourcesChanged: false,
			},
		}
	})

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), nil, &stdout, &stderr)

	if code != ExitPrerequisite {
		t.Fatalf("exit code = %d, want %d", code, ExitPrerequisite)
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
		"set OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET",
	)
}

func TestQuietSuppressesProgressButNotFatalDiagnostic(t *testing.T) {
	t.Parallel()

	a := testApplication(func(_ context.Context, _ []string, progress io.Writer) RunOutcome {
		_, _ = io.WriteString(progress, "provisioning progress\n")
		return RunOutcome{
			Status:  StatusFailed,
			Started: true,
			Stage:   "benchmark",
			Error: &UserError{
				Code:             "TB_RUN_FAILED",
				ExitStatus:       ExitRunFailed,
				Stage:            "benchmark",
				Cause:            errors.New("iperf transport failed"),
				Remediation:      "inspect the log and retry the named run",
				ResourcesChanged: true,
			},
		}
	})

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), []string{"--quiet"}, &stdout, &stderr)

	if code != ExitRunFailed {
		t.Fatalf("exit code = %d, want %d", code, ExitRunFailed)
	}
	if strings.Contains(stderr.String(), "provisioning progress") {
		t.Fatalf("quiet stderr contains progress: %q", stderr.String())
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_RUN_FAILED",
		"benchmark",
		"yes",
		"inspect the log and retry the named run",
	)
	if !strings.Contains(stdout.String(), "status: failed") {
		t.Fatalf("stdout = %q, want final run summary", stdout.String())
	}
}

func TestLogFileReceivesRedactedProgressAndFinalDiagnostic(t *testing.T) {
	t.Parallel()

	a := testApplication(func(_ context.Context, _ []string, progress io.Writer) RunOutcome {
		_, _ = io.WriteString(progress, "Authorization: Bearer progress-secret\n")
		return RunOutcome{
			Status:      StatusFailed,
			Started:     true,
			Stage:       "provisioning",
			LogLocation: "",
			Error: &UserError{
				Code:             "TB_RUN_FAILED",
				ExitStatus:       ExitRunFailed,
				Stage:            "provisioning",
				Cause:            errors.New("provider rejected auth_key=tskey-auth-another-secret"),
				Remediation:      "refresh credentials and retry",
				ResourcesChanged: false,
			},
		}
	})
	logPath := filepath.Join(t.TempDir(), "tailbench.log")

	var stdout, stderr bytes.Buffer
	code := a.Run(
		context.Background(),
		[]string{"--log-file", logPath},
		&stdout,
		&stderr,
	)

	if code != ExitRunFailed {
		t.Fatalf("exit code = %d, want %d", code, ExitRunFailed)
	}
	data, err := os.ReadFile(logPath)
	if err != nil {
		t.Fatalf("read log: %v", err)
	}
	logged := string(data)
	for _, secret := range []string{"progress-secret", "another-secret"} {
		if strings.Contains(logged, secret) {
			t.Fatalf("log leaked %q: %q", secret, logged)
		}
	}
	if !strings.Contains(logged, "[REDACTED]") {
		t.Fatalf("log = %q, want redaction marker", logged)
	}
	if !strings.Contains(logged, "[TB_RUN_FAILED]") {
		t.Fatalf("log = %q, want final diagnostic", logged)
	}
	if !strings.Contains(stdout.String(), "log: "+logPath) {
		t.Fatalf("stdout = %q, want log location", stdout.String())
	}
}

func TestJSONSuccessReportUsesStdout(t *testing.T) {
	t.Parallel()

	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		return RunOutcome{
			Status:             StatusSucceeded,
			Started:            true,
			Stage:              "complete",
			Message:            "benchmark and cleanup completed",
			ResourcesChanged:   true,
			BenchmarkStatus:    ComponentSucceeded,
			CleanupStatus:      ComponentSucceeded,
			SelectedProvider:   "aws",
			SelectedWorkload:   "vm",
			EffectiveLogOutput: "",
		}
	})

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), []string{"--output=json"}, &stdout, &stderr)

	if code != ExitOK {
		t.Fatalf("exit code = %d, want %d", code, ExitOK)
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}

	var report map[string]any
	if err := json.Unmarshal(stdout.Bytes(), &report); err != nil {
		t.Fatalf("decode stdout %q: %v", stdout.String(), err)
	}
	if got := report["status"]; got != string(StatusSucceeded) {
		t.Fatalf("status = %#v, want %q", got, StatusSucceeded)
	}
	if got := report["provider"]; got != "aws" {
		t.Fatalf("provider = %#v, want aws", got)
	}
	if got := report["resources_changed"]; got != true {
		t.Fatalf("resources_changed = %#v, want true", got)
	}
}

func TestJSONFailedRunReportsJSONOnStdoutAndDiagnosticOnStderr(t *testing.T) {
	t.Parallel()

	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		return RunOutcome{
			Status:           StatusFailed,
			Started:          true,
			Stage:            "benchmark",
			ResourcesChanged: true,
			BenchmarkStatus:  ComponentFailed,
			SelectedProvider: "aws",
			SelectedWorkload: "vm",
			Error: &UserError{
				Code:             "TB_RUN_FAILED",
				ExitStatus:       ExitRunFailed,
				Stage:            "benchmark",
				Cause:            errors.New("transport failed"),
				Remediation:      "inspect the log",
				ResourcesChanged: true,
			},
		}
	})

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), []string{"--output", "json"}, &stdout, &stderr)

	if code != ExitRunFailed {
		t.Fatalf("exit code = %d, want %d", code, ExitRunFailed)
	}
	var got struct {
		Status  Status `json:"status"`
		Failure struct {
			Code string `json:"code"`
		} `json:"failure"`
	}
	if err := json.Unmarshal(stdout.Bytes(), &got); err != nil {
		t.Fatalf("decode stdout %q: %v", stdout.String(), err)
	}
	if got.Status != StatusFailed || got.Failure.Code != "TB_RUN_FAILED" {
		t.Fatalf("report = %#v, want failed TB_RUN_FAILED", got)
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_RUN_FAILED",
		"benchmark",
		"yes",
		"inspect the log",
	)
}

func TestPartialOutcomeReportsBenchmarkAndCleanupIndependently(t *testing.T) {
	t.Parallel()

	a := testApplication(func(context.Context, []string, io.Writer) RunOutcome {
		return RunOutcome{
			Status:           StatusPartial,
			Started:          true,
			Stage:            "cleanup",
			Message:          "benchmark succeeded but cleanup failed",
			ResourcesChanged: true,
			BenchmarkStatus:  ComponentSucceeded,
			CleanupStatus:    ComponentFailed,
			Error: &UserError{
				Code:             "TB_CLEANUP_FAILED",
				ExitStatus:       ExitRunFailed,
				Stage:            "cleanup",
				Cause:            errors.New("provider deletion timed out"),
				Remediation:      "run cleanup for the recorded run",
				ResourcesChanged: true,
				RunID:            "tb_2026-07-24_ab12cd",
			},
		}
	})

	var stdout, stderr bytes.Buffer
	code := a.Run(context.Background(), nil, &stdout, &stderr)

	if code != ExitRunFailed {
		t.Fatalf("exit code = %d, want %d", code, ExitRunFailed)
	}
	for _, want := range []string{
		"status: partial",
		"benchmark: succeeded",
		"cleanup: failed",
		"run ID: tb_2026-07-24_ab12cd",
	} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("stdout = %q, want %q", stdout.String(), want)
		}
	}
	assertDiagnostic(
		t,
		stderr.String(),
		"TB_CLEANUP_FAILED",
		"cleanup",
		"yes",
		"run cleanup for the recorded run",
	)
}

func TestStableExitMapping(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		outcome RunOutcome
		want    int
	}{
		{name: "success", outcome: RunOutcome{Status: StatusSucceeded}, want: ExitOK},
		{name: "ordinary failure", outcome: RunOutcome{Status: StatusFailed}, want: ExitRunFailed},
		{name: "partial", outcome: RunOutcome{Status: StatusPartial}, want: ExitRunFailed},
		{name: "usage", outcome: failureWithExit(ExitUsage), want: ExitUsage},
		{name: "prerequisite", outcome: failureWithExit(ExitPrerequisite), want: ExitPrerequisite},
		{name: "refused", outcome: failureWithExit(ExitRefused), want: ExitRefused},
		{name: "recovery", outcome: failureWithExit(ExitRecovery), want: ExitRecovery},
		{name: "interrupted status", outcome: RunOutcome{Status: StatusInterrupted}, want: ExitInterrupted},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if got := ExitStatus(tt.outcome); got != tt.want {
				t.Fatalf("ExitStatus() = %d, want %d", got, tt.want)
			}
		})
	}
}

func testApplication(execute ExecutorFunc) Application {
	return Application{
		Name:     "tailbench-aws",
		Provider: "aws",
		Build: BuildInfo{
			Version: "1.2.3",
			Commit:  "abc123",
			Date:    "2026-07-24",
		},
		Execute: execute,
	}
}

func failureWithExit(exitStatus int) RunOutcome {
	return RunOutcome{
		Status: StatusFailed,
		Error: &UserError{
			Code:       "TB_TEST",
			ExitStatus: exitStatus,
		},
	}
}

func assertDiagnostic(t *testing.T, got, code, stage, resourcesChanged, remediation string) {
	t.Helper()
	for _, want := range []string{
		"[" + code + "]",
		"stage: " + stage,
		"resources changed: " + resourcesChanged,
		"next: " + remediation,
	} {
		if !strings.Contains(got, want) {
			t.Fatalf("diagnostic = %q, want %q", got, want)
		}
	}
}
