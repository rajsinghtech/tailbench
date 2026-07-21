//go:build k8s

package k8s

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

const (
	// ProxyGroupName is the name of the operator-managed egress ProxyGroup
	// used as the DUT for the forwarding-pps benchmark. Keep in sync with
	// manifests/proxygroup/base/proxygroup.yaml.
	ProxyGroupName = "tailbench-egress"
	// ProxyGroupAnnotation selects the ProxyGroup that exposes an egress
	// service to cluster workloads.
	ProxyGroupAnnotation = "tailscale.com/proxy-group"
	// TailnetFQDNAnnotation points an egress service at a tailnet host.
	TailnetFQDNAnnotation = "tailscale.com/tailnet-fqdn"
	// forwardingOptEnv toggles Tailscale forwarding optimizations on the
	// ProxyClasses (A/B knob for the forwarding-pps benchmark).
	forwardingOptEnv = "TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS"
)

// ProxyGroupRolloutState captures the operator-generated StatefulSet state
// before a ProxyClass update. WaitForProxyGroupReady uses it to distinguish
// an idempotent apply from an off/on transition that must produce a new
// StatefulSet revision.
type ProxyGroupRolloutState struct {
	UpdateRevision          string
	ForwardingOptimizations bool
}

// DeployProxyGroup applies the ProxyGroup/ProxyClass manifests using
// kubectl apply -k. optimizations=false applies the base ("off" state, no
// forwarding-optimizations env); optimizations=true applies overlays/on,
// which patches TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS=true onto
// both ProxyClasses.
func DeployProxyGroup(ctx context.Context, kubeconfigB64 string, rootDir string, optimizations bool) error {
	tmp, err := writeKubeconfig(kubeconfigB64)
	if err != nil {
		return err
	}
	defer os.Remove(tmp)

	variant := "base"
	if optimizations {
		variant = "overlays/on"
	}
	manifestsDir := rootDir + "/manifests/proxygroup/" + variant
	if _, err := os.Stat(manifestsDir); err != nil {
		return fmt.Errorf("proxygroup manifests not found at %s: %w", manifestsDir, err)
	}

	log.Printf("deploying ProxyGroup manifests from %s (forwarding optimizations=%t)", manifestsDir, optimizations)
	return runCmd(ctx, "kubectl", "--kubeconfig", tmp, "apply", "-k", manifestsDir)
}

// findProxyGroupSTS returns the StatefulSet the operator created for the
// ProxyGroup. The operator names it after the ProxyGroup; fall back to a
// name-prefix match in case that changes.
func findProxyGroupSTS(ctx context.Context, cs kubernetes.Interface, name string) (*appsv1.StatefulSet, error) {
	sts, err := cs.AppsV1().StatefulSets(OperatorNamespace).Get(ctx, name, metav1.GetOptions{})
	if err == nil {
		return sts, nil
	}
	list, lerr := cs.AppsV1().StatefulSets(OperatorNamespace).List(ctx, metav1.ListOptions{})
	if lerr != nil {
		return nil, err
	}
	for i := range list.Items {
		if strings.HasPrefix(list.Items[i].Name, name) {
			return &list.Items[i], nil
		}
	}
	return nil, err
}

// GetProxyGroupRolloutState returns the current operator-generated
// StatefulSet revision and forwarding-optimization setting. Call it before
// applying a ProxyClass update so the subsequent readiness wait can reject a
// stale, already-ready revision.
func GetProxyGroupRolloutState(ctx context.Context, cs kubernetes.Interface, name string) (ProxyGroupRolloutState, error) {
	sts, err := findProxyGroupSTS(ctx, cs, name)
	if err != nil {
		return ProxyGroupRolloutState{}, err
	}
	return ProxyGroupRolloutState{
		UpdateRevision:          sts.Status.UpdateRevision,
		ForwardingOptimizations: forwardingOptimizationsEnabled(sts),
	}, nil
}

func forwardingOptimizationsEnabled(sts *appsv1.StatefulSet) bool {
	for _, container := range sts.Spec.Template.Spec.Containers {
		for _, env := range container.Env {
			if env.Name == forwardingOptEnv && strings.EqualFold(env.Value, "true") {
				return true
			}
		}
	}
	return false
}

func proxyGroupRolloutReady(sts *appsv1.StatefulSet, before ProxyGroupRolloutState, optimizations bool) bool {
	replicas := int32(1)
	if sts.Spec.Replicas != nil {
		replicas = *sts.Spec.Replicas
	}
	rolledOut := sts.Status.CurrentRevision != "" &&
		sts.Status.CurrentRevision == sts.Status.UpdateRevision
	desiredSettingApplied := forwardingOptimizationsEnabled(sts) == optimizations

	// If this apply toggles the setting on an existing StatefulSet, the
	// operator must produce a different update revision before it is safe to
	// benchmark. An idempotent apply may legitimately keep the same revision.
	revisionChanged := before.UpdateRevision == "" ||
		before.ForwardingOptimizations == optimizations ||
		sts.Status.UpdateRevision != before.UpdateRevision

	return sts.Status.ReadyReplicas == replicas && rolledOut &&
		desiredSettingApplied && revisionChanged
}

// WaitForProxyGroupReady polls the operator-created StatefulSet for the
// ProxyGroup until the requested setting is present, all replicas are ready,
// and the latest revision is fully rolled out. If the requested setting
// differs from before, the update revision must change as well.
func WaitForProxyGroupReady(ctx context.Context, cs kubernetes.Interface, name string, before ProxyGroupRolloutState, optimizations bool, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for {
		sts, err := findProxyGroupSTS(ctx, cs, name)
		if err != nil {
			log.Printf("waiting for ProxyGroup statefulset %s to appear: %v", name, err)
		} else {
			replicas := int32(1)
			if sts.Spec.Replicas != nil {
				replicas = *sts.Spec.Replicas
			}
			if proxyGroupRolloutReady(sts, before, optimizations) {
				log.Printf("ProxyGroup statefulset %s ready: %d/%d replicas, revision %s",
					sts.Name, sts.Status.ReadyReplicas, replicas, sts.Status.UpdateRevision)
				return nil
			}
			log.Printf("waiting for ProxyGroup statefulset %s: %d/%d ready, revision %s -> %s (previous %s), forwarding optimizations=%t (want %t)",
				sts.Name, sts.Status.ReadyReplicas, replicas, sts.Status.CurrentRevision, sts.Status.UpdateRevision,
				before.UpdateRevision, forwardingOptimizationsEnabled(sts), optimizations)
		}
		if time.Now().After(deadline) {
			return fmt.Errorf("ProxyGroup %s statefulset not ready after %v", name, timeout)
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(10 * time.Second):
		}
	}
}

// EnsureEgressService idempotently creates a ClusterIP service in the bench
// namespace that exposes a tailnet host (via the egress ProxyGroup) to
// cluster workloads over UDP. Returns the service ClusterIP. If the service
// already exists but points at a stale FQDN (the server hostname varies per
// run), the annotation is updated in place.
func EnsureEgressService(ctx context.Context, cs kubernetes.Interface, namespace, name, tailnetFQDN string, port int32) (string, error) {
	svcs := cs.CoreV1().Services(namespace)
	annotations := map[string]string{
		TailnetFQDNAnnotation: tailnetFQDN,
		ProxyGroupAnnotation:  ProxyGroupName,
	}

	if existing, err := svcs.Get(ctx, name, metav1.GetOptions{}); err == nil {
		if existing.Annotations[TailnetFQDNAnnotation] != tailnetFQDN {
			existing.Annotations = annotations
			if _, err := svcs.Update(ctx, existing, metav1.UpdateOptions{}); err != nil {
				return "", fmt.Errorf("update egress service %s/%s: %w", namespace, name, err)
			}
			log.Printf("updated egress service %s/%s tailnet FQDN to %s", namespace, name, tailnetFQDN)
		}
		return existing.Spec.ClusterIP, nil
	}

	svc := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:        name,
			Namespace:   namespace,
			Annotations: annotations,
			Labels:      map[string]string{"app": "tailbench", "role": name},
		},
		Spec: corev1.ServiceSpec{
			Type: corev1.ServiceTypeClusterIP,
			Ports: []corev1.ServicePort{
				{Name: "udp", Protocol: corev1.ProtocolUDP, Port: port},
			},
		},
	}
	created, err := svcs.Create(ctx, svc, metav1.CreateOptions{})
	if err != nil {
		return "", fmt.Errorf("create egress service %s/%s: %w", namespace, name, err)
	}
	log.Printf("created egress service %s/%s -> %s (clusterIP %s)", namespace, name, tailnetFQDN, created.Spec.ClusterIP)
	return created.Spec.ClusterIP, nil
}

// findProxyPod returns a running pod of the ProxyGroup's StatefulSet in the
// operator namespace.
func findProxyPod(ctx context.Context, cs kubernetes.Interface, stsName string) (string, error) {
	sts, err := findProxyGroupSTS(ctx, cs, stsName)
	if err != nil {
		return "", err
	}
	selector, err := metav1.LabelSelectorAsSelector(sts.Spec.Selector)
	if err != nil {
		return "", fmt.Errorf("statefulset %s selector: %w", sts.Name, err)
	}
	pods, err := cs.CoreV1().Pods(OperatorNamespace).List(ctx, metav1.ListOptions{LabelSelector: selector.String()})
	if err != nil {
		return "", err
	}
	for _, pod := range pods.Items {
		if pod.Status.Phase == corev1.PodRunning {
			return pod.Name, nil
		}
	}
	return "", fmt.Errorf("no running pod for statefulset %s in namespace %s", sts.Name, OperatorNamespace)
}

// cpuSample is a single cgroup CPU usage reading plus the configured quota.
// usage is cumulative CPU-seconds; quota is in cores (0 = no quota set).
type cpuSample struct {
	usage float64
	quota float64
}

// cpuSampleCmd prints cgroup CPU usage and quota, trying cgroup v2 first,
// then v1. Output (one value per line):
//
//	v2: "v2", usage_usec, cpu.max ("<quota|max> <period>")
//	v1: "v1", cpuacct.usage (ns), cfs_quota_us, cfs_period_us
const cpuSampleCmd = `if [ -f /sys/fs/cgroup/cpu.stat ]; then ` +
	`echo v2; awk '/^usage_usec/{print $2}' /sys/fs/cgroup/cpu.stat; cat /sys/fs/cgroup/cpu.max; ` +
	`else echo v1; ` +
	`cat /sys/fs/cgroup/cpu/cpuacct.usage 2>/dev/null || cat /sys/fs/cgroup/cpuacct.usage; ` +
	`cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us 2>/dev/null || cat /sys/fs/cgroup/cpu.cfs_quota_us; ` +
	`cat /sys/fs/cgroup/cpu/cpu.cfs_period_us 2>/dev/null || cat /sys/fs/cgroup/cpu.cfs_period_us; fi`

func readCPUSample(ctx context.Context, exec *KubeExecExecutor) (cpuSample, error) {
	stdout, stderr, err := exec.Run(ctx, cpuSampleCmd)
	if err != nil {
		return cpuSample{}, fmt.Errorf("exec cpu sample: %s: %w", strings.TrimSpace(stderr), err)
	}
	lines := strings.Fields(stdout)
	if len(lines) < 3 {
		return cpuSample{}, fmt.Errorf("unexpected cpu sample output: %q", stdout)
	}
	switch lines[0] {
	case "v2":
		usageUsec, err := strconv.ParseFloat(lines[1], 64)
		if err != nil {
			return cpuSample{}, fmt.Errorf("parse usage_usec: %w", err)
		}
		s := cpuSample{usage: usageUsec / 1e6}
		// cpu.max: "<quota|max> <period>" as two whitespace-separated fields
		if len(lines) >= 3 && lines[2] != "max" {
			if len(lines) < 4 {
				return cpuSample{}, fmt.Errorf("unexpected cpu.max output: %q", stdout)
			}
			quota, qerr := strconv.ParseFloat(lines[2], 64)
			period, perr := strconv.ParseFloat(lines[3], 64)
			if qerr != nil || perr != nil || period == 0 {
				return cpuSample{}, fmt.Errorf("parse cpu.max %q %q", lines[2], lines[3])
			}
			s.quota = quota / period
		}
		return s, nil
	case "v1":
		if len(lines) < 4 {
			return cpuSample{}, fmt.Errorf("unexpected cpuacct output: %q", stdout)
		}
		usageNs, err := strconv.ParseFloat(lines[1], 64)
		if err != nil {
			return cpuSample{}, fmt.Errorf("parse cpuacct.usage: %w", err)
		}
		s := cpuSample{usage: usageNs / 1e9}
		quota, qerr := strconv.ParseFloat(lines[2], 64)
		period, perr := strconv.ParseFloat(lines[3], 64)
		if qerr != nil || perr != nil {
			return cpuSample{}, fmt.Errorf("parse cfs quota/period %q %q", lines[2], lines[3])
		}
		if quota > 0 && period > 0 {
			s.quota = quota / period
		}
		return s, nil
	default:
		return cpuSample{}, fmt.Errorf("unrecognized cgroup version marker: %q", lines[0])
	}
}

// ProxyPodCPUThrottled reports whether the ProxyGroup proxy pod appears to be
// CPU-throttled (cgroup CPU usage >= 95% of its quota over a ~2s window).
// This is best-effort honesty metadata for benchmark results: any failure
// (no quota set, cgroup layout differences, exec errors) yields (false, nil),
// never a hard error.
//
// kubeconfigData is required in addition to cs because exec-ing into the pod
// needs a rest.Config, which is not recoverable from a bare kubernetes.Interface.
func ProxyPodCPUThrottled(ctx context.Context, cs kubernetes.Interface, kubeconfigData, stsName string) (bool, error) {
	podName, err := findProxyPod(ctx, cs, stsName)
	if err != nil {
		log.Printf("cpu throttle check: find proxy pod: %v", err)
		return false, nil
	}
	exec, err := NewKubeExecExecutor(kubeconfigData, OperatorNamespace, podName, TSContainer)
	if err != nil {
		log.Printf("cpu throttle check: create executor: %v", err)
		return false, nil
	}
	first, err := readCPUSample(ctx, exec)
	if err != nil {
		log.Printf("cpu throttle check: read cgroup: %v", err)
		return false, nil
	}
	if first.quota <= 0 {
		log.Printf("cpu throttle check: pod %s has no cpu quota, cannot be throttled", podName)
		return false, nil
	}
	select {
	case <-ctx.Done():
		return false, nil
	case <-time.After(2 * time.Second):
	}
	second, err := readCPUSample(ctx, exec)
	if err != nil {
		log.Printf("cpu throttle check: re-read cgroup: %v", err)
		return false, nil
	}
	const windowSec = 2.0
	rate := (second.usage - first.usage) / windowSec
	throttled := rate >= 0.95*first.quota
	log.Printf("cpu throttle check: pod %s using %.2f of %.2f cores quota (throttled=%t)",
		podName, rate, first.quota, throttled)
	return throttled, nil
}
