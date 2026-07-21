//go:build aws && !azure && !gcp

package provider

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"sort"
	"strconv"
	"strings"
	"time"
)

func listAWSFamilies() []string {
	return []string{"c8gn", "c6in", "c7i", "c7gn", "c8g", "c6i", "m6i", "c7g", "m7g"}
}

func listAWSInstances(ctx context.Context, region, family string) ([]InstanceInfo, error) {
	tCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	filter := fmt.Sprintf("Name=instance-type,Values=%s.*", family)
	out, err := exec.CommandContext(tCtx, "aws", "ec2", "describe-instance-types",
		"--region", region,
		"--filters", filter,
		"--query", "sort_by(InstanceTypes,&VCpuInfo.DefaultVCpus)[].[InstanceType,VCpuInfo.DefaultVCpus]",
		"--output", "json",
	).Output()
	if err != nil {
		return nil, fmt.Errorf("aws describe-instance-types (%s): %w", family, err)
	}

	var raw [][]json.RawMessage
	if err := json.Unmarshal(out, &raw); err != nil {
		return nil, fmt.Errorf("parse instance types: %w", err)
	}

	var instances []InstanceInfo
	for _, pair := range raw {
		if len(pair) < 2 {
			continue
		}
		var name string
		var vcpus int
		if err := json.Unmarshal(pair[0], &name); err != nil {
			continue
		}
		if err := json.Unmarshal(pair[1], &vcpus); err != nil {
			continue
		}
		instances = append(instances, InstanceInfo{Type: name, Family: GetInstanceFamily("aws", name), VCPUs: vcpus})
	}
	sort.Slice(instances, func(i, j int) bool { return instances[i].VCPUs < instances[j].VCPUs })
	return instances, nil
}

func getAWSVCPUs(ctx context.Context, region, instanceType string) (int, error) {
	out, err := exec.CommandContext(ctx, "aws", "ec2", "describe-instance-types",
		"--region", region,
		"--instance-types", instanceType,
		"--query", "InstanceTypes[0].VCpuInfo.DefaultVCpus",
		"--output", "text",
	).Output()
	if err != nil {
		return 0, fmt.Errorf("aws describe-instance-types: %w", err)
	}
	return strconv.Atoi(strings.TrimSpace(string(out)))
}

func isAWSQuotaError(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "VcpuLimitExceeded") || strings.Contains(s, "InstanceLimitExceeded")
}
