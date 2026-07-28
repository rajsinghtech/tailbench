package provider

import (
	"strings"
	"unicode"
)

func runSuffix(runID string) string {
	value := runID
	if index := strings.LastIndex(value, "_"); index >= 0 && index+1 < len(value) {
		value = value[index+1:]
	}
	value = strings.ToLower(value)
	var safe strings.Builder
	previousDash := false
	for _, char := range value {
		if unicode.IsLetter(char) || unicode.IsDigit(char) {
			safe.WriteRune(char)
			previousDash = false
			continue
		}
		if !previousDash {
			safe.WriteByte('-')
			previousDash = true
		}
	}
	return strings.Trim(safe.String(), "-")
}

func scopedName(base, runID string) string {
	suffix := runSuffix(runID)
	if suffix == "" {
		return base
	}
	return base + "-" + suffix
}
