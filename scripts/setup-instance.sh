#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update -qq
apt-get install -y -qq iperf3 mtr-tiny jq curl > /dev/null 2>&1

curl -fsSL https://tailscale.com/install.sh | sh

# Enable UDP GRO forwarding for improved Tailscale throughput (requires kernel 6.2+)
NETDEV=$(ip -o route get 8.8.8.8 | cut -f 5 -d " ")
if ethtool -K "$NETDEV" rx-udp-gro-forwarding on rx-gro-list off 2>/dev/null; then
  echo "Enabled UDP GRO forwarding on $NETDEV"
fi

touch /tmp/tailbench-ready
