# ENA Express (SRD) Benchmark Tests

## Overview

Add ENA Express (AWS Scalable Reliable Datagram) benchmark tests as additional rows in the Tailbench dashboard. ENA Express runs are interleaved on the same provisioned VM pair — after the standard benchmark completes, ENA Express is enabled on both ENIs, and the benchmark suite runs again.

## Approach

Interleaved on same pair (Approach 1):

1. Provision pair (standard)
2. Run standard benchmark -> `c6in.xlarge.json`
3. Enable ENA Express (SRD + SRD-UDP) on both ENIs
4. Run benchmark again -> `c6in.xlarge-ena-express.json`
5. Teardown pair

## Curated Families

ENA Express tests run only on high-network AWS families known to benefit from SRD:

- c6in, c7gn, c8gn, c7i, c8g

## Changes

### lib/aws.sh

- `aws_ena_express_families()` — returns curated family list
- `aws_enable_ena_express(instance_name)` — resolves primary ENI via describe-instances, calls modify-network-interface-attribute with `EnaSrdEnabled=true,EnaSrdUdpSpecification={EnaSrdUdpEnabled=true}`

### scripts/orchestrate.sh

Inside `_run_provider()` loop, after successful standard benchmark, before teardown:

1. Check if family is in ENA Express list
2. Check if ENA Express result already exists (resume: `$inst-ena-express.json`)
3. Enable ENA Express on both server and client ENIs
4. Brief sleep for ENI propagation
5. Re-run `run-benchmark.sh` with `ENA_EXPRESS=true` env var
6. Track result in summary

### scripts/run-benchmark.sh

When `ENA_EXPRESS=true`:

- Output filename: `$instance_type-ena-express.json`
- Result JSON includes `"ena_express": true` (defaults to `false`)

### Result JSON

New top-level field:

```json
{
  "ena_express": true,
  ...
}
```

### website/index.html

- Instance type displays as `c6in.xlarge (ENA Express)` when `ena_express` is true
- Amber "ENA" tag badge next to the family tag
- Detail view shows `ENA Express: on/off` in metadata
- No new filters — rows appear under existing family/provider filters
- Stats include ENA Express rows automatically

### scripts/generate-results.sh

No changes. Already aggregates all `*.json` from results dirs.
