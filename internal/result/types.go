package result

type BenchmarkResult struct {
	CloudProvider      string        `json:"cloud_provider"`
	InstanceFamily     string        `json:"instance_family"`
	InstanceType       string        `json:"instance_type"`
	VCPUs              int           `json:"vcpus"`
	Region             string        `json:"region"`
	Zone               string        `json:"zone"`
	Date               string        `json:"date"`
	TSVersion          string        `json:"tailscale_version"`
	KernelVersion      string        `json:"kernel_version"`
	ConnectionType     string        `json:"connection_type"`
	ENAExpress         bool          `json:"ena_express"`
	Environment        string        `json:"environment"` // "vm" or "container"
	SystemConfig       *SystemConfig `json:"system_config"`
	TestConfig         *TestConfig   `json:"test_config"`
	BaselineTCP        *TCPResult    `json:"baseline_tcp"`
	TailscaleTCP       *TCPResult    `json:"tailscale_tcp"`
	Overhead           *Overhead     `json:"overhead"`
	BaselineTCPSingle  *TCPResult    `json:"baseline_tcp_single"`
	TailscaleTCPSingle *TCPResult    `json:"tailscale_tcp_single"`
	OverheadSingle     *Overhead     `json:"overhead_single"`
	BaselineMTR        *MTRResult    `json:"baseline_mtr"`
	TailscaleMTR       *MTRResult    `json:"tailscale_mtr"`
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
	IPerfDurationSec     int `json:"iperf_duration_sec"`
	IPerfParallelStreams int `json:"iperf_parallel_streams"`
	IPerfIterations      int `json:"iperf_iterations"`
	MTRCycles            int `json:"mtr_cycles"`
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
