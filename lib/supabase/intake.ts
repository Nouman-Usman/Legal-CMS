import { supabase } from './client';
import type { ChamberData, ConflictHit } from '@/lib/intake/conflicts';

/** Everyone the chamber has dealt with, for the conflict check. */
export async function getChamberParties(chamberId: string) {
    const [clients, cases, parties, leads] = await Promise.all([
        supabase.from('chamber_clients').select('full_name, phone').eq('chamber_id', chamberId).is('deleted_at', null),
        supabase.from('cases').select('id, case_number, title, client_name, client_phone').eq('chamber_id', chamberId).is('deleted_at', null),
        supabase.from('case_parties').select('case_id, name, role').eq('chamber_id', chamberId),
        supabase.from('leads').select('name, phone').eq('chamber_id', chamberId).is('deleted_at', null),
    ]);
    const error = clients.error || cases.error || parties.error || leads.error;
    const data: ChamberData = {
        clients: clients.data ?? [],
        cases: cases.data ?? [],
        parties: (parties.data ?? []) as ChamberData['parties'],
        leads: leads.data ?? [],
    };
    return { data, error };
}

export type ConflictOutcome = 'clear' | 'conflict' | 'waived';

export interface ConflictCheckRow {
    id: string;
    client_name: string;
    opposing_names: string[];
    matter: string | null;
    conflict_count: number;
    review_count: number;
    outcome: ConflictOutcome;
    notes: string | null;
    created_at: string;
    checker?: { full_name: string | null } | null;
}

export async function saveConflictCheck(check: {
    chamber_id: string;
    client_name: string;
    client_phone?: string | null;
    opposing_names: string[];
    matter?: string | null;
    hits: ConflictHit[];
    outcome: ConflictOutcome;
    notes?: string | null;
}) {
    const { hits, ...rest } = check;
    const { data, error } = await supabase
        .from('conflict_checks')
        .insert({
            ...rest,
            client_name: rest.client_name.trim(),
            client_phone: rest.client_phone?.trim() || null,
            matter: rest.matter?.trim() || null,
            notes: rest.notes?.trim() || null,
            // A snapshot of what the check found, kept with the decision.
            hits: hits.map((h) => ({ searched: h.searchedName, matched: h.record.name, source: h.record.source, case: h.record.caseRef ?? null, severity: h.severity, strength: h.strength, reason: h.reason })),
            conflict_count: hits.filter((h) => h.severity === 'conflict').length,
            review_count: hits.filter((h) => h.severity === 'review').length,
        })
        .select('id')
        .single();
    return { id: (data?.id as string | undefined) ?? null, error };
}

export async function getRecentConflictChecks(chamberId: string, limit = 10) {
    const { data, error } = await supabase
        .from('conflict_checks')
        .select('id, client_name, opposing_names, matter, conflict_count, review_count, outcome, notes, created_at, checker:checked_by(full_name)')
        .eq('chamber_id', chamberId)
        .order('created_at', { ascending: false })
        .limit(limit);
    return { checks: (data ?? []) as unknown as ConflictCheckRow[], error };
}

export async function getCaseParties(caseId: string) {
    const { data, error } = await supabase.from('case_parties').select('id, name, role').eq('case_id', caseId).order('created_at');
    return { parties: (data ?? []) as Array<{ id: string; name: string; role: 'opposing' | 'other' }>, error };
}

/** Replace a case's opposing parties with `names`. */
export async function setOpposingParties(caseId: string, names: string[]) {
    const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
    const { error: delError } = await supabase.from('case_parties').delete().eq('case_id', caseId).eq('role', 'opposing');
    if (delError) return { error: delError };
    if (!clean.length) return { error: null };
    const { error } = await supabase.from('case_parties').insert(clean.map((name) => ({ case_id: caseId, name, role: 'opposing' })));
    return { error };
}
