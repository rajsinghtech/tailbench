package k8s

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
)

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
