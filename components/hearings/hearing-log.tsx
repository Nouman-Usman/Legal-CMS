'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, CheckCheck, Gavel, Loader2, MessageCircle, Plus } from 'lucide-react';
import { EmptyState, Panel, StatusChip } from '@/components/dashboard/ui';
import { getCaseHearings, type Hearing } from '@/lib/supabase/hearings';
import { RecordOutcomeDialog, ScheduleHearingDialog } from './hearing-dialogs';
import { NotifyClientDialog } from './notify-client-dialog';

const STATUS_LABEL: Record<Hearing['status'], string> = {
    scheduled: 'Scheduled',
    held: 'Heard',
    adjourned: 'Adjourned',
    decided: 'Decided',
    not_reached: 'Not reached',
};

/** The case's hearing history: every date, what happened, and the next date. */
export function HearingLog({ caseId, chamberId, court }: { caseId: string; chamberId?: string; court?: string | null }) {
    const [hearings, setHearings] = useState<Hearing[]>([]);
    const [loading, setLoading] = useState(true);
    const [recording, setRecording] = useState<Hearing | null>(null);
    const [scheduling, setScheduling] = useState(false);
    const [notifying, setNotifying] = useState<Hearing | null>(null);

    const load = async () => {
        const { hearings } = await getCaseHearings(caseId);
        setHearings(hearings);
        setLoading(false);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseId]);

    const upcoming = hearings.filter((h) => h.status === 'scheduled');

    return (
        <Panel
            title="Hearing log"
            flush
            action={
                <button type="button" className="l-btn l-btn--primary l-btn--compact" onClick={() => setScheduling(true)}>
                    <Plus aria-hidden="true" className="w-4 h-4" /> Schedule hearing
                </button>
            }
        >
            {loading ? (
                <div className="l-empty" role="status">
                    <Loader2 aria-hidden="true" className="w-6 h-6 animate-spin" />
                    <span className="sr-only">Loading hearings</span>
                </div>
            ) : hearings.length === 0 ? (
                <EmptyState icon={CalendarClock} title="No hearings yet" hint="[DRAFT] Schedule the first date to start this case's hearing log." />
            ) : (
                <ol className="l-rows">
                    {hearings.map((h) => (
                        <li key={h.id}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className="font-semibold">{new Date(h.hearing_date).toDateString()}</span>
                                    <span className="text-sm l-muted inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                                        {h.court_name && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Gavel aria-hidden="true" className="w-3.5 h-3.5" /> {h.court_name}
                                                {h.judge_name ? ` · ${h.judge_name}` : ''}
                                            </span>
                                        )}
                                        {h.cause_list_no && <span>Sr. {h.cause_list_no}</span>}
                                        {h.purpose && <span>For: {h.purpose}</span>}
                                        <span>{h.appearing_lawyer?.full_name ?? 'Unassigned'}</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusChip status={h.status}>{STATUS_LABEL[h.status]}</StatusChip>
                                    {h.status === 'scheduled' ? (
                                        <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => setRecording(h)}>
                                            Record outcome
                                        </button>
                                    ) : (
                                        <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => setNotifying(h)}>
                                            <MessageCircle aria-hidden="true" className="w-4 h-4" /> {h.client_notified_at ? 'Send again' : 'Send update'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {h.proceedings && <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap">{h.proceedings}</p>}
                            {h.client_notified_at && (
                                <span className="inline-flex items-center gap-1.5 text-xs l-muted">
                                    <CheckCheck aria-hidden="true" className="w-3.5 h-3.5" /> Client notified {new Date(h.client_notified_at).toLocaleString()}
                                </span>
                            )}
                        </li>
                    ))}
                </ol>
            )}
            {upcoming.length > 1 && <p className="m-0 px-5 pb-4 text-xs l-muted">{upcoming.length} dates are still open; record each one after its hearing.</p>}

            <RecordOutcomeDialog
                hearing={recording}
                onClose={() => setRecording(null)}
                onSaved={(saved) => {
                    setRecording(null);
                    load();
                    setNotifying(saved);
                }}
            />
            <NotifyClientDialog hearing={notifying} onClose={() => setNotifying(null)} onSent={load} />
            <ScheduleHearingDialog
                open={scheduling}
                caseId={caseId}
                chamberId={chamberId}
                defaultCourt={court}
                onClose={() => setScheduling(false)}
                onSaved={() => {
                    setScheduling(false);
                    load();
                }}
            />
        </Panel>
    );
}
