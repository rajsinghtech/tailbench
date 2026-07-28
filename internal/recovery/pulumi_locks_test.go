package recovery

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestFindPulumiLocksSelectsOnlyRecordedStackPathsWithoutWriting(t *testing.T) {
	root := t.TempDir()
	owned := filepath.Join(
		root,
		".pulumi",
		"locks",
		"organization",
		"tailbench",
		"tailbench-aws-c7i-large-ab12cd",
		"owned.json",
	)
	unrelated := filepath.Join(
		root,
		".pulumi",
		"locks",
		"organization",
		"tailbench",
		"tailbench-aws-m7i-large-other",
		"unrelated.json",
	)
	for path, content := range map[string]string{
		owned:     "owned lock",
		unrelated: "unrelated lock",
	} {
		if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
			t.Fatal(err)
		}
	}

	got, err := FindPulumiLocks(root, []string{"tailbench-aws-c7i-large-ab12cd"})
	if err != nil {
		t.Fatal(err)
	}
	want := []string{owned}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("locks = %v, want %v", got, want)
	}
	for path, wantContent := range map[string]string{
		owned:     "owned lock",
		unrelated: "unrelated lock",
	} {
		data, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("discovery changed %s: %v", path, err)
		}
		if string(data) != wantContent {
			t.Fatalf("%s = %q, want %q", path, data, wantContent)
		}
	}
}

func TestRemovePulumiLocksRemovesOnlyValidatedFiles(t *testing.T) {
	root := t.TempDir()
	owned := filepath.Join(
		root,
		".pulumi",
		"locks",
		"organization",
		"tailbench",
		"tailbench-aws-c7i-large-ab12cd",
		"owned.json",
	)
	unrelated := filepath.Join(root, ".pulumi", "locks", "other", "unrelated.json")
	for _, path := range []string{owned, unrelated} {
		if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte("lock"), 0o600); err != nil {
			t.Fatal(err)
		}
	}

	removed, err := RemovePulumiLocks(root, []string{owned})
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(removed, []string{owned}) {
		t.Fatalf("removed = %v, want %v", removed, []string{owned})
	}
	if _, err := os.Stat(owned); !os.IsNotExist(err) {
		t.Fatalf("owned lock still exists: %v", err)
	}
	if data, err := os.ReadFile(unrelated); err != nil || string(data) != "lock" {
		t.Fatalf("unrelated lock changed: data=%q err=%v", data, err)
	}
}

func TestRemovePulumiLocksRejectsPathsOutsideBackend(t *testing.T) {
	root := t.TempDir()
	outside := filepath.Join(t.TempDir(), "lock.json")
	if err := os.WriteFile(outside, []byte("do not remove"), 0o600); err != nil {
		t.Fatal(err)
	}

	if _, err := RemovePulumiLocks(root, []string{outside}); err == nil {
		t.Fatal("outside lock removal succeeded")
	}
	if data, err := os.ReadFile(outside); err != nil || string(data) != "do not remove" {
		t.Fatalf("outside file changed: data=%q err=%v", data, err)
	}
}

func TestFindPulumiLocksRequiresRecordedStackNames(t *testing.T) {
	if _, err := FindPulumiLocks(t.TempDir(), nil); err == nil {
		t.Fatal("lock discovery without stack ownership succeeded")
	}
}
