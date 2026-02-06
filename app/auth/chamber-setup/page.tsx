'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, Building2, Gavel } from 'lucide-react';

export default function ChamberSetupPage() {
    const router = useRouter();
    const { user } = useAuth();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [chamberName, setChamberName] = useState('');

    const handleCreateChamber = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!user) throw new Error('User not authenticated');

            // 1. Create Chamber
            const { data: chamber, error: chamberError } = await supabase
                .from('chambers')
                .insert({
                    name: chamberName,
                    admin_id: user.id
                })
                .select()
                .single();

            if (chamberError) throw chamberError;

            // 2. Update User with new Chamber ID
            const { error: userError } = await supabase
                .from('users')
                .update({
                    chamber_id: chamber.id,
                    // Ensure they are strictly role 'chamber_admin' (though likely already are)
                    role: 'chamber_admin',
                    onboarding_completed: true
                })
                .eq('id', user.id);

            if (userError) throw userError;

            // 3. Force reload/redirect to dashboard
            // We do a hard reload to ensure AuthContext picks up the new chamber_id from the DB
            window.location.href = '/dashboard';

        } catch (err: any) {
            console.error('Error creating chamber:', err);
            setError(err.message || 'Failed to create chamber');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
                <div className="space-y-2 text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
                        Establish <br /> <span className="text-blue-600 italic">Chamber.</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm italic">
                        Create your new digital legal workspace.
                    </p>
                </div>

                <form onSubmit={handleCreateChamber} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                            Chamber / Firm Name
                        </label>
                        <Input
                            value={chamberName}
                            onChange={(e) => setChamberName(e.target.value)}
                            placeholder="e.g. Suits & Co."
                            required
                            className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02] shadow-xl shadow-blue-500/20 italic"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                Establishing...
                            </>
                        ) : (
                            <>
                                Create Workspace
                                <ArrowRight className="w-5 h-5 ml-3" />
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
