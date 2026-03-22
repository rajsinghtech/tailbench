# K8s Benchmark Providers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add EKS, GKE, and AKS providers that deploy Tailscale-sidecared benchmark pods on managed K8s clusters, measuring container networking overhead alongside existing VM benchmarks.

**Architecture:** Three new providers implement the existing `Provider` interface. A shared `internal/k8s/` package provides pod spec building and kubectl exec transport. The benchmark runner is refactored from concrete `*sshclient.Client` to an `Executor` interface, enabling both SSH (VMs) and kubectl exec (K8s) transports.

**Tech Stack:** Go, Pulumi Automation API, k8s.io/client-go, k8s.io/apimachinery, existing Pulumi cloud SDKs (pulumi-eks, pulumi-gcp, pulumi-azure-native)

**Spec:** `docs/superpowers/specs/2026-03-22-k8s-benchmark-providers-design.md`

---

## Phase 1: Foundation Refactoring

Refactor existing code to support pluggable executor transport. All existing VM behavior stays identical — no new features yet.

### Task 1: Executor Interface + SSHExecutor Wrapper

**Files:**
- Create: `internal/benchmark/executor.go`
- Modify: `internal/benchmark/runner.go:1-20` (imports, Runner struct)
- Modify: `internal/benchmark/tailscale.go:1-70` (all function signatures)

- [ ] **Step 1: Create the Executor interface and SSHExecutor**

Create `internal/benchmark/executor.go`:

```go
package benchmark

import (
	"context"

	"github.com/rajsinghtech/tailbench/internal/sshclient"
)

// Executor runs shell commands on a remote host.
type Executor interface {
	Run(ctx context.Context, cmd string) (stdout, stderr string, err error)
	Close() error
}

// SSHExecutor wraps an sshclient.Client to implement Executor.
type SSHExecutor struct {
	*sshclient.Client
}
```

`SSHExecutor` embeds `*sshclient.Client` directly — `Run()` and `Close()` already match the `Executor` interface signature.

- [ ] **Step 2: Update Runner struct to use Executor**

In `internal/benchmark/runner.go`, change the Runner struct (lines 16-20):

```go
type Runner struct {
	Server          Executor
	Client          Executor
	ServerTailscale Executor // targets tailscale container (K8s) or same as Server (VM)
	ClientTailscale Executor // targets tailscale container (K8s) or same as Client (VM)
	Config          RunConfig
}
```

Add `SkipTailscaleSetup bool` to `RunConfig` (line 23-33):

```go
type RunConfig struct {
	IPerfDuration      int
	IPerfParallel      int
	IPerfIterations    int
	MTRCycles          int
	CooldownSec        int
	CreditRetrySec     int
	AuthKey            string
	ServerHostname     string
	ClientHostname     string
	SkipTailscaleSetup bool // true for K8s (sidecar handles tailscale up)
}
```

- [ ] **Step 3: Update all helper function signatures**

In `internal/benchmark/runner.go`, change every function taking `*sshclient.Client` to take `Executor`:

- `verifyLAN(ctx, c *sshclient.Client, ...)` → `verifyLAN(ctx, c Executor, ...)`
- `startIPerfServer(ctx, server *sshclient.Client)` → `startIPerfServer(ctx, server Executor)`
- `stopIPerfServer(ctx, server *sshclient.Client)` → `stopIPerfServer(ctx, server Executor)`
- `runIPerfTest(ctx, c *sshclient.Client, ...)` → `runIPerfTest(ctx, c Executor, ...)`
- `runMTR(ctx, c *sshclient.Client, ...)` → `runMTR(ctx, c Executor, ...)`
- `collectSystemConfig(ctx, server *sshclient.Client)` → `collectSystemConfig(ctx, server Executor)`

In `internal/benchmark/tailscale.go`, same treatment:

- `TailscaleUp(ctx, c *sshclient.Client, ...)` → `TailscaleUp(ctx, c Executor, ...)`
- `GetTailscaleIP(ctx, c *sshclient.Client)` → `GetTailscaleIP(ctx, c Executor)`
- `WaitForPeer(ctx, c *sshclient.Client, ...)` → `WaitForPeer(ctx, c Executor, ...)`
- `WaitForDirect(ctx, c *sshclient.Client, ...)` → `WaitForDirect(ctx, c Executor, ...)`

Remove the `"github.com/rajsinghtech/tailbench/internal/sshclient"` import from both files (it's no longer needed — only `executor.go` imports it).

- [ ] **Step 4: Update RunFull to use ServerTailscale/ClientTailscale executors**

In `RunFull()` (runner.go:91-118), the Tailscale setup section changes to:

```go
// --- Tailscale setup ---
if !cfg.SkipTailscaleSetup {
	log.Println("bringing up tailscale on server")
	if err := TailscaleUp(ctx, r.ServerTailscale, cfg.AuthKey, cfg.ServerHostname); err != nil {
		return nil, err
	}
	log.Println("bringing up tailscale on client")
	if err := TailscaleUp(ctx, r.ClientTailscale, cfg.AuthKey, cfg.ClientHostname); err != nil {
		return nil, err
	}
}

serverTSIP, err := GetTailscaleIP(ctx, r.ServerTailscale)
if err != nil {
	return nil, fmt.Errorf("server tailscale IP: %w", err)
}
clientTSIP, err := GetTailscaleIP(ctx, r.ClientTailscale)
if err != nil {
	return nil, fmt.Errorf("client tailscale IP: %w", err)
}
log.Printf("tailscale IPs: server=%s client=%s", serverTSIP, clientTSIP)

if err := WaitForPeer(ctx, r.ClientTailscale, serverTSIP); err != nil {
	return nil, err
}
connType, err := WaitForDirect(ctx, r.ClientTailscale, serverTSIP)
```

And the tailscale version line (runner.go:177):

```go
stdout, _, _ := r.ServerTailscale.Run(ctx, "tailscale version | head -1")
```

- [ ] **Step 5: Fix verifyLAN to use ping instead of nc port 22**

In `verifyLAN()` (runner.go:203-217), change the check command:

```go
func verifyLAN(ctx context.Context, c Executor, targetIP string) error {
	for attempt := range 20 {
		_, _, err := c.Run(ctx, fmt.Sprintf("ping -c 1 -W 2 %s", targetIP))
		if err == nil {
			return nil
		}
		log.Printf("LAN check attempt %d/20 failed: %v", attempt+1, err)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(3 * time.Second):
		}
	}
	return fmt.Errorf("cannot reach %s after 20 attempts", targetIP)
}
```

- [ ] **Step 6: Verify it compiles**

Run: `go build ./...`
Expected: Clean compile. No tests yet — this is a pure refactor.

- [ ] **Step 7: Commit**

```bash
git add internal/benchmark/executor.go internal/benchmark/runner.go internal/benchmark/tailscale.go
git commit -m "Refactor benchmark runner to use Executor interface

Replace concrete *sshclient.Client with Executor interface throughout
the benchmark package. SSHExecutor wraps the existing client. Adds
ServerTailscale/ClientTailscale executor fields and SkipTailscaleSetup
config for K8s sidecar support. Change verifyLAN to use ping."
```

---

### Task 2: Orchestrator Executor Construction

**Files:**
- Modify: `internal/orchestrator/orchestrator.go:337-428` (runBenchmark)
- Modify: `internal/orchestrator/orchestrator.go:254-278` (runProvider cloud-init section)

- [ ] **Step 1: Update runBenchmark to construct SSHExecutor and pass to Runner**

In `runBenchmark()` (orchestrator.go:382-396), wrap the SSH clients in SSHExecutor and pass to Runner:

```go
serverExec := &benchmark.SSHExecutor{Client: serverSSH}
clientExec := &benchmark.SSHExecutor{Client: clientSSH}

runner := &benchmark.Runner{
	Server:          serverExec,
	Client:          clientExec,
	ServerTailscale: serverExec,
	ClientTailscale: clientExec,
	Config: benchmark.RunConfig{
		IPerfDuration:   o.cfg.IPerfDuration,
		IPerfParallel:   o.cfg.IPerfParallel,
		IPerfIterations: o.cfg.IPerfIterations,
		MTRCycles:       o.cfg.MTRCycles,
		CooldownSec:     o.cfg.CooldownSec,
		CreditRetrySec:  o.cfg.CreditRetrySec,
		AuthKey:         authKey,
		ServerHostname:  serverHostname,
		ClientHostname:  clientHostname,
	},
}
```

- [ ] **Step 2: Verify it compiles**

Run: `go build ./...`
Expected: Clean compile. VM flow unchanged.

- [ ] **Step 3: Commit**

```bash
git add internal/orchestrator/orchestrator.go
git commit -m "Wrap SSH clients in SSHExecutor for benchmark runner"
```

---

### Task 3: PairOutput K8s Fields + BenchmarkResult Environment

**Files:**
- Modify: `internal/provider/provider.go:29-41` (PairOutput struct)
- Modify: `internal/result/types.go:3-25` (BenchmarkResult struct)

- [ ] **Step 1: Add K8s fields to PairOutput**

In `internal/provider/provider.go`, add to the PairOutput struct (after line 41):

```go
type PairOutput struct {
	ServerName       string
	ClientName       string
	ServerIP         string
	ClientIP         string
	ServerLANIP      string
	ClientLANIP      string
	StackName        string
	ServerInstanceID string
	ClientInstanceID string
	ServerENIID      string
	ClientENIID      string
	// K8s-specific (empty for VM providers)
	Namespace  string
	Kubeconfig string
}
```

- [ ] **Step 2: Add Environment field to BenchmarkResult**

In `internal/result/types.go`, add `Environment` and `ContainerRuntime` to BenchmarkResult (after `ENAExpress` on line 14):

```go
ENAExpress         bool          `json:"ena_express"`
Environment        string        `json:"environment"`        // "vm" or "container"
```

Add `ContainerRuntime` to `SystemConfig` (after `KernelFull` on line 35):

```go
KernelFull       string `json:"kernel_full"`
ContainerRuntime string `json:"container_runtime,omitempty"`
```

- [ ] **Step 3: Set Environment in orchestrator**

In `internal/orchestrator/orchestrator.go` runBenchmark(), after line 421 (the switch statement setting region/zone), add:

```go
if pair.Namespace != "" {
	benchResult.Environment = "container"
} else {
	benchResult.Environment = "vm"
}
```

- [ ] **Step 4: Verify it compiles**

Run: `go build ./...`

- [ ] **Step 5: Commit**

```bash
git add internal/provider/provider.go internal/result/types.go internal/orchestrator/orchestrator.go
git commit -m "Add K8s fields to PairOutput and Environment to BenchmarkResult"
```

---

### Task 4: Config Additions + K8s Provider Registration

**Files:**
- Modify: `internal/config/config.go` (add BenchImage, TSImage fields)
- Modify: `internal/orchestrator/orchestrator.go` (register K8s providers, K8s branch in runProvider)

- [ ] **Step 1: Add K8s config fields**

In `internal/config/config.go`, add to the Config struct:

```go
BenchImage string // container image for benchmark tools
TSImage    string // tailscale sidecar image
```

In the `Parse()` function, add defaults:

```go
cfg.BenchImage = envOrDefault("BENCH_IMAGE", "tailbench-tools:latest")
cfg.TSImage = envOrDefault("TS_IMAGE", "ghcr.io/tailscale/tailscale:latest")
```

- [ ] **Step 2: Add K8s branch to runProvider cloud-init rendering**

In `internal/orchestrator/orchestrator.go`, at lines 254-269 (the cloud-init rendering section), wrap it in a VM/K8s branch:

```go
safeType := safeHostname(inst.Type)
serverHostname := fmt.Sprintf("tb-%s-server-%s", p.Name(), safeType)
clientHostname := fmt.Sprintf("tb-%s-client-%s", p.Name(), safeType)

var userData string
if isK8sProvider(p.Name()) {
	userData = *authKey
} else {
	serverUD, err := cloudinit.Render(cloudinit.Config{AuthKey: *authKey, Hostname: serverHostname})
	if err != nil {
		log.Printf("%s error rendering cloud-init for %s: %v", prefix, inst.Type, err)
		continue
	}
	userData = serverUD
}
```

Note: `clientHostname` is still used below in the `runBenchmark()` call (line 291) — do not assign it to `_`.

Wait — `clientUD` is also rendered but the existing code has `_ = clientUD` (line 269), meaning both VMs use `serverUD`. Keep the same pattern: just pass `userData` to `PairOptions.UserData`. The K8s provider gets the raw auth key.

Also update the CreatePair call (lines 272-279) — no change needed, `UserData: userData` already works.

Add the helper function:

```go
func isK8sProvider(name string) bool {
	switch name {
	case "eks", "gke", "aks":
		return true
	}
	return false
}
```

- [ ] **Step 3: Add K8s branch to runBenchmark**

In `runBenchmark()` (orchestrator.go:337-428), add a K8s branch at the top before SSH construction:

```go
func (o *Orchestrator) runBenchmark(ctx context.Context, p provider.Provider, pair *provider.PairOutput, inst provider.InstanceInfo, family, prefix, serverHostname, clientHostname, authKey string) error {
	if pair.Namespace != "" {
		return o.runK8sBenchmark(ctx, p, pair, inst, family, prefix, serverHostname, clientHostname, authKey)
	}
	// ... existing SSH code unchanged ...
}
```

Create the `runK8sBenchmark` method (stub for now — will be completed in Phase 2):

```go
func (o *Orchestrator) runK8sBenchmark(ctx context.Context, p provider.Provider, pair *provider.PairOutput, inst provider.InstanceInfo, family, prefix, serverHostname, clientHostname, authKey string) error {
	return fmt.Errorf("k8s benchmark not yet implemented")
}
```

- [ ] **Step 4: Register K8s providers in buildProvider**

In `orchestrator.go`'s `buildProvider()` function, add cases for the new providers (stubs):

```go
case "eks":
	return nil, fmt.Errorf("eks provider not yet implemented")
case "gke":
	return nil, fmt.Errorf("gke provider not yet implemented")
case "aks":
	return nil, fmt.Errorf("aks provider not yet implemented")
```

- [ ] **Step 5: Verify it compiles**

Run: `go build ./...`

- [ ] **Step 6: Commit**

```bash
git add internal/config/config.go internal/orchestrator/orchestrator.go
git commit -m "Add K8s config fields and orchestrator K8s branching"
```

---

## Phase 2: K8s Shared Infrastructure

### Task 5: KubeExecExecutor

**Files:**
- Create: `internal/k8s/kubeexec.go`

- [ ] **Step 1: Create KubeExecExecutor**

```go
package k8s

import (
	"bytes"
	"context"
	"fmt"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/remotecommand"
	"k8s.io/kubectl/pkg/scheme"
)

// KubeExecExecutor implements benchmark.Executor via kubectl exec.
type KubeExecExecutor struct {
	clientset  *kubernetes.Clientset
	restConfig *rest.Config
	namespace  string
	podName    string
	container  string
}

// NewKubeExecExecutor creates an executor targeting a specific container in a pod.
func NewKubeExecExecutor(kubeconfigData, namespace, podName, container string) (*KubeExecExecutor, error) {
	config, err := clientcmd.RESTConfigFromKubeConfig([]byte(kubeconfigData))
	if err != nil {
		return nil, fmt.Errorf("parse kubeconfig: %w", err)
	}

	cs, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("create clientset: %w", err)
	}

	return &KubeExecExecutor{
		clientset:  cs,
		restConfig: config,
		namespace:  namespace,
		podName:    podName,
		container:  container,
	}, nil
}

func (e *KubeExecExecutor) Run(ctx context.Context, cmd string) (string, string, error) {
	req := e.clientset.CoreV1().RESTClient().Post().
		Resource("pods").
		Name(e.podName).
		Namespace(e.namespace).
		SubResource("exec").
		VersionedParams(&corev1.PodExecOptions{
			Container: e.container,
			Command:   []string{"/bin/sh", "-c", cmd},
			Stdout:    true,
			Stderr:    true,
		}, scheme.ParameterCodec)

	exec, err := remotecommand.NewSPDYExecutor(e.restConfig, "POST", req.URL())
	if err != nil {
		return "", "", fmt.Errorf("create executor: %w", err)
	}

	var stdout, stderr bytes.Buffer
	err = exec.StreamWithContext(ctx, remotecommand.StreamOptions{
		Stdout: &stdout,
		Stderr: &stderr,
	})
	if err != nil {
		return stdout.String(), stderr.String(), err
	}
	return stdout.String(), stderr.String(), nil
}

func (e *KubeExecExecutor) Close() error {
	return nil // no persistent connection to close
}
```

- [ ] **Step 2: Add k8s.io dependencies**

Run: `go get k8s.io/client-go@latest k8s.io/apimachinery@latest k8s.io/kubectl@latest`

- [ ] **Step 3: Verify it compiles**

Run: `go build ./...`

- [ ] **Step 4: Commit**

```bash
git add internal/k8s/kubeexec.go go.mod go.sum
git commit -m "Add KubeExecExecutor for kubectl exec benchmark transport"
```

---

### Task 6: Shared Pod Spec Builder

**Files:**
- Create: `internal/k8s/pods.go`

- [ ] **Step 1: Create pod spec builder**

```go
package k8s

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

const (
	Namespace      = "tailbench"
	BenchContainer = "bench"
	TSContainer    = "tailscale"
	AuthSecretName = "tailbench-auth"
	AuthSecretKey  = "TS_AUTHKEY"
)

// PodConfig holds configuration for building benchmark pods.
type PodConfig struct {
	BenchImage string
	TSImage    string
	AuthKey    string
	Hostname   string
}

// BuildPod creates a benchmark pod spec with Tailscale sidecar.
func BuildPod(name string, cfg PodConfig) *corev1.Pod {
	privileged := true
	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: Namespace,
			Labels:    map[string]string{"app": "tailbench", "role": name},
		},
		Spec: corev1.PodSpec{
			InitContainers: []corev1.Container{
				{
					Name:    "sysctler",
					Image:   cfg.TSImage,
					Command: []string{"/bin/sh", "-c"},
					Args:    []string{"sysctl -w net.ipv4.ip_forward=1 && if sysctl net.ipv6.conf.all.forwarding; then sysctl -w net.ipv6.conf.all.forwarding=1; fi"},
					SecurityContext: &corev1.SecurityContext{
						Privileged: &privileged,
					},
				},
			},
			Containers: []corev1.Container{
				{
					Name:    BenchContainer,
					Image:   cfg.BenchImage,
					Command: []string{"sleep", "infinity"},
				},
				{
					Name:  TSContainer,
					Image: cfg.TSImage,
					SecurityContext: &corev1.SecurityContext{
						Privileged: &privileged,
					},
					Env: []corev1.EnvVar{
						{Name: "TS_USERSPACE", Value: "false"},
						{Name: "TS_KUBE_SECRET", Value: ""},
						{Name: "TS_STATE_DIR", Value: "/dev/shm"},
						{Name: "TS_DEBUG_FIREWALL_MODE", Value: "auto"},
						{Name: "TS_AUTHKEY", ValueFrom: &corev1.EnvVarSource{
							SecretKeyRef: &corev1.SecretKeySelector{
								LocalObjectReference: corev1.LocalObjectReference{Name: AuthSecretName},
								Key:                  AuthSecretKey,
							},
						}},
						{Name: "TS_HOSTNAME", Value: cfg.Hostname},
						{Name: "TS_EXTRA_ARGS", Value: "--advertise-tags=tag:bench --accept-routes"},
						{Name: "TS_ACCEPT_DNS", Value: "true"},
					},
				},
			},
			RestartPolicy: corev1.RestartPolicyNever,
		},
	}
}

// SetAntiAffinity adds pod anti-affinity so server and client land on different nodes.
func SetAntiAffinity(pod *corev1.Pod, avoidLabel string) {
	pod.Spec.Affinity = &corev1.Affinity{
		PodAntiAffinity: &corev1.PodAntiAffinity{
			RequiredDuringSchedulingIgnoredDuringExecution: []corev1.PodAffinityTerm{
				{
					LabelSelector: &metav1.LabelSelector{
						MatchLabels: map[string]string{"role": avoidLabel},
					},
					TopologyKey: "kubernetes.io/hostname",
				},
			},
		},
	}
}

// EnsureNamespace creates the tailbench namespace if it doesn't exist.
func EnsureNamespace(ctx context.Context, cs *kubernetes.Clientset) error {
	_, err := cs.CoreV1().Namespaces().Get(ctx, Namespace, metav1.GetOptions{})
	if err == nil {
		return nil
	}
	ns := &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: Namespace}}
	_, err = cs.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{})
	return err
}

// CreateAuthSecret creates or updates the tailscale auth key secret.
func CreateAuthSecret(ctx context.Context, cs *kubernetes.Clientset, authKey string) error {
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      AuthSecretName,
			Namespace: Namespace,
		},
		StringData: map[string]string{AuthSecretKey: authKey},
	}
	_, err := cs.CoreV1().Secrets(Namespace).Get(ctx, AuthSecretName, metav1.GetOptions{})
	if err != nil {
		_, err = cs.CoreV1().Secrets(Namespace).Create(ctx, secret, metav1.CreateOptions{})
	} else {
		_, err = cs.CoreV1().Secrets(Namespace).Update(ctx, secret, metav1.UpdateOptions{})
	}
	return err
}

// DeployPod creates a pod and waits for it to be Running.
func DeployPod(ctx context.Context, cs *kubernetes.Clientset, pod *corev1.Pod, timeout time.Duration) error {
	_, err := cs.CoreV1().Pods(Namespace).Create(ctx, pod, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("create pod %s: %w", pod.Name, err)
	}
	return WaitForPodRunning(ctx, cs, pod.Name, timeout)
}

// WaitForPodRunning polls until a pod is Running or the timeout expires.
func WaitForPodRunning(ctx context.Context, cs *kubernetes.Clientset, name string, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		pod, err := cs.CoreV1().Pods(Namespace).Get(ctx, name, metav1.GetOptions{})
		if err == nil && pod.Status.Phase == corev1.PodRunning {
			return nil
		}
		if err == nil && pod.Status.Phase == corev1.PodFailed {
			return fmt.Errorf("pod %s failed", name)
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(5 * time.Second):
		}
	}
	return fmt.Errorf("pod %s not running after %v", name, timeout)
}

// GetPodIP returns the pod's IP address.
func GetPodIP(ctx context.Context, cs *kubernetes.Clientset, name string) (string, error) {
	pod, err := cs.CoreV1().Pods(Namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return "", err
	}
	if pod.Status.PodIP == "" {
		return "", fmt.Errorf("pod %s has no IP", name)
	}
	return pod.Status.PodIP, nil
}

// DeletePod deletes a pod by name.
func DeletePod(ctx context.Context, cs *kubernetes.Clientset, name string) error {
	return cs.CoreV1().Pods(Namespace).Delete(ctx, name, metav1.DeleteOptions{})
}

// ClientsetFromKubeconfig creates a Kubernetes clientset from raw kubeconfig data.
func ClientsetFromKubeconfig(kubeconfigData string) (*kubernetes.Clientset, error) {
	data, err := base64.StdEncoding.DecodeString(kubeconfigData)
	if err != nil {
		// Try as raw (not base64)
		data = []byte(kubeconfigData)
	}
	config, err := clientcmd.RESTConfigFromKubeConfig(data)
	if err != nil {
		return nil, fmt.Errorf("parse kubeconfig: %w", err)
	}
	return kubernetes.NewForConfig(config)
}

// WaitForNodes waits until at least `count` nodes with the given label are Ready.
func WaitForNodes(ctx context.Context, cs *kubernetes.Clientset, labelSelector string, count int, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		nodes, err := cs.CoreV1().Nodes().List(ctx, metav1.ListOptions{LabelSelector: labelSelector})
		if err == nil {
			ready := 0
			for _, node := range nodes.Items {
				for _, cond := range node.Status.Conditions {
					if cond.Type == corev1.NodeReady && cond.Status == corev1.ConditionTrue {
						ready++
					}
				}
			}
			if ready >= count {
				log.Printf("nodes ready: %d/%d", ready, count)
				return nil
			}
			log.Printf("waiting for nodes: %d/%d ready", ready, count)
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(10 * time.Second):
		}
	}
	return fmt.Errorf("expected %d ready nodes, timed out after %v", count, timeout)
}
```

- [ ] **Step 2: Verify it compiles**

Run: `go build ./...`

- [ ] **Step 3: Commit**

```bash
git add internal/k8s/pods.go
git commit -m "Add shared K8s pod spec builder and utilities"
```

---

### Task 7: Orchestrator runK8sBenchmark Implementation

**Files:**
- Modify: `internal/orchestrator/orchestrator.go` (implement runK8sBenchmark)

- [ ] **Step 1: Implement runK8sBenchmark**

Replace the stub from Task 4 with:

```go
func (o *Orchestrator) runK8sBenchmark(ctx context.Context, p provider.Provider, pair *provider.PairOutput, inst provider.InstanceInfo, family, prefix, serverHostname, clientHostname, authKey string) error {
	log.Printf("%s constructing kubectl exec transport", prefix)

	// Build executors for bench containers
	serverBench, err := k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ServerName, k8s.BenchContainer)
	if err != nil {
		return fmt.Errorf("server bench executor: %w", err)
	}
	clientBench, err := k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ClientName, k8s.BenchContainer)
	if err != nil {
		return fmt.Errorf("client bench executor: %w", err)
	}

	// Build executors for tailscale sidecar containers
	serverTS, err := k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ServerName, k8s.TSContainer)
	if err != nil {
		return fmt.Errorf("server tailscale executor: %w", err)
	}
	clientTS, err := k8s.NewKubeExecExecutor(pair.Kubeconfig, pair.Namespace, pair.ClientName, k8s.TSContainer)
	if err != nil {
		return fmt.Errorf("client tailscale executor: %w", err)
	}

	runner := &benchmark.Runner{
		Server:          serverBench,
		Client:          clientBench,
		ServerTailscale: serverTS,
		ClientTailscale: clientTS,
		Config: benchmark.RunConfig{
			IPerfDuration:      o.cfg.IPerfDuration,
			IPerfParallel:      o.cfg.IPerfParallel,
			IPerfIterations:    o.cfg.IPerfIterations,
			MTRCycles:          o.cfg.MTRCycles,
			CooldownSec:        o.cfg.CooldownSec,
			CreditRetrySec:     o.cfg.CreditRetrySec,
			AuthKey:            authKey,
			ServerHostname:     serverHostname,
			ClientHostname:     clientHostname,
			SkipTailscaleSetup: true,
		},
	}

	log.Printf("%s running K8s benchmark for %s", prefix, inst.Type)
	benchResult, err := runner.RunFull(ctx, pair.ServerLANIP, pair.ClientLANIP)
	if err != nil {
		return fmt.Errorf("benchmark %s: %w", inst.Type, err)
	}

	benchResult.CloudProvider = p.Name()
	benchResult.InstanceFamily = family
	benchResult.InstanceType = inst.Type
	benchResult.VCPUs = inst.VCPUs
	benchResult.Date = time.Now().UTC().Format("2006-01-02")
	benchResult.Environment = "container"

	switch p.Name() {
	case "gke":
		benchResult.Region = o.cfg.GCPZone[:strings.LastIndex(o.cfg.GCPZone, "-")]
		benchResult.Zone = o.cfg.GCPZone
	case "eks":
		benchResult.Region = o.cfg.AWSRegion
		benchResult.Zone = o.cfg.AWSAZ
	case "aks":
		benchResult.Region = o.cfg.AzureLocation
		benchResult.Zone = o.cfg.AzureLocation
	}

	if err := result.WriteResult(o.cfg.RootDir, benchResult, false); err != nil {
		return fmt.Errorf("write result: %w", err)
	}
	log.Printf("%s K8s result written for %s", prefix, inst.Type)
	return nil
}
```

Add import for `k8s` package: `"github.com/rajsinghtech/tailbench/internal/k8s"`

- [ ] **Step 2: Verify it compiles**

Run: `go build ./...`

- [ ] **Step 3: Commit**

```bash
git add internal/orchestrator/orchestrator.go
git commit -m "Implement runK8sBenchmark with kubectl exec transport"
```

---

### Task 8: Dockerfile for tailbench-tools

**Files:**
- Create: `docker/tailbench-tools/Dockerfile`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM ubuntu:24.04

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        iperf3 \
        mtr-tiny \
        jq \
        curl \
        iputils-ping \
        iproute2 \
        net-tools \
    && rm -rf /var/lib/apt/lists/*

CMD ["sleep", "infinity"]
```

- [ ] **Step 2: Commit**

```bash
git add docker/tailbench-tools/Dockerfile
git commit -m "Add tailbench-tools container image for K8s benchmarks"
```

---

## Phase 3: Cloud Providers

Each provider follows the same pattern. They can be implemented in parallel since they're independent.

### Task 9: GKE Provider

**Files:**
- Create: `internal/provider/gke.go`
- Modify: `internal/orchestrator/orchestrator.go` (register provider in buildProvider)

- [ ] **Step 1: Create GKE provider**

Create `internal/provider/gke.go`. This provider uses Pulumi to create a GKE cluster, node pools, and deploys benchmark pods.

```go
package provider

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/pulumi/pulumi-gcp/sdk/v9/go/gcp/container"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/common/workspace"
	"github.com/rajsinghtech/tailbench/internal/k8s"
)

type GKEProvider struct {
	Project  string
	Zone     string
	StateDir string

	kubeconfig string // set after SetupNetworking
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

	// Get kubeconfig via gcloud
	out, err := exec.CommandContext(ctx, "gcloud", "container", "clusters", "get-credentials",
		clusterName, "--zone", p.Zone, "--project", p.Project,
		"--quiet",
	).CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("get-credentials: %s: %w", out, err)
	}

	kubeconfigOut, err := exec.CommandContext(ctx, "kubectl", "config", "view", "--raw", "-o", "json").Output()
	if err != nil {
		return nil, fmt.Errorf("get kubeconfig: %w", err)
	}
	p.kubeconfig = base64.StdEncoding.EncodeToString(kubeconfigOut)

	// Set up namespace and RBAC
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

	// Create dedicated node pool for this instance type
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

	_, err = stack.Up(ctx, optup.ProgressStreams(log.Writer()))
	if err != nil {
		return nil, fmt.Errorf("create node pool %s: %w", opts.InstanceType, err)
	}

	// Wait for nodes
	cs, err := k8s.ClientsetFromKubeconfig(p.kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("create clientset: %w", err)
	}

	nodeLabel := fmt.Sprintf("tailbench-pool=%s", safeType)
	if err := k8s.WaitForNodes(ctx, cs, nodeLabel, 2, 10*time.Minute); err != nil {
		return nil, fmt.Errorf("wait for nodes: %w", err)
	}

	// Create auth secret
	authKey := opts.UserData // K8s providers receive raw auth key via UserData
	if err := k8s.CreateAuthSecret(ctx, cs, authKey); err != nil {
		return nil, fmt.Errorf("create auth secret: %w", err)
	}

	// Deploy server and client pods
	serverName := fmt.Sprintf("tb-gke-server-%s", safeType)
	clientName := fmt.Sprintf("tb-gke-client-%s", safeType)

	serverHostname := fmt.Sprintf("tb-gke-server-%s", safeType)
	clientHostname := fmt.Sprintf("tb-gke-client-%s", safeType)

	serverPod := k8s.BuildPod(serverName, k8s.PodConfig{
		BenchImage: "tailbench-tools:latest", // TODO: use config
		TSImage:    "ghcr.io/tailscale/tailscale:latest",
		AuthKey:    authKey,
		Hostname:   serverHostname,
	})
	serverPod.Spec.NodeSelector = map[string]string{"tailbench-pool": safeType}

	clientPod := k8s.BuildPod(clientName, k8s.PodConfig{
		BenchImage: "tailbench-tools:latest",
		TSImage:    "ghcr.io/tailscale/tailscale:latest",
		AuthKey:    authKey,
		Hostname:   clientHostname,
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

	// Delete pods first
	cs, err := k8s.ClientsetFromKubeconfig(p.kubeconfig)
	if err == nil {
		serverName := fmt.Sprintf("tb-gke-server-%s", safeType)
		clientName := fmt.Sprintf("tb-gke-client-%s", safeType)
		_ = k8s.DeletePod(ctx, cs, serverName)
		_ = k8s.DeletePod(ctx, cs, clientName)
	}

	// Destroy node pool stack
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

// ListFamilies, ListInstances, GetVCPUs reuse GCP's machine type CLI
func (p *GKEProvider) ListFamilies() []string {
	return (&GCPProvider{}).ListFamilies()
}

func (p *GKEProvider) ListInstances(ctx context.Context, family string) ([]InstanceInfo, error) {
	gcp := &GCPProvider{Project: p.Project, Zone: p.Zone}
	return gcp.ListInstances(ctx, family)
}

func (p *GKEProvider) GetVCPUs(ctx context.Context, instanceType string) (int, error) {
	gcp := &GCPProvider{Project: p.Project, Zone: p.Zone}
	return gcp.GetVCPUs(ctx, instanceType)
}

func (p *GKEProvider) IsQuotaError(err error) bool {
	s := err.Error()
	return strings.Contains(s, "QUOTA_EXCEEDED") ||
		strings.Contains(s, "ZONE_RESOURCE_POOL_EXHAUSTED") ||
		strings.Contains(s, "insufficient") ||
		strings.Contains(s, "Unschedulable")
}
```

- [ ] **Step 2: Register GKE in orchestrator's buildProvider**

Replace the stub:

```go
case "gke":
	return &provider.GKEProvider{
		Project:  cfg.GCPProject,
		Zone:     cfg.GCPZone,
		StateDir: cfg.StateDir,
	}, nil
```

- [ ] **Step 3: Verify it compiles**

Run: `go build ./...`

- [ ] **Step 4: Commit**

```bash
git add internal/provider/gke.go internal/orchestrator/orchestrator.go
git commit -m "Add GKE provider with cluster and node pool provisioning"
```

---

### Task 10: EKS Provider

**Files:**
- Create: `internal/provider/eks.go`
- Modify: `internal/orchestrator/orchestrator.go` (register)

- [ ] **Step 1: Create EKS provider**

Create `internal/provider/eks.go`:

```go
package provider

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
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

	// Derive a second AZ for EKS subnet requirement
	az2 := p.AZ[:len(p.AZ)-1] + "b"
	if p.AZ[len(p.AZ)-1] == 'b' {
		az2 = p.AZ[:len(p.AZ)-1] + "c"
	}

	program := func(pCtx *pulumi.Context) error {
		// VPC
		vpc, err := ec2.NewVpc(pCtx, "tailbench-eks-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Two subnets in different AZs (EKS requirement)
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

		// Internet gateway
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
		_, err = ec2.NewRouteTableAssociation(pCtx, "tailbench-eks-rta-1", &ec2.RouteTableAssociationArgs{
			SubnetId:     subnet1.ID(),
			RouteTableId: rt.ID(),
		})
		if err != nil {
			return err
		}
		_, err = ec2.NewRouteTableAssociation(pCtx, "tailbench-eks-rta-2", &ec2.RouteTableAssociationArgs{
			SubnetId:     subnet2.ID(),
			RouteTableId: rt.ID(),
		})
		if err != nil {
			return err
		}

		// EKS cluster IAM role
		clusterRole, err := iam.NewRole(pCtx, "tailbench-eks-cluster-role", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"eks.amazonaws.com"},"Action":"sts:AssumeRole"}]}`),
		})
		if err != nil {
			return err
		}
		_, err = iam.NewRolePolicyAttachment(pCtx, "eks-cluster-policy", &iam.RolePolicyAttachmentArgs{
			Role:      clusterRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"),
		})
		if err != nil {
			return err
		}

		// EKS cluster
		cluster, err := awseks.NewCluster(pCtx, "tailbench-eks", &awseks.ClusterArgs{
			RoleArn: clusterRole.Arn,
			VpcConfig: &awseks.ClusterVpcConfigArgs{
				SubnetIds: pulumi.StringArray{subnet1.ID(), subnet2.ID()},
			},
		})
		if err != nil {
			return err
		}

		// Node IAM role
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
			_, err = iam.NewRolePolicyAttachment(pCtx, fmt.Sprintf("eks-node-policy-%d", i), &iam.RolePolicyAttachmentArgs{
				Role:      nodeRole.Name,
				PolicyArn: pulumi.String(policy),
			})
			if err != nil {
				return err
			}
		}

		pCtx.Export("clusterName", cluster.Name)
		pCtx.Export("clusterEndpoint", cluster.Endpoint)
		pCtx.Export("clusterCaCert", cluster.CertificateAuthorities.Index(pulumi.Int(0)).Data())
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

	// Get kubeconfig via aws eks
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

	_, err = stack.Up(ctx, optup.ProgressStreams(log.Writer()))
	if err != nil {
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

	serverPod := k8s.BuildPod(serverName, k8s.PodConfig{
		BenchImage: opts.BenchImage,
		TSImage:    opts.TSImage,
		Hostname:   serverName,
	})
	serverPod.Spec.NodeSelector = map[string]string{"tailbench-pool": safeType}

	clientPod := k8s.BuildPod(clientName, k8s.PodConfig{
		BenchImage: opts.BenchImage,
		TSImage:    opts.TSImage,
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
```

Add missing imports at top: `"encoding/base64"`, `"os/exec"`.

- [ ] **Step 2: Register in orchestrator**

```go
case "eks":
	return &provider.EKSProvider{
		Region:   cfg.AWSRegion,
		AZ:       cfg.AWSAZ,
		StateDir: cfg.StateDir,
	}, nil
```

- [ ] **Step 3: Verify and commit**

```bash
go build ./...
git add internal/provider/eks.go internal/orchestrator/orchestrator.go
git commit -m "Add EKS provider with VPC, cluster, and managed node group provisioning"
```

---

### Task 11: AKS Provider

**Files:**
- Create: `internal/provider/aks.go`
- Modify: `internal/orchestrator/orchestrator.go` (register)

- [ ] **Step 1: Create AKS provider**

Create `internal/provider/aks.go`:

```go
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

	// Get kubeconfig via az CLI
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
	safeType := strings.ReplaceAll(strings.ReplaceAll(opts.InstanceType, ".", "-"), "_", "-")
	safeType = strings.ToLower(safeType)
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

	serverPod := k8s.BuildPod(serverName, k8s.PodConfig{
		BenchImage: opts.BenchImage,
		TSImage:    opts.TSImage,
		Hostname:   serverName,
	})
	serverPod.Spec.NodeSelector = map[string]string{"tailbench-pool": safeType}

	clientPod := k8s.BuildPod(clientName, k8s.PodConfig{
		BenchImage: opts.BenchImage,
		TSImage:    opts.TSImage,
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
```

- [ ] **Step 2: Register in orchestrator**

```go
case "aks":
	return &provider.AKSProvider{
		Location:      cfg.AzureLocation,
		ResourceGroup: cfg.AzureResourceGroup,
		StateDir:      cfg.StateDir,
	}, nil
```

- [ ] **Step 3: Verify and commit**

```bash
go build ./...
git add internal/provider/aks.go internal/orchestrator/orchestrator.go
git commit -m "Add AKS provider with cluster and agent pool provisioning"
```

---

## Phase 4: Integration

### Task 12: Wire BenchImage/TSImage Through Providers

**Files:**
- Modify: `internal/provider/gke.go` (use config images)
- Modify: `internal/provider/eks.go` (use config images)
- Modify: `internal/provider/aks.go` (use config images)
- Modify: `internal/provider/provider.go` (add image fields to PairOptions or provider base)

- [ ] **Step 1: Add image fields to PairOptions**

In `internal/provider/provider.go`, add to PairOptions:

```go
type PairOptions struct {
	InstanceType string
	UserData     string
	Networking   *NetworkingOutput
	SSHKeyPath   string
	SSHPubKey    string
	SSHUser      string
	BenchImage   string // K8s benchmark container image
	TSImage      string // K8s tailscale sidecar image
}
```

- [ ] **Step 2: Pass images from orchestrator**

In orchestrator.go's `runProvider()`, update the CreatePair call:

```go
pair, err := p.CreatePair(ctx, provider.PairOptions{
	InstanceType: inst.Type,
	UserData:     userData,
	Networking:   net,
	SSHKeyPath:   o.cfg.SSHKeyPath,
	SSHPubKey:    sshPubKeyForProvider(p.Name(), o.cfg),
	SSHUser:      sshUserForProvider(p.Name(), o.cfg),
	BenchImage:   o.cfg.BenchImage,
	TSImage:      o.cfg.TSImage,
})
```

- [ ] **Step 3: Use images in K8s providers**

In GKE/EKS/AKS providers' CreatePair, replace hardcoded image strings:

```go
serverPod := k8s.BuildPod(serverName, k8s.PodConfig{
	BenchImage: opts.BenchImage,
	TSImage:    opts.TSImage,
	AuthKey:    authKey,
	Hostname:   serverHostname,
})
```

- [ ] **Step 4: Verify and commit**

```bash
go build ./...
git add internal/provider/provider.go internal/provider/gke.go internal/provider/eks.go internal/provider/aks.go internal/orchestrator/orchestrator.go
git commit -m "Wire BenchImage and TSImage config through to K8s providers"
```

---

### Task 13: Container Runtime Detection in collectSystemConfig

**Files:**
- Modify: `internal/benchmark/runner.go:314-371` (collectSystemConfig)
- Modify: `internal/result/types.go` (SystemConfig struct)

- [ ] **Step 1: Add ContainerRuntime to SystemConfig**

Already done in Task 3. Verify `ContainerRuntime string` field exists in `SystemConfig`.

- [ ] **Step 2: Detect container runtime and handle missing ethtool**

In `collectSystemConfig()` (runner.go:314-371), add container runtime detection at the end and make ethtool failures graceful:

```go
// Container runtime detection
if stdout, _, err := server.Run(ctx, "cat /proc/1/cgroup 2>/dev/null | head -5"); err == nil {
	cgroup := strings.TrimSpace(stdout)
	switch {
	case strings.Contains(cgroup, "containerd"):
		cfg.ContainerRuntime = "containerd"
	case strings.Contains(cgroup, "cri-o"):
		cfg.ContainerRuntime = "cri-o"
	case strings.Contains(cgroup, "docker"):
		cfg.ContainerRuntime = "docker"
	case cgroup == "":
		cfg.ContainerRuntime = "" // VM — no cgroup container info
	default:
		cfg.ContainerRuntime = "unknown"
	}
}
```

For the GRO UDP forwarding check (line 344), the existing code already handles errors silently (the `if stdout, _, err :=` pattern), so ethtool failure just leaves the field at zero-value. No change needed.

- [ ] **Step 3: Verify and commit**

```bash
go build ./...
git add internal/benchmark/runner.go internal/result/types.go
git commit -m "Add container runtime detection to system config collection"
```

---

## Phase 5: End-to-End Validation

### Task 14: Simultaneous 3-Cloud E2E Test

Run all three K8s providers simultaneously against one instance type per cloud to validate the full pipeline.

**Prerequisites:**
- `tailbench-tools` image pushed to ECR, Artifact Registry, and ACR
- Cloud credentials configured for all three (AWS, GCP, Azure)
- Tailscale OAuth credentials set

- [ ] **Step 1: Build and push the benchmark image to all three registries**

```bash
# Build locally
docker build -t tailbench-tools:latest docker/tailbench-tools/

# GCP Artifact Registry
docker tag tailbench-tools:latest us-docker.pkg.dev/$GCP_PROJECT/tailbench/tailbench-tools:latest
docker push us-docker.pkg.dev/$GCP_PROJECT/tailbench/tailbench-tools:latest

# AWS ECR
aws ecr create-repository --repository-name tailbench-tools --region $AWS_REGION || true
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker tag tailbench-tools:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/tailbench-tools:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/tailbench-tools:latest

# Azure ACR
az acr create --resource-group $AZURE_RG --name tailbenchacr --sku Basic || true
az acr login --name tailbenchacr
docker tag tailbench-tools:latest tailbenchacr.azurecr.io/tailbench-tools:latest
docker push tailbenchacr.azurecr.io/tailbench-tools:latest
```

- [ ] **Step 2: Run simultaneous test with all three K8s providers**

Pick one small instance type per cloud for validation:

```bash
CLOUD_PROVIDER=eks,gke,aks \
FILTER="c7g.medium|n2-standard-2|Standard_D2s_v5" \
BENCH_IMAGE_EKS="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/tailbench-tools:latest" \
BENCH_IMAGE_GKE="us-docker.pkg.dev/$GCP_PROJECT/tailbench/tailbench-tools:latest" \
BENCH_IMAGE_AKS="tailbenchacr.azurecr.io/tailbench-tools:latest" \
CREATE_TAILNET=true \
CLEANUP_NETWORKING=true \
go run ./cmd/tailbench
```

Note: The orchestrator already runs providers in parallel (one goroutine per provider). All three clusters will be created simultaneously.

- [ ] **Step 3: Verify results**

Check that result files exist for all three providers:

```bash
find . -path "*/eks/*/results/*.json" -o -path "*/gke/*/results/*.json" -o -path "*/aks/*/results/*.json" | sort
```

Validate each result has:
- `"environment": "container"`
- `"cloud_provider": "eks"` / `"gke"` / `"aks"`
- Non-zero `baseline_tcp` and `tailscale_tcp` bandwidth values
- Valid `overhead` percentages

```bash
for f in $(find . -path "*/eks/*/results/*.json" -o -path "*/gke/*/results/*.json" -o -path "*/aks/*/results/*.json"); do
  echo "=== $f ==="
  jq '{provider: .cloud_provider, env: .environment, type: .instance_type, baseline_mbps: .baseline_tcp.summary.bandwidth_mbps_avg, ts_mbps: .tailscale_tcp.summary.bandwidth_mbps_avg, overhead_pct: .overhead.bandwidth_pct}' "$f"
done
```

- [ ] **Step 4: Tear down if not auto-cleaned**

If `CLEANUP_NETWORKING=true` was set, clusters should already be destroyed. Verify:

```bash
gcloud container clusters list --project=$GCP_PROJECT --filter="name:tailbench" 2>/dev/null
aws eks list-clusters --region $AWS_REGION 2>/dev/null | grep tailbench
az aks list --resource-group $AZURE_RG --query "[?contains(name,'tailbench')]" 2>/dev/null
```

- [ ] **Step 5: Commit results and final cleanup**

```bash
git add -A
git commit -m "Add K8s benchmark results from simultaneous EKS/GKE/AKS validation run"
```
