package benchmark

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/rajsinghtech/tailbench/internal/result"
)

// RelayUDPPort is the fixed UDP port the peer-relay router advertises via
// `tailscale set --relay-server-port`. Not user-configurable: provider
// firewall rules (internal/provider/{gcp,aws,azure}.go) open this exact
// port, so changing it here requires updating all three.
const RelayUDPPort = 41642

var pingLatencyRe = regexp.MustCompile(`in ([0-9.]+)ms`)

// parsePingPath extracts the connection path from one `tailscale ping -c 1`
// invocation's stdout. Tailscale documents three shapes: "pong ... via
// DERP(region) in Xms", "pong ... via peer-relay(ip:port:vni) in Xms", and a
// bare "pong ... via <ip>:<port> in Xms" for direct. ok is false when no pong
// line is present yet (e.g. "direct connection not established" alone).
func parsePingPath(stdout string) (path string, ok bool) {
	lower := strings.ToLower(stdout)
	switch {
	case strings.Contains(lower, "via peer-relay("):
		return "peer-relay", true
	case strings.Contains(lower, "via derp("):
		return "derp", true
	case strings.Contains(stdout, "pong"):
		return "direct", true
	default:
		return "", false
	}
}

// PathVia polls `tailscale ping` until the active path to peerIP is
// determined, returning "direct", "peer-relay", or "derp". This is the
// honesty check for the relay-throughput benchmark: a state must be
// confirmed here before any measurement against it is recorded.
func PathVia(ctx context.Context, c Executor, peerIP string) (string, error) {
	for range 20 {
		stdout, _, _ := c.Run(ctx, fmt.Sprintf("tailscale ping -c 1 --timeout 5s %s", peerIP))
		if path, ok := parsePingPath(stdout); ok {
			return path, nil
		}
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(3 * time.Second):
		}
	}
	return "", fmt.Errorf("could not determine path to %s after 20 attempts", peerIP)
}

// parsePingLatencyMs extracts the round-trip latency from one `tailscale
// ping` invocation's stdout (e.g. "... in 4ms"). ok is false when no
// latency was found (e.g. the ping failed outright).
func parsePingLatencyMs(stdout string) (ms float64, ok bool) {
	m := pingLatencyRe.FindStringSubmatch(stdout)
	if m == nil {
		return 0, false
	}
	v, err := strconv.ParseFloat(m[1], 64)
	if err != nil {
		return 0, false
	}
	return v, true
}

// pingLatencyMs averages the round-trip latency to peerIP over n pings.
func pingLatencyMs(ctx context.Context, c Executor, peerIP string, n int) (float64, error) {
	var sum float64
	var count int
	for range n {
		stdout, _, err := c.Run(ctx, fmt.Sprintf("tailscale ping -c 1 --timeout 5s %s", peerIP))
		if err != nil {
			continue
		}
		if ms, ok := parsePingLatencyMs(stdout); ok {
			sum += ms
			count++
		}
	}
	if count == 0 {
		return 0, fmt.Errorf("no successful pings to %s", peerIP)
	}
	return sum / float64(count), nil
}

// BlockDirect drops inbound UDP on Tailscale's WireGuard listen port (41641),
// forcing the peer to fail over to a peer relay (if configured and
// reachable) or DERP. Idempotent: safe to call even if already blocked.
func BlockDirect(ctx context.Context, c Executor) error {
	_, _, err := c.Run(ctx, "sudo iptables -C INPUT -p udp --dport 41641 -j DROP 2>/dev/null || sudo iptables -I INPUT -p udp --dport 41641 -j DROP")
	return err
}

// UnblockDirect removes the direct-path block installed by BlockDirect.
// Best-effort: the rule may already be absent.
func UnblockDirect(ctx context.Context, c Executor) error {
	_, _, err := c.Run(ctx, "sudo iptables -D INPUT -p udp --dport 41641 -j DROP 2>/dev/null || true")
	return err
}

// BlockRelayPort drops inbound UDP on the relay node's configured
// --relay-server-port, making the peer relay unreachable so a subsequent
// PathVia assertion can confirm fallback to DERP.
func BlockRelayPort(ctx context.Context, relay Executor, port int) error {
	cmd := fmt.Sprintf("sudo iptables -C INPUT -p udp --dport %d -j DROP 2>/dev/null || sudo iptables -I INPUT -p udp --dport %d -j DROP", port, port)
	_, _, err := relay.Run(ctx, cmd)
	return err
}

// UnblockRelayPort removes the relay-port block installed by BlockRelayPort.
func UnblockRelayPort(ctx context.Context, relay Executor, port int) error {
	cmd := fmt.Sprintf("sudo iptables -D INPUT -p udp --dport %d -j DROP 2>/dev/null || true", port)
	_, _, err := relay.Run(ctx, cmd)
	return err
}

// RunRelayPath asserts that the confirmed path between client and serverTSIP
// is wantPath, then measures throughput, usable pps, and latency for that
// state. It returns an error — and records nothing — if the confirmed path
// doesn't match wantPath, so a misconfigured block never mislabels a result.
func (r *Runner) RunRelayPath(ctx context.Context, client, server Executor, serverTSIP, wantPath string) (*result.RelayPathResult, error) {
	cfg := r.Config
	cfg.defaults()

	path, err := PathVia(ctx, client, serverTSIP)
	if err != nil {
		return nil, fmt.Errorf("path assertion: %w", err)
	}
	if path != wantPath {
		return nil, fmt.Errorf("expected path %q, got %q — not recording (honesty rule)", wantPath, path)
	}
	r.Log.Infof("relay: confirmed %s path to %s", path, serverTSIP)

	latencyMs, err := pingLatencyMs(ctx, client, serverTSIP, 5)
	if err != nil {
		r.Log.Warnf("relay latency (%s): %v", path, err)
	}

	if err := startIPerfServer(ctx, server); err != nil {
		return nil, fmt.Errorf("starting iperf3 server (%s): %w", path, err)
	}
	defer stopIPerfServer(ctx, server)

	runs, err := r.runIPerfTest(ctx, client, serverTSIP, cfg.IPerfParallel, cfg.IPerfIterations, cfg.IPerfDuration, cfg.CooldownSec, cfg.CreditRetrySec)
	if err != nil {
		return nil, fmt.Errorf("throughput (%s): %w", path, err)
	}
	summary := result.ComputeSummary(runs)

	pps := &result.PPSResult{LossThresholdPct: cfg.PPSLossThresholdPct}
	for _, dgram := range cfg.PPSDatagramSizes {
		size, err := r.runUDPSweep(ctx, client, serverTSIP, dgram, cfg)
		if err != nil {
			return nil, fmt.Errorf("pps sweep (%s, %dB): %w", path, dgram, err)
		}
		size.Label = ppsSizeLabel(dgram, cfg.PPSDatagramSizes)
		pps.Sizes = append(pps.Sizes, size)
	}

	return &result.RelayPathResult{
		Path:           path,
		ThroughputMbps: summary.BandwidthMbpsAvg,
		LatencyMs:      latencyMs,
		PPS:            pps,
	}, nil
}
