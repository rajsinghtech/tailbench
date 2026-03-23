package result

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
)

// ComputeSummary computes avg, min, max, stddev for bandwidth and avg retransmits.
func ComputeSummary(runs []IPerfRun) *IPerfSummary {
	s := &IPerfSummary{}
	n := len(runs)
	if n == 0 {
		return s
	}

	s.BandwidthMbpsMin = runs[0].BandwidthMbps
	s.BandwidthMbpsMax = runs[0].BandwidthMbps

	var sumBw, sumRetrans float64
	for _, r := range runs {
		sumBw += r.BandwidthMbps
		sumRetrans += float64(r.Retransmits)
		if r.BandwidthMbps < s.BandwidthMbpsMin {
			s.BandwidthMbpsMin = r.BandwidthMbps
		}
		if r.BandwidthMbps > s.BandwidthMbpsMax {
			s.BandwidthMbpsMax = r.BandwidthMbps
		}
	}

	s.BandwidthMbpsAvg = sumBw / float64(n)
	s.RetransmitsAvg = sumRetrans / float64(n)

	var sumSqDiff float64
	for _, r := range runs {
		d := r.BandwidthMbps - s.BandwidthMbpsAvg
		sumSqDiff += d * d
	}
	s.BandwidthMbpsStddev = math.Sqrt(sumSqDiff / float64(n))

	return s
}

// ComputeOverhead computes (baseline - tailscale) / baseline * 100.
func ComputeOverhead(baseline, tailscale float64) float64 {
	if baseline == 0 {
		return 0
	}
	return (baseline - tailscale) / baseline * 100
}

// WriteResult writes a BenchmarkResult as JSON to {rootDir}/{provider}/{family}/results/{type}.json.
// If enaExpress is true, the filename becomes {type}-ena-express.json.
func WriteResult(rootDir string, r *BenchmarkResult, enaExpress bool) error {
	dir := filepath.Join(rootDir, r.CloudProvider, r.InstanceFamily, "results")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("creating result directory: %w", err)
	}

	filename := r.InstanceType + ".json"
	if enaExpress {
		filename = r.InstanceType + "-ena-express.json"
	}

	data, err := json.MarshalIndent(r, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling result: %w", err)
	}

	path := filepath.Join(dir, filename)
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("writing result file: %w", err)
	}
	return nil
}

func ComputeL7Overhead(baseline, tailscale *FortioResult) *L7Overhead {
	o := &L7Overhead{}
	o.QPS.Baseline = baseline.QPS
	o.QPS.Tailscale = tailscale.QPS
	if baseline.QPS > 0 {
		o.QPS.DeltaPct = (tailscale.QPS - baseline.QPS) / baseline.QPS * 100
	}
	o.P50Latency.BaselineMs = baseline.P50LatencyMs
	o.P50Latency.TailscaleMs = tailscale.P50LatencyMs
	if baseline.P50LatencyMs > 0 {
		o.P50Latency.DeltaPct = (tailscale.P50LatencyMs - baseline.P50LatencyMs) / baseline.P50LatencyMs * 100
	}
	o.P99Latency.BaselineMs = baseline.P99LatencyMs
	o.P99Latency.TailscaleMs = tailscale.P99LatencyMs
	if baseline.P99LatencyMs > 0 {
		o.P99Latency.DeltaPct = (tailscale.P99LatencyMs - baseline.P99LatencyMs) / baseline.P99LatencyMs * 100
	}
	return o
}
