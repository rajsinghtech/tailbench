package benchmark

import "strings"

var validModes = map[string]bool{
	"tsnet-userspace":  true,
	"l4-kernel":        true,
	"l4-userspace":     true,
	"l4-lb":            true,
	"l7-ingress-h1":    true,
	"l7-ingress-h2":    true,
	"l7-serve-h1":      true,
	"l7-serve-h2":      true,
	"forward-pps-exit": true,

	// K8s ProxyGroup forwarding A/B: baseline vs
	// TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS.
	"forward-pps-exit-k8s":       true,
	"forward-pps-exit-k8s-opton": true,

	// 3-node peer-relay benchmark: direct vs peer-relay vs DERP.
	"relay-throughput": true,
}

func IsValidMode(mode string) bool {
	return validModes[mode]
}

func ModeAppliesTo(mode, env string) bool {
	switch mode {
	case "l4-lb", "l7-ingress-h1", "l7-ingress-h2",
		"forward-pps-exit-k8s", "forward-pps-exit-k8s-opton":
		return env == "container"
	case "l7-serve-h1", "l7-serve-h2", "forward-pps-exit", "relay-throughput":
		return env == "vm"
	default:
		return true
	}
}

func ModeUsesIperf(mode string) bool {
	return mode == "l4-kernel" || mode == "l4-userspace"
}

// ModeUsesForwardPPS reports whether the mode measures usable forwarding pps
// through a router node (e.g. an exit node) or a K8s ProxyGroup, rather than
// endpoint-to-endpoint.
func ModeUsesForwardPPS(mode string) bool {
	return strings.HasPrefix(mode, "forward-pps-")
}

// ModeUsesRelay reports whether the mode measures peer-relay throughput,
// usable pps, and latency across the direct/peer-relay/DERP connection
// states.
func ModeUsesRelay(mode string) bool {
	return mode == "relay-throughput"
}

func ModeUsesFortio(mode string) bool {
	return mode == "l4-lb" || strings.HasPrefix(mode, "l7-")
}

func ModeUsesTsnet(mode string) bool {
	return mode == "tsnet-userspace"
}

func ModeIsH2(mode string) bool {
	return strings.HasSuffix(mode, "-h2")
}

func ModeHTTPVersion(mode string) string {
	if ModeIsH2(mode) {
		return "2"
	}
	if strings.HasSuffix(mode, "-h1") {
		return "1.1"
	}
	return ""
}
