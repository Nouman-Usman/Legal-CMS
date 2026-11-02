'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Lock, CheckCircle } from 'lucide-react';
import { AuthAlert, AuthHeading, AuthState, AuthWaiting, Field, SubmitButton } from '@/components/auth/auth-ui';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);

    // Listen for auth state changes and wait for session to be established from recovery token
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const setupAuthListener = async () => {
            try {
                console.log('Setting up auth listener...');
                console.log('Current hash:', window.location.hash);

                // Check for recovery token in hash
                const hash = window.location.hash;
                if (hash && hash.includes('access_token')) {
                    console.log('Found token in hash, attempting to establish session...');

                    // Parse the hash to extract token data
                    const hashParams = new URLSearchParams(hash.substring(1));
                    const accessToken = hashParams.get('access_token');
                    const refreshToken = hashParams.get('refresh_token');
                    const type = hashParams.get('type');
                    const expiresIn = hashParams.get('expires_in');

                    console.log('Token data:', {
                        hasAccessToken: !!accessToken,
                        hasRefreshToken: !!refreshToken,
                        type,
                        expiresIn
                    });

                    if (accessToken && type === 'recovery') {
                        // Try to set the session manually
                        try {
                            const { data, error } = await supabase.auth.setSession({
                                access_token: accessToken,
                                refresh_token: refreshToken || '',
                            });

                            if (error) {
                                console.error('setSession error:', error);
                                setError(`Failed to establish session: ${error.message}`);
                                setSessionReady(false);
                                return;
                            }

                            if (data.session) {
                                console.log('Session successfully set from recovery token!');
                                setSessionReady(true);
                                setError('');
                                // Clean URL
                                window.history.replaceState({}, document.title, '/auth/update-password');
                                return;
                            }
                        } catch (err: any) {
                            console.error('Error setting session:', err);
                            setError('Failed to process recovery token: ' + err.message);
                            setSessionReady(false);
                            return;
                        }
                    }
                }

                // Fallback: check for existing session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) {
                    console.error('getSession error:', sessionError);
                    setError('Failed to check session: ' + sessionError.message);
                    setSessionReady(false);
                    return;
                }

                if (session) {
                    console.log('Session exists');
                    setSessionReady(true);
                    return;
                }

                // Listen for auth state changes
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    console.log('Auth event:', event, '| Session:', !!session);

                    if (session) {
                        console.log('Session established from auth state change');
                        setSessionReady(true);
                        setError('');
                    } else if (event === 'SIGNED_OUT') {
                        console.log('User signed out');
                        setError('Session lost. Please request a new invitation.');
                        setSessionReady(false);
                    }
                });

                unsubscribe = subscription.unsubscribe;

                // If still no session after a moment, show error
                setTimeout(() => {
                    if (!sessionReady) {
                        supabase.auth.getSession().then(({ data: { session } }) => {
                            if (!session) {
                                console.error('No session after timeout');
                                setError('Auth session missing! Your recovery link may have expired. Please request a new invitation.');
                                setSessionReady(false);
                            }
                        });
                    }
                }, 2000);
            } catch (err: any) {
                console.error('Auth setup error:', err);
                setError('Failed to verify session: ' + err.message);
                setSessionReady(false);
            }
        };

        setupAuthListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Verify session is still valid
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                throw new Error('Session lost. Your recovery link may have expired. Please request a new invitation.');
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err: any) {
            console.error('Update password error:', err);
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AuthHeading lines={['Security', 'update.']} intro="Set a new secure password for your workspace." />

            {success ? (
                <AuthState icon={CheckCircle} title="Password updated">
                    <p>Redirecting you to your dashboard...</p>
                </AuthState>
            ) : !sessionReady ? (
                error ? (
                    <div className="l-auth__stack">
                        <AuthAlert>{error}</AuthAlert>
                        <Link href="/auth/login" className="l-btn l-btn--outline l-auth__submit">
                            Return to login
                        </Link>
                    </div>
                ) : (
                    <AuthWaiting label="Verifying your link..." />
                )
            ) : (
                <form onSubmit={handleSubmit} className="l-auth__stack">
                    {error && <AuthAlert>{error}</AuthAlert>}
                    <Field
                        label="New password"
                        icon={Lock}
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        minLength={6}
                    />
                    <Field
                        label="Confirm new password"
                        icon={Lock}
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        required
                    />
                    <SubmitButton loading={loading} loadingLabel="Saving..." icon={CheckCircle}>
                        Update password
                    </SubmitButton>
                </form>
            )}
        </>
    );
}
