// Package summary renders dependency-light views of persisted Tailbench runs.
package summary

import (
	"fmt"
	"io"

	"github.com/rajsinghtech/tailbench/internal/runstate"
)

const SchemaVersion = 1

type RecoveryCommands struct {
	Status  string `json:"status"`
	Resume  string `json:"resume"`
	Cleanup string `json:"cleanup"`
}

type WorkCounts struct {
	Pending        int `json:"pending"`
	Running        int `json:"running"`
	Succeeded      int `json:"succeeded"`
	Skipped        int `json:"skipped"`
	Failed         int `json:"failed"`
	CleanupPending int `json:"cleanup_pending"`
	Cleaned        int `json:"cleaned"`
}

type StatusReport struct {
	SchemaVersion    int                    `json:"schema_version"`
	RunID            string                 `json:"run_id"`
	Status           runstate.RunStatus     `json:"status"`
	Recoverable      bool                   `json:"recoverable"`
	Provider         string                 `json:"provider,omitempty"`
	Workload         string                 `json:"workload,omitempty"`
	Region           string                 `json:"region,omitempty"`
	Zone             string                 `json:"zone,omitempty"`
	Identity         runstate.CloudIdentity `json:"cloud_identity,omitempty"`
	PlanHash         string                 `json:"plan_hash,omitempty"`
	BenchmarkOutcome runstate.OutcomeStatus `json:"benchmark_outcome"`
	CleanupOutcome   runstate.OutcomeStatus `json:"cleanup_outcome"`
	Work             WorkCounts             `json:"work"`
	Resources        []runstate.Resource    `json:"resources,omitempty"`
	Failures         []runstate.Failure     `json:"failures,omitempty"`
	Commands         RecoveryCommands       `json:"commands"`
}

func NewStatusReport(manifest *runstate.Manifest) *StatusReport {
	if manifest == nil {
		return &StatusReport{SchemaVersion: SchemaVersion}
	}
	return &StatusReport{
		SchemaVersion:    SchemaVersion,
		RunID:            manifest.RunID,
		Status:           manifest.Status,
		Recoverable:      manifest.Recoverable,
		Provider:         manifest.Provider,
		Workload:         manifest.Workload,
		Region:           manifest.Region,
		Zone:             manifest.Zone,
		Identity:         manifest.Identity,
		PlanHash:         manifest.PlanHash,
		BenchmarkOutcome: manifest.BenchmarkOutcome,
		CleanupOutcome:   manifest.CleanupOutcome,
		Work:             countWork(manifest.Work),
		Resources:        append([]runstate.Resource(nil), manifest.Resources...),
		Failures:         append([]runstate.Failure(nil), manifest.Failures...),
		Commands:         recoveryCommands(manifest),
	}
}

func (r *StatusReport) WriteText(dst io.Writer) error {
	if _, err := fmt.Fprintln(dst, "TAILBENCH RUN STATUS"); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "run ID: %s\n", r.RunID); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "status: %s\n", r.Status); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "provider: %s\n", r.Provider); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "workload: %s\n", r.Workload); err != nil {
		return err
	}
	if err := writeCloudIdentity(dst, r.Identity); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "benchmark: %s\n", r.BenchmarkOutcome); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "cleanup: %s\n", r.CleanupOutcome); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "recoverable: %s\n", yesNo(r.Recoverable)); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(
		dst,
		"work: pending %d, running %d, succeeded %d, skipped %d, failed %d, cleanup pending: %d, cleaned %d\n",
		r.Work.Pending,
		r.Work.Running,
		r.Work.Succeeded,
		r.Work.Skipped,
		r.Work.Failed,
		r.Work.CleanupPending,
		r.Work.Cleaned,
	); err != nil {
		return err
	}
	if len(r.Resources) > 0 {
		if _, err := fmt.Fprintf(dst, "tracked resources: %d\n", len(r.Resources)); err != nil {
			return err
		}
	}
	if len(r.Failures) > 0 {
		if _, err := fmt.Fprintln(dst, "failures:"); err != nil {
			return err
		}
		for _, failure := range r.Failures {
			if _, err := fmt.Fprintf(
				dst,
				"  %s [%s/%s]: %s\n",
				failure.Code,
				failure.Stage,
				failure.Class,
				failure.Message,
			); err != nil {
				return err
			}
		}
	}
	if r.Recoverable {
		if _, err := fmt.Fprintln(dst, "recovery commands:"); err != nil {
			return err
		}
		if _, err := fmt.Fprintf(dst, "  %s\n  %s\n  %s\n", r.Commands.Status, r.Commands.Resume, r.Commands.Cleanup); err != nil {
			return err
		}
	}
	return nil
}

type ResultEntry struct {
	WorkID       string              `json:"work_id"`
	Family       string              `json:"family,omitempty"`
	InstanceType string              `json:"instance_type,omitempty"`
	Mode         string              `json:"mode,omitempty"`
	Status       runstate.WorkStatus `json:"status"`
	ResultPath   string              `json:"result_path"`
}

type ResultsReport struct {
	SchemaVersion int                    `json:"schema_version"`
	RunID         string                 `json:"run_id"`
	Status        runstate.RunStatus     `json:"status"`
	Provider      string                 `json:"provider,omitempty"`
	Workload      string                 `json:"workload,omitempty"`
	Region        string                 `json:"region,omitempty"`
	Zone          string                 `json:"zone,omitempty"`
	Identity      runstate.CloudIdentity `json:"cloud_identity,omitempty"`
	PlanHash      string                 `json:"plan_hash,omitempty"`
	Binary        runstate.BinaryInfo    `json:"binary"`
	Images        []runstate.ImageInfo   `json:"images,omitempty"`
	Results       []ResultEntry          `json:"results"`
}

func NewResultsReport(manifest *runstate.Manifest) *ResultsReport {
	report := &ResultsReport{
		SchemaVersion: SchemaVersion,
		Results:       []ResultEntry{},
	}
	if manifest == nil {
		return report
	}
	report.RunID = manifest.RunID
	report.Status = manifest.Status
	report.Provider = manifest.Provider
	report.Workload = manifest.Workload
	report.Region = manifest.Region
	report.Zone = manifest.Zone
	report.Identity = manifest.Identity
	report.PlanHash = manifest.PlanHash
	report.Binary = manifest.Binary
	report.Images = append([]runstate.ImageInfo(nil), manifest.Images...)
	for _, work := range manifest.Work {
		if work.ResultPath == "" {
			continue
		}
		report.Results = append(report.Results, ResultEntry{
			WorkID:       work.ID,
			Family:       work.Family,
			InstanceType: work.InstanceType,
			Mode:         work.Mode,
			Status:       work.Status,
			ResultPath:   work.ResultPath,
		})
	}
	return report
}

func (r *ResultsReport) WriteText(dst io.Writer) error {
	if _, err := fmt.Fprintln(dst, "TAILBENCH RESULTS"); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "run ID: %s\n", r.RunID); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "status: %s\n", r.Status); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "provider: %s\n", r.Provider); err != nil {
		return err
	}
	if err := writeCloudIdentity(dst, r.Identity); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "binary: %s %s\n", r.Binary.Name, r.Binary.Version); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "commit: %s\n", r.Binary.Commit); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "plan hash: %s\n", r.PlanHash); err != nil {
		return err
	}
	if len(r.Results) == 0 {
		_, err := fmt.Fprintln(dst, "results: none")
		return err
	}
	if _, err := fmt.Fprintln(dst, "results:"); err != nil {
		return err
	}
	for _, result := range r.Results {
		if _, err := fmt.Fprintf(
			dst,
			"  %s %s [%s]: %s\n",
			result.InstanceType,
			result.Mode,
			result.Status,
			result.ResultPath,
		); err != nil {
			return err
		}
	}
	return nil
}

func writeCloudIdentity(dst io.Writer, identity runstate.CloudIdentity) error {
	for _, field := range []struct {
		label string
		value string
	}{
		{label: "cloud account", value: identity.Account},
		{label: "cloud project", value: identity.Project},
		{label: "cloud subscription", value: identity.Subscription},
	} {
		if field.value == "" {
			continue
		}
		if _, err := fmt.Fprintf(dst, "%s: %s\n", field.label, field.value); err != nil {
			return err
		}
	}
	return nil
}

func countWork(items []runstate.WorkItem) WorkCounts {
	var counts WorkCounts
	for _, item := range items {
		switch item.Status {
		case runstate.WorkPending:
			counts.Pending++
		case runstate.WorkRunning:
			counts.Running++
		case runstate.WorkSucceeded:
			counts.Succeeded++
		case runstate.WorkSkipped:
			counts.Skipped++
		case runstate.WorkFailed:
			counts.Failed++
		case runstate.WorkCleanupPending:
			counts.CleanupPending++
		case runstate.WorkCleaned:
			counts.Cleaned++
		}
	}
	return counts
}

func recoveryCommands(manifest *runstate.Manifest) RecoveryCommands {
	binary := manifest.Binary.Name
	if binary == "" {
		binary = "tailbench-" + manifest.Provider
	}
	return RecoveryCommands{
		Status:  fmt.Sprintf("%s status %s", binary, manifest.RunID),
		Resume:  fmt.Sprintf("%s resume %s", binary, manifest.RunID),
		Cleanup: fmt.Sprintf("%s cleanup %s", binary, manifest.RunID),
	}
}

func yesNo(value bool) string {
	if value {
		return "yes"
	}
	return "no"
}
