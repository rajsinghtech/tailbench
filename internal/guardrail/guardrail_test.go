package guardrail

import (
	"bytes"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/plan"
)

func TestCheckRefusesNoninteractiveRunWithoutExplicitCostCeiling(t *testing.T) {
	decision := Check(testPlan(), &config.Config{
		Yes:                    true,
		MaxCostUSD:             10,
		MaxCostSet:             false,
		MaxDuration:            45 * time.Minute,
		MaxInstanceTypes:       2,
		MaxConcurrentResources: 1,
		CleanupPolicy:          "always",
	})

	if decision.Allowed {
		t.Fatal("noninteractive run without explicit cost ceiling was allowed")
	}
	if got, want := violationCodes(decision), []string{"noninteractive-cost-required"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("violation codes = %v, want %v", got, want)
	}
}

func TestCheckReportsInstanceAndCostLimitViolations(t *testing.T) {
	localPlan := testPlan()
	localPlan.Cost.UpperBoundUSD = 12.50
	decision := Check(localPlan, &config.Config{
		MaxCostUSD:             10,
		MaxCostSet:             true,
		MaxDuration:            45 * time.Minute,
		MaxInstanceTypes:       1,
		MaxConcurrentResources: 1,
		CleanupPolicy:          "always",
	})

	if decision.Allowed {
		t.Fatal("over-limit plan was allowed")
	}
	if got, want := violationCodes(decision), []string{"max-instance-types", "max-cost-usd"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("violation codes = %v, want %v", got, want)
	}
}

func TestCheckCountsOnlyInstanceTypesWithRunnableWork(t *testing.T) {
	localPlan := testPlan()
	localPlan.Instances[1].Modes[0].Action = plan.ActionSkipExisting
	localPlan.Cost.UpperBoundUSD = 5
	decision := Check(localPlan, &config.Config{
		MaxCostUSD:             10,
		MaxCostSet:             true,
		MaxDuration:            45 * time.Minute,
		MaxInstanceTypes:       1,
		MaxConcurrentResources: 1,
		CleanupPolicy:          "always",
	})

	if !decision.Allowed || len(decision.Violations) != 0 {
		t.Fatalf("bounded plan decision = %#v, want allowed", decision)
	}
	if decision.SelectedInstanceTypes != 1 {
		t.Fatalf("selected runnable types = %d, want 1", decision.SelectedInstanceTypes)
	}
}

func TestCheckRefusesRunWithNoRunnableWorkBeforeRuntimeConstruction(t *testing.T) {
	localPlan := testPlan()
	for instanceIndex := range localPlan.Instances {
		for modeIndex := range localPlan.Instances[instanceIndex].Modes {
			localPlan.Instances[instanceIndex].Modes[modeIndex].Action = plan.ActionSkipExisting
		}
	}
	decision := Check(localPlan, &config.Config{
		MaxCostUSD:             10,
		MaxCostSet:             true,
		MaxDuration:            45 * time.Minute,
		MaxInstanceTypes:       2,
		MaxConcurrentResources: 1,
		CleanupPolicy:          "always",
	})

	if decision.Allowed {
		t.Fatal("run with no runnable work was allowed to reach provider setup")
	}
	if got, want := violationCodes(decision), []string{"no-runnable-work"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("violation codes = %v, want %v", got, want)
	}
}

func TestCheckRefusesConfiguredModesThatDoNotApplyToWorkload(t *testing.T) {
	localPlan := testPlan()
	localPlan.ConfiguredModes = []plan.ModeSummary{
		{Name: "l4-kernel", Applicable: true},
		{Name: "l4-lb", Applicable: false, Reason: "mode does not apply to vm workloads"},
	}
	decision := Check(localPlan, &config.Config{
		MaxCostUSD:             10,
		MaxCostSet:             true,
		MaxDuration:            45 * time.Minute,
		MaxInstanceTypes:       2,
		MaxConcurrentResources: 1,
		CleanupPolicy:          "always",
	})

	if decision.Allowed {
		t.Fatal("run with a workload-incompatible mode was allowed")
	}
	if got, want := violationCodes(decision), []string{"incompatible-mode"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("violation codes = %v, want %v", got, want)
	}
	if decision.Violations[0].Message != `mode "l4-lb" does not apply to vm workloads` {
		t.Fatalf("violation = %#v", decision.Violations[0])
	}
}

func TestWriteConfirmationNamesSelectedInstancesAndModes(t *testing.T) {
	localPlan := testPlan()
	localPlan.ConfiguredModes = []plan.ModeSummary{{Name: "l4-kernel", Applicable: true}}
	cfg := &config.Config{
		MaxCostUSD:             10,
		MaxDuration:            45 * time.Minute,
		MaxInstanceTypes:       2,
		MaxConcurrentResources: 1,
		CleanupPolicy:          config.CleanupAlways,
	}
	var output bytes.Buffer

	if err := WriteConfirmation(&output, localPlan, cfg, Check(localPlan, cfg)); err != nil {
		t.Fatalf("WriteConfirmation: %v", err)
	}
	for _, want := range []string{
		"instance types: c7i.large, c7i.xlarge",
		"modes: l4-kernel",
	} {
		if !strings.Contains(output.String(), want) {
			t.Fatalf("confirmation = %q, want %q", output.String(), want)
		}
	}
}

func TestWriteConfirmationDoesNotClaimUpperBoundForRetainedResources(t *testing.T) {
	localPlan := testPlan()
	localPlan.Cost.UpperBoundAvailable = false
	localPlan.Cost.UpperBoundUSD = 0
	cfg := &config.Config{
		MaxCostUSD:             10,
		MaxDuration:            45 * time.Minute,
		MaxInstanceTypes:       2,
		MaxConcurrentResources: 1,
		CleanupPolicy:          config.CleanupManual,
	}
	var output bytes.Buffer

	if err := WriteConfirmation(&output, localPlan, cfg, Check(localPlan, cfg)); err != nil {
		t.Fatalf("WriteConfirmation: %v", err)
	}
	for _, want := range []string{
		"estimated execution-window cost: $5.00",
		"execution-window cost ceiling: $10.00",
		"lifetime cost upper bound: unavailable",
	} {
		if !strings.Contains(output.String(), want) {
			t.Fatalf("confirmation = %q, want %q", output.String(), want)
		}
	}
	if strings.Contains(output.String(), "estimated cost upper bound:") {
		t.Fatalf("confirmation claims a false upper bound: %q", output.String())
	}
}

func testPlan() *plan.Plan {
	return &plan.Plan{
		Provider: "aws",
		Workload: "vm",
		Instances: []plan.InstancePlan{
			{
				Type:  "c7i.large",
				Modes: []plan.PlannedMode{{Name: "l4-kernel", Action: plan.ActionRun}},
			},
			{
				Type:  "c7i.xlarge",
				Modes: []plan.PlannedMode{{Name: "l4-kernel", Action: plan.ActionRun}},
			},
		},
		Cost: plan.CostSummary{
			Estimate:            true,
			ExecutionWindowUSD:  5,
			UpperBoundAvailable: true,
			UpperBoundUSD:       5,
		},
	}
}

func violationCodes(decision Decision) []string {
	codes := make([]string, 0, len(decision.Violations))
	for _, violation := range decision.Violations {
		codes = append(codes, violation.Code)
	}
	return codes
}
