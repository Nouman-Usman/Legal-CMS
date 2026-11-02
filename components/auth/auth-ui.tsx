'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Info, Loader2, type LucideIcon } from 'lucide-react';

/** Form primitives for the auth pages; styles live in components/auth/auth.css. */

export function AuthHeading({ lines, intro }: { lines: [string, string]; intro?: ReactNode }) {
    return (
        <div className="l-auth__heading">
            <h1 className="l-auth__title">
                {lines[0]}
                <br />
                <span>{lines[1]}</span>
            </h1>
            {intro && <p className="l-body">{intro}</p>}
        </div>
    );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    icon?: LucideIcon;
    /** Extra control beside the label, e.g. a "Forgot?" link. */
    aside?: ReactNode;
};

export function Field({ label, icon: Icon, aside, id, type, ...input }: FieldProps) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const isPassword = type === 'password';
    const [visible, setVisible] = useState(false);
    return (
        <div className="l-field">
            <div className="l-field__top">
                <label htmlFor={inputId} className="l-label">
                    {label}
                </label>
                {aside}
            </div>
            <div className="l-field__box">
                {Icon && <Icon aria-hidden="true" className="l-field__icon" />}
                <input id={inputId} className="l-input" type={isPassword && visible ? 'text' : type} {...input} />
                {isPassword && (
                    <button
                        type="button"
                        className="l-field__toggle"
                        aria-label="Show password"
                        aria-pressed={visible}
                        aria-controls={inputId}
                        onClick={() => setVisible(!visible)}
                    >
                        {visible ? <EyeOff aria-hidden="true" className="w-4 h-4" /> : <Eye aria-hidden="true" className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
}

export function AuthAlert({ tone = 'error', children }: { tone?: 'error' | 'notice'; children: ReactNode }) {
    const Icon = tone === 'error' ? AlertCircle : Info;
    return (
        <p className="l-alert" data-tone={tone} role={tone === 'error' ? 'alert' : 'status'}>
            <Icon aria-hidden="true" className="w-4 h-4" />
            <span>{children}</span>
        </p>
    );
}

export function SubmitButton({
    loading,
    loadingLabel,
    children,
    icon: Icon = ArrowRight,
}: {
    loading: boolean;
    loadingLabel: string;
    children: ReactNode;
    icon?: LucideIcon;
}) {
    return (
        <button type="submit" className="l-btn l-btn--primary l-auth__submit" disabled={loading} aria-busy={loading}>
            {loading ? (
                <>
                    <Loader2 aria-hidden="true" className="w-4 h-4 l-auth__spin" />
                    {loadingLabel}
                </>
            ) : (
                <>
                    {children}
                    <Icon aria-hidden="true" className="w-4 h-4" />
                </>
            )}
        </button>
    );
}

export function AuthState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
    return (
        <div className="l-auth__state" role="status">
            <span className="l-auth__state-icon">
                <Icon aria-hidden="true" className="w-8 h-8" />
            </span>
            <h2 className="l-h3">{title}</h2>
            {children}
        </div>
    );
}

export function AuthWaiting({ label }: { label: string }) {
    return (
        <div className="l-auth__state" role="status">
            <Loader2 aria-hidden="true" className="w-8 h-8 l-auth__spin" />
            <span className="l-label">{label}</span>
        </div>
    );
}
