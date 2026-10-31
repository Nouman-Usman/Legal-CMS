/** Eased in-page scrolling for the landing page's anchor links. */

import { clamp } from './motion.ts';

export function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Longer trips take longer, but never feel sluggish: 600ms + 0.2ms per px, capped at 1.6s. */
export function scrollDuration(distance: number) {
    return clamp(600 + Math.abs(distance) * 0.2, 600, 1600);
}

/**
 * Tween the window to `top`. Any wheel, touch or key input from the visitor cancels it,
 * so they are never fighting the page. Returns a cancel function.
 */
export function smoothScrollTo(top: number, onDone?: () => void) {
    const start = window.scrollY;
    const target = clamp(top, 0, document.documentElement.scrollHeight - window.innerHeight);
    const distance = target - start;
    const duration = scrollDuration(distance);
    let raf = 0;
    let begin = 0;

    const stop = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('wheel', stop);
        window.removeEventListener('touchstart', stop);
        window.removeEventListener('keydown', stop);
    };

    const step = (now: number) => {
        if (!begin) begin = now;
        const t = Math.min(1, (now - begin) / duration);
        window.scrollTo({ top: start + distance * easeInOutCubic(t), behavior: 'instant' });
        if (t < 1) {
            raf = requestAnimationFrame(step);
        } else {
            stop();
            onDone?.();
        }
    };

    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', stop);
    raf = requestAnimationFrame(step);
    return stop;
}
