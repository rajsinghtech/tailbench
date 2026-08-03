## Summary

<!-- Describe the user-visible or developer-visible outcome. -->

## Validation

- Selected executable/variant:
- Exact commands run:
- Commands intentionally not run and why:

## Safety checklist

- [ ] I selected at most one provider variant for local build, test, lint, and
      dependency-boundary validation.
- [ ] I did not run aggregate `make build`, `make test`, `make lint`, an
      untagged repository-wide Go equivalent, or a hand-written variant loop on
      a normal workstation.
- [ ] I did not use `go run ./cmd/tailbench` as a diagnostic command.
- [ ] If I stopped a long-running command, I verified that its process group
      and compiler descendants exited.
- [ ] For a documentation-only change, I used the no-build review policy and
      did not compile a provider graph.
- [ ] I have not described an unrun check as passing; the CI/build-host matrix
      owns all-variant validation.
