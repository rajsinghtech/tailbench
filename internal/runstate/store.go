package runstate

import (
	"bufio"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"time"
)

var (
	ErrInvalidRunID = errors.New("invalid run ID")
	ErrRunNotFound  = errors.New("run not found")
	ErrRunExists    = errors.New("run already exists")

	runIDPattern = regexp.MustCompile(`^tb_[0-9]{4}-[0-9]{2}-[0-9]{2}_[a-f0-9]{6,32}$`)
)

const (
	manifestFilename        = "manifest.json"
	eventsFilename          = "events.jsonl"
	effectiveConfigFilename = "effective-config.redacted.yaml"
	planFilename            = "plan.json"
	summaryFilename         = "summary.json"
	logFilename             = "tailbench.log"
)

type Store struct {
	root string
	now  func() time.Time
}

func NewStore(root string) *Store {
	return &Store{
		root: root,
		now:  func() time.Time { return time.Now().UTC() },
	}
}

func (s *Store) Root() string {
	return s.root
}

func (s *Store) RunDirectory(runID string) (string, error) {
	runDir, err := s.runDir(runID)
	if err != nil {
		return "", err
	}
	if _, err := os.Stat(filepath.Join(runDir, manifestFilename)); err != nil {
		if os.IsNotExist(err) {
			return "", fmt.Errorf("%w: %s", ErrRunNotFound, runID)
		}
		return "", fmt.Errorf("inspect run directory for %s: %w", runID, err)
	}
	return runDir, nil
}

func GenerateRunID(now time.Time, source io.Reader) (string, error) {
	if source == nil {
		source = rand.Reader
	}
	suffix := make([]byte, 3)
	if _, err := io.ReadFull(source, suffix); err != nil {
		return "", fmt.Errorf("generate run ID suffix: %w", err)
	}
	return fmt.Sprintf("tb_%s_%s", now.Format("2006-01-02"), hex.EncodeToString(suffix)), nil
}

func (s *Store) GenerateRunID() (string, error) {
	return GenerateRunID(s.now(), rand.Reader)
}

func (s *Store) Create(request CreateRequest) (*Manifest, error) {
	runDir, err := s.runDir(request.RunID)
	if err != nil {
		return nil, err
	}

	startedAt := request.StartedAt
	if startedAt.IsZero() {
		startedAt = s.now()
	}
	benchmarkStatus := request.InitialBenchmarkStatus
	if benchmarkStatus == "" {
		benchmarkStatus = OutcomePending
	}
	cleanupStatus := request.InitialCleanupStatus
	if cleanupStatus == "" {
		cleanupStatus = OutcomePending
	}

	if err := os.MkdirAll(s.root, 0o700); err != nil {
		return nil, fmt.Errorf("create run-state root %s: %w", s.root, err)
	}
	if err := os.Mkdir(runDir, 0o700); err != nil {
		if os.IsExist(err) {
			return nil, fmt.Errorf("%w: %s", ErrRunExists, request.RunID)
		}
		return nil, fmt.Errorf("create run directory %s: %w", runDir, err)
	}
	if err := os.Mkdir(filepath.Join(runDir, "logs"), 0o700); err != nil {
		return nil, fmt.Errorf("create run log directory %s: %w", runDir, err)
	}
	if err := createEmptyFile(filepath.Join(runDir, eventsFilename)); err != nil {
		return nil, err
	}
	if err := createEmptyFile(filepath.Join(runDir, "logs", logFilename)); err != nil {
		return nil, err
	}
	if err := atomicWrite(filepath.Join(runDir, planFilename), request.PlanJSON, 0o600); err != nil {
		return nil, fmt.Errorf("write plan: %w", err)
	}
	if err := atomicWrite(filepath.Join(runDir, effectiveConfigFilename), request.EffectiveConfigYAML, 0o600); err != nil {
		return nil, fmt.Errorf("write effective configuration: %w", err)
	}

	manifest := &Manifest{
		SchemaVersion:       SchemaVersion,
		Revision:            1,
		RunID:               request.RunID,
		Status:              RunRunning,
		StartedAt:           startedAt,
		CommandLine:         append([]string(nil), request.CommandLine...),
		Binary:              request.Binary,
		Provider:            request.Provider,
		Workload:            request.Workload,
		Region:              request.Region,
		Zone:                request.Zone,
		Identity:            request.Identity,
		EffectiveConfigPath: effectiveConfigFilename,
		PlanPath:            planFilename,
		PlanHash:            request.PlanHash,
		LogPath:             filepath.Join("logs", logFilename),
		SummaryPath:         summaryFilename,
		Images:              append([]ImageInfo(nil), request.Images...),
		Work:                append([]WorkItem(nil), request.InitialWork...),
		BenchmarkOutcome:    benchmarkStatus,
		CleanupOutcome:      cleanupStatus,
	}
	if err := s.save(manifest); err != nil {
		return nil, err
	}
	if err := s.AppendEvent(request.RunID, Event{
		SchemaVersion: EventSchemaVersion,
		RunID:         request.RunID,
		Time:          startedAt,
		Kind:          EventRunCreated,
		Message:       "run manifest created",
	}); err != nil {
		return nil, err
	}
	return manifest, nil
}

func (s *Store) Load(runID string) (*Manifest, error) {
	runDir, err := s.runDir(runID)
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(filepath.Join(runDir, manifestFilename))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("%w: %s", ErrRunNotFound, runID)
		}
		return nil, fmt.Errorf("read manifest for %s: %w", runID, err)
	}
	var manifest Manifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("decode manifest for %s: %w", runID, err)
	}
	if manifest.SchemaVersion != SchemaVersion {
		return nil, fmt.Errorf(
			"unsupported manifest schema %d for %s; expected %d",
			manifest.SchemaVersion,
			runID,
			SchemaVersion,
		)
	}
	if manifest.RunID != runID {
		return nil, fmt.Errorf("manifest run ID %q does not match directory %q", manifest.RunID, runID)
	}
	return &manifest, nil
}

func (s *Store) Update(runID string, mutate func(*Manifest) error) (*Manifest, error) {
	if mutate == nil {
		return nil, errors.New("manifest update function is required")
	}
	manifest, err := s.Load(runID)
	if err != nil {
		return nil, err
	}
	if err := mutate(manifest); err != nil {
		return nil, err
	}
	manifest.Revision++
	if err := s.save(manifest); err != nil {
		return nil, err
	}
	return manifest, nil
}

func (s *Store) AppendEvent(runID string, event Event) error {
	runDir, err := s.runDir(runID)
	if err != nil {
		return err
	}
	if event.SchemaVersion == 0 {
		event.SchemaVersion = EventSchemaVersion
	}
	if event.RunID == "" {
		event.RunID = runID
	}
	if event.RunID != runID {
		return fmt.Errorf("event run ID %q does not match %q", event.RunID, runID)
	}
	if event.Time.IsZero() {
		event.Time = s.now()
	}
	line, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("encode event: %w", err)
	}
	line = append(line, '\n')

	path := filepath.Join(runDir, eventsFilename)
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("%w: %s", ErrRunNotFound, runID)
		}
		return fmt.Errorf("open event log for %s: %w", runID, err)
	}
	if _, err := file.Write(line); err != nil {
		_ = file.Close()
		return fmt.Errorf("append event for %s: %w", runID, err)
	}
	if err := file.Sync(); err != nil {
		_ = file.Close()
		return fmt.Errorf("sync event log for %s: %w", runID, err)
	}
	if err := file.Close(); err != nil {
		return fmt.Errorf("close event log for %s: %w", runID, err)
	}
	return nil
}

func (s *Store) Events(runID string) ([]Event, error) {
	runDir, err := s.runDir(runID)
	if err != nil {
		return nil, err
	}
	file, err := os.Open(filepath.Join(runDir, eventsFilename))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("%w: %s", ErrRunNotFound, runID)
		}
		return nil, fmt.Errorf("open event log for %s: %w", runID, err)
	}
	defer func() { _ = file.Close() }()

	var events []Event
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 64*1024), 1024*1024)
	for scanner.Scan() {
		var event Event
		if err := json.Unmarshal(scanner.Bytes(), &event); err != nil {
			return nil, fmt.Errorf("decode event %d for %s: %w", len(events)+1, runID, err)
		}
		events = append(events, event)
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("read event log for %s: %w", runID, err)
	}
	return events, nil
}

func (s *Store) WriteSummary(runID string, value any) error {
	runDir, err := s.RunDirectory(runID)
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return fmt.Errorf("encode summary for %s: %w", runID, err)
	}
	data = append(data, '\n')
	if err := atomicWrite(filepath.Join(runDir, summaryFilename), data, 0o600); err != nil {
		return fmt.Errorf("write summary for %s: %w", runID, err)
	}
	return nil
}

func (s *Store) OpenLog(runID string) (*os.File, error) {
	runDir, err := s.RunDirectory(runID)
	if err != nil {
		return nil, err
	}
	path := filepath.Join(runDir, "logs", logFilename)
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		return nil, fmt.Errorf("open run log for %s: %w", runID, err)
	}
	return file, nil
}

func (s *Store) ReadEffectiveConfig(runID string) ([]byte, error) {
	return s.readRunFile(runID, effectiveConfigFilename)
}

func (s *Store) ReadPlan(runID string) ([]byte, error) {
	return s.readRunFile(runID, planFilename)
}

func (s *Store) readRunFile(runID, filename string) ([]byte, error) {
	runDir, err := s.RunDirectory(runID)
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(filepath.Join(runDir, filename))
	if err != nil {
		return nil, fmt.Errorf("read %s for %s: %w", filename, runID, err)
	}
	return data, nil
}

func (s *Store) save(manifest *Manifest) error {
	if manifest == nil {
		return errors.New("manifest is required")
	}
	runDir, err := s.runDir(manifest.RunID)
	if err != nil {
		return err
	}
	if manifest.SchemaVersion != SchemaVersion {
		return fmt.Errorf("manifest schema is %d, want %d", manifest.SchemaVersion, SchemaVersion)
	}
	data, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return fmt.Errorf("encode manifest for %s: %w", manifest.RunID, err)
	}
	data = append(data, '\n')
	if err := atomicWrite(filepath.Join(runDir, manifestFilename), data, 0o600); err != nil {
		return fmt.Errorf("write manifest for %s: %w", manifest.RunID, err)
	}
	return nil
}

func (s *Store) runDir(runID string) (string, error) {
	if err := validateRunID(runID); err != nil {
		return "", err
	}
	if s.root == "" {
		return "", errors.New("run-state root is required")
	}
	return filepath.Join(s.root, runID), nil
}

func validateRunID(runID string) error {
	if !runIDPattern.MatchString(runID) {
		return fmt.Errorf("%w %q; expected tb_YYYY-MM-DD_hex", ErrInvalidRunID, runID)
	}
	return nil
}

func createEmptyFile(path string) error {
	file, err := os.OpenFile(path, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0o600)
	if err != nil {
		return fmt.Errorf("create %s: %w", path, err)
	}
	if err := file.Sync(); err != nil {
		_ = file.Close()
		return fmt.Errorf("sync %s: %w", path, err)
	}
	if err := file.Close(); err != nil {
		return fmt.Errorf("close %s: %w", path, err)
	}
	return nil
}

func atomicWrite(path string, data []byte, mode os.FileMode) (returnErr error) {
	dir := filepath.Dir(path)
	file, err := os.CreateTemp(dir, "."+filepath.Base(path)+"-*")
	if err != nil {
		return err
	}
	tempPath := file.Name()
	defer func() {
		if returnErr != nil {
			_ = os.Remove(tempPath)
		}
	}()
	if err := file.Chmod(mode); err != nil {
		_ = file.Close()
		return err
	}
	if _, err := file.Write(data); err != nil {
		_ = file.Close()
		return err
	}
	if err := file.Sync(); err != nil {
		_ = file.Close()
		return err
	}
	if err := file.Close(); err != nil {
		return err
	}
	if err := os.Rename(tempPath, path); err != nil {
		return err
	}
	directory, err := os.Open(dir)
	if err != nil {
		return err
	}
	defer func() { _ = directory.Close() }()
	return directory.Sync()
}
