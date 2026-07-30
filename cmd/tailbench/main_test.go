package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/rajsinghtech/tailbench/internal/app"
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/lifecycle"
	"github.com/rajsinghtech/tailbench/internal/preflight"
	"github.com/rajsinghtech/tailbench/internal/runstate"
)

// providerFixture holds the instance selection these tests use to reach the
// behavior under test. Every binary compiles exactly one provider, and an
// instance type from another cloud resolves nothing out of that provider's
// price catalog: the plan then selects zero instances and the no-runnable-work
// guardrail refuses the run (exit 4) long before the code path a test is
// exercising. Each instanceType below must exist in internal/pricing/data.json
// under the provider's default region.
type providerFixture struct {
	// family is the group-wide --family selector. plan.selectInstances matches
	// CatalogInstance.FamilyGroup, which on Azure is the SKU family (dsv4) and
	// not the per-size family used for result paths (d2sv4).
	family string
	// instanceType is the single type the filter resolves to.
	instanceType string
	// filter is a --filter regex matching instanceType exactly.
	filter string
	// resumeFilter is the filter resume rebuilds from one unfinished type.
	resumeFilter string
	// stackType is instanceType in Pulumi stack-name form.
	stackType string
	// regionYAML is the provider's region/zone config block.
	regionYAML string
}

func fixture() providerFixture {
	switch compiledProviderName {
	case "aws", "eks":
		return providerFixture{
			family:       "c7i",
			instanceType: "c7i.large",
			filter:       `^c7i\.large$`,
			resumeFilter: `^(?:c7i\.large)$`,
			stackType:    "c7i-large",
			regionYAML:   "aws:\n  region: us-west-2\n  az: us-west-2a\n",
		}
	case "azure", "aks":
		return providerFixture{
			family:       "dsv4",
			instanceType: "Standard_D2s_v4",
			filter:       `^Standard_D2s_v4$`,
			resumeFilter: `^(?:Standard_D2s_v4)$`,
			stackType:    "standard-d2s-v4",
			regionYAML:   "azure:\n  location: eastus\n",
		}
	case "gcp", "gke":
		return providerFixture{
			family:       "c3",
			instanceType: "c3-standard-4",
			filter:       `^c3-standard-4$`,
			resumeFilter: `^(?:c3-standard-4)$`,
			stackType:    "c3-standard-4",
			regionYAML:   "gcp:\n  zone: us-central1-a\n",
		}
	default:
		panic("no instance fixture for compiled provider " + compiledProviderName)
	}
}

func testFamily() string { return fixture().family }

func testInstanceType() string { return fixture().instanceType }

func testFilter() string { return fixture().filter }

func testRegionYAML() string { return fixture().regionYAML }

// testResourceID builds an opaque manifest resource ID in the same
// provider/type/role shape the runtime records.
func testResourceID(role string) string {
	return compiledProviderName + "/" + testInstanceType() + "/" + role
}

func TestManifestHasUncleanTailnet(t *testing.T) {
	for _, tc := range []struct {
		name      string
		resources []runstate.Resource
		want      bool
	}{
		{name: "existing tailnet run has no owned tailnet"},
		{
			name: "provider resources only",
			resources: []runstate.Resource{
				{Kind: "vm-pair", Status: runstate.ResourceCreated},
			},
		},
		{
			name: "run-owned tailnet still needs cleanup",
			resources: []runstate.Resource{
				{Kind: "tailnet", Status: runstate.ResourceCreated},
			},
			want: true,
		},
		{
			name: "already cleaned tailnet needs no credentials",
			resources: []runstate.Resource{
				{Kind: "tailnet", Status: runstate.ResourceCleaned},
			},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got := manifestHasUncleanTailnet(&runstate.Manifest{
				Resources: tc.resources,
			})
			if got != tc.want {
				t.Fatalf("manifestHasUncleanTailnet() = %t, want %t", got, tc.want)
			}
		})
	}
}

func TestCleanupWithoutOwnedTailnetDoesNotRequireTailscaleCredentials(t *testing.T) {
	cfg := &config.Config{}
	if missing := missingCleanupPrerequisites(cfg, false); len(missing) != 0 {
		t.Fatalf("provider-only cleanup prerequisites = %v, want none", missing)
	}
	if missing := missingCleanupPrerequisites(cfg, true); !reflect.DeepEqual(
		missing,
		[]string{"OAUTH_CLIENT_ID", "OAUTH_CLIENT_SECRET"},
	) {
		t.Fatalf("tailnet cleanup prerequisites = %v", missing)
	}
}

type fakeManagedRuntime struct {
	run      func(context.Context) lifecycle.ExecutionResult
	recorder *lifecycle.Recorder
}

func testCommandDependencies(stdin io.Reader) commandDependencies {
	dependencies := defaultCommandDependencies(stdin)
	dependencies.remotePreflight = func(context.Context, *config.Config, bool) *preflight.Report {
		return &preflight.Report{
			SchemaVersion: preflight.SchemaVersion,
			Provider:      compiledProviderName,
			Workload:      workloadForProvider(compiledProviderName),
			Remote:        true,
			Ready:         true,
			Identity:      preflight.CloudIdentity{Account: "123456789012"},
		}
	}
	return dependencies
}

func (r *fakeManagedRuntime) Run(ctx context.Context) error {
	return r.run(ctx).Err
}

func (r *fakeManagedRuntime) RunWithResult(ctx context.Context) lifecycle.ExecutionResult {
	return r.run(ctx)
}

func (r *fakeManagedRuntime) SetRunRecorder(recorder *lifecycle.Recorder) {
	r.recorder = recorder
}

func TestRunHelpDoesNotLoadConfiguration(t *testing.T) {
	var stdout, stderr bytes.Buffer
	code := run(
		context.Background(),
		[]string{"--config", filepath.Join(t.TempDir(), "missing.yaml"), "--help"},
		&stdout,
		&stderr,
	)

	if code != 0 {
		t.Fatalf("exit code = %d, want 0", code)
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
	if !strings.Contains(stdout.String(), "Usage: "+binaryNameForProvider(compiledProviderName)) {
		t.Fatalf("stdout = %q, want provider binary usage", stdout.String())
	}
}

func TestRunVersionDoesNotLoadConfiguration(t *testing.T) {
	var stdout, stderr bytes.Buffer
	code := run(
		context.Background(),
		[]string{"--config", filepath.Join(t.TempDir(), "missing.yaml"), "--version"},
		&stdout,
		&stderr,
	)

	if code != 0 {
		t.Fatalf("exit code = %d, want 0", code)
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
	if !strings.Contains(stdout.String(), binaryNameForProvider(compiledProviderName)+" "+version) {
		t.Fatalf("stdout = %q, want version", stdout.String())
	}
}

func TestInitCreatesSafeProviderSpecificTemplatesWithoutLoadingConfiguration(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	var stdout, stderr bytes.Buffer

	code := run(context.Background(), []string{"init"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("exit code = %d, want 0; stderr=%q", code, stderr.String())
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
	configData, err := os.ReadFile(filepath.Join(dir, "config.yaml"))
	if err != nil {
		t.Fatalf("read config.yaml: %v", err)
	}
	for _, want := range []string{
		"providers:\n  - " + compiledProviderName,
		"dry_run: true",
		"max_instance_types: 1",
		"cleanup_policy: always",
	} {
		if !strings.Contains(string(configData), want) {
			t.Fatalf("config.yaml = %q, want %q", configData, want)
		}
	}
	envData, err := os.ReadFile(filepath.Join(dir, ".env.example"))
	if err != nil {
		t.Fatalf("read .env.example: %v", err)
	}
	if !strings.Contains(string(envData), "OAUTH_CLIENT_ID=") ||
		!strings.Contains(string(envData), "OAUTH_CLIENT_SECRET=") {
		t.Fatalf(".env.example = %q", envData)
	}
	if _, err := os.Stat(filepath.Join(dir, ".tailbench")); !os.IsNotExist(err) {
		t.Fatalf("init created run state: %v", err)
	}
	for _, want := range []string{"status: succeeded", "config.yaml", ".env.example"} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("stdout = %q, want %q", stdout.String(), want)
		}
	}
}

func TestInitRefusesToOverwriteExistingTemplates(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(configPath, []byte("user-owned: true\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	var stdout, stderr bytes.Buffer

	code := run(context.Background(), []string{"init"}, &stdout, &stderr)

	if code != app.ExitRefused {
		t.Fatalf("exit code = %d, want %d", code, app.ExitRefused)
	}
	data, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "user-owned: true\n" {
		t.Fatalf("init overwrote config.yaml: %q", data)
	}
	for _, want := range []string{"[TB_INIT_EXISTS]", "resources changed: no", "config.yaml"} {
		if !strings.Contains(stderr.String(), want) {
			t.Fatalf("stderr = %q, want %q", stderr.String(), want)
		}
	}
}

func TestRunMissingConfigurationReportsUsage(t *testing.T) {
	missing := filepath.Join(t.TempDir(), "missing.yaml")
	var stdout, stderr bytes.Buffer
	code := run(
		context.Background(),
		[]string{"--config", missing},
		&stdout,
		&stderr,
	)

	if code != 2 {
		t.Fatalf("exit code = %d, want 2", code)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	for _, want := range []string{
		"[TB_CONFIG]",
		"stage: configuration",
		missing,
		"resources changed: no",
		"next:",
	} {
		if !strings.Contains(stderr.String(), want) {
			t.Fatalf("stderr = %q, want %q", stderr.String(), want)
		}
	}
}

func TestRunUnknownFlagReportsUsageOnce(t *testing.T) {
	var stdout, stderr bytes.Buffer
	code := run(
		context.Background(),
		[]string{"--definitely-unknown"},
		&stdout,
		&stderr,
	)

	if code != 2 {
		t.Fatalf("exit code = %d, want 2", code)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	if count := strings.Count(stderr.String(), "[TB_CONFIG]"); count != 1 {
		t.Fatalf("diagnostic count = %d, want 1: %q", count, stderr.String())
	}
	if !strings.Contains(stderr.String(), "flag provided but not defined: -definitely-unknown") {
		t.Fatalf("stderr = %q, want unknown flag", stderr.String())
	}
}

func TestRunMissingSecretsFailsPreflightWithoutCreatingState(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := filepath.Join(dir, "config.yaml")
	data := []byte(fmt.Sprintf(`tailscale:
  create_tailnet: true
  oauth_client_id: ${TAILBENCH_TEST_MISSING_ID}
  oauth_client_secret: ${TAILBENCH_TEST_MISSING_SECRET}
family: %s
filter: '%s'
benchmark:
  modes: [l4-kernel]
`, testFamily(), testFilter()))
	if err := os.WriteFile(configPath, data, 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("TAILBENCH_TEST_MISSING_ID", "")
	t.Setenv("TAILBENCH_TEST_MISSING_SECRET", "")

	var stdout, stderr bytes.Buffer
	code := run(
		context.Background(),
		[]string{"--config", configPath},
		&stdout,
		&stderr,
	)

	if code != 3 {
		t.Fatalf("exit code = %d, want 3", code)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	for _, want := range []string{
		"[TB_PREREQUISITE]",
		"stage: preflight",
		"OAUTH_CLIENT_ID",
		"OAUTH_CLIENT_SECRET",
		"resources changed: no",
	} {
		if !strings.Contains(stderr.String(), want) {
			t.Fatalf("stderr = %q, want %q", stderr.String(), want)
		}
	}
	if _, err := os.Stat(filepath.Join(dir, "state")); !os.IsNotExist(err) {
		t.Fatalf("preflight created state directory: %v", err)
	}
}

func TestRunMissingEnvironmentFileFailsPreflightWithoutCreatingState(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := filepath.Join(dir, "config.yaml")
	data := []byte(fmt.Sprintf(`env_file: missing.env
tailscale:
  create_tailnet: true
  oauth_client_id: ${OAUTH_CLIENT_ID}
  oauth_client_secret: ${OAUTH_CLIENT_SECRET}
family: %s
filter: '%s'
benchmark:
  modes: [l4-kernel]
`, testFamily(), testFilter()))
	if err := os.WriteFile(configPath, data, 0o600); err != nil {
		t.Fatal(err)
	}

	var stdout, stderr bytes.Buffer
	code := run(
		context.Background(),
		[]string{"--config", configPath},
		&stdout,
		&stderr,
	)

	if code != 3 {
		t.Fatalf("exit code = %d, want 3", code)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	for _, want := range []string{
		"[TB_PREREQUISITE]",
		"stage: preflight",
		filepath.Join(dir, "missing.env"),
		"resources changed: no",
		"next:",
	} {
		if !strings.Contains(stderr.String(), want) {
			t.Fatalf("stderr = %q, want %q", stderr.String(), want)
		}
	}
	if _, err := os.Stat(filepath.Join(dir, "state")); !os.IsNotExist(err) {
		t.Fatalf("preflight created state directory: %v", err)
	}
}

func TestRunPlanAndDryRunAliasAreLocalAndSideEffectFree(t *testing.T) {
	for _, invocation := range []struct {
		name string
		args func(string) []string
	}{
		{
			name: "plan subcommand",
			args: func(configPath string) []string {
				return []string{
					"plan",
					"--config", configPath,
					"--family", testFamily(),
					"--filter", testFilter(),
				}
			},
		},
		{
			name: "dry-run alias",
			args: func(configPath string) []string {
				return []string{
					"--config", configPath,
					"--family", testFamily(),
					"--filter", testFilter(),
					"--dry-run",
				}
			},
		},
	} {
		t.Run(invocation.name, func(t *testing.T) {
			dir := t.TempDir()
			t.Chdir(dir)
			configPath := filepath.Join(dir, "config.yaml")
			data := []byte(fmt.Sprintf(`env_file: missing.env
tailscale:
  oauth_client_id: ${OAUTH_CLIENT_ID}
  oauth_client_secret: ${OAUTH_CLIENT_SECRET}
benchmark:
  modes: [l4-kernel, l4-lb, forward-pps-exit]
%s`, testRegionYAML()))
			if err := os.WriteFile(configPath, data, 0o600); err != nil {
				t.Fatal(err)
			}

			var stdout, stderr bytes.Buffer
			code := run(
				context.Background(),
				invocation.args(configPath),
				&stdout,
				&stderr,
			)

			if code != 0 {
				t.Fatalf("exit code = %d, want 0; stderr=%q", code, stderr.String())
			}
			if stderr.Len() != 0 {
				t.Fatalf("stderr = %q, want empty", stderr.String())
			}
			wants := []string{
				"TAILBENCH LOCAL PLAN",
				"SIDE EFFECTS: none",
				"provider: " + compiledProviderName,
				testInstanceType(),
			}
			if workloadForProvider(compiledProviderName) == "kubernetes" {
				wants = append(wants, "l4-lb: run", "forward-pps-exit: not-applicable")
			} else {
				wants = append(wants, "l4-lb: not-applicable", "forward-pps-exit: run")
			}
			for _, want := range wants {
				if !strings.Contains(stdout.String(), want) {
					t.Fatalf("stdout = %q, want %q", stdout.String(), want)
				}
			}
			for _, forbidden := range []string{".tailbench", "state", "missing.env"} {
				if _, err := os.Stat(filepath.Join(dir, forbidden)); !os.IsNotExist(err) {
					t.Fatalf("local plan created %s: %v", forbidden, err)
				}
			}
		})
	}
}

func TestRunYAMLDryRunAliasesLocalPlanWithoutLoadingSecrets(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := filepath.Join(dir, "config.yaml")
	data := []byte(fmt.Sprintf(`env_file: missing.env
dry_run: true
family: %s
filter: '%s'
tailscale:
  oauth_client_id: ${OAUTH_CLIENT_ID}
  oauth_client_secret: ${OAUTH_CLIENT_SECRET}
benchmark:
  modes: [l4-kernel]
%s`, testFamily(), testFilter(), testRegionYAML()))
	if err := os.WriteFile(configPath, data, 0o600); err != nil {
		t.Fatal(err)
	}

	for _, args := range [][]string{
		{"--config", configPath},
		{"run", "--config", configPath},
	} {
		var stdout, stderr bytes.Buffer
		code := run(context.Background(), args, &stdout, &stderr)

		if code != 0 {
			t.Fatalf("args %v: exit code = %d, want 0; stderr=%q", args, code, stderr.String())
		}
		if stderr.Len() != 0 {
			t.Fatalf("args %v: stderr = %q, want empty", args, stderr.String())
		}
		for _, want := range []string{
			"TAILBENCH LOCAL PLAN",
			"SIDE EFFECTS: none",
			testInstanceType(),
		} {
			if !strings.Contains(stdout.String(), want) {
				t.Fatalf("args %v: stdout = %q, want %q", args, stdout.String(), want)
			}
		}
	}
	for _, forbidden := range []string{".tailbench", "state", "missing.env"} {
		if _, err := os.Stat(filepath.Join(dir, forbidden)); !os.IsNotExist(err) {
			t.Fatalf("YAML dry run created %s: %v", forbidden, err)
		}
	}
}

func TestRunYesRequiresExplicitCostCeilingBeforeSecretLoading(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(configPath, []byte(fmt.Sprintf(`env_file: missing.env
family: %s
filter: '%s'
benchmark:
  modes: [l4-kernel]
`, testFamily(), testFilter())), 0o600); err != nil {
		t.Fatal(err)
	}

	var stdout, stderr bytes.Buffer
	code := run(
		context.Background(),
		[]string{"run", "--config", configPath, "--yes"},
		&stdout,
		&stderr,
	)

	if code != 4 {
		t.Fatalf("exit code = %d, want 4; stderr=%q", code, stderr.String())
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	for _, want := range []string{
		"[TB_SAFETY_LIMIT]",
		"stage: guardrails",
		"--yes requires",
		"--max-cost-usd",
		"resources changed: no",
	} {
		if !strings.Contains(stderr.String(), want) {
			t.Fatalf("stderr = %q, want %q", stderr.String(), want)
		}
	}
	for _, forbidden := range []string{".tailbench", "state", "missing.env"} {
		if _, err := os.Stat(filepath.Join(dir, forbidden)); !os.IsNotExist(err) {
			t.Fatalf("refused run created %s: %v", forbidden, err)
		}
	}
}

func TestRunInteractiveDeclinePrintsBoundedSummaryAndCreatesNoState(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(configPath, []byte(fmt.Sprintf(`family: %s
filter: '%s'
tailscale:
  oauth_client_id: test-client-id
  oauth_client_secret: test-client-secret
benchmark:
  modes: [l4-kernel]
`, testFamily(), testFilter())), 0o600); err != nil {
		t.Fatal(err)
	}

	var stdout, stderr bytes.Buffer
	code := runWithInput(
		context.Background(),
		[]string{"run", "--config", configPath, "--quiet"},
		strings.NewReader("no\n"),
		&stdout,
		&stderr,
	)

	if code != 4 {
		t.Fatalf("exit code = %d, want 4; stderr=%q", code, stderr.String())
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	for _, want := range []string{
		"TAILBENCH EXECUTION CONFIRMATION",
		"provider: " + compiledProviderName,
		"pending instance types: 1 (limit 1)",
		"duration limit: 45m0s",
		"cost ceiling: $10.00",
		"cleanup policy: always",
		"[TB_DECLINED]",
		"resources changed: no",
	} {
		if !strings.Contains(stderr.String(), want) {
			t.Fatalf("stderr = %q, want %q", stderr.String(), want)
		}
	}
	for _, forbidden := range []string{".tailbench", "state"} {
		if _, err := os.Stat(filepath.Join(dir, forbidden)); !os.IsNotExist(err) {
			t.Fatalf("declined run created %s: %v", forbidden, err)
		}
	}
}

func TestRunRemotePreflightFailureStopsBeforeConfirmationRuntimeAndState(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := writeApprovedRunConfig(t, dir)
	dependencies := testCommandDependencies(strings.NewReader("yes\n"))
	dependencies.remotePreflight = func(context.Context, *config.Config, bool) *preflight.Report {
		return &preflight.Report{
			SchemaVersion: 1,
			Provider:      compiledProviderName,
			Workload:      workloadForProvider(compiledProviderName),
			Remote:        true,
			Ready:         false,
			Checks: []preflight.Check{
				{
					Name:        "cloud-auth",
					Status:      preflight.StatusFailed,
					Detail:      "AWS authentication check failed",
					Remediation: "authenticate the AWS CLI",
					Remote:      true,
				},
			},
		}
	}
	dependencies.newRuntime = func(*config.Config, io.Writer) (app.Runtime, error) {
		t.Fatal("runtime constructed after failed remote preflight")
		return nil, nil
	}

	var stdout, stderr bytes.Buffer
	code := runWithDependencies(
		context.Background(),
		[]string{"run", "--config", configPath, "--max-cost-usd", "10"},
		&stdout,
		&stderr,
		dependencies,
	)

	if code != app.ExitPrerequisite {
		t.Fatalf("exit code = %d, want %d; stderr=%q", code, app.ExitPrerequisite, stderr.String())
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	for _, want := range []string{
		"[TB_PREREQUISITE]",
		"stage: preflight",
		"cloud-auth",
		"resources changed: no",
	} {
		if !strings.Contains(stderr.String(), want) {
			t.Fatalf("stderr = %q, want %q", stderr.String(), want)
		}
	}
	if _, err := os.Stat(filepath.Join(dir, ".tailbench")); !os.IsNotExist(err) {
		t.Fatalf("failed preflight created run state: %v", err)
	}
}

func TestApprovedRunPersistsRecoveryStateBeforeRuntimeAndReturnsRunID(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := writeApprovedRunConfig(t, dir)
	runID := "tb_2026-07-24_ab12cd"
	var sawPersistedRunningManifest bool
	dependencies := testCommandDependencies(strings.NewReader(""))
	dependencies.newRunID = func() (string, error) { return runID, nil }
	dependencies.newRuntime = func(cfg *config.Config, _ io.Writer) (app.Runtime, error) {
		if cfg.RunID != runID || cfg.ResourceExpiresAt == "" {
			t.Fatalf("provider runtime attribution = run ID %q expiry %q", cfg.RunID, cfg.ResourceExpiresAt)
		}
		runtime := &fakeManagedRuntime{}
		runtime.run = func(context.Context) lifecycle.ExecutionResult {
			if runtime.recorder == nil {
				t.Fatal("managed runtime did not receive the durable run recorder")
			}
			if err := runtime.recorder.RecordResources(runstate.Resource{
				ID:               testResourceID("topology"),
				Kind:             "vm-pair",
				CleanupOwner:     runID,
				Status:           runstate.ResourceCreated,
				OwnershipCertain: true,
			}); err != nil {
				t.Fatalf("record runtime resource: %v", err)
			}
			store := runstate.NewStore(filepath.Join(dir, ".tailbench", "runs"))
			manifest, err := store.Load(runID)
			if err != nil {
				t.Fatalf("runtime could not read pre-existing manifest: %v", err)
			}
			sawPersistedRunningManifest = manifest.Status == runstate.RunRunning &&
				len(manifest.Resources) == 1 &&
				manifest.Resources[0].ID == testResourceID("topology")
			if err := runtime.recorder.RecordResources(runstate.Resource{
				ID:               testResourceID("topology"),
				Kind:             "vm-pair",
				CleanupOwner:     runID,
				Status:           runstate.ResourceCleaned,
				OwnershipCertain: true,
			}); err != nil {
				t.Fatalf("record cleaned runtime resource: %v", err)
			}
			return lifecycle.ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeSucceeded,
				CleanupOutcome:   runstate.OutcomeSucceeded,
				ResourcesChanged: true,
			}
		}
		return runtime, nil
	}

	var stdout, stderr bytes.Buffer
	code := runWithDependencies(
		context.Background(),
		[]string{
			"run",
			"--config", configPath,
			"--yes",
			"--max-cost-usd", "10",
		},
		&stdout,
		&stderr,
		dependencies,
	)

	if code != 0 {
		t.Fatalf("exit code = %d, want 0; stderr=%q", code, stderr.String())
	}
	if !sawPersistedRunningManifest {
		t.Fatal("runtime started before a running manifest was durable")
	}
	for _, want := range []string{
		"status: succeeded",
		"benchmark: succeeded",
		"cleanup: succeeded",
		"run ID: " + runID,
		filepath.Join(".tailbench", "runs", runID, "logs", "tailbench.log"),
	} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("stdout = %q, want %q", stdout.String(), want)
		}
	}
	store := runstate.NewStore(filepath.Join(dir, ".tailbench", "runs"))
	manifest, err := store.Load(runID)
	if err != nil {
		t.Fatal(err)
	}
	if manifest.Status != runstate.RunSucceeded || manifest.Recoverable {
		t.Fatalf("manifest = %#v", manifest)
	}
	if manifest.Identity.Account != "123456789012" {
		t.Fatalf("manifest cloud identity = %#v", manifest.Identity)
	}
	if len(manifest.Resources) != 1 ||
		manifest.Resources[0].ID != testResourceID("topology") ||
		manifest.Resources[0].Status != runstate.ResourceCleaned {
		t.Fatalf("manifest resources = %#v", manifest.Resources)
	}
	for _, relative := range []string{"manifest.json", "events.jsonl", "plan.json", "effective-config.redacted.yaml", "summary.json"} {
		if _, err := os.Stat(filepath.Join(store.Root(), runID, relative)); err != nil {
			t.Fatalf("%s: %v", relative, err)
		}
	}
	snapshotData, err := os.ReadFile(filepath.Join(store.Root(), runID, "effective-config.redacted.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(snapshotData), "test-client-id") ||
		strings.Contains(string(snapshotData), "test-client-secret") {
		t.Fatalf("effective config leaked credentials: %s", snapshotData)
	}
	restored, err := config.ParseRedacted(snapshotData)
	if err != nil {
		t.Fatalf("effective config is not recoverable: %v", err)
	}
	if restored.Filter != testFilter() || restored.MaxCostUSD != 10 {
		t.Fatalf("restored effective config = %#v", restored)
	}
}

func TestRunCleanupFailureIsIndependentAndPrintsRecoveryCommands(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := writeApprovedRunConfig(t, dir)
	runID := "tb_2026-07-24_123abc"
	cleanupErr := errors.New("destroy pair: permission denied")
	dependencies := testCommandDependencies(strings.NewReader(""))
	dependencies.newRunID = func() (string, error) { return runID, nil }
	dependencies.newRuntime = func(_ *config.Config, _ io.Writer) (app.Runtime, error) {
		return &fakeManagedRuntime{run: func(context.Context) lifecycle.ExecutionResult {
			return lifecycle.ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeSucceeded,
				CleanupOutcome:   runstate.OutcomeFailed,
				ResourcesChanged: true,
				Failures: []runstate.Failure{
					{
						Code:    "cleanup-failure",
						Stage:   "cleanup",
						Class:   "cleanup-failure",
						Message: cleanupErr.Error(),
					},
				},
				Err: cleanupErr,
			}
		}}, nil
	}

	var stdout, stderr bytes.Buffer
	code := runWithDependencies(
		context.Background(),
		[]string{
			"run",
			"--config", configPath,
			"--yes",
			"--max-cost-usd", "10",
		},
		&stdout,
		&stderr,
		dependencies,
	)

	if code != 1 {
		t.Fatalf("exit code = %d, want 1; stderr=%q", code, stderr.String())
	}
	for _, want := range []string{
		"status: partial",
		"benchmark: succeeded",
		"cleanup: failed",
		"run ID: " + runID,
	} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("stdout = %q, want %q", stdout.String(), want)
		}
	}
	for _, want := range []string{
		"[TB_CLEANUP_FAILED]",
		"stage: cleanup",
		cleanupErr.Error(),
		binaryNameForProvider(compiledProviderName) + " status " + runID,
		binaryNameForProvider(compiledProviderName) + " resume " + runID,
		binaryNameForProvider(compiledProviderName) + " cleanup " + runID,
	} {
		if !strings.Contains(stderr.String(), want) {
			t.Fatalf("stderr = %q, want %q", stderr.String(), want)
		}
	}
}

func TestResumeContinuesUnfinishedWorkInSameRun(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := writeApprovedRunConfig(t, dir)
	runID := "tb_2026-07-24_654def"
	dependencies := testCommandDependencies(strings.NewReader(""))
	dependencies.newRunID = func() (string, error) { return runID, nil }
	dependencies.newRuntime = func(_ *config.Config, _ io.Writer) (app.Runtime, error) {
		return &fakeManagedRuntime{run: func(context.Context) lifecycle.ExecutionResult {
			return lifecycle.ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeFailed,
				CleanupOutcome:   runstate.OutcomePending,
				ResourcesChanged: true,
				Err:              context.Canceled,
			}
		}}, nil
	}

	var initialOut, initialErr bytes.Buffer
	initialCode := runWithDependencies(
		context.Background(),
		[]string{
			"run",
			"--config", configPath,
			"--yes",
			"--max-cost-usd", "10",
		},
		&initialOut,
		&initialErr,
		dependencies,
	)
	if initialCode != 130 {
		t.Fatalf("initial exit code = %d, want 130; stderr=%q", initialCode, initialErr.String())
	}

	var resumedConfig *config.Config
	dependencies.newRuntime = func(cfg *config.Config, _ io.Writer) (app.Runtime, error) {
		resumedConfig = cfg
		return &fakeManagedRuntime{run: func(context.Context) lifecycle.ExecutionResult {
			return lifecycle.ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeSucceeded,
				CleanupOutcome:   runstate.OutcomeSucceeded,
				ResourcesChanged: true,
			}
		}}, nil
	}
	dependencies.newRunID = func() (string, error) {
		t.Fatal("resume attempted to allocate a new run ID")
		return "", nil
	}

	var stdout, stderr bytes.Buffer
	code := runWithDependencies(
		context.Background(),
		[]string{"resume", runID, "--yes"},
		&stdout,
		&stderr,
		dependencies,
	)

	if code != 0 {
		t.Fatalf("resume exit code = %d, want 0; stderr=%q", code, stderr.String())
	}
	if resumedConfig == nil {
		t.Fatal("resume runtime was not constructed")
	}
	if resumedConfig.Filter != fixture().resumeFilter {
		t.Fatalf("resume filter = %q, want only unfinished %s", resumedConfig.Filter, testInstanceType())
	}
	if !reflect.DeepEqual(resumedConfig.Modes, []string{"l4-kernel"}) {
		t.Fatalf("resume modes = %v, want unfinished l4-kernel", resumedConfig.Modes)
	}
	if !strings.Contains(stdout.String(), "run ID: "+runID) ||
		!strings.Contains(stdout.String(), "status: succeeded") {
		t.Fatalf("stdout = %q, want successful same-run summary", stdout.String())
	}
	entries, err := os.ReadDir(filepath.Join(dir, ".tailbench", "runs"))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 || entries[0].Name() != runID {
		t.Fatalf("run directories = %v, want only %s", entries, runID)
	}
}

func TestRecoveryRemotePreflightFailureDoesNotMutateNamedRun(t *testing.T) {
	for _, command := range []string{"resume", "cleanup"} {
		t.Run(command, func(t *testing.T) {
			dir := t.TempDir()
			t.Chdir(dir)
			configPath := writeApprovedRunConfig(t, dir)
			runID := "tb_2026-07-24_" + map[string]string{
				"resume":  "aa11bb",
				"cleanup": "cc22dd",
			}[command]
			dependencies := testCommandDependencies(strings.NewReader(""))
			dependencies.newRunID = func() (string, error) { return runID, nil }
			dependencies.newRuntime = func(*config.Config, io.Writer) (app.Runtime, error) {
				return &fakeManagedRuntime{run: func(context.Context) lifecycle.ExecutionResult {
					return lifecycle.ExecutionResult{
						BenchmarkOutcome: runstate.OutcomeFailed,
						CleanupOutcome:   runstate.OutcomePending,
						ResourcesChanged: true,
						Err:              context.Canceled,
					}
				}}, nil
			}
			var initialOut, initialErr bytes.Buffer
			initialCode := runWithDependencies(
				context.Background(),
				[]string{
					"run",
					"--config", configPath,
					"--yes",
					"--max-cost-usd", "10",
				},
				&initialOut,
				&initialErr,
				dependencies,
			)
			if initialCode != 130 {
				t.Fatalf("initial exit code = %d, want 130; stderr=%q", initialCode, initialErr.String())
			}
			manifestPath := filepath.Join(
				dir,
				".tailbench",
				"runs",
				runID,
				"manifest.json",
			)
			before, err := os.ReadFile(manifestPath)
			if err != nil {
				t.Fatal(err)
			}

			dependencies.remotePreflight = func(context.Context, *config.Config, bool) *preflight.Report {
				return &preflight.Report{
					SchemaVersion: preflight.SchemaVersion,
					Provider:      compiledProviderName,
					Workload:      workloadForProvider(compiledProviderName),
					Remote:        true,
					Ready:         false,
					Checks: []preflight.Check{
						{
							Name:        "cloud-auth",
							Status:      preflight.StatusFailed,
							Detail:      "cloud session expired",
							Remediation: "authenticate the cloud CLI",
							Remote:      true,
						},
					},
				}
			}
			runtimeCalls := 0
			cleanupCalls := 0
			dependencies.newRuntime = func(*config.Config, io.Writer) (app.Runtime, error) {
				runtimeCalls++
				return nil, errors.New("runtime must not be constructed")
			}
			dependencies.cleanup = func(
				context.Context,
				*config.Config,
				*runstate.Manifest,
				[]runstate.Resource,
				io.Writer,
			) lifecycle.ExecutionResult {
				cleanupCalls++
				return lifecycle.ExecutionResult{}
			}

			var stdout, stderr bytes.Buffer
			code := runWithDependencies(
				context.Background(),
				[]string{command, runID, "--yes"},
				&stdout,
				&stderr,
				dependencies,
			)

			if code != app.ExitPrerequisite {
				t.Fatalf("exit code = %d, want %d; stderr=%q", code, app.ExitPrerequisite, stderr.String())
			}
			if runtimeCalls != 0 || cleanupCalls != 0 {
				t.Fatalf("provider calls after failed preflight: runtime=%d cleanup=%d", runtimeCalls, cleanupCalls)
			}
			after, err := os.ReadFile(manifestPath)
			if err != nil {
				t.Fatal(err)
			}
			if !bytes.Equal(after, before) {
				t.Fatalf("%s changed manifest after failed preflight\nbefore:\n%s\nafter:\n%s", command, before, after)
			}
			for _, want := range []string{
				"[TB_PREREQUISITE]",
				"stage: preflight",
				"cloud-auth",
				"run ID: " + runID,
				"resources changed: no",
			} {
				if !strings.Contains(stderr.String(), want) {
					t.Fatalf("stderr = %q, want %q", stderr.String(), want)
				}
			}
		})
	}
}

func TestCleanupUsesNamedRunResourcesAndMarksSameRunCleaned(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := writeApprovedRunConfig(t, dir)
	runID := "tb_2026-07-24_aabbcc"
	stackName := "tailbench-" + compiledProviderName + "-" + fixture().stackType + "-aabbcc"
	dependencies := testCommandDependencies(strings.NewReader(""))
	dependencies.newRunID = func() (string, error) { return runID, nil }
	dependencies.newRuntime = func(_ *config.Config, _ io.Writer) (app.Runtime, error) {
		return &fakeManagedRuntime{run: func(context.Context) lifecycle.ExecutionResult {
			return lifecycle.ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeSucceeded,
				CleanupOutcome:   runstate.OutcomeFailed,
				ResourcesChanged: true,
				Resources: []runstate.Resource{
					{
						ID:               testResourceID("pair"),
						Kind:             "vm-pair",
						StackName:        stackName,
						Status:           runstate.ResourceCreated,
						CleanupOwner:     runID,
						OwnershipCertain: true,
					},
				},
				Err: errors.New("initial cleanup failed"),
			}
		}}, nil
	}
	var initialOut, initialErr bytes.Buffer
	if code := runWithDependencies(
		context.Background(),
		[]string{
			"run",
			"--config", configPath,
			"--yes",
			"--max-cost-usd", "10",
		},
		&initialOut,
		&initialErr,
		dependencies,
	); code != 1 {
		t.Fatalf("initial exit code = %d, want 1; stderr=%q", code, initialErr.String())
	}
	if err := os.Remove(configPath); err != nil {
		t.Fatal(err)
	}
	var cleanupTailscalePreflight *bool
	dependencies.remotePreflight = func(
		_ context.Context,
		_ *config.Config,
		checkTailscale bool,
	) *preflight.Report {
		cleanupTailscalePreflight = &checkTailscale
		return &preflight.Report{
			SchemaVersion: preflight.SchemaVersion,
			Provider:      compiledProviderName,
			Workload:      workloadForProvider(compiledProviderName),
			Remote:        true,
			Ready:         true,
		}
	}
	ownedLock := filepath.Join(
		dir,
		"state",
		compiledProviderName,
		".pulumi",
		"locks",
		"organization",
		"tailbench",
		stackName,
		"owned.json",
	)
	unrelatedLock := filepath.Join(
		dir,
		"state",
		compiledProviderName,
		".pulumi",
		"locks",
		"organization",
		"tailbench",
		"unrelated-stack",
		"unrelated.json",
	)
	for _, path := range []string{ownedLock, unrelatedLock} {
		if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte("lock"), 0o600); err != nil {
			t.Fatal(err)
		}
	}

	var cleanupCalled bool
	dependencies.cleanup = func(
		_ context.Context,
		cfg *config.Config,
		manifest *runstate.Manifest,
		resources []runstate.Resource,
		_ io.Writer,
	) lifecycle.ExecutionResult {
		cleanupCalled = true
		if cfg.OAuthClientID != "" || cfg.OAuthClientSecret != "" {
			t.Fatalf("provider-only cleanup unexpectedly loaded Tailscale credentials")
		}
		if manifest.RunID != runID ||
			len(resources) != 1 ||
			resources[0].CleanupOwner != runID ||
			!resources[0].OwnershipCertain {
			t.Fatalf("cleanup scope = manifest %#v resources %#v", manifest, resources)
		}
		return lifecycle.ExecutionResult{
			CleanupOutcome:   runstate.OutcomeSucceeded,
			ResourcesChanged: true,
		}
	}

	dependencies.stdin = strings.NewReader("no\n")
	var declinedOut, declinedErr bytes.Buffer
	declinedCode := runWithDependencies(
		context.Background(),
		[]string{"cleanup", runID, "--recover-pulumi-locks"},
		&declinedOut,
		&declinedErr,
		dependencies,
	)
	if declinedCode != app.ExitRefused {
		t.Fatalf("declined cleanup exit code = %d, want %d; stderr=%q", declinedCode, app.ExitRefused, declinedErr.String())
	}
	for _, want := range []string{
		"Pulumi lock recovery will remove:",
		ownedLock,
		"[TB_DECLINED]",
	} {
		if !strings.Contains(declinedErr.String(), want) {
			t.Fatalf("declined stderr = %q, want %q", declinedErr.String(), want)
		}
	}
	if cleanupCalled {
		t.Fatal("declined lock recovery called provider cleanup")
	}
	if data, err := os.ReadFile(ownedLock); err != nil || string(data) != "lock" {
		t.Fatalf("declined lock recovery changed owned lock: data=%q err=%v", data, err)
	}

	dependencies.stdin = strings.NewReader("")
	var stdout, stderr bytes.Buffer
	code := runWithDependencies(
		context.Background(),
		[]string{"cleanup", runID, "--recover-pulumi-locks", "--yes"},
		&stdout,
		&stderr,
		dependencies,
	)

	if code != 0 {
		t.Fatalf("cleanup exit code = %d, want 0; stderr=%q", code, stderr.String())
	}
	if !cleanupCalled {
		t.Fatal("cleanup adapter was not called")
	}
	if cleanupTailscalePreflight == nil || *cleanupTailscalePreflight {
		t.Fatalf(
			"cleanup Tailscale preflight = %v, want skipped for provider-only manifest",
			cleanupTailscalePreflight,
		)
	}
	if _, err := os.Stat(ownedLock); !os.IsNotExist(err) {
		t.Fatalf("owned Pulumi lock still exists: %v", err)
	}
	if data, err := os.ReadFile(unrelatedLock); err != nil || string(data) != "lock" {
		t.Fatalf("unrelated Pulumi lock changed: data=%q err=%v", data, err)
	}
	for _, want := range []string{
		"status: succeeded",
		"cleanup: succeeded",
		"run ID: " + runID,
	} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("stdout = %q, want %q", stdout.String(), want)
		}
	}
	store := runstate.NewStore(filepath.Join(dir, ".tailbench", "runs"))
	manifest, err := store.Load(runID)
	if err != nil {
		t.Fatal(err)
	}
	if manifest.Status != runstate.RunCleaned ||
		manifest.Resources[0].Status != runstate.ResourceCleaned ||
		manifest.Recoverable {
		t.Fatalf("cleaned manifest = %#v", manifest)
	}
	events, err := os.ReadFile(filepath.Join(store.Root(), runID, "events.jsonl"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(events), "recover-pulumi-locks") ||
		!strings.Contains(string(events), ownedLock) {
		t.Fatalf("events do not record lock recovery: %s", events)
	}
}

func writeApprovedRunConfig(t *testing.T, dir string) string {
	t.Helper()
	configPath := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(configPath, []byte(fmt.Sprintf(`family: %s
filter: '%s'
tailscale:
  oauth_client_id: test-client-id
  oauth_client_secret: test-client-secret
benchmark:
  modes: [l4-kernel]
`, testFamily(), testFilter())), 0o600); err != nil {
		t.Fatal(err)
	}
	return configPath
}

func TestRunPlanJSONUsesPrimaryStdout(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(
		configPath,
		[]byte(fmt.Sprintf("family: %s\nbenchmark:\n  modes: [l4-kernel]\n", testFamily())),
		0o600,
	); err != nil {
		t.Fatal(err)
	}

	var stdout, stderr bytes.Buffer
	code := run(
		context.Background(),
		[]string{
			"plan",
			"--config", configPath,
			"--filter", testFilter(),
			"--output", "json",
		},
		&stdout,
		&stderr,
	)

	if code != 0 {
		t.Fatalf("exit code = %d, want 0; stderr=%q", code, stderr.String())
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
	var report struct {
		SchemaVersion int    `json:"schema_version"`
		SideEffects   string `json:"side_effects"`
		Provider      string `json:"provider"`
		Instances     []struct {
			Type string `json:"type"`
		} `json:"instances"`
	}
	if err := json.Unmarshal(stdout.Bytes(), &report); err != nil {
		t.Fatalf("decode stdout %q: %v", stdout.String(), err)
	}
	if report.SchemaVersion != 1 ||
		report.SideEffects != "none" ||
		report.Provider != compiledProviderName {
		t.Fatalf("report identity = %#v", report)
	}
	if len(report.Instances) != 1 || report.Instances[0].Type != testInstanceType() {
		t.Fatalf("report instances = %#v, want %s", report.Instances, testInstanceType())
	}
}

func TestRunStatusAndResultsReadManifestWithoutConfigurationOrWrites(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	store := runstate.NewStore(filepath.Join(dir, ".tailbench", "runs"))
	manifest, err := store.Create(runstate.CreateRequest{
		RunID:     "tb_2026-07-24_ab12cd",
		StartedAt: time.Date(2026, time.July, 24, 12, 0, 0, 0, time.UTC),
		Binary: runstate.BinaryInfo{
			Name: "tailbench-aws", Version: "1.2.3", Commit: "abc123",
		},
		Provider: "aws",
		Workload: "vm",
		PlanHash: "sha256:plan",
		InitialWork: []runstate.WorkItem{
			{
				ID:           "c7i.large/l4-kernel",
				InstanceType: "c7i.large",
				Mode:         "l4-kernel",
				Status:       runstate.WorkSucceeded,
				ResultPath:   "aws/c7i/results/c7i.large-l4-kernel.json",
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	_, err = store.Update(manifest.RunID, func(value *runstate.Manifest) error {
		value.Status = runstate.RunInterrupted
		value.Recoverable = true
		value.BenchmarkOutcome = runstate.OutcomeSucceeded
		value.CleanupOutcome = runstate.OutcomeFailed
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	manifestPath := filepath.Join(store.Root(), manifest.RunID, "manifest.json")
	eventsPath := filepath.Join(store.Root(), manifest.RunID, "events.jsonl")
	beforeManifest, err := os.ReadFile(manifestPath)
	if err != nil {
		t.Fatal(err)
	}
	beforeEvents, err := os.ReadFile(eventsPath)
	if err != nil {
		t.Fatal(err)
	}

	for _, invocation := range []struct {
		name string
		args []string
		want []string
	}{
		{
			name: "status",
			args: []string{"status", manifest.RunID},
			want: []string{
				"TAILBENCH RUN STATUS",
				"status: interrupted",
				"benchmark: succeeded",
				"cleanup: failed",
				"tailbench-aws resume " + manifest.RunID,
			},
		},
		{
			name: "results",
			args: []string{"results", manifest.RunID},
			want: []string{
				"TAILBENCH RESULTS",
				"commit: abc123",
				"c7i.large",
				"aws/c7i/results/c7i.large-l4-kernel.json",
			},
		},
	} {
		t.Run(invocation.name, func(t *testing.T) {
			var stdout, stderr bytes.Buffer
			code := run(context.Background(), invocation.args, &stdout, &stderr)
			if code != 0 {
				t.Fatalf("exit code = %d, want 0; stderr=%q", code, stderr.String())
			}
			if stderr.Len() != 0 {
				t.Fatalf("stderr = %q, want empty", stderr.String())
			}
			for _, want := range invocation.want {
				if !strings.Contains(stdout.String(), want) {
					t.Fatalf("stdout = %q, want %q", stdout.String(), want)
				}
			}
		})
	}

	afterManifest, err := os.ReadFile(manifestPath)
	if err != nil {
		t.Fatal(err)
	}
	afterEvents, err := os.ReadFile(eventsPath)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(afterManifest, beforeManifest) || !bytes.Equal(afterEvents, beforeEvents) {
		t.Fatal("status/results mutated persisted run state")
	}
	if _, err := os.Stat(filepath.Join(dir, "config.yaml")); !os.IsNotExist(err) {
		t.Fatalf("status/results unexpectedly created or required config.yaml: %v", err)
	}
}

func TestRunStatusMissingStateReportsRecoveryExitWithoutCreatingState(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	runID := "tb_2026-07-24_abcdef"

	var stdout, stderr bytes.Buffer
	code := run(context.Background(), []string{"status", runID}, &stdout, &stderr)

	if code != 5 {
		t.Fatalf("exit code = %d, want 5", code)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	for _, want := range []string{
		"[TB_RECOVERY]",
		"stage: status",
		runID,
		"resources changed: no",
	} {
		if !strings.Contains(stderr.String(), want) {
			t.Fatalf("stderr = %q, want %q", stderr.String(), want)
		}
	}
	if _, err := os.Stat(filepath.Join(dir, ".tailbench")); !os.IsNotExist(err) {
		t.Fatalf("missing status created state: %v", err)
	}
}

func TestRunDoctorLocalIgnoresMissingEnvironmentFileAndCreatesNoState(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(
		configPath,
		[]byte("env_file: missing.env\nbenchmark:\n  modes: [l4-kernel]\n"),
		0o600,
	); err != nil {
		t.Fatal(err)
	}

	var stdout, stderr bytes.Buffer
	code := run(
		context.Background(),
		[]string{"doctor", "--config", configPath},
		&stdout,
		&stderr,
	)

	// Tool availability is machine-dependent. Both outcomes must include the
	// local report; a failed prerequisite uses the stable preflight exit.
	if code != 0 && code != 3 {
		t.Fatalf("exit code = %d, want 0 or 3; stderr=%q", code, stderr.String())
	}
	for _, want := range []string{"TAILBENCH DOCTOR", "LOCAL CHECKS ONLY", "credentials"} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("stdout = %q, want %q", stdout.String(), want)
		}
	}
	if strings.Contains(stderr.String(), "missing.env") {
		t.Fatalf("local doctor attempted to load env file: %q", stderr.String())
	}
	for _, forbidden := range []string{".tailbench", "state", "missing.env"} {
		if _, err := os.Stat(filepath.Join(dir, forbidden)); !os.IsNotExist(err) {
			t.Fatalf("local doctor created %s: %v", forbidden, err)
		}
	}
}

func TestRunDoctorRemoteRequiresCredentialSourceBeforeRemoteCalls(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	configPath := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(
		configPath,
		[]byte("env_file: missing.env\nbenchmark:\n  modes: [l4-kernel]\n"),
		0o600,
	); err != nil {
		t.Fatal(err)
	}

	var stdout, stderr bytes.Buffer
	code := run(
		context.Background(),
		[]string{"doctor", "--remote", "--config", configPath},
		&stdout,
		&stderr,
	)

	if code != 3 {
		t.Fatalf("exit code = %d, want 3", code)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want no report before credential loading", stdout.String())
	}
	for _, want := range []string{
		"[TB_PREREQUISITE]",
		"stage: preflight",
		"missing.env",
		"resources changed: no",
	} {
		if !strings.Contains(stderr.String(), want) {
			t.Fatalf("stderr = %q, want %q", stderr.String(), want)
		}
	}
	for _, forbidden := range []string{".tailbench", "state"} {
		if _, err := os.Stat(filepath.Join(dir, forbidden)); !os.IsNotExist(err) {
			t.Fatalf("remote preflight failure created %s: %v", forbidden, err)
		}
	}
}

func TestBinaryNameForProvider(t *testing.T) {
	t.Parallel()

	tests := map[string]string{
		"aws":   "tailbench-aws",
		"eks":   "tailbench-aws-k8s",
		"azure": "tailbench-azure",
		"aks":   "tailbench-azure-k8s",
		"gcp":   "tailbench-gcp",
		"gke":   "tailbench-gcp-k8s",
	}
	for providerName, want := range tests {
		if got := binaryNameForProvider(providerName); got != want {
			t.Errorf("binaryNameForProvider(%q) = %q, want %q", providerName, got, want)
		}
	}
}

func TestCompiledProviderFactory(t *testing.T) {
	cfg := &config.Config{StateDir: "file://" + t.TempDir()}
	p, err := compiledProviderFactory(compiledProviderName, cfg)
	if err != nil {
		t.Fatalf("factory(%q): %v", compiledProviderName, err)
	}
	if p.Name() != compiledProviderName {
		t.Fatalf("provider name = %q, want %q", p.Name(), compiledProviderName)
	}
	wantTypes := map[string]string{
		"aws": "*provider.AWSProvider", "eks": "*provider.EKSProvider",
		"azure": "*provider.AzureProvider", "aks": "*provider.AKSProvider",
		"gcp": "*provider.GCPProvider", "gke": "*provider.GKEProvider",
	}
	if got := reflect.TypeOf(p).String(); got != wantTypes[compiledProviderName] {
		t.Fatalf("factory type = %q, want %q", got, wantTypes[compiledProviderName])
	}
}

func TestCompiledProviderFactoryRejectsOtherProviders(t *testing.T) {
	cfg := &config.Config{StateDir: "file://" + t.TempDir()}
	for _, name := range []string{"aws", "eks", "azure", "aks", "gcp", "gke"} {
		if name == compiledProviderName {
			continue
		}
		t.Run(name, func(t *testing.T) {
			_, err := compiledProviderFactory(name, cfg)
			if err == nil {
				t.Fatalf("factory(%q) unexpectedly succeeded", name)
			}
			want := "requested provider \"" + name + "\", but this binary was compiled for provider \"" + compiledProviderName + "\""
			if err.Error() != want {
				t.Fatalf("error = %q, want %q", err, want)
			}
		})
	}
}
