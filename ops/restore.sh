#!/bin/sh
set -eu

if [ "$#" -ne 1 ] || [ ! -f "$1" ]; then
  echo "Usage: ./ops/restore.sh ./backups/trappola-YYYYMMDDTHHMMSSZ.dump" >&2
  exit 1
fi

echo "WARNING: this replaces data in the production database. Type RESTORE to continue:"
read -r confirmation
[ "$confirmation" = "RESTORE" ] || { echo "Cancelled"; exit 1; }

docker compose --env-file .env.production stop app
trap 'docker compose --env-file .env.production up -d app' EXIT
docker compose --env-file .env.production exec -T db sh -c \
  'pg_restore --clean --if-exists --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$1"
echo "Database restored from $1"
