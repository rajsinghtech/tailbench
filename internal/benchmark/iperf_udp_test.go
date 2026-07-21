package benchmark

import (
	"math"
	"testing"
)

func TestParseIPerfUDPJSON(t *testing.T) {
	const out = `{
	  "end": {
	    "sum": {
	      "start": 0,
	      "end": 15.0,
	      "seconds": 15.0,
	      "bytes": 96000000,
	      "bits_per_second": 51200000,
	      "jitter_ms": 0.042,
	      "lost_packets": 120,
	      "packets": 100000,
	      "lost_percent": 0.12,
	      "sender": false
	    }
	  }
	}`
	s, err := ParseIPerfUDPJSON([]byte(out))
	if err != nil {
		t.Fatalf("ParseIPerfUDPJSON: %v", err)
	}
	if s.Packets != 100000 {
		t.Errorf("Packets = %d, want 100000", s.Packets)
	}
	if s.LostPackets != 120 {
		t.Errorf("LostPackets = %d, want 120", s.LostPackets)
	}
	if math.Abs(s.LossPct-0.12) > 1e-9 {
		t.Errorf("LossPct = %v, want 0.12", s.LossPct)
	}
	if math.Abs(s.JitterMs-0.042) > 1e-9 {
		t.Errorf("JitterMs = %v, want 0.042", s.JitterMs)
	}
	// usable pps = packets / seconds
	if pps := float64(s.Packets) / s.Seconds; math.Abs(pps-6666.666) > 0.01 {
		t.Errorf("derived pps = %v, want ~6666.67", pps)
	}
}

func TestParseIPerfUDPJSONError(t *testing.T) {
	if _, err := ParseIPerfUDPJSON([]byte(`{"error":"unable to connect"}`)); err == nil {
		t.Fatal("expected error for iperf3 error output")
	}
}
