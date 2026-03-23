package provider

import (
	"context"

	"tailscale.com/tsnet"
)

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

// K8sOperatorProvider is an optional interface that K8s providers can implement
// to support installing the Tailscale operator and connecting via API server proxy.
type K8sOperatorProvider interface {
	Provider
	// InstallOperator installs the Tailscale operator with API server proxy mode.
	InstallOperator(ctx context.Context, cfg OperatorInstallConfig) error
	// OperatorProxyFQDN returns the FQDN of the API server proxy, or empty if not installed.
	OperatorProxyFQDN() string
	// SetTsnetServer provides the tsnet server for tailnet-routed K8s API access.
	SetTsnetServer(srv *tsnet.Server)
}

// OperatorInstallConfig configures the Tailscale operator installation.
type OperatorInstallConfig struct {
	OAuthClientID     string
	OAuthClientSecret string
	Tag               string
	TailnetDNS        string // e.g. "tailXXXX.ts.net"
	TsnetSrv          *tsnet.Server
}

// PairOptions configures a server/client VM pair.
type PairOptions struct {
	InstanceType   string
	UserData       string // server user-data (also used for client if ClientUserData is empty)
	ClientUserData string // client-specific user-data; if empty, UserData is used for both
	Networking     *NetworkingOutput
	BenchImage     string // K8s benchmark container image (empty = provider default)
	TSImage        string // K8s tailscale sidecar image (empty = provider default)
}

// ClientUD returns the user-data to use for the client VM.
func (o PairOptions) ClientUD() string {
	if o.ClientUserData != "" {
		return o.ClientUserData
	}
	return o.UserData
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
