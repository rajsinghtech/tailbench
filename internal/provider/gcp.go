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
}

var _ Provider = (*GCPProvider)(nil)

func (p *GCPProvider) Name() string { return "gcp" }

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
	stackName := fmt.Sprintf("tailbench-gcp-%s", safeType)

	serverName := fmt.Sprintf("tb-%s-server", safeType)
	clientName := fmt.Sprintf("tb-%s-client", safeType)
	diskType, imageFamily := p.gcpInstanceProps(opts.InstanceType)

	program := func(pCtx *pulumi.Context) error {
		for _, name := range []string{serverName, clientName} {
			ud := opts.UserData
			if name == clientName {
				ud = opts.ClientUD()
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
				Labels: pulumi.StringMap{
					"project": pulumi.String("tailbench"),
				},
			})
			if err != nil {
				return err
			}

			prefix := "server"
			if name == clientName {
				prefix = "client"
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

	// Cancel any incomplete operations from a previous crashed run.
	_ = stack.Cancel(ctx)

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

	return &PairOutput{
		ServerName:  serverName,
		ClientName:  clientName,
		ServerIP:    getOutput("server_ip"),
		ClientIP:    getOutput("client_ip"),
		ServerLANIP: getOutput("server_lan_ip"),
		ClientLANIP: getOutput("client_lan_ip"),
		StackName:   stackName,
	}, nil
}

func (p *GCPProvider) DestroyPair(ctx context.Context, instanceType string) error {
	safeType := strings.ReplaceAll(instanceType, ".", "-")
	stackName := fmt.Sprintf("tailbench-gcp-%s", safeType)

	program := func(_ *pulumi.Context) error { return nil }

	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err == nil {
		_ = stack.Cancel(ctx)
		_, _ = stack.Destroy(ctx, optdestroy.ProgressStreams(), optdestroy.ContinueOnError())
		_ = stack.Workspace().RemoveStack(ctx, stackName)
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
