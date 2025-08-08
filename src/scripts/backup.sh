#!/usr/bin/env bash
set -euo pipefail
DB_CONTAINER="${DB_CONTAINER:-ema-db-test}"
DB_NAME="${DB_NAME:-elliesdb}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
TS=$(date +"%Y%m%d_%H%M%S")
FILE="$BACKUP_DIR/${DB_NAME}_${TS}.sql.gz"
echo "[EMA] Dumping $DB_NAME from $DB_CONTAINER -> $FILE"
docker exec -i "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILE"
echo "[EMA] Done."