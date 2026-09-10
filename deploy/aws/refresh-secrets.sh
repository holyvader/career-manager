#!/bin/bash
# RDS rotates its managed password. Refresh the container environment regularly.
set -euo pipefail
umask 077
app_dir=/opt/career-manager
exec 9>"$app_dir/deploy.lock"
flock -n 9 || exit 0
release_tag=$(cat "$app_dir/current-sha")
release_dir=$(readlink -f "$app_dir/current")
runtime_dir=$app_dir/runtime/$release_tag
before=$(cat "$runtime_dir/applied-env.sha256" 2>/dev/null || true)
python3 "$release_dir/render-env.py" "$release_tag"
after=$(sha256sum "$runtime_dir/backend.env")
if [[ $before != "$after" ]]; then
  docker compose --project-name career-manager-aws --env-file "$runtime_dir/deployment.env" \
    -f "$release_dir/compose.yml" up -d --wait --wait-timeout 180
  printf '%s\n' "$after" > "$runtime_dir/applied-env.sha256"
  echo "Applied refreshed production credentials to $release_tag"
fi
