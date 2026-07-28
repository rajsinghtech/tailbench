//go:build azure && !k8s && !aws && !gcp

package provider

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"strings"

	azcompute "github.com/pulumi/pulumi-azure-native-sdk/compute/v3"
	aznetwork "github.com/pulumi/pulumi-azure-native-sdk/network/v3"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
	"github.com/pulumi/pulumi/sdk/v3/go/common/workspace"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type AzureProvider struct {
	Location      string
	ResourceGroup string
	SSHUser       string
	SSHPubKey     string
	StateDir      string
	RunID         string
	ExpiresAt     string

	skuCache []azureSKU // cached SKU list, loaded once
}

var _ RunScopedProvider = (*AzureProvider)(nil)

func (p *AzureProvider) Name() string             { return "azure" }
func (p *AzureProvider) RunScopedResources() bool { return p.RunID != "" }
func (p *AzureProvider) ManagesNetworking() bool  { return true }

func (p *AzureProvider) networkStackName() string {
	return scopedName("tailbench-azure-networking", p.RunID)
}

func (p *AzureProvider) pairStackName(instanceType string) string {
	safeType := strings.ReplaceAll(strings.ReplaceAll(instanceType, ".", "-"), "_", "-")
	return scopedName("tailbench-azure-"+safeType, p.RunID)
}

func (p *AzureProvider) resourceTags() pulumi.StringMap {
	tags := pulumi.StringMap{
		"Project":           pulumi.String("tailbench"),
		"TailbenchProvider": pulumi.String(p.Name()),
	}
	if p.RunID != "" {
		tags["TailbenchRunID"] = pulumi.String(p.RunID)
	}
	if p.ExpiresAt != "" {
		tags["TailbenchExpiresAt"] = pulumi.String(p.ExpiresAt)
	}
	return tags
}

func (p *AzureProvider) projectOpts() []auto.LocalWorkspaceOption {
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

func (p *AzureProvider) SetupNetworking(ctx context.Context) (*NetworkingOutput, error) {
	vnetName := scopedName("tailbench-vnet", p.RunID)
	subnetName := scopedName("tailbench-subnet", p.RunID)
	nsgName := scopedName("tailbench-nsg", p.RunID)
	program := func(pCtx *pulumi.Context) error {
		vnet, err := aznetwork.NewVirtualNetwork(pCtx, vnetName, &aznetwork.VirtualNetworkArgs{
			ResourceGroupName:  pulumi.String(p.ResourceGroup),
			VirtualNetworkName: pulumi.String(vnetName),
			Location:           pulumi.String(p.Location),
			AddressSpace: aznetwork.AddressSpaceArgs{
				AddressPrefixes: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
			},
			Tags: p.resourceTags(),
		})
		if err != nil {
			return err
		}

		subnet, err := aznetwork.NewSubnet(pCtx, subnetName, &aznetwork.SubnetArgs{
			ResourceGroupName:  pulumi.String(p.ResourceGroup),
			VirtualNetworkName: vnet.Name,
			SubnetName:         pulumi.String(subnetName),
			AddressPrefix:      pulumi.String("10.0.1.0/24"),
		})
		if err != nil {
			return err
		}

		nsg, err := aznetwork.NewNetworkSecurityGroup(pCtx, nsgName, &aznetwork.NetworkSecurityGroupArgs{
			ResourceGroupName:        pulumi.String(p.ResourceGroup),
			NetworkSecurityGroupName: pulumi.String(nsgName),
			Location:                 pulumi.String(p.Location),
			Tags:                     p.resourceTags(),
		})
		if err != nil {
			return err
		}

		_, err = aznetwork.NewSecurityRule(pCtx, "AllowSSH", &aznetwork.SecurityRuleArgs{
			ResourceGroupName:        pulumi.String(p.ResourceGroup),
			NetworkSecurityGroupName: nsg.Name,
			SecurityRuleName:         pulumi.String("AllowSSH"),
			Priority:                 pulumi.Int(1000),
			Protocol:                 pulumi.String("Tcp"),
			Access:                   pulumi.String("Allow"),
			Direction:                pulumi.String("Inbound"),
			SourceAddressPrefix:      pulumi.String("*"),
			SourcePortRange:          pulumi.String("*"),
			DestinationAddressPrefix: pulumi.String("*"),
			DestinationPortRange:     pulumi.String("22"),
		})
		if err != nil {
			return err
		}

		_, err = aznetwork.NewSecurityRule(pCtx, "AllowVNetInternal", &aznetwork.SecurityRuleArgs{
			ResourceGroupName:        pulumi.String(p.ResourceGroup),
			NetworkSecurityGroupName: nsg.Name,
			SecurityRuleName:         pulumi.String("AllowVNetInternal"),
			Priority:                 pulumi.Int(1100),
			Protocol:                 pulumi.String("*"),
			Access:                   pulumi.String("Allow"),
			Direction:                pulumi.String("Inbound"),
			SourceAddressPrefix:      pulumi.String("VirtualNetwork"),
			SourcePortRange:          pulumi.String("*"),
			DestinationAddressPrefix: pulumi.String("VirtualNetwork"),
			DestinationPortRange:     pulumi.String("*"),
		})
		if err != nil {
			return err
		}

		_, err = aznetwork.NewSecurityRule(pCtx, "AllowWireGuardUDP", &aznetwork.SecurityRuleArgs{
			ResourceGroupName:        pulumi.String(p.ResourceGroup),
			NetworkSecurityGroupName: nsg.Name,
			SecurityRuleName:         pulumi.String("AllowWireGuardUDP"),
			Priority:                 pulumi.Int(1200),
			Protocol:                 pulumi.String("Udp"),
			Access:                   pulumi.String("Allow"),
			Direction:                pulumi.String("Inbound"),
			SourceAddressPrefix:      pulumi.String("*"),
			SourcePortRange:          pulumi.String("*"),
			DestinationAddressPrefix: pulumi.String("*"),
			DestinationPortRange:     pulumi.String("41641"),
		})
		if err != nil {
			return err
		}

		// iperf3 control (TCP) + data (UDP) for the forwarding-pps sink, reached
		// on its public IP via the exit node. Protocol "*" covers both.
		_, err = aznetwork.NewSecurityRule(pCtx, "AllowIperfPPS", &aznetwork.SecurityRuleArgs{
			ResourceGroupName:        pulumi.String(p.ResourceGroup),
			NetworkSecurityGroupName: nsg.Name,
			SecurityRuleName:         pulumi.String("AllowIperfPPS"),
			Priority:                 pulumi.Int(1300),
			Protocol:                 pulumi.String("*"),
			Access:                   pulumi.String("Allow"),
			Direction:                pulumi.String("Inbound"),
			SourceAddressPrefix:      pulumi.String("*"),
			SourcePortRange:          pulumi.String("*"),
			DestinationAddressPrefix: pulumi.String("*"),
			DestinationPortRange:     pulumi.String("15201"),
		})
		if err != nil {
			return err
		}

		// Tailscale peer-relay UDP port for the relay-throughput benchmark.
		_, err = aznetwork.NewSecurityRule(pCtx, "AllowRelayUDP", &aznetwork.SecurityRuleArgs{
			ResourceGroupName:        pulumi.String(p.ResourceGroup),
			NetworkSecurityGroupName: nsg.Name,
			SecurityRuleName:         pulumi.String("AllowRelayUDP"),
			Priority:                 pulumi.Int(1400),
			Protocol:                 pulumi.String("Udp"),
			Access:                   pulumi.String("Allow"),
			Direction:                pulumi.String("Inbound"),
			SourceAddressPrefix:      pulumi.String("*"),
			SourcePortRange:          pulumi.String("*"),
			DestinationAddressPrefix: pulumi.String("*"),
			DestinationPortRange:     pulumi.String("41642"),
		})
		if err != nil {
			return err
		}

		pCtx.Export("vnet_name", vnet.Name)
		pCtx.Export("subnet_id", subnet.ID())
		pCtx.Export("nsg_id", nsg.ID())
		return nil
	}

	stackName := p.networkStackName()
	stack, err := auto.UpsertStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return nil, fmt.Errorf("create networking stack: %w", err)
	}

	if err := stack.SetConfig(ctx, "azure-native:location", auto.ConfigValue{Value: p.Location}); err != nil {
		return nil, fmt.Errorf("set azure-native:location: %w", err)
	}

	result, err := stack.Up(ctx, optup.ProgressStreams(log.Writer()))
	if err != nil {
		return nil, fmt.Errorf("networking stack up: %w", err)
	}

	getStr := func(key string) string {
		v, ok := result.Outputs[key]
		if !ok {
			return ""
		}
		s, _ := v.Value.(string)
		return s
	}

	vnetName := getStr("vnet_name")
	return &NetworkingOutput{
		StackName:  stackName,
		ProviderID: vnetName,
		Values: map[string]string{
			"vnet_name": vnetName,
			"subnet_id": getStr("subnet_id"),
			"nsg_id":    getStr("nsg_id"),
		},
	}, nil
}

func (p *AzureProvider) CreatePair(ctx context.Context, opts PairOptions) (*PairOutput, error) {
	safeType := strings.ReplaceAll(strings.ReplaceAll(opts.InstanceType, ".", "-"), "_", "-")
	stackName := p.pairStackName(opts.InstanceType)

	serverName := scopedName(fmt.Sprintf("tb-%s-server", safeType), p.RunID)
	clientName := scopedName(fmt.Sprintf("tb-%s-client", safeType), p.RunID)
	routerName := scopedName(fmt.Sprintf("tb-%s-router", safeType), p.RunID)

	subnetID := opts.Networking.Values["subnet_id"]
	nsgID := opts.Networking.Values["nsg_id"]
	serverUserData := base64.StdEncoding.EncodeToString([]byte(opts.UserData))
	clientUserData := base64.StdEncoding.EncodeToString([]byte(opts.ClientUD()))
	routerUserData := base64.StdEncoding.EncodeToString([]byte(opts.RouterUD()))

	program := func(pCtx *pulumi.Context) error {
		nodes := []string{serverName, clientName}
		if opts.WantRouter {
			nodes = append(nodes, routerName)
		}
		for _, name := range nodes {
			encodedUserData := serverUserData
			switch name {
			case clientName:
				encodedUserData = clientUserData
			case routerName:
				encodedUserData = routerUserData
			}
			pip, err := aznetwork.NewPublicIPAddress(pCtx, name+"-pip", &aznetwork.PublicIPAddressArgs{
				ResourceGroupName:        pulumi.String(p.ResourceGroup),
				PublicIpAddressName:      pulumi.String(name + "-pip"),
				Location:                 pulumi.String(p.Location),
				PublicIPAllocationMethod: pulumi.String("Static"),
				Sku: aznetwork.PublicIPAddressSkuArgs{
					Name: pulumi.String("Standard"),
				},
				Tags: p.resourceTags(),
			})
			if err != nil {
				return err
			}

			nic, err := aznetwork.NewNetworkInterface(pCtx, name+"-nic", &aznetwork.NetworkInterfaceArgs{
				ResourceGroupName:    pulumi.String(p.ResourceGroup),
				NetworkInterfaceName: pulumi.String(name + "-nic"),
				Location:             pulumi.String(p.Location),
				IpConfigurations: aznetwork.NetworkInterfaceIPConfigurationArray{
					aznetwork.NetworkInterfaceIPConfigurationArgs{
						Name:                      pulumi.String("ipconfig1"),
						PrivateIPAllocationMethod: pulumi.String("Dynamic"),
						Subnet: aznetwork.SubnetTypeArgs{
							Id: pulumi.String(subnetID),
						},
						PublicIPAddress: aznetwork.PublicIPAddressTypeArgs{
							Id: pip.ID().ToStringOutput().ApplyT(func(id string) *string { return &id }).(pulumi.StringPtrInput),
						},
					},
				},
				NetworkSecurityGroup: aznetwork.NetworkSecurityGroupTypeArgs{
					Id: pulumi.String(nsgID),
				},
				Tags: p.resourceTags(),
			})
			if err != nil {
				return err
			}

			_, err = azcompute.NewVirtualMachine(pCtx, name, &azcompute.VirtualMachineArgs{
				ResourceGroupName: pulumi.String(p.ResourceGroup),
				VmName:            pulumi.String(name),
				Location:          pulumi.String(p.Location),
				HardwareProfile: azcompute.HardwareProfileArgs{
					VmSize: pulumi.String(opts.InstanceType),
				},
				StorageProfile: azcompute.StorageProfileArgs{
					ImageReference: azureImageRef(opts.InstanceType),
					OsDisk: azcompute.OSDiskArgs{
						CreateOption: pulumi.String("FromImage"),
						DiskSizeGB:   pulumi.Int(50),
						ManagedDisk: azcompute.ManagedDiskParametersArgs{
							StorageAccountType: pulumi.String("Premium_LRS"),
						},
					},
				},
				OsProfile: azcompute.OSProfileArgs{
					ComputerName:  pulumi.String(name),
					AdminUsername: pulumi.String(p.SSHUser),
					CustomData:    pulumi.String(encodedUserData),
					LinuxConfiguration: azcompute.LinuxConfigurationArgs{
						DisablePasswordAuthentication: pulumi.Bool(true),
						Ssh: azcompute.SshConfigurationArgs{
							PublicKeys: azcompute.SshPublicKeyTypeArray{
								azcompute.SshPublicKeyTypeArgs{
									Path:    pulumi.Sprintf("/home/%s/.ssh/authorized_keys", p.SSHUser),
									KeyData: pulumi.String(p.SSHPubKey),
								},
							},
						},
					},
				},
				NetworkProfile: azcompute.NetworkProfileArgs{
					NetworkInterfaces: azcompute.NetworkInterfaceReferenceArray{
						azcompute.NetworkInterfaceReferenceArgs{
							Id:      nic.ID().ToStringOutput().ApplyT(func(id string) *string { return &id }).(pulumi.StringPtrInput),
							Primary: pulumi.Bool(true),
						},
					},
				},
				Tags: p.resourceTags(),
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
			pCtx.Export(prefix+"_ip", pip.IpAddress)
			pCtx.Export(prefix+"_lan_ip",
				nic.IpConfigurations.Index(pulumi.Int(0)).PrivateIPAddress())
		}
		return nil
	}

	stack, err := auto.UpsertStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return nil, fmt.Errorf("create stack %s: %w", stackName, err)
	}

	if err := stack.SetConfig(ctx, "azure-native:location", auto.ConfigValue{Value: p.Location}); err != nil {
		return nil, fmt.Errorf("set azure-native:location: %w", err)
	}

	result, err := stack.Up(ctx, optup.ProgressStreams(log.Writer()), optup.Refresh())
	if err != nil {
		return nil, fmt.Errorf("stack up %s: %w", stackName, err)
	}

	getStr := func(key string) string {
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
		ServerIP:    getStr("server_ip"),
		ClientIP:    getStr("client_ip"),
		ServerLANIP: getStr("server_lan_ip"),
		ClientLANIP: getStr("client_lan_ip"),
		StackName:   stackName,
	}
	if opts.WantRouter {
		out.RouterName = routerName
		out.RouterIP = getStr("router_ip")
		out.RouterLANIP = getStr("router_lan_ip")
	}
	return out, nil
}

func (p *AzureProvider) DestroyPair(ctx context.Context, instanceType string) error {
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
	if _, err := stack.Destroy(ctx, optdestroy.ProgressStreams(log.Writer()), optdestroy.ContinueOnError()); err != nil {
		return fmt.Errorf("destroy stack %s: %w", stackName, err)
	}
	if err := stack.Workspace().RemoveStack(ctx, stackName); err != nil {
		return fmt.Errorf("remove stack %s: %w", stackName, err)
	}
	return nil
}

func (p *AzureProvider) TeardownNetworking(ctx context.Context) error {
	stackName := p.networkStackName()
	program := func(_ *pulumi.Context) error { return nil }

	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if auto.IsSelectStack404Error(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("select networking stack: %w", err)
	}
	if _, err := stack.Destroy(ctx, optdestroy.ProgressStreams(log.Writer())); err != nil {
		return fmt.Errorf("destroy networking stack: %w", err)
	}
	return stack.Workspace().RemoveStack(ctx, stackName)
}

func (p *AzureProvider) ListFamilies() []string {
	return listAzureFamilies()
}

func (p *AzureProvider) ListInstances(ctx context.Context, family string) ([]InstanceInfo, error) {
	return listAzureInstances(ctx, p.Location, family, &p.skuCache)
}

func (p *AzureProvider) GetVCPUs(_ context.Context, instanceType string) (int, error) {
	return getAzureVCPUs(instanceType)
}

// azureImageRef returns the correct Ubuntu image for the instance type.
// ARM instances (containing "ps" before version suffix like Dps_v6, Dpds_v6, Eps_v6)
// need the ARM64 SKU.
func azureImageRef(instanceType string) azcompute.ImageReferenceArgs {
	sku := "server"
	if isAzureARM(instanceType) {
		sku = "server-arm64"
	}
	return azcompute.ImageReferenceArgs{
		Publisher: pulumi.String("Canonical"),
		Offer:     pulumi.String("ubuntu-24_04-lts"),
		Sku:       pulumi.String(sku),
		Version:   pulumi.String("latest"),
	}
}

// isAzureARM detects ARM-based Azure instance types.
// ARM types contain "p" in the size segment: Dps_v6, Dpds_v6, Eps_v6, etc.
func isAzureARM(instanceType string) bool {
	lower := strings.ToLower(instanceType)
	// Standard_D<N>ps_v6, Standard_E<N>pds_v6, etc.
	return strings.Contains(lower, "ps_") || strings.Contains(lower, "pds_") ||
		strings.Contains(lower, "pls_") || strings.Contains(lower, "pas_")
}

func (p *AzureProvider) IsQuotaError(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "QuotaExceeded") ||
		strings.Contains(s, "SkuNotAvailable") ||
		strings.Contains(s, "AllocationFailed") ||
		strings.Contains(s, "PublicIPCountLimitReached") ||
		strings.Contains(s, "OperationNotAllowed") && strings.Contains(s, "quota") ||
		strings.Contains(s, "sufficient capacity")
}
