import { NextResponse } from 'next/server';
import { errorResponse, HttpError, requireChamberAdmin, supabaseAdmin } from '@/lib/server/chamber-admin';
import { isCronRequest } from '@/lib/server/cron';
import { syncLhcForChamber } from '@/lib/server/cause-list-sync';

export const dynamic = 'force-dynamic';
// ponytail: chambers sync one after another inside one call; move to a queue when this nears the limit.
export const maxDuration = 300;

const MANUAL_COOLDOWN_MS = 15 * 60 * 1000;

/** Nightly (pg_cron job lhc-cause-list-sync, 18:00 PKT): sync every chamber that tracks the LHC cause list. */
export async function GET(request: Request) {
    if (!isCronRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: chambers } = await supabaseAdmin().from('chamber_court_tracking').select('chamber_id').eq('lhc_enabled', true);
    const results = [];
    for (const { chamber_id } of chambers ?? []) {
        try {
            results.push({ chamber_id, ...(await syncLhcForChamber(chamber_id)) });
        } catch (e) {
            console.error('cause list sync failed', chamber_id, e);
            results.push({ chamber_id, status: 'failed' });
        }
    }
    return NextResponse.json({ chambers: results.length, results: results.map(({ chamber_id, status }) => ({ chamber_id, status })) });
}

/** "Sync now" for a chamber admin, at most once every 15 minutes. */
export async function POST() {
    try {
        const { chamberId } = await requireChamberAdmin();
        const db = supabaseAdmin();
        const { data: tracking } = await db.from('chamber_court_tracking').select('lhc_enabled, last_manual_sync_at').eq('chamber_id', chamberId).maybeSingle();
        if (!tracking?.lhc_enabled) throw new HttpError(400, 'Turn on LHC tracking first');
        const last = tracking.last_manual_sync_at ? Date.parse(tracking.last_manual_sync_at) : 0;
        if (Date.now() - last < MANUAL_COOLDOWN_MS) {
            throw new HttpError(429, `Synced recently. Try again in ${Math.ceil((last + MANUAL_COOLDOWN_MS - Date.now()) / 60000)} min.`);
        }
        await db.from('chamber_court_tracking').update({ last_manual_sync_at: new Date().toISOString() }).eq('chamber_id', chamberId);
        return Response.json(await syncLhcForChamber(chamberId));
    } catch (error) {
        return errorResponse(error);
    }
}
