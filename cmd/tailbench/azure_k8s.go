//go:build azure && k8s && !aws && !gcp

package main

import (
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/provider"
)

const compiledProviderName = "aks"

func newCompiledProvider(cfg *config.Config) provider.Provider {
	return &provider.AKSProvider{
		Location: cfg.AzureLocation, ResourceGroup: cfg.AzureResourceGroup,
		StateDir: providerStateDir(cfg.StateDir, compiledProviderName),
		RunID:    cfg.RunID, ExpiresAt: cfg.ResourceExpiresAt,
	}
}
