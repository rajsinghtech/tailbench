//go:build k8s

package orchestrator

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"sync/atomic"
	"time"

	"github.com/rajsinghtech/tailbench/internal/benchmark"
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/k8s"
	"github.com/rajsinghtech/tailbench/internal/logger"
	"github.com/rajsinghtech/tailbench/internal/provider"
	"github.com/rajsinghtech/tailbench/internal/result"
)

// validateWorkloadConfig rejects VM-only modes, mirroring the VM build's
// rejection of Kubernetes-only modes (k8s_disabled.go).
//
// This was previously `return nil`, which let a VM-oriented mode list provision
// a cluster and silently measure only the modes that happened to apply. The
// strictness matches the guardrail layer, which already refuses a run whose plan
// contains any non-applicable mode (`incompatible-mode` in
// internal/guardrail/guardrail.go). Keeping all three layers — plan, guardrail,
// orchestrator — on one policy is what stops them contradicting each other;
// notably `resume` bypasses the guardrail, so without this check a VM-only mode
// list could still reach the orchestrator.
func validateWorkloadConfig(cfg *config.Config) error {
	for _, mode := range cfg.Modes {
		if !benchmark.ModeAppliesTo(mode, "container") {
			return fmt.Errorf("vm-only benchmark mode %q requires a VM binary", mode)
		}
	}
	return nil
}

// Both helpers gate cluster-side setup, so they must ignore modes that cannot
// run here. Without the applicability check, a VM-only fortio mode such as
// l7-serve-h1 deployed the L7 bench manifests for a benchmark that never ran.
func hasL7Modes(modes []string) bool {
	for _, mode := range modes {
		if benchmark.ModeUsesFortio(mode) && benchmark.ModeAppliesTo(mode, "container") {
			return true
		}
	}
	return false
}

func hasForwardPPSModes(modes []string) bool {
	for _, mode := range modes {
		if benchmark.ModeUsesForwardPPS(mode) && benchmark.ModeAppliesTo(mode, "container") {
			return true
		}
	}
	return false
}

func operatorHostname(providerName, runID string) string {
	hostname := fmt.Sprintf("tailbench-%s-operator", providerName)
	if index := strings.LastIndex(runID, "_"); index >= 0 && index+1 < len(runID) {
		hostname += "-" + runID[index+1:]
	}
	return hostname
}

func (o *Orchestrator) setupK8s(ctx context.Context, p provider.Provider, net *provider.NetworkingOutput, lg *logger.Logger) error {
	var setupErrors []error
	if kop, ok := p.(provider.K8sOperatorProvider); ok {
		lg.Step("setup", "Tailscale operator")
		if err := kop.InstallOperator(ctx, provider.OperatorInstallConfig{
			OAuthClientID:     o.cfg.OAuthClientID,
			OAuthClientSecret: o.cfg.OAuthClientSecret,
			Hostname:          operatorHostname(p.Name(), o.cfg.RunID),
			Tag:               o.cfg.Tag,
			TailnetDNS:        o.tailnetDNS,
			TsnetSrv:          o.tsnetSrv,
			ForceReinstall:    o.cfg.CleanupNetworking,
		}); err != nil {
			lg.Warnf("operator install: %v (L7 modes may not work)", err)
			setupErrors = append(setupErrors, fmt.Errorf("install Tailscale operator: %w", err))
		}
	}

	kubeconfig := net.Values["kubeconfig"]
	if kubeconfig == "" {
		return errors.Join(append(setupErrors, errors.New("provider networking did not return a kubeconfig"))...)
	}

	if hasForwardPPSModes(o.cfg.Modes) {
		lg.Step("setup", "ProxyGroup forwarding manifests")
		if err := k8s.DeployProxyGroup(ctx, kubeconfig, o.cfg.RootDir, false); err != nil {
			lg.Warnf("ProxyGroup deploy: %v (forward-pps modes may not work)", err)
			setupErrors = append(setupErrors, fmt.Errorf("deploy ProxyGroup: %w", err))
		}
	}

	if !hasL7Modes(o.cfg.Modes) {
		return errors.Join(setupErrors...)
	}
	lg.Step("setup", "L7 bench manifests")
	if err := k8s.DeployL7Bench(ctx, kubeconfig, o.cfg.RootDir); err != nil {
		lg.Warnf("L7 bench deploy: %v (L7 modes may not work)", err)
		setupErrors = append(setupErrors, fmt.Errorf("deploy L7 benchmark manifests: %w", err))
	}

	lg.Step("setup", "waiting for LB FQDN")
	cs, err := k8s.ClientsetFromKubeconfig(kubeconfig)
	if err != nil {
		lg.Warnf("kubeconfig parse for LB wait: %v", err)
		setupErrors = append(setupErrors, fmt.Errorf("parse kubeconfig for load balancer readiness: %w", err))
		return errors.Join(setupErrors...)
	}
	const pollInterval = 10 * time.Second
	deadline := time.Now().Add(3 * time.Minute)
	for time.Now().Before(deadline) {
		fqdn, err := k8s.DiscoverServiceLBFQDN(ctx, cs, o.cfg.ClusterLabel)
		if err == nil && fqdn != "" {
			lg.Infof("LB FQDN ready: %s", fqdn)
			return errors.Join(setupErrors...)
		}
		lg.Infof("LB FQDN not yet available, retrying in %v...", pollInterval)
		select {
		case <-ctx.Done():
			setupErrors = append(setupErrors, ctx.Err())
			return errors.Join(setupErrors...)
		case <-time.After(pollInterval):
		}
	}
	setupErrors = append(setupErrors, errors.New("load balancer FQDN was not ready within 3m"))
	return errors.Join(setupErrors...)
}

func discoverIngressFQDN(ctx context.Context, kubeconfig, labelSelector string) string {
	cs, err := k8s.ClientsetFromKubeconfig(kubeconfig)
	if err != nil {
		return ""
	}
	fqdn, err := k8s.DiscoverIngressFQDN(ctx, cs, labelSelector)
	if err == nil && fqdn != "" {
		log.Printf("discovered ingress FQDN: %s", fqdn)
	}
	return fqdn
}

func discoverServiceLBFQDN(ctx context.Context, kubeconfig, labelSelector string) string {
	cs, err := k8s.ClientsetFromKubeconfig(kubeconfig)
	if err != nil {
		return ""
	}
	fqdn, err := k8s.DiscoverServiceLBFQDN(ctx, cs, labelSelector)
	if err == nil && fqdn != "" {
		log.Printf("discovered service LB FQDN: %s", fqdn)
	}
	return fqdn
}

func discoverEchoPodIP(ctx context.Context, kubeconfig, labelSelector string) string {
	if kubeconfig == "" {
		return ""
	}
	cs, err := k8s.ClientsetFromKubeconfig(kubeconfig)
	if err != nil {
		return ""
	}
	ip, err := k8s.DiscoverPodIP(ctx, cs, labelSelector)
	if err != nil {
		log.Printf("could not discover echo pod IP: %v", err)
		return ""
	}
	return "http://" + ip + ":8080"
}

func (o *Orchestrator) runK8sBenchmark(ctx context.Context, p provider.Provider, pair *provider.PairOutput, inst provider.InstanceInfo, family string, lg *logger.Logger, serverHostname, clientHostname, authKey string) error {
	lg.Step("k8s-exec", "constructing transport")
	serverBench, err := k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ServerName, k8s.BenchContainer)
	if err != nil {
		return fmt.Errorf("server bench executor: %w", err)
	}
	clientBench, err := k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ClientName, k8s.BenchContainer)
	if err != nil {
		return fmt.Errorf("client bench executor: %w", err)
	}
	serverTS, err := k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ServerName, k8s.TSContainer)
	if err != nil {
		return fmt.Errorf("server tailscale executor: %w", err)
	}
	clientTS, err := k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ClientName, k8s.TSContainer)
	if err != nil {
		return fmt.Errorf("client tailscale executor: %w", err)
	}

	var baselineClient benchmark.Executor
	if cs, err := k8s.ClientsetFromKubeconfig(pair.Kubeconfig); err == nil {
		if baselinePod, err := k8s.DiscoverPodName(ctx, cs, "app.kubernetes.io/part-of=tailbench-l7-baseline"); err == nil {
			if exec, err := k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, baselinePod, "tools"); err == nil {
				baselineClient = exec
				lg.Infof("using baseline pod %s for L7 tests", baselinePod)
			}
		}
	}

	runner := &benchmark.Runner{
		Server: serverBench, Client: clientBench, BaselineClient: baselineClient,
		ServerTailscale: serverTS, ClientTailscale: clientTS, Log: lg,
		Config: o.benchmarkRunConfig(authKey, serverHostname, clientHostname),
	}
	prefix := fmt.Sprintf("[%s/%s]", p.Name(), inst.Type)
	// modeContext.serverHostname must be the sink's real tailnet device name,
	// which for a pod is pair.ServerName (tb-<provider>-server-<type>, set as
	// TS_HOSTNAME). The orchestrator-generated serverHostname is the VM-style
	// tb-<provider>-s-<type>-<suffix> and is never registered on a K8s run, so
	// using it pointed the egress Service at an FQDN that does not resolve.
	return o.runModeLoop(ctx, runner, p, pair, inst, family, prefix, "container",
		modeContext{serverHostname: pair.ServerName, kubeconfig: pair.Kubeconfig})
}

// runForwardPPS runs one pass of the ProxyGroup forwarding A/B: it applies the
// ProxyClass state for the mode (env absent = off, env "true" = on), waits for
// the resulting proxy StatefulSet re-roll, then sweeps UDP through the egress
// proxy to the server pod's tailscale sidecar.
func (o *Orchestrator) runForwardPPS(ctx context.Context, runner *benchmark.Runner, pair *provider.PairOutput, mode string, mc modeContext) (*result.BenchmarkResult, error) {
	optimizations := strings.HasSuffix(mode, "-opton")
	state := "off"
	if optimizations {
		state = "on"
	}

	cs, err := k8s.ClientsetFromKubeconfig(mc.kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("parse kubeconfig: %w", err)
	}
	before, err := k8s.GetProxyGroupRolloutState(ctx, cs, k8s.ProxyGroupName)
	if err != nil {
		// The StatefulSet may not exist on the first run. A zero snapshot makes
		// the readiness wait accept the first fully rolled-out desired revision.
		log.Printf("forward-pps mode %s: could not snapshot existing proxy rollout: %v", mode, err)
	}
	if err := k8s.DeployProxyGroup(ctx, mc.kubeconfig, o.cfg.RootDir, optimizations); err != nil {
		return nil, fmt.Errorf("deploy ProxyGroup: %w", err)
	}
	// A ProxyClass env change re-rolls the proxy StatefulSet; wait for the new
	// pods so neither A/B pass can measure the previous setting.
	if err := k8s.WaitForProxyGroupReady(ctx, cs, k8s.ProxyGroupName, before, optimizations, 5*time.Minute); err != nil {
		return nil, fmt.Errorf("wait for ProxyGroup readiness: %w", err)
	}

	if mc.serverHostname == "" || o.tailnetDNS == "" {
		return nil, errors.New("sink hostname and tailnet DNS are required")
	}
	target, err := k8s.EnsureEgressService(ctx, cs, pair.Namespace, "tailbench-egress-sink",
		mc.serverHostname+"."+o.tailnetDNS, benchmark.IPerfPort)
	if err != nil {
		return nil, fmt.Errorf("create egress service: %w", err)
	}

	// Sample the proxy pod's cgroup CPU during the sweep so a pod-CPU-capped
	// pps is recorded as such, not as proxygroup sizing capacity.
	var cpuBound atomic.Bool
	sampleCtx, stopSampling := context.WithCancel(ctx)
	defer stopSampling()
	go func() {
		for {
			select {
			case <-sampleCtx.Done():
				return
			case <-time.After(10 * time.Second):
				if t, _ := k8s.ProxyPodCPUThrottled(sampleCtx, cs, mc.kubeconfig, k8s.ProxyGroupName); t {
					cpuBound.Store(true)
				}
			}
		}
	}()

	pps, err := runner.RunForwardingPPS(ctx, runner.Client, runner.Server, target)
	stopSampling()
	if err != nil {
		return nil, fmt.Errorf("run forwarding-pps sweep: %w", err)
	}
	if cpuBound.Load() {
		pps.LimitingResource = "proxy-cpu"
	}

	return &result.BenchmarkResult{
		ForwardPPS:           pps,
		ForwardRole:          "proxygroup",
		ForwardOptimizations: state,
	}, nil
}
