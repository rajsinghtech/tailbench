package benchmark

import "strings"

var validModes = map[string]bool{
	"tsnet-userspace": true,
	"l4-kernel":       true,
	"l4-userspace":    true,
	"l4-lb":           true,
	"l7-ingress-h1":   true,
	"l7-ingress-h2":   true,
	"l7-serve-h1":     true,
	"l7-serve-h2":     true,
}

func IsValidMode(mode string) bool {
	return validModes[mode]
}

func ModeAppliesTo(mode, env string) bool {
	switch mode {
	case "l4-lb", "l7-ingress-h1", "l7-ingress-h2":
		return env == "container"
	case "l7-serve-h1", "l7-serve-h2":
		return env == "vm"
	default:
		return true
	}
}

func ModeUsesIperf(mode string) bool {
	return mode == "l4-kernel" || mode == "l4-userspace"
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
