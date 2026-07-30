package plan

import (
	"io"

	"github.com/rajsinghtech/tailbench/internal/config"
)

const SchemaVersion = 1

type Catalog interface {
	Instances(provider, region string) ([]CatalogInstance, CatalogMetadata, error)
}

type CatalogInstance struct {
	Type string `json:"type"`
	// Family is the per-size family used for result paths; FamilyGroup is the
	// group-wide value ListFamilies offers as a --family selector. They differ
	// only on Azure (d2sv4 vs dsv4), where --family must match the group.
	Family      string  `json:"family"`
	FamilyGroup string  `json:"family_group,omitempty"`
	VCPUs       int     `json:"vcpus,omitempty"`
	HourlyUSD   float64 `json:"hourly_usd,omitempty"`
}

type CatalogMetadata struct {
	Source  string `json:"source,omitempty"`
	Updated string `json:"updated,omitempty"`
}

type Request struct {
	CompiledProvider string
	Config           *config.Config
	Catalog          Catalog
}

type Plan struct {
	SchemaVersion         int              `json:"schema_version"`
	SideEffects           string           `json:"side_effects"`
	Remote                bool             `json:"remote"`
	Provider              string           `json:"provider"`
	Workload              string           `json:"workload"`
	Region                string           `json:"region,omitempty"`
	Zone                  string           `json:"zone,omitempty"`
	Selector              Selector         `json:"selector"`
	ConfiguredModes       []ModeSummary    `json:"configured_modes"`
	Instances             []InstancePlan   `json:"instances"`
	Resources             ResourceSummary  `json:"resources"`
	Cost                  CostSummary      `json:"cost"`
	Guardrails            GuardrailSummary `json:"guardrails"`
	RequiredTools         []string         `json:"required_tools"`
	RequiredCredentials   []string         `json:"required_credentials"`
	Warnings              []string         `json:"warnings,omitempty"`
	RedactedConfiguration string           `json:"redacted_configuration"`
}

type Selector struct {
	Family string `json:"family"`
	Filter string `json:"filter,omitempty"`
}

type ModeSummary struct {
	Name       string `json:"name"`
	Applicable bool   `json:"applicable"`
	Reason     string `json:"reason,omitempty"`
}

type ModeAction string

const (
	ActionRun           ModeAction = "run"
	ActionSkipExisting  ModeAction = "skip-existing"
	ActionNotApplicable ModeAction = "not-applicable"
)

type PlannedMode struct {
	Name       string     `json:"name"`
	Applicable bool       `json:"applicable"`
	Action     ModeAction `json:"action"`
	Reason     string     `json:"reason,omitempty"`
	ResultPath string     `json:"result_path,omitempty"`
}

type InstancePlan struct {
	Type      string        `json:"type"`
	Family    string        `json:"family"`
	VCPUs     int           `json:"vcpus,omitempty"`
	HourlyUSD float64       `json:"hourly_usd,omitempty"`
	Modes     []PlannedMode `json:"modes"`
}

type ResourceSummary struct {
	MaximumServers          int `json:"maximum_servers"`
	MaximumClients          int `json:"maximum_clients"`
	MaximumRouters          int `json:"maximum_routers"`
	MaximumComputeResources int `json:"maximum_compute_resources"`
	MaximumClusters         int `json:"maximum_clusters"`
	MaximumNodePools        int `json:"maximum_node_pools"`
	MaximumOperators        int `json:"maximum_operators"`
	MaximumLoadBalancers    int `json:"maximum_load_balancers"`
}

type CostSummary struct {
	Estimate              bool     `json:"estimate"`
	MaximumHourlyUSD      float64  `json:"maximum_hourly_usd,omitempty"`
	ExecutionWindowUSD    float64  `json:"execution_window_usd,omitempty"`
	UpperBoundAvailable   bool     `json:"upper_bound_available"`
	UpperBoundUSD         float64  `json:"upper_bound_usd,omitempty"`
	EstimateWindow        string   `json:"estimate_window,omitempty"`
	UpperBoundUnavailable string   `json:"upper_bound_unavailable,omitempty"`
	DataSource            string   `json:"data_source,omitempty"`
	DataUpdated           string   `json:"data_updated,omitempty"`
	Assumptions           []string `json:"assumptions"`
	Excluded              []string `json:"excluded"`
}

type GuardrailSummary struct {
	MaxCostUSD             float64 `json:"max_cost_usd"`
	MaxDuration            string  `json:"max_duration"`
	MaxInstanceTypes       int     `json:"max_instance_types"`
	MaxConcurrentResources int     `json:"max_concurrent_resources"`
	CleanupPolicy          string  `json:"cleanup_policy"`
}

type textWriter interface {
	WriteText(io.Writer) error
}

var _ textWriter = (*Plan)(nil)
