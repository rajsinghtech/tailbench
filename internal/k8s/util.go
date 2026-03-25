package k8s

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
)

var encoding = base64.StdEncoding

// runCmd executes a command with context, logging the command and its output.
func runCmd(ctx context.Context, name string, args ...string) error {
	log.Printf("exec: %s %s", name, strings.Join(args, " "))
	cmd := exec.CommandContext(ctx, name, args...)
	out, err := cmd.CombinedOutput()
	if len(out) > 0 {
		log.Printf("  %s", strings.TrimSpace(string(out)))
	}
	if err != nil {
		return fmt.Errorf("%s %s: %s: %w", name, strings.Join(args, " "), out, err)
	}
	return nil
}

// writeFileWithPerm writes data to a file with specific permissions.
func writeFileWithPerm(path string, data []byte, perm os.FileMode) error {
	return os.WriteFile(path, data, perm)
}

// DeployL7Bench applies the L7 bench manifests (fortio echo + ingress + LB service)
// to the cluster using kubectl apply -k.
func DeployL7Bench(ctx context.Context, kubeconfigB64 string, rootDir string) error {
	tmp, err := writeKubeconfig(kubeconfigB64)
	if err != nil {
		return err
	}
	defer os.Remove(tmp)

	manifestsDir := rootDir + "/manifests/l7-bench"
	if _, err := os.Stat(manifestsDir); err != nil {
		return fmt.Errorf("l7-bench manifests not found at %s: %w", manifestsDir, err)
	}

	log.Printf("deploying L7 bench manifests from %s", manifestsDir)
	return runCmd(ctx, "kubectl", "--kubeconfig", tmp, "apply", "-k", manifestsDir)
}

func writeKubeconfig(b64 string) (string, error) {
	data, err := encoding.DecodeString(b64)
	if err != nil {
		return "", fmt.Errorf("decode kubeconfig: %w", err)
	}
	f, err := os.CreateTemp("", "kubeconfig-*.json")
	if err != nil {
		return "", err
	}
	if _, err := f.Write(data); err != nil {
		f.Close()
		os.Remove(f.Name())
		return "", err
	}
	f.Close()
	return f.Name(), nil
}
