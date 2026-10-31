import type { CSSProperties } from 'react';
import { landing } from '@/content/landing';
import { WaveTitle } from './wave-title';

const { journey } = landing;

/** Phones: a list whose steps light up as they scroll in. Desktop: a pinned rail the marker travels. */
export function Journey() {
    return (
        <section id="how-it-works" className="l-band l-journey" data-progress="pin" aria-labelledby="journey-title">
            <div className="l-journey__sticky l-container">
                <div className="l-journey__head">
                    <div className="l-section-head">
                        <span className="l-eyebrow">{journey.eyebrow}</span>
                        <WaveTitle id="journey-title" text={journey.title} className="l-h2" />
                    </div>
                    <p className="l-body">{journey.intro}</p>
                </div>

                <div className="l-journey__road" aria-hidden="true">
                    <span />
                </div>

                <div className="l-journey__rail">
                    <div className="l-journey__lane" aria-hidden="true">
                        <div className="l-journey__run" />
                    </div>
                    <ol className="l-journey__steps">
                        {journey.steps.map((step, i) => (
                            <li key={step.title} data-progress="enter" style={{ '--i': i } as CSSProperties}>
                                <span className="l-journey__num" aria-hidden="true">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <h3 className="l-journey__title">{step.title}</h3>
                                <p className="l-body">{step.body}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
