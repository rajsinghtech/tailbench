//go:build k8s

package orchestrator

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/rajsinghtech/tailbench/internal/config"
	"gopkg.in/yaml.v3"
)

// Mirrors TestVMBuildRejectsKubernetesOnlyModes on the VM side. A VM-only mode
// must fail at startup rather than provisioning a cluster that measures only the
// modes that happen to apply.
func TestK8sBuildRejectsVMOnlyModes(t *testing.T) {
	cfg := &config.Config{Modes: []string{"l4-kernel", "l7-serve-h1"}}

	err := validateWorkloadConfig(cfg)
	const want = "vm-only benchmark mode \"l7-serve-h1\" requires a VM binary"
	if err == nil || err.Error() != want {
		t.Fatalf("error = %v, want %q", err, want)
	}
}

func TestK8sBuildAcceptsContainerModes(t *testing.T) {
	cfg := &config.Config{Modes: []string{"l4-kernel", "l4-lb", "l7-ingress-h1", "forward-pps-exit-k8s"}}
	if err := validateWorkloadConfig(cfg); err != nil {
		t.Fatalf("container mode list must be accepted, got: %v", err)
	}
}

// The checked-in config.yaml is VM-oriented, so it is deliberately NOT usable
// with a Kubernetes binary — the guardrail layer refuses it too
// (`incompatible-mode`). `init` generates the portable list instead. Asserting
// this keeps the constraint visible rather than letting it surface as a
// mid-run surprise.
func TestCheckedInConfigIsVMOrientedAndRejectedHere(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("..", "..", "config.yaml"))
	if err != nil {
		t.Fatalf("read checked-in config: %v", err)
	}
	var checkedIn struct {
		Benchmark struct {
			Modes []string `yaml:"modes"`
		} `yaml:"benchmark"`
	}
	if err := yaml.Unmarshal(data, &checkedIn); err != nil {
		t.Fatalf("parse checked-in config: %v", err)
	}

	err = validateWorkloadConfig(&config.Config{Modes: checkedIn.Benchmark.Modes})
	if err == nil {
		t.Fatal("checked-in config.yaml lists l7-serve-*, which this binary cannot run; " +
			"if it became portable, update this test and the runbooks")
	}
	if !strings.Contains(err.Error(), "vm-only benchmark mode") {
		t.Fatalf("error = %v, want a vm-only mode rejection", err)
	}
}

// Cluster-side setup must key on work that can actually run here, or a VM-only
// fortio mode deploys L7 manifests for a benchmark that never executes.
func TestClusterSetupGatesIgnoreInapplicableModes(t *testing.T) {
	for name, tc := range map[string]struct {
		modes   []string
		wantL7  bool
		wantPPS bool
	}{
		"vm-only fortio mode":     {modes: []string{"l7-serve-h1"}},
		"container fortio mode":   {modes: []string{"l7-ingress-h1"}, wantL7: true},
		"load balancer mode":      {modes: []string{"l4-lb"}, wantL7: true},
		"vm-only forwarding mode": {modes: []string{"forward-pps-exit"}},
		"container forwarding":    {modes: []string{"forward-pps-exit-k8s"}, wantPPS: true},
		"plain l4":                {modes: []string{"l4-kernel"}},
	} {
		t.Run(name, func(t *testing.T) {
			if got := hasL7Modes(tc.modes); got != tc.wantL7 {
				t.Fatalf("hasL7Modes(%v) = %t, want %t", tc.modes, got, tc.wantL7)
			}
			if got := hasForwardPPSModes(tc.modes); got != tc.wantPPS {
				t.Fatalf("hasForwardPPSModes(%v) = %t, want %t", tc.modes, got, tc.wantPPS)
			}
		})
	}
}
