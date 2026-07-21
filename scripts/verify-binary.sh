#!/bin/sh
set -eu

variant=${1:?usage: verify-binary.sh VARIANT BINARY}
binary=${2:?usage: verify-binary.sh VARIANT BINARY}
tmp=${TMPDIR:-/tmp}/tailbench-binary-modules-$$
trap 'rm -f "$tmp"' EXIT HUP INT TERM

go version -m "$binary" >"$tmp"

case "$variant" in
  aws|aws-k8s)
    allowed='github.com/pulumi/pulumi-aws/'
    forbidden='github.com/pulumi/pulumi-gcp/|github.com/pulumi/pulumi-azure-native-sdk/'
    ;;
  azure|azure-k8s)
    allowed='github.com/pulumi/pulumi-azure-native-sdk/'
    forbidden='github.com/pulumi/pulumi-aws/|github.com/pulumi/pulumi-gcp/'
    ;;
  gcp|gcp-k8s)
    allowed='github.com/pulumi/pulumi-gcp/'
    forbidden='github.com/pulumi/pulumi-aws/|github.com/pulumi/pulumi-azure-native-sdk/'
    ;;
  *)
    printf 'error: unknown variant %s\n' "$variant" >&2
    exit 2
    ;;
esac

if ! grep -Fq "$allowed" "$tmp"; then
  printf 'error: %s lacks its expected provider SDK metadata\n' "$binary" >&2
  exit 1
fi
if grep -Eq "$forbidden" "$tmp"; then
  printf 'error: %s contains forbidden provider SDK metadata\n' "$binary" >&2
  exit 1
fi
case "$variant" in
  *-k8s)
    if ! grep -Fq 'k8s.io/client-go' "$tmp"; then
      printf 'error: %s lacks Kubernetes client metadata\n' "$binary" >&2
      exit 1
    fi
    ;;
  *)
    if grep -Fq 'k8s.io/client-go' "$tmp"; then
      printf 'error: %s contains Kubernetes client metadata\n' "$binary" >&2
      exit 1
    fi
    ;;
esac
