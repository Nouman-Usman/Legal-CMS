/**
 * Limitation calculator and deadline helpers. Dates are `YYYY-MM-DD` strings, computed
 * in UTC so the server's time zone never shifts a day.
 *
 * [VERIFY] Every period below was written from memory and must be checked against the
 * Limitation Act 1908 (First Schedule), CPC, CrPC and the Supreme Court Rules 1980 before
 * the chamber relies on it. The UI always shows the result as "calculated" for the lawyer
 * to confirm.
 */

export type PeriodUnit = 'days' | 'months' | 'years';
export type DeadlineKind = 'filing' | 'reply' | 'compliance' | 'appeal' | 'other';

export interface LimitationRule {
    id: string;
    label: string;
    /** Where the period comes from, e.g. "Art. 152". */
    source: string;
    period: number;
    unit: PeriodUnit;
    kind: DeadlineKind;
    /** What the period runs from. */
    from: string;
}

export const LIMITATION_RULES: LimitationRule[] = [
    { id: 'civil-appeal-district', label: 'Civil appeal to the District Court (CPC)', source: 'Art. 152', period: 30, unit: 'days', kind: 'appeal', from: 'Date of decree or order' },
    { id: 'civil-appeal-hc', label: 'Civil appeal to the High Court (CPC)', source: 'Art. 156', period: 90, unit: 'days', kind: 'appeal', from: 'Date of decree or order' },
    { id: 'civil-revision', label: 'Civil revision (s.115 CPC)', source: 's.115 CPC', period: 90, unit: 'days', kind: 'appeal', from: 'Date of decision' },
    { id: 'review', label: 'Review of judgment', source: 'Art. 161', period: 90, unit: 'days', kind: 'filing', from: 'Date of decree or order' },
    { id: 'ica', label: 'Intra-court appeal (Law Reforms Ord. 1972)', source: 's.3 LRO 1972', period: 20, unit: 'days', kind: 'appeal', from: 'Date of judgment' },
    { id: 'cpla-civil', label: 'Civil petition for leave to appeal (Supreme Court)', source: 'SC Rules 1980', period: 60, unit: 'days', kind: 'appeal', from: 'Date of High Court judgment' },
    { id: 'crl-appeal-sessions', label: 'Criminal appeal to the Sessions Court (CrPC)', source: 'Art. 154', period: 30, unit: 'days', kind: 'appeal', from: 'Date of sentence or order' },
    { id: 'crl-appeal-hc', label: 'Criminal appeal to the High Court (CrPC)', source: 'Art. 155', period: 60, unit: 'days', kind: 'appeal', from: 'Date of sentence or order' },
    { id: 'acquittal-appeal', label: 'Appeal against acquittal', source: 'Art. 157', period: 60, unit: 'days', kind: 'appeal', from: 'Date of acquittal' },
    { id: 'set-aside-exparte', label: 'Set aside an ex parte decree', source: 'Art. 164', period: 30, unit: 'days', kind: 'filing', from: 'Date of decree, or knowledge of it' },
    { id: 'restore-suit', label: 'Restore a suit dismissed for default', source: 'Art. 163', period: 30, unit: 'days', kind: 'filing', from: 'Date of dismissal' },
    { id: 'restore-appeal', label: 'Re-admit an appeal dismissed for default', source: 'Art. 168', period: 30, unit: 'days', kind: 'filing', from: 'Date of dismissal' },
    { id: 'defamation', label: 'Suit for compensation for defamation', source: 'Art. 24', period: 1, unit: 'years', kind: 'filing', from: 'Date of publication' },
    { id: 'money-lent', label: 'Suit for money lent', source: 'Art. 57', period: 3, unit: 'years', kind: 'filing', from: 'Date of the loan' },
    { id: 'specific-performance', label: 'Suit for specific performance', source: 'Art. 113', period: 3, unit: 'years', kind: 'filing', from: 'Date fixed for performance, or refusal' },
    { id: 'declaration', label: 'Suit for declaration', source: 'Art. 120', period: 6, unit: 'years', kind: 'filing', from: 'When the right to sue accrues' },
    { id: 'possession-title', label: 'Suit for possession of immovable property (title)', source: 'Art. 144', period: 12, unit: 'years', kind: 'filing', from: 'When possession becomes adverse' },
    { id: 'residuary-application', label: 'Application with no period provided', source: 'Art. 181', period: 3, unit: 'years', kind: 'filing', from: 'When the right to apply accrues' },
];

const parse = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
};
const format = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(iso: string, days: number) {
    const d = parse(iso);
    d.setUTCDate(d.getUTCDate() + days);
    return format(d);
}

/** Calendar months, ending on the corresponding date (clamped to the month's last day). */
export function addMonths(iso: string, months: number) {
    const d = parse(iso);
    const day = d.getUTCDate();
    const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(day, lastDay));
    return format(target);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string) {
    return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

export interface LimitationInput {
    /** The date the period runs from (excluded, s.12(1)). */
    startDate: string;
    period: number;
    unit: PeriodUnit;
    /** Certified copy applied for / ready: that time is excluded (s.12(2)). [VERIFY] counted inclusive of both days. */
    copyApplied?: string;
    copyReady?: string;
    /** Days courts are closed: 0 = Sunday … 6 = Saturday. */
    closedWeekdays?: number[];
    /** Gazetted holidays and vacations, `YYYY-MM-DD`. */
    holidays?: string[];
}

export interface LimitationResult {
    lastDate: string;
    /** The plain end of the period, before exclusions and the closed-court rule. */
    periodEnds: string;
    excludedDays: number;
    /** Set when the last day fell on a closed day and moved to the reopening day (s.4). */
    movedFrom?: string;
}

export function computeLimitation(input: LimitationInput): LimitationResult {
    const { startDate, period, unit, copyApplied, copyReady, closedWeekdays = [0], holidays = [] } = input;
    const periodEnds = unit === 'days' ? addDays(startDate, period) : addMonths(startDate, unit === 'months' ? period : period * 12);

    const excludedDays = copyApplied && copyReady && daysBetween(copyApplied, copyReady) >= 0 ? daysBetween(copyApplied, copyReady) + 1 : 0;
    let lastDate = addDays(periodEnds, excludedDays);

    const closed = new Set(holidays);
    const isClosed = (iso: string) => closedWeekdays.includes(parse(iso).getUTCDay()) || closed.has(iso);
    const original = lastDate;
    // ponytail: bounded walk; a vacation longer than a year is not a real calendar.
    for (let i = 0; i < 366 && isClosed(lastDate); i++) lastDate = addDays(lastDate, 1);

    return { lastDate, periodEnds, excludedDays, ...(lastDate !== original ? { movedFrom: original } : {}) };
}

export type DueBucket = 'overdue' | 'today' | 'week' | 'later';

export function dueBucket(dueDate: string, today: string): DueBucket {
    const d = daysBetween(today, dueDate);
    if (d < 0) return 'overdue';
    if (d === 0) return 'today';
    if (d <= 7) return 'week';
    return 'later';
}

/** Today's date in Pakistan, where the courts are. */
export const pkToday = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });

/** Which reminder (if any) is due for a deadline today. */
export function reminderSlot(dueDate: string, today: string): '3d' | '1d' | null {
    const d = daysBetween(today, dueDate);
    if (d === 3) return '3d';
    if (d === 1) return '1d';
    return null;
}
