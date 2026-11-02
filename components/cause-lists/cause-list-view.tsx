'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, EyeOff, Link2, Loader2, RefreshCw, ScrollText } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { DashAlert, DashField, DashPage, DashToast, EmptyState, PageHeader, Panel } from '@/components/dashboard/ui';
import { DashSelect } from '@/components/hearings/hearing-dialogs';
import { pkToday } from '@/lib/deadlines/limitation';
import { LHC_SEATS, LIST_TYPE_LABEL, type LhcSeat } from '@/lib/cause-lists/lhc';
import {
    getCauseListEntries,
    getCourtTracking,
    getOwnLhcCode,
    ignoreCauseListEntry,
    linkCauseListEntry,
    saveCourtTracking,
    saveOwnLhcCode,
    syncCauseListNow,
    type CauseListEntry,
    type CourtTracking,
} from '@/lib/supabase/cause-lists';

const longDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
const STATUS_CHIP = { ok: 'l-chip l-chip--lime', partial: 'l-chip l-chip--violet', failed: 'l-chip l-chip--danger' } as const;

/** Admin-only: turn tracking on, pick the seat, the admin's own LHC code, sync health. */
function TrackingSettings({ chamberId, userId, tracking, onChange }: { chamberId: string; userId: string; tracking: CourtTracking | null; onChange: () => void }) {
    const [enabled, setEnabled] = useState(false);
    const [seat, setSeat] = useState<LhcSeat>('All');
    const [code, setCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        setEnabled(tracking?.lhc_enabled ?? false);
        setSeat(tracking?.lhc_location ?? 'All');
    }, [tracking]);
    useEffect(() => {
        getOwnLhcCode(userId).then(setCode);
    }, [userId]);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const [{ error: trackingError }, { error: codeError }] = await Promise.all([saveCourtTracking(chamberId, { lhc_enabled: enabled, lhc_location: seat }), saveOwnLhcCode(userId, code)]);
        setSaving(false);
        if (trackingError || codeError) return setError(codeError ? 'The LHC code can only use letters, numbers, - and /.' : trackingError!.message);
        setNote('Saved.');
        onChange();
    };

    const sync = async () => {
        setSyncing(true);
        setError('');
        const { result, error } = await syncCauseListNow();
        setSyncing(false);
        if (error) return setError(error);
        setNote(result!.message);
        onChange();
    };

    return (
        <Panel title="LHC tracking">
            <form onSubmit={save} className="l-form">
                {error && <DashAlert>{error}</DashAlert>}
                <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                    Check the Lahore High Court cause list every evening (18:00 PKT)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DashSelect label="Seat" value={seat} onChange={(v) => setSeat(v as LhcSeat)}>
                        {(Object.keys(LHC_SEATS) as LhcSeat[]).map((s) => (
                            <option key={s} value={s}>
                                {LHC_SEATS[s]}
                            </option>
                        ))}
                    </DashSelect>
                    <DashField label="Your LHC lawyer code (if you appear)" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Leave blank if you don't" />
                </div>
                <p className="m-0 text-xs l-muted">
                    Each advocate is looked up by their LHC lawyer code (set it on the team page), or by their mobile number when there is no code.
                </p>
                {tracking?.last_sync_at && (
                    <p className="m-0 text-sm inline-flex flex-wrap items-center gap-2" role="status">
                        {tracking.last_sync_status && <span className={STATUS_CHIP[tracking.last_sync_status]}>{tracking.last_sync_status === 'ok' ? 'Synced' : tracking.last_sync_status === 'partial' ? 'Partly synced' : 'Sync failed'}</span>}
                        <span className="l-muted">{new Date(tracking.last_sync_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <span>{tracking.last_sync_message}</span>
                    </p>
                )}
                <div className="l-dialog-actions">
                    <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={sync} disabled={syncing || !tracking?.lhc_enabled}>
                        {syncing ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <RefreshCw aria-hidden="true" className="w-4 h-4" />} {syncing ? 'Checking LHC…' : 'Sync now'}
                    </button>
                    <button type="submit" className="l-btn l-btn--primary l-btn--compact" disabled={saving}>
                        {saving && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />} Save
                    </button>
                </div>
            </form>
            {note && <DashToast onClose={() => setNote('')}>{note}</DashToast>}
        </Panel>
    );
}

function ListingLine({ e }: { e: CauseListEntry }) {
    return (
        <span className="text-sm l-muted inline-flex flex-wrap gap-x-3 gap-y-1">
            <span>{longDay(e.list_date)}</span>
            {e.judge && <span>{e.judge}</span>}
            {e.court_room && <span>{e.court_room}</span>}
            {e.seq && <span>Sr. {e.seq}{e.connected ? ' (with)' : ''}</span>}
            <span>{LIST_TYPE_LABEL[e.list_type]}</span>
            {e.remarks && <span>{e.remarks}</span>}
            {e.lawyer_name && <span>{e.lawyer_name}</span>}
        </span>
    );
}

/** Listings that need a person: link to a case (and put on the docket) or ignore. */
function ReviewRow({ e, cases, onDone }: { e: CauseListEntry; cases: Array<{ id: string; label: string }>; onDone: () => void }) {
    const [caseId, setCaseId] = useState(e.case_id ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const act = async (fn: () => Promise<{ error: unknown }>) => {
        setBusy(true);
        setError('');
        const { error } = await fn();
        setBusy(false);
        if (error) return setError((error as { message?: string }).message || 'Could not save.');
        onDone();
    };

    return (
        <li>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-semibold">
                        {e.case_no} · {e.title}
                    </span>
                    <ListingLine e={e} />
                    {e.match_note && <span className="text-sm">{e.match_note}</span>}
                </div>
                {error && <DashAlert>{error}</DashAlert>}
                <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[220px]">
                        <DashSelect label="Case" value={caseId} onChange={setCaseId}>
                            <option value="">Choose a case…</option>
                            {cases.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.label}
                                </option>
                            ))}
                        </DashSelect>
                    </div>
                    <button type="button" className="l-btn l-btn--primary l-btn--compact" disabled={busy || !caseId} onClick={() => act(() => linkCauseListEntry(e, caseId))}>
                        <Link2 aria-hidden="true" className="w-4 h-4" /> Link & add to docket
                    </button>
                    <button type="button" className="l-btn l-btn--outline l-btn--compact" disabled={busy} onClick={() => act(() => ignoreCauseListEntry(e.id))}>
                        <EyeOff aria-hidden="true" className="w-4 h-4" /> Ignore
                    </button>
                </div>
            </div>
        </li>
    );
}

/** The chamber's LHC listings for the week: what is on the docket, and what needs review. */
export function CauseListView({ canManage, casePath }: { canManage: boolean; casePath: (caseId: string) => string }) {
    const { user } = useAuth();
    const chamberId = user?.chamber_id;
    const [tracking, setTracking] = useState<CourtTracking | null>(null);
    const [entries, setEntries] = useState<CauseListEntry[] | null>(null);
    const [cases, setCases] = useState<Array<{ id: string; label: string }>>([]);

    const load = async () => {
        if (!chamberId) return;
        const [{ tracking }, { entries }, { data: caseRows }] = await Promise.all([
            getCourtTracking(chamberId),
            getCauseListEntries(chamberId, pkToday()),
            supabase.from('cases').select('id, case_number, title').eq('chamber_id', chamberId).is('deleted_at', null).order('created_at', { ascending: false }),
        ]);
        setTracking(tracking);
        setEntries(entries);
        setCases((caseRows ?? []).map((c: any) => ({ id: c.id, label: [c.case_number, c.title].filter(Boolean).join(' · ') })));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chamberId]);

    const review = useMemo(() => entries?.filter((e) => e.match_status === 'suggested' || e.match_status === 'unmatched') ?? [], [entries]);
    const listed = useMemo(() => entries?.filter((e) => (e.match_status === 'auto' || e.match_status === 'linked') && e.case_id) ?? [], [entries]);
    const byDay = useMemo(() => {
        const days = new Map<string, CauseListEntry[]>();
        for (const e of listed) days.set(e.list_date, [...(days.get(e.list_date) ?? []), e]);
        return [...days.entries()];
    }, [listed]);

    return (
        <DashPage>
            <PageHeader
                eyebrow="Lahore High Court"
                title="Cause List"
                description="Your cases on the LHC cause list this week, checked every evening. Confident matches go straight onto the docket; the rest wait here for you."
            />

            {canManage && chamberId && user && <TrackingSettings chamberId={chamberId} userId={user.id} tracking={tracking} onChange={load} />}
            {!canManage && tracking?.last_sync_status === 'failed' && <DashAlert>The last LHC check failed: {tracking.last_sync_message}</DashAlert>}

            <Panel title={`To review${review.length ? ` (${review.length})` : ''}`} flush>
                {entries === null ? (
                    <p className="m-0 p-5 text-sm l-muted">Loading...</p>
                ) : review.length === 0 ? (
                    <EmptyState icon={CheckCircle2} title="Nothing to review" hint="Listings that don't clearly match one of your cases appear here." />
                ) : (
                    <ul className="l-rows">
                        {review.map((e) => (
                            <ReviewRow key={e.id} e={e} cases={cases} onDone={load} />
                        ))}
                    </ul>
                )}
            </Panel>

            {entries !== null && byDay.length === 0 ? (
                <Panel title="On the docket">
                    <EmptyState
                        icon={ScrollText}
                        title={tracking?.lhc_enabled ? 'No listings this week yet' : 'LHC tracking is off'}
                        hint={tracking?.lhc_enabled ? 'The list is checked every evening at 18:00 PKT.' : canManage ? 'Turn it on above.' : 'Ask your chamber admin to turn it on.'}
                    />
                </Panel>
            ) : (
                byDay.map(([day, rows]) => (
                    <Panel key={day} title={longDay(day)} flush>
                        <ul className="l-rows">
                            {rows.map((e) => (
                                <li key={e.id}>
                                    <Link href={casePath(e.case_id!)} className="flex flex-col gap-1 min-w-0">
                                        <span className="font-semibold">{[e.case?.case_number, e.case?.title].filter(Boolean).join(' · ') || e.title}</span>
                                        <ListingLine e={e} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                ))
            )}
        </DashPage>
    );
}
