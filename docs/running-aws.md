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
`cmd/tailbench/aws.go:10-14`.

| Property | Value |
|---|---|
| Binary | `./dist/tailbench-aws` |
| Build tags | `aws` (`Makefile:64-66`) |
| Provider value | `aws` (`cmd/tailbench/aws.go:10`) |
| Environment | `vm` — never `container` (`internal/orchestrator/orchestrator.go:412-415`) |
| Runtime cloud CLI | `aws` (`internal/provider/aws_instances.go:24`) |
| Result directory | `aws/<family>/results/<type>-<mode>.json` |
| Pulumi stacks | `tailbench-aws-networking`, `tailbench-aws-<type-with-dots-as-dashes>` (`internal/provider/aws.go:47,230-231`) |

An explicit `--provider` must match the compiled provider — `--provider gcp`
against this binary fails at startup instead of silently using AWS
(`cmd/tailbench/main.go:72-76`). Renaming the executable does not change its
identity.

## Prerequisites

| Tool | Needed for | Why |
|---|---|---|
| Go, version from `go.mod` (`go 1.26.5`) | Building only | `make build-aws` |
| `pulumi` CLI on `PATH` | Every real run | The Automation API shells out to it; nothing catches its absence at build time (`mise.toml`) |
| `aws` CLI v2, authenticated | Every run **and** `--dry-run` | Instance discovery and vCPU lookup shell out to it (`internal/provider/aws_instances.go:24,59`) |
| Tailscale OAuth client | Real runs only | Creating the ephemeral tailnet and auth keys |

`mise install` provisions the toolchain (`mise.toml`); the Makefile stays the
task runner (`make help`).

Note that `mise.toml` currently claims AWS instance discovery goes through the
Go SDK. It does not — it shells out to the `aws` CLI
(`internal/provider/aws_instances.go:24`), so the CLI is required even for a
dry run.

Verify each prerequisite from the repository root:

```bash
REGION=us-west-2        # must match aws.region in config.yaml
KEY=my-keypair          # must match aws.key_name in config.yaml

go version                       # must satisfy the `go 1.26.5` directive in go.mod
pulumi version                   # any 3.x; the Automation API execs this binary
aws --version                    # aws-cli/2.x

# Credentials resolve? Prints Account / UserId / Arn.
aws sts get-caller-identity

# The exact call --dry-run makes (with a different --filters value).
aws ec2 describe-instance-types --region "$REGION" \
  --instance-types c7i.xlarge \
  --query 'InstanceTypes[0].VCpuInfo.DefaultVCpus' --output text

# The key pair named in config.yaml must exist in this region.
aws ec2 describe-key-pairs --region "$REGION" --key-names "$KEY" \
  --query 'KeyPairs[0].KeyName' --output text

# Tailscale credentials present and non-empty (values are not printed). Expect 2.
grep -cE '^OAUTH_CLIENT_(ID|SECRET)=.+' .env
```

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
make lint-aws                     # Makefile:33-34
make test-aws                     # Makefile:51-52
make verify-deps VARIANT=aws      # Makefile:83-84
```

## Credentials

Three independent systems. Each fails in a different place, so check them
separately.

### Tailscale OAuth

`config.yaml` reads `.env` through `env_file:` and expands `${OAUTH_CLIENT_ID}`
/ `${OAUTH_CLIENT_SECRET}` into the `tailscale:` block
(`internal/config/config.go:243-258`). `.env` is gitignored and absent from a
fresh clone:

```bash
cp .env.example .env
$EDITOR .env
```

A missing env file is not fatal — expansion falls back to the process
environment, which is why `--dry-run` and `--version` work without credentials
(`internal/config/config.go:248-257`).

The OAuth client must be org-level and able to create tailnets, plus write auth
keys, the policy file, and devices. Tailbench creates and deletes real tailnets,
so use disposable org credentials.

Credentials are validated only when there is no cached tailnet at
`.tailbench/tailnet.json` — a resumed run takes its credentials from that file
(`internal/orchestrator/orchestrator.go:48-78,181-186`).

### AWS

There is no AWS credential preflight. Both consumers use the standard AWS
credential chain (environment, shared config, SSO, instance profile):

- the `aws` CLI, for instance discovery and vCPU lookup
  (`internal/provider/aws_instances.go:24,59`);
- the Pulumi AWS provider, for every resource.

The region is **not** taken from your AWS profile. It is set explicitly as
Pulumi config `aws:region` on both stacks (`internal/provider/aws.go:200,319`)
and passed as `--region` on every CLI call
(`internal/provider/aws_instances.go:25,61`), from `aws.region` in
`config.yaml`.

Credential problems therefore surface as a failing `describe-instance-types` (in
dry run and at the start of a real run) or as a failing Pulumi `up`, not as a
startup error.

### Pulumi state backend

The default local backend needs no credentials. Pulumi Cloud is checked at
startup: `PULUMI_ACCESS_TOKEN` or `~/.pulumi/credentials.json` must exist, or
`orchestrator.New` fails immediately with instructions
(`internal/provider/backend.go:59-75`, called from
`internal/orchestrator/orchestrator.go:101-103`). The token can live in `.env`;
the Pulumi CLI inherits tailbench's environment.

Object-store backends are deliberately not checked — `s3://` authenticates
through the same AWS credentials the provider already needs
(`internal/provider/backend.go:56-58`).

## Configure config.yaml

Only these keys affect this variant.

| Key | Default | Effect | What breaks if wrong |
|---|---|---|---|
| `aws.region` | `us-west-2` (`internal/config/config.go:303`) | Pulumi `aws:region` on both stacks; `--region` on every CLI call; recorded as `region` on each result (`internal/orchestrator/orchestrator.go:827-829`) | A region that does not offer the selected types yields an empty dry run; pricing is curated for `us-west-2` only and falls back to it (`internal/pricing/pricing.go:34-38,116-121`) |
| `aws.az` | `us-west-2a` (`internal/config/config.go:304`) | Availability zone of the single subnet (`internal/provider/aws.go:66`); recorded as `zone` | An AZ outside `aws.region` fails subnet creation; an AZ that does not offer a given instance type fails that type's `CreatePair` |
| `aws.key_name` | **none** (`internal/config/config.go:305`) | Set as `KeyName` on every EC2 instance (`internal/provider/aws.go:279`) | A name that does not exist in `aws.region` fails every `CreatePair` with `InvalidKeyPair.NotFound` |
| `benchmark.modes` | `["l4-kernel"]` when empty (`internal/config/config.go:342-344`) | Which benchmarks run per instance type, and how many result files each type produces | Kubernetes-only modes are rejected at startup; unknown names are rejected at startup |
| `state_backend` | empty → `./state/aws` | Where Pulumi stacks live | See the backend table below |
| `family` / `filter` | `all` / empty | Which instance types are selected | Overridden by `--family` / `--filter` |
| `tailscale.*`, `benchmark.*`, `ssh.*` | see `config.yaml` | Tailnet creation, iperf3/fortio/pps parameters, SSH timeouts | Shared across all variants |

Keys under `gcp:`, `azure:`, and `images:` do not affect this binary — the AWS
`CreatePair` never reads `BenchImage` or `TSImage`. Of the `l7_endpoints:` keys,
only `serve_fqdn` applies here: it overrides the target for `l7-serve-*`, which
otherwise defaults to `<server hostname>.<tailnet DNS name>`
(`internal/orchestrator/orchestrator.go:857-861`). `ingress_fqdn` and
`cluster_label` are read only by modes this binary rejects.

### The `aws.key_name` trap

The committed `config.yaml:64` ships `key_name: raj_macbook` — an upstream
author's EC2 key pair. It will not exist in your account, and every instance
launch will fail until you change it. Set it to a key pair that exists in
`aws.region`.

Nothing in the code special-cases an empty value. `internal/config/config.go:305`
assigns it with no `or(...)` default (unlike `aws.region` and `aws.az` on the
two lines above it), and `internal/provider/aws.go:279` wraps it directly in
`pulumi.String` with no emptiness check, so an empty string is what reaches the
EC2 API. There is no code path that omits the field. Whether the EC2 API
tolerates an empty `KeyName` was not verified here — set a real key pair rather
than relying on it.

The benchmark itself never uses that key pair. Cloud-init enables Tailscale SSH
(`tailscale set --ssh`, `internal/cloudinit/setup.sh.tmpl:42-44`) and the
orchestrator dials port 22 **through tsnet** as `root`
(`internal/sshclient/sshclient.go:19-30`; the auth method is
`ssh.Password("tailscale")` at `internal/sshclient/sshclient.go:26`). The key
pair matters only if you want to SSH to an instance's public IP yourself — the
security group opens 22/tcp to `0.0.0.0/0` for that
(`internal/provider/aws.go:118-124`).

### Modes this binary accepts and rejects

There is no `--modes` flag. Modes come only from `benchmark.modes` in
`config.yaml` (see `./dist/tailbench-aws --help`).

| Mode | Status here | Notes |
|---|---|---|
| `l4-kernel` | Accepted | iperf3 + MTR, baseline LAN vs Tailscale. The default when `modes` is empty |
| `l4-userspace` | Accepted | Runs the same iperf3 + MTR path as `l4-kernel` (`internal/benchmark/modes.go:55-57`); no separate userspace setup exists in the VM runner |
| `l7-serve-h1`, `l7-serve-h2` | Accepted, VM-only | fortio against `tailscale serve` on the server node (`internal/cloudinit/setup.sh.tmpl:50-58`) |
| `forward-pps-exit` | Accepted, opt-in | Adds a third VM (exit node under test) |
| `relay-throughput` | Accepted, opt-in | Adds a third VM (peer relay); needs Tailscale >= 1.86 |
| `tsnet-userspace` | Accepted by validation, does nothing | Skipped at run time with "tsnet runner not yet implemented" (`internal/orchestrator/orchestrator.go:800-802`) |
| `l4-lb` | **Rejected at startup** | Container-only (`internal/benchmark/modes.go:44-47`) |
| `l7-ingress-h1`, `l7-ingress-h2` | **Rejected at startup** | Container-only |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | **Rejected at startup** | Container-only |

Rejection is a hard startup failure — `kubernetes-only benchmark mode "l4-lb"
requires a k8s-enabled binary` — from
`internal/orchestrator/k8s_disabled.go:16-23`, reached through
`internal/orchestrator/orchestrator.go:104`. An unrecognized mode name is also
rejected at startup, with the list of valid modes
(`internal/orchestrator/orchestrator.go:84-92`).

### Opt-in three-node modes

`forward-pps-exit` and `relay-throughput` are commented out in the committed
`config.yaml`. Enabling either makes `CreatePair` provision a **third** VM of the
same instance type — the router or relay under test — via
`PairOptions.WantRouter` (`internal/orchestrator/orchestrator.go:433-434`,
`internal/provider/aws.go:264-267`). That is a 50% cost increase per type, and
the third node is the device the result describes. The security group already
opens the ports they need: 15201/tcp and 15201/udp for the iperf3 sink, and
41642/udp for the peer relay (`internal/provider/aws.go:132-152`). Topology,
sweep methodology, and caveats are in
[docs/cost-forward-pps-plan.md](cost-forward-pps-plan.md); the README has the
short version.

The router is provisioned based on *pending* work, not configured modes, so a
type whose forwarding result already exists does not pay for a third node on a
re-run (`internal/orchestrator/orchestrator.go:429-434`).

## Choose a state backend

| `state_backend` | State location | Startup behavior | Consequence |
|---|---|---|---|
| *(empty, default)* | `./state/aws` (`internal/provider/backend.go:16-21`, `internal/config/config.go:318`) | Creates the directory, then deletes stale Pulumi lock files matching `state/*/.pulumi/locks/*.json` (`internal/orchestrator/orchestrator.go:129-146`) | Stacks are visible only from this checkout on this machine. An interrupted run can only be cleaned up from here |
| `pulumi.com` | `https://api.pulumi.com` (`internal/config/config.go:182-185`) | Requires `PULUMI_ACCESS_TOKEN` or `~/.pulumi/credentials.json`, checked before anything is provisioned; no directory creation, no lock sweep (`internal/orchestrator/orchestrator.go:122-127`) | Stacks survive a machine swap; Pulumi manages its own leases, so clear a stuck operation with `pulumi cancel` |
| `s3://bucket/prefix` | Object storage | No separate credential check (`internal/provider/backend.go:56-58`) | Uses the same AWS credentials the provider needs; stacks are shareable |
| `gs://…`, `azblob://…` | Object storage | No separate credential check | Valid, but pulls in another cloud's credentials |
| `file:///abs/path` | Explicit local path | Treated as local: lock sweep applies only to the default `./state` glob | Useful for a shared mount |

Stack names are provider-qualified (`tailbench-aws-*`), so one backend can hold
every provider's stacks without collision. Pulumi always needs a real local
working directory, so remote backends get scratch space under
`.tailbench/pulumi/aws` (`internal/provider/backend.go:23-38`). An unusable
value is rejected at parse time (`internal/config/config.go:175-194`).

Override per run:

```bash
./dist/tailbench-aws --state-backend pulumi.com --family c7i
./dist/tailbench-aws --state-backend s3://tailbench-state/pulumi --family c7i
```

## Dry run

```bash
./dist/tailbench-aws --dry-run
./dist/tailbench-aws --dry-run --family c7i
./dist/tailbench-aws --dry-run --filter '^c7i\.(2|4)xlarge$'
```

Dry run prints the provider, the configured modes, the families, every selected
instance type with its vCPU count, and a count — then exits
(`internal/orchestrator/orchestrator.go:296-319`). If the count is zero it says
so explicitly rather than looking like a successful empty run.

Two things to know:

- It still calls `ListInstances`, which shells out to
  `aws ec2 describe-instance-types`
  (`internal/orchestrator/orchestrator.go:302` →
  `internal/provider/aws_instances.go:24`). So a dry run needs working AWS
  authentication even though it touches no cloud resources and needs no
  Tailscale credentials.
- It does not populate the instance cache; only the real run path caches
  (`internal/orchestrator/orchestrator.go:1032-1043`).

An unrecognized `--family` is an error listing the valid families rather than an
empty selection (`internal/orchestrator/orchestrator.go:327-339`).

## Run

```bash
./dist/tailbench-aws --filter '^c7i\.2xlarge$'    # one type — start here
./dist/tailbench-aws --family c6in                # one family, every size
./dist/tailbench-aws                              # config.yaml as-is (family: all)
```

Cost scoping:

- Nine families are defined (`internal/provider/aws_instances.go:16-18`): `c8gn`,
  `c6in`, `c7i`, `c7gn`, `c8g`, `c6i`, `m6i`, `c7g`, `m7g`. The committed
  `config.yaml` selects `family: all`.
- Each selected type provisions **two** instances of that type — three with
  `forward-pps-exit` or `relay-throughput` — each with a 50 GB gp3 root volume
  (`internal/provider/aws.go:286-289`), in one AZ inside a cluster placement
  group.
- Types run strictly one at a time and the pair is destroyed before the next
  type starts (`internal/orchestrator/orchestrator.go:489-530`). Peak spend is
  one type's pair; total spend scales with the number of types times the modes
  and their durations.
- Anchor the regex. `--filter c7i` matches every c7i size including
  `c7i.48xlarge`; `--filter '^c7i\.2xlarge$'` matches exactly one.
- `--family` is part of the instance cache key, so a `--family c7i` cache is
  never reused to satisfy a later `--family all`
  (`internal/orchestrator/orchestrator.go:1019-1028`).
- Quota errors skip the **whole family** for the rest of the run
  (`internal/orchestrator/orchestrator.go:506-508`,
  `internal/provider/aws_instances.go:71-77`). Large sizes usually trip this
  first, so a family sweep may end early with most sizes unmeasured.
- Run one small type end to end before starting a family sweep.

Available flags are exactly `-cleanup-networking`, `-config`, `-dry-run`,
`-family`, `-filter`, `-provider`, `-state-backend`, plus `--version`, which is
handled before flag parsing (`cmd/tailbench/main.go:44-49`).

## What happens during a run

1. `restoreStandardLogger()` runs first in `main()`, undoing Pulumi's takeover of
   the standard logger (`cmd/tailbench/main.go:36-49`). Without it every
   `log.Printf` and `log.Fatalf` is silently discarded.
2. Config is parsed and merged; modes, state backend credentials, and
   VM-vs-Kubernetes mode applicability are validated before anything is
   provisioned (`internal/orchestrator/orchestrator.go:98-106`).
3. For a local backend, `state/aws` is created and stale Pulumi lock files are
   swept (`internal/orchestrator/orchestrator.go:129-146`).
4. Tailnet: `.tailbench/tailnet.json` is reused if present, otherwise a new
   ephemeral tailnet is created and cached. The ACL is refreshed either way. An
   auth key is created, and the orchestrator joins the tailnet itself as
   `tailbench-orchestrator` via tsnet
   (`internal/orchestrator/orchestrator.go:160-262`).
5. `SetupNetworking` upserts the long-lived `tailbench-aws-networking` stack:
   VPC `10.0.0.0/16` with DNS hostnames, subnet `10.0.1.0/24` in `aws.az` with
   public IP mapping, internet gateway, route table plus association, security
   group, and a `cluster`-strategy placement group
   (`internal/provider/aws.go:46-193`). All resources are tagged
   `Project=tailbench`.
6. Stale tailnet devices matching `tb-aws-` are removed
   (`internal/orchestrator/orchestrator.go:362-371`).
7. Instance types are listed, cached at `.tailbench/instances/aws-<family>.json`
   (`internal/orchestrator/orchestrator.go:1023-1043`), then filtered by
   `--filter`.
8. For each type with pending modes: a pre-cleanup `DestroyPair`, then
   `CreatePair` upserts stack `tailbench-aws-<type>` with two or three EC2
   instances. The AMI is the most recent Canonical (owner `099720109477`) Ubuntu
   24.04 image, `arm64` for Graviton families and `amd64` otherwise
   (`internal/provider/aws.go:243-262`).
9. The orchestrator SSHes to each node over tsnet by tailnet hostname
   (`tb-aws-s-<type>-<suffix>`, `tb-aws-c-…`, `tb-aws-r-…`;
   `internal/orchestrator/orchestrator.go:423-427`) and waits for cloud-init to
   touch `/tmp/tailbench-ready`.
10. Pending modes run in order; each writes
    `aws/<family>/results/<type>-<mode>.json`
    (`internal/orchestrator/orchestrator.go:835`).
11. `DestroyPair` tears down that type's stack, and the loop moves on. The auth
    key is refreshed every 30 minutes.
12. After the last type, `result.Aggregate` regenerates
    `website/data.generated.js` (`internal/orchestrator/orchestrator.go:548`).
    Networking is torn down only with `--cleanup-networking`.

Graviton detection is a substring test: the family segment is treated as arm64
if it contains the letter `g` (`internal/provider/families.go:37-40`). Of the
configured AWS families that selects `c8gn`, `c7gn`, `c8g`, `c7g`, and `m7g`;
`c6in`, `c7i`, `c6i`, and `m6i` get the amd64 AMI.

## Generate the report

A successful run aggregates automatically
(`internal/orchestrator/orchestrator.go:548`). To regenerate by hand — after
deleting results, editing them, or refreshing prices:

```bash
go run ./cmd/aggregate/
```

Run it from the repository root. It resolves the root with `os.Getwd()`
(`cmd/aggregate/main.go:11`) and walks `gcp`, `aws`, `azure`, `gke`, `eks`, and
`aks` for `*/**/results/*.json` (`internal/result/aggregator.go:15-21`).

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
empty for it (`internal/pricing/pricing.go:34-38,102-124`).

To view the dashboard, open `website/index.html`. It loads
`data.generated.js` with a plain `<script src>`, so `file://` works, but it also
loads Chart.js from a CDN (`website/index.html:275-276`) — the charts need
internet access.

## Resume and interruption

Resume is filesystem-driven. There is no database: a mode is considered done if
and only if its result JSON exists
(`internal/orchestrator/orchestrator.go:663-667,906-927`). To re-measure
something, delete its file:

```bash
rm aws/c7i/results/c7i.2xlarge-l4-kernel.json
./dist/tailbench-aws --filter '^c7i\.2xlarge$'
```

`Ctrl-C` cancels the context (`cmd/tailbench/main.go:60`) and the loop checks
between instance types (`internal/orchestrator/orchestrator.go:400-402`). A
cancel in the middle of a type can leave that type's stack up; the next run's
pre-cleanup `DestroyPair` removes it
(`internal/orchestrator/orchestrator.go:489`) — but only from a checkout that
can reach the same state backend. With the default local backend, that means the
same directory on the same machine.

Two caches survive between runs and are only invalidated by
`--cleanup-networking`:

- `.tailbench/tailnet.json` — the tailnet is reused, not recreated
  (`internal/orchestrator/orchestrator.go:167-180`).
- `.tailbench/instances/aws-<family>.json` — the instance list
  (`internal/orchestrator/orchestrator.go:1032-1043`).

One resume bug to be aware of, because it costs money. `l4-kernel` is reported
as pending unless **both** `<type>-l4-kernel.json` *and* the legacy no-suffix
`<type>.json` exist (`internal/orchestrator/orchestrator.go:918-924`). No
current result tree contains the legacy files, so `l4-kernel` always looks
pending; the instance is provisioned, and then `runModeLoop` skips the mode
because the suffixed file is there
(`internal/orchestrator/orchestrator.go:663-667`). Net effect: re-running an
already-complete configuration re-provisions every instance type, runs nothing,
and tears it down again. Until it is fixed, use `--filter` to name the types you
actually want when re-running over a completed result tree.

## Teardown

Per-type stacks are ephemeral — `DestroyPair` runs after every type, and again
as pre-cleanup before the next `CreatePair`
(`internal/orchestrator/orchestrator.go:489,526`). The networking stack, the
tailnet, and the caches deliberately survive.

To remove everything:

```bash
./dist/tailbench-aws --cleanup-networking --filter '^$'
```

`--cleanup-networking` destroys the `tailbench-aws-networking` stack
(`internal/orchestrator/orchestrator.go:552-557`,
`internal/provider/aws.go:377-390`), deletes the tailnet, and removes
`.tailbench/tailnet.json` (`internal/orchestrator/orchestrator.go:219-231`). It
also bypasses the instance cache, forcing a fresh listing.

The flag does not skip benchmarking — teardown happens at the *end* of a normal
pass. The `--filter '^$'` above matches no instance type, so nothing is
provisioned in between. Note that `SetupNetworking` still runs first
(`internal/orchestrator/orchestrator.go:355`), so a teardown-only invocation
recreates the networking stack before destroying it.

To confirm nothing is left, look for the tags and names the code sets:

- Every AWS resource carries `Project=tailbench`
  (`internal/provider/aws.go:55-57,290-293`).
- EC2 `Name` tags are `tb-<type-with-dashes>-server` / `-client` / `-router`
  (`internal/provider/aws.go:233-235`) — note these have **no** provider segment
  and no run suffix, unlike the tailnet device hostnames
  `tb-aws-s-<type>-<suffix>` (`internal/orchestrator/orchestrator.go:423-427`).
  Tailnet device cleanup matches the `tb-aws-` prefix
  (`internal/orchestrator/orchestrator.go:362-371`); it does not match the EC2
  `Name` tags.
- Stacks: `pulumi stack ls` against the configured backend, looking for
  `tailbench-aws-*`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Exit code 1 with no output at all | Pulumi's `logging` package `init()` calls `slog.SetDefault`, which redirects the standard logger to a discarding handler | `restoreStandardLogger()` must run first in `main()` (`cmd/tailbench/main.go:36-49`). If new code logs before it, move it back |
| Any Pulumi operation fails with `exit status 255` | A stale lock file from a crashed run, on a local backend | Startup sweeps `state/*/.pulumi/locks/*.json` (`internal/orchestrator/orchestrator.go:134-146`). If it persists, delete the lock; on a remote backend run `pulumi cancel` |
| `InvalidKeyPair.NotFound` on every `CreatePair` | `aws.key_name` names a key pair that does not exist in `aws.region` — the committed value is an upstream author's key | Set `aws.key_name` to a key pair that exists in that region (`config.yaml:64`, `internal/provider/aws.go:279`) |
| `VcpuLimitExceeded` / `InstanceLimitExceeded`, then the rest of the family is skipped | Quota; the whole family is marked skipped for the remainder of the run | Request a quota increase, or `--filter` to the sizes you have headroom for (`internal/provider/aws_instances.go:71-77`, `internal/orchestrator/orchestrator.go:506-508`) |
| `Unsupported` / instance-type errors for some sizes only | `aws.az` does not offer that type | Change `aws.az`, or filter those types out |
| `--dry-run` prints `error listing instances` | The `aws` CLI is missing, unauthenticated, or the region is wrong | Re-run the prerequisite checks above (`internal/provider/aws_instances.go:24`) |
| `0 instance types selected` in a dry run | `--family` / `--filter` match nothing | Compare the regex against the families printed on the line above it |
| `unknown family "…"` at startup | Family is not one of the nine AWS families | Use a family from `internal/provider/aws_instances.go:16-18` |
| `unknown benchmark mode "…"` at startup | Typo in `benchmark.modes` | The error lists every valid mode (`internal/orchestrator/orchestrator.go:84-92`) |
| `kubernetes-only benchmark mode "…" requires a k8s-enabled binary` | `l4-lb`, `l7-ingress-*`, or `forward-pps-exit-k8s*` in `benchmark.modes` | Remove them, or use `tailbench-aws-k8s` with `--provider eks` (`internal/orchestrator/k8s_disabled.go:16-23`) |
| `requested provider "x", but this binary was compiled for provider "aws"` | `--provider` or `providers:` names another cloud | Use `aws`, or the binary for that cloud (`cmd/tailbench/main.go:72-76`) |
| `missing Tailscale credentials: … are empty` | No `.env` values **and** no `.tailbench/tailnet.json` to fall back on | `cp .env.example .env` and fill it in (`internal/orchestrator/orchestrator.go:48-78`) |
| `state_backend is Pulumi Cloud … but no credentials were found` | `state_backend: pulumi.com` without a token | Set `PULUMI_ACCESS_TOKEN` (an `.env` entry works) or run `pulumi login` (`internal/provider/backend.go:59-75`) |
| `invalid state_backend "…"` at startup | Unrecognized scheme | Use `pulumi.com` or an `s3://`, `gs://`, `azblob://`, or `file://` URL (`internal/config/config.go:175-194`) |
| `ssh dial … after N attempts` | Cloud-init still running, or `tailscale up` failed on that node | Raise `ssh.ready_timeout` / `ssh.timeout`; check the instance's console output for the cloud-init script (`internal/cloudinit/setup.sh.tmpl`) |
| L7 modes skipped with `endpoint warm-up failed` | fortio never installed, or `tailscale serve` failed on the server node — both are non-fatal in cloud-init | Check the server's cloud-init output; the install and serve steps log `WARN` and continue (`internal/cloudinit/setup.sh.tmpl:33-38,50-58`) |
| A type is re-provisioned even though all its results exist | The `l4-kernel` legacy-path check (see "Resume and interruption") | Narrow `--filter` when re-running a completed tree (`internal/orchestrator/orchestrator.go:918-924`) |
| Dashboard shows no `$/hr` or cost columns for a row | The type or region is not in the curated pricing dataset | `go run ./cmd/pricing-refresh` then re-aggregate; AWS is curated for `us-west-2` (`internal/pricing/pricing.go:34-38,102-124`) |
| Dashboard renders tables but no charts | Chart.js is loaded from a CDN | Give the browser internet access (`website/index.html:275`) |
| Changing `aws.region` or `aws.az` against existing stacks | The networking stack already holds resources in the old region | Treat region and AZ as fixed for the life of the networking stack: run `--cleanup-networking` first, then change them |
