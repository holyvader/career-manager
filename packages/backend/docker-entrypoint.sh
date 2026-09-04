#!/bin/sh
set -e

# `prisma migrate deploy` only applies migrations that are already committed
# to prisma/migrations - it never generates new ones and never prompts, so
# it's safe to run unconditionally on every container start. It takes an
# advisory lock in the database, so concurrent starts (e.g. a rolling
# restart) don't race each other. If you ever run multiple replicas of this
# service, consider moving this into a separate one-off release step instead
# of running it from every replica's entrypoint.
echo "Applying database migrations..."
bunx prisma migrate deploy

exec "$@"
