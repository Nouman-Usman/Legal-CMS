'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Loader2, Check } from 'lucide-react';
import { DashAlert, DashField, DashPage, PageHeader, Panel } from '@/components/dashboard/ui';

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
        <DashPage>
            <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
                <PageHeader title="Set Up Your Chamber" description="Create your law firm profile to start managing lawyers and cases" />
                <Panel>
                    <form onSubmit={handleSubmit} className="l-form">
                        {error && <DashAlert>{error}</DashAlert>}
                        <DashField
                            label="Chamber Name *"
                            placeholder="e.g., Khan & Associates Law Firm"
                            value={chamber.name}
                            onChange={(e) => setChamber({ ...chamber, name: e.target.value })}
                            required
                        />
                        <DashField
                            label="Office Address"
                            placeholder="e.g., 123 Legal Street, Lahore"
                            value={chamber.address}
                            onChange={(e) => setChamber({ ...chamber, address: e.target.value })}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DashField label="Phone" type="tel" placeholder="+92 42 1234567" value={chamber.phone} onChange={(e) => setChamber({ ...chamber, phone: e.target.value })} />
                            <DashField label="Email" type="email" placeholder="info@lawfirm.com" value={chamber.email} onChange={(e) => setChamber({ ...chamber, email: e.target.value })} disabled />
                        </div>
                        <button type="submit" disabled={loading || !chamber.name} className="l-btn l-btn--primary">
                            {loading ? (
                                <>
                                    <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> Creating Chamber...
                                </>
                            ) : (
                                <>
                                    <Check aria-hidden="true" className="w-4 h-4" /> Create Chamber
                                </>
                            )}
                        </button>
                    </form>
                </Panel>
            </div>
        </DashPage>
    );
}
