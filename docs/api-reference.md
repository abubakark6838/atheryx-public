# API Reference

Base URL: `https://atheryxauth.cc/api/v1.1`

All request/response bodies are JSON. Endpoints return `success: true` on success and
`success: false` with a `message` field on error.

> ⚠️ Replace placeholders such as `YOUR_OWNER_ID`, `YOUR_APP_SECRET`, and `abc123...` with real
> values from your dashboard.

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
  "session_id": "abc123...",
  "app_id": "app_xyz"
}
```

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

## `GET /variables`

Reads an application variable.

**Request query/body**

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | yes | Session from `init` |
| `var_key` | string | yes | Variable key |

---

## `POST /variables/set`

Writes an application variable.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | yes | Session from `init` |
| `var_key` | string | yes | Variable key |
| `var_value` | string | yes | Value to store |

---

## Error format

All failures use HTTP 200 with a JSON body (or the standard `4xx` where applicable):

```json
{
  "success": false,
  "message": "Human-readable error"
}
```

## Rate limiting & security

- Application credentials are verified on every `init`.
- Hardware-bound licenses reject keys used from another device.
- Sessions expire and support refresh-token rotation.
- See [security.md](security.md) for the full trust model.
