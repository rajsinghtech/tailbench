# Tailbench professionalization implementation plan

## Purpose

This plan defines how Tailbench should become a safe, observable, and
reproducible benchmark tool across **all** provider-specific binaries:

- `tailbench-aws`
- `tailbench-aws-k8s`
- `tailbench-azure`
- `tailbench-azure-k8s`
- `tailbench-gcp`
- `tailbench-gcp-k8s`

AWS is the first validation target because it is the immediate user path. It
is not a separate product design: every behavioral guarantee in this document
must be implemented in shared code and be available in every binary.

The principal outcome is that an operator can safely answer these questions
without reading source code:

1. What will Tailbench do, which resources will it create, and what could it
   cost?
2. Is my machine, configuration, and cloud account ready?
3. Did the command succeed, partially succeed, or fail—and why?
4. What resources still exist, how do I resume, and how do I clean them up?
5. Which exact versions and settings produced a result?

## Non-negotiable operating rules

### Resource-safe development

The repository contains multiple large, mutually exclusive cloud SDK graphs.
Building or testing every graph on a developer laptop can consume all CPU and
memory. Therefore:

- Never run aggregate `make build`, `make test`, `make lint`, or equivalent
  all-variant Go commands on a normal developer workstation.
- Never use `go run ./cmd/tailbench` as an ad-hoc diagnostic command: it
  compiles a full tagged binary and hides that cost from the invocation.
- Never start a build, test, lint, dependency download, or release workflow
  without explicitly naming the exact single target and receiving approval.
- Use only one provider variant at a time for local validation, for example
  `make build-aws` or `make test-aws`. Even these commands must be run only on
  an appropriately sized machine or after explicit approval.
- Keep aggregate matrix work in CI or a dedicated build machine, where memory,
  concurrency, and time are intentionally provisioned.
- Before reporting a long-running process as stopped, verify that its process
  group and compiler descendants are gone.

The Makefile, `CLAUDE.md`, contributor documentation, and CI documentation must
say this plainly. Aggregate targets may remain for CI, but their help text must
say that they are unsuitable for ordinary laptop use.

### Safety before provisioning

- Planning must be side-effect free: no Pulumi state directory creation, no
  lock deletion, no tailnet creation, no resource discovery that changes state,
  and no credential mutation.
- Remote checks must be explicit. A local plan must not unexpectedly require
  cloud, Pulumi, or Tailscale credentials.
- Provisioning must require an affirmative action (`--yes` for automation or
  an interactive confirmation after a readable plan).
- Every created resource must be attributable to a run ID and have a known
  cleanup path.
- A benchmark result is not a successful run if cleanup failed; both outcomes
  must be reported independently.

### No silent failures

Every ordinary nonzero command exit must emit a human-readable diagnostic on
stderr. The diagnostic must include:

- an error code and failed stage;
- a concise cause, preserving the original provider error when safe;
- whether Tailbench created or changed any resources;
- a precise next action;
- a run ID and log location if a run has begun.

User errors must not be represented only by an exit code, an empty terminal,
or an opaque wrapped error such as `exit status 1`.

## Product contract

### Intended command workflow

The final syntax can evolve, but the workflow and semantics are stable:

```text
init → doctor → plan → run → status/results → resume or cleanup
```

| Stage | Purpose | Cloud-side effects | Credentials required |
|---|---|---:|---:|
| `init` | Create commented, safe example configuration | None | No |
| `doctor` | Check local tools/config; optional remote checks | None | Local: no; remote: yes |
| `plan` | Show selected work, cost limits, prerequisites, and resume status | None | No for local plan |
| `run` | Provision, benchmark, collect results, and clean up | Yes | Yes |
| `status` | Read a persisted run manifest and report state | None | No for local state |
| `results` | Render/export an existing run’s results and metadata | None | No |
| `resume` | Continue only unfinished work from a named run | Potentially | Yes |
| `cleanup` | Destroy resources belonging to a named run | Yes | Yes |

Until subcommands are introduced, the existing `--dry-run` flag should be kept
as a backwards-compatible alias for a local `plan`. Its behavior must become
safe and predictable before additional commands are added.

### Example target user experience

```bash
# Create a provider-specific sample configuration and secret template.
tailbench-aws init

# Verify config and local dependencies without using credentials remotely.
tailbench-aws doctor

# Preview one inexpensive AWS VM benchmark without changing local/cloud state.
tailbench-aws plan --family c7i --filter '^c7i\.large$'

# Optionally verify AWS/Pulumi/Tailscale access before incurring any cost.
tailbench-aws doctor --remote

# Start a bounded run only after reviewing the plan.
tailbench-aws run --family c7i --filter '^c7i\.large$' \
  --max-cost-usd 10 --max-duration 45m --yes

# Inspect an interrupted run and either continue or remove its resources.
tailbench-aws status tb_2026-07-24_ab12cd
tailbench-aws resume tb_2026-07-24_ab12cd --yes
tailbench-aws cleanup tb_2026-07-24_ab12cd --yes
```

The exact executable name changes by provider, but the flags, exit behavior,
manifest format, and error vocabulary must not.

### Stable exit statuses

Adopt a documented exit-code contract. Suggested values:

| Code | Meaning |
|---:|---|
| 0 | Requested work completed successfully. |
| 1 | Run completed with a benchmark, provisioning, or cleanup failure. |
| 2 | Invalid flags, configuration, or command usage. |
| 3 | Prerequisite or authentication preflight failed; no resources were created. |
| 4 | User declined confirmation or a safety limit prevented execution. |
| 5 | Resume/recovery state is incomplete or inconsistent and requires intervention. |
| 130 | The process was interrupted; the final message identifies recoverable state. |

The command must print a final summary before returning a partial-failure exit
code whenever the process still has a usable terminal.

### Text and machine-readable output

- **stdout** contains the requested report, plan, result, or JSON document.
- **stderr** contains diagnostics and progress logs.
- `--output text|json` controls the primary report format; text is the default.
- `--log-file PATH` writes redacted progress diagnostics to a durable location.
- `--quiet` suppresses progress but never suppresses fatal diagnostics.
- No output mode may print credentials, auth keys, bearer tokens, or private
  identifiers that are not required for recovery.

## Shared technical architecture

The six tagged binaries already share a common entry point and differ mainly in
their compiled provider factory. Preserve that model and move product behavior
into dependency-light shared packages.

### Proposed package boundaries

| Package or area | Responsibility |
|---|---|
| `cmd/tailbench` | Minimal tagged entry point: identify the compiled provider and delegate to shared app code. |
| `internal/app` (new) | Parse command intent, route commands, own exit-status mapping and user-facing error rendering. |
| `internal/config` | Read and merge configuration without side effects; separately validate syntax, command-specific requirements, and required secret values. |
| `internal/preflight` (new) | Local tool checks and opt-in remote checks behind narrow interfaces. |
| `internal/plan` (new) | Build a serializable local/remote plan from config, provider metadata, filters, modes, cost guardrails, and existing result state. |
| `internal/runstate` (new) | Versioned manifests, event log, resume state, resource inventory, and cleanup status. |
| `internal/summary` (new) | Shared final outcome/partial-failure reporting for text and JSON. |
| `internal/orchestrator` | Execute an approved plan, update run state at meaningful boundaries, and return a classified outcome rather than only logging errors. |
| `internal/provider` | Retain cloud specifics behind the existing provider interface; add narrowly scoped discovery/preflight interfaces only when needed. |

Avoid importing cloud SDKs into `internal/app`, `internal/config`, `internal/plan`,
or `internal/runstate`. This keeps the safety and command-contract unit tests
cheap and allows them to run without compiling every provider implementation.

### Command parsing and errors

Refactor `main` into a small wrapper around a testable function, conceptually:

```go
func run(ctx context.Context, args []string, stdout, stderr io.Writer) int
```

The wrapper should:

1. Handle `--help` and `--version` before configuration loading.
2. Parse a subcommand (or compatibility flags) with a flag set whose output is
   controlled by the application.
3. Load only the configuration needed for that command.
4. Call the corresponding shared service.
5. Render a `UserError` or `RunOutcome` exactly once.
6. Return the documented exit status.

Define a typed application error with at least `Code`, `Stage`, `Cause`,
`Remediation`, `ResourcesChanged`, and optional `RunID` fields. Provider and
Pulumi errors can be wrapped as causes, but their display must be sanitized and
bounded to prevent massive or secret-bearing output.

Do not use `log.Fatal` below the outermost command boundary. It exits before
deferred cleanup and prevents a reliable final summary.

### Configuration and secrets

Current configuration mixes parsing, environment-file loading, secret
expansion, and runtime defaults. Split it into stages:

1. Parse YAML and CLI arguments into an unresolved configuration.
2. Apply non-secret defaults and validate syntax, provider compatibility,
   family/filter syntax, and benchmark modes.
3. Load an environment file only when the selected command requires it.
4. Expand and validate required secret values only before remote preflight or
   execution.
5. Build an effective, redacted configuration record for plan/run manifests.

Rules:

- Missing `.env` must never block `--help`, `--version`, `init`, a local plan,
  or local `doctor`.
- A remote check or run with missing credentials must fail before provisioning
  with an explicit remediation message.
- Add a checked-in `config.example.yaml` and `.env.example`; do not commit a
  real `.env`.
- Support configuration precedence explicitly: CLI flags > selected config file
  > environment expansion > non-secret defaults.

### Safe plan semantics

The local plan is the foundation of the UX and must be deterministic from
checked-in/user-owned state.

It must:

- honor compiled provider identity, `--provider`, `--family`, `--filter`, and
  selected benchmark modes;
- list selected families and configured modes, including any modes that do not
  apply to the compiled VM/Kubernetes workload;
- report existing result files that will be skipped by resume behavior;
- show the maximum possible server/client/router or cluster resources implied
  by each selected mode;
- identify required external tools and credentials without reading secret
  values;
- disclose that price estimates are estimates and state their data source;
- make no writes and invoke no Pulumi/Tailscale/cloud API operations.

An opt-in remote plan/preflight may call cloud APIs to resolve available SKU
names, quota, or account identity. It must clearly label each remote call and
must still make no state-changing calls.

Move stale Pulumi-lock deletion out of ordinary startup. It belongs in an
explicit recovery/cleanup action that shows the lock path, validates that it
belongs to the named run when possible, records the action, and asks for
confirmation unless noninteractive approval is supplied.

### Run manifests, status, resume, and cleanup

Create a run directory such as:

```text
.tailbench/runs/<run-id>/
  manifest.json
  events.jsonl
  effective-config.redacted.yaml
  plan.json
  summary.json
  logs/tailbench.log
```

The manifest must be schema-versioned and contain:

- run ID, start/end timestamps, command line, binary version/commit/build date;
- compiled provider and workload kind;
- redacted effective configuration and plan hash;
- cloud account/project subscription identity where available;
- provider region/zone and configured images/tool versions;
- resource IDs, Pulumi stack names, hostnames, and cleanup ownership;
- per-instance/per-mode state: pending, running, succeeded, skipped, failed,
  cleanup-pending, or cleaned;
- classified failures, retry counts, and result paths;
- independent benchmark and cleanup outcomes.

Write state atomically before and after externally visible steps. On interrupt,
record that the run is recoverable and print the exact `status`, `resume`, and
`cleanup` commands. A resume must use the recorded effective configuration by
default; configuration changes require explicit acknowledgement and create a
new plan hash.

### Execution safety and budget controls

Before `run`, print a confirmation summary containing provider, region,
instance/cluster selection, modes, maximum concurrent resources, configured
duration, and cost ceiling. Require confirmation unless `--yes` is given.

Add these initial guardrails:

- `--max-cost-usd` required for noninteractive execution, with a conservative
  default or an explicit acknowledgement for interactive use;
- `--max-duration` for the complete run;
- `--max-instance-types` to prevent an accidental family-wide sweep;
- `--max-concurrent-resources`, defaulting to one benchmark topology;
- predictable run-ID/TTL tags on all provider resources;
- a clear cleanup policy (`always`, `on-success`, or `manual`) with `always`
  as the safe default for new runs.

Do not claim a precise cloud cost where the tool lacks enough data. Instead
report an upper-bound estimate, assumptions, excluded costs, and the user’s
configured guardrail.

### Failure classification and retries

Classify errors at the provider boundary and surface their class in summaries:

- invalid configuration;
- missing executable or failed CLI authentication;
- permission denied;
- unavailable SKU/region;
- quota exhaustion;
- Pulumi state/lock conflict;
- provisioning failure;
- readiness timeout;
- benchmark/transport failure;
- result-write/aggregation failure;
- cleanup failure;
- interruption/cancellation.

Retry only idempotent, transient operations using bounded exponential backoff
with a visible retry count and deadline. Never silently retry a side-effecting
operation when resource ownership is ambiguous. A quota failure should report
the affected family and advise a smaller type/region rather than simply
disappearing from output.

## Implementation phases

### Phase 0 — Safety baseline and contributor guardrails

**Goal:** prevent accidental resource exhaustion and make the development
contract unambiguous.

Tasks:

1. Update Makefile descriptions so aggregate targets are visibly CI/build-host
   oriented; add `build-one`, `test-one`, or clearly named single-variant help
   examples if useful.
2. Correct `CLAUDE.md` and add `CONTRIBUTING.md` with the resource-safety rules
   above. Remove stale untagged Go commands and claims that conflict with the
   actual build system.
3. Add a short developer checklist: identify one binary, avoid aggregate
   commands, inspect process descendants, and use a build host for matrices.
4. Add a no-build validation policy to the pull request template/review guide.

Acceptance criteria:

- A contributor can identify the one allowed local target without inspecting
  source code.
- No documentation recommends an untagged build or all-variant command as a
  normal local workflow.
- CI retains aggregate verification while developer guidance points elsewhere.

### Phase 1 — Shared command and error contract

**Goal:** no binary can silently fail under normal user invocation.

Tasks:

1. Add `internal/app` and testable `run` entry logic; make all tagged main
   binaries call it.
2. Add typed user errors and stable exit-code mapping.
3. Implement `--help`, `--version`, `--output`, `--log-file`, and `--quiet`
   with documented behavior.
4. Replace lower-level fatal exits with returned errors; keep exactly one
   renderer at the command boundary.
5. Emit a final summary for success, partial success, failure, and interrupt.
6. Add low-dependency unit tests for parsing, error rendering, help, and exit
   mapping.

Acceptance criteria:

- `--help` returns 0 without reading config.
- A missing configuration file or unknown flag reports the flag/path, next
  action, and exit code 2.
- Missing required secrets for a run report exit code 3 and say that no
  resources were created.
- Every compiled provider binary uses the same renderer and exit mapping.

### Phase 2 — Configuration split and safe local plan

**Goal:** preserve backwards compatibility while making planning safe.

Tasks:

1. Split config parsing/defaulting/secret resolution as described above.
2. Add `plan` (or implement safe semantics behind `--dry-run` first) and a
   serializable plan model.
3. Make plan honor family, filter, modes, provider compatibility, and existing
   result skips.
4. Ensure planning cannot create local state, remove locks, load secret files,
   initialize tsnet, or execute cloud/Pulumi commands.
5. Add `doctor` local checks with exact remediation for missing tools/config.
6. Add opt-in `doctor --remote` or `plan --remote` through narrow provider
   discovery interfaces.

Acceptance criteria:

- A clean checkout with no `.env` can run a local plan for every compiled
  binary.
- A selected `--family` and `--filter` appear in the plan and reduce the
  planned selection.
- A local plan leaves the working tree and `.tailbench`/state directories
  untouched.
- Invalid provider/mode combinations fail visibly before any lifecycle action.

### Phase 3 — Run lifecycle and recovery

**Goal:** make real cloud work bounded, inspectable, and recoverable.

Tasks:

1. Introduce the versioned run manifest and event stream.
2. Build `run`, `status`, `resume`, and `cleanup` around the manifest.
3. Move stale lock recovery into explicit, recorded recovery behavior.
4. Introduce confirmation, time/resource/cost controls, tags, and TTL policy.
5. Return a structured orchestrator outcome that captures failed/skipped/
   succeeded/cleanup-pending work instead of merely logging it.
6. Add error classification and bounded retry policy.
7. Record benchmark-relevant versions, image digests, and provider state needed
   for reproducibility.

Acceptance criteria:

- An interrupted run prints a run ID plus exact recovery commands.
- A cleanup failure is shown independently of benchmark success.
- `resume` continues only unfinished topology/mode work by default.
- A normal run refuses to exceed its declared guardrails without user action.

### Phase 4 — Provider and workload adaptation

**Goal:** apply the shared contract to AWS, Azure, GCP, EKS, AKS, and GKE
without copy/paste control flow.

Tasks:

1. Add optional capability interfaces for remote prerequisite checks, account
   identity, SKU discovery, and estimated cost inputs.
2. Implement adapters per provider; keep generic command and plan code free of
   provider SDK imports.
3. Define each workload’s resource topology for plan display: VM pair, optional
   router, or Kubernetes cluster/node pool/operator/pods/LB.
4. Normalize quota, unavailable-SKU, and CLI-authentication errors into common
   classifications.
5. Ensure all provider resource tags include run ID, binary/provider identity,
   owner, and TTL where supported.

Acceptance criteria:

- The same command help, exit codes, manifest schema, and plan fields work for
  all six binaries.
- Provider-specific details are added as fields, not by forking the user flow.
- VM and Kubernetes plans state their differing resource/cost implications.

### Phase 5 — Testing strategy

**Goal:** test the operational contract without expensive provider builds.

Tasks:

1. Use fakes for configuration sources, tool probes, provider discovery,
   orchestrator execution, clocks, confirmation, and filesystem state.
2. Add table-driven tests for:
   - missing/optional environment file behavior;
   - unknown flag/help/version exit behavior;
   - plan purity and selector handling;
   - provider/mode compatibility;
   - diagnostic redaction and original-error rendering;
   - all-families discovery failure and partial failure summaries;
   - manifest atomicity, resume decisions, interruption, and cleanup failure;
   - cost/time guardrail refusal.
3. Add golden tests for text and JSON plan/summary output.
4. Retain tag-specific tests for provider adapters, but run them one target at a
   time on the build machine.
5. Add scheduled, credentialed smoke tests in isolated provider accounts only;
   never run provisioning tests for every pull request.

Acceptance criteria:

- Command-contract regressions are detected by low-resource tests.
- A developer can test parser/plan/summary changes without compiling cloud SDK
  graphs.
- Each provider adapter has an approval-gated single-target test command.

### Phase 6 — Documentation and technical-editor pass

**Goal:** documentation reflects the safe operational product rather than its
implementation history.

#### README.md editorial brief

Rewrite the README around an operator’s journey. Keep advanced benchmark
methodology in linked documents.

Required outline:

1. **What Tailbench measures** — include the distinction between VM and
   Kubernetes workloads and a concise statement of benchmark limits.
2. **Before you start** — cloud-cost warning, permissions overview, supported
   platform policy, and resource cleanup expectation.
3. **Choose one binary** — a compact provider/binary matrix and a firm warning
   not to build all variants locally.
4. **Five-minute safe start** — install/build one selected binary, initialize
   config, run local doctor/plan, and explain expected output.
5. **Run one bounded benchmark** — one instance type, cost/time limits, clear
   `--yes` automation guidance, result location, and cleanup behavior.
6. **Operate a run** — status, resume, cleanup, logs, and how to react after
   interruption.
7. **Configuration and credentials** — link to a reference page; never put
   real secrets in an example.
8. **Results and reproducibility** — explain manifests, methodology, result
   metadata, dashboard aggregation, and version comparability.
9. **Troubleshooting** — a short decision table keyed to actual diagnostics:
   missing tool, login failure, permissions, quota, stale state, timeout, and
   cleanup failure.
10. **Development** — one-variant-at-a-time rules, CI/build-host boundary, and
    links to contributing documentation.

Editorial rules:

- Lead with outcomes, safety, and exact examples—not architecture trivia.
- Use direct, short sentences and define terms before relying on them.
- Mark every command as side-effect-free, remote-read-only, or provisioning.
- Never claim a dry run is safe unless the implementation enforces that.
- Keep provider-specific examples short and visually consistent.
- Use descriptive link text, such as `[Forwarding-pps methodology]`, rather
  than raw filenames.
- Use repository-relative Markdown links only. Do not use `file://`, `/home`,
  `/Users`, `/github`, `~`, workspace paths, or personal checkout paths.
- Link to an actual deployed dashboard only after its canonical URL is known.

Supporting documentation to add or reorganize:

- `docs/getting-started.md`
- `docs/configuration.md`
- `docs/operations.md` (status, resume, cleanup, recovery)
- `docs/troubleshooting.md`
- `docs/methodology.md`
- `docs/providers/aws.md`, `azure.md`, and `gcp.md`
- `CONTRIBUTING.md`
- `SECURITY.md`

`CLAUDE.md` should remain agent-oriented, but it must accurately mirror the
single-variant resource rule, current Makefile/tag workflow, and the actual
CI/release behavior. Remove workstation-specific paths and pseudo-relative
`file://` references.

Acceptance criteria:

- A new user can complete a local plan, one bounded run, and cleanup using
  README-linked documentation alone.
- Checked-in user-facing Markdown has no absolute workstation links.
- Contributor guidance never recommends an aggregate build for normal local
  development.

### Phase 7 — CI, release, and supply-chain hygiene

**Goal:** protect the shared contract and publish trustworthy artifacts.

Tasks:

1. Add a low-cost documentation check for broken local links and forbidden
   filesystem-path patterns.
2. Add a formatting/static check that does not trigger all provider graphs.
3. Keep the six-variant matrix in CI, with controlled concurrency and explicit
   memory-capable runners if required.
4. Make tagged release publishing depend on successful validation for the exact
   commit being released.
5. Attach checksums, SBOMs, provenance attestations, and supported-platform
   information to releases.
6. Pin Actions by commit digest and use least-privilege workflow permissions.
7. Document whether release binaries are Linux AMD64 only or add intentional
   supported architectures; do not leave ARM coverage ambiguous.

Acceptance criteria:

- Pull requests cannot introduce broken internal docs links or silent command
  contract regressions.
- Releases include verifiable artifacts and installation/verification steps.
- Matrix compilation occurs on build infrastructure, not by accident on a
  contributor laptop.

## Migration and compatibility policy

1. Preserve existing provider binary names and compiled-provider enforcement.
2. Preserve existing configuration keys while adding deprecation notices and
   migration guidance for renamed behavior.
3. Keep `--dry-run` as a compatibility alias until at least one documented
   release cycle after `plan` is introduced.
4. Preserve existing result JSON paths and schemas unless versioned migration
   logic and dashboard compatibility are supplied.
5. Do not delete existing local Pulumi or result state during migration.
6. Version run manifests and plan JSON from the first implementation so future
   readers can distinguish schema changes.

## Delivery sequence

Implement and review in this order:

1. Phase 0: resource-safety documentation and guardrails.
2. Phase 1: shared command/error boundary plus low-resource tests.
3. Phase 2: configuration split and safe local planning.
4. Phase 3: run state, guardrails, cleanup/recovery, and summaries.
5. Phase 4: provider adapters and workload-specific plan detail.
6. Phase 5: contract tests, then approval-gated one-target validation.
7. Phase 6: README technical-editor pass and supporting operations docs.
8. Phase 7: CI/release hardening and isolated cloud smoke tests.

After each phase, validate the changed shared behavior with the smallest
possible approved test/build target. Do not use an aggregate command as a
shortcut. AWS may be the first approved executable check; repeat only the
relevant single-target validation for another provider once its adapter work is
ready.

## Definition of done

This program is complete when all of the following are true:

- Every `tailbench-*` binary presents the same safe user contract.
- No normal user failure exits silently.
- Local planning has no local or cloud side effects and works without secrets.
- Remote checks and provisioning are explicit, bounded, attributable, and
  recoverable.
- Users can inspect, resume, and clean up every interrupted run by run ID.
- Result data includes enough version/configuration metadata for meaningful
  comparison.
- README-led onboarding teaches a safe one-binary workflow and portable docs
  links pass automated checks.
- Normal laptop guidance never asks contributors to build or test every cloud
  variant.
- CI/build machines, rather than developer laptops, own aggregate compilation,
  full matrices, release packaging, and cloud smoke tests.
