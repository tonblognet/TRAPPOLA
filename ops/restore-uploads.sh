#!/bin/sh
set -eu

if [ "$#" -ne 1 ] || [ ! -f "$1" ]; then
  echo "Usage: ./ops/restore-uploads.sh ./backups/trappola-uploads-YYYYMMDDTHHMMSSZ.tar.gz" >&2
  exit 1
fi

echo "WARNING: this replaces all product images in production. Type RESTORE-IMAGES to continue:"
read -r confirmation
[ "$confirmation" = "RESTORE-IMAGES" ] || { echo "Cancelled"; exit 1; }

docker compose --env-file .env.production stop app
trap 'docker compose --env-file .env.production up -d app' EXIT
docker compose --env-file .env.production run --rm --no-deps -T app sh -c \
  'test "$UPLOAD_DIR" = "/app/uploads" && find /app/uploads -mindepth 1 -maxdepth 1 -exec rm -rf -- {} + && tar -xzf - -C /app/uploads' < "$1"
echo "Product images restored from $1"
