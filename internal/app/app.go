package app

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
)

type ExecutorFunc func(ctx context.Context, args []string, progress io.Writer) RunOutcome

// CommandSelector may route the default/run command after front-matter flags
// and explicit read-only subcommands have been handled. It exists so legacy
// configuration such as dry_run: true can select a safe command before any
// execution-only configuration or secrets are loaded.
type CommandSelector func(args []string) (command string, userErr *UserError)

type Application struct {
	Name          string
	Provider      string
	Build         BuildInfo
	Execute       ExecutorFunc
	Commands      map[string]ExecutorFunc
	SelectCommand CommandSelector
}

type frontOptions struct {
	outputFormat string
	logFile      string
	quiet        bool
}

func (a Application) Run(ctx context.Context, args []string, stdout, stderr io.Writer) int {
	if stdout == nil {
		stdout = io.Discard
	}
	if stderr == nil {
		stderr = io.Discard
	}

	if hasArg(args, "-h", "--help") {
		a.renderHelp(stdout)
		return ExitOK
	}
	if hasArg(args, "--version") {
		a.renderVersion(stdout)
		return ExitOK
	}

	options, executeArgs, userErr := parseFrontOptions(args)
	if userErr != nil {
		_, _ = io.WriteString(stderr, diagnosticText(userErr))
		return userErr.ExitStatus
	}
	execute, executeArgs, userErr := a.resolveExecutor(executeArgs)
	if userErr != nil {
		_, _ = io.WriteString(stderr, diagnosticText(userErr))
		return userErr.ExitStatus
	}

	var logFile *os.File
	if options.logFile != "" {
		var err error
		logFile, err = os.OpenFile(options.logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
		if err != nil {
			userErr = &UserError{
				Code:             "TB_LOG_FILE",
				ExitStatus:       ExitUsage,
				Stage:            "output",
				Cause:            fmt.Errorf("open log file %q: %w", options.logFile, err),
				Remediation:      "choose a writable --log-file path",
				ResourcesChanged: false,
			}
			_, _ = io.WriteString(stderr, diagnosticText(userErr))
			return userErr.ExitStatus
		}
		defer func() { _ = logFile.Close() }()
	}

	progress := progressWriter(stderr, logFile, options.quiet)
	outcome := a.executeWith(execute, ctx, executeArgs, progress)
	attachLogLocation(&outcome, options.logFile)
	normalizeOutcome(ctx, &outcome)

	if outcome.Report != nil || outcome.Started || outcome.Status == StatusSucceeded {
		if err := renderReport(stdout, options.outputFormat, outcome); err != nil {
			outputErr := &UserError{
				Code:             "TB_OUTPUT",
				ExitStatus:       ExitRunFailed,
				Stage:            "output",
				Cause:            fmt.Errorf("write final report: %w", err),
				Remediation:      "verify the output destination and rerun the report",
				ResourcesChanged: outcome.ResourcesChanged,
				RunID:            outcome.RunID,
				LogLocation:      outcome.LogLocation,
			}
			writeDiagnostic(stderr, logFile, outputErr)
			return outputErr.ExitStatus
		}
	}

	if outcome.Error != nil {
		writeDiagnostic(stderr, logFile, outcome.Error)
	}
	return ExitStatus(outcome)
}

func (a Application) execute(ctx context.Context, args []string, progress io.Writer) RunOutcome {
	return a.executeWith(a.Execute, ctx, args, progress)
}

func (a Application) executeWith(execute ExecutorFunc, ctx context.Context, args []string, progress io.Writer) RunOutcome {
	if execute == nil {
		return RunOutcome{
			Status: StatusFailed,
			Error: &UserError{
				Code:             "TB_INTERNAL",
				ExitStatus:       ExitRunFailed,
				Stage:            "startup",
				Cause:            errors.New("application executor is not configured"),
				Remediation:      "reinstall Tailbench or report this defect",
				ResourcesChanged: false,
			},
		}
	}
	return execute(ctx, args, progress)
}

func (a Application) renderHelp(dst io.Writer) {
	name := a.Name
	if name == "" {
		name = "tailbench"
	}
	provider := a.Provider
	if provider == "" {
		provider = "unknown"
	}
	_, _ = fmt.Fprintf(dst, `Usage: %s [flags]
       %s <command> [flags]

Compiled provider: %s

Commands:
  init                   Create safe configuration and secret templates
  run                    Execute the configured benchmark (default)
  plan                   Build a side-effect-free local plan
  doctor                 Check local prerequisites; --remote is explicit
  status RUN_ID          Read persisted run and recovery state
  results RUN_ID         Render persisted result metadata and paths
  resume RUN_ID          Continue only unfinished work from a run
  cleanup RUN_ID         Destroy resources owned by a named run

Recovery options:
  cleanup RUN_ID --recover-pulumi-locks
                         Remove only locks for stacks recorded by the named run

Command output:
  --help, -h             Show help without loading configuration
  --version              Show version without loading configuration
  --output text|json     Select the primary report format (default text)
  --log-file PATH        Write redacted progress diagnostics to PATH
  --quiet                Suppress progress; fatal diagnostics remain visible

Run selection:
  --config PATH          Configuration file (default config.yaml)
  --provider NAME        Provider override; must match this binary
  --family NAME          Instance family override
  --filter REGEX         Instance-type filter
  --dry-run              Compatibility preview flag
  --cleanup-networking   Tear down provider networking after the run
  --max-cost-usd USD     Set the required automation cost ceiling
  --max-duration DURATION
                          Bound total execution time (default 45m)
  --max-instance-types N Bound instance types with pending work (default 1)
  --max-concurrent-resources N
                          Bound concurrent benchmark topologies (default 1)
  --cleanup-policy MODE  Use always, on-success, or manual
  --yes                  Approve a bounded noninteractive run
`, name, name, provider)
}

func (a Application) renderVersion(dst io.Writer) {
	name := a.Name
	if name == "" {
		name = "tailbench"
	}
	_, _ = fmt.Fprintf(
		dst,
		"%s %s (commit %s, built %s)\n",
		name,
		valueOr(a.Build.Version, "dev"),
		valueOr(a.Build.Commit, "unknown"),
		valueOr(a.Build.Date, "unknown"),
	)
}

func parseFrontOptions(args []string) (frontOptions, []string, *UserError) {
	options := frontOptions{outputFormat: "text"}
	executeArgs := make([]string, 0, len(args))

	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch {
		case arg == "--":
			executeArgs = append(executeArgs, args[index:]...)
			return options, executeArgs, nil
		case arg == "--quiet":
			options.quiet = true
		case arg == "--output":
			if index+1 >= len(args) {
				return frontOptions{}, nil, argumentError(
					"--output requires text or json",
					"use --output text or --output json",
				)
			}
			index++
			options.outputFormat = args[index]
		case strings.HasPrefix(arg, "--output="):
			options.outputFormat = strings.TrimPrefix(arg, "--output=")
		case arg == "--log-file":
			if index+1 >= len(args) {
				return frontOptions{}, nil, argumentError(
					"--log-file requires a path",
					"pass a non-empty writable path with --log-file PATH",
				)
			}
			index++
			options.logFile = args[index]
		case strings.HasPrefix(arg, "--log-file="):
			options.logFile = strings.TrimPrefix(arg, "--log-file=")
		default:
			executeArgs = append(executeArgs, arg)
		}
	}

	if options.outputFormat != "text" && options.outputFormat != "json" {
		return frontOptions{}, nil, argumentError(
			fmt.Sprintf("invalid --output value %q", options.outputFormat),
			"use --output text or --output json",
		)
	}
	if options.logFile == "" && hasLogFileFlag(args) {
		return frontOptions{}, nil, argumentError(
			"--log-file requires a non-empty path",
			"pass a non-empty writable path with --log-file PATH",
		)
	}
	return options, executeArgs, nil
}

func (a Application) resolveExecutor(args []string) (ExecutorFunc, []string, *UserError) {
	if len(args) > 0 && !strings.HasPrefix(args[0], "-") {
		command := args[0]
		if command == "run" {
			return a.resolveDefaultExecutor(args[1:])
		}
		if execute, ok := a.Commands[command]; ok {
			return execute, args[1:], nil
		}
		if len(a.Commands) > 0 {
			return nil, nil, &UserError{
				Code:             "TB_USAGE",
				ExitStatus:       ExitUsage,
				Stage:            "command",
				Cause:            fmt.Errorf("unknown command %q", command),
				Remediation:      "run --help to list supported commands",
				ResourcesChanged: false,
			}
		}
	}
	if hasArg(args, "--dry-run") {
		if execute, ok := a.Commands["plan"]; ok {
			return execute, args, nil
		}
	}
	return a.resolveDefaultExecutor(args)
}

func (a Application) resolveDefaultExecutor(args []string) (ExecutorFunc, []string, *UserError) {
	if a.SelectCommand != nil {
		command, userErr := a.SelectCommand(args)
		if userErr != nil {
			return nil, nil, userErr
		}
		if command != "" {
			execute, ok := a.Commands[command]
			if !ok {
				return nil, nil, &UserError{
					Code:             "TB_INTERNAL",
					ExitStatus:       ExitRunFailed,
					Stage:            "command",
					Cause:            fmt.Errorf("selected command %q is not configured", command),
					Remediation:      "reinstall Tailbench or report this defect",
					ResourcesChanged: false,
				}
			}
			return execute, args, nil
		}
	}
	return a.Execute, args, nil
}

func argumentError(cause, remediation string) *UserError {
	return &UserError{
		Code:             "TB_USAGE",
		ExitStatus:       ExitUsage,
		Stage:            "arguments",
		Cause:            errors.New(cause),
		Remediation:      remediation,
		ResourcesChanged: false,
	}
}

func progressWriter(stderr io.Writer, logFile *os.File, quiet bool) io.Writer {
	progressWriters := make([]io.Writer, 0, 2)
	if !quiet {
		progressWriters = append(progressWriters, redactingWriter{dst: stderr})
	}
	if logFile != nil {
		progressWriters = append(progressWriters, redactingWriter{dst: logFile})
	}
	requiredWriters := []io.Writer{redactingWriter{dst: stderr}}
	if logFile != nil {
		requiredWriters = append(requiredWriters, redactingWriter{dst: logFile})
	}
	return commandOutput{
		progress: combineWriters(progressWriters),
		required: combineWriters(requiredWriters),
	}
}

type commandOutput struct {
	progress io.Writer
	required io.Writer
}

func (w commandOutput) Write(p []byte) (int, error) {
	return w.progress.Write(p)
}

func (w commandOutput) RequiredWriter() io.Writer {
	return w.required
}

// RequiredWriter returns the non-suppressible channel for safety prompts and
// other messages that must remain visible under --quiet.
func RequiredWriter(writer io.Writer) io.Writer {
	if required, ok := writer.(interface{ RequiredWriter() io.Writer }); ok {
		return required.RequiredWriter()
	}
	return writer
}

func combineWriters(writers []io.Writer) io.Writer {
	switch len(writers) {
	case 0:
		return io.Discard
	case 1:
		return writers[0]
	default:
		return io.MultiWriter(writers...)
	}
}

func writeDiagnostic(stderr io.Writer, logFile *os.File, userErr *UserError) {
	text := diagnosticText(userErr)
	_, _ = io.WriteString(stderr, text)
	if logFile != nil {
		_, _ = io.WriteString(redactingWriter{dst: logFile}, text)
	}
}

func normalizeOutcome(ctx context.Context, outcome *RunOutcome) {
	if outcome.Status == "" {
		if outcome.Error == nil {
			outcome.Status = StatusFailed
			outcome.Error = &UserError{
				Code:             "TB_INTERNAL",
				ExitStatus:       ExitRunFailed,
				Stage:            "complete",
				Cause:            errors.New("executor returned no outcome status"),
				Remediation:      "report this defect",
				ResourcesChanged: outcome.ResourcesChanged,
			}
		} else {
			outcome.Status = StatusFailed
		}
	}
	if outcome.Error != nil {
		if outcome.Stage == "" {
			outcome.Stage = outcome.Error.Stage
		}
		outcome.ResourcesChanged = outcome.ResourcesChanged || outcome.Error.ResourcesChanged
	}
	if outcome.Status == StatusInterrupted && outcome.Error == nil {
		outcome.Error = &UserError{
			Code:             "TB_INTERRUPTED",
			ExitStatus:       ExitInterrupted,
			Stage:            valueOr(outcome.Stage, "interrupted"),
			Cause:            context.Canceled,
			Remediation:      "inspect run status before resuming or cleaning up",
			ResourcesChanged: outcome.ResourcesChanged,
			RunID:            outcome.RunID,
			LogLocation:      outcome.LogLocation,
		}
	}
	if ctx.Err() != nil && outcome.Error != nil && errors.Is(outcome.Error, context.Canceled) {
		outcome.Status = StatusInterrupted
		outcome.Error.ExitStatus = ExitInterrupted
	}
}

func attachLogLocation(outcome *RunOutcome, path string) {
	if path == "" {
		return
	}
	if outcome.LogLocation == "" {
		outcome.LogLocation = path
	}
	if outcome.Error != nil && outcome.Error.LogLocation == "" {
		outcome.Error.LogLocation = path
	}
}

func hasArg(args []string, names ...string) bool {
	for _, arg := range args {
		for _, name := range names {
			if arg == name {
				return true
			}
		}
	}
	return false
}

func hasLogFileFlag(args []string) bool {
	for _, arg := range args {
		if arg == "--log-file" || strings.HasPrefix(arg, "--log-file=") {
			return true
		}
	}
	return false
}

func valueOr(value, fallback string) string {
	if value != "" {
		return value
	}
	return fallback
}
