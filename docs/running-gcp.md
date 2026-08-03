# Running tailbench on GCP virtual machines

This runbook covers `tailbench-gcp`, the Compute Engine VM variant. It is
sequential: prerequisites through teardown. For the GKE variant see
[running-gke.md](running-gke.md); for what is common to all six binaries see
[running.md](running.md).

## What this binary is

`tailbench-gcp` provisions a pair of identical Compute Engine instances per
selected machine type, benchmarks the LAN path against the Tailscale path
between them, destroys the pair, and moves on to the next type. Benchmarks are
driven over SSH through the orchestrator's own tsnet node — there is no
Kubernetes involved, and none of the Kubernetes SDKs are linked into this
binary.

| Property | Value |
|---|---|
| Binary | `dist/tailbench-gcp` |
| Build tags | `gcp` |
| Make target | `make build-gcp` |
| Provider value | `gcp` |
| Workload | `vm` |
| Runtime cloud CLI | `gcloud` |
| Result directory | `gcp/<family>/results/<type>-<mode>.json` |
| Run state | `.tailbench/runs/<run-id>/` |
| Pulumi stack names | `tailbench-gcp-<type>-<run-suffix>` |

The provider value, not the executable name, decides all of the above. An
explicit `--provider` that is not `gcp` is rejected three separate times — when
the local plan is built (`internal/plan/build.go:34-42`), by `doctor`
(`cmd/tailbench/main.go:1555-1573`), and when the provider is constructed
(`cmd/tailbench/main.go:1740-1745`) — so renaming the executable changes
nothing.

Stack names are now run-scoped. Every `run` mints a run ID
(`tb_YYYY-MM-DD_<hex>`, `internal/runstate/store.go:22,64-73`) and the hex
suffix is appended to the stack name and to every GCE resource name
(`internal/provider/gcp.go:39-42,95-97`, `internal/provider/run_scope.go:8-36`).

The command surface is `init`, `run` (the default), `plan`, `doctor`,
`status RUN_ID`, `results RUN_ID`, `resume RUN_ID`, and `cleanup RUN_ID`.
Failures print a structured block — `[TB_<CODE>] stage / cause / resources
changed / next` (`internal/app/render.go:141-170`) — and exit with a typed
status (`internal/app/types.go:5-13`):

| Exit | Meaning |
|---|---|
| 0 | ok |
| 1 | run failed |
| 2 | usage |
| 3 | prerequisite |
| 4 | refused (guardrail, declined confirmation, `init` would overwrite) |
| 5 | recovery (bad or missing run manifest) |
| 130 | interrupted |

## Prerequisites

`mise.toml` pins every tool; `mise install` provisions them. The VM variant
needs only three of them — `kubectl` and `helm` are for the `*-k8s` variants.

Do not hand-roll the verification. `doctor` is the supported check:

```bash
./dist/tailbench-gcp doctor              # local only, no credentials, no network
./dist/tailbench-gcp doctor --remote     # loads credentials, read-only checks
./dist/tailbench-gcp doctor --output json
```

Local `doctor` verifies exactly two things for this variant: that `pulumi` and
`gcloud` are on `PATH` (`internal/preflight/preflight.go:216-235`). The
credential check is explicitly reported as skipped
(`internal/preflight/preflight.go:103-113`); nothing is read and nothing is
contacted.

`doctor --remote` first requires `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` to
resolve — so it opens the environment file, and a missing one fails with
`[TB_PREREQUISITE]` before any command runs. It then executes two read-only
commands and discards their output (`internal/preflight/remote.go:44-52,
106-111`):

- `pulumi whoami`
- `gcloud auth list --filter=status:ACTIVE --format=value(account)`

The active-account email is deliberately not retained for GCP
(`internal/preflight/remote.go:143-147`); the manifest's cloud identity records
the configured `gcp.project` instead (`cmd/tailbench/main.go:1057-1060`).

**What `doctor` does not cover**, and you still have to check yourself:

| Not covered | Why it matters | Check |
|---|---|---|
| Application Default Credentials | The Pulumi GCP provider authenticates through ADC, not through the `gcloud auth login` account that `doctor --remote` verifies | `gcloud auth application-default print-access-token >/dev/null` |
| Whether `gcp.project` exists and answers | Nothing before `run` reads the project — see [the `tailscale-sandbox` trap](#the-tailscale-sandbox-trap) | the `gcloud compute machine-types list` command below |
| Compute Engine API enabled | `compute.googleapis.com` is the only Google API this variant touches | same command |
| Go toolchain | Only needed to build from source | `go version` against the `go` directive in `go.mod` |

The one manual check worth keeping, because it is the exact command tailbench
runs during a run (`internal/provider/gcp_instances.go:18-21`):

```bash
gcloud compute machine-types list \
  --project=YOUR_PROJECT \
  --filter="zone:us-central1-a AND name ~ '^c4-standard-[0-9]+$'" \
  --format='value(name)'
```

If it prints nothing or errors, the run will find zero instance types and fail.
`plan` will not tell you this — it never calls `gcloud`.

## Build

```bash
make build-gcp            # writes dist/tailbench-gcp
./dist/tailbench-gcp --version
make verify-deps VARIANT=gcp
```

Exactly one cloud build tag is required; a bare `go build ./cmd/tailbench/`
fails on purpose. `make verify-deps VARIANT=gcp` asserts that the binary links
`pulumi-gcp` and neither of the other two cloud SDKs
(`scripts/verify-deps.sh:26,28-34`).

`--help` and `--version` are handled before any configuration is loaded
(`internal/app/app.go:43-50`), so both work in an empty directory.

## Credentials

Three independent systems. Each fails in its own way, and satisfying one says
nothing about the others.

### 1. Tailscale OAuth

Goes in `.env`, which `config.yaml` references through `env_file:` and expands
into the `${VAR}` placeholders under `tailscale:`.

```bash
cp .env.example .env
$EDITOR .env    # OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET
```

#### Decide first: create a tailnet, or join one

This is the setup decision to get right before anything else, because both
failure modes are expensive — one aborts after instances are being provisioned,
the other overwrites a policy file.

**Option A — create an ephemeral tailnet (`create_tailnet: true`).** Tailbench
POSTs to `/api/v2/organizations/-/tailnets`
(`internal/tailnet/tailnet.go:63-104`), and the response carries a *per-tailnet*
OAuth client that the orchestrator swaps into the config
(`internal/orchestrator/orchestrator.go:389-390`). The credentials you configure
are therefore used **only** for tailnet create and delete; the ACL, auth keys,
device cleanup, and tailnet settings all run against the returned client.

That create call needs an org-level permission that is **not one of the
published OAuth scopes**. A client with scope `all` that is scoped to a single
tailnet is not enough — it fails with:

```text
create tailnet: tailnet creation failed (HTTP 403): {"message":"actor does not have permission to create tailnets"}
```

Nothing local catches this: `plan` never contacts Tailscale, and
`doctor --remote` only checks that the values are non-empty, so the 403 arrives
at run time (`internal/orchestrator/orchestrator.go:375-386`).

**Option B — join the tailnet the OAuth client already belongs to
(`create_tailnet: false` plus `tailscale.tailnet_dns_name`).** Tailbench then
creates and deletes no tailnet at all. It sets the ACL, mints the auth key, and
brings the instances up on the tailnet you named
(`internal/orchestrator/orchestrator.go:239-261`,
`internal/config/config.go:21-22,93-94,410-411`):

```yaml
tailscale:
  create_tailnet: false
  tailnet_dns_name: example-name.ts.net
  oauth_client_id: ${OAUTH_CLIENT_ID}
  oauth_client_secret: ${OAUTH_CLIENT_SECRET}
  tag: tag:bench
```

Before this key existed, `create_tailnet: false` was not a working
configuration — no auth key was minted and every instance failed with
`auth key is empty`.

> **`tailnet_dns_name` REPLACES the tailnet's policy file.** `SetupACL` calls
> `PolicyFile().Set(...)` with a freshly built allow-all benchmark policy
> (`internal/tailnet/tailnet.go:150-152`, `buildACL` at `:160-228`) — a single
> `accept */*:*` rule plus tag owners, SSH rules, an exit-node auto-approver, and
> a peer-relay grant. Nothing is merged; whatever the tailnet's policy file
> contained is gone. Point this only at a tailnet dedicated to benchmarking.
> Tailscale keeps policy-file version history, so a mistake is recoverable from
> the admin console.

Two smaller differences on the join path: stale-device cleanup is skipped (the
`tb-gcp-` sweep is inside the `create_tailnet` branch,
`internal/orchestrator/orchestrator.go:609-623`), and no cleanup policy will ever
delete a tailnet tailbench merely joined (`:263-310`).

**Setting neither is a startup error.** `orchestrator.New` refuses with
`no tailnet configured: set tailscale.create_tailnet: true …, or
tailscale.tailnet_dns_name to benchmark an existing one`
(`internal/orchestrator/orchestrator.go:174-179`) — checked there rather than at
parse time so `plan` and `doctor` keep working on a config that is not ready to
run.

Either way the client must be able to write auth keys, the policy file, and
devices. Under Option A tailbench creates and deletes real tailnets, so use
disposable org credentials.

Secret resolution is now an explicit stage. `plan`, local `doctor`, `--version`,
and `--help` never open the environment file
(`internal/config/config.go:256-261,304-315`). Anything that can provision —
`run`, `resume`, `cleanup`, and `doctor --remote` — does, and **a missing
`env_file` is fatal there**, with exit 3:

```text
[TB_PREREQUISITE] stage: preflight
cause: load environment file .env: open .env: no such file or directory
next: create the environment file, or remove env_file and supply the required values another way
```

This is checked before the execution confirmation prompt, so you cannot approve
a run that has no credentials. Empty values are caught separately, also before
the prompt (`cmd/tailbench/main.go:1701-1710`).

### 2. The gcloud CLI — two separate credentials

This variant uses two different Google credentials, configured by two different
commands:

| Credential | Set up with | Consumed by |
|---|---|---|
| User/service-account credential | `gcloud auth login` (or `gcloud auth activate-service-account`) | `gcloud compute machine-types list` — instance discovery during `run`, and the `doctor --remote` auth check |
| Application Default Credentials | `gcloud auth application-default login` (or `GOOGLE_APPLICATION_CREDENTIALS` pointing at a key file) | The Pulumi GCP provider, during `CreatePair` / `DestroyPair` |

`gcloud auth login` alone is **not** enough, and `doctor --remote` will not
catch the difference — it only runs `gcloud auth list`. Tailbench sets only
`gcp:project`, `gcp:zone`, and `gcp:region` on the stack
(`internal/provider/gcp.go:181-189`) and never sets a credentials value — no
file in this repository references `GOOGLE_CREDENTIALS` or
`GOOGLE_APPLICATION_CREDENTIALS` — so the Pulumi GCP provider is left to its own
credential resolution, which lands on ADC. The resolution order itself is
Pulumi/Terraform provider behavior rather than tailbench code, so treat the
exact precedence as external to this repo; what is verifiable here is that
tailbench supplies nothing.

Required capability, derived from the resources actually created (see
[What happens during a run](#what-happens-during-a-run)): create, read, and
delete Compute Engine instances and their boot disks in `gcp.project`; read
machine types; and, only for the three-node modes, create and delete a firewall
rule on the `default` network. Map that onto whatever least-privilege role your
organization permits — this document deliberately does not prescribe a role
binding.

There are no credential-wrapping Make targets for this variant. The Makefile
defines `plan-aws`, `doctor-aws`, `doctor-aws-remote`, and `bench-aws`, which
wrap `./dist/tailbench-aws` in `esc run` so AWS credentials come from a
[Pulumi ESC](https://www.pulumi.com/docs/esc/) environment while Tailscale OAuth
still comes from `.env` (`Makefile:26`, `:118-137`). Nothing about that pattern
is AWS-specific and it needs no tailbench support — `esc run <env> --
./dist/tailbench-gcp run …` works the same way — but no GCP targets exist.

### 3. The Pulumi state backend

Local by default and needs no backend credentials. Pulumi Cloud needs
`PULUMI_ACCESS_TOKEN` or a prior `pulumi login`; tailbench checks when the
orchestrator is constructed and refuses to begin without it
(`internal/provider/backend.go:59-75`, `internal/orchestrator/orchestrator.go:163-165`).
Object-store backends (`gs://`, `s3://`, `azblob://`) authenticate through the
same cloud credentials you already configured. See
[Choose a state backend](#choose-a-state-backend).

Independently of the backend, `pulumi whoami` must succeed: it is part of the
remote preflight that `run`, `resume`, and `cleanup` all execute
(`internal/preflight/remote.go:44-52`, `cmd/tailbench/main.go:979-982`). A
never-logged-in Pulumi CLI therefore blocks a run even with the default local
file backend.

## Configure config.yaml

Start with `init` rather than editing the repository's `config.yaml`:

```bash
mkdir ~/tailbench-gcp && cd ~/tailbench-gcp
/path/to/dist/tailbench-gcp init
```

`init` writes two files and nothing else (`cmd/tailbench/main.go:163-256`):

- `config.yaml`, pre-filled for the compiled provider. The GCP section is
  `project: YOUR_GCP_PROJECT_ID` / `zone: us-central1-a`
  (`cmd/tailbench/main.go:273-278`), its `tailscale:` block defaults to
  `create_tailnet: true` with a commented-out `tailnet_dns_name` alternative
  (`:288-297`), and it ships `dry_run: true` so an unqualified invocation plans
  instead of provisioning.
- `.env.example`, mode `0600`, with the two OAuth keys empty.

It refuses rather than overwriting: if either file exists you get
`[TB_INIT_EXISTS]` and exit 4. `config.example.yaml` in the repository root is
the same idea, checked in, and can be selected directly with `--config`.

Two keys are specific to this variant.

| Key | Default | What it does | What breaks if it is wrong |
|---|---|---|---|
| `gcp.project` | `YOUR_GCP_PROJECT_ID` from `init`; `tailscale-sandbox` when the key is absent (`internal/config/config.go:448`) | The project every instance, disk, and machine-type query goes to | Nothing until `run`, which then fails after the tailnet already exists — see the trap below |
| `gcp.zone` | `us-central1-a` (`internal/config/config.go:449`) | Instance placement, the machine-type discovery filter, and the source of the derived region | A zone where the family is unavailable yields an empty instance list at run time; a value with no `-` in it panics at result-write time |

### The `tailscale-sandbox` trap

**When `gcp.project` is absent, it falls back to `tailscale-sandbox`, an upstream
author's project you almost certainly cannot access**
(`internal/config/config.go:448`). The repository's own `config.yaml` still
carries that literal value on line 67. `init` and `config.example.yaml` use the
placeholder `YOUR_GCP_PROJECT_ID` instead, which is the fix — but only if you
start from one of them.

**The failure mode changed, and it is now late rather than quiet.**

`plan` no longer detects it at all. Instance selection comes from the
checked-in price catalog (`internal/plan/catalog.go:11-23`,
`internal/plan/build.go:82-87`), keyed on provider and region only. Nothing in
the plan path reads `gcp.project`, and the plan's redacted-configuration line
does not print it (`internal/plan/build.go:347-363`). A plan built with a
nonexistent project is byte-for-byte identical to a correct one.

`doctor --remote` does not detect it either: it runs `gcloud auth list`, which
says nothing about whether a particular project exists or is readable
(`internal/preflight/remote.go:106-111`).

It surfaces during `run`, in instance discovery. `listGCPInstances` shells out
to `gcloud compute machine-types list --project=...`
(`internal/provider/gcp_instances.go:18-24`). The error is not classified as
transient (`internal/failure/classify.go:164-194`), so there is one attempt per
family; every family fails, the failures are joined and returned
(`internal/orchestrator/orchestrator.go:1647-1667,1680`), and `runProvider`
records that as a benchmark failure
(`internal/orchestrator/orchestrator.go:579-582`). You still see:

```text
[gcp] found 0 instance types to benchmark
```

but the run now ends with a non-zero status:

```text
[TB_RUN_FAILED] stage: run
next: tailbench-gcp status <run-id>; tailbench-gcp resume <run-id> --yes; or tailbench-gcp cleanup <run-id> --yes
```

No GCE resource is created. A tailnet **is** — the tailnet is created and the
orchestrator's tsnet node joins before any provider work begins — and it is
deleted again by the default `cleanup_policy: always`
(`internal/orchestrator/orchestrator.go:229-274`). Set the project before
anything else:

```yaml
gcp:
  project: your-project-id
  zone: us-central1-a
```

### Zone and region

There is no region key. The region is derived from the zone by truncating at the
last `-`, in three places:

- `cmd/tailbench/gcp.go:15-18`, for the Pulumi `gcp:region` config — guarded
  with `idx > 0`.
- `internal/plan/build.go:334-339`, for the plan's `region:` line — also
  guarded.
- `internal/orchestrator/orchestrator.go:1335`, for the `region` field written
  into every result JSON — **not** guarded.

`us-central1-a` therefore yields region `us-central1`, zone `us-central1-a`.

That derived region is what the pricing lookup is keyed on. `pricing.Lookup`
collapses a GCP zone to its region and, on a miss, falls back to the canonical
region `us-central1` with a log line
(`internal/pricing/pricing.go:40-44,96-130`). `pricing.List`, which `plan` uses,
does the same silently (`internal/pricing/pricing.go:136-146`). The embedded
dataset currently carries GCP prices for `us-central1` only, so **a benchmark run
in any other region is priced with `us-central1` numbers**, and a plan for
`europe-west1` lists the `us-central1` catalog without saying so.

The unguarded region derivation flagged in earlier revisions of this document
**still exists**: `o.cfg.GCPZone[:strings.LastIndex(o.cfg.GCPZone, "-")]` at
`internal/orchestrator/orchestrator.go:1335` panics when the zone contains no
`-`, because `LastIndex` returns `-1`. Any real zone name contains one, so this
only bites on a malformed value — but it bites after provisioning, and `plan`
will not have flagged it, because the two other derivation sites guard the
index.

### Guardrail keys

These are new, apply to every provider, and are evaluated before any secret is
loaded (`internal/config/config.go:73-82,336-395`):

| Key | Flag | Default |
|---|---|---|
| `max_cost_usd` | `--max-cost-usd` | `10` (but see `--yes` below) |
| `max_duration` | `--max-duration` | `45m` |
| `max_instance_types` | `--max-instance-types` | `1` |
| `max_concurrent_resources` | `--max-concurrent-resources` | `1` |
| `cleanup_policy` | `--cleanup-policy` | `always` (`on-success`, `manual`) |
| `dry_run` | `--dry-run` | `false`; either one routes to `plan` |

### Keys that are not variant-specific but still matter

- `benchmark.modes` — the only place modes come from. There is no `--modes`
  flag. Empty defaults to `["l4-kernel"]` (`internal/config/config.go:487-489`).
- `tailscale.create_tailnet`, `tailscale.tailnet_dns_name`, `tailscale.tag` —
  `init` now writes `create_tailnet: true` with a commented-out
  `tailnet_dns_name` alternative (`cmd/tailbench/main.go:288-297`). Keep
  `create_tailnet: true` only if your OAuth client is org-level and permitted to
  create tailnets; otherwise switch to `create_tailnet: false` plus
  `tailnet_dns_name`, whose **policy file will be replaced**. Setting neither is
  refused at startup (`internal/orchestrator/orchestrator.go:174-179`). See
  [Decide first: create a tailnet, or join one](#decide-first-create-a-tailnet-or-join-one).
- `ssh.ready_timeout` — seconds to wait per node for cloud-init to write
  `/tmp/tailbench-ready`; default `300` (`internal/config/config.go:446`,
  `internal/orchestrator/orchestrator.go:1085-1106`). This bound is new. `0` or
  less falls back to waiting on `--max-duration` alone, which is the expensive
  failure it exists to prevent.
- `state_backend` — see the next section. Unchanged.
- `aws.*` and `azure.*` are ignored by this binary. There are no
  `gcp.ssh_user` / `gcp.ssh_pub_key_file` keys.

### Things you cannot configure

The VPC network and subnetwork are hardcoded to `default`
(`cmd/tailbench/gcp.go:21`). There is no config key, no flag, and no environment
variable for them. `SetupNetworking` creates no cloud resource — it resolves the
SSH key and echoes the two network names plus `ssh_user`/`ssh_public_key` back
(`internal/provider/gcp.go:88-102`) — and the provider declares
`ManagesNetworking() == false` (`internal/provider/gcp.go:37`), so the
orchestrator skips the whole networking provision/teardown block for GCP.

There is also no `gcp.ssh_user` or `gcp.ssh_pub_key_file` key: the login is
always `ubuntu` and the key is always the generated one. Consequences:

- The project must have a usable `default` network with a subnet in `gcp.zone`'s
  region.
- Tailbench creates no firewall rule for a normal two-node run, so the network
  must already permit ICMP (the LAN reachability check,
  `internal/benchmark/runner.go:89-95,239`) and TCP/UDP 15201 (`IPerfPort`,
  `internal/benchmark/iperf.go:10`) between instances in the subnet. An
  auto-mode `default` network's built-in internal-allow and ICMP rules satisfy
  this; a project whose default network was deleted or hardened does not.
- Instances are created with an external IP
  (`internal/provider/gcp.go:193-200`), which cloud-init needs to install
  Tailscale, iperf3, mtr, and fortio — and which is how you reach a node that
  never finished cloud-init (see [Troubleshooting](#troubleshooting)).

## Choose a state backend

Set `state_backend:` in `config.yaml` or pass `--state-backend`. This works
exactly as before; note only that `--state-backend` is accepted by every
configuration-loading command but is absent from `--help`
(`internal/config/config.go:283-284`, `internal/app/app.go:166-181`).

| Value | Backend | Consequence |
|---|---|---|
| *(empty, default)* | `file://<root>/state/gcp` | Stacks exist only in this checkout on this machine. Another machine cannot resume or destroy them, so an interrupted run leaks instances. Tailbench creates `<root>/state` at startup (`internal/orchestrator/orchestrator.go:208-214`) |
| `pulumi.com` | Pulumi Cloud, normalized to `https://api.pulumi.com` | Stacks survive machine swaps. Requires `PULUMI_ACCESS_TOKEN` (an `.env` entry works) or `pulumi login` |
| `gs://bucket/prefix` | Google Cloud Storage | Same durability, authenticated by the Google credentials you already have |
| `s3://…`, `azblob://…` | Object storage on another cloud | Works; needs that cloud's credentials |
| `file://…` | An explicit local or mounted path | Local semantics at a path you choose |

Remote backends skip the local `state/` directory creation
(`internal/orchestrator/orchestrator.go:204-207`) and get Pulumi scratch space
under `.tailbench/pulumi/gcp` instead (`internal/provider/backend.go:30-38`).
Stack names are provider-qualified and run-scoped, so one bucket can safely hold
every provider's stacks. An unrecognized value is rejected at parse time with
`[TB_CONFIG]` and exit 2 (`internal/config/config.go:198-225`):

```console
$ ./dist/tailbench-gcp plan --state-backend ftp://x
[TB_CONFIG] stage: configuration
cause: invalid state_backend "ftp://x": use "pulumi.com" for Pulumi Cloud, or a URL with one of these schemes: file:// s3:// gs:// azblob:// https:// http://
```

**Stale Pulumi locks are no longer swept at startup.** Removing them is an
explicit, manifest-scoped step — see [Teardown](#teardown).

```bash
./dist/tailbench-gcp run --state-backend gs://tailbench-state/pulumi --family c4
```

## Plan

`plan` replaces the old dry run. Always do this first. It prints the provider,
the resolved region and zone, the configured modes, every instance type
`--family` and `--filter` select with its catalog price, the maximum topology,
the estimated cost upper bound, and the guardrails in force.

```bash
./dist/tailbench-gcp plan
./dist/tailbench-gcp plan --family c4a
./dist/tailbench-gcp plan --filter '^c4-standard-(2|4)$'
./dist/tailbench-gcp plan --output json
```

`--dry-run`, and YAML `dry_run: true`, are compatibility aliases that route to
the same executor (`internal/app/app.go:273-277`,
`cmd/tailbench/main.go:1395-1411`). Use `plan` in new automation.

**It is genuinely side-effect-free now.** It parses configuration through
`config.ParseLocalArgs` (`cmd/tailbench/main.go:1203-1231`), which does not open
`env_file`, does not expand secret values, and does not read SSH keys from your
home directory (`internal/config/config.go:256-261,304-315,464-485`). It calls
no cloud API, shells out to nothing, creates no state directory, and touches no
Pulumi lock. The only filesystem access is reading the selected config and
`os.Stat`-ing existing result files to label each mode `run` or `skip-existing`
(`internal/plan/build.go:178-193`).

That means **`plan` no longer tests your GCP setup.** The old dry run called
`ListInstances` for real and needed working `gcloud` auth and a correct
`gcp.project`; it now resolves instance types from `internal/pricing/data.json`
via `plan.PricingCatalog`. Use `doctor --remote` for the credential check, and
the `gcloud compute machine-types list` command in
[Prerequisites](#prerequisites) for the project check.

Two consequences worth knowing:

- **An unrecognized `--family` is no longer an error.** It selects nothing,
  `plan` exits 0, and you get a warning
  (`internal/plan/build.go:146-151`):

  ```text
  instances:
    (none resolved from local catalog)
  warning: no matching instances are present in the checked-in local price catalog; use doctor --remote to verify provider availability
  ```

  The same warning appears when the family is real but no matching type is
  priced. `run` turns it into a refusal — see [Run](#run).

- **A region outside the catalog silently falls back to `us-central1`.** The
  header still reports the configured region, but the listed types and prices
  are the canonical-region ones (`internal/pricing/pricing.go:136-146`).

Modes are validated here too: an unknown name and `tsnet-userspace` (which has
no runner) both fail the plan with `[TB_PLAN]` and exit 2
(`internal/plan/build.go:58-75`).

## Run

```bash
./dist/tailbench-gcp run --filter '^c4-standard-4$' --max-cost-usd 5
./dist/tailbench-gcp run --family c4a --max-instance-types 4 --max-cost-usd 20
./dist/tailbench-gcp run --config ./config.gcp.yaml
./dist/tailbench-gcp                                   # `run` is the default
```

Order of operations (`cmd/tailbench/main.go:897-1044`):

1. Build the local plan — same code path as `plan`, no secrets.
2. Evaluate the guardrails against it (`internal/guardrail/guardrail.go:28-117`).
   A violation is `[TB_SAFETY_LIMIT]`, exit 4, before anything else happens.
3. Print the confirmation block and read `y`/`yes` from stdin, unless `--yes`
   (`internal/guardrail/guardrail.go:119-173`).
4. Load configuration *with* secrets. A missing `env_file` is `[TB_PREREQUISITE]`,
   exit 3.
5. Remote preflight: `pulumi whoami`, `gcloud auth list`. Failure is
   `[TB_PREREQUISITE]`, exit 3.
6. Create the run manifest under `.tailbench/runs/<run-id>/` and start the
   orchestrator under a `--max-duration` timeout.

The confirmation block looks like this:

```text
TAILBENCH EXECUTION CONFIRMATION
provider: gcp
workload: vm
region: us-central1
pending instance types: 1 (limit 1)
instance types: c4a-standard-1
modes: l4-kernel
maximum topology: compute=2 clusters=0 load-balancers=0
duration limit: 45m0s
estimated cost upper bound: $0.06
cost ceiling: $5.00
cleanup policy: always
Proceed? [y/N]:
```

`--yes` skips it but **requires an explicitly configured `--max-cost-usd`** (or
`max_cost_usd` in the selected YAML). The 10 USD default is not "explicit": it
leaves `MaxCostSet` false and `--yes` alone is refused
(`internal/config/config.go:336-348`, `internal/guardrail/guardrail.go:63-69`).

### Guardrails, and what they refuse

| Code | Fires when |
|---|---|
| `no-runnable-work` | No instance type has a pending applicable mode — the usual cause of an unrecognized `--family`/`--filter` |
| `noninteractive-cost-required` | `--yes` without an explicit cost ceiling |
| `max-instance-types` | More instance types have pending work than `--max-instance-types` allows |
| `max-cost-usd` | The estimated upper bound exceeds the ceiling |
| `cost-estimate-unavailable` | Selected types have work but no catalog price |
| `incompatible-mode` | A configured mode does not apply to `vm` |
| `cleanup-policy` | The policy string is not one of the three |

All violations are reported together in one `[TB_SAFETY_LIMIT]` block:

```console
$ ./dist/tailbench-gcp run --filter '^zzz$' --yes
[TB_SAFETY_LIMIT] stage: guardrails
cause: no-runnable-work: the local plan has no instance types with pending applicable work; noninteractive-cost-required: --yes requires an explicitly configured --max-cost-usd ceiling
resources changed: no
next: adjust --family/--filter/modes or use results to inspect existing output; set --max-cost-usd to an approved positive amount
```

**The `--max-instance-types 1` default is the change you will hit first.** An
unfiltered family run that used to walk every size is now refused until you
either narrow the selection or raise the limit deliberately.

### Scoping cost

Each selected machine type provisions two instances (three for the forwarding
and relay modes) for the duration of its benchmarks, then destroys them. The
plan's estimate is `highest hourly price among types with pending work x
maximum compute resources x --max-duration`
(`internal/plan/build.go:195-274`), which is a bound, not a forecast: the
concurrency limit is one topology.

Two levers control the selection:

- `--family` picks one family. Available families for this provider are `c4`,
  `c4a`, `c3d`, `n4`, `c3`, `n2`, `c2`
  (`internal/provider/gcp_instances.go:14-16`). `c4a` is Arm (Axion); the
  provider branches on it to select an `arm64` Ubuntu 24.04 image, and `c4`,
  `c4a`, and `n4` additionally get `hyperdisk-balanced` boot disks instead of
  `pd-ssd` (`internal/provider/gcp.go:65-75`).
- `--filter` is a Go regular expression matched against the machine type name.
  Anchor it (`^…$`) unless you mean a prefix match.

At run time, discovery only ever returns `-standard-` shapes: the filter is
`^<family>-standard-[0-9]+$` (`internal/provider/gcp_instances.go:19`), so
`highcpu`, `highmem`, `lssd`, and `metal` variants are never benchmarked.
Results come back sorted ascending by vCPU count
(`internal/provider/gcp_instances.go:33`), and `plan` sorts its catalog
selection the same way (`internal/plan/build.go:169-174`), so an unfiltered
family run walks from the smallest type upward.

### Modes this binary accepts and rejects

Modes come from `benchmark.modes` in `config.yaml` only.

| Mode | VM binary | Notes |
|---|---|---|
| `l4-kernel` | accepted | iperf3 + MTR, LAN baseline vs Tailscale. The default when `modes` is empty |
| `l4-userspace` | accepted | See the caveat below |
| `l7-serve-h1`, `l7-serve-h2` | accepted | fortio over `tailscale serve`; cloud-init installs fortio and starts the echo server |
| `forward-pps-exit` | accepted, opt-in | Adds a third VM |
| `relay-throughput` | accepted, opt-in | Adds a third VM; needs Tailscale >= 1.86 |
| `tsnet-userspace` | **rejected at plan time** | No runner exists; `plan` fails with `benchmark mode "tsnet-userspace" is not implemented; remove it before running` (`internal/plan/build.go:63-68`) |
| `l4-lb` | **rejected** | Kubernetes-only |
| `l7-ingress-h1`, `l7-ingress-h2` | **rejected** | Kubernetes-only |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | **rejected** | Kubernetes-only |

Kubernetes-only modes are caught twice: as an `incompatible-mode` guardrail
violation before anything runs (`internal/guardrail/guardrail.go:48-62`), and by
`validateWorkloadConfig` when the orchestrator is constructed, with
`kubernetes-only benchmark mode "…" requires a k8s-enabled binary`
(`internal/orchestrator/k8s_disabled.go:16-23`). The container/VM split itself is
`benchmark.ModeAppliesTo` (`internal/benchmark/modes.go:43-53`). An entirely
unknown mode name is rejected by `plan`
(`internal/plan/build.go:60-62`) and again at orchestrator construction
(`internal/orchestrator/orchestrator.go:146-154`).

Caveat on `l4-userspace`: it is routed through the same `ModeUsesIperf` branch
as `l4-kernel` and calls `runner.RunFull` with identical arguments
(`internal/benchmark/modes.go:55-57`,
`internal/orchestrator/orchestrator.go:1136-1145`). Nothing in the code path
switches Tailscale into userspace networking. It therefore writes a second
result file measuring the same thing as `l4-kernel`.

### The three-node modes

`forward-pps-exit` and `relay-throughput` are VM-only and opt-in. Each makes
`CreatePair` append a third `router` instance and create a firewall rule
allowing TCP/UDP 15201 and UDP 41642 from `0.0.0.0/0` on the `default` network
(`internal/provider/gcp.go:101-118`; `41642` is `benchmark.RelayUDPPort`). The
rule belongs to the ephemeral pair stack, so it is destroyed with the pair.
`plan` accounts for the extra node — `maximum resources: compute=3` — and the
cost bound scales with it (`internal/plan/build.go:195-233`).

The router is the device under test — its type, vCPUs, and price land on the
result. The third node is provisioned only when a forwarding or relay mode is
still *pending* for that instance type
(`internal/orchestrator/orchestrator.go:642-643`), so a rerun after those
results exist does not pay for it. Note the wide source range on the firewall
rule: it is required because the client reaches the sink's public IP through the
exit node, but it is worth knowing about before enabling these modes in a shared
project. Topology, sweep methodology, and caveats are in
[cost-forward-pps-plan.md](cost-forward-pps-plan.md).

## What happens during a run

1. `restoreStandardLogger()` runs first, undoing Pulumi's `slog.SetDefault`
   takeover of the standard logger. Without it every `log.Printf` and
   `log.Fatalf` is silently discarded (`cmd/tailbench/main.go:52-63`).
2. The local plan, the guardrails, the confirmation, secret loading, and the
   remote preflight all complete — see [Run](#run). Nothing above has touched a
   cloud.
3. A run ID is generated and `.tailbench/runs/<run-id>/` is created with
   `manifest.json`, `plan.json`, `effective-config.redacted.yaml`,
   `events.jsonl`, and `logs/tailbench.log`
   (`internal/runstate/store.go:25-32,79-159`). Every plan entry becomes a work
   item, pre-marked `skipped` when its result already exists
   (`internal/lifecycle/lifecycle.go:642-661`).
4. For a local backend, `<root>/state` is created. **No lock sweep happens** —
   that is now `cleanup RUN_ID --recover-pulumi-locks`
   (`internal/orchestrator/orchestrator.go:197-214`).
5. Tailnet, one of two branches
   (`internal/orchestrator/orchestrator.go:230-430`). With
   `create_tailnet: true`, a run-owned tailnet is created —
   `.tailbench/tailnet.json` is deliberately *not* reused for a manifest-managed
   run, so cleanup ownership stays unambiguous (`:277-283`) — and the per-tailnet
   OAuth client it returns replaces the configured one (`:389-390`). With
   `create_tailnet: false` plus `tailnet_dns_name`, nothing is created and the
   configured client is used throughout (`:239-261`).

   Both branches then apply the ACL — **replacing the tailnet's policy file** —
   enable HTTPS when `needsTailnetHTTPS()` is true, mint an auth key, and join
   the orchestrator's own ephemeral tsnet node as `tailbench-orchestrator` with
   state under `.tailbench/runs/<run-id>/tsnet` (`:250-260`, `:413-427`,
   `:434-453`). For this binary `needsTailnetHTTPS()` reduces to "is an
   `l7-serve-*` mode configured", since there are no K8s providers
   (`:1606-1615`).
6. `SetupNetworking` creates no GCP resource: it resolves the SSH key pair —
   generating and persisting one under `.tailbench/ssh/` when there is none — and
   returns `network=default`, `subnet=default`, `ssh_user=ubuntu`, and the
   authorized-keys line (`internal/provider/gcp.go:88-102`). Because
   `ManagesNetworking()` is false, the provision/teardown state steps around it
   are skipped entirely (`internal/orchestrator/orchestrator.go:474-556`).
7. Stale tailnet devices whose hostname starts with `tb-gcp-` are deleted — but
   **only under `create_tailnet: true`**; the sweep is inside that branch
   (`internal/orchestrator/orchestrator.go:609-623`).
8. Instance types are listed with up to three attempts per family for transient
   errors (`internal/orchestrator/orchestrator.go:1620-1667`), then narrowed by
   `--filter`.
9. For each machine type, in ascending vCPU order:
   - Modes whose result file already exists are dropped; if none remain, the
     type is skipped without provisioning anything
     (`internal/orchestrator/orchestrator.go:625-629`).
   - Cloud-init is rendered per node — Tailscale, iperf3, mtr, jq, curl, BBR and
     UDP GRO tuning, `tailscale set --ssh`, and (for `l7-serve-*`) fortio plus
     `tailscale serve` (`internal/cloudinit/setup.sh.tmpl`).
   - `DestroyPair` runs first as a pre-cleanup, then `CreatePair` brings up the
     Pulumi stack `tailbench-gcp-<type>-<run-suffix>`: two (or three)
     `compute.Instance` resources in `gcp.zone`, each with a 50 GB boot disk, an
     ephemeral external IP, the startup script as metadata, an `ssh-keys`
     metadata entry of the form `ubuntu:<generated key>`, and the labels
     `project=tailbench`, `tailbench_provider=gcp`, `tailbench_run_id`, and
     `tailbench_expires_at`
     (`internal/provider/gcp.go:44-56`, `:139-149`, `:203-206`).
   - Each resource is recorded in the manifest as it is created, before the
     benchmark runs, so an interrupt still leaves cleanup identifiers behind
     (`internal/lifecycle/lifecycle.go:438-496`).
   - The orchestrator SSHes to each node as `root` over tsnet, logs
     `waiting for cloud-init ready`, and waits for `/tmp/tailbench-ready` —
     bounded per node by `ssh.ready_timeout`, default 300s
     (`internal/orchestrator/orchestrator.go:1084-1109`,
     `internal/config/config.go:446`, `internal/sshclient/sshclient.go:92-121`).
     The bound is new; the wait used to inherit only `--max-duration`.
   - Each pending mode runs and writes
     `gcp/<family>/results/<type>-<mode>.json`.
   - `DestroyPair` tears the stack down, subject to `cleanup_policy`
     (`internal/orchestrator/orchestrator.go:785-807`). The auth key is refreshed
     if it is older than 1800 s.
10. `result.Aggregate` regenerates `website/data.generated.js`
    (`internal/orchestrator/orchestrator.go:823-826`).
11. The manifest is finalized, `summary.json` is written, and the command prints
    benchmark and cleanup outcomes separately
    (`internal/lifecycle/lifecycle.go:136-176`).

Progress output goes to stderr and, redacted, to the run's durable log; `--quiet`
suppresses it but leaves confirmation prompts and fatal diagnostics visible
(`internal/app/app.go:316-354`). `--log-file PATH` adds a second redacted copy.
Redaction covers bearer tokens, `tskey-*`, AWS access key IDs, and
`secret`/`token`/`password`-style assignments (`internal/app/redact.go:10-16`).

### How SSH works, and the generated key pair

The benchmark itself never uses a GCP SSH key. Cloud-init runs
`tailscale set --ssh`, and the orchestrator dials `root@<hostname>:22` through
the tsnet interface with `ssh.Password("tailscale")`
(`internal/sshclient/sshclient.go:20-27`) — a placeholder, since Tailscale SSH
authorizes on tailnet identity via the ACL's SSH rule granting `tag:bench` to
`tag:bench` as `root` (`internal/tailnet/tailnet.go:173-182`).

The `ssh-keys` instance metadata now matters for a different reason: it is the
only way into a node whose cloud-init dies *before* `tailscale up`, which is
otherwise an opaque billed VM. Tailbench generates that key itself:

- `resolveSSHPubKey` calls `ResolveSSHPublicKey` with the run-scoped name
  `tailbench-<run suffix>` (`internal/provider/gcp.go:80-86`,
  `internal/provider/sshkey.go:87-96`). There is no configured value to prefer,
  because there are no `gcp.ssh_user` / `gcp.ssh_pub_key_file` YAML keys — the
  `GCPProvider.SSHPubKey` and `SSHUser` fields exist but `cmd/tailbench/gcp.go:19-24`
  never populates them, so generation is the only path in practice.
- The **private key** is written to `.tailbench/ssh/tailbench-<run suffix>.pem`,
  mode `0600` in a `0700` directory (`internal/provider/sshkey.go:34-67`).
  `.tailbench/` is gitignored (`.gitignore:8`). An existing key file is reused,
  never regenerated, so repeated calls yield identical material and no instance
  is replaced on a later `up`.
- The login is `ubuntu`, the user GCP's guest agent provisions from `ssh-keys`
  metadata on the Ubuntu images this provider selects
  (`internal/provider/gcp.go:58-70`).
- The metadata value is `ubuntu:<key>` (`internal/provider/gcp.go:149,204`).
  Both `SetupNetworking` and `CreatePair` resolve the key — the former to surface
  a filesystem error before any cloud call, the latter because a resumed run
  reaches `CreatePair` without a `SetupNetworking` in the same process
  (`internal/provider/gcp.go:88-102`, `:139-148`).
- The run logs
  `using generated SSH key for gcp login "ubuntu" (private key: <path>)`
  (`internal/provider/gcp.go:94`).

This is a change: the metadata value used to be built from two fields the factory
never set, so it was literally `":"` — which provisions no login at all. Nodes
that failed cloud-init were completely unreachable.

Still true:

- OS Login settings are irrelevant to how *tailbench* connects; the benchmark
  session arrives over the tailnet.
- No firewall rule for port 22 is created by tailbench. Reaching a node's
  external IP over SSH depends on your `default` network's rules — an auto-mode
  `default` network includes `default-allow-ssh`.
- Not verified: how a project that enforces OS Login by org policy treats this
  `ssh-keys` metadata.

## Generate the report

A successful run aggregates automatically
(`internal/orchestrator/orchestrator.go:823`). Regenerate manually after editing
or deleting result files:

```bash
go run ./cmd/aggregate/
```

Run it **from the repository root**. It aggregates relative to `os.Getwd()`
(`cmd/aggregate/main.go:10-17`), walking `gcp`, `aws`, `azure`, `gke`, `eks`, and
`aks` and writing `website/data.generated.js`
(`internal/result/aggregator.go:15-21,88`).

For the per-run view — which work items produced which files — use the manifest
reader rather than the filesystem:

```bash
./dist/tailbench-gcp results tb_2026-07-28_a1b2c3
./dist/tailbench-gcp results tb_2026-07-28_a1b2c3 --output json
```

`results` reads `.tailbench/runs/<run-id>/manifest.json` and nothing else
(`cmd/tailbench/main.go:1329-1377`, `internal/summary/report.go:170-249`). It
touches no cloud and needs no credentials.

Price is injected at aggregation time, not stored in the result JSON: each
record is looked up by provider, region, and instance type in the curated
dataset and gains a synthetic `price_per_hour`
(`internal/result/aggregator.go:56-62`). Re-pricing all history is just a
re-aggregate:

```bash
go run ./cmd/pricing-refresh    # regenerate internal/pricing/data.json
go run ./cmd/aggregate/         # re-inject price_per_hour
```

The embedded GCP dataset covers `us-central1` `-standard-` types only, so a type
outside it gets no price and the dashboard's cost columns stay empty for that
row.

View the dashboard by opening `website/index.html` in a browser. It loads
`data.generated.js` through a plain `<script src>`, so `file://` works
(`website/index.html:276`) — but it also loads Chart.js from a CDN
(`website/index.html:275`), so the charts need internet access. The tables
render either way.

## Resume and interruption

There are now two layers, and they agree.

**Filesystem resume** is unchanged in principle: work is skipped if and only if
its result file exists. Rerunning the same command continues where it stopped.
Types with all modes done are skipped before any instance is provisioned
(`internal/orchestrator/orchestrator.go:625-629`), and individual completed modes
are skipped inside the loop
(`internal/orchestrator/orchestrator.go:1122-1127`). `plan` reports the same
decision as `skip-existing` (`internal/plan/build.go:108-114`).

**The `l4-kernel` resume bug is fixed.** `pendingModesForInstance` used to
require *both* the mode-suffixed file and the legacy no-suffix `<type>.json`
before considering `l4-kernel` done. No legacy file exists in any provider tree,
so `l4-kernel` was permanently pending: every rerun provisioned a pair, skipped
every mode inside `runModeLoop` (which only ever checked the suffixed path), and
destroyed it — paying for a topology that measured nothing, and contradicting the
plan. Either file now satisfies it
(`internal/orchestrator/orchestrator.go:1461-1491`), and `plan` uses the same
two-candidate rule (`internal/plan/build.go:178-193`).

To re-measure something, delete its result file and rerun:

```bash
rm gcp/c4/results/c4-standard-4-l4-kernel.json
./dist/tailbench-gcp run --filter '^c4-standard-4$' --max-cost-usd 5
```

**Manifest resume** is the new layer. Every approved run writes a versioned
manifest under `.tailbench/runs/<run-id>/`
(`internal/runstate/store.go:25-32`; schema 1, and a manifest from a different
schema is rejected rather than guessed at, `internal/runstate/store.go:177-184`).
`.tailbench/` is gitignored, so this state is local and per-checkout.

```bash
./dist/tailbench-gcp status tb_2026-07-28_a1b2c3     # local read, no cloud
./dist/tailbench-gcp results tb_2026-07-28_a1b2c3    # local read, no cloud
./dist/tailbench-gcp resume tb_2026-07-28_a1b2c3     # provisions
./dist/tailbench-gcp cleanup tb_2026-07-28_a1b2c3    # destroys
```

- Ctrl-C (SIGINT) or SIGTERM cancels the run's context
  (`cmd/tailbench/main.go:66-68`). Exit status is 130, the manifest status is
  `interrupted`, and `status` prints the three recovery commands
  (`internal/summary/report.go:135-142`).
- `resume` reloads the run's redacted effective configuration, re-reads only the
  secrets from the current environment, and rebuilds `--family`/`--filter`/modes
  from the unfinished work items — so it cannot widen the selection
  (`cmd/tailbench/main.go:861-895`). It re-runs the remote preflight and, unless
  `--yes`, prompts. A run with nothing unfinished is refused with
  `[TB_RECOVERY]` and exit 5.
- `status`/`results` on an unknown or malformed run ID are also `[TB_RECOVERY]`,
  exit 5 — the run ID must match `tb_YYYY-MM-DD_<hex>`
  (`internal/runstate/store.go:22`).
- The tailnet is now run-owned. `.tailbench/tailnet.json` is neither read nor
  written by a manifest-managed run
  (`internal/orchestrator/orchestrator.go:277-283,359-361`); it survives only as
  a legacy artifact of older invocations.
- **The instance-type cache is effectively off by default.**
  `.tailbench/instances/gcp-<family>.json` is still written, but it is only
  *read* when `cfg.CleanupNetworking` is false
  (`internal/orchestrator/orchestrator.go:1596-1607`), and that flag is derived
  as `cleanup_policy != manual` (`internal/config/config.go:457`). With the
  default `always`, every run rediscovers instance types from `gcloud`.

## Teardown

Instance pairs are destroyed after each type as a normal part of the run, and
`CreatePair` is preceded by a `DestroyPair` pre-cleanup, so simply rerunning the
same command cleans up a crashed iteration
(`internal/orchestrator/orchestrator.go:701-707`). What happens at the end is
governed by `cleanup_policy` (`internal/orchestrator/orchestrator.go:841-852`):

| Policy | Pair teardown | Run-owned tailnet |
|---|---|---|
| `always` (default) | Always | Always deleted |
| `on-success` | Only when the benchmark succeeded | Only when the benchmark succeeded |
| `manual` | Never — you own the cleanup | Never |

`--cleanup-networking` no longer means much for this variant. It forces
`cleanup_policy: always` (`internal/config/config.go:385-387`), overriding an
explicit `--cleanup-policy on-success` or `manual`, and it is what sets
`cfg.CleanupNetworking`, which gates tailnet deletion and the instance-cache
read. It does **not** delete any GCP resource: `TeardownNetworking` is still a
no-op (`internal/provider/gcp.go:246-248`), and `ManagesNetworking()` is false
(`internal/provider/gcp.go:37`), so both the orchestrator
(`internal/orchestrator/orchestrator.go:494-530`) and the `cleanup` command
(`cmd/tailbench/main.go:690-700`) skip networking teardown for GCP entirely.
This variant never created shared networking in the first place.

To tear down a specific run — the case that matters after an interrupt:

```bash
./dist/tailbench-gcp status tb_2026-07-28_a1b2c3
./dist/tailbench-gcp cleanup tb_2026-07-28_a1b2c3
./dist/tailbench-gcp cleanup tb_2026-07-28_a1b2c3 --yes
```

`cleanup` destroys only what the manifest records, and refuses to act on a
resource whose `cleanup_owner` is not this run or whose ownership is not certain
(`cmd/tailbench/main.go:472-487`). It destroys the pair stack for each recorded
instance type and deletes the run-owned tailnet
(`cmd/tailbench/main.go:642-731`). Like `resume`, it re-runs the remote
preflight and prompts unless `--yes`.

For the `exit status 255` case — a stale Pulumi lock from a crashed run — there
is a dedicated, manifest-scoped recovery step:

```bash
./dist/tailbench-gcp cleanup tb_2026-07-28_a1b2c3 --recover-pulumi-locks
```

It resolves lock paths only for stack names the named run recorded, refuses any
path outside `<state>/gcp/.pulumi/locks`, refuses symlinks and non-regular
files, and lists exactly what it will remove in the confirmation
(`internal/recovery/pulumi_locks.go:13-157`,
`cmd/tailbench/main.go:522-539,546-564`). Note that the lock root is derived
from the local state directory, not from `state_backend`
(`cmd/tailbench/main.go:789-794`) — for a remote backend it finds nothing, which
is correct: use `pulumi cancel` there.

To confirm nothing was left behind, look for the labels tailbench puts on every
instance (`internal/provider/gcp.go:44-56`) and for its stacks:

```bash
gcloud compute instances list --project=YOUR_PROJECT \
  --filter='labels.project=tailbench'
gcloud compute instances list --project=YOUR_PROJECT \
  --filter='labels.tailbench_run_id=a1b2c3'
pulumi stack ls                     # against your configured backend
```

If the run used the default local backend and the checkout is gone, that state
is gone with it and leftover instances must be deleted by hand — which is the
argument for a remote backend.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `[TB_PREREQUISITE]` `load environment file .env` | `env_file` points at a file that does not exist. `run`, `resume`, `cleanup`, and `doctor --remote` all need it | `cp .env.example .env` and fill it in, or drop `env_file` and export the values |
| `[TB_PREREQUISITE]` `required values are missing: OAUTH_CLIENT_ID…` | The env file exists but a value is empty | Fill it in; the check runs before the confirmation prompt |
| `[TB_PREREQUISITE]` from `pulumi-auth` or `cloud-auth` | Remote preflight failed | `pulumi login`; `gcloud auth login`. Run `doctor --remote` to see which check failed |
| `[TB_SAFETY_LIMIT]` `no-runnable-work` | `--family`/`--filter` selects nothing, or every applicable mode already has a result | Check with `plan`; an unknown family is a warning there, not an error |
| `[TB_SAFETY_LIMIT]` `max-instance-types` | More types have pending work than the default limit of 1 | Narrow the selection, or raise `--max-instance-types` deliberately |
| `[TB_SAFETY_LIMIT]` `noninteractive-cost-required` | `--yes` without an explicit ceiling | Add `--max-cost-usd`; the built-in 10 USD default does not count |
| `[TB_CONFIG]` `invalid state_backend` / `read configuration` | Bad backend URL or `--config` path | Fix the value; both are rejected at parse time, exit 2 |
| `[TB_RECOVERY]` `run not found` / `invalid run ID` | Wrong run ID, or `.tailbench/runs` is not under the current directory | Run from the same directory as the original run; IDs look like `tb_2026-07-28_a1b2c3` |
| `[TB_RUN_FAILED]` with `found 0 instance types to benchmark` | `gcp.project` is wrong or unauthorized, or the Compute Engine API is disabled. Discovery is not exercised by `plan` or `doctor` | Set `gcp.project`, then confirm with the `gcloud compute machine-types list` command in [Prerequisites](#prerequisites) |
| `plan` lists types but the run finds none | `plan` reads the local price catalog; the run reads `gcloud` | They are different sources by design — `plan` is offline |
| `plan` warns `no matching instances are present in the checked-in local price catalog` | Unknown family, or a family with no priced type | Use one of `c4 c4a c3d n4 c3 n2 c2`, or `all` |
| Plan region differs from the priced types | The configured region is not in the catalog, so `us-central1` is used | Expected (`internal/pricing/pricing.go:136-146`); prices are indicative |
| No output at all, exit status 1 | Something logged through the standard logger before `restoreStandardLogger()`. Pulumi's `logging` package `init()` calls `slog.SetDefault`, which discards `log.Printf` | Confirm `restoreStandardLogger()` is still the first statement in `main()` (`cmd/tailbench/main.go:57-63`) |
| `exit status 255` from every Pulumi operation | Stale lock file from a crashed run. Startup no longer sweeps these | `cleanup RUN_ID --recover-pulumi-locks`. For a remote backend use `pulumi cancel` |
| `benchmark mode "tsnet-userspace" is not implemented` | `tsnet-userspace` is in `benchmark.modes` | Remove it; there is no runner |
| `kubernetes-only benchmark mode "l4-lb" requires a k8s-enabled binary` | A container-only mode is in `benchmark.modes` | Remove it, or use `tailbench-gcp-k8s`. `plan` reports it as `incompatible-mode` first |
| `invalid benchmark mode "…"` at plan time | Typo in `benchmark.modes` | `plan` names the offending mode; the orchestrator's later check lists every valid one |
| `--filter` selects nothing at run time | Regex not anchored the way you expect, or the shape is not a `-standard-` type | Discovery only returns `^<family>-standard-[0-9]+$` (`internal/provider/gcp_instances.go:19`) |
| `quota exceeded for <type>, skipping family <family>` | `provider.IsQuotaError` matched `QUOTA_EXCEEDED`, `ZONE_RESOURCE_POOL_EXHAUSTED`, or similar (`internal/provider/gcp_instances.go:45-52`) | The whole family is skipped for the rest of the run, keyed on `provider.InstanceFamilyGroup` — which equals `GetInstanceFamily` for GCP (`internal/provider/families.go:47-54`). Raise the quota, or rerun with another `--family` |
| `ZONE_RESOURCE_POOL_EXHAUSTED` on a large type | Capacity, not quota — but it is classified as a quota error, so the family is skipped | Retry later or change `gcp.zone` |
| `stack up` fails on external IP or a constraint | Instances are created with an ephemeral external IP; an org policy may forbid it | Instances need outbound internet for cloud-init to install Tailscale. There is no config key to disable the external IP |
| SSH never connects; log repeats `waiting for tb-gcp-…` | Cloud-init did not finish or Tailscale never came up — usually no outbound internet, or a bad auth key | See "A node that never finishes cloud-init" below |
| `server ready: cloud-init did not finish within 5m0s: /tmp/tailbench-ready was never written` | Cloud-init reached the node but never completed | See "A node that never finishes cloud-init" below (`internal/sshclient/sshclient.go:109-116`) |
| `no tailnet configured: set tailscale.create_tailnet: true …`, at startup | Neither `create_tailnet: true` nor `tailscale.tailnet_dns_name` is set. Not the `init` default any more — `init` now writes `create_tailnet: true` (`cmd/tailbench/main.go:288-297`) | Set one of them (`internal/orchestrator/orchestrator.go:174-179`) |
| `create tailnet: tailnet creation failed (HTTP 403): {"message":"actor does not have permission to create tailnets"}` | The OAuth client cannot create tailnets. Scope `all` on a tailnet-scoped client is **not** enough; this needs an org-level permission that is not a published scope | Use an org-level client that may create tailnets, or switch to `create_tailnet: false` plus `tailscale.tailnet_dns_name` (`internal/tailnet/tailnet.go:86-88`) |
| The joined tailnet's ACL rules are gone after a run | `SetupACL` replaces the whole policy file with the allow-all benchmark policy (`internal/tailnet/tailnet.go:150-152`, `:160-228`) | Restore from the policy-file version history in the admin console, and point `tailnet_dns_name` at a dedicated benchmark tailnet |
| Devices named `tb-gcp-…` pile up on a joined tailnet | Stale-device cleanup only runs under `create_tailnet: true` | Delete them in the admin console (`internal/orchestrator/orchestrator.go:609-623`) |
| `LAN verification failed` | Baseline ping between the two instances is blocked in the `default` network | Tailbench creates no firewall rule for a two-node run; the network must already allow ICMP and TCP/UDP 15201 internally |
| `state_backend is Pulumi Cloud (…) but no credentials were found` | `state_backend: pulumi.com` without a token | Set `PULUMI_ACCESS_TOKEN` in `.env` or run `pulumi login` (`internal/provider/backend.go:59-75`) |
| `missing Tailscale credentials` from the orchestrator | Values resolved empty and there is no cached tailnet | Normally pre-empted by `[TB_PREREQUISITE]`; check `.env` expansion in `config.yaml` |
| Panic slicing `GCPZone` at result-write time | `gcp.zone` contains no `-` (`internal/orchestrator/orchestrator.go:1335`) | Use a real zone name. `plan` will not catch this — its own derivation is guarded |
| A result carries a surprising `price_per_hour`, or none | The pricing dataset holds GCP prices for `us-central1` only and falls back to it for other regions | Check `internal/pricing/data.json`; regenerate with `go run ./cmd/pricing-refresh` |
| Dashboard renders tables but no charts | Chart.js is loaded from a CDN (`website/index.html:275`) | View it with internet access |

### A node that never finishes cloud-init

The failure looks like a stalled run: the log stops at
`waiting for cloud-init ready` and nothing else happens. Tailscale SSH is not
available yet — that is the whole problem — so the only way in is the instance's
external IP and the generated key pair.

```bash
ssh -i .tailbench/ssh/<name>.pem ubuntu@<external-ip>
sudo cloud-init status --long
sudo tail -40 /var/log/cloud-init-output.log
```

- `<name>` is `tailbench-<run suffix>`; the run logs the exact path when it
  generates the key (`internal/provider/gcp.go:94`).
- `ubuntu` is the login GCP's guest agent provisions from the `ssh-keys` metadata
  tailbench sets (`internal/provider/gcp.go:58-70`).
- The external IP is not printed by the run:

  ```bash
  gcloud compute instances list --project YOUR_PROJECT \
    --filter='labels.project=tailbench' \
    --format='table(name,zone,networkInterfaces[0].accessConfigs[0].natIP)'
  ```

- Tailbench creates no port-22 firewall rule; this relies on the `default`
  network's own `default-allow-ssh`. This diagnostic path is new — before the
  generated key, the `ssh-keys` metadata value was literally `":"` and there was
  no login at all.

**The cause seen in practice was `tailscale serve --https=443` blocking because
HTTPS was not enabled on the tailnet.** `setup.sh.tmpl` runs the serve commands
before it touches `/tmp/tailbench-ready`
(`internal/cloudinit/setup.sh.tmpl:50-60`), so the node never signals ready and
the whole run stalls behind it.

That specific cause is now prevented. HTTPS is enabled automatically whenever it
is needed — `needsTailnetHTTPS()` is
`hasK8sProviders() || hasL7ServeMode(modes)`, applied on all three tailnet paths:
creating one, reusing a cached one, and joining an existing one
(`internal/orchestrator/orchestrator.go:1606-1615`, call sites at `:254-260`,
`:336-342`, `:420-427`). The gate used to be K8s-only, which is exactly why a VM
run with `l7-serve-h2` hung on a tailnet without HTTPS. If HTTPS is blocked at
the org level the run now fails fast with `enable HTTPS: …` instead.

The bound that makes any remaining variant survivable is `ssh.ready_timeout`
(default 300s, `internal/config/config.go:446`). `WaitForReady` applies it per
node and its timeout message names this same recipe
(`internal/sshclient/sshclient.go:83-121`). Before that, the wait inherited only
`--max-duration`, so instances billed for the full run window with no diagnosis.
