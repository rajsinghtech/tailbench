#!/usr/bin/env bash
# GCP configuration

GCP_PROJECT="${GCP_PROJECT:-tailscale-sandbox}"
GCP_ZONE="${GCP_ZONE:-us-central1-a}"
GCP_REGION="${GCP_REGION:-us-central1}"
GCP_IMAGE_FAMILY="ubuntu-2404-lts-amd64"
GCP_IMAGE_PROJECT="ubuntu-os-cloud"
GCP_NETWORK="${GCP_NETWORK:-default}"
GCP_SUBNET="${GCP_SUBNET:-default}"
