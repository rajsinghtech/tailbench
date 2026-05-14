# syntax=docker/dockerfile:1.7

FROM --platform=$BUILDPLATFORM golang:1.24-bookworm AS fortio-builder
ARG TARGETOS
ARG TARGETARCH
ENV GOTOOLCHAIN=auto \
    GOOS=$TARGETOS \
    GOARCH=$TARGETARCH \
    CGO_ENABLED=0 \
    GOBIN=/out
RUN --mount=type=cache,target=/go/pkg/mod,sharing=locked \
    --mount=type=cache,target=/root/.cache/go-build,sharing=locked,id=go-build-$TARGETOS-$TARGETARCH \
    go install fortio.org/fortio@latest

FROM ubuntu:24.04
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      iperf3 mtr-tiny jq curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*
COPY --from=fortio-builder /out/fortio /usr/local/bin/fortio
CMD ["sleep", "infinity"]
