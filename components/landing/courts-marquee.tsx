'use client';

import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { landing } from '@/content/landing';

const { courts } = landing;

/** Court names on a CSS loop; pauses on hover, focus or the toggle (WCAG 2.2.2). */
export function CourtsMarquee() {
    const [paused, setPaused] = useState(false);

    return (
        <div className="l-marquee" data-paused={paused}>
            <div className="l-marquee__mask">
                <div className="l-marquee__track">
                    <ul aria-label={courts.label}>
                        {courts.items.map((court) => (
                            <li key={court}>{court}</li>
                        ))}
                    </ul>
                    <ul aria-hidden="true">
                        {courts.items.map((court) => (
                            <li key={court}>{court}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <button
                type="button"
                className="l-marquee__toggle"
                aria-pressed={paused}
                aria-label={paused ? courts.play : courts.pause}
                onClick={() => setPaused(!paused)}
            >
                {paused ? <Play aria-hidden="true" className="w-4 h-4" /> : <Pause aria-hidden="true" className="w-4 h-4" />}
            </button>
        </div>
    );
}
