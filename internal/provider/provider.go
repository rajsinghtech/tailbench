package provider

import "context"

// Provider abstracts cloud-specific infrastructure provisioning via Pulumi.
type Provider interface {
	Name() string
	SetupNetworking(ctx context.Context) (*NetworkingOutput, error)
	CreatePair(ctx context.Context, opts PairOptions) (*PairOutput, error)
	DestroyPair(ctx context.Context, instanceType string) error
	TeardownNetworking(ctx context.Context) error
	ListFamilies() []string
	ListInstances(ctx context.Context, family string) ([]InstanceInfo, error)
	GetVCPUs(ctx context.Context, instanceType string) (int, error)
	IsQuotaError(err error) bool
}

// PairOptions configures a server/client VM pair.
type PairOptions struct {
	InstanceType string
	UserData     string
	Networking   *NetworkingOutput
	SSHKeyPath   string
	SSHPubKey    string
	SSHUser      string
	BenchImage   string // K8s benchmark container image (empty = provider default)
	TSImage      string // K8s tailscale sidecar image (empty = provider default)
}

// PairOutput holds provisioned pair metadata.
type PairOutput struct {
	ServerName       string
	ClientName       string
	ServerIP         string
	ClientIP         string
	ServerLANIP      string
	ClientLANIP      string
	StackName        string
	ServerInstanceID string
	ClientInstanceID string
	ServerENIID      string
	ClientENIID      string
	// K8s-specific (empty for VM providers)
	Namespace  string
	Kubeconfig string
}

// NetworkingOutput carries provider-specific networking references.
type NetworkingOutput struct {
	Values map[string]string
}

// InstanceInfo describes a single instance type.
type InstanceInfo struct {
	Type   string
	Family string
	VCPUs  int
}
