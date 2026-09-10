#!/bin/bash
# Invoked as root by Systems Manager from a versioned release directory.
set -euo pipefail
umask 077
if [[ $EUID != 0 || ! ${1:-} =~ ^[0-9a-f]{40}$ ]]; then
  echo 'Usage (root): deploy.sh <40-character commit SHA>' >&2
  exit 1
fi
release_tag=$1
release_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
app_dir=/opt/career-manager
runtime_dir=$app_dir/runtime/$release_tag
test -f /etc/career-manager/ready || { echo 'EC2 bootstrap is not ready' >&2; exit 1; }
exec 9>"$app_dir/deploy.lock"
flock -n 9 || { echo 'Another deployment is running' >&2; exit 1; }
python3 "$release_dir/render-env.py" "$release_tag"
region=$(python3 -c 'import json; print(json.load(open("/etc/career-manager/config.json"))["region"])')
registry=$(python3 -c 'import json; print(json.load(open("/etc/career-manager/config.json"))["frontend_image"].split("/")[0])')
export AWS_DEFAULT_REGION=$region
aws ecr get-login-password --region "$region" | docker login --username AWS --password-stdin "$registry"
trap 'docker logout "$registry" >/dev/null 2>&1 || true' EXIT
compose=(docker compose --project-name career-manager-aws --env-file "$runtime_dir/deployment.env" -f "$release_dir/compose.yml")
"${compose[@]}" config --quiet
"${compose[@]}" pull
# Stop old application code before applying schema changes. Caddy remains up.
"${compose[@]}" stop frontend backend
if ! "${compose[@]}" run --rm --no-deps --entrypoint bunx backend prisma migrate deploy; then
  echo 'Migration failed; application remains stopped. Inspect CloudWatch before retrying.' >&2
  exit 1
fi
if ! "${compose[@]}" up -d --wait --wait-timeout 180; then
  echo 'Health checks failed. Inspect CloudWatch; no automatic schema rollback was attempted.' >&2
  exit 1
fi
app_domain=$(python3 -c 'import json; print(json.load(open("/etc/career-manager/config.json"))["app_domain"])')
curl --fail --silent --show-error --retry 12 --retry-all-errors --retry-delay 5 --max-time 15 "https://$app_domain/backend/health" >/dev/null
curl --fail --silent --show-error --location --retry 3 --retry-all-errors --max-time 15 "https://$app_domain/" >/dev/null
sha256sum "$runtime_dir/backend.env" > "$runtime_dir/applied-env.sha256"
if [[ -L $app_dir/current ]]; then
  readlink "$app_dir/current" > "$app_dir/previous-release"
fi
ln -sfn "$release_dir" "$app_dir/current"
printf '%s\n' "$release_tag" > "$app_dir/current-sha"
echo "Healthy production release: $release_tag"
