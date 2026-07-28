//go:build aws && !k8s && !azure && !gcp

package provider

import "testing"

func TestAWSRunScopedStackNamesIncludeRunSuffix(t *testing.T) {
	p := &AWSProvider{RunID: "tb_2026-07-24_ab12cd"}

	if got, want := p.networkStackName(), "tailbench-aws-networking-ab12cd"; got != want {
		t.Fatalf("network stack = %q, want %q", got, want)
	}
	if got, want := p.pairStackName("c7i.large"), "tailbench-aws-c7i-large-ab12cd"; got != want {
		t.Fatalf("pair stack = %q, want %q", got, want)
	}
	if !p.RunScopedResources() {
		t.Fatal("AWS provider did not declare run-scoped resources")
	}
}

func TestRunSuffixRejectsUnsafeCharacters(t *testing.T) {
	if got, want := runSuffix("tb_2026-07-24_AB/12!?"), "ab-12"; got != want {
		t.Fatalf("run suffix = %q, want %q", got, want)
	}
}

func TestScopedNamePreservesLegacyNameAndUsesSafeRunSuffix(t *testing.T) {
	if got := scopedName("tailbench-resource", ""); got != "tailbench-resource" {
		t.Fatalf("legacy scoped name = %q", got)
	}
	if got := scopedName("tailbench-resource", "tb_2026-07-24_Ab12/CD"); got != "tailbench-resource-ab12-cd" {
		t.Fatalf("scoped name = %q", got)
	}
}
