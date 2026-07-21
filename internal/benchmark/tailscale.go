package benchmark

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// TailscaleUp brings up tailscale on a remote host with the given auth key and hostname.
func TailscaleUp(ctx context.Context, c Executor, authKey, hostname string) error {
	_, _, err := c.Run(ctx, fmt.Sprintf("sudo tailscale up --authkey=%s --hostname=%s", authKey, hostname))
	if err != nil {
		return fmt.Errorf("tailscale up on %s: %w", hostname, err)
	}
	time.Sleep(2 * time.Second)
	return nil
}

// SetExitNode routes the client's internet-bound egress through the given
// exit-node Tailscale IP (the router under test in the forwarding-pps benchmark).
// --exit-node-allow-lan-access keeps local/tailnet management reachable while
// traffic to non-tailnet addresses (the sink's public IP) goes via the router.
func SetExitNode(ctx context.Context, c Executor, routerIP string) error {
	_, _, err := c.Run(ctx, fmt.Sprintf("sudo tailscale set --exit-node=%s --exit-node-allow-lan-access=true", routerIP))
	if err != nil {
		return fmt.Errorf("set exit-node %s: %w", routerIP, err)
	}
	time.Sleep(2 * time.Second)
	return nil
}

// ClearExitNode removes any exit-node setting from the client, restoring direct
// egress. Best-effort cleanup after a forwarding-pps run.
func ClearExitNode(ctx context.Context, c Executor) error {
	_, _, err := c.Run(ctx, "sudo tailscale set --exit-node=")
	return err
}

// GetTailscaleIP polls for the tailscale IPv4 address, retrying up to 15 times.
func GetTailscaleIP(ctx context.Context, c Executor) (string, error) {
	for range 15 {
		stdout, _, _ := c.Run(ctx, "tailscale ip -4")
		ip := strings.TrimSpace(stdout)
		if strings.HasPrefix(ip, "100.") {
			return ip, nil
		}
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(2 * time.Second):
		}
	}
	return "", fmt.Errorf("no tailscale IP after 15 attempts")
}

// WaitForPeer polls tailscale ping until the peer responds, up to 45 attempts.
func WaitForPeer(ctx context.Context, c Executor, peerIP string) error {
	for range 45 {
		stdout, _, _ := c.Run(ctx, fmt.Sprintf("tailscale ping -c 1 --timeout 5s %s", peerIP))
		if strings.Contains(stdout, "pong") {
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(3 * time.Second):
		}
	}
	return fmt.Errorf("peer %s unreachable after 45 attempts", peerIP)
}

// WaitForDirect polls tailscale ping until a direct (non-DERP) connection is established.
// Returns "direct" or "relayed".
func WaitForDirect(ctx context.Context, c Executor, peerIP string) (string, error) {
	for range 30 {
		stdout, _, _ := c.Run(ctx, fmt.Sprintf("tailscale ping -c 1 %s", peerIP))
		if stdout != "" && !strings.Contains(strings.ToLower(stdout), "derp") {
			return "direct", nil
		}
		select {
		case <-ctx.Done():
			return "relayed", ctx.Err()
		case <-time.After(3 * time.Second):
		}
	}
	return "relayed", nil
}
