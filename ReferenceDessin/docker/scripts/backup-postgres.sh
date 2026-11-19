#!/usr/bin/env bash

set -euo pipefail
umask 077

DEPLOY_DIR="/home/paul/reference-dessin"
BACKUP_DIR="$DEPLOY_DIR/backups"
BACKUP_FILE="$BACKUP_DIR/reference-dessin-$(date +%Y%m%d-%H%M%S).dump"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

cd "$DEPLOY_DIR"

compose=( docker compose --env-file .env.pi -f compose.pi.yaml)

TEMP_FILE=$(mktemp "$BACKUP_DIR/.backup-XXXXXX")
trap 'rm -f "$TEMP_FILE"' EXIT

"${compose[@]}" exec -T postgres pg_dump -U reference_dessin -d reference_dessin -Fc > "$TEMP_FILE"

"${compose[@]}" exec -T postgres pg_restore --list < "$TEMP_FILE" > /dev/null

mv "$TEMP_FILE" "$BACKUP_FILE"

find "$BACKUP_DIR" -maxdepth 1 -type f -name 'reference-dessin-*.dump' -mmin +43200 -delete

echo "Sauvegarde réussie : $BACKUP_FILE"
