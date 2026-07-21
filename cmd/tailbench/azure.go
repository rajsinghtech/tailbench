//go:build azure && !k8s && !aws && !gcp

package main

import (
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/provider"
)

const compiledProviderName = "azure"

func newCompiledProvider(cfg *config.Config) provider.Provider {
	return &provider.AzureProvider{Location: cfg.AzureLocation, ResourceGroup: cfg.AzureResourceGroup, SSHUser: cfg.AzureSSHUser, SSHPubKey: cfg.AzureSSHPubKey, StateDir: providerStateDir(cfg.StateDir, compiledProviderName)}
}
