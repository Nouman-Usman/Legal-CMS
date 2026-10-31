/** How a case/lead/lawyer status reads on the dashboard. Unknown or missing values are neutral. */
export type ChipTone = 'lime' | 'violet' | 'neutral' | 'danger';

const TONES: Record<string, ChipTone> = {
    active: 'lime',
    open: 'lime',
    converted: 'lime',
    completed: 'lime',
    pending: 'violet',
    new: 'violet',
    contacted: 'violet',
    consultation: 'violet',
    invited: 'violet',
    scheduled: 'violet',
    lost: 'danger',
    cancelled: 'danger',
    suspended: 'danger',
};

export function statusTone(status: string | null | undefined): ChipTone {
    return TONES[(status ?? '').trim().toLowerCase()] ?? 'neutral';
}
