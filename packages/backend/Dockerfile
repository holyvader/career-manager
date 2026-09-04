# syntax=docker/dockerfile:1

# Build context is the repo root (not this directory) - this is a Bun
# workspace monorepo, so `bun install` needs the root manifest/lockfile and
# every workspace member's package.json to resolve correctly.
FROM oven/bun:1.3.6-slim

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend/package.json packages/frontend/package.json
RUN bun install --frozen-lockfile

COPY packages/backend packages/backend

# `prisma generate` only reads the schema and writes the client - it never
# connects to a database - but prisma.config.ts still requires DATABASE_URL
# to be *set* to something or it throws while loading config. This is a
# build-time-only placeholder; the real DATABASE_URL is supplied at
# container run time (see docker-compose.prod.yml / .env.production.example).
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
RUN cd packages/backend && DATABASE_URL=$DATABASE_URL bunx prisma generate

RUN chmod +x packages/backend/docker-entrypoint.sh

WORKDIR /app/packages/backend
EXPOSE 3334

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "run", "src/app.ts"]
