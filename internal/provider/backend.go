package provider

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// BackendURL resolves the Pulumi state backend for one provider.
//
// An empty configured backend preserves the local default: per-provider file
// state under <localStateDir>/<providerName>. Any other backend is used as-is
// and shared across providers — stacks stay isolated regardless, because every
// stack name is already provider-qualified (`tailbench-<provider>-*`).
func BackendURL(configured, localStateDir, providerName string) string {
	if configured != "" {
		return configured
	}
	return strings.TrimSuffix(localStateDir, "/") + "/" + providerName
}

// WorkDir returns the local directory Pulumi uses for its project and stack
// settings files, creating it if needed.
//
// This is deliberately separate from the backend: Pulumi always needs a real
// path here, even when state lives in Pulumi Cloud or an object store, so a
// remote backend gets scratch space under .tailbench rather than an unusable
// directory named after a URL.
func WorkDir(backendURL, providerName string) string {
	dir, isFile := strings.CutPrefix(backendURL, "file://")
	if !isFile {
		dir = filepath.Join(".tailbench", "pulumi", providerName)
	}
	dir = filepath.Clean(dir)
	_ = os.MkdirAll(dir, 0o755)
	return dir
}

// IsRemoteBackend reports whether state lives somewhere other than this
// machine's filesystem — meaning stacks survive a different checkout or host.
func IsRemoteBackend(backendURL string) bool {
	return backendURL != "" && !strings.HasPrefix(backendURL, "file://")
}

// IsPulumiCloud reports whether the backend is the managed Pulumi service.
func IsPulumiCloud(backendURL string) bool {
	return strings.HasPrefix(backendURL, "https://api.pulumi.com") ||
		strings.HasPrefix(backendURL, "https://app.pulumi.com")
}

// CheckBackendCredentials fails fast when the configured backend needs
// credentials that are not present, so an unauthenticated run stops at startup
// instead of partway through the first stack operation.
//
// Only Pulumi Cloud is checked: object-store backends authenticate through the
// same cloud credentials the provider already requires, so a separate check
// would duplicate what the provider reports anyway.
func CheckBackendCredentials(backendURL string) error {
	if !IsPulumiCloud(backendURL) {
		return nil
	}
	if os.Getenv("PULUMI_ACCESS_TOKEN") != "" {
		return nil
	}
	if home, err := os.UserHomeDir(); err == nil {
		if _, err := os.Stat(filepath.Join(home, ".pulumi", "credentials.json")); err == nil {
			return nil
		}
	}
	return fmt.Errorf(
		"state_backend is Pulumi Cloud (%s) but no credentials were found: "+
			"set PULUMI_ACCESS_TOKEN (an entry in .env works — it is inherited by the Pulumi CLI) "+
			"or run `pulumi login`", backendURL)
}
