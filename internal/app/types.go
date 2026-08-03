package app

import "fmt"

const (
	ExitOK           = 0
	ExitRunFailed    = 1
	ExitUsage        = 2
	ExitPrerequisite = 3
	ExitRefused      = 4
	ExitRecovery     = 5
	ExitInterrupted  = 130
)

type Status string

const (
	StatusSucceeded   Status = "succeeded"
	StatusPartial     Status = "partial"
	StatusFailed      Status = "failed"
	StatusInterrupted Status = "interrupted"
)

type ComponentStatus string

const (
	ComponentPending   ComponentStatus = "pending"
	ComponentSucceeded ComponentStatus = "succeeded"
	ComponentSkipped   ComponentStatus = "skipped"
	ComponentFailed    ComponentStatus = "failed"
)

type BuildInfo struct {
	Version string
	Commit  string
	Date    string
}

// UserError is the single user-facing error vocabulary used at the command
// boundary. Cause is retained for errors.Is/errors.As and rendered only after
// bounded redaction.
type UserError struct {
	Code             string
	ExitStatus       int
	Stage            string
	Cause            error
	Remediation      string
	ResourcesChanged bool
	RunID            string
	LogLocation      string
}

func (e *UserError) Error() string {
	if e == nil {
		return ""
	}
	if e.Cause == nil {
		return fmt.Sprintf("%s failed", e.Stage)
	}
	return fmt.Sprintf("%s: %v", e.Stage, e.Cause)
}

func (e *UserError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}

// RunOutcome describes both the requested work and cleanup. Started
// distinguishes usage/preflight errors from runs that need a final report.
type RunOutcome struct {
	Status             Status
	Started            bool
	Stage              string
	Message            string
	ResourcesChanged   bool
	RunID              string
	LogLocation        string
	BenchmarkStatus    ComponentStatus
	CleanupStatus      ComponentStatus
	SelectedProvider   string
	SelectedWorkload   string
	EffectiveLogOutput string
	Report             any
	Error              *UserError
}

func ExitStatus(outcome RunOutcome) int {
	if outcome.Error != nil && outcome.Error.ExitStatus != 0 {
		return outcome.Error.ExitStatus
	}
	switch outcome.Status {
	case StatusSucceeded:
		return ExitOK
	case StatusInterrupted:
		return ExitInterrupted
	case StatusPartial, StatusFailed:
		return ExitRunFailed
	default:
		return ExitRunFailed
	}
}
