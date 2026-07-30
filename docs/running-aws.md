# Running tailbench on AWS (VM)

Operator runbook for the AWS virtual-machine variant: what to install, what to
configure, what the run creates, and how to clean it up. Kubernetes (EKS) is a
different binary and is not covered here.

## What this binary is

`tailbench-aws` provisions a pair of identical EC2 instances per selected
instance type, joins them to a Tailscale tailnet, runs the configured benchmark
modes over the LAN baseline and over Tailscale, writes one JSON file per
instance type and mode, and destroys the pair before moving to the next type.
All AWS-specific code is in `internal/provider/aws.go` and
`internal/provider/aws_instances.go`; the binary is locked to one provider by
`cmd/tailbench/aws.go:10-21`.

| Property | Value |
|---|---|
| Binary | `./dist/tailbench-aws` |
| Build tags | `aws` (`Makefile:84-86`) |
| Provider value | `aws` (`cmd/tailbench/aws.go:10`) |
| Environment | `vm` — never `container` (`internal/plan/build.go:53-57`, `internal/orchestrator/orchestrator.go:621-624`) |
| Runtime cloud CLI | `aws` (`internal/provider/aws_instances.go:20-24`) |
| Result directory | `aws/<family>/results/<type>-<mode>.json` |
| Run state | `.tailbench/runs/<run-id>/` (`internal/runstate/store.go:25-32,79-159`) |
| Pulumi stacks | `tailbench-aws-networking-<run suffix>`, `tailbench-aws-<type-with-dots-as-dashes>-<run suffix>` (`internal/provider/aws.go:37-51`) |

The stack names carry a run suffix derived from the run ID
(`internal/provider/run_scope.go:8-28`). Every `run` and `resume` sets a run ID,
so in practice the stacks are always suffixed; the unsuffixed names are what you
get only if `RunID` is empty.

An explicit `--provider` must match the compiled provider — `--provider gcp`
against this binary fails while the plan is still local, with
`requested provider "gcp", but this binary was compiled for "aws"`
(`internal/plan/build.go:34-42`; also enforced by
`cmd/tailbench/main.go:1555-1573,1740-1745`). Renaming the executable does not
change its identity.

### Commands

The CLI is a command surface, not a flag-only entry point
(`internal/app/app.go:140-181,253-303`). With no command, the binary runs
`run` — unless `dry_run: true` in the config or `--dry-run` on the command line
routes it to `plan` instead (`cmd/tailbench/main.go:1395-1411`,
`internal/app/app.go:273-277`).

| Command | What it does | Touches the cloud? |
|---|---|---|
| `init` | Writes a safe `config.yaml` and `.env.example` for the compiled provider | No |
| `plan` | Builds a side-effect-free local plan | No |
| `doctor` | Checks local prerequisites | No |
| `doctor --remote` | Adds read-only authentication checks | Read-only |
| `run` (default) | Executes the approved benchmark | Yes |
| `status RUN_ID` | Reads the persisted manifest | No |
| `results RUN_ID` | Reads persisted result metadata and paths | No |
| `resume RUN_ID` | Continues only unfinished work from a run | Yes |
| `cleanup RUN_ID` | Destroys resources the named run owns | Yes |
| `cleanup RUN_ID --recover-pulumi-locks` | Also removes locks for the stacks that run recorded | Local files only |

Output flags apply to every command: `--output text|json`, `--log-file PATH`
(redacted), `--quiet`, `--help`, `--version`
(`internal/app/app.go:199-251`, `internal/app/redact.go:11-52`).

### Exit codes

Every failure prints `[TB_<CODE>] stage: … / cause: … / resources changed: … /
next: <remediation>` on stderr (`internal/app/render.go:141-170`).

| Code | Meaning | Constant |
|---|---|---|
| 0 | Success | `ExitOK` (`internal/app/types.go:6`) |
| 1 | The run itself failed | `ExitRunFailed` (`internal/app/types.go:7`) |
| 2 | Usage, configuration, or plan error | `ExitUsage` (`internal/app/types.go:8`) |
| 3 | Missing prerequisite (tool, credential, env file) | `ExitPrerequisite` (`internal/app/types.go:9`) |
| 4 | Refused — guardrail violation, declined confirmation, `init` would overwrite | `ExitRefused` (`internal/app/types.go:10`) |
| 5 | Recovery error — unknown or unreadable run ID | `ExitRecovery` (`internal/app/types.go:11`) |
| 130 | Interrupted | `ExitInterrupted` (`internal/app/types.go:12`) |

## Prerequisites

| Tool | Needed for | Why |
|---|---|---|
| Go, version from `go.mod` (`go 1.26.5`) | Building only | `make build-aws` |
| `pulumi` CLI on `PATH` | Every real run | The Automation API shells out to it; nothing catches its absence at build time (`mise.toml`) |
| `aws` CLI v2, authenticated | Every real run — **not** `plan` | Instance discovery and vCPU lookup shell out to it (`internal/provider/aws_instances.go:20-24,58-60`) |
| Tailscale OAuth client | Real runs only | Setting the ACL and minting auth keys; additionally creating a tailnet when `create_tailnet: true` |

`mise install` provisions the toolchain (`mise.toml`); the Makefile stays the
task runner (`make help`).

Verify with `doctor` rather than by hand. The local form loads no credentials
and contacts nothing — it resolves `pulumi` and `aws` on `PATH` and explicitly
reports that credential values were not read
(`internal/preflight/preflight.go:72-113,216-235`):

```bash
./dist/tailbench-aws doctor
```

```text
TAILBENCH DOCTOR — LOCAL CHECKS ONLY
provider: aws
workload: vm
ready: true
[PASSED] pulumi (local): /path/to/pulumi
[PASSED] aws (local): /path/to/aws
[SKIPPED] credentials (local): credential values are not read during local checks
```

`doctor --remote` is the opt-in form. It loads secrets, requires
`OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` to be non-empty
(`cmd/tailbench/main.go:1492-1500,1701-1710`), and then runs two read-only
authentication probes — `pulumi whoami` and
`aws sts get-caller-identity --output json`
(`internal/preflight/remote.go:44-78,98-105`). Command output is discarded apart
from the AWS account ID, which is recorded on the run manifest
(`internal/preflight/remote.go:22-27,123-136`). A failed check exits 3.

```bash
./dist/tailbench-aws doctor --remote
```

Two things `doctor` does not cover, so check them yourself before a first run:

- **The Tailscale API is never called.** `doctor --remote` only checks that the
  OAuth values are present; validity — and, more importantly, whether the client
  is *allowed to create a tailnet* — is discovered at run time. See "Tailscale
  OAuth" under Credentials.
- **The tailnet decision is never checked.** `doctor` does not look at
  `tailscale.create_tailnet` or `tailscale.tailnet_dns_name`. The orchestrator
  rejects the combination where neither is set, but only once it is constructed
  (`internal/orchestrator/orchestrator.go:174-179`).

`aws.key_name` no longer needs checking: it is optional, and an empty value makes
tailbench generate and manage its own key pair
(`internal/provider/aws.go:87-114`). If you do set it, the name must exist in
`aws.region`:

```bash
aws ec2 describe-key-pairs --region us-west-2 --key-names my-keypair \
  --query 'KeyPairs[0].KeyName' --output text
```

Note that `mise.toml:57-60` claims AWS instance discovery goes through the Go
SDK. It does not — a real run shells out to the `aws` CLI
(`internal/provider/aws_instances.go:20-24`). What has changed is that `plan` no
longer calls it at all, so the CLI is required for `run`/`resume`/`cleanup` but
not for planning.

## Build

```bash
make build-aws            # writes dist/tailbench-aws
./dist/tailbench-aws --version
```

Exactly one cloud build tag is required. A bare `go build ./cmd/tailbench/`
fails on purpose — the guard files reference an undefined symbol so a mis-tagged
build breaks at compile time rather than producing a binary with the wrong
provider. Compiling the Pulumi AWS SDK is memory-intensive; build the single
variant you need rather than `make build`.

The matching per-variant checks are:

```bash
make lint-aws                     # Makefile:46-47
make test-aws                     # Makefile:70-71
make verify-deps VARIANT=aws      # Makefile:103-104
```

## Credentials

Three independent systems. Each fails in a different place, so check them
separately.

### Tailscale OAuth

`config.yaml` reads `.env` through `env_file:` and expands `${OAUTH_CLIENT_ID}`
/ `${OAUTH_CLIENT_SECRET}` into the `tailscale:` block
(`internal/config/config.go:306-315,329-334`). `.env` is gitignored and absent
from a fresh clone:

```bash
cp .env.example .env
$EDITOR .env
```

Secret resolution is now an explicit stage. `config.ParseLocalArgs` — the parser
`plan`, local `doctor`, and command selection use — never opens `env_file` and
never expands the OAuth placeholders
(`internal/config/config.go:256-266,303-315,331-334`). Only `run`, `resume`,
`cleanup`, and `doctor --remote` call `config.ParseArgs`, which does.

Consequences:

- `plan`, `doctor`, `--version`, and `--help` work on a checkout with no `.env`.
- A run whose `env_file` is missing fails before anything is provisioned, as
  `[TB_PREREQUISITE] … load environment file …`, exit 3
  (`cmd/tailbench/main.go:1413-1430`).
- Empty OAuth values fail the same way, listing which are missing
  (`cmd/tailbench/main.go:935-943,1701-1710`).

#### Decide first: create a tailnet, or join one

This is the setup decision to get right before anything else, because both
failure modes are expensive — one aborts after the networking stack is up, the
other overwrites a policy file.

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

There is no local check for this: `plan` never contacts Tailscale and
`doctor --remote` only verifies the values are non-empty, so the 403 arrives at
run time, after `.tailbench/runs/<run-id>/` exists but before any EC2 resource is
created (`internal/orchestrator/orchestrator.go:375-386`). If you cannot get an
org-level client that can create tailnets, use Option B.

**Option B — join the tailnet the OAuth client already belongs to
(`create_tailnet: false` plus `tailscale.tailnet_dns_name`).** Tailbench then
creates and deletes no tailnet at all. It sets the ACL, mints the auth key, and
brings the nodes up on the tailnet you named
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
configuration — no auth key was ever minted, and every instance failed with
`auth key is empty`.

> **`tailnet_dns_name` REPLACES the tailnet's policy file.** `SetupACL` calls
> `PolicyFile().Set(...)` with a freshly built allow-all benchmark policy
> (`internal/tailnet/tailnet.go:150-152`, `buildACL` at `:160-228`) — a single
> `accept */*:*` rule plus tag owners, SSH rules, an exit-node auto-approver, and
> a peer-relay grant. It is not merged with what is there; whatever the tailnet's
> policy file contained is gone. Point this only at a tailnet dedicated to
> benchmarking. Tailscale keeps policy-file version history, so a mistake is
> recoverable from the admin console.

Two smaller differences on the join path:

- Stale-device cleanup is skipped. The `tb-aws-` sweep is inside an
  `if o.cfg.CreateTailnet` branch (`internal/orchestrator/orchestrator.go:609-623`),
  so leftover devices from a crashed run accumulate on a joined tailnet and must
  be removed by hand.
- The orchestrator logs `using existing tailnet <name> (its policy file will be
  replaced)` and marks the run as having changed resources
  (`internal/orchestrator/orchestrator.go:247-249`).

**Setting neither is a startup error.** `orchestrator.New` refuses with
`no tailnet configured: set tailscale.create_tailnet: true …, or
tailscale.tailnet_dns_name to benchmark an existing one`
(`internal/orchestrator/orchestrator.go:174-179`). It is checked there rather
than at parse time so `plan` and `doctor` keep working on a config that is not
ready to run.

Either way the client needs to write auth keys, the policy file, and devices.
Under Option A tailbench creates and deletes real tailnets, so use disposable org
credentials.

The old escape hatch — "a resumed run takes its credentials from the cached
`.tailbench/tailnet.json`" — no longer applies to a manifest-managed run. A run
with a run ID must own its tailnet, so the cache is deliberately ignored and a
fresh tailnet is created (`internal/orchestrator/orchestrator.go:276-283`).
Every `run` and `resume` therefore needs working OAuth credentials.

### AWS

There is no AWS credential check unless you ask for one. `doctor --remote` adds
`aws sts get-caller-identity`, and `run`/`resume`/`cleanup` run that same remote
preflight before provisioning anything
(`cmd/tailbench/main.go:979-982,1063-1071`). Beyond that, both consumers use the
standard AWS credential chain (environment, shared config, SSO, instance
profile):

- the `aws` CLI, for instance discovery and vCPU lookup
  (`internal/provider/aws_instances.go:20-24,58-60`);
- the Pulumi AWS provider, for every resource.

The region is **not** taken from your AWS profile. It is set explicitly as
Pulumi config `aws:region` on both stacks (`internal/provider/aws.go:256,382`)
and passed as `--region` on every CLI call
(`internal/provider/aws_instances.go:25,60`), from `aws.region` in
`config.yaml`.

#### Make targets and Pulumi ESC

The AWS variant is the one variant with Make targets that wrap the binary. They
take AWS credentials from a [Pulumi ESC](https://www.pulumi.com/docs/esc/)
environment via `esc run`, while Tailscale OAuth still comes from `.env` through
`env_file:` (`Makefile:26-34,118-137`). Build the binary first — every target
invokes `./dist/tailbench-aws` and none of them builds it.

| Target | What it runs | Touches the cloud? |
|---|---|---|
| `make plan-aws` | `tailbench-aws plan --filter … --max-cost-usd …` | No — not wrapped in `esc run`, and `plan` loads no credentials |
| `make doctor-aws` | `tailbench-aws doctor` | No — also unwrapped |
| `make doctor-aws-remote` | `esc run $(ESC_ENV) -- tailbench-aws doctor --remote` | Read-only |
| `make bench-aws` | `esc run $(ESC_ENV) -- tailbench-aws run …` | **Yes — provisions billable resources** |

Variables and their defaults, all overridable on the command line
(`Makefile:30-34`):

| Variable | Default | Effect |
|---|---|---|
| `ESC_ENV` | `tailscale-phase-2/aws-oidc` | The ESC environment `esc run` opens — change this to yours |
| `FILTER` | `^c6in\.large$` | `--filter` |
| `MAX_COST` | `5` | `--max-cost-usd` |
| `MAX_DURATION` | `45m` | `--max-duration` |
| `MAX_TYPES` | `1` | `--max-instance-types` |
| `YES` | unset | Any non-empty value appends `--yes` |

`bench-aws` is interactive by default — tailbench still prints the topology, cost
bound, and cleanup policy and waits for confirmation. `YES=1` skips the prompt,
which the guardrails permit only because `MAX_COST` is always passed explicitly:

```bash
make bench-aws FILTER='^c7i\.2xlarge$' MAX_COST=3
make bench-aws FILTER='^c7i\.2xlarge$' MAX_COST=3 YES=1
```

Nothing about the pattern is AWS-specific — `esc run <env> -- ./dist/tailbench-<variant> …`
works for any variant — but the Makefile defines no equivalents for the other
five (`Makefile:26`).

### Pulumi state backend

The default local backend needs no credentials. Pulumi Cloud is checked when the
orchestrator is constructed: `PULUMI_ACCESS_TOKEN` or
`~/.pulumi/credentials.json` must exist, or the run fails with instructions
(`internal/provider/backend.go:52-75`, called from
`internal/orchestrator/orchestrator.go:163-165`). The token can live in `.env`;
the Pulumi CLI inherits tailbench's environment. `doctor --remote` also runs
`pulumi whoami` (`internal/preflight/remote.go:44-53`).

Object-store backends are deliberately not checked — `s3://` authenticates
through the same AWS credentials the provider already needs
(`internal/provider/backend.go:52-62`).

## Configure config.yaml

`init` writes a safe starting point for the compiled provider — a
non-provisioning `config.yaml` plus a `.env.example` — and refuses rather than
overwriting either file (`[TB_INIT_EXISTS]`, exit 4;
`cmd/tailbench/main.go:163-311`):

```bash
./dist/tailbench-aws init
```

The generated config sets `dry_run: true` and the guardrail keys, and emits the
AWS placeholder `key_name: YOUR_AWS_KEY_PAIR`
(`cmd/tailbench/main.go:258-311`). `config.example.yaml` in the repository root
is the same shape, checked in.

Two things to check in the generated file before a real run:

- The `tailscale:` block now defaults to `create_tailnet: true`, with comments
  spelling out the 403 you get from a tailnet-scoped OAuth client and a
  commented-out `tailnet_dns_name` as the alternative
  (`cmd/tailbench/main.go:288-297`; `config.example.yaml:13-25` is the same
  shape). Confirm the option you actually want — see "Tailscale OAuth".
- `key_name: YOUR_AWS_KEY_PAIR` names a key pair that does not exist. Since
  `key_name` became optional, deleting the line or setting it to `""` is now the
  better default — tailbench then generates and manages its own key pair.

Only these keys affect this variant.

| Key | Default | Effect | What breaks if wrong |
|---|---|---|---|
| `aws.region` | `us-west-2` (`internal/config/config.go:445`) | Pulumi `aws:region` on both stacks; `--region` on every CLI call; recorded as `region` on each result | A region that does not offer the selected types yields an empty plan; pricing is curated for `us-west-2` only and falls back to it (`internal/pricing/pricing.go:106-156`) |
| `aws.az` | `us-west-2a` (`internal/config/config.go:446`) | Availability zone of the single subnet (`internal/provider/aws.go:98-104`); recorded as `zone` | An AZ outside `aws.region` fails subnet creation; an AZ that does not offer a given instance type fails that type's `CreatePair` |
| `aws.key_name` | empty (`internal/config/config.go:450`) | Optional. Empty makes `SetupNetworking` generate a key pair and export its name; non-empty is used as-is and nothing is generated (`internal/provider/aws.go:87-114,241-247`) | A **non-empty** name that does not exist in `aws.region` fails every `CreatePair` with `InvalidKeyPair.NotFound` |
| `tailscale.create_tailnet` | `false` in the struct default (`internal/config/config.go:410`), `true` in the `init` template (`cmd/tailbench/main.go:288-297`) | `true` creates and deletes an ephemeral tailnet; needs an org-level client that may create tailnets | With `tailnet_dns_name` also empty, `orchestrator.New` refuses to start (`internal/orchestrator/orchestrator.go:174-179`); with an under-privileged client the run aborts on HTTP 403 |
| `tailscale.tailnet_dns_name` | empty (`internal/config/config.go:411`) | With `create_tailnet: false`, joins that tailnet instead of creating one (`internal/orchestrator/orchestrator.go:239-261`) | **Its policy file is replaced wholesale** — see "Tailscale OAuth". Ignored when `create_tailnet: true` |
| `ssh.ready_timeout` | `300` seconds (`internal/config/config.go:446`) | Per-node bound on waiting for cloud-init to write `/tmp/tailbench-ready` (`internal/orchestrator/orchestrator.go:1085-1106`, `internal/sshclient/sshclient.go:92-121`) | Too low fails healthy but slow nodes; `0` or less waits on the run deadline alone, which is the expensive failure this bound exists to prevent |
| `benchmark.modes` | `["l4-kernel"]` when empty (`internal/config/config.go:487-489`) | Which benchmarks run per instance type, and how many result files each type produces | Unimplemented or unknown names are rejected by `plan`; Kubernetes-only modes are reported not-applicable and refused by the guardrails |
| `dry_run` | `false` in `config.yaml`, `true` in `config.example.yaml` and `init` output | `true` routes an unqualified invocation to `plan` (`cmd/tailbench/main.go:1407-1409`) | A `true` value means `run` never provisions until you clear it |
| `max_cost_usd` | `10` (`internal/config/config.go:74`) | Cost ceiling the guardrails enforce against the plan's upper bound | Must be greater than zero; `--yes` additionally requires it to be set explicitly |
| `max_duration` | `45m` (`internal/config/config.go:75`) | Bounds the whole run with a context timeout (`cmd/tailbench/main.go:994-995`) | The run stops mid-flight with `TB_DURATION_LIMIT` and leaves recoverable state |
| `max_instance_types` | `1` (`internal/config/config.go:76`) | Maximum instance types with pending work the guardrails will approve | A family sweep is refused until you raise it |
| `max_concurrent_resources` | `1` (`internal/config/config.go:77`) | Must allow at least one topology (`internal/guardrail/guardrail.go:98-104`) | Zero or negative is rejected at parse time |
| `cleanup_policy` | `always` (`internal/config/config.go:381`) | `always`, `on-success`, or `manual`; drives per-type teardown, networking teardown, and tailnet deletion (`internal/orchestrator/orchestrator.go:841-852`) | `manual` leaves everything standing for `cleanup RUN_ID` |
| `state_backend` | empty → `./state/aws` | Where Pulumi stacks live | See the backend table below |
| `family` / `filter` | `all` / empty | Which instance types are selected | Overridden by `--family` / `--filter` |
| `tailscale.*`, `benchmark.*`, `ssh.*` | see `config.yaml` | Tailnet creation, iperf3/fortio/pps parameters, SSH timeouts | Shared across all variants |

`cleanup_networking:` still parses, but it is no longer an independent switch.
It (and `--cleanup-networking`) forces `cleanup_policy: always`, and the
effective `CleanupNetworking` value is then derived as
`cleanup_policy != manual` (`internal/config/config.go:381-387,457`). See
"Teardown" for what that means in practice.

Keys under `gcp:`, `azure:`, and `images:` do not affect this binary — the AWS
`CreatePair` never reads `BenchImage` or `TSImage`. Of the `l7_endpoints:` keys,
only `serve_fqdn` applies here: it overrides the target for `l7-serve-*`, which
otherwise defaults to `<server hostname>.<tailnet DNS name>`
(`internal/orchestrator/orchestrator.go:1413-1417`). `ingress_fqdn` and
`cluster_label` are read only by modes this binary refuses to run.

### `aws.key_name` and the generated key pair

`aws.key_name` is **optional**, and leaving it empty is the recommended setting.
The committed `config.yaml:69` now ships `key_name: ""` with a comment saying so.

When it is empty, `SetupNetworking` generates an ed25519 key pair before the
Pulumi program runs and manages the EC2 `KeyPair` resource itself
(`internal/provider/aws.go:87-114`):

- The key pair is named `tailbench-<run suffix>`, or plain `tailbench` when there
  is no run ID (`internal/provider/run_scope.go:8-36`).
- The **private key** is written to `.tailbench/ssh/<name>.pem`, mode `0600`, in
  a `0700` directory (`internal/provider/sshkey.go:16-21,55-60`). `.tailbench/`
  is gitignored (`.gitignore:8`).
- An **existing** key file is reused, never regenerated. Regenerating would
  change the public key on every run, which makes Pulumi replace the cloud
  key-pair resource and silently invalidates any private key you already saved
  (`internal/provider/sshkey.go:31-45`).
- The run logs `using generated SSH key pair "<name>" (private key: <path>)`
  (`internal/provider/aws.go:102`).

Either way the effective name is exported as the `key_name` stack output and read
back by `CreatePair` (`internal/provider/aws.go:241-247,283,300`). When it is
still empty — which now only happens for a stack created before this change —
`CreatePair` **omits** `KeyName` from the instance arguments rather than sending
`""`, because an empty string is what trips `InvalidKeyPair.NotFound`
(`internal/provider/aws.go:351-356`).

Setting `aws.key_name` explicitly disables all of the above: the name is used
as-is, no key pair is created, and a name that does not exist in `aws.region`
fails every `CreatePair`.

The benchmark itself never uses this key. Cloud-init enables Tailscale SSH
(`tailscale set --ssh`, `internal/cloudinit/setup.sh.tmpl:43`) and the
orchestrator dials port 22 **through tsnet** as `root`
(`internal/sshclient/sshclient.go:20-30`; the auth method is
`ssh.Password("tailscale")`). The generated key exists for the case that matters
most — a node that fails *before* `tailscale up`, and is therefore unreachable
over the tailnet. The security group opens 22/tcp to `0.0.0.0/0` so you can get
in over the public IP (`internal/provider/aws.go:171-177`); see "Troubleshooting"
for the diagnostic recipe.

### Modes this binary accepts and rejects

There is still no `--modes` flag. Modes come only from `benchmark.modes` in
`config.yaml`.

| Mode | Status here | Notes |
|---|---|---|
| `l4-kernel` | Accepted | iperf3 + MTR, baseline LAN vs Tailscale. The default when `modes` is empty |
| `l4-userspace` | Accepted | Runs the same iperf3 + MTR path as `l4-kernel` (`internal/benchmark/modes.go:55-57`); no separate userspace setup exists in the VM runner |
| `l7-serve-h1`, `l7-serve-h2` | Accepted, VM-only | fortio against `tailscale serve` on the server node (`internal/cloudinit/setup.sh.tmpl:51-56`) |
| `forward-pps-exit` | Accepted, opt-in | Adds a third VM (exit node under test) |
| `relay-throughput` | Accepted, opt-in | Adds a third VM (peer relay); needs Tailscale >= 1.86 |
| `tsnet-userspace` | **Rejected by `plan`** | `benchmark mode "tsnet-userspace" is not implemented; remove it before running` — `[TB_PLAN]`, exit 2 (`internal/plan/build.go:63-68`) |
| `l4-lb` | **Not applicable, then refused** | Container-only (`internal/benchmark/modes.go:43-53`) |
| `l7-ingress-h1`, `l7-ingress-h2` | **Not applicable, then refused** | Container-only |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | **Not applicable, then refused** | Container-only |

Rejection now happens in two places rather than one. `plan` fails outright on an
unknown name (`invalid benchmark mode "…"`) or on `tsnet-userspace`
(`internal/plan/build.go:59-68`) — both `[TB_PLAN]`, exit 2. A container-only
mode is not a plan error: the plan reports it as
`not-applicable: mode does not apply to vm workloads`, and the guardrails then
refuse to run with `incompatible-mode: mode "l4-lb" does not apply to vm
workloads` — `[TB_SAFETY_LIMIT]`, exit 4
(`internal/plan/build.go:97-107`, `internal/guardrail/guardrail.go:48-62`). The
orchestrator's own `kubernetes-only benchmark mode "…" requires a k8s-enabled
binary` (`internal/orchestrator/k8s_disabled.go:16-23`) is still there as a
backstop but is no longer the message you see first.

### Opt-in three-node modes

`forward-pps-exit` and `relay-throughput` are commented out in the committed
`config.yaml`. Enabling either makes `CreatePair` provision a **third** VM of the
same instance type — the router or relay under test — via
`PairOptions.WantRouter` (`internal/orchestrator/orchestrator.go:642-643`,
`internal/provider/aws.go:287-290`). That is a 50% cost increase per type, and
the third node is the device the result describes. `plan` shows it as
`routers=1` on the `maximum resources:` line
(`internal/plan/build.go:199-237`). The security group already opens the ports
they need: 15201/tcp and 15201/udp for the iperf3 sink, and 41642/udp for the
peer relay (`internal/provider/aws.go:158-178`). Topology, sweep methodology, and
caveats are in [docs/cost-forward-pps-plan.md](cost-forward-pps-plan.md); the
README has the short version.

The router is provisioned based on *pending* work, not configured modes, so a
type whose forwarding result already exists does not pay for a third node on a
re-run (`internal/orchestrator/orchestrator.go:638-643`).

## Choose a state backend

| `state_backend` | State location | Startup behavior | Consequence |
|---|---|---|---|
| *(empty, default)* | `./state/aws` (`internal/provider/backend.go:16-21`, `internal/config/config.go:460`) | Creates the directory (`internal/orchestrator/orchestrator.go:197-214`) | Stacks are visible only from this checkout on this machine. An interrupted run can only be recovered from here |
| `pulumi.com` | `https://api.pulumi.com` (`internal/config/config.go:211-216`) | Requires `PULUMI_ACCESS_TOKEN` or `~/.pulumi/credentials.json`, checked before anything is provisioned; no directory creation (`internal/provider/backend.go:59-75`) | Stacks survive a machine swap; Pulumi manages its own leases, so clear a stuck operation with `pulumi cancel` |
| `s3://bucket/prefix` | Object storage | No separate credential check (`internal/provider/backend.go:52-62`) | Uses the same AWS credentials the provider needs; stacks are shareable |
| `gs://…`, `azblob://…` | Object storage | No separate credential check | Valid, but pulls in another cloud's credentials |
| `file:///abs/path` | Explicit local path | Treated as local | Useful for a shared mount |

**Stale Pulumi locks are no longer swept at startup.** Earlier versions deleted
everything matching `state/*/.pulumi/locks/*.json` on every run. Removing a lock
is now an explicit, manifest-scoped recovery action — see
`cleanup RUN_ID --recover-pulumi-locks` under "Teardown"
(`internal/orchestrator/orchestrator.go:199-214`,
`internal/recovery/pulumi_locks.go:13-138`).

Stack names are provider-qualified (`tailbench-aws-*`), so one backend can hold
every provider's stacks without collision. Pulumi always needs a real local
working directory, so remote backends get scratch space under
`.tailbench/pulumi/aws` (`internal/provider/backend.go:23-38`). An unusable
value is rejected at parse time as `[TB_CONFIG]`, exit 2
(`internal/config/config.go:198-225`).

`--state-backend` still works exactly as before, and overrides the YAML value
(`internal/config/config.go:283-284,399-402`) — note that it is not listed in
`--help`, which covers only the guardrail and selection flags:

```bash
./dist/tailbench-aws plan --state-backend pulumi.com --family c7i
./dist/tailbench-aws plan --state-backend s3://tailbench-state/pulumi --family c7i
```

## Plan

`plan` replaces the old `--dry-run` output. `--dry-run` is kept as a
compatibility alias that routes to the same executor, as does `dry_run: true`
in YAML (`internal/app/app.go:273-277`, `cmd/tailbench/main.go:1395-1411`).

```bash
./dist/tailbench-aws plan
./dist/tailbench-aws plan --family c7i
./dist/tailbench-aws plan --filter '^c7i\.(2|4)xlarge$'
./dist/tailbench-aws --output json plan --family c7i     # machine-readable
```

It is genuinely side-effect-free. It parses configuration with
`config.ParseLocalArgs`, so it does not open `env_file`, expand secret
placeholders, or read SSH keys from your home directory
(`internal/config/config.go:256-266,303-315`). It never initializes Pulumi or
Tailscale, never calls a cloud API, never creates a state directory, and never
removes a lock file. The only filesystem access is `os.Stat` on candidate result
paths (`internal/plan/build.go:182-197`).

Typical output:

```text
TAILBENCH LOCAL PLAN
SIDE EFFECTS: none
provider: aws
workload: vm
region: us-west-2
zone: us-west-2a
selector: family=all filter="^c7i\\.(2|4)xlarge$"
configured modes:
  - l4-kernel: applicable
  - l7-serve-h1: applicable
  - l7-serve-h2: applicable
instances:
  - c7i.2xlarge (8 vCPUs, estimated $0.35700/hour)
      l4-kernel: skip-existing: result already exists
      l7-serve-h1: run
      l7-serve-h2: run
maximum resources: compute=2 servers=1 clients=1 routers=0 clusters=0 node-pools=0 load-balancers=0
estimated maximum compute rate: $0.71400/hour
estimated upper bound for 45m0s: $0.54 (guardrail $10.00)
price data: … (updated 2026-07-24)
guardrails: duration=45m0s instance-types=1 concurrent-topologies=1 cleanup=always
required tools: pulumi, aws
required credentials for execution: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, AWS CLI authenticated identity
```

Read it as follows (`internal/plan/render.go:9-147`):

- **`configured modes:`** — per-mode applicability for a VM workload. A
  container-only mode shows `not-applicable` here and will be refused by the
  guardrails.
- **Per-instance actions** — `run`, `skip-existing` (the result JSON already
  exists), or `not-applicable`. `skip-existing` is what makes a re-plan over a
  completed tree show zero work (`internal/plan/build.go:97-116`).
- **`maximum resources:`** — the topology ceiling. `compute=2` is the normal
  server+client pair; `routers=1` appears only when a three-node mode has
  pending work (`internal/plan/build.go:199-237`).
- **Cost** — `$/hour` per instance and an upper bound for the whole
  `--max-duration` window, from the checked-in catalog, next to the ceiling the
  guardrails enforce (`internal/plan/build.go:239-278`). It is `unavailable`
  when nothing is runnable.
- **`guardrails:`** — the limits that `run` will check.

Two behavioral notes:

- **The instance list comes from the checked-in price catalog, not from AWS**
  (`internal/plan/catalog.go:12-32` → `internal/pricing/List`). That is why
  `plan` needs no AWS credentials. It also means the plan is only as current as
  `internal/pricing/data.json`; a real run rediscovers types through
  `aws ec2 describe-instance-types`, so the two lists can differ.
- **An unknown `--family` is no longer a startup error.** It produces an empty
  selection plus `warning: no matching instances are present in the checked-in
  local price catalog…` and exit 0. The refusal happens later, when `run`
  evaluates the guardrails.

## Run

`run` evaluates the local plan and the guardrails *before* loading any secret,
then asks for confirmation.

```bash
./dist/tailbench-aws run --filter '^c7i\.2xlarge$' --max-cost-usd 2
```

```text
TAILBENCH EXECUTION CONFIRMATION
provider: aws
workload: vm
region: us-west-2
pending instance types: 1 (limit 1)
instance types: c7i.2xlarge
modes: l7-serve-h1, l7-serve-h2
maximum topology: compute=2 clusters=0 load-balancers=0
duration limit: 45m0s
estimated cost upper bound: $0.54
cost ceiling: $2.00
cleanup policy: always
Proceed? [y/N]:
```

Anything other than `y`/`yes` is `[TB_DECLINED]`, exit 4. The prompt is written
to the non-suppressible channel, so `--quiet` does not hide it
(`cmd/tailbench/main.go:945-977`, `internal/guardrail/guardrail.go:119-173`,
`internal/app/app.go:316-354`).

For automation, `--yes` skips the prompt — but only together with an explicit
cost ceiling. `MaxCostSet` is true when `max_cost_usd` appears in `config.yaml`
or `--max-cost-usd` on the command line; without either, the guardrails refuse
with `noninteractive-cost-required` (`internal/config/config.go:336-345`,
`internal/guardrail/guardrail.go:63-69`):

```bash
./dist/tailbench-aws run --filter '^c7i\.2xlarge$' --max-cost-usd 2 --yes
```

The guardrails that can refuse a run, all as `[TB_SAFETY_LIMIT]` exit 4
(`internal/guardrail/guardrail.go:28-117`):

| Violation | Trigger |
|---|---|
| `no-runnable-work` | Every selected mode is `skip-existing` or `not-applicable` |
| `incompatible-mode` | A container-only mode is configured on this VM binary |
| `noninteractive-cost-required` | `--yes` without an explicit `max_cost_usd` |
| `max-instance-types` | More types have pending work than `--max-instance-types` allows |
| `cost-estimate-unavailable` | Work is selected but has no local price |
| `max-cost-usd` | The plan's upper bound exceeds the ceiling |
| `max-concurrent-resources` | The concurrency limit is below 1 |
| `cleanup-policy` | Not `always`, `on-success`, or `manual` |

Cost scoping:

- Nine families are defined (`internal/provider/aws_instances.go:16-18`): `c8gn`,
  `c6in`, `c7i`, `c7gn`, `c8g`, `c6i`, `m6i`, `c7g`, `m7g`. The committed
  `config.yaml` selects `family: all`.
- Each selected type provisions **two** instances of that type — three with
  `forward-pps-exit` or `relay-throughput` — each with a 50 GB gp3 root volume
  (`internal/provider/aws.go:309-312`), in one AZ inside a cluster placement
  group.
- Types run strictly one at a time and the pair is destroyed before the next
  type starts (`internal/orchestrator/orchestrator.go:701-807`). Peak spend is
  one type's pair; total spend scales with the number of types times the modes
  and their durations.
- `--max-instance-types` defaults to **1**, so a family sweep is refused until
  you raise it deliberately. That default, not the filter, is now the main brake.
- Anchor the regex. `--filter c7i` matches every c7i size including
  `c7i.48xlarge`; `--filter '^c7i\.2xlarge$'` matches exactly one.
- `--family` is part of the instance cache key, so a `--family c7i` cache is
  never reused to satisfy a later `--family all`
  (`internal/orchestrator/orchestrator.go:1587-1592`).
- Quota errors skip the **whole family** for the rest of the run. The skip is
  keyed on `provider.InstanceFamilyGroup`, the same value `--family` accepts, so
  a denial on one size also skips the larger sizes in that family
  (`internal/orchestrator/orchestrator.go:609-617,744-746`,
  `internal/provider/families.go:36-53`,
  `internal/provider/aws_instances.go:71-77`).
- Run one small type end to end before raising `--max-instance-types`.

## What happens during a run

1. `restoreStandardLogger()` runs first in `main()`, undoing Pulumi's takeover of
   the standard logger (`cmd/tailbench/main.go:52-63`). Without it every
   `log.Printf` and `log.Fatalf` is silently discarded.
2. Front-matter flags are parsed and the command is resolved. `--help` and
   `--version` short-circuit without loading configuration
   (`internal/app/app.go:35-108,253-303`).
3. The local plan is built from `config.yaml` and the checked-in price catalog.
   No secrets are read yet (`cmd/tailbench/main.go:1203-1231`).
4. Guardrails are evaluated against that plan. A violation stops here, before any
   credential is touched (`cmd/tailbench/main.go:903-919`).
5. Configuration is re-parsed **with** secret resolution — the first time
   `env_file` is opened — and missing OAuth values fail as `[TB_PREREQUISITE]`
   (`cmd/tailbench/main.go:921-943`).
6. The confirmation prompt runs unless `--yes`
   (`cmd/tailbench/main.go:945-977`).
7. Remote preflight runs `pulumi whoami` and `aws sts get-caller-identity`; a
   failure is `[TB_PREREQUISITE]`, exit 3
   (`cmd/tailbench/main.go:979-982,1063-1071`).
8. A run ID (`tb_YYYY-MM-DD_hex`) is generated and
   `.tailbench/runs/<run-id>/` is created with `manifest.json`, `plan.json`,
   `effective-config.redacted.yaml`, `events.jsonl`, and
   `logs/tailbench.log`. Every planned instance/mode pair becomes a work item —
   `pending` if the plan said `run`, `skipped` otherwise
   (`cmd/tailbench/main.go:1006-1033`,
   `internal/lifecycle/lifecycle.go:69-177,642-661`,
   `internal/runstate/store.go:25-32,64-159`). The run context is bounded by
   `--max-duration`.
9. The orchestrator logs the state backend and, for a local backend, creates
   `state/aws`. No lock sweep happens
   (`internal/orchestrator/orchestrator.go:197-214`).
10. Tailnet, one of two branches
    (`internal/orchestrator/orchestrator.go:230-430`):
    - With `create_tailnet: true`, a manifest-managed run ignores
      `.tailbench/tailnet.json` and creates its own `tailbench-<run suffix>`,
      then swaps in the per-tailnet OAuth client the API returned.
    - With `create_tailnet: false` and `tailnet_dns_name` set, nothing is created
      and the configured client is used throughout.

    Both branches then set the ACL — **replacing the policy file** — enable
    HTTPS if `needsTailnetHTTPS()` says so, create an auth key, and join the
    tailnet as `tailbench-orchestrator` via tsnet with per-run state under
    `.tailbench/runs/<run-id>/tsnet`
    (`internal/orchestrator/orchestrator.go:250-260,413-427,434-453`).
11. `SetupNetworking` generates the SSH key pair when `aws.key_name` is empty,
    then upserts the `tailbench-aws-networking-<suffix>` stack: EC2 key pair
    (generated case only), VPC `10.0.0.0/16` with DNS hostnames, subnet
    `10.0.1.0/24` in `aws.az` with public IP mapping, internet gateway, route
    table plus association, security group, and a `cluster`-strategy placement
    group (`internal/provider/aws.go:84-250`). All resources are tagged
    `Project=tailbench`, `TailbenchProvider=aws`, plus `TailbenchRunID` and
    `TailbenchExpiresAt` (`internal/provider/aws.go:53-68`).
12. Stale tailnet devices matching `tb-aws-` are removed — **only when
    `create_tailnet: true`**; the sweep is inside that branch
    (`internal/orchestrator/orchestrator.go:609-623`).
13. Instance types are listed through `aws ec2 describe-instance-types` and
    written to `.tailbench/instances/aws-<family>.json`, then filtered by
    `--filter` (`internal/orchestrator/orchestrator.go:1594-1681`). Note that
    the cache is only *read* when `CleanupNetworking` is false, which under the
    default `cleanup_policy: always` never happens
    (`internal/orchestrator/orchestrator.go:1599`).
14. For each type with pending modes: a pre-cleanup `DestroyPair`, then
    `CreatePair` upserts stack `tailbench-aws-<type>-<suffix>` with two or three
    EC2 instances. The AMI is the most recent Canonical (owner `099720109477`)
    Ubuntu 24.04 image, `arm64` for Graviton families and `amd64` otherwise
    (`internal/provider/aws.go:265-290`).
15. The orchestrator SSHes to each node over tsnet by tailnet hostname
    (`tb-aws-s-<type>-<suffix>`, `tb-aws-c-…`, `tb-aws-r-…`;
    `internal/orchestrator/orchestrator.go:632-636`), logs
    `waiting for cloud-init ready`, and waits for cloud-init to touch
    `/tmp/tailbench-ready` — bounded per node by `ssh.ready_timeout`, default
    300s (`internal/orchestrator/orchestrator.go:1084-1109`,
    `internal/sshclient/sshclient.go:92-121`). It used to inherit only
    `--max-duration`, so a node stuck in cloud-init billed for the whole run.
16. Pending modes run in order; each writes
    `aws/<family>/results/<type>-<mode>.json` and records the work item's
    outcome on the manifest
    (`internal/orchestrator/orchestrator.go:1117-1127,1345`).
17. `DestroyPair` tears down that type's stack when the cleanup policy allows,
    and the loop moves on (`internal/orchestrator/orchestrator.go:785-807`). The
    auth key is refreshed every 30 minutes.
18. After the last type, `result.Aggregate` regenerates
    `website/data.generated.js` (`internal/orchestrator/orchestrator.go:823`),
    networking and the tailnet are torn down per the cleanup policy, and the
    manifest is finalized with a `summary.json`
    (`internal/lifecycle/lifecycle.go:137-177`).

Graviton detection is a substring test: the family segment is treated as arm64
if it contains the letter `g` (`internal/provider/families.go:73-77`). Of the
configured AWS families that selects `c8gn`, `c7gn`, `c8g`, `c7g`, and `m7g`;
`c6in`, `c7i`, `c6i`, and `m6i` get the amd64 AMI.

## Generate the report

A successful run aggregates automatically
(`internal/orchestrator/orchestrator.go:823`). To see what a specific run
produced, without touching the cloud:

```bash
./dist/tailbench-aws results tb_2026-07-28_a1b2c3
```

It prints the binary, commit, plan hash, and one line per work item with its
status and result path, straight from the manifest
(`internal/summary/report.go:146-249`).

To regenerate the dashboard data by hand — after deleting results, editing them,
or refreshing prices:

```bash
go run ./cmd/aggregate/
```

Run it from the repository root. It resolves the root with `os.Getwd()`
(`cmd/aggregate/main.go:10-17`) and walks `gcp`, `aws`, `azure`, `gke`, `eks`,
and `aks` for `*/**/results/*.json` (`internal/result/aggregator.go:15-21`).

Price is not stored in result JSON. It is injected at aggregation time from the
curated dataset (`internal/result/aggregator.go:54-63`), so re-pricing all
history is just a re-aggregate:

```bash
go run ./cmd/pricing-refresh   # regenerates internal/pricing/data.json
go run ./cmd/aggregate/        # re-injects price_per_hour
```

The AWS dataset is curated for `us-west-2`. A result from another region falls
back to `us-west-2` pricing with a log line; an instance type missing from the
dataset gets no `price_per_hour` at all, and the dashboard's cost columns stay
empty for it (`internal/pricing/pricing.go:106-130`). The same dataset backs the
cost estimate in `plan`, so a stale `data.json` produces both a stale plan and
stale dashboard prices.

To view the dashboard, open `website/index.html`. It loads
`data.generated.js` with a plain `<script src>`, so `file://` works, but it also
loads Chart.js from a CDN (`website/index.html:275`) — the charts need internet
access.

## Resume and interruption

Two mechanisms now decide what a re-run does, and both are true at once.

**Result files still gate per-mode work.** A mode is done when its result JSON
exists; `runModeLoop` skips it and `pendingModesForInstance` leaves it out of the
pending set (`internal/orchestrator/orchestrator.go:1117-1127,1461-1491`). To
re-measure something, delete its file:

```bash
rm aws/c7i/results/c7i.2xlarge-l4-kernel.json
./dist/tailbench-aws run --filter '^c7i\.2xlarge$' --max-cost-usd 2
```

The old `l4-kernel` resume bug is fixed. `pendingModesForInstance` used to
require **both** `<type>-l4-kernel.json` *and* the legacy no-suffix
`<type>.json`, so `l4-kernel` was permanently pending, every re-run
re-provisioned a pair, and the pair measured nothing. Either file now satisfies
the check (`internal/orchestrator/orchestrator.go:1461-1491`). Re-running a
completed configuration is a no-op, and `plan` agrees with it — the same
instance shows `skip-existing` for every mode.

**Approved runs additionally persist a manifest.** Each `run` writes a versioned
record under `.tailbench/runs/<run-id>/`: `manifest.json` (schema 1),
`plan.json`, `effective-config.redacted.yaml`, an append-only `events.jsonl`,
`summary.json`, and `logs/tailbench.log`
(`internal/runstate/store.go:25-32,79-159`). Three local readers and one
executor act on it:

```bash
./dist/tailbench-aws status tb_2026-07-28_a1b2c3    # manifest, work counts, resources, failures
./dist/tailbench-aws results tb_2026-07-28_a1b2c3   # per-work result paths
./dist/tailbench-aws resume tb_2026-07-28_a1b2c3    # continue only unfinished work
```

`status` prints `recoverable: yes|no` and, when recoverable, the exact
`status` / `resume` / `cleanup` commands for that run
(`internal/summary/report.go:29-144,293-303`). `resume` reads the run's own
effective configuration, narrows `--filter` and `benchmark.modes` to exactly the
instance types and modes still pending, running, or failed, and re-confirms
before proceeding (`cmd/tailbench/main.go:313-438,861-895`). A run with nothing
unfinished is `[TB_RECOVERY]`, exit 5
(`internal/lifecycle/lifecycle.go:23,199-200`). An unknown or malformed run ID
is also exit 5 — the ID must match `tb_YYYY-MM-DD_hex`
(`internal/runstate/store.go:22,365-370`).

`Ctrl-C` cancels the context (`cmd/tailbench/main.go:66`) and the loop checks
between instance types (`internal/orchestrator/orchestrator.go:604-607`). The
run is recorded as `interrupted`, the process exits 130, and the manifest is
left recoverable (`internal/lifecycle/lifecycle.go:624-639`). A cancel in the
middle of a type can leave that type's stack up; `resume RUN_ID` or
`cleanup RUN_ID` removes it — but only from a checkout that can reach the same
state backend. With the default local backend, that means the same directory on
the same machine.

Two caches survive between runs, but neither does what it used to for a
manifest-managed run:

- `.tailbench/tailnet.json` — **ignored** when a run ID is set, so each `run`
  creates and owns its own tailnet
  (`internal/orchestrator/orchestrator.go:276-283`).
- `.tailbench/instances/aws-<family>.json` — written on every listing, but only
  read when `CleanupNetworking` is false, i.e. under
  `cleanup_policy: manual` (`internal/orchestrator/orchestrator.go:1599,1669-1678`).

## Teardown

Teardown is driven by `cleanup_policy`, which the guardrails print and the
confirmation prompt repeats
(`internal/orchestrator/orchestrator.go:841-852`):

| Policy | Per-type pair | Networking stack + tailnet |
|---|---|---|
| `always` (default) | Destroyed after each type | Destroyed at the end of the run |
| `on-success` | Destroyed only if the benchmark succeeded | Same |
| `manual` | Left standing | Left standing |

The tailnet column applies only to a run that created one. On the
`tailnet_dns_name` path the deletion defer is never registered — it lives inside
the `create_tailnet` branch — so no cleanup policy will ever delete a tailnet
tailbench merely joined (`internal/orchestrator/orchestrator.go:263-310`). Its
replaced policy file and any leftover `tb-aws-` devices stay as they are.

The important consequence: **with the default policy, the networking stack and
the tailnet do not survive a run.** `cleanup_networking:` in `config.yaml` and
`--cleanup-networking` no longer act as a separate opt-in — they force
`cleanup_policy: always`, and the effective `CleanupNetworking` value is derived
as `cleanup_policy != manual`
(`internal/config/config.go:381-387,457`;
`internal/orchestrator/orchestrator.go:229-274,494-529`). If you want the
long-lived networking stack the older behavior implied, use
`--cleanup-policy manual` and tear it down explicitly.

The old teardown-only recipe — `--cleanup-networking --filter '^$'` — no longer
works: an empty selection is `no-runnable-work`, so the guardrails refuse the run
with exit 4 before any teardown happens. Use the run-scoped command instead:

```bash
./dist/tailbench-aws cleanup tb_2026-07-28_a1b2c3
```

`cleanup RUN_ID` destroys only what that run's manifest records: the per-type
pairs, the networking stack, and the run-owned tailnet. It refuses if any
uncleaned resource is not owned by that run ID with certain ownership
(`[TB_RECOVERY]`, exit 5), it re-confirms unless `--yes`, and it runs the same
remote preflight as a run (`cmd/tailbench/main.go:440-640,642-731`).

When a crash leaves a Pulumi lock behind, remove it explicitly. This is the only
lock removal tailbench performs, and it is scoped to the stacks the named run
recorded — locks outside `<state>/aws/.pulumi/locks` are refused, as are
symlinks and non-regular files:

```bash
./dist/tailbench-aws cleanup tb_2026-07-28_a1b2c3 --recover-pulumi-locks
```

The confirmation lists the exact lock paths before deleting them
(`cmd/tailbench/main.go:522-564,796-849`,
`internal/recovery/pulumi_locks.go:13-138`). On a remote backend, use
`pulumi cancel` instead — the service manages its own leases.

To confirm nothing is left, look for the tags and names the code sets:

- Every AWS resource carries `Project=tailbench` and `TailbenchProvider=aws`,
  plus `TailbenchRunID` and `TailbenchExpiresAt` when a run ID is set
  (`internal/provider/aws.go:53-68`).
- EC2 `Name` tags are `tb-<type-with-dashes>-server` / `-client` / `-router`
  (`internal/provider/aws.go:256-258`) — note these have **no** provider segment
  and no run suffix, unlike the tailnet device hostnames
  `tb-aws-s-<type>-<suffix>` (`internal/orchestrator/orchestrator.go:632-636`).
  Tailnet device cleanup matches the `tb-aws-` prefix
  (`internal/orchestrator/orchestrator.go:558-572`); it does not match the EC2
  `Name` tags.
- Stacks: `pulumi stack ls` against the configured backend, looking for
  `tailbench-aws-*`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Exit code 1 with no output at all | Pulumi's `logging` package `init()` calls `slog.SetDefault`, which redirects the standard logger to a discarding handler | `restoreStandardLogger()` must run first in `main()` (`cmd/tailbench/main.go:52-63`). If new code logs before it, move it back |
| `[TB_PREREQUISITE] … load environment file …`, exit 3 | `env_file:` points at a file that does not exist — `.env` is gitignored | `cp .env.example .env` and fill it in, or run `init` (`cmd/tailbench/main.go:1413-1430`) |
| `[TB_PREREQUISITE] … required values are missing: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET`, exit 3 | Empty OAuth values. A manifest-managed run cannot fall back on a cached tailnet | Set both in `.env` (`cmd/tailbench/main.go:935-943,1701-1710`) |
| `[TB_PREREQUISITE]` naming `pulumi-auth` or `cloud-auth`, exit 3 | Remote preflight failed | `./dist/tailbench-aws doctor --remote`; fix `pulumi login` or the AWS credential chain (`internal/preflight/remote.go:44-78`) |
| `[TB_PREREQUISITE] … executable not found on PATH`, exit 3 | `pulumi` or `aws` missing | `mise install`, or install the tool (`internal/preflight/preflight.go:84-101`) |
| `[TB_SAFETY_LIMIT] … no-runnable-work`, exit 4 | Every selected mode is `skip-existing` or `not-applicable` | Widen `--family`/`--filter`, delete a result to re-measure, or use `results RUN_ID` (`internal/guardrail/guardrail.go:41-47`) |
| `[TB_SAFETY_LIMIT] … max-instance-types`, exit 4 | More pending types than the default limit of 1 | Narrow the selector, or raise `--max-instance-types` deliberately (`internal/guardrail/guardrail.go:70-80`) |
| `[TB_SAFETY_LIMIT] … noninteractive-cost-required`, exit 4 | `--yes` without an explicit ceiling | Add `--max-cost-usd`, or set `max_cost_usd` in `config.yaml` (`internal/guardrail/guardrail.go:63-69`) |
| `[TB_SAFETY_LIMIT] … incompatible-mode`, exit 4 | `l4-lb`, `l7-ingress-*`, or `forward-pps-exit-k8s*` in `benchmark.modes` | Remove them, or use `tailbench-aws-k8s` (`internal/guardrail/guardrail.go:48-62`) |
| `[TB_CONFIG] invalid state_backend "…"`, exit 2 | Unrecognized scheme | Use `pulumi.com` or an `s3://`, `gs://`, `azblob://`, or `file://` URL (`internal/config/config.go:198-225`) |
| `[TB_CONFIG] read configuration …`, exit 2 | `--config` points nowhere | Fix the path, or run `init` in this directory (`internal/config/errors.go:19-33`) |
| `[TB_PLAN] invalid benchmark mode "…"`, exit 2 | Typo in `benchmark.modes` | Correct it; valid names are in `internal/benchmark/modes.go:8-26` |
| `[TB_PLAN] benchmark mode "tsnet-userspace" is not implemented`, exit 2 | The tsnet runner does not exist | Remove the mode (`internal/plan/build.go:63-68`) |
| `[TB_PLAN] requested provider "x", but this binary was compiled for "aws"`, exit 2 | `--provider` or `providers:` names another cloud | Use `aws`, or the binary for that cloud (`internal/plan/build.go:34-42`) |
| `[TB_RECOVERY] invalid run ID "…"`, exit 5 | Run IDs must match `tb_YYYY-MM-DD_hex` | Copy the ID from the run's output or from `.tailbench/runs/` (`internal/runstate/store.go:22,365-370`) |
| `[TB_RECOVERY] run has no recoverable unfinished work`, exit 5 | `resume` on a completed run | Nothing to do; use `results RUN_ID` (`internal/lifecycle/lifecycle.go:23,199-200`) |
| `[TB_RECOVERY] resource "…" lacks certain cleanup ownership`, exit 5 | `cleanup` on a manifest with resources it cannot prove it owns | Inspect `status RUN_ID` and remove the resources through Pulumi or the console (`cmd/tailbench/main.go:472-487`) |
| `[TB_DURATION_LIMIT]`, exit 1 | The run hit `--max-duration` | Raise the limit or narrow the selection; then `resume RUN_ID` (`cmd/tailbench/main.go:1295-1298`) |
| `plan` says zero instances for a family you expected | `--family`/`--filter` match nothing in the checked-in catalog | Compare the regex against the families in `internal/provider/aws_instances.go:16-18`; refresh prices with `go run ./cmd/pricing-refresh` |
| Any Pulumi operation fails with `exit status 255` | A stale lock file from a crashed run, on a local backend | `cleanup RUN_ID --recover-pulumi-locks`; there is no startup sweep any more (`internal/recovery/pulumi_locks.go:13-138`) |
| `no tailnet configured: set tailscale.create_tailnet: true …`, at startup | Neither `create_tailnet: true` nor `tailscale.tailnet_dns_name` is set. Not the `init` default any more — `init` now writes `create_tailnet: true` (`cmd/tailbench/main.go:288-297`) | Set one of them (`internal/orchestrator/orchestrator.go:174-179`) |
| `create tailnet: tailnet creation failed (HTTP 403): {"message":"actor does not have permission to create tailnets"}` | The OAuth client cannot create tailnets. Scope `all` on a tailnet-scoped client is **not** enough; this needs an org-level permission that is not a published scope | Use an org-level client that may create tailnets, or switch to `create_tailnet: false` plus `tailscale.tailnet_dns_name` (`internal/tailnet/tailnet.go:86-88`) |
| The joined tailnet's ACL rules are gone after a run | `SetupACL` calls `PolicyFile().Set(...)`, replacing the whole policy file with the allow-all benchmark policy | Restore from the policy-file version history in the admin console, and point `tailnet_dns_name` at a dedicated benchmark tailnet (`internal/tailnet/tailnet.go:150-152,160-228`) |
| Devices named `tb-aws-…` pile up on a joined tailnet | Stale-device cleanup only runs under `create_tailnet: true` | Delete them in the admin console (`internal/orchestrator/orchestrator.go:609-623`) |
| `InvalidKeyPair.NotFound` on every `CreatePair` | A non-empty `aws.key_name` names a key pair that does not exist in `aws.region` | Set `aws.key_name` to a key pair that exists in that region, or clear it and let tailbench generate one (`internal/provider/aws.go:87-114,351-356`) |
| `VcpuLimitExceeded` / `InstanceLimitExceeded`, then the rest of the family is skipped | Quota; the whole family group is marked skipped for the remainder of the run | Request a quota increase, or `--filter` to the sizes you have headroom for (`internal/provider/aws_instances.go:71-77`, `internal/orchestrator/orchestrator.go:609-617,744-746`) |
| `Unsupported` / instance-type errors for some sizes only | `aws.az` does not offer that type | Change `aws.az`, or filter those types out |
| `ssh dial … after N attempts` | The node never joined the tailnet, so tsnet cannot reach it: cloud-init failed before `tailscale up`, or the auth key was rejected | Raise `ssh.timeout`, then diagnose over the public IP — see "A node that never finishes cloud-init" below |
| `server ready: cloud-init did not finish within 5m0s: /tmp/tailbench-ready was never written` | Cloud-init reached the node but never completed | See "A node that never finishes cloud-init" below (`internal/sshclient/sshclient.go:109-116`) |
| L7 modes skipped with `endpoint warm-up failed` | fortio never installed, or `tailscale serve` failed on the server node — both are non-fatal in cloud-init | Check the server's cloud-init output; the install and serve steps log `WARN` and continue (`internal/cloudinit/setup.sh.tmpl:34-37,51-56`) |
| The networking stack and tailnet vanished after a run | Default `cleanup_policy: always` destroys them | Use `--cleanup-policy manual` to keep them (`internal/config/config.go:381-387,457`) |
| Dashboard shows no `$/hr` or cost columns for a row | The type or region is not in the curated pricing dataset | `go run ./cmd/pricing-refresh` then re-aggregate; AWS is curated for `us-west-2` (`internal/pricing/pricing.go:106-130`) |
| Dashboard renders tables but no charts | Chart.js is loaded from a CDN | Give the browser internet access (`website/index.html:275`) |
| Changing `aws.region` or `aws.az` against existing stacks | The networking stack already holds resources in the old region | Treat region and AZ as fixed for the life of a networking stack: `cleanup RUN_ID` first, then change them |

### A node that never finishes cloud-init

The failure looks like a stalled run: the log stops at
`waiting for cloud-init ready` and nothing else happens. Tailscale SSH is not
available yet — that is the whole problem — so the only way in is the public IP
and the generated key pair.

```bash
ssh -i .tailbench/ssh/<name>.pem ubuntu@<public-ip>
sudo cloud-init status --long
sudo tail -40 /var/log/cloud-init-output.log
```

- `<name>` is `tailbench-<run suffix>` unless you set `aws.key_name` yourself;
  the run logs the exact path when it generates the key
  (`internal/provider/aws.go:102`).
- `ubuntu` is the user for the Canonical Ubuntu 24.04 AMI this provider selects
  (`internal/provider/aws.go:302-307`, `:312-319`).
- The public IP is not printed by the run. Find it by tag:

  ```bash
  aws ec2 describe-instances --region us-west-2 \
    --filters Name=tag:Project,Values=tailbench Name=instance-state-name,Values=running \
    --query 'Reservations[].Instances[].[Tags[?Key==`Name`]|[0].Value,PublicIpAddress]' \
    --output text
  ```

- The security group opens 22/tcp to `0.0.0.0/0`, so this works without extra
  setup (`internal/provider/aws.go:171-177`).

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
run with `l7-serve-h2` hung on a tailnet that did not have HTTPS on. If the
tailnet you joined has HTTPS disabled at the org level, the run now fails fast
with `enable HTTPS: …` instead.

The bound that makes any remaining variant of this survivable is
`ssh.ready_timeout` (default 300s). `WaitForReady` applies it per node and its
timeout message names this same recipe
(`internal/sshclient/sshclient.go:83-121`). Before that, the wait inherited only
`--max-duration`, so instances billed for the full run window with no diagnosis.
