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

	skuCache []azureSKU // cached SKU list, loaded once
}

var _ Provider = (*AzureProvider)(nil)

func (p *AzureProvider) Name() string { return "azure" }

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
	program := func(pCtx *pulumi.Context) error {
		vnet, err := aznetwork.NewVirtualNetwork(pCtx, "tailbench-vnet", &aznetwork.VirtualNetworkArgs{
			ResourceGroupName:  pulumi.String(p.ResourceGroup),
			VirtualNetworkName: pulumi.String("tailbench-vnet"),
			Location:           pulumi.String(p.Location),
			AddressSpace: aznetwork.AddressSpaceArgs{
				AddressPrefixes: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
			},
			Tags: pulumi.StringMap{"Project": pulumi.String("tailbench")},
		})
		if err != nil {
			return err
		}

		subnet, err := aznetwork.NewSubnet(pCtx, "tailbench-subnet", &aznetwork.SubnetArgs{
			ResourceGroupName:  pulumi.String(p.ResourceGroup),
			VirtualNetworkName: vnet.Name,
			SubnetName:         pulumi.String("tailbench-subnet"),
			AddressPrefix:      pulumi.String("10.0.1.0/24"),
		})
		if err != nil {
			return err
		}

		nsg, err := aznetwork.NewNetworkSecurityGroup(pCtx, "tailbench-nsg", &aznetwork.NetworkSecurityGroupArgs{
			ResourceGroupName:        pulumi.String(p.ResourceGroup),
			NetworkSecurityGroupName: pulumi.String("tailbench-nsg"),
			Location:                 pulumi.String(p.Location),
			Tags:                     pulumi.StringMap{"Project": pulumi.String("tailbench")},
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

		pCtx.Export("vnet_name", vnet.Name)
		pCtx.Export("subnet_id", subnet.ID())
		pCtx.Export("nsg_id", nsg.ID())
		return nil
	}

	stack, err := auto.UpsertStackInlineSource(ctx, "tailbench-azure-networking", "tailbench", program, p.projectOpts()...)
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

	return &NetworkingOutput{Values: map[string]string{
		"vnet_name": getStr("vnet_name"),
		"subnet_id": getStr("subnet_id"),
		"nsg_id":    getStr("nsg_id"),
	}}, nil
}

func (p *AzureProvider) CreatePair(ctx context.Context, opts PairOptions) (*PairOutput, error) {
	safeType := strings.ReplaceAll(strings.ReplaceAll(opts.InstanceType, ".", "-"), "_", "-")
	stackName := fmt.Sprintf("tailbench-azure-%s", safeType)

	serverName := fmt.Sprintf("tb-%s-server", safeType)
	clientName := fmt.Sprintf("tb-%s-client", safeType)

	subnetID := opts.Networking.Values["subnet_id"]
	nsgID := opts.Networking.Values["nsg_id"]
	serverUserData := base64.StdEncoding.EncodeToString([]byte(opts.UserData))
	clientUserData := base64.StdEncoding.EncodeToString([]byte(opts.ClientUD()))

	program := func(pCtx *pulumi.Context) error {
		for _, name := range []string{serverName, clientName} {
			encodedUserData := serverUserData
			if name == clientName {
				encodedUserData = clientUserData
			}
			pip, err := aznetwork.NewPublicIPAddress(pCtx, name+"-pip", &aznetwork.PublicIPAddressArgs{
				ResourceGroupName:        pulumi.String(p.ResourceGroup),
				PublicIpAddressName:      pulumi.String(name + "-pip"),
				Location:                 pulumi.String(p.Location),
				PublicIPAllocationMethod: pulumi.String("Static"),
				Sku: aznetwork.PublicIPAddressSkuArgs{
					Name: pulumi.String("Standard"),
				},
				Tags: pulumi.StringMap{"Project": pulumi.String("tailbench")},
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
				Tags: pulumi.StringMap{"Project": pulumi.String("tailbench")},
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
				Tags: pulumi.StringMap{"Project": pulumi.String("tailbench")},
			})
			if err != nil {
				return err
			}

			prefix := "server"
			if name == clientName {
				prefix = "client"
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

	// Cancel any incomplete operations from a previous crashed run.
	_ = stack.Cancel(ctx)

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

	return &PairOutput{
		ServerName:  serverName,
		ClientName:  clientName,
		ServerIP:    getStr("server_ip"),
		ClientIP:    getStr("client_ip"),
		ServerLANIP: getStr("server_lan_ip"),
		ClientLANIP: getStr("client_lan_ip"),
		StackName:   stackName,
	}, nil
}

func (p *AzureProvider) DestroyPair(ctx context.Context, instanceType string) error {
	safeType := strings.ReplaceAll(strings.ReplaceAll(instanceType, ".", "-"), "_", "-")
	stackName := fmt.Sprintf("tailbench-azure-%s", safeType)

	program := func(_ *pulumi.Context) error { return nil }

	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err == nil {
		_ = stack.Cancel(ctx)
		_, _ = stack.Destroy(ctx, optdestroy.ProgressStreams(log.Writer()), optdestroy.ContinueOnError())
		_ = stack.Workspace().RemoveStack(ctx, stackName)
	}
	return nil
}

func (p *AzureProvider) TeardownNetworking(ctx context.Context) error {
	program := func(_ *pulumi.Context) error { return nil }

	stack, err := auto.SelectStackInlineSource(ctx, "tailbench-azure-networking", "tailbench", program, p.projectOpts()...)
	if err != nil {
		return fmt.Errorf("select networking stack: %w", err)
	}
	if _, err := stack.Destroy(ctx, optdestroy.ProgressStreams(log.Writer())); err != nil {
		return fmt.Errorf("destroy networking stack: %w", err)
	}
	return stack.Workspace().RemoveStack(ctx, "tailbench-azure-networking")
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
