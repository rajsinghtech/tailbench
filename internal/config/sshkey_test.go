package config

import (
	"os"
	"path/filepath"
	"testing"
)

const testAzurePubKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKeyMaterialForTest operator@example"

func writeAzureConfig(t *testing.T, body string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(path, []byte(body), 0o600); err != nil {
		t.Fatal(err)
	}
	return path
}

// A configured key must reach the provider byte-for-byte, so an operator who
// supplies a real key pair keeps it.
func TestParseArgsUsesConfiguredAzureSSHKeyUnchanged(t *testing.T) {
	path := writeAzureConfig(t, "azure:\n  ssh_pub_key_file: key.pub\n")
	if err := os.WriteFile(filepath.Join(filepath.Dir(path), "key.pub"), []byte(testAzurePubKey+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	cfg, err := ParseArgs("azure", []string{"--config", path})
	if err != nil {
		t.Fatalf("ParseArgs: %v", err)
	}
	if cfg.AzureSSHPubKey != testAzurePubKey {
		t.Fatalf("AzureSSHPubKey = %q, want %q", cfg.AzureSSHPubKey, testAzurePubKey)
	}
}

// The old code swallowed this read error and fell through to ~/.ssh, so a typo
// in the path silently produced VMs with no out-of-band login.
func TestParseArgsReportsUnreadableAzureSSHKeyFile(t *testing.T) {
	path := writeAzureConfig(t, "azure:\n  ssh_pub_key_file: does-not-exist.pub\n")

	cfg, err := ParseArgs("azure", []string{"--config", path})
	if err == nil {
		t.Fatalf("missing azure.ssh_pub_key_file resolved to %q, want an error", cfg.AzureSSHPubKey)
	}
}

func TestParseArgsReportsEmptyAzureSSHKeyFile(t *testing.T) {
	path := writeAzureConfig(t, "azure:\n  ssh_pub_key_file: key.pub\n")
	if err := os.WriteFile(filepath.Join(filepath.Dir(path), "key.pub"), []byte("\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	if _, err := ParseArgs("azure", []string{"--config", path}); err == nil {
		t.Fatal("empty azure.ssh_pub_key_file should be reported, got nil error")
	}
}

// With nothing configured the value stays empty and the provider generates a
// recorded, run-scoped key. It must not silently pick up the operator's personal
// key, which made the result depend on the contents of the machine's ~/.ssh.
// With nothing configured, the operator's own public key is used, so the key
// they already hold works on the benchmark VMs without any configuration. This
// is the out-of-band login that matters when cloud-init dies before
// `tailscale up`; making people look up a generated key first is a worse
// default than using the one they already have.
func TestParseArgsUsesOperatorSSHKeyWhenUnconfigured(t *testing.T) {
	home := t.TempDir()
	if err := os.MkdirAll(filepath.Join(home, ".ssh"), 0o700); err != nil {
		t.Fatal(err)
	}
	personal := "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPersonalKeyForTest operator@laptop"
	if err := os.WriteFile(filepath.Join(home, ".ssh", "id_ed25519.pub"), []byte(personal+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("HOME", home)

	path := writeAzureConfig(t, "azure:\n  location: eastus\n")
	cfg, err := ParseArgs("azure", []string{"--config", path})
	if err != nil {
		t.Fatalf("ParseArgs: %v", err)
	}
	if cfg.AzureSSHPubKey != personal {
		t.Fatalf("AzureSSHPubKey = %q, want the operator's ~/.ssh/id_ed25519.pub", cfg.AzureSSHPubKey)
	}
	if cfg.AzureSSHUser != "azureuser" {
		t.Fatalf("AzureSSHUser = %q, want the azureuser default preserved", cfg.AzureSSHUser)
	}
}

// With no configured path and no operator key, the value stays empty and the
// provider generates a recorded key pair rather than leaving VMs with no login.
func TestParseArgsLeavesAzureSSHKeyUnsetWithNoOperatorKey(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)

	path := writeAzureConfig(t, "azure:\n  location: eastus\n")
	cfg, err := ParseArgs("azure", []string{"--config", path})
	if err != nil {
		t.Fatalf("ParseArgs: %v", err)
	}
	if cfg.AzureSSHPubKey != "" {
		t.Fatalf("AzureSSHPubKey = %q, want empty so the provider generates one", cfg.AzureSSHPubKey)
	}
}

// A configured path outranks the operator's key: someone who names a key means
// that key, not whatever happens to be in their home directory.
func TestParseArgsConfiguredKeyOutranksOperatorKey(t *testing.T) {
	home := t.TempDir()
	if err := os.MkdirAll(filepath.Join(home, ".ssh"), 0o700); err != nil {
		t.Fatal(err)
	}
	personal := "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPersonalKeyForTest operator@laptop"
	if err := os.WriteFile(filepath.Join(home, ".ssh", "id_ed25519.pub"), []byte(personal+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("HOME", home)

	configured := "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIConfiguredKeyForTest ops@ci"
	dir := t.TempDir()
	keyPath := filepath.Join(dir, "bench.pub")
	if err := os.WriteFile(keyPath, []byte(configured+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	path := writeAzureConfig(t, "azure:\n  location: eastus\n  ssh_pub_key_file: "+keyPath+"\n")
	cfg, err := ParseArgs("azure", []string{"--config", path})
	if err != nil {
		t.Fatalf("ParseArgs: %v", err)
	}
	if cfg.AzureSSHPubKey != configured {
		t.Fatalf("AzureSSHPubKey = %q, want the configured key", cfg.AzureSSHPubKey)
	}
}
