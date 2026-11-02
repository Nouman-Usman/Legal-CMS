'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, Wallet } from 'lucide-react';
import { EmptyState, Panel } from '@/components/dashboard/ui';
import { duesReminderText, formatMoney } from '@/lib/fees/ledger';
import { getChamberName, getDues, type DueRow } from '@/lib/supabase/fees';
import { MessageDialog } from './fee-dialogs';

const casePath = (id: string) => `/dashboard/chambers-admin/cases/${id}`;

/** Cases with a balance due, largest first, with a WhatsApp reminder per case. */
export function DuesPanel({ chamberId, limit, onLoaded }: { chamberId?: string; limit?: number; onLoaded?: (dues: DueRow[]) => void }) {
    const [dues, setDues] = useState<DueRow[] | null>(null);
    const [chamberName, setChamberName] = useState<string | null>(null);
    const [reminding, setReminding] = useState<DueRow | null>(null);

    useEffect(() => {
        if (!chamberId) return;
        getDues(chamberId).then(({ dues }) => {
            setDues(dues);
            onLoaded?.(dues);
        });
        getChamberName(chamberId).then(setChamberName);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chamberId]);

    const shown = limit ? dues?.slice(0, limit) : dues;

    return (
        <Panel
            title="To collect"
            flush
            action={
                limit ? (
                    <Link href="/dashboard/chambers-admin/fees" className="l-link text-sm">
                        All dues
                    </Link>
                ) : undefined
            }
        >
            {dues === null ? (
                <p className="m-0 p-5 text-sm l-muted">Loading...</p>
            ) : dues.length === 0 ? (
                <EmptyState icon={Wallet} title="Nothing outstanding" hint="Cases with a balance due show up here." />
            ) : (
                <>
                    <ul className="l-rows">
                        {shown!.map((d) => (
                            <li key={d.case_id}>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <Link href={casePath(d.case_id)} className="flex flex-col min-w-0">
                                        <span className="font-medium truncate">{[d.case_number, d.title].filter(Boolean).join(' · ')}</span>
                                        <span className="text-sm l-muted truncate">
                                            {d.client_name ?? 'No client'} · paid {formatMoney(d.paid)} of {formatMoney(d.charged)}
                                            {d.last_payment_date ? ` · last ${new Date(`${d.last_payment_date}T00:00:00`).toLocaleDateString('en-GB')}` : ''}
                                        </span>
                                    </Link>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold">{formatMoney(d.balance)}</span>
                                        <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => setReminding(d)}>
                                            <BellRing aria-hidden="true" className="w-4 h-4" /> Remind
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {limit && dues.length > limit && <p className="m-0 px-5 pb-4 text-sm l-muted">+ {dues.length - limit} more cases with dues</p>}
                </>
            )}
            <MessageDialog
                title="Dues reminder"
                phone={reminding?.client_phone}
                text={
                    reminding
                        ? duesReminderText({
                              clientName: reminding.client_name || 'Sir/Madam',
                              caseRef: [reminding.case_number, reminding.title].filter(Boolean).join(' · '),
                              balance: reminding.balance,
                              chamberName: chamberName || 'Apna Waqeel',
                          })
                        : null
                }
                onClose={() => setReminding(null)}
            />
        </Panel>
    );
}
