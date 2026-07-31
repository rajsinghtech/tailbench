package orchestrator

import (
	"context"
	"encoding/json"
	"errors"
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
	"github.com/rajsinghtech/tailbench/internal/failure"
	"github.com/rajsinghtech/tailbench/internal/logger"
	"github.com/rajsinghtech/tailbench/internal/provider"
	"github.com/rajsinghtech/tailbench/internal/result"
	"github.com/rajsinghtech/tailbench/internal/retry"
	"github.com/rajsinghtech/tailbench/internal/sshclient"
	"github.com/rajsinghtech/tailbench/internal/tailnet"
	"tailscale.com/tsnet"
)

type Orchestrator struct {
	cfg        *config.Config
	providers  []provider.Provider
	tailnet    TailnetManager
	tsnetSrv   *tsnet.Server
	tailnetDNS string // e.g. "tailXXXX.ts.net"
	recorder   StateRecorder
}

type ProviderFactory func(name string, cfg *config.Config) (provider.Provider, error)

type TailnetManager interface {
	CreateTailnet(context.Context, string) (*tailnet.TailnetInfo, error)
	DeleteTailnet(context.Context, string) error
	SetupACL(context.Context, string, string, bool, bool) error
	EnableHTTPS(context.Context, string, string) error
	CreateAuthKey(context.Context, string, string) (string, error)
	CleanupStaleDevices(context.Context, string, string, string) (int, error)
}

// StateRecorder is the dependency-light persistence seam used to make
// externally visible work durable at the moment it happens. The command layer
// adapts it to the versioned run manifest.
type StateRecorder interface {
	BeforeExternalStep(stage, workID, message string) error
	AfterExternalStep(stage, workID, status, message string) error
	RecordResources(resources ...ResourceRecord) error
}

// Outcome keeps benchmark/provisioning failures independent from cleanup
// failures so the command boundary cannot report a successful cleanup merely
// because benchmark work produced a result.
type Outcome struct {
	BenchmarkErr     error
	CleanupErr       error
	ResourcesChanged bool
	Resources        []ResourceRecord
}

type ResourceRecord struct {
	ID               string
	Kind             string
	ProviderID       string
	StackName        string
	Hostname         string
	CleanupOwner     string
	Status           string
	OwnershipCertain bool
	InstanceType     string
}

const (
	runstateResourceCreating = "creating"
	runstateResourceCreated  = "created"
	runstateResourceCleaning = "cleaning"
	runstateResourceCleaned  = "cleaned"
)

func (o Outcome) Err() error {
	return errors.Join(o.BenchmarkErr, o.CleanupErr)
}

func (o *Outcome) merge(other Outcome) {
	o.BenchmarkErr = errors.Join(o.BenchmarkErr, other.BenchmarkErr)
	o.CleanupErr = errors.Join(o.CleanupErr, other.CleanupErr)
	o.ResourcesChanged = o.ResourcesChanged || other.ResourcesChanged
	o.Resources = append(o.Resources, other.Resources...)
}

// validateCredentials reports whether cfg carries usable Tailscale OAuth
// credentials, with an error that names what is missing and where to set it.
//
// Reached only when there is no cached tailnet in .tailbench/tailnet.json — a
// resumed run takes its credentials from that file, so cfg may legitimately be
// empty there and must not be rejected.
//
// Presence is all that is checked. Tailscale issues opaque keys, so any
// shape check risks rejecting something valid and would break silently if the
// key format ever changes; validity is the API's call, reported as a 401. This
// matches provider.CheckBackendCredentials, which likewise checks presence and
// delegates validity to the service.
func validateCredentials(cfg *config.Config) error {
	var missing []string
	if cfg.OAuthClientID == "" {
		missing = append(missing, "OAUTH_CLIENT_ID")
	}
	if cfg.OAuthClientSecret == "" {
		missing = append(missing, "OAUTH_CLIENT_SECRET")
	}
	if len(missing) == 0 {
		return nil
	}

	return fmt.Errorf(`missing Tailscale credentials: %s are empty

They are needed to create a new tailnet, and no cached tailnet was found at
.tailbench/tailnet.json, so there is nothing to fall back on.

Set them in .env, which config.yaml references via "env_file:" and expands into
the ${VAR} placeholders under "tailscale:" — or export them in the environment:

    cp .env.example .env

The OAuth client must be org-level and able to create tailnets (tailbench calls
/api/v2/organizations/-/tailnets), plus write auth keys, the policy file, and
devices. Create one at https://login.tailscale.com/admin/settings/oauth — and
note that tailbench creates and deletes real tailnets, so use disposable org
credentials.

To run without credentials, use --dry-run (or set create_tailnet: false to
benchmark an existing tailnet)`, strings.Join(missing, " and "))
}

// validateModeNames rejects unrecognized mode strings at startup. ModeAppliesTo
// has a permissive default, so without this a typo survives validation and is
// only caught by runModeLoop's "skipping unknown mode" branch — after a VM pair
// has already been provisioned and paid for.
func validateModeNames(cfg *config.Config) error {
	for _, mode := range cfg.Modes {
		if !benchmark.IsValidMode(mode) {
			return fmt.Errorf("unknown benchmark mode %q in benchmark.modes; valid modes are: %s",
				mode, strings.Join(benchmark.ValidModes(), ", "))
		}
	}
	return nil
}

func New(cfg *config.Config, factory ProviderFactory) (*Orchestrator, error) {
	if factory == nil {
		return nil, fmt.Errorf("provider factory is required")
	}
	if err := validateModeNames(cfg); err != nil {
		return nil, err
	}
	if err := provider.CheckBackendCredentials(cfg.StateBackend); err != nil {
		return nil, err
	}
	if err := validateWorkloadConfig(cfg); err != nil {
		return nil, err
	}
	// Nodes join a tailnet with an auth key, and an auth key needs a tailnet to
	// mint it against. With neither a tailnet to create nor one to join, every
	// instance would fail at provisioning with "auth key is empty" — after the
	// networking stack was built. Checked here rather than at parse time so
	// plan and doctor keep working on a config that is not ready to run.
	if !cfg.CreateTailnet && cfg.TailnetDNSName == "" {
		return nil, fmt.Errorf(
			"no tailnet configured: set tailscale.create_tailnet: true to create an " +
				"ephemeral tailnet, or tailscale.tailnet_dns_name to benchmark an " +
				"existing one (for example example-name.ts.net)")
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

func (o *Orchestrator) SetStateRecorder(recorder StateRecorder) {
	o.recorder = recorder
}

func (o *Orchestrator) Run(ctx context.Context) error {
	return o.RunWithOutcome(ctx).Err()
}

func (o *Orchestrator) RunWithOutcome(ctx context.Context) (outcome Outcome) {
	// The shared command layer owns local planning. Keep this compatibility
	// branch inert so legacy DryRun configuration cannot create Pulumi state or
	// accidentally turn provider discovery into an implicit remote check.
	if o.cfg.DryRun {
		return outcome
	}

	stateDir := strings.TrimPrefix(o.cfg.StateDir, "file://")

	// A remote backend keeps stacks off this machine, so there is no local state
	// directory to create — Pulumi gets scratch space under .tailbench instead
	// (provider.WorkDir). Stale-lock recovery is the remote service's job there,
	// and locally it is now an explicit, manifest-scoped
	// `cleanup RUN_ID --recover-pulumi-locks` step rather than a startup sweep.
	if provider.IsRemoteBackend(o.cfg.StateBackend) {
		// Stacks outlive this checkout, so a run started elsewhere can be
		// resumed or torn down from here.
		log.Printf("pulumi state backend: %s (remote — stacks persist across machines)", o.cfg.StateBackend)
	} else {
		log.Printf("pulumi state backend: local %s", stateDir)
		if err := os.MkdirAll(stateDir, 0o755); err != nil {
			outcome.BenchmarkErr = fmt.Errorf("create state dir %s: %w", stateDir, err)
			return outcome
		}
	}

	var authKey string
	var authKeyCreated time.Time

	if o.cfg.CreateTailnet || o.cfg.TailnetDNSName != "" {
		if o.tailnet == nil {
			o.tailnet = &tailnet.Manager{
				OrgClientID:     o.cfg.OAuthClientID,
				OrgClientSecret: o.cfg.OAuthClientSecret,
				Tag:             o.cfg.Tag,
			}
		}

		if !o.cfg.CreateTailnet {
			// Join an existing tailnet with the configured client. Nothing is
			// created and nothing is deleted, so no tailnet resource is
			// recorded and the cleanup defer below is deliberately skipped.
			//
			// SetupACL REPLACES the tailnet's policy file wholesale — see
			// tailnet.buildACL. Point this only at a tailnet dedicated to
			// benchmarking.
			o.tailnetDNS = o.cfg.TailnetDNSName
			log.Printf("using existing tailnet %s (its policy file will be replaced)", o.tailnetDNS)
			outcome.ResourcesChanged = true
			if err := o.tailnet.SetupACL(ctx, o.cfg.OAuthClientID, o.cfg.OAuthClientSecret, true, o.hasK8sProviders()); err != nil {
				outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, fmt.Errorf("setup ACL: %w", err))
				return outcome
			}
			if o.needsTailnetHTTPS() {
				log.Println("enabling HTTPS on tailnet (required by l7-serve and the operator proxy)")
				if err := o.tailnet.EnableHTTPS(ctx, o.cfg.OAuthClientID, o.cfg.OAuthClientSecret); err != nil {
					outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, fmt.Errorf("enable HTTPS: %w", err))
					return outcome
				}
			}
		}

		if o.cfg.CreateTailnet {
			tailnetStateFile := filepath.Join(".tailbench", "tailnet.json")
			if o.cfg.CleanupNetworking {
				defer func() {
					if o.tailnetDNS == "" ||
						!shouldCleanup(o.cfg.CleanupPolicy, outcome.BenchmarkErr) {
						return
					}
					if resource, ok := resourceWithStatus(&outcome, "tailscale/tailnet", runstateResourceCleaning); ok {
						outcome.CleanupErr = errors.Join(outcome.CleanupErr, o.recordResources(&outcome, resource))
					}
					outcome.CleanupErr = errors.Join(
						outcome.CleanupErr,
						o.beforeExternalStep("cleanup-tailnet", "", "delete run-owned tailnet"),
					)
					log.Printf("deleting tailnet %s", o.tailnetDNS)
					delCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
					defer cancel()
					outcome.ResourcesChanged = true
					if err := o.tailnet.DeleteTailnet(delCtx, o.tailnetDNS); err != nil {
						log.Printf("warning: tailnet deletion failed: %v", err)
						deleteErr := fmt.Errorf("delete tailnet: %w", err)
						outcome.CleanupErr = errors.Join(outcome.CleanupErr, deleteErr)
						outcome.CleanupErr = errors.Join(
							outcome.CleanupErr,
							o.afterExternalStep("cleanup-tailnet", "", "failed", deleteErr.Error()),
						)
					} else {
						if resource, ok := resourceWithStatus(&outcome, "tailscale/tailnet", runstateResourceCleaned); ok {
							outcome.CleanupErr = errors.Join(outcome.CleanupErr, o.recordResources(&outcome, resource))
						}
						outcome.CleanupErr = errors.Join(
							outcome.CleanupErr,
							o.afterExternalStep("cleanup-tailnet", "", "succeeded", "run-owned tailnet deleted"),
						)
					}
					if o.cfg.RunID == "" {
						removeErr := os.Remove(tailnetStateFile)
						if removeErr != nil && !os.IsNotExist(removeErr) {
							log.Printf("warning: remove tailnet state: %v", removeErr)
							outcome.CleanupErr = errors.Join(
								outcome.CleanupErr,
								fmt.Errorf("remove tailnet state: %w", removeErr),
							)
						}
					}
				}()
			}

			// Try to reuse an existing tailnet from a previous run
			info, err := loadTailnetState(tailnetStateFile)
			if o.cfg.RunID != "" {
				// Manifest-managed runs must own their tailnet. Reusing a global
				// tailnet would make cleanup ownership ambiguous across run IDs.
				info = nil
				err = os.ErrNotExist
			}
			if err == nil {
				log.Printf("reusing existing tailnet: %s", info.DNSName)
				o.tailnetDNS = info.DNSName
				o.cfg.OAuthClientID = info.OAuthClientID
				o.cfg.OAuthClientSecret = info.OAuthClientSecret

				// Always update ACL to pick up any tag/rule changes
				log.Println("updating ACL")
				outcome.ResourcesChanged = true
				if err := o.tailnet.SetupACL(ctx, info.OAuthClientID, info.OAuthClientSecret, true, o.hasK8sProviders()); err != nil {
					log.Printf("warning: ACL update failed: %v", err)
					outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, fmt.Errorf("update ACL: %w", err))
				}
				// A tailnet cached by an earlier run may predate the mode list
				// that now needs HTTPS, so re-assert it here rather than only
				// at creation.
				if o.needsTailnetHTTPS() {
					log.Println("enabling HTTPS on tailnet (required by l7-serve and the operator proxy)")
					if err := o.tailnet.EnableHTTPS(ctx, info.OAuthClientID, info.OAuthClientSecret); err != nil {
						outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, fmt.Errorf("enable HTTPS: %w", err))
						return outcome
					}
				}
			} else {
				// No cached tailnet: cfg credentials are the only ones available,
				// so this is the first point at which they must be usable.
				if err := validateCredentials(o.cfg); err != nil {
					outcome.BenchmarkErr = err
					return outcome
				}

				// Create a new tailnet
				tailnetName := fmt.Sprintf("tailbench-%d", time.Now().Unix())
				tailnetResource := ResourceRecord{
					ID:               "tailscale/tailnet",
					Kind:             "tailnet",
					CleanupOwner:     o.cfg.RunID,
					Status:           runstateResourceCreating,
					OwnershipCertain: o.cfg.RunID != "",
				}
				if o.cfg.RunID != "" {
					suffix := o.cfg.RunID
					if index := strings.LastIndex(suffix, "_"); index >= 0 {
						suffix = suffix[index+1:]
					}
					tailnetName = "tailbench-" + suffix
					if err := o.recordResources(&outcome, tailnetResource); err != nil {
						outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, err)
						return outcome
					}
					if err := o.beforeExternalStep("provision-tailnet", "", "create run-owned tailnet"); err != nil {
						outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, err)
						return outcome
					}
				}
				log.Printf("creating tailnet %s", tailnetName)
				outcome.ResourcesChanged = true
				info, err = o.tailnet.CreateTailnet(ctx, tailnetName)
				if err != nil {
					createErr := fmt.Errorf("create tailnet: %w", err)
					outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, createErr)
					outcome.BenchmarkErr = errors.Join(
						outcome.BenchmarkErr,
						o.afterExternalStep("provision-tailnet", "", "failed", createErr.Error()),
					)
					return outcome
				}
				log.Printf("tailnet created: %s", info.DNSName)
				o.tailnetDNS = info.DNSName
				o.cfg.OAuthClientID = info.OAuthClientID
				o.cfg.OAuthClientSecret = info.OAuthClientSecret
				if o.cfg.RunID != "" {
					tailnetResource.ProviderID = info.DNSName
					tailnetResource.Status = runstateResourceCreated
					if err := o.recordResources(&outcome, tailnetResource); err != nil {
						outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, err)
						return outcome
					}
					if err := o.afterExternalStep("provision-tailnet", "", "succeeded", "run-owned tailnet created"); err != nil {
						outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, err)
						return outcome
					}
				}

				// Save state for reuse in future runs
				if o.cfg.RunID == "" {
					err = saveTailnetState(tailnetStateFile, info)
				}
				if err != nil && o.cfg.RunID == "" {
					log.Printf("warning: could not save tailnet state: %v", err)
					outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, fmt.Errorf("save tailnet state: %w", err))
				}

				log.Println("setting up ACL")
				outcome.ResourcesChanged = true
				if err := o.tailnet.SetupACL(ctx, info.OAuthClientID, info.OAuthClientSecret, true, o.hasK8sProviders()); err != nil {
					outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, fmt.Errorf("setup ACL: %w", err))
					return outcome
				}

				if o.needsTailnetHTTPS() {
					log.Println("enabling HTTPS on tailnet (required by l7-serve and the operator proxy)")
					outcome.ResourcesChanged = true
					if err := o.tailnet.EnableHTTPS(ctx, info.OAuthClientID, info.OAuthClientSecret); err != nil {
						outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, fmt.Errorf("enable HTTPS: %w", err))
						return outcome
					}
				}
			}

		}

		// Shared by both paths: whichever tailnet we ended up on, the nodes
		// need an auth key minted with the credentials now in cfg.
		log.Println("creating auth key")
		outcome.ResourcesChanged = true
		newKey, keyErr := o.tailnet.CreateAuthKey(ctx, o.cfg.OAuthClientID, o.cfg.OAuthClientSecret)
		if keyErr != nil {
			outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, fmt.Errorf("create auth key: %w", keyErr))
			return outcome
		}
		authKey = newKey
		authKeyCreated = time.Now()

		// Keep node state scoped to the manifest-owned run. Reusing and
		// recursively deleting a global directory can corrupt another run.
		tsnetDir := tsnetStateDirectory(o.cfg)
		o.tsnetSrv = &tsnet.Server{
			Dir:           tsnetDir,
			Hostname:      "tailbench-orchestrator",
			AuthKey:       authKey,
			Ephemeral:     true,
			AdvertiseTags: []string{o.cfg.Tag},
		}
		log.Println("starting tsnet server")
		if _, err := o.tsnetSrv.Up(ctx); err != nil {
			outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, fmt.Errorf("tsnet up: %w", err))
			return outcome
		}
		defer func() {
			if err := o.tsnetSrv.Close(); err != nil {
				log.Printf("warning: close tsnet server: %v", err)
				outcome.CleanupErr = errors.Join(outcome.CleanupErr, fmt.Errorf("close tsnet server: %w", err))
			}
		}()
		log.Println("tsnet server joined tailnet")
	}

	if len(o.providers) == 1 {
		outcome.merge(o.runProvider(ctx, o.providers[0], &authKey, &authKeyCreated))
		return outcome
	}

	var wg sync.WaitGroup
	var outcomeMu sync.Mutex
	for _, p := range o.providers {
		wg.Add(1)
		go func(p provider.Provider) {
			defer wg.Done()
			providerOutcome := o.runProvider(ctx, p, &authKey, &authKeyCreated)
			if err := providerOutcome.Err(); err != nil {
				log.Printf("[%s] provider finished with error: %v", p.Name(), err)
			} else {
				log.Printf("[%s] provider finished successfully", p.Name())
			}
			if providerOutcome.BenchmarkErr != nil {
				providerOutcome.BenchmarkErr = fmt.Errorf("provider %s: %w", p.Name(), providerOutcome.BenchmarkErr)
			}
			if providerOutcome.CleanupErr != nil {
				providerOutcome.CleanupErr = fmt.Errorf("provider %s: %w", p.Name(), providerOutcome.CleanupErr)
			}
			outcomeMu.Lock()
			outcome.merge(providerOutcome)
			outcomeMu.Unlock()
		}(p)
	}
	wg.Wait()
	return outcome
}

func tsnetStateDirectory(cfg *config.Config) string {
	if cfg != nil && cfg.RunID != "" {
		return filepath.Join(".tailbench", "runs", cfg.RunID, "tsnet")
	}
	return filepath.Join(".tailbench", "tsnet")
}

func (o *Orchestrator) runProvider(
	ctx context.Context,
	p provider.Provider,
	authKey *string,
	authKeyCreated *time.Time,
) (outcome Outcome) {
	lg := logger.New(p.Name())
	recordBenchmarkFailure := func(err error) {
		if err != nil {
			outcome.BenchmarkErr = errors.Join(outcome.BenchmarkErr, err)
		}
	}
	recordCleanupFailure := func(err error) {
		if err != nil {
			outcome.CleanupErr = errors.Join(outcome.CleanupErr, err)
		}
	}
	lg.Step("setup", "networking")
	managedNetworking := providerManagesNetworking(p)
	networkResource := ResourceRecord{
		ID:               p.Name() + "/networking",
		Kind:             "networking",
		CleanupOwner:     o.cfg.RunID,
		Status:           runstateResourceCreating,
		OwnershipCertain: providerRunScoped(p),
	}
	if o.cfg.RunID != "" && managedNetworking {
		if err := o.recordResources(&outcome, networkResource); err != nil {
			recordBenchmarkFailure(err)
			return outcome
		}
	}
	if managedNetworking {
		err := o.beforeExternalStep("provision-networking", "", "set up provider networking")
		if err != nil {
			recordBenchmarkFailure(err)
			return outcome
		}
		defer func() {
			if !o.cfg.CleanupNetworking ||
				!shouldCleanup(o.cfg.CleanupPolicy, outcome.BenchmarkErr) {
				return
			}
			lg.Step("teardown", "networking")
			outcome.ResourcesChanged = true
			if resource, ok := resourceWithStatus(&outcome, p.Name()+"/networking", runstateResourceCleaning); ok {
				recordCleanupFailure(o.recordResources(&outcome, resource))
			}
			recordCleanupFailure(
				o.beforeExternalStep("cleanup-networking", "", "tear down provider networking"),
			)
			cleanupCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
			defer cancel()
			if err := p.TeardownNetworking(cleanupCtx); err != nil {
				lg.Warnf("teardown networking: %v", err)
				teardownErr := fmt.Errorf("teardown networking: %w", err)
				recordCleanupFailure(teardownErr)
				recordCleanupFailure(
					o.afterExternalStep("cleanup-networking", "", "failed", teardownErr.Error()),
				)
				return
			}
			if resource, ok := resourceWithStatus(&outcome, p.Name()+"/networking", runstateResourceCleaned); ok {
				recordCleanupFailure(o.recordResources(&outcome, resource))
			}
			recordCleanupFailure(
				o.afterExternalStep(
					"cleanup-networking",
					"",
					"succeeded",
					"provider networking destroyed",
				),
			)
		}()
	}
	outcome.ResourcesChanged = outcome.ResourcesChanged || managedNetworking
	net, err := p.SetupNetworking(ctx)
	if err != nil {
		setupErr := fmt.Errorf("setup networking: %w", err)
		recordBenchmarkFailure(setupErr)
		if managedNetworking {
			recordBenchmarkFailure(o.afterExternalStep("provision-networking", "", "failed", setupErr.Error()))
		}
		return outcome
	}
	if o.cfg.RunID != "" && managedNetworking {
		networkResource.ProviderID = net.ProviderID
		networkResource.StackName = net.StackName
		networkResource.Status = runstateResourceCreated
		if err := o.recordResources(&outcome, networkResource); err != nil {
			recordBenchmarkFailure(err)
			return outcome
		}
	}
	if managedNetworking {
		err := o.afterExternalStep("provision-networking", "", "succeeded", "provider networking ready")
		if err != nil {
			recordBenchmarkFailure(err)
			return outcome
		}
	}

	// Clean up stale tailnet devices from previous crashed runs
	if o.cfg.CreateTailnet {
		for _, prefix := range []string{
			fmt.Sprintf("tb-%s-", p.Name()),                // benchmark VMs/pods
			fmt.Sprintf("tailbench-%s-operator", p.Name()), // operator node
		} {
			outcome.ResourcesChanged = true
			if n, err := o.tailnet.CleanupStaleDevices(ctx, o.cfg.OAuthClientID, o.cfg.OAuthClientSecret, prefix); err != nil {
				lg.Warnf("device cleanup (%s): %v", prefix, err)
				recordCleanupFailure(fmt.Errorf("device cleanup %s: %w", prefix, err))
			} else if n > 0 {
				lg.Infof("cleaned up %d stale devices matching %s*", n, prefix)
			}
		}
	}

	if isK8sProvider(p.Name()) && net.Values["kubeconfig"] == "" {
		recordBenchmarkFailure(errors.New("setup kubernetes workload: provider networking did not return a kubeconfig"))
		return outcome
	}

	instances, err := o.listInstancesCached(ctx, p, lg)
	if err != nil {
		recordBenchmarkFailure(fmt.Errorf("listing instances: %w", err))
	}

	if o.cfg.Filter != "" {
		re, err := regexp.Compile(o.cfg.Filter)
		if err != nil {
			recordBenchmarkFailure(fmt.Errorf("invalid filter regex: %w", err))
			return outcome
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
	k8sSetupComplete := false

	for _, inst := range instances {
		if ctx.Err() != nil {
			recordBenchmarkFailure(ctx.Err())
			return outcome
		}

		// family keys the result path (per size on Azure); quotaGroup keys the
		// quota skip and must be the group-wide selector, so a denial skips the
		// larger sizes in the same family rather than only the one that failed.
		family := provider.GetInstanceFamily(p.Name(), inst.Type)
		quotaGroup := provider.InstanceFamilyGroup(p.Name(), inst.Type)
		if skippedFamilies[quotaGroup] {
			lg.Infof("skip %s (family %s quota exceeded)", inst.Type, quotaGroup)
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

		// forward-pps-exit and relay-throughput are VM-only and need a 3rd
		// node (the router under test). Base this on the work left for this
		// instance so reruns don't provision an unused router after its
		// result has already been written.
		wantRelay := !isK8sProvider(p.Name()) && hasRelayMode(pendingModes)
		wantRouter := !isK8sProvider(p.Name()) && (hasForwardMode(pendingModes) || wantRelay)

		var userData, clientUserData, routerUserData string
		if isK8sProvider(p.Name()) {
			userData = *authKey
		} else {
			if *authKey == "" {
				err := fmt.Errorf("prepare %s: auth key is empty", inst.Type)
				lg.Errf("%v", err)
				recordBenchmarkFailure(err)
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
				recordBenchmarkFailure(fmt.Errorf("cloud-init server for %s: %w", inst.Type, err))
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
				recordBenchmarkFailure(fmt.Errorf("cloud-init client for %s: %w", inst.Type, err))
				continue
			}
			clientUserData = clientUD
			if wantRouter {
				relayPort := 0
				if wantRelay {
					relayPort = benchmark.RelayUDPPort
				}
				routerUD, err := cloudinit.Render(cloudinit.Config{
					AuthKey:           *authKey,
					Hostname:          routerHostname,
					EnableSSH:         true,
					AdvertiseExitNode: hasForwardMode(pendingModes),
					RelayServerPort:   relayPort,
				})
				if err != nil {
					lg.Errf("cloud-init (router) for %s: %v", inst.Type, err)
					recordBenchmarkFailure(fmt.Errorf("cloud-init router for %s: %w", inst.Type, err))
					continue
				}
				routerUserData = routerUD
			}
		}

		// Pre-cleanup: destroy any leftover resources from a previous run.
		// This is a no-op if nothing exists, but ensures CreatePair starts clean.
		outcome.ResourcesChanged = true
		if dErr := p.DestroyPair(ctx, inst.Type); dErr != nil {
			lg.Infof("pre-cleanup %s: %v (continuing)", inst.Type, dErr)
			recordCleanupFailure(fmt.Errorf("pre-cleanup %s: %w", inst.Type, dErr))
		}

		lg.Step("provision", inst.Type)
		outcome.ResourcesChanged = true
		topologyResource := ResourceRecord{
			ID:               p.Name() + "/" + inst.Type + "/topology",
			Kind:             topologyKind(p.Name()),
			CleanupOwner:     o.cfg.RunID,
			Status:           string(runstateResourceCreating),
			OwnershipCertain: providerRunScoped(p),
			InstanceType:     inst.Type,
		}
		if err := o.recordResources(&outcome, topologyResource); err != nil {
			recordBenchmarkFailure(err)
			continue
		}
		if err := o.beforeExternalStep("provision", "", "create topology for "+inst.Type); err != nil {
			recordBenchmarkFailure(err)
			continue
		}
		provisionStart := time.Now()
		pair, err := p.CreatePair(ctx, provider.PairOptions{
			InstanceType:   inst.Type,
			UserData:       userData,
			ClientUserData: clientUserData,
			RouterUserData: routerUserData,
			WantRouter:     wantRouter,
			Networking:     net,
			BenchImage:     o.cfg.BenchImage,
			TSImage:        o.cfg.TSImage,
			RunID:          o.cfg.RunID,
			ExpiresAt:      o.cfg.ResourceExpiresAt,
		})
		if err != nil {
			createErr := fmt.Errorf("create pair %s: %w", inst.Type, err)
			recordBenchmarkFailure(createErr)
			recordBenchmarkFailure(o.afterExternalStep("provision", "", "failed", createErr.Error()))
			if p.IsQuotaError(err) {
				lg.Warnf("quota exceeded for %s, skipping family %s", inst.Type, quotaGroup)
				skippedFamilies[quotaGroup] = true
			} else {
				lg.Errf("create pair %s failed after %s: %v",
					inst.Type, time.Since(provisionStart).Round(time.Second), err)
			}
			// Destroy any partially-created resources (e.g. node pool created but nodes not ready)
			outcome.ResourcesChanged = true
			if dErr := p.DestroyPair(ctx, inst.Type); dErr != nil {
				lg.Warnf("cleanup failed pair %s: %v", inst.Type, dErr)
				recordCleanupFailure(fmt.Errorf("cleanup partially-created pair %s: %w", inst.Type, dErr))
			}
			continue
		}
		pairResources := pairResourceRecords(p.Name(), o.cfg.RunID, inst.Type, pair, providerRunScoped(p))
		if err := o.recordResources(&outcome, pairResources...); err != nil {
			recordBenchmarkFailure(err)
			outcome.ResourcesChanged = true
			if dErr := p.DestroyPair(ctx, inst.Type); dErr != nil {
				recordCleanupFailure(fmt.Errorf("cleanup unrecorded pair %s: %w", inst.Type, dErr))
			}
			continue
		}
		if err := o.afterExternalStep("provision", "", "succeeded", "topology created for "+inst.Type); err != nil {
			recordBenchmarkFailure(err)
			outcome.ResourcesChanged = true
			if dErr := p.DestroyPair(ctx, inst.Type); dErr != nil {
				recordCleanupFailure(fmt.Errorf("cleanup pair after state failure %s: %w", inst.Type, dErr))
			}
			continue
		}

		lg.Infof("provisioned %s in %s", inst.Type, time.Since(provisionStart).Round(time.Second))

		var benchErr error
		// Kubernetes workload setup needs schedulable nodes. Managed clusters
		// create their per-instance node pool in CreatePair, so installing the
		// operator before this point leaves Helm waiting on Pending pods.
		if isK8sProvider(p.Name()) && !k8sSetupComplete {
			if err := o.setupK8s(ctx, p, net, lg); err != nil {
				benchErr = fmt.Errorf("setup kubernetes workload: %w", err)
			} else {
				k8sSetupComplete = true
			}
		}
		if benchErr == nil {
			benchErr = o.runBenchmark(ctx, p, pair, inst, family, lg, serverHostname, clientHostname, routerHostname, *authKey)
		}
		if benchErr != nil {
			lg.Errf("benchmark %s: %v", inst.Type, benchErr)
			recordBenchmarkFailure(fmt.Errorf("benchmark %s: %w", inst.Type, benchErr))
		}

		if shouldCleanup(o.cfg.CleanupPolicy, outcome.BenchmarkErr) {
			lg.Step("teardown", inst.Type)
			outcome.ResourcesChanged = true
			cleaningResources := resourcesForInstanceStatus(&outcome, inst.Type, runstateResourceCleaning)
			if err := o.recordResources(&outcome, cleaningResources...); err != nil {
				recordCleanupFailure(err)
				continue
			}
			if err := o.beforeExternalStep("cleanup", "", "destroy topology for "+inst.Type); err != nil {
				recordCleanupFailure(err)
				continue
			}
			if err := p.DestroyPair(ctx, inst.Type); err != nil {
				lg.Warnf("destroy pair %s: %v", inst.Type, err)
				destroyErr := fmt.Errorf("destroy pair %s: %w", inst.Type, err)
				recordCleanupFailure(destroyErr)
				recordCleanupFailure(o.afterExternalStep("cleanup", "", "failed", destroyErr.Error()))
			} else {
				cleanedResources := resourcesForInstanceStatus(&outcome, inst.Type, runstateResourceCleaned)
				recordCleanupFailure(o.recordResources(&outcome, cleanedResources...))
				recordCleanupFailure(o.afterExternalStep("cleanup", "", "succeeded", "topology destroyed for "+inst.Type))
			}
		}

		if o.cfg.CreateTailnet && time.Since(*authKeyCreated) > time.Duration(o.cfg.AuthKeyRefreshSec)*time.Second {
			lg.Infof("refreshing auth key")
			outcome.ResourcesChanged = true
			newKey, err := o.tailnet.CreateAuthKey(ctx, o.cfg.OAuthClientID, o.cfg.OAuthClientSecret)
			if err != nil {
				lg.Warnf("auth key refresh: %v", err)
				recordBenchmarkFailure(fmt.Errorf("refresh auth key: %w", err))
			} else {
				*authKey = newKey
				*authKeyCreated = time.Now()
			}
		}
	}

	if err := result.Aggregate(o.cfg.RootDir); err != nil {
		lg.Warnf("aggregation: %v", err)
		recordBenchmarkFailure(fmt.Errorf("aggregate results: %w", err))
	}

	return outcome
}

func providerRunScoped(p provider.Provider) bool {
	scoped, ok := p.(provider.RunScopedProvider)
	return ok && scoped.RunScopedResources()
}

func providerManagesNetworking(p provider.Provider) bool {
	managed, ok := p.(provider.ManagedNetworkingProvider)
	return !ok || managed.ManagesNetworking()
}

func shouldCleanup(policy string, benchmarkErr error) bool {
	switch policy {
	case config.CleanupManual:
		return false
	case config.CleanupOnSuccess:
		return benchmarkErr == nil
	case "", config.CleanupAlways:
		return true
	default:
		return false
	}
}

func topologyKind(providerName string) string {
	if isK8sProvider(providerName) {
		return "kubernetes-topology"
	}
	return "vm-pair"
}

func pairResourceRecords(
	providerName string,
	runID string,
	instanceType string,
	pair *provider.PairOutput,
	ownershipCertain bool,
) []ResourceRecord {
	if pair == nil {
		return nil
	}
	kind := "compute-instance"
	if pair.Namespace != "" {
		kind = "kubernetes-workload"
	}
	records := []ResourceRecord{
		{
			ID:               providerName + "/" + instanceType + "/topology",
			Kind:             topologyKind(providerName),
			StackName:        pair.StackName,
			CleanupOwner:     runID,
			Status:           runstateResourceCreated,
			OwnershipCertain: ownershipCertain && pair.StackName != "",
			InstanceType:     instanceType,
		},
		{
			ID:               providerName + "/" + instanceType + "/server",
			Kind:             kind,
			ProviderID:       pair.ServerInstanceID,
			StackName:        pair.StackName,
			Hostname:         pair.ServerName,
			CleanupOwner:     runID,
			Status:           runstateResourceCreated,
			OwnershipCertain: ownershipCertain,
			InstanceType:     instanceType,
		},
		{
			ID:               providerName + "/" + instanceType + "/client",
			Kind:             kind,
			ProviderID:       pair.ClientInstanceID,
			StackName:        pair.StackName,
			Hostname:         pair.ClientName,
			CleanupOwner:     runID,
			Status:           runstateResourceCreated,
			OwnershipCertain: ownershipCertain,
			InstanceType:     instanceType,
		},
	}
	if pair.RouterName != "" || pair.RouterInstanceID != "" {
		records = append(records, ResourceRecord{
			ID:               providerName + "/" + instanceType + "/router",
			Kind:             kind,
			ProviderID:       pair.RouterInstanceID,
			StackName:        pair.StackName,
			Hostname:         pair.RouterName,
			CleanupOwner:     runID,
			Status:           runstateResourceCreated,
			OwnershipCertain: ownershipCertain,
			InstanceType:     instanceType,
		})
	}
	return records
}

func upsertResource(outcome *Outcome, resource ResourceRecord) {
	for index := range outcome.Resources {
		if outcome.Resources[index].ID == resource.ID {
			outcome.Resources[index] = resource
			return
		}
	}
	outcome.Resources = append(outcome.Resources, resource)
}

func (o *Orchestrator) recordResources(outcome *Outcome, resources ...ResourceRecord) error {
	for _, resource := range resources {
		upsertResource(outcome, resource)
	}
	if o.recorder == nil {
		return nil
	}
	if err := o.recorder.RecordResources(resources...); err != nil {
		return fmt.Errorf("persist resource inventory: %w", err)
	}
	return nil
}

func (o *Orchestrator) beforeExternalStep(stage, workID, message string) error {
	if o.recorder == nil {
		return nil
	}
	if err := o.recorder.BeforeExternalStep(stage, workID, message); err != nil {
		return fmt.Errorf("persist %s start: %w", stage, err)
	}
	return nil
}

func (o *Orchestrator) afterExternalStep(stage, workID, status, message string) error {
	if o.recorder == nil {
		return nil
	}
	if err := o.recorder.AfterExternalStep(stage, workID, status, message); err != nil {
		return fmt.Errorf("persist %s finish: %w", stage, err)
	}
	return nil
}

func resourcesForInstanceStatus(outcome *Outcome, instanceType, status string) []ResourceRecord {
	var resources []ResourceRecord
	for index := range outcome.Resources {
		if outcome.Resources[index].InstanceType != instanceType {
			continue
		}
		outcome.Resources[index].Status = status
		resources = append(resources, outcome.Resources[index])
	}
	return resources
}

func resourceWithStatus(outcome *Outcome, resourceID, status string) (ResourceRecord, bool) {
	for index := range outcome.Resources {
		if outcome.Resources[index].ID != resourceID {
			continue
		}
		outcome.Resources[index].Status = status
		return outcome.Resources[index], true
	}
	return ResourceRecord{}, false
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
	readyTimeout := time.Duration(o.cfg.ReadyTimeout) * time.Second
	if err := serverSSH.WaitForReady(ctx, readyTimeout); err != nil {
		return fmt.Errorf("server ready: %w", err)
	}
	if err := clientSSH.WaitForReady(ctx, readyTimeout); err != nil {
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
		defer func() {
			if err := rSSH.Close(); err != nil {
				lg.Warnf("close router SSH: %v", err)
			}
		}()
		if err := rSSH.WaitForReady(ctx, readyTimeout); err != nil {
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
		Config:          o.benchmarkRunConfig(authKey, serverHostname, clientHostname),
	}

	prefix := fmt.Sprintf("[%s/%s]", p.Name(), inst.Type)
	return o.runModeLoop(ctx, runner, p, pair, inst, family, prefix, "vm", modeContext{
		serverHostname: serverHostname,
	})
}

// benchmarkRunConfig builds the settings shared by VM and K8s runners. Keep
// forwarding-PPS configuration here so both environments run the same sweep.
func (o *Orchestrator) benchmarkRunConfig(authKey, serverHostname, clientHostname string) benchmark.RunConfig {
	return benchmark.RunConfig{
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
	}
}

type modeContext struct {
	serverHostname string
	kubeconfig     string // base64 kubeconfig for K8s providers, empty for VMs
}

func (o *Orchestrator) runModeLoop(ctx context.Context, runner *benchmark.Runner, p provider.Provider, pair *provider.PairOutput, inst provider.InstanceInfo, family, prefix, env string, mc modeContext) error {
	var modeErrors []error
	failMode := func(mode, workID string, cause error) {
		modeErr := fmt.Errorf("mode %s: %w", mode, cause)
		modeErrors = append(modeErrors, modeErr)
		if err := o.afterExternalStep("benchmark", workID, "failed", modeErr.Error()); err != nil {
			modeErrors = append(modeErrors, fmt.Errorf("mode %s state: %w", mode, err))
		}
	}
	succeedMode := func(mode, workID string) {
		if err := o.afterExternalStep("benchmark", workID, "succeeded", "result written for mode "+mode); err != nil {
			modeErrors = append(modeErrors, fmt.Errorf("mode %s state: %w", mode, err))
		}
	}

	for _, mode := range o.cfg.Modes {
		if !benchmark.ModeAppliesTo(mode, env) {
			continue
		}
		workID := inst.Type + "/" + mode
		// Skip modes that already have results
		resultPath := filepath.Join(o.cfg.RootDir, p.Name(), family, "results", inst.Type+"-"+mode+".json")
		if _, err := os.Stat(resultPath); err == nil {
			log.Printf("%s skipping mode %s (result exists)", prefix, mode)
			continue
		}
		if err := o.beforeExternalStep("benchmark", workID, "run mode "+mode); err != nil {
			modeErrors = append(modeErrors, fmt.Errorf("mode %s state: %w", mode, err))
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
				failMode(mode, workID, fmt.Errorf("iperf benchmark: %w", err))
				continue
			}
		case benchmark.ModeUsesFortio(mode):
			target, baselineTarget := o.resolveEndpoints(ctx, mode, pair, mc)
			if target == "" {
				err := errors.New("no endpoint configured or discovered")
				log.Printf("%s mode %s failed: %v", prefix, mode, err)
				failMode(mode, workID, err)
				continue
			}
			if err := o.warmUpEndpoint(ctx, runner.Client, target); err != nil {
				log.Printf("%s mode %s endpoint warm-up failed: %v", prefix, mode, err)
				failMode(mode, workID, fmt.Errorf("endpoint warm-up: %w", err))
				continue
			}
			h2 := benchmark.ModeIsH2(mode)
			log.Printf("%s running fortio benchmark for %s mode %s", prefix, inst.Type, mode)
			baseline, ts, err := runner.RunFortio(ctx, target, baselineTarget, h2,
				o.cfg.FortioConnections, o.cfg.FortioDuration, o.cfg.FortioIterations, o.cfg.FortioQPS)
			if err != nil {
				log.Printf("%s fortio mode %s failed: %v", prefix, mode, err)
				failMode(mode, workID, fmt.Errorf("fortio benchmark: %w", err))
				continue
			}
			br = &result.BenchmarkResult{
				FortioResult: ts,
				L7Overhead:   result.ComputeL7Overhead(baseline, ts),
			}
		case benchmark.ModeUsesForwardPPS(mode):
			if env == "container" {
				log.Printf("%s running forwarding-pps benchmark for %s mode %s", prefix, inst.Type, mode)
				var err error
				br, err = o.runForwardPPS(ctx, runner, pair, mode, mc)
				if err != nil {
					failMode(mode, workID, fmt.Errorf("forwarding-pps benchmark: %w", err))
					continue
				}
				break
			}
			if runner.Router == nil {
				err := errors.New("no router provisioned")
				log.Printf("%s mode %s failed: %v", prefix, mode, err)
				failMode(mode, workID, err)
				continue
			}
			routerTSIP, err := benchmark.GetTailscaleIP(ctx, runner.Router)
			if err != nil {
				log.Printf("%s mode %s: router tailscale IP: %v (continuing)", prefix, mode, err)
				failMode(mode, workID, fmt.Errorf("router tailscale IP: %w", err))
				continue
			}
			log.Printf("%s forwarding-pps: routing client egress via exit node %s", prefix, routerTSIP)
			if err := benchmark.SetExitNode(ctx, runner.Client, routerTSIP); err != nil {
				log.Printf("%s mode %s: set exit node: %v", prefix, mode, err)
				failMode(mode, workID, fmt.Errorf("set exit node: %w", err))
				continue
			}
			// Client -> router (exit node) -> server public IP (a non-tailnet
			// address, so it egresses through the router rather than direct).
			pps, ppsErr := runner.RunForwardingPPS(ctx, runner.Client, runner.Server, pair.ServerIP)
			clearErr := benchmark.ClearExitNode(ctx, runner.Client)
			if ppsErr != nil || clearErr != nil {
				combinedErr := errors.Join(
					ppsErr,
					wrapIfError("clear exit node", clearErr),
				)
				log.Printf("%s forward-pps mode %s failed: %v", prefix, mode, combinedErr)
				failMode(mode, workID, fmt.Errorf("forwarding-pps benchmark: %w", combinedErr))
				continue
			}
			br = &result.BenchmarkResult{
				ForwardPPS:  pps,
				ForwardRole: "exit-node",
				TestConfig:  forwardPPSTestConfig(pps),
			}
		case benchmark.ModeUsesRelay(mode):
			if runner.Router == nil {
				err := errors.New("no relay node provisioned")
				log.Printf("%s mode %s failed: %v", prefix, mode, err)
				failMode(mode, workID, err)
				continue
			}
			serverTSIP, err := benchmark.GetTailscaleIP(ctx, runner.Server)
			if err != nil {
				log.Printf("%s mode %s: server tailscale IP: %v (continuing)", prefix, mode, err)
				failMode(mode, workID, fmt.Errorf("server tailscale IP: %w", err))
				continue
			}
			if err := benchmark.WaitForPeer(ctx, runner.Client, serverTSIP); err != nil {
				log.Printf("%s mode %s: %v (continuing)", prefix, mode, err)
				failMode(mode, workID, fmt.Errorf("wait for peer: %w", err))
				continue
			}

			log.Printf("%s relay-throughput: measuring direct path", prefix)
			direct, err := runner.RunRelayPath(ctx, runner.Client, runner.Server, serverTSIP, "direct")
			if err != nil {
				log.Printf("%s relay mode %s failed (direct): %v", prefix, mode, err)
				failMode(mode, workID, fmt.Errorf("direct relay measurement: %w", err))
				continue
			}

			log.Printf("%s relay-throughput: blocking direct path", prefix)
			if err := blockDirectPair(ctx, runner.Client, runner.Server); err != nil {
				restoreErr := unblockDirectPair(ctx, runner.Client, runner.Server)
				failMode(mode, workID, errors.Join(err, restoreErr))
				continue
			}

			log.Printf("%s relay-throughput: measuring peer-relay path", prefix)
			peerRelay, err := runner.RunRelayPath(ctx, runner.Client, runner.Server, serverTSIP, "peer-relay")
			if err != nil {
				log.Printf("%s relay mode %s failed (peer-relay): %v", prefix, mode, err)
				restoreErr := unblockDirectPair(ctx, runner.Client, runner.Server)
				failMode(
					mode,
					workID,
					errors.Join(fmt.Errorf("peer-relay measurement: %w", err), restoreErr),
				)
				continue
			}

			log.Printf("%s relay-throughput: blocking relay port", prefix)
			if err := benchmark.BlockRelayPort(ctx, runner.Router, benchmark.RelayUDPPort); err != nil {
				restoreErr := unblockDirectPair(ctx, runner.Client, runner.Server)
				failMode(
					mode,
					workID,
					errors.Join(fmt.Errorf("block relay port: %w", err), restoreErr),
				)
				continue
			}

			log.Printf("%s relay-throughput: measuring DERP path", prefix)
			derp, derpErr := runner.RunRelayPath(ctx, runner.Client, runner.Server, serverTSIP, "derp")

			restoreErr := restoreRelayNetwork(ctx, runner.Client, runner.Server, runner.Router)

			if derpErr != nil || restoreErr != nil {
				log.Printf(
					"%s relay mode %s failed (DERP or network restore): %v",
					prefix,
					mode,
					errors.Join(derpErr, restoreErr),
				)
				failMode(
					mode,
					workID,
					errors.Join(wrapIfError("DERP measurement", derpErr), restoreErr),
				)
				continue
			}

			br = &result.BenchmarkResult{
				Relay: &result.RelayResult{
					RelayServerPort: benchmark.RelayUDPPort,
					Direct:          direct,
					PeerRelay:       peerRelay,
					DERP:            derp,
				},
				ForwardRole: "peer-relay",
				TestConfig:  forwardPPSTestConfig(direct.PPS),
			}
		case benchmark.ModeUsesTsnet(mode):
			err := errors.New("tsnet runner not yet implemented")
			log.Printf("%s mode %s failed: %v", prefix, mode, err)
			failMode(mode, workID, err)
			continue
		default:
			err := errors.New("unknown benchmark mode")
			log.Printf("%s mode %s failed: %v", prefix, mode, err)
			failMode(mode, workID, err)
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
			// Guarded like the sibling derivations in cmd/tailbench/gcp.go and
			// internal/plan. Unguarded, a zone without "-" yields LastIndex -1
			// and panics here — after the benchmark ran, at result-write time.
			br.Region = o.cfg.GCPZone
			if idx := strings.LastIndex(o.cfg.GCPZone, "-"); idx > 0 {
				br.Region = o.cfg.GCPZone[:idx]
			}
			br.Zone = o.cfg.GCPZone
		case "aws", "eks":
			br.Region = o.cfg.AWSRegion
			br.Zone = o.cfg.AWSAZ
		case "azure", "aks":
			br.Region = o.cfg.AzureLocation
			br.Zone = o.cfg.AzureLocation
		}

		if err := result.WriteResult(o.cfg.RootDir, br, false); err != nil {
			failMode(mode, workID, fmt.Errorf("write result: %w", err))
			continue
		}
		log.Printf("%s result written for %s mode %s", prefix, inst.Type, mode)
		succeedMode(mode, workID)
	}
	return errors.Join(modeErrors...)
}

func blockDirectPair(
	ctx context.Context,
	client benchmark.Executor,
	server benchmark.Executor,
) error {
	return errors.Join(
		wrapIfError("block client direct path", benchmark.BlockDirect(ctx, client)),
		wrapIfError("block server direct path", benchmark.BlockDirect(ctx, server)),
	)
}

func unblockDirectPair(
	ctx context.Context,
	client benchmark.Executor,
	server benchmark.Executor,
) error {
	return errors.Join(
		wrapIfError("unblock client direct path", benchmark.UnblockDirect(ctx, client)),
		wrapIfError("unblock server direct path", benchmark.UnblockDirect(ctx, server)),
	)
}

func restoreRelayNetwork(
	ctx context.Context,
	client benchmark.Executor,
	server benchmark.Executor,
	router benchmark.Executor,
) error {
	return errors.Join(
		wrapIfError(
			"unblock relay port",
			benchmark.UnblockRelayPort(ctx, router, benchmark.RelayUDPPort),
		),
		unblockDirectPair(ctx, client, server),
	)
}

func wrapIfError(operation string, err error) error {
	if err == nil {
		return nil
	}
	return fmt.Errorf("%s: %w", operation, err)
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
//
// A mode is done when EITHER result file exists: the mode-suffixed path, or —
// for l4-kernel only — the legacy no-suffix path written by older versions. The
// legacy path is a fallback, not a second requirement: treating it as one made
// l4-kernel permanently pending (no legacy file exists in any provider tree),
// so every rerun provisioned a pair, skipped every mode in runModeLoop, and
// destroyed it. That also contradicted the local plan, which reports the same
// instance as fully satisfied and promises zero compute.
func pendingModesForInstance(rootDir, providerName, family, instanceType string, modes []string, env string) []string {
	resultsDir := filepath.Join(rootDir, providerName, family, "results")
	exists := func(name string) bool {
		_, err := os.Stat(filepath.Join(resultsDir, name))
		return err == nil
	}

	var pending []string
	for _, mode := range modes {
		if !benchmark.ModeAppliesTo(mode, env) {
			continue
		}
		if exists(instanceType + "-" + mode + ".json") {
			continue
		}
		if mode == "l4-kernel" && exists(instanceType+".json") {
			continue
		}
		pending = append(pending, mode)
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

func hasRelayMode(modes []string) bool {
	for _, m := range modes {
		if benchmark.ModeUsesRelay(m) {
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

// needsTailnetHTTPS reports whether the tailnet must have HTTPS enabled.
//
// K8s runs need it for the operator's API-server proxy. VM runs need it too
// whenever an l7-serve mode is configured: cloud-init then runs
// `tailscale serve --https=443`, which BLOCKS INDEFINITELY when HTTPS is off,
// so the node never writes /tmp/tailbench-ready and the run stalls until its
// deadline. Gating this on K8s alone hid the problem only because created
// tailnets and long-lived ones tend to have HTTPS on already.
func (o *Orchestrator) needsTailnetHTTPS() bool {
	return o.hasK8sProviders() || hasL7ServeMode(o.cfg.Modes)
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
// The family is part of the key: a cache populated by --family c7i must not be
// reused to satisfy a later --family all, which would silently benchmark only
// the narrower selection.
func instanceCachePath(providerName, family string) string {
	if family == "" {
		family = "all"
	}
	return filepath.Join(".tailbench", "instances", providerName+"-"+family+".json")
}

// listInstancesCached returns the instance list for a provider, using a disk cache
// when available. The cache is invalidated by --cleanup-networking.
func (o *Orchestrator) listInstancesCached(ctx context.Context, p provider.Provider, lg *logger.Logger) ([]provider.InstanceInfo, error) {
	cachePath := instanceCachePath(p.Name(), o.cfg.Family)

	if !o.cfg.CleanupNetworking {
		if data, err := os.ReadFile(cachePath); err == nil {
			var cached []provider.InstanceInfo
			if err := json.Unmarshal(data, &cached); err == nil && len(cached) > 0 {
				lg.Infof("using cached instance list (%d types from %s)", len(cached), cachePath)
				return cached, nil
			}
		}
	}

	// An unrecognized family is not rejected here. The plan stage only warns
	// that nothing matched the catalog; what actually stops the run is the
	// no-runnable-work guardrail, before any provider call.
	var families []string
	if o.cfg.Family == "all" {
		families = p.ListFamilies()
	} else {
		families = []string{o.cfg.Family}
	}

	var instances []provider.InstanceInfo
	var failures []error
	for _, fam := range families {
		lg.Infof("listing instances for family %s", fam)
		var list []provider.InstanceInfo
		retryResult := retry.Do(
			ctx,
			retry.Policy{
				Idempotent:   true,
				MaxAttempts:  3,
				InitialDelay: time.Second,
				MaxDelay:     2 * time.Second,
			},
			func(attempt int) error {
				var err error
				list, err = p.ListInstances(ctx, fam)
				if err != nil && failure.IsTransient(err) && attempt < 3 {
					lg.Warnf(
						"listing family %s attempt %d/3 failed transiently: %v; retrying",
						fam,
						attempt,
						err,
					)
				}
				return err
			},
			failure.IsTransient,
			nil,
		)
		if retryResult.Err != nil {
			lg.Warnf(
				"listing family %s failed after %d attempt(s): %v",
				fam,
				retryResult.Attempts,
				retryResult.Err,
			)
			failures = append(
				failures,
				fmt.Errorf(
					"family %s after %d attempt(s): %w",
					fam,
					retryResult.Attempts,
					retryResult.Err,
				),
			)
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

	return instances, errors.Join(failures...)
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
