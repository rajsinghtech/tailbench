#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update -qq
apt-get install -y -qq iperf3 mtr-tiny jq curl > /dev/null 2>&1

curl -fsSL https://tailscale.com/install.sh | sh

touch /tmp/tailbench-ready
