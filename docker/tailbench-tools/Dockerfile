FROM ubuntu:24.04

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        iperf3 \
        mtr-tiny \
        jq \
        curl \
        iputils-ping \
        iproute2 \
        net-tools \
    && rm -rf /var/lib/apt/lists/*

CMD ["sleep", "infinity"]
