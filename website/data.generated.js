const TAILBENCH_DATA = [
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.39",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.39",
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
          "bandwidth_mbps": 18371.443435924666,
          "retransmits": 0,
          "duration_sec": 30.000844,
          "bytes_transferred": 68894851072
        },
        {
          "bandwidth_mbps": 18265.66130602042,
          "retransmits": 0,
          "duration_sec": 30.001047,
          "bytes_transferred": 68498620416
        },
        {
          "bandwidth_mbps": 18609.81063755302,
          "retransmits": 1,
          "duration_sec": 30.001693,
          "bytes_transferred": 69790728192
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18415.638459832702,
        "bandwidth_mbps_min": 18265.66130602042,
        "bandwidth_mbps_max": 18609.81063755302,
        "bandwidth_mbps_stddev": 143.9319068223055,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 10678.623153807941,
          "retransmits": 0,
          "duration_sec": 30.000603,
          "bytes_transferred": 40045641728
        },
        {
          "bandwidth_mbps": 10723.513194205381,
          "retransmits": 0,
          "duration_sec": 30.001352,
          "bytes_transferred": 40214986752
        },
        {
          "bandwidth_mbps": 10668.794674810106,
          "retransmits": 0,
          "duration_sec": 30.001409,
          "bytes_transferred": 40009859072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 10690.310340941143,
        "bandwidth_mbps_min": 10668.794674810106,
        "bandwidth_mbps_max": 10723.513194205381,
        "bandwidth_mbps_stddev": 23.818366142085146,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-4",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 77.02746180263269,
      "retransmits_pct": -146100
    },
    "overhead_single": {
      "bandwidth_pct": 62.0374354857934,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c3d/results/c3d-standard-4.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c3d-standard-4-server-4ba6919 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.97.31.120",
      "hops": [
        {
          "hop": 1,
          "host": "100.97.31.120",
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
          "bandwidth_mbps": 4262.994526123345,
          "retransmits": 0,
          "duration_sec": 30.000676,
          "bytes_transferred": 15986589696
        },
        {
          "bandwidth_mbps": 4254.13123744232,
          "retransmits": 1462,
          "duration_sec": 30.00156,
          "bytes_transferred": 15953821696
        },
        {
          "bandwidth_mbps": 4174.492974856733,
          "retransmits": 0,
          "duration_sec": 30.000954,
          "bytes_transferred": 15654846464
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4230.5395794741335,
        "bandwidth_mbps_min": 4174.492974856733,
        "bandwidth_mbps_max": 4262.994526123345,
        "bandwidth_mbps_stddev": 39.79577773596209,
        "retransmits_avg": 487.3333333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3921.4226423509044,
          "retransmits": 0,
          "duration_sec": 30.00139,
          "bytes_transferred": 14706016256
        },
        {
          "bandwidth_mbps": 4078.5170368736826,
          "retransmits": 0,
          "duration_sec": 30.000692,
          "bytes_transferred": 15294791680
        },
        {
          "bandwidth_mbps": 4175.0082006214525,
          "retransmits": 0,
          "duration_sec": 30.001019,
          "bytes_transferred": 15656812544
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4058.3159599486803,
        "bandwidth_mbps_min": 3921.4226423509044,
        "bandwidth_mbps_max": 4175.0082006214525,
        "bandwidth_mbps_stddev": 104.50668709878104,
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
    "vcpus": 4,
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
          "last_ms": 0.3,
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
          "bandwidth_mbps": 18049.32734287282,
          "retransmits": 0,
          "duration_sec": 30.001255,
          "bytes_transferred": 67687809024
        },
        {
          "bandwidth_mbps": 18543.80947877633,
          "retransmits": 1,
          "duration_sec": 30.001151,
          "bytes_transferred": 69541953536
        },
        {
          "bandwidth_mbps": 18306.551602187978,
          "retransmits": 0,
          "duration_sec": 30.001567,
          "bytes_transferred": 68653154304
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18299.89614127904,
        "bandwidth_mbps_min": 18049.32734287282,
        "bandwidth_mbps_max": 18543.80947877633,
        "bandwidth_mbps_stddev": 201.92633483832128,
        "retransmits_avg": 0.3333333333333333
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 11043.772505376593,
          "retransmits": 0,
          "duration_sec": 30.001342,
          "bytes_transferred": 41415999488
        },
        {
          "bandwidth_mbps": 11071.378605153714,
          "retransmits": 0,
          "duration_sec": 30.001356,
          "bytes_transferred": 41519546368
        },
        {
          "bandwidth_mbps": 10812.778662293531,
          "retransmits": 0,
          "duration_sec": 30.00135,
          "bytes_transferred": 40549744640
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 10975.97659094128,
        "bandwidth_mbps_min": 10812.778662293531,
        "bandwidth_mbps_max": 11071.378605153714,
        "bandwidth_mbps_stddev": 115.94739359558069,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c3d",
    "instance_type": "c3d-standard-8",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 73.78409896595227,
      "retransmits_pct": -11700
    },
    "overhead_single": {
      "bandwidth_pct": 56.12636060379382,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c3d/results/c3d-standard-8.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c3d-standard-8-server-63f69d4 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.125.245.27",
      "hops": [
        {
          "hop": 1,
          "host": "100.125.245.27",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.8,
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
          "bandwidth_mbps": 4791.364624950969,
          "retransmits": 110,
          "duration_sec": 30.001304,
          "bytes_transferred": 17968398336
        },
        {
          "bandwidth_mbps": 4781.530338330456,
          "retransmits": 8,
          "duration_sec": 30.000728,
          "bytes_transferred": 17931173888
        },
        {
          "bandwidth_mbps": 4819.553021912272,
          "retransmits": 0,
          "duration_sec": 30.00054,
          "bytes_transferred": 18073649152
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4797.482661731233,
        "bandwidth_mbps_min": 4781.530338330456,
        "bandwidth_mbps_max": 4819.553021912272,
        "bandwidth_mbps_stddev": 16.11425657038326,
        "retransmits_avg": 39.333333333333336
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4784.072808233685,
          "retransmits": 57,
          "duration_sec": 30.001442,
          "bytes_transferred": 17941135360
        },
        {
          "bandwidth_mbps": 4820.530083176063,
          "retransmits": 61,
          "duration_sec": 30.00142,
          "bytes_transferred": 18077843456
        },
        {
          "bandwidth_mbps": 4842.078277754993,
          "retransmits": 0,
          "duration_sec": 30.000656,
          "bytes_transferred": 18158190592
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4815.560389721581,
        "bandwidth_mbps_min": 4784.072808233685,
        "bandwidth_mbps_max": 4842.078277754993,
        "bandwidth_mbps_stddev": 23.939952845546834,
        "retransmits_avg": 39.333333333333336
      }
    },
    "tailscale_version": "1.96.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "vcpus": 8,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.21",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.21",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.2,
          "best_ms": 0.1,
          "worst_ms": 1,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9462.69394595763,
          "retransmits": 0,
          "duration_sec": 30.000682,
          "bytes_transferred": 35485908992
        },
        {
          "bandwidth_mbps": 9468.044954294857,
          "retransmits": 0,
          "duration_sec": 30.000782,
          "bytes_transferred": 35506094080
        },
        {
          "bandwidth_mbps": 9467.093687016275,
          "retransmits": 0,
          "duration_sec": 30.000806,
          "bytes_transferred": 35502555136
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9465.944195756254,
        "bandwidth_mbps_min": 9462.69394595763,
        "bandwidth_mbps_max": 9468.044954294857,
        "bandwidth_mbps_stddev": 2.3308539456485615,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9430.98163357806,
          "retransmits": 0,
          "duration_sec": 30.001162,
          "bytes_transferred": 35367550976
        },
        {
          "bandwidth_mbps": 9429.89079383885,
          "retransmits": 0,
          "duration_sec": 30.000963,
          "bytes_transferred": 35363225600
        },
        {
          "bandwidth_mbps": 9434.525674807359,
          "retransmits": 0,
          "duration_sec": 30.000673,
          "bytes_transferred": 35380264960
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9431.799367408088,
        "bandwidth_mbps_min": 9429.89079383885,
        "bandwidth_mbps_max": 9434.525674807359,
        "bandwidth_mbps_stddev": 1.9785595535884648,
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
      "bandwidth_pct": 53.13754568845884,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 56.87932682545074,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c4/results/c4-standard-2.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4-standard-2-server-39bc913 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.126.222.111",
      "hops": [
        {
          "hop": 1,
          "host": "100.126.222.111",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.7,
          "avg_ms": 0.6,
          "best_ms": 0.3,
          "worst_ms": 1.8,
          "stdev_ms": 0.2
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 4419.202290226964,
          "retransmits": 0,
          "duration_sec": 30.001568,
          "bytes_transferred": 16572874752
        },
        {
          "bandwidth_mbps": 4439.872436044377,
          "retransmits": 0,
          "duration_sec": 30.000763,
          "bytes_transferred": 16649945088
        },
        {
          "bandwidth_mbps": 4448.84659540543,
          "retransmits": 0,
          "duration_sec": 30.002941,
          "bytes_transferred": 16684810240
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4435.973773892257,
        "bandwidth_mbps_min": 4419.202290226964,
        "bandwidth_mbps_max": 4448.84659540543,
        "bandwidth_mbps_stddev": 12.412248851055425,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4077.085561958449,
          "retransmits": 739,
          "duration_sec": 30.001195,
          "bytes_transferred": 15289679872
        },
        {
          "bandwidth_mbps": 4056.752728959374,
          "retransmits": 693,
          "duration_sec": 30.000355,
          "bytes_transferred": 15213002752
        },
        {
          "bandwidth_mbps": 4067.327848179913,
          "retransmits": 518,
          "duration_sec": 30.000984,
          "bytes_transferred": 15252979712
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4067.055379699246,
        "bandwidth_mbps_min": 4056.752728959374,
        "bandwidth_mbps_max": 4077.085561958449,
        "bandwidth_mbps_stddev": 8.303079900325585,
        "retransmits_avg": 650
      }
    },
    "tailscale_version": "1.96.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "vcpus": 2,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.62",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.62",
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
          "bandwidth_mbps": 21969.038027960098,
          "retransmits": 0,
          "duration_sec": 30.00061,
          "bytes_transferred": 82385567744
        },
        {
          "bandwidth_mbps": 21896.587844703216,
          "retransmits": 0,
          "duration_sec": 30.000699,
          "bytes_transferred": 82114117632
        },
        {
          "bandwidth_mbps": 21950.008704269658,
          "retransmits": 4,
          "duration_sec": 30.000679,
          "bytes_transferred": 82314395648
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21938.544858977653,
        "bandwidth_mbps_min": 21896.587844703216,
        "bandwidth_mbps_max": 21969.038027960098,
        "bandwidth_mbps_stddev": 30.668355842770005,
        "retransmits_avg": 1.3333333333333333
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 21311.208818146642,
          "retransmits": 0,
          "duration_sec": 30.001497,
          "bytes_transferred": 79921020928
        },
        {
          "bandwidth_mbps": 21684.330184638475,
          "retransmits": 0,
          "duration_sec": 30.00079,
          "bytes_transferred": 81318379520
        },
        {
          "bandwidth_mbps": 21678.025674360957,
          "retransmits": 0,
          "duration_sec": 30.001292,
          "bytes_transferred": 81296097280
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21557.854892382024,
        "bandwidth_mbps_min": 21311.208818146642,
        "bandwidth_mbps_max": 21684.330184638475,
        "bandwidth_mbps_stddev": 174.42410224173744,
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
      "bandwidth_pct": 73.20233168265564,
      "retransmits_pct": 100
    },
    "overhead_single": {
      "bandwidth_pct": 73.94482699621162,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c4/results/c4-standard-4.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4-standard-4-server-efe56d9 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.89.26.50",
      "hops": [
        {
          "hop": 1,
          "host": "100.89.26.50",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.7,
          "avg_ms": 0.7,
          "best_ms": 0.4,
          "worst_ms": 1.1,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 5864.7270462098595,
          "retransmits": 0,
          "duration_sec": 30.000503,
          "bytes_transferred": 21993095168
        },
        {
          "bandwidth_mbps": 5927.39484255862,
          "retransmits": 0,
          "duration_sec": 30.001039,
          "bytes_transferred": 22228500480
        },
        {
          "bandwidth_mbps": 5844.933566113425,
          "retransmits": 0,
          "duration_sec": 30.001993,
          "bytes_transferred": 21919956992
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5879.018484960635,
        "bandwidth_mbps_min": 5844.933566113425,
        "bandwidth_mbps_max": 5927.39484255862,
        "bandwidth_mbps_stddev": 35.14872633461157,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 5593.57875925317,
          "retransmits": 0,
          "duration_sec": 30.001205,
          "bytes_transferred": 20976762880
        },
        {
          "bandwidth_mbps": 5632.983195640218,
          "retransmits": 0,
          "duration_sec": 30.0015,
          "bytes_transferred": 21124743168
        },
        {
          "bandwidth_mbps": 5624.2472094539935,
          "retransmits": 0,
          "duration_sec": 30.001118,
          "bytes_transferred": 21091713024
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 5616.936388115794,
        "bandwidth_mbps_min": 5593.57875925317,
        "bandwidth_mbps_max": 5632.983195640218,
        "bandwidth_mbps_stddev": 16.897011239161742,
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
    "vcpus": 4,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.0.55",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.55",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
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
          "bandwidth_mbps": 9127.87317632435,
          "retransmits": 0,
          "duration_sec": 30.001086,
          "bytes_transferred": 34230763520
        },
        {
          "bandwidth_mbps": 9218.77022070343,
          "retransmits": 4865,
          "duration_sec": 30.00044,
          "bytes_transferred": 34570895360
        },
        {
          "bandwidth_mbps": 9181.47672065732,
          "retransmits": 0,
          "duration_sec": 30.000439,
          "bytes_transferred": 34431041536
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9176.040039228366,
        "bandwidth_mbps_min": 9127.87317632435,
        "bandwidth_mbps_max": 9218.77022070343,
        "bandwidth_mbps_stddev": 37.307160152201945,
        "retransmits_avg": 1621.6666666666667
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9348.819210796206,
          "retransmits": 0,
          "duration_sec": 30.000464,
          "bytes_transferred": 35058614272
        },
        {
          "bandwidth_mbps": 9161.966636719235,
          "retransmits": 0,
          "duration_sec": 30.000347,
          "bytes_transferred": 34357772288
        },
        {
          "bandwidth_mbps": 9159.76312597932,
          "retransmits": 0,
          "duration_sec": 30.000352,
          "bytes_transferred": 34349514752
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9223.516324498254,
        "bandwidth_mbps_min": 9159.76312597932,
        "bandwidth_mbps_max": 9348.819210796206,
        "bandwidth_mbps_stddev": 88.6070871915011,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-1",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 78.74874460851706,
      "retransmits_pct": 100
    },
    "overhead_single": {
      "bandwidth_pct": 78.38947679817933,
      "retransmits_pct": 0
    },
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-1.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4a-standard-1-server-0591b47 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:46:04 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.82.76.8",
      "hops": [
        {
          "hop": 1,
          "host": "100.82.76.8",
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
          "bandwidth_mbps": 1956.2271714628077,
          "retransmits": 0,
          "duration_sec": 30.00155,
          "bytes_transferred": 7336230912
        },
        {
          "bandwidth_mbps": 1950.80880028511,
          "retransmits": 0,
          "duration_sec": 30.001028,
          "bytes_transferred": 7315783680
        },
        {
          "bandwidth_mbps": 1943.0351389355387,
          "retransmits": 0,
          "duration_sec": 30.001791,
          "bytes_transferred": 7286816768
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1950.0237035611524,
        "bandwidth_mbps_min": 1943.0351389355387,
        "bandwidth_mbps_max": 1956.2271714628077,
        "bandwidth_mbps_stddev": 5.414161258502741,
        "retransmits_avg": 0
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1995.6315788912293,
          "retransmits": 0,
          "duration_sec": 30.0008,
          "bytes_transferred": 7483817984
        },
        {
          "bandwidth_mbps": 2001.9512791917095,
          "retransmits": 0,
          "duration_sec": 30.000898,
          "bytes_transferred": 7507542016
        },
        {
          "bandwidth_mbps": 1982.1675479052988,
          "retransmits": 0,
          "duration_sec": 30.000387,
          "bytes_transferred": 7433224192
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1993.2501353294126,
        "bandwidth_mbps_min": 1982.1675479052988,
        "bandwidth_mbps_max": 2001.9512791917095,
        "bandwidth_mbps_stddev": 8.250351951354,
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
    "vcpus": 1,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.128.15.244",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.15.244",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.1,
          "best_ms": 0.1,
          "worst_ms": 1.5,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9082.270773076656,
          "retransmits": 279,
          "duration_sec": 30.000479,
          "bytes_transferred": 34059059200
        },
        {
          "bandwidth_mbps": 9149.760597419636,
          "retransmits": 0,
          "duration_sec": 30.000487,
          "bytes_transferred": 34312159232
        },
        {
          "bandwidth_mbps": 9129.66104228084,
          "retransmits": 0,
          "duration_sec": 30.000609,
          "bytes_transferred": 34236923904
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9120.564137592377,
        "bandwidth_mbps_min": 9082.270773076656,
        "bandwidth_mbps_max": 9149.760597419636,
        "bandwidth_mbps_stddev": 28.293513433822064,
        "retransmits_avg": 93
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9070.761716612009,
          "retransmits": 370,
          "duration_sec": 30.000396,
          "bytes_transferred": 34015805440
        },
        {
          "bandwidth_mbps": 9056.602202989965,
          "retransmits": 554,
          "duration_sec": 30.000409,
          "bytes_transferred": 33962721280
        },
        {
          "bandwidth_mbps": 9101.00344965757,
          "retransmits": 0,
          "duration_sec": 30.000369,
          "bytes_transferred": 34129182720
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9076.122456419847,
        "bandwidth_mbps_min": 9056.602202989965,
        "bandwidth_mbps_max": 9101.00344965757,
        "bandwidth_mbps_stddev": 18.518834104318177,
        "retransmits_avg": 308
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "c4a",
    "instance_type": "c4a-standard-2",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 60.93268775190871,
      "retransmits_pct": -779.9283154121864
    },
    "overhead_single": {
      "bandwidth_pct": 65.94204479821636,
      "retransmits_pct": 99.78354978354977
    },
    "region": "us-central1",
    "source": "gcp/c4a/results/c4a-standard-2.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-c4a-standard-2-server-8141da9 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:46:04 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.96.66.93",
      "hops": [
        {
          "hop": 1,
          "host": "100.96.66.93",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.5,
          "avg_ms": 0.3,
          "best_ms": 0.3,
          "worst_ms": 0.6,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3548.68001252987,
          "retransmits": 1833,
          "duration_sec": 30.001906,
          "bytes_transferred": 13308395520
        },
        {
          "bandwidth_mbps": 3575.4151489592045,
          "retransmits": 0,
          "duration_sec": 30.001335,
          "bytes_transferred": 13408403456
        },
        {
          "bandwidth_mbps": 3565.3826497728724,
          "retransmits": 622,
          "duration_sec": 30.00076,
          "bytes_transferred": 13370523648
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3563.1592704206487,
        "bandwidth_mbps_min": 3548.68001252987,
        "bandwidth_mbps_max": 3575.4151489592045,
        "bandwidth_mbps_stddev": 11.0272221277377,
        "retransmits_avg": 818.3333333333334
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3081.687178737788,
          "retransmits": 0,
          "duration_sec": 30.000416,
          "bytes_transferred": 11556487168
        },
        {
          "bandwidth_mbps": 3082.2449929540803,
          "retransmits": 0,
          "duration_sec": 30.002471,
          "bytes_transferred": 11559370752
        },
        {
          "bandwidth_mbps": 3109.492989107619,
          "retransmits": 2,
          "duration_sec": 30.001245,
          "bytes_transferred": 11661082624
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3091.141720266496,
        "bandwidth_mbps_min": 3081.687178737788,
        "bandwidth_mbps_max": 3109.492989107619,
        "bandwidth_mbps_stddev": 12.978304723251497,
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
    "vcpus": 2,
    "zone": "us-central1-a"
  },
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
      "target_ip": "10.128.0.48",
      "hops": [
        {
          "hop": 1,
          "host": "10.128.0.48",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.3,
          "best_ms": 0.3,
          "worst_ms": 0.9,
          "stdev_ms": 0.1
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9108.834111997823,
          "retransmits": 0,
          "duration_sec": 30.00094,
          "bytes_transferred": 34159198208
        },
        {
          "bandwidth_mbps": 9191.57366385132,
          "retransmits": 0,
          "duration_sec": 30.000909,
          "bytes_transferred": 34469445632
        },
        {
          "bandwidth_mbps": 9190.137097507222,
          "retransmits": 0,
          "duration_sec": 30.001377,
          "bytes_transferred": 34464595968
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9163.514957785455,
        "bandwidth_mbps_min": 9108.834111997823,
        "bandwidth_mbps_max": 9191.57366385132,
        "bandwidth_mbps_stddev": 38.66964444930387,
        "retransmits_avg": 0
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9150.220819851958,
          "retransmits": 0,
          "duration_sec": 30.00127,
          "bytes_transferred": 34314780672
        },
        {
          "bandwidth_mbps": 9134.321322133012,
          "retransmits": 0,
          "duration_sec": 30.000915,
          "bytes_transferred": 34254749696
        },
        {
          "bandwidth_mbps": 9160.251036226246,
          "retransmits": 2,
          "duration_sec": 30.000929,
          "bytes_transferred": 34352005120
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9148.264392737072,
        "bandwidth_mbps_min": 9134.321322133012,
        "bandwidth_mbps_max": 9160.251036226246,
        "bandwidth_mbps_stddev": 10.675773930762174,
        "retransmits_avg": 0.6666666666666666
      }
    },
    "cloud_provider": "gcp",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "vm",
    "instance_family": "n4",
    "instance_type": "n4-standard-2",
    "kernel_version": "6.17.0-1009-gcp",
    "overhead": {
      "bandwidth_pct": 61.8908727128457,
      "retransmits_pct": 0
    },
    "overhead_single": {
      "bandwidth_pct": 64.85788440963015,
      "retransmits_pct": -138700.00000000003
    },
    "region": "us-central1",
    "source": "gcp/n4/results/n4-standard-2.json",
    "system_config": {
      "tcp_congestion_control": "bbr",
      "cpu_governor": "",
      "gro_udp_forwarding": true,
      "mtu_underlay": 1460,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t87380\t67108864",
      "tcp_wmem": "4096\t65536\t67108864",
      "kernel_full": "Linux tb-n4-standard-2-server-b2ab739 6.17.0-1009-gcp #9~24.04.3-Ubuntu SMP Sat Mar  7 00:58:37 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.83.210.38",
      "hops": [
        {
          "hop": 1,
          "host": "100.83.210.38",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.9,
          "avg_ms": 1,
          "best_ms": 0.7,
          "worst_ms": 1.3,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 3503.030077814392,
          "retransmits": 13613,
          "duration_sec": 30.001648,
          "bytes_transferred": 13137084416
        },
        {
          "bandwidth_mbps": 3496.94349181564,
          "retransmits": 17258,
          "duration_sec": 30.002592,
          "bytes_transferred": 13114671104
        },
        {
          "bandwidth_mbps": 3476.433168089614,
          "retransmits": 10151,
          "duration_sec": 30.001342,
          "bytes_transferred": 13037207552
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3492.135579239882,
        "bandwidth_mbps_min": 3476.433168089614,
        "bandwidth_mbps_max": 3503.030077814392,
        "bandwidth_mbps_stddev": 11.377929490292349,
        "retransmits_avg": 13674
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 3143.30876892903,
          "retransmits": 202,
          "duration_sec": 30.001406,
          "bytes_transferred": 11787960320
        },
        {
          "bandwidth_mbps": 3251.1356402831534,
          "retransmits": 0,
          "duration_sec": 30.001375,
          "bytes_transferred": 12192317440
        },
        {
          "bandwidth_mbps": 3250.2365330127445,
          "retransmits": 2574,
          "duration_sec": 30.000641,
          "bytes_transferred": 12188647424
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 3214.8936474083093,
        "bandwidth_mbps_min": 3143.30876892903,
        "bandwidth_mbps_max": 3251.1356402831534,
        "bandwidth_mbps_stddev": 50.61948385513764,
        "retransmits_avg": 925.3333333333334
      }
    },
    "tailscale_version": "1.96.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
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
      "target_ip": "10.80.1.5",
      "hops": [
        {
          "hop": 1,
          "host": "10.80.2.1",
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
          "host": "10.0.0.4",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 3.3,
          "stdev_ms": 0.3
        },
        {
          "hop": 3,
          "host": "10.80.1.5",
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
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 9551.22326682785,
          "retransmits": 2,
          "duration_sec": 30.000583,
          "bytes_transferred": 35817783296
        },
        {
          "bandwidth_mbps": 9551.55542243587,
          "retransmits": 0,
          "duration_sec": 30.001406,
          "bytes_transferred": 35820011520
        },
        {
          "bandwidth_mbps": 9550.48958494265,
          "retransmits": 0,
          "duration_sec": 30.001131,
          "bytes_transferred": 35815686144
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9551.089424735457,
        "bandwidth_mbps_min": 9550.48958494265,
        "bandwidth_mbps_max": 9551.55542243587,
        "bandwidth_mbps_stddev": 0.44529965174034664,
        "retransmits_avg": 0.6666666666666666
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9543.52470946981,
          "retransmits": 0,
          "duration_sec": 30.001271,
          "bytes_transferred": 35789733888
        },
        {
          "bandwidth_mbps": 9540.136711274507,
          "retransmits": 0,
          "duration_sec": 30.001154,
          "bytes_transferred": 35776888832
        },
        {
          "bandwidth_mbps": 9543.491626767107,
          "retransmits": 1,
          "duration_sec": 30.001375,
          "bytes_transferred": 35789733888
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9542.384349170474,
        "bandwidth_mbps_min": 9540.136711274507,
        "bandwidth_mbps_max": 9543.52470946981,
        "bandwidth_mbps_stddev": 1.5893773833061626,
        "retransmits_avg": 0.3333333333333333
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
      "bandwidth_pct": 87.21510323570273,
      "retransmits_pct": -574700.0000000001
    },
    "overhead_single": {
      "bandwidth_pct": 87.49032187950306,
      "retransmits_pct": -123000
    },
    "region": "us-central1",
    "source": "gke/c4/results/c4-standard-2.json",
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
      "target_ip": "100.96.17.63",
      "hops": [
        {
          "hop": 1,
          "host": "100.96.17.63",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.6,
          "avg_ms": 0.4,
          "best_ms": 0.3,
          "worst_ms": 0.8,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1226.0618271459034,
          "retransmits": 4629,
          "duration_sec": 30.000932,
          "bytes_transferred": 4597874688
        },
        {
          "bandwidth_mbps": 1234.3577658954746,
          "retransmits": 5009,
          "duration_sec": 30.001479,
          "bytes_transferred": 4629069824
        },
        {
          "bandwidth_mbps": 1202.8711754130486,
          "retransmits": 1858,
          "duration_sec": 30.001377,
          "bytes_transferred": 4510973952
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1221.0969228181423,
        "bandwidth_mbps_min": 1202.8711754130486,
        "bandwidth_mbps_max": 1234.3577658954746,
        "bandwidth_mbps_stddev": 13.32514043177697,
        "retransmits_avg": 3832
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1181.3298265953251,
          "retransmits": 277,
          "duration_sec": 30.001671,
          "bytes_transferred": 4430233600
        },
        {
          "bandwidth_mbps": 1196.2716701430252,
          "retransmits": 819,
          "duration_sec": 30.001221,
          "bytes_transferred": 4486201344
        },
        {
          "bandwidth_mbps": 1203.5632045673633,
          "retransmits": 135,
          "duration_sec": 30.00068,
          "bytes_transferred": 4513464320
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1193.7215671019046,
        "bandwidth_mbps_min": 1181.3298265953251,
        "bandwidth_mbps_max": 1203.5632045673633,
        "bandwidth_mbps_stddev": 9.254117755612997,
        "retransmits_avg": 410.3333333333333
      }
    },
    "tailscale_version": "1.94.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "vcpus": 2,
    "zone": "us-central1-a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.80.1.4",
      "hops": [
        {
          "hop": 1,
          "host": "10.80.2.1",
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
          "host": "10.0.0.6",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        },
        {
          "hop": 3,
          "host": "10.80.1.4",
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
          "bandwidth_mbps": 21907.18290736608,
          "retransmits": 126547,
          "duration_sec": 30.001602,
          "bytes_transferred": 82156322816
        },
        {
          "bandwidth_mbps": 21955.693245960498,
          "retransmits": 29008,
          "duration_sec": 30.000935,
          "bytes_transferred": 82336415744
        },
        {
          "bandwidth_mbps": 21784.93636900136,
          "retransmits": 377969,
          "duration_sec": 30.000865,
          "bytes_transferred": 81695866880
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 21882.60417410931,
        "bandwidth_mbps_min": 21784.93636900136,
        "bandwidth_mbps_max": 21955.693245960498,
        "bandwidth_mbps_stddev": 71.84503394385295,
        "retransmits_avg": 177841.33333333334
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 14944.036990471062,
          "retransmits": 8462,
          "duration_sec": 30.00124,
          "bytes_transferred": 56042455040
        },
        {
          "bandwidth_mbps": 16029.73797026566,
          "retransmits": 11159,
          "duration_sec": 30.001473,
          "bytes_transferred": 60114468864
        },
        {
          "bandwidth_mbps": 12262.566619306728,
          "retransmits": 4716,
          "duration_sec": 30.002151,
          "bytes_transferred": 45987921920
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 14412.113860014484,
        "bandwidth_mbps_min": 12262.566619306728,
        "bandwidth_mbps_max": 16029.73797026566,
        "bandwidth_mbps_stddev": 1583.267014626714,
        "retransmits_avg": 8112.333333333333
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
      "bandwidth_pct": 92.04390229155457,
      "retransmits_pct": 98.03176614360366
    },
    "overhead_single": {
      "bandwidth_pct": 87.21819181594631,
      "retransmits_pct": 91.97518182191725
    },
    "region": "us-central1",
    "source": "gke/c4/results/c4-standard-4.json",
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
      "target_ip": "100.64.63.117",
      "hops": [
        {
          "hop": 1,
          "host": "100.64.63.117",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.7,
          "avg_ms": 0.6,
          "best_ms": 0.5,
          "worst_ms": 1.1,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1751.8897124739974,
          "retransmits": 3783,
          "duration_sec": 30.001217,
          "bytes_transferred": 6569852928
        },
        {
          "bandwidth_mbps": 1723.785625651389,
          "retransmits": 2706,
          "duration_sec": 30.001276,
          "bytes_transferred": 6464471040
        },
        {
          "bandwidth_mbps": 1747.3287696080938,
          "retransmits": 4012,
          "duration_sec": 30.001514,
          "bytes_transferred": 6552813568
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1741.0013692444936,
        "bandwidth_mbps_min": 1723.785625651389,
        "bandwidth_mbps_max": 1751.8897124739974,
        "bandwidth_mbps_stddev": 12.314948113414758,
        "retransmits_avg": 3500.3333333333335
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1850.5570428902447,
          "retransmits": 787,
          "duration_sec": 30.000645,
          "bytes_transferred": 6939738112
        },
        {
          "bandwidth_mbps": 1835.8179160708567,
          "retransmits": 383,
          "duration_sec": 30.000473,
          "bytes_transferred": 6884425728
        },
        {
          "bandwidth_mbps": 1840.0112876023,
          "retransmits": 783,
          "duration_sec": 30.001057,
          "bytes_transferred": 6900285440
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1842.128748854467,
        "bandwidth_mbps_min": 1835.8179160708567,
        "bandwidth_mbps_max": 1850.5570428902447,
        "bandwidth_mbps_stddev": 6.200709446793057,
        "retransmits_avg": 651
      }
    },
    "tailscale_version": "1.94.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "vcpus": 4,
    "zone": "us-central1-a"
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
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.70",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.72",
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
          "host": "10.0.1.139",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.3,
          "best_ms": 0.3,
          "worst_ms": 0.4,
          "stdev_ms": 0
        },
        {
          "hop": 3,
          "host": "10.0.1.70",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.3,
          "best_ms": 0.3,
          "worst_ms": 0.4,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 19861.63768350327,
          "retransmits": 831,
          "duration_sec": 30.001372,
          "bytes_transferred": 74484547584
        },
        {
          "bandwidth_mbps": 18638.970090944782,
          "retransmits": 553,
          "duration_sec": 30.001282,
          "bytes_transferred": 69899124736
        },
        {
          "bandwidth_mbps": 17418.726877314602,
          "retransmits": 675,
          "duration_sec": 30.001338,
          "bytes_transferred": 65323139072
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 18639.77821725422,
        "bandwidth_mbps_min": 17418.726877314602,
        "bandwidth_mbps_max": 19861.63768350327,
        "bandwidth_mbps_stddev": 997.3143240889311,
        "retransmits_avg": 686.3333333333334
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4965.2344703181825,
          "retransmits": 0,
          "duration_sec": 30.001162,
          "bytes_transferred": 18620350464
        },
        {
          "bandwidth_mbps": 4965.51126607391,
          "retransmits": 0,
          "duration_sec": 30.001179,
          "bytes_transferred": 18621399040
        },
        {
          "bandwidth_mbps": 4965.338661837343,
          "retransmits": 0,
          "duration_sec": 30.001166,
          "bytes_transferred": 18620743680
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4965.361466076479,
        "bandwidth_mbps_min": 4965.2344703181825,
        "bandwidth_mbps_max": 4965.51126607391,
        "bandwidth_mbps_stddev": 0.11414609816381371,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.12xlarge",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 86.72778243131467,
      "retransmits_pct": -250.26711996114614
    },
    "overhead_single": {
      "bandwidth_pct": 50.777746626801246,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.12xlarge.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-12xlarge 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.77.158.42",
      "hops": [
        {
          "hop": 1,
          "host": "100.77.158.42",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.4,
          "worst_ms": 0.7,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2478.3739336390845,
          "retransmits": 2983,
          "duration_sec": 30.001334,
          "bytes_transferred": 9294315520
        },
        {
          "bandwidth_mbps": 2487.882009713107,
          "retransmits": 1098,
          "duration_sec": 30.001317,
          "bytes_transferred": 9329967104
        },
        {
          "bandwidth_mbps": 2455.479814591004,
          "retransmits": 3131,
          "duration_sec": 30.001349,
          "bytes_transferred": 9208463360
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2473.9119193143983,
        "bandwidth_mbps_min": 2455.479814591004,
        "bandwidth_mbps_max": 2487.882009713107,
        "bandwidth_mbps_stddev": 13.599209316671946,
        "retransmits_avg": 2404
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2408.100036071917,
          "retransmits": 0,
          "duration_sec": 30.001178,
          "bytes_transferred": 9030729728
        },
        {
          "bandwidth_mbps": 2426.901819200444,
          "retransmits": 0,
          "duration_sec": 30.001202,
          "bytes_transferred": 9101246464
        },
        {
          "bandwidth_mbps": 2497.18654990966,
          "retransmits": 0,
          "duration_sec": 30.001226,
          "bytes_transferred": 9364832256
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2444.0628017273407,
        "bandwidth_mbps_min": 2408.100036071917,
        "bandwidth_mbps_max": 2497.18654990966,
        "bandwidth_mbps_stddev": 38.34037235001684,
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
    "vcpus": 48,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.148",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.86",
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
          "host": "10.0.1.194",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.4,
          "best_ms": 0.4,
          "worst_ms": 0.5,
          "stdev_ms": 0
        },
        {
          "hop": 3,
          "host": "10.0.1.148",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.3,
          "best_ms": 0.3,
          "worst_ms": 0.4,
          "stdev_ms": 0
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 18396.11493725923,
          "retransmits": 587,
          "duration_sec": 30.001307,
          "bytes_transferred": 68988436480
        },
        {
          "bandwidth_mbps": 19861.263815408875,
          "retransmits": 784,
          "duration_sec": 30.001356,
          "bytes_transferred": 74483105792
        },
        {
          "bandwidth_mbps": 19860.773974891224,
          "retransmits": 613,
          "duration_sec": 30.001304,
          "bytes_transferred": 74481139712
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 19372.71757585311,
        "bandwidth_mbps_min": 18396.11493725923,
        "bandwidth_mbps_max": 19861.263815408875,
        "bandwidth_mbps_stddev": 690.5623772295202,
        "retransmits_avg": 661.3333333333334
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4965.543900070907,
          "retransmits": 0,
          "duration_sec": 30.001193,
          "bytes_transferred": 18621530112
        },
        {
          "bandwidth_mbps": 4965.0865562726785,
          "retransmits": 60,
          "duration_sec": 30.001211,
          "bytes_transferred": 18619826176
        },
        {
          "bandwidth_mbps": 4964.634839378899,
          "retransmits": 0,
          "duration_sec": 30.001195,
          "bytes_transferred": 18618122240
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4965.088431907495,
        "bandwidth_mbps_min": 4964.634839378899,
        "bandwidth_mbps_max": 4965.543900070907,
        "bandwidth_mbps_stddev": 0.3711248432739042,
        "retransmits_avg": 20
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.24xlarge",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 87.70507364642474,
      "retransmits_pct": -268.0947580645161
    },
    "overhead_single": {
      "bandwidth_pct": 51.70697581162338,
      "retransmits_pct": 100
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.24xlarge.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-24xlarge 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.99.187.57",
      "hops": [
        {
          "hop": 1,
          "host": "100.99.187.57",
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
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 2382.611427360433,
          "retransmits": 2556,
          "duration_sec": 30.001294,
          "bytes_transferred": 8935178240
        },
        {
          "bandwidth_mbps": 2390.4331267895423,
          "retransmits": 3085,
          "duration_sec": 30.001386,
          "bytes_transferred": 8964538368
        },
        {
          "bandwidth_mbps": 2372.5395217618398,
          "retransmits": 1662,
          "duration_sec": 30.00137,
          "bytes_transferred": 8897429504
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2381.8613586372717,
        "bandwidth_mbps_min": 2372.5395217618398,
        "bandwidth_mbps_max": 2390.4331267895423,
        "bandwidth_mbps_stddev": 7.324262308198861,
        "retransmits_avg": 2434.3333333333335
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2383.39743020576,
          "retransmits": 0,
          "duration_sec": 30.001079,
          "bytes_transferred": 8938061824
        },
        {
          "bandwidth_mbps": 2385.3481819586914,
          "retransmits": 0,
          "duration_sec": 30.001161,
          "bytes_transferred": 8945401856
        },
        {
          "bandwidth_mbps": 2424.628460021677,
          "retransmits": 0,
          "duration_sec": 30.001221,
          "bytes_transferred": 9092726784
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2397.791357395376,
        "bandwidth_mbps_min": 2383.39743020576,
        "bandwidth_mbps_max": 2424.628460021677,
        "bandwidth_mbps_stddev": 18.99340089138576,
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
    "vcpus": 96,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.189",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.241",
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
          "host": "10.0.1.204",
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
          "host": "10.0.1.189",
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
          "bandwidth_mbps": 19861.288564693,
          "retransmits": 841,
          "duration_sec": 30.001477,
          "bytes_transferred": 74483499008
        },
        {
          "bandwidth_mbps": 19861.40480731454,
          "retransmits": 711,
          "duration_sec": 30.001407,
          "bytes_transferred": 74483761152
        },
        {
          "bandwidth_mbps": 19862.01538639735,
          "retransmits": 655,
          "duration_sec": 30.001435,
          "bytes_transferred": 74486120448
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 19861.569586134963,
        "bandwidth_mbps_min": 19861.288564693,
        "bandwidth_mbps_max": 19862.01538639735,
        "bandwidth_mbps_stddev": 0.31878048060661335,
        "retransmits_avg": 735.6666666666666
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4965.469032512442,
          "retransmits": 0,
          "duration_sec": 30.001223,
          "bytes_transferred": 18621267968
        },
        {
          "bandwidth_mbps": 4965.570244568184,
          "retransmits": 0,
          "duration_sec": 30.001245,
          "bytes_transferred": 18621661184
        },
        {
          "bandwidth_mbps": 4965.607016298063,
          "retransmits": 0,
          "duration_sec": 30.001234,
          "bytes_transferred": 18621792256
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4965.548764459562,
        "bandwidth_mbps_min": 4965.469032512442,
        "bandwidth_mbps_max": 4965.607016298063,
        "bandwidth_mbps_stddev": 0.05834339478954364,
        "retransmits_avg": 0
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.2xlarge",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 87.47169063573999,
      "retransmits_pct": -67.92025373810603
    },
    "overhead_single": {
      "bandwidth_pct": 49.740796038082884,
      "retransmits_pct": 0
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.2xlarge.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-2xlarge 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.106.197.1",
      "hops": [
        {
          "hop": 1,
          "host": "100.106.197.1",
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
          "bandwidth_mbps": 2472.4034052917723,
          "retransmits": 995,
          "duration_sec": 30.000836,
          "bytes_transferred": 9271771136
        },
        {
          "bandwidth_mbps": 2501.73136098635,
          "retransmits": 1400,
          "duration_sec": 30.001212,
          "bytes_transferred": 9381871616
        },
        {
          "bandwidth_mbps": 2490.82188076817,
          "retransmits": 1311,
          "duration_sec": 30.000848,
          "bytes_transferred": 9340846080
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2488.318882348764,
        "bandwidth_mbps_min": 2472.4034052917723,
        "bandwidth_mbps_max": 2501.73136098635,
        "bandwidth_mbps_stddev": 12.103195091144027,
        "retransmits_avg": 1235.3333333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2517.658668322995,
          "retransmits": 58,
          "duration_sec": 30.000503,
          "bytes_transferred": 9441378304
        },
        {
          "bandwidth_mbps": 2491.1717214590785,
          "retransmits": 16,
          "duration_sec": 30.001265,
          "bytes_transferred": 9342287872
        },
        {
          "bandwidth_mbps": 2478.1054542924876,
          "retransmits": 0,
          "duration_sec": 30.000353,
          "bytes_transferred": 9293004800
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2495.645281358187,
        "bandwidth_mbps_min": 2478.1054542924876,
        "bandwidth_mbps_max": 2517.658668322995,
        "bandwidth_mbps_stddev": 16.454457119859885,
        "retransmits_avg": 24.666666666666668
      }
    },
    "tailscale_version": "1.94.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "vcpus": 8,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.216",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.248",
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
          "host": "10.0.1.43",
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
          "host": "10.0.1.216",
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
          "bandwidth_mbps": 38135.42641943727,
          "retransmits": 2498,
          "duration_sec": 30.001449,
          "bytes_transferred": 143014756352
        },
        {
          "bandwidth_mbps": 36703.85395273684,
          "retransmits": 2734,
          "duration_sec": 30.001466,
          "bytes_transferred": 137646178304
        },
        {
          "bandwidth_mbps": 38136.43173731597,
          "retransmits": 2335,
          "duration_sec": 30.001428,
          "bytes_transferred": 143018426368
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 37658.57070316336,
        "bandwidth_mbps_min": 36703.85395273684,
        "bandwidth_mbps_max": 38136.43173731597,
        "bandwidth_mbps_stddev": 675.086813096282,
        "retransmits_avg": 2522.3333333333335
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9534.346565758793,
          "retransmits": 5,
          "duration_sec": 30.001227,
          "bytes_transferred": 35755261952
        },
        {
          "bandwidth_mbps": 9533.77559025513,
          "retransmits": 0,
          "duration_sec": 30.001264,
          "bytes_transferred": 35753164800
        },
        {
          "bandwidth_mbps": 9533.717445889799,
          "retransmits": 12,
          "duration_sec": 30.001227,
          "bytes_transferred": 35752902656
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9533.946533967908,
        "bandwidth_mbps_min": 9533.717445889799,
        "bandwidth_mbps_max": 9534.346565758793,
        "bandwidth_mbps_stddev": 0.28385943363368743,
        "retransmits_avg": 5.666666666666667
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.4xlarge",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 93.59764299809625,
      "retransmits_pct": -7.1891106118673065
    },
    "overhead_single": {
      "bandwidth_pct": 74.67477009216327,
      "retransmits_pct": -2676.470588235294
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.4xlarge.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-4xlarge 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.80.199.111",
      "hops": [
        {
          "hop": 1,
          "host": "100.80.199.111",
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
          "bandwidth_mbps": 2410.0742577296887,
          "retransmits": 3116,
          "duration_sec": 30.001402,
          "bytes_transferred": 9038200832
        },
        {
          "bandwidth_mbps": 2416.3550298816417,
          "retransmits": 2399,
          "duration_sec": 30.001531,
          "bytes_transferred": 9061793792
        },
        {
          "bandwidth_mbps": 2406.679127081236,
          "retransmits": 2596,
          "duration_sec": 30.001463,
          "bytes_transferred": 9025486848
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2411.036138230855,
        "bandwidth_mbps_min": 2406.679127081236,
        "bandwidth_mbps_max": 2416.3550298816417,
        "bandwidth_mbps_stddev": 4.008298419081644,
        "retransmits_avg": 2703.6666666666665
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2424.69432125059,
          "retransmits": 472,
          "duration_sec": 30.001271,
          "bytes_transferred": 9092988928
        },
        {
          "bandwidth_mbps": 2404.1568855860914,
          "retransmits": 0,
          "duration_sec": 30.001099,
          "bytes_transferred": 9015918592
        },
        {
          "bandwidth_mbps": 2414.6304302161316,
          "retransmits": 0,
          "duration_sec": 30.001246,
          "bytes_transferred": 9055240192
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2414.4938790176043,
        "bandwidth_mbps_min": 2404.1568855860914,
        "bandwidth_mbps_max": 2424.69432125059,
        "bandwidth_mbps_stddev": 8.384928963750658,
        "retransmits_avg": 157.33333333333334
      }
    },
    "tailscale_version": "1.94.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "vcpus": 16,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.136",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.6",
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
          "host": "10.0.1.177",
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
          "host": "10.0.1.136",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.1,
          "avg_ms": 0.2,
          "best_ms": 0.1,
          "worst_ms": 8.8,
          "stdev_ms": 0.9
        }
      ]
    },
    "baseline_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 24588.3209304944,
          "retransmits": 16867,
          "duration_sec": 30.001599,
          "bytes_transferred": 92211118080
        },
        {
          "bandwidth_mbps": 24626.963624334083,
          "retransmits": 17161,
          "duration_sec": 30.00187,
          "bytes_transferred": 92356870144
        },
        {
          "bandwidth_mbps": 24609.624181356976,
          "retransmits": 16780,
          "duration_sec": 30.002088,
          "bytes_transferred": 92292513792
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 24608.30291206182,
        "bandwidth_mbps_min": 24588.3209304944,
        "bandwidth_mbps_max": 24626.963624334083,
        "bandwidth_mbps_stddev": 15.803454500195427,
        "retransmits_avg": 16936
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9512.668320330878,
          "retransmits": 91,
          "duration_sec": 30.001254,
          "bytes_transferred": 35673997312
        },
        {
          "bandwidth_mbps": 9521.964353426925,
          "retransmits": 0,
          "duration_sec": 30.001257,
          "bytes_transferred": 35708862464
        },
        {
          "bandwidth_mbps": 9507.637584264414,
          "retransmits": 0,
          "duration_sec": 30.001247,
          "bytes_transferred": 35655122944
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9514.090086007405,
        "bandwidth_mbps_min": 9507.637584264414,
        "bandwidth_mbps_max": 9521.964353426925,
        "bandwidth_mbps_stddev": 5.934652019463652,
        "retransmits_avg": 30.333333333333332
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
      "bandwidth_pct": 96.44438493272803,
      "retransmits_pct": 88.15344040308612
    },
    "overhead_single": {
      "bandwidth_pct": 91.27014509632058,
      "retransmits_pct": -1546.1538461538462
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.medium.json",
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
      "target_ip": "100.118.41.115",
      "hops": [
        {
          "hop": 1,
          "host": "100.118.41.115",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
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
          "bandwidth_mbps": 887.484285689001,
          "retransmits": 1099,
          "duration_sec": 30.001029,
          "bytes_transferred": 3328180224
        },
        {
          "bandwidth_mbps": 874.6492743530872,
          "retransmits": 2846,
          "duration_sec": 30.001299,
          "bytes_transferred": 3280076800
        },
        {
          "bandwidth_mbps": 862.7960183815006,
          "retransmits": 2074,
          "duration_sec": 30.001468,
          "bytes_transferred": 3235643392
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 874.9765261411962,
        "bandwidth_mbps_min": 862.7960183815006,
        "bandwidth_mbps_max": 887.484285689001,
        "bandwidth_mbps_stddev": 10.081598945976229,
        "retransmits_avg": 2006.3333333333333
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 829.800183104921,
          "retransmits": 655,
          "duration_sec": 30.000286,
          "bytes_transferred": 3111780352
        },
        {
          "bandwidth_mbps": 811.9619597905383,
          "retransmits": 529,
          "duration_sec": 30.002043,
          "bytes_transferred": 3045064704
        },
        {
          "bandwidth_mbps": 849.9366368459263,
          "retransmits": 314,
          "duration_sec": 30.001379,
          "bytes_transferred": 3187408896
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 830.5662599137953,
        "bandwidth_mbps_min": 811.9619597905383,
        "bandwidth_mbps_max": 849.9366368459263,
        "bandwidth_mbps_stddev": 15.512557915509891,
        "retransmits_avg": 499.3333333333333
      }
    },
    "tailscale_version": "1.94.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "vcpus": 1,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.99",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.74",
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
          "host": "10.0.1.75",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.3,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.4,
          "stdev_ms": 0.1
        },
        {
          "hop": 3,
          "host": "10.0.1.99",
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
          "bandwidth_mbps": 17913.30474813023,
          "retransmits": 781,
          "duration_sec": 30.001536,
          "bytes_transferred": 67178332160
        },
        {
          "bandwidth_mbps": 19714.087445635047,
          "retransmits": 348,
          "duration_sec": 30.001406,
          "bytes_transferred": 73931292672
        },
        {
          "bandwidth_mbps": 19489.048247109433,
          "retransmits": 242,
          "duration_sec": 30.001445,
          "bytes_transferred": 73087451136
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 19038.81348029157,
        "bandwidth_mbps_min": 17913.30474813023,
        "bandwidth_mbps_max": 19714.087445635047,
        "bandwidth_mbps_stddev": 801.1400584362393,
        "retransmits_avg": 457
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 4965.359545040305,
          "retransmits": 4,
          "duration_sec": 30.001251,
          "bytes_transferred": 18620874752
        },
        {
          "bandwidth_mbps": 4965.425971538807,
          "retransmits": 1,
          "duration_sec": 30.001272,
          "bytes_transferred": 18621136896
        },
        {
          "bandwidth_mbps": 4965.57140315343,
          "retransmits": 0,
          "duration_sec": 30.001238,
          "bytes_transferred": 18621661184
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 4965.452306577514,
        "bandwidth_mbps_min": 4965.359545040305,
        "bandwidth_mbps_max": 4965.57140315343,
        "bandwidth_mbps_stddev": 0.08847265386147263,
        "retransmits_avg": 1.6666666666666667
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "c8gn",
    "instance_type": "c8gn.xlarge",
    "kernel_version": "6.12.73-95.123.amzn2023.aarch64",
    "overhead": {
      "bandwidth_pct": 89.20721131002327,
      "retransmits_pct": -324.653537563822
    },
    "overhead_single": {
      "bandwidth_pct": 59.18710569188556,
      "retransmits_pct": -15279.999999999998
    },
    "region": "us-west-2",
    "source": "eks/c8gn/results/c8gn.xlarge.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-c8gn-xlarge 6.12.73-95.123.amzn2023.aarch64 #1 SMP Tue Feb 24 23:31:19 UTC 2026 aarch64 aarch64 aarch64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.96.90.85",
      "hops": [
        {
          "hop": 1,
          "host": "100.96.90.85",
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
          "bandwidth_mbps": 2049.4367805161132,
          "retransmits": 1911,
          "duration_sec": 30.000585,
          "bytes_transferred": 7685537792
        },
        {
          "bandwidth_mbps": 2057.7278168124208,
          "retransmits": 1274,
          "duration_sec": 30.000986,
          "bytes_transferred": 7716732928
        },
        {
          "bandwidth_mbps": 2057.2921266914814,
          "retransmits": 2637,
          "duration_sec": 30.001733,
          "bytes_transferred": 7715291136
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2054.818908006672,
        "bandwidth_mbps_min": 2049.4367805161132,
        "bandwidth_mbps_max": 2057.7278168124208,
        "bandwidth_mbps_stddev": 3.8098931493189045,
        "retransmits_avg": 1940.6666666666667
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 2033.487867593299,
          "retransmits": 283,
          "duration_sec": 30.001261,
          "bytes_transferred": 7625900032
        },
        {
          "bandwidth_mbps": 2028.6156197401806,
          "retransmits": 321,
          "duration_sec": 30.000435,
          "bytes_transferred": 7607418880
        },
        {
          "bandwidth_mbps": 2017.5309180764539,
          "retransmits": 165,
          "duration_sec": 30.000508,
          "bytes_transferred": 7565869056
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 2026.5448018033112,
        "bandwidth_mbps_min": 2017.5309180764539,
        "bandwidth_mbps_max": 2033.487867593299,
        "bandwidth_mbps_stddev": 6.676939152362682,
        "retransmits_avg": 256.3333333333333
      }
    },
    "tailscale_version": "1.94.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "vcpus": 4,
    "zone": "us-west-2a"
  },
  {
    "baseline_mtr": {
      "target_ip": "10.0.1.38",
      "hops": [
        {
          "hop": 1,
          "host": "10.0.1.12",
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
          "host": "10.0.1.206",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.2,
          "avg_ms": 0.2,
          "best_ms": 0.2,
          "worst_ms": 0.3,
          "stdev_ms": 0
        },
        {
          "hop": 3,
          "host": "10.0.1.38",
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
          "bandwidth_mbps": 12412.246054553227,
          "retransmits": 22499,
          "duration_sec": 30.001672,
          "bytes_transferred": 46548516864
        },
        {
          "bandwidth_mbps": 12412.56496350175,
          "retransmits": 22438,
          "duration_sec": 30.001577,
          "bytes_transferred": 46549565440
        },
        {
          "bandwidth_mbps": 12412.289693257215,
          "retransmits": 22538,
          "duration_sec": 30.001651,
          "bytes_transferred": 46548647936
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 12412.36690377073,
        "bandwidth_mbps_min": 12412.246054553227,
        "bandwidth_mbps_max": 12412.56496350175,
        "bandwidth_mbps_stddev": 0.14117796549089787,
        "retransmits_avg": 22491.666666666668
      }
    },
    "baseline_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 9529.915726352234,
          "retransmits": 320,
          "duration_sec": 30.001312,
          "bytes_transferred": 35738746880
        },
        {
          "bandwidth_mbps": 9530.433002745809,
          "retransmits": 286,
          "duration_sec": 30.001334,
          "bytes_transferred": 35740712960
        },
        {
          "bandwidth_mbps": 9530.461910528173,
          "retransmits": 297,
          "duration_sec": 30.001243,
          "bytes_transferred": 35740712960
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 9530.270213208738,
        "bandwidth_mbps_min": 9529.915726352234,
        "bandwidth_mbps_max": 9530.461910528173,
        "bandwidth_mbps_stddev": 0.25093772606794534,
        "retransmits_avg": 301
      }
    },
    "cloud_provider": "eks",
    "connection_type": "direct",
    "date": "2026-03-23",
    "ena_express": false,
    "environment": "container",
    "instance_family": "m6i",
    "instance_type": "m6i.xlarge",
    "kernel_version": "6.12.73-95.123.amzn2023.x86_64",
    "overhead": {
      "bandwidth_pct": 87.90011047598063,
      "retransmits_pct": 90.10892923304927
    },
    "overhead_single": {
      "bandwidth_pct": 84.65285294775904,
      "retransmits_pct": -234.6622369878184
    },
    "region": "us-west-2",
    "source": "eks/m6i/results/m6i.xlarge.json",
    "system_config": {
      "tcp_congestion_control": "cubic",
      "cpu_governor": "",
      "gro_udp_forwarding": false,
      "mtu_underlay": 9001,
      "mtu_tailscale": 1280,
      "tcp_rmem": "4096\t131072\t6291456",
      "tcp_wmem": "4096\t20480\t4194304",
      "kernel_full": "Linux tb-eks-server-m6i-xlarge 6.12.73-95.123.amzn2023.x86_64 #1 SMP PREEMPT_DYNAMIC Tue Feb 24 23:31:49 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux"
    },
    "tailscale_mtr": {
      "target_ip": "100.123.67.74",
      "hops": [
        {
          "hop": 1,
          "host": "100.123.67.74",
          "loss_pct": 0,
          "snt": 100,
          "last_ms": 0.4,
          "avg_ms": 0.6,
          "best_ms": 0.4,
          "worst_ms": 0.9,
          "stdev_ms": 0.1
        }
      ]
    },
    "tailscale_tcp": {
      "runs": [
        {
          "bandwidth_mbps": 1465.5032519413583,
          "retransmits": 910,
          "duration_sec": 30.001156,
          "bytes_transferred": 5495848960
        },
        {
          "bandwidth_mbps": 1522.6781330262013,
          "retransmits": 2657,
          "duration_sec": 30.000571,
          "bytes_transferred": 5710151680
        },
        {
          "bandwidth_mbps": 1517.46666304905,
          "retransmits": 3107,
          "duration_sec": 30.001334,
          "bytes_transferred": 5690753024
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1501.8826826722034,
        "bandwidth_mbps_min": 1465.5032519413583,
        "bandwidth_mbps_max": 1522.6781330262013,
        "bandwidth_mbps_stddev": 25.811975128558025,
        "retransmits_avg": 2224.6666666666665
      }
    },
    "tailscale_tcp_single": {
      "runs": [
        {
          "bandwidth_mbps": 1455.010443428294,
          "retransmits": 831,
          "duration_sec": 30.000589,
          "bytes_transferred": 5456396288
        },
        {
          "bandwidth_mbps": 1467.96740099938,
          "retransmits": 687,
          "duration_sec": 30.000797,
          "bytes_transferred": 5505024000
        },
        {
          "bandwidth_mbps": 1464.8959078635137,
          "retransmits": 1504,
          "duration_sec": 30.00071,
          "bytes_transferred": 5493489664
        }
      ],
      "summary": {
        "bandwidth_mbps_avg": 1462.6245840970626,
        "bandwidth_mbps_min": 1455.010443428294,
        "bandwidth_mbps_max": 1467.96740099938,
        "bandwidth_mbps_stddev": 5.52810221286148,
        "retransmits_avg": 1007.3333333333334
      }
    },
    "tailscale_version": "1.94.2",
    "test_config": {
      "iperf_duration_sec": 30,
      "iperf_parallel_streams": 4,
      "iperf_iterations": 3,
      "mtr_cycles": 100
    },
    "vcpus": 4,
    "zone": "us-west-2a"
  }
];
