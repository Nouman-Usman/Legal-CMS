'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
                <Card className="w-full max-w-md shadow-lg border-t-4 border-t-green-500">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-center font-bold text-2xl">Password Updated</CardTitle>
                        <CardDescription className="text-center">
                            Your password has been changed successfully. Redirecting you to the dashboard...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!sessionReady) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Setting Up Your Password</CardTitle>
                        <CardDescription className="text-center">
                            {error ? 'There was an issue...' : 'Please wait while we process your invitation...'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error ? (
                            <div className="space-y-4">
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                                <Button 
                                    onClick={() => router.push('/auth/login')}
                                    className="w-full"
                                >
                                    Go to Login
                                </Button>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Set Your Password</CardTitle>
                    <CardDescription className="text-center">
                        Create a secure password for your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9"
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-9"
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Continue
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
