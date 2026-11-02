'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, SearchCheck, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { DashAlert, DashField, DashPage, DashToast, EmptyState, PageHeader, Panel } from '@/components/dashboard/ui';
import { CaseFormModal } from '@/components/shared/case-form-modal';
import { buildRecords, runConflictCheck, type ConflictHit, type Severity } from '@/lib/intake/conflicts';
import { getChamberParties, getRecentConflictChecks, saveConflictCheck, type ConflictCheckRow, type ConflictOutcome } from '@/lib/supabase/intake';

const CHIP: Record<Severity, string> = { conflict: 'l-chip l-chip--danger', review: 'l-chip l-chip--violet', info: 'l-chip' };
const SEVERITY_LABEL: Record<Severity, string> = { conflict: 'Conflict', review: 'Check', info: 'Note' };
const OUTCOME_LABEL: Record<ConflictOutcome, string> = { clear: 'Cleared', conflict: 'Declined: conflict', waived: 'Waived' };

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

export default function IntakePage() {
    const { user } = useAuth();
    const router = useRouter();
    const chamberId = user?.chamber_id;

    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [opposingText, setOpposingText] = useState('');
    const [matter, setMatter] = useState('');
    const [notes, setNotes] = useState('');
    const [hits, setHits] = useState<ConflictHit[] | null>(null);
    const [searchedCount, setSearchedCount] = useState(0);
    const [running, setRunning] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [recent, setRecent] = useState<ConflictCheckRow[]>([]);
    const [openCase, setOpenCase] = useState<{ client_name: string; client_phone?: string; description?: string; opposing: string[]; conflict_check_id: string } | null>(null);
    const opposingId = useId();
    const notesId = useId();

    const loadRecent = () => chamberId && getRecentConflictChecks(chamberId).then(({ checks }) => setRecent(checks));
    useEffect(() => {
        loadRecent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chamberId]);

    // Any change to what was searched makes the old results stale.
    useEffect(() => setHits(null), [clientName, clientPhone, opposingText]);

    const counts = useMemo(
        () => ({
            conflict: hits?.filter((h) => h.severity === 'conflict').length ?? 0,
            review: hits?.filter((h) => h.severity === 'review').length ?? 0,
        }),
        [hits],
    );

    const run = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chamberId || !clientName.trim()) return;
        setRunning(true);
        setError('');
        const { data, error } = await getChamberParties(chamberId);
        setRunning(false);
        if (error) return setError('Could not load the chamber’s parties, so the check did not run.');
        const records = buildRecords(data);
        setSearchedCount(records.length);
        setHits(runConflictCheck({ clientName, clientPhone, opposing: lines(opposingText) }, records));
    };

    const decide = async (outcome: ConflictOutcome) => {
        if (!chamberId || !hits) return;
        if (outcome === 'waived' && !notes.trim()) return setError('Record why the chamber is going ahead (e.g. written consent of both clients).');
        setSaving(true);
        setError('');
        const { id, error } = await saveConflictCheck({
            chamber_id: chamberId,
            client_name: clientName,
            client_phone: clientPhone,
            opposing_names: lines(opposingText),
            matter,
            hits,
            outcome,
            notes,
        });
        setSaving(false);
        if (error || !id) return setError((error as { message?: string })?.message || 'Could not save the check.');
        loadRecent();
        // One decision per check: a second press must run a new check.
        setHits(null);
        setNotes('');
        if (outcome === 'conflict') {
            setToast(`Recorded: ${clientName.trim()} declined because of a conflict.`);
            setClientName('');
            setClientPhone('');
            setOpposingText('');
            setMatter('');
            return;
        }
        setOpenCase({ client_name: clientName.trim(), client_phone: clientPhone.trim(), description: matter.trim(), opposing: lines(opposingText), conflict_check_id: id });
    };

    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <DashPage>
                <PageHeader
                    eyebrow="New matter"
                    title="Intake"
                    description="Check the new client and the other side against every client, case, party and lead in the chamber before taking the matter."
                />

                <Panel title="Who is it?">
                    <form onSubmit={run} className="l-form">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DashField label="Client name *" placeholder="e.g. Muhammad Bashir" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                            <DashField label="Client phone" type="tel" inputMode="tel" placeholder="+92 300 1234567" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                        </div>
                        <div className="l-dash-field">
                            <label htmlFor={opposingId} className="l-label">
                                Opposing parties (one per line)
                            </label>
                            <textarea
                                id={opposingId}
                                className="l-dash-input"
                                rows={3}
                                placeholder={'e.g. Kamran Akmal\nZubair Textiles (Pvt) Ltd'}
                                value={opposingText}
                                onChange={(e) => setOpposingText(e.target.value)}
                            />
                        </div>
                        <DashField label="Matter" placeholder="e.g. Recovery suit over unpaid invoices" value={matter} onChange={(e) => setMatter(e.target.value)} />
                        <div className="l-dialog-actions">
                            <button type="submit" className="l-btn l-btn--primary l-btn--compact" disabled={running || !clientName.trim()}>
                                {running ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <SearchCheck aria-hidden="true" className="w-4 h-4" />} Run conflict check
                            </button>
                        </div>
                    </form>
                </Panel>

                {hits && (
                    <Panel title="Conflict check" flush>
                        <p className="m-0 px-5 pt-4 text-sm" role="status">
                            {counts.conflict > 0 ? (
                                <span className="text-destructive font-semibold">
                                    {counts.conflict} conflict{counts.conflict === 1 ? '' : 's'}
                                    {counts.review ? `, ${counts.review} to check` : ''}.
                                </span>
                            ) : counts.review > 0 ? (
                                <span className="font-semibold">No conflicts; {counts.review} possible match{counts.review === 1 ? '' : 'es'} to check.</span>
                            ) : (
                                <span className="font-semibold">No conflicts.</span>
                            )}{' '}
                            <span className="l-muted">Searched {searchedCount} names across clients, cases, parties and leads.</span>
                        </p>
                        {hits.length === 0 ? (
                            <EmptyState icon={ShieldCheck} title="No matches" hint="Nobody in the chamber’s records matches these names or this phone number." />
                        ) : (
                            <ul className="l-rows">
                                {hits.map((h, i) => (
                                    <li key={i}>
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <span className="font-semibold">
                                                    {h.searchedName} <span className="l-muted font-normal">matches</span> {h.record.name}
                                                </span>
                                                <span className="text-sm l-muted inline-flex flex-wrap gap-x-3 gap-y-1">
                                                    <span>{h.reason}</span>
                                                    <span>{h.record.source}</span>
                                                    <span>{h.strength} match</span>
                                                    {h.record.caseId && (
                                                        <Link href={`/dashboard/chambers-admin/cases/${h.record.caseId}`} className="l-link" target="_blank">
                                                            {h.record.caseRef}
                                                        </Link>
                                                    )}
                                                </span>
                                            </div>
                                            <span className={CHIP[h.severity]}>{SEVERITY_LABEL[h.severity]}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="l-form px-5 pb-5 pt-4">
                            {error && <DashAlert>{error}</DashAlert>}
                            <div className="l-dash-field">
                                <label htmlFor={notesId} className="l-label">
                                    {counts.conflict ? 'Decision notes (required to go ahead)' : 'Decision notes'}
                                </label>
                                <textarea
                                    id={notesId}
                                    className="l-dash-input"
                                    rows={2}
                                    placeholder={counts.conflict ? 'e.g. Different Kamran Akmal (CNIC checked), or written consent of both clients on file' : 'Optional'}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            <div className="l-dialog-actions">
                                <button type="button" className="l-btn l-btn--outline l-btn--compact" disabled={saving} onClick={() => decide('conflict')}>
                                    <ShieldAlert aria-hidden="true" className="w-4 h-4" /> Decline matter
                                </button>
                                {counts.conflict ? (
                                    <button type="button" className="l-btn l-btn--primary l-btn--compact" disabled={saving} onClick={() => decide('waived')}>
                                        {saving && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />} Go ahead with waiver
                                    </button>
                                ) : (
                                    <button type="button" className="l-btn l-btn--primary l-btn--compact" disabled={saving} onClick={() => decide('clear')}>
                                        {saving && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />} Clear: open case
                                    </button>
                                )}
                            </div>
                        </div>
                    </Panel>
                )}

                <Panel title="Recent checks" flush>
                    {recent.length === 0 ? (
                        <p className="m-0 p-5 text-sm l-muted">No conflict checks yet.</p>
                    ) : (
                        <ul className="l-rows">
                            {recent.map((c) => (
                                <li key={c.id}>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className="font-semibold">
                                                {c.client_name}
                                                {c.opposing_names.length ? <span className="l-muted font-normal"> v. {c.opposing_names.join(', ')}</span> : null}
                                            </span>
                                            <span className="text-sm l-muted inline-flex flex-wrap gap-x-3 gap-y-1">
                                                <span>{new Date(c.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                <span>by {c.checker?.full_name ?? 'Unknown'}</span>
                                                <span>
                                                    {c.conflict_count} conflict{c.conflict_count === 1 ? '' : 's'}, {c.review_count} to check
                                                </span>
                                                {c.notes && <span>“{c.notes}”</span>}
                                            </span>
                                        </div>
                                        <span className={c.outcome === 'conflict' ? CHIP.conflict : c.outcome === 'waived' ? CHIP.review : 'l-chip l-chip--lime'}>{OUTCOME_LABEL[c.outcome]}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <CaseFormModal isOpen={!!openCase} prefill={openCase ?? undefined} onClose={() => setOpenCase(null)} onSuccess={() => router.push('/dashboard/chambers-admin/cases')} />
                {toast && <DashToast onClose={() => setToast('')}>{toast}</DashToast>}
            </DashPage>
        </ProtectedRoute>
    );
}
