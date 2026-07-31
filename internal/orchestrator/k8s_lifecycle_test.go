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
	"tailscale.com/tsnet"
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

type setupAfterPairProvider struct {
	failingCreateProvider
	operatorCalls      int
	operatorSawPair    bool
	operatorConfig     provider.OperatorInstallConfig
	operatorInstallErr error
	destroyPairCalls   int
}

func (p *setupAfterPairProvider) CreatePair(context.Context, provider.PairOptions) (*provider.PairOutput, error) {
	p.createCalls++
	return &provider.PairOutput{
		StackName:  "tailbench-eks-pair-ab12cd",
		Kubeconfig: "test-kubeconfig",
		Namespace:  "tailbench",
	}, nil
}

func (p *setupAfterPairProvider) DestroyPair(context.Context, string) error {
	p.destroyPairCalls++
	return nil
}

func (p *setupAfterPairProvider) InstallOperator(_ context.Context, cfg provider.OperatorInstallConfig) error {
	p.operatorCalls++
	p.operatorSawPair = p.createCalls > 0
	p.operatorConfig = cfg
	return p.operatorInstallErr
}

func (p *setupAfterPairProvider) OperatorProxyFQDN() string {
	return ""
}

func (p *setupAfterPairProvider) SetTsnetServer(*tsnet.Server) {}

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

func TestK8sWorkloadSetupRunsAfterPairCreatesNodes(t *testing.T) {
	root := t.TempDir()
	t.Chdir(root)
	installErr := errors.New("stop after install-order assertion")
	p := &setupAfterPairProvider{
		operatorInstallErr: installErr,
	}
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
	}

	outcome := o.RunWithOutcome(context.Background())

	if outcome.BenchmarkErr == nil || !strings.Contains(outcome.BenchmarkErr.Error(), installErr.Error()) {
		t.Fatalf("benchmark error = %v, want %v", outcome.BenchmarkErr, installErr)
	}
	if p.createCalls != 1 {
		t.Fatalf("CreatePair calls = %d, want 1", p.createCalls)
	}
	if p.operatorCalls != 1 {
		t.Fatalf("InstallOperator calls = %d, want 1", p.operatorCalls)
	}
	if !p.operatorSawPair {
		t.Fatal("InstallOperator ran before CreatePair provided schedulable nodes")
	}
	if want := "tailbench-eks-operator-ab12cd"; p.operatorConfig.Hostname != want {
		t.Fatalf("operator hostname = %q, want %q", p.operatorConfig.Hostname, want)
	}
	if p.destroyPairCalls < 2 {
		t.Fatalf("DestroyPair calls = %d, want pre-cleanup and post-failure cleanup", p.destroyPairCalls)
	}
}
