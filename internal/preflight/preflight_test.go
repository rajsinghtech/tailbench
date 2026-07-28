package preflight

import (
	"bytes"
	"context"
	"errors"
	"strings"
	"testing"
)

type fakeFinder map[string]bool

func (f fakeFinder) Find(name string) (string, error) {
	if f[name] {
		return "/test/bin/" + name, nil
	}
	return "", errors.New("not found")
}

type countingRemote struct {
	calls int
}

func (r *countingRemote) Check(context.Context, string) ([]Check, error) {
	r.calls++
	return []Check{{Name: "cloud-auth", Status: StatusPassed, Detail: "identity verified"}}, nil
}

func TestDoctorLocalChecksToolsWithoutCallingRemote(t *testing.T) {
	t.Parallel()

	remote := &countingRemote{}
	report := Doctor(context.Background(), Request{
		Provider:      "eks",
		Workload:      "kubernetes",
		Finder:        fakeFinder{"pulumi": true, "aws": true, "kubectl": false, "helm": false},
		Remote:        false,
		RemoteChecker: remote,
	})

	if remote.calls != 0 {
		t.Fatalf("remote calls = %d, want 0", remote.calls)
	}
	if report.Ready {
		t.Fatal("doctor ready = true with missing kubectl and helm")
	}
	for _, name := range []string{"pulumi", "aws", "kubectl", "helm"} {
		if _, ok := report.CheckNamed(name); !ok {
			t.Fatalf("doctor report missing %q check: %#v", name, report.Checks)
		}
	}
	var text bytes.Buffer
	if err := report.WriteText(&text); err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"LOCAL CHECKS ONLY", "kubectl", "install"} {
		if !strings.Contains(text.String(), want) {
			t.Fatalf("doctor text = %q, want %q", text.String(), want)
		}
	}
}

func TestDoctorRemoteIsExplicit(t *testing.T) {
	t.Parallel()

	remote := &countingRemote{}
	report := Doctor(context.Background(), Request{
		Provider:      "aws",
		Workload:      "vm",
		Finder:        fakeFinder{"pulumi": true, "aws": true},
		Remote:        true,
		RemoteChecker: remote,
	})

	if remote.calls != 1 {
		t.Fatalf("remote calls = %d, want 1", remote.calls)
	}
	if !report.Remote {
		t.Fatal("doctor report did not label remote checks")
	}
	check, ok := report.CheckNamed("cloud-auth")
	if !ok || check.Status != StatusPassed {
		t.Fatalf("remote check = %#v, found=%t", check, ok)
	}
}
