package benchmark

import (
	"encoding/json"
	"fmt"

	"github.com/rajsinghtech/tailbench/internal/result"
)

const IPerfPort = 15201

// ParseIPerfJSON parses iperf3 JSON output (from -J flag) into an IPerfRun.
func ParseIPerfJSON(data []byte) (*result.IPerfRun, error) {
	var raw struct {
		End struct {
			SumSent struct {
				BitsPerSecond float64 `json:"bits_per_second"`
				Retransmits   int     `json:"retransmits"`
				Seconds       float64 `json:"seconds"`
				Bytes         int64   `json:"bytes"`
			} `json:"sum_sent"`
		} `json:"end"`
		Error string `json:"error"`
	}
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("parsing iperf3 json: %w", err)
	}
	if raw.Error != "" {
		return nil, fmt.Errorf("iperf3 error: %s", raw.Error)
	}
	return &result.IPerfRun{
		BandwidthMbps:    raw.End.SumSent.BitsPerSecond / 1e6,
		Retransmits:      raw.End.SumSent.Retransmits,
		DurationSec:      raw.End.SumSent.Seconds,
		BytesTransferred: raw.End.SumSent.Bytes,
	}, nil
}

// UDPStats is the parsed summary of an iperf3 UDP run (from end.sum). These are
// datagram-level counters measured at the socket layer, so they are unaffected
// by NIC GRO/GSO offloads (unlike wire-frame counters).
type UDPStats struct {
	Packets     int64
	LostPackets int64
	LossPct     float64
	JitterMs    float64
	BitsPerSec  float64
	Seconds     float64
	Bytes       int64
}

// ParseIPerfUDPJSON parses iperf3 UDP JSON output (from -u -J) into UDPStats.
func ParseIPerfUDPJSON(data []byte) (*UDPStats, error) {
	var raw struct {
		End struct {
			Sum struct {
				Packets       int64   `json:"packets"`
				LostPackets   int64   `json:"lost_packets"`
				LostPercent   float64 `json:"lost_percent"`
				JitterMs      float64 `json:"jitter_ms"`
				BitsPerSecond float64 `json:"bits_per_second"`
				Seconds       float64 `json:"seconds"`
				Bytes         int64   `json:"bytes"`
			} `json:"sum"`
		} `json:"end"`
		Error string `json:"error"`
	}
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("parsing iperf3 udp json: %w", err)
	}
	if raw.Error != "" {
		return nil, fmt.Errorf("iperf3 error: %s", raw.Error)
	}
	s := raw.End.Sum
	return &UDPStats{
		Packets:     s.Packets,
		LostPackets: s.LostPackets,
		LossPct:     s.LostPercent,
		JitterMs:    s.JitterMs,
		BitsPerSec:  s.BitsPerSecond,
		Seconds:     s.Seconds,
		Bytes:       s.Bytes,
	}, nil
}

// IPerfError checks whether iperf3 JSON output contains an error field
// and returns it. Returns nil if no error is present.
func IPerfError(data []byte) error {
	var raw struct {
		Error string `json:"error"`
	}
	if err := json.Unmarshal(data, &raw); err != nil {
		return fmt.Errorf("parsing iperf3 json: %w", err)
	}
	if raw.Error != "" {
		return fmt.Errorf("iperf3: %s", raw.Error)
	}
	return nil
}
