#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"

output="$TAILBENCH_ROOT/website/data.generated.js"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

results=()
for provider_dir in "$TAILBENCH_ROOT"/{gcp,aws,azure}; do
  [[ -d "$provider_dir" ]] || continue
  while IFS= read -r -d '' file; do
    results+=("$file")
  done < <(find "$provider_dir" -path '*/results/*.json' -print0 2>/dev/null | sort -z)
done

count=0
echo '[' > "$tmp"

for file in "${results[@]}"; do
  rel="${file#"$TAILBENCH_ROOT"/}"
  entry=$(jq -e --arg src "$rel" '. + {source: $src}' "$file" 2>/dev/null) || {
    log_warn "skipping malformed JSON: $rel"
    continue
  }
  if [[ $count -gt 0 ]]; then
    echo ',' >> "$tmp"
  fi
  echo "$entry" >> "$tmp"
  count=$(( count + 1 ))
done

echo ']' >> "$tmp"

mkdir -p "$(dirname "$output")"

{
  printf 'const TAILBENCH_DATA = '
  jq '.' "$tmp"
  printf ';\n'
} > "$output"

log_info "wrote $count result(s) to ${output#"$TAILBENCH_ROOT"/}"
