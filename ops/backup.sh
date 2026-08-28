#!/bin/sh
set -eu

backup_dir="${BACKUP_DIR:-./backups}"
mkdir -p "$backup_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"

docker compose --env-file .env.production exec -T db sh -c \
  'pg_dump --format=custom --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  > "$backup_dir/trappola-$stamp.dump"

docker compose --env-file .env.production exec -T app \
  tar -czf - -C /app/uploads . > "$backup_dir/trappola-uploads-$stamp.tar.gz"

find "$backup_dir" -type f -name 'trappola-*.dump' -mtime +30 -delete
find "$backup_dir" -type f -name 'trappola-uploads-*.tar.gz' -mtime +30 -delete
echo "Backups created: $backup_dir/trappola-$stamp.dump and $backup_dir/trappola-uploads-$stamp.tar.gz"
