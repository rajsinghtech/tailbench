package result

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/rajsinghtech/tailbench/internal/pricing"
)

const (
	forwardPPSK8SBaselineMode  = "forward-pps-exit-k8s"
	forwardPPSK8SOptimizedMode = "forward-pps-exit-k8s-opton"
)

type aggregateRecord struct {
	object map[string]json.RawMessage
	result BenchmarkResult
}

// Aggregate reads all result JSON files under {rootDir}/{gcp,aws,azure}/**/results/*.json
// and writes a combined website/data.generated.js file.
func Aggregate(rootDir string) error {
	providers := []string{"gcp", "aws", "azure", "gke", "eks", "aks"}
	var records []aggregateRecord

	for _, provider := range providers {
		providerDir := filepath.Join(rootDir, provider)
		if _, err := os.Stat(providerDir); os.IsNotExist(err) {
			continue
		}

		err := filepath.Walk(providerDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if info.IsDir() {
				return nil
			}
			if filepath.Base(filepath.Dir(path)) != "results" || !strings.HasSuffix(path, ".json") {
				return nil
			}

			data, err := os.ReadFile(path)
			if err != nil {
				return fmt.Errorf("reading %s: %w", path, err)
			}

			// Parse, inject source field, re-marshal
			var obj map[string]json.RawMessage
			if err := json.Unmarshal(data, &obj); err != nil {
				return fmt.Errorf("parsing %s: %w", path, err)
			}
			// This is an aggregate-only derived field. Never carry a stale
			// comparison forward from an input result.
			delete(obj, "forwarding_optimization")
			var benchmark BenchmarkResult
			if err := json.Unmarshal(data, &benchmark); err != nil {
				return fmt.Errorf("parsing benchmark fields in %s: %w", path, err)
			}

			rel, err := filepath.Rel(rootDir, path)
			if err != nil {
				return fmt.Errorf("computing relative path for %s: %w", path, err)
			}
			sourceJSON, _ := json.Marshal(rel)
			obj["source"] = sourceJSON

			// Inject on-demand $/hr from the curated pricing dataset so the
			// dashboard can show cost without re-running any benchmark.
			var provider, region, itype string
			_ = json.Unmarshal(obj["cloud_provider"], &provider)
			_ = json.Unmarshal(obj["region"], &region)
			_ = json.Unmarshal(obj["instance_type"], &itype)
			if price, ok := pricing.Lookup(provider, region, itype); ok {
				priceJSON, _ := json.Marshal(price)
				obj["price_per_hour"] = priceJSON
			}

			records = append(records, aggregateRecord{object: obj, result: benchmark})
			return nil
		})
		if err != nil {
			return fmt.Errorf("walking %s: %w", provider, err)
		}
	}

	if err := injectForwardingOptimizations(records); err != nil {
		return err
	}

	outDir := filepath.Join(rootDir, "website")
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return fmt.Errorf("creating website directory: %w", err)
	}

	objects := make([]map[string]json.RawMessage, 0, len(records))
	for _, record := range records {
		objects = append(objects, record.object)
	}
	indented, err := json.MarshalIndent(objects, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling aggregated results: %w", err)
	}

	content := fmt.Sprintf("const TAILBENCH_DATA = %s;\n", indented)
	outPath := filepath.Join(outDir, "data.generated.js")
	if err := os.WriteFile(outPath, []byte(content), 0o644); err != nil {
		return fmt.Errorf("writing %s: %w", outPath, err)
	}
	return nil
}

type forwardingGroupKey struct {
	cloudProvider  string
	instanceFamily string
	instanceType   string
	environment    string
}

type forwardingPair struct {
	baselineIndexes  []int
	optimizedIndexes []int
}

// injectForwardingOptimizations joins the two Kubernetes forwarding modes.
// The mode names are intentionally explicit: these independently written
// benchmark arms are the only A/B comparison currently defined by tailbench.
func injectForwardingOptimizations(records []aggregateRecord) error {
	groups := make(map[forwardingGroupKey]*forwardingPair)
	for i := range records {
		mode := records[i].result.TransportMode
		if mode != forwardPPSK8SBaselineMode && mode != forwardPPSK8SOptimizedMode {
			continue
		}

		result := records[i].result
		key := forwardingGroupKey{
			cloudProvider:  result.CloudProvider,
			instanceFamily: result.InstanceFamily,
			instanceType:   result.InstanceType,
			environment:    result.Environment,
		}
		pair := groups[key]
		if pair == nil {
			pair = &forwardingPair{}
			groups[key] = pair
		}
		if mode == forwardPPSK8SBaselineMode {
			pair.baselineIndexes = append(pair.baselineIndexes, i)
		} else {
			pair.optimizedIndexes = append(pair.optimizedIndexes, i)
		}
	}

	for _, pair := range groups {
		// Ambiguous duplicate arms and single-sided groups are left unchanged.
		if len(pair.baselineIndexes) != 1 || len(pair.optimizedIndexes) != 1 {
			continue
		}
		baseline := &records[pair.baselineIndexes[0]]
		optimized := &records[pair.optimizedIndexes[0]]
		comparison := compareForwardingOptimization(baseline.result, optimized.result)
		if comparison == nil {
			continue
		}

		comparisonJSON, err := json.Marshal(comparison)
		if err != nil {
			return fmt.Errorf("marshaling forwarding optimization comparison: %w", err)
		}
		optimized.object["forwarding_optimization"] = comparisonJSON
		optimized.result.ForwardingOptimization = comparison
	}
	return nil
}

func compareForwardingOptimization(
	baseline BenchmarkResult,
	optimized BenchmarkResult,
) *ForwardingOptimization {
	if baseline.ForwardOptimizations != "off" ||
		optimized.ForwardOptimizations != "on" ||
		baseline.ForwardPPS == nil ||
		optimized.ForwardPPS == nil {
		return nil
	}

	baselineIMIX := findPPSSize(baseline.ForwardPPS.Sizes, "imix-avg", 0)
	optimizedIMIX := findPPSSize(optimized.ForwardPPS.Sizes, "imix-avg", 0)
	if baselineIMIX == nil || optimizedIMIX == nil || baselineIMIX.UsablePPS <= 0 {
		return nil
	}

	comparison := &ForwardingOptimization{
		State:             optimized.ForwardOptimizations,
		BaselineMode:      baseline.TransportMode,
		BaselineUsablePPS: baselineIMIX.UsablePPS,
		GainPct:           forwardingGainPct(baselineIMIX.UsablePPS, optimizedIMIX.UsablePPS),
	}
	for _, optimizedSize := range optimized.ForwardPPS.Sizes {
		baselineSize := findPPSSize(
			baseline.ForwardPPS.Sizes,
			optimizedSize.Label,
			optimizedSize.DatagramBytes,
		)
		if baselineSize == nil || baselineSize.UsablePPS <= 0 {
			continue
		}
		comparison.Sizes = append(comparison.Sizes, ForwardingOptimizationSizeGain{
			Label:              optimizedSize.Label,
			DatagramBytes:      optimizedSize.DatagramBytes,
			BaselineUsablePPS:  baselineSize.UsablePPS,
			OptimizedUsablePPS: optimizedSize.UsablePPS,
			GainPct:            forwardingGainPct(baselineSize.UsablePPS, optimizedSize.UsablePPS),
		})
	}
	return comparison
}

func findPPSSize(sizes []PPSSizeResult, label string, datagramBytes int) *PPSSizeResult {
	for i := range sizes {
		if sizes[i].Label == label && (datagramBytes == 0 || sizes[i].DatagramBytes == datagramBytes) {
			return &sizes[i]
		}
	}
	return nil
}

func forwardingGainPct(baseline, optimized float64) float64 {
	return (optimized - baseline) / baseline * 100
}
