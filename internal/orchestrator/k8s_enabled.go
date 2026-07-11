//go:build k8s

package orchestrator

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/rajsinghtech/tailbench/internal/benchmark"
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/k8s"
	"github.com/rajsinghtech/tailbench/internal/logger"
	"github.com/rajsinghtech/tailbench/internal/provider"
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
	if kubeconfig == "" || !hasL7Modes(o.cfg.Modes) {
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
		Config: benchmark.RunConfig{
			IPerfDuration: o.cfg.IPerfDuration, IPerfParallel: o.cfg.IPerfParallel,
			IPerfIterations: o.cfg.IPerfIterations, MTRCycles: o.cfg.MTRCycles,
			CooldownSec: o.cfg.CooldownSec, CreditRetrySec: o.cfg.CreditRetrySec,
			AuthKey: authKey, ServerHostname: serverHostname, ClientHostname: clientHostname,
			SkipTailscaleSetup: true,
		},
	}
	prefix := fmt.Sprintf("[%s/%s]", p.Name(), inst.Type)
	return o.runModeLoop(ctx, runner, p, pair, inst, family, prefix, "container", modeContext{kubeconfig: pair.Kubeconfig})
}
