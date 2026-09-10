#!/bin/bash
# Integration test against a disposable SSL-enabled Postgres; no AWS credentials.
# First build the backend image, then pass its local image tag as argument 1.
set -euo pipefail
image=${1:?Usage: test-tls.sh <local-backend-image>}
fixture=$(mktemp -d)
chmod 755 "$fixture"
network=career-manager-tls-test-$$
database=$network-db
cleanup() {
  docker rm -f "$database" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
  rm -rf "$fixture"
}
trap cleanup EXIT
for name in server untrusted; do
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$fixture/$name.key" -out "$fixture/$name.crt" \
    -subj '/CN=aws-db' -addext 'subjectAltName=DNS:aws-db' >/dev/null 2>&1
done
# Disposable test key; Postgres copies it to a private file owned by its user.
chmod 644 "$fixture/server.key"
docker network create --internal "$network" >/dev/null
docker run -d --rm --name "$database" --network "$network" \
  --network-alias aws-db --network-alias wrong-db \
  -e POSTGRES_PASSWORD=integration-only -e POSTGRES_DB=career_manager \
  -v "$fixture:/cert-input:ro" --entrypoint bash postgres:16 -c \
  'cp /cert-input/server.key /tmp/server.key; chown postgres:postgres /tmp/server.key; chmod 600 /tmp/server.key; exec docker-entrypoint.sh postgres -c ssl=on -c ssl_cert_file=/cert-input/server.crt -c ssl_key_file=/tmp/server.key' >/dev/null
for attempt in $(seq 1 30); do
  if docker exec "$database" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$database" pg_isready -h 127.0.0.1 -U postgres >/dev/null
common=(--rm --network "$network" -v "$fixture:/cert-input:ro")
connection='postgresql://postgres:integration-only@aws-db:5432/career_manager?sslmode=require&sslaccept=strict&sslcert=/cert-input/server.crt'
query='import { prisma } from "./src/db/prismaClient"; await prisma.$queryRaw`SELECT 1`; await prisma.$disconnect();'
if ! docker run "${common[@]}" -e DATABASE_URL="$connection" --entrypoint bunx "$image" prisma migrate deploy >"$fixture/migrate.log" 2>&1; then
  cat "$fixture/migrate.log" >&2
  exit 1
fi
docker run "${common[@]}" -e DATABASE_URL="$connection" -e DATABASE_SSL_CA_PATH=/cert-input/server.crt \
  --entrypoint bun "$image" -e "$query" >/dev/null
for scenario in hostname untrusted-ca; do
  invalid_connection=$connection
  ca=/cert-input/server.crt
  if [[ $scenario == hostname ]]; then
    invalid_connection=${connection/aws-db/wrong-db}
  else
    invalid_connection=${connection/server.crt/untrusted.crt}
    ca=/cert-input/untrusted.crt
  fi
  if docker run "${common[@]}" -e DATABASE_URL="$invalid_connection" -e DATABASE_SSL_CA_PATH="$ca" \
    --entrypoint bun "$image" -e "$query" >"$fixture/runtime-failure.log" 2>&1; then
    echo "Runtime accepted invalid TLS: $scenario" >&2
    exit 1
  fi
  if docker run "${common[@]}" -e DATABASE_URL="$invalid_connection" \
    --entrypoint bunx "$image" prisma migrate status >"$fixture/cli-failure.log" 2>&1; then
    echo "Migration CLI accepted invalid TLS: $scenario" >&2
    exit 1
  fi
  for output in runtime cli; do
    if ! grep -Eiq 'certificate|TLS|hostname|altnames|altname|self.signed|issuer' "$fixture/$output-failure.log"; then
      cat "$fixture/$output-failure.log" >&2
      exit 1
    fi
  done
done
echo 'Verified TLS: migrations and runtime accept the trusted host and reject wrong hostnames and CAs.'
