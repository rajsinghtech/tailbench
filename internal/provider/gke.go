package provider

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"time"

	"github.com/pulumi/pulumi-gcp/sdk/v9/go/gcp/container"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
	"github.com/pulumi/pulumi/sdk/v3/go/common/workspace"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/rajsinghtech/tailbench/internal/k8s"
)

// GKEProvider provisions GKE clusters and node pools via Pulumi.
type GKEProvider struct {
	Project  string
	Zone     string
	StateDir string

	kubeconfig string // populated after SetupNetworking
}

func (p *GKEProvider) Name() string { return "gke" }

func (p *GKEProvider) projectOpts() []auto.LocalWorkspaceOption {
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

func (p *GKEProvider) SetupNetworking(ctx context.Context) (*NetworkingOutput, error) {
	stackName := "tailbench-gke-cluster"

	program := func(pCtx *pulumi.Context) error {
		cluster, err := container.NewCluster(pCtx, "tailbench-gke", &container.ClusterArgs{
			Project:          pulumi.String(p.Project),
			Location:         pulumi.String(p.Zone),
			InitialNodeCount: pulumi.Int(1),
			NodeConfig: &container.ClusterNodeConfigArgs{
				MachineType: pulumi.String("e2-small"),
				OauthScopes: pulumi.StringArray{
					pulumi.String("https://www.googleapis.com/auth/cloud-platform"),
				},
			},
			DeletionProtection: pulumi.Bool(false),
		})
		if err != nil {
			return err
		}

		pCtx.Export("clusterName", cluster.Name)
		pCtx.Export("endpoint", cluster.Endpoint)
		pCtx.Export("caCert", cluster.MasterAuth.ClusterCaCertificate())
		return nil
	}

	stack, err := auto.UpsertStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return nil, fmt.Errorf("create cluster stack: %w", err)
	}
	stack.SetConfig(ctx, "gcp:project", auto.ConfigValue{Value: p.Project})
	stack.SetConfig(ctx, "gcp:zone", auto.ConfigValue{Value: p.Zone})

	res, err := stack.Up(ctx, optup.ProgressStreams(log.Writer()))
	if err != nil {
		return nil, fmt.Errorf("create GKE cluster: %w", err)
	}

	clusterName := res.Outputs["clusterName"].Value.(string)

	out, err := exec.CommandContext(ctx, "gcloud", "container", "clusters", "get-credentials",
		clusterName, "--zone", p.Zone, "--project", p.Project, "--quiet",
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

	return &NetworkingOutput{
		Values: map[string]string{
			"clusterName": clusterName,
			"kubeconfig":  p.kubeconfig,
		},
	}, nil
}

func (p *GKEProvider) CreatePair(ctx context.Context, opts PairOptions) (*PairOutput, error) {
	safeType := strings.ReplaceAll(strings.ReplaceAll(opts.InstanceType, ".", "-"), "_", "-")
	stackName := fmt.Sprintf("tailbench-gke-%s", safeType)

	program := func(pCtx *pulumi.Context) error {
		clusterName := opts.Networking.Values["clusterName"]

		np, err := container.NewNodePool(pCtx, "bench-pool", &container.NodePoolArgs{
			Project:   pulumi.String(p.Project),
			Location:  pulumi.String(p.Zone),
			Cluster:   pulumi.String(clusterName),
			NodeCount: pulumi.Int(2),
			NodeConfig: &container.NodePoolNodeConfigArgs{
				MachineType: pulumi.String(opts.InstanceType),
				OauthScopes: pulumi.StringArray{
					pulumi.String("https://www.googleapis.com/auth/cloud-platform"),
				},
				Labels: pulumi.StringMap{
					"tailbench-pool": pulumi.String(safeType),
				},
			},
		})
		if err != nil {
			return err
		}
		pCtx.Export("nodePoolName", np.Name)
		return nil
	}

	stack, err := auto.UpsertStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return nil, fmt.Errorf("create node pool stack: %w", err)
	}
	stack.SetConfig(ctx, "gcp:project", auto.ConfigValue{Value: p.Project})
	stack.SetConfig(ctx, "gcp:zone", auto.ConfigValue{Value: p.Zone})

	if _, err = stack.Up(ctx, optup.ProgressStreams(log.Writer())); err != nil {
		return nil, fmt.Errorf("create node pool %s: %w", opts.InstanceType, err)
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

	serverName := fmt.Sprintf("tb-gke-server-%s", safeType)
	clientName := fmt.Sprintf("tb-gke-client-%s", safeType)

	benchImage := "tailbench-tools:latest"
	tsImage := "ghcr.io/tailscale/tailscale:latest"

	serverPod := k8s.BuildPod(serverName, k8s.PodConfig{
		BenchImage: benchImage,
		TSImage:    tsImage,
		AuthKey:    authKey,
		Hostname:   serverName,
	})
	serverPod.Spec.NodeSelector = map[string]string{"tailbench-pool": safeType}

	clientPod := k8s.BuildPod(clientName, k8s.PodConfig{
		BenchImage: benchImage,
		TSImage:    tsImage,
		AuthKey:    authKey,
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

	serverIP, err := k8s.GetPodIP(ctx, cs, serverName)
	if err != nil {
		return nil, fmt.Errorf("get server pod IP: %w", err)
	}
	clientIP, err := k8s.GetPodIP(ctx, cs, clientName)
	if err != nil {
		return nil, fmt.Errorf("get client pod IP: %w", err)
	}

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

func (p *GKEProvider) DestroyPair(ctx context.Context, instanceType string) error {
	safeType := strings.ReplaceAll(strings.ReplaceAll(instanceType, ".", "-"), "_", "-")
	stackName := fmt.Sprintf("tailbench-gke-%s", safeType)

	cs, err := k8s.ClientsetFromKubeconfig(p.kubeconfig)
	if err == nil {
		_ = k8s.DeletePod(ctx, cs, fmt.Sprintf("tb-gke-server-%s", safeType))
		_ = k8s.DeletePod(ctx, cs, fmt.Sprintf("tb-gke-client-%s", safeType))
	}

	program := func(_ *pulumi.Context) error { return nil }
	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return fmt.Errorf("select stack %s: %w", stackName, err)
	}
	_, err = stack.Destroy(ctx, optdestroy.ProgressStreams(log.Writer()))
	return err
}

func (p *GKEProvider) TeardownNetworking(ctx context.Context) error {
	stackName := "tailbench-gke-cluster"
	program := func(_ *pulumi.Context) error { return nil }
	stack, err := auto.SelectStackInlineSource(ctx, stackName, "tailbench", program, p.projectOpts()...)
	if err != nil {
		return fmt.Errorf("select cluster stack: %w", err)
	}
	_, err = stack.Destroy(ctx, optdestroy.ProgressStreams(log.Writer()))
	return err
}

func (p *GKEProvider) ListFamilies() []string {
	return (&GCPProvider{}).ListFamilies()
}

func (p *GKEProvider) ListInstances(ctx context.Context, family string) ([]InstanceInfo, error) {
	return (&GCPProvider{Project: p.Project, Zone: p.Zone}).ListInstances(ctx, family)
}

func (p *GKEProvider) GetVCPUs(ctx context.Context, instanceType string) (int, error) {
	return (&GCPProvider{Project: p.Project, Zone: p.Zone}).GetVCPUs(ctx, instanceType)
}

func (p *GKEProvider) IsQuotaError(err error) bool {
	s := err.Error()
	return strings.Contains(s, "QUOTA_EXCEEDED") ||
		strings.Contains(s, "ZONE_RESOURCE_POOL_EXHAUSTED") ||
		strings.Contains(s, "insufficient") ||
		strings.Contains(s, "Unschedulable")
}
