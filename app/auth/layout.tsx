import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo-mark';
import { manrope } from '@/components/landing/fonts';
import { landing } from '@/content/landing';
import '@/components/landing/landing.css';
import '@/components/auth/auth.css';

const { brand, hero, footer } = landing;

function Brand() {
    return (
        <Link href="/" className="l-auth__brand" aria-label={`${brand.first} ${brand.second}, home`}>
            <LogoMark tone="lime" className="w-8 h-8" />
            <span aria-hidden="true">
                <b>{brand.first}</b> {brand.second}
            </span>
        </Link>
    );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`landing l-auth ${manrope.variable}`}>
            <aside className="l-auth__panel" aria-hidden="true">
                <Brand />
                <div className="l-auth__pitch">
                    <span className="l-eyebrow">{hero.eyebrow}</span>
                    <p className="l-auth__pitch-title">
                        {hero.lines[0]}
                        <br />
                        {hero.lines[1]} <span>{hero.accent}</span>
                    </p>
                    <p lang="ur" dir="rtl" className="l-urdu l-auth__urdu">
                        {brand.urdu}
                    </p>
                    <div className="l-card l-auth__case">
                        <div className="l-auth__case-head l-label">
                            <span>{hero.card.label}</span>
                            <span>{hero.card.number}</span>
                        </div>
                        <p className="l-auth__case-title">
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
                    </div>
                </div>
                <span className="l-label l-auth__credit">
                    © {new Date().getFullYear()} {footer.credit}
                </span>
            </aside>

            <main className="l-auth__main">
                <div className="l-auth__top">
                    <Brand />
                    <Link href="/" className="l-auth__back">
                        <ArrowLeft aria-hidden="true" className="w-4 h-4" /> Home
                    </Link>
                </div>
                <div className="l-auth__body">
                    <div className="l-auth__form">{children}</div>
                </div>
            </main>
        </div>
    );
}
