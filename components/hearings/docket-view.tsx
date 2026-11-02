'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, Check, ChevronLeft, ChevronRight, Copy, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { DashAlert, DashPage, EmptyState, PageHeader, Panel, StatusChip } from '@/components/dashboard/ui';
import { docketToWhatsApp, findClashes, groupByCourt, type DocketRow } from '@/lib/hearings/docket';
import { getChamberLawyers, getDocket, reassignHearing, type Hearing } from '@/lib/supabase/hearings';
import { RecordOutcomeDialog } from './hearing-dialogs';
import { NotifyClientDialog } from './notify-client-dialog';

const shift = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
const toInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/**
 * The daily docket. Chamber admins see the whole chamber (filterable by lawyer) and
 * can reassign; lawyers see only their own appearances.
 */
export function DocketView({ scope, casePath }: { scope: 'chamber' | 'lawyer'; casePath: (caseId: string) => string }) {
    const { user } = useAuth();
    const [day, setDay] = useState(() => shift(new Date(), 0));
    const [rows, setRows] = useState<DocketRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lawyers, setLawyers] = useState<Array<{ id: string; name: string }>>([]);
    const [lawyerFilter, setLawyerFilter] = useState('');
    const [recording, setRecording] = useState<Hearing | null>(null);
    const [copied, setCopied] = useState(false);
    const [notifying, setNotifying] = useState<Hearing | null>(null);

    const chamberId = user?.chamber_id;
    const lawyerId = scope === 'lawyer' ? user?.id : lawyerFilter || undefined;

    const load = async () => {
        if (!chamberId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const { rows, error } = await getDocket(chamberId, day, lawyerId);
        setRows(rows);
        setError(error ? 'Could not load the docket.' : '');
        setLoading(false);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chamberId, day, lawyerId]);

    useEffect(() => {
        if (scope === 'chamber' && chamberId) getChamberLawyers(chamberId).then(({ lawyers }) => setLawyers(lawyers));
    }, [scope, chamberId]);

    const clashes = useMemo(() => findClashes(rows), [rows]);
    const groups = useMemo(() => groupByCourt(rows), [rows]);
    const today = shift(new Date(), 0);

    const copyForWhatsApp = async () => {
        await navigator.clipboard.writeText(docketToWhatsApp(rows, day));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const reassign = async (hearingId: string, newLawyer: string) => {
        await reassignHearing(hearingId, newLawyer || null);
        load();
    };

    const openOutcome = (row: DocketRow) =>
        setRecording({
            id: row.id,
            case_id: row.caseId,
            hearing_date: day.toISOString(),
            court_name: row.court,
            judge_name: null,
            purpose: row.purpose,
            status: row.status,
            proceedings: null,
            cause_list_no: row.causeListNo,
            appearing_lawyer_id: row.lawyerId,
        });

    return (
        <DashPage>
            <PageHeader
                eyebrow={scope === 'chamber' ? 'Chamber' : 'My appearances'}
                title="Daily Docket"
                description={day.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                actions={
                    <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={copyForWhatsApp} disabled={loading}>
                        {copied ? <Check aria-hidden="true" className="w-4 h-4" /> : <Copy aria-hidden="true" className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy for WhatsApp'}
                    </button>
                }
            />

            <div className="l-toolbar">
                <button type="button" className="l-icon-btn" aria-label="Previous day" onClick={() => setDay(shift(day, -1))}>
                    <ChevronLeft aria-hidden="true" className="w-4 h-4" />
                </button>
                <button type="button" className="l-filter" aria-pressed={isSameDay(day, today)} onClick={() => setDay(today)}>
                    Today
                </button>
                <button type="button" className="l-filter" aria-pressed={isSameDay(day, shift(today, 1))} onClick={() => setDay(shift(today, 1))}>
                    Tomorrow
                </button>
                <button type="button" className="l-icon-btn" aria-label="Next day" onClick={() => setDay(shift(day, 1))}>
                    <ChevronRight aria-hidden="true" className="w-4 h-4" />
                </button>
                <label className="l-search" style={{ flex: '0 1 200px' }}>
                    <span className="sr-only">Pick a date</span>
                    <input
                        type="date"
                        className="l-dash-input"
                        value={toInput(day)}
                        onChange={(e) => {
                            if (!e.target.value) return;
                            const [y, m, d] = e.target.value.split('-').map(Number);
                            setDay(new Date(y, m - 1, d));
                        }}
                    />
                </label>
                {scope === 'chamber' && (
                    <label className="l-search" style={{ flex: '0 1 220px' }}>
                        <span className="sr-only">Filter by lawyer</span>
                        <select className="l-dash-input" value={lawyerFilter} onChange={(e) => setLawyerFilter(e.target.value)}>
                            <option value="">All lawyers</option>
                            {lawyers.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {error && <DashAlert>{error}</DashAlert>}
            {clashes.size > 0 && (
                <p className="l-dash-alert" role="status">
                    <AlertTriangle aria-hidden="true" className="w-4 h-4 shrink-0" />
                    <span>A lawyer is listed in more than one court today. Reassign one of the highlighted hearings.</span>
                </p>
            )}

            {loading ? (
                <div className="l-empty" role="status">
                    <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin" />
                    <span className="l-label">Loading docket...</span>
                </div>
            ) : !chamberId ? (
                <EmptyState icon={CalendarDays} title="No chamber found" hint="Your account is not linked to a chamber yet." />
            ) : rows.length === 0 ? (
                <Panel>
                    <EmptyState icon={CalendarDays} title="No hearings this day" hint="[DRAFT] Hearings appear here once dates are scheduled on a case." />
                </Panel>
            ) : (
                groups.map((group) => (
                    <Panel key={group.court} title={group.court} flush action={<span className="l-label">{group.items.length} {group.items.length === 1 ? 'matter' : 'matters'}</span>}>
                        <ul className="l-rows">
                            {group.items.map((row) => (
                                <li key={row.id} data-clash={clashes.has(row.id) || undefined} className="l-docket-row">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <span className="l-docket-sr" aria-label={row.causeListNo ? `Serial ${row.causeListNo}` : 'No serial'}>
                                                {row.causeListNo ?? '–'}
                                            </span>
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <Link href={casePath(row.caseId)} className="font-semibold hover:underline underline-offset-4">
                                                    {[row.caseNumber, row.caseTitle].filter(Boolean).join(' · ')}
                                                </Link>
                                                <span className="text-sm l-muted">
                                                    {row.purpose ? `For: ${row.purpose}` : 'Purpose not set'}
                                                    {scope === 'lawyer' || !row.lawyerName ? '' : ` · ${row.lawyerName}`}
                                                    {clashes.has(row.id) && <strong className="text-destructive"> · clash</strong>}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusChip status={row.status} />
                                            {scope === 'chamber' && (
                                                <label>
                                                    <span className="sr-only">Appearing lawyer for {row.caseTitle}</span>
                                                    <select className="l-dash-input" style={{ width: 'auto' }} value={row.lawyerId ?? ''} onChange={(e) => reassign(row.id, e.target.value)}>
                                                        <option value="">Unassigned</option>
                                                        {lawyers.map((l) => (
                                                            <option key={l.id} value={l.id}>
                                                                {l.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            )}
                                            {row.status === 'scheduled' && (
                                                <button type="button" className="l-btn l-btn--primary l-btn--compact" onClick={() => openOutcome(row)}>
                                                    Record outcome
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                ))
            )}

            <RecordOutcomeDialog
                hearing={recording}
                onClose={() => setRecording(null)}
                onSaved={(saved) => {
                    setRecording(null);
                    load();
                    setNotifying(saved);
                }}
            />
            <NotifyClientDialog hearing={notifying} onClose={() => setNotifying(null)} />
        </DashPage>
    );
}
