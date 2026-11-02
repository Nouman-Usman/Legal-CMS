'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { DashAlert, DashDialog, DashField } from '@/components/dashboard/ui';
import { DashSelect } from '@/components/hearings/hearing-dialogs';
import { getChamberLawyers } from '@/lib/supabase/hearings';
import { addDeadline, getCourtHolidays } from '@/lib/supabase/deadlines';
import { computeLimitation, LIMITATION_RULES, pkToday, type DeadlineKind, type PeriodUnit } from '@/lib/deadlines/limitation';

export const KIND_LABEL: Record<DeadlineKind, string> = {
    filing: 'Filing',
    reply: 'Reply / written statement',
    compliance: 'Compliance with order',
    appeal: 'Appeal / revision',
    other: 'Other',
};

const SATURDAY_KEY = 'aw.courtsClosedSaturday';
const readSaturday = () => {
    try {
        return localStorage.getItem(SATURDAY_KEY) === '1';
    } catch {
        return false;
    }
};
const longDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/** The limitation calculator: pick what is being filed, enter the order date, get the last date. */
function LimitationCalculator({ chamberId, onUse }: { chamberId?: string; onUse: (r: { date: string; title: string; kind: DeadlineKind; article: string }) => void }) {
    const [ruleId, setRuleId] = useState(LIMITATION_RULES[0].id);
    const [customPeriod, setCustomPeriod] = useState('30');
    const [customUnit, setCustomUnit] = useState<PeriodUnit>('days');
    const [start, setStart] = useState(pkToday());
    const [copyApplied, setCopyApplied] = useState('');
    const [copyReady, setCopyReady] = useState('');
    const [saturday, setSaturday] = useState(false);
    const [holidays, setHolidays] = useState<string[]>([]);
    const saturdayId = useId();

    useEffect(() => {
        setSaturday(readSaturday());
        if (chamberId) getCourtHolidays(chamberId).then(({ holidays }) => setHolidays(holidays.map((h) => h.holiday_date)));
    }, [chamberId]);

    const rule = LIMITATION_RULES.find((r) => r.id === ruleId);
    const period = rule ? rule.period : Number(customPeriod);
    const unit = rule ? rule.unit : customUnit;
    const result = useMemo(
        () =>
            start && period > 0
                ? computeLimitation({ startDate: start, period, unit, copyApplied: copyApplied || undefined, copyReady: copyReady || undefined, closedWeekdays: saturday ? [0, 6] : [0], holidays })
                : null,
        [start, period, unit, copyApplied, copyReady, saturday, holidays],
    );

    const toggleSaturday = (on: boolean) => {
        setSaturday(on);
        try {
            localStorage.setItem(SATURDAY_KEY, on ? '1' : '0');
        } catch {
            /* per-viewer convenience only */
        }
    };

    return (
        <div className="l-panel" style={{ padding: 16 }}>
            <div className="flex flex-col gap-4">
                <p className="m-0 text-xs l-muted">[VERIFY] Periods are pre-filled from the Limitation Act schedule and must be confirmed by the lawyer.</p>
                <DashSelect label="What is being filed" value={ruleId} onChange={setRuleId}>
                    {LIMITATION_RULES.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.label} — {r.period} {r.unit} ({r.source})
                        </option>
                    ))}
                    <option value="custom">Custom period</option>
                </DashSelect>
                {!rule && (
                    <div className="grid grid-cols-2 gap-4">
                        <DashField label="Period" type="number" min="1" value={customPeriod} onChange={(e) => setCustomPeriod(e.target.value)} />
                        <DashSelect label="Unit" value={customUnit} onChange={(v) => setCustomUnit(v as PeriodUnit)}>
                            <option value="days">Days</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                        </DashSelect>
                    </div>
                )}
                <DashField label={rule?.from ?? 'Runs from'} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DashField label="Certified copy applied" type="date" value={copyApplied} onChange={(e) => setCopyApplied(e.target.value)} />
                    <DashField label="Copy ready" type="date" value={copyReady} onChange={(e) => setCopyReady(e.target.value)} />
                </div>
                <label htmlFor={saturdayId} className="inline-flex items-center gap-2 text-sm">
                    <input id={saturdayId} type="checkbox" checked={saturday} onChange={(e) => toggleSaturday(e.target.checked)} />
                    Courts are closed on Saturdays
                </label>
                {result && (
                    <div className="flex flex-wrap items-end justify-between gap-3" role="status">
                        <div className="flex flex-col gap-1">
                            <span className="l-label">Last date (calculated)</span>
                            <span className="text-lg font-semibold">{longDate(result.lastDate)}</span>
                            <span className="text-xs l-muted">
                                Period ends {longDate(result.periodEnds)}
                                {result.excludedDays ? ` · ${result.excludedDays} days excluded for copies` : ''}
                                {result.movedFrom ? ` · moved from ${longDate(result.movedFrom)} (court closed)` : ''}
                            </span>
                        </div>
                        <button
                            type="button"
                            className="l-btn l-btn--outline l-btn--compact"
                            onClick={() =>
                                onUse({
                                    date: result.lastDate,
                                    title: rule?.label ?? `Filing within ${period} ${unit}`,
                                    kind: rule?.kind ?? 'filing',
                                    article: rule ? `${rule.source}: ${rule.period} ${rule.unit}` : `Custom: ${period} ${unit}`,
                                })
                            }
                        >
                            Use this date
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export function AddDeadlineDialog({ open, caseId, chamberId, onClose, onSaved }: { open: boolean; caseId: string; chamberId?: string; onClose: () => void; onSaved: () => void }) {
    const [kind, setKind] = useState<DeadlineKind>('filing');
    const [title, setTitle] = useState('');
    const [due, setDue] = useState('');
    const [assignee, setAssignee] = useState('');
    const [notes, setNotes] = useState('');
    const [article, setArticle] = useState<string | null>(null);
    const [calculating, setCalculating] = useState(false);
    const [lawyers, setLawyers] = useState<Array<{ id: string; name: string }>>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setKind('filing');
        setTitle('');
        setDue('');
        setAssignee('');
        setNotes('');
        setArticle(null);
        setCalculating(false);
        setError('');
        if (chamberId) getChamberLawyers(chamberId).then(({ lawyers }) => setLawyers(lawyers));
    }, [open, chamberId]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !due) return setError('Enter what is due and the date.');
        setSaving(true);
        const { error } = await addDeadline({ case_id: caseId, kind, title, due_date: due, assigned_to: assignee, notes, limitation_article: article });
        setSaving(false);
        if (error) return setError((error as { message?: string }).message || 'Could not save the deadline.');
        onSaved();
    };

    return (
        <DashDialog open={open} onOpenChange={(o) => !o && onClose()} title="Add deadline" wide>
            <form onSubmit={submit} className="l-form">
                {error && <DashAlert>{error}</DashAlert>}
                {calculating ? (
                    <LimitationCalculator
                        chamberId={chamberId}
                        onUse={(r) => {
                            setDue(r.date);
                            setKind(r.kind);
                            setArticle(r.article);
                            if (!title.trim()) setTitle(r.title);
                            setCalculating(false);
                        }}
                    />
                ) : (
                    <button type="button" className="l-btn l-btn--outline l-btn--compact self-start" onClick={() => setCalculating(true)}>
                        <Calculator aria-hidden="true" className="w-4 h-4" /> Calculate limitation
                    </button>
                )}
                <DashField label="What is due *" placeholder="e.g. File written statement" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DashField label="Due date *" type="date" value={due} onChange={(e) => setDue(e.target.value)} required />
                    <DashSelect label="Type" value={kind} onChange={(v) => setKind(v as DeadlineKind)}>
                        {(Object.keys(KIND_LABEL) as DeadlineKind[]).map((k) => (
                            <option key={k} value={k}>
                                {KIND_LABEL[k]}
                            </option>
                        ))}
                    </DashSelect>
                </div>
                {article && <p className="m-0 text-xs l-muted">Calculated under {article}. Confirm before relying on it.</p>}
                <DashSelect label="Responsible lawyer" value={assignee} onChange={setAssignee}>
                    <option value="">Unassigned</option>
                    {lawyers.map((l) => (
                        <option key={l.id} value={l.id}>
                            {l.name}
                        </option>
                    ))}
                </DashSelect>
                <DashField label="Notes" placeholder="e.g. Copy of order attached in Documents" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <div className="l-dialog-actions">
                    <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="l-btn l-btn--primary l-btn--compact" disabled={saving}>
                        {saving && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />} Save deadline
                    </button>
                </div>
            </form>
        </DashDialog>
    );
}
