'use client';

import { useEffect, useId, useState } from 'react';
import { Check, Copy, Loader2, MessageCircle, Printer } from 'lucide-react';
import { DashAlert, DashDialog, DashField } from '@/components/dashboard/ui';
import { DashSelect } from '@/components/hearings/hearing-dialogs';
import { normalizePkPhone, whatsappLink } from '@/lib/hearings/client-update';
import { KIND_LABEL, METHOD_LABEL, type LedgerKind, type PaymentMethod } from '@/lib/fees/ledger';
import { addLedgerEntry, saveFeeAgreement, voidLedgerEntry, type FeeAgreement, type FeeType, type LedgerRow } from '@/lib/supabase/fees';

const today = () => new Date().toLocaleDateString('en-CA');
const errorText = (error: unknown, fallback: string) => (error as { message?: string })?.message || fallback;

function Actions({ onCancel, saving, label }: { onCancel: () => void; saving: boolean; label: string }) {
    return (
        <div className="l-dialog-actions">
            <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={onCancel}>
                Cancel
            </button>
            <button type="submit" className="l-btn l-btn--primary l-btn--compact" disabled={saving}>
                {saving && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />} {label}
            </button>
        </div>
    );
}

/** Payment (credit) or charge (fee / appearance / expense / waiver). */
export function LedgerEntryDialog({
    mode,
    caseId,
    kinds,
    onClose,
    onSaved,
}: {
    mode: 'payment' | 'charge' | null;
    caseId: string;
    /** Charge kinds this user may add (RLS enforces the same). */
    kinds: LedgerKind[];
    onClose: () => void;
    onSaved: (saved: { receipt_no: string | null; amount: number; entry_date: string; method: PaymentMethod | null }) => void;
}) {
    const [kind, setKind] = useState<LedgerKind>('expense');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(today());
    const [method, setMethod] = useState<PaymentMethod>('cash');
    const [description, setDescription] = useState('');
    const [reference, setReference] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!mode) return;
        setKind(kinds[0] ?? 'expense');
        setAmount('');
        setDate(today());
        setMethod('cash');
        setDescription('');
        setReference('');
        setError('');
    }, [mode, kinds]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = Number(amount);
        if (!(value > 0)) return setError('Enter an amount above zero.');
        setSaving(true);
        const { entry, error } = await addLedgerEntry({
            case_id: caseId,
            kind: mode === 'payment' ? 'payment' : kind,
            amount: value,
            entry_date: date,
            description,
            method: mode === 'payment' ? method : null,
            reference,
        });
        setSaving(false);
        if (error || !entry) return setError(errorText(error, 'Could not save the entry.'));
        onSaved({ ...entry, amount: Number(entry.amount) } as never);
    };

    return (
        <DashDialog open={!!mode} onOpenChange={(o) => !o && onClose()} title={mode === 'payment' ? 'Record payment' : 'Add charge'}>
            <form onSubmit={submit} className="l-form">
                {error && <DashAlert>{error}</DashAlert>}
                {mode === 'charge' && (
                    <DashSelect label="Type" value={kind} onChange={(v) => setKind(v as LedgerKind)}>
                        {kinds.map((k) => (
                            <option key={k} value={k}>
                                {KIND_LABEL[k]}
                            </option>
                        ))}
                    </DashSelect>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DashField label="Amount (Rs) *" type="number" inputMode="decimal" min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    <DashField label="Date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                {mode === 'payment' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DashSelect label="Method" value={method} onChange={(v) => setMethod(v as PaymentMethod)}>
                            {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                                <option key={m} value={m}>
                                    {METHOD_LABEL[m]}
                                </option>
                            ))}
                        </DashSelect>
                        <DashField label="Reference / TID" placeholder="e.g. cheque no." value={reference} onChange={(e) => setReference(e.target.value)} />
                    </div>
                )}
                <DashField
                    label="Description"
                    placeholder={mode === 'payment' ? 'e.g. First instalment' : kind === 'expense' ? 'e.g. Court fee stamps' : 'e.g. Drafting of petition'}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Actions onCancel={onClose} saving={saving} label={mode === 'payment' ? 'Save payment' : 'Add charge'} />
            </form>
        </DashDialog>
    );
}

const FEE_TYPES: Array<{ value: FeeType; label: string }> = [
    { value: 'fixed', label: 'Fixed fee' },
    { value: 'per_appearance', label: 'Per appearance' },
    { value: 'retainer', label: 'Retainer' },
];

export function AgreementDialog({ open, caseId, agreement, onClose, onSaved }: { open: boolean; caseId: string; agreement: FeeAgreement | null; onClose: () => void; onSaved: () => void }) {
    const [feeType, setFeeType] = useState<FeeType>('fixed');
    const [agreed, setAgreed] = useState('');
    const [appearance, setAppearance] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setFeeType(agreement?.fee_type ?? 'fixed');
        setAgreed(agreement?.agreed_amount?.toString() ?? '');
        setAppearance(agreement?.appearance_fee?.toString() ?? '');
        setNotes(agreement?.notes ?? '');
        setError('');
    }, [open, agreement]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const { error } = await saveFeeAgreement({
            case_id: caseId,
            fee_type: feeType,
            agreed_amount: agreed ? Number(agreed) : null,
            appearance_fee: appearance ? Number(appearance) : null,
            currency: agreement?.currency ?? 'PKR',
            notes: notes.trim() || null,
        });
        setSaving(false);
        if (error) return setError(errorText(error, 'Could not save the agreement.'));
        onSaved();
    };

    return (
        <DashDialog open={open} onOpenChange={(o) => !o && onClose()} title="Fee agreement" description="Appearance fees are charged automatically when a hearing is recorded as Heard, Adjourned or Decided.">
            <form onSubmit={submit} className="l-form">
                {error && <DashAlert>{error}</DashAlert>}
                <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
                    <legend className="l-label mb-2">Fee type</legend>
                    <div className="flex flex-wrap gap-2">
                        {FEE_TYPES.map((t) => (
                            <button key={t.value} type="button" className="l-filter" aria-pressed={feeType === t.value} onClick={() => setFeeType(t.value)}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </fieldset>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DashField label="Agreed fee (Rs)" type="number" min="0" step="any" value={agreed} onChange={(e) => setAgreed(e.target.value)} />
                    <DashField label="Per appearance (Rs)" type="number" min="0" step="any" value={appearance} onChange={(e) => setAppearance(e.target.value)} />
                </div>
                <DashField label="Notes" placeholder="e.g. 50% advance, rest before arguments" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <Actions onCancel={onClose} saving={saving} label="Save agreement" />
            </form>
        </DashDialog>
    );
}

export function VoidEntryDialog({ entry, onClose, onSaved }: { entry: LedgerRow | null; onClose: () => void; onSaved: () => void }) {
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setReason('');
        setError('');
    }, [entry]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!entry || !reason.trim()) return setError('Give a reason; it stays on the record.');
        setSaving(true);
        const { error } = await voidLedgerEntry(entry.id, reason);
        setSaving(false);
        if (error) return setError(errorText(error, 'Could not void the entry.'));
        onSaved();
    };

    return (
        <DashDialog open={!!entry} onOpenChange={(o) => !o && onClose()} title="Void entry" description="Voided entries stay visible, struck through, and stop counting toward the balance.">
            <form onSubmit={submit} className="l-form">
                {error && <DashAlert>{error}</DashAlert>}
                <DashField label="Reason *" placeholder="e.g. Entered twice" value={reason} onChange={(e) => setReason(e.target.value)} required />
                <Actions onCancel={onClose} saving={saving} label="Void entry" />
            </form>
        </DashDialog>
    );
}

/** Print a plain-text receipt in its own window. */
function printText(title: string, text: string) {
    const w = window.open('', '_blank', 'width=480,height=640');
    if (!w) return;
    const pre = w.document.createElement('pre');
    pre.textContent = text;
    pre.style.cssText = 'font: 15px/1.6 system-ui, sans-serif; white-space: pre-wrap; padding: 24px;';
    w.document.title = title;
    w.document.body.appendChild(pre);
    w.print();
}

/** Receipts and reminders: preview, copy, WhatsApp, print. */
export function MessageDialog({ title, text, phone, printable, onClose }: { title: string; text: string | null; phone?: string | null; printable?: boolean; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const previewId = useId();
    const wa = normalizePkPhone(phone);

    const copy = async () => {
        await navigator.clipboard.writeText(text ?? '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <DashDialog open={!!text} onOpenChange={(o) => !o && onClose()} title={title} description={wa ? `+${wa}` : 'No valid WhatsApp number on this case.'}>
            <div className="l-dash-field">
                <label htmlFor={previewId} className="l-label">
                    Message
                </label>
                <textarea id={previewId} className="l-dash-input" rows={9} value={text ?? ''} readOnly />
            </div>
            <div className="l-dialog-actions">
                <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={copy}>
                    {copied ? <Check aria-hidden="true" className="w-4 h-4" /> : <Copy aria-hidden="true" className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
                {printable && (
                    <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => printText(title, text ?? '')}>
                        <Printer aria-hidden="true" className="w-4 h-4" /> Print
                    </button>
                )}
                {wa && text ? (
                    <a href={whatsappLink(wa, text)} target="_blank" rel="noopener noreferrer" className="l-btn l-btn--primary l-btn--compact">
                        <MessageCircle aria-hidden="true" className="w-4 h-4" /> Open WhatsApp
                    </a>
                ) : (
                    <button type="button" className="l-btn l-btn--primary l-btn--compact" disabled>
                        <MessageCircle aria-hidden="true" className="w-4 h-4" /> Open WhatsApp
                    </button>
                )}
            </div>
        </DashDialog>
    );
}
