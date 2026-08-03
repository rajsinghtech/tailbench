// Package guardrail evaluates a local plan before credentials are loaded or
// any execution-side component is constructed.
package guardrail

import (
	"fmt"
	"io"
	"sort"
	"strings"

	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/plan"
)

type Violation struct {
	Code        string `json:"code"`
	Message     string `json:"message"`
	Remediation string `json:"remediation"`
}

type Decision struct {
	Allowed               bool        `json:"allowed"`
	SelectedInstanceTypes int         `json:"selected_instance_types"`
	EstimatedWindowUSD    float64     `json:"estimated_window_usd,omitempty"`
	EstimatedUpperUSD     float64     `json:"estimated_upper_usd,omitempty"`
	Violations            []Violation `json:"violations,omitempty"`
}

func Check(localPlan *plan.Plan, cfg *config.Config) Decision {
	decision := Decision{}
	if localPlan == nil || cfg == nil {
		decision.Violations = append(decision.Violations, Violation{
			Code:        "guardrail-input",
			Message:     "a local plan and effective configuration are required",
			Remediation: "rebuild the local plan before requesting execution",
		})
		return decision
	}

	decision.SelectedInstanceTypes = runnableInstanceTypes(localPlan)
	decision.EstimatedWindowUSD = localPlan.Cost.ExecutionWindowUSD
	if localPlan.Cost.UpperBoundAvailable {
		decision.EstimatedUpperUSD = localPlan.Cost.UpperBoundUSD
	}
	if decision.SelectedInstanceTypes == 0 {
		decision.Violations = append(decision.Violations, Violation{
			Code:        "no-runnable-work",
			Message:     "the local plan has no instance types with pending applicable work",
			Remediation: "adjust --family/--filter/modes or use results to inspect existing output",
		})
	}
	for _, mode := range localPlan.ConfiguredModes {
		if mode.Applicable {
			continue
		}
		message := mode.Reason
		if message == "" {
			message = fmt.Sprintf("does not apply to %s workloads", localPlan.Workload)
		}
		message = strings.TrimPrefix(message, "mode ")
		decision.Violations = append(decision.Violations, Violation{
			Code:        "incompatible-mode",
			Message:     fmt.Sprintf("mode %q %s", mode.Name, message),
			Remediation: "remove the incompatible mode or choose the matching VM/Kubernetes binary",
		})
	}
	if cfg.Yes && !cfg.MaxCostSet {
		decision.Violations = append(decision.Violations, Violation{
			Code:        "noninteractive-cost-required",
			Message:     "--yes requires an explicitly configured --max-cost-usd ceiling",
			Remediation: "set --max-cost-usd to an approved positive amount",
		})
	}
	if decision.SelectedInstanceTypes > cfg.MaxInstanceTypes {
		decision.Violations = append(decision.Violations, Violation{
			Code: "max-instance-types",
			Message: fmt.Sprintf(
				"plan has %d instance types with pending work; limit is %d",
				decision.SelectedInstanceTypes,
				cfg.MaxInstanceTypes,
			),
			Remediation: "narrow --family/--filter or explicitly raise --max-instance-types",
		})
	}
	if decision.SelectedInstanceTypes > 0 && !localPlan.Cost.Estimate {
		decision.Violations = append(decision.Violations, Violation{
			Code:        "cost-estimate-unavailable",
			Message:     "the selected work has no enforceable local cost estimate",
			Remediation: "select priced instance types or use a reviewed remote plan before running",
		})
	} else if guardrailCost(localPlan.Cost) > cfg.MaxCostUSD {
		estimateKind := "estimated upper bound"
		remediation := "reduce duration/selection or explicitly raise --max-cost-usd"
		if !localPlan.Cost.UpperBoundAvailable {
			estimateKind = "estimated execution-window cost"
			remediation = "reduce duration/selection, explicitly raise --max-cost-usd, or use cleanup_policy always for a bounded estimate"
		}
		decision.Violations = append(decision.Violations, Violation{
			Code: "max-cost-usd",
			Message: fmt.Sprintf(
				"%s $%.2f exceeds the configured $%.2f ceiling",
				estimateKind,
				guardrailCost(localPlan.Cost),
				cfg.MaxCostUSD,
			),
			Remediation: remediation,
		})
	}
	if cfg.MaxConcurrentResources < 1 {
		decision.Violations = append(decision.Violations, Violation{
			Code:        "max-concurrent-resources",
			Message:     "the concurrency limit must allow one benchmark topology",
			Remediation: "set --max-concurrent-resources to at least 1",
		})
	}
	switch cfg.CleanupPolicy {
	case config.CleanupAlways, config.CleanupOnSuccess, config.CleanupManual:
	default:
		decision.Violations = append(decision.Violations, Violation{
			Code:        "cleanup-policy",
			Message:     fmt.Sprintf("cleanup policy %q is invalid", cfg.CleanupPolicy),
			Remediation: "use always, on-success, or manual",
		})
	}

	decision.Allowed = len(decision.Violations) == 0
	return decision
}

func WriteConfirmation(dst io.Writer, localPlan *plan.Plan, cfg *config.Config, decision Decision) error {
	if localPlan == nil || cfg == nil {
		return fmt.Errorf("local plan and configuration are required")
	}
	if _, err := fmt.Fprintln(dst, "TAILBENCH EXECUTION CONFIRMATION"); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(
		dst,
		"provider: %s\nworkload: %s\nregion: %s\n",
		localPlan.Provider,
		localPlan.Workload,
		localPlan.Region,
	); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(
		dst,
		"pending instance types: %d (limit %d)\n",
		decision.SelectedInstanceTypes,
		cfg.MaxInstanceTypes,
	); err != nil {
		return err
	}
	instanceTypes, modes := selectedWork(localPlan)
	if _, err := fmt.Fprintf(
		dst,
		"instance types: %s\nmodes: %s\n",
		strings.Join(instanceTypes, ", "),
		strings.Join(modes, ", "),
	); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(
		dst,
		"maximum topology: compute=%d clusters=%d load-balancers=%d\n",
		localPlan.Resources.MaximumComputeResources,
		localPlan.Resources.MaximumClusters,
		localPlan.Resources.MaximumLoadBalancers,
	); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "duration limit: %s\n", cfg.MaxDuration); err != nil {
		return err
	}
	if localPlan.Cost.UpperBoundAvailable {
		if _, err := fmt.Fprintf(
			dst,
			"estimated cost upper bound: $%.2f\ncost ceiling: $%.2f\n",
			localPlan.Cost.UpperBoundUSD,
			cfg.MaxCostUSD,
		); err != nil {
			return err
		}
	} else {
		if _, err := fmt.Fprintf(
			dst,
			"estimated execution-window cost: $%.2f\nexecution-window cost ceiling: $%.2f\nlifetime cost upper bound: unavailable\n",
			localPlan.Cost.ExecutionWindowUSD,
			cfg.MaxCostUSD,
		); err != nil {
			return err
		}
	}
	if _, err := fmt.Fprintf(dst, "cleanup policy: %s\n", cfg.CleanupPolicy); err != nil {
		return err
	}
	_, err := fmt.Fprint(dst, "Proceed? [y/N]: ")
	return err
}

func guardrailCost(cost plan.CostSummary) float64 {
	if cost.UpperBoundAvailable {
		return cost.UpperBoundUSD
	}
	return cost.ExecutionWindowUSD
}

func runnableInstanceTypes(localPlan *plan.Plan) int {
	count := 0
	for _, instance := range localPlan.Instances {
		for _, mode := range instance.Modes {
			if mode.Action == plan.ActionRun {
				count++
				break
			}
		}
	}
	return count
}

func selectedWork(localPlan *plan.Plan) ([]string, []string) {
	instanceSet := map[string]struct{}{}
	modeSet := map[string]struct{}{}
	for _, instance := range localPlan.Instances {
		for _, mode := range instance.Modes {
			if mode.Action != plan.ActionRun {
				continue
			}
			instanceSet[instance.Type] = struct{}{}
			modeSet[mode.Name] = struct{}{}
		}
	}
	instanceTypes := make([]string, 0, len(instanceSet))
	for instanceType := range instanceSet {
		instanceTypes = append(instanceTypes, instanceType)
	}
	modes := make([]string, 0, len(modeSet))
	for mode := range modeSet {
		modes = append(modes, mode)
	}
	sort.Strings(instanceTypes)
	sort.Strings(modes)
	return instanceTypes, modes
}
