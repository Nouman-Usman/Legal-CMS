'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';

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
                    
                    if (accessToken && type === 'recovery') {
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {step === 'password' ? 'Set Your Password' : 'Complete Your Profile'}
                    </CardTitle>
                    <CardDescription>
                        {step === 'password'
                            ? 'Create a secure password for your account'
                            : 'Tell us a bit more about yourself'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {step === 'password' ? (
                        <form onSubmit={handlePasswordSetup} className="space-y-4">
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Enter your password"
                                />
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Confirm your password"
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Setting Password...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Continue
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleProfileSetup} className="space-y-4">
                            <div>
                                <Label htmlFor="full_name">Full Name *</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                    placeholder="Your full name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    placeholder="+92 300 1234567"
                                />
                            </div>

                            <div>
                                <Label htmlFor="specialization">Specialization *</Label>
                                <Input
                                    id="specialization"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    required
                                    placeholder="e.g., Corporate Law, Family Law"
                                />
                            </div>

                            <div>
                                <Label htmlFor="bar_number">Bar Registration Number</Label>
                                <Input
                                    id="bar_number"
                                    value={formData.bar_number}
                                    onChange={(e) => setFormData({ ...formData, bar_number: e.target.value })}
                                    placeholder="Your bar number (optional)"
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Completing Profile...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Complete Setup
                                    </>
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
