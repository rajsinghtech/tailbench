#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
[[ -f .env ]] && source .env

source lib/common.sh
source config/azure.sh
source config/aks.sh
source lib/aks.sh

families=(dsv5 dasv5 dsv4 fsv2 fasv6 fasv7 esv4)

export READY_TIMEOUT=1200

for fam in "${families[@]}"; do
  vm_size=$(aks_family_to_vm_size "$fam")
  echo "=== Running AKS K8s benchmark for $fam ($vm_size) ==="
  rm -f "azure/${fam}/results/${vm_size}.json"
  ./scripts/orchestrate.sh \
    --provider azure \
    --family "$fam" \
    --filter "^${vm_size}$" \
    --k8s \
    --create-tailnet \
    || echo "FAILED: $fam"
  echo ""
done

echo "=== All AKS families complete ==="
