package plan

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"github.com/rajsinghtech/tailbench/internal/benchmark"
	"github.com/rajsinghtech/tailbench/internal/config"
)

func Build(ctx context.Context, request Request) (*Plan, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if request.Config == nil {
		return nil, fmt.Errorf("configuration is required")
	}
	if request.CompiledProvider == "" {
		return nil, fmt.Errorf("compiled provider identity is required")
	}
	cfg := request.Config
	if len(cfg.Providers) != 1 {
		return nil, fmt.Errorf(
			"exactly one provider is required for %s; got %d",
			request.CompiledProvider,
			len(cfg.Providers),
		)
	}
	for _, configured := range cfg.Providers {
		if configured != request.CompiledProvider {
			return nil, fmt.Errorf(
				"requested provider %q, but this binary was compiled for %q",
				configured,
				request.CompiledProvider,
			)
		}
	}

	var filter *regexp.Regexp
	if cfg.Filter != "" {
		var err error
		filter, err = regexp.Compile(cfg.Filter)
		if err != nil {
			return nil, fmt.Errorf("invalid instance filter %q: %w", cfg.Filter, err)
		}
	}

	workload := workloadForProvider(request.CompiledProvider)
	environment := "vm"
	if workload == "kubernetes" {
		environment = "container"
	}
	modeSummaries := make([]ModeSummary, 0, len(cfg.Modes))
	for _, mode := range cfg.Modes {
		if !benchmark.IsValidMode(mode) {
			return nil, fmt.Errorf("invalid benchmark mode %q", mode)
		}
		if benchmark.ModeUsesTsnet(mode) {
			return nil, fmt.Errorf(
				"benchmark mode %q is not implemented; remove it before running",
				mode,
			)
		}
		applicable := benchmark.ModeAppliesTo(mode, environment)
		summary := ModeSummary{Name: mode, Applicable: applicable}
		if !applicable {
			summary.Reason = fmt.Sprintf("mode does not apply to %s workloads", workload)
		}
		modeSummaries = append(modeSummaries, summary)
	}

	region, zone := providerLocation(request.CompiledProvider, cfg)
	catalog := request.Catalog
	if catalog == nil {
		catalog = PricingCatalog{}
	}
	catalogInstances, metadata, err := catalog.Instances(request.CompiledProvider, region)
	if err != nil {
		return nil, fmt.Errorf("load local instance catalog: %w", err)
	}

	selected := selectInstances(catalogInstances, cfg.Family, filter)
	instancePlans := make([]InstancePlan, 0, len(selected))
	for _, instance := range selected {
		planned := InstancePlan{
			Type:      instance.Type,
			Family:    instance.Family,
			VCPUs:     instance.VCPUs,
			HourlyUSD: instance.HourlyUSD,
			Modes:     make([]PlannedMode, 0, len(cfg.Modes)),
		}
		for _, mode := range cfg.Modes {
			applicable := benchmark.ModeAppliesTo(mode, environment)
			modePlan := PlannedMode{
				Name:       mode,
				Applicable: applicable,
				Action:     ActionRun,
			}
			if !applicable {
				modePlan.Action = ActionNotApplicable
				modePlan.Reason = fmt.Sprintf("mode does not apply to %s workloads", workload)
			} else {
				targetPath, exists := resultPath(cfg.RootDir, request.CompiledProvider, instance, mode)
				modePlan.ResultPath = targetPath
				if exists {
					modePlan.Action = ActionSkipExisting
					modePlan.Reason = "result already exists"
				}
			}
			planned.Modes = append(planned.Modes, modePlan)
		}
		instancePlans = append(instancePlans, planned)
	}

	resources := resourcesFor(workload, instancePlans)
	cost := costFor(metadata, resources, instancePlans, workload, cfg)
	plan := &Plan{
		SchemaVersion:   SchemaVersion,
		SideEffects:     "none",
		Remote:          false,
		Provider:        request.CompiledProvider,
		Workload:        workload,
		Region:          region,
		Zone:            zone,
		Selector:        Selector{Family: valueOr(cfg.Family, "all"), Filter: cfg.Filter},
		ConfiguredModes: modeSummaries,
		Instances:       instancePlans,
		Resources:       resources,
		Cost:            cost,
		Guardrails: GuardrailSummary{
			MaxCostUSD:             cfg.MaxCostUSD,
			MaxDuration:            cfg.MaxDuration.String(),
			MaxInstanceTypes:       cfg.MaxInstanceTypes,
			MaxConcurrentResources: cfg.MaxConcurrentResources,
			CleanupPolicy:          cfg.CleanupPolicy,
		},
		RequiredTools:         requiredTools(request.CompiledProvider, workload),
		RequiredCredentials:   requiredCredentials(request.CompiledProvider),
		RedactedConfiguration: redactedConfiguration(request.CompiledProvider, workload, region, zone, cfg),
	}
	if len(selected) == 0 {
		plan.Warnings = append(
			plan.Warnings,
			"no matching instances are present in the checked-in local price catalog; use doctor --remote to verify provider availability",
		)
	}
	if metadata.Source == "" {
		plan.Warnings = append(plan.Warnings, "local catalog does not identify its pricing source")
	}
	if !cost.UpperBoundAvailable && cost.UpperBoundUnavailable != "" {
		plan.Warnings = append(plan.Warnings, cost.UpperBoundUnavailable)
	}
	return plan, nil
}

func selectInstances(instances []CatalogInstance, family string, filter *regexp.Regexp) []CatalogInstance {
	selected := make([]CatalogInstance, 0, len(instances))
	for _, instance := range instances {
		// --family takes the group-wide selector ListFamilies offers, which on
		// Azure is not the per-size family used for result paths. Match the
		// group alone: accepting the per-size name too would let `--family
		// d4sv4` pass the plan and then fail in provider discovery with
		// "unknown azure family". Rejecting it here surfaces as no-runnable-work
		// before anything is provisioned. Use --filter to select one size.
		group := instance.FamilyGroup
		if group == "" {
			group = instance.Family
		}
		if family != "" && family != "all" && group != family {
			continue
		}
		if filter != nil && !filter.MatchString(instance.Type) {
			continue
		}
		selected = append(selected, instance)
	}
	sort.Slice(selected, func(i, j int) bool {
		if selected[i].VCPUs == selected[j].VCPUs {
			return selected[i].Type < selected[j].Type
		}
		return selected[i].VCPUs < selected[j].VCPUs
	})
	return selected
}

func resultPath(rootDir, provider string, instance CatalogInstance, mode string) (string, bool) {
	if rootDir == "" {
		return "", false
	}
	resultDir := filepath.Join(rootDir, provider, instance.Family, "results")
	candidates := []string{filepath.Join(resultDir, instance.Type+"-"+mode+".json")}
	if mode == "l4-kernel" {
		candidates = append(candidates, filepath.Join(resultDir, instance.Type+".json"))
	}
	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate, true
		}
	}
	return candidates[0], false
}

func resourcesFor(workload string, instances []InstancePlan) ResourceSummary {
	var resources ResourceSummary
	var hasWork, needsRouter, needsLoadBalancer bool
	for _, instance := range instances {
		for _, mode := range instance.Modes {
			if mode.Action != ActionRun {
				continue
			}
			hasWork = true
			if mode.Name == "forward-pps-exit" || mode.Name == "relay-throughput" {
				needsRouter = true
			}
			if mode.Name == "l4-lb" || strings.HasPrefix(mode.Name, "l7-ingress") {
				needsLoadBalancer = true
			}
		}
	}
	if !hasWork {
		return resources
	}
	if workload == "vm" {
		resources.MaximumServers = 1
		resources.MaximumClients = 1
		if needsRouter {
			resources.MaximumRouters = 1
		}
		resources.MaximumComputeResources =
			resources.MaximumServers + resources.MaximumClients + resources.MaximumRouters
		return resources
	}
	resources.MaximumClusters = 1
	resources.MaximumNodePools = 1
	resources.MaximumOperators = 1
	resources.MaximumComputeResources = 2
	if needsLoadBalancer {
		resources.MaximumLoadBalancers = 1
	}
	return resources
}

func costFor(
	metadata CatalogMetadata,
	resources ResourceSummary,
	instances []InstancePlan,
	workload string,
	cfg *config.Config,
) CostSummary {
	var highest float64
	for _, instance := range instances {
		if instance.HourlyUSD > highest && instanceHasWork(instance) {
			highest = instance.HourlyUSD
		}
	}
	multiplier := resources.MaximumComputeResources
	if workload == "kubernetes" && multiplier == 0 && len(instances) > 0 {
		multiplier = 2
	}
	maximum := highest * float64(multiplier)
	windowEstimate := 0.0
	estimateWindow := ""
	if cfg != nil && cfg.MaxDuration > 0 {
		windowEstimate = maximum * cfg.MaxDuration.Hours()
		estimateWindow = cfg.MaxDuration.String()
	}
	upperBoundAvailable := cfg != nil &&
		cfg.CleanupPolicy == config.CleanupAlways &&
		estimateWindow != ""
	upperBound := 0.0
	upperBoundUnavailable := ""
	if upperBoundAvailable {
		upperBound = windowEstimate
	} else if cfg != nil &&
		(cfg.CleanupPolicy == config.CleanupOnSuccess ||
			cfg.CleanupPolicy == config.CleanupManual) {
		upperBoundUnavailable = fmt.Sprintf(
			"cleanup policy %q can leave resources running after max_duration; lifetime cost has no bounded estimate and continues until cleanup succeeds",
			cfg.CleanupPolicy,
		)
	}
	return CostSummary{
		Estimate:              maximum > 0,
		MaximumHourlyUSD:      maximum,
		ExecutionWindowUSD:    windowEstimate,
		UpperBoundAvailable:   upperBoundAvailable,
		UpperBoundUSD:         upperBound,
		EstimateWindow:        estimateWindow,
		UpperBoundUnavailable: upperBoundUnavailable,
		DataSource:            metadata.Source,
		DataUpdated:           metadata.Updated,
		Assumptions: []string{
			"selected compute resources use indicative on-demand Linux prices",
			"only one benchmark topology runs concurrently",
		},
		Excluded: []string{
			"network transfer, storage, taxes, discounts, and provider control-plane charges",
		},
	}
}

func instanceHasWork(instance InstancePlan) bool {
	for _, mode := range instance.Modes {
		if mode.Action == ActionRun {
			return true
		}
	}
	return false
}

func requiredTools(provider, workload string) []string {
	tools := []string{"pulumi", cloudCLI(provider)}
	if workload == "kubernetes" {
		tools = append(tools, "kubectl", "helm")
	}
	return tools
}

func requiredCredentials(provider string) []string {
	credentials := []string{"OAUTH_CLIENT_ID", "OAUTH_CLIENT_SECRET"}
	switch canonicalProvider(provider) {
	case "aws":
		return append(credentials, "AWS CLI authenticated identity")
	case "gcp":
		return append(credentials, "gcloud authenticated account and project")
	case "azure":
		return append(credentials, "Azure CLI authenticated subscription")
	default:
		return credentials
	}
}

func cloudCLI(provider string) string {
	switch canonicalProvider(provider) {
	case "aws":
		return "aws"
	case "gcp":
		return "gcloud"
	case "azure":
		return "az"
	default:
		return provider
	}
}

func workloadForProvider(provider string) string {
	switch provider {
	case "eks", "gke", "aks":
		return "kubernetes"
	default:
		return "vm"
	}
}

func providerLocation(provider string, cfg *config.Config) (string, string) {
	switch canonicalProvider(provider) {
	case "aws":
		return cfg.AWSRegion, cfg.AWSAZ
	case "gcp":
		zone := cfg.GCPZone
		region := zone
		if index := strings.LastIndex(zone, "-"); index > 0 {
			region = zone[:index]
		}
		return region, zone
	case "azure":
		return cfg.AzureLocation, cfg.AzureLocation
	default:
		return "", ""
	}
}

func redactedConfiguration(provider, workload, region, zone string, cfg *config.Config) string {
	return fmt.Sprintf(
		"provider=%s workload=%s region=%s zone=%s family=%s filter=%q modes=%s max_cost_usd=%.2f max_duration=%s max_instance_types=%d max_concurrent_resources=%d cleanup_policy=%s",
		provider,
		workload,
		region,
		zone,
		valueOr(cfg.Family, "all"),
		cfg.Filter,
		strings.Join(cfg.Modes, ","),
		cfg.MaxCostUSD,
		cfg.MaxDuration,
		cfg.MaxInstanceTypes,
		cfg.MaxConcurrentResources,
		cfg.CleanupPolicy,
	)
}

func valueOr(value, fallback string) string {
	if value != "" {
		return value
	}
	return fallback
}
