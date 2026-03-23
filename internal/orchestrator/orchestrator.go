package orchestrator

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/rajsinghtech/tailbench/internal/benchmark"
	"github.com/rajsinghtech/tailbench/internal/cloudinit"
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/k8s"
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

func New(cfg *config.Config) (*Orchestrator, error) {
	o := &Orchestrator{cfg: cfg}

	for _, name := range cfg.Providers {
		p, err := buildProvider(name, cfg)
		if err != nil {
			return nil, fmt.Errorf("provider %s: %w", name, err)
		}
		o.providers = append(o.providers, p)
	}
	return o, nil
}

func buildProvider(name string, cfg *config.Config) (provider.Provider, error) {
	switch name {
	case "gcp":
		region := cfg.GCPZone
		if idx := strings.LastIndex(cfg.GCPZone, "-"); idx > 0 {
			region = cfg.GCPZone[:idx]
		}
		return &provider.GCPProvider{
			Project:  cfg.GCPProject,
			Zone:     cfg.GCPZone,
			Region:   region,
			Network:  "default",
			Subnet:   "default",
			StateDir: cfg.StateDir,
		}, nil
	case "aws":
		return &provider.AWSProvider{
			Region:   cfg.AWSRegion,
			AZ:       cfg.AWSAZ,
			KeyName:  cfg.AWSKeyName,
			StateDir: cfg.StateDir,
		}, nil
	case "azure":
		return &provider.AzureProvider{
			Location:      cfg.AzureLocation,
			ResourceGroup: cfg.AzureResourceGroup,
			StateDir:      cfg.StateDir,
		}, nil
	case "eks":
		return &provider.EKSProvider{
			Region:   cfg.AWSRegion,
			AZ:       cfg.AWSAZ,
			StateDir: cfg.StateDir,
		}, nil
	case "gke":
		return &provider.GKEProvider{
			Project:  cfg.GCPProject,
			Zone:     cfg.GCPZone,
			StateDir: cfg.StateDir,
		}, nil
	case "aks":
		return &provider.AKSProvider{
			Location:      cfg.AzureLocation,
			ResourceGroup: cfg.AzureResourceGroup,
			StateDir:      cfg.StateDir,
		}, nil
	default:
		return nil, fmt.Errorf("unknown provider: %s", name)
	}
}

func (o *Orchestrator) Run(ctx context.Context) error {
	stateDir := strings.TrimPrefix(o.cfg.StateDir, "file://")
	if err := os.MkdirAll(stateDir, 0o755); err != nil {
		return fmt.Errorf("create state dir %s: %w", stateDir, err)
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
				os.Remove(tailnetStateFile)
			}()
		}

		log.Println("creating auth key")
		authKey, err = o.tailnet.CreateAuthKey(ctx, o.cfg.OAuthClientID, o.cfg.OAuthClientSecret)
		if err != nil {
			return fmt.Errorf("create auth key: %w", err)
		}
		authKeyCreated = time.Now()

		// Join the tailnet as the orchestrator node
		o.tsnetSrv = &tsnet.Server{
			Dir:           filepath.Join(".tailbench", "tsnet"),
			Hostname:      "tailbench-orchestrator",
			AuthKey:       authKey,
			Ephemeral:     true,
			AdvertiseTags: []string{o.cfg.Tag},
		}
		log.Println("starting tsnet server")
		if _, err := o.tsnetSrv.Up(ctx); err != nil {
			return fmt.Errorf("tsnet up: %w", err)
		}
		defer o.tsnetSrv.Close()
		log.Println("tsnet server joined tailnet")
	}

	if len(o.providers) == 1 {
		return o.runProvider(ctx, o.providers[0], &authKey, &authKeyCreated)
	}

	var wg sync.WaitGroup
	errCh := make(chan error, len(o.providers))
	for _, p := range o.providers {
		wg.Add(1)
		go func(p provider.Provider) {
			defer wg.Done()
			if err := o.runProvider(ctx, p, &authKey, &authKeyCreated); err != nil {
				errCh <- fmt.Errorf("%s: %w", p.Name(), err)
			}
		}(p)
	}
	wg.Wait()
	close(errCh)

	var errs []string
	for err := range errCh {
		errs = append(errs, err.Error())
	}
	if len(errs) > 0 {
		return fmt.Errorf("provider errors:\n  %s", strings.Join(errs, "\n  "))
	}
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
	prefix := fmt.Sprintf("[%s]", p.Name())
	log.Printf("%s setting up networking", prefix)
	net, err := p.SetupNetworking(ctx)
	if err != nil {
		return fmt.Errorf("setup networking: %w", err)
	}

	// Install Tailscale operator on K8s providers for API server proxy
	if kp, ok := p.(provider.K8sOperatorProvider); ok && o.tsnetSrv != nil && o.tailnetDNS != "" {
		kp.SetTsnetServer(o.tsnetSrv)
		log.Printf("%s installing Tailscale operator", prefix)
		if err := kp.InstallOperator(ctx, provider.OperatorInstallConfig{
			OAuthClientID:     o.cfg.OAuthClientID,
			OAuthClientSecret: o.cfg.OAuthClientSecret,
			Tag:               o.cfg.Tag,
			TailnetDNS:        o.tailnetDNS,
			TsnetSrv:          o.tsnetSrv,
		}); err != nil {
			log.Printf("%s warning: operator install failed, falling back to direct kubeconfig: %v", prefix, err)
		} else {
			log.Printf("%s operator API proxy at %s", prefix, kp.OperatorProxyFQDN())
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
		list, err := p.ListInstances(ctx, fam)
		if err != nil {
			log.Printf("%s warning: listing instances for family %s: %v", prefix, fam, err)
			continue
		}
		instances = append(instances, list...)
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

	log.Printf("%s %d instance types to benchmark", prefix, len(instances))

	skippedFamilies := map[string]bool{}

	for _, inst := range instances {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		family := provider.GetInstanceFamily(p.Name(), inst.Type)
		if skippedFamilies[family] {
			log.Printf("%s skipping %s (family %s quota exceeded)", prefix, inst.Type, family)
			continue
		}

		resultPath := filepath.Join(o.cfg.RootDir, p.Name(), family, "results", inst.Type+".json")
		if _, err := os.Stat(resultPath); err == nil {
			log.Printf("%s skipping %s (result exists)", prefix, inst.Type)
			continue
		}

		safeType := safeHostname(inst.Type)
		serverHostname := fmt.Sprintf("tb-%s-server-%s", p.Name(), safeType)
		clientHostname := fmt.Sprintf("tb-%s-client-%s", p.Name(), safeType)

		var userData, clientUserData string
		if isK8sProvider(p.Name()) {
			userData = *authKey
		} else {
			serverUD, err := cloudinit.Render(cloudinit.Config{AuthKey: *authKey, Hostname: serverHostname, EnableSSH: true})
			if err != nil {
				log.Printf("%s error rendering cloud-init for %s: %v", prefix, inst.Type, err)
				continue
			}
			userData = serverUD
			clientUD, err := cloudinit.Render(cloudinit.Config{AuthKey: *authKey, Hostname: clientHostname, EnableSSH: true})
			if err != nil {
				log.Printf("%s error rendering cloud-init for %s: %v", prefix, inst.Type, err)
				continue
			}
			clientUserData = clientUD
		}

		log.Printf("%s creating pair for %s", prefix, inst.Type)
		pair, err := p.CreatePair(ctx, provider.PairOptions{
			InstanceType:   inst.Type,
			UserData:       userData,
			ClientUserData: clientUserData,
			Networking:     net,
			BenchImage:     o.cfg.BenchImage,
			TSImage:        o.cfg.TSImage,
		})
		if err != nil {
			if p.IsQuotaError(err) {
				log.Printf("%s quota exceeded for family %s, skipping remaining in family", prefix, family)
				skippedFamilies[family] = true
			} else {
				log.Printf("%s error creating pair for %s: %v", prefix, inst.Type, err)
			}
			continue
		}

		benchErr := o.runBenchmark(ctx, p, pair, inst, family, prefix, serverHostname, clientHostname, *authKey)
		log.Printf("%s destroying pair for %s", prefix, inst.Type)
		if err := p.DestroyPair(ctx, inst.Type); err != nil {
			log.Printf("%s warning: destroy pair %s: %v", prefix, inst.Type, err)
		}

		if benchErr != nil {
			log.Printf("%s benchmark error for %s: %v", prefix, inst.Type, benchErr)
		}

		if o.cfg.CreateTailnet && time.Since(*authKeyCreated) > time.Duration(o.cfg.AuthKeyRefreshSec)*time.Second {
			log.Printf("%s refreshing auth key", prefix)
			newKey, err := o.tailnet.CreateAuthKey(ctx, o.cfg.OAuthClientID, o.cfg.OAuthClientSecret)
			if err != nil {
				log.Printf("%s warning: auth key refresh failed: %v", prefix, err)
			} else {
				*authKey = newKey
				*authKeyCreated = time.Now()
			}
		}
	}

	if err := result.Aggregate(o.cfg.RootDir); err != nil {
		log.Printf("%s warning: aggregation failed: %v", prefix, err)
	}

	if o.cfg.CleanupNetworking {
		log.Printf("%s tearing down networking", prefix)
		if err := p.TeardownNetworking(ctx); err != nil {
			log.Printf("%s warning: teardown networking: %v", prefix, err)
		}
	}
	return nil
}

func (o *Orchestrator) runBenchmark(ctx context.Context, p provider.Provider, pair *provider.PairOutput, inst provider.InstanceInfo, family, prefix, serverHostname, clientHostname, authKey string) error {
	if pair.Namespace != "" {
		return o.runK8sBenchmark(ctx, p, pair, inst, family, prefix, serverHostname, clientHostname, authKey)
	}

	// SSH into VMs over the Tailscale network via tsnet
	log.Printf("%s dialing server via tsnet (%s)", prefix, serverHostname)
	serverSSH, err := sshclient.Dial(o.tsnetSrv, serverHostname, "root", o.cfg.SSHTimeout)
	if err != nil {
		return fmt.Errorf("ssh dial server: %w", err)
	}
	defer serverSSH.Close()

	log.Printf("%s dialing client via tsnet (%s)", prefix, clientHostname)
	clientSSH, err := sshclient.Dial(o.tsnetSrv, clientHostname, "root", o.cfg.SSHTimeout)
	if err != nil {
		return fmt.Errorf("ssh dial client: %w", err)
	}
	defer clientSSH.Close()

	log.Printf("%s waiting for server ready", prefix)
	if err := serverSSH.WaitForReady(ctx); err != nil {
		return fmt.Errorf("server ready: %w", err)
	}
	log.Printf("%s waiting for client ready", prefix)
	if err := clientSSH.WaitForReady(ctx); err != nil {
		return fmt.Errorf("client ready: %w", err)
	}

	runner := &benchmark.Runner{
		Server:          serverSSH,
		Client:          clientSSH,
		ServerTailscale: serverSSH,
		ClientTailscale: clientSSH,
		Config: benchmark.RunConfig{
			IPerfDuration:      o.cfg.IPerfDuration,
			IPerfParallel:      o.cfg.IPerfParallel,
			IPerfIterations:    o.cfg.IPerfIterations,
			MTRCycles:          o.cfg.MTRCycles,
			CooldownSec:        o.cfg.CooldownSec,
			CreditRetrySec:     o.cfg.CreditRetrySec,
			AuthKey:            authKey,
			ServerHostname:     serverHostname,
			ClientHostname:     clientHostname,
			SkipTailscaleSetup: true,
		},
	}

	return o.runModeLoop(ctx, runner, p, pair, inst, family, prefix, "vm")
}

func (o *Orchestrator) runModeLoop(ctx context.Context, runner *benchmark.Runner, p provider.Provider, pair *provider.PairOutput, inst provider.InstanceInfo, family, prefix, env string) error {
	for _, mode := range o.cfg.Modes {
		if !benchmark.ModeAppliesTo(mode, env) {
			log.Printf("%s skipping mode %s (not applicable to %s)", prefix, mode, env)
			continue
		}

		var br *result.BenchmarkResult

		switch {
		case benchmark.ModeUsesIperf(mode):
			log.Printf("%s running iperf benchmark for %s mode %s", prefix, inst.Type, mode)
			var err error
			br, err = runner.RunFull(ctx, pair.ServerLANIP, pair.ClientLANIP)
			if err != nil {
				return fmt.Errorf("mode %s: %w", mode, err)
			}
		case benchmark.ModeUsesFortio(mode):
			target, baselineTarget := o.resolveEndpoints(mode, pair)
			if target == "" {
				log.Printf("%s skipping mode %s: no endpoint configured", prefix, mode)
				continue
			}
			if strings.HasPrefix(mode, "l7-") {
				if err := o.warmUpTLS(ctx, runner.Client, target); err != nil {
					log.Printf("%s skipping mode %s: TLS warm-up failed: %v", prefix, mode, err)
					continue
				}
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
		default:
			log.Printf("%s skipping mode %s: not yet implemented", prefix, mode)
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

func (o *Orchestrator) resolveEndpoints(mode string, pair *provider.PairOutput) (target, baseline string) {
	switch {
	case strings.HasPrefix(mode, "l7-ingress"):
		if o.cfg.IngressFQDN != "" {
			target = "https://" + o.cfg.IngressFQDN
		}
		baseline = "http://bench-echo.tailbench.svc.cluster.local:8080"
	case strings.HasPrefix(mode, "l7-serve"):
		if o.cfg.ServeFQDN != "" {
			target = "https://" + o.cfg.ServeFQDN
		}
		baseline = "http://" + pair.ServerLANIP + ":8080"
	case mode == "l4-lb":
		target = "http://" + pair.ServerLANIP + ":8080"
		baseline = "http://bench-echo.tailbench.svc.cluster.local:8080"
	}
	return
}

func (o *Orchestrator) warmUpTLS(ctx context.Context, executor benchmark.Executor, target string) error {
	for attempt := 0; attempt < 5; attempt++ {
		backoff := time.Duration(1<<attempt) * time.Second
		_, _, err := executor.Run(ctx, fmt.Sprintf("curl -sf --max-time 15 -o /dev/null %s", target))
		if err == nil {
			return nil
		}
		log.Printf("TLS warm-up attempt %d/5 failed: %v, retrying in %v", attempt+1, err, backoff)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(backoff):
		}
	}
	return fmt.Errorf("TLS cert not ready after 5 attempts for %s", target)
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

func (o *Orchestrator) runK8sBenchmark(ctx context.Context, p provider.Provider, pair *provider.PairOutput, inst provider.InstanceInfo, family, prefix, serverHostname, clientHostname, authKey string) error {
	log.Printf("%s constructing kubectl exec transport", prefix)

	var serverBench, clientBench, serverTS, clientTS *k8s.KubeExecExecutor

	// Use operator API server proxy if available (routes through tailnet via tsnet)
	if kp, ok := p.(provider.K8sOperatorProvider); ok && kp.OperatorProxyFQDN() != "" {
		log.Printf("%s using operator API proxy at %s", prefix, kp.OperatorProxyFQDN())
		cs, cfg, err := k8s.ClientsetViaTsnet(o.tsnetSrv, kp.OperatorProxyFQDN())
		if err != nil {
			return fmt.Errorf("tsnet clientset: %w", err)
		}
		dialer := func(ctx context.Context, network, addr string) (net.Conn, error) {
			return o.tsnetSrv.Dial(ctx, network, addr)
		}
		serverBench = k8s.NewKubeExecExecutorFromConfig(cs, cfg, dialer, pair.Namespace, pair.ServerName, k8s.BenchContainer)
		clientBench = k8s.NewKubeExecExecutorFromConfig(cs, cfg, dialer, pair.Namespace, pair.ClientName, k8s.BenchContainer)
		serverTS = k8s.NewKubeExecExecutorFromConfig(cs, cfg, dialer, pair.Namespace, pair.ServerName, k8s.TSContainer)
		clientTS = k8s.NewKubeExecExecutorFromConfig(cs, cfg, dialer, pair.Namespace, pair.ClientName, k8s.TSContainer)
	} else {
		var err error
		serverBench, err = k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ServerName, k8s.BenchContainer)
		if err != nil {
			return fmt.Errorf("server bench executor: %w", err)
		}
		clientBench, err = k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ClientName, k8s.BenchContainer)
		if err != nil {
			return fmt.Errorf("client bench executor: %w", err)
		}
		serverTS, err = k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ServerName, k8s.TSContainer)
		if err != nil {
			return fmt.Errorf("server tailscale executor: %w", err)
		}
		clientTS, err = k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ClientName, k8s.TSContainer)
		if err != nil {
			return fmt.Errorf("client tailscale executor: %w", err)
		}
	}

	runner := &benchmark.Runner{
		Server:          serverBench,
		Client:          clientBench,
		ServerTailscale: serverTS,
		ClientTailscale: clientTS,
		Config: benchmark.RunConfig{
			IPerfDuration:      o.cfg.IPerfDuration,
			IPerfParallel:      o.cfg.IPerfParallel,
			IPerfIterations:    o.cfg.IPerfIterations,
			MTRCycles:          o.cfg.MTRCycles,
			CooldownSec:        o.cfg.CooldownSec,
			CreditRetrySec:     o.cfg.CreditRetrySec,
			AuthKey:            authKey,
			ServerHostname:     serverHostname,
			ClientHostname:     clientHostname,
			SkipTailscaleSetup: true,
		},
	}

	return o.runModeLoop(ctx, runner, p, pair, inst, family, prefix, "container")
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
