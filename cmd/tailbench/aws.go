//go:build aws && !k8s && !azure && !gcp

package main

import (
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/provider"
)

const compiledProviderName = "aws"

func newCompiledProvider(cfg *config.Config) provider.Provider {
	return &provider.AWSProvider{
		Region:    cfg.AWSRegion,
		AZ:        cfg.AWSAZ,
		KeyName:   cfg.AWSKeyName,
		StateDir:  providerStateDir(cfg.StateDir, compiledProviderName),
		RunID:     cfg.RunID,
		ExpiresAt: cfg.ResourceExpiresAt,
	}
}
