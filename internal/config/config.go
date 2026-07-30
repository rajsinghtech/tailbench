package config

import (
	"bufio"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Providers              []string
	Family                 string
	Filter                 string
	CreateTailnet          bool
	TailnetDNSName         string
	OAuthClientID          string
	OAuthClientSecret      string
	Tag                    string
	IPerfDuration          int
	IPerfParallel          int
	IPerfIterations        int
	MTRCycles              int
	CooldownSec            int
	CreditRetrySec         int
	SSHTimeout             int
	ReadyTimeout           int
	AWSRegion              string
	AWSAZ                  string
	AWSKeyName             string
	GCPProject             string
	GCPZone                string
	AzureLocation          string
	AzureResourceGroup     string
	AzureSSHUser           string
	AzureSSHPubKey         string
	CleanupNetworking      bool
	DryRun                 bool
	AuthKeyRefreshSec      int
	RootDir                string
	StateDir               string
	StateBackend           string
	BenchImage             string
	TSImage                string
	FortioDuration         int
	FortioConnections      int
	FortioQPS              int
	FortioIterations       int
	PPSDatagramSizes       []int
	PPSLossThresholdPct    float64
	PPSDurationSec         int
	PPSMaxRatePPS          int
	Modes                  []string
	IngressFQDN            string
	ServeFQDN              string
	ClusterLabel           string
	Yes                    bool
	MaxCostUSD             float64
	MaxCostSet             bool
	MaxDuration            time.Duration
	MaxInstanceTypes       int
	MaxConcurrentResources int
	CleanupPolicy          string
	RunID                  string
	ResourceExpiresAt      string
}

const (
	DefaultMaxCostUSD             = 10.0
	DefaultMaxDuration            = 45 * time.Minute
	DefaultMaxInstanceTypes       = 1
	DefaultMaxConcurrentResources = 1

	CleanupAlways    = "always"
	CleanupOnSuccess = "on-success"
	CleanupManual    = "manual"
)

type yamlConfig struct {
	EnvFile      string   `yaml:"env_file"`
	Providers    []string `yaml:"providers"`
	Family       string   `yaml:"family"`
	Filter       string   `yaml:"filter"`
	StateBackend string   `yaml:"state_backend"`

	Tailscale struct {
		CreateTailnet     bool   `yaml:"create_tailnet"`
		TailnetDNSName    string `yaml:"tailnet_dns_name"`
		OAuthClientID     string `yaml:"oauth_client_id"`
		OAuthClientSecret string `yaml:"oauth_client_secret"`
		Tag               string `yaml:"tag"`
	} `yaml:"tailscale"`

	Benchmark struct {
		IPerfDuration       int      `yaml:"iperf_duration"`
		IPerfParallel       int      `yaml:"iperf_parallel"`
		IPerfIterations     int      `yaml:"iperf_iterations"`
		MTRCycles           int      `yaml:"mtr_cycles"`
		CooldownSec         int      `yaml:"cooldown_sec"`
		FortioDuration      int      `yaml:"fortio_duration"`
		FortioConnections   int      `yaml:"fortio_connections"`
		FortioQPS           int      `yaml:"fortio_qps"`
		FortioIterations    int      `yaml:"fortio_iterations"`
		PPSDatagramSizes    []int    `yaml:"pps_datagram_sizes"`
		PPSLossThresholdPct float64  `yaml:"pps_loss_threshold_pct"`
		PPSDurationSec      int      `yaml:"pps_duration_sec"`
		PPSMaxRatePPS       int      `yaml:"pps_max_rate_pps"`
		Modes               []string `yaml:"modes"`
	} `yaml:"benchmark"`

	SSH struct {
		Timeout      int `yaml:"timeout"`
		ReadyTimeout int `yaml:"ready_timeout"`
	} `yaml:"ssh"`

	AWS struct {
		Region  string `yaml:"region"`
		AZ      string `yaml:"az"`
		KeyName string `yaml:"key_name"`
	} `yaml:"aws"`

	GCP struct {
		Project string `yaml:"project"`
		Zone    string `yaml:"zone"`
	} `yaml:"gcp"`

	Azure struct {
		Location      string `yaml:"location"`
		ResourceGroup string `yaml:"resource_group"`
		SSHUser       string `yaml:"ssh_user"`
		SSHPubKeyFile string `yaml:"ssh_pub_key_file"`
	} `yaml:"azure"`

	Images struct {
		Bench     string `yaml:"bench"`
		Tailscale string `yaml:"tailscale"`
	} `yaml:"images"`

	L7Endpoints struct {
		IngressFQDN  string `yaml:"ingress_fqdn"`
		ServeFQDN    string `yaml:"serve_fqdn"`
		ClusterLabel string `yaml:"cluster_label"`
	} `yaml:"l7_endpoints"`

	CleanupNetworking      bool     `yaml:"cleanup_networking"`
	DryRun                 bool     `yaml:"dry_run"`
	MaxCostUSD             *float64 `yaml:"max_cost_usd"`
	MaxDuration            string   `yaml:"max_duration"`
	MaxInstanceTypes       int      `yaml:"max_instance_types"`
	MaxConcurrentResources int      `yaml:"max_concurrent_resources"`
	CleanupPolicy          string   `yaml:"cleanup_policy"`
}

var envVarRe = regexp.MustCompile(`\$\{(\w+)\}`)

func expandEnvVars(s string, lookup func(string) (string, bool)) string {
	return envVarRe.ReplaceAllStringFunc(s, func(match string) string {
		key := envVarRe.FindStringSubmatch(match)[1]
		value, _ := lookup(key)
		return value
	})
}

func readEnvFile(path string) (map[string]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() { _ = f.Close() }()

	values := map[string]string{}
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key := strings.TrimSpace(k)
		if key == "" {
			continue
		}
		values[key] = strings.TrimSpace(v)
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return values, nil
}

// backendSchemes are the URL schemes Pulumi accepts as a state backend.
var backendSchemes = []string{"file://", "s3://", "gs://", "azblob://", "https://", "http://"}

// normalizeStateBackend canonicalizes the configured Pulumi backend and rejects
// values Pulumi cannot use. Validating here means a typo fails at startup with
// a usable message, rather than partway into the first stack operation.
//
// An empty value keeps state local, under ./state/<provider>.
func normalizeStateBackend(s string) (string, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return "", nil
	}
	// Pulumi Cloud is spelled several ways in the docs and UI; api.pulumi.com is
	// the endpoint `backend.url` actually wants.
	switch strings.TrimSuffix(s, "/") {
	case "pulumi.com", "app.pulumi.com", "https://pulumi.com", "https://app.pulumi.com":
		return "https://api.pulumi.com", nil
	}
	for _, scheme := range backendSchemes {
		if strings.HasPrefix(s, scheme) {
			return s, nil
		}
	}
	return "", fmt.Errorf(
		"invalid state_backend %q: use \"pulumi.com\" for Pulumi Cloud, or a URL with one of these schemes: %s",
		s, strings.Join(backendSchemes, " "))
}

func or(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}

func orInt(vals ...int) int {
	for _, v := range vals {
		if v != 0 {
			return v
		}
	}
	return 0
}

func Parse(defaultProvider string) (*Config, error) {
	return ParseArgs(defaultProvider, os.Args[1:])
}

func ParseArgs(defaultProvider string, args []string) (*Config, error) {
	return parseArgs(defaultProvider, args, parseOptions{
		resolveSecrets: true,
		loadSSHKeys:    true,
	})
}

// ParseLocalArgs loads only user-owned configuration and non-secret defaults.
// It deliberately does not open env_file, expand secret values, or inspect SSH
// keys in the user's home directory.
func ParseLocalArgs(defaultProvider string, args []string) (*Config, error) {
	return parseArgs(defaultProvider, args, parseOptions{})
}

type parseOptions struct {
	resolveSecrets bool
	loadSSHKeys    bool
}

func parseArgs(defaultProvider string, args []string, options parseOptions) (*Config, error) {
	flags := flag.NewFlagSet("tailbench", flag.ContinueOnError)
	flags.SetOutput(io.Discard)
	configFile := flags.String("config", "config.yaml", "Path to config.yaml")
	providerFlag := flags.String("provider", "", "Provider override")
	familyFlag := flags.String("family", "", "Instance family override")
	filterFlag := flags.String("filter", "", "Regex filter for instance types")
	dryRun := flags.Bool("dry-run", false, "Preview what would run")
	cleanup := flags.Bool("cleanup-networking", false, "Tear down clusters after run")
	yes := flags.Bool("yes", false, "Approve a noninteractive run")
	maxCostFlag := flags.Float64("max-cost-usd", 0, "Maximum estimated run cost in USD")
	maxDurationFlag := flags.Duration("max-duration", 0, "Maximum total run duration")
	maxInstanceTypesFlag := flags.Int("max-instance-types", 0, "Maximum instance types with pending work")
	maxConcurrentResourcesFlag := flags.Int("max-concurrent-resources", 0, "Maximum concurrent benchmark topologies")
	cleanupPolicyFlag := flags.String("cleanup-policy", "", "Cleanup policy: always, on-success, or manual")
	stateBackend := flags.String("state-backend", "",
		"Pulumi state backend: \"pulumi.com\", or an s3://, gs://, azblob://, or file:// URL (default: local ./state)")
	if err := flags.Parse(args); err != nil {
		return nil, err
	}
	specifiedFlags := make(map[string]bool)
	flags.Visit(func(value *flag.Flag) {
		specifiedFlags[value.Name] = true
	})

	data, err := os.ReadFile(*configFile)
	if err != nil {
		return nil, &LoadError{Kind: ErrorReadConfig, Path: *configFile, Err: err}
	}

	var yc yamlConfig
	if err := yaml.Unmarshal(data, &yc); err != nil {
		return nil, &LoadError{Kind: ErrorParseConfig, Path: *configFile, Err: err}
	}

	// Secret resolution is an explicit run/remote-preflight stage. Local plan
	// and doctor never open the environment file.
	fileEnvironment := map[string]string{}
	if options.resolveSecrets && yc.EnvFile != "" {
		envPath := yc.EnvFile
		if !filepath.IsAbs(envPath) {
			envPath = filepath.Join(filepath.Dir(*configFile), envPath)
		}
		fileEnvironment, err = readEnvFile(envPath)
		if err != nil {
			return nil, &LoadError{Kind: ErrorEnvironmentFile, Path: envPath, Err: err}
		}
	}

	rootDir, _ := os.Getwd()
	// fileEnvironment stays empty unless secrets were resolved, so local plan and
	// doctor expand ${VAR} from the process environment alone and never read the
	// environment file. Non-secret values such as state_backend can therefore use
	// the same lookup on every path.
	lookup := func(key string) (string, bool) {
		if value, ok := os.LookupEnv(key); ok {
			return value, true
		}
		value, ok := fileEnvironment[key]
		return value, ok
	}
	oauthClientID := ""
	oauthClientSecret := ""
	if options.resolveSecrets {
		oauthClientID = expandEnvVars(yc.Tailscale.OAuthClientID, lookup)
		oauthClientSecret = expandEnvVars(yc.Tailscale.OAuthClientSecret, lookup)
	}

	maxCostUSD := DefaultMaxCostUSD
	maxCostSet := false
	if yc.MaxCostUSD != nil {
		maxCostUSD = *yc.MaxCostUSD
		maxCostSet = true
	}
	if specifiedFlags["max-cost-usd"] {
		maxCostUSD = *maxCostFlag
		maxCostSet = true
	}
	if maxCostUSD <= 0 {
		return nil, fmt.Errorf("max_cost_usd must be greater than zero")
	}

	maxDuration := DefaultMaxDuration
	if yc.MaxDuration != "" {
		parsed, err := time.ParseDuration(yc.MaxDuration)
		if err != nil {
			return nil, fmt.Errorf("invalid max_duration %q: %w", yc.MaxDuration, err)
		}
		maxDuration = parsed
	}
	if specifiedFlags["max-duration"] {
		maxDuration = *maxDurationFlag
	}
	if maxDuration <= 0 {
		return nil, fmt.Errorf("max_duration must be greater than zero")
	}

	maxInstanceTypes := orInt(yc.MaxInstanceTypes, DefaultMaxInstanceTypes)
	if specifiedFlags["max-instance-types"] {
		maxInstanceTypes = *maxInstanceTypesFlag
	}
	if maxInstanceTypes <= 0 {
		return nil, fmt.Errorf("max_instance_types must be greater than zero")
	}

	maxConcurrentResources := orInt(yc.MaxConcurrentResources, DefaultMaxConcurrentResources)
	if specifiedFlags["max-concurrent-resources"] {
		maxConcurrentResources = *maxConcurrentResourcesFlag
	}
	if maxConcurrentResources <= 0 {
		return nil, fmt.Errorf("max_concurrent_resources must be greater than zero")
	}

	cleanupPolicy := or(yc.CleanupPolicy, CleanupAlways)
	if specifiedFlags["cleanup-policy"] {
		cleanupPolicy = *cleanupPolicyFlag
	}
	if *cleanup || (yc.CleanupNetworking && yc.CleanupPolicy == "") {
		cleanupPolicy = CleanupAlways
	}
	switch cleanupPolicy {
	case CleanupAlways, CleanupOnSuccess, CleanupManual:
	default:
		return nil, fmt.Errorf(
			"invalid cleanup_policy %q; expected always, on-success, or manual",
			cleanupPolicy,
		)
	}

	// Env expansion runs first so state_backend can be supplied as ${VAR} from
	// the env file, the same way credentials are.
	backend, err := normalizeStateBackend(or(*stateBackend, expandEnvVars(yc.StateBackend, lookup)))
	if err != nil {
		return nil, err
	}

	cfg := &Config{
		Providers:         yc.Providers,
		Family:            or(*familyFlag, yc.Family, "all"),
		Filter:            or(*filterFlag, yc.Filter),
		CreateTailnet:     yc.Tailscale.CreateTailnet,
		TailnetDNSName:    strings.TrimSpace(yc.Tailscale.TailnetDNSName),
		OAuthClientID:     oauthClientID,
		OAuthClientSecret: oauthClientSecret,
		Tag:               or(yc.Tailscale.Tag, "tag:bench"),

		IPerfDuration:     orInt(yc.Benchmark.IPerfDuration, 30),
		IPerfParallel:     orInt(yc.Benchmark.IPerfParallel, 4),
		IPerfIterations:   orInt(yc.Benchmark.IPerfIterations, 3),
		MTRCycles:         orInt(yc.Benchmark.MTRCycles, 100),
		CooldownSec:       orInt(yc.Benchmark.CooldownSec, 30),
		CreditRetrySec:    60,
		FortioDuration:    orInt(yc.Benchmark.FortioDuration, 30),
		FortioConnections: orInt(yc.Benchmark.FortioConnections, 16),
		FortioQPS:         yc.Benchmark.FortioQPS,
		FortioIterations:  orInt(yc.Benchmark.FortioIterations, 3),
		// PPS params forwarded raw; benchmark.RunConfig.defaults() supplies
		// defaults (sizes 64/340/1400, 0.1% loss, 15s, 2M pps ceiling).
		PPSDatagramSizes:       yc.Benchmark.PPSDatagramSizes,
		PPSLossThresholdPct:    yc.Benchmark.PPSLossThresholdPct,
		PPSDurationSec:         yc.Benchmark.PPSDurationSec,
		PPSMaxRatePPS:          yc.Benchmark.PPSMaxRatePPS,
		Modes:                  yc.Benchmark.Modes,
		IngressFQDN:            yc.L7Endpoints.IngressFQDN,
		ServeFQDN:              yc.L7Endpoints.ServeFQDN,
		ClusterLabel:           or(yc.L7Endpoints.ClusterLabel, "app.kubernetes.io/part-of=tailbench-l7"),
		AuthKeyRefreshSec:      1800,
		Yes:                    *yes,
		MaxCostUSD:             maxCostUSD,
		MaxCostSet:             maxCostSet,
		MaxDuration:            maxDuration,
		MaxInstanceTypes:       maxInstanceTypes,
		MaxConcurrentResources: maxConcurrentResources,
		CleanupPolicy:          cleanupPolicy,

		SSHTimeout:   orInt(yc.SSH.Timeout, 120),
		ReadyTimeout: orInt(yc.SSH.ReadyTimeout, 300),

		AWSRegion:          or(yc.AWS.Region, "us-west-2"),
		AWSAZ:              or(yc.AWS.AZ, "us-west-2a"),
		AWSKeyName:         yc.AWS.KeyName,
		GCPProject:         or(yc.GCP.Project, "tailscale-sandbox"),
		GCPZone:            or(yc.GCP.Zone, "us-central1-a"),
		AzureLocation:      or(yc.Azure.Location, "eastus"),
		AzureResourceGroup: or(yc.Azure.ResourceGroup, "tailbench-rg"),
		AzureSSHUser:       or(yc.Azure.SSHUser, "azureuser"),

		BenchImage: or(yc.Images.Bench, "ghcr.io/rajsinghtech/tailbench-tools:latest"),
		TSImage:    or(yc.Images.Tailscale, "ghcr.io/tailscale/tailscale:latest"),

		CleanupNetworking: cleanupPolicy != CleanupManual,
		DryRun:            yc.DryRun || *dryRun,
		RootDir:           rootDir,
		StateDir:          "file://" + rootDir + "/state",
		StateBackend:      backend,
	}

	if options.loadSSHKeys {
		// Load the Azure SSH public key only for execution. Local planning
		// records the requirement without inspecting files outside the config.
		//
		// Resolution is ordered and every step is explicit:
		//
		//  1. azure.ssh_pub_key_file, when set, is authoritative. A read failure
		//     or an empty file is FATAL. It previously swallowed the error and
		//     fell through, so a typo in the path silently produced an empty key
		//     and VMs with no out-of-band login at all.
		//  2. Otherwise the operator's own public key, so the key you already use
		//     works on the benchmark VMs without any configuration. A key that is
		//     present but unreadable is skipped, not fatal — it was never asked
		//     for.
		//  3. Otherwise nothing here, and the provider generates and persists a
		//     run-scoped key pair (provider.ResolveSSHPublicKey).
		//
		// Which source won is logged, because "why is my key not on the box"
		// is otherwise invisible.
		if pubKeyFile := yc.Azure.SSHPubKeyFile; pubKeyFile != "" {
			if !filepath.IsAbs(pubKeyFile) {
				pubKeyFile = filepath.Join(filepath.Dir(*configFile), pubKeyFile)
			}
			data, readErr := os.ReadFile(pubKeyFile)
			if readErr != nil {
				return nil, fmt.Errorf("read azure.ssh_pub_key_file %s: %w", pubKeyFile, readErr)
			}
			cfg.AzureSSHPubKey = strings.TrimSpace(string(data))
			if cfg.AzureSSHPubKey == "" {
				return nil, fmt.Errorf("azure.ssh_pub_key_file %s is empty", pubKeyFile)
			}
			log.Printf("azure ssh key: using configured %s", pubKeyFile)
		} else if home, homeErr := os.UserHomeDir(); homeErr == nil {
			for _, name := range []string{"id_ed25519.pub", "id_rsa.pub"} {
				candidate := filepath.Join(home, ".ssh", name)
				data, readErr := os.ReadFile(candidate)
				if readErr != nil {
					continue
				}
				if key := strings.TrimSpace(string(data)); key != "" {
					cfg.AzureSSHPubKey = key
					log.Printf("azure ssh key: using %s (set azure.ssh_pub_key_file to override)", candidate)
					break
				}
			}
		}
	}

	if len(cfg.Modes) == 0 {
		cfg.Modes = []string{"l4-kernel"}
	}

	// CLI flag overrides
	if *providerFlag != "" {
		cfg.Providers = strings.Split(*providerFlag, ",")
	}
	if len(cfg.Providers) == 0 {
		cfg.Providers = []string{defaultProvider}
	}

	return cfg, nil
}
