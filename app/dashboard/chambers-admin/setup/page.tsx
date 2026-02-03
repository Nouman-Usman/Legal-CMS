'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Building2, Check } from 'lucide-react';

export default function ChamberSetupPage() {
    const router = useRouter();
    const { user, loading: authLoading, userRole } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [chamber, setChamber] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
    });

    useEffect(() => {
        // If not authenticated, redirect to login
        if (!authLoading && !user) {
            router.push('/auth/login');
            return;
        }

        // If not a chamber admin, redirect to main dashboard
        if (!authLoading && user && userRole !== 'chamber_admin') {
            router.push('/dashboard');
            return;
        }

        // If user already has a chamber, redirect to dashboard
        if (!authLoading && user?.chamber_id) {
            router.push('/dashboard/chambers-admin');
            return;
        }

        // Pre-fill email with user's email
        if (user?.email && !chamber.email) {
            setChamber(prev => ({ ...prev, email: user.email || '' }));
        }
    }, [user, authLoading, userRole, router, chamber.email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Create the chamber
            const { data: chamberData, error: chamberError } = await supabase
                .from('chambers')
                .insert({
                    name: chamber.name,
                    address: chamber.address,
                    phone: chamber.phone,
                    email: chamber.email || user?.email,
                    admin_id: user?.id,
                })
                .select()
                .single();

            if (chamberError) throw chamberError;

            // Update the user's chamber_id
            const { error: userError } = await supabase
                .from('users')
                .update({ chamber_id: chamberData.id })
                .eq('id', user?.id);

            if (userError) throw userError;

            // Redirect to dashboard
            router.push('/dashboard/chambers-admin');
            router.refresh();
        } catch (err: any) {
            console.error('Error creating chamber:', err);
            setError(err.message || 'Failed to create chamber');
        } finally {
            setLoading(false);
        }
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // If not authenticated or wrong role, don't render (will redirect)
    if (!user || userRole !== 'chamber_admin') {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Set Up Your Chamber</CardTitle>
                    <CardDescription>
                        Create your law firm profile to start managing lawyers and cases
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Chamber Name *</label>
                            <Input
                                placeholder="e.g., Khan & Associates Law Firm"
                                value={chamber.name}
                                onChange={(e) => setChamber({ ...chamber, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Office Address</label>
                            <Input
                                placeholder="e.g., 123 Legal Street, Lahore"
                                value={chamber.address}
                                onChange={(e) => setChamber({ ...chamber, address: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone</label>
                                <Input
                                    placeholder="+92 42 1234567"
                                    value={chamber.phone}
                                    onChange={(e) => setChamber({ ...chamber, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    placeholder="info@lawfirm.com"
                                    value={chamber.email}
                                    onChange={(e) => setChamber({ ...chamber, email: e.target.value })}
                                    disabled
                                    className="bg-muted text-muted-foreground opacity-100" // ensure it looks disabled but readable
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading || !chamber.name}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating Chamber...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Create Chamber
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
