/** Pure helpers for the daily docket: grouping, clash detection and the WhatsApp text. */

export type HearingStatus = 'scheduled' | 'held' | 'adjourned' | 'decided' | 'not_reached';

export interface DocketRow {
    id: string;
    caseId: string;
    caseNumber: string | null;
    caseTitle: string;
    court: string | null;
    purpose: string | null;
    causeListNo: string | null;
    lawyerId: string | null;
    lawyerName: string | null;
    status: HearingStatus;
}

const NO_COURT = 'Court not set';

export function groupByCourt(rows: DocketRow[]) {
    const map = new Map<string, DocketRow[]>();
    for (const r of rows) {
        const key = r.court?.trim() || NO_COURT;
        map.set(key, [...(map.get(key) ?? []), r]);
    }
    return [...map.entries()]
        .sort(([a], [b]) => (a === NO_COURT ? 1 : b === NO_COURT ? -1 : a.localeCompare(b)))
        .map(([court, items]) => ({ court, items }));
}

/**
 * Ids of rows whose lawyer is listed in more than one court that day. Pakistani
 * cause lists rarely carry times, so "same day, different court" is the clash.
 */
export function findClashes(rows: DocketRow[]): Set<string> {
    const courtsByLawyer = new Map<string, Set<string>>();
    for (const r of rows) {
        if (!r.lawyerId) continue;
        const courts = courtsByLawyer.get(r.lawyerId) ?? new Set<string>();
        courts.add(r.court?.trim() || NO_COURT);
        courtsByLawyer.set(r.lawyerId, courts);
    }
    return new Set(rows.filter((r) => r.lawyerId && (courtsByLawyer.get(r.lawyerId)?.size ?? 0) > 1).map((r) => r.id));
}

/** Plain text for pasting into the chamber's WhatsApp group (*bold* is WhatsApp markup). */
export function docketToWhatsApp(rows: DocketRow[], date: Date): string {
    const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const lines = [`*Docket: ${day}*`];
    if (rows.length === 0) return `${lines[0]}\nNo hearings.`;
    for (const group of groupByCourt(rows)) {
        lines.push('', `*${group.court}*`);
        for (const r of group.items) {
            const lead = r.causeListNo ? `${r.causeListNo}.` : '-';
            const what = [r.caseNumber, r.caseTitle].filter(Boolean).join(' ');
            const purpose = r.purpose ? `: ${r.purpose}` : '';
            lines.push(`${lead} ${what}${purpose} (${r.lawyerName ?? 'unassigned'})`);
        }
    }
    return lines.join('\n');
}
