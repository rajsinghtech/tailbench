package app

import (
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
)

type Runtime interface {
	Run(context.Context) error
}

type PreparedRun struct {
	Value                any
	MissingPrerequisites []string
}

type RuntimeDependencies struct {
	Provider   string
	Workload   string
	LoadConfig func(args []string) (PreparedRun, error)
	NewRuntime func(value any, progress io.Writer) (Runtime, error)
}

func NewRuntimeExecutor(dependencies RuntimeDependencies) ExecutorFunc {
	return func(ctx context.Context, args []string, progress io.Writer) RunOutcome {
		if dependencies.LoadConfig == nil {
			return internalDependencyFailure("configuration loader")
		}
		if dependencies.NewRuntime == nil {
			return internalDependencyFailure("runtime constructor")
		}

		prepared, err := dependencies.LoadConfig(args)
		if err != nil {
			var userErr *UserError
			if errors.As(err, &userErr) {
				return RunOutcome{
					Status: StatusFailed,
					Error:  userErr,
				}
			}
			return RunOutcome{
				Status: StatusFailed,
				Error: &UserError{
					Code:             "TB_CONFIG",
					ExitStatus:       ExitUsage,
					Stage:            "configuration",
					Cause:            err,
					Remediation:      "fix the named flag or configuration path and retry",
					ResourcesChanged: false,
				},
			}
		}

		missing := normalizedNames(prepared.MissingPrerequisites)
		if len(missing) > 0 {
			return RunOutcome{
				Status: StatusFailed,
				Error: &UserError{
					Code:             "TB_PREREQUISITE",
					ExitStatus:       ExitPrerequisite,
					Stage:            "preflight",
					Cause:            fmt.Errorf("required values are missing: %s", strings.Join(missing, ", ")),
					Remediation:      "set the required values before running: " + strings.Join(missing, ", "),
					ResourcesChanged: false,
				},
			}
		}

		runtime, err := dependencies.NewRuntime(prepared.Value, progress)
		if err != nil {
			return RunOutcome{
				Status: StatusFailed,
				Error: &UserError{
					Code:             "TB_CONFIG",
					ExitStatus:       ExitUsage,
					Stage:            "configuration",
					Cause:            err,
					Remediation:      "correct the provider or workload configuration and retry",
					ResourcesChanged: false,
				},
			}
		}
		if runtime == nil {
			return internalDependencyFailure("runtime")
		}

		err = runtime.Run(ctx)
		if err == nil {
			return RunOutcome{
				Status:           StatusSucceeded,
				Started:          true,
				Stage:            "complete",
				Message:          "requested work completed",
				ResourcesChanged: true,
				BenchmarkStatus:  ComponentSucceeded,
				SelectedProvider: dependencies.Provider,
				SelectedWorkload: dependencies.Workload,
			}
		}

		if errors.Is(err, context.Canceled) {
			return RunOutcome{
				Status:           StatusInterrupted,
				Started:          true,
				Stage:            "run",
				Message:          "run interrupted; inspect local state before continuing",
				ResourcesChanged: true,
				BenchmarkStatus:  ComponentFailed,
				SelectedProvider: dependencies.Provider,
				SelectedWorkload: dependencies.Workload,
				Error: &UserError{
					Code:             "TB_INTERRUPTED",
					ExitStatus:       ExitInterrupted,
					Stage:            "run",
					Cause:            err,
					Remediation:      "inspect recoverable state before resuming or cleaning up",
					ResourcesChanged: true,
				},
			}
		}

		return RunOutcome{
			Status:           StatusFailed,
			Started:          true,
			Stage:            "run",
			Message:          "requested work failed",
			ResourcesChanged: true,
			BenchmarkStatus:  ComponentFailed,
			SelectedProvider: dependencies.Provider,
			SelectedWorkload: dependencies.Workload,
			Error: &UserError{
				Code:             "TB_RUN_FAILED",
				ExitStatus:       ExitRunFailed,
				Stage:            "run",
				Cause:            err,
				Remediation:      "inspect the diagnostic, verify existing resources, and retry",
				ResourcesChanged: true,
			},
		}
	}
}

func internalDependencyFailure(name string) RunOutcome {
	return RunOutcome{
		Status: StatusFailed,
		Error: &UserError{
			Code:             "TB_INTERNAL",
			ExitStatus:       ExitRunFailed,
			Stage:            "startup",
			Cause:            fmt.Errorf("%s is not configured", name),
			Remediation:      "reinstall Tailbench or report this defect",
			ResourcesChanged: false,
		},
	}
}

func normalizedNames(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}
