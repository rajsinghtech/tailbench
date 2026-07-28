package plan

import (
	"strings"

	"github.com/rajsinghtech/tailbench/internal/pricing"
)

type PricingCatalog struct{}

func (PricingCatalog) Instances(provider, region string) ([]CatalogInstance, CatalogMetadata, error) {
	entries, meta := pricing.List(provider, region)
	instances := make([]CatalogInstance, 0, len(entries))
	for _, entry := range entries {
		instances = append(instances, CatalogInstance{
			Type:      entry.InstanceType,
			Family:    instanceFamily(provider, entry.InstanceType),
			VCPUs:     instanceVCPUs(provider, entry.InstanceType),
			HourlyUSD: entry.HourlyUSD,
		})
	}
	return instances, CatalogMetadata{Source: meta.Source, Updated: meta.Updated}, nil
}

func instanceFamily(provider, instanceType string) string {
	switch canonicalProvider(provider) {
	case "gcp":
		family, _, _ := strings.Cut(instanceType, "-")
		return family
	case "aws":
		family, _, _ := strings.Cut(instanceType, ".")
		return family
	case "azure":
		name := strings.TrimPrefix(instanceType, "Standard_")
		var result []rune
		skipDigits := true
		for _, character := range name {
			if character >= '0' && character <= '9' && skipDigits {
				continue
			}
			skipDigits = false
			if character == '_' || character == '-' {
				continue
			}
			result = append(result, character)
		}
		return strings.ToLower(string(result))
	default:
		return instanceType
	}
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
