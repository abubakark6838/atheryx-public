# Getting Started

This guide walks you through connecting your application to AtheryX. The whole flow uses three
steps: **create your app**, **open a session** (`init`), then **authenticate / validate**.

## 1. Create an account and register your application

1. Go to [atheryxauth.cc](https://atheryxauth.cc) and create an account.
2. Open the dashboard and create a new **Application**.
3. Copy the values you'll need:
   - **Owner ID** (`owner_id`) — your account identifier.
   - **App name** (`app_name`) — the name you gave the application.
   - **App secret** (`secret`) — a private secret issued for the application.

> Keep the app secret private. It authorizes your application to talk to the API.

## 2. Open a session with `init`

Every authenticated request starts with an `init` call. It verifies your application credentials
and returns a short-lived `session_id` used by the other endpoints.

```bash
curl -X POST https://atheryxauth.cc/api/v1.1/init \
  -H "Content-Type: application/json" \
  -d '{
        "owner_id": "YOUR_OWNER_ID",
        "app_name": "YOUR_APP_NAME",
        "secret": "YOUR_APP_SECRET"
      }'
```

Response:

```json
{
  "success": true,
  "session_id": "abc123...",
  "app_id": "app_xyz",
  "message": "Session initialized"
}
```

## 3. Register a user

```bash
curl -X POST https://atheryxauth.cc/api/v1.1/register \
  -H "Content-Type: application/json" \
  -d '{
        "session_id": "abc123...",
        "username": "newuser",
        "password": "strong-password",
        "key": "LICENSE-KEY-XXXX-XXXX",
        "email": "user@example.com",
        "hwid": "optional-hardware-id"
      }'
```

## 4. Log in a user

```bash
curl -X POST https://atheryxauth.cc/api/v1.1/login \
  -H "Content-Type: application/json" \
  -d '{
        "session_id": "abc123...",
        "username": "newuser",
        "password": "strong-password",
        "hwid": "optional-hardware-id"
      }'
```

## 5. Validate a license

```bash
curl -X POST https://atheryxauth.cc/api/v1.1/licenses \
  -H "Content-Type: application/json" \
  -d '{
        "session_id": "abc123...",
        "license_key": "LICENSE-KEY-XXXX-XXXX",
        "hwid": "your-hardware-id"
      }'
```

## Next steps

- See [api-reference.md](api-reference.md) for every endpoint and its exact response schema.
- Copy one of the [examples](../examples) to integrate the SDK in your language.
- Read [security.md](security.md) to understand the trust model.
