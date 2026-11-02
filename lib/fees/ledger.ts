/** Fees & dues: pure helpers shared by the case Fees tab, receipts and the dues list. */

export type LedgerKind = 'fee' | 'appearance' | 'expense' | 'payment' | 'waiver';
export type PaymentMethod = 'cash' | 'bank' | 'jazzcash' | 'easypaisa' | 'raast' | 'cheque' | 'other';

export interface LedgerEntry {
    id: string;
    kind: LedgerKind;
    amount: number;
    entry_date: string;
    voided_at: string | null;
}

export const KIND_LABEL: Record<LedgerKind, string> = {
    fee: 'Fee',
    appearance: 'Appearance',
    expense: 'Expense',
    payment: 'Payment',
    waiver: 'Waiver',
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
    cash: 'Cash',
    bank: 'Bank transfer',
    jazzcash: 'JazzCash',
    easypaisa: 'Easypaisa',
    raast: 'Raast',
    cheque: 'Cheque',
    other: 'Other',
};

export const CHARGE_KINDS: LedgerKind[] = ['fee', 'appearance', 'expense'];
export const isCharge = (kind: LedgerKind) => CHARGE_KINDS.includes(kind);

/** `Rs 15,000` (PKR) or `USD 2,500`; decimals only when there are paisa. */
export function formatMoney(amount: number, currency = 'PKR') {
    const whole = Number.isInteger(amount);
    const n = amount.toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
    return `${currency === 'PKR' ? 'Rs' : currency} ${n}`;
}

export function summarize(entries: LedgerEntry[]) {
    let charged = 0;
    let paid = 0;
    let waived = 0;
    for (const e of entries) {
        if (e.voided_at) continue;
        const amount = Number(e.amount);
        if (isCharge(e.kind)) charged += amount;
        else if (e.kind === 'payment') paid += amount;
        else if (e.kind === 'waiver') waived += amount;
    }
    const round = (n: number) => Math.round(n * 100) / 100;
    return { charged: round(charged), paid: round(paid), waived: round(waived), balance: round(charged - paid - waived) };
}

const longDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function receiptText(r: {
    chamberName: string;
    receiptNo: string;
    clientName: string;
    caseRef: string;
    amount: number;
    method: PaymentMethod;
    date: string;
    balance: number;
    currency?: string;
}) {
    return [
        r.chamberName,
        `Receipt ${r.receiptNo}`,
        '',
        `Received from: ${r.clientName}`,
        `Case: ${r.caseRef}`,
        `Amount: ${formatMoney(r.amount, r.currency)} (${METHOD_LABEL[r.method]})`,
        `Date: ${longDate(r.date)}`,
        r.balance > 0 ? `Balance due: ${formatMoney(r.balance, r.currency)}` : 'Fully paid. Thank you.',
    ].join('\n');
}

export function duesReminderText(r: { clientName: string; caseRef: string; balance: number; chamberName: string; currency?: string }) {
    return [
        `Assalam-o-Alaikum ${r.clientName},`,
        '',
        `A gentle reminder that ${formatMoney(r.balance, r.currency)} is due on your case ${r.caseRef}.`,
        'Please let us know when we can expect the payment. Thank you.',
        '',
        r.chamberName,
    ].join('\n');
}
