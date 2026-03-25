package logger

import (
	"fmt"
	"io"
	"log"
	"strings"
)

// Logger provides structured, provider-scoped logging.
// All output is prefixed with the provider name and formatted uniformly.
type Logger struct {
	prefix string
}

func New(provider string) *Logger {
	return &Logger{prefix: fmt.Sprintf("[%-5s]", provider)}
}

func (l *Logger) Infof(format string, args ...any) {
	log.Printf("%s %s", l.prefix, fmt.Sprintf(format, args...))
}

func (l *Logger) Warnf(format string, args ...any) {
	log.Printf("%s WARN  %s", l.prefix, fmt.Sprintf(format, args...))
}

func (l *Logger) Errf(format string, args ...any) {
	log.Printf("%s ERROR %s", l.prefix, fmt.Sprintf(format, args...))
}

// Step logs a high-level phase transition (e.g. "networking", "benchmark").
func (l *Logger) Step(phase, detail string) {
	log.Printf("%s %-12s %s", l.prefix, phase, detail)
}

// Result logs a benchmark result line.
func (l *Logger) Result(label string, bwMbps float64, retransmits int) {
	log.Printf("%s   %-28s %8.1f Mbps  %d retransmits", l.prefix, label, bwMbps, retransmits)
}

// Writer returns an io.Writer that filters Pulumi progress noise.
// Only lines containing actual status changes are passed through.
func (l *Logger) Writer() io.Writer {
	return &pulumiWriter{prefix: l.prefix}
}

type pulumiWriter struct {
	prefix string
	buf    []byte
}

func (w *pulumiWriter) Write(p []byte) (int, error) {
	w.buf = append(w.buf, p...)
	for {
		idx := strings.IndexByte(string(w.buf), '\n')
		if idx < 0 {
			break
		}
		line := string(w.buf[:idx])
		w.buf = w.buf[idx+1:]

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// Skip Pulumi progress dots and spinner lines
		if isNoisy(line) {
			continue
		}
		// Pass through resource status and diagnostics
		log.Printf("%s pulumi: %s", w.prefix, line)
	}
	return len(p), nil
}

func isNoisy(line string) bool {
	trimmed := strings.TrimLeft(line, ".@")
	trimmed = strings.TrimSpace(trimmed)
	// Pure dots or @ spinner lines
	if trimmed == "" || strings.HasPrefix(trimmed, "updating") || strings.HasPrefix(trimmed, "destroying") {
		return true
	}
	// "Downloading provider" lines
	if strings.HasPrefix(trimmed, "Downloading") {
		return true
	}
	return false
}
