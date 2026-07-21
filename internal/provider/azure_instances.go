//go:build azure && !aws && !gcp

package provider

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

type azureSKU struct {
	Name   string
	Family string
}

var azureFamilyToSKU = map[string]string{
	"dsv5": "standardDSv5Family", "dasv5": "standardDASv5Family", "dpsv6": "StandardDpsv6Family",
	"dsv4": "standardDSv4Family", "fsv2": "standardFSv2Family", "fasv6": "StandardFasv6Family",
	"falsv6": "StandardFalsv6Family", "famsv6": "StandardFamsv6Family", "fasv7": "StandardFasv7Family",
	"falsv7": "StandardFalsv7Family", "famsv7": "StandardFamsv7Family", "esv4": "standardESv4Family",
}

var (
	azureConstrainedRe = regexp.MustCompile(`[0-9]-[0-9]`)
	azureVCPURe        = regexp.MustCompile(`[0-9]+`)
)

func listAzureFamilies() []string {
	return []string{"dsv5", "dasv5", "dpsv6", "dsv4", "fsv2", "fasv6", "falsv6", "famsv6", "fasv7", "falsv7", "famsv7", "esv4"}
}

func loadAzureSKUs(ctx context.Context, location string, cache *[]azureSKU) ([]azureSKU, error) {
	if *cache != nil {
		return *cache, nil
	}
	tCtx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()
	out, err := exec.CommandContext(tCtx, "az", "vm", "list-skus", "--location", location,
		"--resource-type", "virtualMachines", "--query", "[].{name:name,family:family}", "--output", "json").Output()
	if err != nil {
		return nil, fmt.Errorf("az vm list-skus: %w", err)
	}
	if err := json.Unmarshal(out, cache); err != nil {
		return nil, fmt.Errorf("parse SKU list: %w", err)
	}
	return *cache, nil
}

func listAzureInstances(ctx context.Context, location, family string, cache *[]azureSKU) ([]InstanceInfo, error) {
	skuFamily, ok := azureFamilyToSKU[strings.ToLower(family)]
	if !ok {
		return nil, fmt.Errorf("unknown azure family: %s", family)
	}
	allSKUs, err := loadAzureSKUs(ctx, location, cache)
	if err != nil {
		return nil, err
	}
	var instances []InstanceInfo
	for _, sku := range allSKUs {
		if sku.Family != skuFamily || azureConstrainedRe.MatchString(sku.Name) || strings.Contains(sku.Name, "is_v") {
			continue
		}
		vcpus, _ := getAzureVCPUs(sku.Name)
		instances = append(instances, InstanceInfo{Type: sku.Name, Family: GetInstanceFamily("azure", sku.Name), VCPUs: vcpus})
	}
	sort.Slice(instances, func(i, j int) bool { return instances[i].VCPUs < instances[j].VCPUs })
	return instances, nil
}

func getAzureVCPUs(instanceType string) (int, error) {
	name := strings.TrimPrefix(instanceType, "Standard_")
	m := azureVCPURe.FindString(name)
	if m == "" {
		return 0, fmt.Errorf("cannot parse vcpus from %s", instanceType)
	}
	return strconv.Atoi(m)
}
