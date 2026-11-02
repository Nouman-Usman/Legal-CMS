import { supabase } from './client';
import type { LhcSeat, ListType } from '@/lib/cause-lists/lhc';

export interface CourtTracking {
    chamber_id: string;
    lhc_enabled: boolean;
    lhc_location: LhcSeat;
    last_sync_at: string | null;
    last_sync_status: 'ok' | 'partial' | 'failed' | null;
    last_sync_message: string | null;
}

export interface CauseListEntry {
    id: string;
    list_date: string;
    bench: string | null;
    judge: string | null;
    court_room: string | null;
    seq: string | null;
    connected: boolean;
    list_type: ListType;
    category: string | null;
    case_no: string;
    title: string | null;
    lawyer_name: string | null;
    remarks: string | null;
    queried_lawyer_id: string | null;
    case_id: string | null;
    hearing_id: string | null;
    match_status: 'auto' | 'suggested' | 'unmatched' | 'linked' | 'ignored';
    match_note: string | null;
    case?: { case_number: string | null; title: string } | null;
}

export async function getCourtTracking(chamberId: string) {
    const { data, error } = await supabase.from('chamber_court_tracking').select('*').eq('chamber_id', chamberId).maybeSingle();
    return { tracking: data as CourtTracking | null, error };
}

export async function saveCourtTracking(chamberId: string, settings: { lhc_enabled: boolean; lhc_location: LhcSeat }) {
    const { error } = await supabase.from('chamber_court_tracking').upsert({ chamber_id: chamberId, ...settings }, { onConflict: 'chamber_id' });
    return { error };
}

/** Listings from `fromDate` on (the list covers the working week ahead). */
export async function getCauseListEntries(chamberId: string, fromDate: string) {
    const { data, error } = await supabase
        .from('cause_list_entries')
        .select('id, list_date, bench, judge, court_room, seq, connected, list_type, category, case_no, title, lawyer_name, remarks, queried_lawyer_id, case_id, hearing_id, match_status, match_note, case:case_id(case_number, title)')
        .eq('chamber_id', chamberId)
        .gte('list_date', fromDate)
        .order('list_date')
        .order('judge')
        .order('seq');
    return { entries: (data ?? []) as unknown as CauseListEntry[], error };
}

/**
 * Link a listing to a case and put it on that case's hearing log (reusing a hearing the
 * diary already has that day).
 */
export async function linkCauseListEntry(entry: CauseListEntry, caseId: string) {
    const from = `${entry.list_date}T00:00:00+05:00`;
    const to = new Date(Date.parse(from) + 86_400_000).toISOString();
    const { data: sameDay } = await supabase.from('hearings').select('id').eq('case_id', caseId).gte('hearing_date', from).lt('hearing_date', to).limit(1).maybeSingle();

    let hearingId = sameDay?.id as string | undefined;
    if (!hearingId) {
        const { data, error } = await supabase
            .from('hearings')
            .insert({
                case_id: caseId,
                hearing_date: `${entry.list_date}T04:00:00.000Z`,
                court_name: 'Lahore High Court',
                judge_name: [entry.judge, entry.court_room].filter(Boolean).join(' · ') || null,
                purpose: entry.remarks || null,
                cause_list_no: entry.seq,
                appearing_lawyer_id: entry.queried_lawyer_id,
                status: 'scheduled',
                source: 'cause_list',
            })
            .select('id')
            .single();
        if (error) return { error };
        hearingId = data.id;
    }
    const { error } = await supabase.from('cause_list_entries').update({ case_id: caseId, hearing_id: hearingId, match_status: 'linked' }).eq('id', entry.id);
    return { error };
}

export async function ignoreCauseListEntry(id: string) {
    const { error } = await supabase.from('cause_list_entries').update({ match_status: 'ignored' }).eq('id', id);
    return { error };
}

/** Admin "Sync now" (rate-limited on the server). */
export async function syncCauseListNow() {
    const res = await fetch('/api/cause-lists/sync', { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    return res.ok ? { result: body as { status: string; message: string }, error: null } : { result: null, error: (body.error as string) || 'Sync failed' };
}

/** The signed-in advocate's own LHC lawyer code (admins who appear in court). */
export async function getOwnLhcCode(userId: string) {
    const { data } = await supabase.from('lawyers').select('lhc_lawyer_code').eq('user_id', userId).maybeSingle();
    return (data?.lhc_lawyer_code as string | null) ?? '';
}

export async function saveOwnLhcCode(userId: string, code: string) {
    const value = code.trim() || null;
    const { data: updated, error } = await supabase.from('lawyers').update({ lhc_lawyer_code: value }).eq('user_id', userId).select('id');
    if (error) return { error };
    if (!updated?.length && value) return { error: (await supabase.from('lawyers').insert({ user_id: userId, lhc_lawyer_code: value })).error };
    return { error: null };
}
