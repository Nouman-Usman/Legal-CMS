/** Scroll maths for the landing page motion (ported from Techfini's MotionRoot). */

export type ProgressMode = 'pin' | 'enter' | 'center';

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

/**
 * 0 → 1 for an element, by mode:
 * pin:    across a tall section whose inner block is sticky (top hits 0 → bottom hits the fold)
 * enter:  from its top crossing the fold to 35% up the screen
 * center: from its top at 55% of the screen until it has scrolled its own height
 */
export function progressOf(rect: { top: number; height: number }, mode: ProgressMode, viewport: number) {
    if (mode === 'pin') return clamp(-rect.top / Math.max(1, rect.height - viewport), 0, 1);
    if (mode === 'center') return clamp((viewport * 0.55 - rect.top) / Math.max(1, rect.height), 0, 1);
    return clamp((viewport - rect.top) / (viewport * 0.65), 0, 1);
}

/** Share of the middle half of the screen (25%–75%) covered by an element, eased. */
export function middleCoverage(rect: { top: number; bottom: number }, viewport: number) {
    const top = Math.max(rect.top, viewport * 0.25);
    const bottom = Math.min(rect.bottom, viewport * 0.75);
    const t = clamp((bottom - top) / (viewport * 0.5), 0, 1);
    return t * t * (3 - 2 * t);
}
