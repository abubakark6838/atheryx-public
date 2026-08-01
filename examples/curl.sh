#!/usr/bin/env bash
# AtheryX SDK example — plain cURL
set -euo pipefail

API="https://atheryxauth.cc/api/v1.1"

OWNER_ID="YOUR_OWNER_ID"
APP_NAME="YOUR_APP_NAME"
SECRET="YOUR_APP_SECRET"

# 1. Open a session
echo "== init =="
INIT=$(curl -s -X POST "$API/init" \
  -H "Content-Type: application/json" \
  -d "{\"owner_id\":\"$OWNER_ID\",\"app_name\":\"$APP_NAME\",\"secret\":\"$SECRET\"}")

echo "$INIT"
SESSION_ID=$(printf '%s' "$INIT" | sed -n 's/.*"session_id":"\([^"]*\)".*/\1/p')

# 2. Register a user (optional — one-time)
echo "== register =="
curl -s -X POST "$API/register" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"username\":\"demo_user\",\"password\":\"ChangeMe123!\",\"key\":\"LICENSE-KEY-XXXX-XXXX\"}"

echo

# 3. Login
echo "== login =="
curl -s -X POST "$API/login" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"username\":\"demo_user\",\"password\":\"ChangeMe123!\",\"hwid\":\"my-device-id\"}"

echo

# 4. Validate a license
echo "== license =="
curl -s -X POST "$API/licenses" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"license_key\":\"LICENSE-KEY-XXXX-XXXX\",\"hwid\":\"my-device-id\"}"

echo
