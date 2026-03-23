package provider

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"sort"
	"strconv"
	"strings"
	"time"

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
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(22),
					ToPort:     pulumi.Int(22),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("SSH"),
				},
				ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("udp"),
					FromPort:   pulumi.Int(41641),
					ToPort:     pulumi.Int(41641),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("WireGuard"),
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
			Name:     pulumi.String("tailbench-pg"),
			Strategy: pulumi.String("cluster"),
			Tags: pulumi.StringMap{
				"Name":    pulumi.String("tailbench-pg"),
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

	result, err := stack.Up(ctx, optup.ProgressStreams())
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

		for _, name := range []string{serverName, clientName} {
			ud := opts.UserData
			if name == clientName {
				ud = opts.ClientUD()
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
			if name == clientName {
				prefix = "client"
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

	result, err := stack.Up(ctx, optup.ProgressStreams())
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
	}, nil
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
	return []string{"c8gn", "c6in", "c7i", "c7gn", "c8g", "c6i", "m6i", "c7g", "m7g"}
}

func (p *AWSProvider) ListInstances(ctx context.Context, family string) ([]InstanceInfo, error) {
	tCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	filter := fmt.Sprintf("Name=instance-type,Values=%s.*", family)
	out, err := exec.CommandContext(tCtx, "aws", "ec2", "describe-instance-types",
		"--region", p.Region,
		"--filters", filter,
		"--query", "sort_by(InstanceTypes,&VCpuInfo.DefaultVCpus)[].[InstanceType,VCpuInfo.DefaultVCpus]",
		"--output", "json",
	).Output()
	if err != nil {
		return nil, fmt.Errorf("aws describe-instance-types (%s): %w", family, err)
	}

	var raw [][]json.RawMessage
	if err := json.Unmarshal(out, &raw); err != nil {
		return nil, fmt.Errorf("parse instance types: %w", err)
	}

	var instances []InstanceInfo
	for _, pair := range raw {
		if len(pair) < 2 {
			continue
		}
		var name string
		var vcpus int
		if err := json.Unmarshal(pair[0], &name); err != nil {
			continue
		}
		if err := json.Unmarshal(pair[1], &vcpus); err != nil {
			continue
		}
		instances = append(instances, InstanceInfo{
			Type:   name,
			Family: GetInstanceFamily("aws", name),
			VCPUs:  vcpus,
		})
	}
	sort.Slice(instances, func(i, j int) bool {
		return instances[i].VCPUs < instances[j].VCPUs
	})
	return instances, nil
}

func (p *AWSProvider) GetVCPUs(ctx context.Context, instanceType string) (int, error) {
	out, err := exec.CommandContext(ctx, "aws", "ec2", "describe-instance-types",
		"--region", p.Region,
		"--instance-types", instanceType,
		"--query", "InstanceTypes[0].VCpuInfo.DefaultVCpus",
		"--output", "text",
	).Output()
	if err != nil {
		return 0, fmt.Errorf("aws describe-instance-types: %w", err)
	}
	return strconv.Atoi(strings.TrimSpace(string(out)))
}

func (p *AWSProvider) IsQuotaError(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "VcpuLimitExceeded") ||
		strings.Contains(s, "InstanceLimitExceeded")
}
