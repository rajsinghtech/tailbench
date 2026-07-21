//go:build !k8s

package orchestrator

import (
	"testing"

	"github.com/rajsinghtech/tailbench/internal/config"
)

func TestVMBuildRejectsKubernetesOnlyModes(t *testing.T) {
	cfg := &config.Config{Modes: []string{"l4-kernel", "l7-ingress-h2"}}
	err := validateWorkloadConfig(cfg)
	const want = "kubernetes-only benchmark mode \"l7-ingress-h2\" requires a k8s-enabled binary"
	if err == nil || err.Error() != want {
		t.Fatalf("error = %v, want %q", err, want)
	}
}
