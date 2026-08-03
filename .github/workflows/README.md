# CI and release workflows

The workflow directory is Tailbench's build-infrastructure boundary. The six
provider variants have large, mutually exclusive cloud SDK graphs, so aggregate
compilation belongs here or on another deliberately provisioned build host.
Do not reproduce the matrix on a normal developer workstation.

## Pull-request validation

`ci.yml` performs three kinds of work:

- a formatting job that does not compile provider SDK graphs;
- a dashboard test job that uses Node.js only;
- six isolated matrix jobs, one for each provider/workload variant.

Each variant job lints, tests, verifies dependency boundaries, and builds one
binary. Matrix jobs are the aggregate verification mechanism. They do not run
Pulumi updates or provision cloud resources.

For local development, select one exact target such as `make test-aws` or
`make lint-gcp-k8s`. `make build`, `make test`, and `make lint` are retained for
CI or dedicated build hosts and are unsuitable for ordinary laptop use.

## Releases

`release.yml` runs for version tags. Its matrix builds and packages the six
Linux AMD64 provider binaries and publishes SHA-256 checksum files. Release
workflows are build-host operations; contributors should not reproduce the
entire release matrix locally.

## Website delivery

`deploy-pages.yml` publishes the static `website/` directory to GitHub Pages.
`docker-publish.yml` publishes the website container for Linux AMD64 and ARM64.
These workflows do not validate or publish the provider binaries.

## Review policy

Pull requests must identify any one provider variant validated locally and the
exact commands used. Documentation-only changes should follow the no-build
policy in [Contributing to Tailbench](../../CONTRIBUTING.md). CI supplies the
all-variant result.
