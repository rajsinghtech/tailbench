package k8s

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"time"

	corev1 "k8s.io/api/core/v1"
	spdystream "k8s.io/apimachinery/pkg/util/httpstream/spdy"
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
	// customDialer, if set, is used for SPDY connections (tsnet routing)
	customDialer func(ctx context.Context, network, addr string) (net.Conn, error)
}

// NewKubeExecExecutor creates an executor targeting a specific container in a pod.
func NewKubeExecExecutor(kubeconfigData, namespace, podName, container string) (*KubeExecExecutor, error) {
	data, err := base64.StdEncoding.DecodeString(kubeconfigData)
	if err != nil {
		data = []byte(kubeconfigData) // try as raw
	}
	config, err := clientcmd.RESTConfigFromKubeConfig(data)
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

// NewKubeExecExecutorFromConfig creates an executor using a pre-built rest.Config
// and clientset with a custom dialer for SPDY connections (e.g. tsnet routing).
func NewKubeExecExecutorFromConfig(cs *kubernetes.Clientset, cfg *rest.Config, dialer func(ctx context.Context, network, addr string) (net.Conn, error), namespace, podName, container string) *KubeExecExecutor {
	return &KubeExecExecutor{
		clientset:    cs,
		restConfig:   cfg,
		namespace:    namespace,
		podName:      podName,
		container:    container,
		customDialer: dialer,
	}
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

	var exec remotecommand.Executor
	var err error

	if e.customDialer != nil {
		exec, err = e.newSPDYWithDialer("POST", req.URL())
	} else {
		exec, err = remotecommand.NewSPDYExecutor(e.restConfig, "POST", req.URL())
	}
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

// newSPDYWithDialer creates a SPDY executor using a custom dialer.
// NewSPDYExecutor ignores rest.Config.Dial, so we build the SPDY
// round-tripper manually with UpgradeTransport set to use the custom dialer.
func (e *KubeExecExecutor) newSPDYWithDialer(method string, u *url.URL) (remotecommand.Executor, error) {
	upgradeTransport := &http.Transport{
		DialContext:     e.customDialer,
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	spdyRT, err := spdystream.NewRoundTripperWithConfig(spdystream.RoundTripperConfig{
		UpgradeTransport: upgradeTransport,
		PingPeriod:       5 * time.Second,
	})
	if err != nil {
		return nil, fmt.Errorf("create SPDY round-tripper: %w", err)
	}

	// Wrap with config's WrapTransport if present
	var wrapper http.RoundTripper = spdyRT
	if e.restConfig.WrapTransport != nil {
		wrapper = e.restConfig.WrapTransport(spdyRT)
	}

	return remotecommand.NewSPDYExecutorForTransports(wrapper, spdyRT, method, u)
}

func (e *KubeExecExecutor) Close() error {
	return nil
}
