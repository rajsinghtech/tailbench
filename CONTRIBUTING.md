# Contributing to Tailbench

Tailbench compiles several large, mutually exclusive cloud SDK graphs. A normal
developer workstation must handle only one provider variant at a time. CI or a
dedicated, memory-capable build host owns aggregate verification.

## Before you start

Choose one executable and use its exact Make target throughout the change:

| Executable | Variant | Build | Test | Lint |
|---|---|---|---|---|
| `tailbench-aws` | `aws` | `make build-aws` | `make test-aws` | `make lint-aws` |
| `tailbench-aws-k8s` | `aws-k8s` | `make build-aws-k8s` | `make test-aws-k8s` | `make lint-aws-k8s` |
| `tailbench-azure` | `azure` | `make build-azure` | `make test-azure` | `make lint-azure` |
| `tailbench-azure-k8s` | `azure-k8s` | `make build-azure-k8s` | `make test-azure-k8s` | `make lint-azure-k8s` |
| `tailbench-gcp` | `gcp` | `make build-gcp` | `make test-gcp` | `make lint-gcp` |
| `tailbench-gcp-k8s` | `gcp-k8s` | `make build-gcp-k8s` | `make test-gcp-k8s` | `make lint-gcp-k8s` |

Use the current Go version declared in `go.mod`. The Makefile is the supported
interface because it applies the required build tags and conservative test
parallelism.

Do not run any of these on a normal developer workstation:

- `make build`, `make test`, or `make lint`;
- untagged `go build`, `go test`, `go vet`, or `golangci-lint` commands over the
  repository;
- scripts or shell loops that compile more than one provider variant;
- `go run ./cmd/tailbench` as an ad-hoc diagnostic command.

The aggregate Make targets may remain available for CI and dedicated build
hosts. Their existence is not a recommendation for local use.

## Developer checklist

Before starting a build, test, lint, dependency download, or release task:

1. Name the one executable and exact target you intend to validate.
2. Confirm that the machine has enough memory and CPU for that provider SDK
   graph. Move the work to a build host when uncertain.
3. Check whether the target downloads anything. In particular,
   `make lint-<variant>` installs the pinned repository-local linter when it is
   absent, and Go may fetch missing modules.
4. Keep Tailscale test credentials out of the environment unless a live,
   resource-creating test is explicitly intended and approved.
5. Run only the selected variant. Let CI cover the six-variant matrix.

Formatting does not compile a provider graph:

```bash
make fmt
```

Shared command, configuration, plan, and preflight tests also avoid provider
SDK graphs:

```bash
make test-shared
```

The dashboard test is also independent of the Go provider graphs:

```bash
make test-website
```

Every test target, including the low-resource targets above, is still an
explicit command. Automated coding agents must name it and obtain approval
before starting it. A single provider target can be expensive.

## If a command must be stopped

Interrupt the command's process group, not only the parent `make` process.
Before reporting that it has stopped, inspect the original process group and
confirm that no Go compiler, linker, linter, or child `make` process remains.
On Linux, record the process-group ID when the command starts and inspect it
with:

```bash
ps -eo pid,ppid,pgid,stat,etime,command
```

If descendants remain, stop them using the recorded process-group ID and
inspect the process table again. Do not assume that a terminated terminal
command also terminated its compiler children.

## Validate one variant

The following example shows the complete AWS VM validation sequence. It is a
menu of separately approval-gated commands, not a command block to run
automatically:

```bash
make fmt
make lint-aws
make test-aws
make verify-deps VARIANT=aws
make build-aws
```

Substitute one variant consistently. Do not repeat the sequence for the other
providers on a laptop. CI runs each provider/workload combination in a separate
matrix job.

`make verify-deps` without `VARIANT` checks all six graphs and is therefore a
CI/build-host operation. Use `VARIANT=aws`, `aws-k8s`, `azure`, `azure-k8s`,
`gcp`, or `gcp-k8s` locally.

## No-build documentation validation

Documentation-only changes do not justify compiling a provider graph. Review
them without a build:

1. Inspect the changed Markdown for accurate commands and relative links.
2. Confirm that user-facing links are repository-relative and contain no
   workstation paths.
3. Confirm that examples name one provider variant and do not present aggregate
   targets as a local workflow.
4. Report provider validation as not run because the change is documentation
   only. Do not imply that a build or test passed when it was not run.

## Continuous integration

The pull-request workflow runs formatting and dashboard checks separately, then
uses one matrix job per provider variant for lint, tests, dependency-boundary
verification, and compilation. It does not provision cloud resources.

Tagged releases build all six Linux AMD64 binaries on GitHub-hosted runners.
Release and aggregate matrix workflows belong on build infrastructure, not
developer laptops. See [CI and release workflows](.github/workflows/README.md)
for the workflow responsibilities.

## Pull requests

State which single variant you selected and list the exact commands you ran. If
you performed no build or test, say so directly and explain why. Never run the
remaining provider variants locally merely to complete a checklist; the CI
matrix provides that coverage.
