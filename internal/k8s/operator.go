package k8s

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"tailscale.com/tsnet"
)

const (
	OperatorNamespace  = "tailscale"
	OperatorSecretName = "operator-oauth"
	OperatorRelease    = "tailscale-operator"
	OperatorChartRepo  = "https://pkgs.tailscale.com/helmcharts"
)

// OperatorConfig holds configuration for installing the Tailscale operator.
type OperatorConfig struct {
	OAuthClientID     string
	OAuthClientSecret string
	Hostname          string // operator hostname on the tailnet
	Tag               string // e.g. "tag:bench"
}

// InstallOperator installs the Tailscale Kubernetes operator via Helm with
// API server proxy mode enabled. It cleans up any previous operator state
// first so reused clusters work cleanly.
func InstallOperator(ctx context.Context, kubeconfigData string, cfg OperatorConfig) error {
	cs, err := ClientsetFromKubeconfig(kubeconfigData)
	if err != nil {
		return fmt.Errorf("create clientset: %w", err)
	}

	// Clean up any previous operator installation (stale Helm release, secrets, etc.)
	cleanupPreviousOperator(ctx, cs, kubeconfigData)

	// Create tailscale namespace
	ns := &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: OperatorNamespace}}
	if _, err := cs.CoreV1().Namespaces().Get(ctx, OperatorNamespace, metav1.GetOptions{}); err != nil {
		if _, err := cs.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{}); err != nil {
			return fmt.Errorf("create namespace %s: %w", OperatorNamespace, err)
		}
	}

	// Create RBAC for orchestrator identity (tag:bench → cluster-admin)
	if err := createOperatorRBAC(ctx, cs, cfg.Tag); err != nil {
		return fmt.Errorf("create RBAC: %w", err)
	}

	// Install operator via Helm (creates OAuth secret via --set oauth.*)
	if err := helmInstallOperator(ctx, kubeconfigData, cfg); err != nil {
		return fmt.Errorf("helm install: %w", err)
	}

	return nil
}

// cleanupPreviousOperator removes any leftover operator state from a previous
// run so the cluster can be reused with a fresh tailnet.
func cleanupPreviousOperator(ctx context.Context, cs *kubernetes.Clientset, kubeconfigData string) {
	// Try to uninstall the Helm release (ignore errors — may not exist)
	_ = UninstallOperator(ctx, kubeconfigData)

	// Delete all secrets in the operator namespace (operator state, OAuth, certs)
	secrets, err := cs.CoreV1().Secrets(OperatorNamespace).List(ctx, metav1.ListOptions{})
	if err == nil {
		for _, s := range secrets.Items {
			log.Printf("cleaning up operator secret: %s/%s", OperatorNamespace, s.Name)
			_ = cs.CoreV1().Secrets(OperatorNamespace).Delete(ctx, s.Name, metav1.DeleteOptions{})
		}
	}

	// Delete operator service accounts
	sas, err := cs.CoreV1().ServiceAccounts(OperatorNamespace).List(ctx, metav1.ListOptions{})
	if err == nil {
		for _, sa := range sas.Items {
			if sa.Name == "default" {
				continue
			}
			_ = cs.CoreV1().ServiceAccounts(OperatorNamespace).Delete(ctx, sa.Name, metav1.DeleteOptions{})
		}
	}

	// Delete operator cluster role bindings
	crbs, err := cs.RbacV1().ClusterRoleBindings().List(ctx, metav1.ListOptions{})
	if err == nil {
		for _, crb := range crbs.Items {
			if crb.Name == "tailbench-admin" || strings.HasPrefix(crb.Name, "tailscale-operator") {
				_ = cs.RbacV1().ClusterRoleBindings().Delete(ctx, crb.Name, metav1.DeleteOptions{})
			}
		}
	}

	// Delete operator cluster roles
	crs, err := cs.RbacV1().ClusterRoles().List(ctx, metav1.ListOptions{})
	if err == nil {
		for _, cr := range crs.Items {
			if strings.HasPrefix(cr.Name, "tailscale-operator") {
				_ = cs.RbacV1().ClusterRoles().Delete(ctx, cr.Name, metav1.DeleteOptions{})
			}
		}
	}
}

// createOperatorRBAC creates a ClusterRoleBinding granting the orchestrator's
// tailnet tag cluster-admin permissions via the API server proxy.
func createOperatorRBAC(ctx context.Context, cs *kubernetes.Clientset, tag string) error {
	binding := &rbacv1.ClusterRoleBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name: "tailbench-admin",
		},
		Subjects: []rbacv1.Subject{
			{
				Kind: "Group",
				Name: tag,
			},
		},
		RoleRef: rbacv1.RoleRef{
			APIGroup: "rbac.authorization.k8s.io",
			Kind:     "ClusterRole",
			Name:     "cluster-admin",
		},
	}
	if _, err := cs.RbacV1().ClusterRoleBindings().Get(ctx, binding.Name, metav1.GetOptions{}); err != nil {
		_, err = cs.RbacV1().ClusterRoleBindings().Create(ctx, binding, metav1.CreateOptions{})
		return err
	}
	_, err := cs.RbacV1().ClusterRoleBindings().Update(ctx, binding, metav1.UpdateOptions{})
	return err
}

// helmInstallOperator shells out to helm to install the Tailscale operator chart.
func helmInstallOperator(ctx context.Context, kubeconfigData string, cfg OperatorConfig) error {
	// Write kubeconfig to temp file for helm
	data, err := base64.StdEncoding.DecodeString(kubeconfigData)
	if err != nil {
		data = []byte(kubeconfigData)
	}
	tmpFile := fmt.Sprintf("/tmp/tailbench-kubeconfig-%d", time.Now().UnixNano())
	if err := writeFile(tmpFile, data); err != nil {
		return fmt.Errorf("write kubeconfig: %w", err)
	}

	// Add repo + install
	cmds := [][]string{
		{"helm", "repo", "add", "tailscale", OperatorChartRepo, "--force-update"},
		{"helm", "repo", "update", "tailscale"},
		{
			"helm", "upgrade", "--install", OperatorRelease,
			"tailscale/tailscale-operator",
			"--namespace", OperatorNamespace,
			"--kubeconfig", tmpFile,
			"--set", "apiServerProxyConfig.mode=true",
			"--set", "apiServerProxyConfig.allowImpersonation=true",
			"--set", fmt.Sprintf("operatorConfig.hostname=%s", cfg.Hostname),
			"--set", "operatorConfig.logging=debug",
			"--set", fmt.Sprintf("operatorConfig.defaultTags={%s}", cfg.Tag),
			"--set", fmt.Sprintf("oauth.clientId=%s", cfg.OAuthClientID),
			"--set", fmt.Sprintf("oauth.clientSecret=%s", cfg.OAuthClientSecret),
			"--wait",
			"--timeout", "5m",
		},
	}

	for _, cmd := range cmds {
		if err := runCmd(ctx, cmd[0], cmd[1:]...); err != nil {
			return fmt.Errorf("%s: %w", cmd[0], err)
		}
	}
	return nil
}

// WaitForOperatorProxy waits for the operator's API server proxy to be
// reachable on the tailnet. Returns the FQDN of the proxy endpoint.
func WaitForOperatorProxy(ctx context.Context, srv *tsnet.Server, hostname, tailnetDNS string, timeout time.Duration) (string, error) {
	fqdn := fmt.Sprintf("%s.%s", hostname, tailnetDNS)
	addr := fqdn + ":443"
	deadline := time.Now().Add(timeout)

	transport := &http.Transport{
		DialContext: func(ctx context.Context, network, a string) (net.Conn, error) {
			return srv.Dial(ctx, "tcp", addr)
		},
		TLSClientConfig: &tls.Config{
			ServerName: fqdn,
		},
	}
	client := &http.Client{Transport: transport, Timeout: 10 * time.Second}

	for time.Now().Before(deadline) {
		req, _ := http.NewRequestWithContext(ctx, "GET", "https://"+fqdn+"/healthz", nil)
		resp, err := client.Do(req)
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode == 200 || resp.StatusCode == 401 || resp.StatusCode == 403 {
				log.Printf("operator API proxy reachable at %s", fqdn)
				return fqdn, nil
			}
		}
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(10 * time.Second):
			log.Printf("waiting for operator proxy at %s...", fqdn)
		}
	}
	return "", fmt.Errorf("operator proxy %s not reachable after %v", fqdn, timeout)
}

// UninstallOperator removes the Tailscale operator Helm release.
func UninstallOperator(ctx context.Context, kubeconfigData string) error {
	data, err := base64.StdEncoding.DecodeString(kubeconfigData)
	if err != nil {
		data = []byte(kubeconfigData)
	}
	tmpFile := fmt.Sprintf("/tmp/tailbench-kubeconfig-%d", time.Now().UnixNano())
	if err := writeFile(tmpFile, data); err != nil {
		return err
	}
	return runCmd(ctx, "helm", "uninstall", OperatorRelease,
		"--namespace", OperatorNamespace, "--kubeconfig", tmpFile)
}

// ClientsetViaTsnet creates a Kubernetes clientset that routes through
// the tsnet server to reach the operator API server proxy.
// The custom transport ensures both regular API calls and SPDY exec
// connections route through the tailnet.
func ClientsetViaTsnet(srv *tsnet.Server, fqdn string) (*kubernetes.Clientset, *rest.Config, error) {
	dialer := func(ctx context.Context, network, addr string) (net.Conn, error) {
		return srv.Dial(ctx, network, addr)
	}

	cfg := &rest.Config{
		Host: "https://" + fqdn,
		TLSClientConfig: rest.TLSClientConfig{
			Insecure: true, // operator proxy handles TLS; we trust the tailnet
		},
		Dial: dialer,
		// WrapTransport injects the tsnet dialer into any transport created
		// from this config (including SPDY executor transports).
		WrapTransport: func(rt http.RoundTripper) http.RoundTripper {
			if t, ok := rt.(*http.Transport); ok {
				t.DialContext = dialer
			}
			return rt
		},
	}
	cs, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		return nil, nil, fmt.Errorf("create tsnet clientset: %w", err)
	}
	return cs, cfg, nil
}

// writeFile is a helper to write data to a file path.
func writeFile(path string, data []byte) error {
	return writeFileWithPerm(path, data, 0o600)
}
