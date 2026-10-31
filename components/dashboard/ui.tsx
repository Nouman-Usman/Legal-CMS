'use client';

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Search, X, type LucideIcon } from 'lucide-react';
import { statusTone } from '@/lib/dashboard/status';

/** Dashboard building blocks; styles live in components/dashboard/dash.css (scope `.l-dash`). */

export function DashPage({ children }: { children: ReactNode }) {
    return <div className="l-dash-page">{children}</div>;
}

export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow?: string;
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <header className="l-dash-head">
            <div className="l-dash-head__text">
                {eyebrow && <span className="l-eyebrow">{eyebrow}</span>}
                <h1 className="l-dash-title">{title}</h1>
                {description && <p className="l-dash-desc">{description}</p>}
            </div>
            {actions && <div className="l-dash-actions">{actions}</div>}
        </header>
    );
}

export function StatTile({ label, value, hint, icon: Icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: LucideIcon }) {
    return (
        <div className="l-stat">
            <span className="l-label">{label}</span>
            <span className="l-stat__value">{value}</span>
            {hint && <span className="l-stat__hint">{hint}</span>}
            {Icon && (
                <span className="l-stat__icon" aria-hidden="true">
                    <Icon className="w-4 h-4" />
                </span>
            )}
        </div>
    );
}

export function Panel({
    title,
    action,
    children,
    flush = false,
    className,
}: {
    title?: string;
    action?: ReactNode;
    children: ReactNode;
    /** Body without padding, for tables and row lists. */
    flush?: boolean;
    className?: string;
}) {
    return (
        <section className={`l-panel ${className ?? ''}`}>
            {(title || action) && (
                <div className="l-panel__head">
                    {title && <h2 className="l-panel__title">{title}</h2>}
                    {action}
                </div>
            )}
            <div className={flush ? 'l-panel__body l-panel__body--flush' : 'l-panel__body'}>{children}</div>
        </section>
    );
}

const CHIP = { lime: 'l-chip l-chip--lime', violet: 'l-chip l-chip--violet', danger: 'l-chip l-chip--danger', neutral: 'l-chip' } as const;

export function StatusChip({ status, children }: { status: string | null | undefined; children?: ReactNode }) {
    return <span className={CHIP[statusTone(status)]}>{children ?? (status || 'Unknown')}</span>;
}

export function EmptyState({ icon: Icon, title, hint, action }: { icon: LucideIcon; title: string; hint?: ReactNode; action?: ReactNode }) {
    return (
        <div className="l-empty">
            <span className="l-empty__icon" aria-hidden="true">
                <Icon className="w-6 h-6" />
            </span>
            <p className="l-empty__title">{title}</p>
            {hint && <p className="l-empty__hint">{hint}</p>}
            {action}
        </div>
    );
}

export function Toolbar({ children }: { children: ReactNode }) {
    return <div className="l-toolbar">{children}</div>;
}

export function SearchInput({ label, ...input }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className="l-search">
            <span className="sr-only">{label}</span>
            <Search aria-hidden="true" />
            <input type="search" className="l-dash-input" {...input} />
        </label>
    );
}

export function DashAlert({ children }: { children: ReactNode }) {
    return (
        <p className="l-dash-alert" role="alert">
            <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0" />
            <span>{children}</span>
        </p>
    );
}

/** A themed dialog (shadcn Dialog, so Escape, focus trap and click-outside work). */
export function DashDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    wide = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: ReactNode;
    children: ReactNode;
    wide?: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[90vh] overflow-y-auto rounded-[22px]`}>
                <div className="landing l-dialog-body">
                    <DialogHeader>
                        <DialogTitle className="l-dialog-title">{title}</DialogTitle>
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function DashField({ label, id, ...input }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
        <div className="l-dash-field">
            <label htmlFor={inputId} className="l-label">
                {label}
            </label>
            <input id={inputId} className="l-dash-input" {...input} />
        </div>
    );
}

/** A dismissible notice pinned to the bottom of the screen. */
export function DashToast({ tone = 'success', children, onClose }: { tone?: 'success' | 'error'; children: ReactNode; onClose: () => void }) {
    const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
    return (
        <div className="l-toast" data-tone={tone} role={tone === 'error' ? 'alert' : 'status'}>
            <Icon aria-hidden="true" className="w-5 h-5 shrink-0" />
            <p className="m-0 flex-1">{children}</p>
            <button type="button" className="l-icon-btn" aria-label="Dismiss" onClick={onClose}>
                <X aria-hidden="true" className="w-4 h-4" />
            </button>
        </div>
    );
}
