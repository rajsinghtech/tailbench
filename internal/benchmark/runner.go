package benchmark

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/rajsinghtech/tailbench/internal/result"
)

// Runner orchestrates the full benchmark sequence over SSH.
type Runner struct {
	Server          Executor
	Client          Executor
	ServerTailscale Executor
	ClientTailscale Executor
	Config          RunConfig
}

// RunConfig holds tuning parameters for the benchmark run.
type RunConfig struct {
	IPerfDuration      int // seconds per iperf run, default 30
	IPerfParallel      int // parallel streams, default 4
	IPerfIterations    int // number of iperf iterations, default 3
	MTRCycles          int // mtr report cycles, default 100
	CooldownSec        int // cooldown between iterations, default 30
	CreditRetrySec     int // retry wait on iperf error (e.g. Azure credits), default 60
	AuthKey            string
	ServerHostname     string
	ClientHostname     string
	SkipTailscaleSetup bool
}

func (c *RunConfig) defaults() {
	if c.IPerfDuration == 0 {
		c.IPerfDuration = 30
	}
	if c.IPerfParallel == 0 {
		c.IPerfParallel = 4
	}
	if c.IPerfIterations == 0 {
		c.IPerfIterations = 3
	}
	if c.MTRCycles == 0 {
		c.MTRCycles = 100
	}
	if c.CooldownSec == 0 {
		c.CooldownSec = 30
	}
	if c.CreditRetrySec == 0 {
		c.CreditRetrySec = 60
	}
}

// RunFull executes the full benchmark: baseline tests over LAN, then tailscale tests over CGNAT.
func (r *Runner) RunFull(ctx context.Context, serverLANIP, clientLANIP string) (*result.BenchmarkResult, error) {
	cfg := r.Config
	cfg.defaults()

	// Verify LAN connectivity
	if err := verifyLAN(ctx, r.Client, serverLANIP); err != nil {
		return nil, fmt.Errorf("LAN verification failed: %w", err)
	}

	// --- Baseline tests ---
	if err := startIPerfServer(ctx, r.Server); err != nil {
		return nil, err
	}

	log.Println("running baseline multi-stream iperf3")
	baselineMulti, err := runIPerfTest(ctx, r.Client, serverLANIP, cfg.IPerfParallel, cfg.IPerfIterations, cfg.IPerfDuration, cfg.CooldownSec, cfg.CreditRetrySec)
	if err != nil {
		return nil, fmt.Errorf("baseline multi-stream: %w", err)
	}

	log.Println("running baseline single-stream iperf3")
	baselineSingle, err := runIPerfTest(ctx, r.Client, serverLANIP, 1, cfg.IPerfIterations, cfg.IPerfDuration, cfg.CooldownSec, cfg.CreditRetrySec)
	if err != nil {
		return nil, fmt.Errorf("baseline single-stream: %w", err)
	}

	log.Println("running baseline MTR")
	baselineMTR, err := runMTR(ctx, r.Client, serverLANIP, cfg.MTRCycles)
	if err != nil {
		log.Printf("warning: baseline MTR failed: %v", err)
	}

	stopIPerfServer(ctx, r.Server)

	// --- Tailscale setup ---
	if !cfg.SkipTailscaleSetup {
		log.Println("bringing up tailscale on server")
		if err := TailscaleUp(ctx, r.ServerTailscale, cfg.AuthKey, cfg.ServerHostname); err != nil {
			return nil, err
		}
		log.Println("bringing up tailscale on client")
		if err := TailscaleUp(ctx, r.ClientTailscale, cfg.AuthKey, cfg.ClientHostname); err != nil {
			return nil, err
		}
	}

	serverTSIP, err := GetTailscaleIP(ctx, r.ServerTailscale)
	if err != nil {
		return nil, fmt.Errorf("server tailscale IP: %w", err)
	}
	clientTSIP, err := GetTailscaleIP(ctx, r.ClientTailscale)
	if err != nil {
		return nil, fmt.Errorf("client tailscale IP: %w", err)
	}
	log.Printf("tailscale IPs: server=%s client=%s", serverTSIP, clientTSIP)

	if err := WaitForPeer(ctx, r.ClientTailscale, serverTSIP); err != nil {
		return nil, err
	}
	connType, err := WaitForDirect(ctx, r.ClientTailscale, serverTSIP)
	if err != nil {
		log.Printf("warning: direct connection check error: %v", err)
	}
	log.Printf("connection type: %s", connType)

	// --- Tailscale tests ---
	if err := startIPerfServer(ctx, r.Server); err != nil {
		return nil, err
	}

	log.Println("running tailscale multi-stream iperf3")
	tsMulti, err := runIPerfTest(ctx, r.Client, serverTSIP, cfg.IPerfParallel, cfg.IPerfIterations, cfg.IPerfDuration, cfg.CooldownSec, cfg.CreditRetrySec)
	if err != nil {
		return nil, fmt.Errorf("tailscale multi-stream: %w", err)
	}

	log.Println("running tailscale single-stream iperf3")
	tsSingle, err := runIPerfTest(ctx, r.Client, serverTSIP, 1, cfg.IPerfIterations, cfg.IPerfDuration, cfg.CooldownSec, cfg.CreditRetrySec)
	if err != nil {
		return nil, fmt.Errorf("tailscale single-stream: %w", err)
	}

	log.Println("running tailscale MTR")
	tsMTR, err := runMTR(ctx, r.Client, serverTSIP, cfg.MTRCycles)
	if err != nil {
		log.Printf("warning: tailscale MTR failed: %v", err)
	}

	stopIPerfServer(ctx, r.Server)

	// --- System config ---
	sysCfg, err := collectSystemConfig(ctx, r.Server)
	if err != nil {
		log.Printf("warning: system config collection error: %v", err)
	}

	// --- Compute summaries ---
	baselineMultiSummary := result.ComputeSummary(baselineMulti)
	tsMultiSummary := result.ComputeSummary(tsMulti)
	baselineSingleSummary := result.ComputeSummary(baselineSingle)
	tsSingleSummary := result.ComputeSummary(tsSingle)

	multiOverhead := &result.Overhead{
		BandwidthPct:   result.ComputeOverhead(baselineMultiSummary.BandwidthMbpsAvg, tsMultiSummary.BandwidthMbpsAvg),
		RetransmitsPct: result.ComputeOverhead(baselineMultiSummary.RetransmitsAvg, tsMultiSummary.RetransmitsAvg),
	}
	singleOverhead := &result.Overhead{
		BandwidthPct:   result.ComputeOverhead(baselineSingleSummary.BandwidthMbpsAvg, tsSingleSummary.BandwidthMbpsAvg),
		RetransmitsPct: result.ComputeOverhead(baselineSingleSummary.RetransmitsAvg, tsSingleSummary.RetransmitsAvg),
	}

	// --- Get tailscale version and kernel for top-level fields ---
	tsVersion := ""
	kernelVersion := ""
	if sysCfg != nil {
		kernelVersion = strings.TrimSpace(sysCfg.KernelFull)
		// Extract short kernel version from uname -a (third field)
		parts := strings.Fields(sysCfg.KernelFull)
		if len(parts) >= 3 {
			kernelVersion = parts[2]
		}
	}
	stdout, _, _ := r.ServerTailscale.Run(ctx, "tailscale version | head -1")
	tsVersion = strings.TrimSpace(stdout)

	return &result.BenchmarkResult{
		TSVersion:      tsVersion,
		KernelVersion:  kernelVersion,
		ConnectionType: connType,
		SystemConfig:   sysCfg,
		TestConfig: &result.TestConfig{
			IPerfDurationSec:     cfg.IPerfDuration,
			IPerfParallelStreams: cfg.IPerfParallel,
			IPerfIterations:      cfg.IPerfIterations,
			MTRCycles:            cfg.MTRCycles,
		},
		BaselineTCP:        &result.TCPResult{Runs: baselineMulti, Summary: baselineMultiSummary},
		TailscaleTCP:       &result.TCPResult{Runs: tsMulti, Summary: tsMultiSummary},
		Overhead:           multiOverhead,
		BaselineTCPSingle:  &result.TCPResult{Runs: baselineSingle, Summary: baselineSingleSummary},
		TailscaleTCPSingle: &result.TCPResult{Runs: tsSingle, Summary: tsSingleSummary},
		OverheadSingle:     singleOverhead,
		BaselineMTR:        baselineMTR,
		TailscaleMTR:       tsMTR,
	}, nil
}

// verifyLAN checks that the client can reach the server over LAN.
func verifyLAN(ctx context.Context, c Executor, targetIP string) error {
	for attempt := range 20 {
		_, _, err := c.Run(ctx, fmt.Sprintf("ping -c 1 -W 2 %s", targetIP))
		if err == nil {
			return nil
		}
		log.Printf("LAN check attempt %d/20 failed: %v", attempt+1, err)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(3 * time.Second):
		}
	}
	return fmt.Errorf("cannot reach %s after 20 attempts", targetIP)
}

// startIPerfServer kills any existing iperf3 and starts a fresh server on IPerfPort.
func startIPerfServer(ctx context.Context, server Executor) error {
	_, _, _ = server.Run(ctx, "sudo pkill -9 iperf3 || true")
	time.Sleep(1 * time.Second)

	_, _, err := server.Run(ctx, fmt.Sprintf("iperf3 -s -p %d -D", IPerfPort))
	if err != nil {
		return fmt.Errorf("starting iperf3 server: %w", err)
	}
	time.Sleep(1 * time.Second)

	stdout, _, err := server.Run(ctx, fmt.Sprintf("ss -tlnp | grep :%d", IPerfPort))
	if err != nil || !strings.Contains(stdout, strconv.Itoa(IPerfPort)) {
		return fmt.Errorf("iperf3 server not listening on port %d", IPerfPort)
	}
	return nil
}

// stopIPerfServer kills iperf3 on the server.
func stopIPerfServer(ctx context.Context, server Executor) {
	_, _, _ = server.Run(ctx, "sudo pkill -9 iperf3 || true")
}

// runIPerfTest runs iperf3 for the given number of iterations with cooldown and retry on error.
func runIPerfTest(ctx context.Context, c Executor, targetIP string, parallel, iterations, duration, cooldownSec, creditRetrySec int) ([]result.IPerfRun, error) {
	var runs []result.IPerfRun
	for i := range iterations {
		if i > 0 {
			log.Printf("cooldown %ds before iteration %d", cooldownSec, i+1)
			select {
			case <-ctx.Done():
				return runs, ctx.Err()
			case <-time.After(time.Duration(cooldownSec) * time.Second):
			}
		}

		cmd := fmt.Sprintf("iperf3 -c %s -p %d -P %d -t %d -J", targetIP, IPerfPort, parallel, duration)
		log.Printf("iperf3 iteration %d/%d: %s", i+1, iterations, cmd)

		var run *result.IPerfRun
		for retries := 0; retries < 3; retries++ {
			stdout, _, err := c.Run(ctx, cmd)
			if err != nil {
				log.Printf("iperf3 run error: %v, retrying after %ds", err, creditRetrySec)
				select {
				case <-ctx.Done():
					return runs, ctx.Err()
				case <-time.After(time.Duration(creditRetrySec) * time.Second):
				}
				continue
			}

			if iperfErr := IPerfError([]byte(stdout)); iperfErr != nil {
				log.Printf("iperf3 reported error: %v, retrying after %ds", iperfErr, creditRetrySec)
				select {
				case <-ctx.Done():
					return runs, ctx.Err()
				case <-time.After(time.Duration(creditRetrySec) * time.Second):
				}
				continue
			}

			parsed, err := ParseIPerfJSON([]byte(stdout))
			if err != nil {
				log.Printf("iperf3 parse error: %v, retrying after %ds", err, creditRetrySec)
				select {
				case <-ctx.Done():
					return runs, ctx.Err()
				case <-time.After(time.Duration(creditRetrySec) * time.Second):
				}
				continue
			}
			run = parsed
			break
		}
		if run == nil {
			return runs, fmt.Errorf("iperf3 failed after 3 retries on iteration %d", i+1)
		}
		log.Printf("iteration %d: %.1f Mbps, %d retransmits", i+1, run.BandwidthMbps, run.Retransmits)
		runs = append(runs, *run)
	}
	return runs, nil
}

// runMTR executes mtr and parses the output.
func runMTR(ctx context.Context, c Executor, targetIP string, cycles int) (*result.MTRResult, error) {
	cmd := fmt.Sprintf("mtr --report --report-cycles %d --no-dns %s", cycles, targetIP)
	stdout, _, err := c.Run(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("mtr: %w", err)
	}
	return ParseMTR(stdout, targetIP)
}

// collectSystemConfig gathers system and network configuration from the server.
func collectSystemConfig(ctx context.Context, server Executor) (*result.SystemConfig, error) {
	cfg := &result.SystemConfig{}

	// Kernel info
	if stdout, _, err := server.Run(ctx, "uname -r"); err == nil {
		cfg.KernelFull = strings.TrimSpace(stdout)
	}
	if stdout, _, err := server.Run(ctx, "uname -a"); err == nil {
		cfg.KernelFull = strings.TrimSpace(stdout)
	}

	// TCP settings
	if stdout, _, err := server.Run(ctx, "sysctl -n net.ipv4.tcp_congestion_control"); err == nil {
		cfg.TCPCongestionControl = strings.TrimSpace(stdout)
	}

	// CPU governor
	if stdout, _, err := server.Run(ctx, "cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor"); err == nil {
		cfg.CPUGovernor = strings.TrimSpace(stdout)
	}

	// Detect primary network interface
	netdev := "eth0"
	if stdout, _, err := server.Run(ctx, "ip route show default | awk '{print $5}' | head -1"); err == nil {
		if d := strings.TrimSpace(stdout); d != "" {
			netdev = d
		}
	}

	// GRO UDP forwarding
	if stdout, _, err := server.Run(ctx, fmt.Sprintf("ethtool -k %s | grep rx-udp-gro-forwarding | awk '{print $2}'", netdev)); err == nil {
		cfg.GROUDPForwarding = strings.TrimSpace(stdout) == "on"
	}

	// MTU underlay
	if stdout, _, err := server.Run(ctx, fmt.Sprintf("ip -o link show %s | grep -oP 'mtu \\K[0-9]+'", netdev)); err == nil {
		if v, err := strconv.Atoi(strings.TrimSpace(stdout)); err == nil {
			cfg.MTUUnderlay = v
		}
	}

	// MTU tailscale
	if stdout, _, err := server.Run(ctx, "ip -o link show tailscale0 | grep -oP 'mtu \\K[0-9]+'"); err == nil {
		if v, err := strconv.Atoi(strings.TrimSpace(stdout)); err == nil {
			cfg.MTUTailscale = v
		}
	}

	// TCP buffer sizes
	if stdout, _, err := server.Run(ctx, "sysctl -n net.ipv4.tcp_rmem"); err == nil {
		cfg.TCPRmem = strings.TrimSpace(stdout)
	}
	if stdout, _, err := server.Run(ctx, "sysctl -n net.ipv4.tcp_wmem"); err == nil {
		cfg.TCPWmem = strings.TrimSpace(stdout)
	}

	// Container runtime detection
	if stdout, _, err := server.Run(ctx, "cat /proc/1/cgroup 2>/dev/null | head -5"); err == nil {
		cgroup := strings.TrimSpace(stdout)
		switch {
		case strings.Contains(cgroup, "containerd"):
			cfg.ContainerRuntime = "containerd"
		case strings.Contains(cgroup, "cri-o"):
			cfg.ContainerRuntime = "cri-o"
		case strings.Contains(cgroup, "docker"):
			cfg.ContainerRuntime = "docker"
		}
	}

	return cfg, nil
}
