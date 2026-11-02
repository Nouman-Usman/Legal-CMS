'use client';

import { useEffect, useMemo, useState } from 'react';
import { Ban, BellRing, Loader2, Pencil, Plus, Receipt, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { EmptyState, Panel, StatTile } from '@/components/dashboard/ui';
import { KIND_LABEL, METHOD_LABEL, duesReminderText, formatMoney, isCharge, receiptText, summarize, type LedgerKind } from '@/lib/fees/ledger';
import { getFeeAgreement, getLedger, type FeeAgreement, type LedgerRow } from '@/lib/supabase/fees';
import { AgreementDialog, LedgerEntryDialog, MessageDialog, VoidEntryDialog } from './fee-dialogs';

const FEE_TYPE_LABEL = { fixed: 'Fixed fee', per_appearance: 'Per appearance', retainer: 'Retainer' } as const;
const ADMIN_KINDS: LedgerKind[] = ['fee', 'appearance', 'expense', 'waiver'];
const LAWYER_KINDS: LedgerKind[] = ['expense'];

export interface FeeCaseInfo {
    id: string;
    case_number: string | null;
    title: string;
    client_name: string | null;
    client_phone: string | null;
    chamberName?: string | null;
}

/** The case's money: agreement, charges, payments, balance, receipts. */
export function CaseFeesPanel({ caseInfo }: { caseInfo: FeeCaseInfo }) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'chamber_admin';
    const [agreement, setAgreement] = useState<FeeAgreement | null>(null);
    const [entries, setEntries] = useState<LedgerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [entryMode, setEntryMode] = useState<'payment' | 'charge' | null>(null);
    const [editingAgreement, setEditingAgreement] = useState(false);
    const [voiding, setVoiding] = useState<LedgerRow | null>(null);
    const [message, setMessage] = useState<{ title: string; text: string; printable?: boolean } | null>(null);

    const load = async () => {
        const [{ agreement }, { entries }] = await Promise.all([getFeeAgreement(caseInfo.id), getLedger(caseInfo.id)]);
        setAgreement(agreement);
        setEntries(entries);
        setLoading(false);
        return entries;
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseInfo.id]);

    const totals = useMemo(() => summarize(entries), [entries]);
    const caseRef = [caseInfo.case_number, caseInfo.title].filter(Boolean).join(' · ');
    const chamberName = caseInfo.chamberName || 'Apna Waqeel';
    const clientName = caseInfo.client_name || 'Client';

    const showReceipt = (r: { receipt_no: string | null; amount: number; entry_date: string; method: LedgerRow['method'] }, balance: number) =>
        setMessage({
            title: `Receipt ${r.receipt_no ?? ''}`.trim(),
            printable: true,
            text: receiptText({ chamberName, receiptNo: r.receipt_no ?? '-', clientName, caseRef, amount: r.amount, method: r.method ?? 'other', date: r.entry_date, balance }),
        });

    if (loading) {
        return (
            <div className="l-empty" role="status">
                <Loader2 aria-hidden="true" className="w-6 h-6 animate-spin" />
                <span className="sr-only">Loading fees</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="l-stats">
                <StatTile label="Charged" value={formatMoney(totals.charged)} hint={totals.waived ? `${formatMoney(totals.waived)} waived` : undefined} />
                <StatTile label="Paid" value={formatMoney(totals.paid)} icon={Wallet} />
                <StatTile
                    label={totals.balance < 0 ? 'Paid in advance' : 'Balance due'}
                    value={formatMoney(Math.abs(totals.balance))}
                    hint={totals.balance > 0 ? 'Outstanding' : totals.balance < 0 ? 'Client is in credit' : 'Settled'}
                />
            </div>

            <Panel
                title="Fee agreement"
                action={
                    isAdmin && (
                        <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => setEditingAgreement(true)}>
                            <Pencil aria-hidden="true" className="w-4 h-4" /> {agreement ? 'Edit' : 'Set agreement'}
                        </button>
                    )
                }
            >
                {agreement ? (
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 m-0">
                        <div>
                            <dt className="l-label">Type</dt>
                            <dd className="m-0 font-semibold">{FEE_TYPE_LABEL[agreement.fee_type]}</dd>
                        </div>
                        <div>
                            <dt className="l-label">Agreed fee</dt>
                            <dd className="m-0 font-semibold">{agreement.agreed_amount != null ? formatMoney(agreement.agreed_amount) : '—'}</dd>
                        </div>
                        <div>
                            <dt className="l-label">Per appearance</dt>
                            <dd className="m-0 font-semibold">{agreement.appearance_fee != null ? formatMoney(agreement.appearance_fee) : '—'}</dd>
                        </div>
                        {agreement.notes && <dd className="m-0 sm:col-span-3 text-sm l-muted">{agreement.notes}</dd>}
                    </dl>
                ) : (
                    <p className="m-0 text-sm l-muted">No agreement yet. Set one to record the agreed fee and auto-charge appearances.</p>
                )}
            </Panel>

            <Panel
                title="Ledger"
                flush
                action={
                    <div className="flex flex-wrap gap-2">
                        {totals.balance > 0 && (
                            <button
                                type="button"
                                className="l-btn l-btn--outline l-btn--compact"
                                onClick={() => setMessage({ title: 'Dues reminder', text: duesReminderText({ clientName, caseRef, balance: totals.balance, chamberName }) })}
                            >
                                <BellRing aria-hidden="true" className="w-4 h-4" /> Remind
                            </button>
                        )}
                        <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => setEntryMode('charge')}>
                            <Plus aria-hidden="true" className="w-4 h-4" /> {isAdmin ? 'Add charge' : 'Add expense'}
                        </button>
                        <button type="button" className="l-btn l-btn--primary l-btn--compact" onClick={() => setEntryMode('payment')}>
                            <Wallet aria-hidden="true" className="w-4 h-4" /> Record payment
                        </button>
                    </div>
                }
            >
                {entries.length === 0 ? (
                    <EmptyState icon={Receipt} title="Nothing recorded yet" hint="Payments, fees and court expenses for this case show up here." />
                ) : (
                    <ol className="l-rows">
                        {entries.map((e) => {
                            const voided = !!e.voided_at;
                            return (
                                <li key={e.id} style={voided ? { opacity: 0.55 } : undefined}>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className="font-semibold" style={voided ? { textDecoration: 'line-through' } : undefined}>
                                                {isCharge(e.kind) ? '' : '− '}
                                                {formatMoney(e.amount)} · {KIND_LABEL[e.kind]}
                                            </span>
                                            <span className="text-sm l-muted inline-flex flex-wrap gap-x-3 gap-y-1">
                                                <span>{new Date(`${e.entry_date}T00:00:00`).toDateString()}</span>
                                                {e.method && <span>{METHOD_LABEL[e.method]}</span>}
                                                {e.reference && <span>Ref {e.reference}</span>}
                                                {e.receipt_no && <span>{e.receipt_no}</span>}
                                                {e.description && <span>{e.description}</span>}
                                                {e.creator?.full_name && <span>by {e.creator.full_name}</span>}
                                            </span>
                                            {voided && <span className="text-xs l-muted">Voided: {e.void_reason}</span>}
                                        </div>
                                        {!voided && (
                                            <div className="flex items-center gap-2">
                                                {e.kind === 'payment' && (
                                                    <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => showReceipt(e, totals.balance)}>
                                                        <Receipt aria-hidden="true" className="w-4 h-4" /> Receipt
                                                    </button>
                                                )}
                                                {isAdmin && (
                                                    <button type="button" className="l-icon-btn" aria-label={`Void ${KIND_LABEL[e.kind]} of ${formatMoney(e.amount)}`} onClick={() => setVoiding(e)}>
                                                        <Ban aria-hidden="true" className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </Panel>

            <LedgerEntryDialog
                mode={entryMode}
                caseId={caseInfo.id}
                kinds={isAdmin ? ADMIN_KINDS : LAWYER_KINDS}
                onClose={() => setEntryMode(null)}
                onSaved={async (saved) => {
                    const wasPayment = entryMode === 'payment';
                    setEntryMode(null);
                    const fresh = await load();
                    if (wasPayment) showReceipt(saved, summarize(fresh).balance);
                }}
            />
            <AgreementDialog
                open={editingAgreement}
                caseId={caseInfo.id}
                agreement={agreement}
                onClose={() => setEditingAgreement(false)}
                onSaved={() => {
                    setEditingAgreement(false);
                    load();
                }}
            />
            <VoidEntryDialog
                entry={voiding}
                onClose={() => setVoiding(null)}
                onSaved={() => {
                    setVoiding(null);
                    load();
                }}
            />
            <MessageDialog title={message?.title ?? ''} text={message?.text ?? null} phone={caseInfo.client_phone} printable={message?.printable} onClose={() => setMessage(null)} />
        </div>
    );
}
