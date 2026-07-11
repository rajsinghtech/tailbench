package main

import (
	"reflect"
	"testing"

	"github.com/rajsinghtech/tailbench/internal/config"
)

func TestCompiledProviderFactory(t *testing.T) {
	cfg := &config.Config{StateDir: "file://" + t.TempDir()}
	p, err := compiledProviderFactory(compiledProviderName, cfg)
	if err != nil {
		t.Fatalf("factory(%q): %v", compiledProviderName, err)
	}
	if p.Name() != compiledProviderName {
		t.Fatalf("provider name = %q, want %q", p.Name(), compiledProviderName)
	}
	wantTypes := map[string]string{
		"aws": "*provider.AWSProvider", "eks": "*provider.EKSProvider",
		"azure": "*provider.AzureProvider", "aks": "*provider.AKSProvider",
		"gcp": "*provider.GCPProvider", "gke": "*provider.GKEProvider",
	}
	if got := reflect.TypeOf(p).String(); got != wantTypes[compiledProviderName] {
		t.Fatalf("factory type = %q, want %q", got, wantTypes[compiledProviderName])
	}
}

func TestCompiledProviderFactoryRejectsOtherProviders(t *testing.T) {
	cfg := &config.Config{StateDir: "file://" + t.TempDir()}
	for _, name := range []string{"aws", "eks", "azure", "aks", "gcp", "gke"} {
		if name == compiledProviderName {
			continue
		}
		t.Run(name, func(t *testing.T) {
			_, err := compiledProviderFactory(name, cfg)
			if err == nil {
				t.Fatalf("factory(%q) unexpectedly succeeded", name)
			}
			want := "requested provider \"" + name + "\", but this binary was compiled for provider \"" + compiledProviderName + "\""
			if err.Error() != want {
				t.Fatalf("error = %q, want %q", err, want)
			}
		})
	}
}
