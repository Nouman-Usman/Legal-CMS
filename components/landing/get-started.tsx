import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { landing } from '@/content/landing';

const { getStarted, footer, brand } = landing;

/** Placeholder hrefs like `[PRIVACY]` render as text until the owner fills them in. */
function FooterLink({ label, href }: { label: string; href: string }) {
    if (href.startsWith('[')) return <span>{label}</span>;
    if (href.startsWith('#')) return <a href={href}>{label}</a>;
    return <Link href={href}>{label}</Link>;
}

export function GetStarted() {
    return (
        <section className="l-band l-band--space l-start" data-space aria-labelledby="start-title">
            <div className="l-container">
                <div className="l-section-head">
                    <span className="l-eyebrow">{getStarted.eyebrow}</span>
                    <h2 id="start-title" className="l-start__title">
                        {getStarted.title[0]}
                        <br />
                        {getStarted.title[1]}
                    </h2>
                </div>

                <ul className="l-start__rows">
                    {getStarted.rows.map((row) => (
                        <li key={row.label}>
                            <Link href={row.href} className="l-start__row">
                                <span className="l-start__label">
                                    <span className="l-start__label-a">{row.label}</span>
                                    <span className="l-start__label-b" aria-hidden="true">
                                        {row.label}
                                    </span>
                                </span>
                                <ArrowUpRight aria-hidden="true" className="l-start__arrow" />
                            </Link>
                            {row.note && (
                                <Link href={row.note.href} className="l-start__note">
                                    {row.note.label}
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>

                <footer className="l-footer">
                    <div className="l-footer__cols">
                        {footer.columns.map((column) => (
                            <div key={column.title}>
                                <h3 className="l-label">{column.title}</h3>
                                <ul>
                                    {column.links.map((link) => (
                                        <li key={link.label}>
                                            <FooterLink {...link} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="l-footer__legal l-label">
                        <span>
                            © {new Date().getFullYear()} {footer.credit}
                        </span>
                        <span className="l-footer__legal-links">
                            {footer.legal.map((link) => (
                                <FooterLink key={link.label} {...link} />
                            ))}
                        </span>
                    </div>
                    <div className="l-footer__mark" aria-hidden="true">
                        <span className="l-footer__word">
                            {brand.first} {brand.second}
                        </span>
                        <span lang="ur" dir="rtl" className="l-urdu l-footer__urdu">
                            {brand.urdu}
                        </span>
                    </div>
                </footer>
            </div>
        </section>
    );
}
