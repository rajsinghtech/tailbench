#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
[[ -f .env ]] && source .env

families=(c6in c7i c6i c8g c7gn c8gn m6i c7g m7g)

export READY_TIMEOUT=1200

# Export static AWS credentials from SSO session so they survive the long run
# SSO tokens expire in ~1h but static creds last the session duration (~8h)
refresh_aws_creds() {
  local creds
  creds=$(aws configure export-credentials --format env 2>/dev/null) || return 1
  eval "$creds"
  export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
  echo "[INFO] AWS credentials refreshed"
}

refresh_aws_creds || { echo "Failed to export AWS credentials"; exit 1; }

for fam in "${families[@]}"; do
  # Refresh credentials before each family (~25min per family)
  refresh_aws_creds || echo "[WARN] Could not refresh AWS credentials for $fam"
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
