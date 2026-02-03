'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
        <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Forgot <br /> <span className="text-blue-600 italic">Access.</span></h1>
            <p className="text-slate-500 font-medium text-sm italic">
                Enter your email to receive a recovery link.
            </p>
        </div>

        {submitted ? (
            <div className="space-y-8 py-4">
                <div className="flex justify-center">
                    <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                        <CheckCircle className="w-12 h-12 text-emerald-600" />
                    </div>
                </div>
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Check Inbox</h2>
                    <p className="text-slate-500 font-medium italic">
                        Verification link dispatched to <span className="text-blue-600 font-black">{email}</span>
                    </p>
                </div>
                <Button
                    variant="ghost"
                    onClick={() => setSubmitted(false)}
                    className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 italic"
                >
                    Try different email
                </Button>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="flex gap-3 items-start p-4 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 italic">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="space-y-2 italic text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                        Recovery Email
                    </label>
                    <div className="relative italic">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            className="pl-12 h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
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
                            Dispatching...
                        </>
                    ) : (
                        <>
                            Send Recovery Link
                            <ArrowLeft className="w-5 h-5 ml-3 rotate-180" />
                        </>
                    )}
                </Button>
            </form>
        )}

        <div className="text-center">
            <Link href="/auth/login">
                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 gap-2 italic">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </Button>
            </Link>
        </div>
    </div>
}
