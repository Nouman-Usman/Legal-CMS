'use client';

import { useEffect, useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DashAlert, DashDialog, DashField } from '@/components/dashboard/ui';
import { getChamberLawyers, recordOutcome, scheduleHearing, type Hearing, type Outcome } from '@/lib/supabase/hearings';

const OUTCOMES: Array<{ value: Outcome['status']; label: string }> = [
    { value: 'adjourned', label: 'Adjourned' },
    { value: 'held', label: 'Heard' },
    { value: 'not_reached', label: 'Not reached' },
    { value: 'decided', label: 'Decided' },
];

/** `YYYY-MM-DD` from an <input type="date"> → ISO at 09:00 local (courts list by day, not time). */
function dateToIso(value: string) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d, 9, 0, 0).toISOString();
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
    const id = useId();
    return (
        <div className="l-dash-field">
            <label htmlFor={id} className="l-label">
                {label}
            </label>
            <select id={id} className="l-dash-input" value={value} onChange={(e) => onChange(e.target.value)}>
                {children}
            </select>
        </div>
    );
}

export function RecordOutcomeDialog({
    hearing,
    onClose,
    onSaved,
}: {
    hearing: Hearing | null;
    onClose: () => void;
    /** Receives the hearing as saved, so the caller can offer the client update. */
    onSaved: (saved: Hearing) => void;
}) {
    const [status, setStatus] = useState<Outcome['status']>('adjourned');
    const [proceedings, setProceedings] = useState('');
    const [nextDate, setNextDate] = useState('');
    const [nextPurpose, setNextPurpose] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const proceedingsId = useId();

    useEffect(() => {
        if (!hearing) return;
        setStatus('adjourned');
        setProceedings('');
        setNextDate('');
        setNextPurpose(hearing.purpose ?? '');
        setError('');
    }, [hearing]);

    const needsNext = status === 'adjourned' || status === 'not_reached';

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hearing) return;
        if (needsNext && !nextDate) {
            setError('Enter the next date the court fixed.');
            return;
        }
        setSaving(true);
        const { error } = await recordOutcome(hearing, {
            status,
            proceedings,
            nextDate: nextDate ? dateToIso(nextDate) : undefined,
            nextPurpose,
        });
        setSaving(false);
        if (error) {
            setError((error as { message?: string }).message || 'Could not save the outcome.');
            return;
        }
        onSaved({ ...hearing, status, proceedings: proceedings || null });
    };

    return (
        <DashDialog open={!!hearing} onOpenChange={(open) => !open && onClose()} title="Record outcome" description={hearing ? new Date(hearing.hearing_date).toDateString() : undefined}>
            <form onSubmit={submit} className="l-form">
                {error && <DashAlert>{error}</DashAlert>}
                <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
                    <legend className="l-label mb-2">What happened</legend>
                    <div className="flex flex-wrap gap-2">
                        {OUTCOMES.map((o) => (
                            <button key={o.value} type="button" className="l-filter" aria-pressed={status === o.value} onClick={() => setStatus(o.value)}>
                                {o.label}
                            </button>
                        ))}
                    </div>
                </fieldset>
                <div className="l-dash-field">
                    <label htmlFor={proceedingsId} className="l-label">
                        Proceedings / order
                    </label>
                    <textarea
                        id={proceedingsId}
                        className="l-dash-input"
                        rows={3}
                        placeholder="e.g. Respondent sought time to file reply."
                        value={proceedings}
                        onChange={(e) => setProceedings(e.target.value)}
                    />
                </div>
                {status !== 'decided' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DashField label={needsNext ? 'Next date *' : 'Next date'} type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} required={needsNext} />
                        <DashField label="Fixed for" placeholder="e.g. Arguments" value={nextPurpose} onChange={(e) => setNextPurpose(e.target.value)} />
                    </div>
                )}
                <div className="l-dialog-actions">
                    <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="l-btn l-btn--primary l-btn--compact" disabled={saving}>
                        {saving && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />} Save outcome
                    </button>
                </div>
            </form>
        </DashDialog>
    );
}

export function ScheduleHearingDialog({
    open,
    caseId,
    chamberId,
    defaultCourt,
    onClose,
    onSaved,
}: {
    open: boolean;
    caseId: string;
    chamberId?: string;
    defaultCourt?: string | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [date, setDate] = useState('');
    const [court, setCourt] = useState('');
    const [judge, setJudge] = useState('');
    const [purpose, setPurpose] = useState('');
    const [serial, setSerial] = useState('');
    const [lawyerId, setLawyerId] = useState('');
    const [lawyers, setLawyers] = useState<Array<{ id: string; name: string }>>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setDate('');
        setCourt(defaultCourt ?? '');
        setJudge('');
        setPurpose('');
        setSerial('');
        setLawyerId('');
        setError('');
        if (chamberId) getChamberLawyers(chamberId).then(({ lawyers }) => setLawyers(lawyers));
    }, [open, chamberId, defaultCourt]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const { error } = await scheduleHearing({
            case_id: caseId,
            hearing_date: dateToIso(date),
            court_name: court || null,
            judge_name: judge || null,
            purpose: purpose || null,
            cause_list_no: serial || null,
            appearing_lawyer_id: lawyerId || null,
        });
        setSaving(false);
        if (error) {
            setError((error as { message?: string }).message || 'Could not schedule the hearing.');
            return;
        }
        onSaved();
    };

    return (
        <DashDialog open={open} onOpenChange={(o) => !o && onClose()} title="Schedule hearing">
            <form onSubmit={submit} className="l-form">
                {error && <DashAlert>{error}</DashAlert>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DashField label="Date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    <DashField label="Cause list no." placeholder="e.g. 14" value={serial} onChange={(e) => setSerial(e.target.value)} />
                </div>
                <DashField label="Court" placeholder="e.g. Lahore High Court" value={court} onChange={(e) => setCourt(e.target.value)} />
                <DashField label="Bench / judge" placeholder="e.g. Court No. 4" value={judge} onChange={(e) => setJudge(e.target.value)} />
                <DashField label="Fixed for" placeholder="e.g. Arguments" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                <Select label="Appearing lawyer" value={lawyerId} onChange={setLawyerId}>
                    <option value="">Unassigned</option>
                    {lawyers.map((l) => (
                        <option key={l.id} value={l.id}>
                            {l.name}
                        </option>
                    ))}
                </Select>
                <div className="l-dialog-actions">
                    <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="l-btn l-btn--primary l-btn--compact" disabled={saving || !date}>
                        {saving && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />} Schedule
                    </button>
                </div>
            </form>
        </DashDialog>
    );
}

export { Select as DashSelect };
