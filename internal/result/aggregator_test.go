package result

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAggregate(t *testing.T) {
	dir := t.TempDir()
	r1 := &BenchmarkResult{CloudProvider: "gcp", InstanceFamily: "c4", InstanceType: "c4-standard-4"}
	r2 := &BenchmarkResult{CloudProvider: "aws", InstanceFamily: "c6in", InstanceType: "c6in.xlarge"}
	require.NoError(t, WriteResult(dir, r1, false))
	require.NoError(t, WriteResult(dir, r2, false))

	require.NoError(t, Aggregate(dir))

	data, err := os.ReadFile(filepath.Join(dir, "website", "data.generated.js"))
	require.NoError(t, err)
	content := string(data)
	assert.True(t, strings.HasPrefix(content, "const TAILBENCH_DATA = "))
	assert.True(t, strings.HasSuffix(strings.TrimSpace(content), ";"))
	assert.Contains(t, content, "c4-standard-4")
	assert.Contains(t, content, "c6in.xlarge")
}

func TestAggregateEmpty(t *testing.T) {
	dir := t.TempDir()
	require.NoError(t, Aggregate(dir))

	data, err := os.ReadFile(filepath.Join(dir, "website", "data.generated.js"))
	require.NoError(t, err)
	content := string(data)
	assert.Contains(t, content, "const TAILBENCH_DATA = ")
}
