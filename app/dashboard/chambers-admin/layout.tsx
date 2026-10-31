'use client';

import { manrope } from '@/components/landing/fonts';
import { useBodyClass } from '@/lib/dashboard/use-body-class';
import '@/components/landing/landing.css';
import '@/components/dashboard/dash.css';

/**
 * Chamber admin pages use the Techfini theme. `l-dash` goes on <body> while a chamber
 * route is mounted so portaled dialogs, selects and menus are themed too; the content
 * wrapper adds `landing` so the landing primitives (.l-btn, .l-label, .l-chip) apply.
 */
export default function ChambersAdminLayout({ children }: { children: React.ReactNode }) {
    useBodyClass(['l-dash', manrope.variable]);
    return <div className="landing l-dash-root">{children}</div>;
}
