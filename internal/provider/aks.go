package provider

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"time"

	azcontainer "github.com/pulumi/pulumi-azure-native-sdk/containerservice/v3"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
	"github.com/pulumi/pulumi/sdk/v3/go/common/workspace"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/rajsinghtech/tailbench/internal/k8s"
)

type AKSProvider struct {
	Location      string
	ResourceGroup string
	StateDir      string

	kubeconfig  string
	clusterName string
}

func (p *AKSProvider) Name() string { return "aks" }

func (p *AKSProvider) projectOpts() []auto.LocalWorkspaceOption {
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

func (p *AKSProvider) SetupNetworking(ctx context.Context) (*NetworkingOutput, error) {
	stackName := "tailbench-aks-cluster"

	program := func(pCtx *pulumi.Context) error {
		cluster, err := azcontainer.NewManagedCluster(pCtx, "tailbench-aks", &azcontainer.ManagedClusterArgs{
			ResourceGroupName: pulumi.String(p.ResourceGroup),
			Location:          pulumi.String(p.Location),
			DnsPrefix:         pulumi.String("tailbench"),
			Identity: &azcontainer.ManagedClusterIdentityArgs{
				Type: azcontainer.ResourceIdentityTypeSystemAssigned,
			},
			AgentPoolProfiles: azcontainer.ManagedClusterAgentPoolProfileArray{
				&azcontainer.ManagedClusterAgentPoolProfileArgs{
					Name:   pulumi.String("system"),
					Count:  pulumi.Int(1),
					VmSize: pulumi.String("Standard_B2s"),
					Mode:   pulumi.String("System"),
				},
			},
		})
		if err != nil {
			return err
		}

		pCtx.Export("clusterName", cluster.Name)
		return nil
	}

	stack, err := auto.UpsertStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return nil, fmt.Errorf("create cluster stack: %w", err)
	}

	res, err := stack.Up(ctx, optup.ProgressStreams(log.Writer()))
	if err != nil {
		return nil, fmt.Errorf("create AKS cluster: %w", err)
	}

	p.clusterName = res.Outputs["clusterName"].Value.(string)

	out, err := exec.CommandContext(ctx, "az", "aks", "get-credentials",
		"--resource-group", p.ResourceGroup,
		"--name", p.clusterName,
		"--overwrite-existing",
	).CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("get-credentials: %s: %w", out, err)
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
		"clusterName": p.clusterName,
		"kubeconfig":  p.kubeconfig,
	}}, nil
}

func (p *AKSProvider) CreatePair(ctx context.Context, opts PairOptions) (*PairOutput, error) {
	safeType := strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(opts.InstanceType, ".", "-"), "_", "-"))
	stackName := fmt.Sprintf("tailbench-aks-%s", safeType)

	program := func(pCtx *pulumi.Context) error {
		_, err := azcontainer.NewAgentPool(pCtx, "bench-pool", &azcontainer.AgentPoolArgs{
			ResourceGroupName: pulumi.String(p.ResourceGroup),
			ResourceName:      pulumi.String(p.clusterName),
			AgentPoolName:     pulumi.String("bench"),
			Count:             pulumi.Int(2),
			VmSize:            pulumi.String(opts.InstanceType),
			Mode:              pulumi.String("User"),
			NodeLabels: pulumi.StringMap{
				"tailbench-pool": pulumi.String(safeType),
			},
		})
		return err
	}

	stack, err := auto.UpsertStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return nil, fmt.Errorf("create agent pool stack: %w", err)
	}

	_, err = stack.Up(ctx, optup.ProgressStreams(log.Writer()))
	if err != nil {
		return nil, fmt.Errorf("create agent pool %s: %w", opts.InstanceType, err)
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

	serverName := fmt.Sprintf("tb-aks-server-%s", safeType)
	clientName := fmt.Sprintf("tb-aks-client-%s", safeType)

	benchImage := "tailbench-tools:latest"
	tsImage := "ghcr.io/tailscale/tailscale:latest"

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

func (p *AKSProvider) DestroyPair(ctx context.Context, instanceType string) error {
	safeType := strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(instanceType, ".", "-"), "_", "-"))
	stackName := fmt.Sprintf("tailbench-aks-%s", safeType)

	cs, err := k8s.ClientsetFromKubeconfig(p.kubeconfig)
	if err == nil {
		_ = k8s.DeletePod(ctx, cs, fmt.Sprintf("tb-aks-server-%s", safeType))
		_ = k8s.DeletePod(ctx, cs, fmt.Sprintf("tb-aks-client-%s", safeType))
	}

	program := func(_ *pulumi.Context) error { return nil }
	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return fmt.Errorf("select stack %s: %w", stackName, err)
	}
	_, err = stack.Destroy(ctx, optdestroy.ProgressStreams(log.Writer()))
	return err
}

func (p *AKSProvider) TeardownNetworking(ctx context.Context) error {
	stackName := "tailbench-aks-cluster"
	program := func(_ *pulumi.Context) error { return nil }
	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return fmt.Errorf("select cluster stack: %w", err)
	}
	_, err = stack.Destroy(ctx, optdestroy.ProgressStreams(log.Writer()))
	return err
}

func (p *AKSProvider) ListFamilies() []string {
	return (&AzureProvider{}).ListFamilies()
}

func (p *AKSProvider) ListInstances(ctx context.Context, family string) ([]InstanceInfo, error) {
	return (&AzureProvider{Location: p.Location}).ListInstances(ctx, family)
}

func (p *AKSProvider) GetVCPUs(ctx context.Context, instanceType string) (int, error) {
	return (&AzureProvider{Location: p.Location}).GetVCPUs(ctx, instanceType)
}

func (p *AKSProvider) IsQuotaError(err error) bool {
	s := err.Error()
	return strings.Contains(s, "QuotaExceeded") ||
		strings.Contains(s, "SkuNotAvailable") ||
		strings.Contains(s, "AllocationFailed") ||
		strings.Contains(s, "Unschedulable")
}
