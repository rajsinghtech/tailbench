# Peer-Relay Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement GitHub issue #5 — a VM-only `relay-throughput` benchmark mode that provisions a third node as a Tailscale peer relay, forces the client/server connection through direct → peer-relay → DERP states (each confirmed via `tailscale ping` before it's measured), and records throughput, usable pps, and latency for each state so operators can size a peer-relay node.

**Architecture:** Reuses the existing 3-node scaffold from `forward-pps-exit` (`PairOptions.WantRouter`, `PairOutput.Router*`) — the router VM's cloud-init sets `tailscale set --relay-server-port=<port>` instead of (additionally to) `--advertise-exit-node`. A new `internal/benchmark/relay.go` adds path assertion (`PathVia`, parsing `tailscale ping` output), iptables-based path forcing (`BlockDirect`/`BlockRelayPort`), and a single-state measurement (`Runner.RunRelayPath`) that reuses the existing iperf3 throughput/UDP-sweep primitives from `runner.go`. The orchestrator calls it three times — once per state, blocking/unblocking between calls — and writes one `RelayResult` per instance type.

**Tech Stack:** Go 1.26, Pulumi Automation API (GCP/AWS/Azure), iperf3 over SSH, Tailscale CLI (`tailscale ping`, `tailscale set --relay-server-port`), vanilla JS + Chart.js dashboard.

## Global Constraints

- Go 1.26+ (toolchain directive in `go.mod` is authoritative over README).
- No Makefile — use `go build`/`go vet`/`go test` directly, and
  `~/.local/bin/golangci-lint-versions/golangci-lint run ./...` for lint.
- Module import path is `github.com/rajsinghtech/tailbench` even though this
  checkout lives under an `rshade/tailbench` directory — never rewrite
  imports to match the directory.
- Provider files (`internal/provider/{gcp,aws,azure}.go`) carry build tags
  (`//go:build gcp && !k8s && !aws && !azure`, etc.) — build/vet/test them
  together with `-tags "k8s gke gcp"` (or the relevant single-provider tag)
  as the existing CI/CLAUDE.md guidance does; an untagged `go build ./...`
  is expected to fail on `cmd/tailbench` by design (it requires exactly one
  cloud-provider tag) — this is pre-existing, not something this plan fixes.
- Result path shape is load-bearing: `<provider>/<family>/results/<type>-<mode>.json`.
  `relay-throughput` follows it automatically — no writer changes needed.
- Result JSON keys already in use follow `snake_case` — new fields must match
  (`relay`, `relay_server_port`, `peer_relay`, `throughput_mbps`, `latency_ms`, `path`).
- No comments unless the WHY is genuinely non-obvious (existing repo/user
  convention) — do not add comments restating what code does.
- Files end with a newline (POSIX). LF line endings only.
- Do not mock what we don't own: Pulumi provider infra and orchestrator
  wiring are **not** unit-tested in this codebase (see #3's precedent) —
  only pure functions (parsers, predicates, ACL builders) get unit tests.
- Every Go task ends by running the affected package's tests; the final
  task runs the full matrix (build/vet/test/lint) before considering the
  plan done.

---

### Task 1: Result schema — `RelayResult` / `RelayPathResult`

**Files:**
- Modify: `internal/result/types.go`
- Test: `internal/result/types_test.go`

**Interfaces:**
- Produces: `result.RelayResult{RelayServerPort int, Direct, PeerRelay, DERP *RelayPathResult}`,
  `result.RelayPathResult{Path string, ThroughputMbps float64, PPS *PPSResult, LatencyMs float64}`,
  and `BenchmarkResult.Relay *RelayResult` (json tag `relay,omitempty`). Later
  tasks (5, 7, 9) construct and populate these types by name.

- [ ] **Step 1: Write the failing test**

Add to `internal/result/types_test.go` (mirrors the existing `TestForwardPPSJSON` at the bottom of the file):

```go
func TestRelayJSON(t *testing.T) {
	r := &BenchmarkResult{
		CloudProvider:  "aws",
		InstanceFamily: "c6in",
		InstanceType:   "c6in.xlarge",
		TransportMode:  "relay-throughput",
		ForwardRole:    "peer-relay",
		Relay: &RelayResult{
			RelayServerPort: 41642,
			Direct: &RelayPathResult{
				Path:           "direct",
				ThroughputMbps: 9400.0,
				LatencyMs:      1.2,
				PPS: &PPSResult{
					Sizes:            []PPSSizeResult{{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 900000}},
					LossThresholdPct: 0.1,
				},
			},
			PeerRelay: &RelayPathResult{
				Path:           "peer-relay",
				ThroughputMbps: 8100.0,
				LatencyMs:      4.0,
				PPS: &PPSResult{
					Sizes:            []PPSSizeResult{{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 610000}},
					LossThresholdPct: 0.1,
				},
			},
			DERP: &RelayPathResult{
				Path:           "derp",
				ThroughputMbps: 900.0,
				LatencyMs:      53.0,
				PPS: &PPSResult{
					Sizes:            []PPSSizeResult{{Label: "imix-avg", DatagramBytes: 340, UsablePPS: 80000}},
					LossThresholdPct: 0.1,
				},
			},
		},
	}
	data, err := json.Marshal(r)
	require.NoError(t, err)

	var raw map[string]json.RawMessage
	require.NoError(t, json.Unmarshal(data, &raw))
	assert.Contains(t, string(raw["relay"]), `"relay_server_port":41642`)
	assert.Contains(t, string(raw["relay"]), `"peer_relay"`)
	assert.Contains(t, string(raw["relay"]), `"path":"derp"`)

	var decoded BenchmarkResult
	require.NoError(t, json.Unmarshal(data, &decoded))
	require.NotNil(t, decoded.Relay)
	assert.Equal(t, 41642, decoded.Relay.RelayServerPort)
	require.NotNil(t, decoded.Relay.PeerRelay)
	assert.Equal(t, "peer-relay", decoded.Relay.PeerRelay.Path)
	assert.Equal(t, 610000.0, decoded.Relay.PeerRelay.PPS.Sizes[0].UsablePPS)

	// omitempty: non-relay results must not carry the new key
	plain, err := json.Marshal(&BenchmarkResult{CloudProvider: "gcp"})
	require.NoError(t, err)
	assert.NotContains(t, string(plain), `"relay"`)
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/result/ -run TestRelayJSON -v`
Expected: FAIL — `Relay` field / `RelayResult` / `RelayPathResult` undefined (compile error).

- [ ] **Step 3: Add the types**

In `internal/result/types.go`, add `Relay *RelayResult` to `BenchmarkResult` right after `ForwardOptimizations`:

```go
	ForwardPPS           *PPSResult    `json:"forward_pps,omitempty"`
	ForwardRole          string        `json:"forward_role,omitempty"`             // e.g. "exit-node", "proxygroup", "peer-relay"
	ForwardOptimizations string        `json:"forwarding_optimizations,omitempty"` // "off" or "on"
	Relay                *RelayResult  `json:"relay,omitempty"`
}
```

Then add the new types after `PPSSizeResult`:

```go
// RelayResult holds throughput, usable pps, and latency measured over three
// confirmed connection states between the same client/server pair: direct
// (the ceiling), peer-relay (direct blocked, relay available), and DERP
// (direct blocked and the relay also blocked — the baseline peer relays
// improve on). A state is only ever populated after PathVia confirmed it was
// actually active — never inferred.
type RelayResult struct {
	RelayServerPort int              `json:"relay_server_port"`
	Direct          *RelayPathResult `json:"direct,omitempty"`
	PeerRelay       *RelayPathResult `json:"peer_relay,omitempty"`
	DERP            *RelayPathResult `json:"derp,omitempty"`
}

// RelayPathResult is one confirmed connection state's measurements.
type RelayPathResult struct {
	Path           string     `json:"path"` // "direct", "peer-relay", or "derp" — matches the confirming PathVia call
	ThroughputMbps float64    `json:"throughput_mbps"`
	PPS            *PPSResult `json:"pps,omitempty"`
	LatencyMs      float64    `json:"latency_ms"`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/result/... -v`
Expected: PASS (all tests in the package, including `TestRelayJSON`).

- [ ] **Step 5: Commit**

```bash
git add internal/result/types.go internal/result/types_test.go
git commit -m "feat(relay): add RelayResult schema for the peer-relay benchmark"
```

---

### Task 2: Cloudinit — `RelayServerPort` config + template

**Files:**
- Modify: `internal/cloudinit/cloudinit.go`
- Modify: `internal/cloudinit/setup.sh.tmpl`
- Test: `internal/cloudinit/cloudinit_test.go`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `cloudinit.Config.RelayServerPort int` — Task 9 (orchestrator) sets
  this to `benchmark.RelayUDPPort` (Task 6) when rendering the router's
  cloud-init.

- [ ] **Step 1: Write the failing test**

Add to `internal/cloudinit/cloudinit_test.go`:

```go
func TestRenderRelayServerPort(t *testing.T) {
	out, err := Render(Config{
		AuthKey:         "tskey-auth-abc123",
		Hostname:        "tb-c6in-xlarge-router",
		RelayServerPort: 41642,
	})
	require.NoError(t, err)
	assert.Contains(t, out, "tailscale up --authkey=tskey-auth-abc123")
	assert.Contains(t, out, "tailscale set --relay-server-port=41642")

	// A plain node must not set a relay port.
	plain, err := Render(Config{AuthKey: "tskey-auth-abc123", Hostname: "tb-c6in-xlarge-server"})
	require.NoError(t, err)
	assert.NotContains(t, plain, "--relay-server-port")
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/cloudinit/ -run TestRenderRelayServerPort -v`
Expected: FAIL — `RelayServerPort` unknown field in `Config` (compile error).

- [ ] **Step 3: Add the config field and template line**

In `internal/cloudinit/cloudinit.go`, add the field to `Config`:

```go
type Config struct {
	AuthKey     string
	Hostname    string
	EnableSSH   bool
	EnableServe bool // install fortio and run tailscale serve --https for L7 benchmarks
	// AdvertiseExitNode makes this node come up as an exit node (the router under
	// test in the forwarding-pps benchmark). AdvertiseRoutes advertises subnet
	// routes (reserved for the future subnet-router variant; empty otherwise).
	AdvertiseExitNode bool
	AdvertiseRoutes   string
	// RelayServerPort makes this node advertise itself as a Tailscale peer
	// relay on the given UDP port (the router under test in the
	// relay-throughput benchmark). 0 disables it.
	RelayServerPort int
}
```

In `internal/cloudinit/setup.sh.tmpl`, add a `tailscale set` line right after
the existing `EnableSSH` block (both are `tailscale set` calls made once the
node is up):

```
{{- if .AuthKey }}
tailscale up --authkey={{ .AuthKey }} --hostname={{ .Hostname }}{{ if .AdvertiseExitNode }} --advertise-exit-node{{ end }}{{ if .AdvertiseRoutes }} --advertise-routes={{ .AdvertiseRoutes }}{{ end }}
{{- if .EnableSSH }}
tailscale set --ssh
{{- end }}
{{- if .RelayServerPort }}
tailscale set --relay-server-port={{ .RelayServerPort }}
{{- end }}
{{- end }}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/cloudinit/... -v`
Expected: PASS (all tests in the package).

- [ ] **Step 5: Commit**

```bash
git add internal/cloudinit/cloudinit.go internal/cloudinit/setup.sh.tmpl internal/cloudinit/cloudinit_test.go
git commit -m "feat(relay): add RelayServerPort cloud-init support"
```

---

### Task 3: Modes registry — `relay-throughput`

**Files:**
- Modify: `internal/benchmark/modes.go`
- Test: `internal/benchmark/modes_test.go`

**Interfaces:**
- Produces: `benchmark.ModeUsesRelay(mode string) bool`, and
  `"relay-throughput"` valid + VM-only in `IsValidMode`/`ModeAppliesTo`.
  Task 9 (orchestrator) branches on `ModeUsesRelay`.

- [ ] **Step 1: Write the failing test**

In `internal/benchmark/modes_test.go`, update `TestModeValid` and
`TestModeEnvironment` to include the new mode, and add a new test:

```go
func TestModeValid(t *testing.T) {
	valid := []string{"tsnet-userspace", "l4-kernel", "l4-userspace", "l4-lb", "l7-ingress-h1", "l7-ingress-h2", "l7-serve-h1", "l7-serve-h2", "forward-pps-exit", "forward-pps-exit-k8s", "forward-pps-exit-k8s-opton", "relay-throughput"}
	for _, m := range valid {
		if !IsValidMode(m) {
			t.Errorf("IsValidMode(%q) = false, want true", m)
		}
	}
	if IsValidMode("invalid") {
		t.Error("IsValidMode(invalid) = true, want false")
	}
}

func TestModeEnvironment(t *testing.T) {
	k8sOnly := []string{"l4-lb", "l7-ingress-h1", "l7-ingress-h2", "forward-pps-exit-k8s", "forward-pps-exit-k8s-opton"}
	vmOnly := []string{"l7-serve-h1", "l7-serve-h2", "forward-pps-exit", "relay-throughput"}
	both := []string{"tsnet-userspace", "l4-kernel", "l4-userspace"}
	// ... (rest of function body unchanged)
```

```go
func TestModeUsesRelay(t *testing.T) {
	if !ModeUsesRelay("relay-throughput") {
		t.Error("relay-throughput should use relay")
	}
	notRelay := []string{"l4-kernel", "forward-pps-exit", "forward-pps-exit-k8s", "l7-ingress-h1", "relay"}
	for _, m := range notRelay {
		if ModeUsesRelay(m) {
			t.Errorf("%s should NOT use relay", m)
		}
	}
	if ModeUsesIperf("relay-throughput") || ModeUsesFortio("relay-throughput") || ModeUsesTsnet("relay-throughput") || ModeUsesForwardPPS("relay-throughput") {
		t.Error("relay-throughput should NOT use iperf/fortio/tsnet/forward-pps")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/benchmark/ -run 'TestModeValid|TestModeEnvironment|TestModeUsesRelay' -v`
Expected: FAIL — `ModeUsesRelay` undefined (compile error); `TestModeValid`/`TestModeEnvironment` fail on the missing mode.

- [ ] **Step 3: Add the mode**

In `internal/benchmark/modes.go`:

```go
var validModes = map[string]bool{
	"tsnet-userspace":  true,
	"l4-kernel":        true,
	"l4-userspace":     true,
	"l4-lb":            true,
	"l7-ingress-h1":    true,
	"l7-ingress-h2":    true,
	"l7-serve-h1":      true,
	"l7-serve-h2":      true,
	"forward-pps-exit": true,

	// K8s ProxyGroup forwarding A/B: baseline vs
	// TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS.
	"forward-pps-exit-k8s":       true,
	"forward-pps-exit-k8s-opton": true,

	// 3-node peer-relay benchmark: direct vs peer-relay vs DERP.
	"relay-throughput": true,
}

func IsValidMode(mode string) bool {
	return validModes[mode]
}

func ModeAppliesTo(mode, env string) bool {
	switch mode {
	case "l4-lb", "l7-ingress-h1", "l7-ingress-h2",
		"forward-pps-exit-k8s", "forward-pps-exit-k8s-opton":
		return env == "container"
	case "l7-serve-h1", "l7-serve-h2", "forward-pps-exit", "relay-throughput":
		return env == "vm"
	default:
		return true
	}
}
```

Add the predicate after `ModeUsesForwardPPS`:

```go
// ModeUsesRelay reports whether the mode measures peer-relay throughput,
// usable pps, and latency across the direct/peer-relay/DERP connection
// states.
func ModeUsesRelay(mode string) bool {
	return mode == "relay-throughput"
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/benchmark/... -v`
Expected: PASS (all tests in the package).

- [ ] **Step 5: Commit**

```bash
git add internal/benchmark/modes.go internal/benchmark/modes_test.go
git commit -m "feat(relay): register the relay-throughput mode"
```

---

### Task 4: ACL — peer-relay grant

**Files:**
- Modify: `internal/tailnet/tailnet.go`
- Test: `internal/tailnet/tailnet_test.go`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `buildACL` now always includes a `tailscale.com/cap/relay` grant.
  No new exported symbol — this is infra applied once at tailnet setup, not
  called per-benchmark.

- [ ] **Step 1: Write the failing test**

Add to `internal/tailnet/tailnet_test.go`:

```go
func TestACLPeerRelayGrant(t *testing.T) {
	tag := "tag:bench"

	acl := buildACL(tag, false, false)
	require.NotEmpty(t, acl.Grants, "peer-relay grant must exist even without the K8s operator")
	found := false
	for _, g := range acl.Grants {
		if _, ok := g.App["tailscale.com/cap/relay"]; ok {
			found = true
			assert.Equal(t, []string{tag}, g.Source)
			assert.Equal(t, []string{tag}, g.Destination)
		}
	}
	assert.True(t, found, "expected a tailscale.com/cap/relay grant")

	// The K8s operator case must keep BOTH the relay grant and the existing
	// kubernetes-impersonation + bench-service grants, not overwrite them.
	k8s := buildACL(tag, false, true)
	relayFound, kubeFound, benchFound := false, false, false
	for _, g := range k8s.Grants {
		if _, ok := g.App["tailscale.com/cap/relay"]; ok {
			relayFound = true
		}
		if _, ok := g.App["tailscale.com/cap/kubernetes"]; ok {
			kubeFound = true
		}
		if len(g.Destination) == 1 && g.Destination[0] == "tag:bench-service" {
			benchFound = true
		}
	}
	assert.True(t, relayFound, "K8s ACL must still grant peer-relay")
	assert.True(t, kubeFound, "K8s ACL must still grant kubernetes impersonation")
	assert.True(t, benchFound, "K8s ACL must still grant bench-service access")
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/tailnet/ -run TestACLPeerRelayGrant -v`
Expected: FAIL — no grant has `tailscale.com/cap/relay`; in the `k8s` case the
kubernetes/bench-service grants are also absent today because the existing
code overwrites `acl.Grants` instead of appending.

- [ ] **Step 3: Add the grant and fix the overwrite**

In `internal/tailnet/tailnet.go`, in `buildACL`, add the relay grant
unconditionally (mirrors the unconditional exit-node auto-approver comment
just above it) and change the K8s branch's first assignment from `=` to
`append` so it no longer clobbers the relay grant:

```go
	// Auto-approve tagged nodes as exit nodes so the forwarding-pps router comes
	// up approved without manual admin action. Set unconditionally, then merge
	// K8s route approval below so the operator's 0.0.0.0/0 entry is preserved
	// rather than overwritten.
	acl.AutoApprovers = &tailscale.ACLAutoApprovers{
		ExitNode: []string{tag},
	}
	// Grant tagged nodes permission to use each other as a Tailscale peer
	// relay (tailscale.com/cap/relay), unconditionally — harmless until a
	// node sets --relay-server-port, same rationale as the exit-node
	// auto-approver above.
	acl.Grants = append(acl.Grants, tailscale.Grant{
		Source:      []string{tag},
		Destination: []string{tag},
		App: map[string][]map[string]any{
			"tailscale.com/cap/relay": {},
		},
	})
	if k8sOperator {
		acl.AutoApprovers.Routes = map[string][]string{
			"0.0.0.0/0": {tag},
		}
		// Grant the orchestrator tag the tailscale.com/cap/kubernetes app cap
		// so the operator API server proxy can impersonate as system:masters.
		acl.Grants = append(acl.Grants, tailscale.Grant{
			Source:      []string{tag},
			Destination: []string{tag},
			IP:          []string{"*"},
			App: map[string][]map[string]any{
				"tailscale.com/cap/kubernetes": {
					{
						"impersonate": map[string]any{
							"groups": []string{"system:masters"},
						},
					},
				},
			},
		})
		acl.Grants = append(acl.Grants, tailscale.Grant{
			Source:      []string{tag},
			Destination: []string{"tag:bench-service"},
			IP:          []string{"*"},
		})
	}
	return acl
}
```

(The change is: the `App: map[...]{"tailscale.com/cap/kubernetes": ...}` grant
now starts with `acl.Grants = append(acl.Grants, tailscale.Grant{` instead of
`acl.Grants = []tailscale.Grant{tailscale.Grant{`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/tailnet/... -v`
Expected: PASS (all tests in the package, including the pre-existing
`TestACLExitNodeAutoApprover`).

- [ ] **Step 5: Commit**

```bash
git add internal/tailnet/tailnet.go internal/tailnet/tailnet_test.go
git commit -m "feat(relay): grant tailscale.com/cap/relay in the benchmark ACL"
```

---

### Task 5: Path assertion — `PathVia` / latency parsing

**Files:**
- Create: `internal/benchmark/relay.go`
- Create: `internal/benchmark/relay_test.go`

**Interfaces:**
- Consumes: `benchmark.Executor` (existing interface, `executor.go`).
- Produces: `benchmark.PathVia(ctx, c Executor, peerIP string) (string, error)`
  returning `"direct"`, `"peer-relay"`, or `"derp"`; `benchmark.RelayUDPPort`
  constant. Task 7 (`Runner.RunRelayPath`) and Task 9 (orchestrator) call
  `PathVia`; Task 6 adds the blocking helpers to this same file.

Reference fixtures (from Tailscale's own `tailscale ping` documentation —
<https://tailscale.com/docs/reference/connection-types>):

```
Direct:     pong from another-device (100.113.160.82) via 140.82.13.138:41641 in 35ms
DERP:       pong from another-device (100.104.93.78) via DERP(tor) in 53ms
Peer relay: pong from another-device (100.97.143.93) via peer-relay(192.168.64.2:7777:vni:1) in 4ms
Unresolved: direct connection not established
```

- [ ] **Step 1: Write the failing test**

Create `internal/benchmark/relay_test.go`:

```go
package benchmark

import "testing"

func TestParsePingPath(t *testing.T) {
	cases := []struct {
		name   string
		stdout string
		want   string
		wantOK bool
	}{
		{
			name:   "direct",
			stdout: "pong from another-device (100.113.160.82) via 140.82.13.138:41641 in 35ms",
			want:   "direct",
			wantOK: true,
		},
		{
			name:   "derp",
			stdout: "pong from another-device (100.104.93.78) via DERP(tor) in 53ms\ndirect connection not established",
			want:   "derp",
			wantOK: true,
		},
		{
			name:   "peer-relay",
			stdout: "pong from another-device (100.97.143.93) via peer-relay(192.168.64.2:7777:vni:1) in 4ms\ndirect connection not established",
			want:   "peer-relay",
			wantOK: true,
		},
		{
			name:   "no pong yet",
			stdout: "direct connection not established",
			want:   "",
			wantOK: false,
		},
		{
			name:   "empty",
			stdout: "",
			want:   "",
			wantOK: false,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := parsePingPath(tc.stdout)
			if ok != tc.wantOK {
				t.Fatalf("parsePingPath(%q) ok = %v, want %v", tc.stdout, ok, tc.wantOK)
			}
			if got != tc.want {
				t.Errorf("parsePingPath(%q) = %q, want %q", tc.stdout, got, tc.want)
			}
		})
	}
}

func TestParsePingLatencyMs(t *testing.T) {
	ms, ok := parsePingLatencyMs("pong from another-device (100.97.143.93) via peer-relay(192.168.64.2:7777:vni:1) in 4ms")
	if !ok {
		t.Fatal("expected ok = true")
	}
	if ms != 4 {
		t.Errorf("latency = %v, want 4", ms)
	}

	if _, ok := parsePingLatencyMs("no match here"); ok {
		t.Error("expected ok = false for unmatched input")
	}

	ms2, ok2 := parsePingLatencyMs("pong from x (1.2.3.4) via DERP(nyc) in 130.5ms")
	if !ok2 || ms2 != 130.5 {
		t.Errorf("parsePingLatencyMs fractional = (%v, %v), want (130.5, true)", ms2, ok2)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/benchmark/ -run 'TestParsePingPath|TestParsePingLatencyMs' -v`
Expected: FAIL — `parsePingPath`/`parsePingLatencyMs` undefined (package
doesn't compile).

- [ ] **Step 3: Create relay.go with the parsers and PathVia**

Create `internal/benchmark/relay.go`:

```go
package benchmark

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// RelayUDPPort is the fixed UDP port the peer-relay router advertises via
// `tailscale set --relay-server-port`. Not user-configurable: provider
// firewall rules (internal/provider/{gcp,aws,azure}.go) open this exact
// port, so changing it here requires updating all three.
const RelayUDPPort = 41642

var pingLatencyRe = regexp.MustCompile(`in ([0-9.]+)ms`)

// parsePingPath extracts the connection path from one `tailscale ping -c 1`
// invocation's stdout. Tailscale documents three shapes: "pong ... via
// DERP(region) in Xms", "pong ... via peer-relay(ip:port:vni) in Xms", and a
// bare "pong ... via <ip>:<port> in Xms" for direct. ok is false when no pong
// line is present yet (e.g. "direct connection not established" alone).
func parsePingPath(stdout string) (path string, ok bool) {
	lower := strings.ToLower(stdout)
	switch {
	case strings.Contains(lower, "via peer-relay("):
		return "peer-relay", true
	case strings.Contains(lower, "via derp("):
		return "derp", true
	case strings.Contains(stdout, "pong"):
		return "direct", true
	default:
		return "", false
	}
}

// PathVia polls `tailscale ping` until the active path to peerIP is
// determined, returning "direct", "peer-relay", or "derp". This is the
// honesty check for the relay-throughput benchmark: a state must be
// confirmed here before any measurement against it is recorded.
func PathVia(ctx context.Context, c Executor, peerIP string) (string, error) {
	for range 20 {
		stdout, _, _ := c.Run(ctx, fmt.Sprintf("tailscale ping -c 1 --timeout 5s %s", peerIP))
		if path, ok := parsePingPath(stdout); ok {
			return path, nil
		}
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(3 * time.Second):
		}
	}
	return "", fmt.Errorf("could not determine path to %s after 20 attempts", peerIP)
}

// parsePingLatencyMs extracts the round-trip latency from one `tailscale
// ping` invocation's stdout (e.g. "... in 4ms"). ok is false when no
// latency was found (e.g. the ping failed outright).
func parsePingLatencyMs(stdout string) (ms float64, ok bool) {
	m := pingLatencyRe.FindStringSubmatch(stdout)
	if m == nil {
		return 0, false
	}
	v, err := strconv.ParseFloat(m[1], 64)
	if err != nil {
		return 0, false
	}
	return v, true
}

// pingLatencyMs averages the round-trip latency to peerIP over n pings.
func pingLatencyMs(ctx context.Context, c Executor, peerIP string, n int) (float64, error) {
	var sum float64
	var count int
	for range n {
		stdout, _, err := c.Run(ctx, fmt.Sprintf("tailscale ping -c 1 --timeout 5s %s", peerIP))
		if err != nil {
			continue
		}
		if ms, ok := parsePingLatencyMs(stdout); ok {
			sum += ms
			count++
		}
	}
	if count == 0 {
		return 0, fmt.Errorf("no successful pings to %s", peerIP)
	}
	return sum / float64(count), nil
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/benchmark/... -v`
Expected: PASS (all tests in the package).

- [ ] **Step 5: Commit**

```bash
git add internal/benchmark/relay.go internal/benchmark/relay_test.go
git commit -m "feat(relay): add tailscale ping path/latency parsing (PathVia)"
```

---

### Task 6: Path-forcing helpers — block/unblock direct and relay

**Files:**
- Modify: `internal/benchmark/relay.go`

**Interfaces:**
- Consumes: `benchmark.Executor`.
- Produces: `benchmark.BlockDirect(ctx, c Executor) error`,
  `benchmark.UnblockDirect(ctx, c Executor) error`,
  `benchmark.BlockRelayPort(ctx, relay Executor, port int) error`,
  `benchmark.UnblockRelayPort(ctx, relay Executor, port int) error`. Task 9
  (orchestrator) calls all four to force each of the three states.

These are thin shell-command wrappers, matching `SetExitNode`/`ClearExitNode`
in `tailscale.go` — which are untested for the same reason (no fake
`Executor` exists in this codebase, and the value under test is a live
`iptables` side effect, not parseable logic). No new test file for this step.

- [ ] **Step 1: N/A — thin infra wrapper, no unit test (see rationale above)**

This task has no red/green test cycle; it follows the existing convention
that `SetExitNode`/`ClearExitNode`/`TailscaleUp` in `tailscale.go` are
untested command-wrapper functions.

- [ ] **Step 2: Add the block/unblock functions**

Append to `internal/benchmark/relay.go`:

```go
// BlockDirect drops inbound UDP on Tailscale's WireGuard listen port (41641),
// forcing the peer to fail over to a peer relay (if configured and
// reachable) or DERP. Idempotent: safe to call even if already blocked.
func BlockDirect(ctx context.Context, c Executor) error {
	_, _, err := c.Run(ctx, "sudo iptables -C INPUT -p udp --dport 41641 -j DROP 2>/dev/null || sudo iptables -I INPUT -p udp --dport 41641 -j DROP")
	return err
}

// UnblockDirect removes the direct-path block installed by BlockDirect.
// Best-effort: the rule may already be absent.
func UnblockDirect(ctx context.Context, c Executor) error {
	_, _, err := c.Run(ctx, "sudo iptables -D INPUT -p udp --dport 41641 -j DROP 2>/dev/null || true")
	return err
}

// BlockRelayPort drops inbound UDP on the relay node's configured
// --relay-server-port, making the peer relay unreachable so a subsequent
// PathVia assertion can confirm fallback to DERP.
func BlockRelayPort(ctx context.Context, relay Executor, port int) error {
	cmd := fmt.Sprintf("sudo iptables -C INPUT -p udp --dport %d -j DROP 2>/dev/null || sudo iptables -I INPUT -p udp --dport %d -j DROP", port, port)
	_, _, err := relay.Run(ctx, cmd)
	return err
}

// UnblockRelayPort removes the relay-port block installed by BlockRelayPort.
func UnblockRelayPort(ctx context.Context, relay Executor, port int) error {
	cmd := fmt.Sprintf("sudo iptables -D INPUT -p udp --dport %d -j DROP 2>/dev/null || true", port)
	_, _, err := relay.Run(ctx, cmd)
	return err
}
```

- [ ] **Step 3: Run the package build to verify it compiles**

Run: `go build ./internal/benchmark/...`
Expected: succeeds with no errors.

- [ ] **Step 4: Run the package tests to verify nothing broke**

Run: `go test ./internal/benchmark/... -v`
Expected: PASS (all tests in the package — this step adds no new tests, so
none should be newly failing).

- [ ] **Step 5: Commit**

```bash
git add internal/benchmark/relay.go
git commit -m "feat(relay): add BlockDirect/BlockRelayPort path-forcing helpers"
```

---

### Task 7: `Runner.RunRelayPath` — measure one confirmed state

**Files:**
- Modify: `internal/benchmark/relay.go`
- Test: `internal/benchmark/relay_test.go`

**Interfaces:**
- Consumes: `Runner` (existing, `runner.go`), `PathVia`, `pingLatencyMs`
  (Task 5), `startIPerfServer`/`stopIPerfServer`/`Runner.runIPerfTest`/
  `Runner.runUDPSweep`/`ppsSizeLabel`/`result.ComputeSummary` (all existing,
  same-package or same-module, from `runner.go`/`result` package).
- Produces: `(r *Runner) RunRelayPath(ctx, client, server Executor, serverTSIP, wantPath string) (*result.RelayPathResult, error)`.
  Task 9 (orchestrator) calls this three times (once per state).

- [ ] **Step 1: Write the failing test**

Add to `internal/benchmark/relay_test.go` — a test that the function rejects
a state mismatch without touching the network (the one path of this function
testable without a live Executor/iperf3):

```go
type fakePingExecutor struct {
	pingStdout string
}

func (f *fakePingExecutor) Run(_ context.Context, cmd string) (string, string, error) {
	if strings.HasPrefix(cmd, "tailscale ping") {
		return f.pingStdout, "", nil
	}
	return "", "", nil
}
func (f *fakePingExecutor) Close() error { return nil }

func TestRunRelayPathStateMismatch(t *testing.T) {
	r := &Runner{Log: testLogger()}
	client := &fakePingExecutor{pingStdout: "pong from x (1.2.3.4) via DERP(nyc) in 50ms"}
	server := &fakePingExecutor{}
	_, err := r.RunRelayPath(context.Background(), client, server, "100.0.0.1", "direct")
	if err == nil {
		t.Fatal("expected an error when the confirmed path doesn't match wantPath")
	}
}
```

This requires a `testLogger()` helper — `internal/logger/logger.go` exports
`func New(provider string) *Logger`, so:

```go
func testLogger() *logger.Logger {
	return logger.New("test")
}
```

Add the needed imports to `internal/benchmark/relay_test.go`:

```go
import (
	"context"
	"strings"
	"testing"

	"github.com/rajsinghtech/tailbench/internal/logger"
)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/benchmark/ -run TestRunRelayPathStateMismatch -v`
Expected: FAIL — `RunRelayPath` undefined (compile error).

- [ ] **Step 3: Implement RunRelayPath**

Append to `internal/benchmark/relay.go` (needs `"github.com/rajsinghtech/tailbench/internal/result"` added to the import block):

```go
// RunRelayPath asserts that the confirmed path between client and serverTSIP
// is wantPath, then measures throughput, usable pps, and latency for that
// state. It returns an error — and records nothing — if the confirmed path
// doesn't match wantPath, so a misconfigured block never mislabels a result.
func (r *Runner) RunRelayPath(ctx context.Context, client, server Executor, serverTSIP, wantPath string) (*result.RelayPathResult, error) {
	cfg := r.Config
	cfg.defaults()

	path, err := PathVia(ctx, client, serverTSIP)
	if err != nil {
		return nil, fmt.Errorf("path assertion: %w", err)
	}
	if path != wantPath {
		return nil, fmt.Errorf("expected path %q, got %q — not recording (honesty rule)", wantPath, path)
	}
	r.Log.Infof("relay: confirmed %s path to %s", path, serverTSIP)

	latencyMs, err := pingLatencyMs(ctx, client, serverTSIP, 5)
	if err != nil {
		r.Log.Warnf("relay latency (%s): %v", path, err)
	}

	if err := startIPerfServer(ctx, server); err != nil {
		return nil, fmt.Errorf("starting iperf3 server (%s): %w", path, err)
	}
	runs, err := r.runIPerfTest(ctx, client, serverTSIP, cfg.IPerfParallel, cfg.IPerfIterations, cfg.IPerfDuration, cfg.CooldownSec, cfg.CreditRetrySec)
	stopIPerfServer(ctx, server)
	if err != nil {
		return nil, fmt.Errorf("throughput (%s): %w", path, err)
	}
	summary := result.ComputeSummary(runs)

	pps := &result.PPSResult{LossThresholdPct: cfg.PPSLossThresholdPct}
	for _, dgram := range cfg.PPSDatagramSizes {
		size, err := r.runUDPSweep(ctx, client, serverTSIP, dgram, cfg)
		if err != nil {
			return nil, fmt.Errorf("pps sweep (%s, %dB): %w", path, dgram, err)
		}
		size.Label = ppsSizeLabel(dgram, cfg.PPSDatagramSizes)
		pps.Sizes = append(pps.Sizes, size)
	}

	return &result.RelayPathResult{
		Path:           path,
		ThroughputMbps: summary.BandwidthMbpsAvg,
		LatencyMs:      latencyMs,
		PPS:            pps,
	}, nil
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/benchmark/... -v`
Expected: PASS (all tests in the package).

- [ ] **Step 5: Commit**

```bash
git add internal/benchmark/relay.go internal/benchmark/relay_test.go
git commit -m "feat(relay): add Runner.RunRelayPath to measure one confirmed state"
```

---

### Task 8: Provider firewalls — open the relay UDP port

**Files:**
- Modify: `internal/provider/gcp.go`
- Modify: `internal/provider/aws.go`
- Modify: `internal/provider/azure.go`

**Interfaces:**
- Consumes: nothing new (uses the literal `41642`, matching
  `benchmark.RelayUDPPort` from Task 6 — provider files hardcode the port
  number as a literal, same convention as the existing `15201` iperf port,
  rather than importing `internal/benchmark`).
- Produces: nothing new consumed by later tasks — purely infra.

No unit tests: Pulumi provider infrastructure isn't unit-tested in this
codebase (see `CLAUDE.md` — "Don't mock what you don't own" — and the
precedent from issue #3, where `internal/k8s/proxygroup.go`'s Pulumi/Helm
wiring was integration-verified manually, not unit-tested).

- [ ] **Step 1: GCP — add the relay port to the WantRouter firewall rule**

In `internal/provider/gcp.go`, in `CreatePair`'s `program` closure, extend
the existing `if opts.WantRouter` firewall block (around line 77-91):

```go
		if opts.WantRouter {
			// The GCP network is bring-your-own, so open the iperf3 port for the
			// forwarding-pps sink (public IP, reached via the exit node), and the
			// Tailscale peer-relay UDP port (relay-throughput benchmark), here.
			if _, err := compute.NewFirewall(pCtx, fmt.Sprintf("tb-%s-pps", safeType), &compute.FirewallArgs{
				Network:   pulumi.String(p.Network),
				Direction: pulumi.String("INGRESS"),
				Allows: compute.FirewallAllowArray{
					compute.FirewallAllowArgs{Protocol: pulumi.String("tcp"), Ports: pulumi.StringArray{pulumi.String("15201")}},
					compute.FirewallAllowArgs{Protocol: pulumi.String("udp"), Ports: pulumi.StringArray{pulumi.String("15201")}},
					compute.FirewallAllowArgs{Protocol: pulumi.String("udp"), Ports: pulumi.StringArray{pulumi.String("41642")}},
				},
				SourceRanges: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
			}); err != nil {
				return err
			}
		}
```

- [ ] **Step 2: AWS — add a security group ingress rule**

In `internal/provider/aws.go`, in the base `ec2.NewSecurityGroup` call's
`Ingress` array (around line 116-152), add a new rule after the existing
iperf3 UDP rule:

```go
				ec2.SecurityGroupIngressArgs{
					Protocol:    pulumi.String("udp"),
					FromPort:    pulumi.Int(15201),
					ToPort:      pulumi.Int(15201),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("iperf3 UDP data (forwarding-pps sink, routed via exit node)"),
				},
				ec2.SecurityGroupIngressArgs{
					Protocol:    pulumi.String("udp"),
					FromPort:    pulumi.Int(41642),
					ToPort:      pulumi.Int(41642),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("Tailscale peer-relay (relay-throughput benchmark)"),
				},
```

- [ ] **Step 3: Azure — add a network security rule**

In `internal/provider/azure.go`, add a new `aznetwork.NewSecurityRule` call
right after the existing `AllowIperfPPS` rule (around line 137-152), using
the next priority slot:

```go
		// Tailscale peer-relay UDP port for the relay-throughput benchmark.
		_, err = aznetwork.NewSecurityRule(pCtx, "AllowRelayUDP", &aznetwork.SecurityRuleArgs{
			ResourceGroupName:        pulumi.String(p.ResourceGroup),
			NetworkSecurityGroupName: nsg.Name,
			SecurityRuleName:         pulumi.String("AllowRelayUDP"),
			Priority:                 pulumi.Int(1400),
			Protocol:                 pulumi.String("Udp"),
			Access:                   pulumi.String("Allow"),
			Direction:                pulumi.String("Inbound"),
			SourceAddressPrefix:      pulumi.String("*"),
			SourcePortRange:          pulumi.String("*"),
			DestinationAddressPrefix: pulumi.String("*"),
			DestinationPortRange:     pulumi.String("41642"),
		})
		if err != nil {
			return err
		}
```

- [ ] **Step 4: Verify each provider builds under its tag**

Run:
```bash
go build -tags "gcp" ./internal/provider/...
go build -tags "aws" ./internal/provider/...
go build -tags "azure" ./internal/provider/...
```
Expected: all three succeed with no errors.

- [ ] **Step 5: Commit**

```bash
git add internal/provider/gcp.go internal/provider/aws.go internal/provider/azure.go
git commit -m "feat(relay): open the peer-relay UDP port in provider firewalls"
```

---

### Task 9: Orchestrator wiring

**Files:**
- Modify: `internal/orchestrator/orchestrator.go`

**Interfaces:**
- Consumes: `benchmark.ModeUsesRelay`, `benchmark.RelayUDPPort`,
  `benchmark.PathVia` (via `Runner.RunRelayPath`), `benchmark.BlockDirect`/
  `UnblockDirect`/`BlockRelayPort`/`UnblockRelayPort`, `Runner.RunRelayPath`
  (Tasks 3, 5, 6, 7), `cloudinit.Config.RelayServerPort` (Task 2),
  `result.RelayResult`/`RelayPathResult` (Task 1).
- Produces: end-to-end `relay-throughput` mode execution — writes
  `<type>-relay-throughput.json` via the existing `result.WriteResult` /
  `runModeLoop` machinery (unchanged).

No new unit tests: `runModeLoop` and `CreatePair` wiring are orchestrator
integration code, not unit-tested in this codebase (same precedent as the
`forward-pps-exit` / `forward-pps-exit-k8s` branches already in this file).

- [ ] **Step 1: Add `hasRelayMode` and extend `wantRouter`**

In `internal/orchestrator/orchestrator.go`, add a new helper next to
`hasForwardMode` (around line 728-735):

```go
func hasForwardMode(modes []string) bool {
	for _, m := range modes {
		if benchmark.ModeUsesForwardPPS(m) {
			return true
		}
	}
	return false
}

func hasRelayMode(modes []string) bool {
	for _, m := range modes {
		if benchmark.ModeUsesRelay(m) {
			return true
		}
	}
	return false
}
```

Then, in the `runProvider` loop (around line 295-298), extend the
router-provisioning decision:

```go
		// forward-pps-exit and relay-throughput are VM-only and need a 3rd
		// node (the router under test). Base this on the work left for this
		// instance so reruns don't provision an unused router after its
		// result has already been written.
		wantRelay := !isK8sProvider(p.Name()) && hasRelayMode(pendingModes)
		wantRouter := !isK8sProvider(p.Name()) && (hasForwardMode(pendingModes) || wantRelay)
```

- [ ] **Step 2: Set `RelayServerPort` on the router's cloud-init**

Still in `runProvider`, in the `if wantRouter { ... }` cloud-init render
block (around line 331-342), add the relay port:

```go
			if wantRouter {
				relayPort := 0
				if wantRelay {
					relayPort = benchmark.RelayUDPPort
				}
				routerUD, err := cloudinit.Render(cloudinit.Config{
					AuthKey:           *authKey,
					Hostname:          routerHostname,
					EnableSSH:         true,
					AdvertiseExitNode: hasForwardMode(pendingModes),
					RelayServerPort:   relayPort,
				})
				if err != nil {
					lg.Errf("cloud-init (router) for %s: %v", inst.Type, err)
					continue
				}
				routerUserData = routerUD
			}
```

- [ ] **Step 3: Run the package build to verify it compiles**

Run: `go build -tags "gcp" ./internal/orchestrator/...`
Expected: succeeds with no errors.

- [ ] **Step 4: Add the `runModeLoop` branch for relay-throughput**

In `runModeLoop`'s `switch` statement (around line 523-596), add a new case
right after the `ModeUsesForwardPPS` case and before `ModeUsesTsnet`:

```go
		case benchmark.ModeUsesRelay(mode):
			if runner.Router == nil {
				log.Printf("%s skipping mode %s: no relay node provisioned", prefix, mode)
				continue
			}
			serverTSIP, err := benchmark.GetTailscaleIP(ctx, runner.Server)
			if err != nil {
				log.Printf("%s mode %s: server tailscale IP: %v (continuing)", prefix, mode, err)
				continue
			}
			if err := benchmark.WaitForPeer(ctx, runner.Client, serverTSIP); err != nil {
				log.Printf("%s mode %s: %v (continuing)", prefix, mode, err)
				continue
			}

			log.Printf("%s relay-throughput: measuring direct path", prefix)
			direct, err := runner.RunRelayPath(ctx, runner.Client, runner.Server, serverTSIP, "direct")
			if err != nil {
				log.Printf("%s relay mode %s failed (direct): %v", prefix, mode, err)
				continue
			}

			log.Printf("%s relay-throughput: blocking direct path", prefix)
			_ = benchmark.BlockDirect(ctx, runner.Client)
			_ = benchmark.BlockDirect(ctx, runner.Server)

			log.Printf("%s relay-throughput: measuring peer-relay path", prefix)
			peerRelay, err := runner.RunRelayPath(ctx, runner.Client, runner.Server, serverTSIP, "peer-relay")
			if err != nil {
				log.Printf("%s relay mode %s failed (peer-relay): %v", prefix, mode, err)
				_ = benchmark.UnblockDirect(ctx, runner.Client)
				_ = benchmark.UnblockDirect(ctx, runner.Server)
				continue
			}

			log.Printf("%s relay-throughput: blocking relay port", prefix)
			_ = benchmark.BlockRelayPort(ctx, runner.Router, benchmark.RelayUDPPort)

			log.Printf("%s relay-throughput: measuring DERP path", prefix)
			derp, derpErr := runner.RunRelayPath(ctx, runner.Client, runner.Server, serverTSIP, "derp")

			// Best-effort cleanup so a later mode against the same pair
			// isn't affected by a leftover block.
			_ = benchmark.UnblockRelayPort(ctx, runner.Router, benchmark.RelayUDPPort)
			_ = benchmark.UnblockDirect(ctx, runner.Client)
			_ = benchmark.UnblockDirect(ctx, runner.Server)

			if derpErr != nil {
				log.Printf("%s relay mode %s failed (derp): %v", prefix, mode, derpErr)
				continue
			}

			br = &result.BenchmarkResult{
				Relay: &result.RelayResult{
					RelayServerPort: benchmark.RelayUDPPort,
					Direct:          direct,
					PeerRelay:       peerRelay,
					DERP:            derp,
				},
				ForwardRole: "peer-relay",
				TestConfig:  forwardPPSTestConfig(direct.PPS),
			}
```

- [ ] **Step 5: Run the full build/vet/test and commit**

Run:
```bash
go build -tags "k8s gke gcp" ./...
go vet -tags "k8s gke gcp" ./...
go test -tags "k8s gke gcp" ./...
```
Expected: all succeed with no errors, all tests PASS.

```bash
git add internal/orchestrator/orchestrator.go
git commit -m "feat(relay): wire relay-throughput into the orchestrator"
```

---

### Task 10: Dashboard — relay tab, chart, and table columns

**Files:**
- Modify: `website/index.html`

**Interfaces:**
- Consumes: `d.relay` (the JSON `relay` key produced by Task 9 via
  `result.RelayResult`'s `json:"relay,omitempty"` tag), keyed under
  `g.modes['relay-throughput']`.
- Produces: nothing consumed elsewhere — this is the leaf UI layer.

No automated test — this is manually verified per the "Manual" step in
Task 11's testing strategy (regenerate `data.generated.js` with fixture data
and visually confirm). Follow the existing `renderForwardPPSChart` /
`hasK8sForwardPPS` pattern throughout.

- [ ] **Step 1: Add relay detection and the chart tab**

Near `hasK8sForwardPPS` (around line 412-428), add:

```js
  var hasForwardPPS = TAILBENCH_DATA.some(function(d){ return d.forward_pps; });
  var hasRelay = TAILBENCH_DATA.some(function(d){ return d.relay; });
  function containsK8sForwardPPS(data) {
    return data.some(function(d){
      return d.forward_pps && (d.transport_mode==='forward-pps-exit-k8s' || d.transport_mode==='forward-pps-exit-k8s-opton');
    });
  }
  var hasK8sForwardPPS = containsK8sForwardPPS(TAILBENCH_DATA);
  var tabs = [
    {id:'radar',label:'Provider Radar'},
    {id:'vmvsk8s',label:'VM vs K8s'},
    {id:'throughput',label:'L4 Throughput'},
    {id:'overhead',label:'Overhead Comparison'},
    {id:'qps',label:'QPS by Mode'},
    {id:'latency',label:'Latency (P50/P99)'}
  ];
  if (hasL7Bytes) tabs.push({id:'l7throughput',label:'L7 Throughput'});
  if (hasK8sForwardPPS) tabs.push({id:'forwardpps',label:'K8s Forward PPS (A/B)'});
  if (hasRelay) tabs.push({id:'relay',label:'Peer Relay'});
```

And in `renderChart()` (around line 436-449), add the dispatch:

```js
      else if(state.tab==='forwardpps') renderForwardPPSChart(ctx);
      else if(state.tab==='relay') renderRelayChart(ctx);
```

- [ ] **Step 2: Add `relayIMIXPPS` helper and `renderRelayChart`**

Near `forwardPPSSize` (around line 364-373), add:

```js
  // Peer-relay headline is the IMIX-average usable pps for a given path
  // result (direct / peer_relay / derp), same convention as forwardPPSSize.
  function relayIMIXPPS(pathResult) {
    if (!pathResult || !pathResult.pps || !pathResult.pps.sizes) return 0;
    var sizes = pathResult.pps.sizes;
    var imix = sizes.filter(function(s){ return s.label==='imix-avg'; })[0];
    if (imix) return imix.usable_pps;
    return sizes.reduce(function(best,s){ return !best||s.usable_pps>best.usable_pps?s.usable_pps:best; }, 0);
  }
  function relayPPS(g) {
    var d = g.modes['relay-throughput'];
    if (!d || !d.relay) return 0;
    return relayIMIXPPS(d.relay.peer_relay);
  }
  function relayPPSPerDollar(g) { var p=relayPPS(g); return (p&&g.price)?p/g.price:0; }
```

Add `renderRelayChart` right after `renderForwardPPSChart` (after its closing
brace, around line 587):

```js
  function renderRelayChart(ctx) {
    // Three-way comparison: direct (ceiling) vs peer-relay vs DERP (the
    // baseline peer relays improve on), usable pps at the IMIX-average size.
    var rows = [];
    filtered().forEach(function(g) {
      var d = g.modes['relay-throughput'];
      if (!d || !d.relay) return;
      rows.push({
        label: g.type+' ('+g.provider.toUpperCase()+')',
        direct: relayIMIXPPS(d.relay.direct),
        peerRelay: relayIMIXPPS(d.relay.peer_relay),
        derp: relayIMIXPPS(d.relay.derp)
      });
    });
    rows.sort(function(a,b){ return b.peerRelay-a.peerRelay; });

    chart = new Chart(ctx, {
      type:'bar',
      data:{
        labels:rows.map(function(r){return r.label;}),
        datasets:[
          {label:'Direct',data:rows.map(function(r){return r.direct;}),backgroundColor:css('--accent')+'99',borderColor:css('--accent'),borderWidth:1,borderRadius:3},
          {label:'Peer relay',data:rows.map(function(r){return r.peerRelay;}),backgroundColor:css('--green')+'99',borderColor:css('--green'),borderWidth:1,borderRadius:3},
          {label:'DERP',data:rows.map(function(r){return r.derp;}),backgroundColor:css('--yellow')+'99',borderColor:css('--yellow'),borderWidth:1,borderRadius:3}
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{labels:{color:css('--text-2'),padding:14,usePointStyle:true}},
          tooltip:{
            backgroundColor:css('--bg-2'),titleColor:css('--text'),bodyColor:css('--text-2'),borderColor:css('--border'),borderWidth:1,padding:10,
            callbacks:{
              label:function(item){ return item.dataset.label+': '+fq(item.raw)+' pps'; }
            }
          }
        },
        scales:{
          x:{ticks:{color:css('--text-2'),font:{family:css('--mono'),size:9},maxRotation:45},grid:{display:false}},
          y:{ticks:{color:css('--text-3'),callback:function(v){return v>=1000?(v/1000).toFixed(0)+'k':v;}},grid:{color:css('--border')},beginAtZero:true,title:{display:true,text:'Usable packets/sec (IMIX)',color:css('--text-2'),font:{size:11}}}
        }
      }
    });
  }
```

- [ ] **Step 3: Add table columns and `modeOrder` entry**

Update `modeOrder` (line 338):

```js
  var modeOrder=['l4-kernel','l4-userspace','l4-lb','l7-serve-h1','l7-serve-h2','l7-ingress-h1','l7-ingress-h2','forward-pps-exit-k8s','forward-pps-exit-k8s-opton','relay-throughput'];
```

In `sortVal` (around line 388-402), add:

```js
      case 'fpps': return forwardPPS(g);
      case 'ppsdollar': return ppsPerDollar(g);
      case 'relaypps': return relayPPS(g);
      case 'relayppsdollar': return relayPPSPerDollar(g);
```

In `tableCols()` (around line 907-917):

```js
  function tableCols() {
    var cols=[
      {k:'type',l:'Instance'},{k:'provider',l:'Cloud'},{k:'vcpus',l:'vCPU'},
      {k:'price',l:'$/hr'},
      {k:'bw',l:'L4 Throughput'},{k:'overhead',l:'Overhead'},
      {k:'qps',l:'Best QPS'},{k:'p99',l:'Best P99'}
    ];
    if (hasForwardPPS) cols.push({k:'fpps',l:'Usable pps'},{k:'ppsdollar',l:'pps/$'});
    if (hasRelay) cols.push({k:'relaypps',l:'Relay pps'},{k:'relayppsdollar',l:'Relay pps/$'});
    cols.push({k:'',l:'Mode Breakdown'},{k:'',l:''});
    return cols;
  }
```

In `renderTable()`, right after the existing `hasForwardPPS` cell block
(around line 959-964), add:

```js
      if (hasRelay) {
        var rp=relayPPS(g); var rpd=relayPPSPerDollar(g);
        h+='<td class="m">'+(rp?ppsFmt(rp)+'<small style="color:var(--text-3);margin-left:1px">pps</small>':'—')+'</td>';
        h+='<td class="m">'+(rpd?ppsFmt(rpd)+'<small style="color:var(--text-3);margin-left:1px">/$</small>':'—')+'</td>';
      }
```

- [ ] **Step 4: Add mode-breakdown pill and detail-row rendering**

In the compact per-row mode breakdown (around line 969-997), extend the
`mLabel` replacement chain and add a `d.relay` branch:

```js
        var mLabel = mode.replace('l4-','').replace('l7-','').replace('forward-pps-exit-k8s','fwd-pps').replace('relay-throughput','relay');
```

```js
        } else if (d.forward_pps) {
          var ps = forwardPPSSize(d);
          if (ps) {
            mbHtml += '<span class="m" style="font-size:0.68rem">'+ppsFmt(ps.usable_pps)+'<small style="color:var(--text-3);margin-left:1px">pps</small></span>';
            mbHtml += '<span class="m" style="font-size:0.62rem;color:var(--text-3)">'+ps.datagram_bytes+'B</span>';
          }
          if (d.forward_pps.limiting_resource==='proxy-cpu') {
            mbHtml += '<span class="oh oh-y" style="font-size:0.55rem">proxy-cpu</span>';
          }
        } else if (d.relay) {
          var rIMIX = relayIMIXPPS(d.relay.peer_relay);
          if (rIMIX) {
            mbHtml += '<span class="m" style="font-size:0.68rem">'+ppsFmt(rIMIX)+'<small style="color:var(--text-3);margin-left:1px">pps</small></span>';
            mbHtml += '<span class="m" style="font-size:0.62rem;color:var(--text-3)">peer-relay</span>';
          }
        }
```

In the expanded detail row (around line 1030-1044), add a `d.relay` branch
after the `d.forward_pps` branch:

```js
        } else if (d.forward_pps) {
          h+='<div class="md-metrics">';
          d.forward_pps.sizes.forEach(function(s) {
            var sizeLabel=s.label==='imix-avg'?'IMIX':s.label==='mtu'?'MTU':s.label+'B';
            h+='<div class="md-m">'+ppsFmt(s.usable_pps)+'<small>pps '+sizeLabel+' ('+s.datagram_bytes+'B), '+s.loss_pct.toFixed(3)+'% loss</small></div>';
          });
          h+='</div>';
          h+='<span class="oh oh-g">&le;'+d.forward_pps.loss_threshold_pct.toFixed(3)+'% loss</span>';
          if (d.forwarding_optimizations) {
            h+='<span class="oh oh-g" style="margin-left:4px">fwd-opt: '+d.forwarding_optimizations+'</span>';
          }
          if (d.forward_pps.limiting_resource==='proxy-cpu') {
            h+='<span class="oh oh-y" style="margin-left:4px">proxy-cpu bound</span>';
          }
        } else if (d.relay) {
          h+='<div class="md-metrics">';
          [['direct','Direct',d.relay.direct],['peer_relay','Peer relay',d.relay.peer_relay],['derp','DERP',d.relay.derp]].forEach(function(row) {
            var label=row[1], pr=row[2];
            if (!pr) return;
            var imix=relayIMIXPPS(pr);
            h+='<div class="md-m">'+gbps(pr.throughput_mbps)+'<small>Gbps '+label+'</small></div>';
            h+='<div class="md-m">'+(imix?ppsFmt(imix):'—')+'<small>pps '+label+'</small></div>';
            h+='<div class="md-m">'+pr.latency_ms.toFixed(1)+'<small>ms '+label+'</small></div>';
          });
          h+='</div>';
        }
```

- [ ] **Step 5: Manually verify and commit**

Regenerate `website/data.generated.js` with real or fixture result data
containing a `relay-throughput` mode (see Task 12 for the fixture), open
`website/index.html` in a browser, and confirm:
- The "Peer Relay" chart tab appears only when relay data exists.
- The "Relay pps" / "Relay pps/$" table columns appear only when relay data
  exists.
- The mode-breakdown pill and detail row render direct/peer-relay/DERP
  correctly for a `relay-throughput` row.

```bash
git add website/index.html
git commit -m "feat(relay): render peer-relay throughput/pps/latency on the dashboard"
```

---

### Task 11: Docs — README, design doc, config.yaml

**Files:**
- Modify: `README.md`
- Modify: `docs/cost-forward-pps-plan.md`
- Modify: `config.yaml`

**Interfaces:** none — documentation only.

- [ ] **Step 1: Add the `relay-throughput` entry to `config.yaml`**

In `config.yaml`, under `benchmark.modes` (around line 35-44), add a
commented opt-in entry after the `forward-pps-exit` line:

```yaml
  modes:
    - l4-kernel
    - l7-serve-h1
    - l7-serve-h2
    # - forward-pps-exit   # 3-node exit-node forwarding pps (VM only); opt-in
    # - relay-throughput   # 3-node peer-relay benchmark (VM only, Tailscale >= 1.86); opt-in
    # Container-only A/B pair: egress ProxyGroup forwarding pps with
    # TS_EXPERIMENTAL_ENABLE_FORWARDING_OPTIMIZATIONS off/on. Requires the
    # Tailscale Kubernetes operator; rejected by VM binaries.
    # - forward-pps-exit-k8s
    # - forward-pps-exit-k8s-opton
```

- [ ] **Step 2: Add a README section**

In `README.md`, insert a new section between `## Forwarding pps (exit-node
sizing)` (ends at line 109) and `## Instance pricing` (line 111):

```markdown
## Peer relay (relay-node sizing)

Tailscale peer relays (>= 1.86) let a node in your tailnet relay WireGuard
traffic between two peers that can't connect directly — tried **before**
falling back to Tailscale's shared DERP servers. Like an exit node, a relay
does per-packet crypto for *other peers'* traffic, so it's CPU/packet-rate
bound and pinned to one core per tunnel.

The `relay-throughput` mode (VM only, opt-in) provisions a **third node** —
a router advertising `--relay-server-port` — and measures the same
client/server pair's connection in three states, each confirmed via
`tailscale ping` before it's measured (a state that can't be confirmed is
skipped, never mislabeled):

- **Direct** — the ceiling.
- **Peer relay** — the direct path blocked, relay available.
- **DERP** — direct blocked *and* the relay also blocked; the baseline peer
  relays improve on.

Each state records TCP throughput, usable pps (64 B / IMIX-average / ~MTU,
the same RFC-2544-style sweep as `forward-pps-exit`), and round-trip
latency.

- Enable it by adding `relay-throughput` to `benchmark.modes` in
  `config.yaml`, then run e.g.
  `./dist/tailbench-aws --filter '^c6in\.xlarge$'`.
- Requires Tailscale >= 1.86 on all three nodes.
- The dashboard shows relay throughput / pps / per-`$` columns, rendered
  **only when relay data exists**.
```

- [ ] **Step 3: Add a design-doc section**

In `docs/cost-forward-pps-plan.md`, append a new top-level section at the
end of the file (after the existing "Caveats: experimental and
reproducibility" section), separated by a `---` like the K8s ProxyGroup
section is:

```markdown

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
    "direct": {"path": "direct", "throughput_mbps": 9400, "latency_ms": 1.2, "pps": {"sizes": [], "loss_threshold_pct": 0.1}},
    "peer_relay": {"path": "peer-relay", "throughput_mbps": 8100, "latency_ms": 4.0, "pps": {"sizes": [], "loss_threshold_pct": 0.1}},
    "derp": {"path": "derp", "throughput_mbps": 900, "latency_ms": 53.0, "pps": {"sizes": [], "loss_threshold_pct": 0.1}}
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
```

- [ ] **Step 4: Lint the markdown**

Run: `npx markdownlint README.md docs/cost-forward-pps-plan.md` (or the
project's configured markdownlint invocation if different — check for an
npm script or `.markdownlint.json` first).
Expected: no errors (fix any line-length/heading issues it reports).

- [ ] **Step 5: Commit**

```bash
git add README.md docs/cost-forward-pps-plan.md config.yaml
git commit -m "docs(relay): document the relay-throughput benchmark"
```

---

### Task 12: Final verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Full build across the relevant tag combinations**

Run:
```bash
go build ./...   # expected to fail only on cmd/tailbench (no cloud tag) — pre-existing, by design
go build -tags "k8s gke gcp" ./...
go build -tags "k8s eks aws" ./...
go build -tags "k8s aks azure" ./...
```
Expected: only the untagged `cmd/tailbench` build fails (pre-existing,
requires exactly one cloud-provider tag); all tagged builds succeed.

- [ ] **Step 2: Full vet and test across tag combinations**

Run:
```bash
go vet -tags "k8s gke gcp" ./...
go test -tags "k8s gke gcp" ./... -v
go vet -tags "k8s eks aws" ./...
go test -tags "k8s eks aws" ./...
go vet -tags "k8s aks azure" ./...
go test -tags "k8s aks azure" ./...
```
Expected: all PASS.

- [ ] **Step 3: Lint**

Run: `~/.local/bin/golangci-lint-versions/golangci-lint run ./...`
(this may take several minutes — use an extended timeout).
Expected: no new findings introduced by this plan's changes. Fix any that
appear in the files this plan touched; pre-existing findings elsewhere are
out of scope.

- [ ] **Step 4: End-to-end dry run**

Add `relay-throughput` to `benchmark.modes` in a local `config.yaml` (or
override via `--filter`), then run:
```bash
./tailbench --dry-run --provider aws --filter '^c6in\.xlarge$'
```
Expected: the dry-run output lists the 3-node provisioning (server, client,
router) for the filtered instance type, with the `relay-throughput` mode
included in what would run.

- [ ] **Step 5: Commit (only if Steps 1-4 required fixes)**

If any lint/vet/build issues were fixed in this task:
```bash
git add -A
git commit -m "fix(relay): address lint/vet findings from full verification"
```
If no fixes were needed, skip this step — there is nothing to commit.

---

## Self-Review Notes

- **Spec coverage**: every acceptance criterion from issue #5 maps to a task
  — ProxyClass-equivalent VM provisioning (Task 9), ACL grant (Task 4), path
  assertion before recording (Tasks 5, 7), two/three-state measurement with
  the router as DUT (Tasks 7, 9), result schema with the relay node's
  type/vCPUs/price (Task 1 + existing `runModeLoop` common fields), dashboard
  gating (Task 10), unit tests for mode predicates / path parser / ACL grant
  (Tasks 3, 4, 5), and docs (Task 11).
- **Deliberately out of scope** (per the issue's own "Out of Scope" section,
  carried into this plan): subnet-router relay variants, multi-relay HA,
  self-hosted DERP, "optimal" port selection beyond forcing/verifying the
  path, and using different instance types per node.
- **Known risk carried forward from the issue itself**: the exact
  `tailscale ping`/`status` text for the peer-relay path was confirmed
  against Tailscale's public docs during planning (see Task 5's fixtures),
  but has not been verified against a live >= 1.86 tailscaled binary. Task
  12's end-to-end dry run does not exercise live infrastructure — the first
  real run against provisioned VMs is the actual confirmation, and
  `parsePingPath`/`PathVia` may need a follow-up fix if the live CLI output
  differs from the documented format.
