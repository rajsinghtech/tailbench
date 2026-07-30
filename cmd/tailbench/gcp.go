//go:build gcp && !k8s && !aws && !azure

package main

import (
	"strings"

	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/provider"
)

const compiledProviderName = "gcp"

func newCompiledProvider(cfg *config.Config) provider.Provider {
	region := cfg.GCPZone
	if idx := strings.LastIndex(region, "-"); idx > 0 {
		region = region[:idx]
	}
	// SSHUser and SSHPubKey are intentionally not set: there is no gcp.ssh_user
	// or gcp.ssh_pub_key_file config key. The provider defaults the login to
	// "ubuntu" and generates a persistent key pair under .tailbench/ssh, so an
	// instance that fails cloud-init before `tailscale up` stays reachable.
	return &provider.GCPProvider{
		Project: cfg.GCPProject, Zone: cfg.GCPZone, Region: region,
		Network: "default", Subnet: "default",
		StateDir: provider.BackendURL(cfg.StateBackend, cfg.StateDir, compiledProviderName),
		RunID:    cfg.RunID, ExpiresAt: cfg.ResourceExpiresAt,
	}
}
