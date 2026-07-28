//go:build gcp && !k8s && !aws && !azure

package provider

import (
	"context"
	"fmt"
	"strings"

	"github.com/pulumi/pulumi-gcp/sdk/v9/go/gcp/compute"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
	"github.com/pulumi/pulumi/sdk/v3/go/common/workspace"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// GCPProvider manages GCP compute instances via Pulumi Automation API.
type GCPProvider struct {
	Project   string
	Zone      string
	Region    string
	Network   string
	Subnet    string
	SSHPubKey string
	SSHUser   string
	StateDir  string
	RunID     string
	ExpiresAt string
}

var _ RunScopedProvider = (*GCPProvider)(nil)

func (p *GCPProvider) Name() string             { return "gcp" }
func (p *GCPProvider) RunScopedResources() bool { return p.RunID != "" }
func (p *GCPProvider) ManagesNetworking() bool  { return false }

func (p *GCPProvider) pairStackName(instanceType string) string {
	safeType := strings.ReplaceAll(instanceType, ".", "-")
	return scopedName("tailbench-gcp-"+safeType, p.RunID)
}

func (p *GCPProvider) resourceLabels() pulumi.StringMap {
	labels := pulumi.StringMap{
		"project":            pulumi.String("tailbench"),
		"tailbench_provider": pulumi.String(p.Name()),
	}
	if suffix := runSuffix(p.RunID); suffix != "" {
		labels["tailbench_run_id"] = pulumi.String(suffix)
	}
	if expiry := runSuffix(p.ExpiresAt); expiry != "" {
		labels["tailbench_expires_at"] = pulumi.String(expiry)
	}
	return labels
}

func (p *GCPProvider) SetupNetworking(_ context.Context) (*NetworkingOutput, error) {
	return &NetworkingOutput{Values: map[string]string{
		"network": p.Network,
		"subnet":  p.Subnet,
	}}, nil
}

func (p *GCPProvider) gcpInstanceProps(machineType string) (diskType, imageFamily string) {
	family := strings.SplitN(machineType, "-", 2)[0]
	switch family {
	case "c4", "n4":
		return "hyperdisk-balanced", "ubuntu-2404-lts-amd64"
	case "c4a":
		return "hyperdisk-balanced", "ubuntu-2404-lts-arm64"
	default:
		return "pd-ssd", "ubuntu-2404-lts-amd64"
	}
}

func (p *GCPProvider) projectOpts() []auto.LocalWorkspaceOption {
	return []auto.LocalWorkspaceOption{
		auto.Project(workspace.Project{
			Name:    "tailbench",
			Runtime: workspace.NewProjectRuntimeInfo("go", nil),
			Backend: &workspace.ProjectBackend{URL: p.StateDir},
		}),
		auto.WorkDir(strings.TrimPrefix(p.StateDir, "file://")),
		auto.EnvVars(map[string]string{
			"PULUMI_CONFIG_PASSPHRASE": "",
		}),
	}
}

func (p *GCPProvider) CreatePair(ctx context.Context, opts PairOptions) (*PairOutput, error) {
	safeType := strings.ReplaceAll(opts.InstanceType, ".", "-")
	stackName := p.pairStackName(opts.InstanceType)

	serverName := scopedName(fmt.Sprintf("tb-%s-server", safeType), p.RunID)
	clientName := scopedName(fmt.Sprintf("tb-%s-client", safeType), p.RunID)
	routerName := scopedName(fmt.Sprintf("tb-%s-router", safeType), p.RunID)
	diskType, imageFamily := p.gcpInstanceProps(opts.InstanceType)

	program := func(pCtx *pulumi.Context) error {
		if opts.WantRouter {
			// The GCP network is bring-your-own, so open the iperf3 port for the
			// forwarding-pps sink (public IP, reached via the exit node), and the
			// Tailscale peer-relay UDP port (relay-throughput benchmark), here.
			firewallName := scopedName(fmt.Sprintf("tb-%s-pps", safeType), p.RunID)
			if _, err := compute.NewFirewall(pCtx, firewallName, &compute.FirewallArgs{
				Network:   pulumi.String(p.Network),
				Direction: pulumi.String("INGRESS"),
				Allows: compute.FirewallAllowArray{
					compute.FirewallAllowArgs{Protocol: pulumi.String("tcp"), Ports: pulumi.StringArray{pulumi.String("15201")}},
					compute.FirewallAllowArgs{Protocol: pulumi.String("udp"), Ports: pulumi.StringArray{pulumi.String("15201")}},
					compute.FirewallAllowArgs{Protocol: pulumi.String("udp"), Ports: pulumi.StringArray{pulumi.String("41642")}},
				},
				SourceRanges: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			}); err != nil {
				return err
			}
		}

		nodes := []string{serverName, clientName}
		if opts.WantRouter {
			nodes = append(nodes, routerName)
		}
		for _, name := range nodes {
			ud := opts.UserData
			switch name {
			case clientName:
				ud = opts.ClientUD()
			case routerName:
				ud = opts.RouterUD()
			}
			inst, err := compute.NewInstance(pCtx, name, &compute.InstanceArgs{
				MachineType: pulumi.String(opts.InstanceType),
				Zone:        pulumi.String(p.Zone),
				BootDisk: compute.InstanceBootDiskArgs{
					InitializeParams: compute.InstanceBootDiskInitializeParamsArgs{
						Image: pulumi.Sprintf("projects/ubuntu-os-cloud/global/images/family/%s", imageFamily),
						Size:  pulumi.Int(50),
						Type:  pulumi.String(diskType),
					},
				},
				NetworkInterfaces: compute.InstanceNetworkInterfaceArray{
					compute.InstanceNetworkInterfaceArgs{
						Network:    pulumi.String(p.Network),
						Subnetwork: pulumi.String(p.Subnet),
						AccessConfigs: compute.InstanceNetworkInterfaceAccessConfigArray{
							compute.InstanceNetworkInterfaceAccessConfigArgs{},
						},
					},
				},
				MetadataStartupScript: pulumi.StringPtr(ud),
				Metadata: pulumi.StringMap{
					"ssh-keys": pulumi.Sprintf("%s:%s", p.SSHUser, p.SSHPubKey),
				},
				Labels: p.resourceLabels(),
			})
			if err != nil {
				return err
			}

			prefix := "server"
			switch name {
			case clientName:
				prefix = "client"
			case routerName:
				prefix = "router"
			}
			pCtx.Export(prefix+"_ip",
				inst.NetworkInterfaces.Index(pulumi.Int(0)).AccessConfigs().Index(pulumi.Int(0)).NatIp())
			pCtx.Export(prefix+"_lan_ip",
				inst.NetworkInterfaces.Index(pulumi.Int(0)).NetworkIp())
		}
		return nil
	}

	stack, err := auto.UpsertStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return nil, fmt.Errorf("create stack %s: %w", stackName, err)
	}

	if err := stack.SetConfig(ctx, "gcp:project", auto.ConfigValue{Value: p.Project}); err != nil {
		return nil, fmt.Errorf("set gcp:project: %w", err)
	}
	if err := stack.SetConfig(ctx, "gcp:zone", auto.ConfigValue{Value: p.Zone}); err != nil {
		return nil, fmt.Errorf("set gcp:zone: %w", err)
	}
	if err := stack.SetConfig(ctx, "gcp:region", auto.ConfigValue{Value: p.Region}); err != nil {
		return nil, fmt.Errorf("set gcp:region: %w", err)
	}

	result, err := stack.Up(ctx, optup.ProgressStreams(), optup.Refresh())
	if err != nil {
		return nil, fmt.Errorf("stack up %s: %w", stackName, err)
	}

	getOutput := func(key string) string {
		v, ok := result.Outputs[key]
		if !ok {
			return ""
		}
		s, _ := v.Value.(string)
		return s
	}

	out := &PairOutput{
		ServerName:  serverName,
		ClientName:  clientName,
		ServerIP:    getOutput("server_ip"),
		ClientIP:    getOutput("client_ip"),
		ServerLANIP: getOutput("server_lan_ip"),
		ClientLANIP: getOutput("client_lan_ip"),
		StackName:   stackName,
	}
	if opts.WantRouter {
		out.RouterName = routerName
		out.RouterIP = getOutput("router_ip")
		out.RouterLANIP = getOutput("router_lan_ip")
	}
	return out, nil
}

func (p *GCPProvider) DestroyPair(ctx context.Context, instanceType string) error {
	stackName := p.pairStackName(instanceType)

	program := func(_ *pulumi.Context) error { return nil }

	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if auto.IsSelectStack404Error(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("select stack %s: %w", stackName, err)
	}
	if err := stack.Cancel(ctx); err != nil {
		return fmt.Errorf("cancel stack %s: %w", stackName, err)
	}
	if _, err := stack.Destroy(ctx, optdestroy.ProgressStreams(), optdestroy.ContinueOnError()); err != nil {
		return fmt.Errorf("destroy stack %s: %w", stackName, err)
	}
	if err := stack.Workspace().RemoveStack(ctx, stackName); err != nil {
		return fmt.Errorf("remove stack %s: %w", stackName, err)
	}
	return nil
}

func (p *GCPProvider) TeardownNetworking(_ context.Context) error {
	return nil
}

func (p *GCPProvider) ListFamilies() []string {
	return listGCPFamilies()
}

func (p *GCPProvider) ListInstances(ctx context.Context, family string) ([]InstanceInfo, error) {
	return listGCPInstances(ctx, p.Project, p.Zone, family)
}

func (p *GCPProvider) GetVCPUs(_ context.Context, instanceType string) (int, error) {
	return getGCPVCPUs(instanceType)
}

func (p *GCPProvider) IsQuotaError(err error) bool {
	return isGCPQuotaError(err)
}
