package benchmark

import "testing"

func TestModeValid(t *testing.T) {
	valid := []string{"tsnet-userspace", "l4-kernel", "l4-userspace", "l4-lb", "l7-ingress-h1", "l7-ingress-h2", "l7-serve-h1", "l7-serve-h2", "forward-pps-exit", "forward-pps-exit-k8s", "forward-pps-exit-k8s-opton", "relay-throughput"}
	for _, m := range valid {
		if !IsValidMode(m) {
			t.Errorf("IsValidMode(%q) = false, want true", m)
		}
	}
	if IsValidMode("invalid") {
		t.Error("IsValidMode(invalid) = true, want false")
	}
}

func TestModeEnvironment(t *testing.T) {
	k8sOnly := []string{"l4-lb", "l7-ingress-h1", "l7-ingress-h2", "forward-pps-exit-k8s", "forward-pps-exit-k8s-opton"}
	vmOnly := []string{"l7-serve-h1", "l7-serve-h2", "forward-pps-exit", "relay-throughput"}
	both := []string{"tsnet-userspace", "l4-kernel", "l4-userspace"}

	for _, m := range k8sOnly {
		if !ModeAppliesTo(m, "container") {
			t.Errorf("%s should apply to container", m)
		}
		if ModeAppliesTo(m, "vm") {
			t.Errorf("%s should NOT apply to vm", m)
		}
	}
	for _, m := range vmOnly {
		if !ModeAppliesTo(m, "vm") {
			t.Errorf("%s should apply to vm", m)
		}
		if ModeAppliesTo(m, "container") {
			t.Errorf("%s should NOT apply to container", m)
		}
	}
	for _, m := range both {
		if !ModeAppliesTo(m, "vm") || !ModeAppliesTo(m, "container") {
			t.Errorf("%s should apply to both", m)
		}
	}
}

func TestModeUsesIperf(t *testing.T) {
	if !ModeUsesIperf("l4-kernel") {
		t.Error("l4-kernel should use iperf")
	}
	if ModeUsesIperf("l7-ingress-h1") {
		t.Error("l7-ingress-h1 should NOT use iperf")
	}
}

func TestModeUsesForwardPPS(t *testing.T) {
	forward := []string{"forward-pps-exit", "forward-pps-exit-k8s", "forward-pps-exit-k8s-opton"}
	for _, m := range forward {
		if !ModeUsesForwardPPS(m) {
			t.Errorf("%s should use forward-pps", m)
		}
		if ModeUsesIperf(m) || ModeUsesFortio(m) || ModeUsesTsnet(m) {
			t.Errorf("%s should NOT use iperf/fortio/tsnet", m)
		}
	}
	notForward := []string{"l4-kernel", "l4-lb", "l7-ingress-h1", "tsnet-userspace", "forward", "pps"}
	for _, m := range notForward {
		if ModeUsesForwardPPS(m) {
			t.Errorf("%s should NOT use forward-pps", m)
		}
	}
}

func TestModeUsesRelay(t *testing.T) {
	if !ModeUsesRelay("relay-throughput") {
		t.Error("relay-throughput should use relay")
	}
	notRelay := []string{"l4-kernel", "forward-pps-exit", "forward-pps-exit-k8s", "l7-ingress-h1", "relay"}
	for _, m := range notRelay {
		if ModeUsesRelay(m) {
			t.Errorf("%s should NOT use relay", m)
		}
	}
	if ModeUsesIperf("relay-throughput") || ModeUsesFortio("relay-throughput") || ModeUsesTsnet("relay-throughput") || ModeUsesForwardPPS("relay-throughput") {
		t.Error("relay-throughput should NOT use iperf/fortio/tsnet/forward-pps")
	}
}

func TestModeIsH2(t *testing.T) {
	if !ModeIsH2("l7-ingress-h2") {
		t.Error("l7-ingress-h2 should be h2")
	}
	if ModeIsH2("l7-ingress-h1") {
		t.Error("l7-ingress-h1 should not be h2")
	}
}

func TestPPSSizeLabel(t *testing.T) {
	sizes := []int{64, 340, 1400}
	cases := map[int]string{64: "64", 340: "imix-avg", 1400: "mtu"}
	for dgram, want := range cases {
		if got := ppsSizeLabel(dgram, sizes); got != want {
			t.Errorf("ppsSizeLabel(%d, %v) = %q, want %q", dgram, sizes, got, want)
		}
	}
	// Two sizes: smallest is worst-case numeric, largest is mtu, no imix.
	if got := ppsSizeLabel(64, []int{64, 1400}); got != "64" {
		t.Errorf("ppsSizeLabel(64, [64 1400]) = %q, want \"64\"", got)
	}
	if got := ppsSizeLabel(1400, []int{64, 1400}); got != "mtu" {
		t.Errorf("ppsSizeLabel(1400, [64 1400]) = %q, want \"mtu\"", got)
	}
}
