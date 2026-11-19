#!/usr/bin/env bash

set -euo pipefail
umask 077

BACKUP_DIR="$HOME/reference-dessin-backups"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

find "$BACKUP_DIR" -maxdepth 1 -type f -name 'reference-dessin-*.dump' -mmin +43200 -delete

export RSYNC_RSH="ssh -o BatchMode=yes -o ConnectTimeout=5"

/usr/bin/rsync -rt --include='*.dump' --exclude='*' pi-paul:reference-dessin/backups/ "$BACKUP_DIR/"

find "$BACKUP_DIR" -maxdepth 1 -type f -name 'reference-dessin-*.dump' -mmin +43200 -delete

echo "Synchronisation des sauvegardes réussie."
