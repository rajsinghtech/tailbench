#!/usr/bin/env bash
# Azure configuration

AZURE_LOCATION="${AZURE_LOCATION:-eastus}"
AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-tailbench-rg}"
AZURE_IMAGE="${AZURE_IMAGE:-Canonical:ubuntu-24_04-lts:server:latest}"

# Networking — optional, az vm create will use defaults if unset
AZURE_VNET="${AZURE_VNET:-}"
AZURE_SUBNET="${AZURE_SUBNET:-}"
AZURE_NSG="${AZURE_NSG:-}"

# SSH
AZURE_SSH_USER="${AZURE_SSH_USER:-azureuser}"
AZURE_SSH_KEY_PATH="${AZURE_SSH_KEY_PATH:-$HOME/.ssh/tailbench}"
AZURE_SSH_PUB_KEY_PATH="${AZURE_SSH_PUB_KEY_PATH:-$HOME/.ssh/tailbench.pub}"
