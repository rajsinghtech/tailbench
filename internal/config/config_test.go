package config

import (
	"os"
	"path/filepath"
	"testing"
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
