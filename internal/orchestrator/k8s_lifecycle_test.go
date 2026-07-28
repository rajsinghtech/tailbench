//go:build k8s

package orchestrator

import (
	"context"
	"errors"
	"path/filepath"
	"strings"
	"testing"

	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/provider"
)

type missingKubeconfigProvider struct {
	failingCreateProvider
}

func (p *missingKubeconfigProvider) SetupNetworking(context.Context) (*provider.NetworkingOutput, error) {
	return &provider.NetworkingOutput{
		Values:     map[string]string{},
		StackName:  "tailbench-eks-cluster-ab12cd",
		ProviderID: "eks-cluster-ab12cd",
	}, nil
}

func TestK8sSetupFailureStopsProvisioningAndCleansNetworking(t *testing.T) {
	root := t.TempDir()
	t.Chdir(root)
	p := &missingKubeconfigProvider{
		failingCreateProvider: failingCreateProvider{
			createErr: errors.New("CreatePair must not run after workload setup fails"),
		},
	}
	recorder := &recordingStateRecorder{}
	o := &Orchestrator{
		cfg: &config.Config{
			Providers:         []string{"eks"},
			Family:            "c7i",
			Modes:             []string{"l4-kernel"},
			RootDir:           root,
			StateDir:          "file://" + filepath.Join(root, "state"),
			RunID:             "tb_2026-07-24_ab12cd",
			CleanupNetworking: true,
			CleanupPolicy:     config.CleanupAlways,
		},
		providers: []provider.Provider{p},
		recorder:  recorder,
	}

	outcome := o.RunWithOutcome(context.Background())

	if outcome.BenchmarkErr == nil ||
		!strings.Contains(outcome.BenchmarkErr.Error(), "did not return a kubeconfig") {
		t.Fatalf("benchmark error = %v, want missing kubeconfig", outcome.BenchmarkErr)
	}
	if p.createCalls != 0 {
		t.Fatalf("CreatePair calls = %d, want 0", p.createCalls)
	}
	if p.teardownCalls != 1 {
		t.Fatalf("TeardownNetworking calls = %d, want 1", p.teardownCalls)
	}
	network, ok := recorder.resource("eks/networking")
	if !ok || network.Status != runstateResourceCleaned {
		t.Fatalf("network resource = %#v, found %t; want cleaned", network, ok)
	}
}
