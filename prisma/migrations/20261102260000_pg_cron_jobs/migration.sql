-- Scheduled jobs run in Supabase with pg_cron. The work itself (SMTP email, fetching and
-- parsing the LHC cause list) lives in the app, so each job calls an app route over HTTP
-- with pg_net. The app's public URL and the shared secret come from Supabase Vault
-- (names: app_base_url, cron_secret), set by scripts/setup-cron-secrets.sh; never stored here.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.call_app_cron(path text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  base text;
  secret text;
BEGIN
  SELECT decrypted_secret INTO base FROM vault.decrypted_secrets WHERE name = 'app_base_url';
  SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = 'cron_secret';
  IF base IS NULL OR secret IS NULL THEN
    RAISE WARNING 'call_app_cron(%): app_base_url or cron_secret missing from Vault; skipped', path;
    RETURN NULL;
  END IF;
  RETURN net.http_get(
    url := rtrim(base, '/') || path,
    headers := jsonb_build_object('Authorization', 'Bearer ' || secret),
    timeout_milliseconds := 300000
  );
END $$;

-- Only the scheduler (postgres) may call it; never exposed to the API roles.
REVOKE ALL ON FUNCTION public.call_app_cron(text) FROM PUBLIC, anon, authenticated;

-- Re-scheduling an existing job name updates it, so this migration is safe to re-run.
-- 03:00 UTC = 08:00 PKT: deadline reminders (3 days and 1 day before).
SELECT cron.schedule('deadline-reminders', '0 3 * * *', $$SELECT public.call_app_cron('/api/deadlines/remind')$$);
-- 13:00 UTC = 18:00 PKT: LHC cause-list sync and the evening email of tomorrow's listings.
SELECT cron.schedule('lhc-cause-list-sync', '0 13 * * *', $$SELECT public.call_app_cron('/api/cause-lists/sync')$$);
