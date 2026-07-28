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
	return &provider.GCPProvider{
		Project: cfg.GCPProject, Zone: cfg.GCPZone, Region: region,
		Network: "default", Subnet: "default",
		StateDir: providerStateDir(cfg.StateDir, compiledProviderName),
		RunID:    cfg.RunID, ExpiresAt: cfg.ResourceExpiresAt,
	}
}
