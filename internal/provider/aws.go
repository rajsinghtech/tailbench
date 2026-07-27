//go:build aws && !k8s && !azure && !gcp

package provider

import (
	"context"
	"fmt"
	"strings"

	"github.com/pulumi/pulumi-aws/sdk/v7/go/aws/ec2"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
	"github.com/pulumi/pulumi/sdk/v3/go/common/workspace"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// AWSProvider manages AWS EC2 instances via Pulumi Automation API.
type AWSProvider struct {
	Region   string
	AZ       string
	KeyName  string
	SSHUser  string
	StateDir string
}

var _ Provider = (*AWSProvider)(nil)

func (p *AWSProvider) Name() string { return "aws" }

func (p *AWSProvider) projectOpts() []auto.LocalWorkspaceOption {
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

func (p *AWSProvider) SetupNetworking(ctx context.Context) (*NetworkingOutput, error) {
	stackName := "tailbench-aws-networking"

	program := func(pCtx *pulumi.Context) error {
		vpc, err := ec2.NewVpc(pCtx, "tailbench-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":    pulumi.String("tailbench-vpc"),
				"Project": pulumi.String("tailbench"),
			},
		})
		if err != nil {
			return err
		}

		subnet, err := ec2.NewSubnet(pCtx, "tailbench-subnet", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.1.0/24"),
			AvailabilityZone:    pulumi.String(p.AZ),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":    pulumi.String("tailbench-subnet"),
				"Project": pulumi.String("tailbench"),
			},
		})
		if err != nil {
			return err
		}

		igw, err := ec2.NewInternetGateway(pCtx, "tailbench-igw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":    pulumi.String("tailbench-igw"),
				"Project": pulumi.String("tailbench"),
			},
		})
		if err != nil {
			return err
		}

		rtb, err := ec2.NewRouteTable(pCtx, "tailbench-rtb", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: igw.ID(),
				},
			},
			Tags: pulumi.StringMap{
				"Name":    pulumi.String("tailbench-rtb"),
				"Project": pulumi.String("tailbench"),
			},
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(pCtx, "tailbench-rtb-assoc", &ec2.RouteTableAssociationArgs{
			SubnetId:     subnet.ID(),
			RouteTableId: rtb.ID(),
		})
		if err != nil {
			return err
		}

		sg, err := ec2.NewSecurityGroup(pCtx, "tailbench-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String("tailbench-sg"),
			Description: pulumi.String("tailbench benchmark security group"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				ec2.SecurityGroupIngressArgs{
					Protocol:    pulumi.String("tcp"),
					FromPort:    pulumi.Int(22),
					ToPort:      pulumi.Int(22),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("SSH"),
				},
				ec2.SecurityGroupIngressArgs{
					Protocol:    pulumi.String("udp"),
					FromPort:    pulumi.Int(41641),
					ToPort:      pulumi.Int(41641),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("WireGuard"),
				},
				ec2.SecurityGroupIngressArgs{
					Protocol:    pulumi.String("tcp"),
					FromPort:    pulumi.Int(15201),
					ToPort:      pulumi.Int(15201),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("iperf3 control (forwarding-pps sink, routed via exit node)"),
				},
				ec2.SecurityGroupIngressArgs{
					Protocol:    pulumi.String("udp"),
					FromPort:    pulumi.Int(15201),
					ToPort:      pulumi.Int(15201),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("iperf3 UDP data (forwarding-pps sink, routed via exit node)"),
				},
				ec2.SecurityGroupIngressArgs{
					Protocol:    pulumi.String("udp"),
					FromPort:    pulumi.Int(41642),
					ToPort:      pulumi.Int(41642),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("Tailscale peer-relay (relay-throughput benchmark)"),
				},
				ec2.SecurityGroupIngressArgs{
					Protocol:    pulumi.String("-1"),
					FromPort:    pulumi.Int(0),
					ToPort:      pulumi.Int(0),
					Self:        pulumi.Bool(true),
					Description: pulumi.String("Internal"),
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("-1"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Tags: pulumi.StringMap{
				"Name":    pulumi.String("tailbench-sg"),
				"Project": pulumi.String("tailbench"),
			},
		})
		if err != nil {
			return err
		}

		pg, err := ec2.NewPlacementGroup(pCtx, "tailbench-pg", &ec2.PlacementGroupArgs{
			Strategy: pulumi.String("cluster"),
			Tags: pulumi.StringMap{
				"Project": pulumi.String("tailbench"),
			},
		})
		if err != nil {
			return err
		}

		pCtx.Export("vpc_id", vpc.ID())
		pCtx.Export("subnet_id", subnet.ID())
		pCtx.Export("sg_id", sg.ID())
		pCtx.Export("placement_group_name", pg.Name)
		return nil
	}

	stack, err := auto.UpsertStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return nil, fmt.Errorf("create stack %s: %w", stackName, err)
	}

	if err := stack.SetConfig(ctx, "aws:region", auto.ConfigValue{Value: p.Region}); err != nil {
		return nil, fmt.Errorf("set aws:region: %w", err)
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

	return &NetworkingOutput{Values: map[string]string{
		"vpc_id":               getOutput("vpc_id"),
		"subnet_id":            getOutput("subnet_id"),
		"sg_id":                getOutput("sg_id"),
		"placement_group_name": getOutput("placement_group_name"),
	}}, nil
}

func (p *AWSProvider) CreatePair(ctx context.Context, opts PairOptions) (*PairOutput, error) {
	safeType := strings.ReplaceAll(opts.InstanceType, ".", "-")
	stackName := fmt.Sprintf("tailbench-aws-%s", safeType)

	serverName := fmt.Sprintf("tb-%s-server", safeType)
	clientName := fmt.Sprintf("tb-%s-client", safeType)
	routerName := fmt.Sprintf("tb-%s-router", safeType)

	net := opts.Networking
	subnetID := net.Values["subnet_id"]
	sgID := net.Values["sg_id"]
	pgName := net.Values["placement_group_name"]

	arch := "amd64"
	nameFilter := "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"
	if IsGraviton(opts.InstanceType) {
		arch = "arm64"
		nameFilter = "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-arm64-server-*"
	}
	_ = arch

	program := func(pCtx *pulumi.Context) error {
		mostRecent := true
		ami, err := ec2.LookupAmi(pCtx, &ec2.LookupAmiArgs{
			MostRecent: &mostRecent,
			Owners:     []string{"099720109477"},
			Filters: []ec2.GetAmiFilter{
				{Name: "name", Values: []string{nameFilter}},
				{Name: "state", Values: []string{"available"}},
			},
		})
		if err != nil {
			return fmt.Errorf("lookup AMI: %w", err)
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
			inst, err := ec2.NewInstance(pCtx, name, &ec2.InstanceArgs{
				Ami:          pulumi.String(ami.Id),
				InstanceType: pulumi.String(opts.InstanceType),
				KeyName:      pulumi.String(p.KeyName),
				SubnetId:     pulumi.String(subnetID),
				VpcSecurityGroupIds: pulumi.StringArray{
					pulumi.String(sgID),
				},
				PlacementGroup: pulumi.String(pgName),
				UserData:       pulumi.StringPtr(ud),
				RootBlockDevice: ec2.InstanceRootBlockDeviceArgs{
					VolumeSize: pulumi.Int(50),
					VolumeType: pulumi.String("gp3"),
				},
				Tags: pulumi.StringMap{
					"Name":    pulumi.String(name),
					"Project": pulumi.String("tailbench"),
				},
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
			pCtx.Export(prefix+"_ip", inst.PublicIp)
			pCtx.Export(prefix+"_lan_ip", inst.PrivateIp)
			pCtx.Export(prefix+"_instance_id", inst.ID())
			pCtx.Export(prefix+"_eni_id", inst.PrimaryNetworkInterfaceId)
		}
		return nil
	}

	stack, err := auto.UpsertStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return nil, fmt.Errorf("create stack %s: %w", stackName, err)
	}

	if err := stack.SetConfig(ctx, "aws:region", auto.ConfigValue{Value: p.Region}); err != nil {
		return nil, fmt.Errorf("set aws:region: %w", err)
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

	out := &PairOutput{
		ServerName:       serverName,
		ClientName:       clientName,
		ServerIP:         getOutput("server_ip"),
		ClientIP:         getOutput("client_ip"),
		ServerLANIP:      getOutput("server_lan_ip"),
		ClientLANIP:      getOutput("client_lan_ip"),
		StackName:        stackName,
		ServerInstanceID: getOutput("server_instance_id"),
		ClientInstanceID: getOutput("client_instance_id"),
		ServerENIID:      getOutput("server_eni_id"),
		ClientENIID:      getOutput("client_eni_id"),
	}
	if opts.WantRouter {
		out.RouterName = routerName
		out.RouterIP = getOutput("router_ip")
		out.RouterLANIP = getOutput("router_lan_ip")
		out.RouterInstanceID = getOutput("router_instance_id")
	}
	return out, nil
}

func (p *AWSProvider) DestroyPair(ctx context.Context, instanceType string) error {
	safeType := strings.ReplaceAll(instanceType, ".", "-")
	stackName := fmt.Sprintf("tailbench-aws-%s", safeType)

	program := func(_ *pulumi.Context) error { return nil }

	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err == nil {
		_ = stack.Cancel(ctx)
		_, _ = stack.Destroy(ctx, optdestroy.ProgressStreams(), optdestroy.ContinueOnError())
		_ = stack.Workspace().RemoveStack(ctx, stackName)
	}
	return nil
}

func (p *AWSProvider) TeardownNetworking(ctx context.Context) error {
	stackName := "tailbench-aws-networking"

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

func (p *AWSProvider) ListFamilies() []string {
	return listAWSFamilies()
}

func (p *AWSProvider) ListInstances(ctx context.Context, family string) ([]InstanceInfo, error) {
	return listAWSInstances(ctx, p.Region, family)
}

func (p *AWSProvider) GetVCPUs(ctx context.Context, instanceType string) (int, error) {
	return getAWSVCPUs(ctx, p.Region, instanceType)
}

func (p *AWSProvider) IsQuotaError(err error) bool {
	return isAWSQuotaError(err)
}
