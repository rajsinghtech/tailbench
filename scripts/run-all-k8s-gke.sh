#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
[[ -f .env ]] && source .env

families=(c4 c3d n4 c3 n2 c2)

export READY_TIMEOUT=1200

for fam in "${families[@]}"; do
  echo "=== Running GKE K8s benchmark for ${fam}-standard-4 ==="
  rm -f "gcp/${fam}/results/${fam}-standard-4.json"
  ./scripts/orchestrate.sh \
    --provider gcp \
    --family "$fam" \
    --filter "^${fam}-standard-4$" \
    --k8s \
    --create-tailnet \
    || echo "FAILED: $fam"
  echo ""
done

echo "=== All GKE families complete ==="
