package sshclient

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/pem"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/ssh"
)

func TestParsePrivateKey(t *testing.T) {
	_, priv, err := ed25519.GenerateKey(rand.Reader)
	require.NoError(t, err)
	pemBlock, err := ssh.MarshalPrivateKey(priv, "")
	require.NoError(t, err)
	pemBytes := pem.EncodeToMemory(pemBlock)
	signer, err := ssh.ParsePrivateKey(pemBytes)
	require.NoError(t, err)
	assert.Equal(t, "ssh-ed25519", signer.PublicKey().Type())
}

func TestDialInvalidKey(t *testing.T) {
	_, err := Dial("127.0.0.1", "test", []byte("not a key"), 1)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "parse private key")
}
