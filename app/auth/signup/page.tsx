'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/supabase/auth';
import { Loader2, Check, Building, MailCheck, User } from 'lucide-react';
import { AuthAlert, AuthHeading, AuthState, Field, SubmitButton } from '@/components/auth/auth-ui';
import { parseSignupRole, type SignupRole } from '@/lib/landing/signup-role';

const roleOptions: Array<{ id: SignupRole; label: string; description: string; icon: React.ElementType }> = [
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
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<SignupRole>(parseSignupRole(searchParams.get('role')) ?? 'client'); // Default to client
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
      <AuthState icon={MailCheck} title="Check your email">
        <p>
          We&apos;ve sent a verification link to <strong>{email}</strong>. Please verify your account to continue.
        </p>
        <Link href="/auth/login" className="l-btn l-btn--outline l-auth__submit">
          Back to login
        </Link>
      </AuthState>
    );
  }

  return (
    <>
      <AuthHeading lines={['Create', 'account.']} intro="How will you be using Apna Waqeel?" />

      <form onSubmit={handleSignUp} className="l-auth__stack">
        {error && <AuthAlert>{error}</AuthAlert>}

        <fieldset className="l-roles">
          <legend className="l-label">I am</legend>
          {roleOptions.map((option) => {
            const Icon = option.icon;
            return (
              <label key={option.id} className="l-role">
                <input
                  type="radio"
                  name="role"
                  value={option.id}
                  checked={selectedRole === option.id}
                  onChange={() => setSelectedRole(option.id)}
                  disabled={loading}
                />
                <span className="l-role__icon">
                  <Icon aria-hidden="true" className="w-5 h-5" />
                </span>
                <span className="l-role__text">
                  <span className="l-role__label">{option.label}</span>
                  <span className="l-label">{option.description}</span>
                </span>
                <Check aria-hidden="true" className="w-5 h-5 l-role__check" />
              </label>
            );
          })}
        </fieldset>

        <Field
          label="Full name"
          autoComplete="name"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
          required
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <div className="l-auth__pair">
          <Field
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            minLength={6}
          />
          <Field
            label="Confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <SubmitButton loading={loading} loadingLabel="Creating account...">
          Create account
        </SubmitButton>
      </form>

      <p className="l-auth__note">
        Already have an account? <Link href="/auth/login">Sign in</Link>
      </p>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="l-auth__state">
        <Loader2 aria-hidden="true" className="w-8 h-8 l-auth__spin" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
