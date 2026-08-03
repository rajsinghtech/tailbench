package benchmark

import "testing"

func TestUsableUDPResultRejectsInvalidReceiverCounters(t *testing.T) {
	tests := []struct {
		name  string
		stats *UDPStats
	}{
		{name: "nil"},
		{name: "zero packets", stats: &UDPStats{Seconds: 15}},
		{name: "zero seconds", stats: &UDPStats{Packets: 100}},
		{name: "more lost than packets", stats: &UDPStats{Seconds: 15, Packets: 100, LostPackets: 101, LossPct: 101}},
		{name: "loss over 100 percent", stats: &UDPStats{Seconds: 15, Packets: 100, LossPct: 101}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got, ok := usableUDPResult(tt.stats); ok || got != 0 {
				t.Fatalf("usableUDPResult(%#v) = (%v, %t), want (0, false)", tt.stats, got, ok)
			}
		})
	}
}

func TestUsableUDPResult(t *testing.T) {
	got, ok := usableUDPResult(&UDPStats{
		Seconds:     10,
		Packets:     1000,
		LostPackets: 10,
		LossPct:     1,
	})
	if !ok {
		t.Fatal("valid receiver counters were rejected")
	}
	if got != 99 {
		t.Fatalf("usable pps = %v, want 99", got)
	}
}
