package plan

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/rajsinghtech/tailbench/internal/config"
)

type fakeCatalog struct {
	instances []CatalogInstance
	meta      CatalogMetadata
}

func (c fakeCatalog) Instances(string, string) ([]CatalogInstance, CatalogMetadata, error) {
	return append([]CatalogInstance(nil), c.instances...), c.meta, nil
}

func TestBuildLocalPlanHonorsSelectorsModesResumeAndTopology(t *testing.T) {
	root := t.TempDir()
	resultDir := filepath.Join(root, "aws", "c7i", "results")
	if err := os.MkdirAll(resultDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(resultDir, "c7i.large-l4-kernel.json"), []byte("{}"), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg := &config.Config{
		Providers:              []string{"aws"},
		Family:                 "c7i",
		Filter:                 `^c7i\.large$`,
		Modes:                  []string{"l4-kernel", "l4-lb", "forward-pps-exit"},
		RootDir:                root,
		AWSRegion:              "us-west-2",
		AWSAZ:                  "us-west-2a",
		MaxCostUSD:             10,
		MaxDuration:            45 * time.Minute,
		MaxInstanceTypes:       1,
		MaxConcurrentResources: 1,
		CleanupPolicy:          "always",
	}
	catalog := fakeCatalog{
		instances: []CatalogInstance{
			{Type: "c7i.large", Family: "c7i", VCPUs: 2, HourlyUSD: 0.08925},
			{Type: "c7i.xlarge", Family: "c7i", VCPUs: 4, HourlyUSD: 0.1785},
			{Type: "c8gn.large", Family: "c8gn", VCPUs: 2, HourlyUSD: 0.1185},
		},
		meta: CatalogMetadata{Source: "checked-in test catalog", Updated: "2026-07-24"},
	}

	got, err := Build(context.Background(), Request{
		CompiledProvider: "aws",
		Config:           cfg,
		Catalog:          catalog,
	})
	if err != nil {
		t.Fatal(err)
	}

	if got.SchemaVersion != 1 || got.Provider != "aws" || got.Workload != "vm" {
		t.Fatalf("identity = schema %d provider %q workload %q", got.SchemaVersion, got.Provider, got.Workload)
	}
	if len(got.Instances) != 1 || got.Instances[0].Type != "c7i.large" {
		t.Fatalf("instances = %#v, want only c7i.large", got.Instances)
	}
	actions := map[string]ModeAction{}
	applicable := map[string]bool{}
	for _, mode := range got.Instances[0].Modes {
		actions[mode.Name] = mode.Action
		applicable[mode.Name] = mode.Applicable
	}
	if actions["l4-kernel"] != ActionSkipExisting {
		t.Fatalf("l4-kernel action = %q, want %q", actions["l4-kernel"], ActionSkipExisting)
	}
	if applicable["l4-lb"] {
		t.Fatal("VM plan marked Kubernetes-only l4-lb applicable")
	}
	if actions["forward-pps-exit"] != ActionRun {
		t.Fatalf("forward-pps action = %q, want run", actions["forward-pps-exit"])
	}
	for _, mode := range got.Instances[0].Modes {
		if mode.Name == "forward-pps-exit" &&
			!strings.HasSuffix(mode.ResultPath, "c7i.large-forward-pps-exit.json") {
			t.Fatalf("runnable result path = %q, want deterministic target path", mode.ResultPath)
		}
	}
	if got.Resources.MaximumServers != 1 ||
		got.Resources.MaximumClients != 1 ||
		got.Resources.MaximumRouters != 1 ||
		got.Resources.MaximumComputeResources != 3 {
		t.Fatalf("resources = %#v, want VM server/client/router topology", got.Resources)
	}
	if got.Cost.DataSource != catalog.meta.Source || !got.Cost.Estimate {
		t.Fatalf("cost = %#v, want estimated checked-in source", got.Cost)
	}
	if got.Cost.MaximumHourlyUSD <= 0 {
		t.Fatalf("maximum hourly cost = %f, want positive estimate", got.Cost.MaximumHourlyUSD)
	}
	if !got.Cost.UpperBoundAvailable ||
		got.Cost.UpperBoundUSD <= 0 ||
		got.Cost.ExecutionWindowUSD != got.Cost.UpperBoundUSD ||
		got.Cost.EstimateWindow != "45m0s" {
		t.Fatalf("bounded cost = %#v, want positive 45m upper bound", got.Cost)
	}
	if got.Guardrails.MaxCostUSD != 10 ||
		got.Guardrails.MaxInstanceTypes != 1 ||
		got.Guardrails.CleanupPolicy != "always" {
		t.Fatalf("guardrails = %#v", got.Guardrails)
	}
	if strings.Contains(got.RedactedConfiguration, "secret") {
		t.Fatalf("redacted config leaked a secret: %q", got.RedactedConfiguration)
	}
}

func TestBuildDoesNotClaimLifetimeCostBoundWhenCleanupCanRetainResources(t *testing.T) {
	t.Parallel()

	for _, cleanupPolicy := range []string{
		config.CleanupOnSuccess,
		config.CleanupManual,
	} {
		t.Run(cleanupPolicy, func(t *testing.T) {
			got, err := Build(context.Background(), Request{
				CompiledProvider: "aws",
				Config: &config.Config{
					Providers:        []string{"aws"},
					Family:           "c7i",
					Modes:            []string{"l4-kernel"},
					MaxDuration:      45 * time.Minute,
					CleanupPolicy:    cleanupPolicy,
					AWSRegion:        "us-west-2",
					MaxCostUSD:       10,
					MaxInstanceTypes: 1,
				},
				Catalog: fakeCatalog{
					instances: []CatalogInstance{
						{Type: "c7i.large", Family: "c7i", HourlyUSD: 0.10},
					},
				},
			})
			if err != nil {
				t.Fatal(err)
			}
			if got.Cost.UpperBoundAvailable || got.Cost.UpperBoundUSD != 0 {
				t.Fatalf("cost = %#v, want no lifetime upper bound", got.Cost)
			}
			if got.Cost.ExecutionWindowUSD <= 0 ||
				got.Cost.EstimateWindow != "45m0s" {
				t.Fatalf("cost = %#v, want a duration-window estimate", got.Cost)
			}
			if !strings.Contains(got.Cost.UpperBoundUnavailable, "continues until cleanup succeeds") {
				t.Fatalf("unbounded reason = %q", got.Cost.UpperBoundUnavailable)
			}
		})
	}
}

func TestBuildRejectsProviderMismatchAndInvalidFilter(t *testing.T) {
	t.Parallel()

	base := &config.Config{
		Providers: []string{"gcp"},
		Family:    "c7i",
		Modes:     []string{"l4-kernel"},
	}
	_, err := Build(context.Background(), Request{
		CompiledProvider: "aws",
		Config:           base,
		Catalog:          fakeCatalog{},
	})
	if err == nil || !strings.Contains(err.Error(), `compiled for "aws"`) {
		t.Fatalf("provider mismatch error = %v", err)
	}

	cfg := *base
	cfg.Providers = []string{"aws"}
	cfg.Filter = "["
	_, err = Build(context.Background(), Request{
		CompiledProvider: "aws",
		Config:           &cfg,
		Catalog:          fakeCatalog{},
	})
	if err == nil {
		t.Fatal("invalid filter unexpectedly succeeded")
	}
	if !strings.Contains(err.Error(), "invalid instance filter") && !strings.Contains(err.Error(), "error parsing regexp") {
		t.Fatalf("invalid filter error = %v, want regex detail", err)
	}

	cfg.Filter = ""
	cfg.Providers = []string{"aws", "aws"}
	_, err = Build(context.Background(), Request{
		CompiledProvider: "aws",
		Config:           &cfg,
		Catalog:          fakeCatalog{},
	})
	if err == nil || !strings.Contains(err.Error(), "exactly one provider") {
		t.Fatalf("duplicate provider error = %v", err)
	}
}

func TestBuildRejectsUnimplementedModeBeforeProvisioning(t *testing.T) {
	t.Parallel()

	_, err := Build(context.Background(), Request{
		CompiledProvider: "aws",
		Config: &config.Config{
			Providers: []string{"aws"},
			Family:    "c7i",
			Modes:     []string{"tsnet-userspace"},
		},
		Catalog: fakeCatalog{},
	})

	if err == nil ||
		!strings.Contains(err.Error(), "tsnet-userspace") ||
		!strings.Contains(err.Error(), "not implemented") {
		t.Fatalf("Build error = %v, want unimplemented-mode diagnostic", err)
	}
}

func TestBuildKubernetesPlanShowsClusterImplications(t *testing.T) {
	t.Parallel()

	got, err := Build(context.Background(), Request{
		CompiledProvider: "eks",
		Config: &config.Config{
			Providers: []string{"eks"},
			Family:    "c7i",
			Modes:     []string{"l4-kernel", "l7-ingress-h1"},
			AWSRegion: "us-west-2",
		},
		Catalog: fakeCatalog{
			instances: []CatalogInstance{{Type: "c7i.large", Family: "c7i", VCPUs: 2, HourlyUSD: 0.08925}},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	if got.Workload != "kubernetes" {
		t.Fatalf("workload = %q, want kubernetes", got.Workload)
	}
	if got.Resources.MaximumClusters != 1 ||
		got.Resources.MaximumNodePools != 1 ||
		got.Resources.MaximumLoadBalancers != 1 {
		t.Fatalf("resources = %#v, want cluster/node-pool/load-balancer implications", got.Resources)
	}
}

func TestBuildAndRenderPlanAreSideEffectFreeAndSerializable(t *testing.T) {
	root := t.TempDir()
	configPath := filepath.Join(root, "config.yaml")
	if err := os.WriteFile(configPath, []byte("sentinel"), 0o600); err != nil {
		t.Fatal(err)
	}
	before, err := os.ReadDir(root)
	if err != nil {
		t.Fatal(err)
	}

	got, err := Build(context.Background(), Request{
		CompiledProvider: "gcp",
		Config: &config.Config{
			Providers: []string{"gcp"},
			Family:    "c4",
			Modes:     []string{"l4-kernel"},
			RootDir:   root,
			GCPZone:   "us-central1-a",
		},
		Catalog: fakeCatalog{
			instances: []CatalogInstance{{Type: "c4-standard-2", Family: "c4", VCPUs: 2, HourlyUSD: 0.09842}},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	var text bytes.Buffer
	if err := got.WriteText(&text); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(text.String(), "SIDE EFFECTS: none") {
		t.Fatalf("text plan = %q, want side-effect declaration", text.String())
	}
	if _, err := json.Marshal(got); err != nil {
		t.Fatalf("marshal plan: %v", err)
	}

	after, err := os.ReadDir(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(after) != len(before) {
		t.Fatalf("plan changed root entries: before=%v after=%v", before, after)
	}
	for _, forbidden := range []string{".tailbench", "state"} {
		if _, err := os.Stat(filepath.Join(root, forbidden)); !os.IsNotExist(err) {
			t.Fatalf("plan created %s: %v", forbidden, err)
		}
	}
}

// --family takes the group-wide selector ListFamilies offers. On Azure that is
// not the per-size family used for result paths, so an exact match against
// Family alone selected nothing and the guardrails refused the run as
// "no-runnable-work".
func TestFamilySelectorAcceptsGroupWideValue(t *testing.T) {
	instances := []CatalogInstance{
		{Type: "Standard_D2s_v4", Family: "d2sv4", FamilyGroup: "dsv4", VCPUs: 2},
		{Type: "Standard_D4s_v4", Family: "d4sv4", FamilyGroup: "dsv4", VCPUs: 4},
		{Type: "Standard_F16s_v2", Family: "f16sv2", FamilyGroup: "fsv2", VCPUs: 16},
	}

	selected := selectInstances(instances, "dsv4", nil)
	if len(selected) != 2 {
		t.Fatalf("--family dsv4 selected %d instances, want 2: %+v", len(selected), selected)
	}
	for _, instance := range selected {
		if instance.FamilyGroup != "dsv4" {
			t.Fatalf("selected %q with group %q, want group dsv4", instance.Type, instance.FamilyGroup)
		}
	}

	// A per-size Azure family name is NOT a valid --family selector: provider
	// discovery rejects it with "unknown azure family". Matching nothing here
	// turns that into an early no-runnable-work refusal instead of a failure
	// after provisioning has begun. --filter selects a single size.
	if narrow := selectInstances(instances, "d4sv4", nil); len(narrow) != 0 {
		t.Fatalf("--family d4sv4 = %+v, want no matches (use --filter for one size)", narrow)
	}
}

// The catalog must derive both values from internal/provider so the plan and the
// orchestrator cannot disagree about which family an instance belongs to.
func TestCatalogPopulatesBothFamilyValues(t *testing.T) {
	instances, _, err := PricingCatalog{}.Instances("azure", "eastus")
	if err != nil {
		t.Fatalf("catalog: %v", err)
	}
	if len(instances) == 0 {
		t.Skip("no azure entries in the checked-in catalog")
	}
	for _, instance := range instances {
		if instance.Family == "" || instance.FamilyGroup == "" {
			t.Fatalf("%q has Family=%q FamilyGroup=%q; both are required",
				instance.Type, instance.Family, instance.FamilyGroup)
		}
		if instance.Family == instance.FamilyGroup {
			t.Fatalf("%q: Azure family %q must differ from group %q",
				instance.Type, instance.Family, instance.FamilyGroup)
		}
	}
}
