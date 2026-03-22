package provider

import (
	"context"
	"encoding/base64"
	"fmt"
	"os/exec"
	"regexp"
	"sort"
	"strconv"
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
}

func (p *AzureProvider) Name() string { return "azure" }

func (p *AzureProvider) projectOpts() []auto.LocalWorkspaceOption {
	return []auto.LocalWorkspaceOption{
		auto.Project(workspace.Project{
			Name:    "tailbench",
			Runtime: workspace.NewProjectRuntimeInfo("go", nil),
			Backend: &workspace.ProjectBackend{URL: p.StateDir},
		}),
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

	result, err := stack.Up(ctx, optup.ProgressStreams())
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
	encodedUserData := base64.StdEncoding.EncodeToString([]byte(opts.UserData))

	program := func(pCtx *pulumi.Context) error {
		for _, name := range []string{serverName, clientName} {
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
					ImageReference: azcompute.ImageReferenceArgs{
						Publisher: pulumi.String("Canonical"),
						Offer:    pulumi.String("ubuntu-24_04-lts"),
						Sku:      pulumi.String("server"),
						Version:  pulumi.String("latest"),
					},
					OsDisk: azcompute.OSDiskArgs{
						CreateOption: pulumi.String("FromImage"),
						DiskSizeGB:  pulumi.Int(50),
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

	result, err := stack.Up(ctx, optup.ProgressStreams())
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
	if err != nil {
		return fmt.Errorf("select stack %s: %w", stackName, err)
	}
	if _, err := stack.Destroy(ctx, optdestroy.ProgressStreams()); err != nil {
		return fmt.Errorf("destroy stack %s: %w", stackName, err)
	}
	return stack.Workspace().RemoveStack(ctx, stackName)
}

func (p *AzureProvider) TeardownNetworking(ctx context.Context) error {
	program := func(_ *pulumi.Context) error { return nil }

	stack, err := auto.SelectStackInlineSource(ctx, "tailbench-azure-networking", "tailbench", program, p.projectOpts()...)
	if err != nil {
		return fmt.Errorf("select networking stack: %w", err)
	}
	if _, err := stack.Destroy(ctx, optdestroy.ProgressStreams()); err != nil {
		return fmt.Errorf("destroy networking stack: %w", err)
	}
	return stack.Workspace().RemoveStack(ctx, "tailbench-azure-networking")
}

func (p *AzureProvider) ListFamilies() []string {
	return []string{"dsv5", "dasv5", "dpsv6", "dsv4", "fsv2", "fasv6", "falsv6", "famsv6", "fasv7", "falsv7", "famsv7", "esv4"}
}

var azureFamilyToSKU = map[string]string{
	"dsv5":   "standardDSv5Family",
	"dasv5":  "standardDASv5Family",
	"dpsv6":  "StandardDpsv6Family",
	"dsv4":   "standardDSv4Family",
	"fsv2":   "standardFSv2Family",
	"fasv6":  "StandardFasv6Family",
	"falsv6": "StandardFalsv6Family",
	"famsv6": "StandardFamsv6Family",
	"fasv7":  "StandardFasv7Family",
	"falsv7": "StandardFalsv7Family",
	"famsv7": "StandardFamsv7Family",
	"esv4":   "standardESv4Family",
}

func (p *AzureProvider) ListInstances(ctx context.Context, family string) ([]InstanceInfo, error) {
	skuFamily, ok := azureFamilyToSKU[strings.ToLower(family)]
	if !ok {
		return nil, fmt.Errorf("unknown azure family: %s", family)
	}

	query := fmt.Sprintf("[?family=='%s'].{name:name,vcpus:capabilities[?name=='vCPUs'].value|[0]}", skuFamily)
	out, err := exec.CommandContext(ctx, "az", "vm", "list-skus",
		"--location", p.Location,
		"--resource-type", "virtualMachines",
		"--query", query,
		"--output", "tsv",
	).Output()
	if err != nil {
		return nil, fmt.Errorf("az vm list-skus: %w", err)
	}

	constrainedRe := regexp.MustCompile(`[0-9]-[0-9]`)
	var instances []InstanceInfo
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line == "" {
			continue
		}
		fields := strings.SplitN(line, "\t", 2)
		name := fields[0]
		// Skip constrained vCPU variants (e.g., Standard_E16-4s_v6)
		if constrainedRe.MatchString(name) {
			continue
		}
		// Skip isolated variants (e.g., Standard_E192is_v6)
		if strings.Contains(name, "is_v") {
			continue
		}
		vcpus, _ := p.getVCPUsFromType(name)
		instances = append(instances, InstanceInfo{
			Type:   name,
			Family: GetInstanceFamily("azure", name),
			VCPUs:  vcpus,
		})
	}
	sort.Slice(instances, func(i, j int) bool {
		return instances[i].VCPUs < instances[j].VCPUs
	})
	return instances, nil
}

// getVCPUsFromType extracts vCPU count from an Azure instance type name.
// Standard_D4s_v4 -> 4, Standard_F16s_v2 -> 16
func (p *AzureProvider) getVCPUsFromType(instanceType string) (int, error) {
	name := strings.TrimPrefix(instanceType, "Standard_")
	re := regexp.MustCompile(`[0-9]+`)
	m := re.FindString(name)
	if m == "" {
		return 0, fmt.Errorf("cannot parse vcpus from %s", instanceType)
	}
	return strconv.Atoi(m)
}

func (p *AzureProvider) GetVCPUs(_ context.Context, instanceType string) (int, error) {
	return p.getVCPUsFromType(instanceType)
}

func (p *AzureProvider) IsQuotaError(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "QuotaExceeded") ||
		strings.Contains(s, "SkuNotAvailable") ||
		strings.Contains(s, "AllocationFailed") ||
		strings.Contains(s, "OperationNotAllowed") && strings.Contains(s, "quota") ||
		strings.Contains(s, "sufficient capacity")
}
