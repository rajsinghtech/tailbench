package config

import (
	"flag"
	"os"
	"strconv"
	"strings"
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
	SSHKeyPath         string
	SSHPubKeyPath      string
	SSHUser            string
	SSHTimeout         int
	ReadyTimeout       int
	AWSRegion          string
	AWSAZ              string
	AWSKeyName         string
	GCPProject         string
	GCPZone            string
	AzureLocation      string
	AzureResourceGroup string
	CleanupNetworking  bool
	DryRun             bool
	AuthKeyRefreshSec  int
	RootDir            string
	StateDir           string
	BenchImage         string
	TSImage            string
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envIntOrDefault(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func Parse() (*Config, error) {
	cfg := &Config{}

	// Defaults from config/defaults.sh and provider configs
	provider := flag.String("provider", envOrDefault("CLOUD_PROVIDER", "gcp"), "Cloud provider: aws, gcp, azure")
	providers := flag.String("providers", "", "Comma-separated providers for parallel runs")
	flag.StringVar(&cfg.Family, "family", envOrDefault("FAMILY", "all"), "Instance family or 'all'")
	flag.StringVar(&cfg.Filter, "filter", "", "Regex filter for instance types")
	createTailnet := flag.Bool("create-tailnet", true, "Create ephemeral tailnet")
	noCreateTailnet := flag.Bool("no-create-tailnet", false, "Use existing tailnet credentials")
	flag.BoolVar(&cfg.CleanupNetworking, "cleanup-networking", false, "Tear down networking after run")
	flag.BoolVar(&cfg.DryRun, "dry-run", false, "Preview what would run")

	flag.Parse()

	// Provider list
	if *providers != "" {
		cfg.Providers = strings.Split(*providers, ",")
	} else if strings.Contains(*provider, ",") {
		cfg.Providers = strings.Split(*provider, ",")
	} else {
		cfg.Providers = []string{*provider}
	}

	// Tailnet
	cfg.CreateTailnet = *createTailnet && !*noCreateTailnet
	cfg.OAuthClientID = envOrDefault("TS_OAUTH_CLIENT_ID", "")
	cfg.OAuthClientSecret = envOrDefault("TS_OAUTH_CLIENT_SECRET", "")
	cfg.Tag = envOrDefault("TS_TAG", "tag:bench")

	// Benchmark params (match config/defaults.sh)
	cfg.IPerfDuration = envIntOrDefault("IPERF_DURATION", 30)
	cfg.IPerfParallel = envIntOrDefault("IPERF_PARALLEL", 4)
	cfg.IPerfIterations = envIntOrDefault("IPERF_ITERATIONS", 3)
	cfg.MTRCycles = envIntOrDefault("MTR_CYCLES", 100)
	cfg.CooldownSec = 30
	cfg.CreditRetrySec = 60

	// SSH
	cfg.SSHTimeout = envIntOrDefault("SSH_TIMEOUT", 60)
	cfg.ReadyTimeout = envIntOrDefault("READY_TIMEOUT", 300)
	cfg.AuthKeyRefreshSec = envIntOrDefault("AUTHKEY_REFRESH_INTERVAL", 1800)

	// AWS (match config/aws.sh)
	cfg.AWSRegion = envOrDefault("AWS_REGION", "us-east-1")
	cfg.AWSAZ = envOrDefault("AWS_AZ", "us-east-1a")
	cfg.AWSKeyName = envOrDefault("AWS_KEY_NAME", "raj_macbook")
	cfg.SSHKeyPath = envOrDefault("AWS_SSH_KEY_PATH", os.Getenv("HOME")+"/.ssh/raj_macbook.pem")
	cfg.SSHUser = envOrDefault("AWS_SSH_USER", "ubuntu")

	// GCP (match config/gcp.sh)
	cfg.GCPProject = envOrDefault("GCP_PROJECT", "tailscale-sandbox")
	cfg.GCPZone = envOrDefault("GCP_ZONE", "us-central1-a")
	cfg.SSHPubKeyPath = envOrDefault("SSH_PUB_KEY_PATH", os.Getenv("HOME")+"/.ssh/id_ed25519.pub")

	// Azure (match config/azure.sh)
	cfg.AzureLocation = envOrDefault("AZURE_LOCATION", "eastus")
	cfg.AzureResourceGroup = envOrDefault("AZURE_RESOURCE_GROUP", "tailbench-rg")

	// Container images (for K8s providers)
	cfg.BenchImage = envOrDefault("BENCH_IMAGE", "tailbench-tools:latest")
	cfg.TSImage = envOrDefault("TS_IMAGE", "ghcr.io/tailscale/tailscale:latest")

	// Paths
	cfg.RootDir, _ = os.Getwd()
	cfg.StateDir = "file://" + cfg.RootDir + "/state"

	return cfg, nil
}
