package sshclient

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"time"

	"golang.org/x/crypto/ssh"
)

type Client struct {
	conn *ssh.Client
}

// Dial connects to host:22 via SSH with exponential backoff retries.
// Uses 1s initial backoff capped at 5s, defaulting to 60 retries if maxRetries <= 0.
func Dial(host, user string, privateKey []byte, maxRetries int) (*Client, error) {
	signer, err := ssh.ParsePrivateKey(privateKey)
	if err != nil {
		return nil, fmt.Errorf("parse private key: %w", err)
	}

	if maxRetries <= 0 {
		maxRetries = 60
	}

	cfg := &ssh.ClientConfig{
		User:            user,
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(signer)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	addr := host + ":22"
	var conn *ssh.Client
	for attempt := range maxRetries {
		conn, err = ssh.Dial("tcp", addr, cfg)
		if err == nil {
			return &Client{conn: conn}, nil
		}
		shift := uint(attempt)
		if shift > 4 {
			shift = 4
		}
		backoff := time.Second * time.Duration(1<<shift)
		if backoff > 5*time.Second {
			backoff = 5 * time.Second
		}
		time.Sleep(backoff)
	}
	return nil, fmt.Errorf("ssh dial %s after %d attempts: %w", addr, maxRetries, err)
}

// DialWithKeyFile reads a PEM private key from disk and calls Dial.
func DialWithKeyFile(host, user, keyPath string, maxRetries int) (*Client, error) {
	key, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, fmt.Errorf("read key file %s: %w", keyPath, err)
	}
	return Dial(host, user, key, maxRetries)
}

// Run executes cmd on the remote host, returning stdout and stderr.
// Respects context cancellation.
func (c *Client) Run(ctx context.Context, cmd string) (string, string, error) {
	sess, err := c.conn.NewSession()
	if err != nil {
		return "", "", fmt.Errorf("new session: %w", err)
	}
	defer sess.Close()

	var stdout, stderr bytes.Buffer
	sess.Stdout = &stdout
	sess.Stderr = &stderr

	done := make(chan error, 1)
	go func() { done <- sess.Run(cmd) }()

	select {
	case <-ctx.Done():
		_ = sess.Signal(ssh.SIGKILL)
		return stdout.String(), stderr.String(), ctx.Err()
	case err := <-done:
		return stdout.String(), stderr.String(), err
	}
}

// WaitForReady polls the remote host every 5s until /tmp/tailbench-ready exists.
func (c *Client) WaitForReady(ctx context.Context) error {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		_, _, err := c.Run(ctx, "test -f /tmp/tailbench-ready")
		if err == nil {
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

// Close closes the underlying SSH connection.
func (c *Client) Close() error {
	return c.conn.Close()
}
