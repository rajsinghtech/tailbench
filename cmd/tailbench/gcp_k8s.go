//go:build gcp && k8s && !aws && !azure

package main

import (
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/provider"
)

const compiledProviderName = "gke"

func newCompiledProvider(cfg *config.Config) provider.Provider {
	return &provider.GKEProvider{
		Project: cfg.GCPProject, Zone: cfg.GCPZone,
		StateDir: provider.BackendURL(cfg.StateBackend, cfg.StateDir, compiledProviderName),
		RunID:    cfg.RunID, ExpiresAt: cfg.ResourceExpiresAt,
	}
}
