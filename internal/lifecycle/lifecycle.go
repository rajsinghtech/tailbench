// Package lifecycle wraps approved execution in versioned, durable run state.
package lifecycle

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/rajsinghtech/tailbench/internal/plan"
	"github.com/rajsinghtech/tailbench/internal/runstate"
)

type ExecuteFunc func(context.Context, *Recorder) ExecutionResult
type ResumeExecuteFunc func(context.Context, *Recorder, []runstate.WorkItem) ExecutionResult
type CleanupExecuteFunc func(context.Context, *Recorder, []runstate.Resource) ExecutionResult

var ErrNotRecoverable = errors.New("run has no recoverable unfinished work")

type Request struct {
	CommandLine         []string
	Binary              runstate.BinaryInfo
	Identity            runstate.CloudIdentity
	Plan                *plan.Plan
	EffectiveConfigYAML []byte
	Images              []runstate.ImageInfo
	Execute             ExecuteFunc
}

type ExecutionResult struct {
	BenchmarkOutcome runstate.OutcomeStatus
	CleanupOutcome   runstate.OutcomeStatus
	ResourcesChanged bool
	Resources        []runstate.Resource
	Work             []runstate.WorkItem
	Failures         []runstate.Failure
	Err              error
}

type Outcome struct {
	Manifest       *runstate.Manifest
	ExecutionError error
	RunDirectory   string
	LogPath        string
}

type FinalSummary struct {
	SchemaVersion    int                    `json:"schema_version"`
	RunID            string                 `json:"run_id"`
	Status           runstate.RunStatus     `json:"status"`
	BenchmarkOutcome runstate.OutcomeStatus `json:"benchmark_outcome"`
	CleanupOutcome   runstate.OutcomeStatus `json:"cleanup_outcome"`
	ResourcesChanged bool                   `json:"resources_changed"`
	Recoverable      bool                   `json:"recoverable"`
	Failures         []runstate.Failure     `json:"failures,omitempty"`
}

type Manager struct {
	Store    *runstate.Store
	Now      func() time.Time
	NewRunID func() (string, error)
}

func (m Manager) Run(ctx context.Context, request Request) (*Outcome, error) {
	if m.Store == nil {
		return nil, errors.New("run-state store is required")
	}
	if request.Plan == nil {
		return nil, errors.New("local plan is required")
	}
	if request.Execute == nil {
		return nil, errors.New("execution function is required")
	}
	now := m.Now
	if now == nil {
		now = func() time.Time { return time.Now().UTC() }
	}
	newRunID := m.NewRunID
	if newRunID == nil {
		newRunID = m.Store.GenerateRunID
	}
	runID, err := newRunID()
	if err != nil {
		return nil, err
	}

	planJSON, err := json.MarshalIndent(request.Plan, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("encode approved plan: %w", err)
	}
	planJSON = append(planJSON, '\n')
	planDigest := sha256.Sum256(planJSON)
	planHash := "sha256:" + hex.EncodeToString(planDigest[:])
	startedAt := now()
	_, err = m.Store.Create(runstate.CreateRequest{
		RunID:                  runID,
		StartedAt:              startedAt,
		CommandLine:            request.CommandLine,
		Binary:                 request.Binary,
		Provider:               request.Plan.Provider,
		Workload:               request.Plan.Workload,
		Region:                 request.Plan.Region,
		Zone:                   request.Plan.Zone,
		Identity:               request.Identity,
		PlanHash:               planHash,
		PlanJSON:               planJSON,
		EffectiveConfigYAML:    request.EffectiveConfigYAML,
		Images:                 request.Images,
		InitialWork:            workFromPlan(request.Plan),
		InitialBenchmarkStatus: runstate.OutcomePending,
		InitialCleanupStatus:   runstate.OutcomePending,
	})
	if err != nil {
		return nil, err
	}
	recorder := &Recorder{
		store: m.Store,
		runID: runID,
		now:   now,
	}
	if err := m.Store.AppendEvent(runID, runstate.Event{
		Time:    now(),
		Kind:    runstate.EventStepStarted,
		Stage:   "run",
		Message: "approved execution started",
	}); err != nil {
		return nil, err
	}

	result := request.Execute(ctx, recorder)
	endedAt := now()
	manifest, err := m.Store.Update(runID, func(value *runstate.Manifest) error {
		applyExecutionResult(value, result, endedAt)
		return nil
	})
	if err != nil {
		return nil, err
	}
	if err := m.Store.AppendEvent(runID, runstate.Event{
		Time:    endedAt,
		Kind:    runstate.EventStepFinished,
		Stage:   "run",
		Message: "execution finished with status " + string(manifest.Status),
		From:    string(runstate.RunRunning),
		To:      string(manifest.Status),
	}); err != nil {
		return nil, err
	}
	summary := FinalSummary{
		SchemaVersion:    1,
		RunID:            manifest.RunID,
		Status:           manifest.Status,
		BenchmarkOutcome: manifest.BenchmarkOutcome,
		CleanupOutcome:   manifest.CleanupOutcome,
		ResourcesChanged: manifest.ResourcesChanged,
		Recoverable:      manifest.Recoverable,
		Failures:         append([]runstate.Failure(nil), manifest.Failures...),
	}
	if err := m.Store.WriteSummary(runID, summary); err != nil {
		return nil, err
	}
	runDir, err := m.Store.RunDirectory(runID)
	if err != nil {
		return nil, err
	}
	return &Outcome{
		Manifest:       manifest,
		ExecutionError: result.Err,
		RunDirectory:   runDir,
		LogPath:        filepath.Join(runDir, manifest.LogPath),
	}, nil
}

func (m Manager) Resume(
	ctx context.Context,
	runID string,
	execute ResumeExecuteFunc,
) (*Outcome, error) {
	if m.Store == nil {
		return nil, errors.New("run-state store is required")
	}
	if execute == nil {
		return nil, errors.New("resume execution function is required")
	}
	now := m.Now
	if now == nil {
		now = func() time.Time { return time.Now().UTC() }
	}
	manifest, err := m.Store.Load(runID)
	if err != nil {
		return nil, err
	}
	unfinished := unfinishedWork(manifest.Work)
	if !manifest.Recoverable || len(unfinished) == 0 {
		return nil, fmt.Errorf("%w: %s", ErrNotRecoverable, runID)
	}
	selected := make(map[string]struct{}, len(unfinished))
	for _, work := range unfinished {
		selected[work.ID] = struct{}{}
	}
	_, err = m.Store.Update(runID, func(value *runstate.Manifest) error {
		value.Status = runstate.RunRunning
		value.EndedAt = nil
		value.BenchmarkOutcome = runstate.OutcomePending
		value.CleanupOutcome = runstate.OutcomePending
		value.Recoverable = true
		for index := range value.Work {
			if _, ok := selected[value.Work[index].ID]; !ok {
				continue
			}
			value.Work[index].Status = runstate.WorkPending
			value.Work[index].RetryCount++
			value.Work[index].StartedAt = nil
			value.Work[index].EndedAt = nil
			value.Work[index].LastError = ""
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	recorder := &Recorder{store: m.Store, runID: runID, now: now}
	if err := m.Store.AppendEvent(runID, runstate.Event{
		Time:    now(),
		Kind:    runstate.EventStepStarted,
		Stage:   "resume",
		Message: fmt.Sprintf("resume started for %d unfinished work items", len(unfinished)),
		From:    string(runstate.RunInterrupted),
		To:      string(runstate.RunRunning),
	}); err != nil {
		return nil, err
	}
	result := execute(ctx, recorder, unfinished)
	endedAt := now()
	manifest, err = m.Store.Update(runID, func(value *runstate.Manifest) error {
		applyExecutionResult(value, result, endedAt)
		return nil
	})
	if err != nil {
		return nil, err
	}
	if err := m.Store.AppendEvent(runID, runstate.Event{
		Time:    endedAt,
		Kind:    runstate.EventStepFinished,
		Stage:   "resume",
		Message: "resume finished with status " + string(manifest.Status),
		From:    string(runstate.RunRunning),
		To:      string(manifest.Status),
	}); err != nil {
		return nil, err
	}
	if err := m.Store.WriteSummary(runID, finalSummary(manifest)); err != nil {
		return nil, err
	}
	runDir, err := m.Store.RunDirectory(runID)
	if err != nil {
		return nil, err
	}
	return &Outcome{
		Manifest:       manifest,
		ExecutionError: result.Err,
		RunDirectory:   runDir,
		LogPath:        filepath.Join(runDir, manifest.LogPath),
	}, nil
}

func (m Manager) Cleanup(
	ctx context.Context,
	runID string,
	execute CleanupExecuteFunc,
) (*Outcome, error) {
	if m.Store == nil {
		return nil, errors.New("run-state store is required")
	}
	if execute == nil {
		return nil, errors.New("cleanup execution function is required")
	}
	now := m.Now
	if now == nil {
		now = func() time.Time { return time.Now().UTC() }
	}
	manifest, err := m.Store.Load(runID)
	if err != nil {
		return nil, err
	}
	resources := uncleanResources(manifest.Resources)
	_, err = m.Store.Update(runID, func(value *runstate.Manifest) error {
		value.Status = runstate.RunRunning
		value.EndedAt = nil
		value.CleanupOutcome = runstate.OutcomePending
		value.Recoverable = true
		for index := range value.Resources {
			if value.Resources[index].Status != runstate.ResourceCleaned {
				value.Resources[index].Status = runstate.ResourceCleaning
			}
		}
		for index := range value.Work {
			if value.Work[index].Status != runstate.WorkSkipped &&
				value.Work[index].Status != runstate.WorkCleaned {
				value.Work[index].Status = runstate.WorkCleanupPending
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	recorder := &Recorder{store: m.Store, runID: runID, now: now}
	if err := m.Store.AppendEvent(runID, runstate.Event{
		Time:    now(),
		Kind:    runstate.EventStepStarted,
		Stage:   "cleanup",
		Message: fmt.Sprintf("cleanup started for %d tracked resources", len(resources)),
		To:      string(runstate.RunRunning),
	}); err != nil {
		return nil, err
	}

	result := execute(ctx, recorder, resources)
	endedAt := now()
	manifest, err = m.Store.Update(runID, func(value *runstate.Manifest) error {
		cleanupOutcome := result.CleanupOutcome
		if cleanupOutcome == "" {
			if result.Err == nil {
				cleanupOutcome = runstate.OutcomeSucceeded
			} else {
				cleanupOutcome = runstate.OutcomeFailed
			}
		}
		value.CleanupOutcome = cleanupOutcome
		value.ResourcesChanged = value.ResourcesChanged || result.ResourcesChanged
		value.EndedAt = &endedAt
		if result.Resources != nil {
			value.Resources = append([]runstate.Resource(nil), result.Resources...)
		} else {
			for index := range value.Resources {
				if value.Resources[index].Status == runstate.ResourceCleaned {
					continue
				}
				if cleanupOutcome == runstate.OutcomeSucceeded {
					value.Resources[index].Status = runstate.ResourceCleaned
					value.Resources[index].CleanedAt = &endedAt
					value.Resources[index].LastError = ""
				} else {
					value.Resources[index].Status = runstate.ResourceUnknown
					if result.Err != nil {
						value.Resources[index].LastError = result.Err.Error()
					}
				}
			}
		}
		for index := range value.Work {
			if value.Work[index].Status != runstate.WorkCleanupPending {
				continue
			}
			if cleanupOutcome == runstate.OutcomeSucceeded {
				value.Work[index].Status = runstate.WorkCleaned
				value.Work[index].EndedAt = &endedAt
			}
		}
		for index := range result.Failures {
			if result.Failures[index].Time.IsZero() {
				result.Failures[index].Time = endedAt
			}
		}
		value.Failures = append(value.Failures, result.Failures...)
		if cleanupOutcome == runstate.OutcomeSucceeded {
			value.Status = runstate.RunCleaned
			value.Recoverable = false
		} else if value.BenchmarkOutcome == runstate.OutcomeSucceeded {
			value.Status = runstate.RunPartial
			value.Recoverable = true
		} else {
			value.Status = runstate.RunFailed
			value.Recoverable = true
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	if err := m.Store.AppendEvent(runID, runstate.Event{
		Time:    endedAt,
		Kind:    runstate.EventStepFinished,
		Stage:   "cleanup",
		Message: "cleanup finished with status " + string(manifest.CleanupOutcome),
		From:    string(runstate.RunRunning),
		To:      string(manifest.Status),
	}); err != nil {
		return nil, err
	}
	if err := m.Store.WriteSummary(runID, finalSummary(manifest)); err != nil {
		return nil, err
	}
	runDir, err := m.Store.RunDirectory(runID)
	if err != nil {
		return nil, err
	}
	return &Outcome{
		Manifest:       manifest,
		ExecutionError: result.Err,
		RunDirectory:   runDir,
		LogPath:        filepath.Join(runDir, manifest.LogPath),
	}, nil
}

type Recorder struct {
	store *runstate.Store
	runID string
	now   func() time.Time
}

func (r *Recorder) RunID() string {
	return r.runID
}

func (r *Recorder) LogPath() (string, error) {
	runDir, err := r.store.RunDirectory(r.runID)
	if err != nil {
		return "", err
	}
	manifest, err := r.store.Load(r.runID)
	if err != nil {
		return "", err
	}
	return filepath.Join(runDir, manifest.LogPath), nil
}

func (r *Recorder) OpenLog() (*os.File, error) {
	return r.store.OpenLog(r.runID)
}

// RecordResources durably upserts resources as soon as the execution layer
// learns about them. This deliberately happens independently of the final
// ExecutionResult so an interrupt after provisioning still leaves cleanup
// identifiers in the manifest.
func (r *Recorder) RecordResources(resources ...runstate.Resource) error {
	if len(resources) == 0 {
		return nil
	}
	occurred := r.now()
	normalized := make([]runstate.Resource, len(resources))
	for index, resource := range resources {
		if resource.ID == "" {
			return errors.New("resource ID is required")
		}
		switch resource.CleanupOwner {
		case "":
			resource.CleanupOwner = r.runID
		case r.runID:
		default:
			return fmt.Errorf(
				"resource %q cleanup owner %q does not match run %q",
				resource.ID,
				resource.CleanupOwner,
				r.runID,
			)
		}
		if (resource.Status == runstate.ResourceCreating ||
			resource.Status == runstate.ResourceCreated) &&
			resource.CreatedAt == nil {
			resource.CreatedAt = &occurred
		}
		if resource.Status == runstate.ResourceCleaned && resource.CleanedAt == nil {
			resource.CleanedAt = &occurred
		}
		normalized[index] = resource
	}

	if _, err := r.store.Update(r.runID, func(manifest *runstate.Manifest) error {
		manifest.ResourcesChanged = true
		for _, resource := range normalized {
			upsertManifestResource(manifest, resource)
		}
		return nil
	}); err != nil {
		return err
	}
	for _, resource := range normalized {
		if err := r.store.AppendEvent(r.runID, runstate.Event{
			Time:    occurred,
			Kind:    runstate.EventStateChanged,
			Stage:   "resource",
			Message: fmt.Sprintf("%s: %s", resource.ID, resource.Status),
			To:      string(resource.Status),
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *Recorder) BeforeExternalStep(stage, workID, message string) error {
	if _, err := r.store.Update(r.runID, func(manifest *runstate.Manifest) error {
		if workID == "" {
			return nil
		}
		work, err := findWork(manifest, workID)
		if err != nil {
			return err
		}
		occurred := r.now()
		if work.Status == runstate.WorkFailed {
			work.RetryCount++
		}
		work.Status = runstate.WorkRunning
		work.StartedAt = &occurred
		work.EndedAt = nil
		work.LastError = ""
		return nil
	}); err != nil {
		return err
	}
	return r.store.AppendEvent(r.runID, runstate.Event{
		Time:    r.now(),
		Kind:    runstate.EventStepStarted,
		Stage:   stage,
		WorkID:  workID,
		Message: message,
		To:      string(runstate.WorkRunning),
	})
}

func (r *Recorder) AfterExternalStep(
	stage string,
	workID string,
	status runstate.WorkStatus,
	message string,
) error {
	if _, err := r.store.Update(r.runID, func(manifest *runstate.Manifest) error {
		if workID == "" {
			return nil
		}
		work, err := findWork(manifest, workID)
		if err != nil {
			return err
		}
		occurred := r.now()
		work.Status = status
		work.EndedAt = &occurred
		if status == runstate.WorkFailed {
			work.LastError = message
		} else {
			work.LastError = ""
		}
		return nil
	}); err != nil {
		return err
	}
	return r.store.AppendEvent(r.runID, runstate.Event{
		Time:    r.now(),
		Kind:    runstate.EventStepFinished,
		Stage:   stage,
		WorkID:  workID,
		Message: message,
		To:      string(status),
	})
}

func upsertManifestResource(manifest *runstate.Manifest, resource runstate.Resource) {
	for index := range manifest.Resources {
		if manifest.Resources[index].ID != resource.ID {
			continue
		}
		previous := manifest.Resources[index]
		if resource.CreatedAt == nil {
			resource.CreatedAt = previous.CreatedAt
		}
		if resource.CleanedAt == nil {
			resource.CleanedAt = previous.CleanedAt
		}
		if resource.ExpiresAt == nil {
			resource.ExpiresAt = previous.ExpiresAt
		}
		manifest.Resources[index] = resource
		return
	}
	manifest.Resources = append(manifest.Resources, resource)
}

func applyExecutionResult(manifest *runstate.Manifest, result ExecutionResult, endedAt time.Time) {
	benchmarkOutcome := result.BenchmarkOutcome
	if benchmarkOutcome == "" {
		if result.Err == nil {
			benchmarkOutcome = runstate.OutcomeSucceeded
		} else {
			benchmarkOutcome = runstate.OutcomeFailed
		}
	}
	cleanupOutcome := result.CleanupOutcome
	if cleanupOutcome == "" {
		if result.Err == nil {
			cleanupOutcome = runstate.OutcomeSucceeded
		} else {
			cleanupOutcome = runstate.OutcomePending
		}
	}
	manifest.BenchmarkOutcome = benchmarkOutcome
	manifest.CleanupOutcome = cleanupOutcome
	manifest.ResourcesChanged = manifest.ResourcesChanged || result.ResourcesChanged
	manifest.EndedAt = &endedAt
	if result.Resources != nil {
		for _, resource := range result.Resources {
			upsertManifestResource(manifest, resource)
		}
	}
	if result.Work != nil {
		manifest.Work = append([]runstate.WorkItem(nil), result.Work...)
	} else {
		finalizeWork(manifest.Work, benchmarkOutcome, result.Err, endedAt)
	}
	for index := range result.Failures {
		if result.Failures[index].Time.IsZero() {
			result.Failures[index].Time = endedAt
		}
	}
	manifest.Failures = append(manifest.Failures, result.Failures...)

	switch {
	case errors.Is(result.Err, context.Canceled) || errors.Is(result.Err, context.DeadlineExceeded):
		manifest.Status = runstate.RunInterrupted
	case benchmarkOutcome == runstate.OutcomeSucceeded && cleanupOutcome == runstate.OutcomeFailed:
		manifest.Status = runstate.RunPartial
	case benchmarkOutcome == runstate.OutcomeSucceeded &&
		(cleanupOutcome == runstate.OutcomeSucceeded || cleanupOutcome == runstate.OutcomeSkipped):
		manifest.Status = runstate.RunSucceeded
	default:
		manifest.Status = runstate.RunFailed
	}
	manifest.Recoverable = manifest.Status == runstate.RunInterrupted ||
		cleanupOutcome == runstate.OutcomeFailed ||
		cleanupOutcome == runstate.OutcomePending ||
		hasRecoverableWork(manifest.Work) ||
		hasUncleanResources(manifest.Resources)
}

func workFromPlan(localPlan *plan.Plan) []runstate.WorkItem {
	var work []runstate.WorkItem
	for _, instance := range localPlan.Instances {
		for _, mode := range instance.Modes {
			status := runstate.WorkPending
			if mode.Action == plan.ActionSkipExisting || mode.Action == plan.ActionNotApplicable {
				status = runstate.WorkSkipped
			}
			work = append(work, runstate.WorkItem{
				ID:           instance.Type + "/" + mode.Name,
				Family:       instance.Family,
				InstanceType: instance.Type,
				Mode:         mode.Name,
				Status:       status,
				ResultPath:   mode.ResultPath,
			})
		}
	}
	return work
}

func finalizeWork(
	work []runstate.WorkItem,
	benchmarkOutcome runstate.OutcomeStatus,
	executionErr error,
	endedAt time.Time,
) {
	for index := range work {
		switch {
		case work[index].Status == runstate.WorkRunning:
			work[index].Status = runstate.WorkFailed
			work[index].EndedAt = &endedAt
		case benchmarkOutcome == runstate.OutcomeSucceeded && work[index].Status == runstate.WorkPending:
			work[index].Status = runstate.WorkSucceeded
			work[index].EndedAt = &endedAt
		case executionErr != nil && work[index].Status == runstate.WorkPending:
			// Pending work is intentionally retained for resume.
		}
	}
}

func findWork(manifest *runstate.Manifest, workID string) (*runstate.WorkItem, error) {
	for index := range manifest.Work {
		if manifest.Work[index].ID == workID {
			return &manifest.Work[index], nil
		}
	}
	return nil, fmt.Errorf("work item %q is not present in run %s", workID, manifest.RunID)
}

func hasRecoverableWork(work []runstate.WorkItem) bool {
	for _, item := range work {
		if item.Status == runstate.WorkPending ||
			item.Status == runstate.WorkRunning ||
			item.Status == runstate.WorkCleanupPending {
			return true
		}
	}
	return false
}

func hasUncleanResources(resources []runstate.Resource) bool {
	for _, resource := range resources {
		if resource.Status != runstate.ResourceCleaned {
			return true
		}
	}
	return false
}

func unfinishedWork(work []runstate.WorkItem) []runstate.WorkItem {
	var unfinished []runstate.WorkItem
	for _, item := range work {
		switch item.Status {
		case runstate.WorkPending,
			runstate.WorkRunning,
			runstate.WorkFailed,
			runstate.WorkCleanupPending:
			unfinished = append(unfinished, item)
		}
	}
	return unfinished
}

func finalSummary(manifest *runstate.Manifest) FinalSummary {
	return FinalSummary{
		SchemaVersion:    1,
		RunID:            manifest.RunID,
		Status:           manifest.Status,
		BenchmarkOutcome: manifest.BenchmarkOutcome,
		CleanupOutcome:   manifest.CleanupOutcome,
		ResourcesChanged: manifest.ResourcesChanged,
		Recoverable:      manifest.Recoverable,
		Failures:         append([]runstate.Failure(nil), manifest.Failures...),
	}
}

func uncleanResources(resources []runstate.Resource) []runstate.Resource {
	var unclean []runstate.Resource
	for _, resource := range resources {
		if resource.Status != runstate.ResourceCleaned {
			unclean = append(unclean, resource)
		}
	}
	return unclean
}
