# Security

AtheryX is built so that secure authentication and licensing are easy for everyone.
This document describes the security model you inherit when you use the platform.

## Threat model

- **Credential theft** — prevented with bcrypt password hashing, never storing plaintext.
- **Credential sharing** — prevented with optional hardware-ID (HWID) binding of accounts and licenses.
- **Unauthorized API access** — prevented with the application handshake (`owner_id` + `secret`).
- **Patched/modified clients** — prevented with optional application hash checks.
- **Session hijacking** — mitigated with short-lived sessions and refresh-token rotation.

## What is protected

### Passwords
- Hashed with **bcrypt** before being written to storage.
- No plaintext passwords are ever logged or returned by the API.

### Application access
- Every request is scoped to an application using a session opened by `init`.
- The `secret` acts as a bearer credential — keep it out of client-side bundles. Use it from
  your own backend, or issue scoped session tokens to clients.

### Licenses & hardware binding
- A license can be **bound to one hardware ID** (`hwid`).
- Validation fails with `HWID does not match this license` when a key is used from another device,
  blocking shared/pirated usage.
- HWID resets are self-service and auditable from the dashboard.

### Sessions
- Sessions are short-lived and carry a separate `refresh_token` for rotation.
- Expired or invalidated sessions are rejected server-side.
- `init` also returns an **`enckey`** — the per-session key used to encrypt and sign variable payloads.

### Variable payloads
Application variables are never sent or accepted as readable plaintext:

- **Reads** (`POST /variables`) return an encrypted envelope instead of the value. Anyone
  intercepting the response sees only ciphertext.
- **Writes** (`POST /variables/set`) are rejected unless they carry a valid HMAC. Knowing or
  guessing a `session_id` is not enough to modify data.
- The key is derived from the session's `enckey` (`SHA-256(enckey)`), which only ever leaves the
  server to the client that legitimately opened the session.
- Cipher: **AES-256-CBC** with a random IV per payload; signature: **HMAC-SHA256**, compared in
  constant time.

See [Payload encryption](api-reference.md#payload-encryption) for the wire format and reference
implementations.

### Request integrity
- Optional **application hash checks** let you reject modified binaries.
- IP whitelisting and rate limiting can be configured per endpoint from the dashboard.
- All traffic is served over **HTTPS**.

## Logging & audit

- Login, registration, license validation, and admin actions are recorded.
- Discord/webhook notifications can be enabled for suspicious events such as failed logins.
- Activity feeds and audit logs are visible in the dashboard.

## Data protection

AtheryX is a hosted platform. The security of the underlying infrastructure is handled for you:

- All traffic is served over **HTTPS**.
- Passwords are hashed with bcrypt and never stored or logged in plaintext.
- Sessions are short-lived and rotated server-side.
- Application secrets are scoped per app and should be kept out of client-side bundles.

Keep your own **application secrets** and **database credentials** out of public repositories.

## Reporting a vulnerability

Contact the maintainers through the [support channel](https://atheryxauth.cc/support) with a
description and reproduction steps. Do not publish details publicly before they are addressed.
