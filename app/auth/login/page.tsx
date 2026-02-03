'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { session, error } = await signIn(email, password);

      if (error) {
        console.log(error);
        setError(error.message || 'Failed to sign in');
        setLoading(false);
        return;
      }

      // Force hard navigation to ensure cookies are fresh
      window.location.href = '/dashboard';
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
      <div className="space-y-2">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Welcome <br /> <span className="text-blue-600 italic">Back.</span></h1>
        <p className="text-slate-500 font-medium text-sm italic">
          Enter credentials to access your legal workspace.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {message && (
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2 italic">
            <span className="opacity-50 underline italic">Notice:</span> {message}
          </div>
        )}

        {error && (
          <div className="flex gap-3 items-start p-4 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 animate-in zoom-in-95 italic">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-5 italic">
          <div className="space-y-2 italic">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="name@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
            />
          </div>

          <div className="space-y-2 italic">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                Secure Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 underline underline-offset-4 italic"
              >
                Forgot?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
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
              Verifying Access...
            </>
          ) : (
            <>
              Enter Workspace
              <ArrowRight className="w-5 h-5 ml-3" />
            </>
          )}
        </Button>
      </form>

      <div className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 italic">
        New here?{' '}
        <Link
          href="/auth/signup"
          className="text-blue-600 hover:text-blue-700 underline underline-offset-4 font-black italic"
        >
          Request Access
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
