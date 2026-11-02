'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { DashAlert, DashDialog } from '@/components/dashboard/ui';
import { buildClientUpdate, normalizePkPhone, whatsappLink, type OutcomeStatus, type UpdateLang } from '@/lib/hearings/client-update';
import { getClientUpdateContext, markClientNotified, type Hearing } from '@/lib/supabase/hearings';

const LANGS: Array<{ value: UpdateLang; label: string }> = [
    { value: 'en', label: 'English' },
    { value: 'ur', label: 'اردو' },
    { value: 'both', label: 'Both' },
];

/**
 * After a hearing: prepare the client's update and open WhatsApp with it (wa.me),
 * from the chamber's own number. Opening WhatsApp marks the hearing as notified.
 */
export function NotifyClientDialog({ hearing, onClose, onSent }: { hearing: Hearing | null; onClose: () => void; onSent?: () => void }) {
    const { user } = useAuth();
    const [ctx, setCtx] = useState<Awaited<ReturnType<typeof getClientUpdateContext>> | null>(null);
    const [lang, setLang] = useState<UpdateLang>('both');
    const [note, setNote] = useState('');
    const [copied, setCopied] = useState(false);
    const noteId = useId();
    const previewId = useId();

    useEffect(() => {
        if (!hearing) return;
        setCtx(null);
        setNote('');
        setCopied(false);
        getClientUpdateContext(hearing.case_id, hearing.hearing_date).then(setCtx);
    }, [hearing]);

    const phone = normalizePkPhone(ctx?.caseRow?.client_phone);
    const message = useMemo(() => {
        if (!hearing || !ctx?.caseRow) return '';
        const c = ctx.caseRow;
        return buildClientUpdate({
            clientName: c.client_name || 'Sir/Madam',
            caseNumber: c.case_number,
            caseTitle: c.title,
            court: hearing.court_name || c.court,
            status: (hearing.status === 'scheduled' ? 'held' : hearing.status) as OutcomeStatus,
            nextDate: ctx.next ? new Date(ctx.next.hearing_date) : null,
            nextPurpose: ctx.next?.purpose,
            note,
            chamberName: c.chambers?.name,
            lang,
        });
    }, [hearing, ctx, lang, note]);

    const markSent = async () => {
        if (hearing && user) await markClientNotified(hearing.id, user.id);
        onSent?.();
    };

    const copy = async () => {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <DashDialog
            open={!!hearing}
            onOpenChange={(open) => !open && onClose()}
            title="Update the client"
            description={ctx?.caseRow ? `${ctx.caseRow.client_name || 'Client'}${phone ? ` · +${phone}` : ''}` : 'Loading case…'}
            wide
        >
            {ctx?.error && <DashAlert>Could not load the case.</DashAlert>}
            {ctx && !ctx.error && !phone && (
                <DashAlert>This case has no valid WhatsApp number. Edit the case to add one, or copy the message and send it another way.</DashAlert>
            )}

            <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
                <legend className="l-label mb-2">Language</legend>
                <div className="flex flex-wrap gap-2">
                    {LANGS.map((l) => (
                        <button key={l.value} type="button" className="l-filter" aria-pressed={lang === l.value} onClick={() => setLang(l.value)}>
                            {l.label}
                        </button>
                    ))}
                </div>
            </fieldset>

            <div className="l-dash-field">
                <label htmlFor={noteId} className="l-label">
                    Add a note (optional)
                </label>
                <input id={noteId} className="l-dash-input" placeholder="e.g. Please bring the original agreement." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="l-dash-field">
                <label htmlFor={previewId} className="l-label">
                    Message
                </label>
                <textarea id={previewId} className="l-dash-input" rows={10} value={message} readOnly dir="auto" style={{ whiteSpace: 'pre-wrap' }} />
            </div>

            <div className="l-dialog-actions">
                <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={onClose}>
                    Not now
                </button>
                <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={copy} disabled={!message}>
                    {copied ? <Check aria-hidden="true" className="w-4 h-4" /> : <Copy aria-hidden="true" className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
                {phone && message ? (
                    <a href={whatsappLink(phone, message)} target="_blank" rel="noopener noreferrer" className="l-btn l-btn--primary l-btn--compact" onClick={markSent}>
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
