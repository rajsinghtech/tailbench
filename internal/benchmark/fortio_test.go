package benchmark

import (
	"os"
	"testing"
)

func TestParseFortioJSON(t *testing.T) {
	data, err := os.ReadFile("../../testdata/fortio_output_h1.json")
	if err != nil {
		t.Fatal(err)
	}
	r, err := ParseFortioJSON(data)
	if err != nil {
		t.Fatal(err)
	}
	if r.QPS < 12000 || r.QPS > 13000 {
		t.Errorf("QPS = %f, want ~12450", r.QPS)
	}
	if r.P50LatencyMs < 1.0 || r.P50LatencyMs > 1.5 {
		t.Errorf("P50 = %f, want ~1.2", r.P50LatencyMs)
	}
	if r.P99LatencyMs < 7.0 || r.P99LatencyMs > 9.0 {
		t.Errorf("P99 = %f, want ~8.1", r.P99LatencyMs)
	}
	if r.StatusCodes[200] != 373515 {
		t.Errorf("200 count = %d, want 373515", r.StatusCodes[200])
	}
	if r.ConnectionErrs != 0 {
		t.Errorf("ConnectionErrs = %d, want 0", r.ConnectionErrs)
	}
}

func TestParseFortioJSONWithErrors(t *testing.T) {
	data, err := os.ReadFile("../../testdata/fortio_output_error.json")
	if err != nil {
		t.Fatal(err)
	}
	r, err := ParseFortioJSON(data)
	if err != nil {
		t.Fatal(err)
	}
	if r.StatusCodes[502] != 1006 {
		t.Errorf("502 count = %d, want 1006", r.StatusCodes[502])
	}
	if r.ConnectionErrs != 1006 {
		t.Errorf("ConnectionErrs = %d, want 1006", r.ConnectionErrs)
	}
}

func TestParseFortioJSONMalformed(t *testing.T) {
	_, err := ParseFortioJSON([]byte("not json"))
	if err == nil {
		t.Error("expected error for malformed JSON")
	}
	_, err = ParseFortioJSON([]byte(""))
	if err == nil {
		t.Error("expected error for empty input")
	}
}

func TestBuildFortioCmd(t *testing.T) {
	tests := []struct {
		name     string
		target   string
		h2       bool
		conns    int
		duration int
		qps      int
		want     string
	}{
		{
			name: "h1 max throughput",
			target: "https://bench-echo.ts.net", h2: false, conns: 16, duration: 30, qps: 0,
			want: "fortio load -json /dev/stdout -qps 0 -c 16 -t 30s https://bench-echo.ts.net",
		},
		{
			name: "h2 max throughput",
			target: "https://bench-echo.ts.net", h2: true, conns: 16, duration: 30, qps: 0,
			want: "fortio load -json /dev/stdout -qps 0 -c 16 -t 30s -h2 https://bench-echo.ts.net",
		},
		{
			name: "fixed qps",
			target: "http://10.0.0.5:8080", h2: false, conns: 8, duration: 10, qps: 1000,
			want: "fortio load -json /dev/stdout -qps 1000 -c 8 -t 10s http://10.0.0.5:8080",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := BuildFortioCmd(tt.target, tt.h2, tt.conns, tt.duration, tt.qps)
			if got != tt.want {
				t.Errorf("got:\n  %s\nwant:\n  %s", got, tt.want)
			}
		})
	}
}
