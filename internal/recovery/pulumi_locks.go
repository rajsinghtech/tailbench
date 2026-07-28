// Package recovery contains narrowly scoped, explicit local recovery actions.
package recovery

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func FindPulumiLocks(providerStateDir string, stackNames []string) ([]string, error) {
	locksRoot, stacks, err := validatedLockScope(providerStateDir, stackNames)
	if err != nil {
		return nil, err
	}
	if _, err := os.Stat(locksRoot); err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("inspect Pulumi lock root %s: %w", locksRoot, err)
	}

	var matches []string
	err = filepath.WalkDir(locksRoot, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			return nil
		}
		relative, err := filepath.Rel(locksRoot, path)
		if err != nil {
			return err
		}
		if !pathContainsStack(relative, stacks) {
			return nil
		}
		if entry.Type()&os.ModeSymlink != 0 {
			return fmt.Errorf("refuse symlinked Pulumi lock %s", path)
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if !info.Mode().IsRegular() {
			return fmt.Errorf("refuse non-regular Pulumi lock %s", path)
		}
		absolute, err := filepath.Abs(path)
		if err != nil {
			return err
		}
		matches = append(matches, filepath.Clean(absolute))
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("discover Pulumi locks under %s: %w", locksRoot, err)
	}
	sort.Strings(matches)
	return matches, nil
}

func RemovePulumiLocks(providerStateDir string, paths []string) ([]string, error) {
	locksRoot, _, err := validatedLockScope(providerStateDir, []string{"validation-only"})
	if err != nil {
		return nil, err
	}
	type validatedFile struct {
		path string
	}
	files := make([]validatedFile, 0, len(paths))
	seen := make(map[string]struct{}, len(paths))
	for _, path := range paths {
		absolute, err := filepath.Abs(path)
		if err != nil {
			return nil, fmt.Errorf("resolve Pulumi lock %q: %w", path, err)
		}
		absolute = filepath.Clean(absolute)
		if !isWithin(locksRoot, absolute) {
			return nil, fmt.Errorf(
				"refuse Pulumi lock outside provider backend %s: %s",
				locksRoot,
				absolute,
			)
		}
		if _, duplicate := seen[absolute]; duplicate {
			continue
		}
		info, err := os.Lstat(absolute)
		if err != nil {
			return nil, fmt.Errorf("inspect Pulumi lock %s: %w", absolute, err)
		}
		if info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
			return nil, fmt.Errorf("refuse non-regular Pulumi lock %s", absolute)
		}
		seen[absolute] = struct{}{}
		files = append(files, validatedFile{path: absolute})
	}
	sort.Slice(files, func(i, j int) bool { return files[i].path < files[j].path })

	removed := make([]string, 0, len(files))
	for _, file := range files {
		if err := os.Remove(file.path); err != nil {
			return removed, fmt.Errorf("remove Pulumi lock %s: %w", file.path, err)
		}
		removed = append(removed, file.path)
	}
	return removed, nil
}

func validatedLockScope(
	providerStateDir string,
	stackNames []string,
) (string, map[string]struct{}, error) {
	if strings.TrimSpace(providerStateDir) == "" {
		return "", nil, fmt.Errorf("provider state directory is required")
	}
	stacks := make(map[string]struct{}, len(stackNames))
	for _, stack := range stackNames {
		stack = strings.TrimSpace(stack)
		if stack == "" ||
			stack == "." ||
			stack == ".." ||
			filepath.Base(stack) != stack {
			return "", nil, fmt.Errorf("invalid recorded Pulumi stack name %q", stack)
		}
		stacks[stack] = struct{}{}
	}
	if len(stacks) == 0 {
		return "", nil, fmt.Errorf("at least one recorded Pulumi stack name is required")
	}
	root, err := filepath.Abs(providerStateDir)
	if err != nil {
		return "", nil, fmt.Errorf("resolve provider state directory: %w", err)
	}
	return filepath.Join(filepath.Clean(root), ".pulumi", "locks"), stacks, nil
}

func pathContainsStack(path string, stacks map[string]struct{}) bool {
	for _, component := range strings.Split(filepath.Clean(path), string(filepath.Separator)) {
		if _, ok := stacks[component]; ok {
			return true
		}
	}
	return false
}

func isWithin(root, path string) bool {
	relative, err := filepath.Rel(root, path)
	if err != nil {
		return false
	}
	return relative != ".." &&
		relative != "." &&
		!strings.HasPrefix(relative, ".."+string(filepath.Separator))
}
