'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

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

    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
        <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Security <br /> <span className="text-blue-600 italic">Update.</span></h1>
            <p className="text-slate-500 font-medium text-sm italic">
                Set a new secure password for your workspace.
            </p>
        </div>

        {success ? (
            <div className="space-y-8 py-4">
                <div className="flex justify-center">
                    <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                        <CheckCircle className="w-12 h-12 text-emerald-600" />
                    </div>
                </div>
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Update Complete</h2>
                    <p className="text-slate-500 font-medium italic">
                        Redirecting you to the command center...
                    </p>
                </div>
            </div>
        ) : !sessionReady ? (
            <div className="space-y-8 py-12 flex flex-col items-center">
                {error ? (
                    <div className="space-y-6 w-full italic">
                        <div className="flex gap-3 items-start p-4 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 italic">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02] shadow-xl italic"
                        >
                            Return to Login
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 italic">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifying Identity...</p>
                    </div>
                )}
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="flex gap-3 items-start p-4 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 italic">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="space-y-5 italic">
                    <div className="space-y-2 italic text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                            New Secure Password
                        </label>
                        <div className="relative italic">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="pl-12 h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2 italic text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                            Confirm New Password
                        </label>
                        <div className="relative italic">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="pl-12 h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02] shadow-xl shadow-blue-500/20 italic"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            Securing...
                        </>
                    ) : (
                        <>
                            Complete Vault Update
                            <CheckCircle className="w-5 h-5 ml-3" />
                        </>
                    )}
                </Button>
            </form>
        )}
    </div>
}
