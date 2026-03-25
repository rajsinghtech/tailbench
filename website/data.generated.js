const TAILBENCH_DATA = [
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.209",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.209",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.6,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 29693.61182265327,
          "retransmits": 0,
          "duration_sec": 30.001658,
          "bytes_transferred": 111357198336
        },
        {
          "bandwidth_mbps": 30085.301210666345,
          "retransmits": 0,
          "duration_sec": 30.00166,
          "bytes_transferred": 112826122240
        },
        {
          "bandwidth_mbps": 30591.32783255971,
          "retransmits": 0,
          "duration_sec": 30.001477,
          "bytes_transferred": 114723127296
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 30123.413621959775,
        "bandwidth_mbps_min": 29693.61182265327,
        "bandwidth_mbps_max": 30591.32783255971,
        "bandwidth_mbps_stddev": 367.48054418479893,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 14786.234630245399,
          "retransmits": 0,
          "duration_sec": 30.00152,
          "bytes_transferred": 55451189248
        },
        {
          "bandwidth_mbps": 15290.745674213862,
          "retransmits": 0,
          "duration_sec": 30.001252,
          "bytes_transferred": 57342689280
        },
        {
          "bandwidth_mbps": 15313.728651092424,
          "retransmits": 0,
          "duration_sec": 30.001418,
          "bytes_transferred": 57429196800
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 15130.236318517229,
        "bandwidth_mbps_min": 14786.234630245399,
        "bandwidth_mbps_max": 15313.728651092424,
        "bandwidth_mbps_stddev": 243.4268205668825,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c2",
    "instance_type": "c2-standard-16",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 84.76572914059966,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 69.95382882140406,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-16-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c2-standard-16-server-2df406d 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.106.35.68",
      "hops": [
        {
          "hop": 1,
          "host": "100.106.35.68",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.6,
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
          "bandwidth_mbps": 4593.9130631583575,
          "retransmits": 959,
          "duration_sec": 30.001619,
          "bytes_transferred": 17228103680
        },
        {
          "bandwidth_mbps": 4514.334652718917,
          "retransmits": 790,
          "duration_sec": 30.001591,
          "bytes_transferred": 16929652736
        },
        {
          "bandwidth_mbps": 4658.9995539232705,
          "retransmits": 772,
          "duration_sec": 30.001565,
          "bytes_transferred": 17472159744
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4589.082423266848,
        "bandwidth_mbps_min": 4514.334652718917,
        "bandwidth_mbps_max": 4658.9995539232705,
        "bandwidth_mbps_stddev": 59.15789449395814,
        "retransmits_avg": 840.3333333333334
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4364.214607332632,
          "retransmits": 177,
          "duration_sec": 30.001398,
          "bytes_transferred": 16366567424
        },
        {
          "bandwidth_mbps": 4611.471211548594,
          "retransmits": 246,
          "duration_sec": 30.000398,
          "bytes_transferred": 17293246464
        },
        {
          "bandwidth_mbps": 4662.484293082114,
          "retransmits": 191,
          "duration_sec": 30.000507,
          "bytes_transferred": 17484611584
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4546.05670398778,
        "bandwidth_mbps_min": 4364.214607332632,
        "bandwidth_mbps_max": 4662.484293082114,
        "bandwidth_mbps_stddev": 130.25742386735968,
        "retransmits_avg": 204.66666666666666
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
    "vcpus": 16,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 22329.218043555058,
      "avg_latency_ms": 0.7161775156974755,
      "p50_latency_ms": 0.6921804297476605,
      "p90_latency_ms": 1.009964708777954,
      "p99_latency_ms": 1.9336415657847674,
      "p999_latency_ms": 2.768987032673115,
      "status_codes": {
        "200": 2009688
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c2",
    "instance_type": "c2-standard-16",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 114132.84282748296,
        "tailscale": 22329.218043555058,
        "delta_pct": -80.43576459643023
      },
      "p50_latency": {
        "baseline_ms": 0.5284796143197233,
        "tailscale_ms": 0.6921804297476605,
        "delta_pct": 30.97580511949516
      },
      "p99_latency": {
        "baseline_ms": 0.990571392933465,
        "tailscale_ms": 1.9336415657847674,
        "delta_pct": 95.20466465910215
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-16-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 16,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 22135.464722209643,
      "avg_latency_ms": 0.7223655323726992,
      "p50_latency_ms": 0.7040179262364966,
      "p90_latency_ms": 0.9864992513030454,
      "p99_latency_ms": 1.9029846056291333,
      "p999_latency_ms": 2.5966889484618494,
      "status_codes": {
        "200": 1992245
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c2",
    "instance_type": "c2-standard-16",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 45534.73121266206,
        "tailscale": 22135.464722209643,
        "delta_pct": -51.387733862247266
      },
      "p50_latency": {
        "baseline_ms": 0.5492254071638664,
        "tailscale_ms": 0.7040179262364966,
        "delta_pct": 28.183787030530894
      },
      "p99_latency": {
        "baseline_ms": 1.1702363224798848,
        "tailscale_ms": 1.9029846056291333,
        "delta_pct": 62.615411013431746
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-16-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 16,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.212",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.212",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.6,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 28195.7307601735,
          "retransmits": 0,
          "duration_sec": 30.001401,
          "bytes_transferred": 105738928128
        },
        {
          "bandwidth_mbps": 27617.326368129987,
          "retransmits": 0,
          "duration_sec": 30.001517,
          "bytes_transferred": 103570210816
        },
        {
          "bandwidth_mbps": 29731.793382320026,
          "retransmits": 0,
          "duration_sec": 30.000937,
          "bytes_transferred": 111497707520
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 28514.950170207838,
        "bandwidth_mbps_min": 27617.326368129987,
        "bandwidth_mbps_max": 29731.793382320026,
        "bandwidth_mbps_stddev": 892.2512584586013,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 15112.425175219376,
          "retransmits": 0,
          "duration_sec": 30.001391,
          "bytes_transferred": 56674222080
        },
        {
          "bandwidth_mbps": 15690.747378779139,
          "retransmits": 0,
          "duration_sec": 30.001478,
          "bytes_transferred": 58843201536
        },
        {
          "bandwidth_mbps": 15808.962615681052,
          "retransmits": 0,
          "duration_sec": 30.001456,
          "bytes_transferred": 59286487040
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 15537.378389893187,
        "bandwidth_mbps_min": 15112.425175219376,
        "bandwidth_mbps_max": 15808.962615681052,
        "bandwidth_mbps_stddev": 304.33822911923687,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c2",
    "instance_type": "c2-standard-30",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 82.99517516659645,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 70.70188847075956,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-30-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c2-standard-30-server-a080f3e 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.72.237.91",
      "hops": [
        {
          "hop": 1,
          "host": "100.72.237.91",
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
          "bandwidth_mbps": 4877.323479743102,
          "retransmits": 753,
          "duration_sec": 30.000571,
          "bytes_transferred": 18290311168
        },
        {
          "bandwidth_mbps": 4814.828756759632,
          "retransmits": 539,
          "duration_sec": 30.001447,
          "bytes_transferred": 18056478720
        },
        {
          "bandwidth_mbps": 4854.599746825705,
          "retransmits": 657,
          "duration_sec": 30.001466,
          "bytes_transferred": 18205638656
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4848.9173277761465,
        "bandwidth_mbps_min": 4814.828756759632,
        "bandwidth_mbps_max": 4877.323479743102,
        "bandwidth_mbps_stddev": 25.827827562356998,
        "retransmits_avg": 649.6666666666666
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4547.265926936209,
          "retransmits": 258,
          "duration_sec": 30.000387,
          "bytes_transferred": 17052467200
        },
        {
          "bandwidth_mbps": 4569.424314462503,
          "retransmits": 361,
          "duration_sec": 30.001313,
          "bytes_transferred": 17136091136
        },
        {
          "bandwidth_mbps": 4539.78510677431,
          "retransmits": 354,
          "duration_sec": 30.001318,
          "bytes_transferred": 17024942080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4552.158449391008,
        "bandwidth_mbps_min": 4539.78510677431,
        "bandwidth_mbps_max": 4569.424314462503,
        "bandwidth_mbps_stddev": 12.584997419520045,
        "retransmits_avg": 324.3333333333333
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
    "vcpus": 30,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 25129.031105170143,
      "avg_latency_ms": 0.6364208680974413,
      "p50_latency_ms": 0.6702901641773021,
      "p90_latency_ms": 1.1199945697202849,
      "p99_latency_ms": 2.4454373255146673,
      "p999_latency_ms": 3.5060979643538825,
      "status_codes": {
        "200": 2261663
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c2",
    "instance_type": "c2-standard-30",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 151793.9475177231,
        "tailscale": 25129.031105170143,
        "delta_pct": -83.44530100435253
      },
      "p50_latency": {
        "baseline_ms": 0.5199942312918127,
        "tailscale_ms": 0.6702901641773021,
        "delta_pct": 28.903384661039777
      },
      "p99_latency": {
        "baseline_ms": 0.9904064245585845,
        "tailscale_ms": 2.4454373255146673,
        "delta_pct": 146.91250630816307
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-30-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 30,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 25976.030566451107,
      "avg_latency_ms": 0.615577186659168,
      "p50_latency_ms": 0.6699635976075106,
      "p90_latency_ms": 0.969776045133688,
      "p99_latency_ms": 1.9060215194708434,
      "p999_latency_ms": 2.8458052267272187,
      "status_codes": {
        "200": 2337886
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c2",
    "instance_type": "c2-standard-30",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 55288.52489620694,
        "tailscale": 25976.030566451107,
        "delta_pct": -53.017320293468
      },
      "p50_latency": {
        "baseline_ms": 0.539646678954223,
        "tailscale_ms": 0.6699635976075106,
        "delta_pct": 24.148563075719775
      },
      "p99_latency": {
        "baseline_ms": 0.9929230442610354,
        "tailscale_ms": 1.9060215194708434,
        "delta_pct": 91.96064896342139
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-30-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 30,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.35",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.35",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.6,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9549.82290093231,
          "retransmits": 0,
          "duration_sec": 30.0007,
          "bytes_transferred": 35812671488
        },
        {
          "bandwidth_mbps": 9730.153696746549,
          "retransmits": 0,
          "duration_sec": 30.001624,
          "bytes_transferred": 36490051584
        },
        {
          "bandwidth_mbps": 9699.792282412316,
          "retransmits": 0,
          "duration_sec": 30.000618,
          "bytes_transferred": 36374970368
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9659.922960030392,
        "bandwidth_mbps_min": 9549.82290093231,
        "bandwidth_mbps_max": 9730.153696746549,
        "bandwidth_mbps_stddev": 78.83303508109026,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9511.881717598699,
          "retransmits": 0,
          "duration_sec": 30.00142,
          "bytes_transferred": 35671244800
        },
        {
          "bandwidth_mbps": 9119.256005398951,
          "retransmits": 0,
          "duration_sec": 30.001379,
          "bytes_transferred": 34198781952
        },
        {
          "bandwidth_mbps": 9691.290393962256,
          "retransmits": 0,
          "duration_sec": 30.001402,
          "bytes_transferred": 36344037376
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9440.809372319969,
        "bandwidth_mbps_min": 9119.256005398951,
        "bandwidth_mbps_max": 9691.290393962256,
        "bandwidth_mbps_stddev": 238.8783429869868,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c2",
    "instance_type": "c2-standard-4",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 65.74459546532282,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 66.81486812047493,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c2-standard-4-server-60bf4bb 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.105.199.86",
      "hops": [
        {
          "hop": 1,
          "host": "100.105.199.86",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.6,
          "avg_ms": 0.6,
          "best_ms": 0.5,
          "worst_ms": 0.8,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3323.09528824208,
          "retransmits": 3493,
          "duration_sec": 30.001414,
          "bytes_transferred": 12462194688
        },
        {
          "bandwidth_mbps": 3325.6058335653724,
          "retransmits": 1931,
          "duration_sec": 30.002098,
          "bytes_transferred": 12471894016
        },
        {
          "bandwidth_mbps": 3278.435941282267,
          "retransmits": 7440,
          "duration_sec": 30.001022,
          "bytes_transferred": 12294553600
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3309.045687696573,
        "bandwidth_mbps_min": 3278.435941282267,
        "bandwidth_mbps_max": 3325.6058335653724,
        "bandwidth_mbps_stddev": 21.66861234006736,
        "retransmits_avg": 4288
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3110.560194753565,
          "retransmits": 3626,
          "duration_sec": 30.001402,
          "bytes_transferred": 11665145856
        },
        {
          "bandwidth_mbps": 3121.552673407057,
          "retransmits": 647,
          "duration_sec": 30.00123,
          "bytes_transferred": 11706302464
        },
        {
          "bandwidth_mbps": 3166.7222539362147,
          "retransmits": 1063,
          "duration_sec": 30.000778,
          "bytes_transferred": 11875516416
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3132.9450406989454,
        "bandwidth_mbps_min": 3110.560194753565,
        "bandwidth_mbps_max": 3166.7222539362147,
        "bandwidth_mbps_stddev": 24.302040343612152,
        "retransmits_avg": 1778.6666666666667
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 9062.223313064556,
      "avg_latency_ms": 1.7649828376098478,
      "p50_latency_ms": 1.663066166285568,
      "p90_latency_ms": 2.80194077512961,
      "p99_latency_ms": 4.36796691316233,
      "p999_latency_ms": 6.463915611677842,
      "status_codes": {
        "200": 815629
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c2",
    "instance_type": "c2-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 87737.01338569843,
        "tailscale": 9062.223313064556,
        "delta_pct": -89.67115136091269
      },
      "p50_latency": {
        "baseline_ms": 0.5289297632930618,
        "tailscale_ms": 1.663066166285568,
        "delta_pct": 214.42098397554537
      },
      "p99_latency": {
        "baseline_ms": 0.9930471040007368,
        "tailscale_ms": 4.36796691316233,
        "delta_pct": 339.85495708762363
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-4-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 7796.694541989805,
      "avg_latency_ms": 2.051502126898199,
      "p50_latency_ms": 1.9461559987668189,
      "p90_latency_ms": 2.9818040207058303,
      "p99_latency_ms": 4.845359664600378,
      "p999_latency_ms": 6.83341922616064,
      "status_codes": {
        "200": 701737
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c2",
    "instance_type": "c2-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 32545.041680500566,
        "tailscale": 7796.694541989805,
        "delta_pct": -76.04337207943657
      },
      "p50_latency": {
        "baseline_ms": 0.6313943824495939,
        "tailscale_ms": 1.9461559987668189,
        "delta_pct": 208.23144026343732
      },
      "p99_latency": {
        "baseline_ms": 1.9672761591575005,
        "tailscale_ms": 4.845359664600378,
        "delta_pct": 146.29788970123218
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-4-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.225",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.225",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 16158.552351655246,
          "retransmits": 0,
          "duration_sec": 30.000656,
          "bytes_transferred": 60595896320
        },
        {
          "bandwidth_mbps": 16569.459551881137,
          "retransmits": 0,
          "duration_sec": 30.000567,
          "bytes_transferred": 62136647680
        },
        {
          "bandwidth_mbps": 16280.248984872536,
          "retransmits": 0,
          "duration_sec": 30.000666,
          "bytes_transferred": 61052289024
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 16336.086962802974,
        "bandwidth_mbps_min": 16158.552351655246,
        "bandwidth_mbps_max": 16569.459551881137,
        "bandwidth_mbps_stddev": 172.33608953416194,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 12485.133018157645,
          "retransmits": 0,
          "duration_sec": 30.001468,
          "bytes_transferred": 46821539840
        },
        {
          "bandwidth_mbps": 12969.271948361182,
          "retransmits": 0,
          "duration_sec": 30.001306,
          "bytes_transferred": 48636887040
        },
        {
          "bandwidth_mbps": 13419.443278790619,
          "retransmits": 0,
          "duration_sec": 30.001379,
          "bytes_transferred": 50325225472
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12957.949415103149,
        "bandwidth_mbps_min": 12485.133018157645,
        "bandwidth_mbps_max": 13419.443278790619,
        "bandwidth_mbps_stddev": 381.5145830332469,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c2",
    "instance_type": "c2-standard-8",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 80.1690008058758,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 74.7519278415911,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-8-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c2-standard-8-server-9179a5b 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.117.83.23",
      "hops": [
        {
          "hop": 1,
          "host": "100.117.83.23",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.7,
          "avg_ms": 0.6,
          "best_ms": 0.5,
          "worst_ms": 0.8,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3221.1989558445885,
          "retransmits": 1777,
          "duration_sec": 30.000898,
          "bytes_transferred": 12079857664
        },
        {
          "bandwidth_mbps": 3246.9463029927483,
          "retransmits": 2414,
          "duration_sec": 30.000685,
          "bytes_transferred": 12176326656
        },
        {
          "bandwidth_mbps": 3250.682562997326,
          "retransmits": 1856,
          "duration_sec": 30.000718,
          "bytes_transferred": 12190351360
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3239.6092739448873,
        "bandwidth_mbps_min": 3221.1989558445885,
        "bandwidth_mbps_max": 3250.682562997326,
        "bandwidth_mbps_stddev": 13.107116873950641,
        "retransmits_avg": 2015.6666666666667
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3274.0785914670073,
          "retransmits": 758,
          "duration_sec": 30.000916,
          "bytes_transferred": 12278169600
        },
        {
          "bandwidth_mbps": 3219.7814351181923,
          "retransmits": 1342,
          "duration_sec": 30.000428,
          "bytes_transferred": 12074352640
        },
        {
          "bandwidth_mbps": 3321.037229140902,
          "retransmits": 2351,
          "duration_sec": 30.000746,
          "bytes_transferred": 12454199296
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3271.6324185753674,
        "bandwidth_mbps_min": 3219.7814351181923,
        "bandwidth_mbps_max": 3321.037229140902,
        "bandwidth_mbps_stddev": 41.37367743831178,
        "retransmits_avg": 1483.6666666666667
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
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 15965.592213599826,
      "avg_latency_ms": 1.0016929692158971,
      "p50_latency_ms": 0.9204296878329783,
      "p90_latency_ms": 1.807875578421669,
      "p99_latency_ms": 2.5769866097878906,
      "p999_latency_ms": 3.7447427135678493,
      "status_codes": {
        "200": 478981
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c2",
    "instance_type": "c2-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 97286.12103931121,
        "tailscale": 15965.592213599826,
        "delta_pct": -83.5890340337976
      },
      "p50_latency": {
        "baseline_ms": 0.5305727180314505,
        "tailscale_ms": 0.9204296878329783,
        "delta_pct": 73.47851793963113
      },
      "p99_latency": {
        "baseline_ms": 0.9906216703301327,
        "tailscale_ms": 2.5769866097878906,
        "delta_pct": 160.13832394046952
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-8-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 13960.327920642101,
      "avg_latency_ms": 1.1455707070155758,
      "p50_latency_ms": 1.1738927589665142,
      "p90_latency_ms": 1.8830975636864853,
      "p99_latency_ms": 2.831877947277002,
      "p999_latency_ms": 3.971710344222805,
      "status_codes": {
        "200": 1256471
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c2",
    "instance_type": "c2-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 41691.34299050586,
        "tailscale": 13960.327920642101,
        "delta_pct": -66.51504384538246
      },
      "p50_latency": {
        "baseline_ms": 0.5683997162495761,
        "tailscale_ms": 1.1738927589665142,
        "delta_pct": 106.52592276296544
      },
      "p99_latency": {
        "baseline_ms": 1.8126739815630721,
        "tailscale_ms": 2.831877947277002,
        "delta_pct": 56.22654575949
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c2/results/c2-standard-8-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.193",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.193",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 1.2,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 20906.935451937232,
          "retransmits": 132,
          "duration_sec": 30.001644,
          "bytes_transferred": 78405304320
        },
        {
          "bandwidth_mbps": 21328.77572641687,
          "retransmits": 20358,
          "duration_sec": 30.00068,
          "bytes_transferred": 79984721920
        },
        {
          "bandwidth_mbps": 21216.79884680844,
          "retransmits": 0,
          "duration_sec": 30.001607,
          "bytes_transferred": 79567257600
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21150.83667505418,
        "bandwidth_mbps_min": 20906.935451937232,
        "bandwidth_mbps_max": 21328.77572641687,
        "bandwidth_mbps_stddev": 178.42002946262824,
        "retransmits_avg": 6830
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 21477.55524632682,
          "retransmits": 0,
          "duration_sec": 30.001524,
          "bytes_transferred": 80544923648
        },
        {
          "bandwidth_mbps": 21040.726177822435,
          "retransmits": 0,
          "duration_sec": 30.001445,
          "bytes_transferred": 78906523648
        },
        {
          "bandwidth_mbps": 21132.7931578402,
          "retransmits": 0,
          "duration_sec": 30.001287,
          "bytes_transferred": 79251374080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21217.024860663154,
        "bandwidth_mbps_min": 21040.726177822435,
        "bandwidth_mbps_max": 21477.55524632682,
        "bandwidth_mbps_stddev": 188.01798423367774,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c3",
    "instance_type": "c3-standard-4",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 76.22256895062597,
      "retransmits_pct": 78.64812103465106
    },
    "overhead_single": {
      "bandwidth_pct": 77.07008938207423,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c3/results/c3-standard-4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c3-standard-4-server-8651b37 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.81.39.17",
      "hops": [
        {
          "hop": 1,
          "host": "100.81.39.17",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.7,
          "avg_ms": 0.6,
          "best_ms": 0.5,
          "worst_ms": 1,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5032.370027991607,
          "retransmits": 108,
          "duration_sec": 30.000779,
          "bytes_transferred": 18871877632
        },
        {
          "bandwidth_mbps": 5042.817483476095,
          "retransmits": 3696,
          "duration_sec": 30.001837,
          "bytes_transferred": 18911723520
        },
        {
          "bandwidth_mbps": 5012.189308862466,
          "retransmits": 571,
          "duration_sec": 30.001279,
          "bytes_transferred": 18796511232
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5029.125606776723,
        "bandwidth_mbps_min": 5012.189308862466,
        "bandwidth_mbps_max": 5042.817483476095,
        "bandwidth_mbps_stddev": 12.712617663970263,
        "retransmits_avg": 1458.3333333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4855.569799751697,
          "retransmits": 1594,
          "duration_sec": 30.001303,
          "bytes_transferred": 18209177600
        },
        {
          "bandwidth_mbps": 4860.91582303259,
          "retransmits": 2302,
          "duration_sec": 30.000665,
          "bytes_transferred": 18228838400
        },
        {
          "bandwidth_mbps": 4878.648886215164,
          "retransmits": 485,
          "duration_sec": 30.000588,
          "bytes_transferred": 18295291904
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4865.04483633315,
        "bandwidth_mbps_min": 4855.569799751697,
        "bandwidth_mbps_max": 4878.648886215164,
        "bandwidth_mbps_stddev": 9.863995847667136,
        "retransmits_avg": 1460.3333333333333
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 11426.463377351423,
      "avg_latency_ms": 1.3998191639244764,
      "p50_latency_ms": 1.405395022971452,
      "p90_latency_ms": 2.0888381672629897,
      "p99_latency_ms": 3.6627479265800322,
      "p999_latency_ms": 5.516933401078158,
      "status_codes": {
        "200": 1028431
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c3",
    "instance_type": "c3-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 122126.19419601462,
        "tailscale": 11426.463377351423,
        "delta_pct": -90.64372434384408
      },
      "p50_latency": {
        "baseline_ms": 0.5244232559647876,
        "tailscale_ms": 1.405395022971452,
        "delta_pct": 167.98869176500008
      },
      "p99_latency": {
        "baseline_ms": 0.9918592619847088,
        "tailscale_ms": 3.6627479265800322,
        "delta_pct": 269.28101263589343
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c3/results/c3-standard-4-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 9673.724752850465,
      "avg_latency_ms": 1.6534410459759614,
      "p50_latency_ms": 1.5778558828533698,
      "p90_latency_ms": 2.6421235821292517,
      "p99_latency_ms": 3.989451695910494,
      "p999_latency_ms": 5.880841306172116,
      "status_codes": {
        "200": 870687
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c3",
    "instance_type": "c3-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 39825.59259620612,
        "tailscale": 9673.724752850465,
        "delta_pct": -75.70977825507107
      },
      "p50_latency": {
        "baseline_ms": 0.5934234045257668,
        "tailscale_ms": 1.5778558828533698,
        "delta_pct": 165.89040317921237
      },
      "p99_latency": {
        "baseline_ms": 1.928301376522399,
        "tailscale_ms": 3.989451695910494,
        "delta_pct": 106.88942841005915
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c3/results/c3-standard-4-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.210",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.210",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
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
          "bandwidth_mbps": 20785.58524844864,
          "retransmits": 360,
          "duration_sec": 30.000587,
          "bytes_transferred": 77947469824
        },
        {
          "bandwidth_mbps": 21411.06744851731,
          "retransmits": 0,
          "duration_sec": 30.001638,
          "bytes_transferred": 80295886848
        },
        {
          "bandwidth_mbps": 21318.254541755236,
          "retransmits": 0,
          "duration_sec": 30.000681,
          "bytes_transferred": 79945269248
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21171.635746240394,
        "bandwidth_mbps_min": 20785.58524844864,
        "bandwidth_mbps_max": 21411.06744851731,
        "bandwidth_mbps_stddev": 275.5960800995468,
        "retransmits_avg": 120
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 21492.613163433038,
          "retransmits": 0,
          "duration_sec": 30.000654,
          "bytes_transferred": 80599056384
        },
        {
          "bandwidth_mbps": 21031.47511752018,
          "retransmits": 450,
          "duration_sec": 30.00123,
          "bytes_transferred": 78871265280
        },
        {
          "bandwidth_mbps": 21074.451983690866,
          "retransmits": 0,
          "duration_sec": 30.001348,
          "bytes_transferred": 79032745984
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21199.51342154803,
        "bandwidth_mbps_min": 21031.47511752018,
        "bandwidth_mbps_max": 21492.613163433038,
        "bandwidth_mbps_stddev": 207.9941453923764,
        "retransmits_avg": 150
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c3",
    "instance_type": "c3-standard-8",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 74.08349498044421,
      "retransmits_pct": -282.22222222222223
    },
    "overhead_single": {
      "bandwidth_pct": 75.03335522652975,
      "retransmits_pct": -401.33333333333337
    },
    "region": "us-central1",
    "source": "gcp/c3/results/c3-standard-8-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c3-standard-8-server-0aac9f3 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.114.130.107",
      "hops": [
        {
          "hop": 1,
          "host": "100.114.130.107",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.7,
          "avg_ms": 0.6,
          "best_ms": 0.4,
          "worst_ms": 0.8,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5480.217326784554,
          "retransmits": 1030,
          "duration_sec": 30.000904,
          "bytes_transferred": 20551434240
        },
        {
          "bandwidth_mbps": 5484.9328513925575,
          "retransmits": 4,
          "duration_sec": 30.00092,
          "bytes_transferred": 20569128960
        },
        {
          "bandwidth_mbps": 5495.693944512267,
          "retransmits": 342,
          "duration_sec": 30.001514,
          "bytes_transferred": 20609892352
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5486.948040896459,
        "bandwidth_mbps_min": 5480.217326784554,
        "bandwidth_mbps_max": 5495.693944512267,
        "bandwidth_mbps_stddev": 6.4769934190137,
        "retransmits_avg": 458.6666666666667
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5285.131553302463,
          "retransmits": 399,
          "duration_sec": 30.000828,
          "bytes_transferred": 19819790336
        },
        {
          "bandwidth_mbps": 5266.433397352525,
          "retransmits": 830,
          "duration_sec": 30.00142,
          "bytes_transferred": 19750060032
        },
        {
          "bandwidth_mbps": 5326.85667833115,
          "retransmits": 1027,
          "duration_sec": 30.000474,
          "bytes_transferred": 19976028160
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5292.807209662046,
        "bandwidth_mbps_min": 5266.433397352525,
        "bandwidth_mbps_max": 5326.85667833115,
        "bandwidth_mbps_stddev": 25.25773804161488,
        "retransmits_avg": 752
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
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 19266.64181049941,
      "avg_latency_ms": 0.8301253348594145,
      "p50_latency_ms": 0.7194429349356174,
      "p90_latency_ms": 1.5684520384239604,
      "p99_latency_ms": 2.0588864205636477,
      "p999_latency_ms": 3.018038337530612,
      "status_codes": {
        "200": 1734043
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c3",
    "instance_type": "c3-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 133583.7098138981,
        "tailscale": 19266.64181049941,
        "delta_pct": -85.57710229986823
      },
      "p50_latency": {
        "baseline_ms": 0.5249943215479568,
        "tailscale_ms": 0.7194429349356174,
        "delta_pct": 37.03823173064516
      },
      "p99_latency": {
        "baseline_ms": 0.9910057759021544,
        "tailscale_ms": 2.0588864205636477,
        "delta_pct": 107.75725738725956
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c3/results/c3-standard-8-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 16909.959776120395,
      "avg_latency_ms": 0.9457455367634328,
      "p50_latency_ms": 0.8426977421221841,
      "p90_latency_ms": 1.7537389034890605,
      "p99_latency_ms": 2.4399513396655483,
      "p999_latency_ms": 3.605836441756035,
      "status_codes": {
        "200": 1521933
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c3",
    "instance_type": "c3-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 50322.86127029449,
        "tailscale": 16909.959776120395,
        "delta_pct": -66.39706219148886
      },
      "p50_latency": {
        "baseline_ms": 0.5471544802825422,
        "tailscale_ms": 0.8426977421221841,
        "delta_pct": 54.01459231166815
      },
      "p99_latency": {
        "baseline_ms": 1.5853116765621709,
        "tailscale_ms": 2.4399513396655483,
        "delta_pct": 53.90988256370552
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c3/results/c3-standard-8-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.231",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.231",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.7,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 18494.97547627324,
          "retransmits": 22245,
          "duration_sec": 30.001843,
          "bytes_transferred": 69360418816
        },
        {
          "bandwidth_mbps": 18542.746134306555,
          "retransmits": 10229,
          "duration_sec": 30.001797,
          "bytes_transferred": 69539463168
        },
        {
          "bandwidth_mbps": 18607.041700017486,
          "retransmits": 1,
          "duration_sec": 30.001762,
          "bytes_transferred": 69780504576
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18548.25443686576,
        "bandwidth_mbps_min": 18494.97547627324,
        "bandwidth_mbps_max": 18607.041700017486,
        "bandwidth_mbps_stddev": 45.91634185404724,
        "retransmits_avg": 10825
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 10829.010284750979,
          "retransmits": 0,
          "duration_sec": 30.001407,
          "bytes_transferred": 40610693120
        },
        {
          "bandwidth_mbps": 11682.011387223187,
          "retransmits": 0,
          "duration_sec": 30.001344,
          "bytes_transferred": 43809505280
        },
        {
          "bandwidth_mbps": 12354.043693004458,
          "retransmits": 0,
          "duration_sec": 30.000592,
          "bytes_transferred": 46328578048
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11621.688454992875,
        "bandwidth_mbps_min": 10829.010284750979,
        "bandwidth_mbps_max": 12354.043693004458,
        "bandwidth_mbps_stddev": 624.0517426127168,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-4",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 77.1046211997912,
      "retransmits_pct": 53.53964588144727
    },
    "overhead_single": {
      "bandwidth_pct": 62.94616493280615,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c3d/results/c3d-standard-4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c3d-standard-4-server-e5e62a2 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.82.10.87",
      "hops": [
        {
          "hop": 1,
          "host": "100.82.10.87",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.7,
          "avg_ms": 0.7,
          "best_ms": 0.4,
          "worst_ms": 0.9,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4466.88346452856,
          "retransmits": 43,
          "duration_sec": 30.001981,
          "bytes_transferred": 16751919104
        },
        {
          "bandwidth_mbps": 4159.332223379345,
          "retransmits": 14811,
          "duration_sec": 30.000643,
          "bytes_transferred": 15597830144
        },
        {
          "bandwidth_mbps": 4113.86365453296,
          "retransmits": 234,
          "duration_sec": 30.000616,
          "bytes_transferred": 15427305472
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4246.693114146955,
        "bandwidth_mbps_min": 4113.86365453296,
        "bandwidth_mbps_max": 4466.88346452856,
        "bandwidth_mbps_stddev": 156.80070256882357,
        "retransmits_avg": 5029.333333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4247.878903857654,
          "retransmits": 0,
          "duration_sec": 30.001286,
          "bytes_transferred": 15930228736
        },
        {
          "bandwidth_mbps": 4332.364653267636,
          "retransmits": 0,
          "duration_sec": 30.001223,
          "bytes_transferred": 16247029760
        },
        {
          "bandwidth_mbps": 4338.600259283218,
          "retransmits": 0,
          "duration_sec": 30.000399,
          "bytes_transferred": 16269967360
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4306.28127213617,
        "bandwidth_mbps_min": 4247.878903857654,
        "bandwidth_mbps_max": 4338.600259283218,
        "bandwidth_mbps_stddev": 41.37509847722323,
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 9857.393114995037,
      "avg_latency_ms": 1.622725720139739,
      "p50_latency_ms": 1.5605744603105338,
      "p90_latency_ms": 2.6469110296525544,
      "p99_latency_ms": 3.9066431565990762,
      "p999_latency_ms": 5.785005187303395,
      "status_codes": {
        "200": 887197
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 85117.25597318835,
        "tailscale": 9857.393114995037,
        "delta_pct": -88.419042646182
      },
      "p50_latency": {
        "baseline_ms": 0.5338342604298991,
        "tailscale_ms": 1.5605744603105338,
        "delta_pct": 192.3331408242319
      },
      "p99_latency": {
        "baseline_ms": 0.9932497288166271,
        "tailscale_ms": 3.9066431565990762,
        "delta_pct": 293.3193277841123
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c3d/results/c3d-standard-4-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 8939.067475175676,
      "avg_latency_ms": 1.7893726238624872,
      "p50_latency_ms": 1.6899986757381873,
      "p90_latency_ms": 2.8060597512457366,
      "p99_latency_ms": 4.188956626528644,
      "p999_latency_ms": 5.960910549733235,
      "status_codes": {
        "200": 804547
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 36323.565710067756,
        "tailscale": 8939.067475175676,
        "delta_pct": -75.39044611829492
      },
      "p50_latency": {
        "baseline_ms": 0.5925845208363406,
        "tailscale_ms": 1.6899986757381873,
        "delta_pct": 185.19116114491442
      },
      "p99_latency": {
        "baseline_ms": 1.9170065967212846,
        "tailscale_ms": 4.188956626528644,
        "delta_pct": 118.51550399947217
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c3d/results/c3d-standard-4-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.58",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.58",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.7,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 18326.309459193428,
          "retransmits": 0,
          "duration_sec": 30.000634,
          "bytes_transferred": 68725112832
        },
        {
          "bandwidth_mbps": 18562.231282708617,
          "retransmits": 1,
          "duration_sec": 30.000695,
          "bytes_transferred": 69609979904
        },
        {
          "bandwidth_mbps": 18552.44130752779,
          "retransmits": 0,
          "duration_sec": 30.001718,
          "bytes_transferred": 69575639040
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18480.327349809948,
        "bandwidth_mbps_min": 18326.309459193428,
        "bandwidth_mbps_max": 18562.231282708617,
        "bandwidth_mbps_stddev": 108.98040764584402,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11937.599790303482,
          "retransmits": 0,
          "duration_sec": 30.001452,
          "bytes_transferred": 44768165888
        },
        {
          "bandwidth_mbps": 11194.2274606346,
          "retransmits": 0,
          "duration_sec": 30.000523,
          "bytes_transferred": 41979084800
        },
        {
          "bandwidth_mbps": 11762.528222677829,
          "retransmits": 0,
          "duration_sec": 30.00137,
          "bytes_transferred": 44111495168
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11631.451824538637,
        "bandwidth_mbps_min": 11194.2274606346,
        "bandwidth_mbps_max": 11937.599790303482,
        "bandwidth_mbps_stddev": 317.31831730004,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-8",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 74.88203779956083,
      "retransmits_pct": 100
    },
    "overhead_single": {
      "bandwidth_pct": 59.65290617857819,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c3d/results/c3d-standard-8-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c3d-standard-8-server-d834069 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.70.190.34",
      "hops": [
        {
          "hop": 1,
          "host": "100.70.190.34",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.7,
          "avg_ms": 0.7,
          "best_ms": 0.5,
          "worst_ms": 0.9,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4664.691699734907,
          "retransmits": 0,
          "duration_sec": 30.001596,
          "bytes_transferred": 17493524480
        },
        {
          "bandwidth_mbps": 4750.069863379763,
          "retransmits": 0,
          "duration_sec": 30.000753,
          "bytes_transferred": 17813209088
        },
        {
          "bandwidth_mbps": 4510.88335161338,
          "retransmits": 0,
          "duration_sec": 30.000835,
          "bytes_transferred": 16916283392
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4641.881638242683,
        "bandwidth_mbps_min": 4510.88335161338,
        "bandwidth_mbps_max": 4750.069863379763,
        "bandwidth_mbps_stddev": 98.97060517043019,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4602.122347150392,
          "retransmits": 0,
          "duration_sec": 30.001418,
          "bytes_transferred": 17258774528
        },
        {
          "bandwidth_mbps": 4685.140714633082,
          "retransmits": 0,
          "duration_sec": 30.00113,
          "bytes_transferred": 17569939456
        },
        {
          "bandwidth_mbps": 4791.5952795367775,
          "retransmits": 1413,
          "duration_sec": 30.000954,
          "bytes_transferred": 17969053696
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4692.952780440083,
        "bandwidth_mbps_min": 4602.122347150392,
        "bandwidth_mbps_max": 4791.5952795367775,
        "bandwidth_mbps_stddev": 77.5489922818845,
        "retransmits_avg": 471
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
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 17826.232759764665,
      "avg_latency_ms": 0.897177311930987,
      "p50_latency_ms": 0.8002880924875381,
      "p90_latency_ms": 1.6959635756893405,
      "p99_latency_ms": 1.9942668027438861,
      "p999_latency_ms": 2.967775103787338,
      "status_codes": {
        "200": 1604401
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 102118.12668765655,
        "tailscale": 17826.232759764665,
        "delta_pct": -82.54351765158322
      },
      "p50_latency": {
        "baseline_ms": 0.5310734863942099,
        "tailscale_ms": 0.8002880924875381,
        "delta_pct": 50.69253370587082
      },
      "p99_latency": {
        "baseline_ms": 0.9906841364602331,
        "tailscale_ms": 1.9942668027438861,
        "delta_pct": 101.3019820696339
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c3d/results/c3d-standard-8-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 13287.586925348456,
      "avg_latency_ms": 1.2038650299490317,
      "p50_latency_ms": 1.2342403611405572,
      "p90_latency_ms": 1.9265142867636047,
      "p99_latency_ms": 3.1865474723411196,
      "p999_latency_ms": 4.881913569224725,
      "status_codes": {
        "200": 1195919
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c4",
    "instance_type": "c4-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 144175.20732147945,
        "tailscale": 13287.586925348456,
        "delta_pct": -90.78372268560709
      },
      "p50_latency": {
        "baseline_ms": 0.5196852658266615,
        "tailscale_ms": 1.2342403611405572,
        "delta_pct": 137.49766297053958
      },
      "p99_latency": {
        "baseline_ms": 0.9908619042075116,
        "tailscale_ms": 3.1865474723411196,
        "delta_pct": 221.59349943821996
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c4/results/c4-standard-4-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.233",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.233",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9104.588090312389,
          "retransmits": 1439,
          "duration_sec": 30.000535,
          "bytes_transferred": 34142814208
        },
        {
          "bandwidth_mbps": 9186.366067360195,
          "retransmits": 0,
          "duration_sec": 30.000566,
          "bytes_transferred": 34449522688
        },
        {
          "bandwidth_mbps": 9196.58948773169,
          "retransmits": 0,
          "duration_sec": 30.000509,
          "bytes_transferred": 34487795712
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9162.51454846809,
        "bandwidth_mbps_min": 9104.588090312389,
        "bandwidth_mbps_max": 9196.58948773169,
        "bandwidth_mbps_stddev": 41.172284341705115,
        "retransmits_avg": 479.6666666666667
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9340.206616725549,
          "retransmits": 0,
          "duration_sec": 30.000398,
          "bytes_transferred": 35026239488
        },
        {
          "bandwidth_mbps": 9207.91825090488,
          "retransmits": 166,
          "duration_sec": 30.000381,
          "bytes_transferred": 34530131968
        },
        {
          "bandwidth_mbps": 9159.03992924051,
          "retransmits": 406,
          "duration_sec": 30.001347,
          "bytes_transferred": 34347941888
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9235.721598956981,
        "bandwidth_mbps_min": 9159.03992924051,
        "bandwidth_mbps_max": 9340.206616725549,
        "bandwidth_mbps_stddev": 76.5293485566376,
        "retransmits_avg": 190.66666666666666
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-1",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 80.3316109364379,
      "retransmits_pct": 100
    },
    "overhead_single": {
      "bandwidth_pct": 79.29733599771123,
      "retransmits_pct": 100
    },
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-1-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4a-standard-1-server-91dc58d 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:46:04 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.81.44.91",
      "hops": [
        {
          "hop": 1,
          "host": "100.81.44.91",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1839.0580905568622,
          "retransmits": 0,
          "duration_sec": 30.000642,
          "bytes_transferred": 6896615424
        },
        {
          "bandwidth_mbps": 1820.495959864327,
          "retransmits": 0,
          "duration_sec": 30.001839,
          "bytes_transferred": 6827278336
        },
        {
          "bandwidth_mbps": 1746.8029777733632,
          "retransmits": 0,
          "duration_sec": 30.00094,
          "bytes_transferred": 6550716416
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1802.119009398184,
        "bandwidth_mbps_min": 1746.8029777733632,
        "bandwidth_mbps_max": 1839.0580905568622,
        "bandwidth_mbps_stddev": 39.84165065188551,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1907.9501687037284,
          "retransmits": 0,
          "duration_sec": 30.001708,
          "bytes_transferred": 7155220480
        },
        {
          "bandwidth_mbps": 1911.6082479814283,
          "retransmits": 0,
          "duration_sec": 30.000795,
          "bytes_transferred": 7168720896
        },
        {
          "bandwidth_mbps": 1916.5628157714718,
          "retransmits": 0,
          "duration_sec": 30.000929,
          "bytes_transferred": 7187333120
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1912.0404108188761,
        "bandwidth_mbps_min": 1907.9501687037284,
        "bandwidth_mbps_max": 1916.5628157714718,
        "bandwidth_mbps_stddev": 3.52935271845802,
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
    "vcpus": 1,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 4367.055721884065,
      "avg_latency_ms": 3.6632573217298083,
      "p50_latency_ms": 3.6333027307419936,
      "p90_latency_ms": 4.971023141140486,
      "p99_latency_ms": 7.53747949456535,
      "p999_latency_ms": 10.560530749721334,
      "status_codes": {
        "200": 393066
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-1",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 88461.04758935656,
        "tailscale": 4367.055721884065,
        "delta_pct": -95.06330092069868
      },
      "p50_latency": {
        "baseline_ms": 0.5209038780731919,
        "tailscale_ms": 3.6333027307419936,
        "delta_pct": 597.4996508341371
      },
      "p99_latency": {
        "baseline_ms": 0.9922129004426848,
        "tailscale_ms": 7.53747949456535,
        "delta_pct": 659.6635249554238
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-1-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 1,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 3857.8391820178076,
      "avg_latency_ms": 4.148199375038065,
      "p50_latency_ms": 4.206738726823011,
      "p90_latency_ms": 5.663685038730655,
      "p99_latency_ms": 8.085292616420057,
      "p999_latency_ms": 10.753271689279082,
      "status_codes": {
        "200": 347240
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-1",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 31258.71256097713,
        "tailscale": 3857.8391820178076,
        "delta_pct": -87.65835549211367
      },
      "p50_latency": {
        "baseline_ms": 0.6271130884903112,
        "tailscale_ms": 4.206738726823011,
        "delta_pct": 570.810226102944
      },
      "p99_latency": {
        "baseline_ms": 1.9439465460091034,
        "tailscale_ms": 8.085292616420057,
        "delta_pct": 315.92155057036194
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-1-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 1,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.195",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.195",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
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
          "bandwidth_mbps": 9084.228602311414,
          "retransmits": 342,
          "duration_sec": 30.000939,
          "bytes_transferred": 34066923520
        },
        {
          "bandwidth_mbps": 9202.819215504604,
          "retransmits": 688,
          "duration_sec": 30.000482,
          "bytes_transferred": 34511126528
        },
        {
          "bandwidth_mbps": 9203.956063718331,
          "retransmits": 1254,
          "duration_sec": 30.000536,
          "bytes_transferred": 34515451904
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9163.66796051145,
        "bandwidth_mbps_min": 9084.228602311414,
        "bandwidth_mbps_max": 9203.956063718331,
        "bandwidth_mbps_stddev": 56.17402620067065,
        "retransmits_avg": 761.3333333333334
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9352.76158008025,
          "retransmits": 60,
          "duration_sec": 30.000375,
          "bytes_transferred": 35073294336
        },
        {
          "bandwidth_mbps": 9156.83524001648,
          "retransmits": 847,
          "duration_sec": 30.00044,
          "bytes_transferred": 34338635776
        },
        {
          "bandwidth_mbps": 9213.459970443091,
          "retransmits": 1237,
          "duration_sec": 30.000432,
          "bytes_transferred": 34550972416
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9241.018930179942,
        "bandwidth_mbps_min": 9156.83524001648,
        "bandwidth_mbps_max": 9352.76158008025,
        "bandwidth_mbps_stddev": 82.32620028087047,
        "retransmits_avg": 714.6666666666666
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-2",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 60.52912509305547,
      "retransmits_pct": 19.352014010507883
    },
    "overhead_single": {
      "bandwidth_pct": 65.59425465458429,
      "retransmits_pct": 57.042910447761194
    },
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-2-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4a-standard-2-server-548b3d8 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:46:04 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.66.145.57",
      "hops": [
        {
          "hop": 1,
          "host": "100.66.145.57",
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
          "bandwidth_mbps": 3611.919853274144,
          "retransmits": 1157,
          "duration_sec": 30.002074,
          "bytes_transferred": 13545635840
        },
        {
          "bandwidth_mbps": 3622.9460301761096,
          "retransmits": 336,
          "duration_sec": 30.000487,
          "bytes_transferred": 13586268160
        },
        {
          "bandwidth_mbps": 3616.073869293435,
          "retransmits": 349,
          "duration_sec": 30.000666,
          "bytes_transferred": 13560578048
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3616.9799175812295,
        "bandwidth_mbps_min": 3611.919853274144,
        "bandwidth_mbps_max": 3622.9460301761096,
        "bandwidth_mbps_stddev": 4.546781784458261,
        "retransmits_avg": 614
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3182.2383906206196,
          "retransmits": 40,
          "duration_sec": 30.00113,
          "bytes_transferred": 11933843456
        },
        {
          "bandwidth_mbps": 3181.301282207687,
          "retransmits": 194,
          "duration_sec": 30.001068,
          "bytes_transferred": 11930304512
        },
        {
          "bandwidth_mbps": 3174.784648489804,
          "retransmits": 687,
          "duration_sec": 30.003198,
          "bytes_transferred": 11906711552
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3179.44144043937,
        "bandwidth_mbps_min": 3174.784648489804,
        "bandwidth_mbps_max": 3182.2383906206196,
        "bandwidth_mbps_stddev": 3.3149988929666727,
        "retransmits_avg": 307
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
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 7633.502129333586,
      "avg_latency_ms": 2.0954974403724864,
      "p50_latency_ms": 2.058337369843187,
      "p90_latency_ms": 3.0612101010769153,
      "p99_latency_ms": 4.790111681644899,
      "p999_latency_ms": 6.73572807714243,
      "status_codes": {
        "200": 687045
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 103965.95538479509,
        "tailscale": 7633.502129333586,
        "delta_pct": -92.65769058623013
      },
      "p50_latency": {
        "baseline_ms": 0.5222011843355971,
        "tailscale_ms": 2.058337369843187,
        "delta_pct": 294.1655882037178
      },
      "p99_latency": {
        "baseline_ms": 0.999148724263241,
        "tailscale_ms": 4.790111681644899,
        "delta_pct": 379.4192861705413
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-2-l7-serve-h1.json",
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 6722.468146963151,
      "avg_latency_ms": 2.379537012039542,
      "p50_latency_ms": 2.3553917878958472,
      "p90_latency_ms": 3.598092832435912,
      "p99_latency_ms": 5.187243204798283,
      "p999_latency_ms": 6.9100244984110875,
      "status_codes": {
        "200": 605067
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 35264.43891615908,
        "tailscale": 6722.468146963151,
        "delta_pct": -80.93697687081945
      },
      "p50_latency": {
        "baseline_ms": 0.584279267708521,
        "tailscale_ms": 2.3553917878958472,
        "delta_pct": 303.12773669574733
      },
      "p99_latency": {
        "baseline_ms": 1.9378919955547438,
        "tailscale_ms": 5.187243204798283,
        "delta_pct": 167.67452555132593
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-2-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 2,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.225",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.225",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
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
          "bandwidth_mbps": 20840.519850303015,
          "retransmits": 4561,
          "duration_sec": 30.001406,
          "bytes_transferred": 78155612160
        },
        {
          "bandwidth_mbps": 21098.666757687337,
          "retransmits": 2780,
          "duration_sec": 30.000512,
          "bytes_transferred": 79121350656
        },
        {
          "bandwidth_mbps": 21090.567965996637,
          "retransmits": 5048,
          "duration_sec": 30.000796,
          "bytes_transferred": 79091728384
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21009.918191328998,
        "bandwidth_mbps_min": 20840.519850303015,
        "bandwidth_mbps_max": 21098.666757687337,
        "bandwidth_mbps_stddev": 119.8283385054869,
        "retransmits_avg": 4129.666666666667
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 21493.573082221334,
          "retransmits": 2399,
          "duration_sec": 30.001168,
          "bytes_transferred": 80604037120
        },
        {
          "bandwidth_mbps": 21057.70809582896,
          "retransmits": 6507,
          "duration_sec": 30.001202,
          "bytes_transferred": 78969569280
        },
        {
          "bandwidth_mbps": 20987.120098564115,
          "retransmits": 2454,
          "duration_sec": 30.001183,
          "bytes_transferred": 78704803840
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21179.467092204806,
        "bandwidth_mbps_min": 20987.120098564115,
        "bandwidth_mbps_max": 21493.573082221334,
        "bandwidth_mbps_stddev": 223.9681466379601,
        "retransmits_avg": 3786.6666666666665
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-4",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 75.11410955094212,
      "retransmits_pct": 78.13382839615788
    },
    "overhead_single": {
      "bandwidth_pct": 76.47285783840924,
      "retransmits_pct": 83.91725352112675
    },
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4a-standard-4-server-8688237 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:46:04 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.71.92.12",
      "hops": [
        {
          "hop": 1,
          "host": "100.71.92.12",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.3,
          "best_ms": 0.2,
          "worst_ms": 0.5,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5231.38088106095,
          "retransmits": 707,
          "duration_sec": 30.001602,
          "bytes_transferred": 19618725888
        },
        {
          "bandwidth_mbps": 5235.55119992478,
          "retransmits": 1164,
          "duration_sec": 30.002339,
          "bytes_transferred": 19634847744
        },
        {
          "bandwidth_mbps": 5218.583592606725,
          "retransmits": 838,
          "duration_sec": 30.000829,
          "bytes_transferred": 19570229248
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5228.505224530819,
        "bandwidth_mbps_min": 5218.583592606725,
        "bandwidth_mbps_max": 5235.55119992478,
        "bandwidth_mbps_stddev": 7.219278582813181,
        "retransmits_avg": 903
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4966.265316511052,
          "retransmits": 333,
          "duration_sec": 30.00148,
          "bytes_transferred": 18624413696
        },
        {
          "bandwidth_mbps": 5006.091090991926,
          "retransmits": 104,
          "duration_sec": 30.000332,
          "bytes_transferred": 18773049344
        },
        {
          "bandwidth_mbps": 4976.413588048098,
          "retransmits": 1390,
          "duration_sec": 30.000983,
          "bytes_transferred": 18662162432
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4982.923331850358,
        "bandwidth_mbps_min": 4966.265316511052,
        "bandwidth_mbps_max": 5006.091090991926,
        "bandwidth_mbps_stddev": 16.897843087776025,
        "retransmits_avg": 609
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 15313.326569861842,
      "avg_latency_ms": 1.043386494343322,
      "p50_latency_ms": 0.960378756757795,
      "p90_latency_ms": 1.8461497670634797,
      "p99_latency_ms": 2.8497827587371987,
      "p999_latency_ms": 4.389248357325104,
      "status_codes": {
        "200": 1379644
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 153123.52502846406,
        "tailscale": 15313.326569861842,
        "delta_pct": -89.99936386847465
      },
      "p50_latency": {
        "baseline_ms": 0.5208115429684064,
        "tailscale_ms": 0.960378756757795,
        "delta_pct": 84.40043615086577
      },
      "p99_latency": {
        "baseline_ms": 0.9908673198053585,
        "tailscale_ms": 2.8497827587371987,
        "delta_pct": 187.6048792584054
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-4-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 12988.226851030704,
      "avg_latency_ms": 1.231418813724934,
      "p50_latency_ms": 1.2641999961936878,
      "p90_latency_ms": 1.9348042641345655,
      "p99_latency_ms": 3.142291183413223,
      "p999_latency_ms": 4.758802156240396,
      "status_codes": {
        "200": 1168977
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 52450.372421743195,
        "tailscale": 12988.226851030704,
        "delta_pct": -75.23711224279799
      },
      "p50_latency": {
        "baseline_ms": 0.5405586869373571,
        "tailscale_ms": 1.2641999961936878,
        "delta_pct": 133.86914811345733
      },
      "p99_latency": {
        "baseline_ms": 1.5927072118145784,
        "tailscale_ms": 3.142291183413223,
        "delta_pct": 97.29245652333027
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-4-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.208",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.208",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
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
          "bandwidth_mbps": 20898.614629087722,
          "retransmits": 0,
          "duration_sec": 30.001447,
          "bytes_transferred": 78373584896
        },
        {
          "bandwidth_mbps": 21102.657390615434,
          "retransmits": 0,
          "duration_sec": 30.000553,
          "bytes_transferred": 79136423936
        },
        {
          "bandwidth_mbps": 21073.752710428944,
          "retransmits": 0,
          "duration_sec": 30.000602,
          "bytes_transferred": 79028158464
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21025.008243377368,
        "bandwidth_mbps_min": 20898.614629087722,
        "bandwidth_mbps_max": 21102.657390615434,
        "bandwidth_mbps_stddev": 90.14942940869653,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 21496.17332558478,
          "retransmits": 0,
          "duration_sec": 30.001295,
          "bytes_transferred": 80614129664
        },
        {
          "bandwidth_mbps": 21058.767158779414,
          "retransmits": 0,
          "duration_sec": 30.001187,
          "bytes_transferred": 78973501440
        },
        {
          "bandwidth_mbps": 21108.740267929974,
          "retransmits": 253,
          "duration_sec": 30.001197,
          "bytes_transferred": 79160934400
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21221.226917431388,
        "bandwidth_mbps_min": 21058.767158779414,
        "bandwidth_mbps_max": 21496.17332558478,
        "bandwidth_mbps_stddev": 195.48396938006871,
        "retransmits_avg": 84.33333333333333
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-8",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 71.8638991596599,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 72.3970229658924,
      "retransmits_pct": 100
    },
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-8-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4a-standard-8-server-2f3e8ee 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:46:04 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.94.214.128",
      "hops": [
        {
          "hop": 1,
          "host": "100.94.214.128",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 0.6,
          "stdev_ms": 0
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5912.602094913056,
          "retransmits": 0,
          "duration_sec": 30.001436,
          "bytes_transferred": 22173319168
        },
        {
          "bandwidth_mbps": 5922.106903973725,
          "retransmits": 0,
          "duration_sec": 30.000737,
          "bytes_transferred": 22208446464
        },
        {
          "bandwidth_mbps": 5912.143564252641,
          "retransmits": 0,
          "duration_sec": 30.000393,
          "bytes_transferred": 22170828800
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5915.617521046474,
        "bandwidth_mbps_min": 5912.143564252641,
        "bandwidth_mbps_max": 5922.106903973725,
        "bandwidth_mbps_stddev": 4.592503360478244,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5829.521327103632,
          "retransmits": 0,
          "duration_sec": 30.00037,
          "bytes_transferred": 21860974592
        },
        {
          "bandwidth_mbps": 5863.784320913605,
          "retransmits": 0,
          "duration_sec": 30.000498,
          "bytes_transferred": 21989556224
        },
        {
          "bandwidth_mbps": 5879.765529106096,
          "retransmits": 0,
          "duration_sec": 30.000278,
          "bytes_transferred": 22049325056
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5857.690392374444,
        "bandwidth_mbps_min": 5829.521327103632,
        "bandwidth_mbps_max": 5879.765529106096,
        "bandwidth_mbps_stddev": 20.959833531406616,
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
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 23897.769253681687,
      "avg_latency_ms": 0.6691673101684223,
      "p50_latency_ms": 0.6326170312890426,
      "p90_latency_ms": 0.9910716562895633,
      "p99_latency_ms": 1.939838211324255,
      "p999_latency_ms": 2.9312235255446897,
      "status_codes": {
        "200": 2150846
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 175754.19611103018,
        "tailscale": 23897.769253681687,
        "delta_pct": -86.40273189347661
      },
      "p50_latency": {
        "baseline_ms": 0.5208109212650291,
        "tailscale_ms": 0.6326170312890426,
        "delta_pct": 21.467696904750152
      },
      "p99_latency": {
        "baseline_ms": 0.9904495622853814,
        "tailscale_ms": 1.939838211324255,
        "delta_pct": 95.85431557445861
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-8-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 22303.07882160865,
      "avg_latency_ms": 0.71699437375988,
      "p50_latency_ms": 0.6649369982400087,
      "p90_latency_ms": 1.115009491773058,
      "p99_latency_ms": 1.964619789132547,
      "p999_latency_ms": 2.9919317460193935,
      "status_codes": {
        "200": 2007315
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 63396.5068319061,
        "tailscale": 22303.07882160865,
        "delta_pct": -64.81970389828483
      },
      "p50_latency": {
        "baseline_ms": 0.5318533829258594,
        "tailscale_ms": 0.6649369982400087,
        "delta_pct": 25.022613296548553
      },
      "p99_latency": {
        "baseline_ms": 0.9921896422690876,
        "tailscale_ms": 1.964619789132547,
        "delta_pct": 98.00849610156791
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-8-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.50",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.50",
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
          "bandwidth_mbps": 9367.847979345739,
          "retransmits": 0,
          "duration_sec": 30.000976,
          "bytes_transferred": 35130572800
        },
        {
          "bandwidth_mbps": 9599.23034472856,
          "retransmits": 38,
          "duration_sec": 30.001837,
          "bytes_transferred": 35999318016
        },
        {
          "bandwidth_mbps": 9684.999444949246,
          "retransmits": 0,
          "duration_sec": 30.00086,
          "bytes_transferred": 36319789056
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9550.692589674514,
        "bandwidth_mbps_min": 9367.847979345739,
        "bandwidth_mbps_max": 9684.999444949246,
        "bandwidth_mbps_stddev": 133.9482444401019,
        "retransmits_avg": 12.666666666666666
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 8051.7626086082055,
          "retransmits": 0,
          "duration_sec": 30.001071,
          "bytes_transferred": 30195187712
        },
        {
          "bandwidth_mbps": 7911.682762533145,
          "retransmits": 0,
          "duration_sec": 30.00145,
          "bytes_transferred": 29670244352
        },
        {
          "bandwidth_mbps": 8002.33378252209,
          "retransmits": 0,
          "duration_sec": 30.001493,
          "bytes_transferred": 30010245120
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 7988.593051221146,
        "bandwidth_mbps_min": 7911.682762533145,
        "bandwidth_mbps_max": 8051.7626086082055,
        "bandwidth_mbps_stddev": 58.00687655566752,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "n2",
    "instance_type": "n2-standard-2",
    "kernel_version": "",
    "overhead": {
      "bandwidth_pct": 79.81198700503663,
      "retransmits_pct": -77350.00000000001
    },
    "overhead_single": {
      "bandwidth_pct": 76.26246843038251,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/n2/results/n2-standard-2-l4-kernel.json",
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
          "bandwidth_mbps": 1897.3365868565095,
          "retransmits": 5586,
          "duration_sec": 30.001528,
          "bytes_transferred": 7115374592
        },
        {
          "bandwidth_mbps": 1913.27253599172,
          "retransmits": 6763,
          "duration_sec": 30.001553,
          "bytes_transferred": 7175143424
        },
        {
          "bandwidth_mbps": 1973.676060489254,
          "retransmits": 17082,
          "duration_sec": 30.003015,
          "bytes_transferred": 7402029056
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1928.0950611124945,
        "bandwidth_mbps_min": 1897.3365868565095,
        "bandwidth_mbps_max": 1973.676060489254,
        "bandwidth_mbps_stddev": 32.8806857881454,
        "retransmits_avg": 9810.333333333334
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1905.844203248154,
          "retransmits": 1569,
          "duration_sec": 30.002949,
          "bytes_transferred": 7147618304
        },
        {
          "bandwidth_mbps": 1916.058342662863,
          "retransmits": 2444,
          "duration_sec": 30.000619,
          "bytes_transferred": 7185367040
        },
        {
          "bandwidth_mbps": 1866.98184659465,
          "retransmits": 3053,
          "duration_sec": 30.001809,
          "bytes_transferred": 7001604096
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1896.294797501889,
        "bandwidth_mbps_min": 1866.98184659465,
        "bandwidth_mbps_max": 1916.058342662863,
        "bandwidth_mbps_stddev": 21.14267373762407,
        "retransmits_avg": 2355.3333333333335
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
    "vcpus": 2,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 4039.105256884868,
      "avg_latency_ms": 3.960431556767015,
      "p50_latency_ms": 3.891518904048547,
      "p90_latency_ms": 5.763533943377429,
      "p99_latency_ms": 8.264699916370498,
      "p999_latency_ms": 11.027443156571278,
      "status_codes": {
        "200": 363549
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "n2",
    "instance_type": "n2-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 51205.5652526397,
        "tailscale": 4039.105256884868,
        "delta_pct": -92.11197994406155
      },
      "p50_latency": {
        "baseline_ms": 0.5379555760481863,
        "tailscale_ms": 3.891518904048547,
        "delta_pct": 623.3903833910576
      },
      "p99_latency": {
        "baseline_ms": 1.2824671242139234,
        "tailscale_ms": 8.264699916370498,
        "delta_pct": 544.437565714308
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/n2/results/n2-standard-2-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 2,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.61",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.61",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.9,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9482.734799217,
          "retransmits": 0,
          "duration_sec": 30.000971,
          "bytes_transferred": 35561406464
        },
        {
          "bandwidth_mbps": 9741.68932283942,
          "retransmits": 0,
          "duration_sec": 30.000757,
          "bytes_transferred": 36532256768
        },
        {
          "bandwidth_mbps": 9724.24617986395,
          "retransmits": 0,
          "duration_sec": 30.000764,
          "bytes_transferred": 36466851840
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9649.55676730679,
        "bandwidth_mbps_min": 9482.734799217,
        "bandwidth_mbps_max": 9741.68932283942,
        "bandwidth_mbps_stddev": 118.17569571681238,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 8466.845920308613,
          "retransmits": 0,
          "duration_sec": 30.001436,
          "bytes_transferred": 31752192000
        },
        {
          "bandwidth_mbps": 8872.715178684311,
          "retransmits": 0,
          "duration_sec": 30.001487,
          "bytes_transferred": 33274331136
        },
        {
          "bandwidth_mbps": 9223.83457422575,
          "retransmits": 387,
          "duration_sec": 30.000452,
          "bytes_transferred": 34589900800
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 8854.465224406225,
        "bandwidth_mbps_min": 8466.845920308613,
        "bandwidth_mbps_max": 9223.83457422575,
        "bandwidth_mbps_stddev": 309.30863891716507,
        "retransmits_avg": 129
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "n2",
    "instance_type": "n2-standard-4",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 72.1435435969558,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 70.77014114587158,
      "retransmits_pct": -15389.147286821704
    },
    "region": "us-central1",
    "source": "gcp/n2/results/n2-standard-4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n2-standard-4-server-ebf0808 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.83.112.66",
      "hops": [
        {
          "hop": 1,
          "host": "100.83.112.66",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1,
          "avg_ms": 0.9,
          "best_ms": 0.7,
          "worst_ms": 1.2,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2687.5524982727457,
          "retransmits": 71589,
          "duration_sec": 30.001368,
          "bytes_transferred": 10078781440
        },
        {
          "bandwidth_mbps": 2683.5328052772675,
          "retransmits": 84002,
          "duration_sec": 30.000981,
          "bytes_transferred": 10063577088
        },
        {
          "bandwidth_mbps": 2692.988418365437,
          "retransmits": 68716,
          "duration_sec": 30.001551,
          "bytes_transferred": 10099228672
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2688.024573971817,
        "bandwidth_mbps_min": 2683.5328052772675,
        "bandwidth_mbps_max": 2692.988418365437,
        "bandwidth_mbps_stddev": 3.8746437528742836,
        "retransmits_avg": 74769
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2581.8158494076256,
          "retransmits": 21004,
          "duration_sec": 30.001891,
          "bytes_transferred": 9682419712
        },
        {
          "bandwidth_mbps": 2593.3585637561073,
          "retransmits": 18915,
          "duration_sec": 30.000977,
          "bytes_transferred": 9725411328
        },
        {
          "bandwidth_mbps": 2589.2686489817415,
          "retransmits": 20024,
          "duration_sec": 30.000579,
          "bytes_transferred": 9709944832
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2588.147687381825,
        "bandwidth_mbps_min": 2581.8158494076256,
        "bandwidth_mbps_max": 2593.3585637561073,
        "bandwidth_mbps_stddev": 4.778492078332327,
        "retransmits_avg": 19981
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 7813.995569027037,
      "avg_latency_ms": 2.046908085437449,
      "p50_latency_ms": 1.9463933214722904,
      "p90_latency_ms": 2.9921048045326866,
      "p99_latency_ms": 4.855258347372447,
      "p999_latency_ms": 7.1143836989404505,
      "status_codes": {
        "200": 703303
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "n2",
    "instance_type": "n2-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 74712.70305446711,
        "tailscale": 7813.995569027037,
        "delta_pct": -89.54127578100008
      },
      "p50_latency": {
        "baseline_ms": 0.5344712125283907,
        "tailscale_ms": 1.9463933214722904,
        "delta_pct": 264.17177873146903
      },
      "p99_latency": {
        "baseline_ms": 0.9946213580662452,
        "tailscale_ms": 4.855258347372447,
        "delta_pct": 388.1514264696768
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/n2/results/n2-standard-4-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.12",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.12",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
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
          "bandwidth_mbps": 15409.482325652478,
          "retransmits": 0,
          "duration_sec": 30.001645,
          "bytes_transferred": 57788727296
        },
        {
          "bandwidth_mbps": 15711.709808523272,
          "retransmits": 0,
          "duration_sec": 30.000826,
          "bytes_transferred": 58920534016
        },
        {
          "bandwidth_mbps": 15699.366404994287,
          "retransmits": 0,
          "duration_sec": 30.001638,
          "bytes_transferred": 58875838464
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 15606.852846390013,
        "bandwidth_mbps_min": 15409.482325652478,
        "bandwidth_mbps_max": 15711.709808523272,
        "bandwidth_mbps_stddev": 139.65297883163583,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 14513.641055697595,
          "retransmits": 0,
          "duration_sec": 30.001546,
          "bytes_transferred": 54428958720
        },
        {
          "bandwidth_mbps": 13705.6399782838,
          "retransmits": 0,
          "duration_sec": 30.001568,
          "bytes_transferred": 51398836224
        },
        {
          "bandwidth_mbps": 12490.25744667348,
          "retransmits": 0,
          "duration_sec": 30.001584,
          "bytes_transferred": 46840938496
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 13569.846160218292,
        "bandwidth_mbps_min": 12490.25744667348,
        "bandwidth_mbps_max": 14513.641055697595,
        "bandwidth_mbps_stddev": 831.6049855892998,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "n2",
    "instance_type": "n2-standard-8",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 82.09066696473414,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 79.47208090911305,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/n2/results/n2-standard-8-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n2-standard-8-server-52a6e87 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.87.239.22",
      "hops": [
        {
          "hop": 1,
          "host": "100.87.239.22",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.9,
          "avg_ms": 0.9,
          "best_ms": 0.7,
          "worst_ms": 1.2,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2815.3142801677714,
          "retransmits": 200,
          "duration_sec": 30.000824,
          "bytes_transferred": 10557718528
        },
        {
          "bandwidth_mbps": 2789.89666068959,
          "retransmits": 296,
          "duration_sec": 30.001284,
          "bytes_transferred": 10462560256
        },
        {
          "bandwidth_mbps": 2780.0388168942145,
          "retransmits": 244,
          "duration_sec": 30.001679,
          "bytes_transferred": 10425729024
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2795.083252583858,
        "bandwidth_mbps_min": 2780.0388168942145,
        "bandwidth_mbps_max": 2815.3142801677714,
        "bandwidth_mbps_stddev": 14.86080143418211,
        "retransmits_avg": 246.66666666666666
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2870.9474012835963,
          "retransmits": 186,
          "duration_sec": 30.000561,
          "bytes_transferred": 10766254080
        },
        {
          "bandwidth_mbps": 2846.09822755214,
          "retransmits": 491,
          "duration_sec": 30.000544,
          "bytes_transferred": 10673061888
        },
        {
          "bandwidth_mbps": 2639.775492746586,
          "retransmits": 278,
          "duration_sec": 30.000563,
          "bytes_transferred": 9899343872
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2785.607040527441,
        "bandwidth_mbps_min": 2639.775492746586,
        "bandwidth_mbps_max": 2870.9474012835963,
        "bandwidth_mbps_stddev": 103.6162812332238,
        "retransmits_avg": 318.3333333333333
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
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 13035.645326284119,
      "avg_latency_ms": 1.2267579728091973,
      "p50_latency_ms": 1.2845801968091297,
      "p90_latency_ms": 1.9135997490600107,
      "p99_latency_ms": 2.8995219749172487,
      "p999_latency_ms": 3.9998538367170653,
      "status_codes": {
        "200": 1173240
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "n2",
    "instance_type": "n2-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 72273.44475243946,
        "tailscale": 13035.645326284119,
        "delta_pct": -81.96343709513843
      },
      "p50_latency": {
        "baseline_ms": 0.5385571596242091,
        "tailscale_ms": 1.2845801968091297,
        "delta_pct": 138.52253634609102
      },
      "p99_latency": {
        "baseline_ms": 0.9909058067137431,
        "tailscale_ms": 2.8995219749172487,
        "delta_pct": 192.61327921099513
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/n2/results/n2-standard-8-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.8",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.8",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.3,
          "best_ms": 0.3,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9030.146191723708,
          "retransmits": 0,
          "duration_sec": 30.001329,
          "bytes_transferred": 33864548352
        },
        {
          "bandwidth_mbps": 9232.61707152137,
          "retransmits": 100,
          "duration_sec": 30.001216,
          "bytes_transferred": 34623717376
        },
        {
          "bandwidth_mbps": 9321.46095171437,
          "retransmits": 118,
          "duration_sec": 30.000997,
          "bytes_transferred": 34956640256
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9194.741404986482,
        "bandwidth_mbps_min": 9030.146191723708,
        "bandwidth_mbps_max": 9321.46095171437,
        "bandwidth_mbps_stddev": 121.90706004630682,
        "retransmits_avg": 72.66666666666667
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9344.261064465469,
          "retransmits": 0,
          "duration_sec": 30.001969,
          "bytes_transferred": 35043278848
        },
        {
          "bandwidth_mbps": 9136.365116334106,
          "retransmits": 0,
          "duration_sec": 30.00109,
          "bytes_transferred": 34262614016
        },
        {
          "bandwidth_mbps": 9127.790228423612,
          "retransmits": 0,
          "duration_sec": 30.001014,
          "bytes_transferred": 34230370304
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9202.805469741063,
        "bandwidth_mbps_min": 9127.790228423612,
        "bandwidth_mbps_max": 9344.261064465469,
        "bandwidth_mbps_stddev": 100.08545060695586,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "n4",
    "instance_type": "n4-standard-2",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 65.34981746637895,
      "retransmits_pct": -1137.6146788990827
    },
    "overhead_single": {
      "bandwidth_pct": 67.87860045174324,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/n4/results/n4-standard-2-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n4-standard-2-server-3c80657 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.93.72.85",
      "hops": [
        {
          "hop": 1,
          "host": "100.93.72.85",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.1,
          "avg_ms": 1,
          "best_ms": 0.7,
          "worst_ms": 1.4,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3315.6920544167924,
          "retransmits": 2029,
          "duration_sec": 30.001989,
          "bytes_transferred": 12434669568
        },
        {
          "bandwidth_mbps": 3147.18421619678,
          "retransmits": 110,
          "duration_sec": 30.003111,
          "bytes_transferred": 11803164672
        },
        {
          "bandwidth_mbps": 3095.107770353172,
          "retransmits": 559,
          "duration_sec": 30.001442,
          "bytes_transferred": 11607212032
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3185.9946803222483,
        "bandwidth_mbps_min": 3095.107770353172,
        "bandwidth_mbps_max": 3315.6920544167924,
        "bandwidth_mbps_stddev": 94.14189888386817,
        "retransmits_avg": 899.3333333333334
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2903.2547479375626,
          "retransmits": 51,
          "duration_sec": 30.002606,
          "bytes_transferred": 10888151040
        },
        {
          "bandwidth_mbps": 2946.353108368217,
          "retransmits": 0,
          "duration_sec": 30.001481,
          "bytes_transferred": 11049369600
        },
        {
          "bandwidth_mbps": 3018.6018874472798,
          "retransmits": 0,
          "duration_sec": 30.000732,
          "bytes_transferred": 11320033280
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2956.0699145843532,
        "bandwidth_mbps_min": 2903.2547479375626,
        "bandwidth_mbps_max": 3018.6018874472798,
        "bandwidth_mbps_stddev": 47.588884490323274,
        "retransmits_avg": 17
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
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 5722.504716499687,
      "avg_latency_ms": 2.795305416544398,
      "p50_latency_ms": 2.6966653230956976,
      "p90_latency_ms": 3.9800188718493543,
      "p99_latency_ms": 6.231287830635909,
      "p999_latency_ms": 8.725812534408577,
      "status_codes": {
        "200": 515065
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "n4",
    "instance_type": "n4-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 85993.95525812334,
        "tailscale": 5722.504716499687,
        "delta_pct": -93.34545701576029
      },
      "p50_latency": {
        "baseline_ms": 0.5275054133771987,
        "tailscale_ms": 2.6966653230956976,
        "delta_pct": 411.2109287810126
      },
      "p99_latency": {
        "baseline_ms": 0.9959726416679718,
        "tailscale_ms": 6.231287830635909,
        "delta_pct": 525.6484937377666
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/n4/results/n4-standard-2-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 2,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.47",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.47",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 1,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9049.376472656772,
          "retransmits": 0,
          "duration_sec": 30.001305,
          "bytes_transferred": 33936637952
        },
        {
          "bandwidth_mbps": 9260.31139184129,
          "retransmits": 0,
          "duration_sec": 30.001287,
          "bytes_transferred": 34727657472
        },
        {
          "bandwidth_mbps": 9219.32474624866,
          "retransmits": 0,
          "duration_sec": 30.001024,
          "bytes_transferred": 34573647872
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9176.337536915575,
        "bandwidth_mbps_min": 9049.376472656772,
        "bandwidth_mbps_max": 9260.31139184129,
        "bandwidth_mbps_stddev": 91.32108247836196,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9348.50676676858,
          "retransmits": 0,
          "duration_sec": 30.001691,
          "bytes_transferred": 35058876416
        },
        {
          "bandwidth_mbps": 9153.129151864174,
          "retransmits": 0,
          "duration_sec": 30.001704,
          "bytes_transferred": 34326183936
        },
        {
          "bandwidth_mbps": 9147.482215912916,
          "retransmits": 0,
          "duration_sec": 30.00154,
          "bytes_transferred": 34304819200
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9216.372711515223,
        "bandwidth_mbps_min": 9147.482215912916,
        "bandwidth_mbps_max": 9348.50676676858,
        "bandwidth_mbps_stddev": 93.46132315805727,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "n4",
    "instance_type": "n4-standard-4",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 52.071459113861074,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 52.76571387202645,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/n4/results/n4-standard-4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n4-standard-4-server-a1bdec7 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.119.24.98",
      "hops": [
        {
          "hop": 1,
          "host": "100.119.24.98",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.2,
          "avg_ms": 1.2,
          "best_ms": 0.8,
          "worst_ms": 1.6,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4406.819629649394,
          "retransmits": 757,
          "duration_sec": 30.000923,
          "bytes_transferred": 16526082048
        },
        {
          "bandwidth_mbps": 4436.579195156223,
          "retransmits": 304,
          "duration_sec": 30.001052,
          "bytes_transferred": 16637755392
        },
        {
          "bandwidth_mbps": 4350.855239886467,
          "retransmits": 684,
          "duration_sec": 30.001213,
          "bytes_transferred": 16316366848
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4398.084688230695,
        "bandwidth_mbps_min": 4350.855239886467,
        "bandwidth_mbps_max": 4436.579195156223,
        "bandwidth_mbps_stddev": 35.53752503072293,
        "retransmits_avg": 581.6666666666666
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4381.9300155700885,
          "retransmits": 91,
          "duration_sec": 30.000473,
          "bytes_transferred": 16432496640
        },
        {
          "bandwidth_mbps": 4330.565835601455,
          "retransmits": 399,
          "duration_sec": 30.001336,
          "bytes_transferred": 16240345088
        },
        {
          "bandwidth_mbps": 4347.367720361181,
          "retransmits": 609,
          "duration_sec": 30.001643,
          "bytes_transferred": 16303521792
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4353.287857177575,
        "bandwidth_mbps_min": 4330.565835601455,
        "bandwidth_mbps_max": 4381.9300155700885,
        "bandwidth_mbps_stddev": 21.38310487131011,
        "retransmits_avg": 366.3333333333333
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 10100.031535146756,
      "avg_latency_ms": 1.5835955476481034,
      "p50_latency_ms": 1.5274825511381032,
      "p90_latency_ms": 2.532580914761723,
      "p99_latency_ms": 3.9063562252062964,
      "p999_latency_ms": 5.894135708311468,
      "status_codes": {
        "200": 909041
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "n4",
    "instance_type": "n4-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 108487.340772148,
        "tailscale": 10100.031535146756,
        "delta_pct": -90.69012894660264
      },
      "p50_latency": {
        "baseline_ms": 0.5262832938971481,
        "tailscale_ms": 1.5274825511381032,
        "delta_pct": 190.23960457247955
      },
      "p99_latency": {
        "baseline_ms": 0.9913526677084271,
        "tailscale_ms": 3.9063562252062964,
        "delta_pct": 294.0430436563085
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/n4/results/n4-standard-4-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.29",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.29",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 0.8,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 14709.184936425361,
          "retransmits": 167,
          "duration_sec": 30.001272,
          "bytes_transferred": 55161782272
        },
        {
          "bandwidth_mbps": 14828.979478918083,
          "retransmits": 6,
          "duration_sec": 30.001732,
          "bytes_transferred": 55611883520
        },
        {
          "bandwidth_mbps": 14782.800911889157,
          "retransmits": 0,
          "duration_sec": 30.001892,
          "bytes_transferred": 55438999552
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 14773.655109077534,
        "bandwidth_mbps_min": 14709.184936425361,
        "bandwidth_mbps_max": 14828.979478918083,
        "bandwidth_mbps_stddev": 49.33164896603373,
        "retransmits_avg": 57.666666666666664
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 14952.173873242615,
          "retransmits": 0,
          "duration_sec": 30.001534,
          "bytes_transferred": 56073519104
        },
        {
          "bandwidth_mbps": 14651.456820851323,
          "retransmits": 605,
          "duration_sec": 30.001321,
          "bytes_transferred": 54945382400
        },
        {
          "bandwidth_mbps": 14742.927626143464,
          "retransmits": 0,
          "duration_sec": 30.001455,
          "bytes_transferred": 55288659968
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 14782.186106745801,
        "bandwidth_mbps_min": 14651.456820851323,
        "bandwidth_mbps_max": 14952.173873242615,
        "bandwidth_mbps_stddev": 125.86661623620925,
        "retransmits_avg": 201.66666666666666
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "n4",
    "instance_type": "n4-standard-8",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 69.20703953988262,
      "retransmits_pct": 71.67630057803468
    },
    "overhead_single": {
      "bandwidth_pct": 69.00874868468631,
      "retransmits_pct": 73.7190082644628
    },
    "region": "us-central1",
    "source": "gcp/n4/results/n4-standard-8-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n4-standard-8-server-3af0e6d 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.69.197.69",
      "hops": [
        {
          "hop": 1,
          "host": "100.69.197.69",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.2,
          "avg_ms": 1.2,
          "best_ms": 0.9,
          "worst_ms": 1.6,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4539.832928427072,
          "retransmits": 0,
          "duration_sec": 30.000771,
          "bytes_transferred": 17024811008
        },
        {
          "bandwidth_mbps": 4542.801697488915,
          "retransmits": 49,
          "duration_sec": 30.000785,
          "bytes_transferred": 17035952128
        },
        {
          "bandwidth_mbps": 4565.10270284108,
          "retransmits": 0,
          "duration_sec": 30.000543,
          "bytes_transferred": 17119444992
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4549.245776252355,
        "bandwidth_mbps_min": 4539.832928427072,
        "bandwidth_mbps_max": 4565.10270284108,
        "bandwidth_mbps_stddev": 11.277854053136766,
        "retransmits_avg": 16.333333333333332
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4576.033343328688,
          "retransmits": 72,
          "duration_sec": 30.000604,
          "bytes_transferred": 17160470528
        },
        {
          "bandwidth_mbps": 4581.679809612487,
          "retransmits": 22,
          "duration_sec": 30.000707,
          "bytes_transferred": 17181704192
        },
        {
          "bandwidth_mbps": 4585.84018577575,
          "retransmits": 65,
          "duration_sec": 30.000471,
          "bytes_transferred": 17197170688
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4581.1844462389745,
        "bandwidth_mbps_min": 4576.033343328688,
        "bandwidth_mbps_max": 4585.84018577575,
        "bandwidth_mbps_stddev": 4.01892011608736,
        "retransmits_avg": 53
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
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gcp",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 15632.10100998519,
      "avg_latency_ms": 1.0229609888684816,
      "p50_latency_ms": 0.962517525067501,
      "p90_latency_ms": 1.8211507475743396,
      "p99_latency_ms": 2.5203648265265888,
      "p999_latency_ms": 3.5256522213919244,
      "status_codes": {
        "200": 1406946
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "n4",
    "instance_type": "n4-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 110657.79737232922,
        "tailscale": 15632.10100998519,
        "delta_pct": -85.87347536171535
      },
      "p50_latency": {
        "baseline_ms": 0.5271071063936841,
        "tailscale_ms": 0.962517525067501,
        "delta_pct": 82.60378458047556
      },
      "p99_latency": {
        "baseline_ms": 0.9905801965476391,
        "tailscale_ms": 2.5203648265265888,
        "delta_pct": 154.43319332554205
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gcp/n4/results/n4-standard-8-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.238",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.238",
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
          "bandwidth_mbps": 37851.1880752559,
          "retransmits": 0,
          "duration_sec": 30.001214,
          "bytes_transferred": 141947699200
        },
        {
          "bandwidth_mbps": 37776.76802295798,
          "retransmits": 0,
          "duration_sec": 30.001249,
          "bytes_transferred": 141668777984
        },
        {
          "bandwidth_mbps": 37714.24004922453,
          "retransmits": 0,
          "duration_sec": 30.001305,
          "bytes_transferred": 141434552320
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37780.732049146136,
        "bandwidth_mbps_min": 37714.24004922453,
        "bandwidth_mbps_max": 37851.1880752559,
        "bandwidth_mbps_stddev": 55.97901741538309,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9419.130672037125,
          "retransmits": 0,
          "duration_sec": 30.00117,
          "bytes_transferred": 35323117568
        },
        {
          "bandwidth_mbps": 9385.10168368008,
          "retransmits": 0,
          "duration_sec": 30.001127,
          "bytes_transferred": 35195453440
        },
        {
          "bandwidth_mbps": 9475.156766275664,
          "retransmits": 0,
          "duration_sec": 30.001172,
          "bytes_transferred": 35533225984
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9426.46304066429,
        "bandwidth_mbps_min": 9385.10168368008,
        "bandwidth_mbps_max": 9475.156766275664,
        "bandwidth_mbps_stddev": 37.128625053883624,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "aws",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c8gn",
    "instance_type": "c8gn.12xlarge",
    "kernel_version": "6.17.0-1009-aws",
    "overhead": {
      "bandwidth_pct": 83.66102427962218,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 41.012803516767846,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.12xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-238 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.115.120.8",
      "hops": [
        {
          "hop": 1,
          "host": "100.115.120.8",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.3,
          "stdev_ms": 0
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6247.621119104718,
          "retransmits": 0,
          "duration_sec": 30.001196,
          "bytes_transferred": 23429513216
        },
        {
          "bandwidth_mbps": 6066.408729508362,
          "retransmits": 0,
          "duration_sec": 30.001323,
          "bytes_transferred": 22750035968
        },
        {
          "bandwidth_mbps": 6204.924060859894,
          "retransmits": 0,
          "duration_sec": 30.001301,
          "bytes_transferred": 23269474304
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6172.984636490991,
        "bandwidth_mbps_min": 6066.408729508362,
        "bandwidth_mbps_max": 6247.621119104718,
        "bandwidth_mbps_stddev": 77.35018921574795,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5809.893537513785,
          "retransmits": 0,
          "duration_sec": 30.000652,
          "bytes_transferred": 21787574272
        },
        {
          "bandwidth_mbps": 5404.509902166293,
          "retransmits": 0,
          "duration_sec": 30.001112,
          "bytes_transferred": 20267663360
        },
        {
          "bandwidth_mbps": 5466.8153859676395,
          "retransmits": 0,
          "duration_sec": 30.001181,
          "bytes_transferred": 20501364736
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5560.406275215905,
        "bandwidth_mbps_min": 5404.509902166293,
        "bandwidth_mbps_max": 5809.893537513785,
        "bandwidth_mbps_stddev": 178.2384430374064,
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
    "vcpus": 48,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 27013.055774063843,
      "avg_latency_ms": 0.5920466956542908,
      "p50_latency_ms": 0.6166422979709721,
      "p90_latency_ms": 0.9587729807185338,
      "p99_latency_ms": 1.9039364902676932,
      "p999_latency_ms": 2.8853365502432875,
      "status_codes": {
        "200": 2431220
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.12xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 169971.26308297625,
        "tailscale": 27013.055774063843,
        "delta_pct": -84.1072806755124
      },
      "p50_latency": {
        "baseline_ms": 0.5043308970817598,
        "tailscale_ms": 0.6166422979709721,
        "delta_pct": 22.26938732865397
      },
      "p99_latency": {
        "baseline_ms": 0.9585626080269649,
        "tailscale_ms": 1.9039364902676932,
        "delta_pct": 98.62411430658835
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.12xlarge-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 48,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 25840.173414295772,
      "avg_latency_ms": 0.6188885460319611,
      "p50_latency_ms": 0.6279626682122393,
      "p90_latency_ms": 0.9602960601743403,
      "p99_latency_ms": 1.8546760794470867,
      "p999_latency_ms": 2.6887225639171692,
      "status_codes": {
        "200": 2325653
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.12xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 89501.17222844485,
        "tailscale": 25840.173414295772,
        "delta_pct": -71.1286760039961
      },
      "p50_latency": {
        "baseline_ms": 0.5264648008744203,
        "tailscale_ms": 0.6279626682122393,
        "delta_pct": 19.279136453042707
      },
      "p99_latency": {
        "baseline_ms": 0.9907157782708661,
        "tailscale_ms": 1.8546760794470867,
        "delta_pct": 87.20566686483214
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.12xlarge-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 48,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.156",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.156",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.1,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37854.380488286166,
          "retransmits": 0,
          "duration_sec": 30.00126,
          "bytes_transferred": 141959888896
        },
        {
          "bandwidth_mbps": 37819.49359134865,
          "retransmits": 0,
          "duration_sec": 30.00132,
          "bytes_transferred": 141829341184
        },
        {
          "bandwidth_mbps": 37777.76775295438,
          "retransmits": 0,
          "duration_sec": 30.00126,
          "bytes_transferred": 141672579072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37817.2139441964,
        "bandwidth_mbps_min": 37777.76775295438,
        "bandwidth_mbps_max": 37854.380488286166,
        "bandwidth_mbps_stddev": 31.318529096033522,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9480.27101267099,
          "retransmits": 0,
          "duration_sec": 30.001136,
          "bytes_transferred": 35552362496
        },
        {
          "bandwidth_mbps": 9399.78088290547,
          "retransmits": 0,
          "duration_sec": 30.001128,
          "bytes_transferred": 35250503680
        },
        {
          "bandwidth_mbps": 9421.68681812417,
          "retransmits": 0,
          "duration_sec": 30.001155,
          "bytes_transferred": 35332685824
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9433.912904566876,
        "bandwidth_mbps_min": 9399.78088290547,
        "bandwidth_mbps_max": 9480.27101267099,
        "bandwidth_mbps_stddev": 33.978161022397444,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "aws",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c8gn",
    "instance_type": "c8gn.16xlarge",
    "kernel_version": "6.17.0-1009-aws",
    "overhead": {
      "bandwidth_pct": 83.62490675566578,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 41.542877885307504,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.16xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-156 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.96.78.100",
      "hops": [
        {
          "hop": 1,
          "host": "100.96.78.100",
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
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6099.831433836348,
          "retransmits": 0,
          "duration_sec": 30.001276,
          "bytes_transferred": 22875340800
        },
        {
          "bandwidth_mbps": 6175.504361033941,
          "retransmits": 0,
          "duration_sec": 30.001257,
          "bytes_transferred": 23159111680
        },
        {
          "bandwidth_mbps": 6302.4763424443,
          "retransmits": 0,
          "duration_sec": 30.001282,
          "bytes_transferred": 23635296256
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6192.604045771529,
        "bandwidth_mbps_min": 6099.831433836348,
        "bandwidth_mbps_max": 6302.4763424443,
        "bandwidth_mbps_stddev": 83.60836943661799,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5657.9993486255125,
          "retransmits": 0,
          "duration_sec": 30.001175,
          "bytes_transferred": 21218328576
        },
        {
          "bandwidth_mbps": 5438.99789051497,
          "retransmits": 0,
          "duration_sec": 30.001161,
          "bytes_transferred": 20397031424
        },
        {
          "bandwidth_mbps": 5447.384721308693,
          "retransmits": 0,
          "duration_sec": 30.001169,
          "bytes_transferred": 20428488704
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5514.793986816392,
        "bandwidth_mbps_min": 5438.99789051497,
        "bandwidth_mbps_max": 5657.9993486255125,
        "bandwidth_mbps_stddev": 101.31935146144428,
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
    "vcpus": 64,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 29061.177284040255,
      "avg_latency_ms": 0.5503115359032017,
      "p50_latency_ms": 0.6011442160346666,
      "p90_latency_ms": 0.9448881107261972,
      "p99_latency_ms": 1.7701356574134923,
      "p999_latency_ms": 2.6054642362176916,
      "status_codes": {
        "200": 2615540
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.16xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 185316.34776785973,
        "tailscale": 29061.177284040255,
        "delta_pct": -84.31807143078153
      },
      "p50_latency": {
        "baseline_ms": 0.515003145072569,
        "tailscale_ms": 0.6011442160346666,
        "delta_pct": 16.726319399459115
      },
      "p99_latency": {
        "baseline_ms": 0.9903021515801053,
        "tailscale_ms": 1.7701356574134923,
        "delta_pct": 78.74702731778387
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.16xlarge-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 64,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 26913.822780049242,
      "avg_latency_ms": 0.5942075825570429,
      "p50_latency_ms": 0.6243444963287214,
      "p90_latency_ms": 0.9534187752037244,
      "p99_latency_ms": 1.7859169021558785,
      "p999_latency_ms": 2.0096118875254856,
      "status_codes": {
        "200": 2422313
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.16xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 90822.4025958443,
        "tailscale": 26913.822780049242,
        "delta_pct": -70.36653731809477
      },
      "p50_latency": {
        "baseline_ms": 0.5245713397271127,
        "tailscale_ms": 0.6243444963287214,
        "delta_pct": 19.019940481977475
      },
      "p99_latency": {
        "baseline_ms": 0.9909298419306367,
        "tailscale_ms": 1.7859169021558785,
        "delta_pct": 80.22637189696114
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.16xlarge-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 64,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.31",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.31",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.1,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37834.89508932188,
          "retransmits": 0,
          "duration_sec": 30.001274,
          "bytes_transferred": 141886881792
        },
        {
          "bandwidth_mbps": 37779.93376845545,
          "retransmits": 0,
          "duration_sec": 30.001233,
          "bytes_transferred": 141680574464
        },
        {
          "bandwidth_mbps": 37747.852858039914,
          "retransmits": 0,
          "duration_sec": 30.001313,
          "bytes_transferred": 141560643584
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37787.56057193908,
        "bandwidth_mbps_min": 37747.852858039914,
        "bandwidth_mbps_max": 37834.89508932188,
        "bandwidth_mbps_stddev": 35.941745507317926,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9448.983695727715,
          "retransmits": 0,
          "duration_sec": 30.001155,
          "bytes_transferred": 35435053056
        },
        {
          "bandwidth_mbps": 9456.82379431168,
          "retransmits": 0,
          "duration_sec": 30.00112,
          "bytes_transferred": 35464413184
        },
        {
          "bandwidth_mbps": 9413.229571984437,
          "retransmits": 0,
          "duration_sec": 30.001152,
          "bytes_transferred": 35300966400
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9439.67902067461,
        "bandwidth_mbps_min": 9413.229571984437,
        "bandwidth_mbps_max": 9456.82379431168,
        "bandwidth_mbps_stddev": 18.974487932698327,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "aws",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c8gn",
    "instance_type": "c8gn.24xlarge",
    "kernel_version": "6.17.0-1009-aws",
    "overhead": {
      "bandwidth_pct": 83.21603771439182,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 42.89666855281838,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.24xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-31 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.106.1.7",
      "hops": [
        {
          "hop": 1,
          "host": "100.106.1.7",
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
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6331.513468180918,
          "retransmits": 0,
          "duration_sec": 30.000488,
          "bytes_transferred": 23743561728
        },
        {
          "bandwidth_mbps": 6293.84721177081,
          "retransmits": 0,
          "duration_sec": 30.001264,
          "bytes_transferred": 23602921472
        },
        {
          "bandwidth_mbps": 6401.389065185094,
          "retransmits": 0,
          "duration_sec": 30.001276,
          "bytes_transferred": 24006230016
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6342.249915045607,
        "bandwidth_mbps_min": 6293.84721177081,
        "bandwidth_mbps_max": 6401.389065185094,
        "bandwidth_mbps_stddev": 44.55532910441124,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5511.000812969052,
          "retransmits": 0,
          "duration_sec": 30.001142,
          "bytes_transferred": 20667039744
        },
        {
          "bandwidth_mbps": 5266.410364428328,
          "retransmits": 0,
          "duration_sec": 30.001153,
          "bytes_transferred": 19749797888
        },
        {
          "bandwidth_mbps": 5393.70241878029,
          "retransmits": 0,
          "duration_sec": 30.001154,
          "bytes_transferred": 20227162112
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5390.37119872589,
        "bandwidth_mbps_min": 5266.410364428328,
        "bandwidth_mbps_max": 5511.000812969052,
        "bandwidth_mbps_stddev": 99.88141184967411,
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
    "vcpus": 96,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 29202.897299181237,
      "avg_latency_ms": 0.5476429565370183,
      "p50_latency_ms": 0.6040022243236104,
      "p90_latency_ms": 0.9446914482022543,
      "p99_latency_ms": 1.7588071778553294,
      "p999_latency_ms": 2.541989411629211,
      "status_codes": {
        "200": 2628307
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.24xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 163434.62130546756,
        "tailscale": 29202.897299181237,
        "delta_pct": -82.13175576513892
      },
      "p50_latency": {
        "baseline_ms": 0.5148094314824644,
        "tailscale_ms": 0.6040022243236104,
        "delta_pct": 17.325399922123243
      },
      "p99_latency": {
        "baseline_ms": 0.990370728398093,
        "tailscale_ms": 1.7588071778553294,
        "delta_pct": 77.5907877144318
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.24xlarge-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 96,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 27363.725449327685,
      "avg_latency_ms": 0.5844391629109503,
      "p50_latency_ms": 0.6309591921072436,
      "p90_latency_ms": 0.9533726646544133,
      "p99_latency_ms": 1.802941786688636,
      "p999_latency_ms": 2.5728471922470164,
      "status_codes": {
        "200": 2462813
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.24xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 77804.27320535458,
        "tailscale": 27363.725449327685,
        "delta_pct": -64.83004811688868
      },
      "p50_latency": {
        "baseline_ms": 0.5307324167902592,
        "tailscale_ms": 0.6309591921072436,
        "delta_pct": 18.88461532520128
      },
      "p99_latency": {
        "baseline_ms": 0.9912152934550024,
        "tailscale_ms": 1.802941786688636,
        "delta_pct": 81.89204692395951
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.24xlarge-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 96,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.116",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.116",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.1,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37898.23981431803,
          "retransmits": 0,
          "duration_sec": 30.000544,
          "bytes_transferred": 142120976384
        },
        {
          "bandwidth_mbps": 37768.022402508584,
          "retransmits": 0,
          "duration_sec": 30.001283,
          "bytes_transferred": 141636141056
        },
        {
          "bandwidth_mbps": 37838.6653810461,
          "retransmits": 0,
          "duration_sec": 30.000557,
          "bytes_transferred": 141897629696
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37834.97586595757,
        "bandwidth_mbps_min": 37768.022402508584,
        "bandwidth_mbps_max": 37898.23981431803,
        "bandwidth_mbps_stddev": 53.22501276517273,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9460.11609705462,
          "retransmits": 0,
          "duration_sec": 30.001209,
          "bytes_transferred": 35476865024
        },
        {
          "bandwidth_mbps": 9457.32063871319,
          "retransmits": 0,
          "duration_sec": 30.00032,
          "bytes_transferred": 35465330688
        },
        {
          "bandwidth_mbps": 9454.262557355089,
          "retransmits": 0,
          "duration_sec": 30.001262,
          "bytes_transferred": 35454976000
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9457.233097707634,
        "bandwidth_mbps_min": 9454.262557355089,
        "bandwidth_mbps_max": 9460.11609705462,
        "bandwidth_mbps_stddev": 2.3904991562767974,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "aws",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c8gn",
    "instance_type": "c8gn.2xlarge",
    "kernel_version": "6.17.0-1009-aws",
    "overhead": {
      "bandwidth_pct": 85.95779057231034,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 45.79702616477191,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.2xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-116 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.82.232.33",
      "hops": [
        {
          "hop": 1,
          "host": "100.82.232.33",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.1,
          "worst_ms": 0.3,
          "stdev_ms": 0
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5326.345086444904,
          "retransmits": 0,
          "duration_sec": 30.00119,
          "bytes_transferred": 19974586368
        },
        {
          "bandwidth_mbps": 5318.777503793386,
          "retransmits": 0,
          "duration_sec": 30.000898,
          "bytes_transferred": 19946012672
        },
        {
          "bandwidth_mbps": 5293.477053802513,
          "retransmits": 0,
          "duration_sec": 30.001071,
          "bytes_transferred": 19851247616
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5312.8665480136015,
        "bandwidth_mbps_min": 5293.477053802513,
        "bandwidth_mbps_max": 5326.345086444904,
        "bandwidth_mbps_stddev": 14.054215052627443,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5134.77397652047,
          "retransmits": 0,
          "duration_sec": 30.0006,
          "bytes_transferred": 19255787520
        },
        {
          "bandwidth_mbps": 5079.256919243164,
          "retransmits": 0,
          "duration_sec": 30.00068,
          "bytes_transferred": 19047645184
        },
        {
          "bandwidth_mbps": 5164.273848697368,
          "retransmits": 0,
          "duration_sec": 30.0008,
          "bytes_transferred": 19366543360
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5126.101581487001,
        "bandwidth_mbps_min": 5079.256919243164,
        "bandwidth_mbps_max": 5164.273848697368,
        "bandwidth_mbps_stddev": 35.24558979662254,
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
    "vcpus": 8,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 22316.77270637078,
      "avg_latency_ms": 0.7165792173002358,
      "p50_latency_ms": 0.652190449058625,
      "p90_latency_ms": 1.266086894003219,
      "p99_latency_ms": 1.9344244797160264,
      "p999_latency_ms": 2.162246427789155,
      "status_codes": {
        "200": 1339037
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.2xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 191167.20121440626,
        "tailscale": 22316.77270637078,
        "delta_pct": -88.32604517689147
      },
      "p50_latency": {
        "baseline_ms": 0.514937162827766,
        "tailscale_ms": 0.652190449058625,
        "delta_pct": 26.654375745020147
      },
      "p99_latency": {
        "baseline_ms": 0.9903038015699644,
        "tailscale_ms": 1.9344244797160264,
        "delta_pct": 95.33646913697729
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.2xlarge-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 8,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 20529.963706037506,
      "avg_latency_ms": 0.7789789473786239,
      "p50_latency_ms": 0.699435508428213,
      "p90_latency_ms": 1.476702999551376,
      "p99_latency_ms": 1.9591200108965712,
      "p999_latency_ms": 2.62857847278369,
      "status_codes": {
        "200": 1847724
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.2xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 69896.1229152194,
        "tailscale": 20529.963706037506,
        "delta_pct": -70.62789343703749
      },
      "p50_latency": {
        "baseline_ms": 0.5239314161832667,
        "tailscale_ms": 0.699435508428213,
        "delta_pct": 33.49753170433218
      },
      "p99_latency": {
        "baseline_ms": 0.9911201563092481,
        "tailscale_ms": 1.9591200108965712,
        "delta_pct": 97.66725542057173
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.2xlarge-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 8,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.89",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.89",
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
          "bandwidth_mbps": 37439.81345712674,
          "retransmits": 0,
          "duration_sec": 30.001382,
          "bytes_transferred": 140405768192
        },
        {
          "bandwidth_mbps": 37783.86049422135,
          "retransmits": 0,
          "duration_sec": 30.000363,
          "bytes_transferred": 141691191296
        },
        {
          "bandwidth_mbps": 37757.58822207317,
          "retransmits": 0,
          "duration_sec": 30.001409,
          "bytes_transferred": 141597605888
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37660.420724473755,
        "bandwidth_mbps_min": 37439.81345712674,
        "bandwidth_mbps_max": 37783.86049422135,
        "bandwidth_mbps_stddev": 156.36119057211837,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9456.05203057525,
          "retransmits": 0,
          "duration_sec": 30.001129,
          "bytes_transferred": 35461529600
        },
        {
          "bandwidth_mbps": 9436.84871350214,
          "retransmits": 0,
          "duration_sec": 30.001177,
          "bytes_transferred": 35389571072
        },
        {
          "bandwidth_mbps": 9422.494464294245,
          "retransmits": 0,
          "duration_sec": 30.001143,
          "bytes_transferred": 35335700480
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9438.465069457212,
        "bandwidth_mbps_min": 9422.494464294245,
        "bandwidth_mbps_max": 9456.05203057525,
        "bandwidth_mbps_stddev": 13.747412328777855,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "aws",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c8gn",
    "instance_type": "c8gn.48xlarge",
    "kernel_version": "6.17.0-1009-aws",
    "overhead": {
      "bandwidth_pct": 86.36633985888072,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 48.93385460764241,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.48xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-89 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.123.234.82",
      "hops": [
        {
          "hop": 1,
          "host": "100.123.234.82",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.5,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5411.304069300178,
          "retransmits": 0,
          "duration_sec": 30.001424,
          "bytes_transferred": 20293353472
        },
        {
          "bandwidth_mbps": 4911.431425994792,
          "retransmits": 318,
          "duration_sec": 30.001456,
          "bytes_transferred": 18418761728
        },
        {
          "bandwidth_mbps": 5080.745812576234,
          "retransmits": 0,
          "duration_sec": 30.001382,
          "bytes_transferred": 19053674496
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5134.493769290401,
        "bandwidth_mbps_min": 4911.431425994792,
        "bandwidth_mbps_max": 5411.304069300178,
        "bandwidth_mbps_stddev": 207.58098342492622,
        "retransmits_avg": 106
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5005.695923041032,
          "retransmits": 0,
          "duration_sec": 30.001234,
          "bytes_transferred": 18772131840
        },
        {
          "bandwidth_mbps": 4679.98900231354,
          "retransmits": 0,
          "duration_sec": 30.001219,
          "bytes_transferred": 17550671872
        },
        {
          "bandwidth_mbps": 4773.895960173139,
          "retransmits": 0,
          "duration_sec": 30.001261,
          "bytes_transferred": 17902862336
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4819.860295175905,
        "bandwidth_mbps_min": 4679.98900231354,
        "bandwidth_mbps_max": 5005.695923041032,
        "bandwidth_mbps_stddev": 136.8838671322785,
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
    "vcpus": 192,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 22583.386152887546,
      "avg_latency_ms": 0.7081839708033959,
      "p50_latency_ms": 0.6388513505167697,
      "p90_latency_ms": 0.9856379879771143,
      "p99_latency_ms": 3.031254062970836,
      "p999_latency_ms": 4.860156387883253,
      "status_codes": {
        "200": 2032547
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.48xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 145144.15541517848,
        "tailscale": 22583.386152887546,
        "delta_pct": -84.44071958096504
      },
      "p50_latency": {
        "baseline_ms": 0.5218602616198794,
        "tailscale_ms": 0.6388513505167697,
        "delta_pct": 22.418087273735747
      },
      "p99_latency": {
        "baseline_ms": 0.9918233272984365,
        "tailscale_ms": 3.031254062970836,
        "delta_pct": 205.62439696064354
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.48xlarge-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 192,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 23203.288569767596,
      "avg_latency_ms": 0.6895567917362309,
      "p50_latency_ms": 0.6582744076829424,
      "p90_latency_ms": 0.9860775428728732,
      "p99_latency_ms": 2.478077535436655,
      "p999_latency_ms": 3.7460808117911015,
      "status_codes": {
        "200": 2088347
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.48xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 63323.32933229464,
        "tailscale": 23203.288569767596,
        "delta_pct": -63.35744059190834
      },
      "p50_latency": {
        "baseline_ms": 0.5387070431445654,
        "tailscale_ms": 0.6582744076829424,
        "delta_pct": 22.195248059210982
      },
      "p99_latency": {
        "baseline_ms": 1.3417771931840399,
        "tailscale_ms": 2.478077535436655,
        "delta_pct": 84.68621675974177
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.48xlarge-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 192,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.234",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.234",
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
          "bandwidth_mbps": 37766.33342324057,
          "retransmits": 0,
          "duration_sec": 30.001292,
          "bytes_transferred": 141629849600
        },
        {
          "bandwidth_mbps": 37942.18423235519,
          "retransmits": 0,
          "duration_sec": 30.00131,
          "bytes_transferred": 142289403904
        },
        {
          "bandwidth_mbps": 37884.359663076895,
          "retransmits": 0,
          "duration_sec": 30.001267,
          "bytes_transferred": 142072348672
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37864.292439557554,
        "bandwidth_mbps_min": 37766.33342324057,
        "bandwidth_mbps_max": 37942.18423235519,
        "bandwidth_mbps_stddev": 73.1796732314752,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9452.082379257385,
          "retransmits": 0,
          "duration_sec": 30.001193,
          "bytes_transferred": 35446718464
        },
        {
          "bandwidth_mbps": 9421.463607419944,
          "retransmits": 0,
          "duration_sec": 30.001198,
          "bytes_transferred": 35331899392
        },
        {
          "bandwidth_mbps": 9454.60138271205,
          "retransmits": 0,
          "duration_sec": 30.001185,
          "bytes_transferred": 35456155648
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9442.715789796459,
        "bandwidth_mbps_min": 9421.463607419944,
        "bandwidth_mbps_max": 9454.60138271205,
        "bandwidth_mbps_stddev": 15.06270861929446,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "aws",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c8gn",
    "instance_type": "c8gn.4xlarge",
    "kernel_version": "6.17.0-1009-aws",
    "overhead": {
      "bandwidth_pct": 84.29498228099251,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 42.84619833791311,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.4xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-234 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.109.134.68",
      "hops": [
        {
          "hop": 1,
          "host": "100.109.134.68",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.4,
          "stdev_ms": 0
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5930.898989035392,
          "retransmits": 0,
          "duration_sec": 30.001347,
          "bytes_transferred": 22241869824
        },
        {
          "bandwidth_mbps": 5945.3591759983165,
          "retransmits": 0,
          "duration_sec": 30.001395,
          "bytes_transferred": 22296133632
        },
        {
          "bandwidth_mbps": 5963.523345394267,
          "retransmits": 0,
          "duration_sec": 30.001271,
          "bytes_transferred": 22364160000
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5946.593836809326,
        "bandwidth_mbps_min": 5930.898989035392,
        "bandwidth_mbps_max": 5963.523345394267,
        "bandwidth_mbps_stddev": 13.34742041111062,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5384.95295461161,
          "retransmits": 0,
          "duration_sec": 30.001219,
          "bytes_transferred": 20194394112
        },
        {
          "bandwidth_mbps": 5420.71209907765,
          "retransmits": 0,
          "duration_sec": 30.001196,
          "bytes_transferred": 20328480768
        },
        {
          "bandwidth_mbps": 5384.948108355233,
          "retransmits": 0,
          "duration_sec": 30.001246,
          "bytes_transferred": 20194394112
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5396.87105401483,
        "bandwidth_mbps_min": 5384.948108355233,
        "bandwidth_mbps_max": 5420.71209907765,
        "bandwidth_mbps_stddev": 16.858164750590596,
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
    "vcpus": 16,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 22453.59372130794,
      "avg_latency_ms": 0.7122965501303762,
      "p50_latency_ms": 0.6624786241623043,
      "p90_latency_ms": 1.3240591801240047,
      "p99_latency_ms": 2.0929997557747857,
      "p999_latency_ms": 2.9819209284798363,
      "status_codes": {
        "200": 2020856
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.4xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 199405.0101186192,
        "tailscale": 22453.59372130794,
        "delta_pct": -88.73970432941928
      },
      "p50_latency": {
        "baseline_ms": 0.4773204785154444,
        "tailscale_ms": 0.6624786241623043,
        "delta_pct": 38.79115897619482
      },
      "p99_latency": {
        "baseline_ms": 0.9149645936833025,
        "tailscale_ms": 2.0929997557747857,
        "delta_pct": 128.751994363974
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.4xlarge-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 16,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 23083.637248090352,
      "avg_latency_ms": 0.6928055663818548,
      "p50_latency_ms": 0.6650214796460928,
      "p90_latency_ms": 1.2495199619199995,
      "p99_latency_ms": 2.1963425107101777,
      "p999_latency_ms": 3.31665425879323,
      "status_codes": {
        "200": 2077557
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.4xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 68490.39913048288,
        "tailscale": 23083.637248090352,
        "delta_pct": -66.29653565879636
      },
      "p50_latency": {
        "baseline_ms": 0.5304245625298123,
        "tailscale_ms": 0.6650214796460928,
        "delta_pct": 25.375317552100647
      },
      "p99_latency": {
        "baseline_ms": 0.9907831755309319,
        "tailscale_ms": 2.1963425107101777,
        "delta_pct": 121.67741287423675
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.4xlarge-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 16,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.188",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.188",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.1,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37833.43813614966,
          "retransmits": 0,
          "duration_sec": 30.001293,
          "bytes_transferred": 141881507840
        },
        {
          "bandwidth_mbps": 37791.37157680673,
          "retransmits": 0,
          "duration_sec": 30.001337,
          "bytes_transferred": 141723959296
        },
        {
          "bandwidth_mbps": 37823.224871963044,
          "retransmits": 0,
          "duration_sec": 30.001299,
          "bytes_transferred": 141843234816
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37816.01152830648,
        "bandwidth_mbps_min": 37791.37157680673,
        "bandwidth_mbps_max": 37833.43813614966,
        "bandwidth_mbps_stddev": 17.91504207398529,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9465.54456408939,
          "retransmits": 0,
          "duration_sec": 30.001174,
          "bytes_transferred": 35497181184
        },
        {
          "bandwidth_mbps": 9480.332383114615,
          "retransmits": 0,
          "duration_sec": 30.001163,
          "bytes_transferred": 35552624640
        },
        {
          "bandwidth_mbps": 9466.140942584,
          "retransmits": 0,
          "duration_sec": 30.001167,
          "bytes_transferred": 35499409408
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9470.672629929335,
        "bandwidth_mbps_min": 9465.54456408939,
        "bandwidth_mbps_max": 9480.332383114615,
        "bandwidth_mbps_stddev": 6.834814824490293,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "aws",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c8gn",
    "instance_type": "c8gn.8xlarge",
    "kernel_version": "6.17.0-1009-aws",
    "overhead": {
      "bandwidth_pct": 85.14131416118131,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 42.187113206334274,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.8xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-188 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.107.22.27",
      "hops": [
        {
          "hop": 1,
          "host": "100.107.22.27",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.1,
          "worst_ms": 0.3,
          "stdev_ms": 0
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5653.544742312274,
          "retransmits": 0,
          "duration_sec": 30.000517,
          "bytes_transferred": 21201158144
        },
        {
          "bandwidth_mbps": 5554.455115227262,
          "retransmits": 0,
          "duration_sec": 30.001277,
          "bytes_transferred": 20830093312
        },
        {
          "bandwidth_mbps": 5648.887191748013,
          "retransmits": 0,
          "duration_sec": 30.001307,
          "bytes_transferred": 21184249856
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5618.962349762517,
        "bandwidth_mbps_min": 5554.455115227262,
        "bandwidth_mbps_max": 5653.544742312274,
        "bandwidth_mbps_stddev": 45.65311727110882,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5490.016366736057,
          "retransmits": 0,
          "duration_sec": 30.001217,
          "bytes_transferred": 20588396544
        },
        {
          "bandwidth_mbps": 5497.674692491416,
          "retransmits": 0,
          "duration_sec": 30.001195,
          "bytes_transferred": 20617101312
        },
        {
          "bandwidth_mbps": 5438.11667919172,
          "retransmits": 0,
          "duration_sec": 30.001202,
          "bytes_transferred": 20393754624
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5475.269246139731,
        "bandwidth_mbps_min": 5438.11667919172,
        "bandwidth_mbps_max": 5497.674692491416,
        "bandwidth_mbps_stddev": 26.456220585004324,
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
    "vcpus": 32,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 23974.687353704707,
      "avg_latency_ms": 0.6671359574172916,
      "p50_latency_ms": 0.6403357821193368,
      "p90_latency_ms": 1.0166797681985515,
      "p99_latency_ms": 2.233041470936651,
      "p999_latency_ms": 2.987688496422725,
      "status_codes": {
        "200": 2157768
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.8xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 181458.21724580452,
        "tailscale": 23974.687353704707,
        "delta_pct": -86.78776430321233
      },
      "p50_latency": {
        "baseline_ms": 0.42082104404655546,
        "tailscale_ms": 0.6403357821193368,
        "delta_pct": 52.16344124855515
      },
      "p99_latency": {
        "baseline_ms": 0.8026501339025437,
        "tailscale_ms": 2.233041470936651,
        "delta_pct": 178.20857140824734
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.8xlarge-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 32,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 23328.902604952833,
      "avg_latency_ms": 0.6855439473326466,
      "p50_latency_ms": 0.652820646952763,
      "p90_latency_ms": 0.9913506653378968,
      "p99_latency_ms": 1.9777897702686849,
      "p999_latency_ms": 2.9209665894194283,
      "status_codes": {
        "200": 2099643
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.8xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 78405.7220217775,
        "tailscale": 23328.902604952833,
        "delta_pct": -70.24591827816707
      },
      "p50_latency": {
        "baseline_ms": 0.529413260436791,
        "tailscale_ms": 0.652820646952763,
        "delta_pct": 23.31021826203503
      },
      "p99_latency": {
        "baseline_ms": 0.990700561408162,
        "tailscale_ms": 1.9777897702686849,
        "delta_pct": 99.63547486613857
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.8xlarge-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 32,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.91",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.91",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.1,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 29763.60507608278,
          "retransmits": 0,
          "duration_sec": 30.000614,
          "bytes_transferred": 111615803392
        },
        {
          "bandwidth_mbps": 29792.91475522063,
          "retransmits": 0,
          "duration_sec": 30.000629,
          "bytes_transferred": 111725772800
        },
        {
          "bandwidth_mbps": 29703.692315876735,
          "retransmits": 0,
          "duration_sec": 30.00069,
          "bytes_transferred": 111391408128
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 29753.404049060046,
        "bandwidth_mbps_min": 29703.692315876735,
        "bandwidth_mbps_max": 29792.91475522063,
        "bandwidth_mbps_stddev": 37.13225583287965,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9533.351438847807,
          "retransmits": 0,
          "duration_sec": 30.000289,
          "bytes_transferred": 35750412288
        },
        {
          "bandwidth_mbps": 9478.02706878832,
          "retransmits": 0,
          "duration_sec": 30.001269,
          "bytes_transferred": 35544104960
        },
        {
          "bandwidth_mbps": 9446.339677694976,
          "retransmits": 0,
          "duration_sec": 30.000339,
          "bytes_transferred": 35424174080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9485.906061777036,
        "bandwidth_mbps_min": 9446.339677694976,
        "bandwidth_mbps_max": 9533.351438847807,
        "bandwidth_mbps_stddev": 35.956645585264596,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "aws",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c8gn",
    "instance_type": "c8gn.large",
    "kernel_version": "6.17.0-1009-aws",
    "overhead": {
      "bandwidth_pct": 88.23524598335666,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 68.48973832749465,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.large-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-91 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.110.107.34",
      "hops": [
        {
          "hop": 1,
          "host": "100.110.107.34",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.4,
          "stdev_ms": 0
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3512.4837747178412,
          "retransmits": 0,
          "duration_sec": 30.001204,
          "bytes_transferred": 13172342784
        },
        {
          "bandwidth_mbps": 3505.138698922813,
          "retransmits": 0,
          "duration_sec": 30.001848,
          "bytes_transferred": 13145079808
        },
        {
          "bandwidth_mbps": 3483.62192020909,
          "retransmits": 0,
          "duration_sec": 30.000535,
          "bytes_transferred": 13063815168
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3500.4147979499153,
        "bandwidth_mbps_min": 3483.62192020909,
        "bandwidth_mbps_max": 3512.4837747178412,
        "bandwidth_mbps_stddev": 12.247124607362355,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2946.222919678089,
          "retransmits": 0,
          "duration_sec": 30.001739,
          "bytes_transferred": 11048976384
        },
        {
          "bandwidth_mbps": 3003.1594510389273,
          "retransmits": 0,
          "duration_sec": 30.00067,
          "bytes_transferred": 11262099456
        },
        {
          "bandwidth_mbps": 3017.7190955049577,
          "retransmits": 0,
          "duration_sec": 30.000474,
          "bytes_transferred": 11316625408
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2989.033822073991,
        "bandwidth_mbps_min": 2946.222919678089,
        "bandwidth_mbps_max": 3017.7190955049577,
        "bandwidth_mbps_stddev": 30.84991447538559,
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
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 8140.063253269441,
      "avg_latency_ms": 1.9651164504949357,
      "p50_latency_ms": 1.900787127525504,
      "p90_latency_ms": 2.932611575564557,
      "p99_latency_ms": 4.596198823443142,
      "p999_latency_ms": 6.442682632043162,
      "status_codes": {
        "200": 732638
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.large",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 104534.43953703374,
        "tailscale": 8140.063253269441,
        "delta_pct": -92.21303209801432
      },
      "p50_latency": {
        "baseline_ms": 0.5167144983586037,
        "tailscale_ms": 1.900787127525504,
        "delta_pct": 267.8602271783641
      },
      "p99_latency": {
        "baseline_ms": 0.9957654256052638,
        "tailscale_ms": 4.596198823443142,
        "delta_pct": 361.57445370724724
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.large-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 2,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 7154.353754817143,
      "avg_latency_ms": 2.235903967453412,
      "p50_latency_ms": 2.2205175577382064,
      "p90_latency_ms": 3.3492038758070444,
      "p99_latency_ms": 4.950355639442148,
      "p999_latency_ms": 6.8414953841564925,
      "status_codes": {
        "200": 643934
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.large",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 37792.474108713686,
        "tailscale": 7154.353754817143,
        "delta_pct": -81.06936917060005
      },
      "p50_latency": {
        "baseline_ms": 0.5623590849657089,
        "tailscale_ms": 2.2205175577382064,
        "delta_pct": 294.857594925066
      },
      "p99_latency": {
        "baseline_ms": 1.8918740729763366,
        "tailscale_ms": 4.950355639442148,
        "delta_pct": 161.66411972939315
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.large-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 2,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.65",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.65",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.1,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 24826.769790125974,
          "retransmits": 0,
          "duration_sec": 30.002045,
          "bytes_transferred": 93106733056
        },
        {
          "bandwidth_mbps": 24796.38390460586,
          "retransmits": 0,
          "duration_sec": 30.001005,
          "bytes_transferred": 92989554688
        },
        {
          "bandwidth_mbps": 24751.058219822116,
          "retransmits": 3,
          "duration_sec": 30.001294,
          "bytes_transferred": 92820471808
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24791.403971517982,
        "bandwidth_mbps_min": 24751.058219822116,
        "bandwidth_mbps_max": 24826.769790125974,
        "bandwidth_mbps_stddev": 31.109058376822276,
        "retransmits_avg": 1
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9477.425396955236,
          "retransmits": 0,
          "duration_sec": 30.000297,
          "bytes_transferred": 35540697088
        },
        {
          "bandwidth_mbps": 9439.444955154884,
          "retransmits": 0,
          "duration_sec": 30.000257,
          "bytes_transferred": 35398221824
        },
        {
          "bandwidth_mbps": 9434.95094149159,
          "retransmits": 0,
          "duration_sec": 30.000321,
          "bytes_transferred": 35381444608
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9450.607097867236,
        "bandwidth_mbps_min": 9434.95094149159,
        "bandwidth_mbps_max": 9477.425396955236,
        "bandwidth_mbps_stddev": 19.051945030739724,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "aws",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c8gn",
    "instance_type": "c8gn.medium",
    "kernel_version": "6.17.0-1009-aws",
    "overhead": {
      "bandwidth_pct": 92.28600901642714,
      "retransmits_pct": 100
    },
    "overhead_single": {
      "bandwidth_pct": 78.68140367609118,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.medium-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-65 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.110.132.15",
      "hops": [
        {
          "hop": 1,
          "host": "100.110.132.15",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.3,
          "best_ms": 0.2,
          "worst_ms": 0.4,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1924.6872060421285,
          "retransmits": 0,
          "duration_sec": 30.000685,
          "bytes_transferred": 7217741824
        },
        {
          "bandwidth_mbps": 1924.096359682943,
          "retransmits": 0,
          "duration_sec": 30.001178,
          "bytes_transferred": 7215644672
        },
        {
          "bandwidth_mbps": 1888.4364354669945,
          "retransmits": 0,
          "duration_sec": 30.001888,
          "bytes_transferred": 7082082304
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1912.406667064022,
        "bandwidth_mbps_min": 1888.4364354669945,
        "bandwidth_mbps_max": 1924.6872060421285,
        "bandwidth_mbps_stddev": 16.951229590925355,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1996.868958512352,
          "retransmits": 0,
          "duration_sec": 30.002689,
          "bytes_transferred": 7488929792
        },
        {
          "bandwidth_mbps": 2025.3733662702,
          "retransmits": 0,
          "duration_sec": 30.00083,
          "bytes_transferred": 7595360256
        },
        {
          "bandwidth_mbps": 2021.9680072764186,
          "retransmits": 0,
          "duration_sec": 30.001572,
          "bytes_transferred": 7582777344
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2014.7367773529902,
        "bandwidth_mbps_min": 1996.868958512352,
        "bandwidth_mbps_max": 2025.3733662702,
        "bandwidth_mbps_stddev": 12.71071280614716,
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
    "vcpus": 1,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 4981.144625882681,
      "avg_latency_ms": 3.2115698467250646,
      "p50_latency_ms": 3.2391906239461883,
      "p90_latency_ms": 4.484571446682165,
      "p99_latency_ms": 6.467251997445569,
      "p999_latency_ms": 8.852999358129493,
      "status_codes": {
        "200": 448366
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.medium",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81748.88798736998,
        "tailscale": 4981.144625882681,
        "delta_pct": -93.90677384302494
      },
      "p50_latency": {
        "baseline_ms": 0.5138219450973611,
        "tailscale_ms": 3.2391906239461883,
        "delta_pct": 530.4111093060483
      },
      "p99_latency": {
        "baseline_ms": 0.9908513269750455,
        "tailscale_ms": 6.467251997445569,
        "delta_pct": 552.6965066685979
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.medium-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 1,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 4399.126257720991,
      "avg_latency_ms": 3.6365315756442995,
      "p50_latency_ms": 3.643136771607933,
      "p90_latency_ms": 4.968259071355553,
      "p99_latency_ms": 6.995275882265244,
      "p999_latency_ms": 9.351560513238185,
      "status_codes": {
        "200": 395946
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.medium",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 30585.321672551345,
        "tailscale": 4399.126257720991,
        "delta_pct": -85.6168710441618
      },
      "p50_latency": {
        "baseline_ms": 0.6167392589842081,
        "tailscale_ms": 3.643136771607933,
        "delta_pct": 490.7093992375823
      },
      "p99_latency": {
        "baseline_ms": 1.9398155210784402,
        "tailscale_ms": 6.995275882265244,
        "delta_pct": 260.61552277797125
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.medium-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 1,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.51",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.51",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.1,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37813.5179104596,
          "retransmits": 0,
          "duration_sec": 30.000626,
          "bytes_transferred": 141803651072
        },
        {
          "bandwidth_mbps": 37825.07498563518,
          "retransmits": 0,
          "duration_sec": 30.000386,
          "bytes_transferred": 141845856256
        },
        {
          "bandwidth_mbps": 37862.155956927025,
          "retransmits": 0,
          "duration_sec": 30.000527,
          "bytes_transferred": 141985579008
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37833.582951007265,
        "bandwidth_mbps_min": 37813.5179104596,
        "bandwidth_mbps_max": 37862.155956927025,
        "bandwidth_mbps_stddev": 20.747754852373028,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9427.22237519376,
          "retransmits": 0,
          "duration_sec": 30.001224,
          "bytes_transferred": 35353526272
        },
        {
          "bandwidth_mbps": 9457.20601209857,
          "retransmits": 0,
          "duration_sec": 30.001238,
          "bytes_transferred": 35465986048
        },
        {
          "bandwidth_mbps": 9452.538634554694,
          "retransmits": 0,
          "duration_sec": 30.001187,
          "bytes_transferred": 35448422400
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9445.655673949008,
        "bandwidth_mbps_min": 9427.22237519376,
        "bandwidth_mbps_max": 9457.20601209857,
        "bandwidth_mbps_stddev": 13.172850375790313,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "aws",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c8gn",
    "instance_type": "c8gn.xlarge",
    "kernel_version": "6.17.0-1009-aws",
    "overhead": {
      "bandwidth_pct": 86.36387498413941,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 49.56947330697873,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux ip-10-0-1-51 6.17.0-1009-aws #9~24.04.2-Ubuntu SMP Fri Mar  6 23:26:57 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.109.90.1",
      "hops": [
        {
          "hop": 1,
          "host": "100.109.90.1",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.1,
          "worst_ms": 0.3,
          "stdev_ms": 0
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5179.606973939324,
          "retransmits": 0,
          "duration_sec": 30.001064,
          "bytes_transferred": 19424215040
        },
        {
          "bandwidth_mbps": 5142.286921850324,
          "retransmits": 0,
          "duration_sec": 30.000406,
          "bytes_transferred": 19283836928
        },
        {
          "bandwidth_mbps": 5155.21011174635,
          "retransmits": 27,
          "duration_sec": 30.001069,
          "bytes_transferred": 19332726784
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5159.034669178666,
        "bandwidth_mbps_min": 5142.286921850324,
        "bandwidth_mbps_max": 5179.606973939324,
        "bandwidth_mbps_stddev": 15.473999733881348,
        "retransmits_avg": 9
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4792.6629002942855,
          "retransmits": 0,
          "duration_sec": 30.000397,
          "bytes_transferred": 17972723712
        },
        {
          "bandwidth_mbps": 4750.359685251856,
          "retransmits": 0,
          "duration_sec": 30.00113,
          "bytes_transferred": 17814519808
        },
        {
          "bandwidth_mbps": 4747.459132399056,
          "retransmits": 0,
          "duration_sec": 30.000244,
          "bytes_transferred": 17803116544
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4763.4939059817325,
        "bandwidth_mbps_min": 4747.459132399056,
        "bandwidth_mbps_max": 4792.6629002942855,
        "bandwidth_mbps_stddev": 20.659557491506305,
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
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 15576.457765439043,
      "avg_latency_ms": 1.0267607325361148,
      "p50_latency_ms": 0.9889881956583091,
      "p90_latency_ms": 1.8373326611005563,
      "p99_latency_ms": 2.6959475836165527,
      "p999_latency_ms": 3.9588273336294413,
      "status_codes": {
        "200": 1401907
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 161716.39364343128,
        "tailscale": 15576.457765439043,
        "delta_pct": -90.36804036096453
      },
      "p50_latency": {
        "baseline_ms": 0.5144104311816003,
        "tailscale_ms": 0.9889881956583091,
        "delta_pct": 92.25663705664054
      },
      "p99_latency": {
        "baseline_ms": 0.9906508700783913,
        "tailscale_ms": 2.6959475836165527,
        "delta_pct": 172.1390214297414
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.xlarge-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aws",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 12970.912601042257,
      "avg_latency_ms": 1.233121954869765,
      "p50_latency_ms": 1.2944431497121267,
      "p90_latency_ms": 1.9217308295333801,
      "p99_latency_ms": 2.9303563613616688,
      "p999_latency_ms": 4.194279677903,
      "status_codes": {
        "200": 1167425
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 54774.25439244663,
        "tailscale": 12970.912601042257,
        "delta_pct": -76.31932603206563
      },
      "p50_latency": {
        "baseline_ms": 0.5286514295979268,
        "tailscale_ms": 1.2944431497121267,
        "delta_pct": 144.85758994289176
      },
      "p99_latency": {
        "baseline_ms": 1.190201936375465,
        "tailscale_ms": 2.9303563613616688,
        "delta_pct": 146.2066538293086
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "aws/c8gn/results/c8gn.xlarge-l7-serve-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h2",
    "vcpus": 4,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.5",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.5",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1,
          "avg_ms": 1,
          "best_ms": 0.7,
          "worst_ms": 1.6,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4550.10530409046,
          "retransmits": 0,
          "duration_sec": 30.000563,
          "bytes_transferred": 17063215104
        },
        {
          "bandwidth_mbps": 4594.6950167464865,
          "retransmits": 0,
          "duration_sec": 30.000621,
          "bytes_transferred": 17230462976
        },
        {
          "bandwidth_mbps": 4597.141336964902,
          "retransmits": 0,
          "duration_sec": 30.000623,
          "bytes_transferred": 17239638016
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4580.647219267283,
        "bandwidth_mbps_min": 4550.10530409046,
        "bandwidth_mbps_max": 4597.141336964902,
        "bandwidth_mbps_stddev": 21.619475134762755,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4592.417741240225,
          "retransmits": 0,
          "duration_sec": 30.000428,
          "bytes_transferred": 17221812224
        },
        {
          "bandwidth_mbps": 4528.317104183163,
          "retransmits": 0,
          "duration_sec": 30.001345,
          "bytes_transferred": 16981950464
        },
        {
          "bandwidth_mbps": 4537.88807248946,
          "retransmits": 0,
          "duration_sec": 30.001382,
          "bytes_transferred": 17017864192
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4552.874305970949,
        "bandwidth_mbps_min": 4528.317104183163,
        "bandwidth_mbps_max": 4592.417741240225,
        "bandwidth_mbps_stddev": 28.233116645192744,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "d2sv4",
    "instance_type": "Standard_D2s_v4",
    "kernel_version": "6.17.0-1008-azure",
    "overhead": {
      "bandwidth_pct": 60.83136801993052,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 58.87351817896791,
      "retransmits_pct": 0
    },
    "region": "eastus",
    "source": "azure/d2sv4/results/Standard_D2s_v4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-Standard-D2s-v4-server 6.17.0-1008-azure #8~24.04.1-Ubuntu SMP Mon Jan 26 18:35:40 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.83.150.91",
      "hops": [
        {
          "hop": 1,
          "host": "100.83.150.91",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.2,
          "avg_ms": 1.3,
          "best_ms": 0.8,
          "worst_ms": 4.4,
          "stdev_ms": 0.4
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1773.9397805284177,
          "retransmits": 0,
          "duration_sec": 30.000695,
          "bytes_transferred": 6652428288
        },
        {
          "bandwidth_mbps": 1808.959517695663,
          "retransmits": 0,
          "duration_sec": 30.001306,
          "bytes_transferred": 6783893504
        },
        {
          "bandwidth_mbps": 1799.6312566361828,
          "retransmits": 0,
          "duration_sec": 30.001245,
          "bytes_transferred": 6748897280
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1794.176851620088,
        "bandwidth_mbps_min": 1773.9397805284177,
        "bandwidth_mbps_max": 1808.959517695663,
        "bandwidth_mbps_stddev": 14.807844731210006,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1873.6724913068706,
          "retransmits": 1,
          "duration_sec": 30.001567,
          "bytes_transferred": 7026638848
        },
        {
          "bandwidth_mbps": 1867.0319032288958,
          "retransmits": 0,
          "duration_sec": 30.000443,
          "bytes_transferred": 7001473024
        },
        {
          "bandwidth_mbps": 1876.6066768029834,
          "retransmits": 1,
          "duration_sec": 30.001035,
          "bytes_transferred": 7037517824
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1872.4370237795831,
        "bandwidth_mbps_min": 1867.0319032288958,
        "bandwidth_mbps_max": 1876.6066768029834,
        "bandwidth_mbps_stddev": 4.005317903071527,
        "retransmits_avg": 0.6666666666666666
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
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 4133.782797303203,
      "avg_latency_ms": 3.8697025815867345,
      "p50_latency_ms": 3.805840705792575,
      "p90_latency_ms": 5.55340124995175,
      "p99_latency_ms": 7.9116373341182245,
      "p999_latency_ms": 10.653756589594666,
      "status_codes": {
        "200": 372084
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "d2sv4",
    "instance_type": "Standard_D2s_v4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 48999.83465994632,
        "tailscale": 4133.782797303203,
        "delta_pct": -91.5636801103693
      },
      "p50_latency": {
        "baseline_ms": 0.5656683193516417,
        "tailscale_ms": 3.805840705792575,
        "delta_pct": 572.804287529264
      },
      "p99_latency": {
        "baseline_ms": 1.212861706889104,
        "tailscale_ms": 7.9116373341182245,
        "delta_pct": 552.3115775838087
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/d2sv4/results/Standard_D2s_v4-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 2,
    "zone": "eastus"
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 7731.111466721756,
      "avg_latency_ms": 2.069078258599223,
      "p50_latency_ms": 2.0295436634033486,
      "p90_latency_ms": 2.9513709396504435,
      "p99_latency_ms": 4.314574985889215,
      "p999_latency_ms": 5.94181628235921,
      "status_codes": {
        "200": 695832
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "d4psv6",
    "instance_type": "Standard_D4ps_v6",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 33628.4287899335,
        "tailscale": 7731.111466721756,
        "delta_pct": -77.01019124320187
      },
      "p50_latency": {
        "baseline_ms": 0.6799106439111765,
        "tailscale_ms": 2.0295436634033486,
        "delta_pct": 198.5015283373749
      },
      "p99_latency": {
        "baseline_ms": 0.9937980571944038,
        "tailscale_ms": 4.314574985889215,
        "delta_pct": 334.15007250765944
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/d4psv6/results/Standard_D4ps_v6-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.6",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.6",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.8,
          "avg_ms": 0.8,
          "best_ms": 0.6,
          "worst_ms": 1.3,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9185.77381580777,
          "retransmits": 5,
          "duration_sec": 30.000788,
          "bytes_transferred": 34447556608
        },
        {
          "bandwidth_mbps": 9185.261885346661,
          "retransmits": 0,
          "duration_sec": 30.000976,
          "bytes_transferred": 34445852672
        },
        {
          "bandwidth_mbps": 9186.56799135817,
          "retransmits": 0,
          "duration_sec": 30.001048,
          "bytes_transferred": 34450833408
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9185.8678975042,
        "bandwidth_mbps_min": 9185.261885346661,
        "bandwidth_mbps_max": 9186.56799135817,
        "bandwidth_mbps_stddev": 0.5373495153852983,
        "retransmits_avg": 1.6666666666666667
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 6994.707097885806,
          "retransmits": 0,
          "duration_sec": 30.001173,
          "bytes_transferred": 26231177216
        },
        {
          "bandwidth_mbps": 7596.385582215823,
          "retransmits": 0,
          "duration_sec": 30.000782,
          "bytes_transferred": 28487188480
        },
        {
          "bandwidth_mbps": 6758.07399397408,
          "retransmits": 0,
          "duration_sec": 30.001389,
          "bytes_transferred": 25343950848
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 7116.388891358569,
        "bandwidth_mbps_min": 6758.07399397408,
        "bandwidth_mbps_max": 7596.385582215823,
        "bandwidth_mbps_stddev": 352.88942922881637,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "d4sv4",
    "instance_type": "Standard_D4s_v4",
    "kernel_version": "6.17.0-1008-azure",
    "overhead": {
      "bandwidth_pct": 81.02990223875864,
      "retransmits_pct": -8540
    },
    "overhead_single": {
      "bandwidth_pct": 72.997206976537,
      "retransmits_pct": 0
    },
    "region": "eastus",
    "source": "azure/d4sv4/results/Standard_D4s_v4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-Standard-D4s-v4-server 6.17.0-1008-azure #8~24.04.1-Ubuntu SMP Mon Jan 26 18:35:40 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.93.0.119",
      "hops": [
        {
          "hop": 1,
          "host": "100.93.0.119",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1,
          "avg_ms": 1.2,
          "best_ms": 0.9,
          "worst_ms": 2,
          "stdev_ms": 0.2
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1445.5255987500925,
          "retransmits": 0,
          "duration_sec": 30.001582,
          "bytes_transferred": 5421006848
        },
        {
          "bandwidth_mbps": 2083.680427237789,
          "retransmits": 432,
          "duration_sec": 30.000717,
          "bytes_transferred": 7813988352
        },
        {
          "bandwidth_mbps": 1698.4983351372193,
          "retransmits": 0,
          "duration_sec": 30.000971,
          "bytes_transferred": 6369574912
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1742.5681203750337,
        "bandwidth_mbps_min": 1445.5255987500925,
        "bandwidth_mbps_max": 2083.680427237789,
        "bandwidth_mbps_stddev": 262.3826795080303,
        "retransmits_avg": 144
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1922.326378912414,
          "retransmits": 0,
          "duration_sec": 30.000437,
          "bytes_transferred": 7208828928
        },
        {
          "bandwidth_mbps": 1910.0500689903672,
          "retransmits": 0,
          "duration_sec": 30.000565,
          "bytes_transferred": 7162822656
        },
        {
          "bandwidth_mbps": 1932.4948413320228,
          "retransmits": 0,
          "duration_sec": 30.000477,
          "bytes_transferred": 7246970880
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1921.623763078268,
        "bandwidth_mbps_min": 1910.0500689903672,
        "bandwidth_mbps_max": 1932.4948413320228,
        "bandwidth_mbps_stddev": 9.17649908280137,
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
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 8033.477568093353,
      "avg_latency_ms": 1.9910449726046193,
      "p50_latency_ms": 1.881294794246271,
      "p90_latency_ms": 2.9322495417914403,
      "p99_latency_ms": 4.83457938212576,
      "p999_latency_ms": 7.391241152679528,
      "status_codes": {
        "200": 723043
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "d4sv4",
    "instance_type": "Standard_D4s_v4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 49898.859518165875,
        "tailscale": 8033.477568093353,
        "delta_pct": -83.90047859677287
      },
      "p50_latency": {
        "baseline_ms": 0.5737740557455066,
        "tailscale_ms": 1.881294794246271,
        "delta_pct": 227.8807703847638
      },
      "p99_latency": {
        "baseline_ms": 0.9954418870678924,
        "tailscale_ms": 4.83457938212576,
        "delta_pct": 385.6716845989048
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/d4sv4/results/Standard_D4s_v4-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.9",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.9",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.2,
          "avg_ms": 1.1,
          "best_ms": 0.8,
          "worst_ms": 2.2,
          "stdev_ms": 0.2
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 7459.668253598327,
          "retransmits": 0,
          "duration_sec": 30.001712,
          "bytes_transferred": 27975352320
        },
        {
          "bandwidth_mbps": 7417.937310244161,
          "retransmits": 0,
          "duration_sec": 30.001712,
          "bytes_transferred": 27818852352
        },
        {
          "bandwidth_mbps": 7298.287749899015,
          "retransmits": 0,
          "duration_sec": 30.001769,
          "bytes_transferred": 27370192896
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 7391.9644379138335,
        "bandwidth_mbps_min": 7298.287749899015,
        "bandwidth_mbps_max": 7459.668253598327,
        "bandwidth_mbps_stddev": 68.39522067306828,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2301.543198038046,
          "retransmits": 0,
          "duration_sec": 30.001513,
          "bytes_transferred": 8631222272
        },
        {
          "bandwidth_mbps": 2596.7983932598836,
          "retransmits": 0,
          "duration_sec": 30.001616,
          "bytes_transferred": 9738518528
        },
        {
          "bandwidth_mbps": 2633.20915981275,
          "retransmits": 0,
          "duration_sec": 30.001705,
          "bytes_transferred": 9875095552
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2510.516917036893,
        "bandwidth_mbps_min": 2301.543198038046,
        "bandwidth_mbps_max": 2633.20915981275,
        "bandwidth_mbps_stddev": 148.5125076761746,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "f16sv2",
    "instance_type": "Standard_F16s_v2",
    "kernel_version": "6.17.0-1008-azure",
    "overhead": {
      "bandwidth_pct": 76.30712788576604,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 22.708553132882834,
      "retransmits_pct": 0
    },
    "region": "eastus",
    "source": "azure/f16sv2/results/Standard_F16s_v2-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-Standard-F16s-v2-server 6.17.0-1008-azure #8~24.04.1-Ubuntu SMP Mon Jan 26 18:35:40 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.81.144.94",
      "hops": [
        {
          "hop": 1,
          "host": "100.81.144.94",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.5,
          "avg_ms": 1.5,
          "best_ms": 0.9,
          "worst_ms": 3.2,
          "stdev_ms": 0.3
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1518.4894298660251,
          "retransmits": 1,
          "duration_sec": 30.001843,
          "bytes_transferred": 5694685184
        },
        {
          "bandwidth_mbps": 2002.1055314512041,
          "retransmits": 259,
          "duration_sec": 30.001729,
          "bytes_transferred": 7508328448
        },
        {
          "bandwidth_mbps": 1733.5110816965052,
          "retransmits": 29,
          "duration_sec": 30.001724,
          "bytes_transferred": 6501040128
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1751.3686810045783,
        "bandwidth_mbps_min": 1518.4894298660251,
        "bandwidth_mbps_max": 2002.1055314512041,
        "bandwidth_mbps_stddev": 197.8388297207221,
        "retransmits_avg": 96.33333333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1886.9368602939608,
          "retransmits": 0,
          "duration_sec": 30.00128,
          "bytes_transferred": 7076315136
        },
        {
          "bandwidth_mbps": 1947.1497175465145,
          "retransmits": 6,
          "duration_sec": 30.0014,
          "bytes_transferred": 7302152192
        },
        {
          "bandwidth_mbps": 1987.1579692241994,
          "retransmits": 51,
          "duration_sec": 30.001559,
          "bytes_transferred": 7452229632
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1940.4148490215582,
        "bandwidth_mbps_min": 1886.9368602939608,
        "bandwidth_mbps_max": 1987.1579692241994,
        "bandwidth_mbps_stddev": 41.191313884831146,
        "retransmits_avg": 19
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
    "vcpus": 16,
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 19450.855240199817,
      "avg_latency_ms": 0.822137959741004,
      "p50_latency_ms": 0.7380930973029285,
      "p90_latency_ms": 1.3061106578150687,
      "p99_latency_ms": 2.4816555584517026,
      "p999_latency_ms": 5.112577725332756,
      "status_codes": {
        "200": 1750615
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "f16sv2",
    "instance_type": "Standard_F16s_v2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 60591.40687575537,
        "tailscale": 19450.855240199817,
        "delta_pct": -67.89832710092963
      },
      "p50_latency": {
        "baseline_ms": 0.5688249527787468,
        "tailscale_ms": 0.7380930973029285,
        "delta_pct": 29.757510407603576
      },
      "p99_latency": {
        "baseline_ms": 0.9951152488751499,
        "tailscale_ms": 2.4816555584517026,
        "delta_pct": 149.3837333170098
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/f16sv2/results/Standard_F16s_v2-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 16,
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.9",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.9",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.6,
          "avg_ms": 2.4,
          "best_ms": 0.6,
          "worst_ms": 16.3,
          "stdev_ms": 3.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 10527.75175157825,
          "retransmits": 3620277,
          "duration_sec": 30.000658,
          "bytes_transferred": 39479934976
        },
        {
          "bandwidth_mbps": 10705.056389568193,
          "retransmits": 3305447,
          "duration_sec": 30.000478,
          "bytes_transferred": 40144601088
        },
        {
          "bandwidth_mbps": 10579.064099118968,
          "retransmits": 3642957,
          "duration_sec": 30.001442,
          "bytes_transferred": 39673397248
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 10603.957413421804,
        "bandwidth_mbps_min": 10527.75175157825,
        "bandwidth_mbps_max": 10705.056389568193,
        "bandwidth_mbps_stddev": 74.49380952321296,
        "retransmits_avg": 3522893.6666666665
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11641.989425009913,
          "retransmits": 498470,
          "duration_sec": 30.001352,
          "bytes_transferred": 43659427840
        },
        {
          "bandwidth_mbps": 11641.57505796658,
          "retransmits": 672118,
          "duration_sec": 30.001339,
          "bytes_transferred": 43657854976
        },
        {
          "bandwidth_mbps": 11814.281013241913,
          "retransmits": 208804,
          "duration_sec": 30.001483,
          "bytes_transferred": 44305743872
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11699.281832072802,
        "bandwidth_mbps_min": 11641.57505796658,
        "bandwidth_mbps_max": 11814.281013241913,
        "bandwidth_mbps_stddev": 81.31687679355008,
        "retransmits_avg": 459797.3333333333
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "f2asv6",
    "instance_type": "Standard_F2as_v6",
    "kernel_version": "6.17.0-1008-azure",
    "overhead": {
      "bandwidth_pct": 50.743412898208554,
      "retransmits_pct": 99.99982968546406
    },
    "overhead_single": {
      "bandwidth_pct": 59.311825073499236,
      "retransmits_pct": 99.90060838398367
    },
    "region": "eastus",
    "source": "azure/f2asv6/results/Standard_F2as_v6-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-Standard-F2as-v6-server 6.17.0-1008-azure #8~24.04.1-Ubuntu SMP Mon Jan 26 18:35:40 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.123.34.74",
      "hops": [
        {
          "hop": 1,
          "host": "100.123.34.74",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.6,
          "avg_ms": 0.6,
          "best_ms": 0.4,
          "worst_ms": 0.8,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5216.55727109362,
          "retransmits": 18,
          "duration_sec": 30.000824,
          "bytes_transferred": 19562627072
        },
        {
          "bandwidth_mbps": 5224.36445310379,
          "retransmits": 0,
          "duration_sec": 30.001753,
          "bytes_transferred": 19592511488
        },
        {
          "bandwidth_mbps": 5228.520834539537,
          "retransmits": 0,
          "duration_sec": 30.001167,
          "bytes_transferred": 19607715840
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5223.147519578983,
        "bandwidth_mbps_min": 5216.55727109362,
        "bandwidth_mbps_max": 5228.520834539537,
        "bandwidth_mbps_stddev": 4.959328448084291,
        "retransmits_avg": 6
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4743.317385083452,
          "retransmits": 0,
          "duration_sec": 30.000575,
          "bytes_transferred": 17787781120
        },
        {
          "bandwidth_mbps": 4720.539962399576,
          "retransmits": 1371,
          "duration_sec": 30.000726,
          "bytes_transferred": 17702453248
        },
        {
          "bandwidth_mbps": 4816.815423451287,
          "retransmits": 0,
          "duration_sec": 30.000393,
          "bytes_transferred": 18063294464
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4760.224256978105,
        "bandwidth_mbps_min": 4720.539962399576,
        "bandwidth_mbps_max": 4816.815423451287,
        "bandwidth_mbps_stddev": 41.082217062264384,
        "retransmits_avg": 457
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
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 7180.844341112723,
      "avg_latency_ms": 2.2278706814521634,
      "p50_latency_ms": 2.2258772288076467,
      "p90_latency_ms": 3.4397749602269188,
      "p99_latency_ms": 4.969446154677826,
      "p999_latency_ms": 6.824400761683915,
      "status_codes": {
        "200": 646305
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "f2asv6",
    "instance_type": "Standard_F2as_v6",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 68316.27856116554,
        "tailscale": 7180.844341112723,
        "delta_pct": -89.4888239050031
      },
      "p50_latency": {
        "baseline_ms": 0.5264512726573272,
        "tailscale_ms": 2.2258772288076467,
        "delta_pct": 322.8078351054712
      },
      "p99_latency": {
        "baseline_ms": 0.9976451463513242,
        "tailscale_ms": 4.969446154677826,
        "delta_pct": 398.11760953807294
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/f2asv6/results/Standard_F2as_v6-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 2,
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.9",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.9",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.9,
          "avg_ms": 1.1,
          "best_ms": 0.7,
          "worst_ms": 6.1,
          "stdev_ms": 0.5
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4598.925872670623,
          "retransmits": 0,
          "duration_sec": 30.000838,
          "bytes_transferred": 17246453760
        },
        {
          "bandwidth_mbps": 4597.995361182946,
          "retransmits": 0,
          "duration_sec": 30.000752,
          "bytes_transferred": 17242914816
        },
        {
          "bandwidth_mbps": 4598.597050209124,
          "retransmits": 0,
          "duration_sec": 30.000703,
          "bytes_transferred": 17245143040
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4598.506094687565,
        "bandwidth_mbps_min": 4597.995361182946,
        "bandwidth_mbps_max": 4598.925872670623,
        "bandwidth_mbps_stddev": 0.3852856839207005,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2324.819863377481,
          "retransmits": 0,
          "duration_sec": 30.000618,
          "bytes_transferred": 8718254080
        },
        {
          "bandwidth_mbps": 2370.8599364477473,
          "retransmits": 0,
          "duration_sec": 30.00051,
          "bytes_transferred": 8890875904
        },
        {
          "bandwidth_mbps": 2176.2076427966213,
          "retransmits": 0,
          "duration_sec": 30.00106,
          "bytes_transferred": 8161067008
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2290.6291475406165,
        "bandwidth_mbps_min": 2176.2076427966213,
        "bandwidth_mbps_max": 2370.8599364477473,
        "bandwidth_mbps_stddev": 83.06275797246705,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "f2sv2",
    "instance_type": "Standard_F2s_v2",
    "kernel_version": "6.17.0-1008-azure",
    "overhead": {
      "bandwidth_pct": 61.265102245229684,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 17.20603866854012,
      "retransmits_pct": 0
    },
    "region": "eastus",
    "source": "azure/f2sv2/results/Standard_F2s_v2-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-Standard-F2s-v2-server 6.17.0-1008-azure #8~24.04.1-Ubuntu SMP Mon Jan 26 18:35:40 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.121.58.23",
      "hops": [
        {
          "hop": 1,
          "host": "100.121.58.23",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.2,
          "avg_ms": 1.6,
          "best_ms": 1,
          "worst_ms": 12.9,
          "stdev_ms": 1.8
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1588.471268464235,
          "retransmits": 0,
          "duration_sec": 30.000972,
          "bytes_transferred": 5956960256
        },
        {
          "bandwidth_mbps": 1679.676004983917,
          "retransmits": 0,
          "duration_sec": 30.001301,
          "bytes_transferred": 6299058176
        },
        {
          "bandwidth_mbps": 2075.532628624176,
          "retransmits": 13,
          "duration_sec": 30.001786,
          "bytes_transferred": 7783710720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1781.2266340241094,
        "bandwidth_mbps_min": 1588.471268464235,
        "bandwidth_mbps_max": 2075.532628624176,
        "bandwidth_mbps_stddev": 211.4104851295335,
        "retransmits_avg": 4.333333333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1984.4111888430762,
          "retransmits": 0,
          "duration_sec": 30.000814,
          "bytes_transferred": 7441743872
        },
        {
          "bandwidth_mbps": 1771.3355219494872,
          "retransmits": 0,
          "duration_sec": 30.000997,
          "bytes_transferred": 6642728960
        },
        {
          "bandwidth_mbps": 1933.7611211932178,
          "retransmits": 0,
          "duration_sec": 30.000895,
          "bytes_transferred": 7251820544
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1896.502610661927,
        "bandwidth_mbps_min": 1771.3355219494872,
        "bandwidth_mbps_max": 1984.4111888430762,
        "bandwidth_mbps_stddev": 90.88988726583631,
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
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 3687.5140118465915,
      "avg_latency_ms": 4.338233351732996,
      "p50_latency_ms": 4.228006190249884,
      "p90_latency_ms": 6.096364855475123,
      "p99_latency_ms": 9.997106153267493,
      "p999_latency_ms": 19.51250204105736,
      "status_codes": {
        "200": 331900
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "f2sv2",
    "instance_type": "Standard_F2s_v2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 42615.576196223185,
        "tailscale": 3687.5140118465915,
        "delta_pct": -91.34702768098816
      },
      "p50_latency": {
        "baseline_ms": 0.5748209576529097,
        "tailscale_ms": 4.228006190249884,
        "delta_pct": 635.534453634666
      },
      "p99_latency": {
        "baseline_ms": 1.5641253082649385,
        "tailscale_ms": 9.997106153267493,
        "delta_pct": 539.1499517616744
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/f2sv2/results/Standard_F2s_v2-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 2,
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.9",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.9",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.8,
          "avg_ms": 1,
          "best_ms": 0.7,
          "worst_ms": 5.2,
          "stdev_ms": 0.5
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 7159.299283674288,
          "retransmits": 0,
          "duration_sec": 30.001436,
          "bytes_transferred": 26848657408
        },
        {
          "bandwidth_mbps": 7760.235872188699,
          "retransmits": 0,
          "duration_sec": 30.001604,
          "bytes_transferred": 29102440448
        },
        {
          "bandwidth_mbps": 7962.880537867596,
          "retransmits": 180,
          "duration_sec": 30.001733,
          "bytes_transferred": 29862526976
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 7627.471897910195,
        "bandwidth_mbps_min": 7159.299283674288,
        "bandwidth_mbps_max": 7962.880537867596,
        "bandwidth_mbps_stddev": 341.22857702952354,
        "retransmits_avg": 60
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2970.830160561028,
          "retransmits": 0,
          "duration_sec": 30.001365,
          "bytes_transferred": 11141120000
        },
        {
          "bandwidth_mbps": 3001.9200901394056,
          "retransmits": 0,
          "duration_sec": 30.001529,
          "bytes_transferred": 11257774080
        },
        {
          "bandwidth_mbps": 2556.1155802958497,
          "retransmits": 0,
          "duration_sec": 30.001619,
          "bytes_transferred": 9585950720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2842.955276998761,
        "bandwidth_mbps_min": 2556.1155802958497,
        "bandwidth_mbps_max": 3001.9200901394056,
        "bandwidth_mbps_stddev": 203.22303779142234,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "f32sv2",
    "instance_type": "Standard_F32s_v2",
    "kernel_version": "",
    "overhead": {
      "bandwidth_pct": 77.6889664374678,
      "retransmits_pct": -230.55555555555557
    },
    "overhead_single": {
      "bandwidth_pct": 34.60898177673298,
      "retransmits_pct": 0
    },
    "region": "eastus",
    "source": "azure/f32sv2/results/Standard_F32s_v2-l4-kernel.json",
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
          "bandwidth_mbps": 1549.0322467061021,
          "retransmits": 1,
          "duration_sec": 30.001917,
          "bytes_transferred": 5809242112
        },
        {
          "bandwidth_mbps": 1886.722359828267,
          "retransmits": 287,
          "duration_sec": 30.001912,
          "bytes_transferred": 7075659776
        },
        {
          "bandwidth_mbps": 1669.5488388119982,
          "retransmits": 307,
          "duration_sec": 30.001774,
          "bytes_transferred": 6261178368
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1701.7678151154557,
        "bandwidth_mbps_min": 1549.0322467061021,
        "bandwidth_mbps_max": 1886.722359828267,
        "bandwidth_mbps_stddev": 139.7311703489888,
        "retransmits_avg": 198.33333333333334
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1899.6085757640653,
          "retransmits": 0,
          "duration_sec": 30.001525,
          "bytes_transferred": 7123894272
        },
        {
          "bandwidth_mbps": 1849.7326129037688,
          "retransmits": 0,
          "duration_sec": 30.001545,
          "bytes_transferred": 6936854528
        },
        {
          "bandwidth_mbps": 1827.7710211169383,
          "retransmits": 0,
          "duration_sec": 30.001177,
          "bytes_transferred": 6854410240
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1859.037403261591,
        "bandwidth_mbps_min": 1827.7710211169383,
        "bandwidth_mbps_max": 1899.6085757640653,
        "bandwidth_mbps_stddev": 30.0565345875846,
        "retransmits_avg": 0
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
    "vcpus": 32,
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 20996.77391707906,
      "avg_latency_ms": 0.7616291238173177,
      "p50_latency_ms": 0.7146083277914833,
      "p90_latency_ms": 0.9931193409478692,
      "p99_latency_ms": 2.0125374056000696,
      "p999_latency_ms": 9.404317039185239,
      "status_codes": {
        "200": 1889746
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "f32sv2",
    "instance_type": "Standard_F32s_v2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 57144.23362438838,
        "tailscale": 20996.77391707906,
        "delta_pct": -63.25653073748123
      },
      "p50_latency": {
        "baseline_ms": 0.5740065986653599,
        "tailscale_ms": 0.7146083277914833,
        "delta_pct": 24.494793170155322
      },
      "p99_latency": {
        "baseline_ms": 0.9963592582908808,
        "tailscale_ms": 2.0125374056000696,
        "delta_pct": 101.98913081334786
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/f32sv2/results/Standard_F32s_v2-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 32,
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.7",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.7",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.4,
          "avg_ms": 1,
          "best_ms": 0.8,
          "worst_ms": 1.6,
          "stdev_ms": 0.2
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 15399.062983620173,
          "retransmits": 0,
          "duration_sec": 30.001721,
          "bytes_transferred": 57749798912
        },
        {
          "bandwidth_mbps": 15910.214410628272,
          "retransmits": 0,
          "duration_sec": 30.001787,
          "bytes_transferred": 59666857984
        },
        {
          "bandwidth_mbps": 15083.01842705887,
          "retransmits": 0,
          "duration_sec": 30.001695,
          "bytes_transferred": 56564514816
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 15464.098607102438,
        "bandwidth_mbps_min": 15083.01842705887,
        "bandwidth_mbps_max": 15910.214410628272,
        "bandwidth_mbps_stddev": 340.81815586382976,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 7359.622534382197,
          "retransmits": 0,
          "duration_sec": 30.001355,
          "bytes_transferred": 27599831040
        },
        {
          "bandwidth_mbps": 6599.307360524038,
          "retransmits": 0,
          "duration_sec": 30.001478,
          "bytes_transferred": 24748621824
        },
        {
          "bandwidth_mbps": 6891.761048815424,
          "retransmits": 0,
          "duration_sec": 30.001542,
          "bytes_transferred": 25845432320
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6950.230314573887,
        "bandwidth_mbps_min": 6599.307360524038,
        "bandwidth_mbps_max": 7359.622534382197,
        "bandwidth_mbps_stddev": 313.13871492624577,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "f48sv2",
    "instance_type": "Standard_F48s_v2",
    "kernel_version": "6.17.0-1008-azure",
    "overhead": {
      "bandwidth_pct": 90.21843303476284,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 74.24957228931844,
      "retransmits_pct": 0
    },
    "region": "eastus",
    "source": "azure/f48sv2/results/Standard_F48s_v2-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-Standard-F48s-v2-server 6.17.0-1008-azure #8~24.04.1-Ubuntu SMP Mon Jan 26 18:35:40 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.98.4.88",
      "hops": [
        {
          "hop": 1,
          "host": "100.98.4.88",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.6,
          "avg_ms": 1.8,
          "best_ms": 1.2,
          "worst_ms": 5.9,
          "stdev_ms": 0.6
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1389.9066810182267,
          "retransmits": 0,
          "duration_sec": 30.001849,
          "bytes_transferred": 5212471296
        },
        {
          "bandwidth_mbps": 1642.5994010630423,
          "retransmits": 512,
          "duration_sec": 30.001822,
          "bytes_transferred": 6160121856
        },
        {
          "bandwidth_mbps": 1505.3874003908304,
          "retransmits": 224,
          "duration_sec": 30.001756,
          "bytes_transferred": 5645533184
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1512.631160824033,
        "bandwidth_mbps_min": 1389.9066810182267,
        "bandwidth_mbps_max": 1642.5994010630423,
        "bandwidth_mbps_stddev": 103.28845285517032,
        "retransmits_avg": 245.33333333333334
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1680.192149671719,
          "retransmits": 0,
          "duration_sec": 30.001446,
          "bytes_transferred": 6301024256
        },
        {
          "bandwidth_mbps": 1998.5236802824716,
          "retransmits": 0,
          "duration_sec": 30.001458,
          "bytes_transferred": 7494828032
        },
        {
          "bandwidth_mbps": 1690.426268686486,
          "retransmits": 151,
          "duration_sec": 30.001561,
          "bytes_transferred": 6339428352
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1789.7140328802254,
        "bandwidth_mbps_min": 1680.192149671719,
        "bandwidth_mbps_max": 1998.5236802824716,
        "bandwidth_mbps_stddev": 147.70981897894674,
        "retransmits_avg": 50.333333333333336
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
    "vcpus": 48,
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 16711.077954524375,
      "avg_latency_ms": 0.9590168356658286,
      "p50_latency_ms": 0.7976796317701568,
      "p90_latency_ms": 1.7292652232562322,
      "p99_latency_ms": 3.305519755727803,
      "p999_latency_ms": 7.188720799640682,
      "status_codes": {
        "200": 1504058
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "f48sv2",
    "instance_type": "Standard_F48s_v2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 52645.813348443866,
        "tailscale": 16711.077954524375,
        "delta_pct": -68.25753675051098
      },
      "p50_latency": {
        "baseline_ms": 0.5800944664130979,
        "tailscale_ms": 0.7976796317701568,
        "delta_pct": 37.50857454346267
      },
      "p99_latency": {
        "baseline_ms": 0.9977632857573199,
        "tailscale_ms": 3.305519755727803,
        "delta_pct": 231.29298330704313
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/f48sv2/results/Standard_F48s_v2-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 48,
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.9",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.9",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.9,
          "avg_ms": 2.3,
          "best_ms": 0.7,
          "worst_ms": 10.9,
          "stdev_ms": 2.4
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11197.235737082467,
          "retransmits": 1788063,
          "duration_sec": 30.001453,
          "bytes_transferred": 41991667712
        },
        {
          "bandwidth_mbps": 11565.595241183204,
          "retransmits": 974727,
          "duration_sec": 30.001239,
          "bytes_transferred": 43372773376
        },
        {
          "bandwidth_mbps": 11199.736798495549,
          "retransmits": 1980245,
          "duration_sec": 30.000558,
          "bytes_transferred": 41999794176
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11320.855925587073,
        "bandwidth_mbps_min": 11197.235737082467,
        "bandwidth_mbps_max": 11565.595241183204,
        "bandwidth_mbps_stddev": 173.05984181951803,
        "retransmits_avg": 1581011.6666666667
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11771.637861457275,
          "retransmits": 318453,
          "duration_sec": 30.001402,
          "bytes_transferred": 44145704960
        },
        {
          "bandwidth_mbps": 11563.855146631318,
          "retransmits": 663386,
          "duration_sec": 30.001401,
          "bytes_transferred": 43366481920
        },
        {
          "bandwidth_mbps": 11642.191369648028,
          "retransmits": 454645,
          "duration_sec": 30.001372,
          "bytes_transferred": 43660214272
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11659.228125912208,
        "bandwidth_mbps_min": 11563.855146631318,
        "bandwidth_mbps_max": 11771.637861457275,
        "bandwidth_mbps_stddev": 85.67808915981182,
        "retransmits_avg": 478828
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "f4asv6",
    "instance_type": "Standard_F4as_v6",
    "kernel_version": "6.17.0-1008-azure",
    "overhead": {
      "bandwidth_pct": 44.624080430071785,
      "retransmits_pct": 99.94393884928111
    },
    "overhead_single": {
      "bandwidth_pct": 46.448431167036745,
      "retransmits_pct": 99.84510791627335
    },
    "region": "eastus",
    "source": "azure/f4asv6/results/Standard_F4as_v6-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-Standard-F4as-v6-server 6.17.0-1008-azure #8~24.04.1-Ubuntu SMP Mon Jan 26 18:35:40 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.102.141.121",
      "hops": [
        {
          "hop": 1,
          "host": "100.102.141.121",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.9,
          "avg_ms": 0.8,
          "best_ms": 0.6,
          "worst_ms": 1,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6275.061968525876,
          "retransmits": 532,
          "duration_sec": 30.001343,
          "bytes_transferred": 23532535808
        },
        {
          "bandwidth_mbps": 6289.282017815758,
          "retransmits": 2098,
          "duration_sec": 30.001867,
          "bytes_transferred": 23586275328
        },
        {
          "bandwidth_mbps": 6242.740229600013,
          "retransmits": 29,
          "duration_sec": 30.001305,
          "bytes_transferred": 23411294208
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6269.02807198055,
        "bandwidth_mbps_min": 6242.740229600013,
        "bandwidth_mbps_max": 6289.282017815758,
        "bandwidth_mbps_stddev": 19.473750592692824,
        "retransmits_avg": 886.3333333333334
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 6205.837159278526,
          "retransmits": 275,
          "duration_sec": 30.000604,
          "bytes_transferred": 23272357888
        },
        {
          "bandwidth_mbps": 6249.074906105497,
          "retransmits": 886,
          "duration_sec": 30.000425,
          "bytes_transferred": 23434362880
        },
        {
          "bandwidth_mbps": 6276.186660336241,
          "retransmits": 1064,
          "duration_sec": 30.001146,
          "bytes_transferred": 23536599040
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6243.699575240088,
        "bandwidth_mbps_min": 6205.837159278526,
        "bandwidth_mbps_max": 6276.186660336241,
        "bandwidth_mbps_stddev": 28.970487410487625,
        "retransmits_avg": 741.6666666666666
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 13740.096693638441,
      "avg_latency_ms": 1.1642386865176872,
      "p50_latency_ms": 1.2172365010577888,
      "p90_latency_ms": 1.89888492987646,
      "p99_latency_ms": 2.8563160008914976,
      "p999_latency_ms": 4.029355697976611,
      "status_codes": {
        "200": 1236635
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "f4asv6",
    "instance_type": "Standard_F4as_v6",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 119377.92625931524,
        "tailscale": 13740.096693638441,
        "delta_pct": -88.49025349645301
      },
      "p50_latency": {
        "baseline_ms": 0.52204266415595,
        "tailscale_ms": 1.2172365010577888,
        "delta_pct": 133.16801185700854
      },
      "p99_latency": {
        "baseline_ms": 0.9906204500881848,
        "tailscale_ms": 2.8563160008914976,
        "delta_pct": 188.33606257949037
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/f4asv6/results/Standard_F4as_v6-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.8",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.8",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.9,
          "avg_ms": 1.5,
          "best_ms": 0.7,
          "worst_ms": 16.4,
          "stdev_ms": 2.6
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3854.5088531762826,
          "retransmits": 1,
          "duration_sec": 30.000984,
          "bytes_transferred": 14454882304
        },
        {
          "bandwidth_mbps": 6705.910628224143,
          "retransmits": 0,
          "duration_sec": 30.001776,
          "bytes_transferred": 25148653568
        },
        {
          "bandwidth_mbps": 6334.061065298803,
          "retransmits": 0,
          "duration_sec": 30.000672,
          "bytes_transferred": 23753261056
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5631.49351556641,
        "bandwidth_mbps_min": 3854.5088531762826,
        "bandwidth_mbps_max": 6705.910628224143,
        "bandwidth_mbps_stddev": 1265.655006215953,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2011.6164308753007,
          "retransmits": 0,
          "duration_sec": 30.001664,
          "bytes_transferred": 7543980032
        },
        {
          "bandwidth_mbps": 1919.4348676149275,
          "retransmits": 0,
          "duration_sec": 30.001381,
          "bytes_transferred": 7198212096
        },
        {
          "bandwidth_mbps": 2273.8629455997584,
          "retransmits": 0,
          "duration_sec": 30.001503,
          "bytes_transferred": 8527413248
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2068.3047480299956,
        "bandwidth_mbps_min": 1919.4348676149275,
        "bandwidth_mbps_max": 2273.8629455997584,
        "bandwidth_mbps_stddev": 150.1443518582008,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "f4sv2",
    "instance_type": "Standard_F4s_v2",
    "kernel_version": "6.17.0-1008-azure",
    "overhead": {
      "bandwidth_pct": 66.05718057688509,
      "retransmits_pct": -151900.00000000003
    },
    "overhead_single": {
      "bandwidth_pct": 10.074131565909548,
      "retransmits_pct": 0
    },
    "region": "eastus",
    "source": "azure/f4sv2/results/Standard_F4s_v2-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-Standard-F4s-v2-server 6.17.0-1008-azure #8~24.04.1-Ubuntu SMP Mon Jan 26 18:35:40 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.126.82.56",
      "hops": [
        {
          "hop": 1,
          "host": "100.126.82.56",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.7,
          "avg_ms": 1.5,
          "best_ms": 0.9,
          "worst_ms": 20.1,
          "stdev_ms": 2.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1878.9687116234982,
          "retransmits": 0,
          "duration_sec": 30.001269,
          "bytes_transferred": 7046430720
        },
        {
          "bandwidth_mbps": 1977.3788678020917,
          "retransmits": 1108,
          "duration_sec": 30.000921,
          "bytes_transferred": 7415398400
        },
        {
          "bandwidth_mbps": 1878.1154450138054,
          "retransmits": 412,
          "duration_sec": 30.002058,
          "bytes_transferred": 7043416064
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1911.487674813132,
        "bandwidth_mbps_min": 1878.1154450138054,
        "bandwidth_mbps_max": 1977.3788678020917,
        "bandwidth_mbps_stddev": 46.5934115593473,
        "retransmits_avg": 506.6666666666667
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1836.707009031089,
          "retransmits": 0,
          "duration_sec": 30.001365,
          "bytes_transferred": 6887964672
        },
        {
          "bandwidth_mbps": 1887.6719647326836,
          "retransmits": 0,
          "duration_sec": 30.001262,
          "bytes_transferred": 7079067648
        },
        {
          "bandwidth_mbps": 1855.4440458247273,
          "retransmits": 0,
          "duration_sec": 30.000746,
          "bytes_transferred": 6958088192
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1859.9410065294999,
        "bandwidth_mbps_min": 1836.707009031089,
        "bandwidth_mbps_max": 1887.6719647326836,
        "bandwidth_mbps_stddev": 21.047940027495596,
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
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 7292.370394793544,
      "avg_latency_ms": 2.193484661569832,
      "p50_latency_ms": 2.079383284255078,
      "p90_latency_ms": 3.193012793306336,
      "p99_latency_ms": 5.809155757930317,
      "p999_latency_ms": 19.778400475833433,
      "status_codes": {
        "200": 656355
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "f4sv2",
    "instance_type": "Standard_F4s_v2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 44190.58493673889,
        "tailscale": 7292.370394793544,
        "delta_pct": -83.49790932789655
      },
      "p50_latency": {
        "baseline_ms": 0.5783989779142007,
        "tailscale_ms": 2.079383284255078,
        "delta_pct": 259.5067356020695
      },
      "p99_latency": {
        "baseline_ms": 1.342247129509422,
        "tailscale_ms": 5.809155757930317,
        "delta_pct": 332.7933083420715
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/f4sv2/results/Standard_F4s_v2-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 4,
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.7",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.7",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.3,
          "avg_ms": 1.1,
          "best_ms": 0.7,
          "worst_ms": 4.4,
          "stdev_ms": 0.5
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11076.082958826504,
          "retransmits": 2107978,
          "duration_sec": 30.001678,
          "bytes_transferred": 41537634304
        },
        {
          "bandwidth_mbps": 11117.984205393286,
          "retransmits": 2158853,
          "duration_sec": 30.000747,
          "bytes_transferred": 41693478912
        },
        {
          "bandwidth_mbps": 11191.006654139726,
          "retransmits": 1966871,
          "duration_sec": 30.001474,
          "bytes_transferred": 41968336896
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11128.357939453172,
        "bandwidth_mbps_min": 11076.082958826504,
        "bandwidth_mbps_max": 11191.006654139726,
        "bandwidth_mbps_stddev": 47.487364669425574,
        "retransmits_avg": 2077900.6666666667
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11634.3794232042,
          "retransmits": 702670,
          "duration_sec": 30.001328,
          "bytes_transferred": 43630854144
        },
        {
          "bandwidth_mbps": 11436.595103610292,
          "retransmits": 941463,
          "duration_sec": 30.001411,
          "bytes_transferred": 42889248768
        },
        {
          "bandwidth_mbps": 11596.700713954966,
          "retransmits": 781112,
          "duration_sec": 30.001332,
          "bytes_transferred": 43489558528
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11555.891746923153,
        "bandwidth_mbps_min": 11436.595103610292,
        "bandwidth_mbps_max": 11634.3794232042,
        "bandwidth_mbps_stddev": 85.74647946887366,
        "retransmits_avg": 808415
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "f8asv6",
    "instance_type": "Standard_F8as_v6",
    "kernel_version": "6.17.0-1008-azure",
    "overhead": {
      "bandwidth_pct": 42.835395661619366,
      "retransmits_pct": 99.8763816428825
    },
    "overhead_single": {
      "bandwidth_pct": 44.95657036970462,
      "retransmits_pct": 99.6857224733996
    },
    "region": "eastus",
    "source": "azure/f8asv6/results/Standard_F8as_v6-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1500,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-Standard-F8as-v6-server 6.17.0-1008-azure #8~24.04.1-Ubuntu SMP Mon Jan 26 18:35:40 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.98.21.29",
      "hops": [
        {
          "hop": 1,
          "host": "100.98.21.29",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.9,
          "avg_ms": 1,
          "best_ms": 0.8,
          "worst_ms": 1.3,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6023.930638273477,
          "retransmits": 2868,
          "duration_sec": 30.00156,
          "bytes_transferred": 22590914560
        },
        {
          "bandwidth_mbps": 6506.573281392135,
          "retransmits": 2641,
          "duration_sec": 30.001361,
          "bytes_transferred": 24400756736
        },
        {
          "bandwidth_mbps": 6553.941436675908,
          "retransmits": 2197,
          "duration_sec": 30.000517,
          "bytes_transferred": 24577703936
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6361.481785447173,
        "bandwidth_mbps_min": 6023.930638273477,
        "bandwidth_mbps_max": 6553.941436675908,
        "bandwidth_mbps_stddev": 239.4667941524195,
        "retransmits_avg": 2568.6666666666665
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 6431.812775439568,
          "retransmits": 969,
          "duration_sec": 30.001363,
          "bytes_transferred": 24120393728
        },
        {
          "bandwidth_mbps": 6156.3381196473965,
          "retransmits": 1802,
          "duration_sec": 30.000469,
          "bytes_transferred": 23086628864
        },
        {
          "bandwidth_mbps": 6494.126530525309,
          "retransmits": 4851,
          "duration_sec": 30.001219,
          "bytes_transferred": 24353964032
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6360.759141870757,
        "bandwidth_mbps_min": 6156.3381196473965,
        "bandwidth_mbps_max": 6494.126530525309,
        "bandwidth_mbps_stddev": 146.7690175374318,
        "retransmits_avg": 2540.6666666666665
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
    "vcpus": 8,
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 19977.91189036889,
      "avg_latency_ms": 0.800674609742244,
      "p50_latency_ms": 0.7190508052688251,
      "p90_latency_ms": 1.5394876474525958,
      "p99_latency_ms": 1.9702403298905518,
      "p999_latency_ms": 3.3340165587397874,
      "status_codes": {
        "200": 1798057
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "f8asv6",
    "instance_type": "Standard_F8as_v6",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 109744.24216149317,
        "tailscale": 19977.91189036889,
        "delta_pct": -81.79593617224074
      },
      "p50_latency": {
        "baseline_ms": 0.5353830295736556,
        "tailscale_ms": 0.7190508052688251,
        "delta_pct": 34.305864315764865
      },
      "p99_latency": {
        "baseline_ms": 0.9910248620122317,
        "tailscale_ms": 1.9702403298905518,
        "delta_pct": 98.80836550256336
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/f8asv6/results/Standard_F8as_v6-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 8,
    "zone": "eastus"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.8",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.8",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.1,
          "avg_ms": 1.1,
          "best_ms": 0.8,
          "worst_ms": 2.9,
          "stdev_ms": 0.3
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 7661.824505027504,
          "retransmits": 0,
          "duration_sec": 30.001566,
          "bytes_transferred": 28733341696
        },
        {
          "bandwidth_mbps": 7939.154125950579,
          "retransmits": 0,
          "duration_sec": 30.00145,
          "bytes_transferred": 29773266944
        },
        {
          "bandwidth_mbps": 7966.829695899237,
          "retransmits": 0,
          "duration_sec": 30.000681,
          "bytes_transferred": 29876289536
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 7855.936108959107,
        "bandwidth_mbps_min": 7661.824505027504,
        "bandwidth_mbps_max": 7966.829695899237,
        "bandwidth_mbps_stddev": 137.72187039747993,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2307.107368444069,
          "retransmits": 0,
          "duration_sec": 30.001422,
          "bytes_transferred": 8652062720
        },
        {
          "bandwidth_mbps": 2895.7374855807457,
          "retransmits": 0,
          "duration_sec": 30.001552,
          "bytes_transferred": 10859577344
        },
        {
          "bandwidth_mbps": 2346.1507821306886,
          "retransmits": 0,
          "duration_sec": 30.00138,
          "bytes_transferred": 8798470144
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2516.3318787185012,
        "bandwidth_mbps_min": 2307.107368444069,
        "bandwidth_mbps_max": 2895.7374855807457,
        "bandwidth_mbps_stddev": 268.75336639994816,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "azure",
    "connection_type": "direct",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "f8sv2",
    "instance_type": "Standard_F8s_v2",
    "kernel_version": "",
    "overhead": {
      "bandwidth_pct": 77.81626048521694,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 20.37188750225244,
      "retransmits_pct": 0
    },
    "region": "eastus",
    "source": "azure/f8sv2/results/Standard_F8s_v2-l4-kernel.json",
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
          "bandwidth_mbps": 1569.4117171312878,
          "retransmits": 0,
          "duration_sec": 30.001183,
          "bytes_transferred": 5885526016
        },
        {
          "bandwidth_mbps": 1938.0803795416145,
          "retransmits": 1086,
          "duration_sec": 30.001664,
          "bytes_transferred": 7268204544
        },
        {
          "bandwidth_mbps": 1720.7291119049146,
          "retransmits": 699,
          "duration_sec": 30.001551,
          "bytes_transferred": 6453067776
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1742.7404028592725,
        "bandwidth_mbps_min": 1569.4117171312878,
        "bandwidth_mbps_max": 1938.0803795416145,
        "bandwidth_mbps_stddev": 151.31097857935472,
        "retransmits_avg": 595
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1931.4236784712273,
          "retransmits": 0,
          "duration_sec": 30.001371,
          "bytes_transferred": 7243169792
        },
        {
          "bandwidth_mbps": 1917.2166732187704,
          "retransmits": 0,
          "duration_sec": 30.000542,
          "bytes_transferred": 7189692416
        },
        {
          "bandwidth_mbps": 2162.482385917961,
          "retransmits": 21,
          "duration_sec": 30.000428,
          "bytes_transferred": 8109424640
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2003.7075792026528,
        "bandwidth_mbps_min": 1917.2166732187704,
        "bandwidth_mbps_max": 2162.482385917961,
        "bandwidth_mbps_stddev": 112.42045835515115,
        "retransmits_avg": 7
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
    "vcpus": 8,
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "azure",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "vm",
    "fortio_result": {
      "qps": 12812.853863910766,
      "avg_latency_ms": 1.248241845397075,
      "p50_latency_ms": 1.2888478432409423,
      "p90_latency_ms": 1.9068128101079793,
      "p99_latency_ms": 2.99404937001692,
      "p999_latency_ms": 15.96365737478971,
      "status_codes": {
        "200": 1153192
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "f8sv2",
    "instance_type": "Standard_F8s_v2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 51693.96659260485,
        "tailscale": 12812.853863910766,
        "delta_pct": -75.21402455940822
      },
      "p50_latency": {
        "baseline_ms": 0.5735896113577285,
        "tailscale_ms": 1.2888478432409423,
        "delta_pct": 124.69860292450998
      },
      "p99_latency": {
        "baseline_ms": 0.9951077007496925,
        "tailscale_ms": 2.99404937001692,
        "delta_pct": 200.87691691675872
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "azure/f8sv2/results/Standard_F8s_v2-l7-serve-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.96.2",
    "test_config": null,
    "transport_mode": "l7-serve-h1",
    "vcpus": 8,
    "zone": "eastus"
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
      "qps": 28128.291452139078,
      "avg_latency_ms": 0.5684748227984519,
      "p50_latency_ms": 0.6867348454149352,
      "p90_latency_ms": 0.9455566685218821,
      "p99_latency_ms": 1.3725363690124712,
      "p999_latency_ms": 1.9483461035412828,
      "status_codes": {
        "200": 2531639
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c2",
    "instance_type": "c2-standard-16",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 49919.728400118554,
        "tailscale": 28128.291452139078,
        "delta_pct": -43.652955747907725
      },
      "p50_latency": {
        "baseline_ms": 0.535771591292769,
        "tailscale_ms": 0.6867348454149352,
        "delta_pct": 28.176793352910973
      },
      "p99_latency": {
        "baseline_ms": 2.062389987082453,
        "tailscale_ms": 1.3725363690124712,
        "delta_pct": -33.44923231739885
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-16-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 16,
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
      "qps": 848.3122252089038,
      "avg_latency_ms": 21.29906389498213,
      "p50_latency_ms": 16.260508805847955,
      "p90_latency_ms": 43.694801294722616,
      "p99_latency_ms": 68.60719066698525,
      "p999_latency_ms": 95.87569580058833,
      "status_codes": {
        "200": 75438,
        "502": 966
      },
      "bytes_per_sec": 0,
      "connection_errors": 966
    },
    "http_version": "1.1",
    "instance_family": "c2",
    "instance_type": "c2-standard-16",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 51059.410467249625,
        "tailscale": 848.3122252089038,
        "delta_pct": -98.33857810451411
      },
      "p50_latency": {
        "baseline_ms": 0.5346282436818454,
        "tailscale_ms": 16.260508805847955,
        "delta_pct": 2941.4608651922445
      },
      "p99_latency": {
        "baseline_ms": 1.992117909233125,
        "tailscale_ms": 68.60719066698525,
        "delta_pct": 3343.932226551585
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-16-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 16,
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
      "qps": 896.01837228027,
      "avg_latency_ms": 20.53491669357101,
      "p50_latency_ms": 13.314997105272823,
      "p90_latency_ms": 42.583314889056176,
      "p99_latency_ms": 66.18815462970393,
      "p999_latency_ms": 92.556145800541,
      "status_codes": {
        "-1": 16,
        "200": 81753,
        "502": 1131
      },
      "bytes_per_sec": 0,
      "connection_errors": 1147
    },
    "http_version": "2",
    "instance_family": "c2",
    "instance_type": "c2-standard-16",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 16248.019664073077,
        "tailscale": 896.01837228027,
        "delta_pct": -94.48536873535728
      },
      "p50_latency": {
        "baseline_ms": 0.8776995023769602,
        "tailscale_ms": 13.314997105272823,
        "delta_pct": 1417.033685129539
      },
      "p99_latency": {
        "baseline_ms": 3.1130176975085297,
        "tailscale_ms": 66.18815462970393,
        "delta_pct": 2026.1734131057754
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-16-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 16,
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
      "qps": 33654.56795585851,
      "avg_latency_ms": 0.47510538561210086,
      "p50_latency_ms": 0.6714218302637501,
      "p90_latency_ms": 0.9345984824679777,
      "p99_latency_ms": 0.9938132292139289,
      "p999_latency_ms": 0.999734703888524,
      "status_codes": {
        "200": 3028959
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c2",
    "instance_type": "c2-standard-30",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 99192.68375376555,
        "tailscale": 33654.56795585851,
        "delta_pct": -66.07152192857075
      },
      "p50_latency": {
        "baseline_ms": 0.5097983386662671,
        "tailscale_ms": 0.6714218302637501,
        "delta_pct": 31.703416692239898
      },
      "p99_latency": {
        "baseline_ms": 0.9960847973920529,
        "tailscale_ms": 0.9938132292139289,
        "delta_pct": -0.22804967850843946
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-30-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 30,
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
      "qps": 2117.334344584709,
      "avg_latency_ms": 9.024195690519539,
      "p50_latency_ms": 5.691078627126591,
      "p90_latency_ms": 20.874478964882297,
      "p99_latency_ms": 37.393693652330086,
      "p999_latency_ms": 54.41619521122508,
      "status_codes": {
        "200": 190445,
        "502": 191
      },
      "bytes_per_sec": 0,
      "connection_errors": 191
    },
    "http_version": "1.1",
    "instance_family": "c2",
    "instance_type": "c2-standard-30",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 99080.09652464771,
        "tailscale": 2117.334344584709,
        "delta_pct": -97.86300738609192
      },
      "p50_latency": {
        "baseline_ms": 0.510071675861904,
        "tailscale_ms": 5.691078627126591,
        "delta_pct": 1015.7409627793925
      },
      "p99_latency": {
        "baseline_ms": 0.9961686719434276,
        "tailscale_ms": 37.393693652330086,
        "delta_pct": 3653.7512175903553
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-30-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 30,
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
      "qps": 2165.065766911956,
      "avg_latency_ms": 9.01195225762457,
      "p50_latency_ms": 5.725501463453784,
      "p90_latency_ms": 20.86792263160694,
      "p99_latency_ms": 36.98715387697225,
      "p999_latency_ms": 52.210670343932726,
      "status_codes": {
        "200": 194690,
        "502": 257
      },
      "bytes_per_sec": 0,
      "connection_errors": 257
    },
    "http_version": "2",
    "instance_family": "c2",
    "instance_type": "c2-standard-30",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 32380.06701022,
        "tailscale": 2165.065766911956,
        "delta_pct": -93.31358466235228
      },
      "p50_latency": {
        "baseline_ms": 0.6113606321625223,
        "tailscale_ms": 5.725501463453784,
        "delta_pct": 836.5178525155237
      },
      "p99_latency": {
        "baseline_ms": 1.9766555688343317,
        "tailscale_ms": 36.98715387697225,
        "delta_pct": 1771.1987288096034
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-30-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 30,
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
      "qps": 35004.29700788814,
      "avg_latency_ms": 0.45662077561672376,
      "p50_latency_ms": 0.5809289793396806,
      "p90_latency_ms": 0.9241802832084586,
      "p99_latency_ms": 1.1482427344116515,
      "p999_latency_ms": 1.9779259788335894,
      "status_codes": {
        "200": 3150447
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c2",
    "instance_type": "c2-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 90872.62923840228,
        "tailscale": 35004.29700788814,
        "delta_pct": -61.47982368150132
      },
      "p50_latency": {
        "baseline_ms": 0.5120743145739602,
        "tailscale_ms": 0.5809289793396806,
        "delta_pct": 13.446225050949215
      },
      "p99_latency": {
        "baseline_ms": 1.21876557469075,
        "tailscale_ms": 1.1482427344116515,
        "delta_pct": -5.78641551284323
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-4-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 4,
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
      "qps": 1608.2595845180688,
      "avg_latency_ms": 15.13348746157511,
      "p50_latency_ms": 11.28525109958335,
      "p90_latency_ms": 33.97702814830552,
      "p99_latency_ms": 69.50194082961728,
      "p999_latency_ms": 94.24725528390725,
      "status_codes": {
        "200": 143629,
        "502": 1135
      },
      "bytes_per_sec": 0,
      "connection_errors": 1135
    },
    "http_version": "1.1",
    "instance_family": "c2",
    "instance_type": "c2-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 97093.47926125454,
        "tailscale": 1608.2595845180688,
        "delta_pct": -98.34359671035104
      },
      "p50_latency": {
        "baseline_ms": 0.510335754433017,
        "tailscale_ms": 11.28525109958335,
        "delta_pct": 2111.338516173781
      },
      "p99_latency": {
        "baseline_ms": 0.9965605609618744,
        "tailscale_ms": 69.50194082961728,
        "delta_pct": 6874.1813545716095
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-4-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 4,
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
      "qps": 1369.7156931557527,
      "avg_latency_ms": 21.3517741935852,
      "p50_latency_ms": 17.64191322451171,
      "p90_latency_ms": 38.40423621364746,
      "p99_latency_ms": 94.86307533046664,
      "p999_latency_ms": 125.74696115701113,
      "status_codes": {
        "200": 122822,
        "502": 564
      },
      "bytes_per_sec": 0,
      "connection_errors": 564
    },
    "http_version": "2",
    "instance_family": "c2",
    "instance_type": "c2-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 20348.53998841214,
        "tailscale": 1369.7156931557527,
        "delta_pct": -93.26872741761443
      },
      "p50_latency": {
        "baseline_ms": 0.719622593927857,
        "tailscale_ms": 17.64191322451171,
        "delta_pct": 2351.5507674958208
      },
      "p99_latency": {
        "baseline_ms": 3.1081642354557517,
        "tailscale_ms": 94.86307533046664,
        "delta_pct": 2952.0612214867992
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-4-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 4,
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
      "qps": 20322.158306536498,
      "avg_latency_ms": 0.8106680725830556,
      "p50_latency_ms": 0.7246062739225688,
      "p90_latency_ms": 1.6334098170799651,
      "p99_latency_ms": 3.092780745543218,
      "p999_latency_ms": 4.647267514997664,
      "status_codes": {
        "200": 1829035
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c2",
    "instance_type": "c2-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 37562.24354849003,
        "tailscale": 20322.158306536498,
        "delta_pct": -45.897378892445225
      },
      "p50_latency": {
        "baseline_ms": 0.5785275283735961,
        "tailscale_ms": 0.7246062739225688,
        "delta_pct": 25.250094141525338
      },
      "p99_latency": {
        "baseline_ms": 2.5280082676303928,
        "tailscale_ms": 3.092780745543218,
        "delta_pct": 22.34061039848616
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-8-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 8,
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
      "qps": 1303.2670813252262,
      "avg_latency_ms": 12.260883754767008,
      "p50_latency_ms": 2.8236472945891786,
      "p90_latency_ms": 29.834146341463363,
      "p99_latency_ms": 127.41883408071753,
      "p999_latency_ms": 190.98444444444573,
      "status_codes": {
        "200": 38401,
        "502": 827
      },
      "bytes_per_sec": 0,
      "connection_errors": 827
    },
    "http_version": "1.1",
    "instance_family": "c2",
    "instance_type": "c2-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 49928.504210476065,
        "tailscale": 1303.2670813252262,
        "delta_pct": -97.38973337588637
      },
      "p50_latency": {
        "baseline_ms": 0.5363806481311483,
        "tailscale_ms": 2.8236472945891786,
        "delta_pct": 426.4260193627978
      },
      "p99_latency": {
        "baseline_ms": 2.045622062271556,
        "tailscale_ms": 127.41883408071753,
        "delta_pct": 6128.855096489602
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-8-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 8,
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
      "qps": 2156.1883000377,
      "avg_latency_ms": 8.615235420340168,
      "p50_latency_ms": 5.414373985237339,
      "p90_latency_ms": 20.50925236964955,
      "p99_latency_ms": 36.64110641689509,
      "p999_latency_ms": 51.520556514913885,
      "status_codes": {
        "200": 193960,
        "502": 209
      },
      "bytes_per_sec": 0,
      "connection_errors": 209
    },
    "http_version": "2",
    "instance_family": "c2",
    "instance_type": "c2-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 32136.97245554229,
        "tailscale": 2156.1883000377,
        "delta_pct": -93.2906302763257
      },
      "p50_latency": {
        "baseline_ms": 0.6139462216658013,
        "tailscale_ms": 5.414373985237339,
        "delta_pct": 781.8971099042984
      },
      "p99_latency": {
        "baseline_ms": 1.9804066736655395,
        "tailscale_ms": 36.64110641689509,
        "delta_pct": 1750.1809201175827
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c2/results/c2-standard-8-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 8,
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
      "qps": 43151.6079095824,
      "avg_latency_ms": 0.3703772326556413,
      "p50_latency_ms": 0.5782913108917539,
      "p90_latency_ms": 0.9169616828220791,
      "p99_latency_ms": 0.9931625165064023,
      "p999_latency_ms": 1.549458842836507,
      "status_codes": {
        "200": 3883715
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c3",
    "instance_type": "c3-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 96413.718808359,
        "tailscale": 43151.6079095824,
        "delta_pct": -55.24329064066639
      },
      "p50_latency": {
        "baseline_ms": 0.5102777159110329,
        "tailscale_ms": 0.5782913108917539,
        "delta_pct": 13.328740969864187
      },
      "p99_latency": {
        "baseline_ms": 0.996457407011078,
        "tailscale_ms": 0.9931625165064023,
        "delta_pct": -0.33066044584473187
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3/results/c3-standard-4-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 4,
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
      "qps": 1649.0070337327654,
      "avg_latency_ms": 15.474090308948954,
      "p50_latency_ms": 11.581992899652183,
      "p90_latency_ms": 33.09682101665751,
      "p99_latency_ms": 70.37755345405766,
      "p999_latency_ms": 93.27592156862825,
      "status_codes": {
        "200": 147455,
        "502": 1036
      },
      "bytes_per_sec": 0,
      "connection_errors": 1036
    },
    "http_version": "1.1",
    "instance_family": "c3",
    "instance_type": "c3-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 96288.5279264502,
        "tailscale": 1649.0070337327654,
        "delta_pct": -98.28743146328672
      },
      "p50_latency": {
        "baseline_ms": 0.5102732066763823,
        "tailscale_ms": 11.581992899652183,
        "delta_pct": 2169.763089285136
      },
      "p99_latency": {
        "baseline_ms": 0.996581759252822,
        "tailscale_ms": 70.37755345405766,
        "delta_pct": 6961.894601284152
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3/results/c3-standard-4-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 4,
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
      "qps": 1581.2265602574578,
      "avg_latency_ms": 16.04024485115452,
      "p50_latency_ms": 12.364671536292683,
      "p90_latency_ms": 33.81067013522559,
      "p99_latency_ms": 67.6238809854743,
      "p999_latency_ms": 84.231361298564,
      "status_codes": {
        "200": 141240,
        "502": 1198
      },
      "bytes_per_sec": 0,
      "connection_errors": 1198
    },
    "http_version": "2",
    "instance_family": "c3",
    "instance_type": "c3-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 31294.195065774184,
        "tailscale": 1581.2265602574578,
        "delta_pct": -94.94722086018179
      },
      "p50_latency": {
        "baseline_ms": 0.6199130961771244,
        "tailscale_ms": 12.364671536292683,
        "delta_pct": 1894.5814360985512
      },
      "p99_latency": {
        "baseline_ms": 1.9903271800362747,
        "tailscale_ms": 67.6238809854743,
        "delta_pct": 3297.626363331973
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3/results/c3-standard-4-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 4,
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
      "qps": 50562.27785681122,
      "avg_latency_ms": 0.31606863564465304,
      "p50_latency_ms": 0.5805976677317536,
      "p90_latency_ms": 0.9165946449446993,
      "p99_latency_ms": 0.9921939648176122,
      "p999_latency_ms": 0.9997538968049035,
      "status_codes": {
        "200": 4550657
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c3",
    "instance_type": "c3-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 96816.70616227757,
        "tailscale": 50562.27785681122,
        "delta_pct": -47.77525505560768
      },
      "p50_latency": {
        "baseline_ms": 0.5102535511804547,
        "tailscale_ms": 0.5805976677317536,
        "delta_pct": 13.786110138490976
      },
      "p99_latency": {
        "baseline_ms": 0.9967786930256954,
        "tailscale_ms": 0.9921939648176122,
        "delta_pct": -0.45995447536768447
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3/results/c3-standard-8-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 8,
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
      "qps": 1329.0280758841034,
      "avg_latency_ms": 20.043032315774603,
      "p50_latency_ms": 16.731459069658623,
      "p90_latency_ms": 40.97568726132735,
      "p99_latency_ms": 72.71618330544715,
      "p999_latency_ms": 95.64879432624176,
      "status_codes": {
        "200": 79095,
        "502": 713
      },
      "bytes_per_sec": 0,
      "connection_errors": 713
    },
    "http_version": "1.1",
    "instance_family": "c3",
    "instance_type": "c3-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 97110.3918235698,
        "tailscale": 1329.0280758841034,
        "delta_pct": -98.63142548297131
      },
      "p50_latency": {
        "baseline_ms": 0.510292906900205,
        "tailscale_ms": 16.731459069658623,
        "delta_pct": 3178.7951475348837
      },
      "p99_latency": {
        "baseline_ms": 0.9965773161654624,
        "tailscale_ms": 72.71618330544715,
        "delta_pct": 7196.59225891652
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3/results/c3-standard-8-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 8,
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
      "qps": 1601.045496412391,
      "avg_latency_ms": 15.971248985801019,
      "p50_latency_ms": 12.421741447873254,
      "p90_latency_ms": 32.82601234008691,
      "p99_latency_ms": 68.8179559819999,
      "p999_latency_ms": 87.04280423280483,
      "status_codes": {
        "200": 143089,
        "502": 1068
      },
      "bytes_per_sec": 0,
      "connection_errors": 1068
    },
    "http_version": "2",
    "instance_family": "c3",
    "instance_type": "c3-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 31204.239138809175,
        "tailscale": 1601.045496412391,
        "delta_pct": -94.86914105070697
      },
      "p50_latency": {
        "baseline_ms": 0.6213141633998954,
        "tailscale_ms": 12.421741447873254,
        "delta_pct": 1899.2689978126684
      },
      "p99_latency": {
        "baseline_ms": 1.9913791979037503,
        "tailscale_ms": 68.8179559819999,
        "delta_pct": 3355.793655695609
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3/results/c3-standard-8-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.240.20.3",
      "hops": [
        {
          "hop": 1,
          "host": "10.240.19.1",
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
          "host": "10.0.0.62",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 0.8,
          "stdev_ms": 0
        },
        {
          "hop": 3,
          "host": "10.240.20.3",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.3,
          "best_ms": 0.2,
          "worst_ms": 0.5,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 18374.7675431344,
          "retransmits": 38248,
          "duration_sec": 30.001751,
          "bytes_transferred": 68909400064
        },
        {
          "bandwidth_mbps": 18601.31269117041,
          "retransmits": 113373,
          "duration_sec": 30.001701,
          "bytes_transferred": 69758877696
        },
        {
          "bandwidth_mbps": 18495.5071595909,
          "retransmits": 89547,
          "duration_sec": 30.000527,
          "bytes_transferred": 69359370240
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18490.52913129857,
        "bandwidth_mbps_min": 18374.7675431344,
        "bandwidth_mbps_max": 18601.31269117041,
        "bandwidth_mbps_stddev": 92.55362985470937,
        "retransmits_avg": 80389.33333333333
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 18496.933489479874,
          "retransmits": 5653,
          "duration_sec": 30.000878,
          "bytes_transferred": 69365530624
        },
        {
          "bandwidth_mbps": 17928.4763908707,
          "retransmits": 7678,
          "duration_sec": 30.001297,
          "bytes_transferred": 67234693120
        },
        {
          "bandwidth_mbps": 17719.4834525855,
          "retransmits": 6354,
          "duration_sec": 30.001273,
          "bytes_transferred": 66450882560
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18048.29777764536,
        "bandwidth_mbps_min": 17719.4834525855,
        "bandwidth_mbps_max": 18496.933489479874,
        "bandwidth_mbps_stddev": 328.5067361188783,
        "retransmits_avg": 6561.666666666667
      }
    },
    "cloud_provider": "gke",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-4",
    "kernel_version": "6.12.55+",
    "overhead": {
      "bandwidth_pct": 93.73327654244032,
      "retransmits_pct": 96.14957208253169
    },
    "overhead_single": {
      "bandwidth_pct": 93.38303595615656,
      "retransmits_pct": 91.34366268732538
    },
    "region": "us-central1",
    "source": "gke/c3d/results/c3d-standard-4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 0,
      "mtu_tailscale": 0,
      "tcp_rmem": "4096\t87380\t6291456",
      "tcp_wmem": "4096\t16384\t4194304",
      "kernel_full": "Linux tb-gke-server-c3d-standard-4 6.12.55+ #1 SMP Sun Feb  1 08:53:53 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.92.8.103",
      "hops": [
        {
          "hop": 1,
          "host": "100.92.8.103",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.8,
          "avg_ms": 0.8,
          "best_ms": 0.7,
          "worst_ms": 1.1,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1167.417928840795,
          "retransmits": 3093,
          "duration_sec": 30.000813,
          "bytes_transferred": 4377935872
        },
        {
          "bandwidth_mbps": 1154.1739132840448,
          "retransmits": 3604,
          "duration_sec": 30.001653,
          "bytes_transferred": 4328390656
        },
        {
          "bandwidth_mbps": 1154.6591373691365,
          "retransmits": 2589,
          "duration_sec": 30.000851,
          "bytes_transferred": 4330094592
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1158.750326497992,
        "bandwidth_mbps_min": 1154.1739132840448,
        "bandwidth_mbps_max": 1167.417928840795,
        "bandwidth_mbps_stddev": 6.132120806752454,
        "retransmits_avg": 3095.3333333333335
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1192.4337650559721,
          "retransmits": 561,
          "duration_sec": 30.001052,
          "bytes_transferred": 4471783424
        },
        {
          "bandwidth_mbps": 1208.4919640117323,
          "retransmits": 342,
          "duration_sec": 30.000666,
          "bytes_transferred": 4531945472
        },
        {
          "bandwidth_mbps": 1181.822394350052,
          "retransmits": 801,
          "duration_sec": 30.000701,
          "bytes_transferred": 4431937536
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1194.2493744725855,
        "bandwidth_mbps_min": 1181.822394350052,
        "bandwidth_mbps_max": 1208.4919640117323,
        "bandwidth_mbps_stddev": 10.963235977577531,
        "retransmits_avg": 568
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gke",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 30090.085224793205,
      "avg_latency_ms": 0.5313650794285115,
      "p50_latency_ms": 0.6125990812617305,
      "p90_latency_ms": 0.9318283868644944,
      "p99_latency_ms": 1.3300539100924582,
      "p999_latency_ms": 1.9815956004782869,
      "status_codes": {
        "200": 2708167
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c3d",
    "instance_type": "c3d-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 97662.84126840386,
        "tailscale": 30090.085224793205,
        "delta_pct": -69.18983224940433
      },
      "p50_latency": {
        "baseline_ms": 0.5102694998462226,
        "tailscale_ms": 0.6125990812617305,
        "delta_pct": 20.054026636188603
      },
      "p99_latency": {
        "baseline_ms": 0.9965299882917114,
        "tailscale_ms": 1.3300539100924582,
        "delta_pct": 33.468528365361685
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3d/results/c3d-standard-4-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 4,
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
      "qps": 1636.3373300890069,
      "avg_latency_ms": 17.084120990969506,
      "p50_latency_ms": 13.595506852262607,
      "p90_latency_ms": 36.643928769385475,
      "p99_latency_ms": 71.56250376834498,
      "p999_latency_ms": 96.69420551185014,
      "status_codes": {
        "200": 146256,
        "502": 1166
      },
      "bytes_per_sec": 0,
      "connection_errors": 1166
    },
    "http_version": "1.1",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 97824.91351021371,
        "tailscale": 1636.3373300890069,
        "delta_pct": -98.32727955346655
      },
      "p50_latency": {
        "baseline_ms": 0.5100422692900214,
        "tailscale_ms": 13.595506852262607,
        "delta_pct": 2565.5647327401994
      },
      "p99_latency": {
        "baseline_ms": 0.9964795846942788,
        "tailscale_ms": 71.56250376834498,
        "delta_pct": 7081.532353249409
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3d/results/c3d-standard-4-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 4,
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
      "qps": 1629.702309079447,
      "avg_latency_ms": 16.836855427023107,
      "p50_latency_ms": 13.35657173069194,
      "p90_latency_ms": 35.31199556494919,
      "p99_latency_ms": 68.77626099648586,
      "p999_latency_ms": 83.92659001254252,
      "status_codes": {
        "200": 145662,
        "502": 1101
      },
      "bytes_per_sec": 0,
      "connection_errors": 1101
    },
    "http_version": "2",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 31402.84068025177,
        "tailscale": 1629.702309079447,
        "delta_pct": -94.81033475387368
      },
      "p50_latency": {
        "baseline_ms": 0.6181454171267152,
        "tailscale_ms": 13.35657173069194,
        "delta_pct": 2060.74913129283
      },
      "p99_latency": {
        "baseline_ms": 1.9876405662947507,
        "tailscale_ms": 68.77626099648586,
        "delta_pct": 3360.196081864778
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3d/results/c3d-standard-4-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 4,
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
      "qps": 18895.581875917676,
      "avg_latency_ms": 0.847997682477205,
      "p50_latency_ms": 0.7165728631959718,
      "p90_latency_ms": 1.7955988752514307,
      "p99_latency_ms": 3.4023941355941276,
      "p999_latency_ms": 4.79211758421179,
      "status_codes": {
        "200": 1700649
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c3d",
    "instance_type": "c3d-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 92664.35700285644,
        "tailscale": 18895.581875917676,
        "delta_pct": -79.60857606195313
      },
      "p50_latency": {
        "baseline_ms": 0.5115699370930225,
        "tailscale_ms": 0.7165728631959718,
        "delta_pct": 40.073294233799395
      },
      "p99_latency": {
        "baseline_ms": 1.091987001435293,
        "tailscale_ms": 3.4023941355941276,
        "delta_pct": 211.57826339709783
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3d/results/c3d-standard-8-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 8,
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
      "qps": 1542.3714787343022,
      "avg_latency_ms": 17.895857000433015,
      "p50_latency_ms": 14.187509079766222,
      "p90_latency_ms": 36.14664794464041,
      "p99_latency_ms": 76.95852344412451,
      "p999_latency_ms": 118.57942512077443,
      "status_codes": {
        "200": 137718,
        "502": 1407
      },
      "bytes_per_sec": 0,
      "connection_errors": 1407
    },
    "http_version": "1.1",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 60118.63198965235,
        "tailscale": 1542.3714787343022,
        "delta_pct": -97.43445346693888
      },
      "p50_latency": {
        "baseline_ms": 0.5228374132395662,
        "tailscale_ms": 14.187509079766222,
        "delta_pct": 2613.560414863702
      },
      "p99_latency": {
        "baseline_ms": 1.867142628317542,
        "tailscale_ms": 76.95852344412451,
        "delta_pct": 4021.7270859200958
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3d/results/c3d-standard-8-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 8,
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
      "qps": 1148.609323093376,
      "avg_latency_ms": 25.592274836978298,
      "p50_latency_ms": 21.769406807117818,
      "p90_latency_ms": 49.340853264420595,
      "p99_latency_ms": 83.5117210415113,
      "p999_latency_ms": 104.738874547102,
      "status_codes": {
        "200": 67546,
        "502": 1431
      },
      "bytes_per_sec": 0,
      "connection_errors": 1431
    },
    "http_version": "2",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 23841.064136219517,
        "tailscale": 1148.609323093376,
        "delta_pct": -95.1822229220532
      },
      "p50_latency": {
        "baseline_ms": 0.7337283536358054,
        "tailscale_ms": 21.769406807117818,
        "delta_pct": 2866.9572804764907
      },
      "p99_latency": {
        "baseline_ms": 2.712444283185468,
        "tailscale_ms": 83.5117210415113,
        "delta_pct": 2978.836367596681
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c3d/results/c3d-standard-8-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 8,
    "zone": "us-central1-a"
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gke",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 1555.3211286024264,
      "avg_latency_ms": 16.201428763515544,
      "p50_latency_ms": 12.44578718003826,
      "p90_latency_ms": 34.85192520752915,
      "p99_latency_ms": 68.09054583072995,
      "p999_latency_ms": 86.02595867634926,
      "status_codes": {
        "200": 138895,
        "502": 1190
      },
      "bytes_per_sec": 0,
      "connection_errors": 1190
    },
    "http_version": "2",
    "instance_family": "c4",
    "instance_type": "c4-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 31811.22735354213,
        "tailscale": 1555.3211286024264,
        "delta_pct": -95.1107792499894
      },
      "p50_latency": {
        "baseline_ms": 0.6154080982603441,
        "tailscale_ms": 12.44578718003826,
        "delta_pct": 1922.3632440360177
      },
      "p99_latency": {
        "baseline_ms": 1.983048228663984,
        "tailscale_ms": 68.09054583072995,
        "delta_pct": 3333.6303498076695
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c4/results/c4-standard-2-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gke",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 41779.83217274593,
      "avg_latency_ms": 0.3825641439013136,
      "p50_latency_ms": 0.5656695890568733,
      "p90_latency_ms": 0.9203548929217901,
      "p99_latency_ms": 1.019251947660843,
      "p999_latency_ms": 2.0142361910356636,
      "status_codes": {
        "200": 3760241
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c4",
    "instance_type": "c4-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 95664.03641825261,
        "tailscale": 41779.83217274593,
        "delta_pct": -56.32650080738766
      },
      "p50_latency": {
        "baseline_ms": 0.5106215012173138,
        "tailscale_ms": 0.5656695890568733,
        "delta_pct": 10.780605146537251
      },
      "p99_latency": {
        "baseline_ms": 0.9967395711757853,
        "tailscale_ms": 1.019251947660843,
        "delta_pct": 2.2586016584554245
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c4/results/c4-standard-4-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 4,
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
      "qps": 1580.0065951920867,
      "avg_latency_ms": 17.061007564519645,
      "p50_latency_ms": 13.289899794201778,
      "p90_latency_ms": 37.77932346057874,
      "p99_latency_ms": 71.38092087901447,
      "p999_latency_ms": 96.47003036709249,
      "status_codes": {
        "200": 140856,
        "502": 1417
      },
      "bytes_per_sec": 0,
      "connection_errors": 1417
    },
    "http_version": "1.1",
    "instance_family": "c4",
    "instance_type": "c4-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 95245.50429890887,
        "tailscale": 1580.0065951920867,
        "delta_pct": -98.34112212768221
      },
      "p50_latency": {
        "baseline_ms": 0.5102958592159826,
        "tailscale_ms": 13.289899794201778,
        "delta_pct": 2504.3518782653555
      },
      "p99_latency": {
        "baseline_ms": 0.9966877016939807,
        "tailscale_ms": 71.38092087901447,
        "delta_pct": 7061.81415278775
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c4/results/c4-standard-4-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 4,
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
      "qps": 1532.4884105541278,
      "avg_latency_ms": 17.595507396525637,
      "p50_latency_ms": 13.929859284634645,
      "p90_latency_ms": 38.385998051997404,
      "p99_latency_ms": 69.25207498631637,
      "p999_latency_ms": 84.57302539281771,
      "status_codes": {
        "200": 136760,
        "502": 1223
      },
      "bytes_per_sec": 0,
      "connection_errors": 1223
    },
    "http_version": "2",
    "instance_family": "c4",
    "instance_type": "c4-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 30989.378258480196,
        "tailscale": 1532.4884105541278,
        "delta_pct": -95.05479458874021
      },
      "p50_latency": {
        "baseline_ms": 0.6223551175478799,
        "tailscale_ms": 13.929859284634645,
        "delta_pct": 2138.249335768172
      },
      "p99_latency": {
        "baseline_ms": 1.9919063925745109,
        "tailscale_ms": 69.25207498631637,
        "delta_pct": 3376.6731631805774
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/c4/results/c4-standard-4-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 4,
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
      "qps": 35165.3492767558,
      "avg_latency_ms": 0.4544853106986782,
      "p50_latency_ms": 0.6171407473545327,
      "p90_latency_ms": 0.9296672710559862,
      "p99_latency_ms": 1.0131473331456142,
      "p999_latency_ms": 1.9616869115700055,
      "status_codes": {
        "200": 3164924
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "n2",
    "instance_type": "n2-standard-16",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 95602.80839064826,
        "tailscale": 35165.3492767558,
        "delta_pct": -63.21724239201782
      },
      "p50_latency": {
        "baseline_ms": 0.5105845732062378,
        "tailscale_ms": 0.6171407473545327,
        "delta_pct": 20.869446461958454
      },
      "p99_latency": {
        "baseline_ms": 0.9968039806671354,
        "tailscale_ms": 1.0131473331456142,
        "delta_pct": 1.6395753624038156
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-16-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 16,
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
      "qps": 1592.9647790081478,
      "avg_latency_ms": 15.739356806259408,
      "p50_latency_ms": 11.755987910337609,
      "p90_latency_ms": 34.052575001182014,
      "p99_latency_ms": 69.35212429966553,
      "p999_latency_ms": 94.785321641999,
      "status_codes": {
        "200": 142512,
        "502": 1004
      },
      "bytes_per_sec": 0,
      "connection_errors": 1004
    },
    "http_version": "1.1",
    "instance_family": "n2",
    "instance_type": "n2-standard-16",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 95699.15955577843,
        "tailscale": 1592.9647790081478,
        "delta_pct": -98.33544538279911
      },
      "p50_latency": {
        "baseline_ms": 0.5106103572173287,
        "tailscale_ms": 11.755987910337609,
        "delta_pct": 2202.3402765279125
      },
      "p99_latency": {
        "baseline_ms": 0.9968707126967512,
        "tailscale_ms": 69.35212429966553,
        "delta_pct": 6856.982827999132
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-16-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 16,
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
      "qps": 1582.9582460431404,
      "avg_latency_ms": 15.925055872191097,
      "p50_latency_ms": 12.207943724027393,
      "p90_latency_ms": 31.02808102766787,
      "p99_latency_ms": 73.5322231776805,
      "p999_latency_ms": 101.17418925519006,
      "status_codes": {
        "200": 141322,
        "502": 1246
      },
      "bytes_per_sec": 0,
      "connection_errors": 1246
    },
    "http_version": "2",
    "instance_family": "n2",
    "instance_type": "n2-standard-16",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 30494.9983990215,
        "tailscale": 1582.9582460431404,
        "delta_pct": -94.80912172766688
      },
      "p50_latency": {
        "baseline_ms": 0.627283390905136,
        "tailscale_ms": 12.207943724027393,
        "delta_pct": 1846.160842296811
      },
      "p99_latency": {
        "baseline_ms": 2.0122058380902157,
        "tailscale_ms": 73.5322231776805,
        "delta_pct": 3554.3092056362357
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-16-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 16,
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
      "qps": 18755.524135742115,
      "avg_latency_ms": 0.8522933097975472,
      "p50_latency_ms": 0.7525398665384309,
      "p90_latency_ms": 1.5901310832506663,
      "p99_latency_ms": 1.9829819082550173,
      "p999_latency_ms": 3.5671637313284896,
      "status_codes": {
        "200": 1688062
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "n2",
    "instance_type": "n2-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 96955.66206055175,
        "tailscale": 18755.524135742115,
        "delta_pct": -80.6555659183383
      },
      "p50_latency": {
        "baseline_ms": 0.5101128517087846,
        "tailscale_ms": 0.7525398665384309,
        "delta_pct": 47.52419273844212
      },
      "p99_latency": {
        "baseline_ms": 0.996625220903558,
        "tailscale_ms": 1.9829819082550173,
        "delta_pct": 98.96966950697987
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-2-l4-lb.json",
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
      "qps": 680.1568509730652,
      "avg_latency_ms": 23.489864923358915,
      "p50_latency_ms": 10.257306889352817,
      "p90_latency_ms": 74.43665158371039,
      "p99_latency_ms": 157.7880000000001,
      "p999_latency_ms": 228.3434210526332,
      "status_codes": {
        "200": 19587,
        "502": 872
      },
      "bytes_per_sec": 0,
      "connection_errors": 872
    },
    "http_version": "1.1",
    "instance_family": "n2",
    "instance_type": "n2-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 49656.24922962303,
        "tailscale": 680.1568509730652,
        "delta_pct": -98.63026937892984
      },
      "p50_latency": {
        "baseline_ms": 0.5364941347929415,
        "tailscale_ms": 10.257306889352817,
        "delta_pct": 1811.91407773947
      },
      "p99_latency": {
        "baseline_ms": 2.045475852361573,
        "tailscale_ms": 157.7880000000001,
        "delta_pct": 7613.999645501968
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-2-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
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
      "qps": 1009.7223755276169,
      "avg_latency_ms": 28.402403908118032,
      "p50_latency_ms": 22.839219930830794,
      "p90_latency_ms": 56.17481441639175,
      "p99_latency_ms": 113.50877613379235,
      "p999_latency_ms": 147.24312051274202,
      "status_codes": {
        "200": 89609,
        "502": 1526
      },
      "bytes_per_sec": 0,
      "connection_errors": 1526
    },
    "http_version": "2",
    "instance_family": "n2",
    "instance_type": "n2-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 27177.44655508785,
        "tailscale": 1009.7223755276169,
        "delta_pct": -96.28470476988727
      },
      "p50_latency": {
        "baseline_ms": 0.6592149029024551,
        "tailscale_ms": 22.839219930830794,
        "delta_pct": 3364.609163153331
      },
      "p99_latency": {
        "baseline_ms": 2.394277301165691,
        "tailscale_ms": 113.50877613379235,
        "delta_pct": 4640.836664096045
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-2-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
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
      "qps": 17253.82629914805,
      "avg_latency_ms": 0.926736296460911,
      "p50_latency_ms": 0.8176205407408768,
      "p90_latency_ms": 1.7260997997739393,
      "p99_latency_ms": 2.0508982060740215,
      "p999_latency_ms": 3.3186025275013495,
      "status_codes": {
        "200": 1552891
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "n2",
    "instance_type": "n2-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 50204.79728463568,
        "tailscale": 17253.82629914805,
        "delta_pct": -65.6331123073207
      },
      "p50_latency": {
        "baseline_ms": 0.5361972500055393,
        "tailscale_ms": 0.8176205407408768,
        "delta_pct": 52.48503059880112
      },
      "p99_latency": {
        "baseline_ms": 1.994755428557885,
        "tailscale_ms": 2.0508982060740215,
        "delta_pct": 2.8145193497092076
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-4-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 4,
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
      "qps": 982.6732093499912,
      "avg_latency_ms": 27.6188761099326,
      "p50_latency_ms": 21.35374291899929,
      "p90_latency_ms": 56.11611412393707,
      "p99_latency_ms": 126.3564334051435,
      "p999_latency_ms": 178.137777790281,
      "status_codes": {
        "200": 87201,
        "502": 1368
      },
      "bytes_per_sec": 0,
      "connection_errors": 1368
    },
    "http_version": "1.1",
    "instance_family": "n2",
    "instance_type": "n2-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 49247.49302140449,
        "tailscale": 982.6732093499912,
        "delta_pct": -98.00462287710181
      },
      "p50_latency": {
        "baseline_ms": 0.5368371128722549,
        "tailscale_ms": 21.35374291899929,
        "delta_pct": 3877.694985495647
      },
      "p99_latency": {
        "baseline_ms": 2.03798161280114,
        "tailscale_ms": 126.3564334051435,
        "delta_pct": 6100.077204399831
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-4-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 4,
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
      "qps": 963.8003164497618,
      "avg_latency_ms": 34.14109677445269,
      "p50_latency_ms": 31.300105906450963,
      "p90_latency_ms": 54.662714614740366,
      "p99_latency_ms": 109.12079976074031,
      "p999_latency_ms": 139.52322916666702,
      "status_codes": {
        "200": 57066,
        "502": 834
      },
      "bytes_per_sec": 0,
      "connection_errors": 834
    },
    "http_version": "2",
    "instance_family": "n2",
    "instance_type": "n2-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 16148.683188531484,
        "tailscale": 963.8003164497618,
        "delta_pct": -94.03170955057043
      },
      "p50_latency": {
        "baseline_ms": 0.8063441066729845,
        "tailscale_ms": 31.300105906450963,
        "delta_pct": 3781.7305970768166
      },
      "p99_latency": {
        "baseline_ms": 4.183440327075214,
        "tailscale_ms": 109.12079976074031,
        "delta_pct": 2508.3986200188106
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-4-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 4,
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
      "qps": 18706.84562473623,
      "avg_latency_ms": 0.8715143802822762,
      "p50_latency_ms": 0.7479624130218294,
      "p90_latency_ms": 1.6093892059755888,
      "p99_latency_ms": 3.032504998599618,
      "p999_latency_ms": 4.417344876444113,
      "status_codes": {
        "200": 1683678
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "n2",
    "instance_type": "n2-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 58240.20566860994,
        "tailscale": 18706.84562473623,
        "delta_pct": -67.87984278218514
      },
      "p50_latency": {
        "baseline_ms": 0.5263972702505795,
        "tailscale_ms": 0.7479624130218294,
        "delta_pct": 42.090860894050394
      },
      "p99_latency": {
        "baseline_ms": 1.912988829938883,
        "tailscale_ms": 3.032504998599618,
        "delta_pct": 58.52183510640266
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-8-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 8,
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
      "qps": 635.2441179198273,
      "avg_latency_ms": 37.42737407906802,
      "p50_latency_ms": 30.228557140059635,
      "p90_latency_ms": 73.79466392979424,
      "p99_latency_ms": 146.3411730657919,
      "p999_latency_ms": 198.8596137129707,
      "status_codes": {
        "200": 36978,
        "502": 1239
      },
      "bytes_per_sec": 0,
      "connection_errors": 1239
    },
    "http_version": "1.1",
    "instance_family": "n2",
    "instance_type": "n2-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 49628.9578678809,
        "tailscale": 635.2441179198273,
        "delta_pct": -98.7200131834101
      },
      "p50_latency": {
        "baseline_ms": 0.5367494710094899,
        "tailscale_ms": 30.228557140059635,
        "delta_pct": 5531.781449771599
      },
      "p99_latency": {
        "baseline_ms": 2.592662626502919,
        "tailscale_ms": 146.3411730657919,
        "delta_pct": 5544.435630376729
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-8-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 8,
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
      "qps": 40.78752680915158,
      "avg_latency_ms": 391.9484824712557,
      "p50_latency_ms": 31.358024691358025,
      "p90_latency_ms": 3000.55510501375,
      "p99_latency_ms": 3002.9308746013753,
      "p999_latency_ms": 3003.168451560138,
      "status_codes": {
        "-1": 160,
        "200": 1075,
        "502": 87
      },
      "bytes_per_sec": 0,
      "connection_errors": 247
    },
    "http_version": "2",
    "instance_family": "n2",
    "instance_type": "n2-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 15659.038692680488,
        "tailscale": 40.78752680915158,
        "delta_pct": -99.73952726211593
      },
      "p50_latency": {
        "baseline_ms": 0.8592290720003771,
        "tailscale_ms": 31.358024691358025,
        "delta_pct": 3549.5535024615956
      },
      "p99_latency": {
        "baseline_ms": 3.821727237204904,
        "tailscale_ms": 3002.9308746013753,
        "delta_pct": 78475.22759258006
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n2/results/n2-standard-8-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.240.20.3",
      "hops": [
        {
          "hop": 1,
          "host": "10.240.19.1",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.2,
          "stdev_ms": 0
        },
        {
          "hop": 2,
          "host": "10.0.15.243",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.5,
          "avg_ms": 0.3,
          "best_ms": 0.3,
          "worst_ms": 0.9,
          "stdev_ms": 0.1
        },
        {
          "hop": 3,
          "host": "10.240.20.3",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.3,
          "best_ms": 0.2,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9148.98845215522,
          "retransmits": 20573,
          "duration_sec": 30.001529,
          "bytes_transferred": 34310455296
        },
        {
          "bandwidth_mbps": 9223.81020090473,
          "retransmits": 94052,
          "duration_sec": 30.000986,
          "bytes_transferred": 34590425088
        },
        {
          "bandwidth_mbps": 9258.079006785629,
          "retransmits": 10189,
          "duration_sec": 30.001499,
          "bytes_transferred": 34719531008
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9210.29255328186,
        "bandwidth_mbps_min": 9148.98845215522,
        "bandwidth_mbps_max": 9258.079006785629,
        "bandwidth_mbps_stddev": 45.55020947873283,
        "retransmits_avg": 41604.666666666664
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9421.32345570475,
          "retransmits": 2208,
          "duration_sec": 30.001533,
          "bytes_transferred": 35331768320
        },
        {
          "bandwidth_mbps": 9322.669925526707,
          "retransmits": 312,
          "duration_sec": 30.001493,
          "bytes_transferred": 34961752064
        },
        {
          "bandwidth_mbps": 9240.75090453992,
          "retransmits": 81349,
          "duration_sec": 30.002269,
          "bytes_transferred": 34655436800
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9328.248095257126,
        "bandwidth_mbps_min": 9240.75090453992,
        "bandwidth_mbps_max": 9421.32345570475,
        "bandwidth_mbps_stddev": 73.82388295441103,
        "retransmits_avg": 27956.333333333332
      }
    },
    "cloud_provider": "gke",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "container",
    "instance_family": "n4",
    "instance_type": "n4-standard-2",
    "kernel_version": "6.12.55+",
    "overhead": {
      "bandwidth_pct": 88.38288033846298,
      "retransmits_pct": 93.55761372922909
    },
    "overhead_single": {
      "bandwidth_pct": 88.4188475923893,
      "retransmits_pct": 98.55965851506515
    },
    "region": "us-central1",
    "source": "gke/n4/results/n4-standard-2-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 0,
      "mtu_tailscale": 0,
      "tcp_rmem": "4096\t87380\t6291456",
      "tcp_wmem": "4096\t16384\t4194304",
      "kernel_full": "Linux tb-gke-server-n4-standard-2 6.12.55+ #1 SMP Sun Feb  1 08:53:53 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.66.242.23",
      "hops": [
        {
          "hop": 1,
          "host": "100.66.242.23",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1,
          "avg_ms": 0.9,
          "best_ms": 0.7,
          "worst_ms": 1.6,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1065.0590230220962,
          "retransmits": 2143,
          "duration_sec": 30.001395,
          "bytes_transferred": 3994157056
        },
        {
          "bandwidth_mbps": 1070.6126488696648,
          "retransmits": 3035,
          "duration_sec": 30.001495,
          "bytes_transferred": 4014997504
        },
        {
          "bandwidth_mbps": 1074.2404493854,
          "retransmits": 2863,
          "duration_sec": 30.003645,
          "bytes_transferred": 4028891136
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1069.970707092387,
        "bandwidth_mbps_min": 1065.0590230220962,
        "bandwidth_mbps_max": 1074.2404493854,
        "bandwidth_mbps_stddev": 3.775686643976506,
        "retransmits_avg": 2680.3333333333335
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1085.2610458237527,
          "retransmits": 231,
          "duration_sec": 30.001384,
          "bytes_transferred": 4069916672
        },
        {
          "bandwidth_mbps": 1077.3003991383277,
          "retransmits": 754,
          "duration_sec": 30.00213,
          "bytes_transferred": 4040163328
        },
        {
          "bandwidth_mbps": 1078.3944416532286,
          "retransmits": 223,
          "duration_sec": 30.000863,
          "bytes_transferred": 4044095488
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1080.3186288717698,
        "bandwidth_mbps_min": 1077.3003991383277,
        "bandwidth_mbps_max": 1085.2610458237527,
        "bandwidth_mbps_stddev": 3.523241523705097,
        "retransmits_avg": 402.6666666666667
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
      "qps": 28169.64021575912,
      "avg_latency_ms": 0.5675311431548894,
      "p50_latency_ms": 0.586253901697802,
      "p90_latency_ms": 0.9400039935874762,
      "p99_latency_ms": 1.7461065721745301,
      "p999_latency_ms": 2.741486399096782,
      "status_codes": {
        "200": 2535343
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "n4",
    "instance_type": "n4-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 96940.91066896985,
        "tailscale": 28169.64021575912,
        "delta_pct": -70.941432238086
      },
      "p50_latency": {
        "baseline_ms": 0.510395972403877,
        "tailscale_ms": 0.586253901697802,
        "delta_pct": 14.86256424333586
      },
      "p99_latency": {
        "baseline_ms": 0.9965602330241591,
        "tailscale_ms": 1.7461065721745301,
        "delta_pct": 75.21335031358815
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n4/results/n4-standard-2-l4-lb.json",
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
      "qps": 1558.2719360993478,
      "avg_latency_ms": 17.275406366210415,
      "p50_latency_ms": 13.596437286654838,
      "p90_latency_ms": 36.74053596436902,
      "p99_latency_ms": 72.24714881340968,
      "p999_latency_ms": 95.94418783068834,
      "status_codes": {
        "200": 139207,
        "502": 1100
      },
      "bytes_per_sec": 0,
      "connection_errors": 1100
    },
    "http_version": "1.1",
    "instance_family": "n4",
    "instance_type": "n4-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 97149.11822579628,
        "tailscale": 1558.2719360993478,
        "delta_pct": -98.3959999179019
      },
      "p50_latency": {
        "baseline_ms": 0.5104352129357949,
        "tailscale_ms": 13.596437286654838,
        "delta_pct": 2563.6950081194864
      },
      "p99_latency": {
        "baseline_ms": 0.9965347018528377,
        "tailscale_ms": 72.24714881340968,
        "delta_pct": 7149.83773059603
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n4/results/n4-standard-2-l7-ingress-h1.json",
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gke",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 1564.1926470735943,
      "avg_latency_ms": 17.225382930241867,
      "p50_latency_ms": 13.804516192173738,
      "p90_latency_ms": 36.09551630493249,
      "p99_latency_ms": 69.39360245310245,
      "p999_latency_ms": 85.35189358835389,
      "status_codes": {
        "200": 139800,
        "502": 1085
      },
      "bytes_per_sec": 0,
      "connection_errors": 1085
    },
    "http_version": "2",
    "instance_family": "n4",
    "instance_type": "n4-standard-2",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 31452.38699807161,
        "tailscale": 1564.1926470735943,
        "delta_pct": -95.02679193420362
      },
      "p50_latency": {
        "baseline_ms": 0.6180221539213749,
        "tailscale_ms": 13.804516192173738,
        "delta_pct": 2133.660412427538
      },
      "p99_latency": {
        "baseline_ms": 1.9878025638985486,
        "tailscale_ms": 69.39360245310245,
        "delta_pct": 3390.9705678719547
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n4/results/n4-standard-2-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 2,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.240.20.3",
      "hops": [
        {
          "hop": 1,
          "host": "10.240.19.1",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.2,
          "stdev_ms": 0
        },
        {
          "hop": 2,
          "host": "10.0.0.63",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.5,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 0.9,
          "stdev_ms": 0.1
        },
        {
          "hop": 3,
          "host": "10.240.20.3",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9052.875185204393,
          "retransmits": 335406,
          "duration_sec": 30.001988,
          "bytes_transferred": 33950531584
        },
        {
          "bandwidth_mbps": 9169.3258599328,
          "retransmits": 255977,
          "duration_sec": 30.002228,
          "bytes_transferred": 34387525632
        },
        {
          "bandwidth_mbps": 9245.398418989143,
          "retransmits": 182456,
          "duration_sec": 30.001818,
          "bytes_transferred": 34672345088
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9155.866488042113,
        "bandwidth_mbps_min": 9052.875185204393,
        "bandwidth_mbps_max": 9245.398418989143,
        "bandwidth_mbps_stddev": 79.17139595208724,
        "retransmits_avg": 257946.33333333334
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9408.669553589143,
          "retransmits": 113804,
          "duration_sec": 30.002653,
          "bytes_transferred": 35285630976
        },
        {
          "bandwidth_mbps": 9201.03488068441,
          "retransmits": 120891,
          "duration_sec": 30.002995,
          "bytes_transferred": 34507325440
        },
        {
          "bandwidth_mbps": 9233.94688934208,
          "retransmits": 137819,
          "duration_sec": 30.001097,
          "bytes_transferred": 34628567040
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9281.217107871877,
        "bandwidth_mbps_min": 9201.03488068441,
        "bandwidth_mbps_max": 9408.669553589143,
        "bandwidth_mbps_stddev": 91.1185839733219,
        "retransmits_avg": 124171.33333333333
      }
    },
    "cloud_provider": "gke",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "container",
    "instance_family": "n4",
    "instance_type": "n4-standard-4",
    "kernel_version": "6.12.55+",
    "overhead": {
      "bandwidth_pct": 84.90565282729361,
      "retransmits_pct": 99.41848368975975
    },
    "overhead_single": {
      "bandwidth_pct": 83.8169964101871,
      "retransmits_pct": 99.44216861648152
    },
    "region": "us-central1",
    "source": "gke/n4/results/n4-standard-4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 0,
      "mtu_tailscale": 0,
      "tcp_rmem": "4096\t87380\t6291456",
      "tcp_wmem": "4096\t16384\t4194304",
      "kernel_full": "Linux tb-gke-server-n4-standard-4 6.12.55+ #1 SMP Sun Feb  1 08:53:53 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.102.11.100",
      "hops": [
        {
          "hop": 1,
          "host": "100.102.11.100",
          "loss_pct": 23,
          "snt": 100,
          "last_ms": 1.1,
          "avg_ms": 1.1,
          "best_ms": 0.9,
          "worst_ms": 1.5,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1410.0234212071368,
          "retransmits": 1632,
          "duration_sec": 30.000674,
          "bytes_transferred": 5287706624
        },
        {
          "bandwidth_mbps": 1374.865064057577,
          "retransmits": 1750,
          "duration_sec": 30.001369,
          "bytes_transferred": 5155979264
        },
        {
          "bandwidth_mbps": 1361.1663378589558,
          "retransmits": 1118,
          "duration_sec": 30.001324,
          "bytes_transferred": 5104599040
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1382.0182743745565,
        "bandwidth_mbps_min": 1361.1663378589558,
        "bandwidth_mbps_max": 1410.0234212071368,
        "bandwidth_mbps_stddev": 20.577171196935442,
        "retransmits_avg": 1500
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1463.8533583359551,
          "retransmits": 866,
          "duration_sec": 30.000587,
          "bytes_transferred": 5489557504
        },
        {
          "bandwidth_mbps": 1521.0396226788037,
          "retransmits": 499,
          "duration_sec": 30.001177,
          "bytes_transferred": 5704122368
        },
        {
          "bandwidth_mbps": 1521.0461122209426,
          "retransmits": 713,
          "duration_sec": 30.001049,
          "bytes_transferred": 5704122368
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1501.979697745234,
        "bandwidth_mbps_min": 1463.8533583359551,
        "bandwidth_mbps_max": 1521.0461122209426,
        "bandwidth_mbps_stddev": 26.959393268298605,
        "retransmits_avg": 692.6666666666666
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "gke",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 37124.20329966597,
      "avg_latency_ms": 0.430534480022794,
      "p50_latency_ms": 0.5733855686459179,
      "p90_latency_ms": 0.9221759832467268,
      "p99_latency_ms": 1.0730773197875816,
      "p999_latency_ms": 1.974533089131782,
      "status_codes": {
        "200": 3341234
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "n4",
    "instance_type": "n4-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 97024.77830404132,
        "tailscale": 37124.20329966597,
        "delta_pct": -61.737399509090494
      },
      "p50_latency": {
        "baseline_ms": 0.5102220087280647,
        "tailscale_ms": 0.5733855686459179,
        "delta_pct": 12.37962275976963
      },
      "p99_latency": {
        "baseline_ms": 0.9967008848755577,
        "tailscale_ms": 1.0730773197875816,
        "delta_pct": 7.66292436085875
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n4/results/n4-standard-4-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 4,
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
      "qps": 1565.2232972922823,
      "avg_latency_ms": 17.423262608720616,
      "p50_latency_ms": 13.700608863728414,
      "p90_latency_ms": 37.82904259952799,
      "p99_latency_ms": 71.77708330649777,
      "p999_latency_ms": 96.80488408139327,
      "status_codes": {
        "200": 139920,
        "502": 1032
      },
      "bytes_per_sec": 0,
      "connection_errors": 1032
    },
    "http_version": "1.1",
    "instance_family": "n4",
    "instance_type": "n4-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 97314.40902435979,
        "tailscale": 1565.2232972922823,
        "delta_pct": -98.39158115125534
      },
      "p50_latency": {
        "baseline_ms": 0.5102681760340083,
        "tailscale_ms": 13.700608863728414,
        "delta_pct": 2584.9820363508807
      },
      "p99_latency": {
        "baseline_ms": 0.9965927017187354,
        "tailscale_ms": 71.77708330649777,
        "delta_pct": 7102.248539720406
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n4/results/n4-standard-4-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 4,
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
      "qps": 1559.6810394421016,
      "avg_latency_ms": 17.2692428544306,
      "p50_latency_ms": 13.653088258973833,
      "p90_latency_ms": 37.36576914812877,
      "p99_latency_ms": 69.3595606350803,
      "p999_latency_ms": 86.02157034743783,
      "status_codes": {
        "200": 139363,
        "502": 1107
      },
      "bytes_per_sec": 0,
      "connection_errors": 1107
    },
    "http_version": "2",
    "instance_family": "n4",
    "instance_type": "n4-standard-4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 31485.089386237174,
        "tailscale": 1559.6810394421016,
        "delta_pct": -95.04628676670083
      },
      "p50_latency": {
        "baseline_ms": 0.6170317894543547,
        "tailscale_ms": 13.653088258973833,
        "delta_pct": 2112.7041900138324
      },
      "p99_latency": {
        "baseline_ms": 1.9876748813388143,
        "tailscale_ms": 69.3595606350803,
        "delta_pct": 3389.4821726761775
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n4/results/n4-standard-4-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 4,
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
      "qps": 18073.99046984168,
      "avg_latency_ms": 0.8884241880411675,
      "p50_latency_ms": 0.7343881886919013,
      "p90_latency_ms": 1.8424037529790465,
      "p99_latency_ms": 3.459519844596741,
      "p999_latency_ms": 4.875409848131525,
      "status_codes": {
        "200": 1626745
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "n4",
    "instance_type": "n4-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 59076.67496292889,
        "tailscale": 18073.99046984168,
        "delta_pct": -69.40587722449976
      },
      "p50_latency": {
        "baseline_ms": 0.5229972461470266,
        "tailscale_ms": 0.7343881886919013,
        "delta_pct": 40.41913109528072
      },
      "p99_latency": {
        "baseline_ms": 1.8820124411131325,
        "tailscale_ms": 3.459519844596741,
        "delta_pct": 83.82024310905075
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n4/results/n4-standard-8-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 8,
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
      "qps": 1139.6974657735261,
      "avg_latency_ms": 25.955950508752448,
      "p50_latency_ms": 21.7053519709451,
      "p90_latency_ms": 49.91944132258531,
      "p99_latency_ms": 99.64267782426785,
      "p999_latency_ms": 144.038560606062,
      "status_codes": {
        "200": 67352,
        "502": 1089
      },
      "bytes_per_sec": 0,
      "connection_errors": 1089
    },
    "http_version": "1.1",
    "instance_family": "n4",
    "instance_type": "n4-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 89455.19109792868,
        "tailscale": 1139.6974657735261,
        "delta_pct": -98.72595715040632
      },
      "p50_latency": {
        "baseline_ms": 0.5120124636140996,
        "tailscale_ms": 21.7053519709451,
        "delta_pct": 4139.223361426662
      },
      "p99_latency": {
        "baseline_ms": 1.1424418364857722,
        "tailscale_ms": 99.64267782426785,
        "delta_pct": 8621.903789060756
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n4/results/n4-standard-8-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 8,
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
      "qps": 2032.0622377648106,
      "avg_latency_ms": 7.872920717122848,
      "p50_latency_ms": 2.653196254071661,
      "p90_latency_ms": 24.296997389033937,
      "p99_latency_ms": 79.16343750000007,
      "p999_latency_ms": 116.24521212121225,
      "status_codes": {
        "200": 60302,
        "502": 675
      },
      "bytes_per_sec": 0,
      "connection_errors": 675
    },
    "http_version": "2",
    "instance_family": "n4",
    "instance_type": "n4-standard-8",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 23605.47877029066,
        "tailscale": 2032.0622377648106,
        "delta_pct": -91.39156524830871
      },
      "p50_latency": {
        "baseline_ms": 0.7367811846617603,
        "tailscale_ms": 2.653196254071661,
        "delta_pct": 260.10640734395025
      },
      "p99_latency": {
        "baseline_ms": 2.7094247330954295,
        "tailscale_ms": 79.16343750000007,
        "delta_pct": 2821.7802780429492
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-central1",
    "source": "gke/n4/results/n4-standard-8-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.35",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.204",
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
          "host": "10.0.1.95",
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
          "host": "10.0.1.35",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.1,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 38134.68103738062,
          "retransmits": 3392,
          "duration_sec": 30.001293,
          "bytes_transferred": 143011217408
        },
        {
          "bandwidth_mbps": 38137.32269007256,
          "retransmits": 2911,
          "duration_sec": 30.001332,
          "bytes_transferred": 143021309952
        },
        {
          "bandwidth_mbps": 38136.49403579655,
          "retransmits": 3421,
          "duration_sec": 30.001324,
          "bytes_transferred": 143018164224
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 38136.165921083244,
        "bandwidth_mbps_min": 38134.68103738062,
        "bandwidth_mbps_max": 38137.32269007256,
        "bandwidth_mbps_stddev": 1.1031248599679735,
        "retransmits_avg": 3241.3333333333335
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9534.637297878031,
          "retransmits": 5,
          "duration_sec": 30.001192,
          "bytes_transferred": 35756310528
        },
        {
          "bandwidth_mbps": 9534.34689029568,
          "retransmits": 14,
          "duration_sec": 30.001116,
          "bytes_transferred": 35755130880
        },
        {
          "bandwidth_mbps": 9534.289375417045,
          "retransmits": 0,
          "duration_sec": 30.001187,
          "bytes_transferred": 35754999808
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9534.424521196917,
        "bandwidth_mbps_min": 9534.289375417045,
        "bandwidth_mbps_max": 9534.637297878031,
        "bandwidth_mbps_stddev": 0.1522770005285774,
        "retransmits_avg": 6.333333333333333
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.12xlarge",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 93.70299593916755,
      "retransmits_pct": 35.97285067873303
    },
    "overhead_single": {
      "bandwidth_pct": 74.70943017548814,
      "retransmits_pct": 100
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.12xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 0,
      "mtu_tailscale": 0,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-12xlarge 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.99.185.104",
      "hops": [
        {
          "hop": 1,
          "host": "100.99.185.104",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.2,
          "best_ms": 0.1,
          "worst_ms": 0.4,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2376.7368030683974,
          "retransmits": 1263,
          "duration_sec": 30.00133,
          "bytes_transferred": 8913158144
        },
        {
          "bandwidth_mbps": 2389.670897349722,
          "retransmits": 2253,
          "duration_sec": 30.001302,
          "bytes_transferred": 8961654784
        },
        {
          "bandwidth_mbps": 2437.900049671111,
          "retransmits": 2710,
          "duration_sec": 30.001342,
          "bytes_transferred": 9142534144
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2401.43591669641,
        "bandwidth_mbps_min": 2376.7368030683974,
        "bandwidth_mbps_max": 2437.900049671111,
        "bandwidth_mbps_stddev": 26.31916214366822,
        "retransmits_avg": 2075.3333333333335
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2391.5308740745,
          "retransmits": 0,
          "duration_sec": 30.001207,
          "bytes_transferred": 8968601600
        },
        {
          "bandwidth_mbps": 2386.5679731197465,
          "retransmits": 0,
          "duration_sec": 30.001205,
          "bytes_transferred": 8949989376
        },
        {
          "bandwidth_mbps": 2455.8320255018148,
          "retransmits": 0,
          "duration_sec": 30.001316,
          "bytes_transferred": 9209774080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2411.310290898687,
        "bandwidth_mbps_min": 2386.5679731197465,
        "bandwidth_mbps_max": 2455.8320255018148,
        "bandwidth_mbps_stddev": 31.546750868355964,
        "retransmits_avg": 0
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
    "vcpus": 48,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.193",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.82",
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
          "host": "10.0.1.67",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.2,
          "stdev_ms": 0
        },
        {
          "hop": 3,
          "host": "10.0.1.193",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
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
          "bandwidth_mbps": 19862.04570300321,
          "retransmits": 769,
          "duration_sec": 30.001442,
          "bytes_transferred": 74486251520
        },
        {
          "bandwidth_mbps": 19862.327571111593,
          "retransmits": 577,
          "duration_sec": 30.001333,
          "bytes_transferred": 74487037952
        },
        {
          "bandwidth_mbps": 19861.817734420343,
          "retransmits": 942,
          "duration_sec": 30.001364,
          "bytes_transferred": 74485202944
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 19862.063669511714,
        "bandwidth_mbps_min": 19861.817734420343,
        "bandwidth_mbps_max": 19862.327571111593,
        "bandwidth_mbps_stddev": 0.20852731157184137,
        "retransmits_avg": 762.6666666666666
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4965.288980877634,
          "retransmits": 0,
          "duration_sec": 30.001255,
          "bytes_transferred": 18620612608
        },
        {
          "bandwidth_mbps": 4965.677249520953,
          "retransmits": 0,
          "duration_sec": 30.001232,
          "bytes_transferred": 18622054400
        },
        {
          "bandwidth_mbps": 4965.433088357814,
          "retransmits": 0,
          "duration_sec": 30.001229,
          "bytes_transferred": 18621136896
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4965.466439585467,
        "bandwidth_mbps_min": 4965.288980877634,
        "bandwidth_mbps_max": 4965.677249520953,
        "bandwidth_mbps_stddev": 0.16025472044182154,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.2xlarge",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 88.44190359668586,
      "retransmits_pct": -139.51048951048952
    },
    "overhead_single": {
      "bandwidth_pct": 53.6163837016993,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.2xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 0,
      "mtu_tailscale": 0,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-2xlarge 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.77.76.14",
      "hops": [
        {
          "hop": 1,
          "host": "100.77.76.14",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
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
          "bandwidth_mbps": 2292.284538869364,
          "retransmits": 1507,
          "duration_sec": 30.000555,
          "bytes_transferred": 8596226048
        },
        {
          "bandwidth_mbps": 2305.807844677747,
          "retransmits": 2520,
          "duration_sec": 30.000595,
          "bytes_transferred": 8646950912
        },
        {
          "bandwidth_mbps": 2288.937016282288,
          "retransmits": 1453,
          "duration_sec": 30.000452,
          "bytes_transferred": 8583643136
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2295.6764666097997,
        "bandwidth_mbps_min": 2288.937016282288,
        "bandwidth_mbps_max": 2305.807844677747,
        "bandwidth_mbps_stddev": 7.293151720827406,
        "retransmits_avg": 1826.6666666666667
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2299.6220588491174,
          "retransmits": 0,
          "duration_sec": 30.000586,
          "bytes_transferred": 8623751168
        },
        {
          "bandwidth_mbps": 2304.843175592283,
          "retransmits": 0,
          "duration_sec": 30.000413,
          "bytes_transferred": 8643280896
        },
        {
          "bandwidth_mbps": 2305.023467833249,
          "retransmits": 0,
          "duration_sec": 30.000341,
          "bytes_transferred": 8643936256
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2303.1629007582164,
        "bandwidth_mbps_min": 2299.6220588491174,
        "bandwidth_mbps_max": 2305.023467833249,
        "bandwidth_mbps_stddev": 2.504834976861405,
        "retransmits_avg": 0
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
    "vcpus": 8,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 32594.1663758949,
      "avg_latency_ms": 0.4905574762362337,
      "p50_latency_ms": 0.5793645773443833,
      "p90_latency_ms": 0.9217620062164128,
      "p99_latency_ms": 0.9988014277126195,
      "p999_latency_ms": 2.2206283850026414,
      "status_codes": {
        "200": 2933514
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c8gn",
    "instance_type": "c8gn.2xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81035.81756139809,
        "tailscale": 32594.1663758949,
        "delta_pct": -59.778074243282106
      },
      "p50_latency": {
        "baseline_ms": 0.5157800209059274,
        "tailscale_ms": 0.5793645773443833,
        "delta_pct": 12.327844015123834
      },
      "p99_latency": {
        "baseline_ms": 0.9919336864736401,
        "tailscale_ms": 0.9988014277126195,
        "delta_pct": 0.6923589079220045
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.2xlarge-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 8,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 9284.315893734769,
      "avg_latency_ms": 1.7229729108081624,
      "p50_latency_ms": 1.5730285594443012,
      "p90_latency_ms": 2.505546569721728,
      "p99_latency_ms": 4.759226075428053,
      "p999_latency_ms": 8.29373688521089,
      "status_codes": {
        "200": 835618
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.2xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81293.25511895411,
        "tailscale": 9284.315893734769,
        "delta_pct": -88.57922975264148
      },
      "p50_latency": {
        "baseline_ms": 0.5157482847680338,
        "tailscale_ms": 1.5730285594443012,
        "delta_pct": 204.9992808316942
      },
      "p99_latency": {
        "baseline_ms": 0.9918332809222304,
        "tailscale_ms": 4.759226075428053,
        "delta_pct": 379.8413369435244
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.2xlarge-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 8,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 7676.982326215876,
      "avg_latency_ms": 2.0837386979744585,
      "p50_latency_ms": 2.113614243186539,
      "p90_latency_ms": 2.885837410056574,
      "p99_latency_ms": 5.21149178846768,
      "p999_latency_ms": 9.699955162640352,
      "status_codes": {
        "200": 690957
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.2xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 30058.322807921668,
        "tailscale": 7676.982326215876,
        "delta_pct": -74.45971162372153
      },
      "p50_latency": {
        "baseline_ms": 0.6246136881870129,
        "tailscale_ms": 2.113614243186539,
        "delta_pct": 238.3874358119592
      },
      "p99_latency": {
        "baseline_ms": 1.95388134520156,
        "tailscale_ms": 5.21149178846768,
        "delta_pct": 166.7250906134256
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.2xlarge-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 8,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.213",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.19",
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
          "host": "10.0.1.195",
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
          "host": "10.0.1.213",
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
          "bandwidth_mbps": 19861.883527324688,
          "retransmits": 620,
          "duration_sec": 30.001423,
          "bytes_transferred": 74485596160
        },
        {
          "bandwidth_mbps": 19861.88087919951,
          "retransmits": 638,
          "duration_sec": 30.001427,
          "bytes_transferred": 74485596160
        },
        {
          "bandwidth_mbps": 18085.53240721143,
          "retransmits": 686,
          "duration_sec": 30.001378,
          "bytes_transferred": 67823861760
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 19269.765604578544,
        "bandwidth_mbps_min": 18085.53240721143,
        "bandwidth_mbps_max": 19861.883527324688,
        "bandwidth_mbps_stddev": 837.37932436521,
        "retransmits_avg": 648
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4965.71286268682,
          "retransmits": 0,
          "duration_sec": 30.001228,
          "bytes_transferred": 18622185472
        },
        {
          "bandwidth_mbps": 4965.512424647944,
          "retransmits": 26,
          "duration_sec": 30.001172,
          "bytes_transferred": 18621399040
        },
        {
          "bandwidth_mbps": 4965.330055599742,
          "retransmits": 0,
          "duration_sec": 30.001218,
          "bytes_transferred": 18620743680
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4965.518447644835,
        "bandwidth_mbps_min": 4965.330055599742,
        "bandwidth_mbps_max": 4965.71286268682,
        "bandwidth_mbps_stddev": 0.15633835922531802,
        "retransmits_avg": 8.666666666666666
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.4xlarge",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 87.81226617324228,
      "retransmits_pct": -294.1358024691358
    },
    "overhead_single": {
      "bandwidth_pct": 52.169994640285545,
      "retransmits_pct": 100
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.4xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 0,
      "mtu_tailscale": 0,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-4xlarge 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.85.102.117",
      "hops": [
        {
          "hop": 1,
          "host": "100.85.102.117",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.3,
          "best_ms": 0.2,
          "worst_ms": 0.5,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2350.737188813277,
          "retransmits": 2453,
          "duration_sec": 30.00128,
          "bytes_transferred": 8815640576
        },
        {
          "bandwidth_mbps": 2342.8651512602064,
          "retransmits": 3539,
          "duration_sec": 30.000488,
          "bytes_transferred": 8785887232
        },
        {
          "bandwidth_mbps": 2352.0408827049473,
          "retransmits": 1670,
          "duration_sec": 30.001146,
          "bytes_transferred": 8820490240
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2348.5477409261434,
        "bandwidth_mbps_min": 2342.8651512602064,
        "bandwidth_mbps_max": 2352.0408827049473,
        "bandwidth_mbps_stddev": 4.0532927704404,
        "retransmits_avg": 2554
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2371.00507880868,
          "retransmits": 0,
          "duration_sec": 30.001327,
          "bytes_transferred": 8891662336
        },
        {
          "bandwidth_mbps": 2383.4200675878865,
          "retransmits": 0,
          "duration_sec": 30.001234,
          "bytes_transferred": 8938192896
        },
        {
          "bandwidth_mbps": 2370.5980725418376,
          "retransmits": 0,
          "duration_sec": 30.00117,
          "bytes_transferred": 8890089472
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2375.0077396461347,
        "bandwidth_mbps_min": 2370.5980725418376,
        "bandwidth_mbps_max": 2383.4200675878865,
        "bandwidth_mbps_stddev": 5.950734384650645,
        "retransmits_avg": 0
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
    "vcpus": 16,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 23341.83637236391,
      "avg_latency_ms": 0.685195023219326,
      "p50_latency_ms": 0.5779781014558157,
      "p90_latency_ms": 0.9224151224636563,
      "p99_latency_ms": 0.9999134521904204,
      "p999_latency_ms": 3.8454424460434375,
      "status_codes": {
        "-1": 32,
        "200": 732935
      },
      "bytes_per_sec": 0,
      "connection_errors": 32
    },
    "instance_family": "c8gn",
    "instance_type": "c8gn.4xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81432.72136807216,
        "tailscale": 23341.83637236391,
        "delta_pct": -71.33604774564776
      },
      "p50_latency": {
        "baseline_ms": 0.5157913806965947,
        "tailscale_ms": 0.5779781014558157,
        "delta_pct": 12.056564550426502
      },
      "p99_latency": {
        "baseline_ms": 0.9918483768401792,
        "tailscale_ms": 0.9999134521904204,
        "delta_pct": 0.8131359125610291
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.4xlarge-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 16,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 5956.12399498146,
      "avg_latency_ms": 2.9828547467217175,
      "p50_latency_ms": 2.8851300446498023,
      "p90_latency_ms": 4.124350719356201,
      "p99_latency_ms": 6.961542428135957,
      "p999_latency_ms": 11.563959818007776,
      "status_codes": {
        "200": 536086
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.4xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 37389.38857806035,
        "tailscale": 5956.12399498146,
        "delta_pct": -84.07001499223114
      },
      "p50_latency": {
        "baseline_ms": 0.5767359517101968,
        "tailscale_ms": 2.8851300446498023,
        "delta_pct": 400.2514644863941
      },
      "p99_latency": {
        "baseline_ms": 1.7943285818157355,
        "tailscale_ms": 6.961542428135957,
        "delta_pct": 287.97478336388986
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.4xlarge-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 16,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 7802.289698584791,
      "avg_latency_ms": 2.050340611839212,
      "p50_latency_ms": 2.05981555632745,
      "p90_latency_ms": 2.875449009404098,
      "p99_latency_ms": 5.181049754426052,
      "p999_latency_ms": 9.277483194444585,
      "status_codes": {
        "200": 702233
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.4xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 30111.60003325599,
        "tailscale": 7802.289698584791,
        "delta_pct": -74.08875752212519
      },
      "p50_latency": {
        "baseline_ms": 0.6247120780115979,
        "tailscale_ms": 2.05981555632745,
        "delta_pct": 229.72238393143556
      },
      "p99_latency": {
        "baseline_ms": 1.9520246686767369,
        "tailscale_ms": 5.181049754426052,
        "delta_pct": 165.41927658825375
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.4xlarge-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 16,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.67",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.176",
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
          "host": "10.0.1.238",
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
          "host": "10.0.1.67",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 0.1,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 38136.6262006904,
          "retransmits": 2799,
          "duration_sec": 30.001385,
          "bytes_transferred": 143018950656
        },
        {
          "bandwidth_mbps": 38136.42032034117,
          "retransmits": 2158,
          "duration_sec": 30.001327,
          "bytes_transferred": 143017902080
        },
        {
          "bandwidth_mbps": 38136.5353425961,
          "retransmits": 3894,
          "duration_sec": 30.001319,
          "bytes_transferred": 143018295296
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 38136.527287875884,
        "bandwidth_mbps_min": 38136.42032034117,
        "bandwidth_mbps_max": 38136.6262006904,
        "bandwidth_mbps_stddev": 0.08424305486036895,
        "retransmits_avg": 2950.3333333333335
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9533.99006884372,
          "retransmits": 4,
          "duration_sec": 30.001139,
          "bytes_transferred": 35753820160
        },
        {
          "bandwidth_mbps": 9534.185475346572,
          "retransmits": 0,
          "duration_sec": 30.001184,
          "bytes_transferred": 35754606592
        },
        {
          "bandwidth_mbps": 9533.294222360766,
          "retransmits": 0,
          "duration_sec": 30.001129,
          "bytes_transferred": 35751198720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9533.82325551702,
        "bandwidth_mbps_min": 9533.294222360766,
        "bandwidth_mbps_max": 9534.185475346572,
        "bandwidth_mbps_stddev": 0.3824944318990485,
        "retransmits_avg": 1.3333333333333333
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.8xlarge",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 93.66741848198922,
      "retransmits_pct": 29.64636764207435
    },
    "overhead_single": {
      "bandwidth_pct": 74.70146661166024,
      "retransmits_pct": 100
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.8xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 0,
      "mtu_tailscale": 0,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-8xlarge 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.86.238.29",
      "hops": [
        {
          "hop": 1,
          "host": "100.86.238.29",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.5,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2409.241378648305,
          "retransmits": 1994,
          "duration_sec": 30.001328,
          "bytes_transferred": 9035055104
        },
        {
          "bandwidth_mbps": 2419.899251617135,
          "retransmits": 3072,
          "duration_sec": 30.001355,
          "bytes_transferred": 9075032064
        },
        {
          "bandwidth_mbps": 2415.9394056640663,
          "retransmits": 1161,
          "duration_sec": 30.001484,
          "bytes_transferred": 9060220928
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2415.026678643169,
        "bandwidth_mbps_min": 2409.241378648305,
        "bandwidth_mbps_max": 2419.899251617135,
        "bandwidth_mbps_stddev": 4.398663965034426,
        "retransmits_avg": 2075.6666666666665
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2411.97655988344,
          "retransmits": 0,
          "duration_sec": 30.001216,
          "bytes_transferred": 9045278720
        },
        {
          "bandwidth_mbps": 2388.102320406727,
          "retransmits": 0,
          "duration_sec": 30.001249,
          "bytes_transferred": 8955756544
        },
        {
          "bandwidth_mbps": 2435.6734981566583,
          "retransmits": 0,
          "duration_sec": 30.001215,
          "bytes_transferred": 9134145536
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2411.917459482275,
        "bandwidth_mbps_min": 2388.102320406727,
        "bandwidth_mbps_max": 2435.6734981566583,
        "bandwidth_mbps_stddev": 19.420896954431246,
        "retransmits_avg": 0
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
    "vcpus": 32,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 25602.324428766606,
      "avg_latency_ms": 0.6246966652597655,
      "p50_latency_ms": 0.6667054334875372,
      "p90_latency_ms": 0.941766229853319,
      "p99_latency_ms": 1.3981294688021395,
      "p999_latency_ms": 3.713492443761362,
      "status_codes": {
        "200": 2304240
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c8gn",
    "instance_type": "c8gn.8xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81557.20657191212,
        "tailscale": 25602.324428766606,
        "delta_pct": -68.60813960542892
      },
      "p50_latency": {
        "baseline_ms": 0.5156737155054154,
        "tailscale_ms": 0.6667054334875372,
        "delta_pct": 29.288232741142245
      },
      "p99_latency": {
        "baseline_ms": 0.9917705658629258,
        "tailscale_ms": 1.3981294688021395,
        "delta_pct": 40.97307552030912
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.8xlarge-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 32,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 9454.372591187812,
      "avg_latency_ms": 1.6921988045073018,
      "p50_latency_ms": 1.5476442365848715,
      "p90_latency_ms": 2.2191659157556898,
      "p99_latency_ms": 4.87908311041486,
      "p999_latency_ms": 9.240903361442427,
      "status_codes": {
        "200": 850924
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.8xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81409.37528507072,
        "tailscale": 9454.372591187812,
        "delta_pct": -88.38662923271245
      },
      "p50_latency": {
        "baseline_ms": 0.515705966247681,
        "tailscale_ms": 1.5476442365848715,
        "delta_pct": 200.10206161578049
      },
      "p99_latency": {
        "baseline_ms": 0.9917913030347577,
        "tailscale_ms": 4.87908311041486,
        "delta_pct": 391.9465512034108
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.8xlarge-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 32,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 5030.021357845682,
      "avg_latency_ms": 3.500738760320155,
      "p50_latency_ms": 3.42956726728633,
      "p90_latency_ms": 4.393378105708126,
      "p99_latency_ms": 7.7797558272900345,
      "p999_latency_ms": 13.091896505158767,
      "status_codes": {
        "200": 452762
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.8xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 22032.46045126673,
        "tailscale": 5030.021357845682,
        "delta_pct": -77.16995172204435
      },
      "p50_latency": {
        "baseline_ms": 0.7047527024345328,
        "tailscale_ms": 3.42956726728633,
        "delta_pct": 386.6341420811956
      },
      "p99_latency": {
        "baseline_ms": 2.1228095740280692,
        "tailscale_ms": 7.7797558272900345,
        "delta_pct": 266.4839240633256
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.8xlarge-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 32,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.18",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.6",
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
          "host": "10.0.1.219",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.1,
          "worst_ms": 0.2,
          "stdev_ms": 0
        },
        {
          "hop": 3,
          "host": "10.0.1.18",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.1,
          "worst_ms": 0.2,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 19861.81746107774,
          "retransmits": 45,
          "duration_sec": 30.00147,
          "bytes_transferred": 74485465088
        },
        {
          "bandwidth_mbps": 19861.558766708808,
          "retransmits": 590,
          "duration_sec": 30.001544,
          "bytes_transferred": 74484678656
        },
        {
          "bandwidth_mbps": 19642.193361242153,
          "retransmits": 167,
          "duration_sec": 30.000552,
          "bytes_transferred": 73659580416
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 19788.5231963429,
        "bandwidth_mbps_min": 19642.193361242153,
        "bandwidth_mbps_max": 19861.81746107774,
        "bandwidth_mbps_stddev": 103.47087258790268,
        "retransmits_avg": 267.3333333333333
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4965.643871058664,
          "retransmits": 0,
          "duration_sec": 30.000589,
          "bytes_transferred": 18621530112
        },
        {
          "bandwidth_mbps": 4965.251712785882,
          "retransmits": 16,
          "duration_sec": 30.001269,
          "bytes_transferred": 18620481536
        },
        {
          "bandwidth_mbps": 4965.17576808582,
          "retransmits": 75,
          "duration_sec": 30.002995,
          "bytes_transferred": 18621267968
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4965.357117310123,
        "bandwidth_mbps_min": 4965.17576808582,
        "bandwidth_mbps_max": 4965.643871058664,
        "bandwidth_mbps_stddev": 0.205122213317148,
        "retransmits_avg": 30.333333333333332
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.large",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 92.72234887621829,
      "retransmits_pct": -1376.3092269326685
    },
    "overhead_single": {
      "bandwidth_pct": 71.4532102297983,
      "retransmits_pct": -686.8131868131868
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.large-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 0,
      "mtu_tailscale": 0,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-large 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.123.190.1",
      "hops": [
        {
          "hop": 1,
          "host": "100.123.190.1",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 0.5,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1447.6277548477947,
          "retransmits": 2374,
          "duration_sec": 30.001476,
          "bytes_transferred": 5428871168
        },
        {
          "bandwidth_mbps": 1429.2475332312893,
          "retransmits": 4609,
          "duration_sec": 30.001394,
          "bytes_transferred": 5359927296
        },
        {
          "bandwidth_mbps": 1443.5437542562645,
          "retransmits": 4857,
          "duration_sec": 30.001367,
          "bytes_transferred": 5413535744
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1440.1396807784495,
        "bandwidth_mbps_min": 1429.2475332312893,
        "bandwidth_mbps_max": 1447.6277548477947,
        "bandwidth_mbps_stddev": 7.880309801428538,
        "retransmits_avg": 3946.6666666666665
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1400.4282618461489,
          "retransmits": 352,
          "duration_sec": 30.000319,
          "bytes_transferred": 5251661824
        },
        {
          "bandwidth_mbps": 1433.0395226404212,
          "retransmits": 254,
          "duration_sec": 30.001032,
          "bytes_transferred": 5374083072
        },
        {
          "bandwidth_mbps": 1418.8823883682353,
          "retransmits": 110,
          "duration_sec": 30.000332,
          "bytes_transferred": 5320867840
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1417.4500576182684,
        "bandwidth_mbps_min": 1400.4282618461489,
        "bandwidth_mbps_max": 1433.0395226404212,
        "bandwidth_mbps_stddev": 13.351960185205916,
        "retransmits_avg": 238.66666666666666
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
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 26947.261768486143,
      "avg_latency_ms": 0.5934775422118728,
      "p50_latency_ms": 0.5852972430968822,
      "p90_latency_ms": 0.9345748351699009,
      "p99_latency_ms": 1.6470383566965339,
      "p999_latency_ms": 3.494012006115577,
      "status_codes": {
        "200": 2425320
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c8gn",
    "instance_type": "c8gn.large",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81509.67378814491,
        "tailscale": 26947.261768486143,
        "delta_pct": -66.93979927029783
      },
      "p50_latency": {
        "baseline_ms": 0.5156983807310286,
        "tailscale_ms": 0.5852972430968822,
        "delta_pct": 13.49604050863874
      },
      "p99_latency": {
        "baseline_ms": 0.9917269565159875,
        "tailscale_ms": 1.6470383566965339,
        "delta_pct": 66.07780456857857
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.large-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 2,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 9300.15960392735,
      "avg_latency_ms": 1.7198713973628237,
      "p50_latency_ms": 1.5762536832531426,
      "p90_latency_ms": 2.544735514645195,
      "p99_latency_ms": 4.78402114314763,
      "p999_latency_ms": 8.487895048090563,
      "status_codes": {
        "200": 837053
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.large",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81508.76593420183,
        "tailscale": 9300.15960392735,
        "delta_pct": -88.58998845420514
      },
      "p50_latency": {
        "baseline_ms": 0.5158336937459858,
        "tailscale_ms": 1.5762536832531426,
        "delta_pct": 205.57400618916222
      },
      "p99_latency": {
        "baseline_ms": 0.9917928328992855,
        "tailscale_ms": 4.78402114314763,
        "delta_pct": 382.3609310789844
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.large-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 2,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 7615.501264369239,
      "avg_latency_ms": 2.1004948646698605,
      "p50_latency_ms": 2.1169647835335312,
      "p90_latency_ms": 2.892319009193842,
      "p99_latency_ms": 5.255278287252243,
      "p999_latency_ms": 9.341834350105064,
      "status_codes": {
        "200": 685430
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.large",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 30204.64776676783,
        "tailscale": 7615.501264369239,
        "delta_pct": -74.7869886675253
      },
      "p50_latency": {
        "baseline_ms": 0.6270031862460779,
        "tailscale_ms": 2.1169647835335312,
        "delta_pct": 237.6322210111853
      },
      "p99_latency": {
        "baseline_ms": 1.951638828368118,
        "tailscale_ms": 5.255278287252243,
        "delta_pct": 169.275145117219
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.large-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 2,
    "zone": "us-west-2a"
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 23536.78647492519,
      "avg_latency_ms": 0.6793620149397984,
      "p50_latency_ms": 0.5948179351036215,
      "p90_latency_ms": 0.9578815781691831,
      "p99_latency_ms": 1.8698584925851922,
      "p999_latency_ms": 3.7322344004069383,
      "status_codes": {
        "200": 2118370
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c8gn",
    "instance_type": "c8gn.medium",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81975.49477027201,
        "tailscale": 23536.78647492519,
        "delta_pct": -71.28802144972148
      },
      "p50_latency": {
        "baseline_ms": 0.5155956879647428,
        "tailscale_ms": 0.5948179351036215,
        "delta_pct": 15.3651880704433
      },
      "p99_latency": {
        "baseline_ms": 0.99169185601315,
        "tailscale_ms": 1.8698584925851922,
        "delta_pct": 88.55236949333157
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.medium-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 1,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 9473.485622305063,
      "avg_latency_ms": 1.6883836393518954,
      "p50_latency_ms": 1.5562698542240643,
      "p90_latency_ms": 2.507952427062245,
      "p99_latency_ms": 4.77447712726688,
      "p999_latency_ms": 8.942565317623192,
      "status_codes": {
        "200": 568438
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.medium",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81920.71635603225,
        "tailscale": 9473.485622305063,
        "delta_pct": -88.43578762039539
      },
      "p50_latency": {
        "baseline_ms": 0.5156141573796081,
        "tailscale_ms": 1.5562698542240643,
        "delta_pct": 201.8283792154099
      },
      "p99_latency": {
        "baseline_ms": 0.9917052323780281,
        "tailscale_ms": 4.77447712726688,
        "delta_pct": 381.44115523299945
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.medium-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 1,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 7632.651345626731,
      "avg_latency_ms": 2.095726453493178,
      "p50_latency_ms": 2.061778266519601,
      "p90_latency_ms": 2.9050324706786004,
      "p99_latency_ms": 5.411469857197896,
      "p999_latency_ms": 10.164429664714135,
      "status_codes": {
        "200": 686982
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.medium",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 30250.76199316214,
        "tailscale": 7632.651345626731,
        "delta_pct": -74.76873029726653
      },
      "p50_latency": {
        "baseline_ms": 0.6190257131272443,
        "tailscale_ms": 2.061778266519601,
        "delta_pct": 233.0682753231271
      },
      "p99_latency": {
        "baseline_ms": 1.951372837200488,
        "tailscale_ms": 5.411469857197896,
        "delta_pct": 177.31603894627295
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.medium-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 1,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.74",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.245",
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
          "host": "10.0.1.18",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.1,
          "worst_ms": 0.2,
          "stdev_ms": 0
        },
        {
          "hop": 3,
          "host": "10.0.1.74",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
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
          "bandwidth_mbps": 19861.823534634997,
          "retransmits": 830,
          "duration_sec": 30.001672,
          "bytes_transferred": 74485989376
        },
        {
          "bandwidth_mbps": 19669.172719087343,
          "retransmits": 285,
          "duration_sec": 30.001357,
          "bytes_transferred": 73762734080
        },
        {
          "bandwidth_mbps": 19861.911059008507,
          "retransmits": 524,
          "duration_sec": 30.001487,
          "bytes_transferred": 74485858304
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 19797.635770910285,
        "bandwidth_mbps_min": 19669.172719087343,
        "bandwidth_mbps_max": 19861.911059008507,
        "bandwidth_mbps_stddev": 90.83710210362467,
        "retransmits_avg": 546.3333333333334
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4965.50265954087,
          "retransmits": 0,
          "duration_sec": 30.001231,
          "bytes_transferred": 18621399040
        },
        {
          "bandwidth_mbps": 4965.393503078888,
          "retransmits": 0,
          "duration_sec": 30.001257,
          "bytes_transferred": 18621005824
        },
        {
          "bandwidth_mbps": 4965.18545165806,
          "retransmits": 0,
          "duration_sec": 30.001247,
          "bytes_transferred": 18620219392
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4965.360538092606,
        "bandwidth_mbps_min": 4965.18545165806,
        "bandwidth_mbps_max": 4965.50265954087,
        "bandwidth_mbps_stddev": 0.13158071786211564,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.xlarge",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 90.3190194420513,
      "retransmits_pct": -229.16412446613785
    },
    "overhead_single": {
      "bandwidth_pct": 59.859275617948185,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.xlarge-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 0,
      "mtu_tailscale": 0,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-xlarge 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.65.43.77",
      "hops": [
        {
          "hop": 1,
          "host": "100.65.43.77",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.5,
          "avg_ms": 0.4,
          "best_ms": 0.4,
          "worst_ms": 0.6,
          "stdev_ms": 0
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1904.369686189999,
          "retransmits": 2038,
          "duration_sec": 30.001402,
          "bytes_transferred": 7141720064
        },
        {
          "bandwidth_mbps": 1951.1341854424857,
          "retransmits": 1402,
          "duration_sec": 30.001399,
          "bytes_transferred": 7317094400
        },
        {
          "bandwidth_mbps": 1894.311938113485,
          "retransmits": 1955,
          "duration_sec": 30.00072,
          "bytes_transferred": 7103840256
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1916.605269915323,
        "bandwidth_mbps_min": 1894.311938113485,
        "bandwidth_mbps_max": 1951.1341854424857,
        "bandwidth_mbps_stddev": 24.758487833523496,
        "retransmits_avg": 1798.3333333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1990.17310056638,
          "retransmits": 18,
          "duration_sec": 30.000364,
          "bytes_transferred": 7463239680
        },
        {
          "bandwidth_mbps": 1991.6992075082128,
          "retransmits": 487,
          "duration_sec": 30.001068,
          "bytes_transferred": 7469137920
        },
        {
          "bandwidth_mbps": 1997.5227564381612,
          "retransmits": 139,
          "duration_sec": 30.001268,
          "bytes_transferred": 7491026944
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1993.131688170918,
        "bandwidth_mbps_min": 1990.17310056638,
        "bandwidth_mbps_max": 1997.5227564381612,
        "bandwidth_mbps_stddev": 3.16684501201327,
        "retransmits_avg": 214.66666666666666
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
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 31500.54483002576,
      "avg_latency_ms": 0.5075641960746952,
      "p50_latency_ms": 0.5723642661617149,
      "p90_latency_ms": 0.9211980173896538,
      "p99_latency_ms": 1.0119072426072169,
      "p999_latency_ms": 3.7195534144979003,
      "status_codes": {
        "200": 2835099
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "c8gn",
    "instance_type": "c8gn.xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81152.97030810197,
        "tailscale": 31500.54483002576,
        "delta_pct": -61.18374384765942
      },
      "p50_latency": {
        "baseline_ms": 0.5158347923553214,
        "tailscale_ms": 0.5723642661617149,
        "delta_pct": 10.958833069068056
      },
      "p99_latency": {
        "baseline_ms": 0.9918814132979695,
        "tailscale_ms": 1.0119072426072169,
        "delta_pct": 2.018974147591111
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.xlarge-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 4,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 9278.770432021878,
      "avg_latency_ms": 1.723916392390974,
      "p50_latency_ms": 1.5765992446144315,
      "p90_latency_ms": 2.5312960484344402,
      "p99_latency_ms": 4.736459323630435,
      "p999_latency_ms": 8.942668185059558,
      "status_codes": {
        "200": 835126
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "c8gn",
    "instance_type": "c8gn.xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 81555.9608949251,
        "tailscale": 9278.770432021878,
        "delta_pct": -88.622817596403
      },
      "p50_latency": {
        "baseline_ms": 0.5156466413216229,
        "tailscale_ms": 1.5765992446144315,
        "delta_pct": 205.7518692594496
      },
      "p99_latency": {
        "baseline_ms": 0.9917751056759271,
        "tailscale_ms": 4.736459323630435,
        "delta_pct": 377.5739274482377
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.xlarge-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 4,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "eks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 7649.568676471753,
      "avg_latency_ms": 2.0911628624242566,
      "p50_latency_ms": 2.123216805548438,
      "p90_latency_ms": 2.8885994110397295,
      "p99_latency_ms": 5.254711903509222,
      "p999_latency_ms": 10.35815002801133,
      "status_codes": {
        "200": 688553
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "c8gn",
    "instance_type": "c8gn.xlarge",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 29894.040541378592,
        "tailscale": 7649.568676471753,
        "delta_pct": -74.41105806395288
      },
      "p50_latency": {
        "baseline_ms": 0.6240178324062552,
        "tailscale_ms": 2.123216805548438,
        "delta_pct": 240.2493799513981
      },
      "p99_latency": {
        "baseline_ms": 1.9541666816279806,
        "tailscale_ms": 5.254711903509222,
        "delta_pct": 168.89783522107834
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.xlarge-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 4,
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
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 10661.464608391683,
      "avg_latency_ms": 1.5008280842565187,
      "p50_latency_ms": 1.4429673538629624,
      "p90_latency_ms": 2.366194569623437,
      "p99_latency_ms": 5.352452291723044,
      "p999_latency_ms": 9.756382077941076,
      "status_codes": {
        "200": 959577
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "d2sv4",
    "instance_type": "Standard_D2s_v4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 27708.584197609987,
        "tailscale": 10661.464608391683,
        "delta_pct": -61.5228821062922
      },
      "p50_latency": {
        "baseline_ms": 0.5500180786866972,
        "tailscale_ms": 1.4429673538629624,
        "delta_pct": 162.34907719913502
      },
      "p99_latency": {
        "baseline_ms": 4.604217021639491,
        "tailscale_ms": 5.352452291723044,
        "delta_pct": 16.251086049308725
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "aks/d2sv4/results/Standard_D2s_v4-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 2,
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 1352.4745081654671,
      "avg_latency_ms": 12.170095267370561,
      "p50_latency_ms": 10.94862198329215,
      "p90_latency_ms": 21.240765833800577,
      "p99_latency_ms": 37.03468625516076,
      "p999_latency_ms": 63.39102173719863,
      "status_codes": {
        "200": 121757
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "d2sv4",
    "instance_type": "Standard_D2s_v4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 27388.56799119515,
        "tailscale": 1352.4745081654671,
        "delta_pct": -95.06190134292433
      },
      "p50_latency": {
        "baseline_ms": 0.552648573033882,
        "tailscale_ms": 10.94862198329215,
        "delta_pct": 1881.1182942511473
      },
      "p99_latency": {
        "baseline_ms": 4.6283763288779305,
        "tailscale_ms": 37.03468625516076,
        "delta_pct": 700.1658383759641
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "aks/d2sv4/results/Standard_D2s_v4-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 2,
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 1339.3464184802585,
      "avg_latency_ms": 12.252253006775488,
      "p50_latency_ms": 10.892207380918796,
      "p90_latency_ms": 21.010514043122743,
      "p99_latency_ms": 36.01219334433444,
      "p999_latency_ms": 56.13467721661116,
      "status_codes": {
        "200": 120577
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "d2sv4",
    "instance_type": "Standard_D2s_v4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 10334.943685825847,
        "tailscale": 1339.3464184802585,
        "delta_pct": -87.04060264675518
      },
      "p50_latency": {
        "baseline_ms": 0.9957307574175855,
        "tailscale_ms": 10.892207380918796,
        "delta_pct": 993.8908233755469
      },
      "p99_latency": {
        "baseline_ms": 8.028675775187361,
        "tailscale_ms": 36.01219334433444,
        "delta_pct": 348.5446212142505
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "aks/d2sv4/results/Standard_D2s_v4-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
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
  },
  {
    "baseline_mtr": {
      "target_ip": "10.244.1.158",
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
          "last_ms": 1,
          "avg_ms": 1.3,
          "best_ms": 0.7,
          "worst_ms": 12.7,
          "stdev_ms": 1.8
        },
        {
          "hop": 3,
          "host": "10.244.1.158",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.2,
          "avg_ms": 1.6,
          "best_ms": 0.7,
          "worst_ms": 20.8,
          "stdev_ms": 2.8
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9411.30388415974,
          "retransmits": 287554,
          "duration_sec": 30.002834,
          "bytes_transferred": 35295723520
        },
        {
          "bandwidth_mbps": 9420.78752178421,
          "retransmits": 250699,
          "duration_sec": 30.002238,
          "bytes_transferred": 35330588672
        },
        {
          "bandwidth_mbps": 9388.29662895463,
          "retransmits": 350229,
          "duration_sec": 30.002533,
          "bytes_transferred": 35209084928
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9406.796011632861,
        "bandwidth_mbps_min": 9388.29662895463,
        "bandwidth_mbps_max": 9420.78752178421,
        "bandwidth_mbps_stddev": 13.641974814392562,
        "retransmits_avg": 296160.6666666667
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 8872.453020569554,
          "retransmits": 419,
          "duration_sec": 30.001428,
          "bytes_transferred": 33273282560
        },
        {
          "bandwidth_mbps": 8881.44579296011,
          "retransmits": 213,
          "duration_sec": 30.001629,
          "bytes_transferred": 33307230208
        },
        {
          "bandwidth_mbps": 8666.535206775792,
          "retransmits": 152,
          "duration_sec": 30.001384,
          "bytes_transferred": 32501006336
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 8806.811340101818,
        "bandwidth_mbps_min": 8666.535206775792,
        "bandwidth_mbps_max": 8881.44579296011,
        "bandwidth_mbps_stddev": 99.25812367926693,
        "retransmits_avg": 261.3333333333333
      }
    },
    "cloud_provider": "aks",
    "connection_type": "direct",
    "date": "2026-03-25",
    "ena_express": false,
    "environment": "container",
    "instance_family": "d4sv4",
    "instance_type": "Standard_D4s_v4",
    "kernel_version": "5.15.0-1102-azure",
    "overhead": {
      "bandwidth_pct": 84.64942503420104,
      "retransmits_pct": 98.81663331389943
    },
    "overhead_single": {
      "bandwidth_pct": 82.46671663191042,
      "retransmits_pct": -6.887755102040817
    },
    "region": "eastus",
    "source": "aks/d4sv4/results/Standard_D4s_v4-l4-kernel.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 0,
      "mtu_tailscale": 0,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t16384\t4194304",
      "kernel_full": "Linux tb-aks-server-standard-d4s-v4 5.15.0-1102-azure #111-Ubuntu SMP Fri Nov 21 22:22:11 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.102.185.11",
      "hops": [
        {
          "hop": 1,
          "host": "100.102.185.11",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 1.6,
          "avg_ms": 1.3,
          "best_ms": 1,
          "worst_ms": 1.9,
          "stdev_ms": 0.2
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1441.9986551347167,
          "retransmits": 2001,
          "duration_sec": 30.001518,
          "bytes_transferred": 5407768576
        },
        {
          "bandwidth_mbps": 1436.5014258179679,
          "retransmits": 3533,
          "duration_sec": 30.001726,
          "bytes_transferred": 5387190272
        },
        {
          "bandwidth_mbps": 1453.4917399837793,
          "retransmits": 4980,
          "duration_sec": 30.001636,
          "bytes_transferred": 5450891264
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1443.9972736454881,
        "bandwidth_mbps_min": 1436.5014258179679,
        "bandwidth_mbps_max": 1453.4917399837793,
        "bandwidth_mbps_stddev": 7.0787734731821805,
        "retransmits_avg": 3504.6666666666665
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1541.8526304912834,
          "retransmits": 99,
          "duration_sec": 30.001525,
          "bytes_transferred": 5782241280
        },
        {
          "bandwidth_mbps": 1526.547302891619,
          "retransmits": 583,
          "duration_sec": 30.001464,
          "bytes_transferred": 5724831744
        },
        {
          "bandwidth_mbps": 1563.9696304763977,
          "retransmits": 156,
          "duration_sec": 30.001656,
          "bytes_transferred": 5865209856
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1544.1231879531,
        "bandwidth_mbps_min": 1526.547302891619,
        "bandwidth_mbps_max": 1563.9696304763977,
        "bandwidth_mbps_stddev": 15.361732190873544,
        "retransmits_avg": 279.3333333333333
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
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 11275.708394955138,
      "avg_latency_ms": 1.4194507770789635,
      "p50_latency_ms": 1.390623996224311,
      "p90_latency_ms": 2.1924959695586144,
      "p99_latency_ms": 4.599151039976914,
      "p999_latency_ms": 9.075512743288876,
      "status_codes": {
        "200": 1014855
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "instance_family": "d4sv4",
    "instance_type": "Standard_D4s_v4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 28709.205821325613,
        "tailscale": 11275.708394955138,
        "delta_pct": -60.724415488430616
      },
      "p50_latency": {
        "baseline_ms": 0.5455434910609945,
        "tailscale_ms": 1.390623996224311,
        "delta_pct": 154.90616587135344
      },
      "p99_latency": {
        "baseline_ms": 4.656879546832784,
        "tailscale_ms": 4.599151039976914,
        "delta_pct": -1.239639253609903
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "aks/d4sv4/results/Standard_D4s_v4-l4-lb.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l4-lb",
    "vcpus": 4,
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 1377.3123424273251,
      "avg_latency_ms": 11.957065115942399,
      "p50_latency_ms": 11.007367066950764,
      "p90_latency_ms": 20.323143501816933,
      "p99_latency_ms": 34.37621586525213,
      "p999_latency_ms": 56.78736915051571,
      "status_codes": {
        "200": 123977
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "1.1",
    "instance_family": "d4sv4",
    "instance_type": "Standard_D4s_v4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 28899.628004214857,
        "tailscale": 1377.3123424273251,
        "delta_pct": -95.23415200283391
      },
      "p50_latency": {
        "baseline_ms": 0.5447194828846085,
        "tailscale_ms": 11.007367066950764,
        "delta_pct": 1920.7404752002465
      },
      "p99_latency": {
        "baseline_ms": 4.685843213526539,
        "tailscale_ms": 34.37621586525213,
        "delta_pct": 633.6185676468843
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "aks/d4sv4/results/Standard_D4s_v4-l7-ingress-h1.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h1",
    "vcpus": 4,
    "zone": "eastus"
  },
  {
    "baseline_mtr": null,
    "baseline_tcp": null,
    "baseline_tcp_single": null,
    "cloud_provider": "aks",
    "connection_type": "",
    "date": "2026-03-24",
    "ena_express": false,
    "environment": "container",
    "fortio_result": {
      "qps": 1346.263113577728,
      "avg_latency_ms": 12.189541232870065,
      "p50_latency_ms": 11.09386008051542,
      "p90_latency_ms": 20.64088709317988,
      "p99_latency_ms": 34.15391721065339,
      "p999_latency_ms": 53.337192079297836,
      "status_codes": {
        "200": 121230
      },
      "bytes_per_sec": 0,
      "connection_errors": 0
    },
    "http_version": "2",
    "instance_family": "d4sv4",
    "instance_type": "Standard_D4s_v4",
    "kernel_version": "",
    "l7_overhead": {
      "qps": {
        "baseline": 10737.002874271755,
        "tailscale": 1346.263113577728,
        "delta_pct": -87.46146266940401
      },
      "p50_latency": {
        "baseline_ms": 0.9611580409461368,
        "tailscale_ms": 11.09386008051542,
        "delta_pct": 1054.2181002403038
      },
      "p99_latency": {
        "baseline_ms": 7.69494340167752,
        "tailscale_ms": 34.15391721065339,
        "delta_pct": 343.8488423866475
      }
    },
    "overhead": null,
    "overhead_single": null,
    "region": "eastus",
    "source": "aks/d4sv4/results/Standard_D4s_v4-l7-ingress-h2.json",
    "system_config": null,
    "tailscale_mtr": null,
    "tailscale_tcp": null,
    "tailscale_tcp_single": null,
    "tailscale_version": "1.94.2",
    "test_config": null,
    "transport_mode": "l7-ingress-h2",
    "vcpus": 4,
    "zone": "eastus"
  }
];
