package benchmark

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/rajsinghtech/tailbench/internal/result"
)

type fortioOutput struct {
	ActualQPS         float64 `json:"ActualQPS"`
	DurationHistogram struct {
		Count       int     `json:"Count"`
		Avg         float64 `json:"Avg"`
		Percentiles []struct {
			Percentile float64 `json:"Percentile"`
			Value      float64 `json:"Value"`
		} `json:"Percentiles"`
	} `json:"DurationHistogram"`
	Sizes *struct {
		Count int     `json:"Count"`
		Sum   float64 `json:"Sum"`
	} `json:"Sizes"`
	HeaderSizes *struct {
		Sum float64 `json:"Sum"`
	} `json:"HeaderSizes"`
	RetCodes map[string]int `json:"RetCodes"`
}

func ParseFortioJSON(data []byte) (*result.FortioResult, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("empty fortio output")
	}
	var raw fortioOutput
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("parsing fortio json: %w", err)
	}

	r := &result.FortioResult{
		QPS:          raw.ActualQPS,
		AvgLatencyMs: raw.DurationHistogram.Avg * 1000,
		StatusCodes:  make(map[int]int),
	}

	for _, p := range raw.DurationHistogram.Percentiles {
		ms := p.Value * 1000
		switch {
		case p.Percentile == 50:
			r.P50LatencyMs = ms
		case p.Percentile == 90:
			r.P90LatencyMs = ms
		case p.Percentile == 99:
			r.P99LatencyMs = ms
		case p.Percentile >= 99.9:
			r.P999LatencyMs = ms
		}
	}

	var total int
	for code, count := range raw.RetCodes {
		var c int
		fmt.Sscanf(code, "%d", &c)
		r.StatusCodes[c] = count
		total += count
	}
	r.ConnectionErrs = total - r.StatusCodes[200]

	duration := float64(raw.DurationHistogram.Count) / raw.ActualQPS
	if duration > 0 {
		var totalBytes float64
		if raw.Sizes != nil {
			totalBytes += raw.Sizes.Sum
		}
		if raw.HeaderSizes != nil {
			totalBytes += raw.HeaderSizes.Sum
		}
		r.BytesPerSec = totalBytes / duration
	}

	return r, nil
}

func BuildFortioCmd(target string, h2 bool, connections, durationSec, qps int) string {
	cmd := fmt.Sprintf("fortio load -json /dev/stdout -qps %d -c %d -t %ds", qps, connections, durationSec)
	if h2 {
		cmd += " -h2"
	}
	if strings.HasPrefix(target, "https://") {
		cmd += " -https-insecure"
	}
	cmd += " " + target
	return cmd
}
