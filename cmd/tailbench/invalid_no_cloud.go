//go:build !aws && !azure && !gcp

package main

var _ = tailbenchBuildRequiresExactlyOneOfAwsAzureOrGcp
