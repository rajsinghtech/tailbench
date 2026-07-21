package provider

import "testing"

func TestSharedFamilyHelpers(t *testing.T) {
	tests := []struct {
		providerName string
		instanceType string
		want         string
	}{
		{"aws", "c7i.4xlarge", "c7i"},
		{"eks", "c8gn.2xlarge", "c8gn"},
		{"azure", "Standard_D4s_v5", "d4sv5"},
		{"aks", "Standard_F16s_v2", "f16sv2"},
		{"gcp", "c3-standard-8", "c3"},
		{"gke", "n2-standard-4", "n2"},
	}
	for _, tt := range tests {
		t.Run(tt.providerName, func(t *testing.T) {
			if got := GetInstanceFamily(tt.providerName, tt.instanceType); got != tt.want {
				t.Fatalf("GetInstanceFamily(%q, %q) = %q, want %q", tt.providerName, tt.instanceType, got, tt.want)
			}
		})
	}
}
