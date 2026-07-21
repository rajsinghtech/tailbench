// Command pricing-refresh regenerates internal/pricing/data.json from provider
// pricing APIs. No cloud credentials are required.
//
// Usage:
//
//	go run ./cmd/pricing-refresh   # refresh AWS + Azure prices in data.json (GCP is curated)
//
// AWS uses the public Price List Bulk API (no auth) — a large per-region JSON
// file that is streamed, not loaded whole. Azure uses the public Retail Prices
// API (no auth). GCP has no per-machine-type price primitive, so the gcp block
// is left untouched (curated).
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

func main() {
	root := flag.String("root", ".", "Repository root")
	flag.Parse()

	dataPath := filepath.Join(*root, "internal", "pricing", "data.json")
	if err := runRefresh(dataPath); err != nil {
		log.Fatalf("refresh: %v", err)
	}
}

// -------- refresh --------

func runRefresh(dataPath string) error {
	meta, blocks, err := loadData(dataPath)
	if err != nil {
		return err
	}

	if aws := blocks["aws"]; aws != nil {
		for region, types := range aws {
			wanted := make(map[string]bool, len(types))
			for t := range types {
				wanted[t] = true
			}
			log.Printf("aws %s: streaming public bulk price list for %d instance types...", region, len(wanted))
			found, err := fetchAWSBulkPrices(region, wanted)
			if err != nil {
				log.Printf("aws %s: %v (keeping existing)", region, err)
			}
			for t := range types {
				if p, ok := found[t]; ok {
					log.Printf("aws %s/%s: %.5f", region, t, p)
					types[t] = p
				} else {
					log.Printf("aws %s/%s: not in bulk list (keeping existing)", region, t)
				}
			}
		}
	}

	if azure := blocks["azure"]; azure != nil {
		for region, types := range azure {
			for armSku := range types {
				price, err := fetchAzurePrice(region, armSku)
				if err != nil {
					log.Printf("azure %s/%s: %v (keeping existing)", region, armSku, err)
					continue
				}
				log.Printf("azure %s/%s: %.5f", region, armSku, price)
				types[armSku] = price
			}
		}
	}

	if _, ok := blocks["gcp"]; ok {
		log.Printf("gcp: curated (no machine-type pricing API); leaving %d region(s) untouched", len(blocks["gcp"]))
	}

	meta["updated"] = today()
	return saveData(dataPath, meta, blocks)
}

// fetchAzurePrice queries the public Azure Retail Prices API for the base Linux
// on-demand (Consumption) price, excluding Windows/Spot/Low Priority meters.
func fetchAzurePrice(region, armSkuName string) (float64, error) {
	filter := fmt.Sprintf(
		"serviceName eq 'Virtual Machines' and armSkuName eq '%s' and armRegionName eq '%s' and priceType eq 'Consumption'",
		armSkuName, region)
	endpoint := "https://prices.azure.com/api/retail/prices?currencyCode=%27USD%27&$filter=" + url.QueryEscape(filter)

	resp, err := http.Get(endpoint) //nolint:gosec // fixed host, filter is escaped
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("retail API status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var out struct {
		Items []struct {
			RetailPrice float64 `json:"retailPrice"`
			MeterName   string  `json:"meterName"`
			ProductName string  `json:"productName"`
			SkuName     string  `json:"skuName"`
		} `json:"Items"`
	}
	if err := json.Unmarshal(body, &out); err != nil {
		return 0, err
	}
	for _, it := range out.Items {
		if it.RetailPrice <= 0 ||
			strings.Contains(it.ProductName, "Windows") ||
			strings.Contains(it.MeterName, "Spot") ||
			strings.Contains(it.SkuName, "Spot") ||
			strings.Contains(it.MeterName, "Low Priority") {
			continue
		}
		return it.RetailPrice, nil
	}
	return 0, fmt.Errorf("no Linux consumption price found")
}

const awsPricingHost = "https://pricing.us-east-1.amazonaws.com"

// fetchAWSBulkPrices streams the public AWS Price List Bulk API for a region and
// returns on-demand USD/hour prices for the wanted instance types (Linux, Shared
// tenancy, no pre-installed software, Used capacity). No credentials required.
//
// The per-region file is very large (hundreds of MB), so it is streamed with a
// json.Decoder — only the ~dozens of matching SKUs are held in memory, never the
// whole document. Relies on the bulk format emitting "products" before "terms".
func fetchAWSBulkPrices(ec2Region string, wanted map[string]bool) (map[string]float64, error) {
	// Resolve the current per-region file from the (small) region index.
	idxResp, err := http.Get(awsPricingHost + "/offers/v1.0/aws/AmazonEC2/current/region_index.json") //nolint:gosec // fixed host
	if err != nil {
		return nil, err
	}
	defer idxResp.Body.Close()
	var idx struct {
		Regions map[string]struct {
			CurrentVersionURL string `json:"currentVersionUrl"`
		} `json:"regions"`
	}
	if err := json.NewDecoder(idxResp.Body).Decode(&idx); err != nil {
		return nil, fmt.Errorf("region index: %w", err)
	}
	regionURL := idx.Regions[ec2Region].CurrentVersionURL
	if regionURL == "" {
		return nil, fmt.Errorf("no bulk price file for region %s", ec2Region)
	}

	resp, err := http.Get(awsPricingHost + regionURL) //nolint:gosec // url from AWS-provided index
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bulk price file status %d", resp.StatusCode)
	}
	return parseAWSBulk(resp.Body, ec2Region, wanted)
}

// parseAWSBulk streams an AWS EC2 bulk price-list document, returning USD/hour
// on-demand prices for the wanted instance types. Kept separate from the HTTP
// fetch so it can be unit-tested against a small fixture.
func parseAWSBulk(r io.Reader, region string, wanted map[string]bool) (map[string]float64, error) {
	dec := json.NewDecoder(r)
	skuToType := map[string]string{} // matching SKU -> instance type
	prices := map[string]float64{}   // instance type -> USD/hr

	if t, err := dec.Token(); err != nil || t != json.Delim('{') {
		return nil, fmt.Errorf("unexpected top-level token (%v)", err)
	}
	for dec.More() {
		keyTok, err := dec.Token()
		if err != nil {
			return nil, err
		}
		switch keyTok.(string) {
		case "products":
			if err := streamAWSProducts(dec, region, wanted, skuToType); err != nil {
				return nil, fmt.Errorf("products: %w", err)
			}
		case "terms":
			if err := streamAWSTerms(dec, skuToType, prices); err != nil {
				return nil, fmt.Errorf("terms: %w", err)
			}
		default:
			if err := skipJSONValue(dec); err != nil {
				return nil, err
			}
		}
	}
	return prices, nil
}

// streamAWSProducts consumes the "products" object, recording SKUs whose
// attributes match an on-demand Linux/Shared instance we want.
func streamAWSProducts(dec *json.Decoder, region string, wanted map[string]bool, out map[string]string) error {
	if t, err := dec.Token(); err != nil || t != json.Delim('{') {
		return fmt.Errorf("not an object (%v)", err)
	}
	for dec.More() {
		skuTok, err := dec.Token() // SKU key
		if err != nil {
			return err
		}
		sku := skuTok.(string)
		var p struct {
			ProductFamily string `json:"productFamily"`
			Attributes    struct {
				InstanceType    string `json:"instanceType"`
				OperatingSystem string `json:"operatingSystem"`
				Tenancy         string `json:"tenancy"`
				PreInstalledSw  string `json:"preInstalledSw"`
				CapacityStatus  string `json:"capacitystatus"`
				RegionCode      string `json:"regionCode"`
			} `json:"attributes"`
		}
		if err := dec.Decode(&p); err != nil {
			return err
		}
		a := p.Attributes
		if wanted[a.InstanceType] && a.OperatingSystem == "Linux" && a.Tenancy == "Shared" &&
			a.PreInstalledSw == "NA" && a.CapacityStatus == "Used" && a.RegionCode == region {
			out[sku] = a.InstanceType
		}
	}
	_, err := dec.Token() // closing }
	return err
}

// streamAWSTerms consumes the "terms" object and, for each matching SKU under
// OnDemand, records the USD/hour price into prices keyed by instance type.
func streamAWSTerms(dec *json.Decoder, skuToType map[string]string, prices map[string]float64) error {
	if t, err := dec.Token(); err != nil || t != json.Delim('{') {
		return fmt.Errorf("not an object (%v)", err)
	}
	for dec.More() {
		classTok, err := dec.Token() // "OnDemand" / "Reserved" / ...
		if err != nil {
			return err
		}
		if classTok.(string) != "OnDemand" {
			if err := skipJSONValue(dec); err != nil {
				return err
			}
			continue
		}
		if t, err := dec.Token(); err != nil || t != json.Delim('{') {
			return fmt.Errorf("OnDemand not an object (%v)", err)
		}
		for dec.More() {
			skuTok, err := dec.Token()
			if err != nil {
				return err
			}
			sku := skuTok.(string)
			itype, want := skuToType[sku]
			var term map[string]struct {
				PriceDimensions map[string]struct {
					PricePerUnit struct {
						USD string `json:"USD"`
					} `json:"pricePerUnit"`
				} `json:"priceDimensions"`
			}
			if err := dec.Decode(&term); err != nil {
				return err
			}
			if !want {
				continue
			}
			for _, t := range term {
				for _, pd := range t.PriceDimensions {
					if f, err := strconv.ParseFloat(pd.PricePerUnit.USD, 64); err == nil && f > 0 {
						prices[itype] = f
					}
				}
			}
		}
		if _, err := dec.Token(); err != nil { // close OnDemand }
			return err
		}
	}
	_, err := dec.Token() // close terms }
	return err
}

// skipJSONValue discards the next JSON value (scalar, object, or array) from dec.
func skipJSONValue(dec *json.Decoder) error {
	t, err := dec.Token()
	if err != nil {
		return err
	}
	switch t {
	case json.Delim('{'), json.Delim('['):
		depth := 1
		for depth > 0 {
			tt, err := dec.Token()
			if err != nil {
				return err
			}
			switch tt {
			case json.Delim('{'), json.Delim('['):
				depth++
			case json.Delim('}'), json.Delim(']'):
				depth--
			}
		}
	}
	return nil
}

// -------- data.json IO --------

func loadData(path string) (map[string]string, map[string]map[string]map[string]float64, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, nil, fmt.Errorf("read %s: %w", path, err)
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(b, &raw); err != nil {
		return nil, nil, fmt.Errorf("parse %s: %w", path, err)
	}

	meta := map[string]string{}
	blocks := map[string]map[string]map[string]float64{}
	for key, val := range raw {
		if key == "_meta" {
			if err := json.Unmarshal(val, &meta); err != nil {
				return nil, nil, fmt.Errorf("parse _meta: %w", err)
			}
			continue
		}
		var block map[string]map[string]float64
		if err := json.Unmarshal(val, &block); err != nil {
			return nil, nil, fmt.Errorf("parse block %q: %w", key, err)
		}
		blocks[key] = block
	}
	return meta, blocks, nil
}

func saveData(path string, meta map[string]string, blocks map[string]map[string]map[string]float64) error {
	out := map[string]json.RawMessage{}
	mb, err := json.Marshal(meta)
	if err != nil {
		return err
	}
	out["_meta"] = mb
	for key, block := range blocks {
		bb, err := json.Marshal(block)
		if err != nil {
			return err
		}
		out[key] = bb
	}
	data, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return err
	}

	names := make([]string, 0, len(blocks))
	for k := range blocks {
		names = append(names, k)
	}
	sort.Strings(names)
	log.Printf("wrote %s (providers: %s)", path, strings.Join(names, ", "))
	return os.WriteFile(path, append(data, '\n'), 0o644)
}

func today() string {
	// Stamp the date the operator ran the refresh. Overridable via env so tests
	// (and reproducible runs) stay deterministic.
	if d := os.Getenv("PRICING_REFRESH_DATE"); d != "" {
		return d
	}
	return time.Now().UTC().Format("2006-01-02")
}
