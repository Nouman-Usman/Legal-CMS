import { supabase } from './client';
import type { DocketRow, HearingStatus } from '@/lib/hearings/docket';

/** A hearing with what the case page and the docket need. */
export interface Hearing {
    id: string;
    case_id: string;
    hearing_date: string;
    court_name: string | null;
    judge_name: string | null;
    purpose: string | null;
    status: HearingStatus;
    proceedings: string | null;
    cause_list_no: string | null;
    appearing_lawyer_id: string | null;
    appearing_lawyer?: { full_name: string | null } | null;
    client_notified_at?: string | null;
}

const HEARING_FIELDS =
    'id, case_id, hearing_date, court_name, judge_name, purpose, status, proceedings, cause_list_no, appearing_lawyer_id, client_notified_at, appearing_lawyer:appearing_lawyer_id(full_name)';

/** Every hearing of a case, newest first. */
export async function getCaseHearings(caseId: string) {
    const { data, error } = await supabase.from('hearings').select(HEARING_FIELDS).eq('case_id', caseId).order('hearing_date', { ascending: false });
    return { hearings: (data ?? []) as unknown as Hearing[], error };
}

/** Local-day bounds as ISO strings, so "today" means the user's today. */
export function dayRange(day: Date) {
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { from: start.toISOString(), to: end.toISOString() };
}

/** The chamber's hearings on one day; `lawyerId` narrows to one lawyer's appearances. */
export async function getDocket(chamberId: string, day: Date, lawyerId?: string): Promise<{ rows: DocketRow[]; error: unknown }> {
    const { from, to } = dayRange(day);
    let query = supabase
        .from('hearings')
        .select(`${HEARING_FIELDS}, cases:case_id(case_number, title, court)`)
        .eq('chamber_id', chamberId)
        .gte('hearing_date', from)
        .lt('hearing_date', to)
        .order('cause_list_no', { ascending: true, nullsFirst: false });
    if (lawyerId) query = query.eq('appearing_lawyer_id', lawyerId);
    const { data, error } = await query;
    const rows: DocketRow[] = (data ?? []).map((h: any) => ({
        id: h.id,
        caseId: h.case_id,
        caseNumber: h.cases?.case_number ?? null,
        caseTitle: h.cases?.title ?? '',
        court: h.court_name ?? h.cases?.court ?? null,
        purpose: h.purpose,
        causeListNo: h.cause_list_no,
        lawyerId: h.appearing_lawyer_id,
        lawyerName: h.appearing_lawyer?.full_name ?? null,
        status: h.status,
    }));
    return { rows, error };
}

export interface NewHearing {
    case_id: string;
    hearing_date: string;
    court_name?: string | null;
    judge_name?: string | null;
    purpose?: string | null;
    cause_list_no?: string | null;
    appearing_lawyer_id?: string | null;
}

export async function scheduleHearing(hearing: NewHearing) {
    const { data, error } = await supabase.from('hearings').insert({ ...hearing, status: 'scheduled' }).select('id').single();
    return { id: data?.id as string | undefined, error };
}

export interface Outcome {
    status: Exclude<HearingStatus, 'scheduled'>;
    proceedings: string;
    /** Next date (ISO) when the matter was adjourned or not reached. */
    nextDate?: string;
    nextPurpose?: string;
}

/**
 * Close the current hearing and, if a next date is given, open the next one in the
 * same court before the same bench, with the same lawyer.
 */
export async function recordOutcome(current: Hearing, outcome: Outcome) {
    const { error } = await supabase
        .from('hearings')
        .update({ status: outcome.status, proceedings: outcome.proceedings || null })
        .eq('id', current.id);
    if (error) return { error };
    if (outcome.nextDate && outcome.status !== 'decided') {
        return scheduleHearing({
            case_id: current.case_id,
            hearing_date: outcome.nextDate,
            court_name: current.court_name,
            judge_name: current.judge_name,
            purpose: outcome.nextPurpose || current.purpose,
            appearing_lawyer_id: current.appearing_lawyer_id,
        });
    }
    return { error: null };
}

export async function reassignHearing(hearingId: string, lawyerId: string | null) {
    const { error } = await supabase.from('hearings').update({ appearing_lawyer_id: lawyerId }).eq('id', hearingId);
    return { error };
}

/** Active members of a chamber who can appear: admins and lawyers. */
export async function getChamberLawyers(chamberId: string) {
    const { data, error } = await supabase
        .from('chamber_members')
        .select('user_id, users:user_id(id, full_name, role)')
        .eq('chamber_id', chamberId)
        .neq('is_active', false);
    const lawyers = (data ?? [])
        .map((m: any) => m.users)
        .filter((u: any) => u && (u.role === 'lawyer' || u.role === 'chamber_admin'))
        .map((u: any) => ({ id: u.id as string, name: (u.full_name as string) || 'Unnamed' }));
    return { lawyers, error };
}

/** What the client update needs: the case's client and the next open date after `afterIso`. */
export async function getClientUpdateContext(caseId: string, afterIso: string) {
    const [{ data: caseRow, error }, { data: next }] = await Promise.all([
        supabase.from('cases').select('case_number, title, court, client_name, client_phone, chambers:chamber_id(name)').eq('id', caseId).single(),
        supabase
            .from('hearings')
            .select('hearing_date, purpose, court_name')
            .eq('case_id', caseId)
            .eq('status', 'scheduled')
            .gt('hearing_date', afterIso)
            .order('hearing_date', { ascending: true })
            .limit(1)
            .maybeSingle(),
    ]);
    return { caseRow: caseRow as any, next: next as { hearing_date: string; purpose: string | null; court_name: string | null } | null, error };
}

export async function markClientNotified(hearingId: string, userId: string) {
    const { error } = await supabase
        .from('hearings')
        .update({ client_notified_at: new Date().toISOString(), client_notified_by: userId })
        .eq('id', hearingId);
    return { error };
}
