// Package runstate owns Tailbench's dependency-light, versioned recovery
// records. It deliberately does not import provider SDKs or execution code.
package runstate

import "time"

const (
	SchemaVersion      = 1
	EventSchemaVersion = 1
)

type RunStatus string

const (
	RunRunning     RunStatus = "running"
	RunSucceeded   RunStatus = "succeeded"
	RunPartial     RunStatus = "partial"
	RunFailed      RunStatus = "failed"
	RunInterrupted RunStatus = "interrupted"
	RunCleaned     RunStatus = "cleaned"
)

type WorkStatus string

const (
	WorkPending        WorkStatus = "pending"
	WorkRunning        WorkStatus = "running"
	WorkSucceeded      WorkStatus = "succeeded"
	WorkSkipped        WorkStatus = "skipped"
	WorkFailed         WorkStatus = "failed"
	WorkCleanupPending WorkStatus = "cleanup-pending"
	WorkCleaned        WorkStatus = "cleaned"
)

type OutcomeStatus string

const (
	OutcomePending   OutcomeStatus = "pending"
	OutcomeSucceeded OutcomeStatus = "succeeded"
	OutcomeSkipped   OutcomeStatus = "skipped"
	OutcomeFailed    OutcomeStatus = "failed"
)

type ResourceStatus string

const (
	ResourceCreating ResourceStatus = "creating"
	ResourceCreated  ResourceStatus = "created"
	ResourceCleaning ResourceStatus = "cleaning"
	ResourceCleaned  ResourceStatus = "cleaned"
	ResourceUnknown  ResourceStatus = "unknown"
)

type BinaryInfo struct {
	Name      string `json:"name,omitempty"`
	Version   string `json:"version,omitempty"`
	Commit    string `json:"commit,omitempty"`
	BuildDate string `json:"build_date,omitempty"`
}

type CloudIdentity struct {
	Account      string `json:"account,omitempty"`
	Project      string `json:"project,omitempty"`
	Subscription string `json:"subscription,omitempty"`
}

type ImageInfo struct {
	Name   string `json:"name"`
	Value  string `json:"value,omitempty"`
	Digest string `json:"digest,omitempty"`
}

type Resource struct {
	ID               string         `json:"id"`
	Kind             string         `json:"kind"`
	ProviderID       string         `json:"provider_id,omitempty"`
	StackName        string         `json:"stack_name,omitempty"`
	Hostname         string         `json:"hostname,omitempty"`
	CleanupOwner     string         `json:"cleanup_owner,omitempty"`
	Status           ResourceStatus `json:"status"`
	CreatedAt        *time.Time     `json:"created_at,omitempty"`
	CleanedAt        *time.Time     `json:"cleaned_at,omitempty"`
	ExpiresAt        *time.Time     `json:"expires_at,omitempty"`
	LastError        string         `json:"last_error,omitempty"`
	OwnershipCertain bool           `json:"ownership_certain"`
}

type WorkItem struct {
	ID           string     `json:"id"`
	Family       string     `json:"family,omitempty"`
	InstanceType string     `json:"instance_type,omitempty"`
	Mode         string     `json:"mode,omitempty"`
	Status       WorkStatus `json:"status"`
	ResultPath   string     `json:"result_path,omitempty"`
	RetryCount   int        `json:"retry_count,omitempty"`
	LastError    string     `json:"last_error,omitempty"`
	StartedAt    *time.Time `json:"started_at,omitempty"`
	EndedAt      *time.Time `json:"ended_at,omitempty"`
}

type Failure struct {
	Code       string    `json:"code"`
	Stage      string    `json:"stage"`
	Class      string    `json:"class"`
	Message    string    `json:"message"`
	WorkID     string    `json:"work_id,omitempty"`
	RetryCount int       `json:"retry_count,omitempty"`
	Time       time.Time `json:"time,omitempty"`
}

type Manifest struct {
	SchemaVersion    int        `json:"schema_version"`
	Revision         int        `json:"revision"`
	RunID            string     `json:"run_id"`
	Status           RunStatus  `json:"status"`
	Recoverable      bool       `json:"recoverable"`
	ResourcesChanged bool       `json:"resources_changed"`
	StartedAt        time.Time  `json:"started_at"`
	EndedAt          *time.Time `json:"ended_at,omitempty"`

	CommandLine []string      `json:"command_line,omitempty"`
	Binary      BinaryInfo    `json:"binary,omitempty"`
	Provider    string        `json:"provider,omitempty"`
	Workload    string        `json:"workload,omitempty"`
	Region      string        `json:"region,omitempty"`
	Zone        string        `json:"zone,omitempty"`
	Identity    CloudIdentity `json:"cloud_identity,omitempty"`

	EffectiveConfigPath string `json:"effective_config_path"`
	PlanPath            string `json:"plan_path"`
	PlanHash            string `json:"plan_hash,omitempty"`
	LogPath             string `json:"log_path"`
	SummaryPath         string `json:"summary_path"`

	Images           []ImageInfo   `json:"images,omitempty"`
	Resources        []Resource    `json:"resources,omitempty"`
	Work             []WorkItem    `json:"work,omitempty"`
	Failures         []Failure     `json:"failures,omitempty"`
	BenchmarkOutcome OutcomeStatus `json:"benchmark_outcome"`
	CleanupOutcome   OutcomeStatus `json:"cleanup_outcome"`
}

type EventKind string

const (
	EventRunCreated   EventKind = "run-created"
	EventStepStarted  EventKind = "step-started"
	EventStepFinished EventKind = "step-finished"
	EventStateChanged EventKind = "state-changed"
	EventFailure      EventKind = "failure"
)

type Event struct {
	SchemaVersion int       `json:"schema_version"`
	RunID         string    `json:"run_id"`
	Time          time.Time `json:"time"`
	Kind          EventKind `json:"kind"`
	Stage         string    `json:"stage,omitempty"`
	WorkID        string    `json:"work_id,omitempty"`
	Message       string    `json:"message,omitempty"`
	From          string    `json:"from,omitempty"`
	To            string    `json:"to,omitempty"`
}

type CreateRequest struct {
	RunID       string
	StartedAt   time.Time
	CommandLine []string
	Binary      BinaryInfo
	Provider    string
	Workload    string
	Region      string
	Zone        string
	Identity    CloudIdentity
	PlanHash    string

	PlanJSON            []byte
	EffectiveConfigYAML []byte
	Images              []ImageInfo
	InitialWork         []WorkItem

	InitialBenchmarkStatus OutcomeStatus
	InitialCleanupStatus   OutcomeStatus
}
