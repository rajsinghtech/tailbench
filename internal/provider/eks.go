package provider

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"time"

	"github.com/pulumi/pulumi-aws/sdk/v7/go/aws/ec2"
	awseks "github.com/pulumi/pulumi-aws/sdk/v7/go/aws/eks"
	"github.com/pulumi/pulumi-aws/sdk/v7/go/aws/iam"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
	"github.com/pulumi/pulumi/sdk/v3/go/common/workspace"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/rajsinghtech/tailbench/internal/k8s"
)

const (
	defaultBenchImage = "tailbench-tools:latest"
	defaultTSImage    = "ghcr.io/tailscale/tailscale:latest"
)

// EKSProvider manages EKS clusters and node groups via Pulumi Automation API.
type EKSProvider struct {
	Region   string
	AZ       string
	StateDir string

	kubeconfig string
}

func (p *EKSProvider) Name() string { return "eks" }

func (p *EKSProvider) projectOpts() []auto.LocalWorkspaceOption {
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

func (p *EKSProvider) SetupNetworking(ctx context.Context) (*NetworkingOutput, error) {
	stackName := "tailbench-eks-cluster"

	// Derive a second AZ for EKS requirement (needs at least 2 subnets in different AZs)
	az2 := p.AZ[:len(p.AZ)-1] + "b"
	if p.AZ[len(p.AZ)-1] == 'b' {
		az2 = p.AZ[:len(p.AZ)-1] + "c"
	}

	program := func(pCtx *pulumi.Context) error {
		vpc, err := ec2.NewVpc(pCtx, "tailbench-eks-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		subnet1, err := ec2.NewSubnet(pCtx, "tailbench-eks-subnet-1", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.1.0/24"),
			AvailabilityZone:    pulumi.String(p.AZ),
			MapPublicIpOnLaunch: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}
		subnet2, err := ec2.NewSubnet(pCtx, "tailbench-eks-subnet-2", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.2.0/24"),
			AvailabilityZone:    pulumi.String(az2),
			MapPublicIpOnLaunch: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		igw, err := ec2.NewInternetGateway(pCtx, "tailbench-eks-igw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
		})
		if err != nil {
			return err
		}

		rt, err := ec2.NewRouteTable(pCtx, "tailbench-eks-rt", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: igw.ID(),
				},
			},
		})
		if err != nil {
			return err
		}
		if _, err = ec2.NewRouteTableAssociation(pCtx, "tailbench-eks-rta-1", &ec2.RouteTableAssociationArgs{
			SubnetId:     subnet1.ID(),
			RouteTableId: rt.ID(),
		}); err != nil {
			return err
		}
		if _, err = ec2.NewRouteTableAssociation(pCtx, "tailbench-eks-rta-2", &ec2.RouteTableAssociationArgs{
			SubnetId:     subnet2.ID(),
			RouteTableId: rt.ID(),
		}); err != nil {
			return err
		}

		clusterRole, err := iam.NewRole(pCtx, "tailbench-eks-cluster-role", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"eks.amazonaws.com"},"Action":"sts:AssumeRole"}]}`),
		})
		if err != nil {
			return err
		}
		if _, err = iam.NewRolePolicyAttachment(pCtx, "eks-cluster-policy", &iam.RolePolicyAttachmentArgs{
			Role:      clusterRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"),
		}); err != nil {
			return err
		}

		cluster, err := awseks.NewCluster(pCtx, "tailbench-eks", &awseks.ClusterArgs{
			RoleArn: clusterRole.Arn,
			VpcConfig: &awseks.ClusterVpcConfigArgs{
				SubnetIds: pulumi.StringArray{subnet1.ID(), subnet2.ID()},
			},
		})
		if err != nil {
			return err
		}

		nodeRole, err := iam.NewRole(pCtx, "tailbench-eks-node-role", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}`),
		})
		if err != nil {
			return err
		}
		for i, policy := range []string{
			"arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
			"arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
			"arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
		} {
			if _, err = iam.NewRolePolicyAttachment(pCtx, fmt.Sprintf("eks-node-policy-%d", i), &iam.RolePolicyAttachmentArgs{
				Role:      nodeRole.Name,
				PolicyArn: pulumi.String(policy),
			}); err != nil {
				return err
			}
		}

		pCtx.Export("clusterName", cluster.Name)
		pCtx.Export("clusterEndpoint", cluster.Endpoint)
		pCtx.Export("clusterCaCert", cluster.ToClusterOutput().CertificateAuthority().Data())
		pCtx.Export("nodeRoleArn", nodeRole.Arn)
		pCtx.Export("subnetId", subnet1.ID())
		return nil
	}

	stack, err := auto.UpsertStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return nil, fmt.Errorf("create cluster stack: %w", err)
	}
	stack.SetConfig(ctx, "aws:region", auto.ConfigValue{Value: p.Region})

	res, err := stack.Up(ctx, optup.ProgressStreams(log.Writer()))
	if err != nil {
		return nil, fmt.Errorf("create EKS cluster: %w", err)
	}

	clusterName := res.Outputs["clusterName"].Value.(string)

	out, err := exec.CommandContext(ctx, "aws", "eks", "update-kubeconfig",
		"--name", clusterName, "--region", p.Region,
	).CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("update-kubeconfig: %s: %w", out, err)
	}

	kubeconfigOut, err := exec.CommandContext(ctx, "kubectl", "config", "view", "--raw", "-o", "json").Output()
	if err != nil {
		return nil, fmt.Errorf("get kubeconfig: %w", err)
	}
	p.kubeconfig = base64.StdEncoding.EncodeToString(kubeconfigOut)

	cs, err := k8s.ClientsetFromKubeconfig(p.kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("create clientset: %w", err)
	}
	if err := k8s.EnsureNamespace(ctx, cs); err != nil {
		return nil, fmt.Errorf("create namespace: %w", err)
	}

	return &NetworkingOutput{Values: map[string]string{
		"clusterName": clusterName,
		"kubeconfig":  p.kubeconfig,
		"nodeRoleArn": res.Outputs["nodeRoleArn"].Value.(string),
		"subnetId":    res.Outputs["subnetId"].Value.(string),
	}}, nil
}

func (p *EKSProvider) CreatePair(ctx context.Context, opts PairOptions) (*PairOutput, error) {
	safeType := strings.ReplaceAll(strings.ReplaceAll(opts.InstanceType, ".", "-"), "_", "-")
	stackName := fmt.Sprintf("tailbench-eks-%s", safeType)

	program := func(pCtx *pulumi.Context) error {
		clusterName := opts.Networking.Values["clusterName"]
		nodeRoleArn := opts.Networking.Values["nodeRoleArn"]
		subnetId := opts.Networking.Values["subnetId"]

		ng, err := awseks.NewNodeGroup(pCtx, "bench-nodes", &awseks.NodeGroupArgs{
			ClusterName:   pulumi.String(clusterName),
			NodeRoleArn:   pulumi.String(nodeRoleArn),
			SubnetIds:     pulumi.StringArray{pulumi.String(subnetId)},
			InstanceTypes: pulumi.StringArray{pulumi.String(opts.InstanceType)},
			ScalingConfig: &awseks.NodeGroupScalingConfigArgs{
				DesiredSize: pulumi.Int(2),
				MinSize:     pulumi.Int(2),
				MaxSize:     pulumi.Int(2),
			},
			Labels: pulumi.StringMap{
				"tailbench-pool": pulumi.String(safeType),
			},
		})
		if err != nil {
			return err
		}
		pCtx.Export("nodeGroupName", ng.NodeGroupName)
		return nil
	}

	stack, err := auto.UpsertStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return nil, fmt.Errorf("create node group stack: %w", err)
	}
	stack.SetConfig(ctx, "aws:region", auto.ConfigValue{Value: p.Region})

	if _, err = stack.Up(ctx, optup.ProgressStreams(log.Writer())); err != nil {
		return nil, fmt.Errorf("create node group %s: %w", opts.InstanceType, err)
	}

	cs, err := k8s.ClientsetFromKubeconfig(p.kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("create clientset: %w", err)
	}

	nodeLabel := fmt.Sprintf("tailbench-pool=%s", safeType)
	if err := k8s.WaitForNodes(ctx, cs, nodeLabel, 2, 10*time.Minute); err != nil {
		return nil, fmt.Errorf("wait for nodes: %w", err)
	}

	authKey := opts.UserData
	if err := k8s.CreateAuthSecret(ctx, cs, authKey); err != nil {
		return nil, fmt.Errorf("create auth secret: %w", err)
	}

	serverName := fmt.Sprintf("tb-eks-server-%s", safeType)
	clientName := fmt.Sprintf("tb-eks-client-%s", safeType)

	benchImage := defaultBenchImage
	tsImage := defaultTSImage

	serverPod := k8s.BuildPod(serverName, k8s.PodConfig{
		BenchImage: benchImage,
		TSImage:    tsImage,
		Hostname:   serverName,
	})
	serverPod.Spec.NodeSelector = map[string]string{"tailbench-pool": safeType}

	clientPod := k8s.BuildPod(clientName, k8s.PodConfig{
		BenchImage: benchImage,
		TSImage:    tsImage,
		Hostname:   clientName,
	})
	clientPod.Spec.NodeSelector = map[string]string{"tailbench-pool": safeType}
	k8s.SetAntiAffinity(clientPod, serverName)

	timeout := 5 * time.Minute
	if err := k8s.DeployPod(ctx, cs, serverPod, timeout); err != nil {
		return nil, fmt.Errorf("deploy server pod: %w", err)
	}
	if err := k8s.DeployPod(ctx, cs, clientPod, timeout); err != nil {
		return nil, fmt.Errorf("deploy client pod: %w", err)
	}

	serverIP, _ := k8s.GetPodIP(ctx, cs, serverName)
	clientIP, _ := k8s.GetPodIP(ctx, cs, clientName)

	return &PairOutput{
		ServerName:  serverName,
		ClientName:  clientName,
		ServerLANIP: serverIP,
		ClientLANIP: clientIP,
		StackName:   stackName,
		Namespace:   k8s.Namespace,
		Kubeconfig:  p.kubeconfig,
	}, nil
}

func (p *EKSProvider) DestroyPair(ctx context.Context, instanceType string) error {
	safeType := strings.ReplaceAll(strings.ReplaceAll(instanceType, ".", "-"), "_", "-")
	stackName := fmt.Sprintf("tailbench-eks-%s", safeType)

	cs, err := k8s.ClientsetFromKubeconfig(p.kubeconfig)
	if err == nil {
		_ = k8s.DeletePod(ctx, cs, fmt.Sprintf("tb-eks-server-%s", safeType))
		_ = k8s.DeletePod(ctx, cs, fmt.Sprintf("tb-eks-client-%s", safeType))
	}

	program := func(_ *pulumi.Context) error { return nil }
	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return fmt.Errorf("select stack %s: %w", stackName, err)
	}
	_, err = stack.Destroy(ctx, optdestroy.ProgressStreams(log.Writer()))
	return err
}

func (p *EKSProvider) TeardownNetworking(ctx context.Context) error {
	stackName := "tailbench-eks-cluster"
	program := func(_ *pulumi.Context) error { return nil }
	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return fmt.Errorf("select cluster stack: %w", err)
	}
	_, err = stack.Destroy(ctx, optdestroy.ProgressStreams(log.Writer()))
	return err
}

func (p *EKSProvider) ListFamilies() []string {
	return (&AWSProvider{}).ListFamilies()
}

func (p *EKSProvider) ListInstances(ctx context.Context, family string) ([]InstanceInfo, error) {
	return (&AWSProvider{Region: p.Region}).ListInstances(ctx, family)
}

func (p *EKSProvider) GetVCPUs(ctx context.Context, instanceType string) (int, error) {
	return (&AWSProvider{Region: p.Region}).GetVCPUs(ctx, instanceType)
}

func (p *EKSProvider) IsQuotaError(err error) bool {
	s := err.Error()
	return strings.Contains(s, "VcpuLimitExceeded") ||
		strings.Contains(s, "InstanceLimitExceeded") ||
		strings.Contains(s, "insufficient") ||
		strings.Contains(s, "Unschedulable")
}
