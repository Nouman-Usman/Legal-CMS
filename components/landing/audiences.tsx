import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo-mark';
import { landing } from '@/content/landing';
import { WaveTitle } from './wave-title';

const { audiences } = landing;

/** Phones: stacked cards. Desktop: a pinned deck whose cards fly in face-down and flip one by one. */
export function Audiences() {
    return (
        <section className="l-band l-band--space l-deck" data-space data-progress="pin" aria-labelledby="audiences-title">
            <div className="l-deck__sticky l-container">
                <div className="l-section-head">
                    <span className="l-eyebrow">{audiences.eyebrow}</span>
                    <WaveTitle id="audiences-title" text={audiences.title} className="l-h2" />
                </div>
                <div className="l-deck__grid">
                    {audiences.cards.map((card, i) => (
                        <article
                            key={card.id}
                            id={card.id}
                            className="l-deck__card"
                            data-featured={card.id === 'lawyers'}
                            data-progress="enter"
                            style={{ '--i': i } as CSSProperties}
                            aria-labelledby={`${card.id}-title`}
                        >
                            <div className="l-deck__face l-deck__front">
                                <div className="l-deck__meta l-label">
                                    <span>{card.label}</span>
                                    <span aria-hidden="true">A/W</span>
                                </div>
                                <h3 id={`${card.id}-title`} className="l-deck__title">
                                    {card.title[0]}
                                    <br />
                                    {card.title[1]}
                                </h3>
                                <ul>
                                    {card.features.map((feature) => (
                                        <li key={feature}>{feature}</li>
                                    ))}
                                </ul>
                                <Link href={card.cta.href} className={`l-btn ${card.id === 'lawyers' ? 'l-btn--primary' : 'l-btn--outline'}`}>
                                    {card.cta.label} <ArrowRight aria-hidden="true" className="w-4 h-4 shrink-0" />
                                </Link>
                                {card.secondary && (
                                    <Link href={card.secondary.href} className="l-deck__secondary">
                                        {card.secondary.label}
                                    </Link>
                                )}
                            </div>
                            <div className="l-deck__face l-deck__back" aria-hidden="true">
                                <LogoMark tone="lime" className="w-24 h-24" />
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
