package summary

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/rajsinghtech/tailbench/internal/runstate"
)

func TestStatusReportIncludesIndependentOutcomesAndRecoveryCommands(t *testing.T) {
	manifest := &runstate.Manifest{
		SchemaVersion:    runstate.SchemaVersion,
		RunID:            "tb_2026-07-24_ab12cd",
		Status:           runstate.RunInterrupted,
		Recoverable:      true,
		StartedAt:        time.Date(2026, time.July, 24, 12, 0, 0, 0, time.UTC),
		Binary:           runstate.BinaryInfo{Name: "tailbench-aws", Version: "1.2.3", Commit: "abc123"},
		Provider:         "aws",
		Workload:         "vm",
		Region:           "us-west-2",
		Identity:         runstate.CloudIdentity{Account: "123456789012"},
		PlanHash:         "sha256:plan",
		BenchmarkOutcome: runstate.OutcomeSucceeded,
		CleanupOutcome:   runstate.OutcomeFailed,
		Work: []runstate.WorkItem{
			{ID: "one", Status: runstate.WorkSucceeded},
			{ID: "two", Status: runstate.WorkCleanupPending},
		},
		Resources: []runstate.Resource{
			{ID: "pair", Kind: "vm-pair", Status: runstate.ResourceCreated},
		},
		Failures: []runstate.Failure{
			{Code: "cleanup-failure", Stage: "cleanup", Class: "cleanup-failure", Message: "destroy failed"},
		},
	}

	report := NewStatusReport(manifest)
	if report.BenchmarkOutcome != runstate.OutcomeSucceeded || report.CleanupOutcome != runstate.OutcomeFailed {
		t.Fatalf("outcomes = %#v", report)
	}
	if report.Work.CleanupPending != 1 || report.Work.Succeeded != 1 {
		t.Fatalf("work counts = %#v", report.Work)
	}
	if got, want := report.Commands.Resume, "tailbench-aws resume tb_2026-07-24_ab12cd"; got != want {
		t.Fatalf("resume command = %q, want %q", got, want)
	}

	var text bytes.Buffer
	if err := report.WriteText(&text); err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{
		"TAILBENCH RUN STATUS",
		"status: interrupted",
		"cloud account: 123456789012",
		"benchmark: succeeded",
		"cleanup: failed",
		"cleanup pending: 1",
		"tailbench-aws resume tb_2026-07-24_ab12cd",
		"tailbench-aws cleanup tb_2026-07-24_ab12cd",
	} {
		if !strings.Contains(text.String(), want) {
			t.Fatalf("text = %q, want %q", text.String(), want)
		}
	}
}

func TestResultsReportCarriesReproducibilityMetadataAndResultPaths(t *testing.T) {
	manifest := &runstate.Manifest{
		SchemaVersion: runstate.SchemaVersion,
		RunID:         "tb_2026-07-24_ab12cd",
		Status:        runstate.RunSucceeded,
		Binary: runstate.BinaryInfo{
			Name: "tailbench-aws", Version: "1.2.3", Commit: "abc123", BuildDate: "2026-07-24",
		},
		Provider: "aws",
		Workload: "vm",
		Region:   "us-west-2",
		Zone:     "us-west-2a",
		Identity: runstate.CloudIdentity{Account: "123456789012"},
		PlanHash: "sha256:plan",
		Images: []runstate.ImageInfo{
			{Name: "bench", Value: "example/bench:1", Digest: "sha256:image"},
		},
		Work: []runstate.WorkItem{
			{
				ID:           "c7i.large/l4-kernel",
				InstanceType: "c7i.large",
				Mode:         "l4-kernel",
				Status:       runstate.WorkSucceeded,
				ResultPath:   "aws/c7i/results/c7i.large-l4-kernel.json",
			},
			{ID: "c7i.xlarge/l4-kernel", Status: runstate.WorkPending},
		},
	}

	report := NewResultsReport(manifest)
	if len(report.Results) != 1 || report.Results[0].InstanceType != "c7i.large" {
		t.Fatalf("results = %#v", report.Results)
	}
	data, err := json.Marshal(report)
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{
		`"plan_hash":"sha256:plan"`,
		`"cloud_identity":{"account":"123456789012"}`,
		`"commit":"abc123"`,
		`"digest":"sha256:image"`,
		`"result_path":"aws/c7i/results/c7i.large-l4-kernel.json"`,
	} {
		if !bytes.Contains(data, []byte(want)) {
			t.Fatalf("JSON = %s, want %s", data, want)
		}
	}
}
