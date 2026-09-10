# syntax=docker/dockerfile:1

# Build context is the repo root (not this directory) - Bun workspace
# monorepo, and Next's standalone output needs to trace files across the
# whole workspace (see outputFileTracingRoot in next.config.ts).

FROM oven/bun:1.3.6-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend/package.json packages/frontend/package.json
RUN bun install --frozen-lockfile

# `next build`'s Turbopack runtime segfaults under Bun 1.3.6 on this image
# (a Bun bug loading Next's compiled server runtime as CommonJS, not
# anything in this codebase) - build and run the Next.js app under Node
# instead, which is Next's first-class supported runtime. `bun install`
# above is still what actually installs dependencies, honoring bun.lock;
# Node just consumes the resulting node_modules directly.
FROM node:22-slim AS build
WORKDIR /app
# Prisma's engine needs OpenSSL to detect the right binary target - node's
# slim image doesn't ship it by default (unlike oven/bun's), so `prisma
# generate` below would otherwise warn and guess.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
# Bun keeps a root content-addressable store (node_modules/.bun/...) but
# places each workspace member's own `.bin` symlinks (e.g. `next`, `prisma`)
# under that member's own node_modules/.bin, not the root - all three
# directories are needed for workspace binaries and their dependencies.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/backend/node_modules packages/backend/node_modules
COPY --from=deps /app/packages/frontend/node_modules packages/frontend/node_modules
COPY packages/backend packages/backend
COPY packages/frontend packages/frontend

# The frontend type-checks against the backend's Eden Treaty app type
# (`import type { App } from 'backend/src/edenApp'`), which transitively
# references the backend's generated Prisma client - it needs to exist
# before `next build` runs its own type-check, same as in CI. This never
# connects to a real database (see the matching comment in the backend
# Dockerfile).
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
# Invoke Node directly: npm's devEngines check rejects this Bun-managed repo.
RUN cd packages/backend && DATABASE_URL=$DATABASE_URL node node_modules/prisma/build/index.js generate

# Baked into the build, not read at runtime - Next.js inlines
# NEXT_PUBLIC_* vars into the client bundle at build time, so this must be
# the real public backend URL for your deployment, not a placeholder.
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:3334
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

RUN cd packages/frontend && node node_modules/next/dist/bin/next build

FROM node:22-slim AS runtime
WORKDIR /app

COPY --from=build /app/packages/frontend/.next/standalone ./
COPY --from=build /app/packages/frontend/.next/static ./packages/frontend/.next/static
COPY --from=build /app/packages/frontend/public ./packages/frontend/public

WORKDIR /app/packages/frontend
EXPOSE 3333
ENV PORT=3333
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
