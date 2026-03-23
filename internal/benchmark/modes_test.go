package benchmark

import "testing"

func TestModeValid(t *testing.T) {
	valid := []string{"tsnet-userspace", "l4-kernel", "l4-userspace", "l4-lb", "l7-ingress-h1", "l7-ingress-h2", "l7-serve-h1", "l7-serve-h2"}
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
	k8sOnly := []string{"l4-lb", "l7-ingress-h1", "l7-ingress-h2"}
	vmOnly := []string{"l7-serve-h1", "l7-serve-h2"}
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

func TestModeIsH2(t *testing.T) {
	if !ModeIsH2("l7-ingress-h2") {
		t.Error("l7-ingress-h2 should be h2")
	}
	if ModeIsH2("l7-ingress-h1") {
		t.Error("l7-ingress-h1 should not be h2")
	}
}
