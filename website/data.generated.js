const TAILBENCH_DATA = [
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.198",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.198",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.8,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9588.043922499377,
          "retransmits": 0,
          "duration_sec": 10.000797,
          "bytes_transferred": 11986010112
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9588.043922499377,
        "bandwidth_mbps_min": 9588.043922499377,
        "bandwidth_mbps_max": 9588.043922499377,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5754.40215997454,
          "retransmits": 0,
          "duration_sec": 10.001229,
          "bytes_transferred": 7193886720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5754.40215997454,
        "bandwidth_mbps_min": 5754.40215997454,
        "bandwidth_mbps_max": 5754.40215997454,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "n2",
    "instance_type": "n2-standard-2",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 78.74596056150294,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 66.07491293240956,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/n2/results/n2-standard-2.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n2-standard-2-server-da58e9b 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.80.135.9",
      "hops": [
        {
          "hop": 1,
          "host": "100.80.135.9",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.7,
          "avg_ms": 0.8,
          "best_ms": 0.6,
          "worst_ms": 1.2,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2037.8466366684386,
          "retransmits": 1578,
          "duration_sec": 10.000813,
          "bytes_transferred": 2547515392
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2037.8466366684386,
        "bandwidth_mbps_min": 2037.8466366684386,
        "bandwidth_mbps_max": 2037.8466366684386,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 1578
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1952.1859429906676,
          "retransmits": 1043,
          "duration_sec": 10.001345,
          "bytes_transferred": 2440560640
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1952.1859429906676,
        "bandwidth_mbps_min": 1952.1859429906676,
        "bandwidth_mbps_max": 1952.1859429906676,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 1043
      }
    },
    "tailscale_version": "1.96.2",
    "test_config": {
      "iperf_duration_sec": 10,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 1,
      "mtr_cycles": 100
    },
    "vcpus": 2,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.148",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.148",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.2,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12424.9938759181,
          "retransmits": 0,
          "duration_sec": 10.000846,
          "bytes_transferred": 15532556288
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12424.9938759181,
        "bandwidth_mbps_min": 12424.9938759181,
        "bandwidth_mbps_max": 12424.9938759181,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9534.230539139506,
          "retransmits": 0,
          "duration_sec": 10.000714,
          "bytes_transferred": 11918639104
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9534.230539139506,
        "bandwidth_mbps_min": 9534.230539139506,
        "bandwidth_mbps_max": 9534.230539139506,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "aws",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c7g",
    "instance_type": "c7g.medium",
    "kernel_version": "6.17.0-1009-aws",
    "overhead": {
      "bandwidth_pct": 89.44599803242411,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 86.07230140839914,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "aws/c7g/results/c7g.medium.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-148 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.64.117.116",
      "hops": [
        {
          "hop": 1,
          "host": "100.64.117.116",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 0.6,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1311.3340981355796,
          "retransmits": 0,
          "duration_sec": 10.001714,
          "bytes_transferred": 1639448576
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1311.3340981355796,
        "bandwidth_mbps_min": 1311.3340981355796,
        "bandwidth_mbps_max": 1311.3340981355796,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1327.8988925197114,
          "retransmits": 0,
          "duration_sec": 10.001713,
          "bytes_transferred": 1660157952
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1327.8988925197114,
        "bandwidth_mbps_min": 1327.8988925197114,
        "bandwidth_mbps_max": 1327.8988925197114,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 0
      }
    },
    "tailscale_version": "1.96.2",
    "test_config": {
      "iperf_duration_sec": 10,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 1,
      "mtr_cycles": 100
    },
    "vcpus": 1,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.133",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.182",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0,
          "worst_ms": 0.1,
          "stdev_ms": 0
        },
        {
          "hop": 2,
          "host": "10.0.1.231",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.9,
          "stdev_ms": 0.1
        },
        {
          "hop": 3,
          "host": "10.0.1.133",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.3,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12342.103488712606,
          "retransmits": 14411,
          "duration_sec": 10.001999,
          "bytes_transferred": 15430713344
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12342.103488712606,
        "bandwidth_mbps_min": 12342.103488712606,
        "bandwidth_mbps_max": 12342.103488712606,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 14411
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4962.963788864547,
          "retransmits": 3359,
          "duration_sec": 10.001371,
          "bytes_transferred": 6204555264
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4962.963788864547,
        "bandwidth_mbps_min": 4962.963788864547,
        "bandwidth_mbps_max": 4962.963788864547,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 3359
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c7g",
    "instance_type": "c7g.medium",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 94.32891477627892,
      "retransmits_pct": 99.86815626951633
    },
    "overhead_single": {
      "bandwidth_pct": 86.4481949435156,
      "retransmits_pct": 99.94045846978268
    },
    "region": "us-west-2",
    "source": "eks/c7g/results/c7g.medium.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c7g-medium 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.79.247.16",
      "hops": [
        {
          "hop": 1,
          "host": "100.79.247.16",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 2.9,
          "avg_ms": 0.5,
          "best_ms": 0.4,
          "worst_ms": 2.9,
          "stdev_ms": 0.3
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 699.9312072447443,
          "retransmits": 19,
          "duration_sec": 10.001402,
          "bytes_transferred": 875036672
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 699.9312072447443,
        "bandwidth_mbps_min": 699.9312072447443,
        "bandwidth_mbps_max": 699.9312072447443,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 19
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 672.571177690836,
          "retransmits": 2,
          "duration_sec": 10.001343,
          "bytes_transferred": 840826880
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 672.571177690836,
        "bandwidth_mbps_min": 672.571177690836,
        "bandwidth_mbps_max": 672.571177690836,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 2
      }
    },
    "tailscale_version": "1.94.2",
    "test_config": {
      "iperf_duration_sec": 10,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 1,
      "mtr_cycles": 100
    },
    "vcpus": 1,
    "zone": "us-west-2a"
  }
];
