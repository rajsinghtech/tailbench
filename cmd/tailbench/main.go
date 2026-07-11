package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"

	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/orchestrator"
	"github.com/rajsinghtech/tailbench/internal/provider"
)

var (
	version = "dev"
	commit  = "unknown"
	date    = "unknown"
)

func main() {
	for _, arg := range os.Args[1:] {
		if arg == "--version" {
			fmt.Printf("tailbench %s (commit %s, built %s)\n", version, commit, date)
			return
		}
	}
	cfg, err := config.Parse(compiledProviderName)
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	orch, err := orchestrator.New(cfg, compiledProviderFactory)
	if err != nil {
		log.Fatalf("orchestrator: %v", err)
	}
	if err := orch.Run(ctx); err != nil {
		log.Fatalf("tailbench: %v", err)
	}
}

func compiledProviderFactory(name string, cfg *config.Config) (provider.Provider, error) {
	if name != compiledProviderName {
		return nil, fmt.Errorf("requested provider %q, but this binary was compiled for provider %q", name, compiledProviderName)
	}
	return newCompiledProvider(cfg), nil
}

func providerStateDir(baseDir, providerName string) string {
	url := strings.TrimSuffix(baseDir, "/") + "/" + providerName
	_ = os.MkdirAll(filepath.Clean(strings.TrimPrefix(url, "file://")), 0o755)
	return url
}
