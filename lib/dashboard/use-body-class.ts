'use client';

import { useEffect } from 'react';

/** Puts classes on <body> while mounted, so portaled dialogs and menus pick up the theme. */
export function useBodyClass(classNames: string[]) {
    const key = classNames.join(' ');
    useEffect(() => {
        const names = key.split(' ').filter(Boolean);
        document.body.classList.add(...names);
        return () => document.body.classList.remove(...names);
    }, [key]);
}
