package orchestrator

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/rajsinghtech/tailbench/internal/benchmark"
	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/provider"
	"github.com/rajsinghtech/tailbench/internal/result"
	"github.com/rajsinghtech/tailbench/internal/tailnet"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type failingCreateProvider struct {
	createErr     error
	listErr       error
	destroyErr    error
	listCalls     int
	createCalls   int
	teardownCalls int
	beforeSetup   func()
	beforeCreate  func()
}

func (p *failingCreateProvider) Name() string {
	return "eks"
}

func (p *failingCreateProvider) SetupNetworking(context.Context) (*provider.NetworkingOutput, error) {
	if p.beforeSetup != nil {
		p.beforeSetup()
	}
	return &provider.NetworkingOutput{
		Values:     map[string]string{"kubeconfig": "test-kubeconfig"},
		StackName:  "tailbench-eks-cluster-ab12cd",
		ProviderID: "eks-cluster-ab12cd",
	}, nil
}

func (p *failingCreateProvider) CreatePair(context.Context, provider.PairOptions) (*provider.PairOutput, error) {
	p.createCalls++
	if p.beforeCreate != nil {
		p.beforeCreate()
	}
	return nil, p.createErr
}

func (p *failingCreateProvider) DestroyPair(context.Context, string) error {
	return p.destroyErr
}

func (p *failingCreateProvider) TeardownNetworking(context.Context) error {
	p.teardownCalls++
	return nil
}

func (p *failingCreateProvider) ListFamilies() []string {
	return []string{"c7i"}
}

func (p *failingCreateProvider) ListInstances(context.Context, string) ([]provider.InstanceInfo, error) {
	p.listCalls++
	if p.listErr != nil {
		return nil, p.listErr
	}
	return []provider.InstanceInfo{{Type: "c7i.large", Family: "c7i", VCPUs: 2}}, nil
}

func (p *failingCreateProvider) GetVCPUs(context.Context, string) (int, error) {
	return 2, nil
}

func (p *failingCreateProvider) IsQuotaError(error) bool {
	return false
}

type recordingStateRecorder struct {
	resources []ResourceRecord
	steps     []string
}

type failingACLManager struct {
	aclErr      error
	deleteCalls int
	deletedDNS  string
}

type failingCommandExecutor struct {
	err error
}

func (e failingCommandExecutor) Run(context.Context, string) (string, string, error) {
	return "", "", e.err
}

func (e failingCommandExecutor) Close() error {
	return nil
}

func (m *failingACLManager) CreateTailnet(context.Context, string) (*tailnet.TailnetInfo, error) {
	return &tailnet.TailnetInfo{
		DNSName:           "tail-ab12cd.ts.net",
		OAuthClientID:     "run-client",
		OAuthClientSecret: "run-secret",
	}, nil
}

func (m *failingACLManager) DeleteTailnet(_ context.Context, dnsName string) error {
	m.deleteCalls++
	m.deletedDNS = dnsName
	return nil
}

func (m *failingACLManager) SetupACL(context.Context, string, string, bool, bool) error {
	return m.aclErr
}

func (m *failingACLManager) EnableHTTPS(context.Context, string, string) error {
	return nil
}

func (m *failingACLManager) CreateAuthKey(context.Context, string, string) (string, error) {
	return "auth-key", nil
}

func (m *failingACLManager) CleanupStaleDevices(context.Context, string, string, string) (int, error) {
	return 0, nil
}

func (r *recordingStateRecorder) BeforeExternalStep(stage, workID, message string) error {
	r.steps = append(r.steps, "before:"+stage+":"+workID+":"+message)
	return nil
}

func (r *recordingStateRecorder) AfterExternalStep(stage, workID, status, message string) error {
	r.steps = append(r.steps, "after:"+stage+":"+workID+":"+status+":"+message)
	return nil
}

func (r *recordingStateRecorder) RecordResources(resources ...ResourceRecord) error {
	for _, resource := range resources {
		found := false
		for index := range r.resources {
			if r.resources[index].ID == resource.ID {
				r.resources[index] = resource
				found = true
				break
			}
		}
		if !found {
			r.resources = append(r.resources, resource)
		}
	}
	return nil
}

func (r *recordingStateRecorder) resource(id string) (ResourceRecord, bool) {
	for _, resource := range r.resources {
		if resource.ID == id {
			return resource, true
		}
	}
	return ResourceRecord{}, false
}

func TestRunRecordsResourceIntentBeforeProviderSideEffects(t *testing.T) {
	root := t.TempDir()
	t.Chdir(root)
	recorder := &recordingStateRecorder{}
	provisionErr := errors.New("stop after resource-intent assertion")
	p := &failingCreateProvider{createErr: provisionErr}
	p.beforeSetup = func() {
		resource, ok := recorder.resource("eks/networking")
		if !ok || resource.Status != runstateResourceCreating {
			t.Fatalf("network resource before SetupNetworking = %#v, found %t", resource, ok)
		}
	}
	p.beforeCreate = func() {
		resource, ok := recorder.resource("eks/c7i.large/topology")
		if !ok || resource.Status != runstateResourceCreating {
			t.Fatalf("topology resource before CreatePair = %#v, found %t", resource, ok)
		}
	}
	o := &Orchestrator{
		cfg: &config.Config{
			Providers:         []string{"eks"},
			Family:            "c7i",
			Modes:             []string{"l4-kernel"},
			RootDir:           root,
			StateDir:          "file://" + filepath.Join(root, "state"),
			RunID:             "tb_2026-07-24_ab12cd",
			CleanupNetworking: true,
		},
		providers: []provider.Provider{p},
	}
	o.SetStateRecorder(recorder)

	outcome := o.RunWithOutcome(context.Background())

	if outcome.BenchmarkErr == nil ||
		!strings.Contains(outcome.BenchmarkErr.Error(), provisionErr.Error()) {
		t.Fatalf("benchmark error = %v, want %v", outcome.BenchmarkErr, provisionErr)
	}
	network, ok := recorder.resource("eks/networking")
	if !ok ||
		network.Status != runstateResourceCleaned ||
		network.StackName != "tailbench-eks-cluster-ab12cd" ||
		network.ProviderID != "eks-cluster-ab12cd" {
		t.Fatalf("final network resource = %#v, found %t", network, ok)
	}
	topology, ok := recorder.resource("eks/c7i.large/topology")
	if !ok || topology.Status != runstateResourceCreating {
		t.Fatalf("final topology resource = %#v, found %t", topology, ok)
	}
}

func TestRunModeLoopSurfacesModeFailureAndRecordsFailedWork(t *testing.T) {
	root := t.TempDir()
	recorder := &recordingStateRecorder{}
	o := &Orchestrator{
		cfg: &config.Config{
			Modes:   []string{"tsnet-userspace"},
			RootDir: root,
		},
		recorder: recorder,
	}
	p := &failingCreateProvider{}

	err := o.runModeLoop(
		context.Background(),
		&benchmark.Runner{},
		p,
		&provider.PairOutput{},
		provider.InstanceInfo{Type: "c7i.large", Family: "c7i"},
		"c7i",
		"[eks/c7i.large]",
		"vm",
		modeContext{},
	)

	if err == nil ||
		!strings.Contains(err.Error(), "tsnet-userspace") ||
		!strings.Contains(err.Error(), "not yet implemented") {
		t.Fatalf("runModeLoop error = %v, want visible unsupported-mode failure", err)
	}
	steps := strings.Join(recorder.steps, "\n")
	for _, want := range []string{
		"before:benchmark:c7i.large/tsnet-userspace",
		"after:benchmark:c7i.large/tsnet-userspace:failed",
	} {
		if !strings.Contains(steps, want) {
			t.Fatalf("recorded steps = %q, want %q", steps, want)
		}
	}
}

func TestCleanupPolicyUsesIndependentBenchmarkOutcome(t *testing.T) {
	benchmarkErr := errors.New("benchmark failed")
	tests := []struct {
		name      string
		policy    string
		runErr    error
		wantClean bool
	}{
		{name: "always after success", policy: config.CleanupAlways, wantClean: true},
		{name: "always after failure", policy: config.CleanupAlways, runErr: benchmarkErr, wantClean: true},
		{name: "on success after success", policy: config.CleanupOnSuccess, wantClean: true},
		{name: "on success after failure", policy: config.CleanupOnSuccess, runErr: benchmarkErr, wantClean: false},
		{name: "manual after success", policy: config.CleanupManual, wantClean: false},
		{name: "manual after failure", policy: config.CleanupManual, runErr: benchmarkErr, wantClean: false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := shouldCleanup(test.policy, test.runErr); got != test.wantClean {
				t.Fatalf("shouldCleanup(%q, %v) = %t, want %t", test.policy, test.runErr, got, test.wantClean)
			}
		})
	}
}

func TestRunReturnsProvisioningFailureInsteadOfLoggingSuccess(t *testing.T) {
	root := t.TempDir()
	t.Chdir(root)
	provisionErr := errors.New("provider create failed")
	o := &Orchestrator{
		cfg: &config.Config{
			Providers: []string{"eks"},
			Family:    "c7i",
			Modes:     []string{"l4-kernel"},
			RootDir:   root,
			StateDir:  "file://" + filepath.Join(root, "state"),
		},
		providers: []provider.Provider{&failingCreateProvider{createErr: provisionErr}},
	}

	err := o.Run(context.Background())

	if err == nil {
		t.Fatal("Run() error = nil, want provisioning failure")
	}
	for _, want := range []string{"create pair c7i.large", provisionErr.Error()} {
		if !strings.Contains(err.Error(), want) {
			t.Fatalf("Run() error = %q, want %q", err, want)
		}
	}
}

func TestRunWithOutcomeSeparatesProvisioningAndCleanupFailures(t *testing.T) {
	root := t.TempDir()
	t.Chdir(root)
	provisionErr := errors.New("provider create failed")
	cleanupErr := errors.New("provider destroy denied")
	o := &Orchestrator{
		cfg: &config.Config{
			Providers: []string{"eks"},
			Family:    "c7i",
			Modes:     []string{"l4-kernel"},
			RootDir:   root,
			StateDir:  "file://" + filepath.Join(root, "state"),
		},
		providers: []provider.Provider{&failingCreateProvider{
			createErr:  provisionErr,
			destroyErr: cleanupErr,
		}},
	}

	outcome := o.RunWithOutcome(context.Background())

	if outcome.BenchmarkErr == nil ||
		!strings.Contains(outcome.BenchmarkErr.Error(), provisionErr.Error()) {
		t.Fatalf("benchmark error = %v, want provisioning error", outcome.BenchmarkErr)
	}
	if outcome.CleanupErr == nil ||
		!strings.Contains(outcome.CleanupErr.Error(), cleanupErr.Error()) {
		t.Fatalf("cleanup error = %v, want cleanup error", outcome.CleanupErr)
	}
	if !outcome.ResourcesChanged {
		t.Fatal("provider lifecycle calls were not reported as resource changes")
	}
	if err := outcome.Err(); err == nil ||
		!strings.Contains(err.Error(), provisionErr.Error()) ||
		!strings.Contains(err.Error(), cleanupErr.Error()) {
		t.Fatalf("combined error = %v, want both failures", err)
	}
}

func TestPairResourceRecordsCarryRunOwnershipAndCleanupIdentifiers(t *testing.T) {
	records := pairResourceRecords(
		"aws",
		"tb_2026-07-24_ab12cd",
		"c7i.large",
		&provider.PairOutput{
			StackName:        "tailbench-aws-c7i-large-ab12cd",
			ServerName:       "server",
			ClientName:       "client",
			RouterName:       "router",
			ServerInstanceID: "i-server",
			ClientInstanceID: "i-client",
			RouterInstanceID: "i-router",
		},
		true,
	)

	if len(records) != 4 {
		t.Fatalf("records = %#v, want topology/server/client/router", records)
	}
	for _, record := range records {
		if record.CleanupOwner != "tb_2026-07-24_ab12cd" ||
			!record.OwnershipCertain ||
			record.StackName != "tailbench-aws-c7i-large-ab12cd" ||
			record.Status != runstateResourceCreated {
			t.Fatalf("resource record = %#v", record)
		}
	}
}

func TestRunReturnsInstanceDiscoveryFailureInsteadOfEmptySuccess(t *testing.T) {
	root := t.TempDir()
	t.Chdir(root)
	discoveryErr := errors.New("instance catalog unavailable")
	o := &Orchestrator{
		cfg: &config.Config{
			Providers: []string{"eks"},
			Family:    "c7i",
			Modes:     []string{"l4-kernel"},
			RootDir:   root,
			StateDir:  "file://" + filepath.Join(root, "state"),
		},
		providers: []provider.Provider{&failingCreateProvider{listErr: discoveryErr}},
	}

	err := o.Run(context.Background())

	if err == nil {
		t.Fatal("Run() error = nil, want discovery failure")
	}
	for _, want := range []string{"listing instances", "family c7i", discoveryErr.Error()} {
		if !strings.Contains(err.Error(), want) {
			t.Fatalf("Run() error = %q, want %q", err, want)
		}
	}
}

func TestRunDoesNotDeletePulumiLocksDuringOrdinaryStartup(t *testing.T) {
	root := t.TempDir()
	t.Chdir(root)
	stateDir := filepath.Join(root, "state")
	lockPath := filepath.Join(stateDir, "eks", ".pulumi", "locks", "stack.json")
	if err := os.MkdirAll(filepath.Dir(lockPath), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(lockPath, []byte("owned lock"), 0o600); err != nil {
		t.Fatal(err)
	}
	o := &Orchestrator{
		cfg: &config.Config{
			Providers: []string{"eks"},
			Family:    "c7i",
			Modes:     []string{"l4-kernel"},
			RootDir:   root,
			StateDir:  "file://" + stateDir,
			DryRun:    true,
		},
		providers: []provider.Provider{&failingCreateProvider{}},
	}

	if err := o.Run(context.Background()); err != nil {
		t.Fatalf("Run: %v", err)
	}
	data, err := os.ReadFile(lockPath)
	if err != nil {
		t.Fatalf("ordinary startup removed Pulumi lock: %v", err)
	}
	if got, want := string(data), "owned lock"; got != want {
		t.Fatalf("lock contents = %q, want %q", got, want)
	}
}

func TestLegacyOrchestratorDryRunDoesNotWriteStateOrCallProvider(t *testing.T) {
	root := t.TempDir()
	t.Chdir(root)
	stateDir := filepath.Join(root, "state")
	p := &failingCreateProvider{}
	o := &Orchestrator{
		cfg: &config.Config{
			Providers: []string{"eks"},
			Family:    "c7i",
			Modes:     []string{"l4-kernel"},
			RootDir:   root,
			StateDir:  "file://" + stateDir,
			DryRun:    true,
		},
		providers: []provider.Provider{p},
	}

	outcome := o.RunWithOutcome(context.Background())

	if err := outcome.Err(); err != nil {
		t.Fatalf("dry run: %v", err)
	}
	if p.listCalls != 0 {
		t.Fatalf("dry run made %d provider discovery calls, want 0", p.listCalls)
	}
	if _, err := os.Stat(stateDir); !os.IsNotExist(err) {
		t.Fatalf("dry run created state directory: %v", err)
	}
}

func TestRunAlwaysCleansCreatedTailnetWhenACLSetupFails(t *testing.T) {
	root := t.TempDir()
	t.Chdir(root)
	aclErr := errors.New("ACL update denied")
	manager := &failingACLManager{aclErr: aclErr}
	recorder := &recordingStateRecorder{}
	o := &Orchestrator{
		cfg: &config.Config{
			CreateTailnet:     true,
			CleanupNetworking: true,
			CleanupPolicy:     config.CleanupAlways,
			RunID:             "tb_2026-07-24_ab12cd",
			StateDir:          "file://" + filepath.Join(root, "state"),
			// Present so the run reaches ACL setup; this test is about
			// compensating cleanup after an ACL failure, not credentials.
			OAuthClientID:     "test-id",
			OAuthClientSecret: "test-secret",
		},
		tailnet:  manager,
		recorder: recorder,
	}

	outcome := o.RunWithOutcome(context.Background())

	if outcome.BenchmarkErr == nil || !strings.Contains(outcome.BenchmarkErr.Error(), aclErr.Error()) {
		t.Fatalf("benchmark error = %v, want ACL failure", outcome.BenchmarkErr)
	}
	if outcome.CleanupErr != nil {
		t.Fatalf("cleanup error = %v, want successful compensating cleanup", outcome.CleanupErr)
	}
	if manager.deleteCalls != 1 || manager.deletedDNS != "tail-ab12cd.ts.net" {
		t.Fatalf("tailnet deletion = %d calls for %q, want one compensating delete", manager.deleteCalls, manager.deletedDNS)
	}
	resource, ok := recorder.resource("tailscale/tailnet")
	if !ok || resource.Status != runstateResourceCleaned {
		t.Fatalf("tailnet resource = %#v, found %t; want cleaned", resource, ok)
	}
}

func TestTSNetStateDirectoryIsRunOwnedAndPreservesLegacyState(t *testing.T) {
	root := t.TempDir()
	t.Chdir(root)
	legacyState := filepath.Join(root, ".tailbench", "tsnet", "sentinel")
	if err := os.MkdirAll(filepath.Dir(legacyState), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(legacyState, []byte("another run"), 0o600); err != nil {
		t.Fatal(err)
	}

	got := tsnetStateDirectory(&config.Config{RunID: "tb_2026-07-24_ab12cd"})
	want := filepath.Join(".tailbench", "runs", "tb_2026-07-24_ab12cd", "tsnet")
	if got != want {
		t.Fatalf("tsnet state directory = %q, want %q", got, want)
	}
	data, err := os.ReadFile(legacyState)
	if err != nil {
		t.Fatalf("run-scoped path selection removed legacy state: %v", err)
	}
	if string(data) != "another run" {
		t.Fatalf("legacy state = %q, want preserved sentinel", data)
	}
}

func TestRelayNetworkMutationHelpersSurfaceEveryHostFailure(t *testing.T) {
	clientErr := errors.New("client iptables denied")
	serverErr := errors.New("server iptables denied")
	routerErr := errors.New("router iptables denied")
	client := failingCommandExecutor{err: clientErr}
	server := failingCommandExecutor{err: serverErr}
	router := failingCommandExecutor{err: routerErr}

	blockErr := blockDirectPair(context.Background(), client, server)
	for _, want := range []string{"block client direct path", clientErr.Error(), "block server direct path", serverErr.Error()} {
		if blockErr == nil || !strings.Contains(blockErr.Error(), want) {
			t.Fatalf("block error = %v, want %q", blockErr, want)
		}
	}

	restoreErr := restoreRelayNetwork(context.Background(), client, server, router)
	for _, want := range []string{
		"unblock relay port",
		routerErr.Error(),
		"unblock client direct path",
		clientErr.Error(),
		"unblock server direct path",
		serverErr.Error(),
	} {
		if restoreErr == nil || !strings.Contains(restoreErr.Error(), want) {
			t.Fatalf("restore error = %v, want %q", restoreErr, want)
		}
	}
}

func TestValidateModeNamesRejectsTypos(t *testing.T) {
	err := validateModeNames(&config.Config{Modes: []string{"l4-kernel", "l4-kernal"}})
	require.Error(t, err)
	assert.Contains(t, err.Error(), `unknown benchmark mode "l4-kernal"`)
	assert.Contains(t, err.Error(), "l4-kernel", "error should list the valid modes")

	assert.NoError(t, validateModeNames(&config.Config{Modes: []string{"l4-kernel", "l7-serve-h2"}}))
}

func TestValidateCredentialsChecksPresenceOnly(t *testing.T) {
	t.Run("both present", func(t *testing.T) {
		// Deliberately not shaped like real Tailscale credentials: validity is
		// the API's call, not ours.
		err := validateCredentials(&config.Config{
			OAuthClientID:     "anything",
			OAuthClientSecret: "anything",
		})
		assert.NoError(t, err)
	})

	for name, cfg := range map[string]*config.Config{
		"both empty":   {},
		"id empty":     {OAuthClientSecret: "s"},
		"secret empty": {OAuthClientID: "k"},
	} {
		t.Run(name, func(t *testing.T) {
			err := validateCredentials(cfg)
			require.Error(t, err)
			// The message must name what to set, where to set it, and the way
			// out for someone who just wants a dry run.
			for _, want := range []string{".env", ".env.example", "--dry-run", "login.tailscale.com"} {
				assert.Contains(t, err.Error(), want)
			}
		})
	}

	t.Run("names only the missing variable", func(t *testing.T) {
		err := validateCredentials(&config.Config{OAuthClientID: "k"})
		require.Error(t, err)
		assert.Contains(t, err.Error(), "OAUTH_CLIENT_SECRET")
		assert.NotContains(t, err.Error(), "OAUTH_CLIENT_ID")
	})
}

func TestInstanceCachePathIsKeyedOnFamily(t *testing.T) {
	assert.NotEqual(t, instanceCachePath("aws", "all"), instanceCachePath("aws", "c7i"),
		"a --family c7i cache must not satisfy a later --family all run")
	assert.Equal(t, instanceCachePath("aws", "all"), instanceCachePath("aws", ""))
}

// The legacy no-suffix result path is an alternative to the mode-suffixed one,
// not an additional requirement. Requiring both made l4-kernel permanently
// pending, because no legacy file exists in any provider tree.
func TestPendingModesAcceptsEitherResultPath(t *testing.T) {
	const (
		provider     = "aws"
		family       = "c7i"
		instanceType = "c7i.large"
	)

	for name, tc := range map[string]struct {
		modern, legacy bool
		mode           string
		wantPending    bool
	}{
		"l4-kernel, neither file":    {mode: "l4-kernel", wantPending: true},
		"l4-kernel, modern only":     {modern: true, mode: "l4-kernel"},
		"l4-kernel, legacy only":     {legacy: true, mode: "l4-kernel"},
		"l4-kernel, both":            {modern: true, legacy: true, mode: "l4-kernel"},
		"other mode, neither file":   {mode: "l7-serve-h1", wantPending: true},
		"other mode, modern only":    {modern: true, mode: "l7-serve-h1"},
		"other mode, legacy no help": {legacy: true, mode: "l7-serve-h1", wantPending: true},
	} {
		t.Run(name, func(t *testing.T) {
			root := t.TempDir()
			results := filepath.Join(root, provider, family, "results")
			require.NoError(t, os.MkdirAll(results, 0o755))
			write := func(name string) {
				require.NoError(t, os.WriteFile(filepath.Join(results, name), []byte("{}"), 0o644))
			}
			if tc.modern {
				write(instanceType + "-" + tc.mode + ".json")
			}
			if tc.legacy {
				write(instanceType + ".json")
			}

			pending := pendingModesForInstance(root, provider, family, instanceType, []string{tc.mode}, "vm")
			if tc.wantPending {
				assert.Equal(t, []string{tc.mode}, pending)
			} else {
				assert.Empty(t, pending, "a satisfied mode must not be reported pending")
			}
		})
	}
}

// The local plan reports a fully-satisfied instance as needing no work and
// promises "compute=0" in the confirmation the user approves. The run path must
// agree, or it provisions billable resources the approved plan excluded.
func TestFullySatisfiedInstanceIsNotProvisioned(t *testing.T) {
	root := t.TempDir()
	modes := []string{"l4-kernel", "l7-serve-h1", "l7-serve-h2"}
	results := filepath.Join(root, "aws", "c7i", "results")
	require.NoError(t, os.MkdirAll(results, 0o755))
	for _, mode := range modes {
		require.NoError(t, os.WriteFile(
			filepath.Join(results, "c7i.large-"+mode+".json"), []byte("{}"), 0o644))
	}

	assert.Empty(t,
		pendingModesForInstance(root, "aws", "c7i", "c7i.large", modes, "vm"),
		"every configured mode has a result, so the run must skip the instance entirely")
}

func TestCompletedForwardModeDoesNotNeedRouter(t *testing.T) {
	root := t.TempDir()
	resultDir := filepath.Join(root, "gcp", "c4", "results")
	require.NoError(t, os.MkdirAll(resultDir, 0o755))
	require.NoError(t, os.WriteFile(
		filepath.Join(resultDir, "c4-standard-4-forward-pps-exit.json"),
		[]byte("{}"),
		0o644,
	))

	pending := pendingModesForInstance(
		root,
		"gcp",
		"c4",
		"c4-standard-4",
		[]string{"forward-pps-exit", "l7-serve-h1"},
		"vm",
	)

	assert.Equal(t, []string{"l7-serve-h1"}, pending)
	assert.False(t, hasForwardMode(pending))
}

func TestForwardPPSTestConfigRecordsEffectiveSettings(t *testing.T) {
	pps := &result.PPSResult{
		LossThresholdPct: 0.25,
		Sizes: []result.PPSSizeResult{
			{DatagramBytes: 96},
			{DatagramBytes: 512},
			{DatagramBytes: 1200},
		},
	}

	assert.Equal(t, &result.TestConfig{
		PPSDatagramSizes:    []int{96, 512, 1200},
		PPSLossThresholdPct: 0.25,
	}, forwardPPSTestConfig(pps))
	assert.Nil(t, forwardPPSTestConfig(nil))
}

func TestBenchmarkRunConfigPropagatesPPSSettings(t *testing.T) {
	o := &Orchestrator{cfg: &config.Config{
		PPSDatagramSizes:    []int{96, 512, 1200},
		PPSLossThresholdPct: 0.25,
		PPSDurationSec:      9,
		PPSMaxRatePPS:       750_000,
	}}

	got := o.benchmarkRunConfig("auth-key", "server", "client")
	assert.Equal(t, []int{96, 512, 1200}, got.PPSDatagramSizes)
	assert.Equal(t, 0.25, got.PPSLossThresholdPct)
	assert.Equal(t, 9, got.PPSDurationSec)
	assert.Equal(t, 750_000, got.PPSMaxRatePPS)
	assert.Equal(t, "auth-key", got.AuthKey)
	assert.Equal(t, "server", got.ServerHostname)
	assert.Equal(t, "client", got.ClientHostname)
	assert.True(t, got.SkipTailscaleSetup)
}

// cloud-init runs `tailscale serve --https=443` for any l7-serve mode, and that
// blocks forever when HTTPS is off on the tailnet. Gating HTTPS on K8s alone
// stalled VM runs until their deadline.
func TestTailnetHTTPSRequiredByL7ServeAndK8s(t *testing.T) {
	// failingCreateProvider reports itself as "eks"; an empty provider list
	// stands in for a VM run, since hasK8sProviders reads the constructed
	// providers rather than the configured names.
	k8sProviders := []provider.Provider{&failingCreateProvider{}}

	for name, tc := range map[string]struct {
		modes     []string
		providers []provider.Provider
		want      bool
	}{
		"vm, l4 only":            {modes: []string{"l4-kernel"}},
		"vm, l7-serve-h1":        {modes: []string{"l4-kernel", "l7-serve-h1"}, want: true},
		"vm, l7-serve-h2":        {modes: []string{"l7-serve-h2"}, want: true},
		"k8s, no l7-serve":       {modes: []string{"l4-kernel"}, providers: k8sProviders, want: true},
		"k8s, container l7 only": {modes: []string{"l7-ingress-h1"}, providers: k8sProviders, want: true},
	} {
		t.Run(name, func(t *testing.T) {
			o := &Orchestrator{
				cfg:       &config.Config{Modes: tc.modes},
				providers: tc.providers,
			}
			if got := o.needsTailnetHTTPS(); got != tc.want {
				t.Fatalf("needsTailnetHTTPS() = %t, want %t", got, tc.want)
			}
		})
	}
}
