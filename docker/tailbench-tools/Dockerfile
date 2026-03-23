FROM golang:1.22-bookworm AS fortio-builder
RUN go install fortio.org/fortio@latest

FROM ubuntu:24.04
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      iperf3 mtr-tiny jq curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*
COPY --from=fortio-builder /go/bin/fortio /usr/local/bin/fortio
CMD ["sleep", "infinity"]
