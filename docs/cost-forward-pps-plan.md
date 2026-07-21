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
./tailbench --provider aws --filter '^c6in\.xlarge$'
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
