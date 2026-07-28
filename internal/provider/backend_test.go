package provider

import (
	"path/filepath"
	"strings"
	"testing"
)

func TestBackendURLDefaultsToPerProviderLocalState(t *testing.T) {
	got := BackendURL("", "file:///repo/state", "aws")
	if want := "file:///repo/state/aws"; got != want {
		t.Fatalf("BackendURL = %q, want %q", got, want)
	}
	// A trailing slash must not produce a doubled separator.
	if got := BackendURL("", "file:///repo/state/", "gcp"); got != "file:///repo/state/gcp" {
		t.Fatalf("BackendURL with trailing slash = %q", got)
	}
}

func TestBackendURLUsesConfiguredBackendUnchanged(t *testing.T) {
	// Remote backends are shared across providers; stack names already carry
	// the provider, so no path segment is appended.
	for _, backend := range []string{
		"https://api.pulumi.com",
		"s3://tailbench-state/prefix",
		"gs://tailbench-state",
	} {
		if got := BackendURL(backend, "file:///repo/state", "aws"); got != backend {
			t.Fatalf("BackendURL(%q) = %q, want it unchanged", backend, got)
		}
	}
}

func TestWorkDirIsAlwaysLocal(t *testing.T) {
	t.Chdir(t.TempDir())

	// File backend: the workspace lives in the state directory itself.
	local := WorkDir("file://"+filepath.Join(t.TempDir(), "state", "aws"), "aws")
	if !filepath.IsAbs(local) || strings.Contains(local, "file://") {
		t.Fatalf("file backend workdir = %q, want a clean absolute path", local)
	}

	// Remote backend: must still yield a usable local path, never the URL.
	remote := WorkDir("https://api.pulumi.com", "aws")
	if strings.Contains(remote, "://") {
		t.Fatalf("remote backend workdir = %q, want a local path", remote)
	}
	if want := filepath.Join(".tailbench", "pulumi", "aws"); remote != want {
		t.Fatalf("remote backend workdir = %q, want %q", remote, want)
	}
}

func TestIsRemoteBackend(t *testing.T) {
	cases := map[string]bool{
		"":                       false,
		"file:///repo/state/aws": false,
		"https://api.pulumi.com": true,
		"s3://bucket":            true,
	}
	for backend, want := range cases {
		if got := IsRemoteBackend(backend); got != want {
			t.Errorf("IsRemoteBackend(%q) = %v, want %v", backend, got, want)
		}
	}
}

func TestCheckBackendCredentials(t *testing.T) {
	t.Run("non-cloud backends need no token", func(t *testing.T) {
		t.Setenv("PULUMI_ACCESS_TOKEN", "")
		for _, backend := range []string{"", "file:///repo/state/aws", "s3://bucket"} {
			if err := CheckBackendCredentials(backend); err != nil {
				t.Errorf("CheckBackendCredentials(%q) = %v, want nil", backend, err)
			}
		}
	})

	t.Run("cloud backend accepts a token", func(t *testing.T) {
		t.Setenv("PULUMI_ACCESS_TOKEN", "pul-abc123")
		if err := CheckBackendCredentials("https://api.pulumi.com"); err != nil {
			t.Fatalf("with token: %v", err)
		}
	})

	t.Run("cloud backend without token or login is reported", func(t *testing.T) {
		t.Setenv("PULUMI_ACCESS_TOKEN", "")
		// Point HOME at an empty dir so ~/.pulumi/credentials.json cannot be found.
		t.Setenv("HOME", t.TempDir())
		err := CheckBackendCredentials("https://api.pulumi.com")
		if err == nil {
			t.Fatal("missing credentials should be reported, got nil")
		}
		if !strings.Contains(err.Error(), "PULUMI_ACCESS_TOKEN") {
			t.Fatalf("error should name the env var, got: %v", err)
		}
	})
}
