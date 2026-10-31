import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { landing } from '@/content/landing';

const { hero, brand } = landing;

/** Option 1C: loose paperwork gathers into one digital case file. */
export function Hero() {
    return (
        <section id="top" className="l-hero" data-progress="pin" aria-labelledby="hero-title">
            <div className="l-hero__sticky l-container">
                <div className="l-hero__grid">
                    <div className="l-hero__copy">
                        <span className="l-label">{hero.eyebrow}</span>
                        <h1 id="hero-title" className="l-h1">
                            {hero.lines[0]}
                            <br />
                            {hero.lines[1]}{' '}
                            <span className="l-hero__accent">
                                {hero.accent}
                                <svg aria-hidden="true" viewBox="0 0 520 18" preserveAspectRatio="none">
                                    <path d="M4 12 C 120 2, 260 16, 380 6 S 500 10, 516 8" />
                                </svg>
                            </span>
                        </h1>
                        <p lang="ur" dir="rtl" className="l-urdu l-hero__urdu">
                            {brand.urdu}
                        </p>
                    </div>

                    <div className="l-hero__stage">
                        <div aria-hidden="true" className="l-scrap l-scrap--diary">
                            {hero.scraps.diary.map((line) => (
                                <span key={line}>{line}</span>
                            ))}
                        </div>
                        <div aria-hidden="true" className="l-scrap l-scrap--whatsapp">
                            {hero.scraps.whatsapp}
                        </div>
                        <div aria-hidden="true" className="l-scrap l-scrap--folder">
                            {hero.scraps.folder}
                        </div>
                        <div aria-hidden="true" className="l-scrap l-scrap--list">
                            {hero.scraps.causeList.map((line) => (
                                <span key={line}>{line}</span>
                            ))}
                        </div>

                        <article className="l-hero__card l-card" aria-label={hero.card.ariaLabel}>
                            <div className="l-hero__card-head l-label">
                                <span>{hero.card.label}</span>
                                <span>{hero.card.number}</span>
                            </div>
                            <p className="l-hero__card-title">
                                {hero.card.title[0]}
                                <br />
                                {hero.card.title[1]}
                            </p>
                            <dl>
                                {hero.card.rows.map((row) => (
                                    <div key={row.term}>
                                        <dt>{row.term}</dt>
                                        <dd data-accent={row.accent}>{row.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </article>
                    </div>
                </div>

                <div className="l-hero__foot">
                    <p className="l-body-lg">{hero.subhead}</p>
                    <div className="l-hero__ctas">
                        <Link href={hero.primary.href} className="l-btn l-btn--primary">
                            {hero.primary.label} <ArrowRight aria-hidden="true" className="w-4 h-4" />
                        </Link>
                        <a href={hero.secondary.href} className="l-btn l-btn--outline">
                            {hero.secondary.label} <ArrowUpRight aria-hidden="true" className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
