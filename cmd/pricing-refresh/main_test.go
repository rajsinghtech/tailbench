package main

import (
	"strings"
	"testing"
)

// sampleBulk mimics the AWS Price List Bulk format: a top-level object with
// scalar metadata, then "products" (SKU -> attributes), then "terms.OnDemand"
// (SKU -> term -> priceDimensions). It includes rows that must be filtered out
// (Windows, dedicated tenancy, wrong region, a non-wanted type) to exercise the
// matching logic.
const sampleBulk = `{
  "formatVersion": "v1.0",
  "disclaimer": "ignore me",
  "products": {
    "SKU_LINUX": {"productFamily":"Compute Instance","attributes":{"instanceType":"c6in.xlarge","operatingSystem":"Linux","tenancy":"Shared","preInstalledSw":"NA","capacitystatus":"Used","regionCode":"us-west-2"}},
    "SKU_WINDOWS": {"productFamily":"Compute Instance","attributes":{"instanceType":"c6in.xlarge","operatingSystem":"Windows","tenancy":"Shared","preInstalledSw":"NA","capacitystatus":"Used","regionCode":"us-west-2"}},
    "SKU_DEDICATED": {"productFamily":"Compute Instance","attributes":{"instanceType":"c6in.xlarge","operatingSystem":"Linux","tenancy":"Dedicated","preInstalledSw":"NA","capacitystatus":"Used","regionCode":"us-west-2"}},
    "SKU_OTHERREGION": {"productFamily":"Compute Instance","attributes":{"instanceType":"c6in.xlarge","operatingSystem":"Linux","tenancy":"Shared","preInstalledSw":"NA","capacitystatus":"Used","regionCode":"us-east-1"}},
    "SKU_NOTWANTED": {"productFamily":"Compute Instance","attributes":{"instanceType":"m5.large","operatingSystem":"Linux","tenancy":"Shared","preInstalledSw":"NA","capacitystatus":"Used","regionCode":"us-west-2"}}
  },
  "terms": {
    "OnDemand": {
      "SKU_LINUX": {"SKU_LINUX.JRTCKXETXF": {"priceDimensions": {"SKU_LINUX.JRTCKXETXF.6YS6EN2CT7": {"unit":"Hrs","pricePerUnit": {"USD": "0.2268000000"}}}}},
      "SKU_WINDOWS": {"SKU_WINDOWS.JRTCKXETXF": {"priceDimensions": {"SKU_WINDOWS.JRTCKXETXF.6YS6EN2CT7": {"unit":"Hrs","pricePerUnit": {"USD": "0.5000000000"}}}}},
      "SKU_NOTWANTED": {"SKU_NOTWANTED.JRTCKXETXF": {"priceDimensions": {"SKU_NOTWANTED.JRTCKXETXF.6YS6EN2CT7": {"unit":"Hrs","pricePerUnit": {"USD": "0.0960000000"}}}}}
    },
    "Reserved": {
      "SKU_LINUX": {"SKU_LINUX.HU7G6RE": {"priceDimensions": {"SKU_LINUX.HU7G6RE.2TG2D8R56U": {"unit":"Hrs","pricePerUnit": {"USD": "0.1000000000"}}}}}
    }
  }
}`

func TestParseAWSBulk(t *testing.T) {
	wanted := map[string]bool{"c6in.xlarge": true, "c7i.xlarge": true}
	prices, err := parseAWSBulk(strings.NewReader(sampleBulk), "us-west-2", wanted)
	if err != nil {
		t.Fatalf("parseAWSBulk: %v", err)
	}
	if got := prices["c6in.xlarge"]; got != 0.2268 {
		t.Errorf("c6in.xlarge = %v, want 0.2268 (Linux/Shared/us-west-2 on-demand)", got)
	}
	if _, ok := prices["m5.large"]; ok {
		t.Error("m5.large should be filtered out (not wanted)")
	}
	if _, ok := prices["c7i.xlarge"]; ok {
		t.Error("c7i.xlarge should be absent (not in the fixture)")
	}
	if len(prices) != 1 {
		t.Errorf("expected exactly 1 price (Windows/Dedicated/other-region excluded), got %d: %v", len(prices), prices)
	}
}
