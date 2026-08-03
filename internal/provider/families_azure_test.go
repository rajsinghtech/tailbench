//go:build azure && !aws && !gcp

package provider

import "testing"

// The quota-skip group must be a value ListFamilies actually offers as a
// --family selector. This lives in a tagged file because listAzureFamilies only
// compiles into the Azure variants.
func TestAzureQuotaGroupsAreRealFamilySelectors(t *testing.T) {
	selectors := map[string]bool{}
	for _, name := range listAzureFamilies() {
		selectors[name] = true
	}

	// One representative SKU per shipped family.
	skus := []string{
		"Standard_D4s_v5",
		"Standard_D4as_v5",
		"Standard_D2ps_v6",
		"Standard_D2s_v4",
		"Standard_F16s_v2",
		"Standard_F4as_v6",
		"Standard_F4als_v6",
		"Standard_F4ams_v6",
		"Standard_E8s_v4",
	}
	for _, sku := range skus {
		t.Run(sku, func(t *testing.T) {
			group := InstanceFamilyGroup("azure", sku)
			if !selectors[group] {
				t.Fatalf("InstanceFamilyGroup(%q) = %q, which ListFamilies never offers (%v)",
					sku, group, listAzureFamilies())
			}
		})
	}
}
