'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo-mark';
import { landing } from '@/content/landing';

const { brand, nav } = landing;

export function Header() {
    const sheet = useRef<HTMLDialogElement>(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const close = () => sheet.current?.close();

    return (
        <header className="l-header" data-scrolled={scrolled}>
            <div className="l-header__bar">
                <a href="#top" className="l-header__brand" aria-label={`${brand.first} ${brand.second}, top of page`}>
                    <LogoMark tone="lime" className="w-8 h-8" />
                    <span aria-hidden="true">
                        <b>{brand.first}</b> {brand.second}
                    </span>
                </a>
                <nav aria-label="Main" className="l-header__nav">
                    {nav.links.map((link) => (
                        <a key={link.href} href={link.href}>
                            {link.label}
                        </a>
                    ))}
                    <Link href={nav.signIn.href}>{nav.signIn.label}</Link>
                </nav>
                <Link href={nav.cta.href} className="l-btn l-btn--primary l-btn--compact l-header__cta">
                    {nav.cta.label} <ArrowUpRight aria-hidden="true" className="w-4 h-4" />
                </Link>
                <button
                    type="button"
                    className="l-header__menu"
                    aria-label={nav.openMenu}
                    aria-haspopup="dialog"
                    onClick={() => sheet.current?.showModal()}
                >
                    <Menu aria-hidden="true" className="w-5 h-5" />
                </button>
            </div>
            <dialog ref={sheet} className="l-sheet" aria-label={nav.menuTitle}>
                <div className="l-sheet__top">
                    <span className="l-label">{nav.menuTitle}</span>
                    <button type="button" className="l-header__menu" aria-label={nav.closeMenu} onClick={close}>
                        <X aria-hidden="true" className="w-5 h-5" />
                    </button>
                </div>
                <nav aria-label="Menu" className="l-sheet__nav">
                    {nav.links.map((link) => (
                        <a key={link.href} href={link.href} onClick={close}>
                            {link.label}
                        </a>
                    ))}
                    <Link href={nav.signIn.href}>{nav.signIn.label}</Link>
                </nav>
                <Link href={nav.cta.href} className="l-btn l-btn--primary">
                    {nav.cta.label} <ArrowUpRight aria-hidden="true" className="w-4 h-4" />
                </Link>
            </dialog>
        </header>
    );
}
