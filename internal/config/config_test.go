package config

import (
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"
)

func TestParseArgsProviderDefaultAndOverride(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(path, []byte("benchmark:\n  modes: [l4-kernel]\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	t.Run("compiled default", func(t *testing.T) {
		cfg, err := ParseArgs("aks", []string{"--config", path})
		if err != nil {
			t.Fatal(err)
		}
		if len(cfg.Providers) != 1 || cfg.Providers[0] != "aks" {
			t.Fatalf("providers = %v, want [aks]", cfg.Providers)
		}
	})

	t.Run("explicit CLI provider", func(t *testing.T) {
		cfg, err := ParseArgs("aks", []string{"--config", path, "--provider", "gke"})
		if err != nil {
			t.Fatal(err)
		}
		if len(cfg.Providers) != 1 || cfg.Providers[0] != "gke" {
			t.Fatalf("providers = %v, want [gke]", cfg.Providers)
		}
	})

	t.Run("explicit YAML provider", func(t *testing.T) {
		explicitPath := filepath.Join(dir, "explicit.yaml")
		if err := os.WriteFile(explicitPath, []byte("providers: [aws]\n"), 0o600); err != nil {
			t.Fatal(err)
		}
		cfg, err := ParseArgs("aks", []string{"--config", explicitPath})
		if err != nil {
			t.Fatal(err)
		}
		if len(cfg.Providers) != 1 || cfg.Providers[0] != "aws" {
			t.Fatalf("providers = %v, want [aws]", cfg.Providers)
		}
	})
}

func TestParseLocalArgsDoesNotLoadEnvironmentFileOrExpandSecrets(t *testing.T) {
	dir := t.TempDir()
	envPath := filepath.Join(dir, ".env")
	if err := os.WriteFile(envPath, []byte("TAILBENCH_LOCAL_TEST=from-file\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	configPath := filepath.Join(dir, "config.yaml")
	data := []byte(`env_file: .env
tailscale:
  oauth_client_id: ${TAILBENCH_LOCAL_TEST}
  oauth_client_secret: ${TAILBENCH_LOCAL_SECRET}
benchmark:
  modes: [l4-kernel]
`)
	if err := os.WriteFile(configPath, data, 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("TAILBENCH_LOCAL_TEST", "from-process")
	t.Setenv("TAILBENCH_LOCAL_SECRET", "must-not-expand")

	cfg, err := ParseLocalArgs("aws", []string{"--config", configPath})
	if err != nil {
		t.Fatal(err)
	}

	if cfg.OAuthClientID != "" || cfg.OAuthClientSecret != "" {
		t.Fatalf("local config resolved secrets: client_id=%q client_secret=%q", cfg.OAuthClientID, cfg.OAuthClientSecret)
	}
	if got := os.Getenv("TAILBENCH_LOCAL_TEST"); got != "from-process" {
		t.Fatalf("local config mutated environment: %q", got)
	}
}

func TestParseLocalArgsWorksWhenEnvironmentFileIsMissing(t *testing.T) {
	dir := t.TempDir()
	configPath := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(
		configPath,
		[]byte("env_file: does-not-exist\nfamily: c7i\nbenchmark:\n  modes: [l4-kernel]\n"),
		0o600,
	); err != nil {
		t.Fatal(err)
	}

	cfg, err := ParseLocalArgs(
		"aws",
		[]string{"--config", configPath, "--family", "c8gn", "--filter", `^c8gn\\.large$`},
	)
	if err != nil {
		t.Fatal(err)
	}

	if got, want := cfg.Family, "c8gn"; got != want {
		t.Fatalf("family = %q, want %q", got, want)
	}
	if got, want := cfg.Filter, `^c8gn\\.large$`; got != want {
		t.Fatalf("filter = %q, want %q", got, want)
	}
	if got, want := cfg.Providers, []string{"aws"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("providers = %#v, want %#v", got, want)
	}
	if _, err := os.Stat(filepath.Join(dir, ".tailbench")); !os.IsNotExist(err) {
		t.Fatalf("local config created .tailbench: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "state")); !os.IsNotExist(err) {
		t.Fatalf("local config created state: %v", err)
	}
}

func TestParseArgsResolvesEnvironmentFileWithoutMutatingProcessEnvironment(t *testing.T) {
	dir := t.TempDir()
	envPath := filepath.Join(dir, ".env")
	if err := os.WriteFile(
		envPath,
		[]byte("TAILBENCH_EXEC_ID=from-file\nTAILBENCH_EXEC_SECRET=file-secret\n"),
		0o600,
	); err != nil {
		t.Fatal(err)
	}
	configPath := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(configPath, []byte(`env_file: .env
tailscale:
  oauth_client_id: ${TAILBENCH_EXEC_ID}
  oauth_client_secret: ${TAILBENCH_EXEC_SECRET}
benchmark:
  modes: [l4-kernel]
`), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("TAILBENCH_EXEC_ID", "from-process")
	if err := os.Unsetenv("TAILBENCH_EXEC_SECRET"); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Unsetenv("TAILBENCH_EXEC_SECRET") })

	cfg, err := ParseArgs("aws", []string{"--config", configPath})
	if err != nil {
		t.Fatal(err)
	}
	if cfg.OAuthClientID != "from-process" || cfg.OAuthClientSecret != "file-secret" {
		t.Fatalf("resolved credentials = ID %q secret %q", cfg.OAuthClientID, cfg.OAuthClientSecret)
	}
	if _, exists := os.LookupEnv("TAILBENCH_EXEC_SECRET"); exists {
		t.Fatal("execution config leaked environment-file secret into process environment")
	}
}

func TestExecutionGuardrailDefaultsAndCLIPrecedence(t *testing.T) {
	dir := t.TempDir()
	defaultPath := filepath.Join(dir, "default.yaml")
	if err := os.WriteFile(defaultPath, []byte("benchmark:\n  modes: [l4-kernel]\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	defaults, err := ParseLocalArgs("aws", []string{"--config", defaultPath})
	if err != nil {
		t.Fatal(err)
	}
	if defaults.MaxCostUSD != 10 || defaults.MaxCostSet {
		t.Fatalf("default max cost = %v (set=%v), want 10 (set=false)", defaults.MaxCostUSD, defaults.MaxCostSet)
	}
	if defaults.MaxDuration != 45*time.Minute {
		t.Fatalf("default max duration = %s, want 45m", defaults.MaxDuration)
	}
	if defaults.MaxInstanceTypes != 1 || defaults.MaxConcurrentResources != 1 {
		t.Fatalf(
			"default count limits = instances %d concurrency %d, want 1 and 1",
			defaults.MaxInstanceTypes,
			defaults.MaxConcurrentResources,
		)
	}
	if defaults.CleanupPolicy != "always" {
		t.Fatalf("default cleanup policy = %q, want always", defaults.CleanupPolicy)
	}

	configPath := filepath.Join(dir, "guardrails.yaml")
	if err := os.WriteFile(configPath, []byte(`max_cost_usd: 20
max_duration: 2h
max_instance_types: 4
max_concurrent_resources: 2
cleanup_policy: manual
benchmark:
  modes: [l4-kernel]
`), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg, err := ParseLocalArgs("aws", []string{
		"--config", configPath,
		"--max-cost-usd", "5",
		"--max-duration", "30m",
		"--max-instance-types", "2",
		"--max-concurrent-resources", "1",
		"--cleanup-policy", "on-success",
		"--yes",
	})
	if err != nil {
		t.Fatal(err)
	}
	if !cfg.Yes || cfg.MaxCostUSD != 5 || !cfg.MaxCostSet {
		t.Fatalf("CLI approval/cost = yes %v cost %v set %v", cfg.Yes, cfg.MaxCostUSD, cfg.MaxCostSet)
	}
	if cfg.MaxDuration != 30*time.Minute ||
		cfg.MaxInstanceTypes != 2 ||
		cfg.MaxConcurrentResources != 1 ||
		cfg.CleanupPolicy != "on-success" {
		t.Fatalf("CLI guardrails = %#v", cfg)
	}
}

func TestInvalidExecutionGuardrailsFailDuringLocalParsing(t *testing.T) {
	dir := t.TempDir()
	configPath := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(configPath, []byte("benchmark:\n  modes: [l4-kernel]\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	for _, args := range [][]string{
		{"--max-cost-usd", "0"},
		{"--max-duration", "0s"},
		{"--max-instance-types", "0"},
		{"--max-concurrent-resources", "0"},
		{"--cleanup-policy", "sometimes"},
	} {
		fullArgs := append([]string{"--config", configPath}, args...)
		if _, err := ParseLocalArgs("aws", fullArgs); err == nil {
			t.Fatalf("ParseLocalArgs(%v) unexpectedly succeeded", args)
		}
	}
}

func TestRedactedSnapshotRoundTripPreservesExecutionSettingsWithoutSecrets(t *testing.T) {
	cfg := &Config{
		Providers:              []string{"aws"},
		Family:                 "c7i",
		Filter:                 `^c7i\.large$`,
		OAuthClientID:          "client-id-must-not-appear",
		OAuthClientSecret:      "client-secret-must-not-appear",
		AzureSSHPubKey:         "ssh-public-material",
		Modes:                  []string{"l4-kernel"},
		AWSRegion:              "us-west-2",
		AWSAZ:                  "us-west-2a",
		MaxCostUSD:             7.5,
		MaxCostSet:             true,
		MaxDuration:            35 * time.Minute,
		MaxInstanceTypes:       2,
		MaxConcurrentResources: 1,
		CleanupPolicy:          CleanupAlways,
		RootDir:                "/workspace",
		StateDir:               "file:///workspace/state",
	}

	data, err := MarshalRedacted(cfg)
	if err != nil {
		t.Fatal(err)
	}
	for _, forbidden := range []string{
		"client-id-must-not-appear",
		"client-secret-must-not-appear",
		"ssh-public-material",
	} {
		if strings.Contains(string(data), forbidden) {
			t.Fatalf("redacted snapshot leaked %q: %s", forbidden, data)
		}
	}
	restored, err := ParseRedacted(data)
	if err != nil {
		t.Fatal(err)
	}
	if restored.OAuthClientID != "" ||
		restored.OAuthClientSecret != "" ||
		restored.AzureSSHPubKey != "" {
		t.Fatalf("restored snapshot contains secret material: %#v", restored)
	}
	if restored.Family != cfg.Family ||
		restored.Filter != cfg.Filter ||
		restored.MaxDuration != cfg.MaxDuration ||
		restored.MaxCostUSD != cfg.MaxCostUSD ||
		restored.CleanupPolicy != cfg.CleanupPolicy {
		t.Fatalf("restored snapshot = %#v, want settings from %#v", restored, cfg)
	}
}
