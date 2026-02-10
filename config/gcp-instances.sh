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

GCP_ALL_INSTANCES=("${GCP_C3_INSTANCES[@]}" "${GCP_N2_INSTANCES[@]}")
