//go:build !k8s

package orchestrator

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/rajsinghtech/tailbench/internal/config"
	"gopkg.in/yaml.v3"
)

func TestVMBuildRejectsKubernetesOnlyModes(t *testing.T) {
	cfg := &config.Config{Modes: []string{"l4-kernel", "l7-ingress-h2"}}
	err := validateWorkloadConfig(cfg)
	const want = "kubernetes-only benchmark mode \"l7-ingress-h2\" requires a k8s-enabled binary"
	if err == nil || err.Error() != want {
		t.Fatalf("error = %v, want %q", err, want)
	}
}

func TestCheckedInConfigSupportsVMBuild(t *testing.T) {
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
	if err := validateWorkloadConfig(&config.Config{Modes: checkedIn.Benchmark.Modes}); err != nil {
		t.Fatalf("checked-in config must work with VM binaries: %v", err)
	}
}
