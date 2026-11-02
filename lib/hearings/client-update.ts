/**
 * The client update sent after a hearing (click-to-send WhatsApp). Pure helpers:
 * phone normalisation, the wa.me link and the message text (English / Urdu).
 */

export type UpdateLang = 'en' | 'ur' | 'both';
export type OutcomeStatus = 'held' | 'adjourned' | 'not_reached' | 'decided';

/**
 * Digits WhatsApp expects (country code, no +). Pakistani mobiles may be written
 * +92 300…, 0300…, 0092…, or just 300…; other numbers must include their country code.
 */
export function normalizePkPhone(raw: string | null | undefined): string | null {
    if (!raw) return null;
    let digits = raw.replace(/[^\d+]/g, '');
    if (digits.startsWith('+')) digits = digits.slice(1);
    else if (digits.startsWith('00')) digits = digits.slice(2);
    digits = digits.replace(/\D/g, '');
    if (/^03\d{9}$/.test(digits)) digits = `92${digits.slice(1)}`;
    else if (/^3\d{9}$/.test(digits)) digits = `92${digits}`;
    if (/^92/.test(digits)) return /^923\d{9}$/.test(digits) ? digits : null;
    return /^\d{10,15}$/.test(digits) ? digits : null;
}

export function whatsappLink(phoneDigits: string, text: string) {
    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
}

export interface ClientUpdateInput {
    clientName: string;
    caseNumber?: string | null;
    caseTitle: string;
    court?: string | null;
    status: OutcomeStatus;
    nextDate?: Date | null;
    nextPurpose?: string | null;
    note?: string | null;
    chamberName?: string | null;
    lang: UpdateLang;
}

const day = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const EN_STATUS: Record<OutcomeStatus, string> = {
    held: 'The hearing took place.',
    adjourned: 'The hearing was adjourned.',
    not_reached: 'The case was not reached today.',
    decided: 'The court has decided the matter. We will contact you with the details.',
};

// [DRAFT] Urdu wording, to be reviewed by the chamber.
const UR_STATUS: Record<OutcomeStatus, string> = {
    held: 'سماعت ہوئی۔',
    adjourned: 'سماعت ملتوی ہو گئی۔',
    not_reached: 'آج کیس کی باری نہیں آئی۔',
    decided: 'عدالت نے فیصلہ سنا دیا ہے۔ تفصیلات کے لیے ہم آپ سے رابطہ کریں گے۔',
};

function english(i: ClientUpdateInput) {
    const ref = [i.caseNumber, i.caseTitle].filter(Boolean).join(' – ');
    const lines = [`Assalam-o-Alaikum ${i.clientName},`, '', `Update on your case ${ref}${i.court ? ` (${i.court})` : ''}:`, EN_STATUS[i.status]];
    if (i.nextDate && i.status !== 'decided') lines.push(`Next date: ${day(i.nextDate)}${i.nextPurpose ? `, for ${i.nextPurpose}` : ''}.`);
    if (i.note?.trim()) lines.push('', i.note.trim());
    if (i.chamberName) lines.push('', i.chamberName);
    return lines.join('\n');
}

function urdu(i: ClientUpdateInput) {
    const ref = [i.caseNumber, i.caseTitle].filter(Boolean).join(' – ');
    const lines = [`السلام علیکم ${i.clientName}،`, '', `آپ کے کیس ${ref}${i.court ? ` (${i.court})` : ''} کے بارے میں اطلاع:`, UR_STATUS[i.status]];
    if (i.nextDate && i.status !== 'decided') lines.push(`اگلی تاریخ: ${day(i.nextDate)}${i.nextPurpose ? ` (${i.nextPurpose})` : ''}`);
    if (i.note?.trim()) lines.push('', i.note.trim());
    if (i.chamberName) lines.push('', i.chamberName);
    return lines.join('\n');
}

export function buildClientUpdate(input: ClientUpdateInput) {
    if (input.lang === 'en') return english(input);
    if (input.lang === 'ur') return urdu(input);
    return `${english(input)}\n\n—\n\n${urdu(input)}`;
}
