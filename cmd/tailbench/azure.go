//go:build azure && !k8s && !aws && !gcp

package main

import (
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/provider"
)

const compiledProviderName = "azure"

func newCompiledProvider(cfg *config.Config) provider.Provider {
	// SSHPubKey is empty unless azure.ssh_pub_key_file named a readable file (an
	// unreadable one is a parse error, never a silent empty key). When empty the
	// provider generates a persistent key pair under .tailbench/ssh so a VM that
	// fails cloud-init before `tailscale up` stays reachable.
	return &provider.AzureProvider{
		Location: cfg.AzureLocation, ResourceGroup: cfg.AzureResourceGroup,
		SSHUser: cfg.AzureSSHUser, SSHPubKey: cfg.AzureSSHPubKey,
		StateDir: provider.BackendURL(cfg.StateBackend, cfg.StateDir, compiledProviderName),
		RunID:    cfg.RunID, ExpiresAt: cfg.ResourceExpiresAt,
	}
}
