#!/usr/bin/env bash
set -euo pipefail
source /Users/rajsingh/Documents/GitHub/tailbench/.env
cd /Users/rajsingh/Documents/GitHub/tailbench

families=(c6in c7i c6i c8g c7gn c8gn m6i c7g m7g)

export READY_TIMEOUT=600

for fam in "${families[@]}"; do
  echo "=== Running K8s benchmark for ${fam}.xlarge ==="
  rm -f "aws/${fam}/results/${fam}.xlarge.json"
  ./scripts/orchestrate.sh \
    --provider aws \
    --family "$fam" \
    --filter "^${fam}\\.xlarge$" \
    --k8s \
    --create-tailnet \
    || echo "FAILED: $fam"
  echo ""
done

echo "=== All families complete ==="
