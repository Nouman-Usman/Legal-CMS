'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlarmClock, Check, Plus, RotateCcw, X } from 'lucide-react';
import { EmptyState, Panel } from '@/components/dashboard/ui';
import { daysBetween, dueBucket, pkToday, type DueBucket } from '@/lib/deadlines/limitation';
import { getCaseDeadlines, getOpenDeadlines, setDeadlineStatus, type Deadline } from '@/lib/supabase/deadlines';
import { AddDeadlineDialog, KIND_LABEL } from './deadline-dialog';

const CHIP: Record<DueBucket, string> = { overdue: 'l-chip l-chip--danger', today: 'l-chip l-chip--lime', week: 'l-chip l-chip--violet', later: 'l-chip' };

function dueText(due: string, today: string) {
    const d = daysBetween(today, due);
    if (d < 0) return `${-d} day${d === -1 ? '' : 's'} overdue`;
    if (d === 0) return 'Due today';
    if (d === 1) return 'Due tomorrow';
    return `In ${d} days`;
}

function DeadlineRow({ d, today, caseHref, onStatus }: { d: Deadline; today: string; caseHref?: string; onStatus: (status: Deadline['status']) => void }) {
    const open = d.status === 'open';
    const caseRef = d.case ? [d.case.case_number, d.case.title].filter(Boolean).join(' · ') : null;
    return (
        <li style={open ? undefined : { opacity: 0.55 }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-semibold" style={d.status === 'cancelled' ? { textDecoration: 'line-through' } : undefined}>
                        {d.title}
                    </span>
                    <span className="text-sm l-muted inline-flex flex-wrap gap-x-3 gap-y-1">
                        <span>{new Date(`${d.due_date}T00:00:00`).toDateString()}</span>
                        <span>{KIND_LABEL[d.kind]}</span>
                        <span>{d.assignee?.full_name ?? 'Unassigned'}</span>
                        {d.limitation_article && <span>{d.limitation_article}</span>}
                        {caseRef &&
                            (caseHref ? (
                                <Link href={caseHref} className="l-link">
                                    {caseRef}
                                </Link>
                            ) : (
                                <span>{caseRef}</span>
                            ))}
                    </span>
                    {d.notes && <span className="text-sm">{d.notes}</span>}
                </div>
                <div className="flex items-center gap-2">
                    {open ? (
                        <>
                            <span className={CHIP[dueBucket(d.due_date, today)]}>{dueText(d.due_date, today)}</span>
                            <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => onStatus('done')}>
                                <Check aria-hidden="true" className="w-4 h-4" /> Done
                            </button>
                            <button type="button" className="l-icon-btn" aria-label={`Cancel deadline: ${d.title}`} onClick={() => onStatus('cancelled')}>
                                <X aria-hidden="true" className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="l-chip">{d.status === 'done' ? 'Done' : 'Cancelled'}</span>
                            <button type="button" className="l-icon-btn" aria-label={`Reopen deadline: ${d.title}`} onClick={() => onStatus('open')}>
                                <RotateCcw aria-hidden="true" className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </li>
    );
}

/** One case's deadlines (open first, then closed). */
export function CaseDeadlines({ caseId, chamberId, onChange }: { caseId: string; chamberId?: string; onChange?: (deadlines: Deadline[]) => void }) {
    const [deadlines, setDeadlines] = useState<Deadline[] | null>(null);
    const [adding, setAdding] = useState(false);
    const today = pkToday();

    const load = async () => {
        const { deadlines } = await getCaseDeadlines(caseId);
        setDeadlines(deadlines);
        onChange?.(deadlines);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseId]);

    const sorted = deadlines ? [...deadlines.filter((d) => d.status === 'open'), ...deadlines.filter((d) => d.status !== 'open')] : null;

    return (
        <Panel
            title="Deadlines"
            flush
            action={
                <button type="button" className="l-btn l-btn--primary l-btn--compact" onClick={() => setAdding(true)}>
                    <Plus aria-hidden="true" className="w-4 h-4" /> Add deadline
                </button>
            }
        >
            {sorted === null ? (
                <p className="m-0 p-5 text-sm l-muted">Loading...</p>
            ) : sorted.length === 0 ? (
                <EmptyState icon={AlarmClock} title="No deadlines" hint="Add filing dates, replies due and appeal limitation; the responsible lawyer gets an email 3 days and 1 day before." />
            ) : (
                <ol className="l-rows">
                    {sorted.map((d) => (
                        <DeadlineRow
                            key={d.id}
                            d={d}
                            today={today}
                            onStatus={async (status) => {
                                await setDeadlineStatus(d.id, status);
                                load();
                            }}
                        />
                    ))}
                </ol>
            )}
            <AddDeadlineDialog
                open={adding}
                caseId={caseId}
                chamberId={chamberId}
                onClose={() => setAdding(false)}
                onSaved={() => {
                    setAdding(false);
                    load();
                }}
            />
        </Panel>
    );
}

/** Chamber-wide open deadlines: overdue first. `days` limits how far ahead to look. */
export function ChamberDeadlines({
    chamberId,
    days,
    limit,
    title = 'Deadlines',
    allHref,
    casePath = (id) => `/dashboard/chambers-admin/cases/${id}`,
}: {
    chamberId?: string;
    days?: number;
    limit?: number;
    title?: string;
    allHref?: string;
    casePath?: (caseId: string) => string;
}) {
    const [deadlines, setDeadlines] = useState<Deadline[] | null>(null);
    const today = pkToday();

    const load = async () => {
        if (!chamberId) return;
        const until = days == null ? undefined : new Date(Date.parse(`${today}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
        const { deadlines } = await getOpenDeadlines(chamberId, until);
        setDeadlines(deadlines);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chamberId, days]);

    const shown = limit ? deadlines?.slice(0, limit) : deadlines;
    const overdue = deadlines?.filter((d) => dueBucket(d.due_date, today) === 'overdue').length ?? 0;

    return (
        <Panel
            title={title}
            flush
            action={
                allHref ? (
                    <Link href={allHref} className="l-link text-sm">
                        All deadlines
                    </Link>
                ) : undefined
            }
        >
            {deadlines === null ? (
                <p className="m-0 p-5 text-sm l-muted">Loading...</p>
            ) : deadlines.length === 0 ? (
                <EmptyState icon={AlarmClock} title="Nothing due" />
            ) : (
                <>
                    {overdue > 0 && <p className="m-0 px-5 pt-4 text-sm text-destructive">{overdue} overdue</p>}
                    <ol className="l-rows">
                        {shown!.map((d) => (
                            <DeadlineRow
                                key={d.id}
                                d={d}
                                today={today}
                                caseHref={casePath(d.case_id)}
                                onStatus={async (status) => {
                                    await setDeadlineStatus(d.id, status);
                                    load();
                                }}
                            />
                        ))}
                    </ol>
                    {limit && deadlines.length > limit && <p className="m-0 px-5 pb-4 text-sm l-muted">+ {deadlines.length - limit} more</p>}
                </>
            )}
        </Panel>
    );
}
