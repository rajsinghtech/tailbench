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
