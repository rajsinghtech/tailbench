//go:build aws && k8s && !azure && !gcp

package main

import (
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/provider"
)

const compiledProviderName = "eks"

func newCompiledProvider(cfg *config.Config) provider.Provider {
	return &provider.EKSProvider{
		Region: cfg.AWSRegion, AZ: cfg.AWSAZ,
		StateDir: providerStateDir(cfg.StateDir, compiledProviderName),
		RunID:    cfg.RunID, ExpiresAt: cfg.ResourceExpiresAt,
	}
}
