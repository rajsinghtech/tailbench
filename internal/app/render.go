package app

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
)

type report struct {
	Status           Status          `json:"status"`
	Stage            string          `json:"stage,omitempty"`
	Message          string          `json:"message,omitempty"`
	Provider         string          `json:"provider,omitempty"`
	Workload         string          `json:"workload,omitempty"`
	ResourcesChanged bool            `json:"resources_changed"`
	Benchmark        ComponentStatus `json:"benchmark,omitempty"`
	Cleanup          ComponentStatus `json:"cleanup,omitempty"`
	RunID            string          `json:"run_id,omitempty"`
	LogLocation      string          `json:"log,omitempty"`
	Failure          *failureReport  `json:"failure,omitempty"`
}

type failureReport struct {
	Code        string `json:"code"`
	ExitStatus  int    `json:"exit_status"`
	Stage       string `json:"stage"`
	Cause       string `json:"cause,omitempty"`
	Remediation string `json:"remediation,omitempty"`
}

func renderReport(dst io.Writer, format string, outcome RunOutcome) error {
	if outcome.Report != nil {
		if format == "json" {
			encoder := json.NewEncoder(dst)
			encoder.SetEscapeHTML(false)
			return encoder.Encode(outcome.Report)
		}
		if text, ok := outcome.Report.(interface {
			WriteText(io.Writer) error
		}); ok {
			return text.WriteText(dst)
		}
		_, err := fmt.Fprintln(dst, outcome.Report)
		return err
	}

	value := newReport(outcome)
	if format == "json" {
		encoder := json.NewEncoder(dst)
		encoder.SetEscapeHTML(false)
		return encoder.Encode(value)
	}

	if _, err := fmt.Fprintf(dst, "status: %s\n", value.Status); err != nil {
		return err
	}
	if value.Stage != "" {
		if _, err := fmt.Fprintf(dst, "stage: %s\n", value.Stage); err != nil {
			return err
		}
	}
	if value.Message != "" {
		if _, err := fmt.Fprintf(dst, "summary: %s\n", value.Message); err != nil {
			return err
		}
	}
	if value.Provider != "" {
		if _, err := fmt.Fprintf(dst, "provider: %s\n", value.Provider); err != nil {
			return err
		}
	}
	if value.Workload != "" {
		if _, err := fmt.Fprintf(dst, "workload: %s\n", value.Workload); err != nil {
			return err
		}
	}
	if _, err := fmt.Fprintf(dst, "resources changed: %s\n", yesNo(value.ResourcesChanged)); err != nil {
		return err
	}
	if value.Benchmark != "" {
		if _, err := fmt.Fprintf(dst, "benchmark: %s\n", value.Benchmark); err != nil {
			return err
		}
	}
	if value.Cleanup != "" {
		if _, err := fmt.Fprintf(dst, "cleanup: %s\n", value.Cleanup); err != nil {
			return err
		}
	}
	if value.RunID != "" {
		if _, err := fmt.Fprintf(dst, "run ID: %s\n", value.RunID); err != nil {
			return err
		}
	}
	if value.LogLocation != "" {
		if _, err := fmt.Fprintf(dst, "log: %s\n", value.LogLocation); err != nil {
			return err
		}
	}
	return nil
}

func newReport(outcome RunOutcome) report {
	value := report{
		Status:           outcome.Status,
		Stage:            outcome.Stage,
		Message:          sanitize(outcome.Message, maxRenderedCauseBytes),
		Provider:         outcome.SelectedProvider,
		Workload:         outcome.SelectedWorkload,
		ResourcesChanged: outcome.ResourcesChanged,
		Benchmark:        outcome.BenchmarkStatus,
		Cleanup:          outcome.CleanupStatus,
		RunID:            outcome.RunID,
		LogLocation:      outcome.LogLocation,
	}
	if outcome.Error != nil {
		if value.Stage == "" {
			value.Stage = outcome.Error.Stage
		}
		if value.RunID == "" {
			value.RunID = outcome.Error.RunID
		}
		if value.LogLocation == "" {
			value.LogLocation = outcome.Error.LogLocation
		}
		value.ResourcesChanged = value.ResourcesChanged || outcome.Error.ResourcesChanged
		value.Failure = &failureReport{
			Code:        outcome.Error.Code,
			ExitStatus:  outcome.Error.ExitStatus,
			Stage:       outcome.Error.Stage,
			Remediation: sanitize(outcome.Error.Remediation, maxRenderedCauseBytes),
		}
		if outcome.Error.Cause != nil {
			value.Failure.Cause = sanitize(outcome.Error.Cause.Error(), maxRenderedCauseBytes)
		}
	}
	return value
}

func diagnosticText(userErr *UserError) string {
	if userErr == nil {
		return ""
	}
	code := userErr.Code
	if code == "" {
		code = "TB_FAILED"
	}
	stage := userErr.Stage
	if stage == "" {
		stage = "unknown"
	}

	var text strings.Builder
	_, _ = fmt.Fprintf(&text, "[%s] stage: %s\n", sanitize(code, 128), sanitize(stage, 128))
	if userErr.Cause != nil {
		_, _ = fmt.Fprintf(&text, "cause: %s\n", sanitize(userErr.Cause.Error(), maxRenderedCauseBytes))
	}
	_, _ = fmt.Fprintf(&text, "resources changed: %s\n", yesNo(userErr.ResourcesChanged))
	if userErr.Remediation != "" {
		_, _ = fmt.Fprintf(&text, "next: %s\n", sanitize(userErr.Remediation, maxRenderedCauseBytes))
	}
	if userErr.RunID != "" {
		_, _ = fmt.Fprintf(&text, "run ID: %s\n", sanitize(userErr.RunID, 256))
	}
	if userErr.LogLocation != "" {
		_, _ = fmt.Fprintf(&text, "log: %s\n", sanitize(userErr.LogLocation, 1024))
	}
	return text.String()
}

func yesNo(value bool) string {
	if value {
		return "yes"
	}
	return "no"
}
