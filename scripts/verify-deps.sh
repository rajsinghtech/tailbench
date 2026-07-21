#!/bin/sh
set -eu

variants='aws|aws|aws
aws-k8s|aws,k8s|aws
azure|azure|azure
azure-k8s|azure,k8s|azure
gcp|gcp|gcp
gcp-k8s|gcp,k8s|gcp'

selected=${1:-}
go_cmd=${GO:-go}
tmp=${TMPDIR:-/tmp}/tailbench-deps-$$
trap 'rm -f "$tmp"' EXIT HUP INT TERM

printf '%s\n' "$variants" | while IFS='|' read -r name tags cloud; do
  if test -n "$selected" && test "$selected" != "$name"; then
    continue
  fi
  printf 'verify-deps: %s (%s)\n' "$name" "$tags"
  "$go_cmd" list -deps -tags "$tags" ./cmd/tailbench >"$tmp"

  case "$cloud" in
    aws) allowed='github.com/pulumi/pulumi-aws/'; forbidden='github.com/pulumi/pulumi-gcp/|github.com/pulumi/pulumi-azure-native-sdk/' ;;
    azure) allowed='github.com/pulumi/pulumi-azure-native-sdk/'; forbidden='github.com/pulumi/pulumi-aws/|github.com/pulumi/pulumi-gcp/' ;;
    gcp) allowed='github.com/pulumi/pulumi-gcp/'; forbidden='github.com/pulumi/pulumi-aws/|github.com/pulumi/pulumi-azure-native-sdk/' ;;
  esac
  if ! grep -Fq "$allowed" "$tmp"; then
    printf 'error: %s does not include its expected Pulumi provider SDK\n' "$name" >&2
    exit 1
  fi
  if grep -E "$forbidden" "$tmp"; then
    printf 'error: %s includes a forbidden Pulumi provider SDK\n' "$name" >&2
    exit 1
  fi
  case "$name" in
    *-k8s)
      if ! grep -Fq 'k8s.io/client-go' "$tmp"; then
        printf 'error: %s does not include k8s.io/client-go\n' "$name" >&2
        exit 1
      fi
      ;;
    *)
      if grep -F 'k8s.io/client-go' "$tmp"; then
        printf 'error: %s includes k8s.io/client-go\n' "$name" >&2
        exit 1
      fi
      ;;
  esac
done

if test -n "$selected" && ! printf '%s\n' "$variants" | grep -q "^$selected|"; then
  printf 'error: unknown variant %s\n' "$selected" >&2
  exit 2
fi
