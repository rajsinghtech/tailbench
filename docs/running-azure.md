# Running tailbench on Azure VMs

Operator runbook for the Azure virtual-machine variant. It covers the build,
the three credential systems, the Azure-specific configuration keys, and the
traps that are unique to this variant — most importantly the SSH public-key
resolution, the pre-existing resource group, and Azure instance-family naming.

This document is for `tailbench-azure` only. The AKS variant
(`tailbench-azure-k8s`, provider `aks`) shares the location and resource-group
keys but nothing else in this runbook.

## What this binary is

`tailbench-azure` provisions a pair of identical Azure virtual machines per
instance type, joins them to an ephemeral tailnet, runs the configured
benchmark modes over the LAN baseline and over Tailscale, writes one JSON file
per instance type and mode, and destroys the pair before moving on. It contains
exactly one cloud SDK family — `pulumi-azure-native-sdk` — and rejects any other
provider value at startup (`cmd/tailbench/main.go:72-77`).

| Property | Value |
|---|---|
| Binary | `./dist/tailbench-azure` |
| Build tags | `azure` (constraint `azure && !k8s && !aws && !gcp`, `cmd/tailbench/azure.go:1`) |
| Provider value | `azure` (`cmd/tailbench/azure.go:10`) |
| Environment | `vm` — not Kubernetes (`internal/orchestrator/orchestrator.go:412-415`) |
| Result dir | `azure/<family>/results/<type>-<mode>.json` (`internal/result/writer.go:57-70`) |
| Runtime cloud CLI | `az` |

Renaming the executable does not change its identity. `--provider azure` is
accepted and redundant; `--provider aks` or `--provider aws` fails immediately.

## Prerequisites

| Tool | Needed for | Pin |
|---|---|---|
| Go | building from source only | `go.mod` `go 1.26.5`; `mise.toml` matches |
| `pulumi` CLI | every run — the Automation API shells out to it | `mise.toml` `pulumi = "3"` |
| `az` CLI | every run **and `--dry-run`** — instance discovery is `az vm list-skus` (`internal/provider/azure_instances.go:44-46`) | `mise.toml` `azure-cli = "latest"` |
| Tailscale OAuth client | any run that provisions (not `--dry-run` / `--version`) | see `.env.example` |

`mise install` provisions the toolchain. `kubectl` and `helm` are listed in
`mise.toml` for the `*-k8s` variants and are not used by this binary.

Unlike AWS and GCP, Azure instance discovery goes through the CLI rather than a
Go SDK, so **`--dry-run` also requires an authenticated `az`** even though it
never touches a cloud resource (`internal/orchestrator/orchestrator.go:284-322`
calls `ListInstances` unconditionally).

Verify the whole chain before a run. Every line below must succeed:

```bash
# Toolchain
go version                    # must satisfy the go directive in go.mod
pulumi version                # Pulumi Automation API shells out to this binary
az version                    # instance discovery runs `az vm list-skus`

# Azure: installed is not enough — this must print a subscription
az account show --output table

# The resource group must ALREADY EXIST. tailbench never creates it.
az group show --name "$(grep -A4 '^azure:' config.yaml | grep resource_group | awk '{print $2}')" --output table

# Tailscale credentials (not needed for --dry-run / --version)
test -f .env && grep -Eq '^OAUTH_CLIENT_ID=.+' .env && \
  grep -Eq '^OAUTH_CLIENT_SECRET=.+' .env && echo ".env: OAuth pair present"

# SSH public key that will be injected into every VM (see "Credentials")
ls -l "$HOME/.ssh/id_ed25519.pub" "$HOME/.ssh/id_rsa.pub" 2>/dev/null

# The binary itself
./dist/tailbench-azure --version
```

## Build

```bash
make build-azure          # -> dist/tailbench-azure
```

`make build-azure` runs `go build -tags azure` (`Makefile:70-72`). A bare
`go build ./cmd/tailbench/` fails on purpose: guard files reference an undefined
symbol so a mis-tagged build breaks at compile time instead of producing a
binary with the wrong provider.

Compiling the Pulumi SDKs is memory-intensive. Build one variant at a time;
`make build` does all six sequentially and peaks several GB higher.

`make lint-azure` and `make test-azure` are the matching checks. Neither needs
Azure credentials.

## Credentials

Three independent systems must each be satisfied. Failing any one of them
produces a different error at a different point in the run.

### 1. Tailscale OAuth — `.env`

`config.yaml` declares `env_file: .env` and references `${OAUTH_CLIENT_ID}` /
`${OAUTH_CLIENT_SECRET}`. The file is gitignored and absent from a fresh clone:

```bash
cp .env.example .env
$EDITOR .env
```

A missing env file is **not** fatal — config falls back to the process
environment and logs a notice (`internal/config/config.go:243-258`). The check
that actually rejects empty credentials is `validateCredentials`
(`internal/orchestrator/orchestrator.go:48`), and it is only reached when
there is **no cached tailnet** at `.tailbench/tailnet.json`
(`internal/orchestrator/orchestrator.go:168-186`). A resumed run takes its
credentials from that cache, so a run can succeed with an empty `.env` and then
fail after you clean up.

The OAuth client must be org-level and able to create tailnets, auth keys, the
policy file, and devices. Tailbench creates and deletes real tailnets — use
disposable org credentials.

### 2. Azure CLI and the Pulumi azure-native provider

Tailbench sets exactly one Pulumi config value for Azure:
`azure-native:location` (`internal/provider/azure.go:183-185` for the networking
stack, `:340-342` for each pair stack). It sets **no** subscription, tenant, or
credential config. Everything else is resolved by the `pulumi-azure-native`
provider from the ambient environment — in practice an `az login` session with a
default subscription, or the `ARM_*` environment variables that provider reads.
Tailbench contains no code for either path, so the exact precedence is provider
behavior and is not verified here; `az account show` printing the subscription
you intend to bill is the practical check.

Tailbench also sets `PULUMI_CONFIG_PASSPHRASE=""` for its workspaces
(`internal/provider/azure.go:43-45`), so you do not need to supply one.

**What gets created, and therefore what you must be allowed to do.** Derived
from `SetupNetworking` and `CreatePair`:

| Stack | Resource | Detail |
|---|---|---|
| networking (long-lived) | Virtual network `tailbench-vnet` | `10.0.0.0/16` (`azure.go:51-59`) |
| networking | Subnet `tailbench-subnet` | `10.0.1.0/24` (`azure.go:64-69`) |
| networking | Network security group `tailbench-nsg` | `azure.go:74-79` |
| networking | Security rule `AllowSSH` | TCP 22, priority 1000 (`azure.go:84-96`) |
| networking | Security rule `AllowVNetInternal` | all protocols, VirtualNetwork to VirtualNetwork, priority 1100 (`azure.go:101-113`) |
| networking | Security rule `AllowWireGuardUDP` | UDP 41641, priority 1200 (`azure.go:118-130`) |
| networking | Security rule `AllowIperfPPS` | all protocols, port 15201, priority 1300 (`azure.go:137-149`) |
| networking | Security rule `AllowRelayUDP` | UDP 41642, priority 1400 (`azure.go:155-167`) |
| pair (ephemeral) | Public IP address, one per node | Standard SKU, Static allocation (`azure.go:235-244`) |
| pair | Network interface, one per node | dynamic private IP in the subnet, NSG attached (`azure.go:249-269`) |
| pair | Virtual machine, one per node | size = the instance type under test (`azure.go:274-280`) |
| pair | Managed OS disk, one per VM | 50 GB, `Premium_LRS`, from image (`azure.go:283-289`) |

Every resource is tagged `Project=tailbench`. The VM image is Canonical
`ubuntu-24_04-lts`, SKU `server`, or `server-arm64` for ARM sizes
(`azure.go:421-441`).

So the identity running tailbench needs, **at the scope of the target resource
group**, permission to create, read, update, and delete virtual networks,
subnets, network security groups and their rules, public IP addresses, network
interfaces, virtual machines, and managed disks — plus permission to list VM
SKUs in the subscription (`az vm list-skus`). This runbook deliberately does not
name a specific built-in Azure role definition; pick one that covers the table
above and no more.

**The resource group is not created by tailbench.** No file in this repository
imports `pulumi-azure-native-sdk/resources`, and neither `SetupNetworking` nor
`CreatePair` creates a resource group — both only reference `p.ResourceGroup` as
the `ResourceGroupName` of resources they create. It must exist before the first
run, and `TeardownNetworking` (`azure.go:393-404`) does not delete it.

### 3. Pulumi state backend

Only Pulumi Cloud needs separate credentials, and tailbench checks for them at
startup rather than partway through provisioning
(`internal/provider/backend.go:59-76`, called from
`internal/orchestrator/orchestrator.go:101-103`). Set `PULUMI_ACCESS_TOKEN` — an
entry in `.env` is enough, since the Pulumi CLI inherits tailbench's
environment — or run `pulumi login` beforehand.

Object-store backends (`azblob://`, `s3://`, `gs://`) authenticate through the
same cloud credentials the provider already needs, so they get no separate
check.

## Configure config.yaml

Four keys affect this variant. As shipped, `config.yaml` sets only the first
two.

| Key | Default | Used as | What breaks if wrong |
|---|---|---|---|
| `azure.location` | `eastus` (`internal/config/config.go:308`) | `azure-native:location` on both stacks; the `--location` passed to `az vm list-skus` | Instance discovery returns nothing or the wrong SKU set; a location without capacity for the size fails at `CreatePair`; prices fall back to `eastus` |
| `azure.resource_group` | `tailbench-rg` (`internal/config/config.go:309`) | `ResourceGroupName` on every resource | The group is **not created**; a wrong or missing name fails the first Pulumi operation |
| `azure.ssh_user` | `azureuser` (`internal/config/config.go:310`) | VM `AdminUsername` and the `authorized_keys` path (`azure.go:293`, `:300`) | Out-of-band SSH uses a different username. Benchmarks are unaffected — see below |
| `azure.ssh_pub_key_file` | unset; falls back to `$HOME/.ssh/id_ed25519.pub` then `id_rsa.pub` (`internal/config/config.go:322-340`) | Injected as the VM's SSH public key | A silent fallback to the wrong key, or an empty key — see below |

`benchmark.modes` is shared with the other variants but matters here because
**there is no `--modes` flag**. The flag set is exactly `-cleanup-networking`,
`-config`, `-dry-run`, `-family`, `-filter`, `-provider`, `-state-backend`
(plus `--version`, which is scanned out of `os.Args` before flag parsing at
`cmd/tailbench/main.go:42-47`). Modes come only from `config.yaml`, and an empty
list defaults to `["l4-kernel"]` (`internal/config/config.go:342-344`).

### The SSH public key trap

This is the one thing that behaves differently on Azure than on AWS and GCP, and
it fails quietly.

Resolution order (`internal/config/config.go:322-340`):

1. If `azure.ssh_pub_key_file` is set and not absolute, it is resolved
   **relative to the directory of the config file**, not the working directory.
2. The file is read with `if data, err := os.ReadFile(pubKeyFile); err == nil`.
   **A read error is discarded.** A typo, a wrong relative base, or a
   permissions problem does not error — it leaves the value empty.
3. An empty value then falls back to `$HOME/.ssh/id_ed25519.pub`, then
   `$HOME/.ssh/id_rsa.pub`.
4. If neither exists, the key stays empty and is passed to Azure as-is
   (`azure.go:301`). Tailbench does not check this; the failure surfaces from
   Azure during VM creation. The exact error Azure returns is not verified here.

The practical consequence: **you can point `azure.ssh_pub_key_file` at a
nonexistent file and get a successful run using a completely different key.**
If which key lands on the VM matters to you, verify by reading the value back
from a provisioned VM, not by trusting the config.

### Is the key pair load-bearing?

**No — not for benchmarks.** Benchmark SSH does not use it at all:

- The orchestrator dials `sshclient.Dial(o.tsnetSrv, <tailscale hostname>,
  "root", ...)` — user `root`, over the tsnet interface
  (`internal/orchestrator/orchestrator.go:567`, `:578`, `:600`).
- `sshclient.Dial` authenticates with `ssh.Password("tailscale")`, a
  placeholder, and `InsecureIgnoreHostKey`
  (`internal/sshclient/sshclient.go:24-28`). That is Tailscale SSH terminating
  the connection, not sshd checking a key.
- Tailscale SSH is turned on by cloud-init: `tailscale set --ssh`
  (`internal/cloudinit/setup.sh.tmpl:43`), gated on `EnableSSH`, which the
  orchestrator sets to `true` for every VM node
  (`internal/orchestrator/orchestrator.go:444-478`).

The injected key pair is your **out-of-band access path only** — SSH to the
VM's public IP as `azure.ssh_user`, which is useful when cloud-init or Tailscale
never came up and the tsnet path is therefore dead. Password authentication is
disabled on the VM (`azure.go:296`), so without a usable key that debugging path
is closed. Keep it correct even though benchmarks do not depend on it.

## Choose a state backend

Empty (the default) keeps Pulumi state in `file://<repo-root>/state/azure`
(`internal/config/config.go:318`, `BackendURL` in `internal/provider/backend.go:16-21`).

| Value | Where state lives | Consequence |
|---|---|---|
| *(empty)* | `./state/azure`, gitignored | Stacks are visible only from this checkout on this machine. Another machine cannot resume or tear them down, so an interrupted run leaks Azure resources |
| `pulumi.com` | Pulumi Cloud (`https://api.pulumi.com`) | Stacks survive machine swaps. Requires `PULUMI_ACCESS_TOKEN` or `pulumi login`, checked at startup |
| `azblob://…`, `s3://…`, `gs://…` | Object storage | Shared across machines; authenticates through the cloud credentials you already have |
| `file://…` | Explicit local or mounted path | Same isolation as the default, at a path you choose |

The choice also changes startup behavior
(`internal/orchestrator/orchestrator.go:119-148`):

- **Local backends** get `state/azure` created with `MkdirAll`, and stale Pulumi
  lock files matching `state/*/.pulumi/locks/*.json` are swept and logged. Those
  locks are what produce `exit status 255` on every subsequent operation after a
  crashed run.
- **Remote backends** skip both — the service manages its own leases. If a
  remote-backend run is killed hard, you may need `pulumi cancel` on the stack.

Stack names are already provider-qualified — `tailbench-azure-networking` and
`tailbench-azure-<safe-type>` (`azure.go:178`, `:210`) — so one shared backend
safely holds every provider's stacks.

The Pulumi *work directory* is separate from the backend: a `file://` backend
uses the state directory itself, and a remote backend gets scratch space under
`.tailbench/pulumi/azure` (`internal/provider/backend.go:29-37`).

## Dry run

Always dry-run first. It prints the provider, the configured modes, and every
instance type that `--family` and `--filter` select, then exits without touching
any cloud resource (`internal/orchestrator/orchestrator.go:284-322`).

```bash
./dist/tailbench-azure --dry-run
./dist/tailbench-azure --dry-run --family fsv2
./dist/tailbench-azure --dry-run --filter '^Standard_F(2|4)s_v2$'
```

Two things to know:

- It still shells out to `az vm list-skus`, so an unauthenticated `az` makes it
  fail. It needs no Tailscale credentials and no resource group.
- It bypasses the on-disk instance cache — `dryRun` calls `ListInstances`
  directly (`orchestrator.go:302`) while a real run goes through
  `listInstancesCached` (`orchestrator.go:1032-1070`). So dry-run output always
  reflects Azure right now, and a real run may reuse an older cached list.

An unrecognized `--family` is rejected with the list of valid names rather than
silently selecting nothing (`orchestrator.go:329-338`). `--filter` is a Go
regular expression matched against the full instance type, including the
`Standard_` prefix and underscores; an invalid regex is rejected up front
(`orchestrator.go:341-350`).

## Run

```bash
# Smallest possible smoke test: one size, one pair of VMs
./dist/tailbench-azure --filter '^Standard_F2s_v2$'

# One family
./dist/tailbench-azure --family fsv2

# Everything (12 families) — expensive, see below
./dist/tailbench-azure
```

### Cost scoping

The default is `family: all` (`internal/config/config.go:271`), which is all
twelve Azure families and every non-excluded size in each. Each selected
instance type provisions **two VMs of that size**, each with a 50 GB Premium SSD
and a Static Standard public IP, held for the duration of every configured mode.
The forwarding and relay modes add a **third** VM of the same size.

Scope down with `--family` first and `--filter` second. `--filter` is the
sharper tool because Azure families span a wide vCPU range.

### Azure family names

This is the least guessable part of the Azure variant. The `--family` values are
neither Azure marketing names nor VM size prefixes — they are the SKU family
strings that `az vm list-skus` reports, lowercased with the `standard` prefix and
`Family` suffix stripped (`internal/provider/azure_instances.go:22-27`,
`:34-36`).

| `--family` value | `az vm list-skus` family | Sizes seen in this repo |
|---|---|---|
| `dsv5` | `standardDSv5Family` | — |
| `dasv5` | `standardDASv5Family` | — |
| `dpsv6` | `StandardDpsv6Family` | `Standard_D2ps_v6`, `Standard_D4ps_v6` |
| `dsv4` | `standardDSv4Family` | `Standard_D2s_v4`, `Standard_D4s_v4` |
| `fsv2` | `standardFSv2Family` | `Standard_F2s_v2` … `Standard_F48s_v2` |
| `fasv6` | `StandardFasv6Family` | `Standard_F2as_v6` … `Standard_F8as_v6` |
| `falsv6` | `StandardFalsv6Family` | — |
| `famsv6` | `StandardFamsv6Family` | — |
| `fasv7` | `StandardFasv7Family` | — |
| `falsv7` | `StandardFalsv7Family` | — |
| `famsv7` | `StandardFamsv7Family` | — |
| `esv4` | `standardESv4Family` | — |

The "sizes seen in this repo" column lists types that already have committed
results under `azure/` or prices in `internal/pricing/data.json`. Empty means
this checkout has no example — run `--dry-run --family <name>` against your
location to see the real list. Family membership is decided by Azure, not by
tailbench.

Two sets of sizes are filtered out of every listing
(`internal/provider/azure_instances.go:66`):

- names containing a digit-dash-digit sequence, i.e. constrained-vCPU SKUs;
- names containing `is_v`.

vCPU count is parsed as the first run of digits after stripping `Standard_`
(`azure_instances.go:76-83`), and the listing is sorted ascending by vCPUs
(`:72`), so a family runs smallest-first.

### The family in the result path is not the `--family` value

`--family dsv4` selects the family. The result directory is derived separately
by `GetInstanceFamily`, which for Azure strips `Standard_`, drops `_` and `-`,
lowercases — and **keeps the vCPU digits** (`internal/provider/families.go:16-32`;
asserted by `internal/provider/families_test.go:13-14`, which expects
`Standard_D4s_v5` to map to `d4sv5`). The committed tree confirms it:
`azure/d2sv4/`, `azure/f16sv2/`, `azure/f4asv6/`.

So `--family dsv4` writes to `azure/d2sv4/…` and `azure/d4sv4/…`, one directory
per size. The doc comment above `GetInstanceFamily` says `Standard_D4s_v4 ->
dsv4`; that comment is wrong, the code and its test are right.

This has a second effect. The quota-skip logic marks
`skippedFamilies[GetInstanceFamily(...)]`
(`internal/orchestrator/orchestrator.go:506-509`), so on Azure the key is
per-size. The documented "a quota error skips the rest of the family" behavior
therefore degrades on this provider to skipping only the size that failed;
larger sizes in the same Azure family are still attempted.

### Valid modes for this binary

`tailbench-azure` is a VM binary, so `ModeAppliesTo(mode, "vm")` decides
(`internal/benchmark/modes.go:43-53`), and `validateWorkloadConfig` rejects
anything Kubernetes-only **at startup**, before any cloud call
(`internal/orchestrator/k8s_disabled.go:16-23`).

| Mode | This binary |
|---|---|
| `l4-kernel` | accepted (default when `modes` is empty) |
| `l4-userspace` | accepted |
| `tsnet-userspace` | accepted |
| `l7-serve-h1`, `l7-serve-h2` | accepted (VM-only) |
| `forward-pps-exit` | accepted (VM-only, opt-in, 3 nodes) |
| `relay-throughput` | accepted (VM-only, opt-in, 3 nodes) |
| `l4-lb` | **rejected** |
| `l7-ingress-h1`, `l7-ingress-h2` | **rejected** |
| `forward-pps-exit-k8s`, `forward-pps-exit-k8s-opton` | **rejected** |

A rejected mode fails the run with
`kubernetes-only benchmark mode "<mode>" requires a k8s-enabled binary`.

### The opt-in three-node modes

`forward-pps-exit` and `relay-throughput` are commented out in `config.yaml` by
default. Both set `WantRouter`, which makes `CreatePair` append a third VM —
public IP, NIC, VM, and disk, at the same size as the pair
(`internal/provider/azure.go:222-234`, `internal/orchestrator/orchestrator.go:433-437`).
Budget for 1.5x the VM cost of a normal run.

- `forward-pps-exit` — the router advertises `--advertise-exit-node`; the ACL
  auto-approves it, and the client is pointed at it with
  `benchmark.SetExitNode` (`internal/benchmark/tailscale.go:24-31`). Traffic
  reaches the sink on its **public** IP through NSG rule `AllowIperfPPS`
  (port 15201).
- `relay-throughput` — the router advertises `--relay-server-port` on UDP 41642
  (`internal/benchmark/relay.go:14-18`), opened by NSG rule `AllowRelayUDP`.
  Requires Tailscale >= 1.86 on all three nodes.

The router is the device under test; its type, vCPUs, and price land on the
result. Topology, sweep methodology, verification steps, and caveats are in
[docs/cost-forward-pps-plan.md](cost-forward-pps-plan.md).

## What happens during a run

Per provider, in order (`internal/orchestrator/orchestrator.go:352-559`):

1. **Backend prep.** Local backends create `state/azure` and sweep stale Pulumi
   lock files; remote backends skip both (`:119-148`).
2. **Tailnet.** Reuse `.tailbench/tailnet.json` if present — the ACL is still
   re-applied — otherwise validate the OAuth credentials, create a fresh tailnet,
   set the ACL, and cache it (`:160-215`). Then mint an auth key and bring up the
   orchestrator's own ephemeral tsnet node (`:238-256`).
3. **Networking stack.** `SetupNetworking` upserts `tailbench-azure-networking`:
   vnet, subnet, NSG, five security rules. Long-lived and a near no-op on later
   runs (`azure.go:49-206`).
4. **Stale device cleanup.** Tailnet devices whose name starts with `tb-azure-`
   are removed (`:361-372`).
5. **Instance discovery.** `az vm list-skus --location <location>` once per
   process, cached in memory across families (`azure_instances.go:38-53`) and on
   disk at `.tailbench/instances/azure-<family>.json` (`:1023-1030`).
6. **Per instance type**, smallest vCPU count first:
   - Compute pending modes from files on disk; skip the type entirely if none
     remain (`:416-420`).
   - Render cloud-init per node, with the derived Tailscale hostnames
     `tb-azure-s-<safe-type>-<suffix>`, `-c-`, `-r-` (`:423-427`).
   - `DestroyPair` as a pre-cleanup, then `CreatePair` — public IP, NIC, VM,
     and OS disk per node — in stack `tailbench-azure-<safe-type>`.
   - SSH to each node over tsnet as `root`, then wait for
     `/tmp/tailbench-ready`, which cloud-init touches last
     (`internal/sshclient/sshclient.go:82-90`, `setup.sh.tmpl` final line).
   - Run each pending mode, writing its result file immediately (`:657-…`).
   - `DestroyPair`, then move to the next type.
   - Refresh the Tailscale auth key if it is older than 30 minutes (`:536-547`).
7. **Aggregate.** `result.Aggregate` regenerates `website/data.generated.js`
   (`:548-550`).
8. **Optional teardown.** With `--cleanup-networking`, destroy the networking
   stack and delete the tailnet (`:552-557`, `:222-236`).

Cloud-init installs iperf3, mtr, jq, and Tailscale; enables IP forwarding; sets
BBR, `fq`, and large socket buffers; enables UDP GRO forwarding on the primary
NIC; and installs fortio when an `l7-serve` mode is configured
(`internal/cloudinit/setup.sh.tmpl`).

## Generate the report

A successful run aggregates automatically — `runProvider` calls
`result.Aggregate(o.cfg.RootDir)` before it returns
(`internal/orchestrator/orchestrator.go:548`). Regenerate by hand after editing,
deleting, or copying result files:

```bash
# MUST run from the repo root
go run ./cmd/aggregate/
```

`cmd/aggregate/main.go` uses `os.Getwd()` as the root, and `result.Aggregate`
walks `gcp`, `aws`, `azure`, `gke`, `eks`, `aks` beneath it
(`internal/result/aggregator.go:15-21`). Run it from anywhere else and it walks
the wrong tree and silently produces nothing.

**Prices are injected at aggregation, not stored.** `result.Aggregate` looks up
each record in `internal/pricing` and adds a synthetic `price_per_hour`, so
re-pricing all history is just a re-aggregate:

```bash
go run ./cmd/pricing-refresh   # regenerate internal/pricing/data.json
go run ./cmd/aggregate/        # re-inject price_per_hour
```

The embedded Azure dataset currently covers **`eastus` only**, and `eastus` is
also Azure's canonical fallback region (`internal/pricing/pricing.go:31-37`). A
run in another location still resolves a price, from `eastus`, with a log line
saying so — treat those numbers as indicative, not as your bill.

View the dashboard by opening `website/index.html`. It loads
`data.generated.js` through a plain `<script src>` so `file://` works, but it
also pulls Chart.js from a CDN (`website/index.html:275-276`) — charts stay
blank without internet access. The tables still render.

## Resume and interruption

Resume is entirely filesystem-driven. There is no database. Work is skipped if
and only if the result JSON already exists:

- `pendingModesForInstance` skips an instance type when every applicable mode
  already has `azure/<family>/results/<type>-<mode>.json`
  (`internal/orchestrator/orchestrator.go:906-927`).
- `runModeLoop` re-checks per mode before running it (`:662-667`).
- `l4-kernel` additionally honors a legacy no-suffix path,
  `azure/<family>/results/<type>.json` (`:918-924`).

**To re-measure something, delete its result file.** Nothing else forces a rerun.

Ctrl-C is clean: `main` runs under a SIGINT/SIGTERM-cancelable context
(`cmd/tailbench/main.go:60-61`) and the instance loop checks `ctx.Err()` each
iteration (`orchestrator.go:399-401`). A VM pair that was mid-benchmark is left
running — the next run's pre-cleanup `DestroyPair` removes it before recreating
(`orchestrator.go:487-490`), but only if you rerun with the same backend from
the same place.

Caches that survive between runs:

| Path | Contents | Invalidated by |
|---|---|---|
| `.tailbench/tailnet.json` | Tailnet DNS name and OAuth pair; reused across runs | `--cleanup-networking` only |
| `.tailbench/instances/azure-<family>.json` | Instance list from `az vm list-skus` | `--cleanup-networking` (`orchestrator.go:1034`) |
| `.tailbench/pulumi/azure` | Pulumi workspace scratch, remote backends only | manual removal |
| `state/azure` | Local Pulumi state, when no remote backend is set | manual removal |

The family is part of the instance-cache key on purpose: a cache populated by
`--family fsv2` must not later satisfy `--family all`.

## Teardown

Per-instance teardown is automatic — `DestroyPair` runs after every instance
type, and again as pre-cleanup before the next `CreatePair`.

To remove the shared networking:

```bash
./dist/tailbench-azure --cleanup-networking --filter '^$'
```

`--cleanup-networking` destroys the `tailbench-azure-networking` stack — vnet,
subnet, NSG, and rules (`internal/provider/azure.go:393-404`) — **and** deletes
the tailnet and removes `.tailbench/tailnet.json`
(`internal/orchestrator/orchestrator.go:222-236`). It also invalidates the
instance cache. It does **not** delete the resource group, which tailbench never
created.

Verify nothing leaked. `DestroyPair` is best-effort and **always returns `nil`**
(`azure.go:378-391`) — it uses `optdestroy.ContinueOnError` and discards the
error, so the orchestrator's "destroy pair failed" warning can never fire. A
partial destroy is silent:

```bash
# Anything still tagged Project=tailbench in the group
az resource list --resource-group <group> --tag Project=tailbench --output table

# Stacks Pulumi still knows about
pulumi stack ls          # add --cwd state/azure for the default local backend
```

Public IP addresses and managed disks are the usual survivors of a partial
destroy, and both bill while idle.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Exit 1 with no output at all | Pulumi's `logging` package `init()` calls `slog.SetDefault`, which redirects the standard logger to a discarding handler — every `log.Printf` and `log.Fatalf` vanishes. `main.restoreStandardLogger()` undoes it and must run first (`cmd/tailbench/main.go:36-49`) | If you are seeing this in a modified tree, confirm `restoreStandardLogger()` is still the first statement in `main()` |
| `az vm list-skus: exit status 1` during `--dry-run` | `az` is not authenticated. Discovery shells out even in dry-run (`azure_instances.go:44-46`) | `az login`, then `az account show` |
| Pulumi fails immediately with a resource-group-not-found error | `azure.resource_group` does not exist. Tailbench never creates it | Create the group first, or point `azure.resource_group` at an existing one |
| VM creation fails on the SSH key, or the VM has an unexpected key | `azure.ssh_pub_key_file` read errors are discarded and fall back to `$HOME/.ssh/id_ed25519.pub`, then `id_rsa.pub`, then empty (`internal/config/config.go:322-340`) | Use an absolute path, or a path relative to the **config file's** directory; confirm the file is readable |
| `exit status 255` on every Pulumi operation | Stale lock in `state/*/.pulumi/locks/*.json` from a crashed run | Local backends sweep these at startup (`orchestrator.go:136-146`); on a remote backend run `pulumi cancel` on the stack |
| `requested provider "x", but this binary was compiled for provider "azure"` | `--provider` or `providers:` names something else. Renaming the binary changes nothing | Use `azure`, or leave `providers: []` |
| `unknown family "…" for provider azure` | `--family` is not one of the twelve SKU-family names | Use a value from the family table; `--dry-run` prints the list |
| `kubernetes-only benchmark mode "…" requires a k8s-enabled binary` | `benchmark.modes` contains `l4-lb`, `l7-ingress-*`, or a `*-k8s` mode. Rejected at startup (`internal/orchestrator/k8s_disabled.go:16-23`) | Remove them, or use `tailbench-azure-k8s` |
| Run stops on a size with `QuotaExceeded`, `SkuNotAvailable`, `AllocationFailed`, `PublicIPCountLimitReached`, or `sufficient capacity` | `IsQuotaError` matched (`azure.go:443-454`) and marked the family skipped. On Azure the family key is per-size, so only that size is skipped | Request quota, pick another location, or `--filter` around it |
| SSH to `tb-azure-s-…` never connects | Benchmark SSH is **Tailscale SSH as `root`** over tsnet (`orchestrator.go:567`, `sshclient.go:24-28`). The node never joined the tailnet, or cloud-init failed before `tailscale set --ssh` | SSH to the VM's public IP as `azure.ssh_user` with the injected key and read `/var/log/cloud-init-output.log` |
| Run hangs at "waiting for cloud-init ready" | `/tmp/tailbench-ready` is touched only at the very end of `setup.sh.tmpl`; a failed apt or Tailscale install leaves it absent | Same out-of-band path; check `cloud-init-output.log` |
| Results appear under `azure/d4sv4/` but you asked for `--family dsv4` | Expected. `GetInstanceFamily` keeps the vCPU digits for Azure (`families.go:16-32`, `families_test.go:13-14`) | Nothing to fix. The `families.go` doc comment is what is wrong |
| Dashboard shows no price, or a price for the wrong region | The embedded Azure dataset covers `eastus` only; other locations fall back to it | `go run ./cmd/pricing-refresh` then `go run ./cmd/aggregate/`; treat values as indicative |
| Dashboard tables render but charts are blank | Chart.js loads from a CDN (`website/index.html:275`) | Open it with internet access |
| `go run ./cmd/aggregate/` prints `aggregated` but nothing changed | It uses `os.Getwd()` as the root (`cmd/aggregate/main.go`) | Run it from the repo root |
| A rerun re-provisions a size you already benchmarked | Its result file is missing or was written under a different family directory | Check `azure/<family>/results/`; resume keys on the file existing |
