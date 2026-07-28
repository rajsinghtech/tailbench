package failure

import (
	"context"
	"errors"
	"testing"
)

func TestClassifyCommonProviderAndLifecycleFailures(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		stage string
		err   error
		want  Class
	}{
		{name: "interrupted", stage: "benchmark", err: context.Canceled, want: Interruption},
		{name: "readiness timeout", stage: "readiness", err: context.DeadlineExceeded, want: ReadinessTimeout},
		{name: "missing executable", stage: "preflight", err: errors.New("exec: pulumi: executable file not found"), want: MissingExecutable},
		{name: "cli authentication", stage: "preflight", err: errors.New("aws: unable to locate credentials"), want: Authentication},
		{name: "permission", stage: "provision", err: errors.New("AccessDenied: not authorized to perform ec2:RunInstances"), want: PermissionDenied},
		{name: "sku", stage: "provision", err: errors.New("instance type is not available in availability zone"), want: UnavailableSKU},
		{name: "quota", stage: "provision", err: errors.New("QuotaExceeded: vCPU limit exceeded"), want: QuotaExhaustion},
		{name: "pulumi lock", stage: "provision", err: errors.New("the stack is currently locked by another process"), want: StateConflict},
		{name: "result", stage: "aggregation", err: errors.New("write result: permission denied"), want: ResultWrite},
		{name: "cleanup", stage: "cleanup", err: errors.New("destroy stack failed"), want: CleanupFailure},
		{name: "benchmark", stage: "benchmark", err: errors.New("iperf transport reset"), want: BenchmarkTransport},
		{name: "provision fallback", stage: "provision", err: errors.New("stack update failed"), want: ProvisioningFailure},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			if got := Classify(test.stage, test.err); got != test.want {
				t.Fatalf("Classify(%q, %q) = %q, want %q", test.stage, test.err, got, test.want)
			}
		})
	}
}

func TestClassifiedErrorPreservesOriginalCause(t *testing.T) {
	cause := errors.New("provider detail")
	err := Wrap(QuotaExhaustion, "provision", cause)

	if !errors.Is(err, cause) {
		t.Fatal("classified error does not preserve original cause")
	}
	if err.Class != QuotaExhaustion || err.Stage != "provision" {
		t.Fatalf("classified error = %#v", err)
	}
}

func TestIsTransientIsConservative(t *testing.T) {
	for _, err := range []error{
		errors.New("service temporarily unavailable"),
		errors.New("Throttling: rate exceeded"),
		errors.New("connection reset by peer"),
	} {
		if !IsTransient(err) {
			t.Fatalf("%q should be transient", err)
		}
	}
	for _, err := range []error{
		errors.New("permission denied"),
		errors.New("quota exceeded"),
		errors.New("stack is locked"),
		context.Canceled,
	} {
		if IsTransient(err) {
			t.Fatalf("%q should not be transient", err)
		}
	}
}
