'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DashAlert, DashField, Panel } from '@/components/dashboard/ui';
import { addCourtHoliday, getCourtHolidays, removeCourtHoliday } from '@/lib/supabase/deadlines';

/** Gazetted holidays and vacations: the limitation calculator moves a last date off these days. */
export function HolidaysPanel({ chamberId }: { chamberId?: string }) {
    const [holidays, setHolidays] = useState<Array<{ holiday_date: string; label: string | null }>>([]);
    const [date, setDate] = useState('');
    const [label, setLabel] = useState('');
    const [error, setError] = useState('');

    const load = async () => {
        if (chamberId) setHolidays((await getCourtHolidays(chamberId)).holidays);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chamberId]);

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chamberId || !date) return;
        const { error } = await addCourtHoliday(chamberId, date, label);
        if (error) return setError(error.code === '23505' ? 'That day is already listed.' : error.message);
        setError('');
        setDate('');
        setLabel('');
        load();
    };

    return (
        <Panel title="Court closed days" flush>
            <form onSubmit={add} className="l-form px-5 pt-4">
                {error && <DashAlert>{error}</DashAlert>}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
                    <DashField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    <DashField label="Reason" placeholder="e.g. Eid ul Adha" value={label} onChange={(e) => setLabel(e.target.value)} />
                    <button type="submit" className="l-btn l-btn--outline l-btn--compact">
                        Add day
                    </button>
                </div>
            </form>
            {holidays.length === 0 ? (
                <p className="m-0 p-5 text-sm l-muted">No days added. Sundays are always treated as closed.</p>
            ) : (
                <ul className="l-rows">
                    {holidays.map((h) => (
                        <li key={h.holiday_date}>
                            <div className="flex items-center justify-between gap-3">
                                <span>
                                    <span className="font-medium">{new Date(`${h.holiday_date}T00:00:00`).toDateString()}</span>
                                    {h.label && <span className="l-muted"> · {h.label}</span>}
                                </span>
                                <button
                                    type="button"
                                    className="l-icon-btn"
                                    aria-label={`Remove ${h.holiday_date}`}
                                    onClick={async () => {
                                        await removeCourtHoliday(chamberId!, h.holiday_date);
                                        load();
                                    }}
                                >
                                    <Trash2 aria-hidden="true" className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}
