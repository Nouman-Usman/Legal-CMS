import type { ReactNode } from 'react';
import { manrope } from '@/components/landing/fonts';

/**
 * A themed island for a dashboard component rendered on a page that is not yet
 * reskinned (e.g. the lawyer case pages showing the shared case detail).
 */
export function DashEmbed({ children }: { children: ReactNode }) {
    return <div className={`landing l-dash l-dash-embed ${manrope.variable}`}>{children}</div>;
}
