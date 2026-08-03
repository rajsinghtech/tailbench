package config

import (
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

const redactedSnapshotSchemaVersion = 1

type redactedSnapshot struct {
	SchemaVersion int     `yaml:"schema_version"`
	MaxDuration   string  `yaml:"max_duration"`
	Config        *Config `yaml:"effective_config"`
}

// MarshalRedacted serializes the effective execution settings needed for
// recovery while deliberately removing credential and key material.
func MarshalRedacted(cfg *Config) ([]byte, error) {
	if cfg == nil {
		return nil, fmt.Errorf("configuration is required")
	}
	clone := *cfg
	clone.Providers = append([]string(nil), cfg.Providers...)
	clone.Modes = append([]string(nil), cfg.Modes...)
	clone.PPSDatagramSizes = append([]int(nil), cfg.PPSDatagramSizes...)
	clone.OAuthClientID = ""
	clone.OAuthClientSecret = ""
	clone.AzureSSHPubKey = ""
	clone.Yes = false
	clone.DryRun = false
	clone.MaxDuration = 0

	data, err := yaml.Marshal(redactedSnapshot{
		SchemaVersion: redactedSnapshotSchemaVersion,
		MaxDuration:   cfg.MaxDuration.String(),
		Config:        &clone,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal redacted effective configuration: %w", err)
	}
	return data, nil
}

// ParseRedacted reads a recovery snapshot. The returned configuration never
// contains credentials; the caller must resolve current secrets explicitly.
func ParseRedacted(data []byte) (*Config, error) {
	var snapshot redactedSnapshot
	if err := yaml.Unmarshal(data, &snapshot); err != nil {
		return nil, fmt.Errorf("parse redacted effective configuration: %w", err)
	}
	if snapshot.SchemaVersion != redactedSnapshotSchemaVersion {
		return nil, fmt.Errorf(
			"unsupported effective configuration schema %d; expected %d",
			snapshot.SchemaVersion,
			redactedSnapshotSchemaVersion,
		)
	}
	if snapshot.Config == nil {
		return nil, fmt.Errorf("effective configuration is missing")
	}
	duration, err := time.ParseDuration(snapshot.MaxDuration)
	if err != nil || duration <= 0 {
		return nil, fmt.Errorf("invalid recorded max_duration %q", snapshot.MaxDuration)
	}
	snapshot.Config.MaxDuration = duration
	snapshot.Config.OAuthClientID = ""
	snapshot.Config.OAuthClientSecret = ""
	snapshot.Config.AzureSSHPubKey = ""
	snapshot.Config.Yes = false
	snapshot.Config.DryRun = false
	return snapshot.Config, nil
}
