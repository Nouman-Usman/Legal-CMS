import { supabase } from './client';
import type { LedgerEntry, LedgerKind, PaymentMethod } from '@/lib/fees/ledger';

export type FeeType = 'fixed' | 'per_appearance' | 'retainer';

export interface FeeAgreement {
    case_id: string;
    fee_type: FeeType;
    agreed_amount: number | null;
    appearance_fee: number | null;
    currency: string;
    notes: string | null;
}

export interface LedgerRow extends LedgerEntry {
    case_id: string;
    description: string | null;
    method: PaymentMethod | null;
    reference: string | null;
    receipt_no: string | null;
    hearing_id: string | null;
    void_reason: string | null;
    created_at: string;
    creator?: { full_name: string | null } | null;
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function getFeeAgreement(caseId: string) {
    const { data, error } = await supabase.from('case_fee_agreements').select('*').eq('case_id', caseId).maybeSingle();
    const agreement = data ? ({ ...data, agreed_amount: num(data.agreed_amount), appearance_fee: num(data.appearance_fee) } as FeeAgreement) : null;
    return { agreement, error };
}

export async function saveFeeAgreement(agreement: FeeAgreement) {
    const { error } = await supabase.from('case_fee_agreements').upsert(agreement, { onConflict: 'case_id' });
    return { error };
}

export async function getLedger(caseId: string) {
    const { data, error } = await supabase
        .from('case_ledger')
        .select('id, case_id, kind, amount, entry_date, description, method, reference, receipt_no, hearing_id, voided_at, void_reason, created_at, creator:created_by(full_name)')
        .eq('case_id', caseId)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });
    const entries = (data ?? []).map((r: any) => ({ ...r, amount: Number(r.amount) })) as LedgerRow[];
    return { entries, error };
}

export async function addLedgerEntry(entry: {
    case_id: string;
    kind: LedgerKind;
    amount: number;
    entry_date: string;
    description?: string | null;
    method?: PaymentMethod | null;
    reference?: string | null;
}) {
    const { data, error } = await supabase
        .from('case_ledger')
        .insert({
            ...entry,
            description: entry.description?.trim() || null,
            reference: entry.reference?.trim() || null,
            method: entry.kind === 'payment' ? entry.method : null,
        })
        .select('id, receipt_no, amount, entry_date, method')
        .single();
    return { entry: data, error };
}

export async function voidLedgerEntry(id: string, reason: string) {
    const { error } = await supabase.from('case_ledger').update({ voided_at: new Date().toISOString(), void_reason: reason.trim() }).eq('id', id);
    return { error };
}

export async function getChamberName(chamberId: string) {
    const { data } = await supabase.from('chambers').select('name').eq('id', chamberId).maybeSingle();
    return (data?.name as string | undefined) ?? null;
}

export interface DueRow {
    case_id: string;
    charged: number;
    paid: number;
    balance: number;
    last_payment_date: string | null;
    case_number: string | null;
    title: string;
    client_name: string | null;
    client_phone: string | null;
}

/** Cases with money outstanding, largest first. */
export async function getDues(chamberId: string) {
    const { data: balances, error } = await supabase
        .from('case_balances')
        .select('case_id, charged, paid, balance, last_payment_date')
        .eq('chamber_id', chamberId)
        .gt('balance', 0)
        .order('balance', { ascending: false });
    if (error || !balances?.length) return { dues: [] as DueRow[], error };

    const { data: cases } = await supabase
        .from('cases')
        .select('id, case_number, title, client_name, client_phone')
        .in(
            'id',
            balances.map((b) => b.case_id),
        );
    const byId = new Map((cases ?? []).map((c: any) => [c.id, c]));
    const dues = balances.map((b: any) => {
        const c = byId.get(b.case_id) ?? {};
        return {
            case_id: b.case_id,
            charged: Number(b.charged),
            paid: Number(b.paid),
            balance: Number(b.balance),
            last_payment_date: b.last_payment_date,
            case_number: c.case_number ?? null,
            title: c.title ?? '',
            client_name: c.client_name ?? null,
            client_phone: c.client_phone ?? null,
        } as DueRow;
    });
    return { dues, error: null };
}

/** Payments received in the current month. */
export async function getCollectedThisMonth(chamberId: string) {
    const now = new Date();
    const first = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const { data } = await supabase
        .from('case_ledger')
        .select('amount')
        .eq('chamber_id', chamberId)
        .eq('kind', 'payment')
        .is('voided_at', null)
        .gte('entry_date', first);
    return (data ?? []).reduce((sum, r: any) => sum + Number(r.amount), 0);
}
