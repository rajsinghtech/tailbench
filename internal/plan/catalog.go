package plan

import (
	"strings"

	"github.com/rajsinghtech/tailbench/internal/pricing"
	"github.com/rajsinghtech/tailbench/internal/provider"
)

type PricingCatalog struct{}

func (PricingCatalog) Instances(providerName, region string) ([]CatalogInstance, CatalogMetadata, error) {
	entries, meta := pricing.List(providerName, region)
	instances := make([]CatalogInstance, 0, len(entries))
	for _, entry := range entries {
		instances = append(instances, CatalogInstance{
			Type: entry.InstanceType,
			// Family is the result-path family (per size on Azure); FamilyGroup
			// is the group-wide --family selector ListFamilies offers. They are
			// the same string everywhere except Azure. Both come from
			// internal/provider so the plan and the run cannot disagree — a
			// private copy of this derivation here previously made
			// `--family dsv4` match nothing on Azure, which the guardrails then
			// refused as "no-runnable-work".
			Family:      provider.GetInstanceFamily(providerName, entry.InstanceType),
			FamilyGroup: provider.InstanceFamilyGroup(providerName, entry.InstanceType),
			VCPUs:       instanceVCPUs(providerName, entry.InstanceType),
			HourlyUSD:   entry.HourlyUSD,
		})
	}
	return instances, CatalogMetadata{Source: meta.Source, Updated: meta.Updated}, nil
}

func instanceVCPUs(provider, instanceType string) int {
	switch canonicalProvider(provider) {
	case "gcp":
		parts := strings.Split(instanceType, "-")
		return trailingInteger(parts)
	case "azure":
		name := strings.TrimPrefix(instanceType, "Standard_")
		digits := leadingDigitsAfterLetters(name)
		return digits
	case "aws":
		size := instanceType
		if _, after, ok := strings.Cut(instanceType, "."); ok {
			size = after
		}
		switch size {
		case "medium":
			return 1
		case "large":
			return 2
		case "xlarge":
			return 4
		case "metal", "metal-24xl":
			return 0
		}
		if strings.HasSuffix(size, "xlarge") {
			var count int
			for _, character := range strings.TrimSuffix(size, "xlarge") {
				if character < '0' || character > '9' {
					return 0
				}
				count = count*10 + int(character-'0')
			}
			return count * 4
		}
	}
	return 0
}

func trailingInteger(parts []string) int {
	if len(parts) == 0 {
		return 0
	}
	var value int
	for _, character := range parts[len(parts)-1] {
		if character < '0' || character > '9' {
			return 0
		}
		value = value*10 + int(character-'0')
	}
	return value
}

func leadingDigitsAfterLetters(value string) int {
	started := false
	var result int
	for _, character := range value {
		if character >= '0' && character <= '9' {
			started = true
			result = result*10 + int(character-'0')
			continue
		}
		if started {
			break
		}
	}
	return result
}

func canonicalProvider(provider string) string {
	switch provider {
	case "eks":
		return "aws"
	case "gke":
		return "gcp"
	case "aks":
		return "azure"
	default:
		return provider
	}
}
