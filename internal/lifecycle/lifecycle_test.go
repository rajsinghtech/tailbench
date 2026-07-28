package lifecycle

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/rajsinghtech/tailbench/internal/plan"
	"github.com/rajsinghtech/tailbench/internal/runstate"
)

func TestManagerPersistsManifestBeforeExternalWorkAndFinalizesSuccess(t *testing.T) {
	store := runstate.NewStore(filepath.Join(t.TempDir(), ".tailbench", "runs"))
	now := time.Date(2026, time.July, 24, 12, 0, 0, 0, time.UTC)
	manager := Manager{
		Store:    store,
		Now:      func() time.Time { return now },
		NewRunID: func() (string, error) { return "tb_2026-07-24_ab12cd", nil },
	}
	localPlan := testPlan()
	var sawRunningState bool

	outcome, err := manager.Run(context.Background(), Request{
		CommandLine: []string{"tailbench-aws", "run", "--family", "c7i"},
		Binary: runstate.BinaryInfo{
			Name: "tailbench-aws", Version: "1.2.3", Commit: "abc123",
		},
		Identity:            runstate.CloudIdentity{Account: "123456789012"},
		Plan:                localPlan,
		EffectiveConfigYAML: []byte("provider: aws\nsecret: REDACTED\n"),
		Execute: func(_ context.Context, recorder *Recorder) ExecutionResult {
			if err := recorder.BeforeExternalStep(
				"provision",
				"c7i.large/l4-kernel",
				"create pair",
			); err != nil {
				t.Fatalf("BeforeExternalStep: %v", err)
			}
			persisted, err := store.Load(recorder.RunID())
			if err != nil {
				t.Fatalf("manifest was not readable before external work: %v", err)
			}
			sawRunningState = persisted.Status == runstate.RunRunning &&
				persisted.Work[0].Status == runstate.WorkRunning
			if err := recorder.AfterExternalStep(
				"provision",
				"c7i.large/l4-kernel",
				runstate.WorkSucceeded,
				"pair created",
			); err != nil {
				t.Fatalf("AfterExternalStep: %v", err)
			}
			return ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeSucceeded,
				CleanupOutcome:   runstate.OutcomeSucceeded,
				ResourcesChanged: true,
			}
		},
	})
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
	if !sawRunningState {
		t.Fatal("external work did not observe a persisted running manifest/work item")
	}
	if outcome.ExecutionError != nil {
		t.Fatalf("execution error = %v", outcome.ExecutionError)
	}
	if outcome.Manifest.Status != runstate.RunSucceeded ||
		outcome.Manifest.BenchmarkOutcome != runstate.OutcomeSucceeded ||
		outcome.Manifest.CleanupOutcome != runstate.OutcomeSucceeded ||
		outcome.Manifest.Recoverable {
		t.Fatalf("final manifest = %#v", outcome.Manifest)
	}
	if !strings.HasPrefix(outcome.Manifest.PlanHash, "sha256:") {
		t.Fatalf("plan hash = %q, want sha256", outcome.Manifest.PlanHash)
	}
	if outcome.Manifest.Identity.Account != "123456789012" {
		t.Fatalf("manifest identity = %#v", outcome.Manifest.Identity)
	}

	runDir := filepath.Join(store.Root(), outcome.Manifest.RunID)
	summaryData, err := os.ReadFile(filepath.Join(runDir, "summary.json"))
	if err != nil {
		t.Fatalf("read summary: %v", err)
	}
	var summary FinalSummary
	if err := json.Unmarshal(summaryData, &summary); err != nil {
		t.Fatalf("decode summary: %v", err)
	}
	if summary.RunID != outcome.Manifest.RunID ||
		summary.BenchmarkOutcome != runstate.OutcomeSucceeded ||
		summary.CleanupOutcome != runstate.OutcomeSucceeded {
		t.Fatalf("summary = %#v", summary)
	}
}

func TestRecorderPersistsAndUpsertsResourcesBeforeExecutionReturns(t *testing.T) {
	store := runstate.NewStore(filepath.Join(t.TempDir(), ".tailbench", "runs"))
	manager := fixedManager(store, "tb_2026-07-24_d0ab1e")
	createdAt := time.Date(2026, time.July, 24, 11, 59, 0, 0, time.UTC)

	outcome, err := manager.Run(context.Background(), Request{
		Plan: testPlan(),
		Execute: func(_ context.Context, recorder *Recorder) ExecutionResult {
			resource := runstate.Resource{
				ID:               "aws/c7i.large/topology",
				Kind:             "vm-pair",
				CleanupOwner:     recorder.RunID(),
				Status:           runstate.ResourceCreating,
				CreatedAt:        &createdAt,
				OwnershipCertain: true,
			}
			if err := recorder.RecordResources(resource); err != nil {
				t.Fatalf("RecordResources creating: %v", err)
			}

			resource.Status = runstate.ResourceCreated
			resource.StackName = "tailbench-aws-c7i-large-d0ab1e"
			if err := recorder.RecordResources(resource); err != nil {
				t.Fatalf("RecordResources created: %v", err)
			}

			persisted, err := store.Load(recorder.RunID())
			if err != nil {
				t.Fatalf("load manifest during execution: %v", err)
			}
			if !persisted.ResourcesChanged || len(persisted.Resources) != 1 {
				t.Fatalf("durable resources = %#v", persisted.Resources)
			}
			got := persisted.Resources[0]
			if got.Status != runstate.ResourceCreated ||
				got.StackName != resource.StackName ||
				got.CleanupOwner != recorder.RunID() ||
				got.CreatedAt == nil ||
				!got.CreatedAt.Equal(createdAt) {
				t.Fatalf("durable resource = %#v", got)
			}

			// Simulate an abrupt executor whose final in-memory inventory lacks
			// the timestamps already written at the external-step boundary.
			return ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeFailed,
				CleanupOutcome:   runstate.OutcomePending,
				ResourcesChanged: false,
				Resources: []runstate.Resource{
					{
						ID:               resource.ID,
						Kind:             resource.Kind,
						StackName:        resource.StackName,
						CleanupOwner:     resource.CleanupOwner,
						Status:           resource.Status,
						OwnershipCertain: resource.OwnershipCertain,
					},
				},
				Err: context.Canceled,
			}
		},
	})
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
	if len(outcome.Manifest.Resources) != 1 ||
		outcome.Manifest.Resources[0].StackName != "tailbench-aws-c7i-large-d0ab1e" ||
		outcome.Manifest.Resources[0].CreatedAt == nil ||
		!outcome.Manifest.Resources[0].CreatedAt.Equal(createdAt) {
		t.Fatalf("final resources = %#v", outcome.Manifest.Resources)
	}
	if !outcome.Manifest.ResourcesChanged {
		t.Fatal("finalization erased the durable resources-changed state")
	}
}

func TestRecorderRejectsResourceOwnedByAnotherRun(t *testing.T) {
	store := runstate.NewStore(filepath.Join(t.TempDir(), ".tailbench", "runs"))
	manager := fixedManager(store, "tb_2026-07-24_0a11ce")

	_, err := manager.Run(context.Background(), Request{
		Plan: testPlan(),
		Execute: func(_ context.Context, recorder *Recorder) ExecutionResult {
			recordErr := recorder.RecordResources(runstate.Resource{
				ID:           "aws/networking",
				Kind:         "networking",
				CleanupOwner: "tb_2026-07-24_someone-else",
				Status:       runstate.ResourceCreated,
			})
			if recordErr == nil || !strings.Contains(recordErr.Error(), "cleanup owner") {
				t.Fatalf("RecordResources error = %v, want ownership rejection", recordErr)
			}
			return ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeFailed,
				CleanupOutcome:   runstate.OutcomeSkipped,
				Err:              recordErr,
			}
		},
	})
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
}

func TestRecorderPersistsPerWorkFailureDetailForResume(t *testing.T) {
	store := runstate.NewStore(filepath.Join(t.TempDir(), ".tailbench", "runs"))
	manager := fixedManager(store, "tb_2026-07-24_fa11ed")

	outcome, err := manager.Run(context.Background(), Request{
		Plan: testPlan(),
		Execute: func(_ context.Context, recorder *Recorder) ExecutionResult {
			workID := "c7i.large/l4-kernel"
			if err := recorder.BeforeExternalStep("benchmark", workID, "run benchmark"); err != nil {
				t.Fatal(err)
			}
			if err := recorder.AfterExternalStep(
				"benchmark",
				workID,
				runstate.WorkFailed,
				"transport connection refused",
			); err != nil {
				t.Fatal(err)
			}
			return ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeFailed,
				CleanupOutcome:   runstate.OutcomeSkipped,
				Err:              errors.New("benchmark failed"),
			}
		},
	})
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
	if got := outcome.Manifest.Work[0]; got.Status != runstate.WorkFailed ||
		got.LastError != "transport connection refused" ||
		got.EndedAt == nil {
		t.Fatalf("failed work item = %#v", got)
	}
}

func TestManagerReportsCleanupFailureIndependentlyAndLeavesRecoveryState(t *testing.T) {
	store := runstate.NewStore(filepath.Join(t.TempDir(), "runs"))
	manager := fixedManager(store, "tb_2026-07-24_123abc")
	cleanupErr := errors.New("destroy pair: permission denied")

	outcome, err := manager.Run(context.Background(), Request{
		Plan: testPlan(),
		Execute: func(context.Context, *Recorder) ExecutionResult {
			return ExecutionResult{
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
		},
	})
	if err != nil {
		t.Fatalf("Run state error: %v", err)
	}
	if !errors.Is(outcome.ExecutionError, cleanupErr) {
		t.Fatalf("execution error = %v, want cleanup error", outcome.ExecutionError)
	}
	if outcome.Manifest.Status != runstate.RunPartial ||
		!outcome.Manifest.Recoverable ||
		outcome.Manifest.BenchmarkOutcome != runstate.OutcomeSucceeded ||
		outcome.Manifest.CleanupOutcome != runstate.OutcomeFailed {
		t.Fatalf("final manifest = %#v", outcome.Manifest)
	}
	if len(outcome.Manifest.Failures) != 1 || outcome.Manifest.Failures[0].Class != "cleanup-failure" {
		t.Fatalf("failures = %#v", outcome.Manifest.Failures)
	}
}

func TestManagerRecordsInterruptionAndKeepsUnfinishedWorkPending(t *testing.T) {
	store := runstate.NewStore(filepath.Join(t.TempDir(), "runs"))
	manager := fixedManager(store, "tb_2026-07-24_654def")

	outcome, err := manager.Run(context.Background(), Request{
		Plan: testPlan(),
		Execute: func(_ context.Context, recorder *Recorder) ExecutionResult {
			if err := recorder.BeforeExternalStep(
				"benchmark",
				"c7i.large/l4-kernel",
				"run benchmark",
			); err != nil {
				t.Fatal(err)
			}
			return ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeFailed,
				CleanupOutcome:   runstate.OutcomePending,
				ResourcesChanged: true,
				Err:              context.Canceled,
			}
		},
	})
	if err != nil {
		t.Fatalf("Run state error: %v", err)
	}
	if !errors.Is(outcome.ExecutionError, context.Canceled) {
		t.Fatalf("execution error = %v, want canceled", outcome.ExecutionError)
	}
	if outcome.Manifest.Status != runstate.RunInterrupted || !outcome.Manifest.Recoverable {
		t.Fatalf("final manifest = %#v", outcome.Manifest)
	}
	if got := outcome.Manifest.Work[0].Status; got != runstate.WorkFailed {
		t.Fatalf("interrupted running work status = %q, want failed", got)
	}
	if got := outcome.Manifest.Work[1].Status; got != runstate.WorkPending {
		t.Fatalf("unfinished work status = %q, want pending", got)
	}
}

func TestManagerResumeUsesSameRunAndOnlyUnfinishedWork(t *testing.T) {
	store := runstate.NewStore(filepath.Join(t.TempDir(), "runs"))
	manager := fixedManager(store, "tb_2026-07-24_fedcba")
	initial, err := manager.Run(context.Background(), Request{
		Plan: testPlan(),
		Execute: func(_ context.Context, recorder *Recorder) ExecutionResult {
			if err := recorder.BeforeExternalStep(
				"benchmark",
				"c7i.large/l4-kernel",
				"run benchmark",
			); err != nil {
				t.Fatal(err)
			}
			if err := recorder.AfterExternalStep(
				"benchmark",
				"c7i.large/l4-kernel",
				runstate.WorkSucceeded,
				"result written",
			); err != nil {
				t.Fatal(err)
			}
			return ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeFailed,
				CleanupOutcome:   runstate.OutcomePending,
				ResourcesChanged: true,
				Err:              context.Canceled,
			}
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	var selected []runstate.WorkItem
	resumed, err := manager.Resume(
		context.Background(),
		initial.Manifest.RunID,
		func(_ context.Context, recorder *Recorder, unfinished []runstate.WorkItem) ExecutionResult {
			selected = append(selected, unfinished...)
			persisted, err := store.Load(recorder.RunID())
			if err != nil {
				t.Fatal(err)
			}
			if persisted.Status != runstate.RunRunning || persisted.EndedAt != nil {
				t.Fatalf("resume did not persist running boundary: %#v", persisted)
			}
			return ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeSucceeded,
				CleanupOutcome:   runstate.OutcomeSucceeded,
				ResourcesChanged: true,
			}
		},
	)
	if err != nil {
		t.Fatalf("Resume: %v", err)
	}
	if resumed.Manifest.RunID != initial.Manifest.RunID {
		t.Fatalf("resumed run ID = %q, want %q", resumed.Manifest.RunID, initial.Manifest.RunID)
	}
	if len(selected) != 1 || selected[0].ID != "c7i.xlarge/l4-kernel" {
		t.Fatalf("selected unfinished work = %#v", selected)
	}
	if resumed.Manifest.Status != runstate.RunSucceeded || resumed.Manifest.Recoverable {
		t.Fatalf("resumed manifest = %#v", resumed.Manifest)
	}
}

func TestManagerResumeRejectsCompletedRunWithoutMutation(t *testing.T) {
	store := runstate.NewStore(filepath.Join(t.TempDir(), "runs"))
	manager := fixedManager(store, "tb_2026-07-24_abcdef")
	initial, err := manager.Run(context.Background(), Request{
		Plan: testPlan(),
		Execute: func(context.Context, *Recorder) ExecutionResult {
			return ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeSucceeded,
				CleanupOutcome:   runstate.OutcomeSucceeded,
			}
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	manifestPath := filepath.Join(store.Root(), initial.Manifest.RunID, "manifest.json")
	before, err := os.ReadFile(manifestPath)
	if err != nil {
		t.Fatal(err)
	}

	_, err = manager.Resume(
		context.Background(),
		initial.Manifest.RunID,
		func(context.Context, *Recorder, []runstate.WorkItem) ExecutionResult {
			t.Fatal("execute called for completed run")
			return ExecutionResult{}
		},
	)
	if !errors.Is(err, ErrNotRecoverable) {
		t.Fatalf("Resume error = %v, want ErrNotRecoverable", err)
	}
	after, err := os.ReadFile(manifestPath)
	if err != nil {
		t.Fatal(err)
	}
	if string(after) != string(before) {
		t.Fatal("rejected resume mutated manifest")
	}
}

func TestManagerCleanupPersistsBoundaryAndMarksRunCleaned(t *testing.T) {
	store := runstate.NewStore(filepath.Join(t.TempDir(), "runs"))
	manager := fixedManager(store, "tb_2026-07-24_aabbcc")
	initial, err := manager.Run(context.Background(), Request{
		Plan: testPlan(),
		Execute: func(context.Context, *Recorder) ExecutionResult {
			return ExecutionResult{
				BenchmarkOutcome: runstate.OutcomeFailed,
				CleanupOutcome:   runstate.OutcomePending,
				ResourcesChanged: true,
				Resources: []runstate.Resource{
					{
						ID:               "aws/c7i.large/pair",
						Kind:             "vm-pair",
						Status:           runstate.ResourceCreated,
						CleanupOwner:     "tb_2026-07-24_aabbcc",
						OwnershipCertain: true,
					},
				},
				Err: context.Canceled,
			}
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	originalBenchmark := initial.Manifest.BenchmarkOutcome

	cleaned, err := manager.Cleanup(
		context.Background(),
		initial.Manifest.RunID,
		func(_ context.Context, recorder *Recorder, resources []runstate.Resource) ExecutionResult {
			if len(resources) != 1 || resources[0].ID != "aws/c7i.large/pair" {
				t.Fatalf("cleanup resources = %#v", resources)
			}
			persisted, err := store.Load(recorder.RunID())
			if err != nil {
				t.Fatal(err)
			}
			if persisted.CleanupOutcome != runstate.OutcomePending ||
				persisted.Resources[0].Status != runstate.ResourceCleaning {
				t.Fatalf("cleanup boundary was not durable: %#v", persisted)
			}
			return ExecutionResult{
				CleanupOutcome:   runstate.OutcomeSucceeded,
				ResourcesChanged: true,
			}
		},
	)
	if err != nil {
		t.Fatalf("Cleanup: %v", err)
	}
	if cleaned.Manifest.Status != runstate.RunCleaned ||
		cleaned.Manifest.CleanupOutcome != runstate.OutcomeSucceeded ||
		cleaned.Manifest.Recoverable {
		t.Fatalf("cleaned manifest = %#v", cleaned.Manifest)
	}
	if cleaned.Manifest.BenchmarkOutcome != originalBenchmark {
		t.Fatalf(
			"cleanup changed benchmark outcome from %q to %q",
			originalBenchmark,
			cleaned.Manifest.BenchmarkOutcome,
		)
	}
	if cleaned.Manifest.Resources[0].Status != runstate.ResourceCleaned {
		t.Fatalf("resource status = %q, want cleaned", cleaned.Manifest.Resources[0].Status)
	}
}

func fixedManager(store *runstate.Store, runID string) Manager {
	now := time.Date(2026, time.July, 24, 12, 0, 0, 0, time.UTC)
	return Manager{
		Store:    store,
		Now:      func() time.Time { return now },
		NewRunID: func() (string, error) { return runID, nil },
	}
}

func testPlan() *plan.Plan {
	return &plan.Plan{
		SchemaVersion: 1,
		Provider:      "aws",
		Workload:      "vm",
		Region:        "us-west-2",
		Zone:          "us-west-2a",
		Instances: []plan.InstancePlan{
			{
				Type:   "c7i.large",
				Family: "c7i",
				Modes: []plan.PlannedMode{
					{
						Name:       "l4-kernel",
						Applicable: true,
						Action:     plan.ActionRun,
						ResultPath: "aws/c7i/results/c7i.large-l4-kernel.json",
					},
				},
			},
			{
				Type:   "c7i.xlarge",
				Family: "c7i",
				Modes: []plan.PlannedMode{
					{
						Name:       "l4-kernel",
						Applicable: true,
						Action:     plan.ActionRun,
						ResultPath: "aws/c7i/results/c7i.xlarge-l4-kernel.json",
					},
				},
			},
		},
	}
}
