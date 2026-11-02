'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock } from 'lucide-react';
import { AuthAlert, AuthHeading, Field, SubmitButton } from '@/components/auth/auth-ui';

export default function LawyerOnboardingPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'password' | 'profile'>('password');
    /** Munshis (clerks) have no specialization or bar registration. */
    const [isMunshi, setIsMunshi] = useState(false);

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

                // 2. Tokens in the hash: invite / magic-link / recovery emails (links made by
                // admin.generateLink use the implicit flow, so they never carry a PKCE code).
                const hash = window.location.hash;
                console.log('Hash content:', hash ? `present (${hash.length} chars)` : 'empty');
                const hashParams = new URLSearchParams(hash.substring(1));

                if (hashParams.get('error')) {
                    // e.g. otp_expired: the link was already used or is older than 24 hours.
                    window.history.replaceState({}, document.title, '/auth/onboarding');
                    setError(
                        hashParams.get('error_code') === 'otp_expired'
                            ? 'This invite link has expired or was already used. Ask your chamber admin to resend the invite.'
                            : hashParams.get('error_description')?.replace(/\+/g, ' ') || 'This link could not be used.',
                    );
                    setLoading(false);
                    return;
                }

                if (hash && hash.includes('access_token')) {
                    console.log('Found token in hash, attempting to establish session...');

                    const accessToken = hashParams.get('access_token');
                    const refreshToken = hashParams.get('refresh_token');
                    const type = hashParams.get('type');

                    console.log('Token type:', type);

                    if (accessToken && ['invite', 'magiclink', 'recovery', 'signup'].includes(type ?? '')) {
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
                                window.history.replaceState({}, document.title, '/auth/onboarding');
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
                        // Setting a password needs the session from the invite link.
                        console.log('No session found');
                        setError('Open this page from the link in your invitation email. If the link has expired, ask your chamber admin to resend the invite.');
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

        if (profile?.onboarding_completed) {
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
                setIsMunshi(profile.role === 'munshi');
                const { data: practice } = await supabase.from('lawyers').select('specialization, bar_number').eq('user_id', profile.id).maybeSingle();
                setFormData({
                    full_name: profile.full_name || '',
                    phone: profile.phone || '',
                    specialization: practice?.specialization || '',
                    bar_number: practice?.bar_number || ''
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
                    setIsMunshi(profile.role === 'munshi');
                    const { data: practice } = await supabase.from('lawyers').select('specialization, bar_number').eq('user_id', profile.id).maybeSingle();
                    setFormData({
                        full_name: profile.full_name || '',
                        phone: profile.phone || '',
                        specialization: practice?.specialization || '',
                        bar_number: practice?.bar_number || ''
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

            // Practice details live on the lawyer profile (munshis have none).
            if (!isMunshi) {
                const practice = { specialization: formData.specialization || null, bar_number: formData.bar_number || null };
                const { data: updated, error: lawyerError } = await supabase.from('lawyers').update(practice).eq('user_id', user.id).select('id');
                if (lawyerError) throw lawyerError;
                if (!updated?.length) {
                    const { error: insertError } = await supabase.from('lawyers').insert({ user_id: user.id, ...practice });
                    if (insertError) throw insertError;
                }
            }

            // Marked complete last, so a failure above leaves the profile step open.
            const { error: updateError } = await supabase
                .from('users')
                .update({ full_name: formData.full_name, phone: formData.phone, onboarding_completed: true })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Done: the dashboard and the team roster read onboarding_completed.
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AuthHeading
                lines={step === 'password' ? ['Secure', 'your account.'] : ['Finish', 'your profile.']}
                intro={step === 'password' ? 'Set a secure password for your new workspace.' : isMunshi ? 'Welcome to the chamber. Confirm your name and number.' : 'Welcome to the firm. Tell us about your expertise.'}
            />

            {error && <AuthAlert>{error}</AuthAlert>}

            {step === 'password' ? (
                <form onSubmit={handlePasswordSetup} className="l-auth__stack">
                    <Field
                        label="Password"
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
                        label="Confirm password"
                        icon={Lock}
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        required
                    />
                    <SubmitButton loading={loading} loadingLabel="Saving...">
                        Continue setup
                    </SubmitButton>
                </form>
            ) : (
                <form onSubmit={handleProfileSetup} className="l-auth__stack">
                    <Field
                        label="Full name"
                        autoComplete="name"
                        placeholder="John Doe"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        disabled={loading}
                        required
                    />
                    <Field
                        label="Contact number"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+92 300 1234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={loading}
                        required
                    />
                    {!isMunshi && (
                        <>
                            <Field
                                label="Specialization"
                                placeholder="e.g., Corporate Law, Family Law"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                disabled={loading}
                                required
                            />
                            <Field
                                label="Bar registration (optional)"
                                placeholder="Registration number"
                                value={formData.bar_number}
                                onChange={(e) => setFormData({ ...formData, bar_number: e.target.value })}
                                disabled={loading}
                            />
                        </>
                    )}
                    <SubmitButton loading={loading} loadingLabel="Saving...">
                        Enter dashboard
                    </SubmitButton>
                </form>
            )}
        </>
    );
}
