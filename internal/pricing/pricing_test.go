package pricing

import "testing"

func TestLookup(t *testing.T) {
	tests := []struct {
		name         string
		provider     string
		region       string
		instanceType string
		wantOK       bool
	}{
		{"aws direct", "aws", "us-west-2", "c6in.xlarge", true},
		{"gcp direct", "gcp", "us-central1", "c3-standard-4", true},
		{"azure direct", "azure", "eastus", "Standard_D4s_v4", true},
		{"eks aliases to aws", "eks", "us-west-2", "c6in.xlarge", true},
		{"gke aliases to gcp", "gke", "us-central1", "c3-standard-4", true},
		{"aks aliases to azure", "aks", "eastus", "Standard_D4s_v4", true},
		{"gcp zone normalizes to region", "gcp", "us-central1-a", "c3-standard-4", true},
		{"uncurated region falls back to canonical", "aws", "eu-west-1", "c6in.xlarge", true},
		{"unknown type", "aws", "us-west-2", "does.not.exist", false},
		{"unknown provider", "digitalocean", "nyc1", "s-1vcpu", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			price, ok := Lookup(tt.provider, tt.region, tt.instanceType)
			if ok != tt.wantOK {
				t.Fatalf("Lookup(%q,%q,%q) ok=%v, want %v", tt.provider, tt.region, tt.instanceType, ok, tt.wantOK)
			}
			if ok && price <= 0 {
				t.Errorf("Lookup(%q,%q,%q) returned non-positive price %v", tt.provider, tt.region, tt.instanceType, price)
			}
		})
	}
}

func TestLookupPriceValue(t *testing.T) {
	price, ok := Lookup("aws", "us-west-2", "c6in.xlarge")
	if !ok {
		t.Fatal("expected c6in.xlarge to be priced")
	}
	if price != 0.2268 {
		t.Errorf("c6in.xlarge price = %v, want 0.2268", price)
	}
}

func TestSource(t *testing.T) {
	if Source().Updated == "" {
		t.Error("expected _meta.updated to be populated")
	}
}
