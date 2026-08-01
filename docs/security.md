# Security

AtheryX is designed so that authentication and licensing infrastructure is **private by default**.
This document describes the security model you inherit when you use the platform or self-host it.

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

### Request integrity
- Optional **application hash checks** let you reject modified binaries.
- IP whitelisting and rate limiting can be configured per endpoint from the dashboard.
- All traffic is served over **HTTPS**.

## Logging & audit

- Login, registration, license validation, and admin actions are recorded.
- Discord/webhook notifications can be enabled for suspicious events such as failed logins.
- Activity feeds and audit logs are visible in the dashboard.

## Self-hosting

When you self-host AtheryX, the security of the underlying infrastructure is **yours**:

- Keep your **database URL** and **service-account credentials** out of public repositories.
- Enable HTTPS at your reverse proxy (nginx / Caddy / Cloudflare).
- Apply OS-level firewalls and regular updates.
- Rotate application secrets periodically.

See [self-hosting.md](self-hosting.md) for deployment guidance.

## Reporting a vulnerability

Contact the maintainers through the [support channel](https://atheryxauth.cc/support) with a
description and reproduction steps. Do not publish details publicly before they are addressed.
