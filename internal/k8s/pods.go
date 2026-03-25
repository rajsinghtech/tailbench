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

type PodConfig struct {
	BenchImage string
	TSImage    string
	AuthKey    string
	Hostname   string
	Userspace  bool
}

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
					Name:            BenchContainer,
					Image:           cfg.BenchImage,
					ImagePullPolicy: corev1.PullAlways,
					Command:         []string{"sleep", "infinity"},
				},
				{
					Name:  TSContainer,
					Image: cfg.TSImage,
					SecurityContext: &corev1.SecurityContext{
						Privileged: &privileged,
					},
					Env: []corev1.EnvVar{
						{Name: "TS_USERSPACE", Value: fmt.Sprintf("%t", cfg.Userspace)},
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

func EnsureNamespace(ctx context.Context, cs *kubernetes.Clientset) error {
	_, err := cs.CoreV1().Namespaces().Get(ctx, Namespace, metav1.GetOptions{})
	if err == nil {
		return nil
	}
	ns := &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: Namespace}}
	_, err = cs.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{})
	return err
}

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

func DeployPod(ctx context.Context, cs *kubernetes.Clientset, pod *corev1.Pod, timeout time.Duration) error {
	// Delete any leftover pod from a previous run
	_ = cs.CoreV1().Pods(Namespace).Delete(ctx, pod.Name, metav1.DeleteOptions{})
	// Wait for deletion to complete
	for range 30 {
		_, err := cs.CoreV1().Pods(Namespace).Get(ctx, pod.Name, metav1.GetOptions{})
		if err != nil {
			break
		}
		time.Sleep(2 * time.Second)
	}

	_, err := cs.CoreV1().Pods(Namespace).Create(ctx, pod, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("create pod %s: %w", pod.Name, err)
	}
	return WaitForPodRunning(ctx, cs, pod.Name, timeout)
}

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

func DeletePod(ctx context.Context, cs *kubernetes.Clientset, name string) error {
	return cs.CoreV1().Pods(Namespace).Delete(ctx, name, metav1.DeleteOptions{})
}

func ClientsetFromKubeconfig(kubeconfigData string) (*kubernetes.Clientset, error) {
	data, err := base64.StdEncoding.DecodeString(kubeconfigData)
	if err != nil {
		data = []byte(kubeconfigData)
	}
	config, err := clientcmd.RESTConfigFromKubeConfig(data)
	if err != nil {
		return nil, fmt.Errorf("parse kubeconfig: %w", err)
	}
	return kubernetes.NewForConfig(config)
}

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
