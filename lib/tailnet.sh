#!/usr/bin/env bash
set -euo pipefail

TAILBENCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$TAILBENCH_ROOT/lib/common.sh"

TS_API="https://api.tailscale.com/api/v2"

# Tailnet creation API state
TAILNET_NAME=""
TAILNET_DNS_NAME=""
TAILNET_OAUTH_CLIENT_ID=""
TAILNET_OAUTH_CLIENT_SECRET=""

tailnet_create() {
  local access_token="$1" name="$2"
  log_info "Creating API-only tailnet: $name"

  local response http_status body
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$TS_API/organizations/-/tailnets" \
    -H "Authorization: Bearer $access_token" \
    -H "Content-Type: application/json" \
    -d "{\"displayName\": \"$name\"}")

  http_status=$(echo "$response" | tail -n 1 | cut -d: -f2)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_status" != "200" ]]; then
    log_error "Tailnet creation failed (HTTP $http_status): $body"
    return 1
  fi

  TAILNET_NAME="$name"
  TAILNET_DNS_NAME=$(echo "$body" | jq -r '.dnsName')
  TAILNET_OAUTH_CLIENT_ID=$(echo "$body" | jq -r '.oauthClient.id')
  TAILNET_OAUTH_CLIENT_SECRET=$(echo "$body" | jq -r '.oauthClient.secret')

  if [[ -z "$TAILNET_OAUTH_CLIENT_ID" || "$TAILNET_OAUTH_CLIENT_ID" == "null" ]]; then
    log_error "No OAuth credentials in tailnet creation response: $body"
    return 1
  fi

  log_info "Tailnet created: $TAILNET_DNS_NAME"
  log_info "Tailnet OAuth client ID: $TAILNET_OAUTH_CLIENT_ID"
}

tailnet_delete() {
  local access_token="$1" tailnet_name="$2"
  log_info "Deleting tailnet: $tailnet_name"

  local response http_status body
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE "$TS_API/tailnet/$tailnet_name" \
    -H "Authorization: Bearer $access_token")

  http_status=$(echo "$response" | tail -n 1 | cut -d: -f2)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_status" != "200" ]]; then
    log_warn "Tailnet deletion returned HTTP $http_status: $body"
    return 1
  fi

  log_info "Tailnet deleted: $tailnet_name"
}

tailnet_get_access_token() {
  local client_id="$1" client_secret="$2"

  local response http_status body
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$TS_API/oauth/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=client_credentials" \
    -d "client_id=$client_id" \
    -d "client_secret=$client_secret")

  http_status=$(echo "$response" | tail -n 1 | cut -d: -f2)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_status" != "200" ]]; then
    log_error "Token exchange failed (HTTP $http_status): $body"
    return 1
  fi

  local token
  token=$(echo "$body" | jq -r '.access_token')
  if [[ -z "$token" || "$token" == "null" ]]; then
    log_error "No access token in response: $body"
    return 1
  fi

  echo "$token"
}

tailnet_update_acl() {
  local access_token="$1" tailnet_name="$2" policy="$3"
  log_info "Updating ACL for tailnet: $tailnet_name"

  local response http_status body
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$TS_API/tailnet/$tailnet_name/acl" \
    -H "Authorization: Bearer $access_token" \
    -H "Content-Type: application/json" \
    -d "$policy")

  http_status=$(echo "$response" | tail -n 1 | cut -d: -f2)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_status" != "200" ]]; then
    log_error "ACL update failed (HTTP $http_status): $body"
    return 1
  fi

  log_info "ACL updated"
}
