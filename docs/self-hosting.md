# Self-Hosting

AtheryX is built to run on **your** infrastructure. You keep the dashboard, the API, and your data
under your control instead of trusting a third party with your user database and license records.

## What "self-hosted" means here

AtheryX uses a realtime database (Firebase Realtime Database compatible) and a Node.js/Next.js API
layer. When you self-host:

- The **web dashboard** (account management, apps, licenses, users) runs on your host.
- The **public SDK API** (`/api/v1.1`) runs on your host.
- **All data** (users, licenses, sessions, logs, variables) lives in your database.

## Deployment checklist

1. **Provision a host** — any VPS or container platform (Linux recommended).
2. **Install Node.js** — the API requires a modern Node.js runtime (v20+ recommended).
3. **Configure the database** — point the app at your realtime database and set your service
   credentials via environment variables (never commit them to a repo).
4. **Set public environment values** — the same `NEXT_PUBLIC_*` values the frontend uses for the
   API key and database URL.
5. **Enable HTTPS** — terminate TLS at a reverse proxy:

   ```nginx
   # nginx example
   server {
     listen 443 ssl;
     server_name auth.example.com;
     ssl_certificate     /etc/letsencrypt/live/auth.example.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/auth.example.com/privkey.pem;
     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $remote_addr;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```

6. **Firewall & updates** — restrict database access to your host, keep OS/runtime patched, and
   rotate secrets regularly.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public API key for the client SDK |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Public database URL |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **Secret** — service-account JSON for server writes |
| `NEXT_PUBLIC_ATHERIX_URL` | Your public base URL (e.g. `https://auth.example.com`) |

> Treat every `*_SERVICE_ACCOUNT_*` / `*_SECRET_*` value as a credential. Never publish them.

## Keeping source private

This repository ships **only** public documentation and SDK examples. The platform source is kept in
a private repository. If you fork or extend the platform, keep your fork private and only publish
what you intend to support publicly.
