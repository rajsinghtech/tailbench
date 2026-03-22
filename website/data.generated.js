const TAILBENCH_DATA = [
  {
    "cloud_provider": "gcp",
    "instance_family": "c2",
    "instance_type": "c2-standard-16",
    "vcpus": 16,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c2-standard-16-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 30907.23129055,
          "retransmits": 0,
          "duration_sec": 30.001697,
          "bytes_transferred": 115908673536
        },
        {
          "bandwidth_mbps": 31152.820212283077,
          "retransmits": 0,
          "duration_sec": 30.001638,
          "bytes_transferred": 116829454336
        },
        {
          "bandwidth_mbps": 31481.786474332035,
          "retransmits": 0,
          "duration_sec": 30.001461,
          "bytes_transferred": 118062448640
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 31180.612659055038,
        "bandwidth_mbps_min": 30907.23129055,
        "bandwidth_mbps_max": 31481.786474332035,
        "bandwidth_mbps_stddev": 288.2841,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4516.692607495435,
          "retransmits": 109,
          "duration_sec": 30.001483,
          "bytes_transferred": 16938434560
        },
        {
          "bandwidth_mbps": 4536.656089803792,
          "retransmits": 665,
          "duration_sec": 30.000515,
          "bytes_transferred": 17012752384
        },
        {
          "bandwidth_mbps": 4507.557075475912,
          "retransmits": 527,
          "duration_sec": 30.001572,
          "bytes_transferred": 16904224768
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4520.3019242583805,
        "bandwidth_mbps_min": 4507.557075475912,
        "bandwidth_mbps_max": 4536.656089803792,
        "bandwidth_mbps_stddev": 14.8815,
        "retransmits_avg": 433.6666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 85.50284443193692,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 16573.72891513657,
          "retransmits": 0,
          "duration_sec": 30.00138,
          "bytes_transferred": 62154342400
        },
        {
          "bandwidth_mbps": 16501.665056840237,
          "retransmits": 0,
          "duration_sec": 30.001371,
          "bytes_transferred": 61884071936
        },
        {
          "bandwidth_mbps": 16469.643411838715,
          "retransmits": 0,
          "duration_sec": 30.001383,
          "bytes_transferred": 61764009984
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 16515.01246127184,
        "bandwidth_mbps_min": 16469.643411838715,
        "bandwidth_mbps_max": 16573.72891513657,
        "bandwidth_mbps_stddev": 53.3110,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4368.3688143952595,
          "retransmits": 959,
          "duration_sec": 30.001432,
          "bytes_transferred": 16382164992
        },
        {
          "bandwidth_mbps": 4540.274118072138,
          "retransmits": 385,
          "duration_sec": 30.00132,
          "bytes_transferred": 17026777088
        },
        {
          "bandwidth_mbps": 4418.12780138011,
          "retransmits": 595,
          "duration_sec": 30.001507,
          "bytes_transferred": 16568811520
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4442.256911282503,
        "bandwidth_mbps_min": 4368.3688143952595,
        "bandwidth_mbps_max": 4540.274118072138,
        "bandwidth_mbps_stddev": 88.4563,
        "retransmits_avg": 646.3333333333334
      }
    },
    "overhead_single": {
      "bandwidth_pct": 73.10170415130041,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.195",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.195",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.600,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.88.107.17",
      "hops": [
        {
          "hop": 1,
          "host": "100.88.107.17",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 0.600,
          "best_ms": 0.500,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/c2/results/c2-standard-16.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c2",
    "instance_type": "c2-standard-30",
    "vcpus": 30,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c2-standard-30-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 31724.2573093396,
          "retransmits": 0,
          "duration_sec": 30.001445,
          "bytes_transferred": 118971695104
        },
        {
          "bandwidth_mbps": 30028.809517616177,
          "retransmits": 0,
          "duration_sec": 30.001462,
          "bytes_transferred": 112613523456
        },
        {
          "bandwidth_mbps": 31328.576463266287,
          "retransmits": 0,
          "duration_sec": 30.001648,
          "bytes_transferred": 117488615424
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 31027.214430074022,
        "bandwidth_mbps_min": 30028.809517616177,
        "bandwidth_mbps_max": 31724.2573093396,
        "bandwidth_mbps_stddev": 886.9894,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4549.715811046628,
          "retransmits": 7931,
          "duration_sec": 30.001518,
          "bytes_transferred": 17062297600
        },
        {
          "bandwidth_mbps": 4325.585088004143,
          "retransmits": 6602,
          "duration_sec": 30.000974,
          "bytes_transferred": 16221470720
        },
        {
          "bandwidth_mbps": 4555.02635355509,
          "retransmits": 7267,
          "duration_sec": 30.001531,
          "bytes_transferred": 17082220544
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4476.77575086862,
        "bandwidth_mbps_min": 4325.585088004143,
        "bandwidth_mbps_max": 4555.02635355509,
        "bandwidth_mbps_stddev": 130.9619,
        "retransmits_avg": 7266.666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 85.57145450179576,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11751.145394463541,
          "retransmits": 0,
          "duration_sec": 30.001163,
          "bytes_transferred": 44068503552
        },
        {
          "bandwidth_mbps": 12039.134755433404,
          "retransmits": 0,
          "duration_sec": 30.001358,
          "bytes_transferred": 45148798976
        },
        {
          "bandwidth_mbps": 11955.469351168982,
          "retransmits": 0,
          "duration_sec": 30.00134,
          "bytes_transferred": 44835012608
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11915.249833688642,
        "bandwidth_mbps_min": 11751.145394463541,
        "bandwidth_mbps_max": 12039.134755433404,
        "bandwidth_mbps_stddev": 148.1475,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4357.787853214299,
          "retransmits": 1154,
          "duration_sec": 30.001369,
          "bytes_transferred": 16342450176
        },
        {
          "bandwidth_mbps": 4292.962734190213,
          "retransmits": 1638,
          "duration_sec": 30.001307,
          "bytes_transferred": 16099311616
        },
        {
          "bandwidth_mbps": 4185.067708896503,
          "retransmits": 2016,
          "duration_sec": 30.001316,
          "bytes_transferred": 15694692352
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4278.606098767005,
        "bandwidth_mbps_min": 4185.067708896503,
        "bandwidth_mbps_max": 4357.787853214299,
        "bandwidth_mbps_stddev": 87.2505,
        "retransmits_avg": 1602.6666666666667
      }
    },
    "overhead_single": {
      "bandwidth_pct": 64.09134379482445,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.30",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.30",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.500,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.87.126.10",
      "hops": [
        {
          "hop": 1,
          "host": "100.87.126.10",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.500,
          "best_ms": 0.400,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/c2/results/c2-standard-30.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c2",
    "instance_type": "c2-standard-4",
    "vcpus": 4,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-gcp",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c2-standard-4-server 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9433.95633726452,
          "retransmits": 0,
          "duration_sec": 30.000594,
          "bytes_transferred": 35378036736
        },
        {
          "bandwidth_mbps": 9734.650597156731,
          "retransmits": 0,
          "duration_sec": 30.000583,
          "bytes_transferred": 36505649152
        },
        {
          "bandwidth_mbps": 9728.25631012689,
          "retransmits": 0,
          "duration_sec": 30.001655,
          "bytes_transferred": 36482973696
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9632.287748182714,
        "bandwidth_mbps_min": 9433.95633726452,
        "bandwidth_mbps_max": 9734.650597156731,
        "bandwidth_mbps_stddev": 171.7898,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3399.6567802628397,
          "retransmits": 1390,
          "duration_sec": 30.000629,
          "bytes_transferred": 12748980224
        },
        {
          "bandwidth_mbps": 3398.1423643361154,
          "retransmits": 767,
          "duration_sec": 30.001039,
          "bytes_transferred": 12743475200
        },
        {
          "bandwidth_mbps": 3460.166660872447,
          "retransmits": 3534,
          "duration_sec": 30.001163,
          "bytes_transferred": 12976128000
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3419.321935157134,
        "bandwidth_mbps_min": 3398.1423643361154,
        "bandwidth_mbps_max": 3460.166660872447,
        "bandwidth_mbps_stddev": 35.3807,
        "retransmits_avg": 1897
      }
    },
    "overhead": {
      "bandwidth_pct": 64.501455681676,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9625.7218639501,
          "retransmits": 0,
          "duration_sec": 30.001404,
          "bytes_transferred": 36098146304
        },
        {
          "bandwidth_mbps": 9680.75532994274,
          "retransmits": 0,
          "duration_sec": 30.001448,
          "bytes_transferred": 36304584704
        },
        {
          "bandwidth_mbps": 9426.223711234266,
          "retransmits": 0,
          "duration_sec": 30.001399,
          "bytes_transferred": 35349987328
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9577.566968375702,
        "bandwidth_mbps_min": 9426.223711234266,
        "bandwidth_mbps_max": 9680.75532994274,
        "bandwidth_mbps_stddev": 133.9244,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3274.9256137186285,
          "retransmits": 2937,
          "duration_sec": 30.000841,
          "bytes_transferred": 12281315328
        },
        {
          "bandwidth_mbps": 3298.734562870036,
          "retransmits": 5160,
          "duration_sec": 30.00046,
          "bytes_transferred": 12370444288
        },
        {
          "bandwidth_mbps": 3284.431860813645,
          "retransmits": 1397,
          "duration_sec": 30.000527,
          "bytes_transferred": 12316835840
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3286.030679134103,
        "bandwidth_mbps_min": 3274.9256137186285,
        "bandwidth_mbps_max": 3298.734562870036,
        "bandwidth_mbps_stddev": 11.9847,
        "retransmits_avg": 3164.6666666666665
      }
    },
    "overhead_single": {
      "bandwidth_pct": 65.69033983281672,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.221",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.221",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.600,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.86.16.70",
      "hops": [
        {
          "hop": 1,
          "host": "100.86.16.70",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.800,
          "avg_ms": 0.600,
          "best_ms": 0.500,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "k8s_config": {
      "cluster_name": "tailbench-eks",
      "k8s_version": "unknown",
      "cni": "aws-vpc-cni",
      "node_instance_type": "c2-standard-4",
      "pod_ip": "10.72.0.12"
    },
    "k8s_pod_to_ec2_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9565.36757307566,
          "retransmits": 236721,
          "duration_sec": 30.00007,
          "bytes_transferred": 35870212096
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9565.36757307566,
        "bandwidth_mbps_min": 9565.36757307566,
        "bandwidth_mbps_max": 9565.36757307566,
        "bandwidth_mbps_stddev": 0,
        "retransmits_avg": 236721
      }
    },
    "k8s_ec2_to_pod_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9726.46881990645,
          "retransmits": 0,
          "duration_sec": 30.000808,
          "bytes_transferred": 36475240448
        },
        {
          "bandwidth_mbps": 9702.88490426683,
          "retransmits": 0,
          "duration_sec": 30.000782,
          "bytes_transferred": 36386766848
        },
        {
          "bandwidth_mbps": 9754.4965837643,
          "retransmits": 0,
          "duration_sec": 30.000711,
          "bytes_transferred": 36580229120
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9727.950102645858,
        "bandwidth_mbps_min": 9702.88490426683,
        "bandwidth_mbps_max": 9754.4965837643,
        "bandwidth_mbps_stddev": 25.8377,
        "retransmits_avg": 0
      }
    },
    "k8s_overhead": {
      "pod_to_ec2_vs_baseline_pct": 0.7,
      "ec2_to_pod_vs_baseline_pct": -1.0
    },
    "k8s_tailscale_pod_to_ec2_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3312.303493107934,
          "retransmits": 53119,
          "duration_sec": 30.000075,
          "bytes_transferred": 12421169152
        },
        {
          "bandwidth_mbps": 3293.39202425859,
          "retransmits": 61662,
          "duration_sec": 30.000095,
          "bytes_transferred": 12350259200
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3302.8477586832623,
        "bandwidth_mbps_min": 3293.39202425859,
        "bandwidth_mbps_max": 3312.303493107934,
        "bandwidth_mbps_stddev": 13.3724,
        "retransmits_avg": 57390.5
      }
    },
    "k8s_tailscale_ec2_to_pod_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1131.1359202113886,
          "retransmits": 82,
          "duration_sec": 30.000873,
          "bytes_transferred": 4241883136
        },
        {
          "bandwidth_mbps": 1137.4036153242807,
          "retransmits": 24,
          "duration_sec": 30.000573,
          "bytes_transferred": 4265345024
        },
        {
          "bandwidth_mbps": 1091.5076679410708,
          "retransmits": 165,
          "duration_sec": 30.000687,
          "bytes_transferred": 4093247488
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1120.0157344922468,
        "bandwidth_mbps_min": 1091.5076679410708,
        "bandwidth_mbps_max": 1137.4036153242807,
        "bandwidth_mbps_stddev": 24.8868,
        "retransmits_avg": 90.33333333333333
      }
    },
    "k8s_tailscale_config": {
      "sidecar_ts_ip": "100.64.198.89",
      "mode": "kernel"
    },
    "k8s_tailscale_overhead": {
      "pod_to_ec2_vs_baseline_pct": 65.7,
      "ec2_to_pod_vs_baseline_pct": 88.4
    },
    "source": "gcp/c2/results/c2-standard-4.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c2",
    "instance_type": "c2-standard-8",
    "vcpus": 8,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c2-standard-8-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 16147.707649001391,
          "retransmits": 0,
          "duration_sec": 30.000609,
          "bytes_transferred": 60555132928
        },
        {
          "bandwidth_mbps": 16529.428082092814,
          "retransmits": 0,
          "duration_sec": 30.001603,
          "bytes_transferred": 61988667392
        },
        {
          "bandwidth_mbps": 16554.414984364674,
          "retransmits": 0,
          "duration_sec": 30.000658,
          "bytes_transferred": 62080417792
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 16410.51690515296,
        "bandwidth_mbps_min": 16147.707649001391,
        "bandwidth_mbps_max": 16554.414984364674,
        "bandwidth_mbps_stddev": 227.9421,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3343.6216001540997,
          "retransmits": 708,
          "duration_sec": 30.001323,
          "bytes_transferred": 12539133952
        },
        {
          "bandwidth_mbps": 3343.214852126007,
          "retransmits": 205,
          "duration_sec": 30.001523,
          "bytes_transferred": 12537692160
        },
        {
          "bandwidth_mbps": 3362.0505096603683,
          "retransmits": 536,
          "duration_sec": 30.001548,
          "bytes_transferred": 12608339968
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3349.628987313492,
        "bandwidth_mbps_min": 3343.214852126007,
        "bandwidth_mbps_max": 3362.0505096603683,
        "bandwidth_mbps_stddev": 10.7593,
        "retransmits_avg": 483
      }
    },
    "overhead": {
      "bandwidth_pct": 79.58852236847154,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 15138.873694917344,
          "retransmits": 0,
          "duration_sec": 30.001548,
          "bytes_transferred": 56773705728
        },
        {
          "bandwidth_mbps": 14806.148263821507,
          "retransmits": 0,
          "duration_sec": 30.001466,
          "bytes_transferred": 55525769216
        },
        {
          "bandwidth_mbps": 15217.973381107107,
          "retransmits": 0,
          "duration_sec": 30.001398,
          "bytes_transferred": 57070059520
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 15054.331779948652,
        "bandwidth_mbps_min": 14806.148263821507,
        "bandwidth_mbps_max": 15217.973381107107,
        "bandwidth_mbps_stddev": 218.5417,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3363.8528425917602,
          "retransmits": 282,
          "duration_sec": 30.001371,
          "bytes_transferred": 12615024640
        },
        {
          "bandwidth_mbps": 3422.623992090824,
          "retransmits": 399,
          "duration_sec": 30.000595,
          "bytes_transferred": 12835094528
        },
        {
          "bandwidth_mbps": 3441.735382694216,
          "retransmits": 838,
          "duration_sec": 30.000963,
          "bytes_transferred": 12906921984
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3409.4040724589336,
        "bandwidth_mbps_min": 3363.8528425917602,
        "bandwidth_mbps_max": 3441.735382694216,
        "bandwidth_mbps_stddev": 40.5894,
        "retransmits_avg": 506.3333333333333
      }
    },
    "overhead_single": {
      "bandwidth_pct": 77.35267083059755,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.17",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.17",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.124.51.20",
      "hops": [
        {
          "hop": 1,
          "host": "100.124.51.20",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 0.600,
          "best_ms": 0.400,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/c2/results/c2-standard-8.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c3",
    "instance_type": "c3-standard-4",
    "vcpus": 4,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-gcp",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c3-standard-4-server 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 20895.513311286017,
          "retransmits": 0,
          "duration_sec": 30.001534,
          "bytes_transferred": 78362181632
        },
        {
          "bandwidth_mbps": 21242.074938325928,
          "retransmits": 0,
          "duration_sec": 30.000857,
          "bytes_transferred": 79660056576
        },
        {
          "bandwidth_mbps": 21284.282493062386,
          "retransmits": 0,
          "duration_sec": 30.000581,
          "bytes_transferred": 79817605120
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21140.623580891446,
        "bandwidth_mbps_min": 20895.513311286017,
        "bandwidth_mbps_max": 21284.282493062386,
        "bandwidth_mbps_stddev": 213.3182,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5126.649942206327,
          "retransmits": 982,
          "duration_sec": 30.000689,
          "bytes_transferred": 19225378816
        },
        {
          "bandwidth_mbps": 5121.724945955742,
          "retransmits": 387,
          "duration_sec": 30.000875,
          "bytes_transferred": 19207028736
        },
        {
          "bandwidth_mbps": 5122.33953059917,
          "retransmits": 1226,
          "duration_sec": 30.001779,
          "bytes_transferred": 19209912320
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5123.571472920413,
        "bandwidth_mbps_min": 5121.724945955742,
        "bandwidth_mbps_max": 5126.649942206327,
        "bandwidth_mbps_stddev": 2.6837,
        "retransmits_avg": 865
      }
    },
    "overhead": {
      "bandwidth_pct": 75.7643313910972,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 21205.19678507078,
          "retransmits": 0,
          "duration_sec": 30.001407,
          "bytes_transferred": 79523217408
        },
        {
          "bandwidth_mbps": 21172.052417694707,
          "retransmits": 0,
          "duration_sec": 30.001472,
          "bytes_transferred": 79399092224
        },
        {
          "bandwidth_mbps": 21142.95042354163,
          "retransmits": 0,
          "duration_sec": 30.000711,
          "bytes_transferred": 79287943168
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21173.399875435705,
        "bandwidth_mbps_min": 21142.95042354163,
        "bandwidth_mbps_max": 21205.19678507078,
        "bandwidth_mbps_stddev": 31.1450,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4936.025320404075,
          "retransmits": 485,
          "duration_sec": 30.001101,
          "bytes_transferred": 18510774272
        },
        {
          "bandwidth_mbps": 4940.99376053394,
          "retransmits": 1106,
          "duration_sec": 30.000644,
          "bytes_transferred": 18529124352
        },
        {
          "bandwidth_mbps": 4942.03822454414,
          "retransmits": 1608,
          "duration_sec": 30.000881,
          "bytes_transferred": 18533187584
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4939.685768494051,
        "bandwidth_mbps_min": 4936.025320404075,
        "bandwidth_mbps_max": 4942.03822454414,
        "bandwidth_mbps_stddev": 3.2128,
        "retransmits_avg": 1066.3333333333333
      }
    },
    "overhead_single": {
      "bandwidth_pct": 76.6703231528498,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.220",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.220",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.126.252.22",
      "hops": [
        {
          "hop": 1,
          "host": "100.126.252.22",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.600,
          "best_ms": 0.500,
          "worst_ms": 1.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "k8s_config": {
      "cluster_name": "tailbench-eks",
      "k8s_version": "unknown",
      "cni": "aws-vpc-cni",
      "node_instance_type": "c3-standard-4",
      "pod_ip": "10.72.0.12"
    },
    "k8s_pod_to_ec2_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 21083.640325318804,
          "retransmits": 247022,
          "duration_sec": 30.00011,
          "bytes_transferred": 79063941120
        },
        {
          "bandwidth_mbps": 21057.968557688037,
          "retransmits": 801478,
          "duration_sec": 30.000084,
          "bytes_transferred": 78967603200
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21070.80444150342,
        "bandwidth_mbps_min": 21057.968557688037,
        "bandwidth_mbps_max": 21083.640325318804,
        "bandwidth_mbps_stddev": 18.1527,
        "retransmits_avg": 524250
      }
    },
    "k8s_ec2_to_pod_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 20526.73002721195,
          "retransmits": 3,
          "duration_sec": 30.000794,
          "bytes_transferred": 76977274880
        },
        {
          "bandwidth_mbps": 20475.153159079768,
          "retransmits": 210,
          "duration_sec": 30.000572,
          "bytes_transferred": 76783288320
        },
        {
          "bandwidth_mbps": 21152.421630526635,
          "retransmits": 0,
          "duration_sec": 30.000712,
          "bytes_transferred": 79323463680
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 20718.101605606116,
        "bandwidth_mbps_min": 20475.153159079768,
        "bandwidth_mbps_max": 21152.421630526635,
        "bandwidth_mbps_stddev": 377.0152,
        "retransmits_avg": 71
      }
    },
    "k8s_overhead": {
      "pod_to_ec2_vs_baseline_pct": 0.3,
      "ec2_to_pod_vs_baseline_pct": 2.0
    },
    "k8s_tailscale_pod_to_ec2_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5070.4110174646885,
          "retransmits": 4103,
          "duration_sec": 30.000078,
          "bytes_transferred": 19014090752
        },
        {
          "bandwidth_mbps": 5094.909113199927,
          "retransmits": 3218,
          "duration_sec": 30.000099,
          "bytes_transferred": 19105972224
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5082.660065332308,
        "bandwidth_mbps_min": 5070.4110174646885,
        "bandwidth_mbps_max": 5094.909113199927,
        "bandwidth_mbps_stddev": 17.3228,
        "retransmits_avg": 3660.5
      }
    },
    "k8s_tailscale_ec2_to_pod_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1567.9329626777971,
          "retransmits": 1003,
          "duration_sec": 30.000721,
          "bytes_transferred": 5879889920
        },
        {
          "bandwidth_mbps": 1572.6595664895121,
          "retransmits": 178,
          "duration_sec": 30.000566,
          "bytes_transferred": 5897584640
        },
        {
          "bandwidth_mbps": 1582.781628948878,
          "retransmits": 2101,
          "duration_sec": 30.000831,
          "bytes_transferred": 5935595520
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1574.4580527053959,
        "bandwidth_mbps_min": 1567.9329626777971,
        "bandwidth_mbps_max": 1582.781628948878,
        "bandwidth_mbps_stddev": 7.5859,
        "retransmits_avg": 1094
      }
    },
    "k8s_tailscale_config": {
      "sidecar_ts_ip": "100.111.194.15",
      "mode": "kernel"
    },
    "k8s_tailscale_overhead": {
      "pod_to_ec2_vs_baseline_pct": 76.0,
      "ec2_to_pod_vs_baseline_pct": 92.6
    },
    "source": "gcp/c3/results/c3-standard-4.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c3",
    "instance_type": "c3-standard-8",
    "vcpus": 8,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c3-standard-8-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 20899.1391330587,
          "retransmits": 0,
          "duration_sec": 30.001547,
          "bytes_transferred": 78375813120
        },
        {
          "bandwidth_mbps": 21415.572641248255,
          "retransmits": 0,
          "duration_sec": 30.001398,
          "bytes_transferred": 80312139776
        },
        {
          "bandwidth_mbps": 21277.55798936763,
          "retransmits": 2,
          "duration_sec": 30.001586,
          "bytes_transferred": 79795060736
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21197.423254558194,
        "bandwidth_mbps_min": 20899.1391330587,
        "bandwidth_mbps_max": 21415.572641248255,
        "bandwidth_mbps_stddev": 267.3800,
        "retransmits_avg": 0.6666666666666666
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5453.642351897466,
          "retransmits": 484,
          "duration_sec": 30.001546,
          "bytes_transferred": 20452212736
        },
        {
          "bandwidth_mbps": 5511.0372337259,
          "retransmits": 49,
          "duration_sec": 30.001134,
          "bytes_transferred": 20667170816
        },
        {
          "bandwidth_mbps": 5518.72815537249,
          "retransmits": 2281,
          "duration_sec": 30.000935,
          "bytes_transferred": 20695875584
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5494.4692469986185,
        "bandwidth_mbps_min": 5453.642351897466,
        "bandwidth_mbps_max": 5518.72815537249,
        "bandwidth_mbps_stddev": 35.5656,
        "retransmits_avg": 938
      }
    },
    "overhead": {
      "bandwidth_pct": 74.07954173950311,
      "retransmits_pct": 140600.00000000003
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 21145.94817421838,
          "retransmits": 0,
          "duration_sec": 30.001863,
          "bytes_transferred": 79302230016
        },
        {
          "bandwidth_mbps": 21084.345917302908,
          "retransmits": 0,
          "duration_sec": 30.001344,
          "bytes_transferred": 79069839360
        },
        {
          "bandwidth_mbps": 20612.72452114798,
          "retransmits": 0,
          "duration_sec": 30.001283,
          "bytes_transferred": 77301022720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 20947.672870889757,
        "bandwidth_mbps_min": 20612.72452114798,
        "bandwidth_mbps_max": 21145.94817421838,
        "bandwidth_mbps_stddev": 291.7045,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5370.379592213192,
          "retransmits": 1908,
          "duration_sec": 30.000431,
          "bytes_transferred": 20139212800
        },
        {
          "bandwidth_mbps": 5363.8273799922845,
          "retransmits": 1906,
          "duration_sec": 30.000717,
          "bytes_transferred": 20114833408
        },
        {
          "bandwidth_mbps": 5322.799586132181,
          "retransmits": 2936,
          "duration_sec": 30.000883,
          "bytes_transferred": 19961085952
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5352.335519445885,
        "bandwidth_mbps_min": 5322.799586132181,
        "bandwidth_mbps_max": 5370.379592213192,
        "bandwidth_mbps_stddev": 25.7878,
        "retransmits_avg": 2250
      }
    },
    "overhead_single": {
      "bandwidth_pct": 74.44902088917075,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.23",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.23",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.600,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.104.215.98",
      "hops": [
        {
          "hop": 1,
          "host": "100.104.215.98",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.600,
          "best_ms": 0.500,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/c3/results/c3-standard-8.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-8",
    "vcpus": 8,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c3d-standard-8-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 18191.940348741635,
          "retransmits": 0,
          "duration_sec": 30.00158,
          "bytes_transferred": 68223369216
        },
        {
          "bandwidth_mbps": 18603.99852782,
          "retransmits": 1,
          "duration_sec": 30.001766,
          "bytes_transferred": 69769101312
        },
        {
          "bandwidth_mbps": 18343.549927179138,
          "retransmits": 0,
          "duration_sec": 30.001705,
          "bytes_transferred": 68792221696
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18379.82960124692,
        "bandwidth_mbps_min": 18191.940348741635,
        "bandwidth_mbps_max": 18603.99852782,
        "bandwidth_mbps_stddev": 208.4110,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4871.677872322908,
          "retransmits": 0,
          "duration_sec": 30.001545,
          "bytes_transferred": 18269732864
        },
        {
          "bandwidth_mbps": 4920.620659545665,
          "retransmits": 591,
          "duration_sec": 30.000834,
          "bytes_transferred": 18452840448
        },
        {
          "bandwidth_mbps": 4889.989796517665,
          "retransmits": 56,
          "duration_sec": 30.00113,
          "bytes_transferred": 18338152448
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4894.09610946208,
        "bandwidth_mbps_min": 4871.677872322908,
        "bandwidth_mbps_max": 4920.620659545665,
        "bandwidth_mbps_stddev": 24.7284,
        "retransmits_avg": 215.66666666666666
      }
    },
    "overhead": {
      "bandwidth_pct": 73.3724620105833,
      "retransmits_pct": 64600
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 13997.897488936218,
          "retransmits": 0,
          "duration_sec": 30.001269,
          "bytes_transferred": 52494336000
        },
        {
          "bandwidth_mbps": 11881.045662810166,
          "retransmits": 0,
          "duration_sec": 30.001373,
          "bytes_transferred": 44555960320
        },
        {
          "bandwidth_mbps": 11657.402000783695,
          "retransmits": 0,
          "duration_sec": 30.001444,
          "bytes_transferred": 43717361664
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12512.115050843358,
        "bandwidth_mbps_min": 11657.402000783695,
        "bandwidth_mbps_max": 13997.897488936218,
        "bandwidth_mbps_stddev": 1291.5751,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4879.744429978767,
          "retransmits": 0,
          "duration_sec": 30.000514,
          "bytes_transferred": 18299355136
        },
        {
          "bandwidth_mbps": 4899.071724119495,
          "retransmits": 0,
          "duration_sec": 30.001163,
          "bytes_transferred": 18372231168
        },
        {
          "bandwidth_mbps": 4919.932842878526,
          "retransmits": 216,
          "duration_sec": 30.001405,
          "bytes_transferred": 18450612224
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4899.582998992263,
        "bandwidth_mbps_min": 4879.744429978767,
        "bandwidth_mbps_max": 4919.932842878526,
        "bandwidth_mbps_stddev": 20.0991,
        "retransmits_avg": 72
      }
    },
    "overhead_single": {
      "bandwidth_pct": 60.84128879024322,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.13",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.13",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.105.118.87",
      "hops": [
        {
          "hop": 1,
          "host": "100.105.118.87",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.600,
          "best_ms": 0.500,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/c3d/results/c3d-standard-8.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c4",
    "instance_type": "c4-standard-2",
    "vcpus": 2,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4-standard-2-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9468.2841703135,
          "retransmits": 0,
          "duration_sec": 30.00091,
          "bytes_transferred": 35507142656
        },
        {
          "bandwidth_mbps": 9470.41575483764,
          "retransmits": 0,
          "duration_sec": 30.00069,
          "bytes_transferred": 35514875904
        },
        {
          "bandwidth_mbps": 9467.994065008515,
          "retransmits": 0,
          "duration_sec": 30.001054,
          "bytes_transferred": 35506225152
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9468.897996719885,
        "bandwidth_mbps_min": 9467.994065008515,
        "bandwidth_mbps_max": 9470.41575483764,
        "bandwidth_mbps_stddev": 1.3224,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4503.570619098412,
          "retransmits": 0,
          "duration_sec": 30.001353,
          "bytes_transferred": 16889151488
        },
        {
          "bandwidth_mbps": 4465.919388568031,
          "retransmits": 0,
          "duration_sec": 30.001179,
          "bytes_transferred": 16747855872
        },
        {
          "bandwidth_mbps": 4493.076083862416,
          "retransmits": 0,
          "duration_sec": 30.000948,
          "bytes_transferred": 16849567744
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4487.522030509619,
        "bandwidth_mbps_min": 4465.919388568031,
        "bandwidth_mbps_max": 4503.570619098412,
        "bandwidth_mbps_stddev": 19.4304,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 52.60776880198584,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9436.0801827729,
          "retransmits": 0,
          "duration_sec": 30.000509,
          "bytes_transferred": 35385901056
        },
        {
          "bandwidth_mbps": 9435.994198925395,
          "retransmits": 0,
          "duration_sec": 30.001338,
          "bytes_transferred": 35386556416
        },
        {
          "bandwidth_mbps": 9433.61368853632,
          "retransmits": 0,
          "duration_sec": 30.000461,
          "bytes_transferred": 35376594944
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9435.22935674487,
        "bandwidth_mbps_min": 9433.61368853632,
        "bandwidth_mbps_max": 9436.0801827729,
        "bandwidth_mbps_stddev": 1.3999,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4479.435444903933,
          "retransmits": 0,
          "duration_sec": 30.000544,
          "bytes_transferred": 16798187520
        },
        {
          "bandwidth_mbps": 4476.435098523925,
          "retransmits": 0,
          "duration_sec": 30.001444,
          "bytes_transferred": 16787439616
        },
        {
          "bandwidth_mbps": 4482.994771346137,
          "retransmits": 0,
          "duration_sec": 30.001986,
          "bytes_transferred": 16812343296
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4479.621771591332,
        "bandwidth_mbps_min": 4476.435098523925,
        "bandwidth_mbps_max": 4482.994771346137,
        "bandwidth_mbps_stddev": 3.2838,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 52.522386025634574,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.232",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.232",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.79.157.91",
      "hops": [
        {
          "hop": 1,
          "host": "100.79.157.91",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.600,
          "best_ms": 0.300,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/c4/results/c4-standard-2.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c4",
    "instance_type": "c4-standard-4",
    "vcpus": 4,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-gcp",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4-standard-4-server 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 21942.95655499009,
          "retransmits": 0,
          "duration_sec": 30.001098,
          "bytes_transferred": 82289098752
        },
        {
          "bandwidth_mbps": 21727.518760766656,
          "retransmits": 0,
          "duration_sec": 30.000613,
          "bytes_transferred": 81479860224
        },
        {
          "bandwidth_mbps": 21976.281111524102,
          "retransmits": 0,
          "duration_sec": 30.000933,
          "bytes_transferred": 82413617152
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21882.25214242695,
        "bandwidth_mbps_min": 21727.518760766656,
        "bandwidth_mbps_max": 21976.281111524102,
        "bandwidth_mbps_stddev": 135.0350,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5824.33736288318,
          "retransmits": 0,
          "duration_sec": 30.000787,
          "bytes_transferred": 21841838080
        },
        {
          "bandwidth_mbps": 5817.8421799156595,
          "retransmits": 0,
          "duration_sec": 30.000757,
          "bytes_transferred": 21817458688
        },
        {
          "bandwidth_mbps": 5815.965623289862,
          "retransmits": 0,
          "duration_sec": 30.001242,
          "bytes_transferred": 21810774016
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5819.381722029568,
        "bandwidth_mbps_min": 5815.965623289862,
        "bandwidth_mbps_max": 5824.33736288318,
        "bandwidth_mbps_stddev": 4.3931,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 73.40592876751239,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 20839.774068850325,
          "retransmits": 0,
          "duration_sec": 30.000467,
          "bytes_transferred": 78150369280
        },
        {
          "bandwidth_mbps": 20726.58068546546,
          "retransmits": 0,
          "duration_sec": 30.000899,
          "bytes_transferred": 77727006720
        },
        {
          "bandwidth_mbps": 20880.357352437608,
          "retransmits": 0,
          "duration_sec": 30.000411,
          "bytes_transferred": 78302412800
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 20815.57070225113,
        "bandwidth_mbps_min": 20726.58068546546,
        "bandwidth_mbps_max": 20880.357352437608,
        "bandwidth_mbps_stddev": 79.6942,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5566.779576205072,
          "retransmits": 0,
          "duration_sec": 30.000595,
          "bytes_transferred": 20875837440
        },
        {
          "bandwidth_mbps": 5598.891866332818,
          "retransmits": 344,
          "duration_sec": 30.000453,
          "bytes_transferred": 20996161536
        },
        {
          "bandwidth_mbps": 5597.363991523578,
          "retransmits": 377,
          "duration_sec": 30.001336,
          "bytes_transferred": 20991049728
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5587.678478020488,
        "bandwidth_mbps_min": 5566.779576205072,
        "bandwidth_mbps_max": 5598.891866332818,
        "bandwidth_mbps_stddev": 18.1151,
        "retransmits_avg": 240.33333333333334
      }
    },
    "overhead_single": {
      "bandwidth_pct": 73.15625616060481,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.240",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.240",
          "loss_pct": 1.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.75.185.91",
      "hops": [
        {
          "hop": 1,
          "host": "100.75.185.91",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.800,
          "avg_ms": 0.700,
          "best_ms": 0.400,
          "worst_ms": 1.000,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/c4/results/c4-standard-4.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c4",
    "instance_type": "c4-standard-8",
    "vcpus": 8,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4-standard-8-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 21972.500211258353,
          "retransmits": 0,
          "duration_sec": 30.00118,
          "bytes_transferred": 82400116736
        },
        {
          "bandwidth_mbps": 21948.827426292457,
          "retransmits": 0,
          "duration_sec": 30.000526,
          "bytes_transferred": 82309545984
        },
        {
          "bandwidth_mbps": 21973.683601623357,
          "retransmits": 0,
          "duration_sec": 30.000805,
          "bytes_transferred": 82403524608
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21965.00374639139,
        "bandwidth_mbps_min": 21948.827426292457,
        "bandwidth_mbps_max": 21973.683601623357,
        "bandwidth_mbps_stddev": 14.0216,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6196.956459684987,
          "retransmits": 0,
          "duration_sec": 30.000449,
          "bytes_transferred": 23238934528
        },
        {
          "bandwidth_mbps": 6175.8715015022,
          "retransmits": 0,
          "duration_sec": 30.000662,
          "bytes_transferred": 23160029184
        },
        {
          "bandwidth_mbps": 6174.1164363713015,
          "retransmits": 0,
          "duration_sec": 30.001038,
          "bytes_transferred": 23153737728
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6182.314799186162,
        "bandwidth_mbps_min": 6174.1164363713015,
        "bandwidth_mbps_max": 6196.956459684987,
        "bandwidth_mbps_stddev": 12.7104,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 71.85379583556025,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 21687.3304177258,
          "retransmits": 0,
          "duration_sec": 30.001523,
          "bytes_transferred": 81331617792
        },
        {
          "bandwidth_mbps": 21828.174673353667,
          "retransmits": 0,
          "duration_sec": 30.001485,
          "bytes_transferred": 81859706880
        },
        {
          "bandwidth_mbps": 20796.09547522339,
          "retransmits": 0,
          "duration_sec": 30.001459,
          "bytes_transferred": 77989150720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21437.20018876762,
        "bandwidth_mbps_min": 20796.09547522339,
        "bandwidth_mbps_max": 21828.174673353667,
        "bandwidth_mbps_stddev": 559.6613,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5804.497478441028,
          "retransmits": 0,
          "duration_sec": 30.001083,
          "bytes_transferred": 21767651328
        },
        {
          "bandwidth_mbps": 5928.632788712083,
          "retransmits": 0,
          "duration_sec": 30.000788,
          "bytes_transferred": 22232956928
        },
        {
          "bandwidth_mbps": 5928.35631272864,
          "retransmits": 0,
          "duration_sec": 30.000949,
          "bytes_transferred": 22232039424
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5887.162193293917,
        "bandwidth_mbps_min": 5804.497478441028,
        "bandwidth_mbps_max": 5928.632788712083,
        "bandwidth_mbps_stddev": 71.5899,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 72.53763485224813,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.12",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.12",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.84.173.26",
      "hops": [
        {
          "hop": 1,
          "host": "100.84.173.26",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.800,
          "avg_ms": 0.800,
          "best_ms": 0.400,
          "worst_ms": 1.100,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "gcp/c4/results/c4-standard-8.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-1",
    "vcpus": 1,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4a-standard-1-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:07:57 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9033.628787304557,
          "retransmits": 2607,
          "duration_sec": 30.000558,
          "bytes_transferred": 33876738048
        },
        {
          "bandwidth_mbps": 9238.807736172315,
          "retransmits": 46,
          "duration_sec": 30.000521,
          "bytes_transferred": 34646130688
        },
        {
          "bandwidth_mbps": 9260.685789952955,
          "retransmits": 0,
          "duration_sec": 30.000527,
          "bytes_transferred": 34728181760
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9177.707437809942,
        "bandwidth_mbps_min": 9033.628787304557,
        "bandwidth_mbps_max": 9260.685789952955,
        "bandwidth_mbps_stddev": 125.2544,
        "retransmits_avg": 884.3333333333334
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2035.1056046989981,
          "retransmits": 637,
          "duration_sec": 30.001629,
          "bytes_transferred": 7632060416
        },
        {
          "bandwidth_mbps": 2021.1790158413457,
          "retransmits": 0,
          "duration_sec": 30.00187,
          "bytes_transferred": 7579893760
        },
        {
          "bandwidth_mbps": 2018.6832761806331,
          "retransmits": 0,
          "duration_sec": 30.002082,
          "bytes_transferred": 7570587648
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2024.9892989069922,
        "bandwidth_mbps_min": 2018.6832761806331,
        "bandwidth_mbps_max": 2035.1056046989981,
        "bandwidth_mbps_stddev": 8.8494,
        "retransmits_avg": 212.33333333333334
      }
    },
    "overhead": {
      "bandwidth_pct": 77.9357828452395,
      "retransmits_pct": -75.98944591029023
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9144.481936128375,
          "retransmits": 0,
          "duration_sec": 30.00049,
          "bytes_transferred": 34292367360
        },
        {
          "bandwidth_mbps": 9170.27729595229,
          "retransmits": 0,
          "duration_sec": 30.000373,
          "bytes_transferred": 34388967424
        },
        {
          "bandwidth_mbps": 9165.001487542817,
          "retransmits": 0,
          "duration_sec": 30.000481,
          "bytes_transferred": 34369306624
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9159.920239874495,
        "bandwidth_mbps_min": 9144.481936128375,
        "bandwidth_mbps_max": 9170.27729595229,
        "bandwidth_mbps_stddev": 13.6277,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2012.1887859620736,
          "retransmits": 0,
          "duration_sec": 30.001468,
          "bytes_transferred": 7546077184
        },
        {
          "bandwidth_mbps": 2005.8876088616287,
          "retransmits": 0,
          "duration_sec": 30.001618,
          "bytes_transferred": 7522484224
        },
        {
          "bandwidth_mbps": 2012.72525824393,
          "retransmits": 0,
          "duration_sec": 30.001286,
          "bytes_transferred": 7548043264
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2010.2672176892108,
        "bandwidth_mbps_min": 2005.8876088616287,
        "bandwidth_mbps_max": 2012.72525824393,
        "bandwidth_mbps_stddev": 3.8023,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 78.05366023889357,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.240",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.240",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.120.26.5",
      "hops": [
        {
          "hop": 1,
          "host": "100.120.26.5",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.300,
          "best_ms": 0.300,
          "worst_ms": 1.200,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/c4a/results/c4a-standard-1.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-2",
    "vcpus": 2,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4a-standard-2-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:07:57 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9112.47919179459,
          "retransmits": 1299,
          "duration_sec": 30.001482,
          "bytes_transferred": 34173485056
        },
        {
          "bandwidth_mbps": 9199.252883209003,
          "retransmits": 46,
          "duration_sec": 30.0006,
          "bytes_transferred": 34497888256
        },
        {
          "bandwidth_mbps": 9202.61287791115,
          "retransmits": 0,
          "duration_sec": 30.000471,
          "bytes_transferred": 34510340096
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9171.448317638247,
        "bandwidth_mbps_min": 9112.47919179459,
        "bandwidth_mbps_max": 9202.61287791115,
        "bandwidth_mbps_stddev": 51.0964,
        "retransmits_avg": 448.3333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3778.257646616601,
          "retransmits": 1735,
          "duration_sec": 30.000883,
          "bytes_transferred": 14168883200
        },
        {
          "bandwidth_mbps": 3765.738594258532,
          "retransmits": 0,
          "duration_sec": 30.001491,
          "bytes_transferred": 14122221568
        },
        {
          "bandwidth_mbps": 3749.491180392812,
          "retransmits": 0,
          "duration_sec": 30.001733,
          "bytes_transferred": 14061404160
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3764.495807089315,
        "bandwidth_mbps_min": 3749.491180392812,
        "bandwidth_mbps_max": 3778.257646616601,
        "bandwidth_mbps_stddev": 14.4234,
        "retransmits_avg": 578.3333333333334
      }
    },
    "overhead": {
      "bandwidth_pct": 58.95418393352823,
      "retransmits_pct": 28.996282527881057
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9215.07083547025,
          "retransmits": 0,
          "duration_sec": 30.000422,
          "bytes_transferred": 34557001728
        },
        {
          "bandwidth_mbps": 9159.40795063813,
          "retransmits": 0,
          "duration_sec": 30.000485,
          "bytes_transferred": 34348335104
        },
        {
          "bandwidth_mbps": 9158.831444579,
          "retransmits": 0,
          "duration_sec": 30.001343,
          "bytes_transferred": 34347155456
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9177.770076895793,
        "bandwidth_mbps_min": 9158.831444579,
        "bandwidth_mbps_max": 9215.07083547025,
        "bandwidth_mbps_stddev": 32.3047,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3584.990585113225,
          "retransmits": 0,
          "duration_sec": 30.000467,
          "bytes_transferred": 13443923968
        },
        {
          "bandwidth_mbps": 3566.282836717529,
          "retransmits": 0,
          "duration_sec": 30.001126,
          "bytes_transferred": 13374062592
        },
        {
          "bandwidth_mbps": 3564.2448547337262,
          "retransmits": 0,
          "duration_sec": 30.001217,
          "bytes_transferred": 13366460416
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3571.8394255214935,
        "bandwidth_mbps_min": 3564.2448547337262,
        "bandwidth_mbps_max": 3584.990585113225,
        "bandwidth_mbps_stddev": 11.4347,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 61.08162009295399,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.223",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.223",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.500,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.115.99.115",
      "hops": [
        {
          "hop": 1,
          "host": "100.115.99.115",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.300,
          "best_ms": 0.200,
          "worst_ms": 0.500,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/c4a/results/c4a-standard-2.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-4",
    "vcpus": 4,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4a-standard-4-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:07:57 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 20790.669296003864,
          "retransmits": 0,
          "duration_sec": 30.000463,
          "bytes_transferred": 77966213120
        },
        {
          "bandwidth_mbps": 21070.581224121965,
          "retransmits": 0,
          "duration_sec": 30.000589,
          "bytes_transferred": 79016230912
        },
        {
          "bandwidth_mbps": 20995.4417511742,
          "retransmits": 1042,
          "duration_sec": 30.000579,
          "bytes_transferred": 78734426112
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 20952.23075710001,
        "bandwidth_mbps_min": 20790.669296003864,
        "bandwidth_mbps_max": 21070.581224121965,
        "bandwidth_mbps_stddev": 144.8726,
        "retransmits_avg": 347.3333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5374.107361756143,
          "retransmits": 0,
          "duration_sec": 30.001279,
          "bytes_transferred": 20153761792
        },
        {
          "bandwidth_mbps": 5347.366298126514,
          "retransmits": 0,
          "duration_sec": 30.001887,
          "bytes_transferred": 20053884928
        },
        {
          "bandwidth_mbps": 5346.19960644363,
          "retransmits": 0,
          "duration_sec": 30.000785,
          "bytes_transferred": 20048773120
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5355.891088775429,
        "bandwidth_mbps_min": 5346.19960644363,
        "bandwidth_mbps_max": 5374.107361756143,
        "bandwidth_mbps_stddev": 15.7865,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 74.43760928911831,
      "retransmits_pct": -100
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 21046.231575927166,
          "retransmits": 0,
          "duration_sec": 30.001469,
          "bytes_transferred": 78927233024
        },
        {
          "bandwidth_mbps": 21042.444033736152,
          "retransmits": 0,
          "duration_sec": 30.001288,
          "bytes_transferred": 78912552960
        },
        {
          "bandwidth_mbps": 21044.20912146265,
          "retransmits": 1,
          "duration_sec": 30.001263,
          "bytes_transferred": 78919106560
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21044.294910375324,
        "bandwidth_mbps_min": 21042.444033736152,
        "bandwidth_mbps_max": 21046.231575927166,
        "bandwidth_mbps_stddev": 1.8952,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4855.855072792257,
          "retransmits": 0,
          "duration_sec": 30.001268,
          "bytes_transferred": 18210226176
        },
        {
          "bandwidth_mbps": 4834.009266473668,
          "retransmits": 0,
          "duration_sec": 30.000409,
          "bytes_transferred": 18127781888
        },
        {
          "bandwidth_mbps": 4835.030871827315,
          "retransmits": 0,
          "duration_sec": 30.00101,
          "bytes_transferred": 18131976192
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4841.63173703108,
        "bandwidth_mbps_min": 4834.009266473668,
        "bandwidth_mbps_max": 4855.855072792257,
        "bandwidth_mbps_stddev": 12.3284,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 76.99313872167775,
      "retransmits_pct": -100
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.198",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.198",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.126.126.86",
      "hops": [
        {
          "hop": 1,
          "host": "100.126.126.86",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.300,
          "best_ms": 0.300,
          "worst_ms": 0.600,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "gcp/c4a/results/c4a-standard-4.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "n2",
    "instance_type": "n2-standard-16",
    "vcpus": 16,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n2-standard-16-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 31014.982624069835,
          "retransmits": 930,
          "duration_sec": 30.001732,
          "bytes_transferred": 116312899584
        },
        {
          "bandwidth_mbps": 31261.990510577285,
          "retransmits": 0,
          "duration_sec": 30.000982,
          "bytes_transferred": 117236301824
        },
        {
          "bandwidth_mbps": 28256.801901471226,
          "retransmits": 0,
          "duration_sec": 30.001611,
          "bytes_transferred": 105968697344
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 30177.925012039446,
        "bandwidth_mbps_min": 28256.801901471226,
        "bandwidth_mbps_max": 31261.990510577285,
        "bandwidth_mbps_stddev": 1668.3191,
        "retransmits_avg": 310
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3744.8939394338363,
          "retransmits": 7564,
          "duration_sec": 30.001603,
          "bytes_transferred": 14044102656
        },
        {
          "bandwidth_mbps": 3937.087694369974,
          "retransmits": 5826,
          "duration_sec": 30.001869,
          "bytes_transferred": 14764998656
        },
        {
          "bandwidth_mbps": 3872.944271639261,
          "retransmits": 6315,
          "duration_sec": 30.001672,
          "bytes_transferred": 14524350464
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3851.641968481024,
        "bandwidth_mbps_min": 3744.8939394338363,
        "bandwidth_mbps_max": 3937.087694369974,
        "bandwidth_mbps_stddev": 97.8517,
        "retransmits_avg": 6568.333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 87.23688932574251,
      "retransmits_pct": 2018.8172043010752
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 12111.917169516732,
          "retransmits": 0,
          "duration_sec": 30.001322,
          "bytes_transferred": 45421690880
        },
        {
          "bandwidth_mbps": 12220.606204195592,
          "retransmits": 0,
          "duration_sec": 30.001343,
          "bytes_transferred": 45829324800
        },
        {
          "bandwidth_mbps": 11826.145103753843,
          "retransmits": 0,
          "duration_sec": 30.001443,
          "bytes_transferred": 44350177280
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12052.889492488723,
        "bandwidth_mbps_min": 11826.145103753843,
        "bandwidth_mbps_max": 12220.606204195592,
        "bandwidth_mbps_stddev": 203.7476,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3646.4657470687844,
          "retransmits": 3166,
          "duration_sec": 30.001374,
          "bytes_transferred": 13674872832
        },
        {
          "bandwidth_mbps": 3761.864196830487,
          "retransmits": 2961,
          "duration_sec": 30.00145,
          "bytes_transferred": 14107672576
        },
        {
          "bandwidth_mbps": 3776.1602186195696,
          "retransmits": 1815,
          "duration_sec": 30.000608,
          "bytes_transferred": 14160887808
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3728.16338750628,
        "bandwidth_mbps_min": 3646.4657470687844,
        "bandwidth_mbps_max": 3776.1602186195696,
        "bandwidth_mbps_stddev": 71.1124,
        "retransmits_avg": 2647.3333333333335
      }
    },
    "overhead_single": {
      "bandwidth_pct": 69.06830192187819,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.213",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.213",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.82.69.10",
      "hops": [
        {
          "hop": 1,
          "host": "100.82.69.10",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.000,
          "avg_ms": 0.900,
          "best_ms": 0.700,
          "worst_ms": 1.200,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/n2/results/n2-standard-16.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "n2",
    "instance_type": "n2-standard-2",
    "vcpus": 2,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n2-standard-2-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9281.676339816266,
          "retransmits": 0,
          "duration_sec": 30.001707,
          "bytes_transferred": 34808266752
        },
        {
          "bandwidth_mbps": 9710.763572610509,
          "retransmits": 0,
          "duration_sec": 30.000953,
          "bytes_transferred": 36416520192
        },
        {
          "bandwidth_mbps": 9713.43247617673,
          "retransmits": 0,
          "duration_sec": 30.00113,
          "bytes_transferred": 36426743808
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9568.6241295345,
        "bandwidth_mbps_min": 9281.676339816266,
        "bandwidth_mbps_max": 9713.43247617673,
        "bandwidth_mbps_stddev": 248.5077,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2328.035371010637,
          "retransmits": 763,
          "duration_sec": 30.00197,
          "bytes_transferred": 8730705920
        },
        {
          "bandwidth_mbps": 2389.9636085109614,
          "retransmits": 860,
          "duration_sec": 30.002015,
          "bytes_transferred": 8962965504
        },
        {
          "bandwidth_mbps": 2301.2139130286396,
          "retransmits": 1721,
          "duration_sec": 30.003072,
          "bytes_transferred": 8630435840
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2339.7376308500793,
        "bandwidth_mbps_min": 2301.2139130286396,
        "bandwidth_mbps_max": 2389.9636085109614,
        "bandwidth_mbps_stddev": 45.5174,
        "retransmits_avg": 1114.6666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 75.54781545208523,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9677.707622445727,
          "retransmits": 0,
          "duration_sec": 30.001578,
          "bytes_transferred": 36293312512
        },
        {
          "bandwidth_mbps": 9674.575231427316,
          "retransmits": 0,
          "duration_sec": 30.001212,
          "bytes_transferred": 36281122816
        },
        {
          "bandwidth_mbps": 9660.32846512413,
          "retransmits": 0,
          "duration_sec": 30.000628,
          "bytes_transferred": 36226990080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9670.870439665725,
        "bandwidth_mbps_min": 9660.32846512413,
        "bandwidth_mbps_max": 9677.707622445727,
        "bandwidth_mbps_stddev": 9.2630,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2222.159489644125,
          "retransmits": 1462,
          "duration_sec": 30.001183,
          "bytes_transferred": 8333426688
        },
        {
          "bandwidth_mbps": 2327.4228267262765,
          "retransmits": 325,
          "duration_sec": 30.001306,
          "bytes_transferred": 8728215552
        },
        {
          "bandwidth_mbps": 2385.342663391738,
          "retransmits": 598,
          "duration_sec": 30.00167,
          "bytes_transferred": 8945532928
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2311.641659920713,
        "bandwidth_mbps_min": 2222.159489644125,
        "bandwidth_mbps_max": 2385.342663391738,
        "bandwidth_mbps_stddev": 82.7283,
        "retransmits_avg": 795
      }
    },
    "overhead_single": {
      "bandwidth_pct": 76.09686041869242,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.57",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.57",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.93.8.95",
      "hops": [
        {
          "hop": 1,
          "host": "100.93.8.95",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.200,
          "avg_ms": 1.000,
          "best_ms": 0.700,
          "worst_ms": 1.400,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/n2/results/n2-standard-2.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "n2",
    "instance_type": "n2-standard-32",
    "vcpus": 32,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n2-standard-32-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 23037.118402830398,
          "retransmits": 200,
          "duration_sec": 30.001673,
          "bytes_transferred": 86394011648
        },
        {
          "bandwidth_mbps": 23896.10298962483,
          "retransmits": 0,
          "duration_sec": 30.001624,
          "bytes_transferred": 89615237120
        },
        {
          "bandwidth_mbps": 30490.177084381885,
          "retransmits": 0,
          "duration_sec": 30.001652,
          "bytes_transferred": 114344460288
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 25807.79949227904,
        "bandwidth_mbps_min": 23037.118402830398,
        "bandwidth_mbps_max": 30490.177084381885,
        "bandwidth_mbps_stddev": 4077.7394,
        "retransmits_avg": 66.66666666666667
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3913.4976389795597,
          "retransmits": 8671,
          "duration_sec": 30.001858,
          "bytes_transferred": 14676525056
        },
        {
          "bandwidth_mbps": 3853.792121544184,
          "retransmits": 4836,
          "duration_sec": 30.001666,
          "bytes_transferred": 14452523008
        },
        {
          "bandwidth_mbps": 3880.74034766968,
          "retransmits": 11798,
          "duration_sec": 30.001926,
          "bytes_transferred": 14553710592
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3882.676702731141,
        "bandwidth_mbps_min": 3853.792121544184,
        "bandwidth_mbps_max": 3913.4976389795597,
        "bandwidth_mbps_stddev": 29.8998,
        "retransmits_avg": 8435
      }
    },
    "overhead": {
      "bandwidth_pct": 84.95541356056829,
      "retransmits_pct": 12552.5
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 12166.103374481338,
          "retransmits": 0,
          "duration_sec": 30.001292,
          "bytes_transferred": 45624852480
        },
        {
          "bandwidth_mbps": 11921.602221487814,
          "retransmits": 0,
          "duration_sec": 30.001515,
          "bytes_transferred": 44708265984
        },
        {
          "bandwidth_mbps": 12236.837476551156,
          "retransmits": 0,
          "duration_sec": 30.00148,
          "bytes_transferred": 45890404352
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12108.181024173435,
        "bandwidth_mbps_min": 11921.602221487814,
        "bandwidth_mbps_max": 12236.837476551156,
        "bandwidth_mbps_stddev": 165.4073,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3875.3875454886506,
          "retransmits": 2154,
          "duration_sec": 30.000615,
          "bytes_transferred": 14533001216
        },
        {
          "bandwidth_mbps": 3814.2949126899516,
          "retransmits": 2784,
          "duration_sec": 30.001415,
          "bytes_transferred": 14304280576
        },
        {
          "bandwidth_mbps": 3796.564816938783,
          "retransmits": 3020,
          "duration_sec": 30.001494,
          "bytes_transferred": 14237827072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3828.749091705795,
        "bandwidth_mbps_min": 3796.564816938783,
        "bandwidth_mbps_max": 3875.3875454886506,
        "bandwidth_mbps_stddev": 41.3515,
        "retransmits_avg": 2652.6666666666665
      }
    },
    "overhead_single": {
      "bandwidth_pct": 68.3788251591063,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.220",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.220",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.700,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.87.21.128",
      "hops": [
        {
          "hop": 1,
          "host": "100.87.21.128",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.000,
          "avg_ms": 0.800,
          "best_ms": 0.500,
          "worst_ms": 1.100,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/n2/results/n2-standard-32.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "n2",
    "instance_type": "n2-standard-4",
    "vcpus": 4,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-gcp",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n2-standard-4-server 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9571.644179175159,
          "retransmits": 0,
          "duration_sec": 30.001212,
          "bytes_transferred": 35895115776
        },
        {
          "bandwidth_mbps": 9793.777729838195,
          "retransmits": 1,
          "duration_sec": 30.000725,
          "bytes_transferred": 36727554048
        },
        {
          "bandwidth_mbps": 9735.26113948892,
          "retransmits": 0,
          "duration_sec": 30.000748,
          "bytes_transferred": 36508139520
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9700.227682834093,
        "bandwidth_mbps_min": 9571.644179175159,
        "bandwidth_mbps_max": 9793.777729838195,
        "bandwidth_mbps_stddev": 115.1362,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2774.0844614770936,
          "retransmits": 472,
          "duration_sec": 30.000683,
          "bytes_transferred": 10403053568
        },
        {
          "bandwidth_mbps": 2685.3712186925945,
          "retransmits": 260,
          "duration_sec": 30.001528,
          "bytes_transferred": 10070654976
        },
        {
          "bandwidth_mbps": 2636.0285938077946,
          "retransmits": 1547,
          "duration_sec": 30.001041,
          "bytes_transferred": 9885450240
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2698.494757992494,
        "bandwidth_mbps_min": 2636.0285938077946,
        "bandwidth_mbps_max": 2774.0844614770936,
        "bandwidth_mbps_stddev": 69.9573,
        "retransmits_avg": 759.6666666666666
      }
    },
    "overhead": {
      "bandwidth_pct": 72.18111938993084,
      "retransmits_pct": 227800
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9452.36509663464,
          "retransmits": 0,
          "duration_sec": 30.001405,
          "bytes_transferred": 35448029184
        },
        {
          "bandwidth_mbps": 8694.14353639701,
          "retransmits": 0,
          "duration_sec": 30.001394,
          "bytes_transferred": 32604553216
        },
        {
          "bandwidth_mbps": 7784.024128335932,
          "retransmits": 0,
          "duration_sec": 30.000577,
          "bytes_transferred": 29190651904
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 8643.51092045586,
        "bandwidth_mbps_min": 7784.024128335932,
        "bandwidth_mbps_max": 9452.36509663464,
        "bandwidth_mbps_stddev": 835.3222,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2415.957766034862,
          "retransmits": 782,
          "duration_sec": 30.001256,
          "bytes_transferred": 9060220928
        },
        {
          "bandwidth_mbps": 2535.060481750472,
          "retransmits": 362,
          "duration_sec": 30.000967,
          "bytes_transferred": 9506783232
        },
        {
          "bandwidth_mbps": 2570.5393230128598,
          "retransmits": 158,
          "duration_sec": 30.001338,
          "bytes_transferred": 9639952384
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2507.185856932731,
        "bandwidth_mbps_min": 2415.957766034862,
        "bandwidth_mbps_max": 2570.5393230128598,
        "bandwidth_mbps_stddev": 80.9729,
        "retransmits_avg": 434
      }
    },
    "overhead_single": {
      "bandwidth_pct": 70.99343218275818,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.20",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.20",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.89.123.98",
      "hops": [
        {
          "hop": 1,
          "host": "100.89.123.98",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.800,
          "avg_ms": 0.900,
          "best_ms": 0.600,
          "worst_ms": 1.300,
          "stdev_ms": 0.100
        }
      ]
    },
    "k8s_config": {
      "cluster_name": "tailbench-eks",
      "k8s_version": "unknown",
      "cni": "aws-vpc-cni",
      "node_instance_type": "n2-standard-4",
      "pod_ip": "10.72.0.12"
    },
    "k8s_pod_to_ec2_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9645.85535285323,
          "retransmits": 189732,
          "duration_sec": 30.000094,
          "bytes_transferred": 36172070912
        },
        {
          "bandwidth_mbps": 9760.501255062985,
          "retransmits": 121098,
          "duration_sec": 30.000088,
          "bytes_transferred": 36601987072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9703.178303958108,
        "bandwidth_mbps_min": 9645.85535285323,
        "bandwidth_mbps_max": 9760.501255062985,
        "bandwidth_mbps_stddev": 81.0669,
        "retransmits_avg": 155415
      }
    },
    "k8s_ec2_to_pod_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9780.766899176393,
          "retransmits": 0,
          "duration_sec": 30.000752,
          "bytes_transferred": 36678795264
        },
        {
          "bandwidth_mbps": 9690.906648675897,
          "retransmits": 0,
          "duration_sec": 30.002049,
          "bytes_transferred": 36343382016
        },
        {
          "bandwidth_mbps": 9760.41931894191,
          "retransmits": 0,
          "duration_sec": 30.000877,
          "bytes_transferred": 36602642432
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9744.030955598066,
        "bandwidth_mbps_min": 9690.906648675897,
        "bandwidth_mbps_max": 9780.766899176393,
        "bandwidth_mbps_stddev": 47.1185,
        "retransmits_avg": 0
      }
    },
    "k8s_overhead": {
      "pod_to_ec2_vs_baseline_pct": -0.0,
      "ec2_to_pod_vs_baseline_pct": -0.5
    },
    "k8s_tailscale_pod_to_ec2_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2971.5503145940247,
          "retransmits": 8524,
          "duration_sec": 30.000093,
          "bytes_transferred": 11143348224
        },
        {
          "bandwidth_mbps": 3017.1301876122034,
          "retransmits": 10210,
          "duration_sec": 30.000074,
          "bytes_transferred": 11314266112
        },
        {
          "bandwidth_mbps": 3010.2468633803323,
          "retransmits": 11504,
          "duration_sec": 30.000051,
          "bytes_transferred": 11288444928
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2999.64245519552,
        "bandwidth_mbps_min": 2971.5503145940247,
        "bandwidth_mbps_max": 3017.1301876122034,
        "bandwidth_mbps_stddev": 24.5707,
        "retransmits_avg": 10079.333333333334
      }
    },
    "k8s_tailscale_ec2_to_pod_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 896.2521115575563,
          "retransmits": 270,
          "duration_sec": 30.001195,
          "bytes_transferred": 3361079296
        },
        {
          "bandwidth_mbps": 918.0207973718015,
          "retransmits": 95,
          "duration_sec": 30.001387,
          "bytes_transferred": 3442737152
        },
        {
          "bandwidth_mbps": 1000.1308366362982,
          "retransmits": 257,
          "duration_sec": 30.001077,
          "bytes_transferred": 3750625280
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 938.1345818552187,
        "bandwidth_mbps_min": 896.2521115575563,
        "bandwidth_mbps_max": 1000.1308366362982,
        "bandwidth_mbps_stddev": 54.7825,
        "retransmits_avg": 207.33333333333334
      }
    },
    "k8s_tailscale_config": {
      "sidecar_ts_ip": "100.106.211.15",
      "mode": "kernel"
    },
    "k8s_tailscale_overhead": {
      "pod_to_ec2_vs_baseline_pct": 69.1,
      "ec2_to_pod_vs_baseline_pct": 90.3
    },
    "source": "gcp/n2/results/n2-standard-4.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "n4",
    "instance_type": "n4-standard-2",
    "vcpus": 2,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n4-standard-2-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9108.84564950747,
          "retransmits": 0,
          "duration_sec": 30.000902,
          "bytes_transferred": 34159198208
        },
        {
          "bandwidth_mbps": 9187.08865446594,
          "retransmits": 511,
          "duration_sec": 30.002087,
          "bytes_transferred": 34453979136
        },
        {
          "bandwidth_mbps": 9187.70458038419,
          "retransmits": 0,
          "duration_sec": 30.001217,
          "bytes_transferred": 34455289856
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9161.212961452533,
        "bandwidth_mbps_min": 9108.84564950747,
        "bandwidth_mbps_max": 9187.70458038419,
        "bandwidth_mbps_stddev": 45.3525,
        "retransmits_avg": 170.33333333333334
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3626.919524379919,
          "retransmits": 1364,
          "duration_sec": 30.002602,
          "bytes_transferred": 13602127872
        },
        {
          "bandwidth_mbps": 3565.1411911428045,
          "retransmits": 0,
          "duration_sec": 30.003086,
          "bytes_transferred": 13370654720
        },
        {
          "bandwidth_mbps": 3562.002165641943,
          "retransmits": 0,
          "duration_sec": 30.001266,
          "bytes_transferred": 13358071808
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3584.687627054889,
        "bandwidth_mbps_min": 3562.002165641943,
        "bandwidth_mbps_max": 3626.919524379919,
        "bandwidth_mbps_stddev": 36.6076,
        "retransmits_avg": 454.6666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 60.87103703256203,
      "retransmits_pct": 166.92759295499022
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9156.092769812076,
          "retransmits": 0,
          "duration_sec": 30.001613,
          "bytes_transferred": 34337193984
        },
        {
          "bandwidth_mbps": 9160.49746823587,
          "retransmits": 0,
          "duration_sec": 30.00161,
          "bytes_transferred": 34353709056
        },
        {
          "bandwidth_mbps": 9164.474740386164,
          "retransmits": 0,
          "duration_sec": 30.00129,
          "bytes_transferred": 34368258048
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9160.35499281137,
        "bandwidth_mbps_min": 9156.092769812076,
        "bandwidth_mbps_max": 9164.474740386164,
        "bandwidth_mbps_stddev": 4.1928,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3333.9636832210326,
          "retransmits": 1134,
          "duration_sec": 30.002055,
          "bytes_transferred": 12503220224
        },
        {
          "bandwidth_mbps": 3435.6791920577443,
          "retransmits": 0,
          "duration_sec": 30.001352,
          "bytes_transferred": 12884377600
        },
        {
          "bandwidth_mbps": 3537.838261723662,
          "retransmits": 1,
          "duration_sec": 30.003745,
          "bytes_transferred": 13268549632
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3435.82704566748,
        "bandwidth_mbps_min": 3333.9636832210326,
        "bandwidth_mbps_max": 3537.838261723662,
        "bandwidth_mbps_stddev": 101.9374,
        "retransmits_avg": 378.3333333333333
      }
    },
    "overhead_single": {
      "bandwidth_pct": 62.49242471100999,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.54",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.54",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.67.41.3",
      "hops": [
        {
          "hop": 1,
          "host": "100.67.41.3",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.100,
          "avg_ms": 0.800,
          "best_ms": 0.600,
          "worst_ms": 1.200,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/n4/results/n4-standard-2.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "n4",
    "instance_type": "n4-standard-4",
    "vcpus": 4,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-03-22",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-gcp",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n4-standard-4-server 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9135.55183373676,
          "retransmits": 0,
          "duration_sec": 30.00158,
          "bytes_transferred": 34260123648
        },
        {
          "bandwidth_mbps": 9195.72160978375,
          "retransmits": 0,
          "duration_sec": 30.001744,
          "bytes_transferred": 34485960704
        },
        {
          "bandwidth_mbps": 9275.513590044491,
          "retransmits": 0,
          "duration_sec": 30.001631,
          "bytes_transferred": 34785067008
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9202.262344521667,
        "bandwidth_mbps_min": 9135.55183373676,
        "bandwidth_mbps_max": 9275.513590044491,
        "bandwidth_mbps_stddev": 70.2098,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4480.2090437698525,
          "retransmits": 128,
          "duration_sec": 30.001449,
          "bytes_transferred": 16801595392
        },
        {
          "bandwidth_mbps": 4470.271639951578,
          "retransmits": 144,
          "duration_sec": 30.000587,
          "bytes_transferred": 16763846656
        },
        {
          "bandwidth_mbps": 4452.4393733329,
          "retransmits": 2420,
          "duration_sec": 30.001575,
          "bytes_transferred": 16697524224
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4467.64001901811,
        "bandwidth_mbps_min": 4452.4393733329,
        "bandwidth_mbps_max": 4480.2090437698525,
        "bandwidth_mbps_stddev": 14.0706,
        "retransmits_avg": 897.3333333333334
      }
    },
    "overhead": {
      "bandwidth_pct": 51.450634075023885,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9159.69635087141,
          "retransmits": 0,
          "duration_sec": 30.001601,
          "bytes_transferred": 34350694400
        },
        {
          "bandwidth_mbps": 9155.86687610997,
          "retransmits": 0,
          "duration_sec": 30.001437,
          "bytes_transferred": 34336145408
        },
        {
          "bandwidth_mbps": 9155.719394048987,
          "retransmits": 0,
          "duration_sec": 30.000775,
          "bytes_transferred": 34334834688
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9157.094207010123,
        "bandwidth_mbps_min": 9155.719394048987,
        "bandwidth_mbps_max": 9159.69635087141,
        "bandwidth_mbps_stddev": 2.2547,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4340.295056485895,
          "retransmits": 338,
          "duration_sec": 30.000764,
          "bytes_transferred": 16276520960
        },
        {
          "bandwidth_mbps": 4314.007556411682,
          "retransmits": 423,
          "duration_sec": 30.001277,
          "bytes_transferred": 16178216960
        },
        {
          "bandwidth_mbps": 4226.505561020303,
          "retransmits": 238,
          "duration_sec": 30.002408,
          "bytes_transferred": 15850668032
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4293.602724639292,
        "bandwidth_mbps_min": 4226.505561020303,
        "bandwidth_mbps_max": 4340.295056485895,
        "bandwidth_mbps_stddev": 59.5758,
        "retransmits_avg": 333
      }
    },
    "overhead_single": {
      "bandwidth_pct": 53.11173361793781,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.226",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.226",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.92.72.127",
      "hops": [
        {
          "hop": 1,
          "host": "100.92.72.127",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.000,
          "avg_ms": 1.000,
          "best_ms": 0.700,
          "worst_ms": 1.400,
          "stdev_ms": 0.100
        }
      ]
    },
    "k8s_config": {
      "cluster_name": "tailbench-gke",
      "k8s_version": "unknown",
      "cni": "gke-vpc-native",
      "node_instance_type": "c6in.xlarge",
      "pod_ip": "10.72.0.12"
    },
    "k8s_pod_to_vm_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9107.34400732635,
          "retransmits": 232999,
          "duration_sec": 30.000207,
          "bytes_transferred": 34152775680
        },
        {
          "bandwidth_mbps": 9135.193001361185,
          "retransmits": 369789,
          "duration_sec": 30.000348,
          "bytes_transferred": 34257371136
        },
        {
          "bandwidth_mbps": 9158.998758713944,
          "retransmits": 309155,
          "duration_sec": 30.000337,
          "bytes_transferred": 34346631168
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9133.845255800492,
        "bandwidth_mbps_min": 9107.34400732635,
        "bandwidth_mbps_max": 9158.998758713944,
        "bandwidth_mbps_stddev": 25.8537,
        "retransmits_avg": 303981
      }
    },
    "k8s_pod_to_vm_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9222.390045526936,
          "retransmits": 77674,
          "duration_sec": 30.000262,
          "bytes_transferred": 34584264704
        },
        {
          "bandwidth_mbps": 9215.9417006631,
          "retransmits": 97603,
          "duration_sec": 30.000204,
          "bytes_transferred": 34560016384
        },
        {
          "bandwidth_mbps": 9244.08217125302,
          "retransmits": 72402,
          "duration_sec": 30.000078,
          "bytes_transferred": 34665398272
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9227.471305814352,
        "bandwidth_mbps_min": 9215.9417006631,
        "bandwidth_mbps_max": 9244.08217125302,
        "bandwidth_mbps_stddev": 14.7423,
        "retransmits_avg": 82559.66666666667
      }
    },
    "k8s_vm_to_pod_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9242.830086025557,
          "retransmits": 3324,
          "duration_sec": 30.000852,
          "bytes_transferred": 34661597184
        },
        {
          "bandwidth_mbps": 9177.235832887234,
          "retransmits": 364,
          "duration_sec": 30.00082,
          "bytes_transferred": 34415575040
        },
        {
          "bandwidth_mbps": 9091.41729083158,
          "retransmits": 251803,
          "duration_sec": 30.001553,
          "bytes_transferred": 34094579712
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9170.494403248123,
        "bandwidth_mbps_min": 9091.41729083158,
        "bandwidth_mbps_max": 9242.830086025557,
        "bandwidth_mbps_stddev": 75.9312,
        "retransmits_avg": 85163.66666666667
      }
    },
    "k8s_vm_to_pod_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9255.858722804947,
          "retransmits": 14172,
          "duration_sec": 30.000539,
          "bytes_transferred": 34710093824
        },
        {
          "bandwidth_mbps": 9150.065769762334,
          "retransmits": 268,
          "duration_sec": 30.000747,
          "bytes_transferred": 34313601024
        },
        {
          "bandwidth_mbps": 9148.259975039256,
          "retransmits": 352,
          "duration_sec": 30.001511,
          "bytes_transferred": 34307702784
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9184.728155868846,
        "bandwidth_mbps_min": 9148.259975039256,
        "bandwidth_mbps_max": 9255.858722804947,
        "bandwidth_mbps_stddev": 61.6075,
        "retransmits_avg": 4930.666666666667
      }
    },
    "k8s_overhead": {
      "pod_to_vm_vs_baseline_pct": 0.7,
      "pod_to_vm_single_vs_baseline_pct": -0.8,
      "vm_to_pod_vs_baseline_pct": 0.3,
      "vm_to_pod_single_vs_baseline_pct": -0.3
    },
    "source": "gcp/n4/results/n4-standard-4.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "n4",
    "instance_type": "n4-standard-8",
    "vcpus": 8,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n4-standard-8-server 6.14.0-1021-gcp #22~24.04.1-Ubuntu SMP Sat Nov 22 06:23:18 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 14637.859289072654,
          "retransmits": 0,
          "duration_sec": 30.001181,
          "bytes_transferred": 54894133248
        },
        {
          "bandwidth_mbps": 14679.384121859612,
          "retransmits": 0,
          "duration_sec": 30.000818,
          "bytes_transferred": 55049191424
        },
        {
          "bandwidth_mbps": 14684.00494090305,
          "retransmits": 0,
          "duration_sec": 30.001803,
          "bytes_transferred": 55068327936
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 14667.082783945103,
        "bandwidth_mbps_min": 14637.859289072654,
        "bandwidth_mbps_max": 14684.00494090305,
        "bandwidth_mbps_stddev": 25.4135,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5419.600448498026,
          "retransmits": 4,
          "duration_sec": 30.000578,
          "bytes_transferred": 20323893248
        },
        {
          "bandwidth_mbps": 5448.258431166958,
          "retransmits": 0,
          "duration_sec": 30.000592,
          "bytes_transferred": 20431372288
        },
        {
          "bandwidth_mbps": 5424.050348652177,
          "retransmits": 0,
          "duration_sec": 30.001677,
          "bytes_transferred": 20341325824
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5430.636409439053,
        "bandwidth_mbps_min": 5419.600448498026,
        "bandwidth_mbps_max": 5448.258431166958,
        "bandwidth_mbps_stddev": 15.4225,
        "retransmits_avg": 1.3333333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 62.973984060528096,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 14644.266484737214,
          "retransmits": 0,
          "duration_sec": 30.001373,
          "bytes_transferred": 54918512640
        },
        {
          "bandwidth_mbps": 14646.2293054732,
          "retransmits": 0,
          "duration_sec": 30.00129,
          "bytes_transferred": 54925721600
        },
        {
          "bandwidth_mbps": 14653.996303707921,
          "retransmits": 0,
          "duration_sec": 30.001417,
          "bytes_transferred": 54955081728
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 14648.164031306113,
        "bandwidth_mbps_min": 14644.266484737214,
        "bandwidth_mbps_max": 14653.996303707921,
        "bandwidth_mbps_stddev": 5.1454,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5302.292292259194,
          "retransmits": 0,
          "duration_sec": 30.001424,
          "bytes_transferred": 19884539904
        },
        {
          "bandwidth_mbps": 5329.693651369992,
          "retransmits": 136,
          "duration_sec": 30.000441,
          "bytes_transferred": 19986644992
        },
        {
          "bandwidth_mbps": 5367.071468376795,
          "retransmits": 8,
          "duration_sec": 30.001339,
          "bytes_transferred": 20127416320
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5333.019137335327,
        "bandwidth_mbps_min": 5302.292292259194,
        "bandwidth_mbps_max": 5367.071468376795,
        "bandwidth_mbps_stddev": 32.5174,
        "retransmits_avg": 48
      }
    },
    "overhead_single": {
      "bandwidth_pct": 63.592576339686126,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.203",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.203",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.64.91.60",
      "hops": [
        {
          "hop": 1,
          "host": "100.64.91.60",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.900,
          "avg_ms": 0.800,
          "best_ms": 0.600,
          "worst_ms": 1.000,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/n4/results/n4-standard-8.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6i",
    "instance_type": "c6i.xlarge",
    "vcpus": 4,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-30 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:50:29 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12411.828945256679,
          "retransmits": 0,
          "duration_sec": 30.001413,
          "bytes_transferred": 46546550784
        },
        {
          "bandwidth_mbps": 12411.659824628723,
          "retransmits": 0,
          "duration_sec": 30.000808,
          "bytes_transferred": 46544977920
        },
        {
          "bandwidth_mbps": 12411.709869611721,
          "retransmits": 0,
          "duration_sec": 30.000856,
          "bytes_transferred": 46545240064
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12411.732879832372,
        "bandwidth_mbps_min": 12411.659824628723,
        "bandwidth_mbps_max": 12411.828945256679,
        "bandwidth_mbps_stddev": 0.0869,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4022.5279033126253,
          "retransmits": 0,
          "duration_sec": 30.001187,
          "bytes_transferred": 15085076480
        },
        {
          "bandwidth_mbps": 4029.1264854753026,
          "retransmits": 0,
          "duration_sec": 30.001761,
          "bytes_transferred": 15110111232
        },
        {
          "bandwidth_mbps": 4010.373868226689,
          "retransmits": 0,
          "duration_sec": 30.000597,
          "bytes_transferred": 15039201280
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4020.676085671539,
        "bandwidth_mbps_min": 4010.373868226689,
        "bandwidth_mbps_max": 4029.1264854753026,
        "bandwidth_mbps_stddev": 9.5125,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 67.60584420726076,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9468.773105479066,
          "retransmits": 0,
          "duration_sec": 30.000579,
          "bytes_transferred": 35508584448
        },
        {
          "bandwidth_mbps": 9464.9848262294,
          "retransmits": 0,
          "duration_sec": 30.001508,
          "bytes_transferred": 35495477248
        },
        {
          "bandwidth_mbps": 9466.880174931146,
          "retransmits": 0,
          "duration_sec": 30.000375,
          "bytes_transferred": 35501244416
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9466.87936887987,
        "bandwidth_mbps_min": 9464.9848262294,
        "bandwidth_mbps_max": 9468.773105479066,
        "bandwidth_mbps_stddev": 1.8941,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3814.282869874471,
          "retransmits": 0,
          "duration_sec": 30.000685,
          "bytes_transferred": 14303887360
        },
        {
          "bandwidth_mbps": 3817.899060677471,
          "retransmits": 0,
          "duration_sec": 30.000558,
          "bytes_transferred": 14317387776
        },
        {
          "bandwidth_mbps": 3815.984384154805,
          "retransmits": 0,
          "duration_sec": 30.001322,
          "bytes_transferred": 14310572032
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3816.055438235582,
        "bandwidth_mbps_min": 3814.282869874471,
        "bandwidth_mbps_max": 3817.899060677471,
        "bandwidth_mbps_stddev": 1.8091,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 59.690460926543935,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.30",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.30",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.81.230.58",
      "hops": [
        {
          "hop": 1,
          "host": "100.81.230.58",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "k8s_config": {
      "cluster_name": "tailbench-eks",
      "k8s_version": "unknown",
      "cni": "aws-vpc-cni",
      "node_instance_type": "c6i.xlarge",
      "pod_ip": "10.0.2.224"
    },
    "k8s_pod_to_ec2_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.555204919452,
          "retransmits": 23209,
          "duration_sec": 30.00008,
          "bytes_transferred": 46547206144
        },
        {
          "bandwidth_mbps": 12412.486955033046,
          "retransmits": 22100,
          "duration_sec": 30.000076,
          "bytes_transferred": 46546944000
        },
        {
          "bandwidth_mbps": 12412.550653663016,
          "retransmits": 21031,
          "duration_sec": 30.000091,
          "bytes_transferred": 46547206144
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.530937871838,
        "bandwidth_mbps_min": 12412.486955033046,
        "bandwidth_mbps_max": 12412.555204919452,
        "bandwidth_mbps_stddev": 0.0382,
        "retransmits_avg": 22113.333333333332
      }
    },
    "k8s_ec2_to_pod_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12378.430923793061,
          "retransmits": 0,
          "duration_sec": 30.001546,
          "bytes_transferred": 46421508096
        },
        {
          "bandwidth_mbps": 12378.375007887325,
          "retransmits": 0,
          "duration_sec": 30.000665,
          "bytes_transferred": 46419935232
        },
        {
          "bandwidth_mbps": 12387.09560598022,
          "retransmits": 0,
          "duration_sec": 30.000707,
          "bytes_transferred": 46452703232
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12381.300512553535,
        "bandwidth_mbps_min": 12378.375007887325,
        "bandwidth_mbps_max": 12387.09560598022,
        "bandwidth_mbps_stddev": 5.0188,
        "retransmits_avg": 0
      }
    },
    "k8s_overhead": {
      "pod_to_ec2_vs_baseline_pct": -0.0,
      "ec2_to_pod_vs_baseline_pct": 0.2
    },
    "k8s_tailscale_pod_to_ec2_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3903.4527802353637,
          "retransmits": 3598,
          "duration_sec": 30.000086,
          "bytes_transferred": 14637989888
        },
        {
          "bandwidth_mbps": 3882.1650661886147,
          "retransmits": 1965,
          "duration_sec": 30.000099,
          "bytes_transferred": 14558167040
        },
        {
          "bandwidth_mbps": 3846.34088912354,
          "retransmits": 3373,
          "duration_sec": 30.000083,
          "bytes_transferred": 14423818240
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3877.319578515839,
        "bandwidth_mbps_min": 3846.34088912354,
        "bandwidth_mbps_max": 3903.4527802353637,
        "bandwidth_mbps_stddev": 28.8626,
        "retransmits_avg": 2978.6666666666665
      }
    },
    "k8s_tailscale_ec2_to_pod_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1385.8431862684054,
          "retransmits": 0,
          "duration_sec": 30.000536,
          "bytes_transferred": 5197004800
        },
        {
          "bandwidth_mbps": 1413.2524999309194,
          "retransmits": 0,
          "duration_sec": 30.001129,
          "bytes_transferred": 5299896320
        },
        {
          "bandwidth_mbps": 1448.3061095596904,
          "retransmits": 656,
          "duration_sec": 30.00118,
          "bytes_transferred": 5431361536
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1415.8005985863383,
        "bandwidth_mbps_min": 1385.8431862684054,
        "bandwidth_mbps_max": 1448.3061095596904,
        "bandwidth_mbps_stddev": 31.3093,
        "retransmits_avg": 218.66666666666666
      }
    },
    "k8s_tailscale_config": {
      "sidecar_ts_ip": "100.114.60.81",
      "mode": "kernel"
    },
    "k8s_tailscale_overhead": {
      "pod_to_ec2_vs_baseline_pct": 68.8,
      "ec2_to_pod_vs_baseline_pct": 88.6
    },
    "source": "aws/c6i/results/c6i.xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.12xlarge",
    "vcpus": 48,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": true,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-165 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 29305.399069514184,
          "retransmits": 0,
          "duration_sec": 30.001317,
          "bytes_transferred": 109900070912
        },
        {
          "bandwidth_mbps": 30191.53059632384,
          "retransmits": 0,
          "duration_sec": 30.001333,
          "bytes_transferred": 113223270400
        },
        {
          "bandwidth_mbps": 18747.7321261693,
          "retransmits": 0,
          "duration_sec": 30.000452,
          "bytes_transferred": 70305054720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 26081.553930669106,
        "bandwidth_mbps_min": 18747.7321261693,
        "bandwidth_mbps_max": 30191.53059632384,
        "bandwidth_mbps_stddev": 6366.7114,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2702.090107691677,
          "retransmits": 0,
          "duration_sec": 30.00139,
          "bytes_transferred": 10133307392
        },
        {
          "bandwidth_mbps": 2697.934096376647,
          "retransmits": 0,
          "duration_sec": 30.001355,
          "bytes_transferred": 10117709824
        },
        {
          "bandwidth_mbps": 2697.8595183885873,
          "retransmits": 0,
          "duration_sec": 30.001407,
          "bytes_transferred": 10117447680
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2699.294574152304,
        "bandwidth_mbps_min": 2697.8595183885873,
        "bandwidth_mbps_max": 2702.090107691677,
        "bandwidth_mbps_stddev": 2.4213,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 89.65056077054435,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 10077.136853939206,
          "retransmits": 0,
          "duration_sec": 30.001124,
          "bytes_transferred": 37790679040
        },
        {
          "bandwidth_mbps": 9891.3839605901,
          "retransmits": 0,
          "duration_sec": 30.001191,
          "bytes_transferred": 37094162432
        },
        {
          "bandwidth_mbps": 9916.712389294546,
          "retransmits": 0,
          "duration_sec": 30.001119,
          "bytes_transferred": 37189058560
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9961.744401274618,
        "bandwidth_mbps_min": 9891.3839605901,
        "bandwidth_mbps_max": 10077.136853939206,
        "bandwidth_mbps_stddev": 100.7321,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2725.312048872663,
          "retransmits": 0,
          "duration_sec": 30.00123,
          "bytes_transferred": 10220339200
        },
        {
          "bandwidth_mbps": 2729.330515672019,
          "retransmits": 0,
          "duration_sec": 30.00124,
          "bytes_transferred": 10235412480
        },
        {
          "bandwidth_mbps": 3135.8842969487832,
          "retransmits": 0,
          "duration_sec": 30.001214,
          "bytes_transferred": 11760041984
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2863.508953831155,
        "bandwidth_mbps_min": 2725.312048872663,
        "bandwidth_mbps_max": 3135.8842969487832,
        "bandwidth_mbps_stddev": 235.8925,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 71.25494453095217,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.165",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.165",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.82.14.74",
      "hops": [
        {
          "hop": 1,
          "host": "100.82.14.74",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.400,
          "worst_ms": 0.500,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c6in/results/c6in.12xlarge-ena-express.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.12xlarge",
    "vcpus": 48,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-165 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37731.6896112446,
          "retransmits": 0,
          "duration_sec": 30.001409,
          "bytes_transferred": 141500481536
        },
        {
          "bandwidth_mbps": 36023.78705478213,
          "retransmits": 0,
          "duration_sec": 30.001519,
          "bytes_transferred": 135096041472
        },
        {
          "bandwidth_mbps": 37898.99784723652,
          "retransmits": 0,
          "duration_sec": 30.001438,
          "bytes_transferred": 142128054272
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37218.15817108774,
        "bandwidth_mbps_min": 36023.78705478213,
        "bandwidth_mbps_max": 37898.99784723652,
        "bandwidth_mbps_stddev": 1037.7330,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 7110.479093882587,
          "retransmits": 0,
          "duration_sec": 30.00141,
          "bytes_transferred": 26665549824
        },
        {
          "bandwidth_mbps": 7091.85003278679,
          "retransmits": 0,
          "duration_sec": 30.001411,
          "bytes_transferred": 26595688448
        },
        {
          "bandwidth_mbps": 7151.96818495137,
          "retransmits": 0,
          "duration_sec": 30.0014,
          "bytes_transferred": 26821132288
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 7118.099103873582,
        "bandwidth_mbps_min": 7091.85003278679,
        "bandwidth_mbps_max": 7151.96818495137,
        "bandwidth_mbps_stddev": 30.7749,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 80.87466050535744,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9486.232808352925,
          "retransmits": 0,
          "duration_sec": 30.001183,
          "bytes_transferred": 35574775808
        },
        {
          "bandwidth_mbps": 9485.81307831051,
          "retransmits": 0,
          "duration_sec": 30.001184,
          "bytes_transferred": 35573202944
        },
        {
          "bandwidth_mbps": 9486.453266173241,
          "retransmits": 0,
          "duration_sec": 30.001149,
          "bytes_transferred": 35575562240
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9486.166384278893,
        "bandwidth_mbps_min": 9485.81307831051,
        "bandwidth_mbps_max": 9486.453266173241,
        "bandwidth_mbps_stddev": 0.3252,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 7106.812437575516,
          "retransmits": 0,
          "duration_sec": 30.001249,
          "bytes_transferred": 26651656192
        },
        {
          "bandwidth_mbps": 6747.44423236524,
          "retransmits": 0,
          "duration_sec": 30.000322,
          "bytes_transferred": 25303187456
        },
        {
          "bandwidth_mbps": 6761.29193799866,
          "retransmits": 0,
          "duration_sec": 30.001223,
          "bytes_transferred": 25355878400
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6871.849535979806,
        "bandwidth_mbps_min": 6747.44423236524,
        "bandwidth_mbps_max": 7106.812437575516,
        "bandwidth_mbps_stddev": 203.6016,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 27.559255682376676,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.165",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.165",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.82.14.74",
      "hops": [
        {
          "hop": 1,
          "host": "100.82.14.74",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.300,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c6in/results/c6in.12xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.16xlarge",
    "vcpus": 64,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": true,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-173 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 59695.3959872221,
          "retransmits": 0,
          "duration_sec": 30.001511,
          "bytes_transferred": 223869009920
        },
        {
          "bandwidth_mbps": 61097.2127645242,
          "retransmits": 0,
          "duration_sec": 30.001557,
          "bytes_transferred": 229126438912
        },
        {
          "bandwidth_mbps": 81082.48306643,
          "retransmits": 0,
          "duration_sec": 30.001559,
          "bytes_transferred": 304075112448
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 67291.69727272543,
        "bandwidth_mbps_min": 59695.3959872221,
        "bandwidth_mbps_max": 81082.48306643,
        "bandwidth_mbps_stddev": 11963.7202,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4339.07169636312,
          "retransmits": 0,
          "duration_sec": 30.001731,
          "bytes_transferred": 16272457728
        },
        {
          "bandwidth_mbps": 4378.6526036482655,
          "retransmits": 0,
          "duration_sec": 30.002094,
          "bytes_transferred": 16421093376
        },
        {
          "bandwidth_mbps": 4347.29784836179,
          "retransmits": 3,
          "duration_sec": 30.001884,
          "bytes_transferred": 16303390720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4355.007382791058,
        "bandwidth_mbps_min": 4339.07169636312,
        "bandwidth_mbps_max": 4378.6526036482655,
        "bandwidth_mbps_stddev": 20.8864,
        "retransmits_avg": 1
      }
    },
    "overhead": {
      "bandwidth_pct": 93.52816534684699,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 20547.89995426868,
          "retransmits": 0,
          "duration_sec": 30.00132,
          "bytes_transferred": 77058015232
        },
        {
          "bandwidth_mbps": 21134.587203634142,
          "retransmits": 0,
          "duration_sec": 30.001221,
          "bytes_transferred": 79257927680
        },
        {
          "bandwidth_mbps": 20365.580644452715,
          "retransmits": 0,
          "duration_sec": 30.001239,
          "bytes_transferred": 76374081536
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 20682.689267451846,
        "bandwidth_mbps_min": 20365.580644452715,
        "bandwidth_mbps_max": 21134.587203634142,
        "bandwidth_mbps_stddev": 401.8319,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4316.316339615436,
          "retransmits": 0,
          "duration_sec": 30.001263,
          "bytes_transferred": 16186867712
        },
        {
          "bandwidth_mbps": 4337.325217734245,
          "retransmits": 0,
          "duration_sec": 30.001482,
          "bytes_transferred": 16265773056
        },
        {
          "bandwidth_mbps": 4339.258742803645,
          "retransmits": 0,
          "duration_sec": 30.001646,
          "bytes_transferred": 16273113088
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4330.9667667177755,
        "bandwidth_mbps_min": 4316.316339615436,
        "bandwidth_mbps_max": 4339.258742803645,
        "bandwidth_mbps_stddev": 12.7244,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 79.05994374951338,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.173",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.173",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.103.143.28",
      "hops": [
        {
          "hop": 1,
          "host": "100.103.143.28",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.700,
          "avg_ms": 1.200,
          "best_ms": 0.700,
          "worst_ms": 2.000,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c6in/results/c6in.16xlarge-ena-express.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.16xlarge",
    "vcpus": 64,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-173 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37963.1943694237,
          "retransmits": 0,
          "duration_sec": 30.001334,
          "bytes_transferred": 142368309248
        },
        {
          "bandwidth_mbps": 37935.79711113475,
          "retransmits": 0,
          "duration_sec": 30.001607,
          "bytes_transferred": 142266859520
        },
        {
          "bandwidth_mbps": 37970.29808399005,
          "retransmits": 0,
          "duration_sec": 30.00141,
          "bytes_transferred": 142395310080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37956.4298548495,
        "bandwidth_mbps_min": 37935.79711113475,
        "bandwidth_mbps_max": 37970.29808399005,
        "bandwidth_mbps_stddev": 18.2181,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6804.586062092195,
          "retransmits": 0,
          "duration_sec": 30.002193,
          "bytes_transferred": 25519063040
        },
        {
          "bandwidth_mbps": 6824.214004511106,
          "retransmits": 0,
          "duration_sec": 30.001947,
          "bytes_transferred": 25592463360
        },
        {
          "bandwidth_mbps": 6818.37872230744,
          "retransmits": 0,
          "duration_sec": 30.001787,
          "bytes_transferred": 25570443264
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6815.726262970246,
        "bandwidth_mbps_min": 6804.586062092195,
        "bandwidth_mbps_max": 6824.214004511106,
        "bandwidth_mbps_stddev": 10.0792,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 82.04328940041384,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9495.042673112855,
          "retransmits": 0,
          "duration_sec": 30.001397,
          "bytes_transferred": 35608068096
        },
        {
          "bandwidth_mbps": 9494.833007879424,
          "retransmits": 0,
          "duration_sec": 30.001176,
          "bytes_transferred": 35607019520
        },
        {
          "bandwidth_mbps": 9495.758917543091,
          "retransmits": 0,
          "duration_sec": 30.001453,
          "bytes_transferred": 35610820608
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9495.211532845124,
        "bandwidth_mbps_min": 9494.833007879424,
        "bandwidth_mbps_max": 9495.758917543091,
        "bandwidth_mbps_stddev": 0.4855,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 6857.115287867436,
          "retransmits": 0,
          "duration_sec": 30.001431,
          "bytes_transferred": 25715408896
        },
        {
          "bandwidth_mbps": 6659.347425390429,
          "retransmits": 0,
          "duration_sec": 30.001345,
          "bytes_transferred": 24973672448
        },
        {
          "bandwidth_mbps": 6740.7825029728665,
          "retransmits": 0,
          "duration_sec": 30.001348,
          "bytes_transferred": 25279070208
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6752.41507207691,
        "bandwidth_mbps_min": 6659.347425390429,
        "bandwidth_mbps_max": 6857.115287867436,
        "bandwidth_mbps_stddev": 99.3958,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 28.886101708008688,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.173",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.173",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.103.143.28",
      "hops": [
        {
          "hop": 1,
          "host": "100.103.143.28",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.900,
          "avg_ms": 1.100,
          "best_ms": 0.700,
          "worst_ms": 1.800,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c6in/results/c6in.16xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.2xlarge",
    "vcpus": 8,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-248 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37785.396859562185,
          "retransmits": 0,
          "duration_sec": 30.001613,
          "bytes_transferred": 141702856704
        },
        {
          "bandwidth_mbps": 37807.12852918815,
          "retransmits": 0,
          "duration_sec": 30.00173,
          "bytes_transferred": 141784907776
        },
        {
          "bandwidth_mbps": 35886.491704723565,
          "retransmits": 0,
          "duration_sec": 30.001351,
          "bytes_transferred": 134580404224
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37159.6723644913,
        "bandwidth_mbps_min": 35886.491704723565,
        "bandwidth_mbps_max": 37807.12852918815,
        "bandwidth_mbps_stddev": 1102.6603,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4358.12716433922,
          "retransmits": 0,
          "duration_sec": 30.000958,
          "bytes_transferred": 16343498752
        },
        {
          "bandwidth_mbps": 4431.943730963586,
          "retransmits": 0,
          "duration_sec": 30.000727,
          "bytes_transferred": 16620191744
        },
        {
          "bandwidth_mbps": 4299.30007502148,
          "retransmits": 0,
          "duration_sec": 30.000741,
          "bytes_transferred": 16122773504
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4363.123656774762,
        "bandwidth_mbps_min": 4299.30007502148,
        "bandwidth_mbps_max": 4431.943730963586,
        "bandwidth_mbps_stddev": 66.4628,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 88.25844422421756,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9464.35615887786,
          "retransmits": 0,
          "duration_sec": 30.001285,
          "bytes_transferred": 35492855808
        },
        {
          "bandwidth_mbps": 9464.35331969348,
          "retransmits": 0,
          "duration_sec": 30.001294,
          "bytes_transferred": 35492855808
        },
        {
          "bandwidth_mbps": 9466.63011102586,
          "retransmits": 0,
          "duration_sec": 30.001389,
          "bytes_transferred": 35501506560
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9465.1131965324,
        "bandwidth_mbps_min": 9464.35331969348,
        "bandwidth_mbps_max": 9466.63011102586,
        "bandwidth_mbps_stddev": 1.3137,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4175.171705034217,
          "retransmits": 0,
          "duration_sec": 30.001351,
          "bytes_transferred": 15657598976
        },
        {
          "bandwidth_mbps": 4195.340243762525,
          "retransmits": 0,
          "duration_sec": 30.000838,
          "bytes_transferred": 15732965376
        },
        {
          "bandwidth_mbps": 4142.339700230326,
          "retransmits": 0,
          "duration_sec": 30.000433,
          "bytes_transferred": 15533998080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4170.950549675689,
        "bandwidth_mbps_min": 4142.339700230326,
        "bandwidth_mbps_max": 4195.340243762525,
        "bandwidth_mbps_stddev": 26.7512,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 55.93343192975504,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.248",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.248",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.80.72.88",
      "hops": [
        {
          "hop": 1,
          "host": "100.80.72.88",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.600,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c6in/results/c6in.2xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.32xlarge",
    "vcpus": 128,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": true,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-190 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 67750.85069986578,
          "retransmits": 0,
          "duration_sec": 30.001681,
          "bytes_transferred": 254079926272
        },
        {
          "bandwidth_mbps": 88807.19835458093,
          "retransmits": 0,
          "duration_sec": 30.001354,
          "bytes_transferred": 333042024448
        },
        {
          "bandwidth_mbps": 68039.9805510779,
          "retransmits": 0,
          "duration_sec": 30.001457,
          "bytes_transferred": 255162318848
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 74866.0098685082,
        "bandwidth_mbps_min": 67750.85069986578,
        "bandwidth_mbps_max": 88807.19835458093,
        "bandwidth_mbps_stddev": 12074.2889,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5639.1256997514165,
          "retransmits": 0,
          "duration_sec": 30.001547,
          "bytes_transferred": 21147811840
        },
        {
          "bandwidth_mbps": 5615.462456430719,
          "retransmits": 0,
          "duration_sec": 30.001929,
          "bytes_transferred": 21059338240
        },
        {
          "bandwidth_mbps": 5674.342986324469,
          "retransmits": 0,
          "duration_sec": 30.001616,
          "bytes_transferred": 21279932416
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5642.9770475022015,
        "bandwidth_mbps_min": 5615.462456430719,
        "bandwidth_mbps_max": 5674.342986324469,
        "bandwidth_mbps_stddev": 29.6286,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 92.46256471072344,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 23442.7335578284,
          "retransmits": 0,
          "duration_sec": 30.001253,
          "bytes_transferred": 87913922560
        },
        {
          "bandwidth_mbps": 23206.166758157357,
          "retransmits": 0,
          "duration_sec": 30.001231,
          "bytes_transferred": 87026696192
        },
        {
          "bandwidth_mbps": 23255.4303264849,
          "retransmits": 0,
          "duration_sec": 30.001479,
          "bytes_transferred": 87212163072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 23301.443547490217,
        "bandwidth_mbps_min": 23206.166758157357,
        "bandwidth_mbps_max": 23442.7335578284,
        "bandwidth_mbps_stddev": 124.8154,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5609.35609050507,
          "retransmits": 0,
          "duration_sec": 30.001502,
          "bytes_transferred": 21036138496
        },
        {
          "bandwidth_mbps": 5306.818643603862,
          "retransmits": 0,
          "duration_sec": 30.001324,
          "bytes_transferred": 19901448192
        },
        {
          "bandwidth_mbps": 5368.0741920554565,
          "retransmits": 0,
          "duration_sec": 30.001595,
          "bytes_transferred": 20131348480
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5428.08297538813,
        "bandwidth_mbps_min": 5306.818643603862,
        "bandwidth_mbps_max": 5609.35609050507,
        "bandwidth_mbps_stddev": 159.9469,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 76.70494978422578,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.190",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.190",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.500,
          "best_ms": 0.300,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.92.246.64",
      "hops": [
        {
          "hop": 1,
          "host": "100.92.246.64",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.600,
          "avg_ms": 1.200,
          "best_ms": 0.600,
          "worst_ms": 2.000,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c6in/results/c6in.32xlarge-ena-express.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.32xlarge",
    "vcpus": 128,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-190 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37874.122935606734,
          "retransmits": 0,
          "duration_sec": 30.00143,
          "bytes_transferred": 142034731008
        },
        {
          "bandwidth_mbps": 37781.5459726073,
          "retransmits": 0,
          "duration_sec": 30.001507,
          "bytes_transferred": 141687914496
        },
        {
          "bandwidth_mbps": 37920.37293385937,
          "retransmits": 0,
          "duration_sec": 30.001588,
          "bytes_transferred": 142208925696
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37858.680614024466,
        "bandwidth_mbps_min": 37781.5459726073,
        "bandwidth_mbps_max": 37920.37293385937,
        "bandwidth_mbps_stddev": 70.6900,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6117.8141357008,
          "retransmits": 0,
          "duration_sec": 30.001017,
          "bytes_transferred": 22942580736
        },
        {
          "bandwidth_mbps": 5838.5211397685025,
          "retransmits": 0,
          "duration_sec": 30.00118,
          "bytes_transferred": 21895315456
        },
        {
          "bandwidth_mbps": 5681.086298120927,
          "retransmits": 0,
          "duration_sec": 30.001812,
          "bytes_transferred": 21305360384
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5879.140524530077,
        "bandwidth_mbps_min": 5681.086298120927,
        "bandwidth_mbps_max": 6117.8141357008,
        "bandwidth_mbps_stddev": 221.1792,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 84.47082563581945,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9500.101806924209,
          "retransmits": 0,
          "duration_sec": 30.001535,
          "bytes_transferred": 35627204608
        },
        {
          "bandwidth_mbps": 9497.63574902366,
          "retransmits": 0,
          "duration_sec": 30.001155,
          "bytes_transferred": 35617505280
        },
        {
          "bandwidth_mbps": 9496.079038909114,
          "retransmits": 0,
          "duration_sec": 30.001325,
          "bytes_transferred": 35611869184
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9497.938864952326,
        "bandwidth_mbps_min": 9496.079038909114,
        "bandwidth_mbps_max": 9500.101806924209,
        "bandwidth_mbps_stddev": 2.0284,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5598.51537618043,
          "retransmits": 0,
          "duration_sec": 30.001534,
          "bytes_transferred": 20995506176
        },
        {
          "bandwidth_mbps": 5672.780287637228,
          "retransmits": 0,
          "duration_sec": 30.001193,
          "bytes_transferred": 21273772032
        },
        {
          "bandwidth_mbps": 5555.92718312076,
          "retransmits": 0,
          "duration_sec": 30.001066,
          "bytes_transferred": 20835467264
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5609.074282312806,
        "bandwidth_mbps_min": 5555.92718312076,
        "bandwidth_mbps_max": 5672.780287637228,
        "bandwidth_mbps_stddev": 59.1378,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 40.94429999954564,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.190",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.190",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.400,
          "best_ms": 0.400,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.92.246.64",
      "hops": [
        {
          "hop": 1,
          "host": "100.92.246.64",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.200,
          "avg_ms": 1.100,
          "best_ms": 0.600,
          "worst_ms": 1.700,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c6in/results/c6in.32xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.4xlarge",
    "vcpus": 16,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-101 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37874.855244073304,
          "retransmits": 0,
          "duration_sec": 30.001459,
          "bytes_transferred": 142037614592
        },
        {
          "bandwidth_mbps": 37791.09037331728,
          "retransmits": 0,
          "duration_sec": 30.001477,
          "bytes_transferred": 141723566080
        },
        {
          "bandwidth_mbps": 37882.42311047665,
          "retransmits": 0,
          "duration_sec": 30.001389,
          "bytes_transferred": 142065664000
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37849.456242622415,
        "bandwidth_mbps_min": 37791.09037331728,
        "bandwidth_mbps_max": 37882.42311047665,
        "bandwidth_mbps_stddev": 50.6878,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6666.74522216414,
          "retransmits": 0,
          "duration_sec": 30.000769,
          "bytes_transferred": 25000935424
        },
        {
          "bandwidth_mbps": 6647.25810128205,
          "retransmits": 4,
          "duration_sec": 30.001486,
          "bytes_transferred": 24928452608
        },
        {
          "bandwidth_mbps": 6545.281910871363,
          "retransmits": 0,
          "duration_sec": 30.000638,
          "bytes_transferred": 24545329152
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6619.761744772518,
        "bandwidth_mbps_min": 6545.281910871363,
        "bandwidth_mbps_max": 6666.74522216414,
        "bandwidth_mbps_stddev": 65.2332,
        "retransmits_avg": 1.3333333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 82.51028574271041,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9472.53533283893,
          "retransmits": 0,
          "duration_sec": 30.001283,
          "bytes_transferred": 35523526656
        },
        {
          "bandwidth_mbps": 9472.019591713091,
          "retransmits": 0,
          "duration_sec": 30.001256,
          "bytes_transferred": 35521560576
        },
        {
          "bandwidth_mbps": 9474.783884376004,
          "retransmits": 0,
          "duration_sec": 30.001246,
          "bytes_transferred": 35531915264
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9473.112936309342,
        "bandwidth_mbps_min": 9472.019591713091,
        "bandwidth_mbps_max": 9474.783884376004,
        "bandwidth_mbps_stddev": 1.4699,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 6477.512013188239,
          "retransmits": 0,
          "duration_sec": 30.001278,
          "bytes_transferred": 24291704832
        },
        {
          "bandwidth_mbps": 6343.2182603613555,
          "retransmits": 0,
          "duration_sec": 30.001334,
          "bytes_transferred": 23788126208
        },
        {
          "bandwidth_mbps": 6494.27314538423,
          "retransmits": 0,
          "duration_sec": 30.001349,
          "bytes_transferred": 24354619392
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6438.334472977942,
        "bandwidth_mbps_min": 6343.2182603613555,
        "bandwidth_mbps_max": 6494.27314538423,
        "bandwidth_mbps_stddev": 82.7983,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 32.035704458873774,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.101",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.101",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.85.182.77",
      "hops": [
        {
          "hop": 1,
          "host": "100.85.182.77",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.300,
          "best_ms": 0.300,
          "worst_ms": 0.500,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c6in/results/c6in.4xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.8xlarge",
    "vcpus": 32,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": true,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-64 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 49322.79143526493,
          "retransmits": 0,
          "duration_sec": 30.001395,
          "bytes_transferred": 184969068544
        },
        {
          "bandwidth_mbps": 49581.79633408092,
          "retransmits": 0,
          "duration_sec": 30.001426,
          "bytes_transferred": 185940574208
        },
        {
          "bandwidth_mbps": 49319.059179601434,
          "retransmits": 0,
          "duration_sec": 30.00054,
          "bytes_transferred": 184949800960
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 49407.88231631576,
        "bandwidth_mbps_min": 49319.059179601434,
        "bandwidth_mbps_max": 49581.79633408092,
        "bandwidth_mbps_stddev": 150.6255,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3795.0747219285613,
          "retransmits": 0,
          "duration_sec": 30.000564,
          "bytes_transferred": 14231797760
        },
        {
          "bandwidth_mbps": 3790.4166359320607,
          "retransmits": 0,
          "duration_sec": 30.001469,
          "bytes_transferred": 14214758400
        },
        {
          "bandwidth_mbps": 5251.68622699308,
          "retransmits": 4,
          "duration_sec": 30.001408,
          "bytes_transferred": 19694747648
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4279.059194951234,
        "bandwidth_mbps_min": 3790.4166359320607,
        "bandwidth_mbps_max": 5251.68622699308,
        "bandwidth_mbps_stddev": 842.3229,
        "retransmits_avg": 1.3333333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 91.339318759796,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 20456.80861984498,
          "retransmits": 0,
          "duration_sec": 30.001282,
          "bytes_transferred": 76716310528
        },
        {
          "bandwidth_mbps": 20316.266950531022,
          "retransmits": 0,
          "duration_sec": 30.001184,
          "bytes_transferred": 76189007872
        },
        {
          "bandwidth_mbps": 19614.224644046593,
          "retransmits": 0,
          "duration_sec": 30.001258,
          "bytes_transferred": 73556426752
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 20129.100071474197,
        "bandwidth_mbps_min": 19614.224644046593,
        "bandwidth_mbps_max": 20456.80861984498,
        "bandwidth_mbps_stddev": 451.3984,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5397.040463047373,
          "retransmits": 0,
          "duration_sec": 30.00125,
          "bytes_transferred": 20239745024
        },
        {
          "bandwidth_mbps": 5125.1873983605565,
          "retransmits": 0,
          "duration_sec": 30.001271,
          "bytes_transferred": 19220267008
        },
        {
          "bandwidth_mbps": 3881.89924004402,
          "retransmits": 0,
          "duration_sec": 30.001343,
          "bytes_transferred": 14557773824
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4801.375700483984,
        "bandwidth_mbps_min": 3881.89924004402,
        "bandwidth_mbps_max": 5397.040463047373,
        "bandwidth_mbps_stddev": 807.8080,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 76.14709210329667,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.64",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.64",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.90.156.106",
      "hops": [
        {
          "hop": 1,
          "host": "100.90.156.106",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.200,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c6in/results/c6in.8xlarge-ena-express.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.8xlarge",
    "vcpus": 32,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-64 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37774.77081855345,
          "retransmits": 0,
          "duration_sec": 30.001364,
          "bytes_transferred": 141661831168
        },
        {
          "bandwidth_mbps": 37851.53902975372,
          "retransmits": 0,
          "duration_sec": 30.000548,
          "bytes_transferred": 141945864192
        },
        {
          "bandwidth_mbps": 37870.30145435957,
          "retransmits": 0,
          "duration_sec": 30.001384,
          "bytes_transferred": 142020182016
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37832.203767555584,
        "bandwidth_mbps_min": 37774.77081855345,
        "bandwidth_mbps_max": 37870.30145435957,
        "bandwidth_mbps_stddev": 50.6154,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6571.101147245526,
          "retransmits": 0,
          "duration_sec": 30.001163,
          "bytes_transferred": 24642584576
        },
        {
          "bandwidth_mbps": 6421.101734123545,
          "retransmits": 0,
          "duration_sec": 30.001438,
          "bytes_transferred": 24080285696
        },
        {
          "bandwidth_mbps": 6738.455075756364,
          "retransmits": 0,
          "duration_sec": 30.00144,
          "bytes_transferred": 25270419456
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6576.885985708478,
        "bandwidth_mbps_min": 6421.101734123545,
        "bandwidth_mbps_max": 6738.455075756364,
        "bandwidth_mbps_stddev": 158.7557,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 82.61564135645534,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9472.46047456521,
          "retransmits": 0,
          "duration_sec": 30.001188,
          "bytes_transferred": 35523133440
        },
        {
          "bandwidth_mbps": 9472.922951769413,
          "retransmits": 0,
          "duration_sec": 30.001273,
          "bytes_transferred": 35524968448
        },
        {
          "bandwidth_mbps": 9472.024038025811,
          "retransmits": 0,
          "duration_sec": 30.000467,
          "bytes_transferred": 35520643072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9472.469154786811,
        "bandwidth_mbps_min": 9472.024038025811,
        "bandwidth_mbps_max": 9472.922951769413,
        "bandwidth_mbps_stddev": 0.4495,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 6336.065136425188,
          "retransmits": 0,
          "duration_sec": 30.001278,
          "bytes_transferred": 23761256448
        },
        {
          "bandwidth_mbps": 6460.864117690782,
          "retransmits": 0,
          "duration_sec": 30.00133,
          "bytes_transferred": 24229314560
        },
        {
          "bandwidth_mbps": 6549.492150065305,
          "retransmits": 0,
          "duration_sec": 30.001205,
          "bytes_transferred": 24561582080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6448.807134727092,
        "bandwidth_mbps_min": 6336.065136425188,
        "bandwidth_mbps_max": 6549.492150065305,
        "bandwidth_mbps_stddev": 107.2231,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 31.920526429286333,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.64",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.64",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.90.156.106",
      "hops": [
        {
          "hop": 1,
          "host": "100.90.156.106",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.300,
          "best_ms": 0.300,
          "worst_ms": 0.500,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c6in/results/c6in.8xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.large",
    "vcpus": 2,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-38 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 24768.34694474493,
          "retransmits": 0,
          "duration_sec": 30.003256,
          "bytes_transferred": 92891381760
        },
        {
          "bandwidth_mbps": 24778.369011774066,
          "retransmits": 0,
          "duration_sec": 30.002208,
          "bytes_transferred": 92925722624
        },
        {
          "bandwidth_mbps": 24833.046787133007,
          "retransmits": 0,
          "duration_sec": 30.001133,
          "bytes_transferred": 93127442432
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24793.254247884,
        "bandwidth_mbps_min": 24768.34694474493,
        "bandwidth_mbps_max": 24833.046787133007,
        "bandwidth_mbps_stddev": 34.8238,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2802.960856537079,
          "retransmits": 0,
          "duration_sec": 30.000616,
          "bytes_transferred": 10511319040
        },
        {
          "bandwidth_mbps": 2811.582146601574,
          "retransmits": 0,
          "duration_sec": 30.000742,
          "bytes_transferred": 10543693824
        },
        {
          "bandwidth_mbps": 2811.7112626286075,
          "retransmits": 0,
          "duration_sec": 30.001229,
          "bytes_transferred": 10544349184
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2808.75142192242,
        "bandwidth_mbps_min": 2802.960856537079,
        "bandwidth_mbps_max": 2811.7112626286075,
        "bandwidth_mbps_stddev": 5.0152,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 88.67130795400875,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9480.2330931745,
          "retransmits": 0,
          "duration_sec": 30.001256,
          "bytes_transferred": 35552362496
        },
        {
          "bandwidth_mbps": 9473.38454042198,
          "retransmits": 0,
          "duration_sec": 30.000586,
          "bytes_transferred": 35525885952
        },
        {
          "bandwidth_mbps": 9476.458613535111,
          "retransmits": 0,
          "duration_sec": 30.000702,
          "bytes_transferred": 35537551360
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9476.692082377196,
        "bandwidth_mbps_min": 9473.38454042198,
        "bandwidth_mbps_max": 9480.2330931745,
        "bandwidth_mbps_stddev": 3.4302,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2822.350325366884,
          "retransmits": 0,
          "duration_sec": 30.001824,
          "bytes_transferred": 10584457216
        },
        {
          "bandwidth_mbps": 2833.8844285313394,
          "retransmits": 0,
          "duration_sec": 30.000709,
          "bytes_transferred": 10627317760
        },
        {
          "bandwidth_mbps": 2836.160004863532,
          "retransmits": 0,
          "duration_sec": 30.002888,
          "bytes_transferred": 10636623872
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2830.798252920585,
        "bandwidth_mbps_min": 2822.350325366884,
        "bandwidth_mbps_max": 2836.160004863532,
        "bandwidth_mbps_stddev": 7.4041,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 70.12883579720057,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.38",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.38",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.89.156.118",
      "hops": [
        {
          "hop": 1,
          "host": "100.89.156.118",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.400,
          "best_ms": 0.400,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c6in/results/c6in.large.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.xlarge",
    "vcpus": 4,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-03-22",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-68 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:50:29 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 29731.838049176506,
          "retransmits": 0,
          "duration_sec": 30.001033,
          "bytes_transferred": 111498231808
        },
        {
          "bandwidth_mbps": 29724.0880773541,
          "retransmits": 0,
          "duration_sec": 30.002082,
          "bytes_transferred": 111473065984
        },
        {
          "bandwidth_mbps": 29765.138385363047,
          "retransmits": 0,
          "duration_sec": 30.001605,
          "bytes_transferred": 111625240576
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 29740.354837297884,
        "bandwidth_mbps_min": 29724.0880773541,
        "bandwidth_mbps_max": 29765.138385363047,
        "bandwidth_mbps_stddev": 21.8102,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3974.1357736868786,
          "retransmits": 0,
          "duration_sec": 30.001336,
          "bytes_transferred": 14903672832
        },
        {
          "bandwidth_mbps": 4045.76659428946,
          "retransmits": 0,
          "duration_sec": 30.000697,
          "bytes_transferred": 15171977216
        },
        {
          "bandwidth_mbps": 4089.76391216774,
          "retransmits": 0,
          "duration_sec": 30.001004,
          "bytes_transferred": 15337127936
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4036.5554267146927,
        "bandwidth_mbps_min": 3974.1357736868786,
        "bandwidth_mbps_max": 4089.76391216774,
        "bandwidth_mbps_stddev": 58.3618,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 86.42734611339478,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9467.24721530855,
          "retransmits": 0,
          "duration_sec": 30.000541,
          "bytes_transferred": 35502817280
        },
        {
          "bandwidth_mbps": 9465.84268657255,
          "retransmits": 0,
          "duration_sec": 30.000783,
          "bytes_transferred": 35497836544
        },
        {
          "bandwidth_mbps": 9465.774637798571,
          "retransmits": 0,
          "duration_sec": 30.001331,
          "bytes_transferred": 35498229760
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9466.288179893223,
        "bandwidth_mbps_min": 9465.774637798571,
        "bandwidth_mbps_max": 9467.24721530855,
        "bandwidth_mbps_stddev": 0.8312,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3894.7969978665233,
          "retransmits": 0,
          "duration_sec": 30.000798,
          "bytes_transferred": 14605877248
        },
        {
          "bandwidth_mbps": 3922.820822139247,
          "retransmits": 0,
          "duration_sec": 30.000587,
          "bytes_transferred": 14710865920
        },
        {
          "bandwidth_mbps": 3903.6533361110714,
          "retransmits": 0,
          "duration_sec": 30.000425,
          "bytes_transferred": 14638907392
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3907.0903853722807,
        "bandwidth_mbps_min": 3894.7969978665233,
        "bandwidth_mbps_max": 3922.820822139247,
        "bandwidth_mbps_stddev": 14.3246,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 58.726268299425975,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.68",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.68",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.85.221.57",
      "hops": [
        {
          "hop": 1,
          "host": "100.85.221.57",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c6in/results/c6in.xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7g",
    "instance_type": "c7g.xlarge",
    "vcpus": 4,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-250 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12411.508447595514,
          "retransmits": 0,
          "duration_sec": 30.000667,
          "bytes_transferred": 46544191488
        },
        {
          "bandwidth_mbps": 12411.5138257986,
          "retransmits": 0,
          "duration_sec": 30.000654,
          "bytes_transferred": 46544191488
        },
        {
          "bandwidth_mbps": 12411.381678423171,
          "retransmits": 0,
          "duration_sec": 30.000551,
          "bytes_transferred": 46543536128
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12411.467983939094,
        "bandwidth_mbps_min": 12411.381678423171,
        "bandwidth_mbps_max": 12411.5138257986,
        "bandwidth_mbps_stddev": 0.0748,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3616.590776395175,
          "retransmits": 52,
          "duration_sec": 30.001307,
          "bytes_transferred": 13562806272
        },
        {
          "bandwidth_mbps": 3625.266181490771,
          "retransmits": 0,
          "duration_sec": 30.000666,
          "bytes_transferred": 13595049984
        },
        {
          "bandwidth_mbps": 3597.4659841999437,
          "retransmits": 0,
          "duration_sec": 30.000779,
          "bytes_transferred": 13490847744
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3613.1076473619632,
        "bandwidth_mbps_min": 3597.4659841999437,
        "bandwidth_mbps_max": 3625.266181490771,
        "bandwidth_mbps_stddev": 14.2236,
        "retransmits_avg": 17.333333333333332
      }
    },
    "overhead": {
      "bandwidth_pct": 70.88895808265822,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9479.109180950622,
          "retransmits": 0,
          "duration_sec": 30.000499,
          "bytes_transferred": 35547250688
        },
        {
          "bandwidth_mbps": 9478.906412848855,
          "retransmits": 0,
          "duration_sec": 30.001362,
          "bytes_transferred": 35547512832
        },
        {
          "bandwidth_mbps": 9478.2887401618,
          "retransmits": 0,
          "duration_sec": 30.000662,
          "bytes_transferred": 35544367104
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9478.768111320425,
        "bandwidth_mbps_min": 9478.2887401618,
        "bandwidth_mbps_max": 9479.109180950622,
        "bandwidth_mbps_stddev": 0.4273,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3266.7993241886743,
          "retransmits": 0,
          "duration_sec": 30.000681,
          "bytes_transferred": 12250775552
        },
        {
          "bandwidth_mbps": 3260.986802991765,
          "retransmits": 0,
          "duration_sec": 30.001421,
          "bytes_transferred": 12229279744
        },
        {
          "bandwidth_mbps": 3247.71042004137,
          "retransmits": 260,
          "duration_sec": 30.002021,
          "bytes_transferred": 12179734528
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3258.4988490739365,
        "bandwidth_mbps_min": 3247.71042004137,
        "bandwidth_mbps_max": 3266.7993241886743,
        "bandwidth_mbps_stddev": 9.7846,
        "retransmits_avg": 86.66666666666667
      }
    },
    "overhead_single": {
      "bandwidth_pct": 65.62318213922404,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.250",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.250",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.99.151.16",
      "hops": [
        {
          "hop": 1,
          "host": "100.99.151.16",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c7g/results/c7g.xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7gn",
    "instance_type": "c7gn.16xlarge",
    "vcpus": 64,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": true,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-71 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 96262.5055071408,
          "retransmits": 0,
          "duration_sec": 30.001412,
          "bytes_transferred": 361001385984
        },
        {
          "bandwidth_mbps": 96025.89951136716,
          "retransmits": 0,
          "duration_sec": 30.001463,
          "bytes_transferred": 360114683904
        },
        {
          "bandwidth_mbps": 62334.676517738095,
          "retransmits": 0,
          "duration_sec": 30.001339,
          "bytes_transferred": 233765470208
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 84874.36051208201,
        "bandwidth_mbps_min": 62334.676517738095,
        "bandwidth_mbps_max": 96262.5055071408,
        "bandwidth_mbps_stddev": 19520.2974,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5304.324039833077,
          "retransmits": 0,
          "duration_sec": 30.001398,
          "bytes_transferred": 19892142080
        },
        {
          "bandwidth_mbps": 5479.845108351737,
          "retransmits": 0,
          "duration_sec": 30.001411,
          "bytes_transferred": 20550385664
        },
        {
          "bandwidth_mbps": 5455.172507839302,
          "retransmits": 0,
          "duration_sec": 30.001396,
          "bytes_transferred": 20457848832
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5413.113885341372,
        "bandwidth_mbps_min": 5304.324039833077,
        "bandwidth_mbps_max": 5479.845108351737,
        "bandwidth_mbps_stddev": 95.0190,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 93.62220362818427,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 24053.029009414993,
          "retransmits": 0,
          "duration_sec": 30.001191,
          "bytes_transferred": 90202439680
        },
        {
          "bandwidth_mbps": 24080.409473455133,
          "retransmits": 0,
          "duration_sec": 30.001261,
          "bytes_transferred": 90305331200
        },
        {
          "bandwidth_mbps": 24141.767099077708,
          "retransmits": 0,
          "duration_sec": 30.001238,
          "bytes_transferred": 90535362560
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24091.735193982615,
        "bandwidth_mbps_min": 24053.029009414993,
        "bandwidth_mbps_max": 24141.767099077708,
        "bandwidth_mbps_stddev": 45.4402,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4606.129623650253,
          "retransmits": 0,
          "duration_sec": 30.001269,
          "bytes_transferred": 17273716736
        },
        {
          "bandwidth_mbps": 4641.258373167785,
          "retransmits": 0,
          "duration_sec": 30.00125,
          "bytes_transferred": 17405444096
        },
        {
          "bandwidth_mbps": 4836.737812429356,
          "retransmits": 0,
          "duration_sec": 30.001262,
          "bytes_transferred": 18138529792
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4694.708603082465,
        "bandwidth_mbps_min": 4606.129623650253,
        "bandwidth_mbps_max": 4836.737812429356,
        "bandwidth_mbps_stddev": 124.2487,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 80.51319855011913,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.71",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.71",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.113.84.87",
      "hops": [
        {
          "hop": 1,
          "host": "100.113.84.87",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.400,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c7gn/results/c7gn.16xlarge-ena-express.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7gn",
    "instance_type": "c7gn.16xlarge",
    "vcpus": 64,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-71 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37510.627778543116,
          "retransmits": 0,
          "duration_sec": 30.001379,
          "bytes_transferred": 140671320064
        },
        {
          "bandwidth_mbps": 37807.94879954433,
          "retransmits": 0,
          "duration_sec": 30.000358,
          "bytes_transferred": 141781499904
        },
        {
          "bandwidth_mbps": 37798.361120098656,
          "retransmits": 0,
          "duration_sec": 30.001393,
          "bytes_transferred": 141750435840
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37705.645899395364,
        "bandwidth_mbps_min": 37510.627778543116,
        "bandwidth_mbps_max": 37807.94879954433,
        "bandwidth_mbps_stddev": 168.9587,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5485.48500042048,
          "retransmits": 0,
          "duration_sec": 30.001341,
          "bytes_transferred": 20571488256
        },
        {
          "bandwidth_mbps": 5502.042957811053,
          "retransmits": 0,
          "duration_sec": 30.001389,
          "bytes_transferred": 20633616384
        },
        {
          "bandwidth_mbps": 5574.784545571328,
          "retransmits": 0,
          "duration_sec": 30.001342,
          "bytes_transferred": 20906377216
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5520.770834600954,
        "bandwidth_mbps_min": 5485.48500042048,
        "bandwidth_mbps_max": 5574.784545571328,
        "bandwidth_mbps_stddev": 47.5042,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 85.35823826137008,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9446.116440804004,
          "retransmits": 0,
          "duration_sec": 30.00127,
          "bytes_transferred": 35424436224
        },
        {
          "bandwidth_mbps": 9483.03392009684,
          "retransmits": 0,
          "duration_sec": 30.001241,
          "bytes_transferred": 35562848256
        },
        {
          "bandwidth_mbps": 9457.830087769,
          "retransmits": 0,
          "duration_sec": 30.001254,
          "bytes_transferred": 35468345344
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9462.32681622328,
        "bandwidth_mbps_min": 9446.116440804004,
        "bandwidth_mbps_max": 9483.03392009684,
        "bandwidth_mbps_stddev": 18.8651,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4768.587848906076,
          "retransmits": 0,
          "duration_sec": 30.001233,
          "bytes_transferred": 17882939392
        },
        {
          "bandwidth_mbps": 4908.07325932311,
          "retransmits": 0,
          "duration_sec": 30.00126,
          "bytes_transferred": 18406047744
        },
        {
          "bandwidth_mbps": 4827.230157871994,
          "retransmits": 0,
          "duration_sec": 30.001268,
          "bytes_transferred": 18102878208
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4834.630422033727,
        "bandwidth_mbps_min": 4768.587848906076,
        "bandwidth_mbps_max": 4908.07325932311,
        "bandwidth_mbps_stddev": 70.0365,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 48.90653730386176,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.71",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.71",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.113.84.87",
      "hops": [
        {
          "hop": 1,
          "host": "100.113.84.87",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.400,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c7gn/results/c7gn.16xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7gn",
    "instance_type": "c7gn.2xlarge",
    "vcpus": 8,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-138 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37839.70513109344,
          "retransmits": 0,
          "duration_sec": 30.001617,
          "bytes_transferred": 141906542592
        },
        {
          "bandwidth_mbps": 37777.54361560936,
          "retransmits": 0,
          "duration_sec": 30.001438,
          "bytes_transferred": 141672579072
        },
        {
          "bandwidth_mbps": 37823.39435482234,
          "retransmits": 0,
          "duration_sec": 30.000721,
          "bytes_transferred": 141841137664
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37813.54770050838,
        "bandwidth_mbps_min": 37777.54361560936,
        "bandwidth_mbps_max": 37839.70513109344,
        "bandwidth_mbps_stddev": 32.2293,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4693.206268479685,
          "retransmits": 0,
          "duration_sec": 30.000512,
          "bytes_transferred": 17599823872
        },
        {
          "bandwidth_mbps": 4678.332754362859,
          "retransmits": 0,
          "duration_sec": 30.00153,
          "bytes_transferred": 17544642560
        },
        {
          "bandwidth_mbps": 4699.9352294697655,
          "retransmits": 0,
          "duration_sec": 30.000619,
          "bytes_transferred": 17625120768
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4690.491417437436,
        "bandwidth_mbps_min": 4678.332754362859,
        "bandwidth_mbps_max": 4699.9352294697655,
        "bandwidth_mbps_stddev": 11.0542,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 87.59573829309231,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9418.571871066833,
          "retransmits": 0,
          "duration_sec": 30.00128,
          "bytes_transferred": 35321151488
        },
        {
          "bandwidth_mbps": 9470.551962442903,
          "retransmits": 0,
          "duration_sec": 30.001255,
          "bytes_transferred": 35516055552
        },
        {
          "bandwidth_mbps": 9428.37928619417,
          "retransmits": 0,
          "duration_sec": 30.001324,
          "bytes_transferred": 35357982720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9439.167706567969,
        "bandwidth_mbps_min": 9418.571871066833,
        "bandwidth_mbps_max": 9470.551962442903,
        "bandwidth_mbps_stddev": 27.6184,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4260.293425119362,
          "retransmits": 0,
          "duration_sec": 30.000499,
          "bytes_transferred": 15976366080
        },
        {
          "bandwidth_mbps": 4354.257624838224,
          "retransmits": 0,
          "duration_sec": 30.000407,
          "bytes_transferred": 16328687616
        },
        {
          "bandwidth_mbps": 4376.951179880578,
          "retransmits": 0,
          "duration_sec": 30.001299,
          "bytes_transferred": 16414277632
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4330.500743279388,
        "bandwidth_mbps_min": 4260.293425119362,
        "bandwidth_mbps_max": 4376.951179880578,
        "bandwidth_mbps_stddev": 61.8510,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 54.122006538075006,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.138",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.138",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.70.143.107",
      "hops": [
        {
          "hop": 1,
          "host": "100.70.143.107",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.300,
          "best_ms": 0.200,
          "worst_ms": 0.500,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c7gn/results/c7gn.2xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7gn",
    "instance_type": "c7gn.4xlarge",
    "vcpus": 16,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": true,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-134 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 49173.36526981555,
          "retransmits": 92292,
          "duration_sec": 30.001551,
          "bytes_transferred": 184409653248
        },
        {
          "bandwidth_mbps": 49072.923087537965,
          "retransmits": 127331,
          "duration_sec": 30.001419,
          "bytes_transferred": 184032165888
        },
        {
          "bandwidth_mbps": 49592.294519683346,
          "retransmits": 63092,
          "duration_sec": 30.000657,
          "bytes_transferred": 185975177216
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 49279.52762567895,
        "bandwidth_mbps_min": 49072.923087537965,
        "bandwidth_mbps_max": 49592.294519683346,
        "bandwidth_mbps_stddev": 275.4805,
        "retransmits_avg": 94238.33333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5553.731062356402,
          "retransmits": 12,
          "duration_sec": 30.000657,
          "bytes_transferred": 20826947584
        },
        {
          "bandwidth_mbps": 5423.8541449836575,
          "retransmits": 8,
          "duration_sec": 30.001409,
          "bytes_transferred": 20340408320
        },
        {
          "bandwidth_mbps": 5457.186328827774,
          "retransmits": 16,
          "duration_sec": 30.001085,
          "bytes_transferred": 20465188864
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5478.257178722612,
        "bandwidth_mbps_min": 5423.8541449836575,
        "bandwidth_mbps_max": 5553.731062356402,
        "bandwidth_mbps_stddev": 67.4536,
        "retransmits_avg": 12
      }
    },
    "overhead": {
      "bandwidth_pct": 88.88330013969541,
      "retransmits_pct": -99.98726632828114
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 20661.351057383607,
          "retransmits": 10,
          "duration_sec": 30.001269,
          "bytes_transferred": 77483343872
        },
        {
          "bandwidth_mbps": 21259.209380046017,
          "retransmits": 5,
          "duration_sec": 30.001388,
          "bytes_transferred": 79725723648
        },
        {
          "bandwidth_mbps": 21193.11793600328,
          "retransmits": 6,
          "duration_sec": 30.001288,
          "bytes_transferred": 79477604352
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21037.892791144302,
        "bandwidth_mbps_min": 20661.351057383607,
        "bandwidth_mbps_max": 21259.209380046017,
        "bandwidth_mbps_stddev": 327.7648,
        "retransmits_avg": 7
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4605.008273511457,
          "retransmits": 10,
          "duration_sec": 30.001288,
          "bytes_transferred": 17269522432
        },
        {
          "bandwidth_mbps": 4487.261983337167,
          "retransmits": 18,
          "duration_sec": 30.001263,
          "bytes_transferred": 16827940864
        },
        {
          "bandwidth_mbps": 4807.095465441048,
          "retransmits": 14,
          "duration_sec": 30.001286,
          "bytes_transferred": 18027380736
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4633.121907429891,
        "bandwidth_mbps_min": 4487.261983337167,
        "bandwidth_mbps_max": 4807.095465441048,
        "bandwidth_mbps_stddev": 161.7595,
        "retransmits_avg": 14
      }
    },
    "overhead_single": {
      "bandwidth_pct": 77.97725298143853,
      "retransmits_pct": 100
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.134",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.134",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.106.211.60",
      "hops": [
        {
          "hop": 1,
          "host": "100.106.211.60",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.300,
          "best_ms": 0.200,
          "worst_ms": 0.500,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c7gn/results/c7gn.4xlarge-ena-express.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7gn",
    "instance_type": "c7gn.4xlarge",
    "vcpus": 16,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-134 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37876.99450889372,
          "retransmits": 0,
          "duration_sec": 30.000512,
          "bytes_transferred": 142041153536
        },
        {
          "bandwidth_mbps": 37819.4244826368,
          "retransmits": 0,
          "duration_sec": 30.001458,
          "bytes_transferred": 141829734400
        },
        {
          "bandwidth_mbps": 37735.36646734414,
          "retransmits": 0,
          "duration_sec": 30.001459,
          "bytes_transferred": 141514506240
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37810.595152958216,
        "bandwidth_mbps_min": 37735.36646734414,
        "bandwidth_mbps_max": 37876.99450889372,
        "bandwidth_mbps_stddev": 71.2257,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5487.599376036692,
          "retransmits": 0,
          "duration_sec": 30.000482,
          "bytes_transferred": 20578828288
        },
        {
          "bandwidth_mbps": 5440.826676973712,
          "retransmits": 0,
          "duration_sec": 30.001484,
          "bytes_transferred": 20404109312
        },
        {
          "bandwidth_mbps": 5371.737889062236,
          "retransmits": 0,
          "duration_sec": 30.001434,
          "bytes_transferred": 20144979968
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5433.38798069088,
        "bandwidth_mbps_min": 5371.737889062236,
        "bandwidth_mbps_max": 5487.599376036692,
        "bandwidth_mbps_stddev": 58.2878,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 85.62998556697994,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9456.934560919197,
          "retransmits": 0,
          "duration_sec": 30.001323,
          "bytes_transferred": 35465068544
        },
        {
          "bandwidth_mbps": 9498.323817167922,
          "retransmits": 0,
          "duration_sec": 30.0013,
          "bytes_transferred": 35620257792
        },
        {
          "bandwidth_mbps": 9449.395550754856,
          "retransmits": 0,
          "duration_sec": 30.001179,
          "bytes_transferred": 35436625920
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9468.217976280659,
        "bandwidth_mbps_min": 9449.395550754856,
        "bandwidth_mbps_max": 9498.323817167922,
        "bandwidth_mbps_stddev": 26.3435,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4659.008550901259,
          "retransmits": 0,
          "duration_sec": 30.001282,
          "bytes_transferred": 17472028672
        },
        {
          "bandwidth_mbps": 4639.39916191615,
          "retransmits": 0,
          "duration_sec": 30.001294,
          "bytes_transferred": 17398497280
        },
        {
          "bandwidth_mbps": 4720.132255522907,
          "retransmits": 0,
          "duration_sec": 30.001318,
          "bytes_transferred": 17701273600
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4672.846656113438,
        "bandwidth_mbps_min": 4639.39916191615,
        "bandwidth_mbps_max": 4720.132255522907,
        "bandwidth_mbps_stddev": 42.1079,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 50.64703128065242,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.134",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.134",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.106.211.60",
      "hops": [
        {
          "hop": 1,
          "host": "100.106.211.60",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.500,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c7gn/results/c7gn.4xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7gn",
    "instance_type": "c7gn.medium",
    "vcpus": 1,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-210 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 21977.74217027939,
          "retransmits": 4806,
          "duration_sec": 30.000847,
          "bytes_transferred": 82418860032
        },
        {
          "bandwidth_mbps": 21953.2292967105,
          "retransmits": 2109,
          "duration_sec": 30.001102,
          "bytes_transferred": 82327633920
        },
        {
          "bandwidth_mbps": 22058.25911009418,
          "retransmits": 2477,
          "duration_sec": 30.000815,
          "bytes_transferred": 82720718848
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21996.410192361353,
        "bandwidth_mbps_min": 21953.2292967105,
        "bandwidth_mbps_max": 22058.25911009418,
        "bandwidth_mbps_stddev": 54.9471,
        "retransmits_avg": 3130.6666666666665
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1454.7332340487783,
          "retransmits": 0,
          "duration_sec": 30.001981,
          "bytes_transferred": 5455609856
        },
        {
          "bandwidth_mbps": 1459.6137624133241,
          "retransmits": 0,
          "duration_sec": 30.002238,
          "bytes_transferred": 5473959936
        },
        {
          "bandwidth_mbps": 1458.6353164286766,
          "retransmits": 0,
          "duration_sec": 30.001516,
          "bytes_transferred": 5470158848
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1457.660770963593,
        "bandwidth_mbps_min": 1454.7332340487783,
        "bandwidth_mbps_max": 1459.6137624133241,
        "bandwidth_mbps_stddev": 2.5821,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 93.37318790558928,
      "retransmits_pct": -100
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9432.45927699584,
          "retransmits": 0,
          "duration_sec": 30.000353,
          "bytes_transferred": 35372138496
        },
        {
          "bandwidth_mbps": 9465.305122048112,
          "retransmits": 0,
          "duration_sec": 30.000382,
          "bytes_transferred": 35495346176
        },
        {
          "bandwidth_mbps": 9457.82915824038,
          "retransmits": 0,
          "duration_sec": 30.00037,
          "bytes_transferred": 35467296768
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9451.864519094777,
        "bandwidth_mbps_min": 9432.45927699584,
        "bandwidth_mbps_max": 9465.305122048112,
        "bandwidth_mbps_stddev": 17.2161,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1489.3759530321415,
          "retransmits": 0,
          "duration_sec": 30.000431,
          "bytes_transferred": 5585240064
        },
        {
          "bandwidth_mbps": 1501.9468763504594,
          "retransmits": 0,
          "duration_sec": 30.001365,
          "bytes_transferred": 5632557056
        },
        {
          "bandwidth_mbps": 1495.4573247326605,
          "retransmits": 0,
          "duration_sec": 30.001839,
          "bytes_transferred": 5608308736
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1495.5933847050871,
        "bandwidth_mbps_min": 1489.3759530321415,
        "bandwidth_mbps_max": 1501.9468763504594,
        "bandwidth_mbps_stddev": 6.2866,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 84.17673696355179,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.210",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.210",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.100,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.100.9.3",
      "hops": [
        {
          "hop": 1,
          "host": "100.100.9.3",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.400,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c7gn/results/c7gn.medium.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7gn",
    "instance_type": "c7gn.xlarge",
    "vcpus": 4,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-157 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37805.71847546197,
          "retransmits": 0,
          "duration_sec": 30.000852,
          "bytes_transferred": 141775470592
        },
        {
          "bandwidth_mbps": 37889.13467015588,
          "retransmits": 0,
          "duration_sec": 30.000641,
          "bytes_transferred": 142087290880
        },
        {
          "bandwidth_mbps": 37830.513568140355,
          "retransmits": 0,
          "duration_sec": 30.00109,
          "bytes_transferred": 141869580288
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37841.78890458607,
        "bandwidth_mbps_min": 37805.71847546197,
        "bandwidth_mbps_max": 37889.13467015588,
        "bandwidth_mbps_stddev": 42.8359,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4270.7515359979025,
          "retransmits": 0,
          "duration_sec": 30.000692,
          "bytes_transferred": 16015687680
        },
        {
          "bandwidth_mbps": 4262.424500292526,
          "retransmits": 0,
          "duration_sec": 30.000752,
          "bytes_transferred": 15984492544
        },
        {
          "bandwidth_mbps": 4255.1598597538905,
          "retransmits": 0,
          "duration_sec": 30.002686,
          "bytes_transferred": 15958278144
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4262.7786320147725,
        "bandwidth_mbps_min": 4255.1598597538905,
        "bandwidth_mbps_max": 4270.7515359979025,
        "bandwidth_mbps_stddev": 7.8019,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 88.73526131979939,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9463.35853010772,
          "retransmits": 0,
          "duration_sec": 30.000348,
          "bytes_transferred": 35488006144
        },
        {
          "bandwidth_mbps": 9451.035403767019,
          "retransmits": 0,
          "duration_sec": 30.001299,
          "bytes_transferred": 35442917376
        },
        {
          "bandwidth_mbps": 9432.998790952595,
          "retransmits": 0,
          "duration_sec": 30.001305,
          "bytes_transferred": 35375284224
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9449.130908275778,
        "bandwidth_mbps_min": 9432.998790952595,
        "bandwidth_mbps_max": 9463.35853010772,
        "bandwidth_mbps_stddev": 15.2692,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3831.185501345127,
          "retransmits": 0,
          "duration_sec": 30.000521,
          "bytes_transferred": 14367195136
        },
        {
          "bandwidth_mbps": 3870.786651857411,
          "retransmits": 0,
          "duration_sec": 30.001058,
          "bytes_transferred": 14515961856
        },
        {
          "bandwidth_mbps": 3833.1163611763022,
          "retransmits": 0,
          "duration_sec": 30.000728,
          "bytes_transferred": 14374535168
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3845.0295047929467,
        "bandwidth_mbps_min": 3831.185501345127,
        "bandwidth_mbps_max": 3870.786651857411,
        "bandwidth_mbps_stddev": 22.3272,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 59.308114766138154,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.157",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.157",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.86.58.57",
      "hops": [
        {
          "hop": 1,
          "host": "100.86.58.57",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.300,
          "best_ms": 0.300,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c7gn/results/c7gn.xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.12xlarge",
    "vcpus": 48,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": true,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-7 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 18534.835242732424,
          "retransmits": 0,
          "duration_sec": 30.00176,
          "bytes_transferred": 69509709824
        },
        {
          "bandwidth_mbps": 18555.21880965984,
          "retransmits": 0,
          "duration_sec": 30.001861,
          "bytes_transferred": 69586386944
        },
        {
          "bandwidth_mbps": 18625.10265674273,
          "retransmits": 0,
          "duration_sec": 30.001663,
          "bytes_transferred": 69848006656
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18571.718903045,
        "bandwidth_mbps_min": 18534.835242732424,
        "bandwidth_mbps_max": 18625.10265674273,
        "bandwidth_mbps_stddev": 47.3418,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3512.6464741704394,
          "retransmits": 0,
          "duration_sec": 30.001904,
          "bytes_transferred": 13173260288
        },
        {
          "bandwidth_mbps": 3507.0954526407236,
          "retransmits": 0,
          "duration_sec": 30.001852,
          "bytes_transferred": 13152419840
        },
        {
          "bandwidth_mbps": 3495.5515756647733,
          "retransmits": 0,
          "duration_sec": 30.00194,
          "bytes_transferred": 13109166080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3505.097834158645,
        "bandwidth_mbps_min": 3495.5515756647733,
        "bandwidth_mbps_max": 3512.6464741704394,
        "bandwidth_mbps_stddev": 8.7208,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 81.12669132858804,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 18417.98182527539,
          "retransmits": 0,
          "duration_sec": 30.001555,
          "bytes_transferred": 69071011840
        },
        {
          "bandwidth_mbps": 18421.418806777627,
          "retransmits": 0,
          "duration_sec": 30.001365,
          "bytes_transferred": 69083463680
        },
        {
          "bandwidth_mbps": 18418.78152383001,
          "retransmits": 0,
          "duration_sec": 30.001391,
          "bytes_transferred": 69073633280
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18419.394051961008,
        "bandwidth_mbps_min": 18417.98182527539,
        "bandwidth_mbps_max": 18421.418806777627,
        "bandwidth_mbps_stddev": 1.7985,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3513.2293334558153,
          "retransmits": 0,
          "duration_sec": 30.001702,
          "bytes_transferred": 13175357440
        },
        {
          "bandwidth_mbps": 3519.915682391712,
          "retransmits": 0,
          "duration_sec": 30.00161,
          "bytes_transferred": 13200392192
        },
        {
          "bandwidth_mbps": 3530.523972066698,
          "retransmits": 0,
          "duration_sec": 30.001752,
          "bytes_transferred": 13240238080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3521.222995971408,
        "bandwidth_mbps_min": 3513.2293334558153,
        "bandwidth_mbps_max": 3530.523972066698,
        "bandwidth_mbps_stddev": 8.7211,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 80.88306821582698,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.7",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.7",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.500,
          "best_ms": 0.400,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.116.248.84",
      "hops": [
        {
          "hop": 1,
          "host": "100.116.248.84",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.100,
          "avg_ms": 1.200,
          "best_ms": 0.800,
          "worst_ms": 1.800,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c7i/results/c7i.12xlarge-ena-express.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.12xlarge",
    "vcpus": 48,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-10 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 18599.157769859867,
          "retransmits": 0,
          "duration_sec": 30.001738,
          "bytes_transferred": 69750882304
        },
        {
          "bandwidth_mbps": 18553.68163153803,
          "retransmits": 0,
          "duration_sec": 30.001973,
          "bytes_transferred": 69580881920
        },
        {
          "bandwidth_mbps": 18628.215122496556,
          "retransmits": 0,
          "duration_sec": 30.00166,
          "bytes_transferred": 69859672064
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18593.684841298153,
        "bandwidth_mbps_min": 18553.68163153803,
        "bandwidth_mbps_max": 18628.215122496556,
        "bandwidth_mbps_stddev": 37.5669,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5970.55358138745,
          "retransmits": 0,
          "duration_sec": 30.001948,
          "bytes_transferred": 22391029760
        },
        {
          "bandwidth_mbps": 5993.203349996924,
          "retransmits": 0,
          "duration_sec": 30.001938,
          "bytes_transferred": 22475964416
        },
        {
          "bandwidth_mbps": 5799.809601337292,
          "retransmits": 0,
          "duration_sec": 30.000925,
          "bytes_transferred": 21749956608
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5921.188844240555,
        "bandwidth_mbps_min": 5799.809601337292,
        "bandwidth_mbps_max": 5993.203349996924,
        "bandwidth_mbps_stddev": 105.7258,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 68.15483915759887,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9466.790201354546,
          "retransmits": 0,
          "duration_sec": 30.001657,
          "bytes_transferred": 35502424064
        },
        {
          "bandwidth_mbps": 9468.30893189937,
          "retransmits": 0,
          "duration_sec": 30.001939,
          "bytes_transferred": 35508453376
        },
        {
          "bandwidth_mbps": 9461.92908355342,
          "retransmits": 0,
          "duration_sec": 30.001334,
          "bytes_transferred": 35483811840
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9465.676072269112,
        "bandwidth_mbps_min": 9461.92908355342,
        "bandwidth_mbps_max": 9468.30893189937,
        "bandwidth_mbps_stddev": 3.3327,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5749.709692074423,
          "retransmits": 0,
          "duration_sec": 30.00173,
          "bytes_transferred": 21562654720
        },
        {
          "bandwidth_mbps": 5770.061226474708,
          "retransmits": 0,
          "duration_sec": 30.001858,
          "bytes_transferred": 21639069696
        },
        {
          "bandwidth_mbps": 5666.847666820105,
          "retransmits": 0,
          "duration_sec": 30.00133,
          "bytes_transferred": 21251620864
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5728.872861789746,
        "bandwidth_mbps_min": 5666.847666820105,
        "bandwidth_mbps_max": 5770.061226474708,
        "bandwidth_mbps_stddev": 54.6707,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 39.47740427571572,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.10",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.10",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.500,
          "best_ms": 0.400,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.86.4.85",
      "hops": [
        {
          "hop": 1,
          "host": "100.86.4.85",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.600,
          "avg_ms": 1.200,
          "best_ms": 0.800,
          "worst_ms": 1.900,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c7i/results/c7i.12xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.16xlarge",
    "vcpus": 64,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": true,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-216 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 24835.065580701248,
          "retransmits": 0,
          "duration_sec": 30.001692,
          "bytes_transferred": 93136748544
        },
        {
          "bandwidth_mbps": 24844.540155119703,
          "retransmits": 0,
          "duration_sec": 30.001604,
          "bytes_transferred": 93172006912
        },
        {
          "bandwidth_mbps": 24845.418247913494,
          "retransmits": 0,
          "duration_sec": 30.001852,
          "bytes_transferred": 93176070144
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24841.674661244815,
        "bandwidth_mbps_min": 24835.065580701248,
        "bandwidth_mbps_max": 24845.418247913494,
        "bandwidth_mbps_stddev": 5.7404,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4466.326196201529,
          "retransmits": 208,
          "duration_sec": 30.001968,
          "bytes_transferred": 16749821952
        },
        {
          "bandwidth_mbps": 4484.32342718678,
          "retransmits": 0,
          "duration_sec": 30.00245,
          "bytes_transferred": 16817586176
        },
        {
          "bandwidth_mbps": 4482.291574418023,
          "retransmits": 0,
          "duration_sec": 30.002248,
          "bytes_transferred": 16809852928
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4477.647065935444,
        "bandwidth_mbps_min": 4466.326196201529,
        "bandwidth_mbps_max": 4484.32342718678,
        "bandwidth_mbps_stddev": 9.8567,
        "retransmits_avg": 69.33333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 81.97526081878465,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 17798.520623994402,
          "retransmits": 0,
          "duration_sec": 30.001487,
          "bytes_transferred": 66747760640
        },
        {
          "bandwidth_mbps": 18112.272885644266,
          "retransmits": 0,
          "duration_sec": 30.001373,
          "bytes_transferred": 67924131840
        },
        {
          "bandwidth_mbps": 18263.659129624848,
          "retransmits": 0,
          "duration_sec": 30.001293,
          "bytes_transferred": 68491673600
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18058.150879754507,
        "bandwidth_mbps_min": 17798.520623994402,
        "bandwidth_mbps_max": 18263.659129624848,
        "bandwidth_mbps_stddev": 237.2453,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4458.477522105382,
          "retransmits": 0,
          "duration_sec": 30.001631,
          "bytes_transferred": 16720199680
        },
        {
          "bandwidth_mbps": 4499.93331970951,
          "retransmits": 0,
          "duration_sec": 30.001369,
          "bytes_transferred": 16875520000
        },
        {
          "bandwidth_mbps": 4464.969582308592,
          "retransmits": 15,
          "duration_sec": 30.001455,
          "bytes_transferred": 16744448000
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4474.460141374496,
        "bandwidth_mbps_min": 4458.477522105382,
        "bandwidth_mbps_max": 4499.93331970951,
        "bandwidth_mbps_stddev": 22.2980,
        "retransmits_avg": 5
      }
    },
    "overhead_single": {
      "bandwidth_pct": 75.22193622608981,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.216",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.216",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.500,
          "best_ms": 0.400,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.66.92.80",
      "hops": [
        {
          "hop": 1,
          "host": "100.66.92.80",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.900,
          "avg_ms": 1.400,
          "best_ms": 1.200,
          "worst_ms": 2.000,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c7i/results/c7i.16xlarge-ena-express.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.16xlarge",
    "vcpus": 64,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-231 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 24751.01510921126,
          "retransmits": 0,
          "duration_sec": 30.001897,
          "bytes_transferred": 92822175744
        },
        {
          "bandwidth_mbps": 24800.55929367941,
          "retransmits": 0,
          "duration_sec": 30.002127,
          "bytes_transferred": 93008691200
        },
        {
          "bandwidth_mbps": 24741.65183917616,
          "retransmits": 0,
          "duration_sec": 30.00202,
          "bytes_transferred": 92787441664
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24764.40874735561,
        "bandwidth_mbps_min": 24741.65183917616,
        "bandwidth_mbps_max": 24800.55929367941,
        "bandwidth_mbps_stddev": 31.6554,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6114.370045137374,
          "retransmits": 0,
          "duration_sec": 30.001967,
          "bytes_transferred": 22930391040
        },
        {
          "bandwidth_mbps": 6178.922111919844,
          "retransmits": 0,
          "duration_sec": 30.001972,
          "bytes_transferred": 23172481024
        },
        {
          "bandwidth_mbps": 6263.18563561464,
          "retransmits": 265,
          "duration_sec": 30.002314,
          "bytes_transferred": 23488757760
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6185.492597557287,
        "bandwidth_mbps_min": 6114.370045137374,
        "bandwidth_mbps_max": 6263.18563561464,
        "bandwidth_mbps_stddev": 74.6251,
        "retransmits_avg": 88.33333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 75.02265181995195,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9465.23169010777,
          "retransmits": 0,
          "duration_sec": 30.001501,
          "bytes_transferred": 35496394752
        },
        {
          "bandwidth_mbps": 9470.573793766034,
          "retransmits": 0,
          "duration_sec": 30.001518,
          "bytes_transferred": 35516448768
        },
        {
          "bandwidth_mbps": 9467.607950279209,
          "retransmits": 0,
          "duration_sec": 30.001613,
          "bytes_transferred": 35505438720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9467.804478051004,
        "bandwidth_mbps_min": 9465.23169010777,
        "bandwidth_mbps_max": 9470.573793766034,
        "bandwidth_mbps_stddev": 2.6765,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5903.12778117,
          "retransmits": 0,
          "duration_sec": 30.001627,
          "bytes_transferred": 22137929728
        },
        {
          "bandwidth_mbps": 6149.4796594366435,
          "retransmits": 0,
          "duration_sec": 30.001701,
          "bytes_transferred": 23061856256
        },
        {
          "bandwidth_mbps": 5952.351834654801,
          "retransmits": 0,
          "duration_sec": 30.001911,
          "bytes_transferred": 22322741248
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6001.653091753815,
        "bandwidth_mbps_min": 5903.12778117,
        "bandwidth_mbps_max": 6149.4796594366435,
        "bandwidth_mbps_stddev": 130.3659,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 36.60987501730406,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.231",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.231",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.500,
          "best_ms": 0.400,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.76.154.107",
      "hops": [
        {
          "hop": 1,
          "host": "100.76.154.107",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.300,
          "avg_ms": 1.300,
          "best_ms": 0.900,
          "worst_ms": 2.000,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c7i/results/c7i.16xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.24xlarge",
    "vcpus": 96,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": true,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-84 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37215.38511384313,
          "retransmits": 489,
          "duration_sec": 30.001417,
          "bytes_transferred": 139564285952
        },
        {
          "bandwidth_mbps": 21051.463274300328,
          "retransmits": 0,
          "duration_sec": 30.001634,
          "bytes_transferred": 78947287040
        },
        {
          "bandwidth_mbps": 36992.912793814794,
          "retransmits": 0,
          "duration_sec": 30.001255,
          "bytes_transferred": 138729226240
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 31753.253727319418,
        "bandwidth_mbps_min": 21051.463274300328,
        "bandwidth_mbps_max": 37215.38511384313,
        "bandwidth_mbps_stddev": 9268.6899,
        "retransmits_avg": 163
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3533.254087900429,
          "retransmits": 0,
          "duration_sec": 30.002015,
          "bytes_transferred": 13250592768
        },
        {
          "bandwidth_mbps": 3583.408918417583,
          "retransmits": 0,
          "duration_sec": 30.002004,
          "bytes_transferred": 13438681088
        },
        {
          "bandwidth_mbps": 4589.45206953418,
          "retransmits": 7,
          "duration_sec": 30.001993,
          "bytes_transferred": 17211588608
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3902.0383586173975,
        "bandwidth_mbps_min": 3533.254087900429,
        "bandwidth_mbps_max": 4589.45206953418,
        "bandwidth_mbps_stddev": 595.8457,
        "retransmits_avg": 2.3333333333333335
      }
    },
    "overhead": {
      "bandwidth_pct": 87.71137473933823,
      "retransmits_pct": -98.5685071574642
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 19078.351033832878,
          "retransmits": 0,
          "duration_sec": 30.001319,
          "bytes_transferred": 71546961920
        },
        {
          "bandwidth_mbps": 18410.992408002236,
          "retransmits": 0,
          "duration_sec": 30.001326,
          "bytes_transferred": 69044273152
        },
        {
          "bandwidth_mbps": 18571.256641432272,
          "retransmits": 0,
          "duration_sec": 30.001247,
          "bytes_transferred": 69645107200
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18686.86669442246,
        "bandwidth_mbps_min": 18410.992408002236,
        "bandwidth_mbps_max": 19078.351033832878,
        "bandwidth_mbps_stddev": 348.3764,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4631.9772686212755,
          "retransmits": 0,
          "duration_sec": 30.000468,
          "bytes_transferred": 17370185728
        },
        {
          "bandwidth_mbps": 4607.650356874205,
          "retransmits": 0,
          "duration_sec": 30.001608,
          "bytes_transferred": 17279614976
        },
        {
          "bandwidth_mbps": 4656.843475300148,
          "retransmits": 0,
          "duration_sec": 30.001495,
          "bytes_transferred": 17464033280
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4632.1570335985425,
        "bandwidth_mbps_min": 4607.650356874205,
        "bandwidth_mbps_max": 4656.843475300148,
        "bandwidth_mbps_stddev": 24.5971,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 75.21169755558262,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.84",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.84",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.500,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.69.105.46",
      "hops": [
        {
          "hop": 1,
          "host": "100.69.105.46",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.200,
          "avg_ms": 1.100,
          "best_ms": 1.000,
          "worst_ms": 2.000,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c7i/results/c7i.24xlarge-ena-express.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.24xlarge",
    "vcpus": 96,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-51 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37047.9901447269,
          "retransmits": 0,
          "duration_sec": 30.001401,
          "bytes_transferred": 138936451072
        },
        {
          "bandwidth_mbps": 37044.44573705165,
          "retransmits": 0,
          "duration_sec": 30.001724,
          "bytes_transferred": 138924654592
        },
        {
          "bandwidth_mbps": 37097.33536802651,
          "retransmits": 0,
          "duration_sec": 30.001575,
          "bytes_transferred": 139122311168
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37063.25708326835,
        "bandwidth_mbps_min": 37044.44573705165,
        "bandwidth_mbps_max": 37097.33536802651,
        "bandwidth_mbps_stddev": 29.5658,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6176.337853104407,
          "retransmits": 0,
          "duration_sec": 30.001962,
          "bytes_transferred": 23162781696
        },
        {
          "bandwidth_mbps": 6272.129089377479,
          "retransmits": 0,
          "duration_sec": 30.001663,
          "bytes_transferred": 23521787904
        },
        {
          "bandwidth_mbps": 6519.788397015416,
          "retransmits": 0,
          "duration_sec": 30.001505,
          "bytes_transferred": 24450433024
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6322.751779832433,
        "bandwidth_mbps_min": 6176.337853104407,
        "bandwidth_mbps_max": 6519.788397015416,
        "bandwidth_mbps_stddev": 177.2331,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 82.94064721395804,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9460.34556824209,
          "retransmits": 0,
          "duration_sec": 30.001368,
          "bytes_transferred": 35477913600
        },
        {
          "bandwidth_mbps": 9458.804619151584,
          "retransmits": 0,
          "duration_sec": 30.001267,
          "bytes_transferred": 35472015360
        },
        {
          "bandwidth_mbps": 9459.26465821473,
          "retransmits": 0,
          "duration_sec": 30.001249,
          "bytes_transferred": 35473719296
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9459.4716152028,
        "bandwidth_mbps_min": 9458.804619151584,
        "bandwidth_mbps_max": 9460.34556824209,
        "bandwidth_mbps_stddev": 0.7910,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 6014.629470144517,
          "retransmits": 0,
          "duration_sec": 30.001407,
          "bytes_transferred": 22555918336
        },
        {
          "bandwidth_mbps": 6052.39262516874,
          "retransmits": 0,
          "duration_sec": 30.0015,
          "bytes_transferred": 22697607168
        },
        {
          "bandwidth_mbps": 6058.527591238384,
          "retransmits": 0,
          "duration_sec": 30.001408,
          "bytes_transferred": 22720544768
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6041.849895517214,
        "bandwidth_mbps_min": 6014.629470144517,
        "bandwidth_mbps_max": 6058.527591238384,
        "bandwidth_mbps_stddev": 23.7723,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 36.12909746663811,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.51",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.51",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.113.173.100",
      "hops": [
        {
          "hop": 1,
          "host": "100.113.173.100",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.700,
          "best_ms": 0.500,
          "worst_ms": 1.400,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c7i/results/c7i.24xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.2xlarge",
    "vcpus": 8,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-173 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9431.34011733493,
          "retransmits": 0,
          "duration_sec": 30.001467,
          "bytes_transferred": 35369254912
        },
        {
          "bandwidth_mbps": 9430.92739072273,
          "retransmits": 0,
          "duration_sec": 30.001001,
          "bytes_transferred": 35367157760
        },
        {
          "bandwidth_mbps": 9430.051214631827,
          "retransmits": 0,
          "duration_sec": 30.001231,
          "bytes_transferred": 35364143104
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9430.772907563163,
        "bandwidth_mbps_min": 9430.051214631827,
        "bandwidth_mbps_max": 9431.34011733493,
        "bandwidth_mbps_stddev": 0.6582,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4717.265015819635,
          "retransmits": 0,
          "duration_sec": 30.001326,
          "bytes_transferred": 17690525696
        },
        {
          "bandwidth_mbps": 4734.307842731392,
          "retransmits": 0,
          "duration_sec": 30.00141,
          "bytes_transferred": 17754488832
        },
        {
          "bandwidth_mbps": 4731.219349937375,
          "retransmits": 0,
          "duration_sec": 30.001048,
          "bytes_transferred": 17742692352
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4727.597402829467,
        "bandwidth_mbps_min": 4717.265015819635,
        "bandwidth_mbps_max": 4734.307842731392,
        "bandwidth_mbps_stddev": 9.0804,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 49.870520166612295,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9358.739144881889,
          "retransmits": 0,
          "duration_sec": 30.001493,
          "bytes_transferred": 35097018368
        },
        {
          "bandwidth_mbps": 9368.55829600867,
          "retransmits": 0,
          "duration_sec": 30.000716,
          "bytes_transferred": 35132932096
        },
        {
          "bandwidth_mbps": 9360.934175511724,
          "retransmits": 0,
          "duration_sec": 30.001403,
          "bytes_transferred": 35105144832
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9362.743872134093,
        "bandwidth_mbps_min": 9358.739144881889,
        "bandwidth_mbps_max": 9368.55829600867,
        "bandwidth_mbps_stddev": 5.1537,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4223.826256241765,
          "retransmits": 0,
          "duration_sec": 30.001331,
          "bytes_transferred": 15840051200
        },
        {
          "bandwidth_mbps": 4202.437163068324,
          "retransmits": 0,
          "duration_sec": 30.001075,
          "bytes_transferred": 15759704064
        },
        {
          "bandwidth_mbps": 4211.4442130475445,
          "retransmits": 0,
          "duration_sec": 30.000402,
          "bytes_transferred": 15793127424
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4212.569210785878,
        "bandwidth_mbps_min": 4202.437163068324,
        "bandwidth_mbps_max": 4223.826256241765,
        "bandwidth_mbps_stddev": 10.7388,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 55.007108297349085,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.173",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.173",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.500,
          "best_ms": 0.400,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.121.113.86",
      "hops": [
        {
          "hop": 1,
          "host": "100.121.113.86",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.400,
          "avg_ms": 1.200,
          "best_ms": 0.800,
          "worst_ms": 1.600,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c7i/results/c7i.2xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.4xlarge",
    "vcpus": 16,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-221 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.71907003729,
          "retransmits": 0,
          "duration_sec": 30.001289,
          "bytes_transferred": 46549696512
        },
        {
          "bandwidth_mbps": 12412.625723999086,
          "retransmits": 0,
          "duration_sec": 30.001937,
          "bytes_transferred": 46550351872
        },
        {
          "bandwidth_mbps": 12412.486466856348,
          "retransmits": 0,
          "duration_sec": 30.000753,
          "bytes_transferred": 46547992576
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.610420297575,
        "bandwidth_mbps_min": 12412.486466856348,
        "bandwidth_mbps_max": 12412.71907003729,
        "bandwidth_mbps_stddev": 0.1171,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5812.190836039934,
          "retransmits": 0,
          "duration_sec": 30.001964,
          "bytes_transferred": 21797142528
        },
        {
          "bandwidth_mbps": 5882.254595312356,
          "retransmits": 0,
          "duration_sec": 30.000953,
          "bytes_transferred": 22059155456
        },
        {
          "bandwidth_mbps": 5772.8890911046,
          "retransmits": 0,
          "duration_sec": 30.000966,
          "bytes_transferred": 21649031168
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5822.444840818964,
        "bandwidth_mbps_min": 5772.8890911046,
        "bandwidth_mbps_max": 5882.254595312356,
        "bandwidth_mbps_stddev": 55.3991,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 53.09250315874024,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9459.80692008498,
          "retransmits": 0,
          "duration_sec": 30.001857,
          "bytes_transferred": 35476471808
        },
        {
          "bandwidth_mbps": 9459.83013292073,
          "retransmits": 0,
          "duration_sec": 30.00134,
          "bytes_transferred": 35475947520
        },
        {
          "bandwidth_mbps": 9461.29801948579,
          "retransmits": 0,
          "duration_sec": 30.001451,
          "bytes_transferred": 35481583616
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9460.3116908305,
        "bandwidth_mbps_min": 9459.80692008498,
        "bandwidth_mbps_max": 9461.29801948579,
        "bandwidth_mbps_stddev": 0.8543,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5815.190751994578,
          "retransmits": 0,
          "duration_sec": 30.001453,
          "bytes_transferred": 21808021504
        },
        {
          "bandwidth_mbps": 5563.317853216795,
          "retransmits": 0,
          "duration_sec": 30.00098,
          "bytes_transferred": 20863123456
        },
        {
          "bandwidth_mbps": 5743.46301241358,
          "retransmits": 0,
          "duration_sec": 30.001498,
          "bytes_transferred": 21539061760
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5707.323872541651,
        "bandwidth_mbps_min": 5563.317853216795,
        "bandwidth_mbps_max": 5815.190751994578,
        "bandwidth_mbps_stddev": 129.7672,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 39.670868581702955,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.221",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.221",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 0.500,
          "best_ms": 0.400,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.113.58.8",
      "hops": [
        {
          "hop": 1,
          "host": "100.113.58.8",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.800,
          "avg_ms": 1.300,
          "best_ms": 0.900,
          "worst_ms": 1.800,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c7i/results/c7i.4xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.8xlarge",
    "vcpus": 32,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-58 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12411.724477672135,
          "retransmits": 0,
          "duration_sec": 30.00175,
          "bytes_transferred": 46546681856
        },
        {
          "bandwidth_mbps": 12411.70028335705,
          "retransmits": 0,
          "duration_sec": 30.001724,
          "bytes_transferred": 46546550784
        },
        {
          "bandwidth_mbps": 12412.576509737537,
          "retransmits": 0,
          "duration_sec": 30.001887,
          "bytes_transferred": 46550089728
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.000423588906,
        "bandwidth_mbps_min": 12411.70028335705,
        "bandwidth_mbps_max": 12412.576509737537,
        "bandwidth_mbps_stddev": 0.4991,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6130.324129872092,
          "retransmits": 0,
          "duration_sec": 30.002227,
          "bytes_transferred": 22990422016
        },
        {
          "bandwidth_mbps": 6216.415619493204,
          "retransmits": 0,
          "duration_sec": 30.000999,
          "bytes_transferred": 23312334848
        },
        {
          "bandwidth_mbps": 6203.57734083553,
          "retransmits": 0,
          "duration_sec": 30.002236,
          "bytes_transferred": 23265148928
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6183.439030066943,
        "bandwidth_mbps_min": 6130.324129872092,
        "bandwidth_mbps_max": 6216.415619493204,
        "bandwidth_mbps_stddev": 46.4446,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 50.18176910213952,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9463.386114007335,
          "retransmits": 0,
          "duration_sec": 30.001701,
          "bytes_transferred": 35489710080
        },
        {
          "bandwidth_mbps": 9465.458853805263,
          "retransmits": 0,
          "duration_sec": 30.001778,
          "bytes_transferred": 35497574400
        },
        {
          "bandwidth_mbps": 9463.096477117137,
          "retransmits": 0,
          "duration_sec": 30.001622,
          "bytes_transferred": 35488530432
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9463.980481643244,
        "bandwidth_mbps_min": 9463.096477117137,
        "bandwidth_mbps_max": 9465.458853805263,
        "bandwidth_mbps_stddev": 1.2885,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 6289.055296264367,
          "retransmits": 0,
          "duration_sec": 30.001448,
          "bytes_transferred": 23585095680
        },
        {
          "bandwidth_mbps": 6155.57178773672,
          "retransmits": 0,
          "duration_sec": 30.001308,
          "bytes_transferred": 23084400640
        },
        {
          "bandwidth_mbps": 6125.93561248403,
          "retransmits": 0,
          "duration_sec": 30.001468,
          "bytes_transferred": 22973382656
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6190.187565495039,
        "bandwidth_mbps_min": 6125.93561248403,
        "bandwidth_mbps_max": 6289.055296264367,
        "bandwidth_mbps_stddev": 86.8947,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 34.59213512219514,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.58",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.58",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.500,
          "best_ms": 0.300,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.92.239.11",
      "hops": [
        {
          "hop": 1,
          "host": "100.92.239.11",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.200,
          "avg_ms": 1.200,
          "best_ms": 0.900,
          "worst_ms": 1.800,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c7i/results/c7i.8xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.large",
    "vcpus": 2,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-81 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.74836528654,
          "retransmits": 0,
          "duration_sec": 30.001894,
          "bytes_transferred": 46550745088
        },
        {
          "bandwidth_mbps": 12412.227454396687,
          "retransmits": 0,
          "duration_sec": 30.001548,
          "bytes_transferred": 46548254720
        },
        {
          "bandwidth_mbps": 12412.374704356745,
          "retransmits": 0,
          "duration_sec": 30.00153,
          "bytes_transferred": 46548779008
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.450174679989,
        "bandwidth_mbps_min": 12412.227454396687,
        "bandwidth_mbps_max": 12412.74836528654,
        "bandwidth_mbps_stddev": 0.2685,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3806.428746464678,
          "retransmits": 0,
          "duration_sec": 30.001157,
          "bytes_transferred": 14274658304
        },
        {
          "bandwidth_mbps": 3239.66471537495,
          "retransmits": 3508,
          "duration_sec": 30.000469,
          "bytes_transferred": 12148932608
        },
        {
          "bandwidth_mbps": 3502.716796942902,
          "retransmits": 2138,
          "duration_sec": 30.000739,
          "bytes_transferred": 13135511552
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3516.2700862608435,
        "bandwidth_mbps_min": 3239.66471537495,
        "bandwidth_mbps_max": 3806.428746464678,
        "bandwidth_mbps_stddev": 283.6250,
        "retransmits_avg": 1882
      }
    },
    "overhead": {
      "bandwidth_pct": 71.67142637612643,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9480.134875780946,
          "retransmits": 0,
          "duration_sec": 30.001235,
          "bytes_transferred": 35551969280
        },
        {
          "bandwidth_mbps": 9478.46701725704,
          "retransmits": 0,
          "duration_sec": 30.001204,
          "bytes_transferred": 35545677824
        },
        {
          "bandwidth_mbps": 9476.399229489525,
          "retransmits": 0,
          "duration_sec": 30.00089,
          "bytes_transferred": 35537551360
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9478.333707509171,
        "bandwidth_mbps_min": 9476.399229489525,
        "bandwidth_mbps_max": 9480.134875780946,
        "bandwidth_mbps_stddev": 1.8714,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3782.6809304149965,
          "retransmits": 0,
          "duration_sec": 30.001838,
          "bytes_transferred": 14185922560
        },
        {
          "bandwidth_mbps": 3810.621259342675,
          "retransmits": 0,
          "duration_sec": 30.001445,
          "bytes_transferred": 14290518016
        },
        {
          "bandwidth_mbps": 3794.6331202765064,
          "retransmits": 0,
          "duration_sec": 30.00295,
          "bytes_transferred": 14231273472
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3795.978436678059,
        "bandwidth_mbps_min": 3782.6809304149965,
        "bandwidth_mbps_max": 3810.621259342675,
        "bandwidth_mbps_stddev": 14.0187,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 59.95099398462084,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.81",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.81",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.300,
          "best_ms": 0.200,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.93.106.85",
      "hops": [
        {
          "hop": 1,
          "host": "100.93.106.85",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.900,
          "avg_ms": 0.700,
          "best_ms": 0.400,
          "worst_ms": 1.100,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c7i/results/c7i.large.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.metal-24xl",
    "vcpus": 96,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": true,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "performance",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-211 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37000.77922939533,
          "retransmits": 0,
          "duration_sec": 30.001168,
          "bytes_transferred": 138758324224
        },
        {
          "bandwidth_mbps": 37009.310599454846,
          "retransmits": 0,
          "duration_sec": 30.001392,
          "bytes_transferred": 138791354368
        },
        {
          "bandwidth_mbps": 36618.2971462948,
          "retransmits": 0,
          "duration_sec": 30.000576,
          "bytes_transferred": 137321250816
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 36876.12899171499,
        "bandwidth_mbps_min": 36618.2971462948,
        "bandwidth_mbps_max": 37009.310599454846,
        "bandwidth_mbps_stddev": 223.3297,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4260.7855072672455,
          "retransmits": 0,
          "duration_sec": 30.001464,
          "bytes_transferred": 15978725376
        },
        {
          "bandwidth_mbps": 4232.179084422948,
          "retransmits": 0,
          "duration_sec": 30.001582,
          "bytes_transferred": 15871508480
        },
        {
          "bandwidth_mbps": 4252.997568348513,
          "retransmits": 0,
          "duration_sec": 30.001421,
          "bytes_transferred": 15949496320
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4248.654053346236,
        "bandwidth_mbps_min": 4232.179084422948,
        "bandwidth_mbps_max": 4260.7855072672455,
        "bandwidth_mbps_stddev": 14.7896,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 88.47857904418116,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 21321.434675759778,
          "retransmits": 0,
          "duration_sec": 30.001321,
          "bytes_transferred": 79958900736
        },
        {
          "bandwidth_mbps": 21081.810323592817,
          "retransmits": 0,
          "duration_sec": 30.001222,
          "bytes_transferred": 79060008960
        },
        {
          "bandwidth_mbps": 21459.283023180953,
          "retransmits": 0,
          "duration_sec": 30.001221,
          "bytes_transferred": 80475586560
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21287.509340844514,
        "bandwidth_mbps_min": 21081.810323592817,
        "bandwidth_mbps_max": 21459.283023180953,
        "bandwidth_mbps_stddev": 191.0094,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4261.134862286763,
          "retransmits": 0,
          "duration_sec": 30.001219,
          "bytes_transferred": 15979905024
        },
        {
          "bandwidth_mbps": 4264.803449778789,
          "retransmits": 0,
          "duration_sec": 30.001228,
          "bytes_transferred": 15993667584
        },
        {
          "bandwidth_mbps": 4233.627630659335,
          "retransmits": 0,
          "duration_sec": 30.001224,
          "bytes_transferred": 15876751360
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4253.1886475749625,
        "bandwidth_mbps_min": 4233.627630659335,
        "bandwidth_mbps_max": 4264.803449778789,
        "bandwidth_mbps_stddev": 17.0394,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 80.02026174375254,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.211",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.211",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.300,
          "best_ms": 0.200,
          "worst_ms": 0.400,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.97.21.62",
      "hops": [
        {
          "hop": 1,
          "host": "100.97.21.62",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.900,
          "avg_ms": 0.800,
          "best_ms": 0.500,
          "worst_ms": 1.100,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c7i/results/c7i.metal-24xl-ena-express.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.metal-24xl",
    "vcpus": 96,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "performance",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-141 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 36187.28804740525,
          "retransmits": 0,
          "duration_sec": 30.001402,
          "bytes_transferred": 135708672000
        },
        {
          "bandwidth_mbps": 37065.06100980858,
          "retransmits": 0,
          "duration_sec": 30.001389,
          "bytes_transferred": 139000414208
        },
        {
          "bandwidth_mbps": 37101.94314652463,
          "retransmits": 0,
          "duration_sec": 30.001297,
          "bytes_transferred": 139138301952
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 36784.76406791282,
        "bandwidth_mbps_min": 36187.28804740525,
        "bandwidth_mbps_max": 37101.94314652463,
        "bandwidth_mbps_stddev": 517.7579,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6704.124347276164,
          "retransmits": 0,
          "duration_sec": 30.001011,
          "bytes_transferred": 25141313536
        },
        {
          "bandwidth_mbps": 6621.731357002352,
          "retransmits": 0,
          "duration_sec": 30.001385,
          "bytes_transferred": 24832638976
        },
        {
          "bandwidth_mbps": 6738.570934127688,
          "retransmits": 0,
          "duration_sec": 30.001391,
          "bytes_transferred": 25270812672
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6688.142212802068,
        "bandwidth_mbps_min": 6621.731357002352,
        "bandwidth_mbps_max": 6738.570934127688,
        "bandwidth_mbps_stddev": 60.0370,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 81.81817287055512,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9471.44941685627,
          "retransmits": 0,
          "duration_sec": 30.00118,
          "bytes_transferred": 35519332352
        },
        {
          "bandwidth_mbps": 9464.100460646401,
          "retransmits": 0,
          "duration_sec": 30.00132,
          "bytes_transferred": 35491938304
        },
        {
          "bandwidth_mbps": 9464.42391851174,
          "retransmits": 0,
          "duration_sec": 30.001181,
          "bytes_transferred": 35492986880
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9466.657932004804,
        "bandwidth_mbps_min": 9464.100460646401,
        "bandwidth_mbps_max": 9471.44941685627,
        "bandwidth_mbps_stddev": 4.1527,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 6518.319841572446,
          "retransmits": 0,
          "duration_sec": 30.001347,
          "bytes_transferred": 24444796928
        },
        {
          "bandwidth_mbps": 6438.1618582902,
          "retransmits": 0,
          "duration_sec": 30.001256,
          "bytes_transferred": 24144117760
        },
        {
          "bandwidth_mbps": 6224.54631253452,
          "retransmits": 0,
          "duration_sec": 30.00123,
          "bytes_transferred": 23343005696
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6393.67600413239,
        "bandwidth_mbps_min": 6224.54631253452,
        "bandwidth_mbps_max": 6518.319841572446,
        "bandwidth_mbps_stddev": 151.8551,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 32.46110665394701,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.141",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.141",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.500,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.102.172.25",
      "hops": [
        {
          "hop": 1,
          "host": "100.102.172.25",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.700,
          "best_ms": 0.400,
          "worst_ms": 1.000,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c7i/results/c7i.metal-24xl.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.xlarge",
    "vcpus": 4,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-217 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:50:29 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.173540023008,
          "retransmits": 0,
          "duration_sec": 30.000918,
          "bytes_transferred": 46547075072
        },
        {
          "bandwidth_mbps": 12411.776049257245,
          "retransmits": 0,
          "duration_sec": 30.000865,
          "bytes_transferred": 46545502208
        },
        {
          "bandwidth_mbps": 12412.055183030257,
          "retransmits": 0,
          "duration_sec": 30.001542,
          "bytes_transferred": 46547599360
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.001590770169,
        "bandwidth_mbps_min": 12411.776049257245,
        "bandwidth_mbps_max": 12412.173540023008,
        "bandwidth_mbps_stddev": 0.2041,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4612.69350322456,
          "retransmits": 0,
          "duration_sec": 30.001314,
          "bytes_transferred": 17298358272
        },
        {
          "bandwidth_mbps": 4623.873389243254,
          "retransmits": 0,
          "duration_sec": 30.001116,
          "bytes_transferred": 17340170240
        },
        {
          "bandwidth_mbps": 4646.378475807448,
          "retransmits": 0,
          "duration_sec": 30.00159,
          "bytes_transferred": 17424842752
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4627.648456091753,
        "bandwidth_mbps_min": 4612.69350322456,
        "bandwidth_mbps_max": 4646.378475807448,
        "bandwidth_mbps_stddev": 17.1569,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 62.71634013056385,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9463.80179885061,
          "retransmits": 0,
          "duration_sec": 30.001602,
          "bytes_transferred": 35491151872
        },
        {
          "bandwidth_mbps": 9462.250523250179,
          "retransmits": 0,
          "duration_sec": 30.001423,
          "bytes_transferred": 35485122560
        },
        {
          "bandwidth_mbps": 9464.557347358676,
          "retransmits": 0,
          "duration_sec": 30.001312,
          "bytes_transferred": 35493642240
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9463.53655648649,
        "bandwidth_mbps_min": 9462.250523250179,
        "bandwidth_mbps_max": 9464.557347358676,
        "bandwidth_mbps_stddev": 1.1761,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4373.265938433565,
          "retransmits": 0,
          "duration_sec": 30.000925,
          "bytes_transferred": 16400252928
        },
        {
          "bandwidth_mbps": 4384.899199632649,
          "retransmits": 0,
          "duration_sec": 30.000724,
          "bytes_transferred": 16443768832
        },
        {
          "bandwidth_mbps": 4376.060943925529,
          "retransmits": 0,
          "duration_sec": 30.000693,
          "bytes_transferred": 16410607616
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4378.075360663915,
        "bandwidth_mbps_min": 4373.265938433565,
        "bandwidth_mbps_max": 4384.899199632649,
        "bandwidth_mbps_stddev": 6.0726,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 53.73742855504587,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.217",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.217",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.300,
          "best_ms": 0.200,
          "worst_ms": 0.500,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.122.171.76",
      "hops": [
        {
          "hop": 1,
          "host": "100.122.171.76",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 0.700,
          "best_ms": 0.300,
          "worst_ms": 1.200,
          "stdev_ms": 0.100
        }
      ]
    },
    "k8s_config": {
      "cluster_name": "tailbench-eks",
      "k8s_version": "unknown",
      "cni": "aws-vpc-cni",
      "node_instance_type": "c7i.xlarge",
      "pod_ip": "10.0.2.151"
    },
    "k8s_pod_to_ec2_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12411.925160848776,
          "retransmits": 21196,
          "duration_sec": 30.000073,
          "bytes_transferred": 46544832612
        },
        {
          "bandwidth_mbps": 12412.678050731862,
          "retransmits": 20365,
          "duration_sec": 30.000121,
          "bytes_transferred": 46547730432
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.301605790319,
        "bandwidth_mbps_min": 12411.925160848776,
        "bandwidth_mbps_max": 12412.678050731862,
        "bandwidth_mbps_stddev": 0.5324,
        "retransmits_avg": 20780.5
      }
    },
    "k8s_ec2_to_pod_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12331.74657270308,
          "retransmits": 0,
          "duration_sec": 30.001267,
          "bytes_transferred": 46246002688
        },
        {
          "bandwidth_mbps": 12375.69771270729,
          "retransmits": 0,
          "duration_sec": 30.00097,
          "bytes_transferred": 46410366976
        },
        {
          "bandwidth_mbps": 12339.193649688288,
          "retransmits": 0,
          "duration_sec": 30.000921,
          "bytes_transferred": 46273396736
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12348.879311699551,
        "bandwidth_mbps_min": 12331.74657270308,
        "bandwidth_mbps_max": 12375.69771270729,
        "bandwidth_mbps_stddev": 23.5220,
        "retransmits_avg": 0
      }
    },
    "k8s_overhead": {
      "pod_to_ec2_vs_baseline_pct": -0.0,
      "ec2_to_pod_vs_baseline_pct": 0.5
    },
    "k8s_tailscale_pod_to_ec2_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4220.262337558355,
          "retransmits": 6016,
          "duration_sec": 30.000081,
          "bytes_transferred": 15826026496
        },
        {
          "bandwidth_mbps": 4131.9387638803,
          "retransmits": 10696,
          "duration_sec": 30.000072,
          "bytes_transferred": 15494807552
        },
        {
          "bandwidth_mbps": 4182.33949892862,
          "retransmits": 7297,
          "duration_sec": 30.000077,
          "bytes_transferred": 15683813376
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4178.180200122425,
        "bandwidth_mbps_min": 4131.9387638803,
        "bandwidth_mbps_max": 4220.262337558355,
        "bandwidth_mbps_stddev": 44.3084,
        "retransmits_avg": 8003
      }
    },
    "k8s_tailscale_ec2_to_pod_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1835.5906590944248,
          "retransmits": 155,
          "duration_sec": 30.001331,
          "bytes_transferred": 6883770368
        },
        {
          "bandwidth_mbps": 1799.5559748635635,
          "retransmits": 818,
          "duration_sec": 30.000752,
          "bytes_transferred": 6748504064
        },
        {
          "bandwidth_mbps": 1875.5675814659983,
          "retransmits": 893,
          "duration_sec": 30.001443,
          "bytes_transferred": 7033716736
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1836.904738474662,
        "bandwidth_mbps_min": 1799.5559748635635,
        "bandwidth_mbps_max": 1875.5675814659983,
        "bandwidth_mbps_stddev": 38.0228,
        "retransmits_avg": 622
      }
    },
    "k8s_tailscale_config": {
      "sidecar_ts_ip": "100.93.154.82",
      "mode": "kernel"
    },
    "k8s_tailscale_overhead": {
      "pod_to_ec2_vs_baseline_pct": 66.3,
      "ec2_to_pod_vs_baseline_pct": 85.2
    },
    "source": "aws/c7i/results/c7i.xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8g",
    "instance_type": "c8g.2xlarge",
    "vcpus": 8,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-75 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 14815.077623711806,
          "retransmits": 0,
          "duration_sec": 30.001361,
          "bytes_transferred": 55559061504
        },
        {
          "bandwidth_mbps": 14854.040321596274,
          "retransmits": 0,
          "duration_sec": 30.001094,
          "bytes_transferred": 55704682496
        },
        {
          "bandwidth_mbps": 14878.145498625927,
          "retransmits": 0,
          "duration_sec": 30.001328,
          "bytes_transferred": 55795515392
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 14849.087814644668,
        "bandwidth_mbps_min": 14815.077623711806,
        "bandwidth_mbps_max": 14878.145498625927,
        "bandwidth_mbps_stddev": 31.8243,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5683.7077737796735,
          "retransmits": 0,
          "duration_sec": 30.001442,
          "bytes_transferred": 21314928640
        },
        {
          "bandwidth_mbps": 5632.6921069451,
          "retransmits": 0,
          "duration_sec": 30.001375,
          "bytes_transferred": 21123563520
        },
        {
          "bandwidth_mbps": 5643.201380768242,
          "retransmits": 0,
          "duration_sec": 30.00069,
          "bytes_transferred": 21162491904
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5653.200420497672,
        "bandwidth_mbps_min": 5632.6921069451,
        "bandwidth_mbps_max": 5683.7077737796735,
        "bandwidth_mbps_stddev": 26.9376,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 61.92897172496822,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9417.121819067177,
          "retransmits": 0,
          "duration_sec": 30.001223,
          "bytes_transferred": 35315646464
        },
        {
          "bandwidth_mbps": 9453.930855377936,
          "retransmits": 0,
          "duration_sec": 30.00054,
          "bytes_transferred": 35452878848
        },
        {
          "bandwidth_mbps": 9446.608274462536,
          "retransmits": 0,
          "duration_sec": 30.001151,
          "bytes_transferred": 35426140160
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9439.22031630255,
        "bandwidth_mbps_min": 9417.121819067177,
        "bandwidth_mbps_max": 9453.930855377936,
        "bandwidth_mbps_stddev": 19.4849,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5227.26182734619,
          "retransmits": 0,
          "duration_sec": 30.000369,
          "bytes_transferred": 19602472960
        },
        {
          "bandwidth_mbps": 5165.868873861382,
          "retransmits": 0,
          "duration_sec": 30.00128,
          "bytes_transferred": 19372834816
        },
        {
          "bandwidth_mbps": 5021.005059296226,
          "retransmits": 0,
          "duration_sec": 30.000813,
          "bytes_transferred": 18829279232
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5138.045253501266,
        "bandwidth_mbps_min": 5021.005059296226,
        "bandwidth_mbps_max": 5227.26182734619,
        "bandwidth_mbps_stddev": 105.9060,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 45.56705870476072,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.75",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.75",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.77.238.34",
      "hops": [
        {
          "hop": 1,
          "host": "100.77.238.34",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.400,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c8g/results/c8g.2xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8g",
    "instance_type": "c8g.4xlarge",
    "vcpus": 16,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-189 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 14897.59034953432,
          "retransmits": 0,
          "duration_sec": 30.000459,
          "bytes_transferred": 55866818560
        },
        {
          "bandwidth_mbps": 14850.203359463723,
          "retransmits": 0,
          "duration_sec": 30.000443,
          "bytes_transferred": 55689084928
        },
        {
          "bandwidth_mbps": 14853.525580731794,
          "retransmits": 0,
          "duration_sec": 30.00051,
          "bytes_transferred": 55701667840
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 14867.106429909945,
        "bandwidth_mbps_min": 14850.203359463723,
        "bandwidth_mbps_max": 14897.59034953432,
        "bandwidth_mbps_stddev": 26.4521,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6180.171118501447,
          "retransmits": 0,
          "duration_sec": 30.001338,
          "bytes_transferred": 23176675328
        },
        {
          "bandwidth_mbps": 6113.432183752344,
          "retransmits": 318,
          "duration_sec": 30.001424,
          "bytes_transferred": 22926458880
        },
        {
          "bandwidth_mbps": 6152.2751141673125,
          "retransmits": 0,
          "duration_sec": 30.001363,
          "bytes_transferred": 23072079872
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6148.626138807034,
        "bandwidth_mbps_min": 6113.432183752344,
        "bandwidth_mbps_max": 6180.171118501447,
        "bandwidth_mbps_stddev": 33.5188,
        "retransmits_avg": 106
      }
    },
    "overhead": {
      "bandwidth_pct": 58.64275158186059,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9435.21355675897,
          "retransmits": 0,
          "duration_sec": 30.001153,
          "bytes_transferred": 35383410688
        },
        {
          "bandwidth_mbps": 9452.43157562329,
          "retransmits": 0,
          "duration_sec": 30.001194,
          "bytes_transferred": 35448029184
        },
        {
          "bandwidth_mbps": 9429.538577431284,
          "retransmits": 0,
          "duration_sec": 30.001194,
          "bytes_transferred": 35362177024
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9439.061236604515,
        "bandwidth_mbps_min": 9429.538577431284,
        "bandwidth_mbps_max": 9452.43157562329,
        "bandwidth_mbps_stddev": 11.9217,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5397.606696876336,
          "retransmits": 0,
          "duration_sec": 30.001211,
          "bytes_transferred": 20241842176
        },
        {
          "bandwidth_mbps": 5196.664899096224,
          "retransmits": 0,
          "duration_sec": 30.001256,
          "bytes_transferred": 19488309248
        },
        {
          "bandwidth_mbps": 5281.359087492866,
          "retransmits": 0,
          "duration_sec": 30.001212,
          "bytes_transferred": 19805896704
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5291.876894488476,
        "bandwidth_mbps_min": 5196.664899096224,
        "bandwidth_mbps_max": 5397.606696876336,
        "bandwidth_mbps_stddev": 100.8830,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 43.936406790469064,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.189",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.189",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.100,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.105.124.109",
      "hops": [
        {
          "hop": 1,
          "host": "100.105.124.109",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.300,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c8g/results/c8g.4xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8g",
    "instance_type": "c8g.8xlarge",
    "vcpus": 32,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-187 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 14854.972703877951,
          "retransmits": 0,
          "duration_sec": 30.001258,
          "bytes_transferred": 55708483584
        },
        {
          "bandwidth_mbps": 14858.450476517795,
          "retransmits": 0,
          "duration_sec": 30.001293,
          "bytes_transferred": 55721590784
        },
        {
          "bandwidth_mbps": 14864.474439680349,
          "retransmits": 0,
          "duration_sec": 30.001268,
          "bytes_transferred": 55744135168
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 14859.299206692032,
        "bandwidth_mbps_min": 14854.972703877951,
        "bandwidth_mbps_max": 14864.474439680349,
        "bandwidth_mbps_stddev": 4.8074,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6228.6481201605075,
          "retransmits": 0,
          "duration_sec": 30.001338,
          "bytes_transferred": 23358472192
        },
        {
          "bandwidth_mbps": 6314.365168178292,
          "retransmits": 0,
          "duration_sec": 30.001256,
          "bytes_transferred": 23679860736
        },
        {
          "bandwidth_mbps": 6336.411901207851,
          "retransmits": 0,
          "duration_sec": 30.001291,
          "bytes_transferred": 23762567168
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6293.141729848884,
        "bandwidth_mbps_min": 6228.6481201605075,
        "bandwidth_mbps_max": 6336.411901207851,
        "bandwidth_mbps_stddev": 56.9305,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 57.64846213598885,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9442.649662179954,
          "retransmits": 0,
          "duration_sec": 30.00118,
          "bytes_transferred": 35411329024
        },
        {
          "bandwidth_mbps": 9441.922611653856,
          "retransmits": 0,
          "duration_sec": 30.001158,
          "bytes_transferred": 35408576512
        },
        {
          "bandwidth_mbps": 9458.49325622428,
          "retransmits": 0,
          "duration_sec": 30.001146,
          "bytes_transferred": 35470704640
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9447.688510019363,
        "bandwidth_mbps_min": 9441.922611653856,
        "bandwidth_mbps_max": 9458.49325622428,
        "bandwidth_mbps_stddev": 9.3642,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5435.570681838696,
          "retransmits": 0,
          "duration_sec": 30.001172,
          "bytes_transferred": 20384186368
        },
        {
          "bandwidth_mbps": 5366.3359956311,
          "retransmits": 0,
          "duration_sec": 30.001152,
          "bytes_transferred": 20124532736
        },
        {
          "bandwidth_mbps": 5522.144356617509,
          "retransmits": 0,
          "duration_sec": 30.001174,
          "bytes_transferred": 20708851712
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5441.350344695768,
        "bandwidth_mbps_min": 5366.3359956311,
        "bandwidth_mbps_max": 5522.144356617509,
        "bandwidth_mbps_stddev": 78.0648,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 42.4054853319395,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.187",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.187",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.100,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.114.82.59",
      "hops": [
        {
          "hop": 1,
          "host": "100.114.82.59",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.300,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c8g/results/c8g.8xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8g",
    "instance_type": "c8g.large",
    "vcpus": 2,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-242 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12386.690366468816,
          "retransmits": 0,
          "duration_sec": 30.000588,
          "bytes_transferred": 46450999296
        },
        {
          "bandwidth_mbps": 12403.283365601192,
          "retransmits": 0,
          "duration_sec": 30.000441,
          "bytes_transferred": 46512996352
        },
        {
          "bandwidth_mbps": 12400.600557890608,
          "retransmits": 0,
          "duration_sec": 30.000505,
          "bytes_transferred": 46503034880
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12396.858096653537,
        "bandwidth_mbps_min": 12386.690366468816,
        "bandwidth_mbps_max": 12403.283365601192,
        "bandwidth_mbps_stddev": 8.9071,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3682.1196533175485,
          "retransmits": 0,
          "duration_sec": 30.001057,
          "bytes_transferred": 13808435200
        },
        {
          "bandwidth_mbps": 3685.9490029248127,
          "retransmits": 0,
          "duration_sec": 30.000897,
          "bytes_transferred": 13822722048
        },
        {
          "bandwidth_mbps": 3674.9067824917256,
          "retransmits": 0,
          "duration_sec": 30.000877,
          "bytes_transferred": 13781303296
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3680.9918129113626,
        "bandwidth_mbps_min": 3674.9067824917256,
        "bandwidth_mbps_max": 3685.9490029248127,
        "bandwidth_mbps_stddev": 5.6068,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 70.3070585771646,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9469.61676985344,
          "retransmits": 0,
          "duration_sec": 30.000453,
          "bytes_transferred": 35511599104
        },
        {
          "bandwidth_mbps": 9439.523381417564,
          "retransmits": 0,
          "duration_sec": 30.000341,
          "bytes_transferred": 35398615040
        },
        {
          "bandwidth_mbps": 9464.419082069484,
          "retransmits": 0,
          "duration_sec": 30.00031,
          "bytes_transferred": 35491938304
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9457.853077780162,
        "bandwidth_mbps_min": 9439.523381417564,
        "bandwidth_mbps_max": 9469.61676985344,
        "bandwidth_mbps_stddev": 16.0853,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3291.9346727160946,
          "retransmits": 0,
          "duration_sec": 30.000635,
          "bytes_transferred": 12345016320
        },
        {
          "bandwidth_mbps": 3353.1398617910577,
          "retransmits": 0,
          "duration_sec": 30.001532,
          "bytes_transferred": 12574916608
        },
        {
          "bandwidth_mbps": 3347.947086809572,
          "retransmits": 0,
          "duration_sec": 30.000459,
          "bytes_transferred": 12554993664
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3331.0072071055747,
        "bandwidth_mbps_min": 3291.9346727160946,
        "bandwidth_mbps_max": 3353.1398617910577,
        "bandwidth_mbps_stddev": 33.9373,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 64.78051435445443,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.242",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.242",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.105.247.41",
      "hops": [
        {
          "hop": 1,
          "host": "100.105.247.41",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.400,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c8g/results/c8g.large.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8g",
    "instance_type": "c8g.medium",
    "vcpus": 1,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-55 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12409.452497049999,
          "retransmits": 0,
          "duration_sec": 30.000821,
          "bytes_transferred": 46536720384
        },
        {
          "bandwidth_mbps": 12410.6344427633,
          "retransmits": 0,
          "duration_sec": 30.000752,
          "bytes_transferred": 46541045760
        },
        {
          "bandwidth_mbps": 12407.929096124924,
          "retransmits": 0,
          "duration_sec": 30.000617,
          "bytes_transferred": 46530691072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12409.338678646076,
        "bandwidth_mbps_min": 12407.929096124924,
        "bandwidth_mbps_max": 12410.6344427633,
        "bandwidth_mbps_stddev": 1.3563,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1820.0815297584072,
          "retransmits": 0,
          "duration_sec": 30.001757,
          "bytes_transferred": 6825705472
        },
        {
          "bandwidth_mbps": 1809.4998555911263,
          "retransmits": 0,
          "duration_sec": 30.001619,
          "bytes_transferred": 6785990656
        },
        {
          "bandwidth_mbps": 1811.6111938149643,
          "retransmits": 357,
          "duration_sec": 30.001961,
          "bytes_transferred": 6793986048
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1813.7308597214994,
        "bandwidth_mbps_min": 1809.4998555911263,
        "bandwidth_mbps_max": 1820.0815297584072,
        "bandwidth_mbps_stddev": 5.6002,
        "retransmits_avg": 119
      }
    },
    "overhead": {
      "bandwidth_pct": 85.38414570921044,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9453.425508466245,
          "retransmits": 0,
          "duration_sec": 30.000369,
          "bytes_transferred": 35450781696
        },
        {
          "bandwidth_mbps": 9439.443723164499,
          "retransmits": 0,
          "duration_sec": 30.000372,
          "bytes_transferred": 35398352896
        },
        {
          "bandwidth_mbps": 9439.096404593744,
          "retransmits": 0,
          "duration_sec": 30.000365,
          "bytes_transferred": 35397042176
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9443.988545408161,
        "bandwidth_mbps_min": 9439.096404593744,
        "bandwidth_mbps_max": 9453.425508466245,
        "bandwidth_mbps_stddev": 8.1745,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1927.5481725732052,
          "retransmits": 0,
          "duration_sec": 30.000764,
          "bytes_transferred": 7228489728
        },
        {
          "bandwidth_mbps": 1903.2959099787347,
          "retransmits": 65,
          "duration_sec": 30.0018,
          "bytes_transferred": 7137787904
        },
        {
          "bandwidth_mbps": 1921.5882230237346,
          "retransmits": 0,
          "duration_sec": 30.000502,
          "bytes_transferred": 7206076416
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1917.4774351918916,
        "bandwidth_mbps_min": 1903.2959099787347,
        "bandwidth_mbps_max": 1927.5481725732052,
        "bandwidth_mbps_stddev": 12.6379,
        "retransmits_avg": 21.666666666666668
      }
    },
    "overhead_single": {
      "bandwidth_pct": 79.6963176525219,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.55",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.55",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.100,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.97.90.1",
      "hops": [
        {
          "hop": 1,
          "host": "100.97.90.1",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.300,
          "best_ms": 0.200,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c8g/results/c8g.medium.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8g",
    "instance_type": "c8g.xlarge",
    "vcpus": 4,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-158 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12377.73243942128,
          "retransmits": 0,
          "duration_sec": 30.00146,
          "bytes_transferred": 46418755584
        },
        {
          "bandwidth_mbps": 12390.8001253581,
          "retransmits": 0,
          "duration_sec": 30.000454,
          "bytes_transferred": 46466203648
        },
        {
          "bandwidth_mbps": 12417.877763160644,
          "retransmits": 0,
          "duration_sec": 30.000563,
          "bytes_transferred": 46567915520
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12395.47010931334,
        "bandwidth_mbps_min": 12377.73243942128,
        "bandwidth_mbps_max": 12417.877763160644,
        "bandwidth_mbps_stddev": 20.4760,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4887.35958479803,
          "retransmits": 0,
          "duration_sec": 30.001399,
          "bytes_transferred": 18328453120
        },
        {
          "bandwidth_mbps": 4821.016181623282,
          "retransmits": 0,
          "duration_sec": 30.00144,
          "bytes_transferred": 18079678464
        },
        {
          "bandwidth_mbps": 4849.168106835769,
          "retransmits": 0,
          "duration_sec": 30.001338,
          "bytes_transferred": 18185191424
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4852.514624419026,
        "bandwidth_mbps_min": 4821.016181623282,
        "bandwidth_mbps_max": 4887.35958479803,
        "bandwidth_mbps_stddev": 33.2981,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 60.852516430392676,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9460.287384046384,
          "retransmits": 0,
          "duration_sec": 30.00122,
          "bytes_transferred": 35477520384
        },
        {
          "bandwidth_mbps": 9435.7714373902,
          "retransmits": 0,
          "duration_sec": 30.000935,
          "bytes_transferred": 35385245696
        },
        {
          "bandwidth_mbps": 9463.601115433861,
          "retransmits": 0,
          "duration_sec": 30.001241,
          "bytes_transferred": 35489972224
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9453.219978956817,
        "bandwidth_mbps_min": 9435.7714373902,
        "bandwidth_mbps_max": 9463.601115433861,
        "bandwidth_mbps_stddev": 15.2014,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4523.834730161526,
          "retransmits": 0,
          "duration_sec": 30.000707,
          "bytes_transferred": 16964780032
        },
        {
          "bandwidth_mbps": 4555.671915623279,
          "retransmits": 0,
          "duration_sec": 30.000502,
          "bytes_transferred": 17084055552
        },
        {
          "bandwidth_mbps": 4590.151826097988,
          "retransmits": 0,
          "duration_sec": 30.000389,
          "bytes_transferred": 17213292544
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4556.552823960931,
        "bandwidth_mbps_min": 4523.834730161526,
        "bandwidth_mbps_max": 4590.151826097988,
        "bandwidth_mbps_stddev": 33.1673,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 51.79893375903693,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.158",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.158",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.84.70.21",
      "hops": [
        {
          "hop": 1,
          "host": "100.84.70.21",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.400,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c8g/results/c8g.xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8gn",
    "instance_type": "c8gn.2xlarge",
    "vcpus": 8,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-200 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37883.4263980962,
          "retransmits": 0,
          "duration_sec": 30.001065,
          "bytes_transferred": 142067892224
        },
        {
          "bandwidth_mbps": 37879.42162989938,
          "retransmits": 0,
          "duration_sec": 30.000306,
          "bytes_transferred": 142049280000
        },
        {
          "bandwidth_mbps": 37791.54157545605,
          "retransmits": 0,
          "duration_sec": 30.001535,
          "bytes_transferred": 141725532160
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37851.463201150546,
        "bandwidth_mbps_min": 37791.54157545605,
        "bandwidth_mbps_max": 37883.4263980962,
        "bandwidth_mbps_stddev": 51.9323,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5833.951339749017,
          "retransmits": 0,
          "duration_sec": 30.000955,
          "bytes_transferred": 21878013952
        },
        {
          "bandwidth_mbps": 5831.9617535791685,
          "retransmits": 0,
          "duration_sec": 30.000402,
          "bytes_transferred": 21870149632
        },
        {
          "bandwidth_mbps": 5865.2230206134445,
          "retransmits": 0,
          "duration_sec": 30.000469,
          "bytes_transferred": 21994930176
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5843.712037980543,
        "bandwidth_mbps_min": 5831.9617535791685,
        "bandwidth_mbps_max": 5865.2230206134445,
        "bandwidth_mbps_stddev": 18.6556,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 84.5614632995141,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9454.67180841913,
          "retransmits": 0,
          "duration_sec": 30.000407,
          "bytes_transferred": 35455500288
        },
        {
          "bandwidth_mbps": 9488.215373948084,
          "retransmits": 0,
          "duration_sec": 30.001103,
          "bytes_transferred": 35582115840
        },
        {
          "bandwidth_mbps": 9438.52385244116,
          "retransmits": 0,
          "duration_sec": 30.001185,
          "bytes_transferred": 35395862528
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9460.470344936126,
        "bandwidth_mbps_min": 9438.52385244116,
        "bandwidth_mbps_max": 9488.215373948084,
        "bandwidth_mbps_stddev": 25.3482,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5203.376885684386,
          "retransmits": 0,
          "duration_sec": 30.000845,
          "bytes_transferred": 19513212928
        },
        {
          "bandwidth_mbps": 5101.946308860396,
          "retransmits": 0,
          "duration_sec": 30.001263,
          "bytes_transferred": 19133104128
        },
        {
          "bandwidth_mbps": 5171.856364877195,
          "retransmits": 0,
          "duration_sec": 30.000406,
          "bytes_transferred": 19394723840
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5159.059853140659,
        "bandwidth_mbps_min": 5101.946308860396,
        "bandwidth_mbps_max": 5203.376885684386,
        "bandwidth_mbps_stddev": 51.9120,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 45.46719491698284,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.200",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.200",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.000,
          "worst_ms": 0.100,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.106.237.27",
      "hops": [
        {
          "hop": 1,
          "host": "100.106.237.27",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.300,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c8gn/results/c8gn.2xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8gn",
    "instance_type": "c8gn.8xlarge",
    "vcpus": 32,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": true,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-28 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 94098.26536798594,
          "retransmits": 0,
          "duration_sec": 30.001215,
          "bytes_transferred": 352882786304
        },
        {
          "bandwidth_mbps": 86757.67420012972,
          "retransmits": 0,
          "duration_sec": 30.001209,
          "bytes_transferred": 325354389504
        },
        {
          "bandwidth_mbps": 94738.60314487113,
          "retransmits": 0,
          "duration_sec": 30.001293,
          "bytes_transferred": 355285073920
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 91864.84757099561,
        "bandwidth_mbps_min": 86757.67420012972,
        "bandwidth_mbps_max": 94738.60314487113,
        "bandwidth_mbps_stddev": 4434.5150,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6527.2052187319405,
          "retransmits": 0,
          "duration_sec": 30.001311,
          "bytes_transferred": 24478089216
        },
        {
          "bandwidth_mbps": 6660.44999778176,
          "retransmits": 0,
          "duration_sec": 30.001259,
          "bytes_transferred": 24977735680
        },
        {
          "bandwidth_mbps": 6581.668538732048,
          "retransmits": 0,
          "duration_sec": 30.001267,
          "bytes_transferred": 24682299392
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6589.774585081916,
        "bandwidth_mbps_min": 6527.2052187319405,
        "bandwidth_mbps_max": 6660.44999778176,
        "bandwidth_mbps_stddev": 66.9912,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 92.82666356139201,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 23872.3920600951,
          "retransmits": 0,
          "duration_sec": 30.001115,
          "bytes_transferred": 89524797440
        },
        {
          "bandwidth_mbps": 23674.911273154674,
          "retransmits": 0,
          "duration_sec": 30.001123,
          "bytes_transferred": 88784240640
        },
        {
          "bandwidth_mbps": 23831.83591762656,
          "retransmits": 0,
          "duration_sec": 30.001175,
          "bytes_transferred": 89372884992
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 23793.046416958776,
        "bandwidth_mbps_min": 23674.911273154674,
        "bandwidth_mbps_max": 23872.3920600951,
        "bandwidth_mbps_stddev": 104.2983,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5729.340786249377,
          "retransmits": 0,
          "duration_sec": 30.001143,
          "bytes_transferred": 21485846528
        },
        {
          "bandwidth_mbps": 5409.825107808146,
          "retransmits": 0,
          "duration_sec": 30.000516,
          "bytes_transferred": 20287193088
        },
        {
          "bandwidth_mbps": 5520.26048970448,
          "retransmits": 0,
          "duration_sec": 30.001155,
          "bytes_transferred": 20701773824
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5553.142127920667,
        "bandwidth_mbps_min": 5409.825107808146,
        "bandwidth_mbps_max": 5729.340786249377,
        "bandwidth_mbps_stddev": 162.2759,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 76.66065105491242,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.28",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.28",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.100,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.77.8.35",
      "hops": [
        {
          "hop": 1,
          "host": "100.77.8.35",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.300,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c8gn/results/c8gn.8xlarge-ena-express.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8gn",
    "instance_type": "c8gn.8xlarge",
    "vcpus": 32,
    "region": "us-east-1",
    "zone": "us-east-1b",
    "date": "2026-02-13",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-28 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37772.52665398963,
          "retransmits": 0,
          "duration_sec": 30.001231,
          "bytes_transferred": 141652787200
        },
        {
          "bandwidth_mbps": 37781.1369077334,
          "retransmits": 0,
          "duration_sec": 30.001249,
          "bytes_transferred": 141685161984
        },
        {
          "bandwidth_mbps": 37771.99770650076,
          "retransmits": 0,
          "duration_sec": 30.001318,
          "bytes_transferred": 141651214336
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37775.220422741266,
        "bandwidth_mbps_min": 37771.99770650076,
        "bandwidth_mbps_max": 37781.1369077334,
        "bandwidth_mbps_stddev": 5.1306,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6631.11875901878,
          "retransmits": 0,
          "duration_sec": 30.001292,
          "bytes_transferred": 24867766272
        },
        {
          "bandwidth_mbps": 6619.439248540996,
          "retransmits": 0,
          "duration_sec": 30.001477,
          "bytes_transferred": 24824119296
        },
        {
          "bandwidth_mbps": 6643.560660698146,
          "retransmits": 0,
          "duration_sec": 30.001295,
          "bytes_transferred": 24914427904
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6631.372889419307,
        "bandwidth_mbps_min": 6619.439248540996,
        "bandwidth_mbps_max": 6643.560660698146,
        "bandwidth_mbps_stddev": 12.0627,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 82.44517751264499,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9444.568198223591,
          "retransmits": 0,
          "duration_sec": 30.001192,
          "bytes_transferred": 35418537984
        },
        {
          "bandwidth_mbps": 9504.413428225651,
          "retransmits": 0,
          "duration_sec": 30.001164,
          "bytes_transferred": 35642933248
        },
        {
          "bandwidth_mbps": 9463.79858304855,
          "retransmits": 0,
          "duration_sec": 30.001169,
          "bytes_transferred": 35490627584
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9470.926736499263,
        "bandwidth_mbps_min": 9444.568198223591,
        "bandwidth_mbps_max": 9504.413428225651,
        "bandwidth_mbps_stddev": 30.5528,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5930.23713090551,
          "retransmits": 0,
          "duration_sec": 30.001159,
          "bytes_transferred": 22239248384
        },
        {
          "bandwidth_mbps": 6205.83320801583,
          "retransmits": 0,
          "duration_sec": 30.00113,
          "bytes_transferred": 23272751104
        },
        {
          "bandwidth_mbps": 5882.79984797762,
          "retransmits": 0,
          "duration_sec": 30.000846,
          "bytes_transferred": 22061121536
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6006.290062299653,
        "bandwidth_mbps_min": 5882.79984797762,
        "bandwidth_mbps_max": 6205.83320801583,
        "bandwidth_mbps_stddev": 174.4296,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 36.581812641919385,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.28",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.28",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.100,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.77.8.35",
      "hops": [
        {
          "hop": 1,
          "host": "100.77.8.35",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.300,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c8gn/results/c8gn.8xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8gn",
    "instance_type": "c8gn.large",
    "vcpus": 2,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-55 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 29792.353735080414,
          "retransmits": 0,
          "duration_sec": 30.000666,
          "bytes_transferred": 111723806720
        },
        {
          "bandwidth_mbps": 29777.767510370708,
          "retransmits": 16,
          "duration_sec": 30.000607,
          "bytes_transferred": 111668887552
        },
        {
          "bandwidth_mbps": 29630.98679257308,
          "retransmits": 0,
          "duration_sec": 30.000696,
          "bytes_transferred": 111118778368
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 29733.7026793414,
        "bandwidth_mbps_min": 29630.98679257308,
        "bandwidth_mbps_max": 29792.353735080414,
        "bandwidth_mbps_stddev": 89.2530,
        "retransmits_avg": 5.333333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3794.2134456915924,
          "retransmits": 0,
          "duration_sec": 30.000465,
          "bytes_transferred": 14228520960
        },
        {
          "bandwidth_mbps": 3833.1617329068577,
          "retransmits": 0,
          "duration_sec": 30.00092,
          "bytes_transferred": 14374797312
        },
        {
          "bandwidth_mbps": 3817.7329462337752,
          "retransmits": 0,
          "duration_sec": 30.002962,
          "bytes_transferred": 14317912064
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3815.0360416107414,
        "bandwidth_mbps_min": 3794.2134456915924,
        "bandwidth_mbps_max": 3833.1617329068577,
        "bandwidth_mbps_stddev": 19.6137,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 87.16932067710027,
      "retransmits_pct": -100
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9454.08581684346,
          "retransmits": 0,
          "duration_sec": 30.000381,
          "bytes_transferred": 35453272064
        },
        {
          "bandwidth_mbps": 9453.800527919646,
          "retransmits": 0,
          "duration_sec": 30.000399,
          "bytes_transferred": 35452223488
        },
        {
          "bandwidth_mbps": 9428.81042754201,
          "retransmits": 0,
          "duration_sec": 30.000397,
          "bytes_transferred": 35358507008
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9445.565590768374,
        "bandwidth_mbps_min": 9428.81042754201,
        "bandwidth_mbps_max": 9454.08581684346,
        "bandwidth_mbps_stddev": 14.5111,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3486.830638620022,
          "retransmits": 0,
          "duration_sec": 30.000594,
          "bytes_transferred": 13075873792
        },
        {
          "bandwidth_mbps": 3519.2882128004126,
          "retransmits": 0,
          "duration_sec": 30.001596,
          "bytes_transferred": 13198032896
        },
        {
          "bandwidth_mbps": 3459.456106231261,
          "retransmits": 0,
          "duration_sec": 30.001263,
          "bytes_transferred": 12973506560
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3488.5249858838984,
        "bandwidth_mbps_min": 3459.456106231261,
        "bandwidth_mbps_max": 3519.2882128004126,
        "bandwidth_mbps_stddev": 29.9520,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 63.067060914876194,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.55",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.55",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.100,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.98.139.73",
      "hops": [
        {
          "hop": 1,
          "host": "100.98.139.73",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c8gn/results/c8gn.large.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8gn",
    "instance_type": "c8gn.medium",
    "vcpus": 1,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-50 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:32:52 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 24764.824455392565,
          "retransmits": 0,
          "duration_sec": 30.000876,
          "bytes_transferred": 92870803456
        },
        {
          "bandwidth_mbps": 24837.956791151988,
          "retransmits": 0,
          "duration_sec": 30.001957,
          "bytes_transferred": 93148413952
        },
        {
          "bandwidth_mbps": 24829.711013377786,
          "retransmits": 0,
          "duration_sec": 30.002503,
          "bytes_transferred": 93119184896
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24810.830753307444,
        "bandwidth_mbps_min": 24764.824455392565,
        "bandwidth_mbps_max": 24837.956791151988,
        "bandwidth_mbps_stddev": 40.0554,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1683.4078397242274,
          "retransmits": 0,
          "duration_sec": 30.002688,
          "bytes_transferred": 6313345024
        },
        {
          "bandwidth_mbps": 1645.20556306072,
          "retransmits": 0,
          "duration_sec": 30.000823,
          "bytes_transferred": 6169690112
        },
        {
          "bandwidth_mbps": 1560.4489311536809,
          "retransmits": 3012,
          "duration_sec": 30.000805,
          "bytes_transferred": 5851840512
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1629.6874446462095,
        "bandwidth_mbps_min": 1560.4489311536809,
        "bandwidth_mbps_max": 1683.4078397242274,
        "bandwidth_mbps_stddev": 62.9312,
        "retransmits_avg": 1004
      }
    },
    "overhead": {
      "bandwidth_pct": 93.43154825870165,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9441.472833231433,
          "retransmits": 0,
          "duration_sec": 30.000366,
          "bytes_transferred": 35405955072
        },
        {
          "bandwidth_mbps": 9430.73719238851,
          "retransmits": 0,
          "duration_sec": 30.000383,
          "bytes_transferred": 35365715968
        },
        {
          "bandwidth_mbps": 9440.238181341703,
          "retransmits": 0,
          "duration_sec": 30.000402,
          "bytes_transferred": 35401367552
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9437.48273565388,
        "bandwidth_mbps_min": 9430.73719238851,
        "bandwidth_mbps_max": 9441.472833231433,
        "bandwidth_mbps_stddev": 5.8743,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1627.3537162572513,
          "retransmits": 3712,
          "duration_sec": 30.000668,
          "bytes_transferred": 6102712320
        },
        {
          "bandwidth_mbps": 1672.2136020583687,
          "retransmits": 3145,
          "duration_sec": 30.001621,
          "bytes_transferred": 6271139840
        },
        {
          "bandwidth_mbps": 1824.329963765681,
          "retransmits": 0,
          "duration_sec": 30.000288,
          "bytes_transferred": 6841303040
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1707.9657606937672,
        "bandwidth_mbps_min": 1627.3537162572513,
        "bandwidth_mbps_max": 1824.329963765681,
        "bandwidth_mbps_stddev": 103.2404,
        "retransmits_avg": 2285.6666666666665
      }
    },
    "overhead_single": {
      "bandwidth_pct": 81.90231644884244,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.50",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.50",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.100,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.106.233.9",
      "hops": [
        {
          "hop": 1,
          "host": "100.106.233.9",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.500,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c8gn/results/c8gn.medium.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c8gn",
    "instance_type": "c8gn.xlarge",
    "vcpus": 4,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-154 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37891.61619874351,
          "retransmits": 0,
          "duration_sec": 30.000475,
          "bytes_transferred": 142095810560
        },
        {
          "bandwidth_mbps": 37835.47863490452,
          "retransmits": 0,
          "duration_sec": 30.000451,
          "bytes_transferred": 141885177856
        },
        {
          "bandwidth_mbps": 37793.466938457634,
          "retransmits": 0,
          "duration_sec": 30.000506,
          "bytes_transferred": 141727891456
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37840.187257368554,
        "bandwidth_mbps_min": 37793.466938457634,
        "bandwidth_mbps_max": 37891.61619874351,
        "bandwidth_mbps_stddev": 49.2438,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5200.5044256639685,
          "retransmits": 0,
          "duration_sec": 30.001487,
          "bytes_transferred": 19502858240
        },
        {
          "bandwidth_mbps": 5199.797323132186,
          "retransmits": 0,
          "duration_sec": 30.001332,
          "bytes_transferred": 19500105728
        },
        {
          "bandwidth_mbps": 5189.851869796667,
          "retransmits": 0,
          "duration_sec": 30.001444,
          "bytes_transferred": 19462881280
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5196.717872864275,
        "bandwidth_mbps_min": 5189.851869796667,
        "bandwidth_mbps_max": 5200.5044256639685,
        "bandwidth_mbps_stddev": 5.9566,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 86.26666977750665,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9451.092853480994,
          "retransmits": 0,
          "duration_sec": 30.00034,
          "bytes_transferred": 35441999872
        },
        {
          "bandwidth_mbps": 9456.058334376905,
          "retransmits": 0,
          "duration_sec": 30.001109,
          "bytes_transferred": 35461529600
        },
        {
          "bandwidth_mbps": 9471.602388820545,
          "retransmits": 0,
          "duration_sec": 30.001249,
          "bytes_transferred": 35519987712
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9459.584525559481,
        "bandwidth_mbps_min": 9451.092853480994,
        "bandwidth_mbps_max": 9471.602388820545,
        "bandwidth_mbps_stddev": 10.6998,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4807.191104166331,
          "retransmits": 0,
          "duration_sec": 30.000471,
          "bytes_transferred": 18027249664
        },
        {
          "bandwidth_mbps": 4854.377579868867,
          "retransmits": 0,
          "duration_sec": 30.000895,
          "bytes_transferred": 18204459008
        },
        {
          "bandwidth_mbps": 4891.628680997014,
          "retransmits": 0,
          "duration_sec": 30.000296,
          "bytes_transferred": 18343788544
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4851.06578834407,
        "bandwidth_mbps_min": 4807.191104166331,
        "bandwidth_mbps_max": 4891.628680997014,
        "bandwidth_mbps_stddev": 42.3161,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 48.7179825367948,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.154",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.154",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.100,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.95.240.49",
      "hops": [
        {
          "hop": 1,
          "host": "100.95.240.49",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.300,
          "stdev_ms": 0.000
        }
      ]
    },
    "source": "aws/c8gn/results/c8gn.xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "m6i",
    "instance_type": "m6i.large",
    "vcpus": 2,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-115 6.14.0-1018-aws #18~24.04.1-Ubuntu SMP Mon Nov 24 19:46:27 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12405.219243625212,
          "retransmits": 0,
          "duration_sec": 30.001,
          "bytes_transferred": 46521122816
        },
        {
          "bandwidth_mbps": 12404.617653561507,
          "retransmits": 0,
          "duration_sec": 30.001187,
          "bytes_transferred": 46519156736
        },
        {
          "bandwidth_mbps": 12412.196227133547,
          "retransmits": 0,
          "duration_sec": 30.001539,
          "bytes_transferred": 46548123648
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12407.344374773422,
        "bandwidth_mbps_min": 12404.617653561507,
        "bandwidth_mbps_max": 12412.196227133547,
        "bandwidth_mbps_stddev": 4.2126,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2896.179027170263,
          "retransmits": 0,
          "duration_sec": 30.003133,
          "bytes_transferred": 10861805568
        },
        {
          "bandwidth_mbps": 2900.6482320860687,
          "retransmits": 0,
          "duration_sec": 30.001008,
          "bytes_transferred": 10877796352
        },
        {
          "bandwidth_mbps": 2907.8409811603865,
          "retransmits": 0,
          "duration_sec": 30.000722,
          "bytes_transferred": 10904666112
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2901.556080138906,
        "bandwidth_mbps_min": 2896.179027170263,
        "bandwidth_mbps_max": 2907.8409811603865,
        "bandwidth_mbps_stddev": 5.8837,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 76.61420532472411,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9530.21150976948,
          "retransmits": 0,
          "duration_sec": 30.000931,
          "bytes_transferred": 35739402240
        },
        {
          "bandwidth_mbps": 9471.041954400564,
          "retransmits": 0,
          "duration_sec": 30.00081,
          "bytes_transferred": 35517366272
        },
        {
          "bandwidth_mbps": 9470.543035166966,
          "retransmits": 0,
          "duration_sec": 30.001394,
          "bytes_transferred": 35516186624
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9490.598833112337,
        "bandwidth_mbps_min": 9470.543035166966,
        "bandwidth_mbps_max": 9530.21150976948,
        "bandwidth_mbps_stddev": 34.3065,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2902.225677157196,
          "retransmits": 0,
          "duration_sec": 30.002044,
          "bytes_transferred": 10884087808
        },
        {
          "bandwidth_mbps": 2862.6916841539896,
          "retransmits": 0,
          "duration_sec": 30.001734,
          "bytes_transferred": 10735714304
        },
        {
          "bandwidth_mbps": 2924.709195136406,
          "retransmits": 0,
          "duration_sec": 30.00086,
          "bytes_transferred": 10967973888
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2896.5421854825304,
        "bandwidth_mbps_min": 2862.6916841539896,
        "bandwidth_mbps_max": 2924.709195136406,
        "bandwidth_mbps_stddev": 31.3970,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 69.47987965336175,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.115",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.115",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.88.160.31",
      "hops": [
        {
          "hop": 1,
          "host": "100.88.160.31",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.400,
          "best_ms": 0.400,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/m6i/results/m6i.large.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "m6i",
    "instance_type": "m6i.xlarge",
    "vcpus": 4,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-89 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:50:29 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12411.866408626973,
          "retransmits": 0,
          "duration_sec": 30.001069,
          "bytes_transferred": 46546157568
        },
        {
          "bandwidth_mbps": 12411.557465470813,
          "retransmits": 0,
          "duration_sec": 30.000633,
          "bytes_transferred": 46544322560
        },
        {
          "bandwidth_mbps": 12412.1371322015,
          "retransmits": 0,
          "duration_sec": 30.001006,
          "bytes_transferred": 46547075072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12411.85366876643,
        "bandwidth_mbps_min": 12411.557465470813,
        "bandwidth_mbps_max": 12412.1371322015,
        "bandwidth_mbps_stddev": 0.2900,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3791.435841587782,
          "retransmits": 0,
          "duration_sec": 30.001701,
          "bytes_transferred": 14218690560
        },
        {
          "bandwidth_mbps": 3782.2442315382536,
          "retransmits": 0,
          "duration_sec": 30.000589,
          "bytes_transferred": 14183694336
        },
        {
          "bandwidth_mbps": 3769.476821744564,
          "retransmits": 0,
          "duration_sec": 30.001503,
          "bytes_transferred": 14136246272
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3781.0522982902,
        "bandwidth_mbps_min": 3769.476821744564,
        "bandwidth_mbps_max": 3791.435841587782,
        "bandwidth_mbps_stddev": 11.0279,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 69.53676381308816,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9467.224592142204,
          "retransmits": 0,
          "duration_sec": 30.001388,
          "bytes_transferred": 35503734784
        },
        {
          "bandwidth_mbps": 9467.183330062377,
          "retransmits": 0,
          "duration_sec": 30.001408,
          "bytes_transferred": 35503603712
        },
        {
          "bandwidth_mbps": 9466.868606232145,
          "retransmits": 0,
          "duration_sec": 30.001187,
          "bytes_transferred": 35502161920
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9467.092176145576,
        "bandwidth_mbps_min": 9466.868606232145,
        "bandwidth_mbps_max": 9467.224592142204,
        "bandwidth_mbps_stddev": 0.1947,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3608.8127379517714,
          "retransmits": 0,
          "duration_sec": 30.000302,
          "bytes_transferred": 13533184000
        },
        {
          "bandwidth_mbps": 3627.1318029195254,
          "retransmits": 0,
          "duration_sec": 30.000557,
          "bytes_transferred": 13601996800
        },
        {
          "bandwidth_mbps": 3620.2618052007956,
          "retransmits": 0,
          "duration_sec": 30.000718,
          "bytes_transferred": 13576306688
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3618.7354486906975,
        "bandwidth_mbps_min": 3608.8127379517714,
        "bandwidth_mbps_max": 3627.1318029195254,
        "bandwidth_mbps_stddev": 9.2544,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 61.77563943225463,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.89",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.89",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.66.78.17",
      "hops": [
        {
          "hop": 1,
          "host": "100.66.78.17",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/m6i/results/m6i.xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "m7g",
    "instance_type": "m7g.xlarge",
    "vcpus": 4,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-03-21",
    "tailscale_version": "1.96.2",
    "kernel_version": "6.17.0-1009-aws",
    "connection_type": "direct",
    "ena_express": false,
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-148 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12411.292271241755,
          "retransmits": 0,
          "duration_sec": 30.001443,
          "bytes_transferred": 46544584704
        },
        {
          "bandwidth_mbps": 12411.32210517123,
          "retransmits": 0,
          "duration_sec": 30.000695,
          "bytes_transferred": 46543536128
        },
        {
          "bandwidth_mbps": 12411.736161940291,
          "retransmits": 0,
          "duration_sec": 30.000539,
          "bytes_transferred": 46544846848
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12411.450179451092,
        "bandwidth_mbps_min": 12411.292271241755,
        "bandwidth_mbps_max": 12411.736161940291,
        "bandwidth_mbps_stddev": 0.2481,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3485.758940390641,
          "retransmits": 0,
          "duration_sec": 30.001094,
          "bytes_transferred": 13072072704
        },
        {
          "bandwidth_mbps": 3404.9991739355482,
          "retransmits": 0,
          "duration_sec": 30.001291,
          "bytes_transferred": 12769296384
        },
        {
          "bandwidth_mbps": 3487.3703017789735,
          "retransmits": 0,
          "duration_sec": 30.001063,
          "bytes_transferred": 13078102016
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3459.3761387017207,
        "bandwidth_mbps_min": 3404.9991739355482,
        "bandwidth_mbps_max": 3487.3703017789735,
        "bandwidth_mbps_stddev": 47.0987,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 72.12754280374742,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9477.654783380627,
          "retransmits": 0,
          "duration_sec": 30.000456,
          "bytes_transferred": 35541745664
        },
        {
          "bandwidth_mbps": 9475.860735081624,
          "retransmits": 0,
          "duration_sec": 30.001267,
          "bytes_transferred": 35535978496
        },
        {
          "bandwidth_mbps": 9476.778511526265,
          "retransmits": 0,
          "duration_sec": 30.001349,
          "bytes_transferred": 35539517440
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9476.764676662839,
        "bandwidth_mbps_min": 9475.860735081624,
        "bandwidth_mbps_max": 9477.654783380627,
        "bandwidth_mbps_stddev": 0.8971,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3193.4959822638502,
          "retransmits": 0,
          "duration_sec": 30.001099,
          "bytes_transferred": 11976048640
        },
        {
          "bandwidth_mbps": 3193.895850039929,
          "retransmits": 0,
          "duration_sec": 30.000626,
          "bytes_transferred": 11977359360
        },
        {
          "bandwidth_mbps": 3218.559271548708,
          "retransmits": 0,
          "duration_sec": 30.000743,
          "bytes_transferred": 12069896192
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3201.983701284162,
        "bandwidth_mbps_min": 3193.4959822638502,
        "bandwidth_mbps_max": 3218.559271548708,
        "bandwidth_mbps_stddev": 14.3563,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 66.21226958215752,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.148",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.148",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.71.59.69",
      "hops": [
        {
          "hop": 1,
          "host": "100.71.59.69",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/m7g/results/m7g.xlarge.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "dsv4",
    "instance_type": "Standard_D2s_v4",
    "vcpus": 2,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "performance",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-standard-d2s-v4-server 6.14.0-1017-azure #17~24.04.1-Ubuntu SMP Mon Dec  1 20:10:50 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2511.42881037282,
          "retransmits": 0,
          "duration_sec": 30.001021,
          "bytes_transferred": 9418178560
        },
        {
          "bandwidth_mbps": 2564.214143047223,
          "retransmits": 0,
          "duration_sec": 30.000918,
          "bytes_transferred": 9616097280
        },
        {
          "bandwidth_mbps": 2430.6473915157776,
          "retransmits": 0,
          "duration_sec": 30.000699,
          "bytes_transferred": 9115140096
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2502.0967816452735,
        "bandwidth_mbps_min": 2430.6473915157776,
        "bandwidth_mbps_max": 2564.214143047223,
        "bandwidth_mbps_stddev": 67.2706,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1468.4157025712643,
          "retransmits": 0,
          "duration_sec": 30.000921,
          "bytes_transferred": 5506727936
        },
        {
          "bandwidth_mbps": 1504.5312848488331,
          "retransmits": 0,
          "duration_sec": 30.002798,
          "bytes_transferred": 5642518528
        },
        {
          "bandwidth_mbps": 1495.5071719160921,
          "retransmits": 8,
          "duration_sec": 30.000839,
          "bytes_transferred": 5608308736
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1489.48471977873,
        "bandwidth_mbps_min": 1468.4157025712643,
        "bandwidth_mbps_max": 1504.5312848488331,
        "bandwidth_mbps_stddev": 18.7959,
        "retransmits_avg": 2.6666666666666665
      }
    },
    "overhead": {
      "bandwidth_pct": 40.470539321052655,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2430.725783484449,
          "retransmits": 0,
          "duration_sec": 30.001457,
          "bytes_transferred": 9115664384
        },
        {
          "bandwidth_mbps": 2447.2624664644154,
          "retransmits": 0,
          "duration_sec": 30.000968,
          "bytes_transferred": 9177530368
        },
        {
          "bandwidth_mbps": 2402.973458170755,
          "retransmits": 0,
          "duration_sec": 30.001474,
          "bytes_transferred": 9011593216
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2426.987236039873,
        "bandwidth_mbps_min": 2402.973458170755,
        "bandwidth_mbps_max": 2447.2624664644154,
        "bandwidth_mbps_stddev": 22.3799,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1542.6652023441072,
          "retransmits": 0,
          "duration_sec": 30.000676,
          "bytes_transferred": 5785124864
        },
        {
          "bandwidth_mbps": 1539.3110661728288,
          "retransmits": 1,
          "duration_sec": 30.000652,
          "bytes_transferred": 5772541952
        },
        {
          "bandwidth_mbps": 1494.25708428227,
          "retransmits": 0,
          "duration_sec": 30.000675,
          "bytes_transferred": 5603590144
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1525.4111175997352,
        "bandwidth_mbps_min": 1494.25708428227,
        "bandwidth_mbps_max": 1542.6652023441072,
        "bandwidth_mbps_stddev": 27.0323,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "overhead_single": {
      "bandwidth_pct": 37.14795467615413,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.7",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.7",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.500,
          "avg_ms": 1.300,
          "best_ms": 0.900,
          "worst_ms": 2.000,
          "stdev_ms": 0.200
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.70.179.6",
      "hops": [
        {
          "hop": 1,
          "host": "100.70.179.6",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.400,
          "avg_ms": 1.500,
          "best_ms": 0.900,
          "worst_ms": 2.800,
          "stdev_ms": 0.300
        }
      ]
    },
    "source": "azure/dsv4/results/Standard_D2s_v4.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "dsv4",
    "instance_type": "Standard_D4s_v4",
    "vcpus": 4,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "performance",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-standard-d4s-v4-server 6.14.0-1017-azure #17~24.04.1-Ubuntu SMP Mon Dec  1 20:10:50 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 7218.922560338006,
          "retransmits": 1243,
          "duration_sec": 30.000867,
          "bytes_transferred": 27071741952
        },
        {
          "bandwidth_mbps": 7810.31814754016,
          "retransmits": 311,
          "duration_sec": 30.000672,
          "bytes_transferred": 29289349120
        },
        {
          "bandwidth_mbps": 7372.536716649904,
          "retransmits": 0,
          "duration_sec": 30.000858,
          "bytes_transferred": 27647803392
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 7467.259141509356,
        "bandwidth_mbps_min": 7218.922560338006,
        "bandwidth_mbps_max": 7810.31814754016,
        "bandwidth_mbps_stddev": 306.8655,
        "retransmits_avg": 518
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1485.477010469401,
          "retransmits": 0,
          "duration_sec": 30.001526,
          "bytes_transferred": 5570822144
        },
        {
          "bandwidth_mbps": 1572.8265143014091,
          "retransmits": 0,
          "duration_sec": 30.000715,
          "bytes_transferred": 5898240000
        },
        {
          "bandwidth_mbps": 2294.684589704586,
          "retransmits": 462,
          "duration_sec": 30.001164,
          "bytes_transferred": 8605401088
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1784.3293714917988,
        "bandwidth_mbps_min": 1485.477010469401,
        "bandwidth_mbps_max": 2294.684589704586,
        "bandwidth_mbps_stddev": 444.1332,
        "retransmits_avg": 154
      }
    },
    "overhead": {
      "bandwidth_pct": 76.10462771309243,
      "retransmits_pct": -70.27027027027027
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2432.5159787079,
          "retransmits": 0,
          "duration_sec": 30.001362,
          "bytes_transferred": 9122349056
        },
        {
          "bandwidth_mbps": 2581.5305519371313,
          "retransmits": 0,
          "duration_sec": 30.001551,
          "bytes_transferred": 9681240064
        },
        {
          "bandwidth_mbps": 2624.532367529805,
          "retransmits": 0,
          "duration_sec": 30.001409,
          "bytes_transferred": 9842458624
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2546.1929660582787,
        "bandwidth_mbps_min": 2432.5159787079,
        "bandwidth_mbps_max": 2624.532367529805,
        "bandwidth_mbps_stddev": 100.7677,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2311.363800466344,
          "retransmits": 0,
          "duration_sec": 30.000613,
          "bytes_transferred": 8667791360
        },
        {
          "bandwidth_mbps": 1922.2797652275108,
          "retransmits": 0,
          "duration_sec": 30.000619,
          "bytes_transferred": 7208697856
        },
        {
          "bandwidth_mbps": 2025.0033436646768,
          "retransmits": 0,
          "duration_sec": 30.000616,
          "bytes_transferred": 7593918464
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2086.2156364528437,
        "bandwidth_mbps_min": 1922.2797652275108,
        "bandwidth_mbps_max": 2311.363800466344,
        "bandwidth_mbps_stddev": 201.6353,
        "retransmits_avg": 0
      }
    },
    "overhead_single": {
      "bandwidth_pct": 18.06529731788234,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.6",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.6",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.000,
          "avg_ms": 1.100,
          "best_ms": 0.700,
          "worst_ms": 5.500,
          "stdev_ms": 0.600
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.121.117.109",
      "hops": [
        {
          "hop": 1,
          "host": "100.121.117.109",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.200,
          "avg_ms": 1.300,
          "best_ms": 0.900,
          "worst_ms": 3.500,
          "stdev_ms": 0.300
        }
      ]
    },
    "source": "azure/dsv4/results/Standard_D4s_v4.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "falsv6",
    "instance_type": "Standard_F2als_v6",
    "vcpus": 2,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-standard-f2als-v6-server 6.14.0-1017-azure #17~24.04.1-Ubuntu SMP Mon Dec  1 20:10:50 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11087.866426300707,
          "retransmits": 2075895,
          "duration_sec": 30.001475,
          "bytes_transferred": 41581543424
        },
        {
          "bandwidth_mbps": 11083.448215846707,
          "retransmits": 2256563,
          "duration_sec": 30.001514,
          "bytes_transferred": 41565028352
        },
        {
          "bandwidth_mbps": 11049.730399606,
          "retransmits": 2344580,
          "duration_sec": 30.002152,
          "bytes_transferred": 41439461376
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11073.681680584472,
        "bandwidth_mbps_min": 11049.730399606,
        "bandwidth_mbps_max": 11087.866426300707,
        "bandwidth_mbps_stddev": 20.8597,
        "retransmits_avg": 2225679.3333333335
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5120.461304357724,
          "retransmits": 2456,
          "duration_sec": 30.000497,
          "bytes_transferred": 19202048000
        },
        {
          "bandwidth_mbps": 5148.54122268908,
          "retransmits": 0,
          "duration_sec": 30.001233,
          "bytes_transferred": 19307823104
        },
        {
          "bandwidth_mbps": 5145.81379749588,
          "retransmits": 0,
          "duration_sec": 30.001444,
          "bytes_transferred": 19297730560
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5138.272108180895,
        "bandwidth_mbps_min": 5120.461304357724,
        "bandwidth_mbps_max": 5148.54122268908,
        "bandwidth_mbps_stddev": 15.4848,
        "retransmits_avg": 818.6666666666666
      }
    },
    "overhead": {
      "bandwidth_pct": 53.59924317501517,
      "retransmits_pct": -99.96321722296624
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11833.663635335804,
          "retransmits": 136967,
          "duration_sec": 30.001344,
          "bytes_transferred": 44378226688
        },
        {
          "bandwidth_mbps": 11841.434727480186,
          "retransmits": 133342,
          "duration_sec": 30.001048,
          "bytes_transferred": 44406931456
        },
        {
          "bandwidth_mbps": 11840.978078895496,
          "retransmits": 130114,
          "duration_sec": 30.001408,
          "bytes_transferred": 44405751808
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11838.692147237161,
        "bandwidth_mbps_min": 11833.663635335804,
        "bandwidth_mbps_max": 11841.434727480186,
        "bandwidth_mbps_stddev": 4.3608,
        "retransmits_avg": 133474.33333333334
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4607.251492751005,
          "retransmits": 0,
          "duration_sec": 30.002157,
          "bytes_transferred": 17278435328
        },
        {
          "bandwidth_mbps": 4727.296077632263,
          "retransmits": 0,
          "duration_sec": 30.001547,
          "bytes_transferred": 17728274432
        },
        {
          "bandwidth_mbps": 4752.686109259136,
          "retransmits": 5,
          "duration_sec": 30.001006,
          "bytes_transferred": 17823170560
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4695.744559880801,
        "bandwidth_mbps_min": 4607.251492751005,
        "bandwidth_mbps_max": 4752.686109259136,
        "bandwidth_mbps_stddev": 77.6816,
        "retransmits_avg": 1.6666666666666667
      }
    },
    "overhead_single": {
      "bandwidth_pct": 60.33561392187511,
      "retransmits_pct": -99.99875132047859
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.4",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.4",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 0.800,
          "best_ms": 0.600,
          "worst_ms": 1.400,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.70.200.45",
      "hops": [
        {
          "hop": 1,
          "host": "100.70.200.45",
          "loss_pct": 1.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 1.600,
          "best_ms": 0.400,
          "worst_ms": 8.900,
          "stdev_ms": 2.100
        }
      ]
    },
    "source": "azure/falsv6/results/Standard_F2als_v6.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "falsv6",
    "instance_type": "Standard_F4als_v6",
    "vcpus": 4,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-standard-f4als-v6-server 6.14.0-1017-azure #17~24.04.1-Ubuntu SMP Mon Dec  1 20:10:50 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11514.830235475421,
          "retransmits": 932791,
          "duration_sec": 30.001645,
          "bytes_transferred": 43182981120
        },
        {
          "bandwidth_mbps": 11313.126854363913,
          "retransmits": 1674364,
          "duration_sec": 30.001932,
          "bytes_transferred": 42426957824
        },
        {
          "bandwidth_mbps": 11541.158765494283,
          "retransmits": 1014784,
          "duration_sec": 30.001708,
          "bytes_transferred": 43281809408
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11456.371951777874,
        "bandwidth_mbps_min": 11313.126854363913,
        "bandwidth_mbps_max": 11541.158765494283,
        "bandwidth_mbps_stddev": 124.7504,
        "retransmits_avg": 1207313
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6040.920331856544,
          "retransmits": 83,
          "duration_sec": 30.000674,
          "bytes_transferred": 22653960192
        },
        {
          "bandwidth_mbps": 6072.211936340327,
          "retransmits": 0,
          "duration_sec": 30.000971,
          "bytes_transferred": 22771531776
        },
        {
          "bandwidth_mbps": 6034.333513162153,
          "retransmits": 3,
          "duration_sec": 30.000753,
          "bytes_transferred": 22629318656
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6049.155260453008,
        "bandwidth_mbps_min": 6034.333513162153,
        "bandwidth_mbps_max": 6072.211936340327,
        "bandwidth_mbps_stddev": 20.2374,
        "retransmits_avg": 28.666666666666668
      }
    },
    "overhead": {
      "bandwidth_pct": 47.19833394101472,
      "retransmits_pct": -99.99762558121492
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11839.511325286267,
          "retransmits": 128768,
          "duration_sec": 30.001405,
          "bytes_transferred": 44400246784
        },
        {
          "bandwidth_mbps": 11871.086360105777,
          "retransmits": 70561,
          "duration_sec": 30.001457,
          "bytes_transferred": 44518735872
        },
        {
          "bandwidth_mbps": 11822.238095365074,
          "retransmits": 152821,
          "duration_sec": 30.001424,
          "bytes_transferred": 44335497216
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11844.278593585705,
        "bandwidth_mbps_min": 11822.238095365074,
        "bandwidth_mbps_max": 11871.086360105777,
        "bandwidth_mbps_stddev": 24.7706,
        "retransmits_avg": 117383.33333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5872.299030605641,
          "retransmits": 0,
          "duration_sec": 30.001103,
          "bytes_transferred": 22021931008
        },
        {
          "bandwidth_mbps": 5920.202519372417,
          "retransmits": 0,
          "duration_sec": 30.000646,
          "bytes_transferred": 22201237504
        },
        {
          "bandwidth_mbps": 5909.894895940518,
          "retransmits": 5,
          "duration_sec": 30.00063,
          "bytes_transferred": 22162571264
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5900.7988153061915,
        "bandwidth_mbps_min": 5872.299030605641,
        "bandwidth_mbps_max": 5920.202519372417,
        "bandwidth_mbps_stddev": 25.2139,
        "retransmits_avg": 1.6666666666666667
      }
    },
    "overhead_single": {
      "bandwidth_pct": 50.18017544351091,
      "retransmits_pct": -99.99858015050404
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.10",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.10",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.200,
          "avg_ms": 0.800,
          "best_ms": 0.600,
          "worst_ms": 3.000,
          "stdev_ms": 0.400
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.67.25.105",
      "hops": [
        {
          "hop": 1,
          "host": "100.67.25.105",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 1.600,
          "best_ms": 0.500,
          "worst_ms": 9.500,
          "stdev_ms": 2.000
        }
      ]
    },
    "source": "azure/falsv6/results/Standard_F4als_v6.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "famsv6",
    "instance_type": "Standard_F4ams_v6",
    "vcpus": 4,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-standard-f4ams-v6-server 6.14.0-1017-azure #17~24.04.1-Ubuntu SMP Mon Dec  1 20:10:50 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11680.9956815201,
          "retransmits": 477529,
          "duration_sec": 30.001529,
          "bytes_transferred": 43805966336
        },
        {
          "bandwidth_mbps": 11010.571457465197,
          "retransmits": 2515855,
          "duration_sec": 30.001526,
          "bytes_transferred": 41291743232
        },
        {
          "bandwidth_mbps": 11621.151084983869,
          "retransmits": 827228,
          "duration_sec": 30.001552,
          "bytes_transferred": 43581571072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11437.572741323056,
        "bandwidth_mbps_min": 11010.571457465197,
        "bandwidth_mbps_max": 11680.9956815201,
        "bandwidth_mbps_stddev": 371.0026,
        "retransmits_avg": 1273537.3333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5928.210405301484,
          "retransmits": 0,
          "duration_sec": 30.000803,
          "bytes_transferred": 22231384064
        },
        {
          "bandwidth_mbps": 5855.15450635608,
          "retransmits": 0,
          "duration_sec": 30.000481,
          "bytes_transferred": 21957181440
        },
        {
          "bandwidth_mbps": 5854.099163644366,
          "retransmits": 0,
          "duration_sec": 30.000874,
          "bytes_transferred": 21953511424
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5879.15469176731,
        "bandwidth_mbps_min": 5854.099163644366,
        "bandwidth_mbps_max": 5928.210405301484,
        "bandwidth_mbps_stddev": 42.4868,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 48.597881519683064,
      "retransmits_pct": -100
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11851.608512466315,
          "retransmits": 99186,
          "duration_sec": 30.001129,
          "bytes_transferred": 44445204480
        },
        {
          "bandwidth_mbps": 11831.445949826848,
          "retransmits": 198415,
          "duration_sec": 30.001384,
          "bytes_transferred": 44369969152
        },
        {
          "bandwidth_mbps": 11851.707648014377,
          "retransmits": 126546,
          "duration_sec": 30.001055,
          "bytes_transferred": 44445466624
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11844.920703435846,
        "bandwidth_mbps_min": 11831.445949826848,
        "bandwidth_mbps_max": 11851.707648014377,
        "bandwidth_mbps_stddev": 11.6696,
        "retransmits_avg": 141382.33333333334
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5812.828432453054,
          "retransmits": 11,
          "duration_sec": 30.001379,
          "bytes_transferred": 21799108608
        },
        {
          "bandwidth_mbps": 5799.003274603794,
          "retransmits": 0,
          "duration_sec": 30.000576,
          "bytes_transferred": 21746679808
        },
        {
          "bandwidth_mbps": 5791.5457765799,
          "retransmits": 0,
          "duration_sec": 30.000461,
          "bytes_transferred": 21718630400
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5801.125827878916,
        "bandwidth_mbps_min": 5791.5457765799,
        "bandwidth_mbps_max": 5812.828432453054,
        "bandwidth_mbps_stddev": 10.7989,
        "retransmits_avg": 3.6666666666666665
      }
    },
    "overhead_single": {
      "bandwidth_pct": 51.02435910612564,
      "retransmits_pct": -99.99740655951828
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.4",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.4",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.900,
          "avg_ms": 1.400,
          "best_ms": 0.700,
          "worst_ms": 7.500,
          "stdev_ms": 1.200
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.70.7.67",
      "hops": [
        {
          "hop": 1,
          "host": "100.70.7.67",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 1.700,
          "best_ms": 0.400,
          "worst_ms": 8.700,
          "stdev_ms": 2.300
        }
      ]
    },
    "source": "azure/famsv6/results/Standard_F4ams_v6.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "fasv6",
    "instance_type": "Standard_F2as_v6",
    "vcpus": 2,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "unknown",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-standard-f2as-v6-server 6.14.0-1017-azure #17~24.04.1-Ubuntu SMP Mon Dec  1 20:10:50 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11079.128271544789,
          "retransmits": 2126183,
          "duration_sec": 30.001003,
          "bytes_transferred": 41548120064
        },
        {
          "bandwidth_mbps": 10985.694156199708,
          "retransmits": 2560217,
          "duration_sec": 30.000837,
          "bytes_transferred": 41197502464
        },
        {
          "bandwidth_mbps": 11066.64676186485,
          "retransmits": 2326679,
          "duration_sec": 30.001203,
          "bytes_transferred": 41501589504
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11043.823063203114,
        "bandwidth_mbps_min": 10985.694156199708,
        "bandwidth_mbps_max": 11079.128271544789,
        "bandwidth_mbps_stddev": 50.7265,
        "retransmits_avg": 2337693
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5075.350886173125,
          "retransmits": 291,
          "duration_sec": 30.001869,
          "bytes_transferred": 19033751552
        },
        {
          "bandwidth_mbps": 4998.932112890922,
          "retransmits": 0,
          "duration_sec": 30.000924,
          "bytes_transferred": 18746572800
        },
        {
          "bandwidth_mbps": 4968.270899216373,
          "retransmits": 1,
          "duration_sec": 30.000766,
          "bytes_transferred": 18631491584
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5014.184632760141,
        "bandwidth_mbps_min": 4968.270899216373,
        "bandwidth_mbps_max": 5075.350886173125,
        "bandwidth_mbps_stddev": 55.1454,
        "retransmits_avg": 97.33333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 54.597383496056814,
      "retransmits_pct": -99.99583635090949
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11844.782385902652,
          "retransmits": 125868,
          "duration_sec": 30.001333,
          "bytes_transferred": 44419907584
        },
        {
          "bandwidth_mbps": 11827.891600503272,
          "retransmits": 159221,
          "duration_sec": 30.001357,
          "bytes_transferred": 44356599808
        },
        {
          "bandwidth_mbps": 11841.771253725428,
          "retransmits": 133603,
          "duration_sec": 30.001258,
          "bytes_transferred": 44408504320
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11838.148413377117,
        "bandwidth_mbps_min": 11827.891600503272,
        "bandwidth_mbps_max": 11844.782385902652,
        "bandwidth_mbps_stddev": 9.0093,
        "retransmits_avg": 139564
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4581.6380970513555,
          "retransmits": 1,
          "duration_sec": 30.001209,
          "bytes_transferred": 17181835264
        },
        {
          "bandwidth_mbps": 4707.259538292483,
          "retransmits": 0,
          "duration_sec": 30.000941,
          "bytes_transferred": 17652776960
        },
        {
          "bandwidth_mbps": 4677.5353814401105,
          "retransmits": 1,
          "duration_sec": 30.00104,
          "bytes_transferred": 17541365760
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4655.477672261316,
        "bandwidth_mbps_min": 4581.6380970513555,
        "bandwidth_mbps_max": 4707.259538292483,
        "bandwidth_mbps_stddev": 65.6513,
        "retransmits_avg": 0.6666666666666666
      }
    },
    "overhead_single": {
      "bandwidth_pct": 60.673937260318326,
      "retransmits_pct": -99.99952232189773
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.10",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.10",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 3.600,
          "avg_ms": 1.900,
          "best_ms": 0.700,
          "worst_ms": 12.400,
          "stdev_ms": 2.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.74.185.43",
      "hops": [
        {
          "hop": 1,
          "host": "100.74.185.43",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.600,
          "best_ms": 0.400,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "azure/fasv6/results/Standard_F2as_v6.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "fsv2",
    "instance_type": "Standard_F16s_v2",
    "vcpus": 16,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-12",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "performance",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-standard-f16s-v2-server 6.14.0-1017-azure #17~24.04.1-Ubuntu SMP Mon Dec  1 20:10:50 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 8010.148050714095,
          "retransmits": 0,
          "duration_sec": 30.001679,
          "bytes_transferred": 30039736320
        },
        {
          "bandwidth_mbps": 7970.279122541528,
          "retransmits": 0,
          "duration_sec": 30.001511,
          "bytes_transferred": 29890052096
        },
        {
          "bandwidth_mbps": 6236.61575005133,
          "retransmits": 0,
          "duration_sec": 30.00168,
          "bytes_transferred": 23388618752
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 7405.680974435651,
        "bandwidth_mbps_min": 6236.61575005133,
        "bandwidth_mbps_max": 8010.148050714095,
        "bandwidth_mbps_stddev": 1012.6364,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2317.6733814118875,
          "retransmits": 124,
          "duration_sec": 30.001734,
          "bytes_transferred": 8691777536
        },
        {
          "bandwidth_mbps": 2415.0338241374707,
          "retransmits": 14,
          "duration_sec": 30.001445,
          "bytes_transferred": 9056813056
        },
        {
          "bandwidth_mbps": 2383.339040499351,
          "retransmits": 8,
          "duration_sec": 30.001814,
          "bytes_transferred": 8938061824
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2372.0154153495696,
        "bandwidth_mbps_min": 2317.6733814118875,
        "bandwidth_mbps_max": 2415.0338241374707,
        "bandwidth_mbps_stddev": 49.6582,
        "retransmits_avg": 48.666666666666664
      }
    },
    "overhead": {
      "bandwidth_pct": 67.9703267864529,
      "retransmits_pct": 0
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2692.2733877886785,
          "retransmits": 0,
          "duration_sec": 30.00134,
          "bytes_transferred": 10096476160
        },
        {
          "bandwidth_mbps": 2681.18499272035,
          "retransmits": 0,
          "duration_sec": 30.00144,
          "bytes_transferred": 10054926336
        },
        {
          "bandwidth_mbps": 2746.191204389812,
          "retransmits": 0,
          "duration_sec": 30.001466,
          "bytes_transferred": 10298720256
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2706.5498616329464,
        "bandwidth_mbps_min": 2681.18499272035,
        "bandwidth_mbps_max": 2746.191204389812,
        "bandwidth_mbps_stddev": 34.7752,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2373.170853490487,
          "retransmits": 1,
          "duration_sec": 30.001342,
          "bytes_transferred": 8899788800
        },
        {
          "bandwidth_mbps": 2223.5038338831514,
          "retransmits": 0,
          "duration_sec": 30.001436,
          "bytes_transferred": 8338538496
        },
        {
          "bandwidth_mbps": 2192.2587877334613,
          "retransmits": 0,
          "duration_sec": 30.001422,
          "bytes_transferred": 8221360128
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2262.9778250357,
        "bandwidth_mbps_min": 2192.2587877334613,
        "bandwidth_mbps_max": 2373.170853490487,
        "bandwidth_mbps_stddev": 96.7003,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "overhead_single": {
      "bandwidth_pct": 16.388836684118047,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.10",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.10",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.900,
          "avg_ms": 1.400,
          "best_ms": 0.800,
          "worst_ms": 5.600,
          "stdev_ms": 1.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.70.113.33",
      "hops": [
        {
          "hop": 1,
          "host": "100.70.113.33",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.100,
          "avg_ms": 1.600,
          "best_ms": 0.800,
          "worst_ms": 10.600,
          "stdev_ms": 1.100
        }
      ]
    },
    "source": "azure/fsv2/results/Standard_F16s_v2.json"
  }
]
;
