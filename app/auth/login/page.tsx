'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/supabase/auth';
import { Loader2 } from 'lucide-react';
import { AuthAlert, AuthHeading, Field, SubmitButton } from '@/components/auth/auth-ui';

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
    <>
      <AuthHeading lines={['Welcome', 'back.']} intro="Enter credentials to access your legal workspace." />

      <form onSubmit={handleLogin} className="l-auth__stack">
        {message && <AuthAlert tone="notice">{message}</AuthAlert>}
        {error && <AuthAlert>{error}</AuthAlert>}

        <Field
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="name@firm.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          aside={<Link href="/auth/forgot-password">Forgot?</Link>}
        />

        <SubmitButton loading={loading} loadingLabel="Verifying access...">
          Enter workspace
        </SubmitButton>
      </form>

      <p className="l-auth__note">
        New here? <Link href="/auth/signup">Create an account</Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="l-auth__state">
        <Loader2 aria-hidden="true" className="w-8 h-8 l-auth__spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
