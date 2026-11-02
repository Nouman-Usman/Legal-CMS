#!/usr/bin/env bash
# Stores what the pg_cron jobs need in Supabase Vault: the app's public URL and CRON_SECRET.
# Reads both from .env; the values are never printed or passed on the command line.
#   CRON_TARGET_URL=https://your-deployed-app.example   (Supabase cannot reach localhost)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
: "${DIRECT_URL:?DIRECT_URL is missing from .env}"
: "${CRON_SECRET:?CRON_SECRET is missing from .env}"
: "${CRON_TARGET_URL:?Add CRON_TARGET_URL to .env: the public https URL of the deployed app}"
case "$CRON_TARGET_URL" in https://*) ;; *) echo "CRON_TARGET_URL must start with https:// (Supabase cannot call localhost)"; exit 1 ;; esac

psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -q >/dev/null <<'SQL'
\getenv secret CRON_SECRET
\getenv base CRON_TARGET_URL
SELECT vault.update_secret(id, :'secret') FROM vault.secrets WHERE name = 'cron_secret';
SELECT vault.create_secret(:'secret', 'cron_secret', 'Bearer token for the app cron routes') WHERE NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cron_secret');
SELECT vault.update_secret(id, :'base') FROM vault.secrets WHERE name = 'app_base_url';
SELECT vault.create_secret(:'base', 'app_base_url', 'Public URL the pg_cron jobs call') WHERE NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'app_base_url');
SQL
echo "Vault updated: cron_secret, app_base_url. Jobs: deadline-reminders (08:00 PKT), lhc-cause-list-sync (18:00 PKT)."
