'use client';

import { useEffect } from 'react';
import { middleCoverage, progressOf, type ProgressMode } from '@/lib/landing/motion';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Landing page scroll choreography (ported from Techfini's MotionRoot).
 *
 * 1. Every `.landing [data-progress]` element near the screen gets `--p` (0 → 1),
 *    written only when it changes. CSS maps it to transform/opacity.
 * 2. `--space` on the `.space-layer` is how much a `[data-space]` (purple) band fills
 *    the middle of the screen, so the page turns purple and back.
 *
 * One rAF per frame at most, from passive scroll/resize events. Under reduced motion
 * none of this runs: `has-motion` is removed and the CSS shows the static layout.
 */
export function MotionRoot() {
    useEffect(() => {
        const root = document.documentElement;
        const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
        if (reducedMotion.matches) {
            root.classList.remove('has-motion');
            return;
        }
        root.classList.add('has-motion');

        const tracked = Array.from(document.querySelectorAll<HTMLElement>('.landing [data-progress]'));
        const spaces = Array.from(document.querySelectorAll<HTMLElement>('.landing [data-space]'));
        // Written on the elements that read them, never on <html>: a custom property
        // change on the root restyles the whole document every frame.
        const spaceLayer = document.querySelector<HTMLElement>('.landing .space-layer');
        const written = new WeakMap<HTMLElement, string>();
        const active = new Set<HTMLElement>();
        let lastSpace = '';
        let raf = 0;

        const write = (element: HTMLElement, value: number) => {
            const text = value.toFixed(4);
            if (written.get(element) === text) return;
            written.set(element, text);
            element.style.setProperty('--p', text);
        };

        const frame = () => {
            raf = 0;
            const viewport = window.innerHeight;

            // Read everything first, then write.
            const values: [HTMLElement, number][] = [];
            for (const element of active) {
                const mode = (element.dataset.progress || 'enter') as ProgressMode;
                values.push([element, progressOf(element.getBoundingClientRect(), mode, viewport)]);
            }
            let space = 0;
            for (const section of spaces) space = Math.max(space, middleCoverage(section.getBoundingClientRect(), viewport));

            for (const [element, value] of values) write(element, value);
            const text = space.toFixed(3);
            if (text !== lastSpace) {
                lastSpace = text;
                spaceLayer?.style.setProperty('--space', text);
            }
        };

        const request = () => {
            if (!raf) raf = requestAnimationFrame(frame);
        };

        // Only elements within a quarter screen of the viewport are recomputed;
        // the rest are parked at their start or end value.
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const element = entry.target as HTMLElement;
                    if (entry.isIntersecting) {
                        active.add(element);
                    } else {
                        active.delete(element);
                        write(element, entry.boundingClientRect.top > 0 ? 0 : 1);
                    }
                }
                request();
            },
            { rootMargin: '25% 0px' },
        );
        tracked.forEach((element) => observer.observe(element));

        window.addEventListener('scroll', request, { passive: true });
        window.addEventListener('resize', request);
        request();

        // The preference can change mid-visit: drop to the static layout at once.
        const onPreference = () => {
            if (reducedMotion.matches) root.classList.remove('has-motion');
        };
        reducedMotion.addEventListener('change', onPreference);

        return () => {
            cancelAnimationFrame(raf);
            observer.disconnect();
            window.removeEventListener('scroll', request);
            window.removeEventListener('resize', request);
            reducedMotion.removeEventListener('change', onPreference);
            root.classList.remove('has-motion');
        };
    }, []);

    return <div aria-hidden="true" className="space-layer" />;
}
