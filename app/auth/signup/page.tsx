'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, Check, ArrowRight, Building, Gavel, User } from 'lucide-react';
import { UserRole } from '@/lib/contexts/auth-context';

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground">
          How will you be using Apna Waqeel?
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-6">
        {error && (
          <div className="flex gap-2 items-start p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-in zoom-in-95">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedRole === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedRole(option.id)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] outline-none ring-offset-2 focus:ring-2 ring-primary/20 ${isSelected
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`p-3 rounded-full transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-[11px] leading-tight text-muted-foreground">{option.description}</div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-primary">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Full Name</label>
            <Input
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Email</label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Confirm</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                className="h-11"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 transition-all"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
          >
            Sign in
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
