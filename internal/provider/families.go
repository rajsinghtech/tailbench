package provider

import "strings"

// GetInstanceFamily extracts the family prefix from a cloud instance type.
func GetInstanceFamily(providerName, instanceType string) string {
	switch providerName {
	case "gcp":
		// c4-standard-4 -> c4
		parts := strings.SplitN(instanceType, "-", 2)
		return parts[0]
	case "aws":
		// c6in.xlarge -> c6in
		parts := strings.SplitN(instanceType, ".", 2)
		return parts[0]
	case "azure":
		// Standard_D4s_v4 -> dsv4
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
