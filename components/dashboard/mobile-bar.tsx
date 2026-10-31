'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { LogoMark } from '@/components/shared/logo-mark';
import { Sidebar } from '@/components/shared/sidebar';
import { manrope } from '@/components/landing/fonts';

/** Below 1024px: a slim top bar whose menu button opens the sidebar as a drawer. */
export function MobileBar() {
    const drawer = useRef<HTMLDialogElement>(null);
    const close = () => drawer.current?.close();

    return (
        <div className={`landing l-dash l-mbar ${manrope.variable}`}>
            <Link href="/" className="l-side__brand" aria-label="apna waqeel, home">
                <LogoMark tone="lime" className="w-8 h-8" />
                <span aria-hidden="true">
                    <b>apna</b> waqeel
                </span>
            </Link>
            <button
                type="button"
                className="l-mbar__menu"
                aria-label="Open menu"
                aria-haspopup="dialog"
                onClick={() => drawer.current?.showModal()}
            >
                <Menu aria-hidden="true" className="w-5 h-5" />
            </button>
            <dialog ref={drawer} className="l-mbar__drawer" aria-label="Menu">
                <button type="button" className="l-mbar__close" aria-label="Close menu" onClick={close}>
                    <X aria-hidden="true" className="w-5 h-5" />
                </button>
                <Sidebar isCollapsed={false} onToggle={() => {}} variant="drawer" onNavigate={close} />
            </dialog>
        </div>
    );
}
