import { Plus } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo-mark';
import { landing } from '@/content/landing';
import { CourtsMarquee } from './courts-marquee';
import { WaveTitle } from './wave-title';

const { product, brand } = landing;

const CHIP = { lime: 'l-chip l-chip--lime', violet: 'l-chip l-chip--violet', plain: 'l-chip' } as const;

/** A coded (not screenshot) mini dashboard with placeholder data, then the courts marquee. */
export function ProductPeek() {
    return (
        <section className="l-band l-product" aria-labelledby="product-title">
            <div className="l-container">
                <div className="l-section-head">
                    <span className="l-eyebrow">{product.eyebrow}</span>
                    <WaveTitle id="product-title" text={product.title} className="l-h2" />
                </div>

                <figure className="l-app" aria-label={`${product.heading}, ${product.example}`}>
                    <div className="l-app__side" aria-hidden="true">
                        <div className="l-app__brand">
                            <LogoMark tone="lime" className="w-7 h-7" />
                            <span>
                                <b>{brand.first}</b> {brand.second}
                            </span>
                        </div>
                        {product.nav.map((item, i) => (
                            <span key={item} className="l-app__nav" data-active={i === 0}>
                                {item}
                            </span>
                        ))}
                    </div>
                    <div className="l-app__main">
                        <div className="l-app__top">
                            <div>
                                <span className="l-label">
                                    {product.date} · {product.example}
                                </span>
                                <p className="l-app__heading">{product.heading}</p>
                            </div>
                            <span className="l-chip" aria-hidden="true">
                                <Plus className="w-3 h-3" /> {product.newCase}
                            </span>
                        </div>

                        <ul className="l-app__list">
                            {product.hearings.map((h) => (
                                <li key={h.time}>
                                    <span className="l-app__time">{h.time}</span>
                                    <span>{h.caseTitle}</span>
                                    <span className="l-app__muted">{h.court}</span>
                                    <span className={CHIP[h.tone]}>{h.stage}</span>
                                    <span className="l-app__muted">{h.lawyer}</span>
                                </li>
                            ))}
                        </ul>

                        <table className="l-app__table">
                            <thead>
                                <tr>
                                    {product.columns.map((c) => (
                                        <th key={c} scope="col">
                                            {c}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {product.hearings.map((h) => (
                                    <tr key={h.time}>
                                        <td className="l-app__time">{h.time}</td>
                                        <td>{h.caseTitle}</td>
                                        <td className="l-app__muted">{h.court}</td>
                                        <td>
                                            <span className={CHIP[h.tone]}>{h.stage}</span>
                                        </td>
                                        <td className="l-app__muted">{h.lawyer}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </figure>
            </div>
            <CourtsMarquee />
        </section>
    );
}
