# Cost and forwarding-pps: design notes and deferred work

This document records two things:

1. The **deferred** Workstream B (endpoint-to-endpoint host-to-host pps) — a
   metric we intentionally do **not** build or chart yet, captured so the design
   is not lost.
2. The runbook for testing the forwarding-pps benchmark and regenerating the
   dashboard data.

For the metric that *is* built — usable **forwarding** pps through a router
(exit-node first) — see the runner in `internal/benchmark/runner.go`
(`RunForwardingPPS`, `runUDPSweep`) and the `forward-pps-exit` mode in
`internal/benchmark/modes.go`.

## Honesty rule

Only chart a metric we actually measured, on the topology we measured it on.
Forwarding pps (client -> router -> sink) and endpoint pps (host -> host) are
**different numbers** and must never be conflated:

- **Forwarding pps** is the router's per-core capacity to encrypt/decrypt and
  forward other hosts' packets. This is the number that sizes a **subnet router
  or exit node**.
- **Endpoint pps** is a host talking to one peer over its own tunnel. It is
  *not* forwarding capacity and must never be presented as subnet-router or
  exit-node sizing.

The dashboard's pps columns render only when forwarding results exist (gated on
`d.forward_pps` in `website/index.html`).

## Deferred: Workstream B — endpoint-to-endpoint host-to-host pps

**What it is.** An `l4-pps` mode running an `iperf3 -u` small-datagram
loss-threshold sweep directly host-to-host (no third node), baseline LAN vs.
Tailscale CGNAT, reusing the same primitives already built for forwarding:
`runUDPSweep`, `ParseIPerfUDPJSON`, and the `PPSResult` schema.

**Why it is deferred, not deleted.** It is cheap to add (no extra node, no ACL
or cloud-init changes) and answers a real question — "what packet rate can a
single Tailscale endpoint push?" — but it is easy to misread as router sizing.
We build the forwarding metric first because that is the one clients actually
ask about for subnet routers and exit nodes. Endpoint pps can follow once the
dashboard clearly separates the two.

**Sketch of the change.**

- Add `l4-pps` to `validModes` and a `ModeUsesEndpointPPS` predicate in
  `internal/benchmark/modes.go`; it applies to `vm` (and optionally
  `container`).
- In the runner, run `runUDPSweep` twice: once client -> server over the LAN IP
  (baseline), once over the Tailscale IP. No sink/router node — the existing
  two-node pair is enough.
- Record both under a new `EndpointPPS` field (baseline + tailscale + overhead),
  distinct from `ForwardPPS`, so the schema itself keeps the two metrics
  separate.
- Website: a separate, clearly labeled "endpoint pps" column/section, never
  merged with forwarding pps.

**Subnet-router variant (also future).** The same three-node scaffold as the
exit-node forwarding test, but the router advertises `--advertise-routes` for an
isolated sink subnet instead of `--advertise-exit-node`, with route-precedence
handling. Out of scope here.

## Runbook: forwarding-pps benchmark

### Run a single instance type

Add `forward-pps-exit` to the `modes` list in `config.yaml`, then:

```bash
./dist/tailbench-aws --filter '^c6in\.xlarge$'
```

Expected behavior:

- Three nodes provisioned: `client`, `router` (exit node, the device under
  test), and `server` (the UDP sink).
- The ACL policy auto-approves the router as an exit node
  (`autoApprovers.exitNode`).
- The client sets the router as its exit node, so its egress to the sink's
  **public** IP is forced through the router (a non-tailnet address routes via
  the exit node rather than direct over Tailscale).
- The UDP sweep runs for each configured datagram size (default 64 / 340 /
  1400 bytes), reported as worst-case / IMIX-average / MTU.

### Verify traffic actually traverses the router

This is the load-bearing check — if traffic goes direct, the number is
meaningless:

- On the router, `tailscale status` / interface counters climb during the run.
- The client's `tailscale status` shows the router as its exit node.

### Result shape

Written to `<provider>/<family>/results/<type>-forward-pps-exit.json`, the
result carries `forward_pps` with the **router's** `instance_type`, `vcpus`, and
`price_per_hour` (injected at aggregation), plus per-size offered/usable pps,
loss %, jitter, and Mbps.

## Runbook: regenerate the dashboard

Per-result JSON is aggregated into `website/data.generated.js`:

```bash
# after a benchmark run has written */results/*.json
go run ./cmd/aggregate/
```

Refresh curated prices before aggregating if needed (see `cmd/pricing-refresh`):

```bash
go run ./cmd/pricing-refresh   # updates internal/pricing/data.json (AWS + Azure)
go run ./cmd/aggregate/        # re-injects price_per_hour into every record
```

Then open `website/index.html`. With forwarding results present, the usable-pps
and pps/$ columns appear; with only non-forwarding data present, they stay
hidden.

## Metric definition (locked)

Usable pps for a datagram size is the highest offered rate sustaining loss at or
below the threshold (default 0.1%), found by an RFC-2544-style binary search on
the offered rate (`iperf3 -u -b <bits/s>`), with a short warmup omitted (`-O`)
and a single stream (`-P 1`, because one tunnel is pinned to one core for the
WireGuard crypto). Reported at 64 B (worst case), an IMIX-average size
(headline), and ~MTU (best case).

### Dashboard mapping and derived metrics

Aggregation groups dashboard records by cloud provider, instance family,
instance type, and environment. The dashboard surfaces map to the aggregated
JSON as follows:

| Dashboard surface | Calculation | Result field(s) |
|---|---|---|
| `$/hr` | Linux, shared-tenancy, on-demand hourly instance price. The cost headline is the average across priced instance groups and names the cheapest group. | `price_per_hour`, injected from `internal/pricing/data.json` |
| `Usable pps` | IMIX-average forwarding `usable_pps` at or below the configured loss threshold. The grouped row uses the best measured `forward-pps-*` mode; legacy results without IMIX fall back to their highest usable measured size. | `forward_pps.sizes[label=imix-avg].usable_pps`, with `forward_pps.loss_threshold_pct` |
| `pps/$` | Headline usable pps divided by `price_per_hour`. It expresses forwarding packet-rate capacity per hourly dollar, not total job cost. | `forward_pps.sizes[].usable_pps / price_per_hour` |
| `Opt gain` | `(optimized usable pps - baseline usable pps) / baseline usable pps * 100`, using IMIX for the headline. | `forwarding_optimization.gain_pct`; `forwarding_optimization.sizes[].gain_pct` holds matched per-size deltas |
| Limiting resource | The resource that stopped the sweep from finding a higher usable rate. | `forward_pps.limiting_resource` |

`cmd/aggregate` computes an optimization comparison only when it finds exactly
one `forward-pps-exit-k8s` record labeled
`forwarding_optimizations: "off"` and one
`forward-pps-exit-k8s-opton` record labeled
`forwarding_optimizations: "on"` in the same
`(cloud_provider, instance_family, instance_type, environment)` group. It
stores the object only on the optimized record:

```json
"forwarding_optimization": {
  "state": "on",
  "baseline_mode": "forward-pps-exit-k8s",
  "baseline_usable_pps": 812000,
  "gain_pct": 34.2,
  "sizes": [
    {
      "label": "imix-avg",
      "datagram_bytes": 340,
      "baseline_usable_pps": 812000,
      "optimized_usable_pps": 1089704,
      "gain_pct": 34.2
    }
  ]
}
```

The join is intentionally coupled to those two mode names because they define
this A/B experiment. A missing or duplicate arm, a missing state label, an
absent IMIX measurement, or a zero IMIX baseline produces no comparison.

Keep the interpretation conservative:

- Forwarding pps is measured on `client -> router/proxy -> sink`; it is not
  endpoint pps and must not be charted as one.
- Show the VM exit-node or K8s ProxyGroup mode with every forwarding value. For
  A/B data, show the `off`/`on` state and label gain as `off→on`; an optimized
  pps value without its state is misleading.
- `instance-pps-cap` means the cloud packet limit may have capped the result, so
  the measurement is only a lower bound on node capacity. `node-cpu` and
  `proxy-cpu` identify a node/pod-bound sweep. `unknown` supports no stronger
  attribution.

---

# Forwarding pps through a Tailscale egress ProxyGroup (K8s)

Design doc for issue #3: an A/B benchmark that measures packets-per-second
forwarded through a Tailscale Kubernetes operator egress ProxyGroup, with the
experimental `TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS` env var toggled
off and on.

## Goal

Answer one question: does enabling Tailscale's experimental forwarding
optimizations change the achievable UDP packet rate when a pod's traffic is
forwarded through an egress ProxyGroup proxy, and what is the per-instance-type
cost of that forwarding path in pps terms?

## Topology

```text
┌─────────────┐   ClusterIP   ┌──────────────────────┐            ┌─────────────────────────┐
│ client      │──────────────▶│ ProxyGroup           │  tailnet   │ server bench pod        │
│ bench pod   │  egress svc   │ tailbench-egress     │═══════════▶│ tailscale sidecar ──────┼──▶ iperf3
│ (iperf3     │               │ proxy pod (DUT,      │            │ (shares pod netns)      │    UDP server
│  UDP client)│               │  does the forwarding)│            │                         │
└─────────────┘               └──────────────────────┘            └─────────────────────────┘
```

The device under test is the ProxyGroup proxy pod: it receives plaintext UDP
from the client via the egress Service's ClusterIP, encrypts it, forwards it
across the tailnet to the server bench pod's tailscale sidecar, which decaps
it into the shared pod network namespace where the iperf3 UDP server listens.

## Why an egress ProxyGroup

The operator has no exit-node ProxyGroup type. Egress ProxyGroups (exposing a
tailnet destination as an in-cluster Service) are the supported operator-managed
forwarding path, so that is what the benchmark measures.

## A/B protocol

Two benchmark modes, one per value of the knob:

- `forward-pps-exit-k8s` — baseline, optimizations OFF.
- `forward-pps-exit-k8s-opton` — optimizations ON.

Both modes are container-only: `ModeAppliesTo` in `internal/benchmark/modes.go`
gates them to the `container` environment, so VM binaries reject them.

The A/B knob lives on two ProxyClasses, `common` and
`common-accept-routes`, under `spec.statefulSet.pod.tailscaleContainer.env`.
The manifests are in `manifests/proxygroup/base` (env var absent, off) and
`manifests/proxygroup/overlays/on` (env var = `"true"`). Applying the "on"
overlay changes the StatefulSet pod template and re-rolls the ProxyGroup
proxy pods; the benchmark waits for the roll to complete before starting the
sweep.

Each mode writes its own result file per instance type:

- `<type>-forward-pps-exit-k8s.json`
- `<type>-forward-pps-exit-k8s-opton.json`

Existing result files are skipped, so an interrupted run resumes each arm of
the A/B independently — re-running after a failure does not redo the arm that
already completed.

## Sweep methodology

iperf3 UDP at increasing target bitrates, 100M stepping up to 10G.
`max_pps` is the highest achieved packets-per-second at which measured packet
loss stays below 1%.

## Result schema

```json
{
  "forward_pps": {
    "runs": [],
    "max_pps": 0,
    "max_bandwidth_mbps": 0,
    "limiting_resource": "proxy-cpu"
  },
  "forward_role": "proxygroup",
  "forwarding_optimizations": "off"
}
```

- `forward_role` is `"proxygroup"` — the measured device is the ProxyGroup
  proxy pod, not the node.
- `forwarding_optimizations` is `"off"` or `"on"`, matching the mode.

## Honesty rule: limiting_resource

`limiting_resource` is recorded rather than inferred. It is `"proxy-cpu"` when
the proxy pod was observed CPU-throttled during the sweep, otherwise
`"unknown"`. A pps number capped by the proxy pod's CPU request is a property
of the pod sizing, not of the instance type or the ProxyGroup — recording the
limiter keeps a pod-CPU-capped number from being presented as
instance/proxygroup capacity.

## Caveats: experimental and reproducibility

`TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS` is an experimental Tailscale
flag; its behavior can change or disappear between releases. Results record
`tailscale_version` so a data point can be tied to the build that produced it.
The operator Helm chart is currently unpinned and floats on `latest`, so two
runs at different times may exercise different operator versions. Treat the
A/B delta as directional, and compare only results taken close together in
time (or pin the chart before comparing across days).

---

# Peer-relay benchmark: direct vs peer-relay vs DERP

Design doc for issue #5: a 3-state benchmark that measures throughput,
usable pps, and latency for a Tailscale peer relay, compared against the
direct path (ceiling) and DERP (the baseline peer relays improve on).

## Goal

Answer: how much relayed throughput, usable pps, and latency does a given
instance type deliver as a Tailscale peer relay, and how does that compare
to the direct path and to DERP?

## Topology

```text
┌─────────┐   tailnet    ┌──────────────────────┐   tailnet    ┌─────────┐
│ client  │◀────────────▶│ router (DUT)          │◀────────────▶│ server  │
│         │  (may route   │ --relay-server-port   │  (may route   │         │
│         │   via relay)  │                       │   via relay)  │         │
└─────────┘               └──────────────────────┘               └─────────┘
```

The router is the device under test: it never initiates traffic itself, it
only relays WireGuard datagrams between client and server once the direct
path is blocked. Its instance type, vCPUs, and price are what the result
records (`forward_role: "peer-relay"`).

## Path forcing and assertion

The direct path is forced off by dropping inbound UDP on Tailscale's
WireGuard listen port (41641) on **both** client and server
(`benchmark.BlockDirect`). The relay is additionally forced off by dropping
inbound UDP on the relay's own configured port on the **router**
(`benchmark.BlockRelayPort`) to produce the DERP-only state.

Each state is measured only after `benchmark.PathVia` confirms — via
`tailscale ping` output (`"via peer-relay(...)"`, `"via DERP(...)"`, or a
bare direct `"pong"`) — that the intended path is actually active. This
mirrors the honesty rule from the forwarding-pps work: never chart a path
that wasn't confirmed.

## Result schema

```json
{
  "relay": {
    "relay_server_port": 41642,
    "direct": {
      "path": "direct",
      "throughput_mbps": 9400,
      "latency_ms": 1.2,
      "pps": {"sizes": [], "loss_threshold_pct": 0.1}
    },
    "peer_relay": {
      "path": "peer-relay",
      "throughput_mbps": 8100,
      "latency_ms": 4.0,
      "pps": {"sizes": [], "loss_threshold_pct": 0.1}
    },
    "derp": {
      "path": "derp",
      "throughput_mbps": 900,
      "latency_ms": 53.0,
      "pps": {"sizes": [], "loss_threshold_pct": 0.1}
    }
  },
  "forward_role": "peer-relay"
}
```

## Caveats

Requires Tailscale >= 1.86 on all three nodes (peer relay is a recent
feature; the shipped version is recorded via `tailscale_version` on the
result so a data point can be tied to the build that produced it). v1 uses
the same instance type for client, server, and router, same as
`forward-pps-exit`.
