FROM ubuntu:24.04
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      iperf3 mtr-tiny jq curl ca-certificates && \
    curl -L https://github.com/fortio/fortio/releases/download/v1.67.0/fortio_linux_amd64-1.67.0.tgz | \
      tar xz -C /usr/local/bin fortio && \
    chmod +x /usr/local/bin/fortio && \
    rm -rf /var/lib/apt/lists/*
CMD ["sleep", "infinity"]
