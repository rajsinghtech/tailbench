package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"syscall"
	"time"

	"github.com/rajsinghtech/tailbench/internal/app"
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/failure"
	"github.com/rajsinghtech/tailbench/internal/guardrail"
	"github.com/rajsinghtech/tailbench/internal/lifecycle"
	"github.com/rajsinghtech/tailbench/internal/orchestrator"
	planpkg "github.com/rajsinghtech/tailbench/internal/plan"
	"github.com/rajsinghtech/tailbench/internal/preflight"
	"github.com/rajsinghtech/tailbench/internal/provider"
	"github.com/rajsinghtech/tailbench/internal/recovery"
	"github.com/rajsinghtech/tailbench/internal/runstate"
	summarypkg "github.com/rajsinghtech/tailbench/internal/summary"
	"github.com/rajsinghtech/tailbench/internal/tailnet"
)

var (
	version = "dev"
	commit  = "unknown"
	date    = "unknown"
)

// restoreStandardLogger undoes Pulumi's takeover of the standard log package.
//
// pulumi/sdk/go/common/util/logging has an init() that calls slog.SetDefault,
// and Go's slog.SetDefault also redirects the standard logger (log.SetOutput to
// an slog handlerWriter, log.SetFlags(0)). That handler defaults to
// discardHandler{} and is only configured by Pulumi's own CLI flag parsing,
// which the Automation API never runs — so without this, every log.Printf and
// log.Fatalf in tailbench is silently dropped and failures exit non-zero with
// no output at all.
//
// Must run before anything logs, and it also restores timestamps that
// slog.SetDefault cleared.
func restoreStandardLogger() {
	log.SetOutput(os.Stderr)
	log.SetFlags(log.LstdFlags)
}

func main() {
	// Must run before anything logs. The command layer writes user-facing output
	// through app.Application rather than the standard logger, but the
	// orchestrator and the Pulumi Automation API still log through it.
	restoreStandardLogger()
	os.Exit(mainExitCode())
}

func mainExitCode() int {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	return runWithInput(ctx, os.Args[1:], os.Stdin, os.Stdout, os.Stderr)
}

func run(ctx context.Context, args []string, stdout, stderr io.Writer) int {
	return runWithInput(ctx, args, strings.NewReader(""), stdout, stderr)
}

func runWithInput(ctx context.Context, args []string, stdin io.Reader, stdout, stderr io.Writer) int {
	return runWithDependencies(ctx, args, stdout, stderr, defaultCommandDependencies(stdin))
}

type commandDependencies struct {
	stdin           io.Reader
	newRuntime      func(*config.Config, io.Writer) (app.Runtime, error)
	remotePreflight func(context.Context, *config.Config) *preflight.Report
	cleanup         func(
		context.Context,
		*config.Config,
		*runstate.Manifest,
		[]runstate.Resource,
		io.Writer,
	) lifecycle.ExecutionResult
	newRunID func() (string, error)
	now      func() time.Time
}

func defaultCommandDependencies(stdin io.Reader) commandDependencies {
	if stdin == nil {
		stdin = strings.NewReader("")
	}
	return commandDependencies{
		stdin: stdin,
		newRuntime: func(cfg *config.Config, progress io.Writer) (app.Runtime, error) {
			orch, err := orchestrator.New(cfg, compiledProviderFactory)
			if err != nil {
				return nil, err
			}
			return &loggedRuntime{
				orchestrator:      orch,
				progress:          progress,
				cleanupPolicy:     cfg.CleanupPolicy,
				resourceExpiresAt: cfg.ResourceExpiresAt,
			}, nil
		},
		remotePreflight: runRemotePreflight,
		cleanup:         defaultCleanup,
		now:             func() time.Time { return time.Now().UTC() },
	}
}

func runWithDependencies(
	ctx context.Context,
	args []string,
	stdout io.Writer,
	stderr io.Writer,
	dependencies commandDependencies,
) int {
	if dependencies.stdin == nil {
		dependencies.stdin = strings.NewReader("")
	}
	if dependencies.newRuntime == nil {
		dependencies.newRuntime = defaultCommandDependencies(dependencies.stdin).newRuntime
	}
	if dependencies.remotePreflight == nil {
		dependencies.remotePreflight = runRemotePreflight
	}
	if dependencies.cleanup == nil {
		dependencies.cleanup = defaultCleanup
	}
	if dependencies.now == nil {
		dependencies.now = func() time.Time { return time.Now().UTC() }
	}
	application := app.Application{
		Name:     binaryNameForProvider(compiledProviderName),
		Provider: compiledProviderName,
		Build: app.BuildInfo{
			Version: version,
			Commit:  commit,
			Date:    date,
		},
		Execute: executionExecutor(dependencies),
		Commands: map[string]app.ExecutorFunc{
			"init":    initExecutor(),
			"plan":    planExecutor(),
			"doctor":  doctorExecutor(),
			"status":  runReportExecutor("status"),
			"results": runReportExecutor("results"),
			"resume":  resumeExecutor(dependencies),
			"cleanup": cleanupExecutor(dependencies),
		},
		SelectCommand: selectConfiguredCommand,
	}
	return application.Run(ctx, args, stdout, stderr)
}

func initExecutor() app.ExecutorFunc {
	return func(_ context.Context, args []string, _ io.Writer) app.RunOutcome {
		if len(args) != 0 {
			return commandFailure(
				"TB_USAGE",
				app.ExitUsage,
				"init",
				fmt.Errorf("init does not accept arguments: %s", strings.Join(args, " ")),
				"run init in the directory where config.yaml should be created",
			)
		}
		files := []struct {
			path string
			data []byte
			mode os.FileMode
		}{
			{
				path: "config.yaml",
				data: []byte(initialConfig(compiledProviderName)),
				mode: 0o644,
			},
			{
				path: ".env.example",
				data: []byte(
					"# Copy to .env and keep the resulting file private.\n" +
						"OAUTH_CLIENT_ID=\n" +
						"OAUTH_CLIENT_SECRET=\n",
				),
				mode: 0o600,
			},
		}
		for _, file := range files {
			if _, err := os.Stat(file.path); err == nil {
				return commandFailure(
					"TB_INIT_EXISTS",
					app.ExitRefused,
					"init",
					fmt.Errorf("%s already exists", file.path),
					"preserve the existing file or move it aside, then rerun init",
				)
			} else if !os.IsNotExist(err) {
				return commandFailure(
					"TB_INIT",
					app.ExitUsage,
					"init",
					fmt.Errorf("inspect %s: %w", file.path, err),
					"choose a writable directory and retry",
				)
			}
		}

		var created []string
		for _, file := range files {
			handle, err := os.OpenFile(file.path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, file.mode)
			if err != nil {
				for _, path := range created {
					_ = os.Remove(path)
				}
				return commandFailure(
					"TB_INIT",
					app.ExitUsage,
					"init",
					fmt.Errorf("create %s: %w", file.path, err),
					"choose a writable directory, verify no template exists, and retry",
				)
			}
			_, writeErr := handle.Write(file.data)
			closeErr := handle.Close()
			if err := errors.Join(writeErr, closeErr); err != nil {
				_ = os.Remove(file.path)
				for _, path := range created {
					_ = os.Remove(path)
				}
				return commandFailure(
					"TB_INIT",
					app.ExitUsage,
					"init",
					fmt.Errorf("write %s: %w", file.path, err),
					"verify available disk space and directory permissions, then retry",
				)
			}
			created = append(created, file.path)
		}

		return app.RunOutcome{
			Status:           app.StatusSucceeded,
			Stage:            "init",
			Message:          "created config.yaml and .env.example; local doctor and plan remain credential-free",
			ResourcesChanged: false,
			SelectedProvider: compiledProviderName,
			SelectedWorkload: workloadForProvider(compiledProviderName),
		}
	}
}

func initialConfig(providerName string) string {
	providerSection := ""
	switch providerName {
	case "aws", "eks":
		providerSection = `aws:
  region: us-west-2
  az: us-west-2a
  key_name: YOUR_AWS_KEY_PAIR
`
	case "azure", "aks":
		providerSection = `azure:
  location: eastus
  resource_group: tailbench-example
  ssh_user: azureuser
`
	case "gcp", "gke":
		providerSection = `gcp:
  project: YOUR_GCP_PROJECT_ID
  zone: us-central1-a
`
	}
	return fmt.Sprintf(`# Safe configuration for the provider compiled into this binary.
# Local doctor and plan do not open env_file or contact remote services.
env_file: .env

providers:
  - %s
family: all
filter: ""

tailscale:
  create_tailnet: false
  oauth_client_id: ${OAUTH_CLIENT_ID}
  oauth_client_secret: ${OAUTH_CLIENT_SECRET}
  tag: tag:bench

benchmark:
  modes:
    - l4-kernel
  iperf_duration: 30
  iperf_parallel: 4
  iperf_iterations: 3
  cooldown_sec: 30

%s
# Safe compatibility default: an unqualified invocation plans instead of provisioning.
dry_run: true
max_cost_usd: 10
max_duration: 45m
max_instance_types: 1
max_concurrent_resources: 1
cleanup_policy: always
`, providerName, providerSection)
}

func resumeExecutor(dependencies commandDependencies) app.ExecutorFunc {
	return func(ctx context.Context, args []string, progress io.Writer) app.RunOutcome {
		runID, approved, _, err := parseRecoveryArgs("resume", args)
		if err != nil {
			return commandFailure(
				"TB_USAGE",
				app.ExitUsage,
				"resume",
				err,
				"use resume RUN_ID [--yes]",
			)
		}
		rootDir, err := os.Getwd()
		if err != nil {
			return recoveryFailure("resume", runID, err)
		}
		store := runstate.NewStore(filepath.Join(rootDir, ".tailbench", "runs"))
		manifest, err := store.Load(runID)
		if err != nil {
			return recoveryFailure("resume", runID, err)
		}
		if manifest.Provider != compiledProviderName {
			return recoveryFailure(
				"resume",
				runID,
				fmt.Errorf(
					"run provider %q does not match compiled provider %q",
					manifest.Provider,
					compiledProviderName,
				),
			)
		}
		snapshotData, err := store.ReadEffectiveConfig(runID)
		if err != nil {
			return recoveryFailure("resume", runID, err)
		}
		resumeConfig, err := config.ParseRedacted(snapshotData)
		if err != nil {
			return recoveryFailure("resume", runID, err)
		}
		currentConfig, err := parseExecutionConfig(recordedExecutionArgs(manifest.CommandLine))
		if err != nil {
			var userErr *app.UserError
			if errors.As(err, &userErr) {
				userErr.RunID = runID
				return app.RunOutcome{Status: app.StatusFailed, Error: userErr}
			}
			return recoveryFailure("resume", runID, err)
		}
		resumeConfig.OAuthClientID = currentConfig.OAuthClientID
		resumeConfig.OAuthClientSecret = currentConfig.OAuthClientSecret
		resumeConfig.AzureSSHPubKey = currentConfig.AzureSSHPubKey
		resumeConfig.Yes = true
		resumeConfig.DryRun = false
		if missing := missingRunPrerequisites(resumeConfig); len(missing) > 0 {
			outcome := commandFailure(
				"TB_PREREQUISITE",
				app.ExitPrerequisite,
				"preflight",
				fmt.Errorf("required values are missing: %s", strings.Join(missing, ", ")),
				"set the required values before resuming: "+strings.Join(missing, ", "),
			)
			outcome.Error.RunID = runID
			return outcome
		}
		unfinished, err := configureResumeSelection(resumeConfig, manifest)
		if err != nil {
			return recoveryFailure("resume", runID, err)
		}
		if !approved {
			requiredOutput := app.RequiredWriter(progress)
			_, _ = fmt.Fprintf(
				requiredOutput,
				"TAILBENCH RESUME CONFIRMATION\nrun ID: %s\nprovider: %s\nunfinished work: %d\nduration limit: %s\ncleanup policy: %s\nProceed? [y/N]: ",
				runID,
				manifest.Provider,
				unfinished,
				resumeConfig.MaxDuration,
				resumeConfig.CleanupPolicy,
			)
			answer, readErr := bufio.NewReader(dependencies.stdin).ReadString('\n')
			_, _ = fmt.Fprintln(requiredOutput)
			if readErr != nil && !errors.Is(readErr, io.EOF) {
				return recoveryFailure("resume", runID, fmt.Errorf("read confirmation: %w", readErr))
			}
			answer = strings.ToLower(strings.TrimSpace(answer))
			if answer != "y" && answer != "yes" {
				outcome := commandFailure(
					"TB_DECLINED",
					app.ExitRefused,
					"confirmation",
					errors.New("user declined resume confirmation"),
					"inspect status and rerun resume only when the unfinished work is approved",
				)
				outcome.Error.RunID = runID
				return outcome
			}
		}

		if failure := remotePreflightFailure(
			dependencies.remotePreflight(ctx, resumeConfig),
			runID,
		); failure != nil {
			return *failure
		}

		runCtx, cancel := context.WithTimeout(ctx, resumeConfig.MaxDuration)
		defer cancel()
		manager := lifecycle.Manager{Store: store, Now: dependencies.now}
		managed, stateErr := manager.Resume(
			runCtx,
			runID,
			func(
				resumeCtx context.Context,
				recorder *lifecycle.Recorder,
				_ []runstate.WorkItem,
			) lifecycle.ExecutionResult {
				return executeWithRecorder(resumeCtx, recorder, resumeConfig, progress, dependencies)
			},
		)
		if stateErr != nil {
			return recoveryFailure("resume", runID, stateErr)
		}
		return managedRunOutcome(managed)
	}
}

func cleanupExecutor(dependencies commandDependencies) app.ExecutorFunc {
	return func(ctx context.Context, args []string, progress io.Writer) app.RunOutcome {
		runID, approved, recoverLocks, err := parseRecoveryArgs("cleanup", args)
		if err != nil {
			return commandFailure(
				"TB_USAGE",
				app.ExitUsage,
				"cleanup",
				err,
				"use cleanup RUN_ID [--recover-pulumi-locks] [--yes]",
			)
		}
		rootDir, err := os.Getwd()
		if err != nil {
			return recoveryFailure("cleanup", runID, err)
		}
		store := runstate.NewStore(filepath.Join(rootDir, ".tailbench", "runs"))
		manifest, err := store.Load(runID)
		if err != nil {
			return recoveryFailure("cleanup", runID, err)
		}
		if manifest.Provider != compiledProviderName {
			return recoveryFailure(
				"cleanup",
				runID,
				fmt.Errorf(
					"run provider %q does not match compiled provider %q",
					manifest.Provider,
					compiledProviderName,
				),
			)
		}
		for _, resource := range manifest.Resources {
			if resource.Status == runstate.ResourceCleaned {
				continue
			}
			if resource.CleanupOwner != runID || !resource.OwnershipCertain {
				return recoveryFailure(
					"cleanup",
					runID,
					fmt.Errorf(
						"resource %q lacks certain cleanup ownership for run %s",
						resource.ID,
						runID,
					),
				)
			}
		}
		snapshotData, err := store.ReadEffectiveConfig(runID)
		if err != nil {
			return recoveryFailure("cleanup", runID, err)
		}
		cleanupConfig, err := config.ParseRedacted(snapshotData)
		if err != nil {
			return recoveryFailure("cleanup", runID, err)
		}
		currentConfig, err := parseExecutionConfig(recordedExecutionArgs(manifest.CommandLine))
		if err != nil {
			var userErr *app.UserError
			if errors.As(err, &userErr) {
				userErr.RunID = runID
				return app.RunOutcome{Status: app.StatusFailed, Error: userErr}
			}
			return recoveryFailure("cleanup", runID, err)
		}
		cleanupConfig.OAuthClientID = currentConfig.OAuthClientID
		cleanupConfig.OAuthClientSecret = currentConfig.OAuthClientSecret
		cleanupConfig.AzureSSHPubKey = currentConfig.AzureSSHPubKey
		cleanupConfig.Yes = true
		cleanupConfig.DryRun = false
		cleanupConfig.RunID = runID
		if missing := missingRunPrerequisites(cleanupConfig); len(missing) > 0 {
			outcome := commandFailure(
				"TB_PREREQUISITE",
				app.ExitPrerequisite,
				"preflight",
				fmt.Errorf("required values are missing: %s", strings.Join(missing, ", ")),
				"set the required values before cleaning up: "+strings.Join(missing, ", "),
			)
			outcome.Error.RunID = runID
			return outcome
		}
		var lockPaths []string
		if recoverLocks {
			stackNames := recordedStackNames(manifest)
			if len(stackNames) == 0 {
				return recoveryFailure(
					"cleanup",
					runID,
					errors.New("run manifest has no recorded Pulumi stack names"),
				)
			}
			lockPaths, err = recovery.FindPulumiLocks(
				providerStatePath(cleanupConfig.StateDir, manifest.Provider),
				stackNames,
			)
			if err != nil {
				return recoveryFailure("cleanup", runID, err)
			}
		}
		uncleanCount := 0
		for _, resource := range manifest.Resources {
			if resource.Status != runstate.ResourceCleaned {
				uncleanCount++
			}
		}
		if !approved {
			requiredOutput := app.RequiredWriter(progress)
			_, _ = fmt.Fprintf(
				requiredOutput,
				"TAILBENCH CLEANUP CONFIRMATION\nrun ID: %s\nprovider: %s\ntracked resources: %d\n",
				runID,
				manifest.Provider,
				uncleanCount,
			)
			if recoverLocks {
				if len(lockPaths) == 0 {
					_, _ = fmt.Fprintln(requiredOutput, "Pulumi lock recovery: no matching recorded-stack locks found")
				} else {
					_, _ = fmt.Fprintln(requiredOutput, "Pulumi lock recovery will remove:")
					for _, path := range lockPaths {
						_, _ = fmt.Fprintf(requiredOutput, "  - %s\n", path)
					}
				}
			}
			_, _ = fmt.Fprint(
				requiredOutput,
				"This action destroys resources owned by the named run.\nProceed? [y/N]: ",
			)
			answer, readErr := bufio.NewReader(dependencies.stdin).ReadString('\n')
			_, _ = fmt.Fprintln(requiredOutput)
			if readErr != nil && !errors.Is(readErr, io.EOF) {
				return recoveryFailure("cleanup", runID, fmt.Errorf("read confirmation: %w", readErr))
			}
			answer = strings.ToLower(strings.TrimSpace(answer))
			if answer != "y" && answer != "yes" {
				outcome := commandFailure(
					"TB_DECLINED",
					app.ExitRefused,
					"confirmation",
					errors.New("user declined cleanup confirmation"),
					"inspect status and rerun cleanup only for the intended run",
				)
				outcome.Error.RunID = runID
				return outcome
			}
		}

		if failure := remotePreflightFailure(
			dependencies.remotePreflight(ctx, cleanupConfig),
			runID,
		); failure != nil {
			return *failure
		}

		cleanupCtx, cancel := context.WithTimeout(ctx, cleanupConfig.MaxDuration)
		defer cancel()
		manager := lifecycle.Manager{Store: store, Now: dependencies.now}
		managed, stateErr := manager.Cleanup(
			cleanupCtx,
			runID,
			func(
				runCtx context.Context,
				recorder *lifecycle.Recorder,
				resources []runstate.Resource,
			) lifecycle.ExecutionResult {
				result := recoverRecordedPulumiLocks(
					recorder,
					providerStatePath(cleanupConfig.StateDir, manifest.Provider),
					lockPaths,
					recoverLocks,
				)
				cleanupResult := dependencies.cleanup(
					runCtx,
					cleanupConfig,
					manifest,
					resources,
					progress,
				)
				result.BenchmarkOutcome = cleanupResult.BenchmarkOutcome
				if cleanupResult.CleanupOutcome != "" {
					result.CleanupOutcome = cleanupResult.CleanupOutcome
				}
				result.ResourcesChanged = result.ResourcesChanged ||
					cleanupResult.ResourcesChanged
				result.Resources = append(result.Resources, cleanupResult.Resources...)
				result.Work = append(result.Work, cleanupResult.Work...)
				result.Failures = append(result.Failures, cleanupResult.Failures...)
				result.Err = errors.Join(result.Err, cleanupResult.Err)
				if result.Err != nil {
					result.CleanupOutcome = runstate.OutcomeFailed
				}
				return result
			},
		)
		if stateErr != nil {
			return recoveryFailure("cleanup", runID, stateErr)
		}
		return managedRunOutcome(managed)
	}
}

func defaultCleanup(
	ctx context.Context,
	cfg *config.Config,
	manifest *runstate.Manifest,
	resources []runstate.Resource,
	progress io.Writer,
) lifecycle.ExecutionResult {
	result := lifecycle.ExecutionResult{
		CleanupOutcome:   runstate.OutcomeSucceeded,
		ResourcesChanged: len(resources) > 0,
	}
	if len(resources) == 0 {
		err := errors.New("manifest has no provider resource inventory with certain ownership")
		result.CleanupOutcome = runstate.OutcomeFailed
		result.Err = err
		result.Failures = append(result.Failures, runstate.Failure{
			Code:    "cleanup-ownership",
			Stage:   "cleanup",
			Class:   string(failure.StateConflict),
			Message: err.Error(),
		})
		return result
	}
	p, err := compiledProviderFactory(manifest.Provider, cfg)
	if err != nil {
		result.CleanupOutcome = runstate.OutcomeFailed
		result.Err = err
		return result
	}
	instanceTypes := map[string]struct{}{}
	for _, work := range manifest.Work {
		if work.InstanceType != "" {
			instanceTypes[work.InstanceType] = struct{}{}
		}
	}
	types := make([]string, 0, len(instanceTypes))
	for instanceType := range instanceTypes {
		types = append(types, instanceType)
	}
	sort.Strings(types)
	var failures []error
	for _, instanceType := range types {
		_, _ = fmt.Fprintf(progress, "[cleanup] destroy %s\n", instanceType)
		result.ResourcesChanged = true
		if err := p.DestroyPair(ctx, instanceType); err != nil {
			failures = append(failures, fmt.Errorf("destroy %s: %w", instanceType, err))
		}
	}
	managedNetworking := true
	if capability, ok := p.(provider.ManagedNetworkingProvider); ok {
		managedNetworking = capability.ManagesNetworking()
	}
	if managedNetworking {
		_, _ = fmt.Fprintln(progress, "[cleanup] teardown networking")
		result.ResourcesChanged = true
		if err := p.TeardownNetworking(ctx); err != nil {
			failures = append(failures, fmt.Errorf("teardown networking: %w", err))
		}
	}
	tailnetManager := &tailnet.Manager{
		OrgClientID:     cfg.OAuthClientID,
		OrgClientSecret: cfg.OAuthClientSecret,
		Tag:             cfg.Tag,
	}
	for _, resource := range resources {
		if resource.Kind != "tailnet" {
			continue
		}
		if resource.ProviderID == "" {
			failures = append(failures, fmt.Errorf("tailnet resource %q has no DNS cleanup identifier", resource.ID))
			continue
		}
		_, _ = fmt.Fprintf(progress, "[cleanup] delete tailnet %s\n", resource.ProviderID)
		result.ResourcesChanged = true
		if err := tailnetManager.DeleteTailnet(ctx, resource.ProviderID); err != nil {
			failures = append(failures, fmt.Errorf("delete tailnet %s: %w", resource.ProviderID, err))
		}
	}
	result.Err = errors.Join(failures...)
	if result.Err != nil {
		result.CleanupOutcome = runstate.OutcomeFailed
		result.Failures = append(result.Failures, runstate.Failure{
			Code:    "cleanup-failure",
			Stage:   "cleanup",
			Class:   string(failure.CleanupFailure),
			Message: result.Err.Error(),
		})
	}
	return result
}

func parseRecoveryArgs(
	command string,
	args []string,
) (runID string, approved bool, recoverLocks bool, err error) {
	for _, arg := range args {
		switch arg {
		case "--yes", "--yes=true":
			approved = true
		case "--yes=false":
			approved = false
		case "--recover-pulumi-locks", "--recover-pulumi-locks=true":
			if command != "cleanup" {
				return "", false, false, fmt.Errorf(
					"--recover-pulumi-locks is only valid with cleanup",
				)
			}
			recoverLocks = true
		case "--recover-pulumi-locks=false":
			recoverLocks = false
		default:
			if strings.HasPrefix(arg, "-") {
				return "", false, false, fmt.Errorf("unknown %s flag %q", command, arg)
			}
			if runID != "" {
				return "", false, false, fmt.Errorf("%s requires exactly one run ID", command)
			}
			runID = arg
		}
	}
	if runID == "" {
		return "", false, false, fmt.Errorf("%s requires a run ID", command)
	}
	return runID, approved, recoverLocks, nil
}

func recordedStackNames(manifest *runstate.Manifest) []string {
	if manifest == nil {
		return nil
	}
	seen := make(map[string]struct{})
	for _, resource := range manifest.Resources {
		if resource.StackName == "" ||
			resource.CleanupOwner != manifest.RunID ||
			!resource.OwnershipCertain {
			continue
		}
		seen[resource.StackName] = struct{}{}
	}
	names := make([]string, 0, len(seen))
	for name := range seen {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

func providerStatePath(baseDir, providerName string) string {
	return filepath.Join(
		filepath.Clean(strings.TrimPrefix(baseDir, "file://")),
		providerName,
	)
}

func recoverRecordedPulumiLocks(
	recorder *lifecycle.Recorder,
	providerStateDir string,
	lockPaths []string,
	requested bool,
) lifecycle.ExecutionResult {
	if !requested {
		return lifecycle.ExecutionResult{}
	}
	message := "no matching recorded-stack Pulumi locks found"
	if len(lockPaths) > 0 {
		message = "remove recorded-stack Pulumi locks: " + strings.Join(lockPaths, ", ")
	}
	result := lifecycle.ExecutionResult{}
	if err := recorder.BeforeExternalStep("recover-pulumi-locks", "", message); err != nil {
		result.CleanupOutcome = runstate.OutcomeFailed
		result.Err = err
		result.Failures = append(result.Failures, runstate.Failure{
			Code:    "pulumi-lock-recovery",
			Stage:   "recover-pulumi-locks",
			Class:   string(failure.StateConflict),
			Message: err.Error(),
		})
		return result
	}
	removed, removeErr := recovery.RemovePulumiLocks(providerStateDir, lockPaths)
	result.ResourcesChanged = len(removed) > 0
	status := runstate.WorkSucceeded
	finishMessage := "no matching recorded-stack Pulumi locks required removal"
	if len(removed) > 0 {
		finishMessage = "removed Pulumi locks: " + strings.Join(removed, ", ")
	}
	if removeErr != nil {
		status = runstate.WorkFailed
		finishMessage = removeErr.Error()
	}
	stateErr := recorder.AfterExternalStep(
		"recover-pulumi-locks",
		"",
		status,
		finishMessage,
	)
	result.Err = errors.Join(removeErr, stateErr)
	if result.Err != nil {
		result.CleanupOutcome = runstate.OutcomeFailed
		result.Failures = append(result.Failures, runstate.Failure{
			Code:    "pulumi-lock-recovery",
			Stage:   "recover-pulumi-locks",
			Class:   string(failure.StateConflict),
			Message: result.Err.Error(),
		})
	}
	return result
}

func recordedExecutionArgs(commandLine []string) []string {
	if len(commandLine) >= 2 && commandLine[1] == "run" {
		return append([]string(nil), commandLine[2:]...)
	}
	if len(commandLine) >= 1 {
		return append([]string(nil), commandLine[1:]...)
	}
	return nil
}

func configureResumeSelection(cfg *config.Config, manifest *runstate.Manifest) (int, error) {
	instanceTypes := map[string]struct{}{}
	modes := map[string]struct{}{}
	for _, work := range manifest.Work {
		switch work.Status {
		case runstate.WorkPending, runstate.WorkRunning, runstate.WorkFailed:
			if work.InstanceType != "" {
				instanceTypes[work.InstanceType] = struct{}{}
			}
			if work.Mode != "" {
				modes[work.Mode] = struct{}{}
			}
		}
	}
	if len(instanceTypes) == 0 || len(modes) == 0 {
		return 0, fmt.Errorf("%w: %s", lifecycle.ErrNotRecoverable, manifest.RunID)
	}
	types := make([]string, 0, len(instanceTypes))
	for instanceType := range instanceTypes {
		types = append(types, regexp.QuoteMeta(instanceType))
	}
	sort.Strings(types)
	selectedModes := make([]string, 0, len(modes))
	for mode := range modes {
		selectedModes = append(selectedModes, mode)
	}
	sort.Strings(selectedModes)
	cfg.Family = "all"
	cfg.Filter = "^(?:" + strings.Join(types, "|") + ")$"
	cfg.Modes = selectedModes
	if cfg.MaxInstanceTypes < len(instanceTypes) {
		cfg.MaxInstanceTypes = len(instanceTypes)
	}
	return len(instanceTypes), nil
}

func executionExecutor(dependencies commandDependencies) app.ExecutorFunc {
	return func(ctx context.Context, args []string, progress io.Writer) app.RunOutcome {
		cfg, localPlan, failure := buildLocalPlan(ctx, args)
		if failure != nil {
			return *failure
		}
		decision := guardrail.Check(localPlan, cfg)
		if !decision.Allowed {
			causes := make([]string, 0, len(decision.Violations))
			remediations := make([]string, 0, len(decision.Violations))
			for _, violation := range decision.Violations {
				causes = append(causes, violation.Code+": "+violation.Message)
				remediations = append(remediations, violation.Remediation)
			}
			outcome := commandFailure(
				"TB_SAFETY_LIMIT",
				app.ExitRefused,
				"guardrails",
				errors.New(strings.Join(causes, "; ")),
				strings.Join(remediations, "; "),
			)
			return outcome
		}

		executionConfig, err := parseExecutionConfig(args)
		if err != nil {
			var userErr *app.UserError
			if errors.As(err, &userErr) {
				return app.RunOutcome{Status: app.StatusFailed, Error: userErr}
			}
			return commandFailure(
				"TB_CONFIG",
				app.ExitUsage,
				"configuration",
				err,
				"fix the named flag or configuration path and rerun",
			)
		}
		if missing := missingRunPrerequisites(executionConfig); len(missing) > 0 {
			return commandFailure(
				"TB_PREREQUISITE",
				app.ExitPrerequisite,
				"preflight",
				fmt.Errorf("required values are missing: %s", strings.Join(missing, ", ")),
				"set the required values before running: "+strings.Join(missing, ", "),
			)
		}

		if !executionConfig.Yes {
			requiredOutput := app.RequiredWriter(progress)
			if err := guardrail.WriteConfirmation(requiredOutput, localPlan, executionConfig, decision); err != nil {
				return commandFailure(
					"TB_CONFIRMATION",
					app.ExitRefused,
					"confirmation",
					fmt.Errorf("write confirmation: %w", err),
					"verify the terminal is writable and retry",
				)
			}
			answer, readErr := bufio.NewReader(dependencies.stdin).ReadString('\n')
			_, _ = fmt.Fprintln(requiredOutput)
			if readErr != nil && !errors.Is(readErr, io.EOF) {
				return commandFailure(
					"TB_CONFIRMATION",
					app.ExitRefused,
					"confirmation",
					fmt.Errorf("read confirmation: %w", readErr),
					"retry from an interactive terminal or use --yes with an explicit --max-cost-usd",
				)
			}
			answer = strings.ToLower(strings.TrimSpace(answer))
			if answer != "y" && answer != "yes" {
				return commandFailure(
					"TB_DECLINED",
					app.ExitRefused,
					"confirmation",
					errors.New("user declined execution confirmation"),
					"review the plan and rerun only when the bounded work is approved",
				)
			}
		}

		report := dependencies.remotePreflight(ctx, executionConfig)
		if failure := remotePreflightFailure(report, ""); failure != nil {
			return *failure
		}

		rootDir, err := os.Getwd()
		if err != nil {
			return commandFailure(
				"TB_RUN_STATE",
				app.ExitRunFailed,
				"run-state",
				fmt.Errorf("resolve working directory: %w", err),
				"choose a writable working directory and retry",
			)
		}
		runCtx, cancel := context.WithTimeout(ctx, executionConfig.MaxDuration)
		defer cancel()
		effectiveConfig, err := config.MarshalRedacted(executionConfig)
		if err != nil {
			return commandFailure(
				"TB_RUN_STATE",
				app.ExitRunFailed,
				"run-state",
				err,
				"fix the effective configuration before starting a recoverable run",
			)
		}
		store := runstate.NewStore(filepath.Join(rootDir, ".tailbench", "runs"))
		manager := lifecycle.Manager{
			Store:    store,
			Now:      dependencies.now,
			NewRunID: dependencies.newRunID,
		}
		managed, stateErr := manager.Run(runCtx, lifecycle.Request{
			CommandLine: append(
				[]string{binaryNameForProvider(compiledProviderName), "run"},
				args...,
			),
			Binary: runstate.BinaryInfo{
				Name:      binaryNameForProvider(compiledProviderName),
				Version:   version,
				Commit:    commit,
				BuildDate: date,
			},
			Identity:            manifestCloudIdentity(report, executionConfig),
			Plan:                localPlan,
			EffectiveConfigYAML: effectiveConfig,
			Images: []runstate.ImageInfo{
				{Name: "bench", Value: executionConfig.BenchImage},
				{Name: "tailscale", Value: executionConfig.TSImage},
			},
			Execute: func(runCtx context.Context, recorder *lifecycle.Recorder) (result lifecycle.ExecutionResult) {
				return executeWithRecorder(runCtx, recorder, executionConfig, progress, dependencies)
			},
		})
		if stateErr != nil {
			return commandFailure(
				"TB_RUN_STATE",
				app.ExitRunFailed,
				"run-state",
				stateErr,
				"inspect .tailbench/runs, preserve any existing state, and retry",
			)
		}
		return managedRunOutcome(managed)
	}
}

func manifestCloudIdentity(
	report *preflight.Report,
	cfg *config.Config,
) runstate.CloudIdentity {
	var identity runstate.CloudIdentity
	if report != nil {
		identity.Account = report.Identity.Account
		identity.Project = report.Identity.Project
		identity.Subscription = report.Identity.Subscription
	}
	if cfg != nil && (compiledProviderName == "gcp" || compiledProviderName == "gke") {
		identity.Project = cfg.GCPProject
	}
	return identity
}

func runRemotePreflight(ctx context.Context, _ *config.Config) *preflight.Report {
	return preflight.Doctor(ctx, preflight.Request{
		Provider:      compiledProviderName,
		Workload:      workloadForProvider(compiledProviderName),
		Finder:        preflight.PathFinder{},
		Remote:        true,
		RemoteChecker: preflight.CommandRemoteChecker{},
	})
}

func preflightFailureDetail(report *preflight.Report) (error, string) {
	if report == nil {
		return errors.New("remote preflight returned no report"),
			"run doctor --remote, repair the reported prerequisite, and retry"
	}
	var causes []string
	var remediations []string
	for _, check := range report.Checks {
		if check.Status != preflight.StatusFailed {
			continue
		}
		detail := check.Detail
		if detail == "" {
			detail = "check failed"
		}
		causes = append(causes, check.Name+": "+detail)
		if check.Remediation != "" {
			remediations = append(remediations, check.Remediation)
		}
	}
	if len(causes) == 0 {
		causes = append(causes, "remote preflight did not report a ready state")
	}
	if len(remediations) == 0 {
		remediations = append(
			remediations,
			"run doctor --remote, repair the reported prerequisite, and retry",
		)
	}
	return errors.New(strings.Join(causes, "; ")), strings.Join(remediations, "; ")
}

func remotePreflightFailure(
	report *preflight.Report,
	runID string,
) *app.RunOutcome {
	if report != nil && report.Ready {
		return nil
	}
	cause, remediation := preflightFailureDetail(report)
	outcome := commandFailure(
		"TB_PREREQUISITE",
		app.ExitPrerequisite,
		"preflight",
		cause,
		remediation,
	)
	outcome.Error.RunID = runID
	return &outcome
}

func executeWithRecorder(
	ctx context.Context,
	recorder *lifecycle.Recorder,
	executionConfig *config.Config,
	progress io.Writer,
	dependencies commandDependencies,
) (result lifecycle.ExecutionResult) {
	executionConfig.RunID = recorder.RunID()
	if executionConfig.ResourceExpiresAt == "" {
		executionConfig.ResourceExpiresAt = dependencies.now().
			Add(executionConfig.MaxDuration + time.Hour).
			UTC().
			Format(time.RFC3339)
	}
	logFile, err := recorder.OpenLog()
	if err != nil {
		result.BenchmarkOutcome = runstate.OutcomeFailed
		result.CleanupOutcome = runstate.OutcomePending
		result.Err = fmt.Errorf("open durable run log: %w", err)
		return result
	}
	defer func() {
		if closeErr := logFile.Close(); closeErr != nil {
			result.Failures = append(result.Failures, runstate.Failure{
				Code:    "result-write-failure",
				Stage:   "logging",
				Class:   string(failure.ResultWrite),
				Message: closeErr.Error(),
			})
			result.Err = errors.Join(result.Err, closeErr)
		}
	}()
	runtimeProgress := io.MultiWriter(progress, app.RedactingWriter(logFile))
	runtime, err := dependencies.newRuntime(executionConfig, runtimeProgress)
	if err != nil {
		result.BenchmarkOutcome = runstate.OutcomeFailed
		result.CleanupOutcome = runstate.OutcomeSkipped
		result.Err = err
		result.Failures = append(result.Failures, runstate.Failure{
			Code:    "runtime-construction",
			Stage:   "startup",
			Class:   string(failure.InvalidConfiguration),
			Message: err.Error(),
		})
		return result
	}
	if aware, ok := runtime.(interface {
		SetRunRecorder(*lifecycle.Recorder)
	}); ok {
		aware.SetRunRecorder(recorder)
	}
	if detailed, ok := runtime.(interface {
		RunWithResult(context.Context) lifecycle.ExecutionResult
	}); ok {
		return detailed.RunWithResult(ctx)
	}

	result.ResourcesChanged = true
	result.Err = runtime.Run(ctx)
	if result.Err == nil {
		result.BenchmarkOutcome = runstate.OutcomeSucceeded
		if executionConfig.CleanupPolicy == config.CleanupManual {
			result.CleanupOutcome = runstate.OutcomeSkipped
		} else {
			result.CleanupOutcome = runstate.OutcomeSucceeded
		}
		return result
	}
	result.BenchmarkOutcome = runstate.OutcomeFailed
	result.CleanupOutcome = runstate.OutcomePending
	result.Failures = append(result.Failures, runstate.Failure{
		Code:    "run-failure",
		Stage:   "run",
		Class:   string(failure.Classify("benchmark", result.Err)),
		Message: result.Err.Error(),
	})
	return result
}

func buildLocalPlan(ctx context.Context, args []string) (*config.Config, *planpkg.Plan, *app.RunOutcome) {
	cfg, err := config.ParseLocalArgs(compiledProviderName, args)
	if err != nil {
		outcome := commandFailure(
			"TB_CONFIG",
			app.ExitUsage,
			"configuration",
			err,
			"fix the named flag or configuration path and rerun",
		)
		return nil, nil, &outcome
	}
	localPlan, err := planpkg.Build(ctx, planpkg.Request{
		CompiledProvider: compiledProviderName,
		Config:           cfg,
		Catalog:          planpkg.PricingCatalog{},
	})
	if err != nil {
		outcome := commandFailure(
			"TB_PLAN",
			app.ExitUsage,
			"plan",
			err,
			"correct the selector, provider, or benchmark modes and rerun plan",
		)
		return nil, nil, &outcome
	}
	return cfg, localPlan, nil
}

func managedRunOutcome(managed *lifecycle.Outcome) app.RunOutcome {
	manifest := managed.Manifest
	outcome := app.RunOutcome{
		Started:          true,
		Stage:            "complete",
		Message:          "requested work completed",
		ResourcesChanged: manifest.ResourcesChanged,
		RunID:            manifest.RunID,
		LogLocation:      managed.LogPath,
		BenchmarkStatus:  componentStatus(manifest.BenchmarkOutcome),
		CleanupStatus:    componentStatus(manifest.CleanupOutcome),
		SelectedProvider: manifest.Provider,
		SelectedWorkload: manifest.Workload,
	}
	switch manifest.Status {
	case runstate.RunSucceeded:
		outcome.Status = app.StatusSucceeded
	case runstate.RunCleaned:
		outcome.Status = app.StatusSucceeded
		outcome.Stage = "cleanup"
		outcome.Message = "cleanup completed for the named run"
	case runstate.RunPartial:
		outcome.Status = app.StatusPartial
		outcome.Stage = "cleanup"
		outcome.Message = "benchmark work completed but cleanup failed"
	case runstate.RunInterrupted:
		outcome.Status = app.StatusInterrupted
		outcome.Stage = "run"
		outcome.Message = "run interrupted; recoverable state was saved"
	default:
		outcome.Status = app.StatusFailed
		outcome.Stage = "run"
		outcome.Message = "requested work failed; recoverable state was saved"
	}
	if managed.ExecutionError == nil && outcome.Status == app.StatusSucceeded {
		return outcome
	}

	cause := managed.ExecutionError
	if cause == nil {
		cause = errors.New("run did not complete successfully; inspect the persisted failure list")
	}
	binary := manifest.Binary.Name
	if binary == "" {
		binary = binaryNameForProvider(manifest.Provider)
	}
	remediation := fmt.Sprintf(
		"%s status %s; %s resume %s --yes; or %s cleanup %s --yes",
		binary,
		manifest.RunID,
		binary,
		manifest.RunID,
		binary,
		manifest.RunID,
	)
	code := "TB_RUN_FAILED"
	exitStatus := app.ExitRunFailed
	stage := "run"
	if manifest.BenchmarkOutcome == runstate.OutcomeSucceeded &&
		manifest.CleanupOutcome == runstate.OutcomeFailed {
		code = "TB_CLEANUP_FAILED"
		stage = "cleanup"
	} else if errors.Is(cause, context.DeadlineExceeded) {
		code = "TB_DURATION_LIMIT"
		outcome.Status = app.StatusFailed
		outcome.Message = "run stopped at the configured duration limit; recoverable state was saved"
	} else if errors.Is(cause, context.Canceled) {
		code = "TB_INTERRUPTED"
		exitStatus = app.ExitInterrupted
	}
	outcome.Error = &app.UserError{
		Code:             code,
		ExitStatus:       exitStatus,
		Stage:            stage,
		Cause:            cause,
		Remediation:      remediation,
		ResourcesChanged: manifest.ResourcesChanged,
		RunID:            manifest.RunID,
		LogLocation:      managed.LogPath,
	}
	return outcome
}

func componentStatus(status runstate.OutcomeStatus) app.ComponentStatus {
	switch status {
	case runstate.OutcomeSucceeded:
		return app.ComponentSucceeded
	case runstate.OutcomeFailed:
		return app.ComponentFailed
	case runstate.OutcomeSkipped:
		return app.ComponentSkipped
	default:
		return app.ComponentPending
	}
}

func runReportExecutor(command string) app.ExecutorFunc {
	return func(_ context.Context, args []string, _ io.Writer) app.RunOutcome {
		if len(args) != 1 || strings.HasPrefix(args[0], "-") {
			return commandFailure(
				"TB_USAGE",
				app.ExitUsage,
				command,
				fmt.Errorf("%s requires exactly one run ID", command),
				fmt.Sprintf("use %s RUN_ID", command),
			)
		}
		runID := args[0]
		rootDir, err := os.Getwd()
		if err != nil {
			return recoveryFailure(command, runID, fmt.Errorf("resolve working directory: %w", err))
		}
		store := runstate.NewStore(filepath.Join(rootDir, ".tailbench", "runs"))
		manifest, err := store.Load(runID)
		if err != nil {
			return recoveryFailure(command, runID, err)
		}

		var report any
		switch command {
		case "status":
			report = summarypkg.NewStatusReport(manifest)
		case "results":
			report = summarypkg.NewResultsReport(manifest)
		default:
			return commandFailure(
				"TB_INTERNAL",
				app.ExitRunFailed,
				command,
				fmt.Errorf("unsupported local report command %q", command),
				"reinstall Tailbench or report this defect",
			)
		}
		return app.RunOutcome{
			Status:           app.StatusSucceeded,
			Stage:            command,
			Message:          fmt.Sprintf("%s report loaded", command),
			ResourcesChanged: false,
			RunID:            manifest.RunID,
			SelectedProvider: manifest.Provider,
			SelectedWorkload: manifest.Workload,
			Report:           report,
		}
	}
}

func recoveryFailure(stage, runID string, cause error) app.RunOutcome {
	remediation := "verify the run ID and inspect .tailbench/runs for a versioned manifest"
	if !errors.Is(cause, runstate.ErrRunNotFound) && !errors.Is(cause, runstate.ErrInvalidRunID) {
		remediation = "restore or repair the named manifest before resuming or cleaning up resources"
	}
	outcome := commandFailure(
		"TB_RECOVERY",
		app.ExitRecovery,
		stage,
		cause,
		remediation,
	)
	outcome.Error.RunID = runID
	return outcome
}

func selectConfiguredCommand(args []string) (string, *app.UserError) {
	cfg, err := config.ParseLocalArgs(compiledProviderName, args)
	if err != nil {
		return "", &app.UserError{
			Code:             "TB_CONFIG",
			ExitStatus:       app.ExitUsage,
			Stage:            "configuration",
			Cause:            err,
			Remediation:      "fix the named flag or configuration path and rerun the command",
			ResourcesChanged: false,
		}
	}
	if cfg.DryRun {
		return "plan", nil
	}
	return "", nil
}

func parseExecutionConfig(args []string) (*config.Config, error) {
	cfg, err := config.ParseArgs(compiledProviderName, args)
	if err == nil {
		return cfg, nil
	}
	var loadErr *config.LoadError
	if errors.As(err, &loadErr) && loadErr.Kind == config.ErrorEnvironmentFile {
		return nil, &app.UserError{
			Code:             "TB_PREREQUISITE",
			ExitStatus:       app.ExitPrerequisite,
			Stage:            "preflight",
			Cause:            loadErr,
			Remediation:      "create the environment file, or remove env_file and supply the required values another way",
			ResourcesChanged: false,
		}
	}
	return nil, err
}

func planExecutor() app.ExecutorFunc {
	return func(ctx context.Context, args []string, _ io.Writer) app.RunOutcome {
		_, localPlan, failure := buildLocalPlan(ctx, args)
		if failure != nil {
			return *failure
		}
		return app.RunOutcome{
			Status:           app.StatusSucceeded,
			Stage:            "plan",
			Message:          "local plan completed without side effects",
			ResourcesChanged: false,
			SelectedProvider: compiledProviderName,
			SelectedWorkload: workloadForProvider(compiledProviderName),
			Report:           localPlan,
		}
	}
}

func doctorExecutor() app.ExecutorFunc {
	return func(ctx context.Context, args []string, _ io.Writer) app.RunOutcome {
		remote, configArgs, err := splitDoctorArgs(args)
		if err != nil {
			return commandFailure(
				"TB_USAGE",
				app.ExitUsage,
				"arguments",
				err,
				"use doctor [--remote] with normal configuration flags",
			)
		}

		var cfg *config.Config
		if remote {
			cfg, err = parseExecutionConfig(configArgs)
		} else {
			cfg, err = config.ParseLocalArgs(compiledProviderName, configArgs)
		}
		if err != nil {
			var userErr *app.UserError
			if errors.As(err, &userErr) {
				return app.RunOutcome{Status: app.StatusFailed, Error: userErr}
			}
			return commandFailure(
				"TB_CONFIG",
				app.ExitUsage,
				"configuration",
				err,
				"fix the named flag or configuration path and rerun doctor",
			)
		}
		if err := validateCompiledProvider(cfg); err != nil {
			return commandFailure(
				"TB_CONFIG",
				app.ExitUsage,
				"configuration",
				err,
				"use the provider binary that matches the configured provider",
			)
		}
		if remote {
			if missing := missingRunPrerequisites(cfg); len(missing) > 0 {
				return commandFailure(
					"TB_PREREQUISITE",
					app.ExitPrerequisite,
					"preflight",
					fmt.Errorf("required values are missing: %s", strings.Join(missing, ", ")),
					"set the required values before running doctor --remote",
				)
			}
		}

		request := preflight.Request{
			Provider: compiledProviderName,
			Workload: workloadForProvider(compiledProviderName),
			Finder:   preflight.PathFinder{},
			Remote:   remote,
		}
		if remote {
			request.RemoteChecker = preflight.CommandRemoteChecker{}
		}
		report := preflight.Doctor(ctx, request)
		if report.Ready {
			return app.RunOutcome{
				Status:           app.StatusSucceeded,
				Stage:            "doctor",
				Message:          "prerequisite checks passed",
				ResourcesChanged: false,
				SelectedProvider: compiledProviderName,
				SelectedWorkload: workloadForProvider(compiledProviderName),
				Report:           report,
			}
		}
		outcome := commandFailure(
			"TB_PREREQUISITE",
			app.ExitPrerequisite,
			"doctor",
			errors.New("one or more prerequisite checks failed"),
			"follow each failed check remediation and rerun doctor",
		)
		outcome.Report = report
		return outcome
	}
}

func splitDoctorArgs(args []string) (bool, []string, error) {
	remote := false
	configArgs := make([]string, 0, len(args))
	for _, arg := range args {
		switch arg {
		case "--remote":
			remote = true
		case "--remote=false":
			remote = false
		default:
			if strings.HasPrefix(arg, "--remote=") {
				return false, nil, fmt.Errorf("invalid --remote value %q", strings.TrimPrefix(arg, "--remote="))
			}
			configArgs = append(configArgs, arg)
		}
	}
	return remote, configArgs, nil
}

func validateCompiledProvider(cfg *config.Config) error {
	if cfg == nil || len(cfg.Providers) != 1 {
		count := 0
		if cfg != nil {
			count = len(cfg.Providers)
		}
		return fmt.Errorf("exactly one provider is required; got %d", count)
	}
	for _, providerName := range cfg.Providers {
		if providerName != compiledProviderName {
			return fmt.Errorf(
				"requested provider %q, but this binary was compiled for provider %q",
				providerName,
				compiledProviderName,
			)
		}
	}
	return nil
}

func commandFailure(
	code string,
	exitStatus int,
	stage string,
	cause error,
	remediation string,
) app.RunOutcome {
	return app.RunOutcome{
		Status: app.StatusFailed,
		Error: &app.UserError{
			Code:             code,
			ExitStatus:       exitStatus,
			Stage:            stage,
			Cause:            cause,
			Remediation:      remediation,
			ResourcesChanged: false,
		},
	}
}

type loggedRuntime struct {
	orchestrator      *orchestrator.Orchestrator
	progress          io.Writer
	cleanupPolicy     string
	resourceExpiresAt string
}

func (r *loggedRuntime) SetRunRecorder(recorder *lifecycle.Recorder) {
	r.orchestrator.SetStateRecorder(&manifestStateRecorder{
		recorder:          recorder,
		resourceExpiresAt: r.resourceExpiresAt,
	})
}

func (r *loggedRuntime) Run(ctx context.Context) error {
	previousOutput := log.Writer()
	log.SetOutput(r.progress)
	defer log.SetOutput(previousOutput)
	return r.orchestrator.Run(ctx)
}

func (r *loggedRuntime) RunWithResult(ctx context.Context) lifecycle.ExecutionResult {
	previousOutput := log.Writer()
	log.SetOutput(r.progress)
	defer log.SetOutput(previousOutput)

	outcome := r.orchestrator.RunWithOutcome(ctx)
	result := lifecycle.ExecutionResult{
		ResourcesChanged: outcome.ResourcesChanged,
		Err:              outcome.Err(),
	}
	var expiresAt *time.Time
	if parsed, err := time.Parse(time.RFC3339, r.resourceExpiresAt); err == nil {
		expiresAt = &parsed
	}
	for _, resource := range outcome.Resources {
		result.Resources = append(result.Resources, manifestResource(resource, expiresAt))
	}
	if outcome.BenchmarkErr == nil {
		result.BenchmarkOutcome = runstate.OutcomeSucceeded
	} else {
		result.BenchmarkOutcome = runstate.OutcomeFailed
		result.Failures = append(result.Failures, runstate.Failure{
			Code:    "run-failure",
			Stage:   "run",
			Class:   string(failure.Classify("benchmark", outcome.BenchmarkErr)),
			Message: outcome.BenchmarkErr.Error(),
		})
	}
	switch {
	case r.cleanupPolicy == config.CleanupManual ||
		(r.cleanupPolicy == config.CleanupOnSuccess && outcome.BenchmarkErr != nil):
		result.CleanupOutcome = runstate.OutcomeSkipped
	case outcome.CleanupErr == nil:
		result.CleanupOutcome = runstate.OutcomeSucceeded
	default:
		result.CleanupOutcome = runstate.OutcomeFailed
		result.Failures = append(result.Failures, runstate.Failure{
			Code:    "cleanup-failure",
			Stage:   "cleanup",
			Class:   string(failure.CleanupFailure),
			Message: outcome.CleanupErr.Error(),
		})
	}
	return result
}

type manifestStateRecorder struct {
	recorder          *lifecycle.Recorder
	resourceExpiresAt string
}

func (r *manifestStateRecorder) BeforeExternalStep(stage, workID, message string) error {
	return r.recorder.BeforeExternalStep(stage, workID, message)
}

func (r *manifestStateRecorder) AfterExternalStep(stage, workID, status, message string) error {
	return r.recorder.AfterExternalStep(stage, workID, runstate.WorkStatus(status), message)
}

func (r *manifestStateRecorder) RecordResources(resources ...orchestrator.ResourceRecord) error {
	var expiresAt *time.Time
	if parsed, err := time.Parse(time.RFC3339, r.resourceExpiresAt); err == nil {
		expiresAt = &parsed
	}
	manifestResources := make([]runstate.Resource, 0, len(resources))
	for _, resource := range resources {
		manifestResources = append(manifestResources, manifestResource(resource, expiresAt))
	}
	return r.recorder.RecordResources(manifestResources...)
}

func manifestResource(resource orchestrator.ResourceRecord, expiresAt *time.Time) runstate.Resource {
	return runstate.Resource{
		ID:               resource.ID,
		Kind:             resource.Kind,
		ProviderID:       resource.ProviderID,
		StackName:        resource.StackName,
		Hostname:         resource.Hostname,
		CleanupOwner:     resource.CleanupOwner,
		Status:           runstate.ResourceStatus(resource.Status),
		ExpiresAt:        expiresAt,
		OwnershipCertain: resource.OwnershipCertain,
	}
}

func missingRunPrerequisites(cfg *config.Config) []string {
	var missing []string
	if strings.TrimSpace(cfg.OAuthClientID) == "" {
		missing = append(missing, "OAUTH_CLIENT_ID")
	}
	if strings.TrimSpace(cfg.OAuthClientSecret) == "" {
		missing = append(missing, "OAUTH_CLIENT_SECRET")
	}
	return missing
}

func workloadForProvider(providerName string) string {
	switch providerName {
	case "eks", "aks", "gke":
		return "kubernetes"
	default:
		return "vm"
	}
}

func binaryNameForProvider(providerName string) string {
	switch providerName {
	case "aws":
		return "tailbench-aws"
	case "eks":
		return "tailbench-aws-k8s"
	case "azure":
		return "tailbench-azure"
	case "aks":
		return "tailbench-azure-k8s"
	case "gcp":
		return "tailbench-gcp"
	case "gke":
		return "tailbench-gcp-k8s"
	default:
		return "tailbench"
	}
}

func compiledProviderFactory(name string, cfg *config.Config) (provider.Provider, error) {
	if name != compiledProviderName {
		return nil, fmt.Errorf("requested provider %q, but this binary was compiled for provider %q", name, compiledProviderName)
	}
	return newCompiledProvider(cfg), nil
}
