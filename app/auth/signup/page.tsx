'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, Check, ArrowRight, Building, Gavel, User } from 'lucide-react';
import { UserRole } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils';

const roleOptions: Array<{ id: UserRole; label: string; description: string; icon: React.ElementType }> = [
  {
    id: 'chamber_admin',
    label: 'Create Chamber',
    description: 'For Law Firms & Partners',
    icon: Building,
  },
  {
    id: 'client',
    label: 'Find Legal Help',
    description: 'For Clients & Seekers',
    icon: User,
  },
];

function SignupContent() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('client'); // Default to client
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
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
      const { user, error } = await signUp(email, password, fullName, selectedRole);

      if (error) {
        setError(error.message || 'Failed to sign up');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login?message=Check your email to verify your account');
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
        <div className="rounded-full bg-green-100 p-3 ring-8 ring-green-50">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
          <p className="text-muted-foreground max-w-sm">
            We've sent a verification link to <span className="font-medium text-foreground">{email}</span>. Please verify your account to continue.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/auth/login')} className="w-full">
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
      <div className="space-y-2">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Create <br /> <span className="text-blue-600 italic">Account.</span></h1>
        <p className="text-slate-500 font-medium text-sm italic">
          How will you be using Apna Waqeel?
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-8">
        {error && (
          <div className="flex gap-3 items-start p-4 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 animate-in zoom-in-95 italic text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedRole === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedRole(option.id)}
                  className={cn(
                    "relative p-6 rounded-[32px] border transition-all text-left group overflow-hidden italic",
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20"
                      : "bg-slate-50/50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-500"
                  )}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                      isSelected ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm text-blue-600"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-black uppercase tracking-tighter text-lg leading-none">{option.label}</div>
                      <div className={cn(
                        "text-[10px] font-bold uppercase tracking-widest leading-tight",
                        isSelected ? "text-blue-100" : "text-slate-400"
                      )}>{option.description}</div>
                    </div>
                    {isSelected && (
                      <div className="ml-auto">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Icon className="w-20 h-20" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2 italic">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Full Identity Name</label>
            <Input
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
              className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
            />
          </div>

          <div className="space-y-2 italic text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Legal Professional Email</label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 italic text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Password</label>
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

            <div className="space-y-2 italic text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Confirm</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:ring-blue-500 font-medium italic"
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
              Creating Identity...
            </>
          ) : (
            <>
              Initialize Account
              <ArrowRight className="w-5 h-5 ml-3" />
            </>
          )}
        </Button>

        <div className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 italic">
          Already verified?{' '}
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-700 underline underline-offset-4 font-black italic transition-colors"
          >
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
