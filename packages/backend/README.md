# Career Manager — backend

Elysia (Bun) API: better-auth (email/password auth, email verification, password reset), Prisma/Postgres, emailjs for outgoing mail.

## Development

Bring up Postgres + Mailpit (dev SMTP catcher):

```bash
docker compose -f ../../docker-compose.yml up -d db mailpit
```

Then, from this directory:

```bash
bun install
bun run prisma:migrate:deploy
bun run dev
```

The server listens on **http://localhost:3334**. Mailpit's web UI (for viewing sent emails in dev) is at http://localhost:8025.

The backend loads `.env` from the repository root. For local Mailpit, use:

```dotenv
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_TLS=false
SMTP_SSL=false
```

Restart the backend after changing these settings. Mailpit captures messages for
viewing in its web UI; it does not deliver them to external inboxes. Existing
process environment variables take precedence over `.env` values.

## Scripts

See `package.json` for the full list - `prisma:*` scripts wrap the Prisma CLI, `lint`/`format`/`check` wrap Biome.

## OpenAPI docs

Once running, interactive API docs are served at http://localhost:3334/openapi.
