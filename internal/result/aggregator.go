package result

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Aggregate reads all result JSON files under {rootDir}/{gcp,aws,azure}/**/results/*.json
// and writes a combined website/data.generated.js file.
func Aggregate(rootDir string) error {
	providers := []string{"gcp", "aws", "azure"}
	var results []json.RawMessage

	for _, provider := range providers {
		providerDir := filepath.Join(rootDir, provider)
		if _, err := os.Stat(providerDir); os.IsNotExist(err) {
			continue
		}

		err := filepath.Walk(providerDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if info.IsDir() {
				return nil
			}
			if filepath.Base(filepath.Dir(path)) != "results" || !strings.HasSuffix(path, ".json") {
				return nil
			}

			data, err := os.ReadFile(path)
			if err != nil {
				return fmt.Errorf("reading %s: %w", path, err)
			}

			// Parse, inject source field, re-marshal
			var obj map[string]json.RawMessage
			if err := json.Unmarshal(data, &obj); err != nil {
				return fmt.Errorf("parsing %s: %w", path, err)
			}

			rel, err := filepath.Rel(rootDir, path)
			if err != nil {
				return fmt.Errorf("computing relative path for %s: %w", path, err)
			}
			sourceJSON, _ := json.Marshal(rel)
			obj["source"] = sourceJSON

			merged, err := json.Marshal(obj)
			if err != nil {
				return fmt.Errorf("re-marshaling %s: %w", path, err)
			}
			results = append(results, merged)
			return nil
		})
		if err != nil {
			return fmt.Errorf("walking %s: %w", provider, err)
		}
	}

	outDir := filepath.Join(rootDir, "website")
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return fmt.Errorf("creating website directory: %w", err)
	}

	indented, err := json.MarshalIndent(results, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling aggregated results: %w", err)
	}

	content := fmt.Sprintf("const TAILBENCH_DATA = %s;\n", indented)
	outPath := filepath.Join(outDir, "data.generated.js")
	if err := os.WriteFile(outPath, []byte(content), 0o644); err != nil {
		return fmt.Errorf("writing %s: %w", outPath, err)
	}
	return nil
}
