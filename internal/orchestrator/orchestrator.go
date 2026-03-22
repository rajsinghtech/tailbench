package orchestrator

import (
	"context"
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
	"github.com/rajsinghtech/tailbench/internal/provider"
	"github.com/rajsinghtech/tailbench/internal/result"
	"github.com/rajsinghtech/tailbench/internal/sshclient"
	"github.com/rajsinghtech/tailbench/internal/tailnet"
)

type Orchestrator struct {
	cfg       *config.Config
	providers []provider.Provider
	tailnet   *tailnet.Manager
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
		pubKey, err := os.ReadFile(cfg.SSHPubKeyPath)
		if err != nil {
			return nil, fmt.Errorf("read SSH pub key %s: %w", cfg.SSHPubKeyPath, err)
		}
		// Derive region from zone (e.g. us-central1-a -> us-central1)
		region := cfg.GCPZone
		if idx := strings.LastIndex(cfg.GCPZone, "-"); idx > 0 {
			region = cfg.GCPZone[:idx]
		}
		return &provider.GCPProvider{
			Project:   cfg.GCPProject,
			Zone:      cfg.GCPZone,
			Region:    region,
			Network:   "default",
			Subnet:    "default",
			SSHPubKey: strings.TrimSpace(string(pubKey)),
			SSHUser:   "ubuntu",
			StateDir:  cfg.StateDir,
		}, nil
	case "aws":
		return &provider.AWSProvider{
			Region:   cfg.AWSRegion,
			AZ:       cfg.AWSAZ,
			KeyName:  cfg.AWSKeyName,
			SSHUser:  cfg.SSHUser,
			StateDir: cfg.StateDir,
		}, nil
	case "azure":
		pubKey, err := os.ReadFile(cfg.SSHPubKeyPath)
		if err != nil {
			return nil, fmt.Errorf("read SSH pub key %s: %w", cfg.SSHPubKeyPath, err)
		}
		return &provider.AzureProvider{
			Location:      cfg.AzureLocation,
			ResourceGroup: cfg.AzureResourceGroup,
			SSHUser:       "azureuser",
			SSHPubKey:     strings.TrimSpace(string(pubKey)),
			StateDir:      cfg.StateDir,
		}, nil
	case "eks":
		return nil, fmt.Errorf("eks provider not yet implemented")
	case "gke":
		return nil, fmt.Errorf("gke provider not yet implemented")
	case "aks":
		return nil, fmt.Errorf("aks provider not yet implemented")
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

		tailnetName := fmt.Sprintf("tailbench-%d", time.Now().Unix())
		log.Printf("creating tailnet %s", tailnetName)
		info, err := o.tailnet.CreateTailnet(ctx, tailnetName)
		if err != nil {
			return fmt.Errorf("create tailnet: %w", err)
		}
		log.Printf("tailnet created: %s", info.DNSName)

		defer func() {
			log.Printf("deleting tailnet %s", info.DNSName)
			// Use background context so deletion proceeds even if ctx is cancelled.
			delCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			if err := o.tailnet.DeleteTailnet(delCtx, info.DNSName); err != nil {
				log.Printf("warning: tailnet deletion failed: %v", err)
			}
		}()

		log.Println("setting up ACL")
		if err := o.tailnet.SetupACL(ctx, info.OAuthClientID, info.OAuthClientSecret); err != nil {
			return fmt.Errorf("setup ACL: %w", err)
		}

		log.Println("creating auth key")
		authKey, err = o.tailnet.CreateAuthKey(ctx, info.OAuthClientID, info.OAuthClientSecret)
		if err != nil {
			return fmt.Errorf("create auth key: %w", err)
		}
		authKeyCreated = time.Now()

		// Store credentials for auth key refresh in runProvider
		o.cfg.OAuthClientID = info.OAuthClientID
		o.cfg.OAuthClientSecret = info.OAuthClientSecret
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

	// Build instance list
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

	// Apply regex filter
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

		// Resume support: skip if result file already exists
		resultPath := filepath.Join(o.cfg.RootDir, p.Name(), family, "results", inst.Type+".json")
		if _, err := os.Stat(resultPath); err == nil {
			log.Printf("%s skipping %s (result exists)", prefix, inst.Type)
			continue
		}

		// Render cloud-init
		safeType := safeHostname(inst.Type)
		serverHostname := fmt.Sprintf("tb-%s-server-%s", p.Name(), safeType)
		clientHostname := fmt.Sprintf("tb-%s-client-%s", p.Name(), safeType)

		var userData string
		if isK8sProvider(p.Name()) {
			userData = *authKey
		} else {
			serverUD, err := cloudinit.Render(cloudinit.Config{AuthKey: *authKey, Hostname: serverHostname})
			if err != nil {
				log.Printf("%s error rendering cloud-init for %s: %v", prefix, inst.Type, err)
				continue
			}
			userData = serverUD
			clientUD, err := cloudinit.Render(cloudinit.Config{AuthKey: *authKey, Hostname: clientHostname})
			if err != nil {
				log.Printf("%s error rendering cloud-init for %s: %v", prefix, inst.Type, err)
				continue
			}
			_ = clientUD // Both VMs get the same user-data; CreatePair handles distribution
		}

		log.Printf("%s creating pair for %s", prefix, inst.Type)
		pair, err := p.CreatePair(ctx, provider.PairOptions{
			InstanceType: inst.Type,
			UserData:     userData,
			Networking:   net,
			SSHKeyPath:   o.cfg.SSHKeyPath,
			SSHPubKey:    sshPubKeyForProvider(p.Name(), o.cfg),
			SSHUser:      sshUserForProvider(p.Name(), o.cfg),
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

		// Run benchmark and always destroy pair afterwards
		benchErr := o.runBenchmark(ctx, p, pair, inst, family, prefix, serverHostname, clientHostname, *authKey)
		log.Printf("%s destroying pair for %s", prefix, inst.Type)
		if err := p.DestroyPair(ctx, inst.Type); err != nil {
			log.Printf("%s warning: destroy pair %s: %v", prefix, inst.Type, err)
		}

		if benchErr != nil {
			log.Printf("%s benchmark error for %s: %v", prefix, inst.Type, benchErr)
		}

		// ENA Express check for AWS
		if p.Name() == "aws" {
			vcpus, _ := p.GetVCPUs(ctx, inst.Type)
			if provider.SupportsENAExpress(inst.Type, vcpus) {
				log.Printf("%s %s supports ENA Express (vcpus=%d)", prefix, inst.Type, vcpus)
				// TODO: enable ENA Express via AWS SDK and re-run benchmark
			}
		}

		// Auth key refresh
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

	// Aggregate results
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

	sshUser := sshUserForProvider(p.Name(), o.cfg)

	// Connect SSH to both VMs
	var serverSSH, clientSSH *sshclient.Client
	var err error

	if p.Name() == "gcp" {
		// GCP injects the SSH key via instance metadata; use the private key directly
		keyData, err := os.ReadFile(strings.TrimSuffix(o.cfg.SSHPubKeyPath, ".pub"))
		if err != nil {
			return fmt.Errorf("read SSH private key: %w", err)
		}
		serverSSH, err = sshclient.Dial(pair.ServerIP, sshUser, keyData, o.cfg.SSHTimeout)
		if err != nil {
			return fmt.Errorf("ssh dial server: %w", err)
		}
		clientSSH, err = sshclient.Dial(pair.ClientIP, sshUser, keyData, o.cfg.SSHTimeout)
		if err != nil {
			serverSSH.Close()
			return fmt.Errorf("ssh dial client: %w", err)
		}
	} else {
		serverSSH, err = sshclient.DialWithKeyFile(pair.ServerIP, sshUser, o.cfg.SSHKeyPath, o.cfg.SSHTimeout)
		if err != nil {
			return fmt.Errorf("ssh dial server: %w", err)
		}
		clientSSH, err = sshclient.DialWithKeyFile(pair.ClientIP, sshUser, o.cfg.SSHKeyPath, o.cfg.SSHTimeout)
		if err != nil {
			serverSSH.Close()
			return fmt.Errorf("ssh dial client: %w", err)
		}
	}
	defer serverSSH.Close()
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
			IPerfDuration:   o.cfg.IPerfDuration,
			IPerfParallel:   o.cfg.IPerfParallel,
			IPerfIterations: o.cfg.IPerfIterations,
			MTRCycles:       o.cfg.MTRCycles,
			CooldownSec:     o.cfg.CooldownSec,
			CreditRetrySec:  o.cfg.CreditRetrySec,
			AuthKey:         authKey,
			ServerHostname:  serverHostname,
			ClientHostname:  clientHostname,
		},
	}

	log.Printf("%s running benchmark for %s", prefix, inst.Type)
	benchResult, err := runner.RunFull(ctx, pair.ServerLANIP, pair.ClientLANIP)
	if err != nil {
		return fmt.Errorf("benchmark %s: %w", inst.Type, err)
	}

	// Fill in metadata fields
	benchResult.CloudProvider = p.Name()
	benchResult.InstanceFamily = family
	benchResult.InstanceType = inst.Type
	benchResult.VCPUs = inst.VCPUs
	benchResult.Date = time.Now().UTC().Format("2006-01-02")

	switch p.Name() {
	case "gcp":
		benchResult.Region = o.cfg.GCPZone[:strings.LastIndex(o.cfg.GCPZone, "-")]
		benchResult.Zone = o.cfg.GCPZone
	case "aws":
		benchResult.Region = o.cfg.AWSRegion
		benchResult.Zone = o.cfg.AWSAZ
	case "azure":
		benchResult.Region = o.cfg.AzureLocation
		benchResult.Zone = o.cfg.AzureLocation
	}

	if pair.Namespace != "" {
		benchResult.Environment = "container"
	} else {
		benchResult.Environment = "vm"
	}

	if err := result.WriteResult(o.cfg.RootDir, benchResult, false); err != nil {
		return fmt.Errorf("write result: %w", err)
	}
	log.Printf("%s result written for %s", prefix, inst.Type)
	return nil
}

// safeHostname converts an instance type string into a valid hostname component.
func safeHostname(instanceType string) string {
	s := strings.ToLower(instanceType)
	s = strings.NewReplacer(".", "-", "_", "-").Replace(s)
	return s
}

func sshUserForProvider(name string, cfg *config.Config) string {
	switch name {
	case "gcp":
		return "ubuntu"
	case "azure":
		return "azureuser"
	default:
		return cfg.SSHUser
	}
}

func sshPubKeyForProvider(name string, cfg *config.Config) string {
	switch name {
	case "gcp", "azure":
		data, err := os.ReadFile(cfg.SSHPubKeyPath)
		if err != nil {
			return ""
		}
		return strings.TrimSpace(string(data))
	default:
		return ""
	}
}

func isK8sProvider(name string) bool {
	switch name {
	case "eks", "gke", "aks":
		return true
	}
	return false
}

func (o *Orchestrator) runK8sBenchmark(ctx context.Context, p provider.Provider, pair *provider.PairOutput, inst provider.InstanceInfo, family, prefix, serverHostname, clientHostname, authKey string) error {
	return fmt.Errorf("k8s benchmark not yet implemented")
}
