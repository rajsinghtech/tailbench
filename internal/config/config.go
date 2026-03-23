package config

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Providers          []string
	Family             string
	Filter             string
	CreateTailnet      bool
	OAuthClientID      string
	OAuthClientSecret  string
	Tag                string
	IPerfDuration      int
	IPerfParallel      int
	IPerfIterations    int
	MTRCycles          int
	CooldownSec        int
	CreditRetrySec     int
	SSHTimeout         int
	ReadyTimeout       int
	AWSRegion          string
	AWSAZ              string
	AWSKeyName         string
	GCPProject         string
	GCPZone            string
	AzureLocation      string
	AzureResourceGroup string
	AzureSSHUser       string
	AzureSSHPubKey     string
	CleanupNetworking  bool
	DryRun             bool
	AuthKeyRefreshSec  int
	RootDir            string
	StateDir           string
	BenchImage         string
	TSImage            string
	FortioDuration    int
	FortioConnections int
	FortioQPS         int
	FortioIterations  int
	Modes             []string
	IngressFQDN       string
	ServeFQDN         string
	ClusterLabel      string
}

type yamlConfig struct {
	EnvFile   string   `yaml:"env_file"`
	Providers []string `yaml:"providers"`
	Family    string   `yaml:"family"`
	Filter    string   `yaml:"filter"`

	Tailscale struct {
		CreateTailnet     bool   `yaml:"create_tailnet"`
		OAuthClientID     string `yaml:"oauth_client_id"`
		OAuthClientSecret string `yaml:"oauth_client_secret"`
		Tag               string `yaml:"tag"`
	} `yaml:"tailscale"`

	Benchmark struct {
		IPerfDuration     int      `yaml:"iperf_duration"`
		IPerfParallel     int      `yaml:"iperf_parallel"`
		IPerfIterations   int      `yaml:"iperf_iterations"`
		MTRCycles         int      `yaml:"mtr_cycles"`
		CooldownSec       int      `yaml:"cooldown_sec"`
		FortioDuration    int      `yaml:"fortio_duration"`
		FortioConnections int      `yaml:"fortio_connections"`
		FortioQPS         int      `yaml:"fortio_qps"`
		FortioIterations  int      `yaml:"fortio_iterations"`
		Modes             []string `yaml:"modes"`
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

	CleanupNetworking bool `yaml:"cleanup_networking"`
	DryRun            bool `yaml:"dry_run"`
}

var envVarRe = regexp.MustCompile(`\$\{(\w+)\}`)

func expandEnvVars(s string) string {
	return envVarRe.ReplaceAllStringFunc(s, func(match string) string {
		key := envVarRe.FindStringSubmatch(match)[1]
		return os.Getenv(key)
	})
}

func loadEnvFile(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

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
		os.Setenv(strings.TrimSpace(k), strings.TrimSpace(v))
	}
	return scanner.Err()
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

func Parse() (*Config, error) {
	configFile := flag.String("config", "config.yaml", "Path to config.yaml")
	providerFlag := flag.String("provider", "", "Provider override (comma-separated)")
	familyFlag := flag.String("family", "", "Instance family override")
	filterFlag := flag.String("filter", "", "Regex filter for instance types")
	dryRun := flag.Bool("dry-run", false, "Preview what would run")
	cleanup := flag.Bool("cleanup-networking", false, "Tear down clusters after run")
	flag.Parse()

	data, err := os.ReadFile(*configFile)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", *configFile, err)
	}

	var yc yamlConfig
	if err := yaml.Unmarshal(data, &yc); err != nil {
		return nil, fmt.Errorf("parse %s: %w", *configFile, err)
	}

	// Load env file for ${VAR} expansion
	if yc.EnvFile != "" {
		envPath := yc.EnvFile
		if !filepath.IsAbs(envPath) {
			envPath = filepath.Join(filepath.Dir(*configFile), envPath)
		}
		if err := loadEnvFile(envPath); err != nil {
			return nil, fmt.Errorf("load env file %s: %w", envPath, err)
		}
	}

	rootDir, _ := os.Getwd()

	cfg := &Config{
		Providers:         yc.Providers,
		Family:            or(*familyFlag, yc.Family, "all"),
		Filter:            or(*filterFlag, yc.Filter),
		CreateTailnet:     yc.Tailscale.CreateTailnet,
		OAuthClientID:     expandEnvVars(yc.Tailscale.OAuthClientID),
		OAuthClientSecret: expandEnvVars(yc.Tailscale.OAuthClientSecret),
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
		Modes:             yc.Benchmark.Modes,
		IngressFQDN:       yc.L7Endpoints.IngressFQDN,
		ServeFQDN:         yc.L7Endpoints.ServeFQDN,
		ClusterLabel:      or(yc.L7Endpoints.ClusterLabel, "app.kubernetes.io/part-of=tailbench-l7"),
		AuthKeyRefreshSec: 1800,

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

		CleanupNetworking: yc.CleanupNetworking || *cleanup,
		DryRun:            yc.DryRun || *dryRun,
		RootDir:           rootDir,
		StateDir:          "file://" + rootDir + "/state",
	}

	// Load Azure SSH pub key
	if pubKeyFile := yc.Azure.SSHPubKeyFile; pubKeyFile != "" {
		if !filepath.IsAbs(pubKeyFile) {
			pubKeyFile = filepath.Join(filepath.Dir(*configFile), pubKeyFile)
		}
		if data, err := os.ReadFile(pubKeyFile); err == nil {
			cfg.AzureSSHPubKey = strings.TrimSpace(string(data))
		}
	}
	if cfg.AzureSSHPubKey == "" {
		// Default: try common SSH key locations
		home, _ := os.UserHomeDir()
		for _, name := range []string{"id_ed25519.pub", "id_rsa.pub"} {
			if data, err := os.ReadFile(filepath.Join(home, ".ssh", name)); err == nil {
				cfg.AzureSSHPubKey = strings.TrimSpace(string(data))
				break
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
		cfg.Providers = []string{"gcp"}
	}

	return cfg, nil
}
