'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function LawyerOnboardingPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'password' | 'profile'>('password');

    // Form state
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        specialization: '',
        bar_number: ''
    });

    useEffect(() => {
        const handleAuth = async () => {
            try {
                console.log('Checking auth...');

                // 1. Check for PKCE code in URL
                const params = new URLSearchParams(window.location.search);
                const code = params.get('code');

                if (code) {
                    console.log('Found code, exchanging for session...');
                    try {
                        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                        if (error) {
                            console.error('Code exchange failed:', error);
                            setError('Invalid or expired link. Please request a new invite.');
                            return;
                        }
                        if (data.session) {
                            console.log('Session established via code');
                            window.history.replaceState({}, document.title, window.location.pathname);
                            checkProfile(data.session);
                            return;
                        }
                    } catch (err) {
                        console.error('Code exchange exception:', err);
                    }
                }

                // 2. Check for recovery token in hash (from email links)
                const hash = window.location.hash;
                console.log('Hash content:', hash ? `present (${hash.length} chars)` : 'empty');

                if (hash && hash.includes('access_token')) {
                    console.log('Found recovery token in hash, attempting to establish session...');

                    // Parse the hash to extract token data
                    const hashParams = new URLSearchParams(hash.substring(1));
                    const accessToken = hashParams.get('access_token');
                    const refreshToken = hashParams.get('refresh_token');
                    const type = hashParams.get('type');

                    console.log('Token type:', type);

                    if (accessToken && (type === 'recovery' || type === 'invite' || type === 'magiclink')) {
                        try {
                            // Manually set the session with the recovery token
                            const { data, error } = await supabase.auth.setSession({
                                access_token: accessToken,
                                refresh_token: refreshToken || '',
                            });

                            if (error) {
                                console.error('setSession error:', error);
                                setError('Failed to establish session: ' + error.message);
                                setLoading(false);
                                return;
                            }

                            if (data.session) {
                                console.log('Session successfully set from recovery token!');
                                window.history.replaceState({}, document.title);
                                checkProfile(data.session);
                                return;
                            }
                        } catch (err: any) {
                            console.error('Error setting session:', err);
                            setError('Failed to process recovery token: ' + err.message);
                            setLoading(false);
                            return;
                        }
                    }
                }

                // 3. Check for existing session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) {
                    console.error('getSession error:', sessionError);
                    setError('Failed to check session: ' + sessionError.message);
                    setLoading(false);
                    return;
                }

                if (session) {
                    console.log('Session exists');
                    checkProfile(session);
                    return;
                }

                // 4. Listen for auth state changes
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                    console.log('Auth event:', event, '| Has session:', !!session);
                    if (session) {
                        console.log('Session found, checking profile...');
                        checkProfile(session);
                    } else if (!code && !hash) {
                        console.log('No session found, showing password step');
                        setStep('password');
                        setLoading(false);
                    }
                });

                return () => {
                    subscription.unsubscribe();
                };
            } catch (err) {
                console.error('Auth setup error:', err);
                setError('An error occurred during authentication setup.');
                setLoading(false);
            }
        };

        handleAuth();
    }, []);

    const checkProfile = async (session: any) => {
        // Has session - check if profile is complete
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

        if (profile && profile.phone && profile.specialization) {
            // Profile already complete - but if they just set password (recovery), allow dashboard
            router.push('/dashboard');
        } else {
            // Need to complete profile
            // Force password step if this is a recovery session (no password set yet or reset)
            // We can check this by seeing if they can update user without error? 
            // Or just show password step first by default for safety.

            // Actually, if 'recovery' event, force password.
            // But for now, let's just default to 'password' step if we just logged in via link
            setStep('password');

            if (profile) {
                setFormData({
                    full_name: profile.full_name || '',
                    phone: profile.phone || '',
                    specialization: profile.specialization || '',
                    bar_number: profile.bar_number || ''
                });
            }
        }
        setLoading(false);
    };

    const handlePasswordSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            // Password set successfully, move to profile step
            setStep('profile');

            // Fetch existing profile data
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setFormData({
                        full_name: profile.full_name || '',
                        phone: profile.phone || '',
                        specialization: profile.specialization || '',
                        bar_number: profile.bar_number || ''
                    });
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to set password');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { error: updateError } = await supabase
                .from('users')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    specialization: formData.specialization,
                    bar_number: formData.bar_number,
                    status: 'active'
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Profile complete! Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
            <div className="space-y-2">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                    {step === 'password' ? (<>Initialize <br /> <span className="text-blue-600 italic">Security.</span></>) : (<>Finalize <br /> <span className="text-blue-600 italic">Profile.</span></>)}
                </h1>
                <p className="text-slate-500 font-medium text-sm italic">
                    {step === 'password'
                        ? 'Set a secure password for your new workspace.'
                        : 'Welcome to the firm. Tell us about your expertise.'}
                </p>
            </div>

            {error && (
                <div className="flex gap-3 items-start p-4 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 italic">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {step === 'password' ? (
                <form onSubmit={handlePasswordSetup} className="space-y-6">
                    <div className="space-y-5 italic">
                        <div className="space-y-2 italic text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                Secure Password
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
                                Confirm Password
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
                                Continue Setup
                                <ArrowRight className="w-5 h-5 ml-3" />
                            </>
                        )}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleProfileSetup} className="space-y-6">
                    <div className="space-y-4 italic text-left">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Full Identity Name</label>
                            <Input
                                placeholder="John Doe"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                                className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Contact Number</label>
                            <Input
                                type="tel"
                                placeholder="+92 300 1234567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                                className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Specialization</label>
                            <Input
                                placeholder="e.g., Corporate Law, Family Law"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                required
                                className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Bar Registration (Optional)</label>
                            <Input
                                placeholder="Registration Number"
                                value={formData.bar_number}
                                onChange={(e) => setFormData({ ...formData, bar_number: e.target.value })}
                                className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
                            />
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
                                Initializing...
                            </>
                        ) : (
                            <>
                                Enter Dashboard
                                <ArrowRight className="w-5 h-5 ml-3" />
                            </>
                        )}
                    </Button>
                </form>
            )}
        </div>
    );
}
