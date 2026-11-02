'use client';

import type { ReactNode } from 'react';
import { manrope } from '@/components/landing/fonts';
import { useBodyClass } from '@/lib/dashboard/use-body-class';
import '@/components/landing/landing.css';
import './dash.css';

/** Themes a whole page outside the chamber layout (e.g. the lawyer docket), dialogs included. */
export function DashScope({ children }: { children: ReactNode }) {
    useBodyClass(['l-dash', manrope.variable]);
    return <div className="landing l-dash-root">{children}</div>;
}
