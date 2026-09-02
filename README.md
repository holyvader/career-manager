# Career Manager

A personal job-search tracker: applications, interviews, and tags to organize them. Bun workspace monorepo with two packages:

- **`packages/backend`** — Elysia API (better-auth for email/password auth, Prisma/Postgres, emailjs for outgoing mail). Listens on **:3334**. See its own README for details.
- **`packages/frontend`** — Next.js App Router UI, talks to the backend via Eden Treaty (`@elysiajs/eden`) - it has no auth logic of its own. Listens on **:3333**.

## Getting started

```bash
docker compose up -d db mailpit
bun install

# backend
cd packages/backend
bun run prisma:migrate:deploy
bun run dev &

# frontend, in another shell
cd packages/frontend
bun run dev
```

Open http://localhost:3333.

## Supporting services (`docker-compose.yml`)

| Service | Purpose | URL |
|---|---|---|
| `db` | Postgres | `localhost:5432` |
| `mailpit` | Catches outgoing email in dev (no real SMTP relay needed) | http://localhost:8025 |
| `loki` + `grafana` | Log aggregation/viewing for the backend's structured logs | http://localhost:3200 (admin/admin) |

All credentials in `docker-compose.yml` are throwaway local-dev defaults - do not reuse them for any real deployment.

## Tooling

- **Bun workspaces** with a shared dependency catalog (`package.json` → `catalogs`) so both packages pin the same versions of shared deps.
- **Biome** for linting/formatting (`bun run app:lint` / `app:format` / `app:check` from the root).
- **Prisma** for the backend's schema/migrations (see `packages/backend/README.md`).
