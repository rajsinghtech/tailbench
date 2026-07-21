//go:build k8s

package orchestrator

import (
	"context"
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

func validateWorkloadConfig(*config.Config) error { return nil }

func hasL7Modes(modes []string) bool {
	for _, mode := range modes {
		if benchmark.ModeUsesFortio(mode) {
			return true
		}
	}
	return false
}

func hasForwardPPSModes(modes []string) bool {
	for _, mode := range modes {
		if benchmark.ModeUsesForwardPPS(mode) {
			return true
		}
	}
	return false
}

func (o *Orchestrator) setupK8s(ctx context.Context, p provider.Provider, net *provider.NetworkingOutput, lg *logger.Logger) {
	if kop, ok := p.(provider.K8sOperatorProvider); ok {
		lg.Step("setup", "Tailscale operator")
		if err := kop.InstallOperator(ctx, provider.OperatorInstallConfig{
			OAuthClientID:     o.cfg.OAuthClientID,
			OAuthClientSecret: o.cfg.OAuthClientSecret,
			Tag:               o.cfg.Tag,
			TailnetDNS:        o.tailnetDNS,
			TsnetSrv:          o.tsnetSrv,
			ForceReinstall:    o.cfg.CleanupNetworking,
		}); err != nil {
			lg.Warnf("operator install: %v (L7 modes may not work)", err)
		}
	}

	kubeconfig := net.Values["kubeconfig"]
	if kubeconfig == "" {
		return
	}

	if hasForwardPPSModes(o.cfg.Modes) {
		lg.Step("setup", "ProxyGroup forwarding manifests")
		if err := k8s.DeployProxyGroup(ctx, kubeconfig, o.cfg.RootDir, false); err != nil {
			lg.Warnf("ProxyGroup deploy: %v (forward-pps modes may not work)", err)
		}
	}

	if !hasL7Modes(o.cfg.Modes) {
		return
	}
	lg.Step("setup", "L7 bench manifests")
	if err := k8s.DeployL7Bench(ctx, kubeconfig, o.cfg.RootDir); err != nil {
		lg.Warnf("L7 bench deploy: %v (L7 modes may not work)", err)
	}

	lg.Step("setup", "waiting for LB FQDN")
	cs, err := k8s.ClientsetFromKubeconfig(kubeconfig)
	if err != nil {
		lg.Warnf("kubeconfig parse for LB wait: %v", err)
		return
	}
	const pollInterval = 10 * time.Second
	deadline := time.Now().Add(3 * time.Minute)
	for time.Now().Before(deadline) {
		fqdn, err := k8s.DiscoverServiceLBFQDN(ctx, cs, o.cfg.ClusterLabel)
		if err == nil && fqdn != "" {
			lg.Infof("LB FQDN ready: %s", fqdn)
			return
		}
		lg.Infof("LB FQDN not yet available, retrying in %v...", pollInterval)
		select {
		case <-ctx.Done():
			return
		case <-time.After(pollInterval):
		}
	}
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
	return o.runModeLoop(ctx, runner, p, pair, inst, family, prefix, "container", modeContext{serverHostname: serverHostname, kubeconfig: pair.Kubeconfig})
}

// runForwardPPS runs one pass of the ProxyGroup forwarding A/B: it applies the
// ProxyClass state for the mode (env absent = off, env "true" = on), waits for
// the resulting proxy StatefulSet re-roll, then sweeps UDP through the egress
// proxy to the server pod's tailscale sidecar.
func (o *Orchestrator) runForwardPPS(ctx context.Context, runner *benchmark.Runner, pair *provider.PairOutput, mode string, mc modeContext) *result.BenchmarkResult {
	optimizations := strings.HasSuffix(mode, "-opton")
	state := "off"
	if optimizations {
		state = "on"
	}

	cs, err := k8s.ClientsetFromKubeconfig(mc.kubeconfig)
	if err != nil {
		log.Printf("forward-pps mode %s: kubeconfig parse: %v", mode, err)
		return nil
	}
	before, err := k8s.GetProxyGroupRolloutState(ctx, cs, k8s.ProxyGroupName)
	if err != nil {
		// The StatefulSet may not exist on the first run. A zero snapshot makes
		// the readiness wait accept the first fully rolled-out desired revision.
		log.Printf("forward-pps mode %s: could not snapshot existing proxy rollout: %v", mode, err)
	}
	if err := k8s.DeployProxyGroup(ctx, mc.kubeconfig, o.cfg.RootDir, optimizations); err != nil {
		log.Printf("forward-pps mode %s: deploying ProxyGroup: %v", mode, err)
		return nil
	}
	// A ProxyClass env change re-rolls the proxy StatefulSet; wait for the new
	// pods so neither A/B pass can measure the previous setting.
	if err := k8s.WaitForProxyGroupReady(ctx, cs, k8s.ProxyGroupName, before, optimizations, 5*time.Minute); err != nil {
		log.Printf("forward-pps mode %s: waiting for proxy: %v", mode, err)
		return nil
	}

	if mc.serverHostname == "" || o.tailnetDNS == "" {
		log.Printf("forward-pps mode %s: no sink hostname or tailnet DNS", mode)
		return nil
	}
	target, err := k8s.EnsureEgressService(ctx, cs, pair.Namespace, "tailbench-egress-sink",
		mc.serverHostname+"."+o.tailnetDNS, benchmark.IPerfPort)
	if err != nil {
		log.Printf("forward-pps mode %s: egress service: %v", mode, err)
		return nil
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
		log.Printf("forward-pps mode %s: sweep: %v", mode, err)
		return nil
	}
	if cpuBound.Load() {
		pps.LimitingResource = "proxy-cpu"
	}

	return &result.BenchmarkResult{
		ForwardPPS:           pps,
		ForwardRole:          "proxygroup",
		ForwardOptimizations: state,
	}
}
