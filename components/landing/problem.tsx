import { landing } from '@/content/landing';
import { WaveTitle } from './wave-title';

const { problem } = landing;

export function Problem() {
    return (
        <section className="l-band l-band--space" data-space aria-labelledby="problem-title">
            <div className="l-container">
                <div className="l-section-head">
                    <span className="l-eyebrow">{problem.eyebrow}</span>
                    <WaveTitle id="problem-title" text={problem.title} className="l-h2" />
                </div>

                <div className="l-track" aria-hidden="true">
                    <div className="l-track__lane">
                        <div className="l-track__run" />
                    </div>
                    {problem.stops.map((stop, i) => (
                        <div key={stop} className="l-track__stop" data-lost={i === 1 || i === 2}>
                            <span className="l-track__dot" />
                            <span className="l-label">{stop}</span>
                        </div>
                    ))}
                </div>

                <div className="l-compare">
                    {[problem.today, problem.withUs].map((side, i) => (
                        <article key={side.label} className="l-card l-compare__card" data-featured={i === 1}>
                            <span className="l-label">{side.label}</span>
                            <h3 className="l-h3">{side.title}</h3>
                            <p className="l-body">{side.body}</p>
                            <ul>
                                {side.chips.map((chip) => (
                                    <li key={chip} className={i === 1 ? 'l-chip l-chip--lime' : 'l-chip'}>
                                        {chip}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
