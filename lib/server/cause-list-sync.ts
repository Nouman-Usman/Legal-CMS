import 'server-only';
import { supabaseAdmin } from '@/lib/server/chamber-admin';
import { sendMail } from '@/lib/server/mailer';
import { addDays, pkToday } from '@/lib/deadlines/limitation';
import { renderCauseListDigest, type DigestItem } from '@/lib/email/cause-list-digest';
import { LIST_TYPE_LABEL, lhcMobile, lhcQueryUrl, listingKey, matchListing, parseLhcCauseList, type ChamberCase, type LhcListing, type LhcSeat, type MatchStatus } from '@/lib/cause-lists/lhc';

const USER_AGENT = 'ApnaWaqeel-CauseListSync/1.0 (chamber case diary; one query per advocate per day)';
/** Pause between requests to LHC: be a polite, low-volume client. */
const PAUSE_MS = 2500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 09:00 PKT on a list date, and that PKT day's bounds. */
const nineAmPkt = (date: string) => `${date}T04:00:00.000Z`;
const pktDay = (date: string) => [`${date}T00:00:00+05:00`, `${addDays(date, 1)}T00:00:00+05:00`] as const;

export interface SyncResult {
    status: 'ok' | 'partial' | 'failed' | 'skipped';
    message: string;
    found: number;
    onDocket: number;
    toReview: number;
}

type Advocate = { id: string; name: string; email: string | null; query: { lawyerCode?: string; lawyerMobile?: string } };

/** The chamber's advocates and how LHC can find their listings (code first, then mobile). */
async function advocatesOf(chamberId: string): Promise<Advocate[]> {
    const db = supabaseAdmin();
    const { data: members } = await db
        .from('chamber_members')
        .select('user_id, users:user_id!inner(id, full_name, email, phone, role, deleted_at)')
        .eq('chamber_id', chamberId)
        .neq('is_active', false);
    const people = (members ?? []).map((m: any) => m.users).filter((u: any) => u && !u.deleted_at && (u.role === 'lawyer' || u.role === 'chamber_admin'));
    if (!people.length) return [];
    const { data: profiles } = await db.from('lawyers').select('user_id, lhc_lawyer_code').in('user_id', people.map((u: any) => u.id));
    const codes = new Map((profiles ?? []).map((p: any) => [p.user_id, p.lhc_lawyer_code as string | null]));

    return people.flatMap((u: any): Advocate[] => {
        const code = codes.get(u.id)?.trim();
        const mobile = lhcMobile(u.phone);
        if (code) return [{ id: u.id, name: u.full_name || u.email, email: u.email, query: { lawyerCode: code } }];
        if (mobile) return [{ id: u.id, name: u.full_name || u.email, email: u.email, query: { lawyerMobile: mobile } }];
        return [];
    });
}

async function fetchListings(query: Advocate['query'], location: LhcSeat) {
    const res = await fetch(lhcQueryUrl({ ...query, location }), { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(25_000), cache: 'no-store' });
    if (!res.ok) throw new Error(`LHC answered ${res.status}`);
    const parsed = parseLhcCauseList(await res.text());
    if (!parsed.formatOk) throw new Error('The LHC cause list page has changed; the sync needs an update.');
    return parsed.listings;
}

/**
 * Fetch the week's LHC listings for every advocate of the chamber, match them to cases,
 * put confident matches on the docket, queue the rest for review, and email tomorrow's
 * list once each evening.
 */
export async function syncLhcForChamber(chamberId: string): Promise<SyncResult> {
    const db = supabaseAdmin();
    const { data: tracking } = await db.from('chamber_court_tracking').select('*').eq('chamber_id', chamberId).maybeSingle();
    if (!tracking?.lhc_enabled) return { status: 'skipped', message: 'LHC tracking is off', found: 0, onDocket: 0, toReview: 0 };

    const finish = async (r: SyncResult) => {
        await db.from('chamber_court_tracking').update({ last_sync_at: new Date().toISOString(), last_sync_status: r.status, last_sync_message: r.message }).eq('chamber_id', chamberId);
        return r;
    };

    const advocates = await advocatesOf(chamberId);
    if (!advocates.length) {
        return finish({ status: 'failed', message: 'No advocate has an LHC lawyer code or a mobile number. Add them on the team page.', found: 0, onDocket: 0, toReview: 0 });
    }

    // 1. Fetch, one advocate at a time.
    const listings = new Map<string, { listing: LhcListing; advocateId: string }>();
    const failures: string[] = [];
    for (const [i, a] of advocates.entries()) {
        if (i > 0) await sleep(PAUSE_MS);
        try {
            for (const listing of await fetchListings(a.query, tracking.lhc_location as LhcSeat)) {
                const key = listingKey(listing);
                if (!listings.has(key)) listings.set(key, { listing, advocateId: a.id });
            }
        } catch (e) {
            failures.push(`${a.name}: ${(e as Error).message}`);
        }
    }
    if (failures.length === advocates.length) {
        return finish({ status: 'failed', message: failures[0], found: 0, onDocket: 0, toReview: 0 });
    }

    // 2. The chamber's cases (with opposing parties) and what was already decided.
    const [{ data: caseRows }, { data: parties }, { data: existing }] = await Promise.all([
        db.from('cases').select('id, case_number, title, client_name').eq('chamber_id', chamberId).is('deleted_at', null),
        db.from('case_parties').select('case_id, name').eq('chamber_id', chamberId),
        db.from('cause_list_entries').select('entry_key, case_id, hearing_id, match_status').eq('chamber_id', chamberId).eq('source', 'lhc').in('entry_key', [...listings.keys()]),
    ]);
    const partiesByCase = new Map<string, string[]>();
    for (const p of parties ?? []) partiesByCase.set(p.case_id, [...(partiesByCase.get(p.case_id) ?? []), p.name]);
    const cases: ChamberCase[] = (caseRows ?? []).map((c: any) => ({ ...c, parties: partiesByCase.get(c.id) }));
    const decided = new Map((existing ?? []).map((e: any) => [e.entry_key, e]));

    // 3. Match each listing; confident matches go on the docket.
    const now = new Date().toISOString();
    const rows = [];
    for (const [key, { listing, advocateId }] of listings) {
        const prior = decided.get(key);
        let caseId: string | null = prior?.case_id ?? null;
        let hearingId: string | null = prior?.hearing_id ?? null;
        let status: MatchStatus | 'linked' | 'ignored' = prior?.match_status ?? 'unmatched';
        let note: string | null = null;

        if (!prior || prior.match_status === 'unmatched' || prior.match_status === 'suggested' || (prior.match_status === 'auto' && !prior.hearing_id)) {
            const m = matchListing(listing, cases);
            ({ caseId, status, note } = m);
            if (status === 'auto' && caseId) {
                const placed = await placeOnDocket(caseId, listing, advocateId);
                hearingId = placed.hearingId;
                if (placed.conflict) {
                    status = 'suggested';
                    note = placed.conflict;
                }
            }
        }
        rows.push({
            chamber_id: chamberId,
            source: 'lhc',
            entry_key: key,
            list_date: listing.listDate,
            bench: listing.bench,
            judge: listing.judge,
            court_room: listing.courtRoom,
            seq: listing.seq,
            connected: listing.connected,
            list_type: listing.listType,
            category: listing.category,
            case_no: listing.caseNo,
            title: listing.title,
            lawyer_name: listing.lawyer,
            remarks: listing.remarks,
            queried_lawyer_id: advocateId,
            case_id: caseId,
            hearing_id: hearingId,
            match_status: status,
            ...(note ? { match_note: note } : {}),
            last_seen_at: now,
        });
    }
    if (rows.length) {
        const { error } = await db.from('cause_list_entries').upsert(rows, { onConflict: 'chamber_id,source,entry_key' });
        if (error) return finish({ status: 'failed', message: `Could not save listings: ${error.message}`, found: rows.length, onDocket: 0, toReview: 0 });
    }

    const onDocket = rows.filter((r) => (r.match_status === 'auto' || r.match_status === 'linked') && r.hearing_id).length;
    const toReview = rows.filter((r) => r.match_status === 'suggested' || r.match_status === 'unmatched').length;
    await sendDigestOnce(chamberId, tracking.last_digest_date);

    const message = `${rows.length} listing${rows.length === 1 ? '' : 's'} this week for ${advocates.length} advocate${advocates.length === 1 ? '' : 's'}: ${onDocket} on the docket, ${toReview} to review.${failures.length ? ` Failed for ${failures.join('; ')}.` : ''}`;
    return finish({ status: failures.length ? 'partial' : 'ok', message, found: rows.length, onDocket, toReview });
}

/**
 * Put a listing on the case's hearing log. Reuses that day's hearing if the diary already
 * has one; refuses (returns a conflict) when the diary says a different next date.
 */
async function placeOnDocket(caseId: string, l: LhcListing, advocateId: string): Promise<{ hearingId: string | null; conflict?: string }> {
    const db = supabaseAdmin();
    const [from, to] = pktDay(l.listDate);
    const court = [l.judge, l.courtRoom].filter(Boolean).join(' · ') || null;

    const { data: sameDay } = await db.from('hearings').select('id, judge_name, cause_list_no').eq('case_id', caseId).gte('hearing_date', from).lt('hearing_date', to).limit(1).maybeSingle();
    if (sameDay) {
        await db
            .from('hearings')
            .update({ judge_name: sameDay.judge_name || court, cause_list_no: sameDay.cause_list_no || l.seq })
            .eq('id', sameDay.id);
        return { hearingId: sameDay.id };
    }

    const { data: other } = await db
        .from('hearings')
        .select('hearing_date')
        .eq('case_id', caseId)
        .eq('status', 'scheduled')
        .gte('hearing_date', new Date().toISOString())
        .order('hearing_date')
        .limit(1)
        .maybeSingle();
    if (other) {
        const diary = new Date(other.hearing_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' });
        return { hearingId: null, conflict: `Listed ${l.listDate}, but the diary has the next date as ${diary}` };
    }

    const { data: created, error } = await db
        .from('hearings')
        .insert({
            case_id: caseId,
            hearing_date: nineAmPkt(l.listDate),
            court_name: 'Lahore High Court',
            judge_name: court,
            purpose: [LIST_TYPE_LABEL[l.listType], l.remarks].filter(Boolean).join(' · '),
            cause_list_no: l.seq,
            appearing_lawyer_id: advocateId,
            status: 'scheduled',
            source: 'cause_list',
        })
        .select('id')
        .single();
    if (error) return { hearingId: null, conflict: `Could not add the hearing: ${error.message}` };
    return { hearingId: created.id };
}

/** After 5 pm PKT, once a day: email tomorrow's listings to admins, munshis and the advocates concerned. */
async function sendDigestOnce(chamberId: string, lastDigestDate: string | null) {
    const today = pkToday();
    const hourPkt = Number(new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Karachi' }));
    if (hourPkt < 17 || lastDigestDate === today) return;

    const db = supabaseAdmin();
    const tomorrow = addDays(today, 1);
    const [{ data: entries }, { data: chamber }, { data: members }] = await Promise.all([
        db
            .from('cause_list_entries')
            .select('seq, judge, court_room, list_type, remarks, match_status, case:case_id(case_number, title, assigned_to), hearing:hearing_id(appearing_lawyer_id)')
            .eq('chamber_id', chamberId)
            .eq('list_date', tomorrow)
            .order('seq'),
        db.from('chambers').select('name').eq('id', chamberId).maybeSingle(),
        db.from('chamber_members').select('role, users:user_id(id, email, full_name)').eq('chamber_id', chamberId).neq('is_active', false),
    ]);
    const listed: any[] = (entries ?? []).filter((e: any) => (e.match_status === 'auto' || e.match_status === 'linked') && e.case);
    const toReview = (entries ?? []).filter((e: any) => e.match_status === 'suggested' || e.match_status === 'unmatched').length;
    if (!listed.length && !toReview) return;

    const items: DigestItem[] = listed.map((e: any) => ({
        caseRef: [e.case.case_number, e.case.title].filter(Boolean).join(' · '),
        court: [e.judge, e.court_room].filter(Boolean).join(' · ') || 'Lahore High Court',
        seq: e.seq,
        note: e.list_type === 'regular' ? e.remarks || null : LIST_TYPE_LABEL[e.list_type as keyof typeof LIST_TYPE_LABEL],
    }));
    // Admins and munshis get every listing; an advocate gets the cases they appear in.
    const involved = new Set(listed.flatMap((e: any) => [e.hearing?.appearing_lawyer_id, e.case?.assigned_to]).filter(Boolean));
    const recipients = (members ?? [])
        .map((m: any) => ({ ...m.users, role: m.role }))
        .filter((u: any) => u?.email && (u.role === 'admin' || u.role === 'munshi' || involved.has(u.id)));

    const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    for (const r of recipients) {
        const mine = r.role === 'admin' || r.role === 'munshi' ? items : items.filter((_, i) => [listed[i].hearing?.appearing_lawyer_id, listed[i].case?.assigned_to].includes(r.id));
        if (!mine.length) continue;
        const docket = r.role === 'munshi' ? '/dashboard/munshi' : r.role === 'admin' ? '/dashboard/chambers-admin/docket' : '/dashboard/lawyer/docket';
        try {
            await sendMail({
                to: r.email,
                ...renderCauseListDigest({ recipientName: r.full_name || 'Advocate', chamberName: chamber?.name || 'Your chamber', date: tomorrow, items: mine, toReview: r.role === 'member' ? 0 : toReview, url: `${site}${docket}` }),
            });
        } catch (e) {
            console.error('cause list digest failed', r.email, e);
        }
    }
    await db.from('chamber_court_tracking').update({ last_digest_date: today }).eq('chamber_id', chamberId);
}
