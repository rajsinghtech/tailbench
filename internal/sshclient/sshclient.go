package sshclient

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"time"

	"golang.org/x/crypto/ssh"
	"tailscale.com/tsnet"
)

type Client struct {
	conn *ssh.Client
}

// Dial connects to a host over the Tailscale network using tsnet.
// Tailscale SSH handles auth via node identity — the dummy password
// satisfies Go's SSH client handshake while Tailscale's PasswordCallback
// authenticates based on the source node's identity.
func Dial(srv *tsnet.Server, host, user string, maxRetries int) (*Client, error) {
	if maxRetries <= 0 {
		maxRetries = 120
	}

	cfg := &ssh.ClientConfig{
		User:            user,
		Auth:            []ssh.AuthMethod{ssh.Password("tailscale")},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	addr := host + ":22"
	var lastErr error
	for attempt := range maxRetries {
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		conn, err := srv.Dial(ctx, "tcp", addr)
		cancel()
		if err != nil {
			lastErr = err
			if attempt%10 == 0 {
				log.Printf("tsnet dial %s attempt %d: %v", addr, attempt, err)
			}
		} else {
			sshConn, chans, reqs, err := ssh.NewClientConn(conn, addr, cfg)
			if err != nil {
				conn.Close()
				lastErr = err
				log.Printf("tsnet ssh handshake %s attempt %d: %v", addr, attempt, err)
			} else {
				log.Printf("tsnet ssh connected to %s after %d attempts", addr, attempt)
				return &Client{conn: ssh.NewClient(sshConn, chans, reqs)}, nil
			}
		}
		backoff := min(time.Second*time.Duration(1<<min(uint(attempt), 4)), 5*time.Second)
		time.Sleep(backoff)
	}
	return nil, fmt.Errorf("tsnet ssh dial %s after %d attempts: %w", addr, maxRetries, lastErr)
}

// Run executes cmd on the remote host, returning stdout and stderr.
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
