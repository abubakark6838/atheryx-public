<div align="center">

# AtheryX

**Authentication, licensing & subscription infrastructure — made for everyone.**

[![Website](https://img.shields.io/badge/website-atheryxauth.cc-8B5CF6)](https://atheryxauth.cc)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![API v1.1](https://img.shields.io/badge/API-v1.1-success)](docs/api-reference.md)

AtheryX is a complete authentication, licensing, and subscription platform. Secure user
authentication, hardware-bound license keys, subscriptions, and audit logs — all in one
easy-to-integrate API, with drop-in SDKs for **JavaScript/Node.js, Python, C#, C++, Rust, and more**.

Whether you're shipping your first side project or managing software used by millions, AtheryX gives
you everything in one place without stitching together fragmented services.

</div>

---

## Why AtheryX

| Capability | What you get |
|---|---|
| 👤 **Made for everyone** | Simple for side projects, powerful for large teams. |
| 👤 **Secure authentication** | Username/password with bcrypt hashing, sessions, refresh-token rotation. |
| 🗝️ **License keys** | Generate, validate and bind keys to hardware IDs (HWID). |
| 📦 **Subscriptions** | Enforce expiry, tiers, and per-app entitlements. |
| 🔑 **App-level secrets** | `owner_id` + `secret` handshake so only your apps can call your API. |
| 📊 **Analytics & logs** | Real-time activity, charts, online users, and audit logging. |
| 🌍 **SDK-first** | JS, Python, C#, C++, Rust examples — plus raw REST for everything else. |

## Quick start

1. Create an account at [atheryxauth.cc](https://atheryxauth.cc) and register your application
   from the dashboard to get your **Owner ID**, **App name**, and **App secret**.
2. Start a session with `init`.
3. Register / log in users, validate licenses, and read variables.

See the [Getting Started guide](docs/getting-started.md) for the full walkthrough, or jump straight
into an example:

- [JavaScript / Node.js](examples/javascript/index.js)
- [Python](examples/python/main.py)
- [C# (.NET)](examples/csharp/Program.cs)
- [C++](examples/cpp/main.cpp)
- [Rust](examples/rust/main.rs)
- [cURL](examples/curl.sh)

## Minimal example (cURL)

```bash
# 1. Initialize a session
curl -X POST https://atheryxauth.cc/api/v1.1/init \
  -H "Content-Type: application/json" \
  -d '{
        "owner_id": "YOUR_OWNER_ID",
        "app_name": "YOUR_APP_NAME",
        "secret": "YOUR_APP_SECRET"
      }'

# 2. Validate a license
curl -X POST https://atheryxauth.cc/api/v1.1/licenses \
  -H "Content-Type: application/json" \
  -d '{
        "session_id": "SESSION_ID_FROM_INIT",
        "license_key": "LICENSE-KEY-XXXX-XXXX",
        "hwid": "your-hardware-id"
      }'
```

## Security model

- Passwords are hashed with **bcrypt** before storage.
- Every API call is scoped to an application via the **`init` handshake** (`owner_id` + `secret`).
- Licenses and accounts can be **hardware-bound (HWID)**, blocking credential sharing.
- Optional **application hash checks** prevent modified/patched clients from calling the API.
- Sessions support **refresh-token rotation** and expiry.
- HMAC-style request signing and IP whitelisting are available on dashboard-configured endpoints.

Read the full [Security documentation](docs/security.md) for details on how your data is protected.

## API reference

All endpoints live under `https://atheryxauth.cc/api/v1.1`. See
[docs/api-reference.md](docs/api-reference.md) for request/response schemas:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1.1/init` | POST | Open an authenticated app session |
| `/api/v1.1/register` | POST | Create a new user for the app |
| `/api/v1.1/login` | POST | Authenticate a user |
| `/api/v1.1/session/refresh` | POST | Rotate the session token |
| `/api/v1.1/licenses` | POST | Validate / bind a license key |
| `/api/v1.1/logs` | POST | Push an app log line |
| `/api/v1.1/variables` | GET/POST | Read app variables |
| `/api/v1.1/variables/set` | POST | Write an app variable |

## Repository layout

```
atheryx-public/
├── docs/
│   ├── getting-started.md
│   ├── api-reference.md
│   └── security.md
└── examples/
    ├── javascript/
    ├── python/
    ├── csharp/
    ├── cpp/
    ├── rust/
    └── curl.sh
```

This repository intentionally contains **only the public-facing SDK examples and documentation** —
not the private platform source.

## License

Released under the [MIT License](LICENSE).
