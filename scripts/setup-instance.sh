#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

# Retry apt-get update up to 3 times to handle transient mirror sync issues
for attempt in 1 2 3; do
  apt-get update -qq && break || {
    echo "apt-get update failed (attempt $attempt), retrying in 15s..."
    sleep 15
  }
done
apt-get install -y -qq --fix-missing iperf3 mtr-tiny jq curl > /dev/null 2>&1

# Disable the iperf3 systemd service that ships with the package -
# we manage the server process ourselves and it causes port conflicts.
systemctl stop iperf3 2>/dev/null || true
systemctl disable iperf3 2>/dev/null || true

curl -fsSL https://tailscale.com/install.sh | sh

# TCP congestion control + buffer tuning
sysctl -w net.core.default_qdisc=fq
sysctl -w net.ipv4.tcp_congestion_control=bbr
sysctl -w net.core.rmem_max=67108864
sysctl -w net.core.wmem_max=67108864
sysctl -w net.ipv4.tcp_rmem="4096 87380 67108864"
sysctl -w net.ipv4.tcp_wmem="4096 65536 67108864"

# Pin CPU governor to performance mode
cpupower frequency-set -g performance 2>/dev/null || true

# Enable UDP GRO forwarding for improved Tailscale throughput (requires kernel 6.2+)
NETDEV=$(ip -o route get 8.8.8.8 | cut -f 5 -d " ")
if ethtool -K "$NETDEV" rx-udp-gro-forwarding on rx-gro-list off 2>/dev/null; then
  echo "Enabled UDP GRO forwarding on $NETDEV"
fi

# Log GRO offload state for diagnostics
ethtool -k "$NETDEV" | grep -E "rx-udp-gro-forwarding|rx-gro-list" || true

touch /tmp/tailbench-ready
