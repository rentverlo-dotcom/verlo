#!/usr/bin/env bash
# VERLO QA schema-only export. READ ONLY: never connects to QA or alters production.
# Requirements: PostgreSQL pg_dump client compatible with remote server.
# Run locally with PROD_DATABASE_URL provided through a secure environment variable.
# Do NOT commit or share the generated SQL without reviewing it for secrets.
set -euo pipefail

: "${PROD_DATABASE_URL:?PROD_DATABASE_URL is required (production direct database connection string)}"
EXPECTED_PROD_REF="bmgrpcqrdvwculrisasi"
if [[ "$PROD_DATABASE_URL" != *"$EXPECTED_PROD_REF"* ]]; then
  echo "Refusing to run: PROD_DATABASE_URL does not identify expected production project" >&2
  exit 2
fi
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is required and was not found" >&2
  exit 2
fi

OUT_DIR="${1:-./.qa-schema-local}"
mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"
OUT_FILE="$OUT_DIR/verlo-production-public-schema.sql"
umask 077
echo "Exporting PUBLIC SCHEMA ONLY, no customer rows (read-only production connection)..."
pg_dump --dbname="$PROD_DATABASE_URL" \
  --schema-only --schema=public \
  --no-owner --no-acl \
  --file="$OUT_FILE"
chmod 600 "$OUT_FILE"
echo "Schema export created locally: $OUT_FILE"
echo "IMPORTANT: review any function definitions for hardcoded credentials before sharing."
echo "NO changes were made to either Supabase project."
