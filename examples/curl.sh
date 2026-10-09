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
# init also returns the per-session encryption key used by the variable endpoints
ENCKEY=$(printf '%s' "$INIT" | sed -n 's/.*"enckey":"\([^"]*\)".*/\1/p')

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

# 5. Claim a reseller/free-issued account (only when it still carries a setup code)
# echo "== claim-password =="
# curl -s -X POST "$API/claim-password" \
#   -H "Content-Type: application/json" \
#   -d "{\"session_id\":\"$SESSION_ID\",\"username\":\"demo_user\",\"setup_code\":\"1234\",\"new_password\":\"NewSecret123!\"}"
# echo

# ---------------------------------------------------------------------------
# 6. Variables — these payloads are ENCRYPTED (AES-256-CBC) and the write is
#    HMAC-SHA256 signed with the session enckey. Plaintext writes are rejected.
#
#    key      = sha256(enckey)
#    envelope = base64( iv ‖ AES-256-CBC(plaintext) )
#    hmac     = HMAC-SHA256(ciphertext, key).hex, first 32 chars
#
#    The block below shows the write side using openssl. In practice you would
#    use a real SDK (see examples/javascript) rather than shell crypto.
# ---------------------------------------------------------------------------
KEY_HEX=$(printf '%s' "$ENCKEY" | openssl dgst -sha256 -binary | xxd -p -c 32)
IV_HEX=$(openssl rand -hex 16)

PLAIN="{\"session_id\":\"$SESSION_ID\",\"var_key\":\"theme\",\"var_value\":\"dark\"}"
CT_HEX=$(printf '%s' "$PLAIN" \
  | openssl enc -aes-256-cbc -K "$KEY_HEX" -iv "$IV_HEX" \
  | xxd -p -c 256)
ENVELOPE=$(printf '%s' "$IV_HEX$CT_HEX" | xxd -r -p | base64 -w0)
HMAC=$(printf '%s' "$CT_HEX" \
  | xxd -r -p \
  | openssl dgst -sha256 -mac HMAC -macopt "hexkey:$KEY_HEX" -binary \
  | xxd -p -c 256 | cut -c1-32)

echo "== variables/set (encrypted) =="
curl -s -X POST "$API/variables/set" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"encrypted\":\"$ENVELOPE\",\"hmac\":\"$HMAC\"}"

echo

echo "== variables (read — response is encrypted) =="
curl -s -X POST "$API/variables" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"var_key\":\"theme\"}"

echo
