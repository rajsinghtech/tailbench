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
| Tailscale OAuth | `.env` (`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`), referenced by `env_file:` in `config.yaml` | Creating *or* joining the tailnet, then its policy file and auth keys |
| Cloud CLI | `aws` / `az` / `gcloud`, authenticated in your shell | Listing instance types and provisioning through Pulumi |
| Pulumi state backend | Local by default; `--state-backend` or `state_backend:` for remote | Storing stack state so runs can be resumed and destroyed |

`plan`, `doctor` (without `--remote`), and `--version` need none of them: they
never open the environment file, expand secrets, initialize Pulumi or Tailscale,
call cloud APIs, create state directories, or remove locks. `doctor --remote` is
the explicit, read-only way to check credentials before committing to a run.

### Tailnet: create one, or join one

Nodes join with an auth key, and an auth key needs a tailnet to mint it against,
so every variant needs one of two settings under `tailscale:`. Starting with
neither is refused before anything is provisioned
(`internal/orchestrator/orchestrator.go:174`):

- `create_tailnet: true` — tailbench creates an ephemeral tailnet (or reuses one
  cached in `.tailbench/tailnet.json`, except for manifest-managed runs) and
  deletes it under the run's cleanup policy. The configured OAuth client is used
  *only* for the create and delete calls, which need an organization-level
  permission.
- `create_tailnet: false` plus `tailnet_dns_name: example.ts.net` — tailbench
  joins the tailnet the configured client already belongs to. Nothing is created
  and nothing is deleted.

**Either way, tailbench replaces the tailnet's entire policy file** with an
allow-all benchmark ACL (`internal/tailnet/tailnet.go:150-160`). Point
`tailnet_dns_name` only at a tailnet dedicated to benchmarking. See the README
for which OAuth client each model needs.

## The command surface

| Command | Side effects | Use |
|---|---|---|
| `init` | writes `config.yaml`, `.env.example` | Start a new checkout safely |
| `plan` | none | See exactly what a run would do, free |
| `doctor` | none | Check local tools and configuration |
| `doctor --remote` | reads only | Verify credentials and cloud reachability |
| `run` | **provisions billable resources** | Execute the benchmark |
| `status RUN_ID` / `results RUN_ID` | none | Read persisted run state |
| `resume RUN_ID` | provisions | Continue only unfinished work |
| `cleanup RUN_ID` | destroys | Tear down resources a run owns |

Cleanup derives its remote checks from the run manifest. If the run joined an
existing tailnet and therefore recorded no owned tailnet resource, cleanup
checks only the configured Pulumi backend and cloud identity; it neither loads
Tailscale OAuth credentials nor calls the Tailscale API.

`run` evaluates the local plan and the guardrails **before** loading any secret,
then requires an interactive confirmation or `--yes`; `--yes` additionally
requires an explicit `--max-cost-usd`. Guardrails default to
`--max-duration 45m`, `--max-instance-types 1`, `--max-concurrent-resources 1`,
`--cleanup-policy always`. `--dry-run`, and YAML `dry_run: true`, are
compatibility aliases that route to `plan`.

The cost ceiling is a lifetime upper-bound estimate only with
`cleanup_policy: always`. With `on-success` or `manual`, `max_duration` still
bounds benchmark execution but intentionally does not guarantee teardown.
Plans and confirmations therefore label the dollar value as an
execution-window estimate, report the lifetime upper bound as unavailable, and
warn that billing continues until `cleanup RUN_ID` succeeds.

Failures print a structured block — `[TB_<CODE>] stage / cause / resources
changed / next` — and exit with a typed status (`internal/app/types.go:6-12`):
0 ok, 1 run failed, 2 usage, 3 prerequisite, 4 refused, 5 recovery,
130 interrupted.

## Behavior shared by every variant

- **One binary per cloud.** A bare `go build ./cmd/tailbench/` fails on purpose;
  exactly one of `aws`, `azure`, `gcp` must be supplied as a build tag, plus
  `k8s` for the managed-Kubernetes variants. See the Makefile targets.
- **Resume is filesystem-driven, and now also manifest-driven.** A mode is done
  when its result file exists at
  `<provider>/<family>/results/<type>-<mode>.json` — for `l4-kernel`, the legacy
  no-suffix `<type>.json` also counts. Interrupting is safe: rerun the same
  command and it continues, or use `resume RUN_ID` against the manifest an
  approved run persists under `.tailbench/runs/<run-id>/`. To re-measure
  something, delete its result file. `plan` shows this as `skip-existing`, and
  the run agrees — if every configured mode is satisfied, the instance is never
  provisioned.
- **A quota error skips the rest of the family.** When `provider.IsQuotaError`
  fires during `CreatePair`, every remaining instance type in that family is
  skipped, on the reasoning that larger sizes will also be over quota. The skip
  is keyed on `provider.InstanceFamilyGroup`, the same group-wide value
  `--family` accepts — which on Azure is deliberately not the per-size family
  used for result paths (`Standard_D4s_v4` → family `d4sv4`, group `dsv4`).
- **Modes come only from `config.yaml`, and a mode list must suit the binary
  it is handed to.** There is no `--modes` flag. Three layers agree: `plan`
  labels an inapplicable mode `not-applicable`, `guardrail.Check` refuses the
  run with `incompatible-mode`, and the orchestrator rejects it at startup
  (`k8s_disabled.go` for VM binaries, `k8s_enabled.go` for Kubernetes ones).
  **The checked-in `config.yaml` is VM-oriented** — it lists `l7-serve-h1` and
  `l7-serve-h2`, which are VM-only — so it cannot `run` on any `*-k8s` binary.
  Use `init`, which generates a portable `modes: [l4-kernel]`, or set container
  modes explicitly.
- **Stale Pulumi locks are not swept at startup.** Removing them is an explicit,
  manifest-scoped `cleanup RUN_ID --recover-pulumi-locks`, which only touches
  locks belonging to stacks that run recorded
  (`internal/recovery/pulumi_locks.go`). Remote backends manage their own
  leases.
- **`l7-serve` needs HTTPS on the tailnet, exactly as the Kubernetes variants
  do.** `needsTailnetHTTPS` is `hasK8sProviders() || hasL7ServeMode(modes)`
  (`internal/orchestrator/orchestrator.go:1614`), asserted on all three tailnet
  paths — join, reuse a cached tailnet, create a new one. It is not a K8s-only
  concern: cloud-init runs `tailscale serve --https=443`, which blocks forever
  when HTTPS is disabled, so a VM run configured with `l7-serve-h1`/`-h2`
  against a tailnet without HTTPS never gets a ready node.
- **Waiting for a node to become ready is bounded.** `WaitForReady` polls for
  `/tmp/tailbench-ready` under `ssh.ready_timeout` (default 300 seconds,
  `internal/config/config.go:446`) rather than inheriting only the whole-run
  deadline, so a cloud-init hang fails in minutes instead of billing for the
  full run. The error names the recipe: SSH in with the key under
  `.tailbench/ssh/`, then read `cloud-init status --long` and
  `/var/log/cloud-init-output.log` (`internal/sshclient/sshclient.go:92`).

## Generating the report

A successful run aggregates automatically (`orchestrator.go:823`). To rebuild
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
