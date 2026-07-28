package runstate

import (
	"bytes"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"
)

func TestStoreCreateWritesVersionedRecoveryBundle(t *testing.T) {
	root := filepath.Join(t.TempDir(), ".tailbench", "runs")
	store := NewStore(root)
	started := time.Date(2026, time.July, 24, 15, 4, 5, 0, time.UTC)

	manifest, err := store.Create(CreateRequest{
		RunID:       "tb_2026-07-24_ab12cd",
		StartedAt:   started,
		CommandLine: []string{"tailbench-aws", "run", "--family", "c7i"},
		Binary: BinaryInfo{
			Name:      "tailbench-aws",
			Version:   "1.2.3",
			Commit:    "abc123",
			BuildDate: "2026-07-24T12:00:00Z",
		},
		Provider:               "aws",
		Workload:               "vm",
		Region:                 "us-west-2",
		Zone:                   "us-west-2a",
		PlanHash:               "sha256:plan",
		PlanJSON:               []byte("{\"schema_version\":1}\n"),
		EffectiveConfigYAML:    []byte("provider: aws\nsecret: REDACTED\n"),
		InitialBenchmarkStatus: OutcomePending,
		InitialCleanupStatus:   OutcomePending,
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	if manifest.SchemaVersion != SchemaVersion {
		t.Fatalf("schema version = %d, want %d", manifest.SchemaVersion, SchemaVersion)
	}
	if manifest.RunID != "tb_2026-07-24_ab12cd" || manifest.Status != RunRunning {
		t.Fatalf("manifest identity = %#v", manifest)
	}
	if !manifest.StartedAt.Equal(started) {
		t.Fatalf("started_at = %s, want %s", manifest.StartedAt, started)
	}

	runDir := filepath.Join(root, manifest.RunID)
	for _, relative := range []string{
		"manifest.json",
		"events.jsonl",
		"effective-config.redacted.yaml",
		"plan.json",
		filepath.Join("logs", "tailbench.log"),
	} {
		info, statErr := os.Stat(filepath.Join(runDir, relative))
		if statErr != nil {
			t.Fatalf("%s: %v", relative, statErr)
		}
		if info.IsDir() {
			t.Fatalf("%s is a directory, want file", relative)
		}
	}

	loaded, err := store.Load(manifest.RunID)
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if !reflect.DeepEqual(loaded, manifest) {
		t.Fatalf("loaded manifest differs:\n got %#v\nwant %#v", loaded, manifest)
	}

	events, err := store.Events(manifest.RunID)
	if err != nil {
		t.Fatalf("Events: %v", err)
	}
	if len(events) != 1 || events[0].Kind != EventRunCreated || events[0].RunID != manifest.RunID {
		t.Fatalf("events = %#v, want one run-created event", events)
	}
}

func TestStoreUpdateAtomicallyPersistsWorkAndIndependentOutcomes(t *testing.T) {
	root := filepath.Join(t.TempDir(), "runs")
	store := NewStore(root)
	manifest, err := store.Create(CreateRequest{
		RunID:     "tb_2026-07-24_123abc",
		StartedAt: time.Date(2026, time.July, 24, 12, 0, 0, 0, time.UTC),
		Provider:  "aws",
		Workload:  "vm",
		InitialWork: []WorkItem{
			{ID: "c7i.large/l4-kernel", InstanceType: "c7i.large", Mode: "l4-kernel", Status: WorkPending},
		},
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	completed := time.Date(2026, time.July, 24, 12, 10, 0, 0, time.UTC)
	updated, err := store.Update(manifest.RunID, func(value *Manifest) error {
		value.Status = RunPartial
		value.EndedAt = &completed
		value.Recoverable = true
		value.BenchmarkOutcome = OutcomeSucceeded
		value.CleanupOutcome = OutcomeFailed
		value.Work[0].Status = WorkCleanupPending
		value.Failures = append(value.Failures, Failure{
			Code:       "cleanup-failure",
			Stage:      "cleanup",
			Class:      "cleanup-failure",
			Message:    "destroy pair failed",
			RetryCount: 1,
		})
		return nil
	})
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	if updated.Revision != manifest.Revision+1 {
		t.Fatalf("revision = %d, want %d", updated.Revision, manifest.Revision+1)
	}
	if updated.BenchmarkOutcome != OutcomeSucceeded || updated.CleanupOutcome != OutcomeFailed {
		t.Fatalf("outcomes = benchmark %q cleanup %q", updated.BenchmarkOutcome, updated.CleanupOutcome)
	}

	onDisk, err := store.Load(manifest.RunID)
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if !reflect.DeepEqual(onDisk, updated) {
		t.Fatalf("on-disk manifest differs:\n got %#v\nwant %#v", onDisk, updated)
	}

	matches, err := filepath.Glob(filepath.Join(root, manifest.RunID, ".manifest.json-*"))
	if err != nil {
		t.Fatal(err)
	}
	if len(matches) != 0 {
		t.Fatalf("atomic-write temporary files remain: %v", matches)
	}
}

func TestStoreAppendEventIsDurableJSONL(t *testing.T) {
	store := NewStore(filepath.Join(t.TempDir(), "runs"))
	manifest, err := store.Create(CreateRequest{RunID: "tb_2026-07-24_654def"})
	if err != nil {
		t.Fatal(err)
	}
	occurred := time.Date(2026, time.July, 24, 12, 30, 0, 0, time.UTC)
	event := Event{
		SchemaVersion: EventSchemaVersion,
		RunID:         manifest.RunID,
		Time:          occurred,
		Kind:          EventStepFinished,
		Stage:         "provision",
		WorkID:        "c7i.large/l4-kernel",
		Message:       "pair created",
	}
	if err := store.AppendEvent(manifest.RunID, event); err != nil {
		t.Fatalf("AppendEvent: %v", err)
	}

	events, err := store.Events(manifest.RunID)
	if err != nil {
		t.Fatalf("Events: %v", err)
	}
	if len(events) != 2 || !reflect.DeepEqual(events[1], event) {
		t.Fatalf("events = %#v, want appended event %#v", events, event)
	}

	data, err := os.ReadFile(filepath.Join(store.Root(), manifest.RunID, "events.jsonl"))
	if err != nil {
		t.Fatal(err)
	}
	lines := bytes.Split(bytes.TrimSpace(data), []byte("\n"))
	if len(lines) != 2 {
		t.Fatalf("event lines = %d, want 2", len(lines))
	}
	for _, line := range lines {
		var decoded map[string]any
		if err := json.Unmarshal(line, &decoded); err != nil {
			t.Fatalf("invalid JSONL line %q: %v", line, err)
		}
	}
}

func TestStoreRejectsUnsafeRunIDsWithoutFilesystemChanges(t *testing.T) {
	parent := t.TempDir()
	root := filepath.Join(parent, "runs")
	store := NewStore(root)

	for _, runID := range []string{"", "../escape", "tb_2026-07-24_bad/slash", "/absolute"} {
		_, err := store.Create(CreateRequest{RunID: runID})
		if !errors.Is(err, ErrInvalidRunID) {
			t.Fatalf("Create(%q) error = %v, want ErrInvalidRunID", runID, err)
		}
	}
	if _, err := os.Stat(root); !os.IsNotExist(err) {
		t.Fatalf("invalid IDs created run root: %v", err)
	}
	if _, err := os.Stat(filepath.Join(parent, "escape")); !os.IsNotExist(err) {
		t.Fatalf("invalid ID escaped run root: %v", err)
	}
}

func TestStoreLoadMissingDoesNotCreateRunDirectory(t *testing.T) {
	root := filepath.Join(t.TempDir(), "runs")
	store := NewStore(root)

	_, err := store.Load("tb_2026-07-24_abcdef")
	if !errors.Is(err, ErrRunNotFound) {
		t.Fatalf("Load error = %v, want ErrRunNotFound", err)
	}
	if _, statErr := os.Stat(root); !os.IsNotExist(statErr) {
		t.Fatalf("Load created run root: %v", statErr)
	}
}

func TestStoreCreateCollisionDoesNotOverwriteExistingRun(t *testing.T) {
	store := NewStore(filepath.Join(t.TempDir(), "runs"))
	runID := "tb_2026-07-24_a1b2c3"
	first, err := store.Create(CreateRequest{
		RunID:    runID,
		Provider: "aws",
		PlanHash: "sha256:first",
		PlanJSON: []byte("{\"plan\":\"first\"}\n"),
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = store.Create(CreateRequest{
		RunID:    runID,
		Provider: "gcp",
		PlanHash: "sha256:second",
		PlanJSON: []byte("{\"plan\":\"second\"}\n"),
	})
	if !errors.Is(err, ErrRunExists) {
		t.Fatalf("second Create error = %v, want ErrRunExists", err)
	}

	loaded, err := store.Load(runID)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(loaded, first) {
		t.Fatalf("collision changed manifest:\n got %#v\nwant %#v", loaded, first)
	}
	planData, err := os.ReadFile(filepath.Join(store.Root(), runID, "plan.json"))
	if err != nil {
		t.Fatal(err)
	}
	if got, want := string(planData), "{\"plan\":\"first\"}\n"; got != want {
		t.Fatalf("collision changed plan = %q, want %q", got, want)
	}
}

func TestGenerateRunIDUsesDateAndRandomSuffix(t *testing.T) {
	now := time.Date(2026, time.July, 24, 9, 8, 7, 0, time.FixedZone("test", -5*60*60))
	runID, err := GenerateRunID(now, strings.NewReader("\xab\x12\xcd"))
	if err != nil {
		t.Fatalf("GenerateRunID: %v", err)
	}
	if got, want := runID, "tb_2026-07-24_ab12cd"; got != want {
		t.Fatalf("run ID = %q, want %q", got, want)
	}
}
