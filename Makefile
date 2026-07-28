# Local resource-safety contract:
# - Select exactly one provider variant for build, test, lint, and dependency checks.
# - Do not use aggregate targets on a normal workstation.
# - Do not use `go run ./cmd/tailbench` as a diagnostic compilation shortcut.
# - Even one provider target requires a suitably sized machine and explicit approval
#   when an automated agent is acting for a user.

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
.PHONY: test test-contract test-shared test-command-aws test-orchestrator-aws test-website test-aws test-aws-k8s test-azure test-azure-k8s test-gcp test-gcp-k8s
.PHONY: build build-aws build-aws-k8s build-azure build-azure-k8s build-gcp build-gcp-k8s
.PHONY: verify-deps clean golangci-lint

help:
	@printf '%s\n' 'LOCAL SAFETY: choose exactly one provider variant; cloud SDK builds are memory intensive.'
	@printf '%s\n' 'Examples: make build-aws | make test-aws | make lint-aws | make verify-deps VARIANT=aws'
	@printf '%s\n' 'Aggregate build/test/lint and verify-deps without VARIANT are for CI/build hosts, not laptops.'
	@printf '%s\n' 'Do not use go run ./cmd/tailbench as a diagnostic compilation shortcut.'
	@printf '\n'
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z0-9_-]+:.*## / {printf "%-22s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

fmt: ## Check gofmt formatting without compiling provider graphs
	@files="$$(gofmt -l $$(find cmd internal -name '*.go' -type f))"; \
		test -z "$$files" || { printf '%s\n' "$$files"; exit 1; }

golangci-lint: ## Install the pinned repository-local linter (downloads if absent)
	@if test ! -x "$(GOLANGCI_LINT)"; then \
		mkdir -p "$(TOOLS_DIR)/bin"; \
		GOBIN="$(abspath $(TOOLS_DIR))/bin" $(GO) install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@$(GOLANGCI_LINT_VERSION); \
	fi

lint: lint-aws lint-aws-k8s lint-azure lint-azure-k8s lint-gcp lint-gcp-k8s ## CI/BUILD HOST ONLY: lint all six variants
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

test: test-website test-aws test-aws-k8s test-azure test-azure-k8s test-gcp test-gcp-k8s ## CI/BUILD HOST ONLY: test website and all six variants
test-contract: ## Test shared command behavior without compiling provider SDKs
	$(GO) test ./internal/app
test-shared: ## Test dependency-light shared contracts without compiling provider SDKs
	$(GO) test ./internal/app ./internal/config ./internal/plan ./internal/preflight ./internal/runstate ./internal/summary ./internal/guardrail ./internal/lifecycle ./internal/failure ./internal/retry ./internal/recovery
test-command-aws: ## Test only the AWS VM command package (compiles the AWS SDK graph)
	$(GO) test $(GO_TEST_FLAGS) -tags aws ./cmd/tailbench
test-orchestrator-aws: ## Test AWS orchestrator/provider runtime packages (compiles the AWS SDK graph)
	$(GO) test $(GO_TEST_FLAGS) -tags aws ./internal/orchestrator ./internal/provider
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

build: build-aws build-aws-k8s build-azure build-azure-k8s build-gcp build-gcp-k8s ## CI/BUILD HOST ONLY: build all six variants
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

verify-deps: ## Verify one VARIANT locally; no VARIANT checks all six on CI/build hosts
	GO="$(GO)" ./scripts/verify-deps.sh "$(VARIANT)"

clean: ## Remove generated binaries and repository-local tools
	rm -rf "$(BIN_DIR)" "$(TOOLS_DIR)"
