/**
 * Lahore High Court cause list: query URL, HTML parser, and matching listings to the
 * chamber's cases. Pure (no fetch, no database) so it can be tested against fixtures.
 *
 * Source: https://data.lhc.gov.pk/case_management/regular_cause_list, whose form calls
 * `dynamic/cause_list_regular_result.php`. If LHC changes that page, `parseLhcCauseList`
 * reports `formatOk: false` and the sync marks itself failed instead of going quiet.
 */
import { matchName, titleSides } from '../intake/conflicts.ts';

export const LHC_ENDPOINT = 'https://data.lhc.gov.pk/dynamic/cause_list_regular_result.php';

export const LHC_SEATS = {
    All: 'All seats',
    ucrijaz: 'Principal Seat (Lahore)',
    bwpsaeed: 'Bahawalpur Bench',
    Mulriaz: 'Multan Bench',
    RWPAbid: 'Rawalpindi Bench',
} as const;
export type LhcSeat = keyof typeof LHC_SEATS;

export type ListType = 'old' | 'regular' | 'stay' | 'part_heard' | 'reserved' | 'unknown';

/** Row colours from LHC's legend. */
const COLOUR_TYPE: Record<string, ListType> = {
    '#ff0000': 'old',
    '#ffff00': 'regular',
    '#90ee90': 'stay',
    '#ffb6c1': 'part_heard',
    '#ffdab9': 'reserved',
};

export const LIST_TYPE_LABEL: Record<ListType, string> = {
    old: 'Old cause list',
    regular: 'Regular',
    stay: 'Stay matter',
    part_heard: 'Part-heard',
    reserved: 'Judgement reserved',
    unknown: 'Listed',
};

export interface LhcQuery {
    lawyerCode?: string;
    /** LHC's format: 3xx-xxxxxxx. */
    lawyerMobile?: string;
    caseNumber?: string;
    location?: LhcSeat;
}

/** The whole week ahead ("Full List") for one lawyer or case. */
export function lhcQueryUrl(q: LhcQuery) {
    const params = new URLSearchParams({
        weekDay: '',
        courtName: 'All Courts',
        color: 'All',
        location: q.location ?? 'All',
        bench: '',
        caseNumber: q.caseNumber ?? '',
        lawyerCode: q.lawyerCode ?? '',
        lawyerName: '',
        partyName: '',
        lawyer_cnic: '',
        lawyer_mobile: q.lawyerMobile ?? '',
    });
    return `${LHC_ENDPOINT}?${params}`;
}

/** +92 300 1234567 / 03001234567 → 300-1234567 (what LHC's mobile search expects). */
export function lhcMobile(phone: string | null | undefined): string | null {
    const digits = (phone ?? '').replace(/\D/g, '');
    const m = digits.match(/^(?:92|0)?(3\d{2})(\d{7})$/);
    return m ? `${m[1]}-${m[2]}` : null;
}

export interface LhcListing {
    /** YYYY-MM-DD */
    listDate: string;
    bench: string | null;
    judge: string | null;
    courtRoom: string | null;
    /** Serial on the list; connected matters ("and") take the serial of the matter above. */
    seq: string;
    connected: boolean;
    listType: ListType;
    category: string;
    caseNo: string;
    title: string;
    lawyer: string;
    remarks: string;
}

const text = (html: string) =>
    html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&#0?39;|&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/[ \t]+/g, ' ')
        .trim();

export function parseLhcCauseList(html: string): { formatOk: boolean; total: number | null; listings: LhcListing[] } {
    const body = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    const totalMatch = body.match(/Total Cases\s*<b>\s*\((\d+)\)/i);
    const formatOk = !!totalMatch && /Last Updated On/i.test(body);
    const listings: LhcListing[] = [];

    let header: Pick<LhcListing, 'listDate' | 'bench' | 'judge' | 'courtRoom'> | null = null;
    let lastSeq = '';
    // Court headers and case rows, in document order.
    const token = /<th style='text-align:center;'>([\s\S]*?)<\/th>|<tr\s+bgcolor=(#[0-9a-f]{6})[^>]*>([\s\S]*?)<\/tr>/gi;
    for (const m of body.matchAll(token)) {
        if (m[1] !== undefined) {
            const lines = text(m[1]).split('\n').map((l) => l.trim()).filter(Boolean);
            const date = lines[0]?.match(/^(\d{2})-(\d{2})-(\d{4})$/);
            if (!date) continue;
            const room = lines.find((l) => /^\[.*\]$/.test(l));
            const rest = lines.slice(1).filter((l) => l !== room);
            header = {
                listDate: `${date[3]}-${date[2]}-${date[1]}`,
                bench: rest[0] ?? null,
                judge: rest.slice(1).join(' ') || null,
                courtRoom: room ? room.slice(1, -1).trim() : null,
            };
            continue;
        }
        const cells = [...m[3].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => text(c[1]));
        if (!header || cells.length < 6) continue;
        const [seqCell, category, caseNo, title, lawyer, remarks] = cells;
        const connected = !/^\d+$/.test(seqCell);
        if (!connected) lastSeq = seqCell;
        listings.push({
            ...header,
            seq: connected ? lastSeq : seqCell,
            connected,
            listType: COLOUR_TYPE[m[2].toLowerCase()] ?? 'unknown',
            category,
            caseNo,
            title,
            lawyer,
            remarks,
        });
    }
    return { formatOk, total: totalMatch ? Number(totalMatch[1]) : null, listings };
}

/**
 * The case number and two-digit year: "W.P. 101/26", "16297/20", "CM/1/3175/26" (an
 * application in 3175/26), "Writ Petition No. 101 of 2026" → { num: 101, yy: 26 }.
 */
export function caseRef(value: string | null | undefined): { num: number; yy: number } | null {
    const m = (value ?? '').match(/(\d+)\s*(?:\/|\bof\b)\s*(\d{4}|\d{2})\s*$/i);
    if (!m) return null;
    return { num: Number(m[1]), yy: Number(m[2].slice(-2)) };
}

export interface ChamberCase {
    id: string;
    case_number: string | null;
    title: string;
    client_name: string | null;
    /** Opposing parties recorded on the case. */
    parties?: string[];
}

export type MatchStatus = 'auto' | 'suggested' | 'unmatched';

/** Does the listing's title name this case's people? */
function titleAgrees(listingTitle: string, c: ChamberCase) {
    const sides = titleSides(listingTitle);
    const ours = [c.client_name, ...titleSides(c.title), ...(c.parties ?? [])].filter(Boolean) as string[];
    return sides.some((side) => ours.some((name) => {
        const s = matchName(side, name);
        return s === 'exact' || s === 'likely';
    }));
}

/**
 * Number + year + a name in the title → auto (safe to put on the docket).
 * Number + year alone, or the title alone → suggested (a person confirms).
 */
export function matchListing(listing: LhcListing, cases: ChamberCase[]): { caseId: string | null; status: MatchStatus; note: string } {
    const ref = caseRef(listing.caseNo);
    const sameNumber = ref ? cases.filter((c) => {
        const r = caseRef(c.case_number);
        return r && r.num === ref.num && r.yy === ref.yy;
    }) : [];

    const confirmed = sameNumber.filter((c) => titleAgrees(listing.title, c));
    if (confirmed.length === 1) return { caseId: confirmed[0].id, status: 'auto', note: 'Case number and parties match' };
    if (confirmed.length > 1) return { caseId: null, status: 'suggested', note: `${confirmed.length} cases share this number and parties` };
    if (sameNumber.length === 1) return { caseId: sameNumber[0].id, status: 'suggested', note: 'Case number matches; parties differ' };

    const byTitle = cases.filter((c) => titleAgrees(listing.title, c));
    if (byTitle.length === 1) return { caseId: byTitle[0].id, status: 'suggested', note: 'Parties match; case number differs' };
    return { caseId: null, status: 'unmatched', note: sameNumber.length > 1 ? 'Several cases share this number' : 'Not in the chamber’s cases' };
}

/** Stable identity of a listing, so re-syncing updates instead of duplicating. */
export const listingKey = (l: LhcListing) => [l.listDate, l.judge ?? '', l.courtRoom ?? '', l.caseNo].join('|').toLowerCase();
