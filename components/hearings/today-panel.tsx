'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { EmptyState, Panel, StatusChip } from '@/components/dashboard/ui';
import { findClashes, type DocketRow } from '@/lib/hearings/docket';
import { getDocket } from '@/lib/supabase/hearings';

/** Home-page summary of today's docket. */
export function TodayHearingsPanel({ docketHref, casePath }: { docketHref: string; casePath: (caseId: string) => string }) {
    const { user } = useAuth();
    const [rows, setRows] = useState<DocketRow[] | null>(null);

    useEffect(() => {
        if (!user?.chamber_id) return;
        getDocket(user.chamber_id, new Date()).then(({ rows }) => setRows(rows));
    }, [user?.chamber_id]);

    const clashes = rows ? findClashes(rows).size : 0;

    return (
        <Panel
            title="Today's hearings"
            flush
            action={
                <Link href={docketHref} className="l-link text-sm">
                    Open docket
                </Link>
            }
        >
            {rows === null ? (
                <p className="m-0 p-5 text-sm l-muted">Loading...</p>
            ) : rows.length === 0 ? (
                <EmptyState icon={CalendarClock} title="No hearings today" />
            ) : (
                <>
                    {clashes > 0 && <p className="m-0 px-5 pt-4 text-sm text-destructive">{clashes} hearings clash: same lawyer in two courts.</p>}
                    <ul className="l-rows">
                        {rows.slice(0, 5).map((row) => (
                            <li key={row.id}>
                                <Link href={casePath(row.caseId)} className="flex items-center justify-between gap-3">
                                    <span className="flex flex-col min-w-0">
                                        <span className="font-medium truncate">{[row.caseNumber, row.caseTitle].filter(Boolean).join(' · ')}</span>
                                        <span className="text-sm l-muted truncate">
                                            {row.court ?? 'Court not set'}
                                            {row.lawyerName ? ` · ${row.lawyerName}` : ''}
                                        </span>
                                    </span>
                                    <StatusChip status={row.status} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {rows.length > 5 && <p className="m-0 px-5 pb-4 text-sm l-muted">+ {rows.length - 5} more on the docket</p>}
                </>
            )}
        </Panel>
    );
}
