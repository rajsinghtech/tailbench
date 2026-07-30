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

// A quota denial must skip the whole family, so the group value has to be one of
// the selectors ListFamilies exposes to --family. On Azure that is not the same
// string as GetInstanceFamily, which stays per size to keep result paths stable.
func TestInstanceFamilyGroupMatchesFamilySelectors(t *testing.T) {
	tests := []struct {
		providerName string
		instanceType string
		want         string
	}{
		// AWS and GCP already derive a group-wide family.
		{"aws", "c7i.4xlarge", "c7i"},
		{"aws", "c6in.32xlarge", "c6in"},
		{"eks", "c8gn.2xlarge", "c8gn"},
		{"gcp", "c3-standard-8", "c3"},
		{"gke", "n2-standard-4", "n2"},
		// Azure drops the vCPU digit but keeps the version suffix.
		{"azure", "Standard_D4s_v5", "dsv5"},
		{"azure", "Standard_D4as_v5", "dasv5"},
		{"azure", "Standard_D2ps_v6", "dpsv6"},
		{"azure", "Standard_D2s_v4", "dsv4"},
		{"azure", "Standard_E8s_v4", "esv4"},
		{"aks", "Standard_F16s_v2", "fsv2"},
		{"aks", "Standard_F4as_v6", "fasv6"},
		{"aks", "Standard_F4als_v6", "falsv6"},
		{"aks", "Standard_F4ams_v6", "famsv6"},
	}
	for _, tt := range tests {
		t.Run(tt.providerName+"/"+tt.instanceType, func(t *testing.T) {
			got := InstanceFamilyGroup(tt.providerName, tt.instanceType)
			if got != tt.want {
				t.Fatalf("InstanceFamilyGroup(%q, %q) = %q, want %q",
					tt.providerName, tt.instanceType, got, tt.want)
			}
			if tt.providerName == "azure" || tt.providerName == "aks" {
				if got == GetInstanceFamily(tt.providerName, tt.instanceType) {
					t.Fatalf("group %q must differ from the per-size result-path family", got)
				}
			}
		})
	}
}

// Different sizes in one Azure family must share a group, or a quota denial on
// one size keeps the run attempting the larger ones.
func TestAzureSizesShareOneQuotaGroup(t *testing.T) {
	small := InstanceFamilyGroup("azure", "Standard_D2s_v4")
	large := InstanceFamilyGroup("azure", "Standard_D64s_v4")
	if small != large {
		t.Fatalf("D2s_v4 group = %q, D64s_v4 group = %q; sizes in one family must share a group", small, large)
	}
}
