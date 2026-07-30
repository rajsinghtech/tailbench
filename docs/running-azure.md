# Running tailbench on Azure VMs

Operator runbook for the Azure virtual-machine variant. It covers the build, the
three credential systems, the Azure-specific configuration keys, the command
surface (`init`, `plan`, `doctor`, `run`, `status`, `results`, `resume`,
`cleanup`), and the traps that are unique to this variant — most importantly the
SSH public-key resolution, the pre-existing resource group, and the two different
meanings Azure instance-family names carry.

This document is for `tailbench-azure` only. The AKS variant
(`tailbench-azure-k8s`, provider `aks`) shares the location and resource-group
keys but nothing else in this runbook.

## What this binary is

`tailbench-azure` provisions a pair of identical Azure virtual machines per
instance type, joins them to a Tailscale tailnet, runs the configured benchmark
modes over the LAN baseline and over Tailscale, writes one JSON file per instance
type and mode, and destroys the pair before moving on. It contains exactly one
cloud SDK family — `pulumi-azure-native-sdk` — and rejects any other provider
value (`cmd/tailbench/main.go:1740-1745` for the run path,
`cmd/tailbench/main.go:1555-1573` for `doctor`, `internal/plan/build.go:34-42`
for `plan`).

| Property | Value |
|---|---|
| Binary | `./dist/tailbench-azure` |
| Build tags | `azure` (constraint `azure && !k8s && !aws && !gcp`, `cmd/tailbench/azure.go:1`) |
| Provider value | `azure` (`cmd/tailbench/azure.go:10`) |
| Environment | `vm` — not Kubernetes (`cmd/tailbench/main.go:1712-1719`) |
| Result dir | `azure/<family>/results/<type>-<mode>.json` (`internal/result/writer.go:57-71`) |
| Runtime cloud CLI | `az` — used by `run`, **not** by `plan` |

Renaming the executable does not change its identity. `--provider azure` is
accepted and redundant; `--provider aks` or `--provider aws` fails immediately.

### The command surface

Registered in `cmd/tailbench/main.go:149-158`; rendered by
`internal/app/app.go:145-181`.

| Command | Contacts a cloud? | Notes |
|---|---|---|
| `init` | no | Writes `config.yaml` + `.env.example`, refusing to overwrite either (`main.go:163-256`) |
| `plan` | no | Side-effect-free local plan; the default when `dry_run: true` or `--dry-run` |
| `doctor` | no | PATH checks only |
| `doctor --remote` | yes, read-only | `pulumi whoami` and `az account show` |
| `run` (default) | yes | Plans, applies guardrails, confirms, then provisions |
| `status RUN_ID` | no | Reads `.tailbench/runs/<run-id>/manifest.json` |
| `results RUN_ID` | no | Reads the same manifest, prints result paths |
| `resume RUN_ID` | yes | Re-runs only unfinished work from that run |
| `cleanup RUN_ID` | yes | Destroys resources that run owns |
| `cleanup RUN_ID --recover-pulumi-locks` | yes | Also removes locks for that run's recorded stacks |

Output flags are parsed before any command and before configuration:
`--output text|json`, `--log-file PATH`, `--quiet`, plus `--help` and `--version`
(`internal/app/app.go:43-50`, `:199-251`). `--quiet` suppresses progress but not
confirmation prompts or fatal diagnostics (`app.go:316-354`).

Exit codes (`internal/app/types.go:5-13`):

| Code | Meaning |
|---|---|
| 0 | success |
| 1 | run failed |
| 2 | usage or configuration error |
| 3 | prerequisite missing |
| 4 | refused (guardrail, declined confirmation) |
| 5 | recovery-state error |
| 130 | interrupted |

Failures print a fixed block on stderr — code, stage, cause, whether resources
changed, next step, and the run ID and log path when they exist
(`internal/app/render.go:141-170`):

```text
[TB_PREREQUISITE] stage: doctor
cause: one or more prerequisite checks failed
resources changed: no
next: follow each failed check remediation and rerun doctor
```

## Prerequisites

`doctor` replaces the hand-rolled verification this section used to carry. Run it
first:

```bash
./dist/tailbench-azure doctor            # local only, no credentials, no network
./dist/tailbench-azure doctor --remote   # adds read-only authentication checks
```

Local `doctor` checks exactly one thing: that `pulumi` and `az` resolve on `PATH`
(`internal/preflight/preflight.go:84-101`, `:216-235`). The credentials check is
reported as skipped because local commands never read credential values
(`preflight.go:103-113`).

`doctor --remote` additionally requires `OAUTH_CLIENT_ID` and
`OAUTH_CLIENT_SECRET` to be non-empty (`cmd/tailbench/main.go:1492-1500`), then
runs two read-only commands (`internal/preflight/remote.go:44-52`, `:112-117`):

- `pulumi whoami`
- `az account show --query id --output tsv`

Command output is never echoed into diagnostics (`remote.go:22-24`). The Azure
subscription ID is parsed and recorded in the run manifest as the billing
identity (`remote.go:137-142`, `main.go:1047-1061`).

**What `doctor` does not cover.** Check these yourself:

```bash
# Go, only if you are building from source (go.mod declares go 1.26.5)
go version

# The resource group must ALREADY EXIST. tailbench never creates it.
az group show --name "$(grep -A4 '^azure:' config.yaml | grep resource_group | awk '{print $2}')" --output table

# The SSH public key that will be injected into every VM (see "Credentials")
ls -l "$HOME/.ssh/id_ed25519.pub" "$HOME/.ssh/id_rsa.pub" 2>/dev/null

# Tailscale credential *validity* — doctor only checks that values are present
```

`mise install` provisions the toolchain (`mise.toml` pins Go, `pulumi`, and
`azure-cli`). `kubectl` and `helm` are listed there for the `*-k8s` variants and
are not used by this binary.

## Build

```bash
make build-azure          # -> dist/tailbench-azure
```

`make build-azure` runs `go build -tags azure` (`Makefile:90-92`). A bare
`go build ./cmd/tailbench/` fails on purpose: guard files reference an undefined
symbol so a mis-tagged build breaks at compile time instead of producing a binary
with the wrong provider.

Compiling the Pulumi SDKs is memory-intensive. Build one variant at a time;
`make build` does all six sequentially and peaks several GB higher.

`make lint-azure` and `make test-azure` are the matching checks. Neither needs
Azure credentials.

## Credentials

Three independent systems must each be satisfied. Failing any one of them
produces a different error at a different point.

### 1. Tailscale OAuth — `.env`

`config.yaml` declares `env_file: .env` and references `${OAUTH_CLIENT_ID}` /
`${OAUTH_CLIENT_SECRET}`. The file is gitignored and absent from a fresh clone:

```bash
cp .env.example .env      # or: ./dist/tailbench-azure init
$EDITOR .env
```

**A missing env file is now fatal for every command that loads secrets.**
`readEnvFile` failure becomes a `config.LoadError` of kind `environment-file`
(`internal/config/config.go:305-315`), which the command layer maps to
`TB_PREREQUISITE` and exit 3 (`cmd/tailbench/main.go:1418-1428`):

```text
[TB_PREREQUISITE] stage: preflight
cause: load environment file .env: open .env: no such file or directory
next: create the environment file, or remove env_file and supply the required values another way
```

That applies to `run`, `resume`, `cleanup`, and `doctor --remote`. It does **not**
apply to `init`, `plan`, `doctor`, `status`, `results`, or `--version`:
`config.ParseLocalArgs` never opens `env_file` and never expands secret values
(`config.go:256-261`, `:304-334`).

Once the file loads, empty values are still rejected —
`missingRunPrerequisites` names which one is blank (`main.go:1701-1710`), and the
orchestrator repeats the check when it has to create a tailnet
(`internal/orchestrator/orchestrator.go:110-140`, reached at `:346-349`).

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

Nothing local catches this: `plan` never contacts Tailscale, and `doctor
--remote` only checks that the values are non-empty, so the 403 arrives at run
time (`internal/orchestrator/orchestrator.go:375-386`).

**Option B — join the tailnet the OAuth client already belongs to
(`create_tailnet: false` plus `tailscale.tailnet_dns_name`).** Tailbench then
creates and deletes no tailnet at all. It sets the ACL, mints the auth key, and
brings the VMs up on the tailnet you named
(`internal/orchestrator/orchestrator.go:239-261`,
`internal/config/config.go:21-22`, `:93-94`, `:410-411`):

```yaml
tailscale:
  create_tailnet: false
  tailnet_dns_name: example-name.ts.net
  oauth_client_id: ${OAUTH_CLIENT_ID}
  oauth_client_secret: ${OAUTH_CLIENT_SECRET}
  tag: tag:bench
```

Before this key existed, `create_tailnet: false` was not a working
configuration — no auth key was minted and every VM failed with
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
`tb-azure-` sweep is inside the `create_tailnet` branch,
`internal/orchestrator/orchestrator.go:609-623`), and no cleanup policy will ever
delete a tailnet tailbench merely joined (`:263-310`).

**Setting neither is a startup error.** `orchestrator.New` refuses with
`no tailnet configured: set tailscale.create_tailnet: true …, or
tailscale.tailnet_dns_name to benchmark an existing one`
(`internal/orchestrator/orchestrator.go:174-179`) — checked there rather than at
parse time so `plan` and `doctor` keep working on a config that is not ready to
run.

Either way the client must be able to write auth keys, the policy file, and
devices. Under Option A tailbench creates and deletes real tailnets — use
disposable org credentials.

### 2. Azure CLI and the Pulumi azure-native provider

Tailbench sets exactly one Pulumi config value for Azure:
`azure-native:location` (`internal/provider/azure.go:251-252` for the networking
stack, `:425-426` for each pair stack). It sets **no** subscription, tenant, or
credential config. Everything else is resolved by the `pulumi-azure-native`
provider from the ambient environment — in practice an `az login` session with a
default subscription, or the `ARM_*` environment variables that provider reads.
Tailbench contains no code for either path, so the exact precedence is provider
behavior and is not verified here; `doctor --remote` passing is the practical
check, and it records the subscription it saw into the run manifest.

Tailbench also sets `PULUMI_CONFIG_PASSPHRASE=""` for its workspaces
(`azure.go:98-100`), so you do not need to supply one.

There are no credential-wrapping Make targets for this variant. The Makefile
defines `plan-aws`, `doctor-aws`, `doctor-aws-remote`, and `bench-aws`, which
wrap `./dist/tailbench-aws` in `esc run` so AWS credentials come from a
[Pulumi ESC](https://www.pulumi.com/docs/esc/) environment while Tailscale OAuth
still comes from `.env` (`Makefile:26`, `:118-137`). The pattern is not
AWS-specific and needs no tailbench support — `esc run <env> --
./dist/tailbench-azure run …` works the same way — but no Azure targets exist.

**What gets created, and therefore what you must be allowed to do.** Derived from
`SetupNetworking` and `CreatePair`:

| Stack | Resource | Detail |
|---|---|---|
| networking | Virtual network `tailbench-vnet-<run>` | `10.0.0.0/16` (`azure.go:81-89`) |
| networking | Subnet `tailbench-subnet-<run>` | `10.0.1.0/24` (`azure.go:94-99`) |
| networking | Network security group `tailbench-nsg-<run>` | `azure.go:104-109` |
| networking | Security rule `AllowSSH` | TCP 22, priority 1000 (`azure.go:114-126`) |
| networking | Security rule `AllowVNetInternal` | all protocols, VirtualNetwork to VirtualNetwork, priority 1100 (`azure.go:131-143`) |
| networking | Security rule `AllowWireGuardUDP` | UDP 41641, priority 1200 (`azure.go:148-160`) |
| networking | Security rule `AllowIperfPPS` | all protocols, port 15201, priority 1300 (`azure.go:167-179`) |
| networking | Security rule `AllowRelayUDP` | UDP 41642, priority 1400 (`azure.go:185-197`) |
| pair (ephemeral) | Public IP address, one per node | Standard SKU, Static allocation (`azure.go:273-282`) |
| pair | Network interface, one per node | dynamic private IP in the subnet, NSG attached (`azure.go:287-307`) |
| pair | Virtual machine, one per node | size = the instance type under test (`azure.go:312-318`) |
| pair | Managed OS disk, one per VM | 50 GB, `Premium_LRS`, from image (`azure.go:319-328`) |

**Every name is now run-scoped.** `scopedName` appends the run ID's hex suffix
(`internal/provider/run_scope.go:8-36`), so a run gets its own
`tailbench-azure-networking-<suffix>` stack (`azure.go:39-41`), its own
`tailbench-azure-<safeType>-<suffix>` pair stacks (`azure.go:43-46`), and its own
vnet/subnet/NSG/VM names (`azure.go:77-79`, `:250-252`). The networking stack is
therefore **no longer shared across runs**.

Every resource carries `Project=tailbench` and `TailbenchProvider=azure`, plus
`TailbenchRunID` and `TailbenchExpiresAt` when a run ID is set
(`azure.go:48-60`). `TailbenchExpiresAt` is the run's deadline plus one hour
(`main.go:1132-1137`) and exists so leaked resources can be found by tag. Nothing
in tailbench acts on it.

The VM image is Canonical `ubuntu-24_04-lts`, SKU `server`, or `server-arm64` for
ARM sizes (`azure.go:469-489`).

So the identity running tailbench needs, **at the scope of the target resource
group**, permission to create, read, update, and delete virtual networks,
subnets, network security groups and their rules, public IP addresses, network
interfaces, virtual machines, and managed disks — plus permission to list VM SKUs
in the subscription (`az vm list-skus`). This runbook deliberately does not name a
specific built-in Azure role definition; pick one that covers the table above and
no more.

**The resource group is not created by tailbench.** No file in this repository
imports `pulumi-azure-native-sdk/resources`, and neither `SetupNetworking` nor
`CreatePair` creates a resource group — both only reference `p.ResourceGroup` as
the `ResourceGroupName` of resources they create. It must exist before the first
run, and `TeardownNetworking` (`azure.go:437-452`) does not delete it.

### 3. Pulumi state backend

Only Pulumi Cloud needs separate credentials, and tailbench checks for them when
the orchestrator is constructed rather than partway through provisioning
(`internal/provider/backend.go:59-75`, called from
`internal/orchestrator/orchestrator.go:163-165`). Set `PULUMI_ACCESS_TOKEN` — an
entry in `.env` is enough, since the Pulumi CLI inherits tailbench's
environment — or run `pulumi login` beforehand.

Object-store backends (`azblob://`, `s3://`, `gs://`) authenticate through the
same cloud credentials the provider already needs, so they get no separate check.

## Configure config.yaml

`init` generates a safe starting point and never overwrites an existing file
(`cmd/tailbench/main.go:163-256`):

```bash
./dist/tailbench-azure init      # writes config.yaml (0644) and .env.example (0600)
```

The Azure section it emits is `location: eastus`, `resource_group:
tailbench-example`, `ssh_user: azureuser` (`main.go:267-272`), and the rest of
the file is deliberately non-provisioning: `dry_run: true`, `max_cost_usd: 10`,
`max_duration: 45m`, `max_instance_types: 1`, `max_concurrent_resources: 1`,
and `cleanup_policy: always` (`main.go:279-310`). Its `tailscale:` block
defaults to `create_tailnet: true` with a commented-out `tailnet_dns_name`
alternative (`main.go:288-297`). `config.example.yaml` in the repo root is the
same shape and is checked in (`config.example.yaml:13-25`).

The checked-in `config.yaml` is *not* that file: it sets `dry_run: false`,
`family: all`, no guardrail keys at all, and — since `tailnet_dns_name` was
added — `create_tailnet: false` with a **specific tailnet DNS name**
(`config.yaml:26-27`). Treat it as the maintainers' working config, not a safe
default: pointing a run at that tailnet would replace *its* policy file. Set your
own value.

The `init` template takes the other option: `create_tailnet: true`, with the
`tailnet_dns_name` alternative present but commented out
(`main.go:288-297`). That runs only if your OAuth client may create tailnets.
Pick deliberately — see
[Decide first: create a tailnet, or join one](#decide-first-create-a-tailnet-or-join-one).
Configuring neither is refused at startup
(`internal/orchestrator/orchestrator.go:174-179`).

Four Azure keys affect this variant, plus the two tailnet keys and
`ssh.ready_timeout`.

| Key | Default | Used as | What breaks if wrong |
|---|---|---|---|
| `azure.location` | `eastus` (`internal/config/config.go:453`) | `azure-native:location` on both stacks (`azure.go:251`, `:425`); the `--location` passed to `az vm list-skus`; the plan's region | Instance discovery returns nothing or the wrong SKU set; a location without capacity for the size fails at `CreatePair`; prices fall back to `eastus` |
| `azure.resource_group` | `tailbench-rg` (`config.go:454`) | `ResourceGroupName` on every resource | The group is **not created**; a wrong or missing name fails the first Pulumi operation |
| `azure.ssh_user` | `azureuser` (`config.go:455`; the provider re-applies the same default at `azure.go:63-71`) | VM `AdminUsername` and the `authorized_keys` path (`azure.go:378`, `:385`) | Out-of-band SSH uses a different username. Benchmarks are unaffected — see below |
| `azure.ssh_pub_key_file` | unset — tailbench then **generates** a key pair (`config.go:467-492`, `internal/provider/sshkey.go:87-96`) | Injected as the VM's SSH public key (`azure.go:386`) | Set but unreadable, or readable but empty, is now a **fatal config error** — see below |
| `tailscale.create_tailnet` | `false` in the struct default (`config.go:410`), `true` in the `init` template (`cmd/tailbench/main.go:288-297`) | `true` creates and deletes an ephemeral tailnet; needs an org-level client permitted to create tailnets | With `tailnet_dns_name` also empty, startup fails (`internal/orchestrator/orchestrator.go:174-179`); with an under-privileged client the run aborts on HTTP 403 |
| `tailscale.tailnet_dns_name` | empty (`config.go:411`) | With `create_tailnet: false`, joins that tailnet instead of creating one (`internal/orchestrator/orchestrator.go:239-261`) | **Its policy file is replaced wholesale.** Ignored when `create_tailnet: true` |
| `ssh.ready_timeout` | `300` seconds (`config.go:446`) | Per-node bound on waiting for cloud-init to write `/tmp/tailbench-ready` (`internal/orchestrator/orchestrator.go:1085-1106`, `internal/sshclient/sshclient.go:92-121`) | Too low fails healthy but slow VMs; `0` or less waits on `--max-duration` alone, which is the expensive failure this bound exists to prevent |

The guardrail keys (`max_cost_usd`, `max_duration`, `max_instance_types`,
`max_concurrent_resources`, `cleanup_policy`) and `dry_run` are shared with the
other variants and are described under "Run".

`benchmark.modes` matters here because **there is still no `--modes` flag**.
Modes come only from `config.yaml`, and an empty list defaults to `["l4-kernel"]`
(`config.go:487-489`).

### The SSH public key: the silent-fallback trap is gone

Azure now behaves like AWS and GCP, and the two ways this used to fail quietly
have both been closed. Resolution order (`internal/config/config.go:467-492`,
`internal/provider/sshkey.go:87-96`):

1. Keys are read **only on execution paths**. `plan` and local `doctor` pass
   `loadSSHKeys: false` and never inspect files outside the selected config
   (`config.go:249-266`), so a clean plan still proves nothing about the key.
2. If `azure.ssh_pub_key_file` is set and not absolute, it is resolved **relative
   to the directory of the config file**, not the working directory. That is
   unchanged, and it is still the thing most likely to surprise you.
3. A read error on that path is now **fatal**:
   `read azure.ssh_pub_key_file <path>: …`, returned from the parser
   (`config.go:483-486`). It used to be discarded.
4. A file that reads successfully but is empty is also fatal:
   `azure.ssh_pub_key_file <path> is empty` (`config.go:488-490`).
5. **When `azure.ssh_pub_key_file` is unset, your own public key is used**:
   `$HOME/.ssh/id_ed25519.pub`, then `id_rsa.pub`. This is a convenience, not a
   requirement — a candidate that is missing or unreadable is skipped silently,
   because it was never asked for. The chosen source is logged
   (`azure ssh key: using <path> (set azure.ssh_pub_key_file to override)`), so
   "why is my key not on the box" is answerable. Steps 3 and 4 above are what
   makes this safe: an explicitly configured path can no longer fail through to
   this step, which is how a typo previously became an empty key.
6. When neither a configured path nor an operator key is available, the value
   stays empty through parsing
   and the *provider* generates one: `ResolveSSHPublicKey` with the run-scoped
   name `tailbench-<run suffix>` (`internal/provider/azure.go:82-88`). The
   private key is written to `.tailbench/ssh/tailbench-<run suffix>.pem`, mode
   `0600` in a `0700` directory (`internal/provider/sshkey.go:34-67`);
   `.tailbench/` is gitignored (`.gitignore:8`). An existing key file is reused,
   never regenerated, so repeated calls return identical material and no VM is
   replaced on a later `up`.

Both `SetupNetworking` and `CreatePair` resolve the key — the former so a
filesystem error surfaces before any cloud call, the latter because a resumed run
reaches `CreatePair` without a `SetupNetworking` in the same process
(`internal/provider/azure.go:104-115`, `:294-301`). When it generates, the run
logs `using generated SSH key for azure login "azureuser" (private key: <path>)`
(`internal/provider/azure.go:114`).

The net effect: a configured key is used unchanged, a broken configured key stops
the run at parse time with a named path, and no configuration at all yields a key
you can actually find on disk. There is no longer any path that silently puts a
different key — or no key — on the VM.

The value is still stripped from the recovery snapshot — `MarshalRedacted` clears
`AzureSSHPubKey` along with both OAuth values (`internal/config/snapshot.go:24-33`),
and `resume`/`cleanup` re-resolve it from the current environment
(`main.go:362-364`, `:505-507`). With generation, re-resolving is stable: the
same `.tailbench/ssh/` file is read back.

### Is the key pair load-bearing?

**No — not for benchmarks.** Benchmark SSH does not use it at all:

- The orchestrator dials `sshclient.Dial(o.tsnetSrv, <tailscale hostname>,
  "root", ...)` — user `root`, over the tsnet interface
  (`internal/orchestrator/orchestrator.go:1012`, `:1023`, `:1045`).
- `sshclient.Dial` authenticates with `ssh.Password("tailscale")`, a placeholder,
  and `InsecureIgnoreHostKey` (`internal/sshclient/sshclient.go:24-28`). That is
  Tailscale SSH terminating the connection, not sshd checking a key.
- Tailscale SSH is turned on by cloud-init: `tailscale set --ssh`
  (`internal/cloudinit/setup.sh.tmpl:42-43`), gated on `EnableSSH`, which the
  orchestrator sets to `true` for every VM node
  (`internal/orchestrator/orchestrator.go:656-698`).

The injected key pair is your **out-of-band access path only** — SSH to the VM's
public IP as `azure.ssh_user`, which is exactly what you need when cloud-init or
Tailscale never came up and the tsnet path is therefore dead. Password
authentication is disabled on the VM (`azure.go:381`), so that key is the only
way in.

That is precisely why it is now generated rather than scavenged: every run has a
usable out-of-band key on disk whether or not you configured one. See
"A node that never finishes cloud-init" under
[Troubleshooting](#troubleshooting).

## Choose a state backend

`state_backend:` and `--state-backend` work exactly as before. Note that
`--state-backend` is a real flag (`internal/config/config.go:283-284`) but is
**absent from `--help`** (`internal/app/app.go:166-181`) — do not read that
omission as removal.

Empty (the default) keeps Pulumi state in `file://<repo-root>/state/azure`
(`config.go:460`, `BackendURL` in `internal/provider/backend.go:16-21`).

| Value | Where state lives | Consequence |
|---|---|---|
| *(empty)* | `./state/azure`, gitignored | Stacks are visible only from this checkout on this machine. Another machine cannot resume or tear them down, so an interrupted run leaks Azure resources |
| `pulumi.com` | Pulumi Cloud (`https://api.pulumi.com`) | Stacks survive machine swaps. Requires `PULUMI_ACCESS_TOKEN` or `pulumi login`, checked when the orchestrator is built |
| `azblob://…`, `s3://…`, `gs://…` | Object storage | Shared across machines; authenticates through the cloud credentials you already have |
| `file://…` | Explicit local or mounted path | Same isolation as the default, at a path you choose |

Anything else is rejected at parse time with the accepted schemes listed
(`config.go:206-225`).

The choice changes one thing at startup (`orchestrator.go:197-214`): a local
backend gets `state/azure` created with `MkdirAll`; a remote backend does not,
because Pulumi gets scratch space under `.tailbench/pulumi/azure` instead
(`backend.go:30-38`).

**Stale Pulumi locks are no longer swept at startup.** That sweep is gone
(`orchestrator.go:199-203` documents its removal); recovery is now the explicit,
manifest-scoped `cleanup RUN_ID --recover-pulumi-locks` described under
"Teardown".

Stack names are provider-qualified *and* run-qualified —
`tailbench-azure-networking-<suffix>` and `tailbench-azure-<safeType>-<suffix>`
(`azure.go:39-46`) — so one shared backend safely holds every provider's and
every run's stacks.

## Plan (formerly dry run)

`plan` replaces `--dry-run`. `--dry-run` and YAML `dry_run: true` are aliases that
route the default command to `plan` (`internal/app/app.go:273-277`,
`cmd/tailbench/main.go:1395-1411`), so `run --dry-run` plans too.

```bash
./dist/tailbench-azure plan
./dist/tailbench-azure plan --filter '^Standard_F(2|4)s_v2$'
./dist/tailbench-azure plan --output json
```

**`plan` is genuinely side-effect-free, and it no longer needs an authenticated
`az`.** This corrects the previous edition of this runbook. `plan` builds its
config with `config.ParseLocalArgs` (`main.go:1204`), which skips `env_file` and
SSH keys entirely, and it resolves instance types from the **checked-in price
catalog** `internal/pricing/data.json` rather than the cloud
(`internal/plan/catalog.go:11-23`, `internal/plan/build.go:78-87`). `az vm
list-skus` appears only in `internal/provider/azure_instances.go:44-46`, which is
reached only from a real run. Verified: `plan` succeeds on a machine with no `az`
on `PATH` at all.

Two consequences follow from the catalog being the source:

- **The plan can only see instance types the catalog knows.** For Azure `eastus`
  that is the thirteen types in `internal/pricing/data.json`. Anything Azure
  offers that is not in the catalog is invisible to `plan` and to the guardrails,
  but a real run will still enumerate and attempt it.
- **Cost estimates are indicative.** `plan` prints the catalog's provenance line
  and the estimate is the highest-priced selected type times the compute count
  times `max_duration` (`build.go:239-278`).

An invalid `--filter` regex is rejected up front with `TB_PLAN` and exit 2
(`build.go:44-51`). A mode that is not applicable to VMs is reported as such
(`build.go:69-75`), and `tsnet-userspace` is rejected outright as unimplemented
(`build.go:63-68`).

### Use the SKU-group `--family` value, not the per-size one

Azure carries two family strings for one instance type, and only one of them is a
valid `--family` selector for a real run:

- **`dsv4` — the SKU group.** What `az vm list-skus` reports and what
  `ListFamilies` offers (`internal/provider/azure_instances.go:22-27`, `:34-36`),
  derived by `provider.InstanceFamilyGroup` (`internal/provider/families.go:38-71`).
- **`d4sv4` — the per-size family.** What names the result directory, derived by
  `provider.GetInstanceFamily` (`families.go:16-33`). See "The two family values
  are deliberately different" below.

`plan` now accepts **either**: `selectInstances` matches a catalog entry when the
selector equals its `Family` or its `FamilyGroup` (`internal/plan/build.go:158-172`,
fields at `internal/plan/types.go:15-24`, both derived from `internal/provider` in
`internal/plan/catalog.go:12-30` so the plan and the run cannot disagree).

`run` accepts **only the SKU group**, because the selector is passed straight to
`az vm list-skus` (`azure_instances.go:56-59`). So:

| Invocation | What happens |
|---|---|
| `plan --family dsv4` | resolves `Standard_D2s_v4`, `Standard_D4s_v4`, … |
| `run --family dsv4` | works end to end |
| `plan --family d4sv4` | resolves `Standard_D4s_v4` — the per-size family still matches locally |
| `run --family d4sv4` | passes the guardrail, then fails in discovery with `unknown azure family: d4sv4` |

`internal/orchestrator/orchestrator.go:1609-1610` asserts that "family validity is
settled earlier, by the local plan stage; an unknown name never reaches a run".
That is now true for SKU-group names, and still not true for a per-size name,
which the plan accepts and discovery rejects. **Use a group name from the family
table under "Run", or leave `family: all` and scope with `--filter`, which is
matched identically in both layers** (`build.go:168`, `orchestrator.go:584-597`).

A selector that matches nothing produces zero instances and a warning
(`build.go:146-151`), which the guardrail then turns into `no-runnable-work`,
`TB_SAFETY_LIMIT`, exit 4 (`internal/guardrail/guardrail.go:41-47`).

The `dist/tailbench-azure` binary in a stale checkout predates this fix; rebuild
with `make build-azure` before relying on `--family` at all.

## Run

```bash
# Smallest useful smoke test: one size, one pair of VMs
./dist/tailbench-azure run --filter '^Standard_F2s_v2$'

# Same thing without the interactive prompt
./dist/tailbench-azure run --filter '^Standard_F2s_v2$' --max-cost-usd 2 --yes
```

`run` is the default command, so the subcommand word is optional — but writing it
makes the intent obvious in shell history and in the recorded
`manifest.command_line`.

### Order of operations before anything is provisioned

`cmd/tailbench/main.go:897-1044`, in this order:

1. Build the local plan from user-owned configuration only (`:899`).
2. Evaluate guardrails against that plan (`:903-919`). A violation is
   `TB_SAFETY_LIMIT`, exit 4, and **nothing has been loaded or contacted yet** —
   secrets are still unread at this point.
3. Load the execution configuration, including `env_file` and SSH keys
   (`:921-934`), then check that both OAuth values are non-empty (`:935-943`).
4. Print the confirmation block and read `y`/`yes` from stdin, unless `--yes`
   (`:945-977`). A declined or unreadable prompt is `TB_DECLINED`, exit 4.
5. Run the remote preflight — the same checks as `doctor --remote` (`:979-982`).
6. Mint a run ID, write `.tailbench/runs/<run-id>/`, and start the orchestrator
   under `--max-duration` (`:994-1033`).

### Guardrails

Defaults come from `internal/config/config.go:73-82`; the checks are
`internal/guardrail/guardrail.go:41-113`.

| Flag / key | Default | Refuses when |
|---|---|---|
| `--max-cost-usd` / `max_cost_usd` | 10.00 | the plan's estimated upper bound exceeds it, or the selection has no priced instance at all |
| `--max-duration` / `max_duration` | `45m` | never refuses — it becomes the run's `context.WithTimeout` |
| `--max-instance-types` / `max_instance_types` | 1 | the plan has more instance types with pending work than the limit |
| `--max-concurrent-resources` / `max_concurrent_resources` | 1 | the value is below 1 |
| `--cleanup-policy` / `cleanup_policy` | `always` | the value is not `always`, `on-success`, or `manual` |
| `--yes` | off | `--yes` is set without an explicit cost ceiling |

Two of these deserve care:

- **`--yes` requires an explicitly configured ceiling.** `MaxCostSet` is true only
  when `max_cost_usd:` appears in the YAML or `--max-cost-usd` is passed
  (`config.go:336-345`); the built-in 10.00 default does not count
  (`guardrail.go:63-68`). The checked-in `config.yaml` sets no such key, so
  `--yes` against it always fails until you supply one.
- **`max_instance_types` is enforced against the plan only.** No code in
  `internal/orchestrator` reads it. Since the plan's instance list comes from the
  local catalog and the run's comes from `az vm list-skus`, a run can legitimately
  touch more instance types than the guardrail counted. `--filter` is what
  actually bounds the run.

With the checked-in `config.yaml` (`family: all`, no guardrail keys), a bare
`./dist/tailbench-azure` is refused: the plan reports thirteen types with a
pending `l7-serve-h2`, against a limit of one.

### Cost scoping

Each selected instance type provisions **two VMs of that size**, each with a
50 GB Premium SSD and a Static Standard public IP, held for the duration of every
configured mode. The forwarding and relay modes add a **third** VM of the same
size (`internal/plan/build.go:208-210`, `:219-228`).

Scope down with a SKU-group `--family` value (the left column of the table below)
or with `--filter`. `--filter` is the sharper tool because Azure families span a
wide vCPU range.

### Azure family names

The `--family` values `run` accepts are neither Azure marketing names nor VM size
prefixes — they are the SKU family strings that `az vm list-skus` reports,
lowercased with the `standard` prefix and `Family` suffix stripped
(`internal/provider/azure_instances.go:22-27`, `:34-36`). The rightmost column is
the *other* family value: the per-size string that names the result directory.
`plan` accepts either string; `run` accepts only the left column.

| `run --family` (SKU group) | `az vm list-skus` family | Result dir seen in this repo |
|---|---|---|
| `dsv5` | `standardDSv5Family` | — |
| `dasv5` | `standardDASv5Family` | — |
| `dpsv6` | `StandardDpsv6Family` | `d2psv6`, `d4psv6` |
| `dsv4` | `standardDSv4Family` | `d2sv4`, `d4sv4` |
| `fsv2` | `standardFSv2Family` | `f2sv2` … `f48sv2` |
| `fasv6` | `StandardFasv6Family` | `f2asv6`, `f4asv6`, `f8asv6` |
| `falsv6` | `StandardFalsv6Family` | — |
| `famsv6` | `StandardFamsv6Family` | — |
| `fasv7` | `StandardFasv7Family` | — |
| `falsv7` | `StandardFalsv7Family` | — |
| `famsv7` | `StandardFamsv7Family` | — |
| `esv4` | `standardESv4Family` | — |

Empty means this checkout has no example. Family membership is decided by Azure,
not by tailbench.

Two sets of sizes are filtered out of every listing
(`azure_instances.go:66`):

- names containing a digit-dash-digit sequence, i.e. constrained-vCPU SKUs;
- names containing `is_v`.

vCPU count is parsed as the first run of digits after stripping `Standard_`
(`azure_instances.go:76-83`), and the listing is sorted ascending by vCPUs
(`:72`), so a family runs smallest-first.

### The two family values are deliberately different

`GetInstanceFamily` keeps the vCPU digits on Azure — `Standard_D4s_v4` maps to
`d4sv4` (`internal/provider/families.go:16-33`; asserted by
`internal/provider/families_test.go:13-14`). That is what makes the result path,
and the committed tree confirms it: `azure/d2sv4/`, `azure/d4sv4/`,
`azure/f16sv2/`. Those directories are unchanged and must stay that way.

`InstanceFamilyGroup` (`families.go:38-71`) strips only the first run of digits —
the vCPU count — and keeps the version suffix, giving the group-wide selector:
`d4sv4` → `dsv4`, `f16sv2` → `fsv2`, `d2psv6` → `dpsv6`. On AWS and GCP it
returns the same string as `GetInstanceFamily`; Azure is the only exception, and
`families_test.go:30-77` asserts both the mapping and that the two values differ
on Azure.

**The quota-skip defect is fixed.** The orchestrator now keys the skip map on
`InstanceFamilyGroup`, not on the per-size family
(`internal/orchestrator/orchestrator.go:612-617`, `:744-746`), so a quota denial
on `Standard_D2s_v4` marks `dsv4` skipped and the run stops attempting
`Standard_D4s_v4`, `Standard_D8s_v4`, and the rest. "A quota error skips the rest
of the family" is now true on Azure. Result paths are unaffected.

### Valid modes for this binary

`tailbench-azure` is a VM binary, so `ModeAppliesTo(mode, "vm")` decides
(`internal/benchmark/modes.go:43-53`). Kubernetes-only modes are rejected in two
places, both before any cloud call: `plan`/`run` mark them inapplicable and the
guardrail refuses with `incompatible-mode` (`internal/plan/build.go:69-75`,
`internal/guardrail/guardrail.go:48-62`), and the orchestrator's
`validateWorkloadConfig` rejects them at construction
(`internal/orchestrator/k8s_disabled.go:16-23`).

| Mode | This binary |
|---|---|
| `l4-kernel` | accepted (default when `modes` is empty) |
| `l4-userspace` | accepted |
| `l7-serve-h1`, `l7-serve-h2` | accepted (VM-only) |
| `forward-pps-exit` | accepted (VM-only, opt-in, 3 nodes) |
| `relay-throughput` | accepted (VM-only, opt-in, 3 nodes) |
| `tsnet-userspace` | **rejected** — a valid name, but unimplemented (`build.go:63-68`) |
| `l4-lb` | **rejected** — Kubernetes-only |
| `l7-ingress-h1`, `l7-ingress-h2` | **rejected** — Kubernetes-only |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | **rejected** — Kubernetes-only |

A name that is not in `validModes` at all fails earlier still, with the valid list
(`orchestrator.go:146-154`, `modes.go:8-26`).

### The opt-in three-node modes

`forward-pps-exit` and `relay-throughput` are commented out in `config.yaml` by
default. Both make `CreatePair` append a third VM — public IP, NIC, VM, and disk,
at the same size as the pair (`internal/provider/azure.go:262-264`,
`internal/orchestrator/orchestrator.go:642-643`). Budget for 1.5x the VM cost of a
normal run; `plan` accounts for it (`internal/plan/build.go:208-210`).

- `forward-pps-exit` — the router advertises `--advertise-exit-node`
  (`internal/cloudinit/setup.sh.tmpl:41`); the ACL auto-approves it, and the
  client is pointed at it with `benchmark.SetExitNode`
  (`internal/benchmark/tailscale.go:24-31`). Traffic reaches the sink on its
  **public** IP through NSG rule `AllowIperfPPS` (port 15201).
- `relay-throughput` — the router advertises `--relay-server-port` on UDP 41642
  (`internal/benchmark/relay.go:14-18`, `setup.sh.tmpl:46`), opened by NSG rule
  `AllowRelayUDP`. Requires Tailscale >= 1.86 on all three nodes.

Note that the router is provisioned based on **pending** modes, not configured
ones (`orchestrator.go:642-643`), so a rerun does not pay for a router whose
result already exists.

The router is the device under test; its type, vCPUs, and price land on the
result. Topology, sweep methodology, verification steps, and caveats are in
[docs/cost-forward-pps-plan.md](cost-forward-pps-plan.md).

## What happens during a run

Per provider, in order (`internal/orchestrator/orchestrator.go:189-829`):

1. **Backend prep.** A local backend gets `state/azure` created; a remote backend
   is logged and skipped. No lock sweep (`:197-214`).
2. **Tailnet**, one of two branches (`:230-430`). With `create_tailnet: true`, a
   manifest-managed run **never reuses** `.tailbench/tailnet.json` and never
   writes it — reusing a global tailnet would make cleanup ownership ambiguous
   (`:276-283`, `:359-361`) — so it creates `tailbench-<run-suffix>` (`:314-319`)
   and swaps in the per-tailnet OAuth client the API returned (`:389-390`). With
   `create_tailnet: false` plus `tailnet_dns_name`, nothing is created and the
   configured client is used throughout (`:239-261`).

   Both branches then apply the ACL — **replacing the tailnet's policy file**
   (`:250-253`, `:413-418`) — enable HTTPS when `needsTailnetHTTPS()` is true,
   mint an auth key, and bring up the orchestrator's own tsnet node with state
   under `.tailbench/runs/<run-id>/tsnet` (`:434-453`). For this binary
   `needsTailnetHTTPS()` reduces to "is an `l7-serve-*` mode configured", since
   there are no K8s providers (`:1606-1615`).
3. **Networking stack.** `SetupNetworking` resolves the SSH public key first —
   generating and persisting one under `.tailbench/ssh/` when
   `azure.ssh_pub_key_file` configured none (`azure.go:109-115`) — then upserts
   `tailbench-azure-networking-<suffix>`: vnet, subnet, NSG, five security rules
   (`azure.go:104-283`).
4. **Stale device cleanup.** Tailnet devices whose name starts with `tb-azure-`
   or `tailbench-azure-operator` are removed — but **only under
   `create_tailnet: true`**; the sweep is inside that branch (`:609-623`).
5. **Instance discovery.** `az vm list-skus --location <location>` once per
   process, cached in memory across families
   (`internal/provider/azure_instances.go:38-53`) and on disk at
   `.tailbench/instances/azure-<family>.json` (`:1587-1592`). Transient failures
   are retried up to three times per family (`:1623-1646`). **With the default
   `cleanup_policy: always` the disk cache is never read** — see "Teardown".
6. **Per instance type**, smallest vCPU count first:
   - Skip the whole SKU group if a previous size in it hit quota (`:612-617`).
   - Compute pending modes from files on disk; skip the type entirely if none
     remain (`:625-629`).
   - Render cloud-init per node, with the derived Tailscale hostnames
     `tb-azure-s-<safeType>-<suffix>`, `-c-`, `-r-` (`:632-636`). These are
     Tailscale device names and are distinct from the Azure VM resource names
     `tb-<safeType>-server-<run>` etc. (`azure.go:250-252`).
   - `DestroyPair` as a pre-cleanup, then `CreatePair` — public IP, NIC, VM, and
     OS disk per node — in stack `tailbench-azure-<safeType>-<run>`
     (`:701-758`). `CreatePair` now runs with `optup.Refresh()`
     (`azure.go:382`).
   - SSH to each node over tsnet as `root`, log `waiting for cloud-init ready`,
     then wait for `/tmp/tailbench-ready`, which cloud-init touches last —
     bounded per node by `ssh.ready_timeout`, default 300s (`:1084-1109`,
     `internal/sshclient/sshclient.go:92-121`, `setup.sh.tmpl:60`). The bound is
     new; the wait used to inherit only `--max-duration`.
   - Run each pending mode, writing its result file immediately (`:1117-1131`,
     `:1345`).
   - Destroy the pair if the cleanup policy allows (`:785-807`).
   - Refresh the Tailscale auth key if it is older than 30 minutes (`:809-820`).
7. **Aggregate.** `result.Aggregate` regenerates `website/data.generated.js`
   (`:823-826`).
8. **Deferred teardown.** Networking (`:494-529`) and the tailnet (`:229-274`)
   are destroyed on the way out, subject to the cleanup policy.

Every externally visible step is recorded in the run manifest before and after it
happens (`:947-965`, `internal/lifecycle/lifecycle.go:498-563`), which is what
makes an interrupted run recoverable.

Cloud-init installs iperf3, mtr, jq, and Tailscale; enables IP forwarding; sets
BBR, `fq`, and large socket buffers; enables UDP GRO forwarding on the primary
NIC; and installs fortio when an `l7-serve` mode is configured
(`internal/cloudinit/setup.sh.tmpl`).

## Generate the report

A successful run aggregates automatically — `runProvider` calls
`result.Aggregate(o.cfg.RootDir)` before it returns
(`internal/orchestrator/orchestrator.go:823`). Regenerate by hand after editing,
deleting, or copying result files:

```bash
# MUST run from the repo root
go run ./cmd/aggregate/
```

`cmd/aggregate/main.go:10-17` uses `os.Getwd()` as the root, and
`result.Aggregate` walks `gcp`, `aws`, `azure`, `gke`, `eks`, `aks` beneath it
(`internal/result/aggregator.go:15-21`). Run it from anywhere else and it walks
the wrong tree and silently produces nothing.

To see which files a specific run wrote, use its manifest instead of guessing:

```bash
./dist/tailbench-azure results tb_2026-07-28_a1b2c3
./dist/tailbench-azure results tb_2026-07-28_a1b2c3 --output json
```

`results` prints instance type, mode, work status, and result path per work item
(`internal/summary/report.go:170-249`). It reads only local state.

**Prices are injected at aggregation, not stored.** `result.Aggregate` looks up
each record in `internal/pricing` and adds a synthetic `price_per_hour`
(`internal/result/aggregator.go:60-62`), so re-pricing all history is just a
re-aggregate:

```bash
go run ./cmd/pricing-refresh   # regenerate internal/pricing/data.json
go run ./cmd/aggregate/        # re-inject price_per_hour
```

The embedded Azure dataset currently covers **`eastus` only**, and `eastus` is
also Azure's canonical fallback region (`internal/pricing/pricing.go:37-44`). A
run in another location still resolves a price, from `eastus` — treat those
numbers as indicative, not as your bill. The same dataset is what `plan` costs
against.

View the dashboard by opening `website/index.html`. It loads
`data.generated.js` through a plain `<script src>` so `file://` works, but it also
pulls Chart.js from a CDN (`website/index.html:275`) — charts stay blank without
internet access. The tables still render.

## Resume and interruption

There are now **two** resume mechanisms, and they operate at different levels.

### Filesystem-driven per-mode resume (unchanged in principle, one bug fixed)

Work is skipped if and only if the result JSON already exists:

- `pendingModesForInstance` skips an instance type when every applicable mode
  already has `azure/<family>/results/<type>-<mode>.json`
  (`internal/orchestrator/orchestrator.go:1470-1491`).
- `runModeLoop` re-checks per mode before running it (`:1122-1127`).
- `l4-kernel` additionally honors a legacy no-suffix path,
  `azure/<family>/results/<type>.json` (`:1485-1487`).

**The legacy path is now a fallback, not a second requirement.** Previously
`l4-kernel` needed *both* files, and since no legacy file exists anywhere in the
committed tree, `l4-kernel` was permanently pending: every rerun provisioned a
pair, skipped every mode inside `runModeLoop`, and destroyed it again. Either file
now satisfies the check (`:1461-1469` documents the fix). This also removes the
contradiction where `plan` reported an instance as fully satisfied while `run`
provisioned it anyway.

**To re-measure something, delete its result file.** Nothing else forces a rerun.

### Manifest-driven run resume

Every `run` writes a versioned manifest under `.tailbench/runs/<run-id>/`
(`internal/runstate/store.go:25-32`, `:98-121`), with run IDs of the form
`tb_YYYY-MM-DD_<hex>` (`store.go:64-73`, pattern at `:22`):

| File | Contents |
|---|---|
| `manifest.json` | run status, work items, resource inventory, failures (`internal/runstate/types.go:111-141`) |
| `events.jsonl` | append-only step and state-change log |
| `plan.json` + `plan_hash` | the approved plan, hashed (`lifecycle.go:92-98`) |
| `effective-config.redacted.yaml` | the effective config with OAuth values and the SSH key stripped (`internal/config/snapshot.go:24-33`) |
| `summary.json` | final outcome and failure list |
| `logs/tailbench.log` | redacted progress log |

Inspect it locally — neither command contacts a cloud
(`cmd/tailbench/main.go:1329-1377`):

```bash
./dist/tailbench-azure status tb_2026-07-28_a1b2c3
./dist/tailbench-azure status tb_2026-07-28_a1b2c3 --output json
```

`status` prints benchmark and cleanup outcomes, whether the run is recoverable,
work counts by state, the tracked-resource count, classified failures, and the
exact `status` / `resume` / `cleanup` commands to use next
(`internal/summary/report.go:48-144`).

Then continue only the unfinished work:

```bash
./dist/tailbench-azure resume tb_2026-07-28_a1b2c3
```

`resume` reloads the redacted snapshot, re-resolves current secrets, rebuilds the
selection as an exact `--filter` over the unfinished instance types, restricts
modes to the unfinished ones, and raises `max_instance_types` to cover them
(`main.go:345-395`, `:861-895`). It refuses when the run has no recoverable work
(`internal/lifecycle/lifecycle.go:198-201`) and when the manifest's provider does
not match the binary (`main.go:334-344`). It prompts for confirmation unless
`--yes`.

Both mechanisms are complementary: the manifest decides *which instance types and
modes to attempt*, and the on-disk result files still decide *whether each mode
actually runs*.

### Interruption

Ctrl-C is clean. `main` runs under a SIGINT/SIGTERM-cancelable context
(`cmd/tailbench/main.go:66-68`) and the instance loop checks `ctx.Err()` each
iteration (`orchestrator.go:604-607`). The manifest is marked `interrupted` and
recoverable (`lifecycle.go:624-639`), and the process exits 130 with
`TB_INTERRUPTED` (`main.go:1299-1301`). `--max-duration` expiring produces the
same recoverable state but code `TB_DURATION_LIMIT` and exit 1 (`:1295-1298`).

A VM pair that was mid-benchmark is left running. Because resources are recorded
in the manifest as they are created (`lifecycle.go:438-496`), `cleanup RUN_ID`
can destroy them from any checkout that can reach the same state backend.

Caches that survive between runs:

| Path | Contents | Invalidated by |
|---|---|---|
| `.tailbench/runs/<run-id>/` | manifest, events, plan, redacted config, log | manual removal |
| `.tailbench/instances/azure-<family>.json` | instance list from `az vm list-skus` | any run whose cleanup policy is not `manual` (`orchestrator.go:1599-1607`) |
| `.tailbench/tailnet.json` | tailnet reuse cache — **not written or read by manifest-managed runs** (`orchestrator.go:276-283`, `:359-361`) | `--cleanup-networking` on a legacy, non-manifest invocation |
| `.tailbench/pulumi/azure` | Pulumi workspace scratch, remote backends only | manual removal |
| `state/azure` | local Pulumi state, when no remote backend is set | manual removal |

The family is part of the instance-cache key on purpose: a cache populated by
`--family fsv2` must not later satisfy `--family all`.

## Teardown

Three different things now control teardown. Understand all three before assuming
something was cleaned up.

### `--cleanup-policy` governs the current run

`always` (the default), `on-success`, or `manual`
(`internal/config/config.go:79-82`, checked in
`internal/orchestrator/orchestrator.go:841-852`):

| Policy | Pair destroyed after each type | Networking + tailnet destroyed |
|---|---|---|
| `always` | yes | yes |
| `on-success` | only if no benchmark error | only if no benchmark error |
| `manual` | no | no |

**`--cleanup-networking` is now effectively an alias for `--cleanup-policy
always`.** It forces the policy (`config.go:385-387`), and the internal
`CleanupNetworking` flag is derived as `cleanupPolicy != manual`
(`config.go:457`). The practical consequences are easy to miss:

- With the default policy, **every run destroys its networking stack and deletes
  its tailnet on the way out** (`orchestrator.go:229-274`, `:494-529`). Since
  those resources are run-scoped now, that is correct behavior rather than a
  surprise — but it is a change from the old "networking is long-lived, reused
  across runs" model.
- With the default policy, **the instance cache is bypassed on every run**, so
  `az vm list-skus` runs each time (`orchestrator.go:1599-1607`).
- Use `--cleanup-policy manual` to keep a topology alive for debugging. Nothing
  is destroyed, and you own the cleanup.

`azure.resource_group` is never created or deleted by tailbench under any policy.

### `cleanup RUN_ID` destroys what a named run owns

```bash
./dist/tailbench-azure cleanup tb_2026-07-28_a1b2c3
./dist/tailbench-azure cleanup tb_2026-07-28_a1b2c3 --yes
```

It reads the manifest, **refuses unless every uncleaned resource names this run as
its cleanup owner with certain ownership** (`cmd/tailbench/main.go:472-487`),
prompts, and then destroys each recorded instance type's pair, tears down
networking, and deletes the run's tailnet (`main.go:642-731`). It requires the
same OAuth values as a run and passes the same remote preflight.

This is the path to use after an interrupt, a duration-limit stop, or a
`--cleanup-policy manual` run.

### `cleanup RUN_ID --recover-pulumi-locks` replaces the startup lock sweep

```bash
./dist/tailbench-azure cleanup tb_2026-07-28_a1b2c3 --recover-pulumi-locks
```

Stale locks are what produce `exit status 255` on every subsequent Pulumi
operation after a crashed run. They are no longer swept automatically. The
explicit path (`main.go:522-539`, `:796-849`,
`internal/recovery/pulumi_locks.go`) is deliberately narrow:

- it looks only under `<state-dir>/azure/.pulumi/locks` (`pulumi_locks.go:112-138`);
- it matches only stack names the manifest recorded for this run
  (`main.go:768-787`, `pulumi_locks.go:140-147`), and errors if the manifest
  recorded none;
- it refuses symlinks and non-regular files, and refuses any path outside that
  root (`pulumi_locks.go:40-49`, `:80-96`);
- the confirmation prompt lists every file it will remove (`main.go:555-564`).

On a remote backend there are no local locks; use `pulumi cancel` on the stack.

### Verify nothing leaked

`DestroyPair` **now returns its errors** — the previous edition of this runbook
said it always returned `nil`, and that is no longer true. Failures from
`SelectStack` (other than a 404), `Cancel`, `Destroy`, and `RemoveStack` are all
wrapped and returned (`internal/provider/azure.go:413-435`). `optdestroy.ContinueOnError()`
is still set, so Pulumi pushes past individual resource failures rather than
stopping at the first one, but the overall failure now reaches the orchestrator,
which logs it and records a cleanup failure (`orchestrator.go:797-806`). A run
whose benchmark succeeded but whose cleanup failed ends as `partial` with
`TB_CLEANUP_FAILED` (`main.go:1291-1294`).

Verify anyway:

```bash
# Anything still tagged Project=tailbench in the group
az resource list --resource-group <group> --tag Project=tailbench --output table

# Narrower: just one run's resources
az resource list --resource-group <group> --tag TailbenchRunID=tb_2026-07-28_a1b2c3 --output table

# Stacks Pulumi still knows about
pulumi stack ls          # add --cwd state/azure for the default local backend
```

Public IP addresses and managed disks are the usual survivors of a partial
destroy, and both bill while idle.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `[TB_PREREQUISITE] … load environment file .env` | `env_file:` points at a file that does not exist. This is fatal now, on `run`, `resume`, `cleanup`, and `doctor --remote` (`internal/config/config.go:305-315`) | `cp .env.example .env`, or run `init`, or remove `env_file:` |
| `[TB_PREREQUISITE]` naming `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` | The file loaded but a value is blank (`cmd/tailbench/main.go:1701-1710`) | Fill both in `.env` or export them |
| `[TB_PREREQUISITE] … az: executable not found on PATH` | Local `doctor` PATH check (`internal/preflight/preflight.go:84-101`) | `mise install`, or install the Azure CLI |
| `[TB_PREREQUISITE] … az authentication check failed` | `doctor --remote` ran `az account show` and it failed (`internal/preflight/remote.go:112-117`) | `az login`, then rerun `doctor --remote` |
| `[TB_SAFETY_LIMIT] … no-runnable-work` | The plan selected nothing with pending work — a `--family`/`--filter` that matches no catalog entry, or every result file already exists (`internal/guardrail/guardrail.go:41-47`) | Run `plan` to see what resolved; check the family name against the table under "Run"; delete a result file to force a rerun |
| `[TB_SAFETY_LIMIT] … max-instance-types` | More pending types than the limit; the default is 1 (`guardrail.go:70-80`) | Narrow with `--filter`, or raise `--max-instance-types` deliberately |
| `[TB_SAFETY_LIMIT] … noninteractive-cost-required` | `--yes` without an explicit ceiling; the built-in 10.00 default does not count (`guardrail.go:63-68`) | Add `--max-cost-usd N`, or set `max_cost_usd:` in the config |
| `[TB_SAFETY_LIMIT] … incompatible-mode` | `benchmark.modes` contains `l4-lb`, `l7-ingress-*`, or a `*-k8s` mode (`guardrail.go:48-62`) | Remove them, or use `tailbench-azure-k8s` |
| `[TB_CONFIG] … invalid state_backend` | The value is not `pulumi.com` and has no accepted scheme (`config.go:206-225`) | Use `pulumi.com`, or a `file://`, `s3://`, `gs://`, or `azblob://` URL |
| `[TB_CONFIG] … requested provider "x", but this binary was compiled for provider "azure"` | `--provider` or `providers:` names something else. Renaming the binary changes nothing | Use `azure`, or leave `providers: []` |
| `[TB_PLAN] … invalid instance filter` | `--filter` is not a valid Go regular expression (`internal/plan/build.go:44-51`) | Fix the regex; it is matched against the full type including `Standard_` |
| `[TB_PLAN] … benchmark mode "tsnet-userspace" is not implemented` | The mode name is recognized but unimplemented (`build.go:63-68`) | Remove it from `benchmark.modes` |
| `[TB_RECOVERY] … invalid run ID` | The argument does not match `tb_YYYY-MM-DD_<hex>` (`internal/runstate/store.go:22`) | Copy the run ID from the run's final report or from `.tailbench/runs/` |
| `[TB_RECOVERY] … run not found` | No manifest under `.tailbench/runs/<run-id>/` in the current working directory | Run from the same directory the run started in; `.tailbench/` is not shared across checkouts |
| `[TB_RECOVERY] … lacks certain cleanup ownership` | The manifest has a resource this run does not provably own (`cmd/tailbench/main.go:472-487`) | Clean it up out of band; tailbench refuses to destroy resources it cannot attribute |
| `unknown azure family: d4sv4` during a run | A per-size family name reached `az vm list-skus`, which only accepts SKU-group names. `plan` accepts both, so this survives the guardrail (`internal/provider/azure_instances.go:56-59`) | Use the SKU-group name (`dsv4`) from the table under "Run", or `--filter` |
| Pulumi fails immediately with a resource-group-not-found error | `azure.resource_group` does not exist. Tailbench never creates it | Create the group first, or point `azure.resource_group` at an existing one |
| `[TB_CONFIG] … read azure.ssh_pub_key_file <path>: …` | `azure.ssh_pub_key_file` is set but the file cannot be read. This used to be swallowed and silently replaced by a `~/.ssh` scan; an explicitly configured path is now fatal on failure (`config.go:483-486`), so it can never fall through to the operator-key step | Use an absolute path, or a path relative to the **config file's** directory; confirm it is readable. Or unset the key and let tailbench generate one |
| `[TB_CONFIG] … azure.ssh_pub_key_file <path> is empty` | The file exists but contains only whitespace (`config.go:488-490`) | Point it at a real `.pub` file, or unset the key |
| `no tailnet configured: set tailscale.create_tailnet: true …`, at startup | Neither `create_tailnet: true` nor `tailscale.tailnet_dns_name` is set. Not the `init` default any more — `init` now writes `create_tailnet: true` (`cmd/tailbench/main.go:288-297`) | Set one of them (`internal/orchestrator/orchestrator.go:174-179`) |
| `create tailnet: tailnet creation failed (HTTP 403): {"message":"actor does not have permission to create tailnets"}` | The OAuth client cannot create tailnets. Scope `all` on a tailnet-scoped client is **not** enough; this needs an org-level permission that is not a published scope | Use an org-level client that may create tailnets, or switch to `create_tailnet: false` plus `tailscale.tailnet_dns_name` (`internal/tailnet/tailnet.go:86-88`) |
| The joined tailnet's ACL rules are gone after a run | `SetupACL` replaces the whole policy file with the allow-all benchmark policy (`internal/tailnet/tailnet.go:150-152`, `:160-228`) | Restore from the policy-file version history in the admin console, and point `tailnet_dns_name` at a dedicated benchmark tailnet |
| Devices named `tb-azure-…` pile up on a joined tailnet | Stale-device cleanup only runs under `create_tailnet: true` | Delete them in the admin console (`internal/orchestrator/orchestrator.go:609-623`) |
| `exit status 255` on every Pulumi operation | Stale lock from a crashed run. There is no startup sweep any more (`orchestrator.go:199-203`) | `cleanup RUN_ID --recover-pulumi-locks`; on a remote backend run `pulumi cancel` |
| Run stops on a size with `QuotaExceeded`, `SkuNotAvailable`, `AllocationFailed`, `PublicIPCountLimitReached`, or `sufficient capacity` | `IsQuotaError` matched (`azure.go:491-502`) and marked the whole SKU group skipped (`orchestrator.go:744-746`) | Request quota, pick another location, or `--filter` to a different family |
| Larger sizes in a family are skipped after one quota failure | Expected, and now correct. `InstanceFamilyGroup` keys the skip on `dsv4`, not `d4sv4` (`internal/provider/families.go:38-71`) | Nothing to fix |
| `--family dsv4` selects sizes but results land under `azure/d2sv4/` and `azure/d4sv4/` | Expected. `GetInstanceFamily` is per size and makes the result path; `InstanceFamilyGroup` and `ListFamilies` are group-wide and make the selector (`internal/provider/families.go:16-71`) | Nothing to fix |
| SSH to `tb-azure-s-…` never connects | Benchmark SSH is **Tailscale SSH as `root`** over tsnet (`internal/sshclient/sshclient.go:20-28`). The node never joined the tailnet, or cloud-init failed before `tailscale set --ssh` | See "A node that never finishes cloud-init" below |
| Run hangs at "waiting for cloud-init ready", or `server ready: cloud-init did not finish within 5m0s` | `/tmp/tailbench-ready` is touched only at the very end of `setup.sh.tmpl` (`:60`); anything earlier that blocks or fails leaves it absent | See "A node that never finishes cloud-init" below (`internal/sshclient/sshclient.go:109-116`) |
| `az vm list-skus` runs on every single run | Expected with `cleanup_policy: always`, which bypasses the disk cache (`orchestrator.go:1599-1607`) | Use `--cleanup-policy manual` if you want the cache, and accept that nothing is torn down |
| `plan` shows fewer instance types than Azure offers | `plan` resolves from `internal/pricing/data.json`, not from Azure (`internal/plan/catalog.go:11-23`) | `go run ./cmd/pricing-refresh` to widen the catalog; a real run still enumerates from `az` |
| Dashboard shows no price, or a price for the wrong region | The embedded Azure dataset covers `eastus` only; other locations fall back to it (`internal/pricing/pricing.go:37-44`) | `go run ./cmd/pricing-refresh` then `go run ./cmd/aggregate/`; treat values as indicative |
| Dashboard tables render but charts are blank | Chart.js loads from a CDN (`website/index.html:275`) | Open it with internet access |
| `go run ./cmd/aggregate/` prints `aggregated` but nothing changed | It uses `os.Getwd()` as the root (`cmd/aggregate/main.go:10-17`) | Run it from the repo root |
| Exit 1 with no output at all | Pulumi's `logging` package `init()` calls `slog.SetDefault`, which redirects the standard logger to a discarding handler. `main.restoreStandardLogger()` undoes it and must run first (`cmd/tailbench/main.go:52-61`) | If you are seeing this in a modified tree, confirm `restoreStandardLogger()` is still the first statement in `main()` |

### A node that never finishes cloud-init

The failure looks like a stalled run: the log stops at
`waiting for cloud-init ready` and nothing else happens. Tailscale SSH is not
available yet — that is the whole problem — so the only way in is the VM's public
IP and the SSH key. Password authentication is disabled on the VM
(`azure.go:381`), so the key is the only credential.

```bash
ssh -i .tailbench/ssh/<name>.pem azureuser@<public-ip>
sudo cloud-init status --long
sudo tail -40 /var/log/cloud-init-output.log
```

- Use your own private key instead when `azure.ssh_pub_key_file` is set. With it
  unset, `<name>` is `tailbench-<run suffix>` and the run logs the exact path
  (`internal/provider/azure.go:114`).
- The login is `azure.ssh_user`, default `azureuser`
  (`internal/config/config.go:455`, `internal/provider/azure.go:62-71`).
- The public IP is not printed by the run:

  ```bash
  az vm list-ip-addresses --resource-group tailbench-rg \
    --query '[].{name:virtualMachine.name,ip:virtualMachine.network.publicIpAddresses[0].ipAddress}' \
    --output table
  ```

- The NSG must allow 22/tcp inbound; `SetupNetworking` creates an `AllowSSH`
  rule (`internal/provider/azure.go:151-163`).

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
`--max-duration`, so VMs billed for the full run window with no diagnosis.
