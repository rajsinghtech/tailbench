//go:build gcp && !aws && !azure

package provider

import (
	"context"
	"fmt"
	"os/exec"
	"sort"
	"strconv"
	"strings"
)

func listGCPFamilies() []string {
	return []string{"c4", "c4a", "c3d", "n4", "c3", "n2", "c2"}
}

func listGCPInstances(ctx context.Context, project, zone, family string) ([]InstanceInfo, error) {
	filter := fmt.Sprintf("zone:%s AND name ~ '^%s-standard-[0-9]+$'", zone, family)
	out, err := exec.CommandContext(ctx, "gcloud", "compute", "machine-types", "list",
		"--project="+project, "--filter="+filter, "--format=value(name)").Output()
	if err != nil {
		return nil, fmt.Errorf("gcloud list machine-types: %w", err)
	}
	var instances []InstanceInfo
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line == "" {
			continue
		}
		vcpus, _ := getGCPVCPUs(line)
		instances = append(instances, InstanceInfo{Type: line, Family: GetInstanceFamily("gcp", line), VCPUs: vcpus})
	}
	sort.Slice(instances, func(i, j int) bool { return instances[i].VCPUs < instances[j].VCPUs })
	return instances, nil
}

func getGCPVCPUs(instanceType string) (int, error) {
	parts := strings.Split(instanceType, "-")
	if len(parts) >= 3 {
		return strconv.Atoi(parts[len(parts)-1])
	}
	return 0, fmt.Errorf("cannot parse vcpus from %s", instanceType)
}

func isGCPQuotaError(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "QUOTA_EXCEEDED") || strings.Contains(s, "ZONE_RESOURCE_POOL_EXHAUSTED") ||
		(strings.Contains(s, "Quota") && strings.Contains(s, "exceeded")) || strings.Contains(s, "increase quotas")
}
