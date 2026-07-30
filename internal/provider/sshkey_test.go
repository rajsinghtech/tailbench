package provider

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"golang.org/x/crypto/ssh"
)

func TestEnsureSSHKeyGeneratesUsableKeyPair(t *testing.T) {
	root := t.TempDir()

	authorized, keyPath, err := EnsureSSHKey(root, "tailbench-ab12cd")
	if err != nil {
		t.Fatalf("EnsureSSHKey: %v", err)
	}

	if !strings.HasPrefix(authorized, "ssh-ed25519 ") {
		t.Fatalf("authorized key = %q, want an ssh-ed25519 line", authorized)
	}
	if _, _, _, _, parseErr := ssh.ParseAuthorizedKey([]byte(authorized)); parseErr != nil {
		t.Fatalf("authorized key is not parseable: %v", parseErr)
	}

	if keyPath != filepath.Join(root, SSHKeyDir, "tailbench-ab12cd.pem") {
		t.Fatalf("key path = %q", keyPath)
	}
	data, err := os.ReadFile(keyPath)
	if err != nil {
		t.Fatalf("read private key: %v", err)
	}
	if _, parseErr := ssh.ParsePrivateKey(data); parseErr != nil {
		t.Fatalf("private key is not usable: %v", parseErr)
	}
}

// The private key is a secret an operator may rely on, so it must not be
// world- or group-readable.
func TestEnsureSSHKeyIsPrivate(t *testing.T) {
	root := t.TempDir()
	_, keyPath, err := EnsureSSHKey(root, "tailbench-ab12cd")
	if err != nil {
		t.Fatalf("EnsureSSHKey: %v", err)
	}

	info, err := os.Stat(keyPath)
	if err != nil {
		t.Fatalf("stat: %v", err)
	}
	if perm := info.Mode().Perm(); perm != 0o600 {
		t.Fatalf("private key mode = %04o, want 0600", perm)
	}
}

// Regenerating on every call would change the public key, make Pulumi replace
// the cloud key-pair resource, and invalidate the private key already on disk.
func TestEnsureSSHKeyReusesExistingKey(t *testing.T) {
	root := t.TempDir()

	first, keyPath, err := EnsureSSHKey(root, "tailbench-ab12cd")
	if err != nil {
		t.Fatalf("first EnsureSSHKey: %v", err)
	}
	firstBytes, err := os.ReadFile(keyPath)
	if err != nil {
		t.Fatalf("read: %v", err)
	}

	second, _, err := EnsureSSHKey(root, "tailbench-ab12cd")
	if err != nil {
		t.Fatalf("second EnsureSSHKey: %v", err)
	}
	secondBytes, err := os.ReadFile(keyPath)
	if err != nil {
		t.Fatalf("re-read: %v", err)
	}

	if first != second {
		t.Fatal("public key changed on the second call; Pulumi would replace the key pair")
	}
	if string(firstBytes) != string(secondBytes) {
		t.Fatal("private key file was rewritten; a saved key would be invalidated")
	}
}

// An operator who supplies a real key must get exactly that key on the
// instances: no rewriting, and nothing generated behind their back.
func TestResolveSSHPublicKeyKeepsConfiguredKeyUnchanged(t *testing.T) {
	root := t.TempDir()
	configured := "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKeyMaterialForTest operator@example"

	got, keyPath, err := ResolveSSHPublicKey(root, "tailbench-ab12cd", configured)
	if err != nil {
		t.Fatalf("ResolveSSHPublicKey: %v", err)
	}
	if got != configured {
		t.Fatalf("configured key was rewritten: %q", got)
	}
	if keyPath != "" {
		t.Fatalf("key path = %q, want empty when nothing was generated", keyPath)
	}
	if _, statErr := os.Stat(filepath.Join(root, SSHKeyDir)); !os.IsNotExist(statErr) {
		t.Fatalf("generated a key alongside the configured one: %v", statErr)
	}
}

// Trailing whitespace from a `ssh_pub_key_file` that ends in a newline must not
// leak into the value: GCP embeds it in a single-line "user:key" metadata value.
func TestResolveSSHPublicKeyReturnsOneLine(t *testing.T) {
	root := t.TempDir()
	configured := "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKeyMaterialForTest operator@example"

	got, _, err := ResolveSSHPublicKey(root, "tailbench-ab12cd", configured+"\n")
	if err != nil {
		t.Fatalf("ResolveSSHPublicKey: %v", err)
	}
	if got != configured {
		t.Fatalf("configured key = %q, want the trailing newline trimmed", got)
	}

	generated, _, err := ResolveSSHPublicKey(root, "tailbench-ab12cd", "")
	if err != nil {
		t.Fatalf("ResolveSSHPublicKey: %v", err)
	}
	if strings.ContainsAny(generated, "\r\n") {
		t.Fatalf("generated key = %q, want no line break", generated)
	}
}

// With no key configured a provider must still end up with a usable login,
// persisted where the operator can find it.
func TestResolveSSHPublicKeyGeneratesWhenUnconfigured(t *testing.T) {
	root := t.TempDir()

	got, keyPath, err := ResolveSSHPublicKey(root, "tailbench-ab12cd", "")
	if err != nil {
		t.Fatalf("ResolveSSHPublicKey: %v", err)
	}
	if got == "" {
		t.Fatal("resolved an empty authorized key; instances would have no login")
	}
	if _, _, _, _, parseErr := ssh.ParseAuthorizedKey([]byte(got)); parseErr != nil {
		t.Fatalf("generated key is not parseable: %v", parseErr)
	}
	if keyPath != SSHKeyPath(root, "tailbench-ab12cd") {
		t.Fatalf("key path = %q", keyPath)
	}
	if _, statErr := os.Stat(keyPath); statErr != nil {
		t.Fatalf("private key was not persisted: %v", statErr)
	}
}

// SetupNetworking and CreatePair both resolve for GCP and Azure, which have no
// key-pair resource. If those calls disagreed, Pulumi would replace the
// instances on the next up.
func TestResolveSSHPublicKeyIsStableAcrossCalls(t *testing.T) {
	root := t.TempDir()

	first, _, err := ResolveSSHPublicKey(root, "tailbench-ab12cd", "")
	if err != nil {
		t.Fatalf("first ResolveSSHPublicKey: %v", err)
	}
	second, _, err := ResolveSSHPublicKey(root, "tailbench-ab12cd", "")
	if err != nil {
		t.Fatalf("second ResolveSSHPublicKey: %v", err)
	}
	if first != second {
		t.Fatalf("resolved key changed between calls: %q then %q", first, second)
	}
}

// An unusable key on disk must fail the run, not resolve to "" and provision
// instances with no login.
func TestResolveSSHPublicKeyReportsUnusableStoredKey(t *testing.T) {
	root := t.TempDir()
	keyPath := SSHKeyPath(root, "tailbench-ab12cd")
	if err := os.MkdirAll(filepath.Dir(keyPath), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(keyPath, []byte("not a private key\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	got, _, err := ResolveSSHPublicKey(root, "tailbench-ab12cd", "")
	if err == nil {
		t.Fatalf("corrupt stored key resolved to %q, want an error", got)
	}
	if got != "" {
		t.Fatalf("resolved %q alongside an error", got)
	}
}

// A different run ID must get its own key, so cleanup of one run cannot strand
// another run's access.
func TestEnsureSSHKeyIsPerName(t *testing.T) {
	root := t.TempDir()

	one, _, err := EnsureSSHKey(root, "tailbench-ab12cd")
	if err != nil {
		t.Fatalf("EnsureSSHKey: %v", err)
	}
	two, _, err := EnsureSSHKey(root, "tailbench-ef34gh")
	if err != nil {
		t.Fatalf("EnsureSSHKey: %v", err)
	}
	if one == two {
		t.Fatal("distinct key names produced the same public key")
	}
}
