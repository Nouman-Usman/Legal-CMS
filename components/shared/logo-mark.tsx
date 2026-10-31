import { cn } from '@/lib/utils';

const TONES = {
    brand: { tile: '#2563EB', stroke: '#FFFFFF' },
    lime: { tile: '#CDFB50', stroke: '#080808' },
};

export function LogoMark({ className, tone = 'brand' }: { className?: string; tone?: keyof typeof TONES }) {
    const { tile, stroke } = TONES[tone];
    return (
        <svg viewBox="0 0 64 64" className={cn('w-8 h-8 shrink-0', className)} role="img" aria-label="Apna Waqeel">
            <rect width="64" height="64" rx="16" fill={tile} />
            <g fill="none" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 50 L32 15 L43 50" />
                <path d="M12 25 H52" />
                <path d="M12 25 L8 37 M12 25 L16 37 M52 25 L48 37 M52 25 L56 37" />
                <path d="M7 37 Q12 43 17 37 Z M47 37 Q52 43 57 37 Z" />
                <path d="M25 50 H39" />
            </g>
        </svg>
    );
}
