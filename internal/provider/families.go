package provider

import "strings"

// GetInstanceFamily extracts the family prefix from a cloud instance type.
func GetInstanceFamily(providerName, instanceType string) string {
	switch providerName {
	case "gcp", "gke":
		// c4-standard-4 -> c4
		parts := strings.SplitN(instanceType, "-", 2)
		return parts[0]
	case "aws", "eks":
		// c6in.xlarge -> c6in
		parts := strings.SplitN(instanceType, ".", 2)
		return parts[0]
	case "azure", "aks":
		// Standard_D4s_v4 -> d4sv4. The vCPU digit is deliberately kept: result
		// paths are per size on Azure, and the committed azure/ and aks/ trees
		// depend on it. Use InstanceFamilyGroup for the group-wide selector.
		name := strings.TrimPrefix(instanceType, "Standard_")
		var result []rune
		skipDigits := true
		for _, c := range name {
			if c >= '0' && c <= '9' && skipDigits {
				continue
			}
			skipDigits = false
			if c == '_' || c == '-' {
				continue
			}
			result = append(result, c)
		}
		return strings.ToLower(string(result))
	}
	return instanceType
}

// InstanceFamilyGroup returns the family a quota denial applies to: the group
// that ListFamilies exposes as a --family selector.
//
// For AWS and GCP this equals GetInstanceFamily (c6in.xlarge -> c6in,
// c3-standard-8 -> c3). Azure is the exception. GetInstanceFamily keeps the vCPU
// digit there (Standard_D4s_v4 -> d4sv4) because result paths are per size, but
// quota is granted per SKU family (dsv4). Keying the skip on the per-size value
// made a quota denial skip only the size that failed, so a run kept attempting
// larger sizes in the same family that were also over quota.
func InstanceFamilyGroup(providerName, instanceType string) string {
	family := GetInstanceFamily(providerName, instanceType)
	switch providerName {
	case "azure", "aks":
		return stripSizeDigits(family)
	}
	return family
}

// stripSizeDigits removes the first run of digits, which encodes the vCPU count,
// and keeps every later digit such as the version suffix: d4sv4 -> dsv4,
// f16sv2 -> fsv2, d2psv6 -> dpsv6.
func stripSizeDigits(family string) string {
	for i := 0; i < len(family); i++ {
		if family[i] < '0' || family[i] > '9' {
			continue
		}
		end := i
		for end < len(family) && family[end] >= '0' && family[end] <= '9' {
			end++
		}
		return family[:i] + family[end:]
	}
	return family
}

// IsGraviton returns true if the AWS instance type uses ARM (Graviton).
func IsGraviton(instanceType string) bool {
	family := strings.SplitN(instanceType, ".", 2)[0]
	return strings.ContainsRune(family, 'g')
}

// enaExpressMinVCPUs maps AWS instance families to the minimum vCPU count
// required for ENA Express support.
var enaExpressMinVCPUs = map[string]int{
	"c7gn": 16,
	"c6in": 32,
	"c8gn": 32,
	"c7i":  48,
	"c8g":  48,
}

// SupportsENAExpress reports whether the given AWS instance type meets
// the vCPU threshold for ENA Express.
func SupportsENAExpress(instanceType string, vcpus int) bool {
	family := strings.SplitN(instanceType, ".", 2)[0]
	minVCPUs, ok := enaExpressMinVCPUs[family]
	if !ok {
		return false
	}
	return vcpus >= minVCPUs
}
