import { supabase } from './client';
import type { DeadlineKind } from '@/lib/deadlines/limitation';

export type DeadlineStatus = 'open' | 'done' | 'cancelled';

export interface Deadline {
    id: string;
    case_id: string;
    kind: DeadlineKind;
    title: string;
    due_date: string;
    assigned_to: string | null;
    source_hearing_id: string | null;
    limitation_article: string | null;
    notes: string | null;
    status: DeadlineStatus;
    completed_at: string | null;
    assignee?: { full_name: string | null } | null;
    case?: { case_number: string | null; title: string } | null;
}

const COLUMNS = 'id, case_id, kind, title, due_date, assigned_to, source_hearing_id, limitation_article, notes, status, completed_at, assignee:assigned_to(full_name)';

export async function getCaseDeadlines(caseId: string) {
    const { data, error } = await supabase.from('case_deadlines').select(COLUMNS).eq('case_id', caseId).order('due_date', { ascending: true });
    return { deadlines: (data ?? []) as unknown as Deadline[], error };
}

/** Open deadlines across the chamber, due on or before `until` (overdue included). */
export async function getOpenDeadlines(chamberId: string, until?: string) {
    let q = supabase
        .from('case_deadlines')
        .select(`${COLUMNS}, case:case_id(case_number, title)`)
        .eq('chamber_id', chamberId)
        .eq('status', 'open')
        .order('due_date', { ascending: true });
    if (until) q = q.lte('due_date', until);
    const { data, error } = await q;
    return { deadlines: (data ?? []) as unknown as Deadline[], error };
}

export async function addDeadline(d: {
    case_id: string;
    kind: DeadlineKind;
    title: string;
    due_date: string;
    assigned_to?: string | null;
    source_hearing_id?: string | null;
    limitation_article?: string | null;
    notes?: string | null;
}) {
    const { error } = await supabase.from('case_deadlines').insert({
        ...d,
        title: d.title.trim(),
        assigned_to: d.assigned_to || null,
        notes: d.notes?.trim() || null,
    });
    return { error };
}

export async function setDeadlineStatus(id: string, status: DeadlineStatus) {
    const { error } = await supabase.from('case_deadlines').update({ status }).eq('id', id);
    return { error };
}

export async function getCourtHolidays(chamberId: string) {
    const { data, error } = await supabase.from('chamber_court_holidays').select('holiday_date, label').eq('chamber_id', chamberId).order('holiday_date');
    return { holidays: (data ?? []) as Array<{ holiday_date: string; label: string | null }>, error };
}

export async function addCourtHoliday(chamberId: string, date: string, label: string) {
    const { error } = await supabase.from('chamber_court_holidays').insert({ chamber_id: chamberId, holiday_date: date, label: label.trim() || null });
    return { error };
}

export async function removeCourtHoliday(chamberId: string, date: string) {
    const { error } = await supabase.from('chamber_court_holidays').delete().eq('chamber_id', chamberId).eq('holiday_date', date);
    return { error };
}
