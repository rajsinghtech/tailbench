const TAILBENCH_DATA = [
  {
    "cloud_provider": "gcp",
    "instance_family": "c2",
    "instance_type": "c2-standard-16",
    "vcpus": 16,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 31640.248104896848,
          "retransmits": 417,
          "duration_sec": 30.001665,
          "bytes_transferred": 118657515520
        },
        {
          "bandwidth_mbps": 24262.403781787772,
          "retransmits": 0,
          "duration_sec": 30.001472,
          "bytes_transferred": 90988478464
        },
        {
          "bandwidth_mbps": 31802.08425281531,
          "retransmits": 369,
          "duration_sec": 30.001585,
          "bytes_transferred": 119264116736
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 29234.912046499976,
        "bandwidth_mbps_min": 24262.403781787772,
        "bandwidth_mbps_max": 31802.08425281531,
        "bandwidth_mbps_stddev": 4307.0787,
        "retransmits_avg": 262
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4237.521970694718,
          "retransmits": 6379,
          "duration_sec": 30.000872,
          "bytes_transferred": 15891169280
        },
        {
          "bandwidth_mbps": 4146.531804252193,
          "retransmits": 7743,
          "duration_sec": 30.00146,
          "bytes_transferred": 15550251008
        },
        {
          "bandwidth_mbps": 4275.48993656539,
          "retransmits": 5043,
          "duration_sec": 30.001288,
          "bytes_transferred": 16033775616
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4219.847903837434,
        "bandwidth_mbps_min": 4146.531804252193,
        "bandwidth_mbps_max": 4275.48993656539,
        "bandwidth_mbps_stddev": 66.2709,
        "retransmits_avg": 6388.333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 85.56572396343967,
      "retransmits_pct": 2338.295165394402
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.38",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.38",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.500,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.94.133.85",
      "hops": [
        {
          "hop": 1,
          "host": "100.94.133.85",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.700,
          "best_ms": 0.500,
          "worst_ms": 1.300,
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 31967.08430476781,
          "retransmits": 543,
          "duration_sec": 30.001423,
          "bytes_transferred": 119882252288
        },
        {
          "bandwidth_mbps": 31953.489086674635,
          "retransmits": 128,
          "duration_sec": 30.001488,
          "bytes_transferred": 119831527424
        },
        {
          "bandwidth_mbps": 24583.486521814622,
          "retransmits": 99,
          "duration_sec": 30.000589,
          "bytes_transferred": 92189884416
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 29501.353304419026,
        "bandwidth_mbps_min": 24583.486521814622,
        "bandwidth_mbps_max": 31967.08430476781,
        "bandwidth_mbps_stddev": 4259.0030,
        "retransmits_avg": 256.6666666666667
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4481.524329471808,
          "retransmits": 3264,
          "duration_sec": 30.001535,
          "bytes_transferred": 16806576128
        },
        {
          "bandwidth_mbps": 4442.700271216502,
          "retransmits": 10999,
          "duration_sec": 30.001493,
          "bytes_transferred": 16660955136
        },
        {
          "bandwidth_mbps": 4409.3981904609145,
          "retransmits": 2625,
          "duration_sec": 30.001452,
          "bytes_transferred": 16536043520
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4444.540930383075,
        "bandwidth_mbps_min": 4409.3981904609145,
        "bandwidth_mbps_max": 4481.524329471808,
        "bandwidth_mbps_stddev": 36.0983,
        "retransmits_avg": 5629.333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 84.93445068597133,
      "retransmits_pct": 2093.2467532467526
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.52",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.52",
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
      "target_ip": "100.123.150.96",
      "hops": [
        {
          "hop": 1,
          "host": "100.123.150.96",
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
    "source": "gcp/c2/results/c2-standard-30.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c2",
    "instance_type": "c2-standard-4",
    "vcpus": 4,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9615.48001780564,
          "retransmits": 0,
          "duration_sec": 30.001735,
          "bytes_transferred": 36060135424
        },
        {
          "bandwidth_mbps": 9841.728580621959,
          "retransmits": 0,
          "duration_sec": 30.001373,
          "bytes_transferred": 36908171264
        },
        {
          "bandwidth_mbps": 9839.700813703594,
          "retransmits": 0,
          "duration_sec": 30.001588,
          "bytes_transferred": 36900831232
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9765.636470710398,
        "bandwidth_mbps_min": 9615.48001780564,
        "bandwidth_mbps_max": 9841.728580621959,
        "bandwidth_mbps_stddev": 130.0433,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2957.2132484497984,
          "retransmits": 76529,
          "duration_sec": 30.001578,
          "bytes_transferred": 11090132992
        },
        {
          "bandwidth_mbps": 2936.6222836870143,
          "retransmits": 65677,
          "duration_sec": 30.000915,
          "bytes_transferred": 11012669440
        },
        {
          "bandwidth_mbps": 2937.802897597326,
          "retransmits": 58514,
          "duration_sec": 30.000994,
          "bytes_transferred": 11017125888
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2943.8794765780463,
        "bandwidth_mbps_min": 2936.6222836870143,
        "bandwidth_mbps_max": 2957.2132484497984,
        "bandwidth_mbps_stddev": 11.5625,
        "retransmits_avg": 66906.66666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 69.8547095685214,
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
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.125.10.74",
      "hops": [
        {
          "hop": 1,
          "host": "100.125.10.74",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 0.600,
          "best_ms": 0.500,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 16628.037766280162,
          "retransmits": 0,
          "duration_sec": 30.001578,
          "bytes_transferred": 62358421504
        },
        {
          "bandwidth_mbps": 16737.62548951226,
          "retransmits": 0,
          "duration_sec": 30.001547,
          "bytes_transferred": 62769332224
        },
        {
          "bandwidth_mbps": 16723.931492171985,
          "retransmits": 0,
          "duration_sec": 30.001535,
          "bytes_transferred": 62717952000
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 16696.5315826548,
        "bandwidth_mbps_min": 16628.037766280162,
        "bandwidth_mbps_max": 16737.62548951226,
        "bandwidth_mbps_stddev": 59.7113,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3885.91404738833,
          "retransmits": 786,
          "duration_sec": 30.001648,
          "bytes_transferred": 14572978176
        },
        {
          "bandwidth_mbps": 3864.563603103917,
          "retransmits": 890,
          "duration_sec": 30.0008,
          "bytes_transferred": 14492499968
        },
        {
          "bandwidth_mbps": 3855.445080003437,
          "retransmits": 596,
          "duration_sec": 30.001586,
          "bytes_transferred": 14458683392
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3868.640910165228,
        "bandwidth_mbps_min": 3855.445080003437,
        "bandwidth_mbps_max": 3885.91404738833,
        "bandwidth_mbps_stddev": 15.6383,
        "retransmits_avg": 757.3333333333334
      }
    },
    "overhead": {
      "bandwidth_pct": 76.82967333057263,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.53",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.53",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.98.161.50",
      "hops": [
        {
          "hop": 1,
          "host": "100.98.161.50",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 0.600,
          "best_ms": 0.500,
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 21309.726408850976,
          "retransmits": 6,
          "duration_sec": 30.001665,
          "bytes_transferred": 79915909120
        },
        {
          "bandwidth_mbps": 21222.641395930197,
          "retransmits": 11583,
          "duration_sec": 30.0015,
          "bytes_transferred": 79588884480
        },
        {
          "bandwidth_mbps": 21412.07031119252,
          "retransmits": 4303,
          "duration_sec": 30.001653,
          "bytes_transferred": 80299687936
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21314.812705324566,
        "bandwidth_mbps_min": 21222.641395930197,
        "bandwidth_mbps_max": 21412.07031119252,
        "bandwidth_mbps_stddev": 94.8168,
        "retransmits_avg": 5297.333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5468.788509645682,
          "retransmits": 854,
          "duration_sec": 30.001094,
          "bytes_transferred": 20508704768
        },
        {
          "bandwidth_mbps": 5477.601912489984,
          "retransmits": 736,
          "duration_sec": 30.00068,
          "bytes_transferred": 20541472768
        },
        {
          "bandwidth_mbps": 5487.422620097595,
          "retransmits": 3082,
          "duration_sec": 30.000684,
          "bytes_transferred": 20578304000
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5477.9376807444205,
        "bandwidth_mbps_min": 5468.788509645682,
        "bandwidth_mbps_max": 5487.422620097595,
        "bandwidth_mbps_stddev": 9.3216,
        "retransmits_avg": 1557.3333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 74.29985542694448,
      "retransmits_pct": -70.60156053360181
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.198",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.198",
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
      "target_ip": "100.91.236.84",
      "hops": [
        {
          "hop": 1,
          "host": "100.91.236.84",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.600,
          "best_ms": 0.500,
          "worst_ms": 2.400,
          "stdev_ms": 0.200
        }
      ]
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 21408.68652451179,
          "retransmits": 975,
          "duration_sec": 30.001644,
          "bytes_transferred": 80286973952
        },
        {
          "bandwidth_mbps": 21330.454130982893,
          "retransmits": 703,
          "duration_sec": 30.001613,
          "bytes_transferred": 79993503744
        },
        {
          "bandwidth_mbps": 21313.520113617982,
          "retransmits": 1000,
          "duration_sec": 30.001589,
          "bytes_transferred": 79929933824
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21350.886923037557,
        "bandwidth_mbps_min": 21313.520113617982,
        "bandwidth_mbps_max": 21408.68652451179,
        "bandwidth_mbps_stddev": 50.7670,
        "retransmits_avg": 892.6666666666666
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5927.625432678886,
          "retransmits": 8037,
          "duration_sec": 30.001464,
          "bytes_transferred": 22229680128
        },
        {
          "bandwidth_mbps": 5858.07133226959,
          "retransmits": 12706,
          "duration_sec": 30.001653,
          "bytes_transferred": 21968977920
        },
        {
          "bandwidth_mbps": 5934.510335544198,
          "retransmits": 8967,
          "duration_sec": 30.000936,
          "bytes_transferred": 22255108096
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5906.735700164224,
        "bandwidth_mbps_min": 5858.07133226959,
        "bandwidth_mbps_max": 5934.510335544198,
        "bandwidth_mbps_stddev": 42.2849,
        "retransmits_avg": 9903.333333333334
      }
    },
    "overhead": {
      "bandwidth_pct": 72.33493989520937,
      "retransmits_pct": 1009.4100074682601
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.3",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.3",
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
      "target_ip": "100.117.130.63",
      "hops": [
        {
          "hop": 1,
          "host": "100.117.130.63",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.600,
          "best_ms": 0.500,
          "worst_ms": 2.400,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "gcp/c3/results/c3-standard-8.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-4",
    "vcpus": 4,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 18184.446749755367,
          "retransmits": 267,
          "duration_sec": 30.001834,
          "bytes_transferred": 68195844096
        },
        {
          "bandwidth_mbps": 18538.814232134762,
          "retransmits": 1308,
          "duration_sec": 30.001599,
          "bytes_transferred": 69524258816
        },
        {
          "bandwidth_mbps": 18528.484273258462,
          "retransmits": 2786,
          "duration_sec": 30.001574,
          "bytes_transferred": 69485461504
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18417.248418382864,
        "bandwidth_mbps_min": 18184.446749755367,
        "bandwidth_mbps_max": 18538.814232134762,
        "bandwidth_mbps_stddev": 201.6783,
        "retransmits_avg": 1453.6666666666667
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4378.816437945579,
          "retransmits": 5055,
          "duration_sec": 30.000732,
          "bytes_transferred": 16420962304
        },
        {
          "bandwidth_mbps": 4539.479780585814,
          "retransmits": 4154,
          "duration_sec": 30.000795,
          "bytes_transferred": 17023500288
        },
        {
          "bandwidth_mbps": 4638.022738534585,
          "retransmits": 8051,
          "duration_sec": 30.000702,
          "bytes_transferred": 17392992256
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4518.772985688659,
        "bandwidth_mbps_min": 4378.816437945579,
        "bandwidth_mbps_max": 4638.022738534585,
        "bandwidth_mbps_stddev": 130.8379,
        "retransmits_avg": 5753.333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 75.46445113278529,
      "retransmits_pct": 295.78078422380185
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.194",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.194",
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
      "target_ip": "100.114.238.47",
      "hops": [
        {
          "hop": 1,
          "host": "100.114.238.47",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.900,
          "avg_ms": 0.700,
          "best_ms": 0.500,
          "worst_ms": 1.000,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/c3d/results/c3d-standard-4.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-8",
    "vcpus": 8,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 18270.695326610123,
          "retransmits": 1103,
          "duration_sec": 30.001734,
          "bytes_transferred": 68519067648
        },
        {
          "bandwidth_mbps": 18540.85530984263,
          "retransmits": 125,
          "duration_sec": 30.001633,
          "bytes_transferred": 69531992064
        },
        {
          "bandwidth_mbps": 18521.936862528157,
          "retransmits": 817,
          "duration_sec": 30.001423,
          "bytes_transferred": 69460557824
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18444.495832993638,
        "bandwidth_mbps_min": 18270.695326610123,
        "bandwidth_mbps_max": 18540.85530984263,
        "bandwidth_mbps_stddev": 150.8126,
        "retransmits_avg": 681.6666666666666
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4402.770615341495,
          "retransmits": 3967,
          "duration_sec": 30.001601,
          "bytes_transferred": 16511270912
        },
        {
          "bandwidth_mbps": 4405.894735494804,
          "retransmits": 2646,
          "duration_sec": 30.001509,
          "bytes_transferred": 16522936320
        },
        {
          "bandwidth_mbps": 4427.765736535367,
          "retransmits": 3487,
          "duration_sec": 30.000854,
          "bytes_transferred": 16604594176
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4412.143695790554,
        "bandwidth_mbps_min": 4402.770615341495,
        "bandwidth_mbps_max": 4427.765736535367,
        "bandwidth_mbps_stddev": 13.6190,
        "retransmits_avg": 3366.6666666666665
      }
    },
    "overhead": {
      "bandwidth_pct": 76.0788056461913,
      "retransmits_pct": 393.8875305623472
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.200",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.200",
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
      "target_ip": "100.125.136.100",
      "hops": [
        {
          "hop": 1,
          "host": "100.125.136.100",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.600,
          "best_ms": 0.500,
          "worst_ms": 0.900,
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9555.005628441151,
          "retransmits": 0,
          "duration_sec": 30.000669,
          "bytes_transferred": 35832070144
        },
        {
          "bandwidth_mbps": 9555.20273672863,
          "retransmits": 0,
          "duration_sec": 30.001367,
          "bytes_transferred": 35833643008
        },
        {
          "bandwidth_mbps": 9555.314461165506,
          "retransmits": 0,
          "duration_sec": 30.000687,
          "bytes_transferred": 35833249792
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9555.174275445097,
        "bandwidth_mbps_min": 9555.005628441151,
        "bandwidth_mbps_max": 9555.314461165506,
        "bandwidth_mbps_stddev": 0.1564,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4600.171537732136,
          "retransmits": 25,
          "duration_sec": 30.001376,
          "bytes_transferred": 17251434496
        },
        {
          "bandwidth_mbps": 4626.4145357311745,
          "retransmits": 48,
          "duration_sec": 30.002316,
          "bytes_transferred": 17350393856
        },
        {
          "bandwidth_mbps": 4631.663621606238,
          "retransmits": 5862,
          "duration_sec": 30.001594,
          "bytes_transferred": 17369661440
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4619.416565023183,
        "bandwidth_mbps_min": 4600.171537732136,
        "bandwidth_mbps_max": 4631.663621606238,
        "bandwidth_mbps_stddev": 16.8721,
        "retransmits_avg": 1978.3333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 51.65533948560031,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.196",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.196",
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
      "target_ip": "100.89.191.85",
      "hops": [
        {
          "hop": 1,
          "host": "100.89.191.85",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.600,
          "best_ms": 0.400,
          "worst_ms": 0.900,
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 21972.41114449845,
          "retransmits": 691,
          "duration_sec": 30.001063,
          "bytes_transferred": 82399461376
        },
        {
          "bandwidth_mbps": 21973.02781686526,
          "retransmits": 0,
          "duration_sec": 30.00108,
          "bytes_transferred": 82401820672
        },
        {
          "bandwidth_mbps": 21972.8196945051,
          "retransmits": 0,
          "duration_sec": 30.001221,
          "bytes_transferred": 82401427456
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21972.752885289603,
        "bandwidth_mbps_min": 21972.41114449845,
        "bandwidth_mbps_max": 21973.02781686526,
        "bandwidth_mbps_stddev": 0.3137,
        "retransmits_avg": 230.33333333333334
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6454.45627321168,
          "retransmits": 5916,
          "duration_sec": 30.00106,
          "bytes_transferred": 24205066240
        },
        {
          "bandwidth_mbps": 6444.081966649746,
          "retransmits": 4765,
          "duration_sec": 30.001031,
          "bytes_transferred": 24166137856
        },
        {
          "bandwidth_mbps": 6438.554843881025,
          "retransmits": 209,
          "duration_sec": 30.001542,
          "bytes_transferred": 24145821696
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6445.697694580817,
        "bandwidth_mbps_min": 6438.554843881025,
        "bandwidth_mbps_max": 6454.45627321168,
        "bandwidth_mbps_stddev": 8.0729,
        "retransmits_avg": 3630
      }
    },
    "overhead": {
      "bandwidth_pct": 70.66504261786831,
      "retransmits_pct": 1475.9768451519535
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.27",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.27",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.122.182.74",
      "hops": [
        {
          "hop": 1,
          "host": "100.122.182.74",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.700,
          "best_ms": 0.300,
          "worst_ms": 1.100,
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
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 21973.709907312663,
          "retransmits": 0,
          "duration_sec": 30.001294,
          "bytes_transferred": 82404966400
        },
        {
          "bandwidth_mbps": 21972.981520343583,
          "retransmits": 0,
          "duration_sec": 30.000666,
          "bytes_transferred": 82400509952
        },
        {
          "bandwidth_mbps": 21973.101790311575,
          "retransmits": 0,
          "duration_sec": 30.000979,
          "bytes_transferred": 82401820672
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21973.264405989274,
        "bandwidth_mbps_min": 21972.981520343583,
        "bandwidth_mbps_max": 21973.709907312663,
        "bandwidth_mbps_stddev": 0.3905,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6971.232268825727,
          "retransmits": 4743,
          "duration_sec": 30.000819,
          "bytes_transferred": 26142834688
        },
        {
          "bandwidth_mbps": 7035.455184820734,
          "retransmits": 5121,
          "duration_sec": 30.000449,
          "bytes_transferred": 26383351808
        },
        {
          "bandwidth_mbps": 7019.522861499037,
          "retransmits": 6120,
          "duration_sec": 30.000723,
          "bytes_transferred": 26323845120
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 7008.736771715166,
        "bandwidth_mbps_min": 6971.232268825727,
        "bandwidth_mbps_max": 7035.455184820734,
        "bandwidth_mbps_stddev": 33.4425,
        "retransmits_avg": 5328
      }
    },
    "overhead": {
      "bandwidth_pct": 68.10334303443422,
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
          "last_ms": 0.300,
          "avg_ms": 0.300,
          "best_ms": 0.100,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.87.231.26",
      "hops": [
        {
          "hop": 1,
          "host": "100.87.231.26",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 0.600,
          "best_ms": 0.300,
          "worst_ms": 1.100,
          "stdev_ms": 0.100
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
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9150.2471076279,
          "retransmits": 1807,
          "duration_sec": 30.001413,
          "bytes_transferred": 34315042816
        },
        {
          "bandwidth_mbps": 9270.86509128489,
          "retransmits": 1920,
          "duration_sec": 30.001405,
          "bytes_transferred": 34767372288
        },
        {
          "bandwidth_mbps": 9272.929048675363,
          "retransmits": 713,
          "duration_sec": 30.001399,
          "bytes_transferred": 34775105536
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9231.347082529384,
        "bandwidth_mbps_min": 9150.2471076279,
        "bandwidth_mbps_max": 9272.929048675363,
        "bandwidth_mbps_stddev": 70.2422,
        "retransmits_avg": 1480
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1648.7082493231467,
          "retransmits": 697,
          "duration_sec": 30.001322,
          "bytes_transferred": 6182928384
        },
        {
          "bandwidth_mbps": 1645.9472854510163,
          "retransmits": 318,
          "duration_sec": 30.001319,
          "bytes_transferred": 6172573696
        },
        {
          "bandwidth_mbps": 1634.830579852694,
          "retransmits": 195,
          "duration_sec": 30.001361,
          "bytes_transferred": 6130892800
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1643.1620382089525,
        "bandwidth_mbps_min": 1634.830579852694,
        "bandwidth_mbps_max": 1648.7082493231467,
        "bandwidth_mbps_stddev": 7.3461,
        "retransmits_avg": 403.3333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 82.20019219818212,
      "retransmits_pct": -72.74774774774775
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.197",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.197",
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
      "target_ip": "100.124.38.35",
      "hops": [
        {
          "hop": 1,
          "host": "100.124.38.35",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.300,
          "best_ms": 0.200,
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
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9090.695341063774,
          "retransmits": 1021,
          "duration_sec": 30.001398,
          "bytes_transferred": 34091696128
        },
        {
          "bandwidth_mbps": 9256.690231534996,
          "retransmits": 0,
          "duration_sec": 30.001469,
          "bytes_transferred": 34714288128
        },
        {
          "bandwidth_mbps": 9275.825658734828,
          "retransmits": 236,
          "duration_sec": 30.001526,
          "bytes_transferred": 34786115584
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9207.737077111198,
        "bandwidth_mbps_min": 9090.695341063774,
        "bandwidth_mbps_max": 9275.825658734828,
        "bandwidth_mbps_stddev": 101.8117,
        "retransmits_avg": 419
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3821.150051337173,
          "retransmits": 2583,
          "duration_sec": 30.001652,
          "bytes_transferred": 14330101760
        },
        {
          "bandwidth_mbps": 3802.40264282674,
          "retransmits": 6403,
          "duration_sec": 30.00121,
          "bytes_transferred": 14259585024
        },
        {
          "bandwidth_mbps": 3815.77162571306,
          "retransmits": 40,
          "duration_sec": 30.001346,
          "bytes_transferred": 14309785600
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3813.1081066256575,
        "bandwidth_mbps_min": 3802.40264282674,
        "bandwidth_mbps_max": 3821.150051337173,
        "bandwidth_mbps_stddev": 9.6533,
        "retransmits_avg": 3008.6666666666665
      }
    },
    "overhead": {
      "bandwidth_pct": 58.58799969316708,
      "retransmits_pct": 618.0588703261733
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
      "target_ip": "100.116.48.113",
      "hops": [
        {
          "hop": 1,
          "host": "100.116.48.113",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
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
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 21110.92836193166,
          "retransmits": 81,
          "duration_sec": 30.001465,
          "bytes_transferred": 79169847296
        },
        {
          "bandwidth_mbps": 21310.71595548783,
          "retransmits": 0,
          "duration_sec": 30.001502,
          "bytes_transferred": 79919185920
        },
        {
          "bandwidth_mbps": 21389.78674795598,
          "retransmits": 0,
          "duration_sec": 30.001485,
          "bytes_transferred": 80215670784
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21270.477021791823,
        "bandwidth_mbps_min": 21110.92836193166,
        "bandwidth_mbps_max": 21389.78674795598,
        "bandwidth_mbps_stddev": 143.7181,
        "retransmits_avg": 27
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5268.4252515555745,
          "retransmits": 0,
          "duration_sec": 30.001621,
          "bytes_transferred": 19757662208
        },
        {
          "bandwidth_mbps": 5318.363461377058,
          "retransmits": 0,
          "duration_sec": 30.001262,
          "bytes_transferred": 19944701952
        },
        {
          "bandwidth_mbps": 5318.758586157932,
          "retransmits": 0,
          "duration_sec": 30.001399,
          "bytes_transferred": 19946274816
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5301.849099696855,
        "bandwidth_mbps_min": 5268.4252515555745,
        "bandwidth_mbps_max": 5318.758586157932,
        "bandwidth_mbps_stddev": 28.9466,
        "retransmits_avg": 0
      }
    },
    "overhead": {
      "bandwidth_pct": 75.07414105351256,
      "retransmits_pct": -100
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.23",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.23",
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
      "target_ip": "100.122.218.114",
      "hops": [
        {
          "hop": 1,
          "host": "100.122.218.114",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.300,
          "best_ms": 0.200,
          "worst_ms": 0.500,
          "stdev_ms": 0.100
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 31163.04168305185,
          "retransmits": 347,
          "duration_sec": 30.00169,
          "bytes_transferred": 116867989504
        },
        {
          "bandwidth_mbps": 23448.26066314789,
          "retransmits": 953,
          "duration_sec": 30.001694,
          "bytes_transferred": 87935942656
        },
        {
          "bandwidth_mbps": 30779.044143902356,
          "retransmits": 0,
          "duration_sec": 30.001788,
          "bytes_transferred": 115428294656
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 28463.44883003403,
        "bandwidth_mbps_min": 23448.26066314789,
        "bandwidth_mbps_max": 31163.04168305185,
        "bandwidth_mbps_stddev": 4347.5220,
        "retransmits_avg": 433.3333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3786.2309858058275,
          "retransmits": 2050,
          "duration_sec": 30.001679,
          "bytes_transferred": 14199160832
        },
        {
          "bandwidth_mbps": 3916.346435403176,
          "retransmits": 6645,
          "duration_sec": 30.002257,
          "bytes_transferred": 14687404032
        },
        {
          "bandwidth_mbps": 3834.0351945134853,
          "retransmits": 7130,
          "duration_sec": 30.00229,
          "bytes_transferred": 14378729472
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3845.537538574163,
        "bandwidth_mbps_min": 3786.2309858058275,
        "bandwidth_mbps_max": 3916.346435403176,
        "bandwidth_mbps_stddev": 65.8159,
        "retransmits_avg": 5275
      }
    },
    "overhead": {
      "bandwidth_pct": 86.48955872657133,
      "retransmits_pct": 1117.3076923076926
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.25",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.25",
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
      "target_ip": "100.107.21.69",
      "hops": [
        {
          "hop": 1,
          "host": "100.107.21.69",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.000,
          "avg_ms": 0.900,
          "best_ms": 0.600,
          "worst_ms": 1.100,
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9837.64140443206,
          "retransmits": 0,
          "duration_sec": 30.001793,
          "bytes_transferred": 36893360128
        },
        {
          "bandwidth_mbps": 9855.637140537845,
          "retransmits": 0,
          "duration_sec": 30.001698,
          "bytes_transferred": 36960731136
        },
        {
          "bandwidth_mbps": 9848.117346743718,
          "retransmits": 0,
          "duration_sec": 30.001821,
          "bytes_transferred": 36932681728
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9847.131963904541,
        "bandwidth_mbps_min": 9837.64140443206,
        "bandwidth_mbps_max": 9855.637140537845,
        "bandwidth_mbps_stddev": 9.0382,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2347.467106331257,
          "retransmits": 15628,
          "duration_sec": 30.002871,
          "bytes_transferred": 8803844096
        },
        {
          "bandwidth_mbps": 2396.4957642194163,
          "retransmits": 7924,
          "duration_sec": 30.009935,
          "bytes_transferred": 8989835264
        },
        {
          "bandwidth_mbps": 2353.875198726126,
          "retransmits": 18124,
          "duration_sec": 30.003604,
          "bytes_transferred": 8828092416
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2365.9460230922664,
        "bandwidth_mbps_min": 2347.467106331257,
        "bandwidth_mbps_max": 2396.4957642194163,
        "bandwidth_mbps_stddev": 26.6502,
        "retransmits_avg": 13892
      }
    },
    "overhead": {
      "bandwidth_pct": 75.97324752257984,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.227",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.227",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.87.146.28",
      "hops": [
        {
          "hop": 1,
          "host": "100.87.146.28",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.800,
          "avg_ms": 0.800,
          "best_ms": 0.600,
          "worst_ms": 4.500,
          "stdev_ms": 0.400
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 31905.035008263385,
          "retransmits": 188,
          "duration_sec": 30.001631,
          "bytes_transferred": 119650385920
        },
        {
          "bandwidth_mbps": 25684.858384612533,
          "retransmits": 1,
          "duration_sec": 30.001768,
          "bytes_transferred": 96323895296
        },
        {
          "bandwidth_mbps": 24911.45248697506,
          "retransmits": 297,
          "duration_sec": 30.001668,
          "bytes_transferred": 93423140864
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 27500.448626616995,
        "bandwidth_mbps_min": 24911.45248697506,
        "bandwidth_mbps_max": 31905.035008263385,
        "bandwidth_mbps_stddev": 3834.0351,
        "retransmits_avg": 162
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3730.5689011269505,
          "retransmits": 1987,
          "duration_sec": 30.001846,
          "bytes_transferred": 13990494208
        },
        {
          "bandwidth_mbps": 3737.7296183349054,
          "retransmits": 8285,
          "duration_sec": 30.001879,
          "bytes_transferred": 14017363968
        },
        {
          "bandwidth_mbps": 3635.6860540936623,
          "retransmits": 3830,
          "duration_sec": 30.002073,
          "bytes_transferred": 13634764800
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3701.3281911851723,
        "bandwidth_mbps_min": 3635.6860540936623,
        "bandwidth_mbps_max": 3737.7296183349054,
        "bandwidth_mbps_stddev": 56.9604,
        "retransmits_avg": 4700.666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 86.54084432788943,
      "retransmits_pct": 2801.6460905349795
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.26",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.26",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.80.67.14",
      "hops": [
        {
          "hop": 1,
          "host": "100.80.67.14",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.100,
          "avg_ms": 0.800,
          "best_ms": 0.500,
          "worst_ms": 1.200,
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9728.230762959314,
          "retransmits": 0,
          "duration_sec": 30.001626,
          "bytes_transferred": 36482842624
        },
        {
          "bandwidth_mbps": 9835.508899099279,
          "retransmits": 0,
          "duration_sec": 30.001688,
          "bytes_transferred": 36885233664
        },
        {
          "bandwidth_mbps": 9848.120801671801,
          "retransmits": 0,
          "duration_sec": 30.001704,
          "bytes_transferred": 36932550656
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9803.953487910132,
        "bandwidth_mbps_min": 9728.230762959314,
        "bandwidth_mbps_max": 9848.120801671801,
        "bandwidth_mbps_stddev": 65.8803,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3359.1788053554924,
          "retransmits": 1426,
          "duration_sec": 30.000975,
          "bytes_transferred": 12597329920
        },
        {
          "bandwidth_mbps": 3402.6356414299626,
          "retransmits": 4144,
          "duration_sec": 30.000867,
          "bytes_transferred": 12760252416
        },
        {
          "bandwidth_mbps": 3430.916255608565,
          "retransmits": 2510,
          "duration_sec": 30.001436,
          "bytes_transferred": 12866551808
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3397.5769007980066,
        "bandwidth_mbps_min": 3359.1788053554924,
        "bandwidth_mbps_max": 3430.916255608565,
        "bandwidth_mbps_stddev": 36.1353,
        "retransmits_avg": 2693.3333333333335
      }
    },
    "overhead": {
      "bandwidth_pct": 65.34482844101849,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.31",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.31",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.300,
          "best_ms": 0.200,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.115.144.117",
      "hops": [
        {
          "hop": 1,
          "host": "100.115.144.117",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.800,
          "avg_ms": 0.900,
          "best_ms": 0.700,
          "worst_ms": 1.300,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/n2/results/n2-standard-4.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "n2",
    "instance_type": "n2-standard-8",
    "vcpus": 8,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 15602.010820972384,
          "retransmits": 0,
          "duration_sec": 30.00174,
          "bytes_transferred": 58510934016
        },
        {
          "bandwidth_mbps": 15741.79028386413,
          "retransmits": 0,
          "duration_sec": 30.001783,
          "bytes_transferred": 59035222016
        },
        {
          "bandwidth_mbps": 15770.419180667981,
          "retransmits": 0,
          "duration_sec": 30.001708,
          "bytes_transferred": 59142438912
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 15704.740095168165,
        "bandwidth_mbps_min": 15602.010820972384,
        "bandwidth_mbps_max": 15770.419180667981,
        "bandwidth_mbps_stddev": 90.1104,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3134.8641849979244,
          "retransmits": 33546,
          "duration_sec": 30.000942,
          "bytes_transferred": 11756109824
        },
        {
          "bandwidth_mbps": 3100.0565848301303,
          "retransmits": 14615,
          "duration_sec": 30.000903,
          "bytes_transferred": 11625562112
        },
        {
          "bandwidth_mbps": 3128.512565622607,
          "retransmits": 23289,
          "duration_sec": 30.001856,
          "bytes_transferred": 11732647936
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3121.1444451502207,
        "bandwidth_mbps_min": 3100.0565848301303,
        "bandwidth_mbps_max": 3134.8641849979244,
        "bandwidth_mbps_stddev": 18.5367,
        "retransmits_avg": 23816.666666666668
      }
    },
    "overhead": {
      "bandwidth_pct": 80.1260993417491,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.128.0.47",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.47",
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
      "target_ip": "100.119.142.42",
      "hops": [
        {
          "hop": 1,
          "host": "100.119.142.42",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.100,
          "avg_ms": 0.900,
          "best_ms": 0.600,
          "worst_ms": 1.200,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/n2/results/n2-standard-8.json"
  },
  {
    "cloud_provider": "gcp",
    "instance_family": "n4",
    "instance_type": "n4-standard-2",
    "vcpus": 2,
    "region": "us-central1",
    "zone": "us-central1-a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9130.10404430685,
          "retransmits": 0,
          "duration_sec": 30.00168,
          "bytes_transferred": 34239807488
        },
        {
          "bandwidth_mbps": 9249.506732072616,
          "retransmits": 1777,
          "duration_sec": 30.001756,
          "bytes_transferred": 34687680512
        },
        {
          "bandwidth_mbps": 9307.538706297946,
          "retransmits": 0,
          "duration_sec": 30.001823,
          "bytes_transferred": 34905391104
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9229.049827559136,
        "bandwidth_mbps_min": 9130.10404430685,
        "bandwidth_mbps_max": 9307.538706297946,
        "bandwidth_mbps_stddev": 90.4689,
        "retransmits_avg": 592.3333333333334
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3124.423435341772,
          "retransmits": 5519,
          "duration_sec": 30.002191,
          "bytes_transferred": 11717443584
        },
        {
          "bandwidth_mbps": 3252.6278645775956,
          "retransmits": 1859,
          "duration_sec": 30.001151,
          "bytes_transferred": 12197822464
        },
        {
          "bandwidth_mbps": 3177.1379647386525,
          "retransmits": 415,
          "duration_sec": 30.002427,
          "bytes_transferred": 11915231232
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3184.7297548860065,
        "bandwidth_mbps_min": 3124.423435341772,
        "bandwidth_mbps_max": 3252.6278645775956,
        "bandwidth_mbps_stddev": 64.4385,
        "retransmits_avg": 2597.6666666666665
      }
    },
    "overhead": {
      "bandwidth_pct": 65.49233329116947,
      "retransmits_pct": 338.54811480022505
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.214",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.214",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.200,
          "best_ms": 0.200,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.103.85.73",
      "hops": [
        {
          "hop": 1,
          "host": "100.103.85.73",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.200,
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
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9067.1912816771,
          "retransmits": 81,
          "duration_sec": 30.001917,
          "bytes_transferred": 34004140032
        },
        {
          "bandwidth_mbps": 9268.552049362324,
          "retransmits": 837,
          "duration_sec": 30.001991,
          "bytes_transferred": 34759376896
        },
        {
          "bandwidth_mbps": 9295.009168726934,
          "retransmits": 0,
          "duration_sec": 30.001766,
          "bytes_transferred": 34858336256
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9210.250833255453,
        "bandwidth_mbps_min": 9067.1912816771,
        "bandwidth_mbps_max": 9295.009168726934,
        "bandwidth_mbps_stddev": 124.5974,
        "retransmits_avg": 306
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4468.8774268685,
          "retransmits": 1283,
          "duration_sec": 30.001265,
          "bytes_transferred": 16758996992
        },
        {
          "bandwidth_mbps": 4674.40789147505,
          "retransmits": 1517,
          "duration_sec": 30.000475,
          "bytes_transferred": 17529307136
        },
        {
          "bandwidth_mbps": 4718.035589300058,
          "retransmits": 1804,
          "duration_sec": 30.000871,
          "bytes_transferred": 17693147136
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4620.44030254787,
        "bandwidth_mbps_min": 4468.8774268685,
        "bandwidth_mbps_max": 4718.035589300058,
        "bandwidth_mbps_stddev": 133.0576,
        "retransmits_avg": 1534.6666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 49.83371912234089,
      "retransmits_pct": 401.525054466231
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.225",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.225",
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
      "target_ip": "100.104.23.48",
      "hops": [
        {
          "hop": 1,
          "host": "100.104.23.48",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.100,
          "avg_ms": 0.800,
          "best_ms": 0.600,
          "worst_ms": 1.100,
          "stdev_ms": 0.100
        }
      ]
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
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1021-gcp",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 14874.840756119773,
          "retransmits": 2007,
          "duration_sec": 30.001649,
          "bytes_transferred": 55783718912
        },
        {
          "bandwidth_mbps": 14829.93308829127,
          "retransmits": 150,
          "duration_sec": 30.001924,
          "bytes_transferred": 55615815680
        },
        {
          "bandwidth_mbps": 14822.709502909163,
          "retransmits": 948,
          "duration_sec": 30.00176,
          "bytes_transferred": 55588421632
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 14842.494449106736,
        "bandwidth_mbps_min": 14822.709502909163,
        "bandwidth_mbps_max": 14874.840756119773,
        "bandwidth_mbps_stddev": 28.2446,
        "retransmits_avg": 1035
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5156.204435175584,
          "retransmits": 329,
          "duration_sec": 30.000571,
          "bytes_transferred": 19336134656
        },
        {
          "bandwidth_mbps": 5175.61552249329,
          "retransmits": 547,
          "duration_sec": 30.000902,
          "bytes_transferred": 19409141760
        },
        {
          "bandwidth_mbps": 5188.851280887924,
          "retransmits": 128,
          "duration_sec": 30.001571,
          "bytes_transferred": 19459211264
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5173.557079518933,
        "bandwidth_mbps_min": 5156.204435175584,
        "bandwidth_mbps_max": 5188.851280887924,
        "bandwidth_mbps_stddev": 16.4205,
        "retransmits_avg": 334.6666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 65.14361452343145,
      "retransmits_pct": -67.66505636070853
    },
    "baseline_mtr": {
      "target_ip": "10.128.15.222",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.222",
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
      "target_ip": "100.88.65.122",
      "hops": [
        {
          "hop": 1,
          "host": "100.88.65.122",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.100,
          "avg_ms": 0.900,
          "best_ms": 0.600,
          "worst_ms": 1.200,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "gcp/n4/results/n4-standard-8.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6i",
    "instance_type": "c6i.12xlarge",
    "vcpus": 48,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 18626.55104144595,
          "retransmits": 0,
          "duration_sec": 30.001413,
          "bytes_transferred": 69852856320
        },
        {
          "bandwidth_mbps": 18626.473944072844,
          "retransmits": 0,
          "duration_sec": 30.001312,
          "bytes_transferred": 69852332032
        },
        {
          "bandwidth_mbps": 18626.249704747584,
          "retransmits": 0,
          "duration_sec": 30.001448,
          "bytes_transferred": 69851807744
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18626.42489675546,
        "bandwidth_mbps_min": 18626.249704747584,
        "bandwidth_mbps_max": 18626.55104144595,
        "bandwidth_mbps_stddev": 0.1565,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6725.453581609868,
          "retransmits": 4668,
          "duration_sec": 30.001439,
          "bytes_transferred": 25221660672
        },
        {
          "bandwidth_mbps": 6854.458793566921,
          "retransmits": 5173,
          "duration_sec": 30.001432,
          "bytes_transferred": 25705447424
        },
        {
          "bandwidth_mbps": 6824.995441850757,
          "retransmits": 3063,
          "duration_sec": 30.001431,
          "bytes_transferred": 25594953728
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6801.635939009182,
        "bandwidth_mbps_min": 6725.453581609868,
        "bandwidth_mbps_max": 6854.458793566921,
        "bandwidth_mbps_stddev": 67.6006,
        "retransmits_avg": 4301.333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 63.483942964310025,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.116",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.116",
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
      "target_ip": "100.120.61.29",
      "hops": [
        {
          "hop": 1,
          "host": "100.120.61.29",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.300,
          "best_ms": 0.300,
          "worst_ms": 1.100,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c6i/results/c6i.12xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6i",
    "instance_type": "c6i.16xlarge",
    "vcpus": 64,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 24846.2250617989,
          "retransmits": 0,
          "duration_sec": 30.001342,
          "bytes_transferred": 93177511936
        },
        {
          "bandwidth_mbps": 24845.58968725135,
          "retransmits": 0,
          "duration_sec": 30.001856,
          "bytes_transferred": 93176725504
        },
        {
          "bandwidth_mbps": 24845.59612833918,
          "retransmits": 0,
          "duration_sec": 30.001595,
          "bytes_transferred": 93175939072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24845.803625796474,
        "bandwidth_mbps_min": 24845.58968725135,
        "bandwidth_mbps_max": 24846.2250617989,
        "bandwidth_mbps_stddev": 0.3650,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6882.586372117832,
          "retransmits": 2798,
          "duration_sec": 30.001771,
          "bytes_transferred": 25811222528
        },
        {
          "bandwidth_mbps": 6849.952714604373,
          "retransmits": 3652,
          "duration_sec": 30.002033,
          "bytes_transferred": 25689063424
        },
        {
          "bandwidth_mbps": 6818.4468050661635,
          "retransmits": 3024,
          "duration_sec": 30.001795,
          "bytes_transferred": 25570705408
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6850.328630596123,
        "bandwidth_mbps_min": 6818.4468050661635,
        "bandwidth_mbps_max": 6882.586372117832,
        "bandwidth_mbps_stddev": 32.0714,
        "retransmits_avg": 3158
      }
    },
    "overhead": {
      "bandwidth_pct": 72.42862926162839,
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
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.800,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.123.191.67",
      "hops": [
        {
          "hop": 1,
          "host": "100.123.191.67",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.200,
          "avg_ms": 1.100,
          "best_ms": 0.600,
          "worst_ms": 2.400,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c6i/results/c6i.16xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6i",
    "instance_type": "c6i.24xlarge",
    "vcpus": 96,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37306.44113350994,
          "retransmits": 0,
          "duration_sec": 30.001466,
          "bytes_transferred": 139905990656
        },
        {
          "bandwidth_mbps": 37150.30725113795,
          "retransmits": 0,
          "duration_sec": 30.00136,
          "bytes_transferred": 139319967744
        },
        {
          "bandwidth_mbps": 37053.156206948974,
          "retransmits": 0,
          "duration_sec": 30.001463,
          "bytes_transferred": 138956111872
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37169.968197198956,
        "bandwidth_mbps_min": 37053.156206948974,
        "bandwidth_mbps_max": 37306.44113350994,
        "bandwidth_mbps_stddev": 127.7820,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6311.570162969302,
          "retransmits": 2772,
          "duration_sec": 30.001417,
          "bytes_transferred": 23669506048
        },
        {
          "bandwidth_mbps": 6643.6358401461475,
          "retransmits": 4585,
          "duration_sec": 30.001429,
          "bytes_transferred": 24914821120
        },
        {
          "bandwidth_mbps": 6018.475718723148,
          "retransmits": 5913,
          "duration_sec": 30.001573,
          "bytes_transferred": 22570467328
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6324.5605739462,
        "bandwidth_mbps_min": 6018.475718723148,
        "bandwidth_mbps_max": 6643.6358401461475,
        "bandwidth_mbps_stddev": 312.7824,
        "retransmits_avg": 4423.333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 82.98475656370671,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.152",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.152",
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
      "target_ip": "100.74.137.121",
      "hops": [
        {
          "hop": 1,
          "host": "100.74.137.121",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.300,
          "best_ms": 0.200,
          "worst_ms": 0.500,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c6i/results/c6i.24xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6i",
    "instance_type": "c6i.2xlarge",
    "vcpus": 8,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.16106114789,
          "retransmits": 0,
          "duration_sec": 30.001624,
          "bytes_transferred": 46548123648
        },
        {
          "bandwidth_mbps": 12412.927710222923,
          "retransmits": 0,
          "duration_sec": 30.001545,
          "bytes_transferred": 46550876160
        },
        {
          "bandwidth_mbps": 12412.1281790826,
          "retransmits": 0,
          "duration_sec": 30.001619,
          "bytes_transferred": 46547992576
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.405650151137,
        "bandwidth_mbps_min": 12412.1281790826,
        "bandwidth_mbps_max": 12412.927710222923,
        "bandwidth_mbps_stddev": 0.4524,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4886.711574132172,
          "retransmits": 6805,
          "duration_sec": 30.001515,
          "bytes_transferred": 18326093824
        },
        {
          "bandwidth_mbps": 4872.91421424195,
          "retransmits": 2537,
          "duration_sec": 30.000819,
          "bytes_transferred": 18273927168
        },
        {
          "bandwidth_mbps": 4913.365282129645,
          "retransmits": 4366,
          "duration_sec": 30.001172,
          "bytes_transferred": 18425839616
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4890.997023501255,
        "bandwidth_mbps_min": 4872.91421424195,
        "bandwidth_mbps_max": 4913.365282129645,
        "bandwidth_mbps_stddev": 20.5632,
        "retransmits_avg": 4569.333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 60.59589767402017,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.143",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.143",
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
      "target_ip": "100.95.112.80",
      "hops": [
        {
          "hop": 1,
          "host": "100.95.112.80",
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
    "source": "aws/c6i/results/c6i.2xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6i",
    "instance_type": "c6i.32xlarge",
    "vcpus": 128,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37036.55280790116,
          "retransmits": 0,
          "duration_sec": 30.0007,
          "bytes_transferred": 138890313728
        },
        {
          "bandwidth_mbps": 36551.7803989163,
          "retransmits": 1,
          "duration_sec": 30.001382,
          "bytes_transferred": 137075490816
        },
        {
          "bandwidth_mbps": 36831.41231776205,
          "retransmits": 0,
          "duration_sec": 30.001846,
          "bytes_transferred": 138126295040
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 36806.5818415265,
        "bandwidth_mbps_min": 36551.7803989163,
        "bandwidth_mbps_max": 37036.55280790116,
        "bandwidth_mbps_stddev": 243.3382,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5934.3571737337725,
          "retransmits": 9595,
          "duration_sec": 30.001887,
          "bytes_transferred": 22255239168
        },
        {
          "bandwidth_mbps": 5766.661366445847,
          "retransmits": 10630,
          "duration_sec": 30.002272,
          "bytes_transferred": 21626617856
        },
        {
          "bandwidth_mbps": 5957.919655254074,
          "retransmits": 8467,
          "duration_sec": 30.002385,
          "bytes_transferred": 22343974912
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5886.312731811231,
        "bandwidth_mbps_min": 5766.661366445847,
        "bandwidth_mbps_max": 5957.919655254074,
        "bandwidth_mbps_stddev": 104.2887,
        "retransmits_avg": 9564
      }
    },
    "overhead": {
      "bandwidth_pct": 84.00744530650744,
      "retransmits_pct": 2869100
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.32",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.32",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.74.80.90",
      "hops": [
        {
          "hop": 1,
          "host": "100.74.80.90",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.400,
          "avg_ms": 1.200,
          "best_ms": 0.800,
          "worst_ms": 2.000,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c6i/results/c6i.32xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6i",
    "instance_type": "c6i.4xlarge",
    "vcpus": 16,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.542029884693,
          "retransmits": 0,
          "duration_sec": 30.001379,
          "bytes_transferred": 46549172224
        },
        {
          "bandwidth_mbps": 12412.265102991501,
          "retransmits": 0,
          "duration_sec": 30.001457,
          "bytes_transferred": 46548254720
        },
        {
          "bandwidth_mbps": 12412.070705453276,
          "retransmits": 0,
          "duration_sec": 30.00142,
          "bytes_transferred": 46547468288
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.29261277649,
        "bandwidth_mbps_min": 12412.070705453276,
        "bandwidth_mbps_max": 12412.542029884693,
        "bandwidth_mbps_stddev": 0.2369,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6445.969126897569,
          "retransmits": 10290,
          "duration_sec": 30.00152,
          "bytes_transferred": 24173608960
        },
        {
          "bandwidth_mbps": 6283.359564916913,
          "retransmits": 7958,
          "duration_sec": 30.001442,
          "bytes_transferred": 23563730944
        },
        {
          "bandwidth_mbps": 6532.929890283837,
          "retransmits": 10358,
          "duration_sec": 30.001505,
          "bytes_transferred": 24499716096
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6420.752860699439,
        "bandwidth_mbps_min": 6283.359564916913,
        "bandwidth_mbps_max": 6532.929890283837,
        "bandwidth_mbps_stddev": 126.6816,
        "retransmits_avg": 9535.333333333334
      }
    },
    "overhead": {
      "bandwidth_pct": 48.27101599191844,
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
      "target_ip": "100.73.69.49",
      "hops": [
        {
          "hop": 1,
          "host": "100.73.69.49",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c6i/results/c6i.4xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6i",
    "instance_type": "c6i.8xlarge",
    "vcpus": 32,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.565396282915,
          "retransmits": 0,
          "duration_sec": 30.001407,
          "bytes_transferred": 46549303296
        },
        {
          "bandwidth_mbps": 12412.01817969828,
          "retransmits": 0,
          "duration_sec": 30.001378,
          "bytes_transferred": 46547206144
        },
        {
          "bandwidth_mbps": 12412.88947043243,
          "retransmits": 0,
          "duration_sec": 30.001384,
          "bytes_transferred": 46550482944
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.491015471207,
        "bandwidth_mbps_min": 12412.01817969828,
        "bandwidth_mbps_max": 12412.88947043243,
        "bandwidth_mbps_stddev": 0.4404,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6717.870589181523,
          "retransmits": 12357,
          "duration_sec": 30.001433,
          "bytes_transferred": 25193218048
        },
        {
          "bandwidth_mbps": 6690.765159467275,
          "retransmits": 8184,
          "duration_sec": 30.001516,
          "bytes_transferred": 25091637248
        },
        {
          "bandwidth_mbps": 6591.49024286314,
          "retransmits": 3854,
          "duration_sec": 30.001424,
          "bytes_transferred": 24719261696
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6666.708663837312,
        "bandwidth_mbps_min": 6591.49024286314,
        "bandwidth_mbps_max": 6717.870589181523,
        "bandwidth_mbps_stddev": 66.5360,
        "retransmits_avg": 8131.666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 46.29032435529841,
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
          "last_ms": 0.200,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.100.172.40",
      "hops": [
        {
          "hop": 1,
          "host": "100.100.172.40",
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
    "source": "aws/c6i/results/c6i.8xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6i",
    "instance_type": "c6i.large",
    "vcpus": 2,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.43194144867,
          "retransmits": 0,
          "duration_sec": 30.001983,
          "bytes_transferred": 46549696512
        },
        {
          "bandwidth_mbps": 12412.21294009807,
          "retransmits": 0,
          "duration_sec": 30.001921,
          "bytes_transferred": 46548779008
        },
        {
          "bandwidth_mbps": 12412.451367929016,
          "retransmits": 0,
          "duration_sec": 30.002105,
          "bytes_transferred": 46549958656
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.365416491919,
        "bandwidth_mbps_min": 12412.21294009807,
        "bandwidth_mbps_max": 12412.451367929016,
        "bandwidth_mbps_stddev": 0.1324,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2702.188025138904,
          "retransmits": 2799,
          "duration_sec": 30.001467,
          "bytes_transferred": 10133700608
        },
        {
          "bandwidth_mbps": 2676.0511416202103,
          "retransmits": 4339,
          "duration_sec": 30.001396,
          "bytes_transferred": 10035658752
        },
        {
          "bandwidth_mbps": 2054.777723005882,
          "retransmits": 4068,
          "duration_sec": 30.001193,
          "bytes_transferred": 7705722880
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2477.6722965883323,
        "bandwidth_mbps_min": 2054.777723005882,
        "bandwidth_mbps_max": 2702.188025138904,
        "bandwidth_mbps_stddev": 366.4705,
        "retransmits_avg": 3735.3333333333335
      }
    },
    "overhead": {
      "bandwidth_pct": 80.0386774522741,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.41",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.41",
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
      "target_ip": "100.116.20.6",
      "hops": [
        {
          "hop": 1,
          "host": "100.116.20.6",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.500,
          "best_ms": 0.400,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c6i/results/c6i.large.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6i",
    "instance_type": "c6i.metal",
    "vcpus": 128,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 38122.532727402,
          "retransmits": 0,
          "duration_sec": 30.001419,
          "bytes_transferred": 142966259712
        },
        {
          "bandwidth_mbps": 38122.41111818914,
          "retransmits": 0,
          "duration_sec": 30.000497,
          "bytes_transferred": 142961410048
        },
        {
          "bandwidth_mbps": 38122.58419728729,
          "retransmits": 0,
          "duration_sec": 30.001406,
          "bytes_transferred": 142966390784
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 38122.509347626146,
        "bandwidth_mbps_min": 38122.41111818914,
        "bandwidth_mbps_max": 38122.58419728729,
        "bandwidth_mbps_stddev": 0.0889,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5770.784697205468,
          "retransmits": 7608,
          "duration_sec": 30.001004,
          "bytes_transferred": 21641166848
        },
        {
          "bandwidth_mbps": 5956.857037643623,
          "retransmits": 3481,
          "duration_sec": 30.001576,
          "bytes_transferred": 22339387392
        },
        {
          "bandwidth_mbps": 6296.136047525066,
          "retransmits": 7293,
          "duration_sec": 30.001516,
          "bytes_transferred": 23611703296
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6007.925927458052,
        "bandwidth_mbps_min": 5770.784697205468,
        "bandwidth_mbps_max": 6296.136047525066,
        "bandwidth_mbps_stddev": 266.3729,
        "retransmits_avg": 6127.333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 84.24047621662618,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.240",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.240",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.300,
          "best_ms": 0.300,
          "worst_ms": 0.400,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.67.235.61",
      "hops": [
        {
          "hop": 1,
          "host": "100.67.235.61",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.900,
          "avg_ms": 0.900,
          "best_ms": 0.500,
          "worst_ms": 1.300,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c6i/results/c6i.metal.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6i",
    "instance_type": "c6i.xlarge",
    "vcpus": 4,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.543844357057,
          "retransmits": 0,
          "duration_sec": 30.001797,
          "bytes_transferred": 46549827584
        },
        {
          "bandwidth_mbps": 12411.920543741413,
          "retransmits": 0,
          "duration_sec": 30.001614,
          "bytes_transferred": 46547206144
        },
        {
          "bandwidth_mbps": 12412.269636551231,
          "retransmits": 0,
          "duration_sec": 30.001615,
          "bytes_transferred": 46548516864
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.244674883235,
        "bandwidth_mbps_min": 12411.920543741413,
        "bandwidth_mbps_max": 12412.543844357057,
        "bandwidth_mbps_stddev": 0.3124,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4276.63485693092,
          "retransmits": 3500,
          "duration_sec": 30.000857,
          "bytes_transferred": 16037838848
        },
        {
          "bandwidth_mbps": 4258.5992651150655,
          "retransmits": 3685,
          "duration_sec": 30.000615,
          "bytes_transferred": 15970074624
        },
        {
          "bandwidth_mbps": 4272.56550274415,
          "retransmits": 3012,
          "duration_sec": 30.001453,
          "bytes_transferred": 16022896640
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4269.266541596712,
        "bandwidth_mbps_min": 4258.5992651150655,
        "bandwidth_mbps_max": 4276.63485693092,
        "bandwidth_mbps_stddev": 9.4595,
        "retransmits_avg": 3399
      }
    },
    "overhead": {
      "bandwidth_pct": 65.60439587340898,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.170",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.170",
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
      "target_ip": "100.114.238.30",
      "hops": [
        {
          "hop": 1,
          "host": "100.114.238.30",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.300,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.600,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c6i/results/c6i.xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.2xlarge",
    "vcpus": 8,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37974.86859400197,
          "retransmits": 0,
          "duration_sec": 30.001941,
          "bytes_transferred": 142414970880
        },
        {
          "bandwidth_mbps": 38011.34427692821,
          "retransmits": 0,
          "duration_sec": 30.001537,
          "bytes_transferred": 142549843968
        },
        {
          "bandwidth_mbps": 35561.3954664554,
          "retransmits": 1,
          "duration_sec": 30.00169,
          "bytes_transferred": 133362745344
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37182.53611246186,
        "bandwidth_mbps_min": 35561.3954664554,
        "bandwidth_mbps_max": 38011.34427692821,
        "bandwidth_mbps_stddev": 1404.0674,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4444.528697310788,
          "retransmits": 796,
          "duration_sec": 30.000947,
          "bytes_transferred": 16667508736
        },
        {
          "bandwidth_mbps": 4472.91948212845,
          "retransmits": 1348,
          "duration_sec": 30.000644,
          "bytes_transferred": 16773808128
        },
        {
          "bandwidth_mbps": 4409.17722294614,
          "retransmits": 8113,
          "duration_sec": 30.001053,
          "bytes_transferred": 16534994944
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4442.208467461793,
        "bandwidth_mbps_min": 4409.17722294614,
        "bandwidth_mbps_max": 4472.91948212845,
        "bandwidth_mbps_stddev": 31.9344,
        "retransmits_avg": 3419
      }
    },
    "overhead": {
      "bandwidth_pct": 88.05297074404515,
      "retransmits_pct": 1025600
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
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.110.216.50",
      "hops": [
        {
          "hop": 1,
          "host": "100.110.216.50",
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
    "source": "aws/c6in/results/c6in.2xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c6in",
    "instance_type": "c6in.4xlarge",
    "vcpus": 16,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 37559.37639831773,
          "retransmits": 0,
          "duration_sec": 30.001497,
          "bytes_transferred": 140854689792
        },
        {
          "bandwidth_mbps": 38110.5776744585,
          "retransmits": 0,
          "duration_sec": 30.001503,
          "bytes_transferred": 142921826304
        },
        {
          "bandwidth_mbps": 38122.404360061744,
          "retransmits": 0,
          "duration_sec": 30.00141,
          "bytes_transferred": 142965735424
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37930.78614427932,
        "bandwidth_mbps_min": 37559.37639831773,
        "bandwidth_mbps_max": 38122.404360061744,
        "bandwidth_mbps_stddev": 321.7046,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6400.011220768929,
          "retransmits": 8116,
          "duration_sec": 30.001509,
          "bytes_transferred": 24001249280
        },
        {
          "bandwidth_mbps": 6466.884124845554,
          "retransmits": 9259,
          "duration_sec": 30.001453,
          "bytes_transferred": 24251990016
        },
        {
          "bandwidth_mbps": 6499.381474217027,
          "retransmits": 10383,
          "duration_sec": 30.001485,
          "bytes_transferred": 24373886976
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6455.425606610504,
        "bandwidth_mbps_min": 6400.011220768929,
        "bandwidth_mbps_max": 6499.381474217027,
        "bandwidth_mbps_stddev": 50.6664,
        "retransmits_avg": 9252.666666666666
      }
    },
    "overhead": {
      "bandwidth_pct": 82.98103924855218,
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
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.70.16.110",
      "hops": [
        {
          "hop": 1,
          "host": "100.70.16.110",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
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
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 36210.82307472088,
          "retransmits": 3,
          "duration_sec": 30.001507,
          "bytes_transferred": 135797407744
        },
        {
          "bandwidth_mbps": 38122.51428170685,
          "retransmits": 0,
          "duration_sec": 30.001351,
          "bytes_transferred": 142965866496
        },
        {
          "bandwidth_mbps": 38122.74241931134,
          "retransmits": 0,
          "duration_sec": 30.001364,
          "bytes_transferred": 142966784000
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37485.359925246354,
        "bandwidth_mbps_min": 36210.82307472088,
        "bandwidth_mbps_max": 38122.74241931134,
        "bandwidth_mbps_stddev": 1103.7813,
        "retransmits_avg": 1
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6890.86840752347,
          "retransmits": 5894,
          "duration_sec": 30.001472,
          "bytes_transferred": 25842024448
        },
        {
          "bandwidth_mbps": 6909.733327880274,
          "retransmits": 2725,
          "duration_sec": 30.001509,
          "bytes_transferred": 25912803328
        },
        {
          "bandwidth_mbps": 6862.816854047297,
          "retransmits": 4808,
          "duration_sec": 30.001411,
          "bytes_transferred": 25736773632
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6887.806196483681,
        "bandwidth_mbps_min": 6862.816854047297,
        "bandwidth_mbps_max": 6909.733327880274,
        "bandwidth_mbps_stddev": 23.6077,
        "retransmits_avg": 4475.666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 81.6253433067752,
      "retransmits_pct": 447466.6666666667
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.227",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.227",
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
      "target_ip": "100.89.218.70",
      "hops": [
        {
          "hop": 1,
          "host": "100.89.218.70",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 1.600,
          "stdev_ms": 0.200
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
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 24846.502705145973,
          "retransmits": 2,
          "duration_sec": 30.001893,
          "bytes_transferred": 93180264448
        },
        {
          "bandwidth_mbps": 24845.60602034269,
          "retransmits": 0,
          "duration_sec": 30.00095,
          "bytes_transferred": 93173972992
        },
        {
          "bandwidth_mbps": 24845.77673489936,
          "retransmits": 2,
          "duration_sec": 30.002432,
          "bytes_transferred": 93179215872
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24845.961820129345,
        "bandwidth_mbps_min": 24845.60602034269,
        "bandwidth_mbps_max": 24846.502705145973,
        "bandwidth_mbps_stddev": 0.4761,
        "retransmits_avg": 1.3333333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3129.949911069384,
          "retransmits": 64,
          "duration_sec": 30.001479,
          "bytes_transferred": 11737890816
        },
        {
          "bandwidth_mbps": 3085.8231659299404,
          "retransmits": 72,
          "duration_sec": 30.001662,
          "bytes_transferred": 11572477952
        },
        {
          "bandwidth_mbps": 2228.4037877769742,
          "retransmits": 8594,
          "duration_sec": 30.001344,
          "bytes_transferred": 8356888576
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2814.7256215920993,
        "bandwidth_mbps_min": 2228.4037877769742,
        "bandwidth_mbps_max": 3129.949911069384,
        "bandwidth_mbps_stddev": 508.2487,
        "retransmits_avg": 2910
      }
    },
    "overhead": {
      "bandwidth_pct": 88.67129539210792,
      "retransmits_pct": 218150
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.6",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.6",
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
      "target_ip": "100.69.132.114",
      "hops": [
        {
          "hop": 1,
          "host": "100.69.132.114",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.600,
          "best_ms": 0.500,
          "worst_ms": 1.700,
          "stdev_ms": 0.200
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
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 29827.28678417982,
          "retransmits": 0,
          "duration_sec": 30.001634,
          "bytes_transferred": 111858417664
        },
        {
          "bandwidth_mbps": 29827.606157192848,
          "retransmits": 0,
          "duration_sec": 30.001594,
          "bytes_transferred": 111859466240
        },
        {
          "bandwidth_mbps": 29827.574198668037,
          "retransmits": 0,
          "duration_sec": 30.002048,
          "bytes_transferred": 111861039104
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 29827.489046680235,
        "bandwidth_mbps_min": 29827.28678417982,
        "bandwidth_mbps_max": 29827.606157192848,
        "bandwidth_mbps_stddev": 0.1759,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4442.88805338154,
          "retransmits": 5933,
          "duration_sec": 30.000933,
          "bytes_transferred": 16661348352
        },
        {
          "bandwidth_mbps": 4400.753518009499,
          "retransmits": 2811,
          "duration_sec": 30.001056,
          "bytes_transferred": 16503406592
        },
        {
          "bandwidth_mbps": 4372.838388758464,
          "retransmits": 7335,
          "duration_sec": 30.000741,
          "bytes_transferred": 16398548992
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4405.493320049834,
        "bandwidth_mbps_min": 4372.838388758464,
        "bandwidth_mbps_max": 4442.88805338154,
        "bandwidth_mbps_stddev": 35.2645,
        "retransmits_avg": 5359.666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 85.23008989072058,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.245",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.245",
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
      "target_ip": "100.115.83.85",
      "hops": [
        {
          "hop": 1,
          "host": "100.115.83.85",
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
    "source": "aws/c6in/results/c6in.xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7g",
    "instance_type": "c7g.large",
    "vcpus": 2,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.831546557434,
          "retransmits": 0,
          "duration_sec": 30.001524,
          "bytes_transferred": 46550482944
        },
        {
          "bandwidth_mbps": 12409.126559578855,
          "retransmits": 199,
          "duration_sec": 30.001609,
          "bytes_transferred": 46536720384
        },
        {
          "bandwidth_mbps": 12408.728453462647,
          "retransmits": 618,
          "duration_sec": 30.001642,
          "bytes_transferred": 46535278592
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12410.228853199646,
        "bandwidth_mbps_min": 12408.728453462647,
        "bandwidth_mbps_max": 12412.831546557434,
        "bandwidth_mbps_stddev": 2.2628,
        "retransmits_avg": 272.3333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2456.911294933798,
          "retransmits": 106,
          "duration_sec": 30.002221,
          "bytes_transferred": 9214099456
        },
        {
          "bandwidth_mbps": 2463.3814140525574,
          "retransmits": 2085,
          "duration_sec": 30.001742,
          "bytes_transferred": 9238216704
        },
        {
          "bandwidth_mbps": 2454.176649138304,
          "retransmits": 1311,
          "duration_sec": 30.001471,
          "bytes_transferred": 9203613696
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2458.1564527082196,
        "bandwidth_mbps_min": 2454.176649138304,
        "bandwidth_mbps_max": 2463.3814140525574,
        "bandwidth_mbps_stddev": 4.7270,
        "retransmits_avg": 1167.3333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 80.19249699755174,
      "retransmits_pct": 328.6413708690331
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
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.122.85.27",
      "hops": [
        {
          "hop": 1,
          "host": "100.122.85.27",
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
    "source": "aws/c7g/results/c7g.large.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7g",
    "instance_type": "c7g.medium",
    "vcpus": 1,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.167845442456,
          "retransmits": 0,
          "duration_sec": 30.00203,
          "bytes_transferred": 46548779008
        },
        {
          "bandwidth_mbps": 12412.460469761383,
          "retransmits": 0,
          "duration_sec": 30.002083,
          "bytes_transferred": 46549958656
        },
        {
          "bandwidth_mbps": 12412.436078653895,
          "retransmits": 2935,
          "duration_sec": 30.001973,
          "bytes_transferred": 46549696512
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.354797952577,
        "bandwidth_mbps_min": 12412.167845442456,
        "bandwidth_mbps_max": 12412.460469761383,
        "bandwidth_mbps_stddev": 0.1624,
        "retransmits_avg": 978.3333333333334
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1223.277958863617,
          "retransmits": 855,
          "duration_sec": 30.002346,
          "bytes_transferred": 4587651072
        },
        {
          "bandwidth_mbps": 1223.1083748797805,
          "retransmits": 126,
          "duration_sec": 30.001362,
          "bytes_transferred": 4586864640
        },
        {
          "bandwidth_mbps": 1199.9947597527841,
          "retransmits": 99,
          "duration_sec": 30.001638,
          "bytes_transferred": 4500226048
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1215.4603644987274,
        "bandwidth_mbps_min": 1199.9947597527841,
        "bandwidth_mbps_max": 1223.277958863617,
        "bandwidth_mbps_stddev": 13.3939,
        "retransmits_avg": 360
      }
    },
    "overhead": {
      "bandwidth_pct": 90.20765693308076,
      "retransmits_pct": -63.202725724020446
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.153",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.153",
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
      "target_ip": "100.113.227.35",
      "hops": [
        {
          "hop": 1,
          "host": "100.113.227.35",
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
    "source": "aws/c7g/results/c7g.medium.json"
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
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12411.993388509089,
          "retransmits": 0,
          "duration_sec": 30.0011,
          "bytes_transferred": 46546681856
        },
        {
          "bandwidth_mbps": 12412.780954802467,
          "retransmits": 0,
          "duration_sec": 30.000886,
          "bytes_transferred": 46549303296
        },
        {
          "bandwidth_mbps": 12412.62790905265,
          "retransmits": 0,
          "duration_sec": 30.000918,
          "bytes_transferred": 46548779008
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.467417454734,
        "bandwidth_mbps_min": 12411.993388509089,
        "bandwidth_mbps_max": 12412.780954802467,
        "bandwidth_mbps_stddev": 0.4176,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5714.19405733074,
          "retransmits": 6291,
          "duration_sec": 30.00066,
          "bytes_transferred": 21428699136
        },
        {
          "bandwidth_mbps": 5769.297460890646,
          "retransmits": 7326,
          "duration_sec": 30.000559,
          "bytes_transferred": 21635268608
        },
        {
          "bandwidth_mbps": 5780.59620370017,
          "retransmits": 5363,
          "duration_sec": 30.001055,
          "bytes_transferred": 21677998080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5754.695907307185,
        "bandwidth_mbps_min": 5714.19405733074,
        "bandwidth_mbps_max": 5780.59620370017,
        "bandwidth_mbps_stddev": 35.5277,
        "retransmits_avg": 6326.666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 53.63777632789769,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.74",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.74",
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
    "tailscale_mtr": {
      "target_ip": "100.66.193.84",
      "hops": [
        {
          "hop": 1,
          "host": "100.66.193.84",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.300,
          "avg_ms": 1.100,
          "best_ms": 0.600,
          "worst_ms": 1.700,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c7i/results/c7i.2xlarge.json"
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
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9422.434791147449,
          "retransmits": 18145,
          "duration_sec": 30.001333,
          "bytes_transferred": 35335700480
        },
        {
          "bandwidth_mbps": 9416.919519822735,
          "retransmits": 16115,
          "duration_sec": 30.000754,
          "bytes_transferred": 35314335744
        },
        {
          "bandwidth_mbps": 9422.05230562615,
          "retransmits": 16310,
          "duration_sec": 30.001438,
          "bytes_transferred": 35334389760
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9420.468872198779,
        "bandwidth_mbps_min": 9416.919519822735,
        "bandwidth_mbps_max": 9422.434791147449,
        "bandwidth_mbps_stddev": 3.0798,
        "retransmits_avg": 16856.666666666668
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3302.911387818951,
          "retransmits": 5325,
          "duration_sec": 30.002523,
          "bytes_transferred": 12386959360
        },
        {
          "bandwidth_mbps": 3288.6027099155244,
          "retransmits": 7656,
          "duration_sec": 30.001378,
          "bytes_transferred": 12332826624
        },
        {
          "bandwidth_mbps": 3252.2243402333315,
          "retransmits": 4797,
          "duration_sec": 30.000682,
          "bytes_transferred": 12196118528
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3281.2461459892693,
        "bandwidth_mbps_min": 3252.2243402333315,
        "bandwidth_mbps_max": 3302.911387818951,
        "bandwidth_mbps_stddev": 26.1320,
        "retransmits_avg": 5926
      }
    },
    "overhead": {
      "bandwidth_pct": 65.16897204901638,
      "retransmits_pct": -64.84476962626063
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.198",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.198",
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
      "target_ip": "100.125.26.97",
      "hops": [
        {
          "hop": 1,
          "host": "100.125.26.97",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.800,
          "avg_ms": 0.700,
          "best_ms": 0.300,
          "worst_ms": 1.000,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c7i/results/c7i.large.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "c7i",
    "instance_type": "c7i.xlarge",
    "vcpus": 4,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.181962301936,
          "retransmits": 0,
          "duration_sec": 30.001489,
          "bytes_transferred": 46547992576
        },
        {
          "bandwidth_mbps": 12412.588820185829,
          "retransmits": 0,
          "duration_sec": 30.000928,
          "bytes_transferred": 46548647936
        },
        {
          "bandwidth_mbps": 12412.153085689893,
          "retransmits": 0,
          "duration_sec": 30.000714,
          "bytes_transferred": 46546681856
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.307956059221,
        "bandwidth_mbps_min": 12412.153085689893,
        "bandwidth_mbps_max": 12412.588820185829,
        "bandwidth_mbps_stddev": 0.2437,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4508.854123262002,
          "retransmits": 4717,
          "duration_sec": 30.000616,
          "bytes_transferred": 16908550144
        },
        {
          "bandwidth_mbps": 4529.558429378946,
          "retransmits": 4109,
          "duration_sec": 30.001457,
          "bytes_transferred": 16986669056
        },
        {
          "bandwidth_mbps": 4469.947736366488,
          "retransmits": 3959,
          "duration_sec": 30.001588,
          "bytes_transferred": 16763191296
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4502.786763002478,
        "bandwidth_mbps_min": 4469.947736366488,
        "bandwidth_mbps_max": 4529.558429378946,
        "bandwidth_mbps_stddev": 30.2650,
        "retransmits_avg": 4261.666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 63.723211034218764,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.82",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.82",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.900,
          "avg_ms": 0.500,
          "best_ms": 0.300,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.117.101.12",
      "hops": [
        {
          "hop": 1,
          "host": "100.117.101.12",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.100,
          "avg_ms": 1.200,
          "best_ms": 0.600,
          "worst_ms": 1.800,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/c7i/results/c7i.xlarge.json"
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
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 29791.37247188777,
          "retransmits": 0,
          "duration_sec": 30.001091,
          "bytes_transferred": 111721709568
        },
        {
          "bandwidth_mbps": 29791.52136704504,
          "retransmits": 0,
          "duration_sec": 30.001645,
          "bytes_transferred": 111724331008
        },
        {
          "bandwidth_mbps": 29791.40679473709,
          "retransmits": 0,
          "duration_sec": 30.001514,
          "bytes_transferred": 111723413504
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 29791.433544556636,
        "bandwidth_mbps_min": 29791.37247188777,
        "bandwidth_mbps_max": 29791.52136704504,
        "bandwidth_mbps_stddev": 0.0780,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3545.360470193527,
          "retransmits": 41,
          "duration_sec": 30.001604,
          "bytes_transferred": 13295812608
        },
        {
          "bandwidth_mbps": 3517.9429674450234,
          "retransmits": 92,
          "duration_sec": 30.001742,
          "bytes_transferred": 13193052160
        },
        {
          "bandwidth_mbps": 3549.9956559818115,
          "retransmits": 3016,
          "duration_sec": 30.001716,
          "bytes_transferred": 13313245184
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3537.766364540121,
        "bandwidth_mbps_min": 3517.9429674450234,
        "bandwidth_mbps_max": 3549.9956559818115,
        "bandwidth_mbps_stddev": 17.3233,
        "retransmits_avg": 1049.6666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 88.12488711142761,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.197",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.197",
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
      "target_ip": "100.65.155.81",
      "hops": [
        {
          "hop": 1,
          "host": "100.65.155.81",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.400,
          "best_ms": 0.400,
          "worst_ms": 0.800,
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
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 24833.007739976983,
          "retransmits": 253,
          "duration_sec": 30.001898,
          "bytes_transferred": 93129670656
        },
        {
          "bandwidth_mbps": 24834.266684345672,
          "retransmits": 0,
          "duration_sec": 30.001686,
          "bytes_transferred": 93133733888
        },
        {
          "bandwidth_mbps": 24834.39434477671,
          "retransmits": 0,
          "duration_sec": 30.001574,
          "bytes_transferred": 93133864960
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24833.88958969979,
        "bandwidth_mbps_min": 24833.007739976983,
        "bandwidth_mbps_max": 24834.39434477671,
        "bandwidth_mbps_stddev": 0.7664,
        "retransmits_avg": 84.33333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1854.0181696756356,
          "retransmits": 297,
          "duration_sec": 30.001196,
          "bytes_transferred": 6952845312
        },
        {
          "bandwidth_mbps": 1849.1421560231126,
          "retransmits": 236,
          "duration_sec": 30.002619,
          "bytes_transferred": 6934888448
        },
        {
          "bandwidth_mbps": 1889.3443261546004,
          "retransmits": 268,
          "duration_sec": 30.000791,
          "bytes_transferred": 7085228032
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1864.1682172844496,
        "bandwidth_mbps_min": 1849.1421560231126,
        "bandwidth_mbps_max": 1889.3443261546004,
        "bandwidth_mbps_stddev": 21.9390,
        "retransmits_avg": 267
      }
    },
    "overhead": {
      "bandwidth_pct": 92.49345049010108,
      "retransmits_pct": 216.60079051383403
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.111",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.111",
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
      "target_ip": "100.70.219.64",
      "hops": [
        {
          "hop": 1,
          "host": "100.70.219.64",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.400,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/c8gn/results/c8gn.medium.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "m6i",
    "instance_type": "m6i.12xlarge",
    "vcpus": 48,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 18626.167456015824,
          "retransmits": 0,
          "duration_sec": 30.001299,
          "bytes_transferred": 69851152384
        },
        {
          "bandwidth_mbps": 18626.591507851936,
          "retransmits": 0,
          "duration_sec": 30.001573,
          "bytes_transferred": 69853380608
        },
        {
          "bandwidth_mbps": 18626.268330116927,
          "retransmits": 0,
          "duration_sec": 30.001418,
          "bytes_transferred": 69851807744
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18626.34243132823,
        "bandwidth_mbps_min": 18626.167456015824,
        "bandwidth_mbps_max": 18626.591507851936,
        "bandwidth_mbps_stddev": 0.2215,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6906.635830825788,
          "retransmits": 605,
          "duration_sec": 30.001452,
          "bytes_transferred": 25901137920
        },
        {
          "bandwidth_mbps": 6907.726905050725,
          "retransmits": 2383,
          "duration_sec": 30.001419,
          "bytes_transferred": 25905201152
        },
        {
          "bandwidth_mbps": 6702.256655181344,
          "retransmits": 4923,
          "duration_sec": 30.00061,
          "bytes_transferred": 25133973504
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6838.873130352618,
        "bandwidth_mbps_min": 6702.256655181344,
        "bandwidth_mbps_max": 6907.726905050725,
        "bandwidth_mbps_stddev": 118.3146,
        "retransmits_avg": 2637
      }
    },
    "overhead": {
      "bandwidth_pct": 63.28386447545331,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.56",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.56",
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
      "target_ip": "100.93.215.84",
      "hops": [
        {
          "hop": 1,
          "host": "100.93.215.84",
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
    "source": "aws/m6i/results/m6i.12xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "m6i",
    "instance_type": "m6i.16xlarge",
    "vcpus": 64,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 24845.885503281315,
          "retransmits": 0,
          "duration_sec": 30.001541,
          "bytes_transferred": 93176856576
        },
        {
          "bandwidth_mbps": 24845.225918333745,
          "retransmits": 0,
          "duration_sec": 30.00162,
          "bytes_transferred": 93174628352
        },
        {
          "bandwidth_mbps": 24845.334572825635,
          "retransmits": 0,
          "duration_sec": 30.001531,
          "bytes_transferred": 93174759424
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24845.4819981469,
        "bandwidth_mbps_min": 24845.225918333745,
        "bandwidth_mbps_max": 24845.885503281315,
        "bandwidth_mbps_stddev": 0.3536,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6910.262998516522,
          "retransmits": 610,
          "duration_sec": 30.001789,
          "bytes_transferred": 25915031552
        },
        {
          "bandwidth_mbps": 7037.594755560039,
          "retransmits": 574,
          "duration_sec": 30.001907,
          "bytes_transferred": 26392657920
        },
        {
          "bandwidth_mbps": 6767.294909809155,
          "retransmits": 13934,
          "duration_sec": 30.001881,
          "bytes_transferred": 25378947072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6905.050887961906,
        "bandwidth_mbps_min": 6767.294909809155,
        "bandwidth_mbps_max": 7037.594755560039,
        "bandwidth_mbps_stddev": 135.2253,
        "retransmits_avg": 5039.333333333333
      }
    },
    "overhead": {
      "bandwidth_pct": 72.20802201190173,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.131",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.131",
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
    "tailscale_mtr": {
      "target_ip": "100.89.24.112",
      "hops": [
        {
          "hop": 1,
          "host": "100.89.24.112",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.900,
          "avg_ms": 1.100,
          "best_ms": 0.600,
          "worst_ms": 1.800,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/m6i/results/m6i.16xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "m6i",
    "instance_type": "m6i.2xlarge",
    "vcpus": 8,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.527944159745,
          "retransmits": 0,
          "duration_sec": 30.001582,
          "bytes_transferred": 46549434368
        },
        {
          "bandwidth_mbps": 12412.83452500548,
          "retransmits": 0,
          "duration_sec": 30.000841,
          "bytes_transferred": 46549434368
        },
        {
          "bandwidth_mbps": 12412.425574443156,
          "retransmits": 0,
          "duration_sec": 30.001576,
          "bytes_transferred": 46549041152
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.596014536126,
        "bandwidth_mbps_min": 12412.425574443156,
        "bandwidth_mbps_max": 12412.83452500548,
        "bandwidth_mbps_stddev": 0.2128,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4729.682974461061,
          "retransmits": 6378,
          "duration_sec": 30.001482,
          "bytes_transferred": 17737187328
        },
        {
          "bandwidth_mbps": 4828.44993086514,
          "retransmits": 6775,
          "duration_sec": 30.001507,
          "bytes_transferred": 18107596800
        },
        {
          "bandwidth_mbps": 4690.840901623873,
          "retransmits": 2599,
          "duration_sec": 30.001557,
          "bytes_transferred": 17591566336
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4749.657935650025,
        "bandwidth_mbps_min": 4690.840901623873,
        "bandwidth_mbps_max": 4828.44993086514,
        "bandwidth_mbps_stddev": 70.9458,
        "retransmits_avg": 5250.666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 61.73517666982956,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.130",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.130",
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
      "target_ip": "100.94.160.23",
      "hops": [
        {
          "hop": 1,
          "host": "100.94.160.23",
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
    "source": "aws/m6i/results/m6i.2xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "m6i",
    "instance_type": "m6i.4xlarge",
    "vcpus": 16,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.036780825174,
          "retransmits": 0,
          "duration_sec": 30.001502,
          "bytes_transferred": 46547468288
        },
        {
          "bandwidth_mbps": 12412.65927517401,
          "retransmits": 0,
          "duration_sec": 30.001518,
          "bytes_transferred": 46549827584
        },
        {
          "bandwidth_mbps": 12412.53353894094,
          "retransmits": 0,
          "duration_sec": 30.001484,
          "bytes_transferred": 46549303296
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.409864980042,
        "bandwidth_mbps_min": 12412.036780825174,
        "bandwidth_mbps_max": 12412.65927517401,
        "bandwidth_mbps_stddev": 0.3292,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6327.519305550038,
          "retransmits": 8792,
          "duration_sec": 30.001528,
          "bytes_transferred": 23729405952
        },
        {
          "bandwidth_mbps": 6185.816681598183,
          "retransmits": 4867,
          "duration_sec": 30.001418,
          "bytes_transferred": 23197908992
        },
        {
          "bandwidth_mbps": 6281.7495224647955,
          "retransmits": 8961,
          "duration_sec": 30.001453,
          "bytes_transferred": 23557701632
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6265.028503204339,
        "bandwidth_mbps_min": 6185.816681598183,
        "bandwidth_mbps_max": 6327.519305550038,
        "bandwidth_mbps_stddev": 72.3160,
        "retransmits_avg": 7540
      }
    },
    "overhead": {
      "bandwidth_pct": 49.526090651580226,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.36",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.36",
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
    "tailscale_mtr": {
      "target_ip": "100.90.123.102",
      "hops": [
        {
          "hop": 1,
          "host": "100.90.123.102",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/m6i/results/m6i.4xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "m6i",
    "instance_type": "m6i.8xlarge",
    "vcpus": 32,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.53704620693,
          "retransmits": 0,
          "duration_sec": 30.00156,
          "bytes_transferred": 46549434368
        },
        {
          "bandwidth_mbps": 12412.892345747781,
          "retransmits": 0,
          "duration_sec": 30.001546,
          "bytes_transferred": 46550745088
        },
        {
          "bandwidth_mbps": 12412.719877595275,
          "retransmits": 0,
          "duration_sec": 30.001456,
          "bytes_transferred": 46549958656
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.71642318333,
        "bandwidth_mbps_min": 12412.53704620693,
        "bandwidth_mbps_max": 12412.892345747781,
        "bandwidth_mbps_stddev": 0.1777,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6795.186656414705,
          "retransmits": 6536,
          "duration_sec": 30.001412,
          "bytes_transferred": 25483149312
        },
        {
          "bandwidth_mbps": 6702.9031295165505,
          "retransmits": 10853,
          "duration_sec": 30.001471,
          "bytes_transferred": 25137119232
        },
        {
          "bandwidth_mbps": 6793.3664930037985,
          "retransmits": 7271,
          "duration_sec": 30.001424,
          "bytes_transferred": 25476333568
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6763.818759645018,
        "bandwidth_mbps_min": 6702.9031295165505,
        "bandwidth_mbps_max": 6795.186656414705,
        "bandwidth_mbps_stddev": 52.7623,
        "retransmits_avg": 8220
      }
    },
    "overhead": {
      "bandwidth_pct": 45.50895606531235,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.111",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.111",
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
      "target_ip": "100.92.54.47",
      "hops": [
        {
          "hop": 1,
          "host": "100.92.54.47",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 0.900,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/m6i/results/m6i.8xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "m6i",
    "instance_type": "m6i.large",
    "vcpus": 2,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.377960170628,
          "retransmits": 0,
          "duration_sec": 30.002029,
          "bytes_transferred": 46549565440
        },
        {
          "bandwidth_mbps": 12412.30064807308,
          "retransmits": 0,
          "duration_sec": 30.001709,
          "bytes_transferred": 46548779008
        },
        {
          "bandwidth_mbps": 12412.38317670721,
          "retransmits": 0,
          "duration_sec": 30.001594,
          "bytes_transferred": 46548910080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.353928316974,
        "bandwidth_mbps_min": 12412.30064807308,
        "bandwidth_mbps_max": 12412.38317670721,
        "bandwidth_mbps_stddev": 0.0462,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2657.147483602567,
          "retransmits": 4984,
          "duration_sec": 30.001342,
          "bytes_transferred": 9964748800
        },
        {
          "bandwidth_mbps": 2705.519535708785,
          "retransmits": 3365,
          "duration_sec": 30.001343,
          "bytes_transferred": 10146152448
        },
        {
          "bandwidth_mbps": 2739.038701550898,
          "retransmits": 4364,
          "duration_sec": 30.00133,
          "bytes_transferred": 10271850496
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2700.56857362075,
        "bandwidth_mbps_min": 2657.147483602567,
        "bandwidth_mbps_max": 2739.038701550898,
        "bandwidth_mbps_stddev": 41.1695,
        "retransmits_avg": 4237.666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 78.24289744542494,
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
          "last_ms": 0.200,
          "avg_ms": 0.200,
          "best_ms": 0.100,
          "worst_ms": 0.300,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.102.131.91",
      "hops": [
        {
          "hop": 1,
          "host": "100.102.131.91",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.500,
          "avg_ms": 0.500,
          "best_ms": 0.500,
          "worst_ms": 0.700,
          "stdev_ms": 0.000
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.101502723239,
          "retransmits": 0,
          "duration_sec": 30.001599,
          "bytes_transferred": 46547861504
        },
        {
          "bandwidth_mbps": 12412.584822593542,
          "retransmits": 0,
          "duration_sec": 30.001529,
          "bytes_transferred": 46549565440
        },
        {
          "bandwidth_mbps": 12412.491196908637,
          "retransmits": 0,
          "duration_sec": 30.000995,
          "bytes_transferred": 46548385792
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.392507408475,
        "bandwidth_mbps_min": 12412.101502723239,
        "bandwidth_mbps_max": 12412.584822593542,
        "bandwidth_mbps_stddev": 0.2563,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4306.917021504815,
          "retransmits": 2644,
          "duration_sec": 30.001002,
          "bytes_transferred": 16151478272
        },
        {
          "bandwidth_mbps": 4216.740248480902,
          "retransmits": 6402,
          "duration_sec": 30.001018,
          "bytes_transferred": 15813312512
        },
        {
          "bandwidth_mbps": 4140.132239733132,
          "retransmits": 4319,
          "duration_sec": 30.000726,
          "bytes_transferred": 15525871616
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4221.263169906283,
        "bandwidth_mbps_min": 4140.132239733132,
        "bandwidth_mbps_max": 4306.917021504815,
        "bandwidth_mbps_stddev": 83.4843,
        "retransmits_avg": 4455
      }
    },
    "overhead": {
      "bandwidth_pct": 65.9915429890992,
      "retransmits_pct": 0
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.212",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.212",
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
      "target_ip": "100.99.105.49",
      "hops": [
        {
          "hop": 1,
          "host": "100.99.105.49",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.400,
          "worst_ms": 0.700,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/m6i/results/m6i.xlarge.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "m7g",
    "instance_type": "m7g.large",
    "vcpus": 2,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.132117684017,
          "retransmits": 0,
          "duration_sec": 30.001525,
          "bytes_transferred": 46547861504
        },
        {
          "bandwidth_mbps": 12412.212974228727,
          "retransmits": 0,
          "duration_sec": 30.001583,
          "bytes_transferred": 46548254720
        },
        {
          "bandwidth_mbps": 12408.101200361194,
          "retransmits": 249,
          "duration_sec": 30.001553,
          "bytes_transferred": 46532788224
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12410.815430757977,
        "bandwidth_mbps_min": 12408.101200361194,
        "bandwidth_mbps_max": 12412.212974228727,
        "bandwidth_mbps_stddev": 2.3509,
        "retransmits_avg": 83
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2385.7596825100222,
          "retransmits": 98,
          "duration_sec": 30.000821,
          "bytes_transferred": 8946843648
        },
        {
          "bandwidth_mbps": 2379.0777459035476,
          "retransmits": 100,
          "duration_sec": 30.000899,
          "bytes_transferred": 8921808896
        },
        {
          "bandwidth_mbps": 2019.9695627491653,
          "retransmits": 3875,
          "duration_sec": 30.002184,
          "bytes_transferred": 7575437312
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2261.6023303875786,
        "bandwidth_mbps_min": 2019.9695627491653,
        "bandwidth_mbps_max": 2385.7596825100222,
        "bandwidth_mbps_stddev": 209.2868,
        "retransmits_avg": 1357.6666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 81.77716570675442,
      "retransmits_pct": 1535.7429718875503
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.187",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.187",
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
      "target_ip": "100.64.83.9",
      "hops": [
        {
          "hop": 1,
          "host": "100.64.83.9",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.500,
          "best_ms": 0.400,
          "worst_ms": 1.900,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "aws/m7g/results/m7g.large.json"
  },
  {
    "cloud_provider": "aws",
    "instance_family": "m7g",
    "instance_type": "m7g.medium",
    "vcpus": 1,
    "region": "us-east-1",
    "zone": "us-east-1a",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1018-aws",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12412.404474464001,
          "retransmits": 0,
          "duration_sec": 30.001627,
          "bytes_transferred": 46549041152
        },
        {
          "bandwidth_mbps": 12412.266524968063,
          "retransmits": 0,
          "duration_sec": 30.001707,
          "bytes_transferred": 46548647936
        },
        {
          "bandwidth_mbps": 12412.815803994776,
          "retransmits": 0,
          "duration_sec": 30.001731,
          "bytes_transferred": 46550745088
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.495601142278,
        "bandwidth_mbps_min": 12412.266524968063,
        "bandwidth_mbps_max": 12412.815803994776,
        "bandwidth_mbps_stddev": 0.2858,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1359.5613684058887,
          "retransmits": 186,
          "duration_sec": 30.002034,
          "bytes_transferred": 5098700800
        },
        {
          "bandwidth_mbps": 1361.1293906331205,
          "retransmits": 464,
          "duration_sec": 30.001368,
          "bytes_transferred": 5104467968
        },
        {
          "bandwidth_mbps": 1354.5926619128422,
          "retransmits": 165,
          "duration_sec": 30.001388,
          "bytes_transferred": 5079957504
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1358.4278069839504,
        "bandwidth_mbps_min": 1354.5926619128422,
        "bandwidth_mbps_max": 1361.1293906331205,
        "bandwidth_mbps_stddev": 3.4126,
        "retransmits_avg": 271.6666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 89.05596545098521,
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
          "last_ms": 0.100,
          "avg_ms": 0.100,
          "best_ms": 0.100,
          "worst_ms": 0.200,
          "stdev_ms": 0.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.118.231.111",
      "hops": [
        {
          "hop": 1,
          "host": "100.118.231.111",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.400,
          "avg_ms": 0.400,
          "best_ms": 0.300,
          "worst_ms": 1.400,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "aws/m7g/results/m7g.medium.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "dsv4",
    "instance_type": "Standard_D2s_v4",
    "vcpus": 2,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4517.73209664583,
          "retransmits": 1965,
          "duration_sec": 30.001543,
          "bytes_transferred": 16942366720
        },
        {
          "bandwidth_mbps": 4588.705875576836,
          "retransmits": 712,
          "duration_sec": 30.001616,
          "bytes_transferred": 17208573952
        },
        {
          "bandwidth_mbps": 4591.460109073446,
          "retransmits": 243,
          "duration_sec": 30.000519,
          "bytes_transferred": 17218273280
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4565.966027098704,
        "bandwidth_mbps_min": 4517.73209664583,
        "bandwidth_mbps_max": 4591.460109073446,
        "bandwidth_mbps_stddev": 41.7945,
        "retransmits_avg": 973.3333333333334
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1851.345221596838,
          "retransmits": 5268,
          "duration_sec": 30.001466,
          "bytes_transferred": 6942883840
        },
        {
          "bandwidth_mbps": 1768.6911854399589,
          "retransmits": 7051,
          "duration_sec": 30.000794,
          "bytes_transferred": 6632767488
        },
        {
          "bandwidth_mbps": 1984.5223364178964,
          "retransmits": 2857,
          "duration_sec": 30.002304,
          "bytes_transferred": 7442530304
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1868.186247818231,
        "bandwidth_mbps_min": 1768.6911854399589,
        "bandwidth_mbps_max": 1984.5223364178964,
        "bandwidth_mbps_stddev": 108.8967,
        "retransmits_avg": 5058.666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 59.0845346476371,
      "retransmits_pct": 419.7260273972603
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.4",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.4",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.900,
          "avg_ms": 0.900,
          "best_ms": 0.700,
          "worst_ms": 1.600,
          "stdev_ms": 0.200
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.93.119.103",
      "hops": [
        {
          "hop": 1,
          "host": "100.93.119.103",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.300,
          "avg_ms": 1.700,
          "best_ms": 1.100,
          "worst_ms": 7.000,
          "stdev_ms": 0.800
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
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6277.87898269481,
          "retransmits": 785,
          "duration_sec": 30.001577,
          "bytes_transferred": 23543283712
        },
        {
          "bandwidth_mbps": 6236.15367166542,
          "retransmits": 512,
          "duration_sec": 30.001549,
          "bytes_transferred": 23386783744
        },
        {
          "bandwidth_mbps": 4423.502554117271,
          "retransmits": 615,
          "duration_sec": 30.001559,
          "bytes_transferred": 16588996608
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5645.8450694925,
        "bandwidth_mbps_min": 4423.502554117271,
        "bandwidth_mbps_max": 6277.87898269481,
        "bandwidth_mbps_stddev": 1058.7852,
        "retransmits_avg": 637.3333333333334
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1255.4578865839767,
          "retransmits": 295,
          "duration_sec": 30.001722,
          "bytes_transferred": 4708237312
        },
        {
          "bandwidth_mbps": 1421.0034288177417,
          "retransmits": 1128,
          "duration_sec": 30.001303,
          "bytes_transferred": 5328994304
        },
        {
          "bandwidth_mbps": 2116.2155902965346,
          "retransmits": 826,
          "duration_sec": 30.001777,
          "bytes_transferred": 7936278528
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1597.5589685660843,
        "bandwidth_mbps_min": 1255.4578865839767,
        "bandwidth_mbps_max": 2116.2155902965346,
        "bandwidth_mbps_stddev": 456.7328,
        "retransmits_avg": 749.6666666666666
      }
    },
    "overhead": {
      "bandwidth_pct": 71.70381140639965,
      "retransmits_pct": 17.62552301255229
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.4",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.4",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.200,
          "avg_ms": 1.000,
          "best_ms": 0.700,
          "worst_ms": 1.900,
          "stdev_ms": 0.200
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.73.149.39",
      "hops": [
        {
          "hop": 1,
          "host": "100.73.149.39",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.000,
          "avg_ms": 1.500,
          "best_ms": 0.900,
          "worst_ms": 4.400,
          "stdev_ms": 0.400
        }
      ]
    },
    "source": "azure/dsv4/results/Standard_D4s_v4.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "dsv6",
    "instance_type": "Standard_D2s_v6",
    "vcpus": 2,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-10",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12297.918482139467,
          "retransmits": 0,
          "duration_sec": 30.001597,
          "bytes_transferred": 46119649280
        },
        {
          "bandwidth_mbps": 12298.011036801438,
          "retransmits": 198,
          "duration_sec": 30.001627,
          "bytes_transferred": 46120042496
        },
        {
          "bandwidth_mbps": 12296.925107776633,
          "retransmits": 76,
          "duration_sec": 30.001633,
          "bytes_transferred": 46115979264
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12297.618208905844,
        "bandwidth_mbps_min": 12296.925107776633,
        "bandwidth_mbps_max": 12298.011036801438,
        "bandwidth_mbps_stddev": 0.6020,
        "retransmits_avg": 91.33333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4397.173232113968,
          "retransmits": 8339,
          "duration_sec": 30.001637,
          "bytes_transferred": 16490299392
        },
        {
          "bandwidth_mbps": 4293.9294831339475,
          "retransmits": 29,
          "duration_sec": 30.00139,
          "bytes_transferred": 16102981632
        },
        {
          "bandwidth_mbps": 4287.828586852549,
          "retransmits": 25,
          "duration_sec": 30.001526,
          "bytes_transferred": 16080175104
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4326.310434033488,
        "bandwidth_mbps_min": 4287.828586852549,
        "bandwidth_mbps_max": 4397.173232113968,
        "bandwidth_mbps_stddev": 61.4448,
        "retransmits_avg": 2797.6666666666665
      }
    },
    "overhead": {
      "bandwidth_pct": 64.81993211579454,
      "retransmits_pct": 2963.1386861313867
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.4",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.4",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 21.700,
          "avg_ms": 5.100,
          "best_ms": 0.600,
          "worst_ms": 21.700,
          "stdev_ms": 4.900
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.114.5.28",
      "hops": [
        {
          "hop": 1,
          "host": "100.114.5.28",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.800,
          "avg_ms": 0.800,
          "best_ms": 0.500,
          "worst_ms": 2.100,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "azure/dsv6/results/Standard_D2s_v6.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "famsv6",
    "instance_type": "Standard_F2ams_v6",
    "vcpus": 2,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11838.976632117307,
          "retransmits": 12977,
          "duration_sec": 30.00152,
          "bytes_transferred": 44398411776
        },
        {
          "bandwidth_mbps": 11901.532943215503,
          "retransmits": 14945,
          "duration_sec": 30.001534,
          "bytes_transferred": 44633030656
        },
        {
          "bandwidth_mbps": 11903.974734102036,
          "retransmits": 11826,
          "duration_sec": 30.001546,
          "bytes_transferred": 44642205696
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11881.494769811616,
        "bandwidth_mbps_min": 11838.976632117307,
        "bandwidth_mbps_max": 11903.974734102036,
        "bandwidth_mbps_stddev": 36.8420,
        "retransmits_avg": 13249.333333333334
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4288.5942166995455,
          "retransmits": 2692,
          "duration_sec": 30.002038,
          "bytes_transferred": 16083320832
        },
        {
          "bandwidth_mbps": 4381.894566222974,
          "retransmits": 8275,
          "duration_sec": 30.000955,
          "bytes_transferred": 16432627712
        },
        {
          "bandwidth_mbps": 4365.515563142954,
          "retransmits": 5656,
          "duration_sec": 30.000624,
          "bytes_transferred": 16371023872
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4345.334782021825,
        "bandwidth_mbps_min": 4288.5942166995455,
        "bandwidth_mbps_max": 4381.894566222974,
        "bandwidth_mbps_stddev": 49.8165,
        "retransmits_avg": 5541
      }
    },
    "overhead": {
      "bandwidth_pct": 63.42770950787767,
      "retransmits_pct": -58.179027875616384
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.5",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.5",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.100,
          "avg_ms": 1.500,
          "best_ms": 0.700,
          "worst_ms": 12.100,
          "stdev_ms": 2.100
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.106.166.39",
      "hops": [
        {
          "hop": 1,
          "host": "100.106.166.39",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.800,
          "avg_ms": 0.700,
          "best_ms": 0.500,
          "worst_ms": 1.400,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "azure/famsv6/results/Standard_F2ams_v6.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "famsv6",
    "instance_type": "Standard_F4ams_v6",
    "vcpus": 4,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11844.205638471201,
          "retransmits": 4621,
          "duration_sec": 30.001643,
          "bytes_transferred": 44418203648
        },
        {
          "bandwidth_mbps": 11905.57492797459,
          "retransmits": 4903,
          "duration_sec": 30.001565,
          "bytes_transferred": 44648235008
        },
        {
          "bandwidth_mbps": 11908.975070479715,
          "retransmits": 4796,
          "duration_sec": 30.00154,
          "bytes_transferred": 44660948992
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11886.251878975168,
        "bandwidth_mbps_min": 11844.205638471201,
        "bandwidth_mbps_max": 11908.975070479715,
        "bandwidth_mbps_stddev": 36.4528,
        "retransmits_avg": 4773.333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4891.3005383055015,
          "retransmits": 0,
          "duration_sec": 30.000808,
          "bytes_transferred": 18342871040
        },
        {
          "bandwidth_mbps": 4902.367301426871,
          "retransmits": 5,
          "duration_sec": 30.000673,
          "bytes_transferred": 18384289792
        },
        {
          "bandwidth_mbps": 4941.285568907903,
          "retransmits": 0,
          "duration_sec": 30.001631,
          "bytes_transferred": 18530828288
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4911.651136213425,
        "bandwidth_mbps_min": 4891.3005383055015,
        "bandwidth_mbps_max": 4941.285568907903,
        "bandwidth_mbps_stddev": 26.2539,
        "retransmits_avg": 1.6666666666666667
      }
    },
    "overhead": {
      "bandwidth_pct": 58.677881082922944,
      "retransmits_pct": -99.96508379888267
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.4",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.4",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.800,
          "avg_ms": 1.600,
          "best_ms": 0.700,
          "worst_ms": 10.200,
          "stdev_ms": 2.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.109.230.18",
      "hops": [
        {
          "hop": 1,
          "host": "100.109.230.18",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.700,
          "avg_ms": 0.700,
          "best_ms": 0.500,
          "worst_ms": 1.000,
          "stdev_ms": 0.100
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
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11838.453949060442,
          "retransmits": 14052,
          "duration_sec": 30.001516,
          "bytes_transferred": 44396445696
        },
        {
          "bandwidth_mbps": 11904.800060263493,
          "retransmits": 9819,
          "duration_sec": 30.00158,
          "bytes_transferred": 44645351424
        },
        {
          "bandwidth_mbps": 11900.980656560452,
          "retransmits": 14994,
          "duration_sec": 30.001076,
          "bytes_transferred": 44630278144
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11881.411555294797,
        "bandwidth_mbps_min": 11838.453949060442,
        "bandwidth_mbps_max": 11904.800060263493,
        "bandwidth_mbps_stddev": 37.2514,
        "retransmits_avg": 12955
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4590.64777287154,
          "retransmits": 3829,
          "duration_sec": 30.001031,
          "bytes_transferred": 17215520768
        },
        {
          "bandwidth_mbps": 4568.770750232035,
          "retransmits": 6188,
          "duration_sec": 30.000785,
          "bytes_transferred": 17133338624
        },
        {
          "bandwidth_mbps": 4680.901787872235,
          "retransmits": 1562,
          "duration_sec": 30.001193,
          "bytes_transferred": 17554079744
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4613.440103658603,
        "bandwidth_mbps_min": 4568.770750232035,
        "bandwidth_mbps_max": 4680.901787872235,
        "bandwidth_mbps_stddev": 59.4387,
        "retransmits_avg": 3859.6666666666665
      }
    },
    "overhead": {
      "bandwidth_pct": 61.17094267639703,
      "retransmits_pct": -70.2071272353017
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.6",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.6",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.300,
          "avg_ms": 3.900,
          "best_ms": 0.900,
          "worst_ms": 21.200,
          "stdev_ms": 4.300
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.67.167.64",
      "hops": [
        {
          "hop": 1,
          "host": "100.67.167.64",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.000,
          "avg_ms": 1.000,
          "best_ms": 0.700,
          "worst_ms": 4.400,
          "stdev_ms": 0.400
        }
      ]
    },
    "source": "azure/fasv6/results/Standard_F2as_v6.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "fasv6",
    "instance_type": "Standard_F8as_v6",
    "vcpus": 8,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11847.368764038878,
          "retransmits": 1241,
          "duration_sec": 30.00151,
          "bytes_transferred": 44429869056
        },
        {
          "bandwidth_mbps": 11919.656570966834,
          "retransmits": 1111,
          "duration_sec": 30.000958,
          "bytes_transferred": 44700139520
        },
        {
          "bandwidth_mbps": 11910.410829739934,
          "retransmits": 1235,
          "duration_sec": 30.001533,
          "bytes_transferred": 44666322944
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11892.478721581881,
        "bandwidth_mbps_min": 11847.368764038878,
        "bandwidth_mbps_max": 11919.656570966834,
        "bandwidth_mbps_stddev": 39.3389,
        "retransmits_avg": 1195.6666666666667
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5818.093804957775,
          "retransmits": 5106,
          "duration_sec": 30.001442,
          "bytes_transferred": 21818900480
        },
        {
          "bandwidth_mbps": 5748.62587934743,
          "retransmits": 2674,
          "duration_sec": 30.001367,
          "bytes_transferred": 21558329344
        },
        {
          "bandwidth_mbps": 5796.934522693085,
          "retransmits": 2306,
          "duration_sec": 30.000791,
          "bytes_transferred": 21739077632
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5787.884735666096,
        "bandwidth_mbps_min": 5748.62587934743,
        "bandwidth_mbps_max": 5818.093804957775,
        "bandwidth_mbps_stddev": 35.6072,
        "retransmits_avg": 3362
      }
    },
    "overhead": {
      "bandwidth_pct": 51.33155273036116,
      "retransmits_pct": 181.1820462782269
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.6",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.6",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.800,
          "avg_ms": 1.900,
          "best_ms": 0.900,
          "worst_ms": 9.400,
          "stdev_ms": 1.900
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.83.36.111",
      "hops": [
        {
          "hop": 1,
          "host": "100.83.36.111",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.800,
          "avg_ms": 0.800,
          "best_ms": 0.600,
          "worst_ms": 1.100,
          "stdev_ms": 0.100
        }
      ]
    },
    "source": "azure/fasv6/results/Standard_F8as_v6.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "fsv2",
    "instance_type": "Standard_F16s_v2",
    "vcpus": 16,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 11902.461499037847,
          "retransmits": 186,
          "duration_sec": 30.001484,
          "bytes_transferred": 44636438528
        },
        {
          "bandwidth_mbps": 11966.228471881848,
          "retransmits": 572,
          "duration_sec": 30.001705,
          "bytes_transferred": 44875907072
        },
        {
          "bandwidth_mbps": 11964.644818400593,
          "retransmits": 572,
          "duration_sec": 30.001557,
          "bytes_transferred": 44869746688
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 11944.44492977343,
        "bandwidth_mbps_min": 11902.461499037847,
        "bandwidth_mbps_max": 11966.228471881848,
        "bandwidth_mbps_stddev": 36.3673,
        "retransmits_avg": 443.3333333333333
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2147.195513410225,
          "retransmits": 211,
          "duration_sec": 30.001584,
          "bytes_transferred": 8052408320
        },
        {
          "bandwidth_mbps": 2325.689529412341,
          "retransmits": 53,
          "duration_sec": 30.001573,
          "bytes_transferred": 8721793024
        },
        {
          "bandwidth_mbps": 2390.268067116057,
          "retransmits": 178,
          "duration_sec": 30.001703,
          "bytes_transferred": 8964014080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2287.717703312874,
        "bandwidth_mbps_min": 2147.195513410225,
        "bandwidth_mbps_max": 2390.268067116057,
        "bandwidth_mbps_stddev": 125.9066,
        "retransmits_avg": 147.33333333333334
      }
    },
    "overhead": {
      "bandwidth_pct": 80.84701535514327,
      "retransmits_pct": -66.76691729323309
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.6",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.6",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 3.000,
          "avg_ms": 2.600,
          "best_ms": 1.000,
          "worst_ms": 15.300,
          "stdev_ms": 2.800
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.120.250.35",
      "hops": [
        {
          "hop": 1,
          "host": "100.120.250.35",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.600,
          "avg_ms": 1.200,
          "best_ms": 0.500,
          "worst_ms": 2.000,
          "stdev_ms": 0.300
        }
      ]
    },
    "source": "azure/fsv2/results/Standard_F16s_v2.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "fsv2",
    "instance_type": "Standard_F2s_v2",
    "vcpus": 2,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4765.640365360083,
          "retransmits": 386,
          "duration_sec": 30.001526,
          "bytes_transferred": 17872060416
        },
        {
          "bandwidth_mbps": 4790.52210976061,
          "retransmits": 404,
          "duration_sec": 30.001546,
          "bytes_transferred": 17965383680
        },
        {
          "bandwidth_mbps": 4790.002478874652,
          "retransmits": 772,
          "duration_sec": 30.001517,
          "bytes_transferred": 17963417600
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4782.054984665115,
        "bandwidth_mbps_min": 4765.640365360083,
        "bandwidth_mbps_max": 4790.52210976061,
        "bandwidth_mbps_stddev": 14.2179,
        "retransmits_avg": 520.6666666666666
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2626.1944923712517,
          "retransmits": 217,
          "duration_sec": 30.001187,
          "bytes_transferred": 9848619008
        },
        {
          "bandwidth_mbps": 2688.8669186439492,
          "retransmits": 195,
          "duration_sec": 30.001911,
          "bytes_transferred": 10083893248
        },
        {
          "bandwidth_mbps": 2853.0529000305887,
          "retransmits": 2030,
          "duration_sec": 30.001287,
          "bytes_transferred": 10699407360
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2722.7047703485964,
        "bandwidth_mbps_min": 2626.1944923712517,
        "bandwidth_mbps_max": 2853.0529000305887,
        "bandwidth_mbps_stddev": 117.1535,
        "retransmits_avg": 814
      }
    },
    "overhead": {
      "bandwidth_pct": 43.06412663426817,
      "retransmits_pct": 56.338028169014095
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.6",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.6",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.200,
          "avg_ms": 1.800,
          "best_ms": 0.800,
          "worst_ms": 10.000,
          "stdev_ms": 1.600
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.110.52.114",
      "hops": [
        {
          "hop": 1,
          "host": "100.110.52.114",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 0.900,
          "avg_ms": 1.200,
          "best_ms": 0.700,
          "worst_ms": 1.900,
          "stdev_ms": 0.300
        }
      ]
    },
    "source": "azure/fsv2/results/Standard_F2s_v2.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "fsv2",
    "instance_type": "Standard_F32s_v2",
    "vcpus": 32,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 12597.4179354554,
          "retransmits": 2608,
          "duration_sec": 30.00158,
          "bytes_transferred": 47242805248
        },
        {
          "bandwidth_mbps": 13650.039773806384,
          "retransmits": 1120,
          "duration_sec": 30.001554,
          "bytes_transferred": 51190300672
        },
        {
          "bandwidth_mbps": 15310.77414276602,
          "retransmits": 6026,
          "duration_sec": 30.001523,
          "bytes_transferred": 57418317824
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 13852.743950675935,
        "bandwidth_mbps_min": 12597.4179354554,
        "bandwidth_mbps_max": 15310.77414276602,
        "bandwidth_mbps_stddev": 1367.9884,
        "retransmits_avg": 3251.3333333333335
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2122.999447498491,
          "retransmits": 7095,
          "duration_sec": 30.001728,
          "bytes_transferred": 7961706496
        },
        {
          "bandwidth_mbps": 2212.370803523762,
          "retransmits": 922,
          "duration_sec": 30.001689,
          "bytes_transferred": 8296857600
        },
        {
          "bandwidth_mbps": 2157.9883707845693,
          "retransmits": 1577,
          "duration_sec": 30.00168,
          "bytes_transferred": 8092909568
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2164.4528739356074,
        "bandwidth_mbps_min": 2122.999447498491,
        "bandwidth_mbps_max": 2212.370803523762,
        "bandwidth_mbps_stddev": 45.0350,
        "retransmits_avg": 3198
      }
    },
    "overhead": {
      "bandwidth_pct": 84.37527697297837,
      "retransmits_pct": -1.6403526758253069
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.5",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.5",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.300,
          "avg_ms": 1.600,
          "best_ms": 1.100,
          "worst_ms": 22.600,
          "stdev_ms": 2.200
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.118.67.74",
      "hops": [
        {
          "hop": 1,
          "host": "100.118.67.74",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.300,
          "avg_ms": 1.600,
          "best_ms": 1.100,
          "worst_ms": 2.700,
          "stdev_ms": 0.300
        }
      ]
    },
    "source": "azure/fsv2/results/Standard_F32s_v2.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "fsv2",
    "instance_type": "Standard_F48s_v2",
    "vcpus": 48,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6249.924164698317,
          "retransmits": 691,
          "duration_sec": 30.001885,
          "bytes_transferred": 23438688256
        },
        {
          "bandwidth_mbps": 8077.5217250211,
          "retransmits": 1247,
          "duration_sec": 30.00172,
          "bytes_transferred": 30292443136
        },
        {
          "bandwidth_mbps": 7899.346821876047,
          "retransmits": 899,
          "duration_sec": 30.001709,
          "bytes_transferred": 29624238080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 7408.9309038651545,
        "bandwidth_mbps_min": 6249.924164698317,
        "bandwidth_mbps_max": 8077.5217250211,
        "bandwidth_mbps_stddev": 1007.6751,
        "retransmits_avg": 945.6666666666666
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1520.5825504501047,
          "retransmits": 4920,
          "duration_sec": 30.00192,
          "bytes_transferred": 5702549504
        },
        {
          "bandwidth_mbps": 1406.514957040907,
          "retransmits": 4527,
          "duration_sec": 30.003194,
          "bytes_transferred": 5274992640
        },
        {
          "bandwidth_mbps": 1317.2314515817764,
          "retransmits": 216,
          "duration_sec": 30.002154,
          "bytes_transferred": 4939972608
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1414.7763196909293,
        "bandwidth_mbps_min": 1317.2314515817764,
        "bandwidth_mbps_max": 1520.5825504501047,
        "bandwidth_mbps_stddev": 101.9270,
        "retransmits_avg": 3221
      }
    },
    "overhead": {
      "bandwidth_pct": 80.90444710514365,
      "retransmits_pct": 240.60627423334512
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.6",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.6",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.300,
          "avg_ms": 1.500,
          "best_ms": 0.900,
          "worst_ms": 8.300,
          "stdev_ms": 1.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.75.66.45",
      "hops": [
        {
          "hop": 1,
          "host": "100.75.66.45",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 2.600,
          "avg_ms": 1.700,
          "best_ms": 1.000,
          "worst_ms": 12.400,
          "stdev_ms": 1.100
        }
      ]
    },
    "source": "azure/fsv2/results/Standard_F48s_v2.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "fsv2",
    "instance_type": "Standard_F4s_v2",
    "vcpus": 4,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9181.05877855428,
          "retransmits": 0,
          "duration_sec": 30.000891,
          "bytes_transferred": 34429992960
        },
        {
          "bandwidth_mbps": 9181.203686660274,
          "retransmits": 30,
          "duration_sec": 30.001788,
          "bytes_transferred": 34431565824
        },
        {
          "bandwidth_mbps": 9181.29072494881,
          "retransmits": 0,
          "duration_sec": 30.001732,
          "bytes_transferred": 34431827968
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9181.184396721123,
        "bandwidth_mbps_min": 9181.05877855428,
        "bandwidth_mbps_max": 9181.29072494881,
        "bandwidth_mbps_stddev": 0.1172,
        "retransmits_avg": 10
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1307.8108216969388,
          "retransmits": 176,
          "duration_sec": 30.000988,
          "bytes_transferred": 4904452096
        },
        {
          "bandwidth_mbps": 1376.1540305444216,
          "retransmits": 301,
          "duration_sec": 30.000699,
          "bytes_transferred": 5160697856
        },
        {
          "bandwidth_mbps": 1399.6514454743099,
          "retransmits": 262,
          "duration_sec": 30.001986,
          "bytes_transferred": 5249040384
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1361.20543257189,
        "bandwidth_mbps_min": 1307.8108216969388,
        "bandwidth_mbps_max": 1399.6514454743099,
        "bandwidth_mbps_stddev": 47.7103,
        "retransmits_avg": 246.33333333333334
      }
    },
    "overhead": {
      "bandwidth_pct": 85.17396695509115,
      "retransmits_pct": 2363.3333333333335
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
          "avg_ms": 2.100,
          "best_ms": 1.100,
          "worst_ms": 9.600,
          "stdev_ms": 2.000
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.80.220.36",
      "hops": [
        {
          "hop": 1,
          "host": "100.80.220.36",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.200,
          "avg_ms": 1.400,
          "best_ms": 1.000,
          "worst_ms": 1.800,
          "stdev_ms": 0.200
        }
      ]
    },
    "source": "azure/fsv2/results/Standard_F4s_v2.json"
  },
  {
    "cloud_provider": "azure",
    "instance_family": "fsv2",
    "instance_type": "Standard_F8s_v2",
    "vcpus": 8,
    "region": "eastus",
    "zone": "eastus",
    "date": "2026-02-11",
    "tailscale_version": "1.94.1",
    "kernel_version": "6.14.0-1017-azure",
    "connection_type": "direct",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 6127.88427995791,
          "retransmits": 807,
          "duration_sec": 30.00151,
          "bytes_transferred": 22980722688
        },
        {
          "bandwidth_mbps": 5867.50511962923,
          "retransmits": 665,
          "duration_sec": 30.001489,
          "bytes_transferred": 22004236288
        },
        {
          "bandwidth_mbps": 6984.349973966322,
          "retransmits": 634,
          "duration_sec": 30.001523,
          "bytes_transferred": 26192642048
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 6326.579791184488,
        "bandwidth_mbps_min": 5867.50511962923,
        "bandwidth_mbps_max": 6984.349973966322,
        "bandwidth_mbps_stddev": 584.3334,
        "retransmits_avg": 702
      }
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2351.0791762788685,
          "retransmits": 2673,
          "duration_sec": 30.00093,
          "bytes_transferred": 8816820224
        },
        {
          "bandwidth_mbps": 2344.6599447970784,
          "retransmits": 1661,
          "duration_sec": 30.001673,
          "bytes_transferred": 8792965120
        },
        {
          "bandwidth_mbps": 2233.690509091239,
          "retransmits": 4045,
          "duration_sec": 30.000752,
          "bytes_transferred": 8376549376
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2309.809876722395,
        "bandwidth_mbps_min": 2233.690509091239,
        "bandwidth_mbps_max": 2351.0791762788685,
        "bandwidth_mbps_stddev": 65.9994,
        "retransmits_avg": 2793
      }
    },
    "overhead": {
      "bandwidth_pct": 63.4903857540704,
      "retransmits_pct": 297.86324786324786
    },
    "baseline_mtr": {
      "target_ip": "10.0.1.6",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.6",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.300,
          "avg_ms": 1.700,
          "best_ms": 0.900,
          "worst_ms": 19.400,
          "stdev_ms": 1.900
        }
      ]
    },
    "tailscale_mtr": {
      "target_ip": "100.114.206.120",
      "hops": [
        {
          "hop": 1,
          "host": "100.114.206.120",
          "loss_pct": 0.0,
          "snt": 100,
          "last_ms": 1.600,
          "avg_ms": 1.400,
          "best_ms": 0.900,
          "worst_ms": 5.300,
          "stdev_ms": 0.400
        }
      ]
    },
    "source": "azure/fsv2/results/Standard_F8s_v2.json"
  }
]
;
