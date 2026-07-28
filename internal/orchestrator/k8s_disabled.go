//go:build !k8s

package orchestrator

import (
	"context"
	"fmt"

	"github.com/rajsinghtech/tailbench/internal/benchmark"
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/logger"
	"github.com/rajsinghtech/tailbench/internal/provider"
	"github.com/rajsinghtech/tailbench/internal/result"
)

func validateWorkloadConfig(cfg *config.Config) error {
	for _, mode := range cfg.Modes {
		if !benchmark.ModeAppliesTo(mode, "vm") {
			return fmt.Errorf("kubernetes-only benchmark mode %q requires a k8s-enabled binary", mode)
		}
	}
	return nil
}

func (o *Orchestrator) setupK8s(context.Context, provider.Provider, *provider.NetworkingOutput, *logger.Logger) error {
	return nil
}

func discoverIngressFQDN(context.Context, string, string) string   { return "" }
func discoverServiceLBFQDN(context.Context, string, string) string { return "" }
func discoverEchoPodIP(context.Context, string, string) string     { return "" }

func (o *Orchestrator) runK8sBenchmark(context.Context, provider.Provider, *provider.PairOutput, provider.InstanceInfo, string, *logger.Logger, string, string, string) error {
	return fmt.Errorf("kubernetes benchmark execution requires a k8s-enabled binary")
}

// runForwardPPS is unreachable in !k8s builds: forward-pps modes are
// container-only (ModeAppliesTo) and validateWorkloadConfig rejects them.
func (o *Orchestrator) runForwardPPS(context.Context, *benchmark.Runner, *provider.PairOutput, string, modeContext) (*result.BenchmarkResult, error) {
	return nil, fmt.Errorf("kubernetes forwarding-pps execution requires a k8s-enabled binary")
}
