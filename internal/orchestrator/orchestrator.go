package orchestrator

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/rajsinghtech/tailbench/internal/benchmark"
	"github.com/rajsinghtech/tailbench/internal/cloudinit"
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/logger"
	"github.com/rajsinghtech/tailbench/internal/provider"
	"github.com/rajsinghtech/tailbench/internal/result"
	"github.com/rajsinghtech/tailbench/internal/sshclient"
	"github.com/rajsinghtech/tailbench/internal/tailnet"
	"tailscale.com/tsnet"
)

type Orchestrator struct {
	cfg        *config.Config
	providers  []provider.Provider
	tailnet    *tailnet.Manager
	tsnetSrv   *tsnet.Server
	tailnetDNS string // e.g. "tailXXXX.ts.net"
}

type ProviderFactory func(name string, cfg *config.Config) (provider.Provider, error)

func New(cfg *config.Config, factory ProviderFactory) (*Orchestrator, error) {
	if factory == nil {
		return nil, fmt.Errorf("provider factory is required")
	}
	if err := validateWorkloadConfig(cfg); err != nil {
		return nil, err
	}
	o := &Orchestrator{cfg: cfg}

	for _, name := range cfg.Providers {
		p, err := factory(name, cfg)
		if err != nil {
			return nil, fmt.Errorf("provider %s: %w", name, err)
		}
		o.providers = append(o.providers, p)
	}
	return o, nil
}

func (o *Orchestrator) Run(ctx context.Context) error {
	stateDir := strings.TrimPrefix(o.cfg.StateDir, "file://")
	if err := os.MkdirAll(stateDir, 0o755); err != nil {
		return fmt.Errorf("create state dir %s: %w", stateDir, err)
	}

	// Clean stale Pulumi lock files left behind by previous crashed runs.
	// These live in state/<provider>/.pulumi/locks/*.json and cause all
	// subsequent operations to fail with "exit status 255".
	lockPattern := filepath.Join(stateDir, "*", ".pulumi", "locks", "*.json")
	if locks, err := filepath.Glob(lockPattern); err == nil {
		for _, lf := range locks {
			log.Printf("removing stale pulumi lock: %s", lf)
			if err := os.Remove(lf); err != nil && !os.IsNotExist(err) {
				log.Printf("warning: remove stale pulumi lock %s: %v", lf, err)
			}
		}
	}

	if o.cfg.DryRun {
		return o.dryRun(ctx)
	}

	var authKey string
	var authKeyCreated time.Time

	if o.cfg.CreateTailnet {
		o.tailnet = &tailnet.Manager{
			OrgClientID:     o.cfg.OAuthClientID,
			OrgClientSecret: o.cfg.OAuthClientSecret,
			Tag:             o.cfg.Tag,
		}

		// Try to reuse an existing tailnet from a previous run
		tailnetStateFile := filepath.Join(".tailbench", "tailnet.json")
		info, err := loadTailnetState(tailnetStateFile)
		if err == nil {
			log.Printf("reusing existing tailnet: %s", info.DNSName)
			o.tailnetDNS = info.DNSName
			o.cfg.OAuthClientID = info.OAuthClientID
			o.cfg.OAuthClientSecret = info.OAuthClientSecret

			// Always update ACL to pick up any tag/rule changes
			log.Println("updating ACL")
			if err := o.tailnet.SetupACL(ctx, info.OAuthClientID, info.OAuthClientSecret, true, o.hasK8sProviders()); err != nil {
				log.Printf("warning: ACL update failed: %v", err)
			}
		} else {
			// Create a new tailnet
			tailnetName := fmt.Sprintf("tailbench-%d", time.Now().Unix())
			log.Printf("creating tailnet %s", tailnetName)
			info, err = o.tailnet.CreateTailnet(ctx, tailnetName)
			if err != nil {
				return fmt.Errorf("create tailnet: %w", err)
			}
			log.Printf("tailnet created: %s", info.DNSName)
			o.tailnetDNS = info.DNSName
			o.cfg.OAuthClientID = info.OAuthClientID
			o.cfg.OAuthClientSecret = info.OAuthClientSecret

			// Save state for reuse in future runs
			if err := saveTailnetState(tailnetStateFile, info); err != nil {
				log.Printf("warning: could not save tailnet state: %v", err)
			}

			log.Println("setting up ACL")
			if err := o.tailnet.SetupACL(ctx, info.OAuthClientID, info.OAuthClientSecret, true, o.hasK8sProviders()); err != nil {
				return fmt.Errorf("setup ACL: %w", err)
			}

			if o.hasK8sProviders() {
				log.Println("enabling HTTPS on tailnet for operator API server proxy")
				if err := o.tailnet.EnableHTTPS(ctx, info.OAuthClientID, info.OAuthClientSecret); err != nil {
					return fmt.Errorf("enable HTTPS: %w", err)
				}
			}
		}

		// Delete tailnet only on cleanup
		if o.cfg.CleanupNetworking {
			defer func() {
				log.Printf("deleting tailnet %s", o.tailnetDNS)
				delCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
				defer cancel()
				if err := o.tailnet.DeleteTailnet(delCtx, o.tailnetDNS); err != nil {
					log.Printf("warning: tailnet deletion failed: %v", err)
				}
				if err := os.Remove(tailnetStateFile); err != nil && !os.IsNotExist(err) {
					log.Printf("warning: remove tailnet state: %v", err)
				}
			}()
		}

		log.Println("creating auth key")
		authKey, err = o.tailnet.CreateAuthKey(ctx, o.cfg.OAuthClientID, o.cfg.OAuthClientSecret)
		if err != nil {
			return fmt.Errorf("create auth key: %w", err)
		}
		authKeyCreated = time.Now()

		// Ephemeral node — no state to preserve between runs.
		tsnetDir := filepath.Join(".tailbench", "tsnet")
		if err := os.RemoveAll(tsnetDir); err != nil {
			return fmt.Errorf("remove stale tsnet state: %w", err)
		}
		o.tsnetSrv = &tsnet.Server{
			Dir:           tsnetDir,
			Hostname:      "tailbench-orchestrator",
			AuthKey:       authKey,
			Ephemeral:     true,
			AdvertiseTags: []string{o.cfg.Tag},
		}
		log.Println("starting tsnet server")
		if _, err := o.tsnetSrv.Up(ctx); err != nil {
			return fmt.Errorf("tsnet up: %w", err)
		}
		defer func() {
			if err := o.tsnetSrv.Close(); err != nil {
				log.Printf("warning: close tsnet server: %v", err)
			}
		}()
		log.Println("tsnet server joined tailnet")
	}

	if len(o.providers) == 1 {
		return o.runProvider(ctx, o.providers[0], &authKey, &authKeyCreated)
	}

	var wg sync.WaitGroup
	for _, p := range o.providers {
		wg.Add(1)
		go func(p provider.Provider) {
			defer wg.Done()
			if err := o.runProvider(ctx, p, &authKey, &authKeyCreated); err != nil {
				log.Printf("[%s] provider finished with error: %v", p.Name(), err)
			} else {
				log.Printf("[%s] provider finished successfully", p.Name())
			}
		}(p)
	}
	wg.Wait()
	return nil
}

func (o *Orchestrator) dryRun(ctx context.Context) error {
	for _, p := range o.providers {
		fmt.Printf("[dry-run] provider: %s\n", p.Name())
		families := p.ListFamilies()
		fmt.Printf("[dry-run]   families: %v\n", families)
		for _, fam := range families {
			instances, err := p.ListInstances(ctx, fam)
			if err != nil {
				fmt.Printf("[dry-run]   %s: error listing instances: %v\n", fam, err)
				continue
			}
			for _, inst := range instances {
				fmt.Printf("[dry-run]   %s: %s (%d vCPUs)\n", fam, inst.Type, inst.VCPUs)
			}
		}
	}
	return nil
}

func (o *Orchestrator) runProvider(ctx context.Context, p provider.Provider, authKey *string, authKeyCreated *time.Time) error {
	lg := logger.New(p.Name())
	lg.Step("setup", "networking")
	net, err := p.SetupNetworking(ctx)
	if err != nil {
		return fmt.Errorf("setup networking: %w", err)
	}

	// Clean up stale tailnet devices from previous crashed runs
	if o.cfg.CreateTailnet {
		for _, prefix := range []string{
			fmt.Sprintf("tb-%s-", p.Name()),                // benchmark VMs/pods
			fmt.Sprintf("tailbench-%s-operator", p.Name()), // operator node
		} {
			if n, err := o.tailnet.CleanupStaleDevices(ctx, o.cfg.OAuthClientID, o.cfg.OAuthClientSecret, prefix); err != nil {
				lg.Warnf("device cleanup (%s): %v", prefix, err)
			} else if n > 0 {
				lg.Infof("cleaned up %d stale devices matching %s*", n, prefix)
			}
		}
	}

	o.setupK8s(ctx, p, net, lg)

	instances, err := o.listInstancesCached(ctx, p, lg)
	if err != nil {
		return fmt.Errorf("listing instances: %w", err)
	}

	if o.cfg.Filter != "" {
		re, err := regexp.Compile(o.cfg.Filter)
		if err != nil {
			return fmt.Errorf("invalid filter regex: %w", err)
		}
		var filtered []provider.InstanceInfo
		for _, inst := range instances {
			if re.MatchString(inst.Type) {
				filtered = append(filtered, inst)
			}
		}
		instances = filtered
	}

	lg.Infof("found %d instance types to benchmark", len(instances))

	skippedFamilies := map[string]bool{}

	for _, inst := range instances {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		family := provider.GetInstanceFamily(p.Name(), inst.Type)
		if skippedFamilies[family] {
			lg.Infof("skip %s (family %s quota exceeded)", inst.Type, family)
			continue
		}

		// Check which modes still need results for this instance.
		// Skip the instance entirely if all applicable modes are done.
		env := "vm"
		if isK8sProvider(p.Name()) {
			env = "container"
		}
		pendingModes := pendingModesForInstance(o.cfg.RootDir, p.Name(), family, inst.Type, o.cfg.Modes, env)
		if len(pendingModes) == 0 {
			lg.Infof("skip %s (all mode results exist)", inst.Type)
			continue
		}
		lg.Infof("%s: %d/%d modes pending %v", inst.Type, len(pendingModes), len(o.cfg.Modes), pendingModes)

		safeType := safeHostname(inst.Type)
		suffix := fmt.Sprintf("%d", time.Now().Unix()%10000)
		serverHostname := fmt.Sprintf("tb-%s-s-%s-%s", p.Name(), safeType, suffix)
		clientHostname := fmt.Sprintf("tb-%s-c-%s-%s", p.Name(), safeType, suffix)
		routerHostname := fmt.Sprintf("tb-%s-r-%s-%s", p.Name(), safeType, suffix)

		// forward-pps-exit is VM-only and needs a 3rd node (the exit-node router).
		// Base this on the work left for this instance so reruns don't provision an
		// unused router after its forwarding result has already been written.
		wantRouter := !isK8sProvider(p.Name()) && hasForwardMode(pendingModes)

		var userData, clientUserData, routerUserData string
		if isK8sProvider(p.Name()) {
			userData = *authKey
		} else {
			if *authKey == "" {
				lg.Errf("BUG: auth key is empty for %s", inst.Type)
				continue
			}
			wantServe := hasL7ServeMode(o.cfg.Modes)
			serverUD, err := cloudinit.Render(cloudinit.Config{
				AuthKey:     *authKey,
				Hostname:    serverHostname,
				EnableSSH:   true,
				EnableServe: wantServe,
			})
			if err != nil {
				lg.Errf("cloud-init for %s: %v", inst.Type, err)
				continue
			}
			userData = serverUD
			clientUD, err := cloudinit.Render(cloudinit.Config{
				AuthKey:     *authKey,
				Hostname:    clientHostname,
				EnableSSH:   true,
				EnableServe: wantServe, // client needs fortio binary too
			})
			if err != nil {
				lg.Errf("cloud-init for %s: %v", inst.Type, err)
				continue
			}
			clientUserData = clientUD
			if wantRouter {
				routerUD, err := cloudinit.Render(cloudinit.Config{
					AuthKey:           *authKey,
					Hostname:          routerHostname,
					EnableSSH:         true,
					AdvertiseExitNode: true,
				})
				if err != nil {
					lg.Errf("cloud-init (router) for %s: %v", inst.Type, err)
					continue
				}
				routerUserData = routerUD
			}
		}

		// Pre-cleanup: destroy any leftover resources from a previous run.
		// This is a no-op if nothing exists, but ensures CreatePair starts clean.
		if dErr := p.DestroyPair(ctx, inst.Type); dErr != nil {
			lg.Infof("pre-cleanup %s: %v (continuing)", inst.Type, dErr)
		}

		lg.Step("provision", inst.Type)
		pair, err := p.CreatePair(ctx, provider.PairOptions{
			InstanceType:   inst.Type,
			UserData:       userData,
			ClientUserData: clientUserData,
			RouterUserData: routerUserData,
			WantRouter:     wantRouter,
			Networking:     net,
			BenchImage:     o.cfg.BenchImage,
			TSImage:        o.cfg.TSImage,
		})
		if err != nil {
			if p.IsQuotaError(err) {
				lg.Warnf("quota exceeded for %s, skipping family %s", inst.Type, family)
				skippedFamilies[family] = true
			} else {
				lg.Errf("create pair %s: %v", inst.Type, err)
			}
			// Destroy any partially-created resources (e.g. node pool created but nodes not ready)
			if dErr := p.DestroyPair(ctx, inst.Type); dErr != nil {
				lg.Warnf("cleanup failed pair %s: %v", inst.Type, dErr)
			}
			continue
		}

		benchErr := o.runBenchmark(ctx, p, pair, inst, family, lg, serverHostname, clientHostname, routerHostname, *authKey)

		lg.Step("teardown", inst.Type)
		if err := p.DestroyPair(ctx, inst.Type); err != nil {
			lg.Warnf("destroy pair %s: %v", inst.Type, err)
		}

		if benchErr != nil {
			lg.Errf("benchmark %s: %v", inst.Type, benchErr)
		}

		if o.cfg.CreateTailnet && time.Since(*authKeyCreated) > time.Duration(o.cfg.AuthKeyRefreshSec)*time.Second {
			lg.Infof("refreshing auth key")
			newKey, err := o.tailnet.CreateAuthKey(ctx, o.cfg.OAuthClientID, o.cfg.OAuthClientSecret)
			if err != nil {
				lg.Warnf("auth key refresh: %v", err)
			} else {
				*authKey = newKey
				*authKeyCreated = time.Now()
			}
		}
	}

	if err := result.Aggregate(o.cfg.RootDir); err != nil {
		lg.Warnf("aggregation: %v", err)
	}

	if o.cfg.CleanupNetworking {
		lg.Step("teardown", "networking")
		if err := p.TeardownNetworking(ctx); err != nil {
			lg.Warnf("teardown networking: %v", err)
		}
	}
	return nil
}

func (o *Orchestrator) runBenchmark(ctx context.Context, p provider.Provider, pair *provider.PairOutput, inst provider.InstanceInfo, family string, lg *logger.Logger, serverHostname, clientHostname, routerHostname, authKey string) error {
	if pair.Namespace != "" {
		return o.runK8sBenchmark(ctx, p, pair, inst, family, lg, serverHostname, clientHostname, authKey)
	}

	lg.Step("ssh", fmt.Sprintf("connecting to %s", serverHostname))
	serverSSH, err := sshclient.Dial(o.tsnetSrv, serverHostname, "root", o.cfg.SSHTimeout, lg)
	if err != nil {
		return fmt.Errorf("ssh dial server: %w", err)
	}
	defer func() {
		if err := serverSSH.Close(); err != nil {
			lg.Warnf("close server SSH: %v", err)
		}
	}()

	lg.Step("ssh", fmt.Sprintf("connecting to %s", clientHostname))
	clientSSH, err := sshclient.Dial(o.tsnetSrv, clientHostname, "root", o.cfg.SSHTimeout, lg)
	if err != nil {
		return fmt.Errorf("ssh dial client: %w", err)
	}
	defer func() {
		if err := clientSSH.Close(); err != nil {
			lg.Warnf("close client SSH: %v", err)
		}
	}()

	lg.Step("ssh", "waiting for cloud-init ready")
	if err := serverSSH.WaitForReady(ctx); err != nil {
		return fmt.Errorf("server ready: %w", err)
	}
	if err := clientSSH.WaitForReady(ctx); err != nil {
		return fmt.Errorf("client ready: %w", err)
	}

	// Router (exit-node under test) — only provisioned for forwarding-pps runs.
	var routerSSH benchmark.Executor
	if pair.RouterIP != "" {
		lg.Step("ssh", fmt.Sprintf("connecting to %s", routerHostname))
		rSSH, err := sshclient.Dial(o.tsnetSrv, routerHostname, "root", o.cfg.SSHTimeout, lg)
		if err != nil {
			return fmt.Errorf("ssh dial router: %w", err)
		}
		defer rSSH.Close()
		if err := rSSH.WaitForReady(ctx); err != nil {
			return fmt.Errorf("router ready: %w", err)
		}
		routerSSH = rSSH
	}

	runner := &benchmark.Runner{
		Server:          serverSSH,
		Client:          clientSSH,
		ServerTailscale: serverSSH,
		ClientTailscale: clientSSH,
		Router:          routerSSH,
		Log:             lg,
		Config: benchmark.RunConfig{
			IPerfDuration:       o.cfg.IPerfDuration,
			IPerfParallel:       o.cfg.IPerfParallel,
			IPerfIterations:     o.cfg.IPerfIterations,
			MTRCycles:           o.cfg.MTRCycles,
			CooldownSec:         o.cfg.CooldownSec,
			CreditRetrySec:      o.cfg.CreditRetrySec,
			AuthKey:             authKey,
			ServerHostname:      serverHostname,
			ClientHostname:      clientHostname,
			SkipTailscaleSetup:  true,
			PPSDatagramSizes:    o.cfg.PPSDatagramSizes,
			PPSLossThresholdPct: o.cfg.PPSLossThresholdPct,
			PPSDurationSec:      o.cfg.PPSDurationSec,
			PPSMaxRatePPS:       o.cfg.PPSMaxRatePPS,
		},
	}

	prefix := fmt.Sprintf("[%s/%s]", p.Name(), inst.Type)
	return o.runModeLoop(ctx, runner, p, pair, inst, family, prefix, "vm", modeContext{
		serverHostname: serverHostname,
	})
}

type modeContext struct {
	serverHostname string
	kubeconfig     string // base64 kubeconfig for K8s providers, empty for VMs
}

func (o *Orchestrator) runModeLoop(ctx context.Context, runner *benchmark.Runner, p provider.Provider, pair *provider.PairOutput, inst provider.InstanceInfo, family, prefix, env string, mc modeContext) error {
	for _, mode := range o.cfg.Modes {
		if !benchmark.ModeAppliesTo(mode, env) {
			continue
		}
		// Skip modes that already have results
		resultPath := filepath.Join(o.cfg.RootDir, p.Name(), family, "results", inst.Type+"-"+mode+".json")
		if _, err := os.Stat(resultPath); err == nil {
			log.Printf("%s skipping mode %s (result exists)", prefix, mode)
			continue
		}

		var br *result.BenchmarkResult

		switch {
		case benchmark.ModeUsesIperf(mode):
			log.Printf("%s running iperf benchmark for %s mode %s", prefix, inst.Type, mode)
			var err error
			br, err = runner.RunFull(ctx, pair.ServerLANIP, pair.ClientLANIP)
			if err != nil {
				log.Printf("%s iperf mode %s failed: %v (continuing to next mode)", prefix, mode, err)
				continue
			}
		case benchmark.ModeUsesFortio(mode):
			target, baselineTarget := o.resolveEndpoints(ctx, mode, pair, mc)
			if target == "" {
				log.Printf("%s skipping mode %s: no endpoint configured", prefix, mode)
				continue
			}
			if err := o.warmUpEndpoint(ctx, runner.Client, target); err != nil {
				log.Printf("%s skipping mode %s: endpoint warm-up failed: %v", prefix, mode, err)
				continue
			}
			h2 := benchmark.ModeIsH2(mode)
			log.Printf("%s running fortio benchmark for %s mode %s", prefix, inst.Type, mode)
			baseline, ts, err := runner.RunFortio(ctx, target, baselineTarget, h2,
				o.cfg.FortioConnections, o.cfg.FortioDuration, o.cfg.FortioIterations, o.cfg.FortioQPS)
			if err != nil {
				log.Printf("%s fortio mode %s failed: %v", prefix, mode, err)
				continue
			}
			br = &result.BenchmarkResult{
				FortioResult: ts,
				L7Overhead:   result.ComputeL7Overhead(baseline, ts),
			}
		case benchmark.ModeUsesForwardPPS(mode):
			if runner.Router == nil {
				log.Printf("%s skipping mode %s: no router provisioned", prefix, mode)
				continue
			}
			routerTSIP, err := benchmark.GetTailscaleIP(ctx, runner.Router)
			if err != nil {
				log.Printf("%s mode %s: router tailscale IP: %v (continuing)", prefix, mode, err)
				continue
			}
			log.Printf("%s forwarding-pps: routing client egress via exit node %s", prefix, routerTSIP)
			if err := benchmark.SetExitNode(ctx, runner.Client, routerTSIP); err != nil {
				log.Printf("%s mode %s: set exit node: %v", prefix, mode, err)
				continue
			}
			// Client -> router (exit node) -> server public IP (a non-tailnet
			// address, so it egresses through the router rather than direct).
			pps, ppsErr := runner.RunForwardingPPS(ctx, runner.Client, runner.Server, pair.ServerIP)
			_ = benchmark.ClearExitNode(ctx, runner.Client)
			if ppsErr != nil {
				log.Printf("%s forward-pps mode %s failed: %v", prefix, mode, ppsErr)
				continue
			}
			br = &result.BenchmarkResult{
				ForwardPPS:  pps,
				ForwardRole: "exit-node",
				TestConfig:  forwardPPSTestConfig(pps),
			}
		case benchmark.ModeUsesTsnet(mode):
			log.Printf("%s skipping mode %s: tsnet runner not yet implemented", prefix, mode)
			continue
		default:
			log.Printf("%s skipping unknown mode %s", prefix, mode)
			continue
		}

		br.TransportMode = mode
		br.HTTPVersion = benchmark.ModeHTTPVersion(mode)
		br.CloudProvider = p.Name()
		br.InstanceFamily = family
		br.InstanceType = inst.Type
		br.VCPUs = inst.VCPUs
		br.Date = time.Now().UTC().Format("2006-01-02")
		br.Environment = env
		// Fill TSVersion if not already set (iperf RunFull sets it; fortio doesn't)
		if br.TSVersion == "" && runner.ServerTailscale != nil {
			if out, _, err := runner.ServerTailscale.Run(ctx, "tailscale version | head -1"); err == nil {
				br.TSVersion = strings.TrimSpace(out)
			}
		}

		switch p.Name() {
		case "gcp", "gke":
			br.Region = o.cfg.GCPZone[:strings.LastIndex(o.cfg.GCPZone, "-")]
			br.Zone = o.cfg.GCPZone
		case "aws", "eks":
			br.Region = o.cfg.AWSRegion
			br.Zone = o.cfg.AWSAZ
		case "azure", "aks":
			br.Region = o.cfg.AzureLocation
			br.Zone = o.cfg.AzureLocation
		}

		if err := result.WriteResult(o.cfg.RootDir, br, false); err != nil {
			return fmt.Errorf("writing result for mode %s: %w", mode, err)
		}
		log.Printf("%s result written for %s mode %s", prefix, inst.Type, mode)
	}
	return nil
}

func (o *Orchestrator) resolveEndpoints(ctx context.Context, mode string, pair *provider.PairOutput, mc modeContext) (target, baseline string) {
	switch {
	case strings.HasPrefix(mode, "l7-ingress"):
		fqdn := o.cfg.IngressFQDN
		if fqdn == "" && mc.kubeconfig != "" {
			fqdn = discoverIngressFQDN(ctx, mc.kubeconfig, o.cfg.ClusterLabel)
		}
		if fqdn != "" {
			target = "https://" + fqdn
		}
		// Use pod IP for baseline — tailscale sidecar hijacks DNS so
		// cluster-local service names don't resolve from bench pods.
		baseline = discoverEchoPodIP(ctx, mc.kubeconfig, o.cfg.ClusterLabel)

	case strings.HasPrefix(mode, "l7-serve"):
		fqdn := o.cfg.ServeFQDN
		if fqdn == "" && mc.serverHostname != "" && o.tailnetDNS != "" {
			fqdn = mc.serverHostname + "." + o.tailnetDNS
		}
		if fqdn != "" {
			if strings.HasSuffix(mode, "-h2") {
				// h2 requires HTTPS (TLS + ALPN negotiation)
				target = "https://" + fqdn
			} else {
				target = "http://" + fqdn
			}
		}
		baseline = "http://" + pair.ServerLANIP + ":8080"

	case mode == "l4-lb":
		if mc.kubeconfig != "" {
			if discovered := discoverServiceLBFQDN(ctx, mc.kubeconfig, o.cfg.ClusterLabel); discovered != "" {
				target = "http://" + discovered + ":8080"
			}
		}
		baseline = discoverEchoPodIP(ctx, mc.kubeconfig, o.cfg.ClusterLabel)
	}
	return
}

func (o *Orchestrator) warmUpEndpoint(ctx context.Context, executor benchmark.Executor, target string) error {
	// Use -k for HTTPS targets to skip cert verification (LE certs may not be ready on ephemeral tailnets)
	insecureFlag := ""
	if strings.HasPrefix(target, "https://") {
		insecureFlag = "-k "
	}
	for attempt := 0; attempt < 20; attempt++ {
		backoff := time.Duration(1<<min(attempt, 4)) * time.Second
		_, _, err := executor.Run(ctx, fmt.Sprintf("curl %s-sf --max-time 15 -o /dev/null %s", insecureFlag, target))
		if err == nil {
			return nil
		}
		log.Printf("endpoint warm-up attempt %d/10 for %s failed: %v, retrying in %v", attempt+1, target, err, backoff)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(backoff):
		}
	}
	return fmt.Errorf("endpoint not reachable after 20 attempts: %s", target)
}

// pendingModesForInstance returns the subset of modes that don't have result files yet.
func pendingModesForInstance(rootDir, providerName, family, instanceType string, modes []string, env string) []string {
	var pending []string
	for _, mode := range modes {
		if !benchmark.ModeAppliesTo(mode, env) {
			continue
		}
		// Check for mode-suffixed result file
		resultPath := filepath.Join(rootDir, providerName, family, "results", instanceType+"-"+mode+".json")
		if _, err := os.Stat(resultPath); err != nil {
			pending = append(pending, mode)
			continue
		}
		// Also check legacy path (no mode suffix) for l4-kernel backward compat
		if mode == "l4-kernel" {
			legacyPath := filepath.Join(rootDir, providerName, family, "results", instanceType+".json")
			if _, err := os.Stat(legacyPath); err != nil {
				pending = append(pending, mode)
			}
		}
	}
	return pending
}

func hasL7ServeMode(modes []string) bool {
	for _, m := range modes {
		if strings.HasPrefix(m, "l7-serve") {
			return true
		}
	}
	return false
}

func hasForwardMode(modes []string) bool {
	for _, m := range modes {
		if benchmark.ModeUsesForwardPPS(m) {
			return true
		}
	}
	return false
}

func forwardPPSTestConfig(pps *result.PPSResult) *result.TestConfig {
	if pps == nil {
		return nil
	}
	sizes := make([]int, 0, len(pps.Sizes))
	for _, size := range pps.Sizes {
		sizes = append(sizes, size.DatagramBytes)
	}
	return &result.TestConfig{
		PPSDatagramSizes:    sizes,
		PPSLossThresholdPct: pps.LossThresholdPct,
	}
}

func safeHostname(instanceType string) string {
	s := strings.ToLower(instanceType)
	s = strings.NewReplacer(".", "-", "_", "-").Replace(s)
	return s
}

func isK8sProvider(name string) bool {
	switch name {
	case "eks", "gke", "aks":
		return true
	}
	return false
}

func (o *Orchestrator) hasK8sProviders() bool {
	for _, p := range o.providers {
		if isK8sProvider(p.Name()) {
			return true
		}
	}
	return false
}

// tailnetState is persisted between runs to reuse infrastructure.
type tailnetState struct {
	DNSName           string `json:"dns_name"`
	OAuthClientID     string `json:"oauth_client_id"`
	OAuthClientSecret string `json:"oauth_client_secret"`
}

func loadTailnetState(path string) (*tailnet.TailnetInfo, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var state tailnetState
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, err
	}
	if state.DNSName == "" || state.OAuthClientID == "" {
		return nil, fmt.Errorf("incomplete tailnet state")
	}
	return &tailnet.TailnetInfo{
		DNSName:           state.DNSName,
		OAuthClientID:     state.OAuthClientID,
		OAuthClientSecret: state.OAuthClientSecret,
	}, nil
}

// instanceCachePath returns the path for a provider's cached instance list.
func instanceCachePath(providerName string) string {
	return filepath.Join(".tailbench", "instances", providerName+".json")
}

// listInstancesCached returns the instance list for a provider, using a disk cache
// when available. The cache is invalidated by --cleanup-networking.
func (o *Orchestrator) listInstancesCached(ctx context.Context, p provider.Provider, lg *logger.Logger) ([]provider.InstanceInfo, error) {
	cachePath := instanceCachePath(p.Name())

	if !o.cfg.CleanupNetworking {
		if data, err := os.ReadFile(cachePath); err == nil {
			var cached []provider.InstanceInfo
			if err := json.Unmarshal(data, &cached); err == nil && len(cached) > 0 {
				lg.Infof("using cached instance list (%d types from %s)", len(cached), cachePath)
				return cached, nil
			}
		}
	}

	var families []string
	if o.cfg.Family == "all" {
		families = p.ListFamilies()
	} else {
		families = []string{o.cfg.Family}
	}

	var instances []provider.InstanceInfo
	for _, fam := range families {
		lg.Infof("listing instances for family %s", fam)
		list, err := p.ListInstances(ctx, fam)
		if err != nil {
			lg.Warnf("listing family %s: %v", fam, err)
			continue
		}
		lg.Infof("  %s: %d instance types", fam, len(list))
		instances = append(instances, list...)
	}

	if len(instances) > 0 {
		if err := os.MkdirAll(filepath.Dir(cachePath), 0o755); err == nil {
			if data, err := json.MarshalIndent(instances, "", "  "); err == nil {
				if err := os.WriteFile(cachePath, data, 0o644); err != nil {
					lg.Warnf("write instance cache %s: %v", cachePath, err)
				}
				lg.Infof("cached %d instance types to %s", len(instances), cachePath)
			}
		}
	}

	return instances, nil
}

func saveTailnetState(path string, info *tailnet.TailnetInfo) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(tailnetState{
		DNSName:           info.DNSName,
		OAuthClientID:     info.OAuthClientID,
		OAuthClientSecret: info.OAuthClientSecret,
	}, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o600)
}
