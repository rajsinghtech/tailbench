package k8s

import (
	"bytes"
	"context"
	"fmt"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/remotecommand"
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
	return nil
}
