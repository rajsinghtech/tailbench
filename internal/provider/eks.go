//go:build aws && k8s && !azure && !gcp

package provider

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"os"
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
	"tailscale.com/tsnet"
)

const (
	defaultBenchImage = "ghcr.io/rajsinghtech/tailbench-tools:latest"
	defaultTSImage    = "ghcr.io/tailscale/tailscale:latest"
)

// EKSProvider manages EKS clusters and node groups via Pulumi Automation API.
type EKSProvider struct {
	Region    string
	AZ        string
	StateDir  string
	RunID     string
	ExpiresAt string

	kubeconfig   string
	tsnetSrv     *tsnet.Server
	operatorFQDN string
}

var _ K8sOperatorProvider = (*EKSProvider)(nil)
var _ RunScopedProvider = (*EKSProvider)(nil)

func (p *EKSProvider) Name() string             { return "eks" }
func (p *EKSProvider) RunScopedResources() bool { return p.RunID != "" }
func (p *EKSProvider) ManagesNetworking() bool  { return true }

func (p *EKSProvider) networkStackName() string {
	return scopedName("tailbench-eks-cluster", p.RunID)
}

func (p *EKSProvider) pairStackName(instanceType string) string {
	safeType := strings.ReplaceAll(strings.ReplaceAll(instanceType, ".", "-"), "_", "-")
	return scopedName("tailbench-eks-"+safeType, p.RunID)
}

func (p *EKSProvider) resourceTags() pulumi.StringMap {
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

func (p *EKSProvider) projectOpts() []auto.LocalWorkspaceOption {
	return []auto.LocalWorkspaceOption{
		auto.Project(workspace.Project{
			Name:    "tailbench",
			Runtime: workspace.NewProjectRuntimeInfo("go", nil),
			Backend: &workspace.ProjectBackend{URL: p.StateDir},
		}),
		auto.WorkDir(WorkDir(p.StateDir, p.Name())),
		auto.EnvVars(map[string]string{
			"PULUMI_CONFIG_PASSPHRASE": "",
		}),
	}
}

func (p *EKSProvider) SetupNetworking(ctx context.Context) (*NetworkingOutput, error) {
	stackName := p.networkStackName()

	// Derive a second AZ for EKS requirement (needs at least 2 subnets in different AZs)
	az2 := p.AZ[:len(p.AZ)-1] + "b"
	if p.AZ[len(p.AZ)-1] == 'b' {
		az2 = p.AZ[:len(p.AZ)-1] + "c"
	}

	program := func(pCtx *pulumi.Context) error {
		vpc, err := ec2.NewVpc(pCtx, scopedName("tailbench-eks-vpc", p.RunID), &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags:               p.resourceTags(),
		})
		if err != nil {
			return err
		}

		subnet1, err := ec2.NewSubnet(pCtx, scopedName("tailbench-eks-subnet-1", p.RunID), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.1.0/24"),
			AvailabilityZone:    pulumi.String(p.AZ),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags:                p.resourceTags(),
		})
		if err != nil {
			return err
		}
		subnet2, err := ec2.NewSubnet(pCtx, scopedName("tailbench-eks-subnet-2", p.RunID), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.2.0/24"),
			AvailabilityZone:    pulumi.String(az2),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags:                p.resourceTags(),
		})
		if err != nil {
			return err
		}

		igw, err := ec2.NewInternetGateway(pCtx, scopedName("tailbench-eks-igw", p.RunID), &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags:  p.resourceTags(),
		})
		if err != nil {
			return err
		}

		rt, err := ec2.NewRouteTable(pCtx, scopedName("tailbench-eks-rt", p.RunID), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: igw.ID(),
				},
			},
			Tags: p.resourceTags(),
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

		clusterRole, err := iam.NewRole(pCtx, scopedName("tailbench-eks-cluster-role", p.RunID), &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"eks.amazonaws.com"},"Action":"sts:AssumeRole"}]}`),
			Tags:             p.resourceTags(),
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

		cluster, err := awseks.NewCluster(pCtx, scopedName("tailbench-eks", p.RunID), &awseks.ClusterArgs{
			RoleArn: clusterRole.Arn,
			VpcConfig: &awseks.ClusterVpcConfigArgs{
				SubnetIds: pulumi.StringArray{subnet1.ID(), subnet2.ID()},
			},
			Tags: p.resourceTags(),
		})
		if err != nil {
			return err
		}

		nodeRole, err := iam.NewRole(pCtx, scopedName("tailbench-eks-node-role", p.RunID), &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}`),
			Tags:             p.resourceTags(),
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
	if err := stack.SetConfig(ctx, "aws:region", auto.ConfigValue{Value: p.Region}); err != nil {
		return nil, fmt.Errorf("set aws:region: %w", err)
	}

	res, err := stack.Up(ctx, optup.ProgressStreams(log.Writer()))
	if err != nil {
		return nil, fmt.Errorf("create EKS cluster: %w", err)
	}

	clusterName := res.Outputs["clusterName"].Value.(string)

	tmpKubeconfig, err := os.CreateTemp("", "kubeconfig-eks-*.json")
	if err != nil {
		return nil, fmt.Errorf("create temp kubeconfig: %w", err)
	}
	tmpKubeconfig.Close()

	credCmd := exec.CommandContext(ctx, "aws", "eks", "update-kubeconfig",
		"--name", clusterName, "--region", p.Region, "--kubeconfig", tmpKubeconfig.Name(),
	)
	out, err := credCmd.CombinedOutput()
	if err != nil {
		os.Remove(tmpKubeconfig.Name())
		return nil, fmt.Errorf("update-kubeconfig: %s: %w", out, err)
	}

	kubeconfigOut, err := os.ReadFile(tmpKubeconfig.Name())
	os.Remove(tmpKubeconfig.Name())
	if err != nil {
		return nil, fmt.Errorf("read kubeconfig: %w", err)
	}
	p.kubeconfig = base64.StdEncoding.EncodeToString(kubeconfigOut)

	cs, err := k8s.ClientsetFromKubeconfig(p.kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("create clientset: %w", err)
	}
	if err := k8s.EnsureNamespace(ctx, cs); err != nil {
		return nil, fmt.Errorf("create namespace: %w", err)
	}

	return &NetworkingOutput{
		StackName:  stackName,
		ProviderID: clusterName,
		Values: map[string]string{
			"clusterName": clusterName,
			"kubeconfig":  p.kubeconfig,
			"nodeRoleArn": res.Outputs["nodeRoleArn"].Value.(string),
			"subnetId":    res.Outputs["subnetId"].Value.(string),
		},
	}, nil
}

func (p *EKSProvider) CreatePair(ctx context.Context, opts PairOptions) (*PairOutput, error) {
	safeType := strings.ReplaceAll(strings.ReplaceAll(opts.InstanceType, ".", "-"), "_", "-")
	stackName := p.pairStackName(opts.InstanceType)

	program := func(pCtx *pulumi.Context) error {
		clusterName := opts.Networking.Values["clusterName"]
		nodeRoleArn := opts.Networking.Values["nodeRoleArn"]
		subnetId := opts.Networking.Values["subnetId"]

		amiType := "AL2023_x86_64_STANDARD"
		if IsGraviton(opts.InstanceType) {
			amiType = "AL2023_ARM_64_STANDARD"
		}

		ng, err := awseks.NewNodeGroup(pCtx, "bench-nodes", &awseks.NodeGroupArgs{
			ClusterName:   pulumi.String(clusterName),
			NodeRoleArn:   pulumi.String(nodeRoleArn),
			SubnetIds:     pulumi.StringArray{pulumi.String(subnetId)},
			InstanceTypes: pulumi.StringArray{pulumi.String(opts.InstanceType)},
			AmiType:       pulumi.String(amiType),
			ScalingConfig: &awseks.NodeGroupScalingConfigArgs{
				DesiredSize: pulumi.Int(2),
				MinSize:     pulumi.Int(2),
				MaxSize:     pulumi.Int(2),
			},
			Labels: pulumi.StringMap{
				"tailbench-pool": pulumi.String(safeType),
				"tailbench-run":  pulumi.String(runSuffix(p.RunID)),
			},
			Tags: p.resourceTags(),
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
	if err := stack.SetConfig(ctx, "aws:region", auto.ConfigValue{Value: p.Region}); err != nil {
		return nil, fmt.Errorf("set aws:region: %w", err)
	}

	if _, err = stack.Up(ctx, optup.ProgressStreams(log.Writer()), optup.Refresh()); err != nil {
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

	serverName := scopedName(fmt.Sprintf("tb-eks-server-%s", safeType), p.RunID)
	clientName := scopedName(fmt.Sprintf("tb-eks-client-%s", safeType), p.RunID)

	benchImage := opts.BenchImage
	if benchImage == "" {
		benchImage = defaultBenchImage
	}
	tsImage := opts.TSImage
	if tsImage == "" {
		tsImage = defaultTSImage
	}

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
	stackName := p.pairStackName(instanceType)

	cs, err := k8s.ClientsetFromKubeconfig(p.kubeconfig)
	if err == nil {
		_ = k8s.DeletePod(ctx, cs, scopedName(fmt.Sprintf("tb-eks-server-%s", safeType), p.RunID))
		_ = k8s.DeletePod(ctx, cs, scopedName(fmt.Sprintf("tb-eks-client-%s", safeType), p.RunID))
	}

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

func (p *EKSProvider) TeardownNetworking(ctx context.Context) error {
	stackName := p.networkStackName()
	program := func(_ *pulumi.Context) error { return nil }
	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if auto.IsSelectStack404Error(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("select cluster stack: %w", err)
	}
	if _, err = stack.Destroy(ctx, optdestroy.ProgressStreams(log.Writer())); err != nil {
		return fmt.Errorf("destroy cluster stack: %w", err)
	}
	return stack.Workspace().RemoveStack(ctx, stackName)
}

func (p *EKSProvider) ListFamilies() []string {
	return listAWSFamilies()
}

func (p *EKSProvider) ListInstances(ctx context.Context, family string) ([]InstanceInfo, error) {
	return listAWSInstances(ctx, p.Region, family)
}

func (p *EKSProvider) GetVCPUs(ctx context.Context, instanceType string) (int, error) {
	return getAWSVCPUs(ctx, p.Region, instanceType)
}

func (p *EKSProvider) IsQuotaError(err error) bool {
	if isAWSQuotaError(err) {
		return true
	}
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "insufficient") ||
		strings.Contains(s, "Unschedulable")
}

func (p *EKSProvider) SetTsnetServer(srv *tsnet.Server) { p.tsnetSrv = srv }
func (p *EKSProvider) OperatorProxyFQDN() string        { return p.operatorFQDN }

func (p *EKSProvider) InstallOperator(ctx context.Context, cfg OperatorInstallConfig) error {
	hostname := "tailbench-eks-operator"
	if err := k8s.InstallOperator(ctx, p.kubeconfig, k8s.OperatorConfig{
		OAuthClientID:     cfg.OAuthClientID,
		OAuthClientSecret: cfg.OAuthClientSecret,
		Hostname:          hostname,
		Tag:               cfg.Tag,
		ForceReinstall:    cfg.ForceReinstall,
	}); err != nil {
		return err
	}
	fqdn, err := k8s.WaitForOperatorProxy(ctx, cfg.TsnetSrv, hostname, cfg.TailnetDNS, 10*time.Minute)
	if err != nil {
		return err
	}
	p.operatorFQDN = fqdn
	p.tsnetSrv = cfg.TsnetSrv
	return nil
}
