# API Reference

Base URL: `https://atheryxauth.cc/api/v1.1`

All request/response bodies are JSON. Endpoints return `success: true` on success and
`success: false` with a `message` field on error.

> ⚠️ Replace placeholders such as `YOUR_OWNER_ID`, `YOUR_APP_SECRET`, and `abc123...` with real
> values from your dashboard.

---

## Authentication model

Two credentials are involved, and they are used for different things:

| Credential | Obtained from | Used for |
|---|---|---|
| `session_id` | `POST /init` | Every session-scoped endpoint (`register`, `login`, `licenses`, `logs`, `variables`, …) |
| `enckey` | `POST /init` | Encrypting/decrypting the payload of the `variables` endpoints |

`init` returns **both**. The `enckey` is what makes the variable endpoints safe: it never
leaves the client that opened the session, and every variable read/write is encrypted and
signed with it. See [Payload encryption](#payload-encryption).

> The `secret` from your dashboard is a server-side credential. Call `init` from your backend,
> or keep the secret out of shipped client bundles.

---

## Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/init` | POST | `owner_id` + `app_name` + `secret` | Open an authenticated app session |
| `/register` | POST | `session_id` | Create a new user for the app |
| `/login` | POST | `session_id` | Authenticate a user |
| `/session/refresh` | POST | `session_id` + `refresh_token` | Rotate the session token |
| `/licenses` | POST | `session_id` | Validate / bind a license key |
| `/logs` | POST | `session_id` | Push an app log line |
| `/variables` | **POST** | `session_id` | Read an app variable (encrypted response) |
| `/variables/set` | POST | `session_id` + signed payload | Write an app variable (encrypted request) |
| `/claim-password` | POST | `session_id` | Set the password on a free/reseller-issued account |

> Dashboard-only endpoints (`discord-link`, `discord-unlink`, `discord-visuals`) are **not**
> part of the app API. They authenticate with a Firebase ID token from the signed-in dashboard
> user and are not intended for SDK use.

---

## `POST /init`

Opens an authenticated session for your application.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `owner_id` | string | yes | Your account / owner identifier |
| `app_name` | string | yes | The name of your application |
| `version` | string | no | App version (used for update enforcement) |
| `secret` | string | yes | The application secret |
| `hash` | string | no | Application hash (if hash checks are enabled) |
| `hwid` | string | no | Hardware identifier |

**Success response**

```json
{
  "success": true,
  "message": "Session initialized successfully",
  "session_id": "abc123...",
  "refresh_token": "def456...",
  "enckey": "9f8e7d6c5b4a...",
  "expires_in": 604800
}
```

`expires_in` is in seconds (7 days of active use; sessions also expire after 72 hours of
inactivity). **Store `enckey` alongside `session_id`** — the variable endpoints need it.

---

## `POST /register`

Creates a new user for your application.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | yes | Session from `init` |
| `username` | string | yes | Unique username |
| `password` | string | yes | Password (hashed with bcrypt server-side) |
| `key` | string | yes | A valid license key for the app |
| `email` | string | no | User email |
| `hwid` | string | no | Hardware identifier to bind the account to |

**Success response**

```json
{
  "success": true,
  "username": "newuser",
  "email": "user@example.com",
  "hwid": "optional-hardware-id"
}
```

Common errors: `Username already exists`, `Invalid license key`, `Missing required fields`.

---

## `POST /login`

Authenticates a user.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | yes | Session from `init` |
| `username` | string | yes | Username |
| `password` | string | yes | Password |
| `hwid` | string | no | Hardware identifier |
| `ip` | string | no | Client IP for logging |

**Success response**

```json
{
  "success": true,
  "username": "newuser",
  "email": "user@example.com"
}
```

Common errors: `Invalid password`, `User not found`, `User subscription has expired`,
`HWID does not match`.

---

## `POST /session/refresh`

Rotates a session token using a refresh token.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | yes | Session from `init` |
| `refresh_token` | string | yes | Refresh token issued for the session |

**Success response**

```json
{
  "success": true,
  "session_id": "abc123...",
  "refresh_token": "new-refresh-token"
}
```

Common errors: `Invalid session`, `Invalid refresh token`.

---

## `POST /licenses`

Validates a license key and, optionally, binds it to a hardware ID.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | yes | Session from `init` |
| `license_key` | string | yes | The license key to validate |
| `hwid` | string | no | Hardware ID to bind/compare |
| `ip` | string | no | Client IP for logging |

**Success response**

```json
{
  "success": true,
  "license_key": "LICENSE-KEY-XXXX-XXXX",
  "active": true,
  "expires": "2027-01-01T00:00:00Z"
}
```

Common errors: `License not found`, `License expired`, `HWID does not match this license`.

---

## `POST /logs`

Pushes an application log line.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | yes | Session from `init` |
| `message` | string | yes | Log line to record |

---

## `POST /variables`

Reads an application variable.

> **This endpoint is `POST`, not `GET`** — the variable name travels in the body, and the
> response is encrypted (see below).

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | yes | Session from `init` |
| `var_key` | string | yes | Variable key |

**Success response**

The variable value is **not** returned in plaintext. The response carries an encrypted
envelope:

```json
{
  "success": true,
  "encrypted": true,
  "data": "BASE64_IV_PLUS_CIPHERTEXT",
  "hmac": "A1B2C3D4E5F6..."
}
```

Decrypt `data` with the session's `enckey` to obtain:

```json
{
  "success": true,
  "message": "Variable retrieved",
  "variable": {
    "var_key": "my_key",
    "var_value": "my value",
    "updated_at": 1767225600000
  }
}
```

---

## `POST /variables/set`

Writes an application variable.

> **Plaintext writes are rejected.** The request body must contain an encrypted, HMAC-signed
> envelope. A leaked `session_id` alone therefore cannot modify data.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | yes | Session from `init` |
| `encrypted` | string | yes | `base64(iv ‖ AES-256-CBC(plaintext))` |
| `hmac` | string | yes | `HMAC-SHA256(ciphertext, key)`, hex, first 32 chars |

The plaintext you encrypt must be:

```json
{
  "session_id": "abc123...",
  "var_key": "my_key",
  "var_value": "my value"
}
```

`session_id` must match the top-level `session_id` — the server rejects a mismatched payload.

**Success response**

```json
{
  "success": true,
  "message": "Variable saved successfully"
}
```

Common errors: `Encryption required: send an encrypted, signed payload`,
`Invalid signature for this session`, `Session has no encryption key. Re-initialize the session.`

---

## `POST /claim-password`

Sets the password on an account that was issued by a reseller or the free-account flow. Those
accounts arrive with `must_change_password = true` and a short one-time **setup code** instead of
a usable password.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | yes | Session from `init` |
| `username` | string | yes | The account's username (case-insensitive) |
| `setup_code` | string | yes | The 3–4 digit one-time setup code |
| `new_password` | string | yes | New password, 1–128 characters |

**Success response**

```json
{
  "success": true,
  "message": "Password set. Sign in using your new password."
}
```

Common errors:

| Error | Meaning |
|---|---|
| `setup_not_required` | The account does not need a password setup |
| `invalid_setup_code` | Wrong setup code |
| `setup_code_expired` | The one-time code has expired — ask the reseller for a new account |
| `setup_code_used` | The code was already used |
| `rate_limited` | Too many attempts (5 per 15 minutes) |

---

## Payload encryption

The `variables` endpoints are the only ones that encrypt their payload. They use the session's
`enckey`, returned by `init` and known only to the client that opened the session.

**Protocol**

```
key      = SHA-256(enckey)                                  // 32 bytes
iv       = 16 random bytes
cipher   = AES-256-CBC(plaintext, key, iv)
envelope = base64( iv ‖ cipher )
hmac     = HMAC-SHA256(cipher, key).hex.slice(0, 32)        // 16 bytes, hex
```

Reading a variable: decrypt `data` with the `enckey`.
Writing a variable: build the plaintext, produce `envelope` + `hmac`, and send both.

**Node.js**

```js
import crypto from "crypto";

const keyFrom = (enckey) => crypto.createHash("sha256").update(enckey).digest();

function encryptJson(enckey, obj) {
  const key = keyFrom(enckey);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(obj), "utf8")), cipher.final()]);
  const envelope = Buffer.concat([iv, ct]);
  const hmac = crypto.createHmac("sha256", key).update(ct).digest("hex").slice(0, 32);
  return { encrypted: envelope.toString("base64"), hmac };
}

function decryptEnvelope(enckey, base64Payload, hmac) {
  const key = keyFrom(enckey);
  const raw = Buffer.from(base64Payload, "base64");
  const iv = raw.subarray(0, 16);
  const ct = raw.subarray(16);
  const expected = crypto.createHmac("sha256", key).update(ct).digest("hex").slice(0, 32);
  if (expected !== hmac) throw new Error("Invalid signature");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return JSON.parse(Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8"));
}
```

**Python**

```python
import base64, hashlib, hmac as hmaclib, json, os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.padding import PKCS7

def key_from(enckey: str) -> bytes:
    return hashlib.sha256(enckey.encode()).digest()

def encrypt_json(enckey: str, obj: dict):
    key = key_from(enckey)
    iv = os.urandom(16)
    padder = PKCS7(128).padder()
    plain = padder.update(json.dumps(obj).encode()) + padder.finalize()
    enc = Cipher(algorithms.AES(key), modes.CBC(iv)).encryptor()
    ct = enc.update(plain) + enc.finalize()
    envelope = base64.b64encode(iv + ct).decode()
    mac = hmaclib.new(key, ct, hashlib.sha256).hexdigest()[:32]
    return {"encrypted": envelope, "hmac": mac}

def decrypt_envelope(enckey: str, payload_b64: str, mac: str) -> dict:
    key = key_from(enckey)
    raw = base64.b64decode(payload_b64)
    iv, ct = raw[:16], raw[16:]
    if hmaclib.new(key, ct, hashlib.sha256).hexdigest()[:32] != mac:
        raise ValueError("Invalid signature")
    dec = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()
    padded = dec.update(ct) + dec.finalize()
    unpadder = PKCS7(128).unpadder()
    return json.loads((unpadder.update(padded) + unpadder.finalize()).decode())
```

---

## Error format

Failures return `success: false` with a `message`, usually alongside a `4xx` status:

```json
{
  "success": false,
  "message": "Human-readable error"
}
```

Some endpoints also return a machine-readable `error` code (for example `claim-password`
returns `invalid_setup_code`, `setup_code_expired`, `rate_limited`, …).

## Rate limiting & security

- Application credentials are verified on every `init`.
- Hardware-bound licenses reject keys used from another device.
- Sessions expire and support refresh-token rotation.
- Variable payloads are encrypted and HMAC-signed with the session `enckey`.
- See [security.md](security.md) for the full trust model.
