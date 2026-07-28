// Package failure defines the provider-independent failure vocabulary written
// to run manifests and final summaries.
package failure

import (
	"context"
	"errors"
	"fmt"
	"strings"
)

type Class string

const (
	InvalidConfiguration Class = "invalid-configuration"
	MissingExecutable    Class = "missing-executable"
	Authentication       Class = "cli-authentication"
	PermissionDenied     Class = "permission-denied"
	UnavailableSKU       Class = "unavailable-sku-or-region"
	QuotaExhaustion      Class = "quota-exhaustion"
	StateConflict        Class = "pulumi-state-or-lock-conflict"
	ProvisioningFailure  Class = "provisioning-failure"
	ReadinessTimeout     Class = "readiness-timeout"
	BenchmarkTransport   Class = "benchmark-or-transport-failure"
	ResultWrite          Class = "result-write-or-aggregation-failure"
	CleanupFailure       Class = "cleanup-failure"
	Interruption         Class = "interruption-or-cancellation"
	Unknown              Class = "unknown"
)

type ClassifiedError struct {
	Class Class
	Stage string
	Cause error
}

func Wrap(class Class, stage string, cause error) *ClassifiedError {
	return &ClassifiedError{Class: class, Stage: stage, Cause: cause}
}

func (e *ClassifiedError) Error() string {
	if e == nil {
		return ""
	}
	if e.Cause == nil {
		return fmt.Sprintf("%s failed (%s)", e.Stage, e.Class)
	}
	return fmt.Sprintf("%s failed (%s): %v", e.Stage, e.Class, e.Cause)
}

func (e *ClassifiedError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}

func Classify(stage string, err error) Class {
	stage = strings.ToLower(strings.TrimSpace(stage))
	if err == nil {
		return Unknown
	}
	if errors.Is(err, context.Canceled) {
		return Interruption
	}
	if errors.Is(err, context.DeadlineExceeded) {
		if strings.Contains(stage, "read") || strings.Contains(stage, "ready") {
			return ReadinessTimeout
		}
		return Interruption
	}
	if strings.Contains(stage, "cleanup") ||
		strings.Contains(stage, "destroy") ||
		strings.Contains(stage, "teardown") {
		return CleanupFailure
	}
	if strings.Contains(stage, "result") ||
		strings.Contains(stage, "aggregat") ||
		strings.Contains(stage, "logging") {
		return ResultWrite
	}

	message := strings.ToLower(err.Error())
	switch {
	case containsAny(message, "executable file not found", "command not found", "not found in $path"):
		return MissingExecutable
	case containsAny(
		message,
		"unable to locate credentials",
		"not logged in",
		"login required",
		"authentication failed",
		"invalid credential",
		"expired token",
	):
		return Authentication
	case containsAny(
		message,
		"quotaexceeded",
		"quota exceeded",
		"quota exhaustion",
		"vcpu limit",
		"resource limit exceeded",
	):
		return QuotaExhaustion
	case containsAny(
		message,
		"accessdenied",
		"permission denied",
		"not authorized",
		"forbidden",
		"authorizationfailed",
	):
		return PermissionDenied
	case containsAny(
		message,
		"not available in",
		"unavailable in",
		"unsupported instance type",
		"sku is not available",
		"invalid zone",
		"invalid region",
	):
		return UnavailableSKU
	case containsAny(
		message,
		"currently locked",
		"stack is locked",
		"state lock",
		"concurrent update",
		"another update is currently in progress",
	):
		return StateConflict
	}

	switch {
	case strings.Contains(stage, "config") || strings.Contains(stage, "argument"):
		return InvalidConfiguration
	case strings.Contains(stage, "preflight") || strings.Contains(stage, "auth"):
		return Authentication
	case strings.Contains(stage, "readiness") || strings.Contains(stage, "ready"):
		return ReadinessTimeout
	case strings.Contains(stage, "benchmark") || strings.Contains(stage, "transport"):
		return BenchmarkTransport
	case strings.Contains(stage, "provision") || strings.Contains(stage, "network") || strings.Contains(stage, "setup"):
		return ProvisioningFailure
	default:
		return Unknown
	}
}

func containsAny(value string, candidates ...string) bool {
	for _, candidate := range candidates {
		if strings.Contains(value, candidate) {
			return true
		}
	}
	return false
}

// IsTransient intentionally recognizes only transport/service conditions that
// are safe candidates for retry after the caller separately proves the
// operation idempotent.
func IsTransient(err error) bool {
	if err == nil ||
		errors.Is(err, context.Canceled) ||
		errors.Is(err, context.DeadlineExceeded) {
		return false
	}
	message := strings.ToLower(err.Error())
	if containsAny(
		message,
		"permission denied",
		"accessdenied",
		"not authorized",
		"quota",
		"currently locked",
		"stack is locked",
		"state lock",
	) {
		return false
	}
	return containsAny(
		message,
		"temporarily unavailable",
		"service unavailable",
		"throttling",
		"rate exceeded",
		"too many requests",
		"connection reset",
		"connection refused",
		"unexpected eof",
	)
}
