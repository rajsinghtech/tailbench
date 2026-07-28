# Running tailbench

Start here, then follow the runbook for the cloud you are benchmarking. Each
runbook is self-contained and sequential — prerequisites through teardown — so
you should not need to read the other five.

## Pick your runbook

| Cloud | Environment | Binary | Provider value | Runbook |
|---|---|---|---|---|
| AWS | VMs (EC2) | `dist/tailbench-aws` | `aws` | [running-aws.md](running-aws.md) |
| AWS | Kubernetes (EKS) | `dist/tailbench-aws-k8s` | `eks` | [running-eks.md](running-eks.md) |
| Azure | VMs | `dist/tailbench-azure` | `azure` | [running-azure.md](running-azure.md) |
| Azure | Kubernetes (AKS) | `dist/tailbench-azure-k8s` | `aks` | [running-aks.md](running-aks.md) |
| GCP | VMs (Compute Engine) | `dist/tailbench-gcp` | `gcp` | [running-gcp.md](running-gcp.md) |
| GCP | Kubernetes (GKE) | `dist/tailbench-gcp-k8s` | `gke` | [running-gke.md](running-gke.md) |

The provider value — not the executable name — determines result directories,
Pulumi stack names, and local state paths. An explicit `--provider` must match
the provider the binary was compiled for, so renaming an executable does not
change its identity (`cmd/tailbench/main.go:72-77`).

## What every run needs

Three independent credential systems, each failing in its own way:

| System | Configured by | Needed for |
|---|---|---|
| Tailscale OAuth | `.env` (`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`), referenced by `env_file:` in `config.yaml` | Creating the ephemeral tailnet, auth keys, and the ACL |
| Cloud CLI | `aws` / `az` / `gcloud`, authenticated in your shell | Listing instance types and provisioning through Pulumi |
| Pulumi state backend | Local by default; `--state-backend` or `state_backend:` for remote | Storing stack state so runs can be resumed and destroyed |

`--dry-run` and `--version` never contact Tailscale, but `--dry-run` *does*
shell out to the cloud CLI to list instance types
(`internal/orchestrator/orchestrator.go:284-322`), so it is a useful smoke test
for cloud auth specifically.

## Behavior shared by every variant

- **One binary per cloud.** A bare `go build ./cmd/tailbench/` fails on purpose;
  exactly one of `aws`, `azure`, `gcp` must be supplied as a build tag, plus
  `k8s` for the managed-Kubernetes variants. See the Makefile targets.
- **Resume is filesystem-driven.** Work is skipped if and only if its result
  file already exists at `<provider>/<family>/results/<type>-<mode>.json`.
  Interrupting a run is safe — rerun the same command and it continues. To
  re-measure something, delete its result file.
- **A quota error skips the rest of the family.** When `provider.IsQuotaError`
  fires during `CreatePair`, every remaining instance type in that family is
  skipped for the rest of the run, on the reasoning that larger sizes will also
  be over quota. Watch the log for it — otherwise a family can end silently.
  On AWS and GCP this works as described. **On Azure and AKS it does not**:
  `skippedFamilies` is keyed on `GetInstanceFamily`, which for Azure returns a
  per-size value (`Standard_D4s_v4` → `d4sv4`, not `dsv4`), so a quota denial
  skips only the size that failed (`internal/provider/families.go:16-31`).
- **Modes come only from `config.yaml`.** There is no `--modes` flag. Mode
  filtering is **asymmetric**: VM binaries reject Kubernetes-only modes at
  startup with a clear error (`internal/orchestrator/k8s_disabled.go:16-23`),
  but the Kubernetes binaries validate nothing —
  `validateWorkloadConfig` is `return nil` in `k8s_enabled.go:21`, so VM-only
  modes are silently skipped. The shipped `config.yaml` lists `l4-kernel`,
  `l7-serve-h1`, `l7-serve-h2`; both `l7-serve-*` are VM-only, so a stock run
  of any `*-k8s` binary measures `l4-kernel` alone while still paying for a
  cluster. Set Kubernetes modes explicitly before running those variants.
- **Stale Pulumi locks are swept at startup** for local state
  (`state/*/.pulumi/locks/*.json`), which is what otherwise causes every
  subsequent operation to fail with `exit status 255`. Remote backends manage
  their own leases and are left alone (`orchestrator.go:120-148`).

## Generating the report

A successful run aggregates automatically (`orchestrator.go:548`). To rebuild
the dashboard from result files already on disk, without touching any cloud:

```bash
go run ./cmd/pricing-refresh   # optional: refresh internal/pricing/data.json
go run ./cmd/aggregate/        # writes website/data.generated.js
```

Both must run from the repository root — `cmd/aggregate` resolves its input
directory with `os.Getwd()`. Aggregation walks every provider directory
(`gcp`, `aws`, `azure`, `gke`, `eks`, `aks`), so one command re-emits the whole
dashboard including results committed by previous runs.

Prices are injected at aggregation time from the curated dataset rather than
stored in result JSON, so re-pricing all history is just a re-aggregate.

Then open `website/index.html`. It loads `data.generated.js` with a plain
`<script src>` tag, so `file://` works; Chart.js comes from a CDN, so rendering
needs internet access.

## Related documents

- [`../README.md`](../README.md) — flags, configuration reference, modes,
  state backends, pricing.
- [`cost-forward-pps-plan.md`](cost-forward-pps-plan.md) — design notes,
  metric definitions, and runbooks for the opt-in forwarding-pps and
  peer-relay modes.
- [`../CLAUDE.md`](../CLAUDE.md) — architecture and repository conventions.
