import 'server-only';
import { timingSafeEqual } from 'node:crypto';

/**
 * Only the scheduler may call cron routes: `Authorization: Bearer $CRON_SECRET`. The Supabase
 * pg_cron jobs send it (see migration 20261102260000_pg_cron_jobs and scripts/setup-cron-secrets.sh).
 */
export function isCronRequest(request: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    const got = Buffer.from(request.headers.get('authorization') ?? '');
    const want = Buffer.from(`Bearer ${secret}`);
    return got.length === want.length && timingSafeEqual(got, want);
}
