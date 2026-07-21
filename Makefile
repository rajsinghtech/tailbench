GO ?= go
BIN_DIR ?= dist
TOOLS_DIR ?= .tools
VERSION ?= dev
COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo unknown)
BUILD_DATE ?= $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
GO_TEST_FLAGS ?= -p=1
GOLANGCI_LINT_VERSION ?= v2.11.4
GOLANGCI_LINT := $(TOOLS_DIR)/bin/golangci-lint
LDFLAGS := -s -w -X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(BUILD_DATE)

.DEFAULT_GOAL := help
.NOTPARALLEL:

.PHONY: help fmt lint lint-aws lint-aws-k8s lint-azure lint-azure-k8s lint-gcp lint-gcp-k8s
.PHONY: test test-website test-aws test-aws-k8s test-azure test-azure-k8s test-gcp test-gcp-k8s
.PHONY: build build-aws build-aws-k8s build-azure build-azure-k8s build-gcp build-gcp-k8s
.PHONY: verify-deps clean golangci-lint

help:
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z0-9_-]+:.*## / {printf "%-22s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

fmt: ## Check gofmt formatting
	@files="$$(gofmt -l $$(find cmd internal -name '*.go' -type f))"; \
		test -z "$$files" || { printf '%s\n' "$$files"; exit 1; }

golangci-lint: ## Install the pinned repository-local linter
	@if test ! -x "$(GOLANGCI_LINT)"; then \
		mkdir -p "$(TOOLS_DIR)/bin"; \
		GOBIN="$(abspath $(TOOLS_DIR))/bin" $(GO) install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@$(GOLANGCI_LINT_VERSION); \
	fi

lint: lint-aws lint-aws-k8s lint-azure lint-azure-k8s lint-gcp lint-gcp-k8s ## Lint all variants sequentially
lint-aws: golangci-lint ## Lint AWS VM variant
	$(GOLANGCI_LINT) run --build-tags aws ./...
lint-aws-k8s: golangci-lint ## Lint EKS variant
	$(GOLANGCI_LINT) run --build-tags aws,k8s ./...
lint-azure: golangci-lint ## Lint Azure VM variant
	$(GOLANGCI_LINT) run --build-tags azure ./...
lint-azure-k8s: golangci-lint ## Lint AKS variant
	$(GOLANGCI_LINT) run --build-tags azure,k8s ./...
lint-gcp: golangci-lint ## Lint GCP VM variant
	$(GOLANGCI_LINT) run --build-tags gcp ./...
lint-gcp-k8s: golangci-lint ## Lint GKE variant
	$(GOLANGCI_LINT) run --build-tags gcp,k8s ./...

test: test-website test-aws test-aws-k8s test-azure test-azure-k8s test-gcp test-gcp-k8s ## Test website and all variants sequentially
test-website: ## Test dashboard data-gating behavior
	node --test website/index.test.js
test-aws: ## Test AWS VM variant
	$(GO) test $(GO_TEST_FLAGS) -tags aws ./...
test-aws-k8s: ## Test EKS variant
	$(GO) test $(GO_TEST_FLAGS) -tags 'aws,k8s' ./...
test-azure: ## Test Azure VM variant
	$(GO) test $(GO_TEST_FLAGS) -tags azure ./...
test-azure-k8s: ## Test AKS variant
	$(GO) test $(GO_TEST_FLAGS) -tags 'azure,k8s' ./...
test-gcp: ## Test GCP VM variant
	$(GO) test $(GO_TEST_FLAGS) -tags gcp ./...
test-gcp-k8s: ## Test GKE variant
	$(GO) test $(GO_TEST_FLAGS) -tags 'gcp,k8s' ./...

build: build-aws build-aws-k8s build-azure build-azure-k8s build-gcp build-gcp-k8s ## Build all variants sequentially
build-aws: ## Build tailbench-aws
	mkdir -p $(BIN_DIR)
	$(GO) build -tags aws -trimpath -ldflags "$(LDFLAGS)" -o $(BIN_DIR)/tailbench-aws ./cmd/tailbench
build-aws-k8s: ## Build tailbench-aws-k8s
	mkdir -p $(BIN_DIR)
	$(GO) build -tags 'aws,k8s' -trimpath -ldflags "$(LDFLAGS)" -o $(BIN_DIR)/tailbench-aws-k8s ./cmd/tailbench
build-azure: ## Build tailbench-azure
	mkdir -p $(BIN_DIR)
	$(GO) build -tags azure -trimpath -ldflags "$(LDFLAGS)" -o $(BIN_DIR)/tailbench-azure ./cmd/tailbench
build-azure-k8s: ## Build tailbench-azure-k8s
	mkdir -p $(BIN_DIR)
	$(GO) build -tags 'azure,k8s' -trimpath -ldflags "$(LDFLAGS)" -o $(BIN_DIR)/tailbench-azure-k8s ./cmd/tailbench
build-gcp: ## Build tailbench-gcp
	mkdir -p $(BIN_DIR)
	$(GO) build -tags gcp -trimpath -ldflags "$(LDFLAGS)" -o $(BIN_DIR)/tailbench-gcp ./cmd/tailbench
build-gcp-k8s: ## Build tailbench-gcp-k8s
	mkdir -p $(BIN_DIR)
	$(GO) build -tags 'gcp,k8s' -trimpath -ldflags "$(LDFLAGS)" -o $(BIN_DIR)/tailbench-gcp-k8s ./cmd/tailbench

verify-deps: ## Verify provider and Kubernetes dependency boundaries (VARIANT may select one)
	GO="$(GO)" ./scripts/verify-deps.sh "$(VARIANT)"

clean: ## Remove generated binaries and repository-local tools
	rm -rf "$(BIN_DIR)" "$(TOOLS_DIR)"
