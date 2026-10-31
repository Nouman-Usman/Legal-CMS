'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Mail, MailCheck } from 'lucide-react';
import { AuthAlert, AuthHeading, AuthState, Field, SubmitButton } from '@/components/auth/auth-ui';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError('');

        try {
            // In production, you app needs to be configured with the Site URL
            // The redirect URL should point to the update-password page
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
            });

            if (error) {
                // Rate limit error or other
                throw error;
            }

            setSubmitted(true);
        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AuthHeading lines={['Forgot', 'access.']} intro="Enter your email to receive a recovery link." />

            {submitted ? (
                <AuthState icon={MailCheck} title="Check your inbox">
                    <p>
                        A recovery link is on its way to <strong>{email}</strong>.
                    </p>
                    <p className="l-auth__note">
                        <button type="button" onClick={() => setSubmitted(false)}>
                            Use a different email
                        </button>
                    </p>
                </AuthState>
            ) : (
                <form onSubmit={handleSubmit} className="l-auth__stack">
                    {error && <AuthAlert>{error}</AuthAlert>}
                    <Field
                        label="Recovery email"
                        icon={Mail}
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                    />
                    <SubmitButton loading={loading} loadingLabel="Sending...">
                        Send recovery link
                    </SubmitButton>
                </form>
            )}

            <p className="l-auth__note">
                Remembered it? <Link href="/auth/login">Back to login</Link>
            </p>
        </>
    );
}
