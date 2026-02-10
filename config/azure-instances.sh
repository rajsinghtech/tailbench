#!/usr/bin/env bash
# Azure VM sizes to benchmark

# Dv5 — General purpose
AZURE_DV5_INSTANCES=(
  Standard_D4_v5
  Standard_D8_v5
  Standard_D16_v5
  Standard_D32_v5
)

# Fv2 — Compute optimized
AZURE_FV2_INSTANCES=(
  Standard_F4s_v2
  Standard_F8s_v2
  Standard_F16s_v2
  Standard_F32s_v2
)

# Ev5 — Memory optimized
AZURE_EV5_INSTANCES=(
  Standard_E4_v5
  Standard_E8_v5
  Standard_E16_v5
  Standard_E32_v5
)

AZURE_ALL_INSTANCES=(
  "${AZURE_DV5_INSTANCES[@]}"
  "${AZURE_FV2_INSTANCES[@]}"
  "${AZURE_EV5_INSTANCES[@]}"
)

azure_get_instance_family() {
  local instance_type="$1"
  # Standard_D4_v5 -> Dv5, Standard_F8s_v2 -> Fv2, Standard_E16_v5 -> Ev5
  local name="${instance_type#Standard_}"
  local letter="${name%%[0-9]*}"
  # Strip trailing 's' if present (e.g. F4s -> F)
  letter="${letter%s}"
  local suffix="${name##*_}"
  echo "${letter}${suffix}"
}

azure_get_instance_vcpus() {
  local instance_type="$1"
  # Standard_D4_v5 -> 4, Standard_F8s_v2 -> 8
  local name="${instance_type#Standard_}"
  local num
  num=$(echo "$name" | grep -oE '[0-9]+' | head -1)
  echo "${num:-0}"
}
