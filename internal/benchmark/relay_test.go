package benchmark

import (
	"context"
	"strings"
	"testing"

	"github.com/rajsinghtech/tailbench/internal/logger"
)

func testLogger() *logger.Logger {
	return logger.New("test")
}

type fakePingExecutor struct {
	pingStdout string
}

func (f *fakePingExecutor) Run(_ context.Context, cmd string) (string, string, error) {
	if strings.HasPrefix(cmd, "tailscale ping") {
		return f.pingStdout, "", nil
	}
	return "", "", nil
}
func (f *fakePingExecutor) Close() error { return nil }

func TestRunRelayPathStateMismatch(t *testing.T) {
	r := &Runner{Log: testLogger()}
	client := &fakePingExecutor{pingStdout: "pong from x (1.2.3.4) via DERP(nyc) in 50ms"}
	server := &fakePingExecutor{}
	_, err := r.RunRelayPath(context.Background(), client, server, "100.0.0.1", "direct")
	if err == nil {
		t.Fatal("expected an error when the confirmed path doesn't match wantPath")
	}
}

func TestParsePingPath(t *testing.T) {
	cases := []struct {
		name   string
		stdout string
		want   string
		wantOK bool
	}{
		{
			name:   "direct",
			stdout: "pong from another-device (100.113.160.82) via 140.82.13.138:41641 in 35ms",
			want:   "direct",
			wantOK: true,
		},
		{
			name:   "derp",
			stdout: "pong from another-device (100.104.93.78) via DERP(tor) in 53ms\ndirect connection not established",
			want:   "derp",
			wantOK: true,
		},
		{
			name:   "peer-relay",
			stdout: "pong from another-device (100.97.143.93) via peer-relay(192.168.64.2:7777:vni:1) in 4ms\ndirect connection not established",
			want:   "peer-relay",
			wantOK: true,
		},
		{
			name:   "no pong yet",
			stdout: "direct connection not established",
			want:   "",
			wantOK: false,
		},
		{
			name:   "empty",
			stdout: "",
			want:   "",
			wantOK: false,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := parsePingPath(tc.stdout)
			if ok != tc.wantOK {
				t.Fatalf("parsePingPath(%q) ok = %v, want %v", tc.stdout, ok, tc.wantOK)
			}
			if got != tc.want {
				t.Errorf("parsePingPath(%q) = %q, want %q", tc.stdout, got, tc.want)
			}
		})
	}
}

func TestParsePingLatencyMs(t *testing.T) {
	ms, ok := parsePingLatencyMs("pong from another-device (100.97.143.93) via peer-relay(192.168.64.2:7777:vni:1) in 4ms")
	if !ok {
		t.Fatal("expected ok = true")
	}
	if ms != 4 {
		t.Errorf("latency = %v, want 4", ms)
	}

	if _, ok := parsePingLatencyMs("no match here"); ok {
		t.Error("expected ok = false for unmatched input")
	}

	ms2, ok2 := parsePingLatencyMs("pong from x (1.2.3.4) via DERP(nyc) in 130.5ms")
	if !ok2 || ms2 != 130.5 {
		t.Errorf("parsePingLatencyMs fractional = (%v, %v), want (130.5, true)", ms2, ok2)
	}
}
