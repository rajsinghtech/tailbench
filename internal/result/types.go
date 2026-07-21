package result

type BenchmarkResult struct {
	CloudProvider        string        `json:"cloud_provider"`
	InstanceFamily       string        `json:"instance_family"`
	InstanceType         string        `json:"instance_type"`
	VCPUs                int           `json:"vcpus"`
	Region               string        `json:"region"`
	Zone                 string        `json:"zone"`
	Date                 string        `json:"date"`
	TSVersion            string        `json:"tailscale_version"`
	KernelVersion        string        `json:"kernel_version"`
	ConnectionType       string        `json:"connection_type"`
	ENAExpress           bool          `json:"ena_express"`
	Environment          string        `json:"environment"` // "vm" or "container"
	SystemConfig         *SystemConfig `json:"system_config"`
	TestConfig           *TestConfig   `json:"test_config"`
	BaselineTCP          *TCPResult    `json:"baseline_tcp"`
	TailscaleTCP         *TCPResult    `json:"tailscale_tcp"`
	Overhead             *Overhead     `json:"overhead"`
	BaselineTCPSingle    *TCPResult    `json:"baseline_tcp_single"`
	TailscaleTCPSingle   *TCPResult    `json:"tailscale_tcp_single"`
	OverheadSingle       *Overhead     `json:"overhead_single"`
	BaselineMTR          *MTRResult    `json:"baseline_mtr"`
	TailscaleMTR         *MTRResult    `json:"tailscale_mtr"`
	TransportMode        string        `json:"transport_mode,omitempty"`
	HTTPVersion          string        `json:"http_version,omitempty"`
	HAMode               string        `json:"ha_mode,omitempty"`
	FortioResult         *FortioResult `json:"fortio_result,omitempty"`
	L7Overhead           *L7Overhead   `json:"l7_overhead,omitempty"`
	ForwardPPS           *PPSResult    `json:"forward_pps,omitempty"`
	ForwardRole          string        `json:"forward_role,omitempty"`             // e.g. "exit-node", "proxygroup"
	ForwardOptimizations string        `json:"forwarding_optimizations,omitempty"` // "off" or "on"
}

type SystemConfig struct {
	TCPCongestionControl string `json:"tcp_congestion_control"`
	CPUGovernor          string `json:"cpu_governor"`
	GROUDPForwarding     bool   `json:"gro_udp_forwarding"`
	MTUUnderlay          int    `json:"mtu_underlay"`
	MTUTailscale         int    `json:"mtu_tailscale"`
	TCPRmem              string `json:"tcp_rmem"`
	TCPWmem              string `json:"tcp_wmem"`
	KernelFull           string `json:"kernel_full"`
	ContainerRuntime     string `json:"container_runtime,omitempty"`
}

type TestConfig struct {
	IPerfDurationSec     int     `json:"iperf_duration_sec"`
	IPerfParallelStreams int     `json:"iperf_parallel_streams"`
	IPerfIterations      int     `json:"iperf_iterations"`
	MTRCycles            int     `json:"mtr_cycles"`
	PPSDatagramSizes     []int   `json:"pps_datagram_sizes,omitempty"`
	PPSLossThresholdPct  float64 `json:"pps_loss_threshold_pct,omitempty"`
}

// PPSResult holds usable packets-per-second measurements for a forwarding role
// (e.g. an exit node), captured at several packet sizes. "Usable pps" for a size
// is the highest offered UDP rate sustained at or below the loss threshold.
//
// Note: iperf3 cannot emit a true mixed IMIX stream, so the IMIX figure uses a
// single IMIX-average datagram size and is labeled accordingly.
type PPSResult struct {
	Sizes            []PPSSizeResult `json:"sizes"`
	LossThresholdPct float64         `json:"loss_threshold_pct"`
	// LimitingResource records what capped the rate: "node-cpu",
	// "instance-pps-cap", or "unknown". A benchmark near the instance cap is not
	// measuring the node's own capacity.
	LimitingResource string `json:"limiting_resource,omitempty"`
}

// PPSSizeResult is the usable pps measured at one packet size.
type PPSSizeResult struct {
	Label         string  `json:"label"`          // "64", "imix-avg", "mtu"
	DatagramBytes int     `json:"datagram_bytes"` // UDP payload bytes offered to iperf3 (-l)
	OfferedPPS    float64 `json:"offered_pps"`    // offered rate at the accepted step
	UsablePPS     float64 `json:"usable_pps"`     // achieved rate at that step (loss <= threshold)
	LossPct       float64 `json:"loss_pct"`
	JitterMs      float64 `json:"jitter_ms"`
	Mbps          float64 `json:"mbps"`
}

type TCPResult struct {
	Runs    []IPerfRun    `json:"runs"`
	Summary *IPerfSummary `json:"summary"`
}

type IPerfRun struct {
	BandwidthMbps    float64 `json:"bandwidth_mbps"`
	Retransmits      int     `json:"retransmits"`
	DurationSec      float64 `json:"duration_sec"`
	BytesTransferred int64   `json:"bytes_transferred"`
}

type IPerfSummary struct {
	BandwidthMbpsAvg    float64 `json:"bandwidth_mbps_avg"`
	BandwidthMbpsMin    float64 `json:"bandwidth_mbps_min"`
	BandwidthMbpsMax    float64 `json:"bandwidth_mbps_max"`
	BandwidthMbpsStddev float64 `json:"bandwidth_mbps_stddev"`
	RetransmitsAvg      float64 `json:"retransmits_avg"`
}

type Overhead struct {
	BandwidthPct   float64 `json:"bandwidth_pct"`
	RetransmitsPct float64 `json:"retransmits_pct"`
}

type MTRResult struct {
	TargetIP string   `json:"target_ip"`
	Hops     []MTRHop `json:"hops"`
}

type MTRHop struct {
	Hop     int     `json:"hop"`
	Host    string  `json:"host"`
	LossPct float64 `json:"loss_pct"`
	Snt     int     `json:"snt"`
	LastMs  float64 `json:"last_ms"`
	AvgMs   float64 `json:"avg_ms"`
	BestMs  float64 `json:"best_ms"`
	WorstMs float64 `json:"worst_ms"`
	StdevMs float64 `json:"stdev_ms"`
}

type FortioResult struct {
	QPS            float64     `json:"qps"`
	AvgLatencyMs   float64     `json:"avg_latency_ms"`
	P50LatencyMs   float64     `json:"p50_latency_ms"`
	P90LatencyMs   float64     `json:"p90_latency_ms"`
	P99LatencyMs   float64     `json:"p99_latency_ms"`
	P999LatencyMs  float64     `json:"p999_latency_ms"`
	StatusCodes    map[int]int `json:"status_codes"`
	BytesPerSec    float64     `json:"bytes_per_sec"`
	ConnectionErrs int         `json:"connection_errors"` // non-200 response count (includes 5xx, 4xx, etc.)
}

type L7Overhead struct {
	QPS struct {
		Baseline  float64 `json:"baseline"`
		Tailscale float64 `json:"tailscale"`
		DeltaPct  float64 `json:"delta_pct"`
	} `json:"qps"`
	P50Latency struct {
		BaselineMs  float64 `json:"baseline_ms"`
		TailscaleMs float64 `json:"tailscale_ms"`
		DeltaPct    float64 `json:"delta_pct"`
	} `json:"p50_latency"`
	P99Latency struct {
		BaselineMs  float64 `json:"baseline_ms"`
		TailscaleMs float64 `json:"tailscale_ms"`
		DeltaPct    float64 `json:"delta_pct"`
	} `json:"p99_latency"`
}
