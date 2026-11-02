/**
 * Conflict check for a new matter: does the chamber already act for the other side, or
 * against the new client? Pure; the intake page loads the chamber's parties and calls
 * `runConflictCheck` in the browser.
 *
 * ponytail: matching runs client-side over every party in the chamber. Fine for
 * thousands of records; move to pg_trgm in SQL if a chamber outgrows that.
 */
import { normalizePkPhone } from '../hearings/client-update.ts';

export type PartyRole = 'client' | 'opposing' | 'other' | 'lead' | 'title';
export type Strength = 'exact' | 'likely' | 'possible';
export type Severity = 'conflict' | 'review' | 'info';

export interface PartyRecord {
    name: string;
    phone?: string | null;
    role: PartyRole;
    caseId?: string;
    caseRef?: string;
    /** Where it came from, e.g. "Client list", "Case title". */
    source: string;
}

export interface ConflictHit {
    searched: 'client' | 'opposing';
    searchedName: string;
    record: PartyRecord;
    strength: Strength;
    severity: Severity;
    reason: string;
}

/** Common spellings of the same name, mapped to one form. */
const VARIANTS: Record<string, string> = {
    mohammad: 'muhammad', mohammed: 'muhammad', muhammed: 'muhammad', mohamed: 'muhammad', mohd: 'muhammad', md: 'muhammad',
    ahmed: 'ahmad',
    rehman: 'rahman',
    husain: 'hussain', hussein: 'hussain', hossain: 'hussain',
    hasan: 'hassan',
    osman: 'usman', uthman: 'usman',
    khwaja: 'khawaja',
    chaudhary: 'chaudhry', chaudhri: 'chaudhry', choudhry: 'chaudhry', choudhary: 'chaudhry', ch: 'chaudhry',
    govt: 'government', gov: 'government',
    pvt: '', private: '', ltd: '', limited: '', co: '', company: '', the: '', of: '', and: '',
    mr: '', mrs: '', ms: '', miss: '', dr: '', mst: '', messrs: '', 's/o': '', 'd/o': '', 'w/o': '',
};

/** Too common to mean anything on their own. */
const COMMON = new Set(['muhammad', 'syed', 'malik', 'khan', 'sheikh', 'rana', 'chaudhry', 'mian', 'government', 'province', 'state', 'pakistan', 'punjab', 'sindh', 'federation', 'bibi', 'begum']);

export function nameTokens(raw: string): string[] {
    return raw
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/\b[sdw]\/o\b/g, ' ')
        .replace(/[^a-z0-9؀-ۿ]+/g, ' ')
        .split(' ')
        .map((t) => (t in VARIANTS ? VARIANTS[t] : t))
        .filter(Boolean);
}

function levenshtein(a: string, b: string) {
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const cur = [i];
        for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = cur;
    }
    return prev[b.length];
}

export function matchName(a: string, b: string): Strength | null {
    const ta = nameTokens(a);
    const tb = nameTokens(b);
    if (!ta.length || !tb.length) return null;
    const sa = [...ta].sort().join(' ');
    const sb = [...tb].sort().join(' ');
    if (sa === sb) return 'exact';

    const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
    if (short.every((t) => long.includes(t))) {
        const meaningful = short.filter((t) => !COMMON.has(t) && t.length >= 3);
        if (short.length >= 2 && meaningful.length >= 1) return 'likely';
        if (meaningful.length === 1) return 'possible';
        return null;
    }
    // Spelling slips ("Shahid Mehmood" / "Shahid Mahmood").
    const ratio = 1 - levenshtein(sa, sb) / Math.max(sa.length, sb.length);
    return ratio >= 0.85 && Math.min(sa.length, sb.length) >= 6 ? 'likely' : null;
}

/** "Ali v. Province of Punjab" → ["Ali", "Province of Punjab"]. */
export function titleSides(title: string): string[] {
    const sides = title.split(/\s+(?:v\.?|vs\.?|versus)\s+/i).map((s) => s.trim()).filter(Boolean);
    return sides.length === 2 ? sides : [];
}

export interface ChamberData {
    clients: Array<{ full_name: string; phone: string | null }>;
    cases: Array<{ id: string; case_number: string | null; title: string; client_name: string | null; client_phone: string | null }>;
    parties: Array<{ case_id: string; name: string; role: 'opposing' | 'other' }>;
    leads: Array<{ name: string; phone: string | null }>;
}

/** Every party the chamber knows about, with which side of a matter they are on. */
export function buildRecords(data: ChamberData): PartyRecord[] {
    const records: PartyRecord[] = [];
    const caseRef = new Map(data.cases.map((c) => [c.id, [c.case_number, c.title].filter(Boolean).join(' · ')]));

    for (const c of data.clients) records.push({ name: c.full_name, phone: c.phone, role: 'client', source: 'Client list' });
    for (const c of data.cases) {
        const ref = caseRef.get(c.id)!;
        if (c.client_name) records.push({ name: c.client_name, phone: c.client_phone, role: 'client', caseId: c.id, caseRef: ref, source: 'Case client' });
        // The side of the title that isn't our client is the other side.
        const sides = titleSides(c.title);
        const ours = c.client_name ? sides.findIndex((s) => matchName(s, c.client_name!) && matchName(s, c.client_name!) !== 'possible') : -1;
        sides.forEach((side, i) => {
            if (i === ours) return;
            records.push({ name: side, role: ours === -1 ? 'title' : 'opposing', caseId: c.id, caseRef: ref, source: 'Case title' });
        });
    }
    for (const p of data.parties) records.push({ name: p.name, role: p.role, caseId: p.case_id, caseRef: caseRef.get(p.case_id), source: p.role === 'opposing' ? 'Opposing party' : 'Party' });
    for (const l of data.leads) records.push({ name: l.name, phone: l.phone, role: 'lead', source: 'Lead' });
    return records;
}

function classify(searched: 'client' | 'opposing', role: PartyRole): { severity: Severity; reason: string } {
    if (searched === 'client' && role === 'opposing') return { severity: 'conflict', reason: 'The chamber acts against this person' };
    if (searched === 'opposing' && role === 'client') return { severity: 'conflict', reason: 'This person is the chamber’s client' };
    if (role === 'title') return { severity: 'review', reason: 'Named in a case title; check which side' };
    if (searched === 'opposing' && role === 'lead') return { severity: 'review', reason: 'Approached the chamber as a prospective client' };
    if (searched === 'client' && role === 'client') return { severity: 'info', reason: 'Existing client' };
    if (searched === 'client' && role === 'lead') return { severity: 'info', reason: 'Already a lead' };
    return { severity: 'info', reason: role === 'opposing' ? 'Also an opposing party in another matter' : 'Named as a party' };
}

const SEVERITY_ORDER: Record<Severity, number> = { conflict: 0, review: 1, info: 2 };
const STRENGTH_ORDER: Record<Strength, number> = { exact: 0, likely: 1, possible: 2 };

export function runConflictCheck(input: { clientName: string; clientPhone?: string | null; opposing: string[] }, records: PartyRecord[]): ConflictHit[] {
    const searches: Array<{ searched: 'client' | 'opposing'; name: string; phone?: string | null }> = [
        { searched: 'client', name: input.clientName, phone: input.clientPhone },
        ...input.opposing.filter((n) => n.trim()).map((name) => ({ searched: 'opposing' as const, name })),
    ];
    const hits: ConflictHit[] = [];
    const seen = new Set<string>();

    for (const s of searches) {
        const phone = normalizePkPhone(s.phone);
        for (const record of records) {
            const byPhone = phone && normalizePkPhone(record.phone) === phone;
            const strength: Strength | null = byPhone ? 'exact' : matchName(s.name, record.name);
            if (!strength) continue;
            let { severity, reason } = classify(s.searched, record.role);
            // A single-name match is a lead to check, not a finding.
            if (strength === 'possible' && severity === 'conflict') severity = 'review';
            if (byPhone) reason += ' (same phone number)';
            const key = `${s.searched}|${s.name}|${record.name}|${record.role}|${record.caseId ?? ''}`;
            if (seen.has(key)) continue;
            seen.add(key);
            hits.push({ searched: s.searched, searchedName: s.name.trim(), record, strength, severity, reason });
        }
    }
    return hits.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || STRENGTH_ORDER[a.strength] - STRENGTH_ORDER[b.strength]);
}
