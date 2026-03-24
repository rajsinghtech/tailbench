const TAILBENCH_DATA = [
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.26",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.26",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.2,
          "best_ms": 0.1,
          "worst_ms": 0.6,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9463.62931646981,
          "retransmits": 0,
          "duration_sec": 30.001484,
          "bytes_transferred": 35490365440
        },
        {
          "bandwidth_mbps": 9465.28672407233,
          "retransmits": 0,
          "duration_sec": 30.001105,
          "bytes_transferred": 35496132608
        },
        {
          "bandwidth_mbps": 9465.18236404559,
          "retransmits": 0,
          "duration_sec": 30.001325,
          "bytes_transferred": 35496001536
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9464.699468195911,
        "bandwidth_mbps_min": 9463.62931646981,
        "bandwidth_mbps_max": 9465.28672407233,
        "bandwidth_mbps_stddev": 0.7579099733038617,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9436.797756793456,
          "retransmits": 0,
          "duration_sec": 30.001339,
          "bytes_transferred": 35389571072
        },
        {
          "bandwidth_mbps": 9437.523447326746,
          "retransmits": 0,
          "duration_sec": 30.001032,
          "bytes_transferred": 35391930368
        },
        {
          "bandwidth_mbps": 9400.36764678775,
          "retransmits": 0,
          "duration_sec": 30.000817,
          "bytes_transferred": 35252338688
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9424.896283635984,
        "bandwidth_mbps_min": 9400.36764678775,
        "bandwidth_mbps_max": 9437.523447326746,
        "bandwidth_mbps_stddev": 17.34689551306764,
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
      "bandwidth_pct": 55.718979673332235,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 57.89824335248819,
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
      "kernel_full": "Linux tb-c4-standard-2-server-af6dea1 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.124.218.116",
      "hops": [
        {
          "hop": 1,
          "host": "100.124.218.116",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.6,
          "avg_ms": 0.5,
          "best_ms": 0.3,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4182.207884108086,
          "retransmits": 1,
          "duration_sec": 30.002024,
          "bytes_transferred": 15684337664
        },
        {
          "bandwidth_mbps": 4194.940390313747,
          "retransmits": 0,
          "duration_sec": 30.001198,
          "bytes_transferred": 15731654656
        },
        {
          "bandwidth_mbps": 4196.048211687707,
          "retransmits": 0,
          "duration_sec": 30.001024,
          "bytes_transferred": 15735717888
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4191.065495369847,
        "bandwidth_mbps_min": 4182.207884108086,
        "bandwidth_mbps_max": 4196.048211687707,
        "bandwidth_mbps_stddev": 6.2795846464294565,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3900.772454315618,
          "retransmits": 64,
          "duration_sec": 30.001883,
          "bytes_transferred": 14628814848
        },
        {
          "bandwidth_mbps": 4005.8305298888417,
          "retransmits": 329,
          "duration_sec": 30.000594,
          "bytes_transferred": 15022161920
        },
        {
          "bandwidth_mbps": 3997.537708645961,
          "retransmits": 0,
          "duration_sec": 30.000401,
          "bytes_transferred": 14990966784
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3968.0468976168067,
        "bandwidth_mbps_min": 3900.772454315618,
        "bandwidth_mbps_max": 4005.8305298888417,
        "bandwidth_mbps_stddev": 47.69053548420465,
        "retransmits_avg": 131
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 7101.339616901289,
      "avg_latency_ms": 2.2527250022141163,
      "p50_latency_ms": 2.252949999774777,
      "p90_latency_ms": 3.3820335868547673,
      "p99_latency_ms": 4.913021062758002,
      "p999_latency_ms": 6.902504515592468,
      "status_codes": {
        "200": 639152
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c4",
    "instance_type": "c4-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 112137.33736373397,
        "tailscale": 7101.339616901289,
        "delta_pct": -93.66728354368978
      },
      "p50_latency": {
        "baseline_ms": 0.5225099758436613,
        "tailscale_ms": 2.252949999774777,
        "delta_pct": 331.17837054442674
      },
      "p99_latency": {
        "baseline_ms": 0.9920249646325355,
        "tailscale_ms": 4.913021062758002,
        "delta_pct": 395.25175655008604
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c4/results/c4-standard-2-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
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
      "target_ip": "10.0.1.11",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.11",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1,
          "avg_ms": 1.4,
          "best_ms": 0.7,
          "worst_ms": 15.8,
          "stdev_ms": 1.7
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11144.334042979834,
          "retransmits": 1916502,
          "duration_sec": 30.001792,
          "bytes_transferred": 41793748992
        },
        {
          "bandwidth_mbps": 11583.619025410664,
          "retransmits": 932862,
          "duration_sec": 30.001539,
          "bytes_transferred": 43440799744
        },
        {
          "bandwidth_mbps": 11086.516467654672,
          "retransmits": 2211681,
          "duration_sec": 30.000872,
          "bytes_transferred": 41575645184
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11271.48984534839,
        "bandwidth_mbps_min": 11086.516467654672,
        "bandwidth_mbps_max": 11583.619025410664,
        "bandwidth_mbps_stddev": 221.96724501433522,
        "retransmits_avg": 1687015
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11429.695399978074,
          "retransmits": 1246161,
          "duration_sec": 30.001357,
          "bytes_transferred": 42863296512
        },
        {
          "bandwidth_mbps": 11525.631538401849,
          "retransmits": 984191,
          "duration_sec": 30.001368,
          "bytes_transferred": 43223089152
        },
        {
          "bandwidth_mbps": 11517.294270141596,
          "retransmits": 733318,
          "duration_sec": 30.000689,
          "bytes_transferred": 43190845440
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11490.87373617384,
        "bandwidth_mbps_min": 11429.695399978074,
        "bandwidth_mbps_max": 11525.631538401849,
        "bandwidth_mbps_stddev": 43.39331073850304,
        "retransmits_avg": 987890
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "d4psv6",
    "instance_type": "Standard_D4ps_v6",
    "kernel_version": "6.17.0-1008-azure",
    "overhead": {
      "bandwidth_pct": 64.30056941773016,
      "retransmits_pct": 99.96139137273033
    },
    "overhead_single": {
      "bandwidth_pct": 67.47617145785149,
      "retransmits_pct": 99.98009225048673
    },
    "region": "eastus",
    "source": "azure/d4psv6/results/Standard_D4ps_v6-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-Standard-D4ps-v6-server 6.17.0-1008-azure #8~24.04.1-Ubuntu SMP Mon Jan 26 18:46:45 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.110.28.103",
      "hops": [
        {
          "hop": 1,
          "host": "100.110.28.103",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.9,
          "avg_ms": 0.9,
          "best_ms": 0.5,
          "worst_ms": 1.4,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4078.6780642765,
          "retransmits": 1931,
          "duration_sec": 30.000793,
          "bytes_transferred": 15295447040
        },
        {
          "bandwidth_mbps": 4001.1192426122475,
          "retransmits": 17,
          "duration_sec": 30.000802,
          "bytes_transferred": 15004598272
        },
        {
          "bandwidth_mbps": 3991.775771894477,
          "retransmits": 6,
          "duration_sec": 30.001413,
          "bytes_transferred": 14969864192
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4023.857692927742,
        "bandwidth_mbps_min": 3991.775771894477,
        "bandwidth_mbps_max": 4078.6780642765,
        "bandwidth_mbps_stddev": 38.95107997968135,
        "retransmits_avg": 651.3333333333334
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3685.8407053995375,
          "retransmits": 556,
          "duration_sec": 30.001494,
          "bytes_transferred": 13822590976
        },
        {
          "bandwidth_mbps": 3742.5533454968,
          "retransmits": 11,
          "duration_sec": 30.001314,
          "bytes_transferred": 14035189760
        },
        {
          "bandwidth_mbps": 3783.422164947526,
          "retransmits": 23,
          "duration_sec": 30.001226,
          "bytes_transferred": 14188412928
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3737.2720719479544,
        "bandwidth_mbps_min": 3685.8407053995375,
        "bandwidth_mbps_max": 3783.422164947526,
        "bandwidth_mbps_stddev": 40.01211649490057,
        "retransmits_avg": 196.66666666666666
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
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.240.6.3",
      "hops": [
        {
          "hop": 1,
          "host": "10.240.4.1",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0,
          "best_ms": 0,
          "worst_ms": 0.1,
          "stdev_ms": 0
        },
        {
          "hop": 2,
          "host": "10.0.0.42",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.3,
          "best_ms": 0.2,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        },
        {
          "hop": 3,
          "host": "10.240.6.3",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.5,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9537.453998717461,
          "retransmits": 19,
          "duration_sec": 30.001457,
          "bytes_transferred": 35767189504
        },
        {
          "bandwidth_mbps": 9551.747580865745,
          "retransmits": 1,
          "duration_sec": 30.001022,
          "bytes_transferred": 35820273664
        },
        {
          "bandwidth_mbps": 9551.159638497391,
          "retransmits": 13,
          "duration_sec": 30.001222,
          "bytes_transferred": 35818307584
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9546.78707269353,
        "bandwidth_mbps_min": 9537.453998717461,
        "bandwidth_mbps_max": 9551.747580865745,
        "bandwidth_mbps_stddev": 6.603843398064562,
        "retransmits_avg": 11
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9542.0621722012,
          "retransmits": 46,
          "duration_sec": 30.001254,
          "bytes_transferred": 35784228864
        },
        {
          "bandwidth_mbps": 9536.346837877274,
          "retransmits": 10,
          "duration_sec": 30.000322,
          "bytes_transferred": 35761684480
        },
        {
          "bandwidth_mbps": 9535.43544244053,
          "retransmits": 29,
          "duration_sec": 30.00132,
          "bytes_transferred": 35759456256
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9537.94815083967,
        "bandwidth_mbps_min": 9535.43544244053,
        "bandwidth_mbps_max": 9542.0621722012,
        "bandwidth_mbps_stddev": 2.9327506125235536,
        "retransmits_avg": 28.333333333333332
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
      "bandwidth_pct": 87.84022919726043,
      "retransmits_pct": -37421.21212121212
    },
    "overhead_single": {
      "bandwidth_pct": 88.02646178406623,
      "retransmits_pct": -1021.1764705882354
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
      "target_ip": "100.127.162.124",
      "hops": [
        {
          "hop": 1,
          "host": "100.127.162.124",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.5,
          "avg_ms": 0.5,
          "best_ms": 0.4,
          "worst_ms": 1.4,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1148.1962021641446,
          "retransmits": 1812,
          "duration_sec": 30.00077,
          "bytes_transferred": 4305846272
        },
        {
          "bandwidth_mbps": 1156.228638213038,
          "retransmits": 7484,
          "duration_sec": 30.001844,
          "bytes_transferred": 4336123904
        },
        {
          "bandwidth_mbps": 1178.1774408181338,
          "retransmits": 3086,
          "duration_sec": 30.000955,
          "bytes_transferred": 4418306048
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1160.8674270651054,
        "bandwidth_mbps_min": 1148.1962021641446,
        "bandwidth_mbps_max": 1178.1774408181338,
        "bandwidth_mbps_stddev": 12.671686005090622,
        "retransmits_avg": 4127.333333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1127.8788500988364,
          "retransmits": 240,
          "duration_sec": 30.001048,
          "bytes_transferred": 4229693440
        },
        {
          "bandwidth_mbps": 1139.9006197342117,
          "retransmits": 367,
          "duration_sec": 30.001087,
          "bytes_transferred": 4274782208
        },
        {
          "bandwidth_mbps": 1158.3101307371562,
          "retransmits": 346,
          "duration_sec": 30.001341,
          "bytes_transferred": 4343857152
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1142.0298668567348,
        "bandwidth_mbps_min": 1127.8788500988364,
        "bandwidth_mbps_max": 1158.3101307371562,
        "bandwidth_mbps_stddev": 12.514417826481148,
        "retransmits_avg": 317.6666666666667
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gke",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 33651.426199369766,
      "avg_latency_ms": 0.47511424956166676,
      "p50_latency_ms": 0.5979342060183793,
      "p90_latency_ms": 0.9274470236208195,
      "p99_latency_ms": 1.1654011441792858,
      "p999_latency_ms": 2.140876187761943,
      "status_codes": {
        "200": 3028729
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c4",
    "instance_type": "c4-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 98238.30870434949,
        "tailscale": 33651.426199369766,
        "delta_pct": -65.74510835620701
      },
      "p50_latency": {
        "baseline_ms": 0.5101940892892226,
        "tailscale_ms": 0.5979342060183793,
        "delta_pct": 17.19739968986939
      },
      "p99_latency": {
        "baseline_ms": 0.9963267733561173,
        "tailscale_ms": 1.1654011441792858,
        "delta_pct": 16.969770896915982
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c4/results/c4-standard-2-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 2,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gke",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 1614.8510672110667,
      "avg_latency_ms": 17.34148890960212,
      "p50_latency_ms": 13.676540477541486,
      "p90_latency_ms": 37.4331139896323,
      "p99_latency_ms": 71.92255555338335,
      "p999_latency_ms": 97.09662266165905,
      "status_codes": {
        "200": 144348,
        "502": 1098
      },
      "bytes_per_sec": 0,
      "connection_errors": 1098
    },
    "http_version": "1.1",
    "instance_family": "c4",
    "instance_type": "c4-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 97143.50664353832,
        "tailscale": 1614.8510672110667,
        "delta_pct": -98.33766442760125
      },
      "p50_latency": {
        "baseline_ms": 0.5101412036656517,
        "tailscale_ms": 13.676540477541486,
        "delta_pct": 2580.932333884784
      },
      "p99_latency": {
        "baseline_ms": 0.9966176571133128,
        "tailscale_ms": 71.92255555338335,
        "delta_pct": 7116.664790156927
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c4/results/c4-standard-2-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
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
      "target_ip": "10.0.1.224",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.235",
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
          "host": "10.0.1.29",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 0.4,
          "stdev_ms": 0
        },
        {
          "hop": 3,
          "host": "10.0.1.224",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.4,
          "worst_ms": 0.6,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 19747.43586548867,
          "retransmits": 1469,
          "duration_sec": 30.001398,
          "bytes_transferred": 74056335360
        },
        {
          "bandwidth_mbps": 19743.01018878333,
          "retransmits": 1331,
          "duration_sec": 30.001325,
          "bytes_transferred": 74039558144
        },
        {
          "bandwidth_mbps": 19732.867804621917,
          "retransmits": 1541,
          "duration_sec": 30.001707,
          "bytes_transferred": 74002464768
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 19741.104619631307,
        "bandwidth_mbps_min": 19732.867804621917,
        "bandwidth_mbps_max": 19747.43586548867,
        "bandwidth_mbps_stddev": 6.098114172934508,
        "retransmits_avg": 1447
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4964.274076061398,
          "retransmits": 0,
          "duration_sec": 30.001263,
          "bytes_transferred": 18616811520
        },
        {
          "bandwidth_mbps": 4964.202022873959,
          "retransmits": 0,
          "duration_sec": 30.001276,
          "bytes_transferred": 18616549376
        },
        {
          "bandwidth_mbps": 4964.656882926268,
          "retransmits": 0,
          "duration_sec": 30.001273,
          "bytes_transferred": 18618253312
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4964.377660620542,
        "bandwidth_mbps_min": 4964.202022873959,
        "bandwidth_mbps_max": 4964.656882926268,
        "bandwidth_mbps_stddev": 0.19961919992206237,
        "retransmits_avg": 0
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
      "bandwidth_pct": 95.45800047892011,
      "retransmits_pct": 63.90232665284496
    },
    "overhead_single": {
      "bandwidth_pct": 82.7037143437098,
      "retransmits_pct": 0
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
      "target_ip": "100.124.127.47",
      "hops": [
        {
          "hop": 1,
          "host": "100.124.127.47",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.6,
          "avg_ms": 0.5,
          "best_ms": 0.5,
          "worst_ms": 0.8,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 903.1200869361953,
          "retransmits": 834,
          "duration_sec": 30.001773,
          "bytes_transferred": 3386900480
        },
        {
          "bandwidth_mbps": 895.8118402679829,
          "retransmits": 107,
          "duration_sec": 30.000723,
          "bytes_transferred": 3359375360
        },
        {
          "bandwidth_mbps": 890.990704634423,
          "retransmits": 626,
          "duration_sec": 30.000649,
          "bytes_transferred": 3341287424
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 896.6408772795338,
        "bandwidth_mbps_min": 890.990704634423,
        "bandwidth_mbps_max": 903.1200869361953,
        "bandwidth_mbps_stddev": 4.98637848078997,
        "retransmits_avg": 522.3333333333334
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 865.313862077195,
          "retransmits": 4,
          "duration_sec": 30.00142,
          "bytes_transferred": 3245080576
        },
        {
          "bandwidth_mbps": 844.675601786633,
          "retransmits": 47,
          "duration_sec": 30.000791,
          "bytes_transferred": 3167617024
        },
        {
          "bandwidth_mbps": 865.9693598501304,
          "retransmits": 5,
          "duration_sec": 30.000506,
          "bytes_transferred": 3247439872
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 858.652941237986,
        "bandwidth_mbps_min": 844.675601786633,
        "bandwidth_mbps_max": 865.9693598501304,
        "bandwidth_mbps_stddev": 9.887093706320567,
        "retransmits_avg": 18.666666666666668
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
  },
  {
    "baseline_mtr": {
      "target_ip": "10.244.2.191",
      "hops": [
        {
          "hop": 1,
          "host": "10.224.0.6",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.1,
          "stdev_ms": 0
        },
        {
          "hop": 2,
          "host": "10.224.0.5",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.8,
          "avg_ms": 0.8,
          "best_ms": 0.6,
          "worst_ms": 2.5,
          "stdev_ms": 0.3
        },
        {
          "hop": 3,
          "host": "10.244.2.191",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.8,
          "avg_ms": 0.8,
          "best_ms": 0.6,
          "worst_ms": 2.1,
          "stdev_ms": 0.2
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11858.992735554888,
          "retransmits": 34056,
          "duration_sec": 30.004907,
          "bytes_transferred": 44478496768
        },
        {
          "bandwidth_mbps": 11889.066622722206,
          "retransmits": 53195,
          "duration_sec": 30.001506,
          "bytes_transferred": 44586237952
        },
        {
          "bandwidth_mbps": 11597.67564618461,
          "retransmits": 31716,
          "duration_sec": 30.004506,
          "bytes_transferred": 43497816064
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11781.911668153902,
        "bandwidth_mbps_min": 11597.67564618461,
        "bandwidth_mbps_max": 11889.066622722206,
        "bandwidth_mbps_stddev": 130.8518080772799,
        "retransmits_avg": 39655.666666666664
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11902.045859139324,
          "retransmits": 1937,
          "duration_sec": 30.001915,
          "bytes_transferred": 44635521024
        },
        {
          "bandwidth_mbps": 11902.521802165318,
          "retransmits": 2372,
          "duration_sec": 30.001332,
          "bytes_transferred": 44636438528
        },
        {
          "bandwidth_mbps": 11876.057876245543,
          "retransmits": 2791,
          "duration_sec": 30.001877,
          "bytes_transferred": 44538003456
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11893.541845850063,
        "bandwidth_mbps_min": 11876.057876245543,
        "bandwidth_mbps_max": 11902.521802165318,
        "bandwidth_mbps_stddev": 12.36456025070048,
        "retransmits_avg": 2366.6666666666665
      }
    },
    "cloud_provider": "aks",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "d2psv6",
    "instance_type": "Standard_D2ps_v6",
    "kernel_version": "5.15.0-1102-azure",
    "overhead": {
      "bandwidth_pct": 85.39704736096499,
      "retransmits_pct": 92.59038220683045
    },
    "overhead_single": {
      "bandwidth_pct": 86.05528926310892,
      "retransmits_pct": 72.7605633802817
    },
    "region": "eastus",
    "source": "aks/d2psv6/results/Standard_D2ps_v6-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t16384\t4194304",
      "kernel_full": "Linux tb-aks-server-standard-d2ps-v6 5.15.0-1102-azure #111-Ubuntu SMP Fri Nov 21 22:24:09 UTC 2025 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.107.213.71",
      "hops": [
        {
          "hop": 1,
          "host": "100.107.213.71",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1,
          "avg_ms": 0.8,
          "best_ms": 0.6,
          "worst_ms": 2.8,
          "stdev_ms": 0.2
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1696.1882744637321,
          "retransmits": 2023,
          "duration_sec": 30.001647,
          "bytes_transferred": 6361055232
        },
        {
          "bandwidth_mbps": 1724.0623267477267,
          "retransmits": 3788,
          "duration_sec": 30.008625,
          "bytes_transferred": 6467092480
        },
        {
          "bandwidth_mbps": 1741.2703414089083,
          "retransmits": 3004,
          "duration_sec": 30.002322,
          "bytes_transferred": 6530269184
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1720.5069808734559,
        "bandwidth_mbps_min": 1696.1882744637321,
        "bandwidth_mbps_max": 1741.2703414089083,
        "bandwidth_mbps_stddev": 18.57558528869922,
        "retransmits_avg": 2938.3333333333335
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1673.1012541693094,
          "retransmits": 259,
          "duration_sec": 30.001372,
          "bytes_transferred": 6274416640
        },
        {
          "bandwidth_mbps": 1650.4399740282934,
          "retransmits": 717,
          "duration_sec": 30.000339,
          "bytes_transferred": 6189219840
        },
        {
          "bandwidth_mbps": 1652.0187921270604,
          "retransmits": 958,
          "duration_sec": 30.0015,
          "bytes_transferred": 6195380224
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1658.5200067748876,
        "bandwidth_mbps_min": 1650.4399740282934,
        "bandwidth_mbps_max": 1673.1012541693094,
        "bandwidth_mbps_stddev": 10.33062593554543,
        "retransmits_avg": 644.6666666666666
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
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.244.2.93",
      "hops": [
        {
          "hop": 1,
          "host": "10.224.0.6",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.4,
          "stdev_ms": 0
        },
        {
          "hop": 2,
          "host": "10.224.0.5",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.9,
          "avg_ms": 1.1,
          "best_ms": 0.9,
          "worst_ms": 3.2,
          "stdev_ms": 0.3
        },
        {
          "hop": 3,
          "host": "10.244.2.93",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.8,
          "avg_ms": 1,
          "best_ms": 0.7,
          "worst_ms": 1.9,
          "stdev_ms": 0.2
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4743.644979023415,
          "retransmits": 47735,
          "duration_sec": 30.002261,
          "bytes_transferred": 17790009344
        },
        {
          "bandwidth_mbps": 4665.667554954475,
          "retransmits": 258598,
          "duration_sec": 30.002288,
          "bytes_transferred": 17497587712
        },
        {
          "bandwidth_mbps": 4676.682185728172,
          "retransmits": 227815,
          "duration_sec": 30.002029,
          "bytes_transferred": 17538744320
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4695.331573235354,
        "bandwidth_mbps_min": 4665.667554954475,
        "bandwidth_mbps_max": 4743.644979023415,
        "bandwidth_mbps_stddev": 34.45740759161062,
        "retransmits_avg": 178049.33333333334
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4715.879347071492,
          "retransmits": 116297,
          "duration_sec": 30.001692,
          "bytes_transferred": 17685544960
        },
        {
          "bandwidth_mbps": 4700.764283042599,
          "retransmits": 148599,
          "duration_sec": 30.002466,
          "bytes_transferred": 17629315072
        },
        {
          "bandwidth_mbps": 4709.556591831169,
          "retransmits": 131305,
          "duration_sec": 30.001671,
          "bytes_transferred": 17661820928
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4708.733407315086,
        "bandwidth_mbps_min": 4700.764283042599,
        "bandwidth_mbps_max": 4715.879347071492,
        "bandwidth_mbps_stddev": 6.198091895092525,
        "retransmits_avg": 132067
      }
    },
    "cloud_provider": "aks",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "d2sv4",
    "instance_type": "Standard_D2s_v4",
    "kernel_version": "5.15.0-1102-azure",
    "overhead": {
      "bandwidth_pct": 79.20444561757755,
      "retransmits_pct": 98.8842043778129
    },
    "overhead_single": {
      "bandwidth_pct": 78.35484380868347,
      "retransmits_pct": 99.59742655874166
    },
    "region": "eastus",
    "source": "aks/d2sv4/results/Standard_D2s_v4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t16384\t4194304",
      "kernel_full": "Linux tb-aks-server-standard-d2s-v4 5.15.0-1102-azure #111-Ubuntu SMP Fri Nov 21 22:22:11 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.92.114.43",
      "hops": [
        {
          "hop": 1,
          "host": "100.92.114.43",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.1,
          "avg_ms": 0.9,
          "best_ms": 0.5,
          "worst_ms": 2,
          "stdev_ms": 0.2
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 983.651997365873,
          "retransmits": 1736,
          "duration_sec": 30.001589,
          "bytes_transferred": 3688890368
        },
        {
          "bandwidth_mbps": 983.8560025455411,
          "retransmits": 2383,
          "duration_sec": 30.000697,
          "bytes_transferred": 3689545728
        },
        {
          "bandwidth_mbps": 961.7526923302146,
          "retransmits": 1841,
          "duration_sec": 30.004399,
          "bytes_transferred": 3607101440
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 976.4202307472096,
        "bandwidth_mbps_min": 961.7526923302146,
        "bandwidth_mbps_max": 983.8560025455411,
        "bandwidth_mbps_stddev": 10.371850266911549,
        "retransmits_avg": 1986.6666666666667
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1009.6928132924496,
          "retransmits": 241,
          "duration_sec": 30.001513,
          "bytes_transferred": 3786539008
        },
        {
          "bandwidth_mbps": 1025.3189177499653,
          "retransmits": 984,
          "duration_sec": 30.001422,
          "bytes_transferred": 3845128192
        },
        {
          "bandwidth_mbps": 1022.6263708957374,
          "retransmits": 370,
          "duration_sec": 30.001461,
          "bytes_transferred": 3835035648
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1019.2127006460508,
        "bandwidth_mbps_min": 1009.6928132924496,
        "bandwidth_mbps_max": 1025.3189177499653,
        "bandwidth_mbps_stddev": 6.820735227207038,
        "retransmits_avg": 531.6666666666666
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
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.244.2.28",
      "hops": [
        {
          "hop": 1,
          "host": "10.224.0.5",
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
          "host": "10.224.0.6",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1,
          "avg_ms": 1.4,
          "best_ms": 0.6,
          "worst_ms": 7.6,
          "stdev_ms": 1.4
        },
        {
          "hop": 3,
          "host": "10.244.2.28",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 5.2,
          "avg_ms": 1.6,
          "best_ms": 0.7,
          "worst_ms": 24.6,
          "stdev_ms": 2.6
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11891.963177195339,
          "retransmits": 50457,
          "duration_sec": 30.001517,
          "bytes_transferred": 44597116928
        },
        {
          "bandwidth_mbps": 11880.881882759266,
          "retransmits": 73310,
          "duration_sec": 30.000904,
          "bytes_transferred": 44554649600
        },
        {
          "bandwidth_mbps": 11898.184823050267,
          "retransmits": 31676,
          "duration_sec": 30.002221,
          "bytes_transferred": 44621496320
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11890.343294334956,
        "bandwidth_mbps_min": 11880.881882759266,
        "bandwidth_mbps_max": 11898.184823050267,
        "bandwidth_mbps_stddev": 7.156160564600242,
        "retransmits_avg": 51814.333333333336
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11891.62185237183,
          "retransmits": 37748,
          "duration_sec": 30.00132,
          "bytes_transferred": 44595544064
        },
        {
          "bandwidth_mbps": 11885.91335089632,
          "retransmits": 47055,
          "duration_sec": 30.001349,
          "bytes_transferred": 44574179328
        },
        {
          "bandwidth_mbps": 11877.396289145849,
          "retransmits": 63804,
          "duration_sec": 30.001233,
          "bytes_transferred": 44542066688
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11884.977164138,
        "bandwidth_mbps_min": 11877.396289145849,
        "bandwidth_mbps_max": 11891.62185237183,
        "bandwidth_mbps_stddev": 5.845168746292085,
        "retransmits_avg": 49535.666666666664
      }
    },
    "cloud_provider": "aks",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "d4psv6",
    "instance_type": "Standard_D4ps_v6",
    "kernel_version": "",
    "overhead": {
      "bandwidth_pct": 81.81002233852479,
      "retransmits_pct": 96.05964887450706
    },
    "overhead_single": {
      "bandwidth_pct": 81.62845843159384,
      "retransmits_pct": 98.8782493422248
    },
    "region": "eastus",
    "source": "aks/d4psv6/results/Standard_D4ps_v6-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 0,
      "mtu_tailscale": 0,
      "tcp_rmem": "",
      "tcp_wmem": "",
      "kernel_full": ""
    },
    "tailscale_mtr": null,
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2188.987634769836,
          "retransmits": 1371,
          "duration_sec": 30.001706,
          "bytes_transferred": 8209170432
        },
        {
          "bandwidth_mbps": 2143.036125166659,
          "retransmits": 1953,
          "duration_sec": 30.000609,
          "bytes_transferred": 8036548608
        },
        {
          "bandwidth_mbps": 2156.52860740024,
          "retransmits": 2801,
          "duration_sec": 30.000594,
          "bytes_transferred": 8087142400
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2162.850789112245,
        "bandwidth_mbps_min": 2143.036125166659,
        "bandwidth_mbps_max": 2188.987634769836,
        "bandwidth_mbps_stddev": 19.28493012522854,
        "retransmits_avg": 2041.6666666666667
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2179.22086354709,
          "retransmits": 663,
          "duration_sec": 30.000958,
          "bytes_transferred": 8172339200
        },
        {
          "bandwidth_mbps": 2199.7739338588117,
          "retransmits": 28,
          "duration_sec": 30.000459,
          "bytes_transferred": 8249278464
        },
        {
          "bandwidth_mbps": 2171.365762909675,
          "retransmits": 976,
          "duration_sec": 30.001317,
          "bytes_transferred": 8142979072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2183.453520105192,
        "bandwidth_mbps_min": 2171.365762909675,
        "bandwidth_mbps_max": 2199.7739338588117,
        "bandwidth_mbps_stddev": 11.977550676800199,
        "retransmits_avg": 555.6666666666666
      }
    },
    "tailscale_version": "",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "transport_mode": "l4-kernel",
    "vcpus": 4,
    "zone": "eastus"
  }
];
