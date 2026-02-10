#!/usr/bin/env bash
# GCP instance types to benchmark

GCP_C3_INSTANCES=(
  c3-standard-4
  c3-standard-8
  c3-standard-22
  c3-standard-44
  c3-standard-88
  c3-standard-176
)

GCP_N2_INSTANCES=(
  n2-standard-2
  n2-standard-4
  n2-standard-8
  n2-standard-16
  n2-standard-32
  n2-standard-64
)

ALL_INSTANCES=("${GCP_C3_INSTANCES[@]}" "${GCP_N2_INSTANCES[@]}")

get_instance_family() {
  local instance_type="$1"
  echo "${instance_type%%-*}"
}

get_instance_vcpus() {
  local instance_type="$1"
  local size="${instance_type##*-}"
  echo "$size"
}
