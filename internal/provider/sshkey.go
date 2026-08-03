package provider

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/pem"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/crypto/ssh"
)

// SSHKeyDir is where generated private keys are written, relative to the
// working directory. .tailbench/ is gitignored.
const SSHKeyDir = ".tailbench/ssh"

// SSHKeyPath returns the on-disk location of the private key for a key-pair name.
func SSHKeyPath(rootDir, keyName string) string {
	return filepath.Join(rootDir, SSHKeyDir, keyName+".pem")
}

// EnsureSSHKey returns an OpenSSH authorized_keys line for keyName, generating
// and persisting an ed25519 private key when one is not already on disk.
//
// Benchmark access itself is Tailscale SSH, so this key is never used on the
// happy path. It exists for the case that matters most: cloud-init failing
// before `tailscale up`, or an auth key being rejected, which otherwise leaves
// an instance running and completely unreachable.
//
// An existing key is reused rather than regenerated. Regenerating would change
// the public key on every run, which makes Pulumi replace the cloud key-pair
// resource and silently invalidates any private key an operator already saved.
func EnsureSSHKey(rootDir, keyName string) (authorizedKey string, keyPath string, err error) {
	keyPath = SSHKeyPath(rootDir, keyName)

	if data, readErr := os.ReadFile(keyPath); readErr == nil {
		signer, parseErr := ssh.ParsePrivateKey(data)
		if parseErr != nil {
			return "", keyPath, fmt.Errorf("parse existing SSH key %s: %w", keyPath, parseErr)
		}
		return string(ssh.MarshalAuthorizedKey(signer.PublicKey())), keyPath, nil
	} else if !os.IsNotExist(readErr) {
		return "", keyPath, fmt.Errorf("read SSH key %s: %w", keyPath, readErr)
	}

	public, private, genErr := ed25519.GenerateKey(rand.Reader)
	if genErr != nil {
		return "", keyPath, fmt.Errorf("generate SSH key: %w", genErr)
	}
	block, marshalErr := ssh.MarshalPrivateKey(private, "tailbench")
	if marshalErr != nil {
		return "", keyPath, fmt.Errorf("marshal SSH key: %w", marshalErr)
	}
	if err := os.MkdirAll(filepath.Dir(keyPath), 0o700); err != nil {
		return "", keyPath, fmt.Errorf("create SSH key directory: %w", err)
	}
	if err := os.WriteFile(keyPath, pem.EncodeToMemory(block), 0o600); err != nil {
		return "", keyPath, fmt.Errorf("write SSH key %s: %w", keyPath, err)
	}

	sshPublic, publicErr := ssh.NewPublicKey(public)
	if publicErr != nil {
		return "", keyPath, fmt.Errorf("derive SSH public key: %w", publicErr)
	}
	return string(ssh.MarshalAuthorizedKey(sshPublic)), keyPath, nil
}

// ResolveSSHPublicKey returns the single authorized_keys line a provider should
// install on the instances it creates, with no trailing newline so it can be
// embedded in formats that are line-oriented (GCP's "user:key" metadata).
//
// A configured key wins and is used unchanged, so an operator who supplies a
// real key pair keeps it. When nothing is configured a key is generated and
// persisted under .tailbench/ssh, which gives every provider the same floor: an
// instance whose cloud-init dies before `tailscale up` is still reachable for
// diagnosis rather than an opaque billed VM.
//
// keyPath is empty when the configured key was used, and otherwise names the
// generated private key so the caller can tell the operator where it landed.
//
// Calling this more than once in a run is expected and safe: providers that have
// no key-pair resource to create in SetupNetworking resolve again in CreatePair.
// EnsureSSHKey reuses the key already on disk, so every call yields identical
// material and no instance is replaced on a later up.
func ResolveSSHPublicKey(rootDir, keyName, configured string) (authorizedKey, keyPath string, err error) {
	if trimmed := strings.TrimSpace(configured); trimmed != "" {
		return trimmed, "", nil
	}
	generated, keyPath, err := EnsureSSHKey(rootDir, keyName)
	if err != nil {
		return "", keyPath, err
	}
	return strings.TrimSpace(generated), keyPath, nil
}
