package app

import (
	"io"
	"regexp"
	"strings"
)

const maxRenderedCauseBytes = 2048

var secretPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)\bbearer\s+[^\s,;]+`),
	regexp.MustCompile(`(?i)\b(authorization|auth[_-]?key|access[_-]?token|oauth[_-]?client[_-]?secret|client[_-]?secret|password|secret|token)(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)`),
	regexp.MustCompile(`\btskey-[A-Za-z0-9_-]+\b`),
	regexp.MustCompile(`\bAKIA[A-Z0-9]{16}\b`),
}

type redactingWriter struct {
	dst io.Writer
}

// RedactingWriter returns a writer that removes the command boundary's known
// credential patterns. It is used for durable per-run logs as well as stderr.
func RedactingWriter(dst io.Writer) io.Writer {
	return redactingWriter{dst: dst}
}

func (w redactingWriter) Write(p []byte) (int, error) {
	if w.dst == nil {
		return len(p), nil
	}
	safe := sanitize(string(p), 0)
	if _, err := io.WriteString(w.dst, safe); err != nil {
		return 0, err
	}
	return len(p), nil
}

func sanitize(value string, limit int) string {
	safe := value
	for index, pattern := range secretPatterns {
		if index == 1 {
			safe = pattern.ReplaceAllString(safe, `${1}${2}[REDACTED]`)
			continue
		}
		safe = pattern.ReplaceAllString(safe, "[REDACTED]")
	}
	if limit > 0 && len(safe) > limit {
		safe = strings.TrimSpace(safe[:limit]) + " … [truncated]"
	}
	return safe
}
