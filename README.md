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

## Production builds on localhost

With Docker running (Compose v2 with `--wait` support) and port 8888
available, build and start everything from the repository root:

```bash
bun run app:prod:local
```

The separate `docker-compose.local-prod.yml` reuses the production Dockerfiles
and Next.js standalone configuration. Open https://localhost:8888. Nginx is
the only service with a published port, bound to loopback; the frontend,
backend, database, and Mailpit stay on the internal Docker network. Both apps
use `NODE_ENV=production`, without watch mode.

Nginx automatically generates a self-signed certificate for localhost on
first start and stores it in its own volume. Your browser will show a
certificate warning until you trust this certificate locally. No environment
file or domain setup is needed. Use `localhost` in the browser to match the
configured auth and CORS URLs. Mailpit still catches outgoing emails, but its
web UI is not published.

This stack has its own persistent Postgres volume; backend migrations run
automatically. Server-side frontend requests use `http://backend:3334` inside
Docker, while browser requests use `https://localhost:8888/backend`. Nginx
strips `/backend/` before forwarding and routes `/api/auth/` directly to the
backend for authentication callbacks. The command waits
for app health checks and leaves the containers running in the background.
Rerun it to rebuild after code changes.

```bash
bun run app:prod:local:logs
bun run app:prod:local:down
```

Stopping the stack preserves its database. All bundled credentials are local
defaults; published ports bind only to the loopback interface.

## AWS production deployment

For a single EC2 instance with managed RDS PostgreSQL and SES email, use the
separate [AWS deployment guide](deploy/aws/README.md). It includes Terraform,
GitHub Actions/ECR releases, Systems Manager deployment, public HTTPS through
Caddy, secret rotation, and recovery instructions. Localhost configuration
remains independent.

## Production deployment

Self-hosted via Docker - `docker-compose.prod.yml` builds and runs `db` (Postgres), `backend`, `frontend`, and `caddy` (reverse proxy + automatic TLS) as one stack from source. `caddy` is the *only* service exposed to the host (ports `80`/`443`) - `frontend`/`backend` are only reachable from other containers on the compose network, not directly from outside.

1. **Point DNS at this server.** `FRONTEND_DOMAIN` and `BACKEND_DOMAIN` (below) need to be real domains you own, each with an A/AAAA record pointing at this server's public IP, with ports 80 and 443 reachable from the internet - Caddy uses port 80 for the Let's Encrypt HTTP-01 challenge, not just as an HTTPS redirect. See `Caddyfile` for the routing (one domain → frontend, one → backend) and its own comments for the `localhost`-domain fallback if you just want to smoke-test the proxy locally first.

2. **Configure environment variables.**
   ```bash
   cp .env.production.example .env.production
   ```
   Fill in every value in `.env.production` - see the comments in that file for what each one does. Notably:
   - `FRONTEND_DOMAIN` / `BACKEND_DOMAIN` - see step 1. Keep `BETTER_AUTH_URL`, `FRONTEND_URL`, and `NEXT_PUBLIC_BACKEND_URL` (below) consistent with these - Caddy's routing and the app's own URL env vars are configured independently and won't automatically match each other.
   - `DATABASE_URL` - the backend won't start without a real, reachable Postgres connection string here (see below if you want to defer this).
   - `BETTER_AUTH_SECRET` - generate one with `openssl rand -base64 32`, never reuse the dev value.
   - `NEXT_PUBLIC_BACKEND_URL` - must be the **public, browser-reachable** URL for the backend (not a Docker-internal hostname like `http://backend:3334`), and is baked into the frontend at *build* time - changing it later requires rebuilding the `frontend` image.
   - `.env.production` is gitignored - never commit it.

3. **Build and start the stack.**
   ```bash
   bun run app:prod:build   # docker compose ... build
   bun run app:prod:up      # docker compose ... up -d
   ```
   Or directly: `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`.

4. **Migrations run automatically.** The backend's container entrypoint (`packages/backend/docker-entrypoint.sh`) runs `prisma migrate deploy` on every start before the server boots - there's no separate migration step to run by hand. It only *applies* migrations already committed under `packages/backend/prisma/migrations/` (see that package's README for how to *create* a new one during development) - it never generates or prompts.

5. **Deploying an update.** Pull the new code, then rerun step 3's two commands - `docker compose ... up -d --build` (or the `bun run app:prod:*` scripts) rebuilds any changed images and recreates just those containers; migrations for whatever's new run automatically on the backend's next start.

6. **Logs:** `bun run app:prod:logs`, or point `LOKI_HOST`/the optional `observability` profile (see below) at a log viewer.

**Optional observability** (Loki + Grafana, reusing the same setup as local dev): excluded by default: add `--profile observability` to any of the commands above, e.g. `docker compose -f docker-compose.prod.yml --env-file .env.production --profile observability up -d --build`. Set `GRAFANA_ADMIN_PASSWORD` in your env file first - don't run this with the dev stack's `admin`/`admin` default.

**"Deal with `DATABASE_URL` later"**: the images build fine with it unset (`prisma generate` at build time never touches a real database). The `backend` container will build and even start, but will fail loudly at the `prisma migrate deploy` step until `DATABASE_URL` in `.env.production` points at a real, reachable Postgres instance - that's expected, not a bug to chase down.

## Tooling

- **Bun workspaces** with a shared dependency catalog (`package.json` → `catalogs`) so both packages pin the same versions of shared deps.
- **Biome** for linting/formatting (`bun run app:lint` / `app:format` / `app:check` from the root).
- **Prisma** for the backend's schema/migrations (see `packages/backend/README.md`).
