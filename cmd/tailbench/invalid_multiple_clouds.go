//go:build (aws && azure) || (aws && gcp) || (azure && gcp)

package main

var _ = tailbenchBuildDoesNotSupportMultipleCloudTags
