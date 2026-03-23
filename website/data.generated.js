const TAILBENCH_DATA = [
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.30",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.30",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.2,
          "best_ms": 0.1,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9553.139039107944,
          "retransmits": 0,
          "duration_sec": 30.001372,
          "bytes_transferred": 35825909760
        },
        {
          "bandwidth_mbps": 9425.462568120643,
          "retransmits": 0,
          "duration_sec": 30.000818,
          "bytes_transferred": 35346448384
        },
        {
          "bandwidth_mbps": 9466.05120604616,
          "retransmits": 0,
          "duration_sec": 30.000676,
          "bytes_transferred": 35498491904
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9481.55093775825,
        "bandwidth_mbps_min": 9425.462568120643,
        "bandwidth_mbps_max": 9553.139039107944,
        "bandwidth_mbps_stddev": 53.26350578837756,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9436.780383913,
          "retransmits": 0,
          "duration_sec": 30.001172,
          "bytes_transferred": 35389308928
        },
        {
          "bandwidth_mbps": 9436.613732030386,
          "retransmits": 0,
          "duration_sec": 30.000924,
          "bytes_transferred": 35388391424
        },
        {
          "bandwidth_mbps": 9433.842284664881,
          "retransmits": 0,
          "duration_sec": 30.001179,
          "bytes_transferred": 35378298880
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9435.74546686942,
        "bandwidth_mbps_min": 9433.842284664881,
        "bandwidth_mbps_max": 9436.780383913,
        "bandwidth_mbps_stddev": 1.3474717288948113,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c4",
    "instance_type": "c4-standard-2",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 56.78424360213563,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 59.75324633320248,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c4/results/c4-standard-2-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4-standard-2-server-5885144 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.79.181.34",
      "hops": [
        {
          "hop": 1,
          "host": "100.79.181.34",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.6,
          "avg_ms": 0.5,
          "best_ms": 0.4,
          "worst_ms": 0.8,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4095.1353656709416,
          "retransmits": 0,
          "duration_sec": 30.001085,
          "bytes_transferred": 15357313024
        },
        {
          "bandwidth_mbps": 4097.389716609126,
          "retransmits": 0,
          "duration_sec": 30.001213,
          "bytes_transferred": 15365832704
        },
        {
          "bandwidth_mbps": 4100.046785723023,
          "retransmits": 0,
          "duration_sec": 30.002486,
          "bytes_transferred": 15376449536
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4097.52395600103,
        "bandwidth_mbps_min": 4095.1353656709416,
        "bandwidth_mbps_max": 4100.046785723023,
        "bandwidth_mbps_stddev": 2.007324403736087,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3771.4291708533183,
          "retransmits": 0,
          "duration_sec": 30.002098,
          "bytes_transferred": 14143848448
        },
        {
          "bandwidth_mbps": 3825.8668532518727,
          "retransmits": 0,
          "duration_sec": 30.001664,
          "bytes_transferred": 14347796480
        },
        {
          "bandwidth_mbps": 3795.4476799256554,
          "retransmits": 0,
          "duration_sec": 30.000655,
          "bytes_transferred": 14233239552
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3797.581234676949,
        "bandwidth_mbps_min": 3771.4291708533183,
        "bandwidth_mbps_max": 3825.8668532518727,
        "bandwidth_mbps_stddev": 22.275238242482704,
        "retransmits_avg": 0
      }
    },
    "tailscale_version": "1.96.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "transport_mode": "l4-kernel",
    "vcpus": 2,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.63",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.63",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.3,
          "best_ms": 0.1,
          "worst_ms": 0.8,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 21723.87363397438,
          "retransmits": 0,
          "duration_sec": 30.000627,
          "bytes_transferred": 81466228736
        },
        {
          "bandwidth_mbps": 21724.774266572676,
          "retransmits": 0,
          "duration_sec": 30.001507,
          "bytes_transferred": 81471995904
        },
        {
          "bandwidth_mbps": 21724.4327240215,
          "retransmits": 0,
          "duration_sec": 30.001496,
          "bytes_transferred": 81470685184
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21724.36020818952,
        "bandwidth_mbps_min": 21723.87363397438,
        "bandwidth_mbps_max": 21724.774266572676,
        "bandwidth_mbps_stddev": 0.3712399751229635,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 21681.20523264951,
          "retransmits": 0,
          "duration_sec": 30.001245,
          "bytes_transferred": 81307893760
        },
        {
          "bandwidth_mbps": 21684.695281383592,
          "retransmits": 0,
          "duration_sec": 30.001252,
          "bytes_transferred": 81321000960
        },
        {
          "bandwidth_mbps": 21685.744536452832,
          "retransmits": 0,
          "duration_sec": 30.001251,
          "bytes_transferred": 81324933120
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21683.88168349531,
        "bandwidth_mbps_min": 21681.20523264951,
        "bandwidth_mbps_max": 21685.744536452832,
        "bandwidth_mbps_stddev": 1.9404081868812728,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c4",
    "instance_type": "c4-standard-4",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 73.70219251853491,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 74.66387346409921,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c4/results/c4-standard-4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4-standard-4-server-5d2e6e0 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.125.5.9",
      "hops": [
        {
          "hop": 1,
          "host": "100.125.5.9",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.9,
          "avg_ms": 0.9,
          "best_ms": 0.4,
          "worst_ms": 23,
          "stdev_ms": 2.2
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5701.7025399312915,
          "retransmits": 0,
          "duration_sec": 30.001284,
          "bytes_transferred": 21382299648
        },
        {
          "bandwidth_mbps": 5710.57701225492,
          "retransmits": 0,
          "duration_sec": 30.000933,
          "bytes_transferred": 21415329792
        },
        {
          "bandwidth_mbps": 5726.811720202851,
          "retransmits": 0,
          "duration_sec": 30.001392,
          "bytes_transferred": 21476540416
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5713.030424129687,
        "bandwidth_mbps_min": 5701.7025399312915,
        "bandwidth_mbps_max": 5726.811720202851,
        "bandwidth_mbps_stddev": 10.396542882062617,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5501.020058486308,
          "retransmits": 0,
          "duration_sec": 30.000868,
          "bytes_transferred": 20629422080
        },
        {
          "bandwidth_mbps": 5497.339426401009,
          "retransmits": 0,
          "duration_sec": 30.001308,
          "bytes_transferred": 20615921664
        },
        {
          "bandwidth_mbps": 5483.207618788833,
          "retransmits": 0,
          "duration_sec": 30.000989,
          "bytes_transferred": 20562706432
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5493.855701225384,
        "bandwidth_mbps_min": 5483.207618788833,
        "bandwidth_mbps_max": 5501.020058486308,
        "bandwidth_mbps_stddev": 7.67780384478567,
        "retransmits_avg": 0
      }
    },
    "tailscale_version": "1.96.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "transport_mode": "l4-kernel",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.240.1.4",
      "hops": [
        {
          "hop": 1,
          "host": "10.240.2.1",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0,
          "avg_ms": 0,
          "best_ms": 0,
          "worst_ms": 0,
          "stdev_ms": 0
        },
        {
          "hop": 2,
          "host": "10.0.0.4",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 1,
          "stdev_ms": 0.1
        },
        {
          "hop": 3,
          "host": "10.240.1.4",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 1,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9535.86569814642,
          "retransmits": 4,
          "duration_sec": 30.000956,
          "bytes_transferred": 35760635904
        },
        {
          "bandwidth_mbps": 9549.431110976891,
          "retransmits": 94,
          "duration_sec": 30.000723,
          "bytes_transferred": 35811229696
        },
        {
          "bandwidth_mbps": 9551.459165660352,
          "retransmits": 47,
          "duration_sec": 30.001379,
          "bytes_transferred": 35819618304
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9545.585324927888,
        "bandwidth_mbps_min": 9535.86569814642,
        "bandwidth_mbps_max": 9551.459165660352,
        "bandwidth_mbps_stddev": 6.922504846660249,
        "retransmits_avg": 48.333333333333336
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9544.841486576803,
          "retransmits": 1712,
          "duration_sec": 30.001087,
          "bytes_transferred": 35794452480
        },
        {
          "bandwidth_mbps": 9544.950567607177,
          "retransmits": 433,
          "duration_sec": 30.000854,
          "bytes_transferred": 35794583552
        },
        {
          "bandwidth_mbps": 9543.174719181965,
          "retransmits": 28,
          "duration_sec": 30.000833,
          "bytes_transferred": 35787898880
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9544.322257788648,
        "bandwidth_mbps_min": 9543.174719181965,
        "bandwidth_mbps_max": 9544.950567607177,
        "bandwidth_mbps_stddev": 0.8126533939993945,
        "retransmits_avg": 724.3333333333334
      }
    },
    "cloud_provider": "gke",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c4",
    "instance_type": "c4-standard-2",
    "kernel_version": "6.12.55+",
    "overhead": {
      "bandwidth_pct": 87.98653404636853,
      "retransmits_pct": -7038.620689655173
    },
    "overhead_single": {
      "bandwidth_pct": 88.26801526811349,
      "retransmits_pct": 1.656695812241141
    },
    "region": "us-central1",
    "source": "gke/c4/results/c4-standard-2-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t6291456",
      "tcp_wmem": "4096\t16384\t4194304",
      "kernel_full": "Linux tb-gke-server-c4-standard-2 6.12.55+ #1 SMP Sun Feb  1 08:53:53 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.98.202.14",
      "hops": [
        {
          "hop": 1,
          "host": "100.98.202.14",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 1.4,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1151.3048254941264,
          "retransmits": 3746,
          "duration_sec": 30.000824,
          "bytes_transferred": 4317511680
        },
        {
          "bandwidth_mbps": 1139.7241918646332,
          "retransmits": 1587,
          "duration_sec": 30.001131,
          "bytes_transferred": 4274126848
        },
        {
          "bandwidth_mbps": 1149.237911896396,
          "retransmits": 5018,
          "duration_sec": 30.006423,
          "bytes_transferred": 4310564864
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1146.7556430850518,
        "bandwidth_mbps_min": 1139.7241918646332,
        "bandwidth_mbps_max": 1151.3048254941264,
        "bandwidth_mbps_stddev": 5.043081905208762,
        "retransmits_avg": 3450.3333333333335
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1134.3190569343833,
          "retransmits": 375,
          "duration_sec": 30.00173,
          "bytes_transferred": 4253941760
        },
        {
          "bandwidth_mbps": 1119.2161101518625,
          "retransmits": 1105,
          "duration_sec": 30.000909,
          "bytes_transferred": 4197187584
        },
        {
          "bandwidth_mbps": 1105.6801230511846,
          "retransmits": 657,
          "duration_sec": 30.001174,
          "bytes_transferred": 4146462720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1119.73843004581,
        "bandwidth_mbps_min": 1105.6801230511846,
        "bandwidth_mbps_max": 1134.3190569343833,
        "bandwidth_mbps_stddev": 11.697627880479763,
        "retransmits_avg": 712.3333333333334
      }
    },
    "tailscale_version": "1.94.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "transport_mode": "l4-kernel",
    "vcpus": 2,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.240.1.4",
      "hops": [
        {
          "hop": 1,
          "host": "10.240.2.1",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0,
          "avg_ms": 0,
          "best_ms": 0,
          "worst_ms": 0.1,
          "stdev_ms": 0
        },
        {
          "hop": 2,
          "host": "10.0.0.6",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.6,
          "stdev_ms": 0
        },
        {
          "hop": 3,
          "host": "10.240.1.4",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.5,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 21887.7757698852,
          "retransmits": 181454,
          "duration_sec": 30.000609,
          "bytes_transferred": 82080825344
        },
        {
          "bandwidth_mbps": 21878.84366461019,
          "retransmits": 228332,
          "duration_sec": 30.001019,
          "bytes_transferred": 82048450560
        },
        {
          "bandwidth_mbps": 21912.320976933854,
          "retransmits": 134046,
          "duration_sec": 30.001458,
          "bytes_transferred": 82175197184
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21892.98013714308,
        "bandwidth_mbps_min": 21878.84366461019,
        "bandwidth_mbps_max": 21912.320976933854,
        "bandwidth_mbps_stddev": 14.153837854570213,
        "retransmits_avg": 181277.33333333334
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 10862.561287603963,
          "retransmits": 4439,
          "duration_sec": 30.001026,
          "bytes_transferred": 40735997952
        },
        {
          "bandwidth_mbps": 10400.923732554122,
          "retransmits": 3192,
          "duration_sec": 30.000926,
          "bytes_transferred": 39004667904
        },
        {
          "bandwidth_mbps": 21950.7212494866,
          "retransmits": 1104,
          "duration_sec": 30.001186,
          "bytes_transferred": 82318458880
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 14404.735423214894,
        "bandwidth_mbps_min": 10400.923732554122,
        "bandwidth_mbps_max": 21950.7212494866,
        "bandwidth_mbps_stddev": 5339.144992460759,
        "retransmits_avg": 2911.6666666666665
      }
    },
    "cloud_provider": "gke",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c4",
    "instance_type": "c4-standard-4",
    "kernel_version": "6.12.55+",
    "overhead": {
      "bandwidth_pct": 91.95026055781761,
      "retransmits_pct": 97.9664675855779
    },
    "overhead_single": {
      "bandwidth_pct": 87.4404298447924,
      "retransmits_pct": 43.228391528334285
    },
    "region": "us-central1",
    "source": "gke/c4/results/c4-standard-4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t6291456",
      "tcp_wmem": "4096\t16384\t4194304",
      "kernel_full": "Linux tb-gke-server-c4-standard-4 6.12.55+ #1 SMP Sun Feb  1 08:53:53 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.99.222.62",
      "hops": [
        {
          "hop": 1,
          "host": "100.99.222.62",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.5,
          "best_ms": 0.4,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1741.5453958011633,
          "retransmits": 4676,
          "duration_sec": 30.000594,
          "bytes_transferred": 6530924544
        },
        {
          "bandwidth_mbps": 1758.523097533437,
          "retransmits": 2659,
          "duration_sec": 30.001342,
          "bytes_transferred": 6594756608
        },
        {
          "bandwidth_mbps": 1786.9150781716858,
          "retransmits": 3724,
          "duration_sec": 30.001144,
          "bytes_transferred": 6701187072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1762.3278571687617,
        "bandwidth_mbps_min": 1741.5453958011633,
        "bandwidth_mbps_max": 1786.9150781716858,
        "bandwidth_mbps_stddev": 18.716466306659367,
        "retransmits_avg": 3686.3333333333335
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1839.0951879073648,
          "retransmits": 448,
          "duration_sec": 30.000607,
          "bytes_transferred": 6896746496
        },
        {
          "bandwidth_mbps": 1801.9556264747864,
          "retransmits": 1434,
          "duration_sec": 30.000952,
          "bytes_transferred": 6757548032
        },
        {
          "bandwidth_mbps": 1786.4677390699903,
          "retransmits": 3077,
          "duration_sec": 30.001026,
          "bytes_transferred": 6699483136
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1809.1728511507138,
        "bandwidth_mbps_min": 1786.4677390699903,
        "bandwidth_mbps_max": 1839.0951879073648,
        "bandwidth_mbps_stddev": 22.082849179091127,
        "retransmits_avg": 1653
      }
    },
    "tailscale_version": "1.94.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "transport_mode": "l4-kernel",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.72",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.60",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0,
          "avg_ms": 0,
          "best_ms": 0,
          "worst_ms": 0.1,
          "stdev_ms": 0
        },
        {
          "hop": 2,
          "host": "10.0.1.89",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.2,
          "stdev_ms": 0
        },
        {
          "hop": 3,
          "host": "10.0.1.72",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.2,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 24662.82074643202,
          "retransmits": 16704,
          "duration_sec": 30.000937,
          "bytes_transferred": 92488466432
        },
        {
          "bandwidth_mbps": 24636.97400645737,
          "retransmits": 10633,
          "duration_sec": 30.001682,
          "bytes_transferred": 92393832448
        },
        {
          "bandwidth_mbps": 24612.05981848533,
          "retransmits": 15780,
          "duration_sec": 30.003635,
          "bytes_transferred": 92306407424
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24637.284857124905,
        "bandwidth_mbps_min": 24612.05981848533,
        "bandwidth_mbps_max": 24662.82074643202,
        "bandwidth_mbps_stddev": 20.72422773157643,
        "retransmits_avg": 14372.333333333334
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9514.75809033062,
          "retransmits": 2,
          "duration_sec": 30.001277,
          "bytes_transferred": 35681861632
        },
        {
          "bandwidth_mbps": 9525.97578836798,
          "retransmits": 0,
          "duration_sec": 30.001282,
          "bytes_transferred": 35723935744
        },
        {
          "bandwidth_mbps": 9520.76922369253,
          "retransmits": 0,
          "duration_sec": 30.000948,
          "bytes_transferred": 35704012800
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9520.501034130377,
        "bandwidth_mbps_min": 9514.75809033062,
        "bandwidth_mbps_max": 9525.97578836798,
        "bandwidth_mbps_stddev": 4.583530774797735,
        "retransmits_avg": 0.6666666666666666
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.medium",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 96.41976729609854,
      "retransmits_pct": 86.59925319479555
    },
    "overhead_single": {
      "bandwidth_pct": 91.17456368125994,
      "retransmits_pct": -75400
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.medium-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-medium 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.89.232.120",
      "hops": [
        {
          "hop": 1,
          "host": "100.89.232.120",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.4,
          "best_ms": 0.2,
          "worst_ms": 5.8,
          "stdev_ms": 0.6
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 882.648968492777,
          "retransmits": 2700,
          "duration_sec": 30.001438,
          "bytes_transferred": 3310092288
        },
        {
          "bandwidth_mbps": 874.764761025491,
          "retransmits": 1537,
          "duration_sec": 30.002133,
          "bytes_transferred": 3280601088
        },
        {
          "bandwidth_mbps": 888.802659906173,
          "retransmits": 1541,
          "duration_sec": 30.001359,
          "bytes_transferred": 3333160960
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 882.0721298081471,
        "bandwidth_mbps_min": 874.764761025491,
        "bandwidth_mbps_max": 888.802659906173,
        "bandwidth_mbps_stddev": 5.745445059472601,
        "retransmits_avg": 1926
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 853.4005902755035,
          "retransmits": 559,
          "duration_sec": 30.001245,
          "bytes_transferred": 3200385024
        },
        {
          "bandwidth_mbps": 853.1693268980326,
          "retransmits": 275,
          "duration_sec": 30.000774,
          "bytes_transferred": 3199467520
        },
        {
          "bandwidth_mbps": 814.1073508029597,
          "retransmits": 676,
          "duration_sec": 30.00026,
          "bytes_transferred": 3052929024
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 840.2257559921653,
        "bandwidth_mbps_min": 814.1073508029597,
        "bandwidth_mbps_max": 853.4005902755035,
        "bandwidth_mbps_stddev": 18.46874274566051,
        "retransmits_avg": 503.3333333333333
      }
    },
    "tailscale_version": "1.94.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "transport_mode": "l4-kernel",
    "vcpus": 1,
    "zone": "us-west-2a"
  }
];
