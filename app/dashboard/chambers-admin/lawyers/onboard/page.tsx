'use client';

import React, { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { ArrowLeft, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { DashAlert, DashPage, PageHeader, Panel } from '@/components/dashboard/ui';
import Link from 'next/link';

// Practice areas extracted from Find Lawyers page
const practiceAreas = [
  'Criminal Law',
  'Family Law',
  'Corporate Law',
  'Immigration',
  'Personal Injury',
  'Real Estate',
  'Divorce',
  'DUI Defense',
  'Business Formation',
  'Medical Malpractice',
  'Custody Cases',
  'M&A',
].sort((a, b) => a.localeCompare(b));

interface LawyerProfile {
  licenseNumber: string;
  practiceAreas: string[];
  tagline: string;
  bio?: string;
  yearsOfExperience?: number;
  phone?: string;
}

export default function LawyerOnboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<LawyerProfile>({
    licenseNumber: '',
    practiceAreas: [],
    tagline: '',
    bio: '',
    yearsOfExperience: undefined,
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof LawyerProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const togglePracticeArea = (area: string) => {
    setProfile(prev => ({
      ...prev,
      practiceAreas: prev.practiceAreas.includes(area)
        ? prev.practiceAreas.filter(a => a !== area)
        : [...prev.practiceAreas, area],
    }));
    if (errors.practiceAreas) {
      setErrors(prev => ({
        ...prev,
        practiceAreas: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profile.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }

    if (profile.practiceAreas.length === 0) {
      newErrors.practiceAreas = 'Select at least one practice area';
    }

    if (!profile.tagline.trim()) {
      newErrors.tagline = 'Tagline is required';
    } else if (profile.tagline.length < 10) {
      newErrors.tagline = 'Tagline must be at least 10 characters';
    } else if (profile.tagline.length > 100) {
      newErrors.tagline = 'Tagline must be less than 100 characters';
    }

    if (profile.yearsOfExperience && profile.yearsOfExperience < 0) {
      newErrors.yearsOfExperience = 'Years of experience must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (!user?.id) {
        setErrors({ submit: 'User not authenticated' });
        return;
      }

      // Update user with lawyer profile data
      const { error } = await supabase
        .from('users')
        .update({
          lawyer_profile: profile,
          onboarding_completed: true,
          specialization: profile.practiceAreas.join(', '),
          bar_number: profile.licenseNumber,
          phone: profile.phone,
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setSuccess(true);
      // Redirect to lawyer dashboard after successful save
      setTimeout(() => {
        router.push('/dashboard/lawyer');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setErrors({ submit: error.message || 'Failed to save profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <DashPage>
        <PageHeader
          title="Lawyer Onboarding"
          description="Complete your professional profile"
          actions={
            <Link href="/dashboard/chambers-admin/lawyers" className="l-btn l-btn--outline l-btn--compact">
              <ArrowLeft aria-hidden="true" className="w-4 h-4" /> Back
            </Link>
          }
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-3xl w-full">
          {success && (
            <p className="l-dash-alert l-dash-alert--ok" role="status">
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 shrink-0" /> Profile saved successfully!
            </p>
          )}
          {errors.submit && <DashAlert>{errors.submit}</DashAlert>}

          <Panel title="License Information">
            <div className="l-form">
              <p className="m-0 text-sm l-muted">Your professional credentials</p>
              <FieldWithError label="License Number *" error={errors.licenseNumber}>
                {(id, describedBy) => (
                  <input
                    id={id}
                    className="l-dash-input"
                    placeholder="e.g., BAR-001234"
                    value={profile.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    aria-invalid={!!errors.licenseNumber}
                    aria-describedby={describedBy}
                  />
                )}
              </FieldWithError>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWithError label="Years of Experience" error={errors.yearsOfExperience}>
                  {(id, describedBy) => (
                    <input
                      id={id}
                      type="number"
                      className="l-dash-input"
                      placeholder="e.g., 10"
                      value={profile.yearsOfExperience || ''}
                      onChange={(e) => handleInputChange('yearsOfExperience', e.target.value ? parseInt(e.target.value) : undefined)}
                      aria-invalid={!!errors.yearsOfExperience}
                      aria-describedby={describedBy}
                    />
                  )}
                </FieldWithError>
                <FieldWithError label="Phone Number">
                  {(id) => (
                    <input
                      id={id}
                      type="tel"
                      className="l-dash-input"
                      placeholder="e.g., +1-555-0123"
                      value={profile.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  )}
                </FieldWithError>
              </div>
            </div>
          </Panel>

          <Panel title="Practice Areas *">
            <fieldset className="flex flex-col gap-4 m-0 p-0 border-0">
              <legend className="text-sm l-muted mb-3">Select all areas you specialize in</legend>
              <div className="flex flex-wrap gap-2">
                {practiceAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => togglePracticeArea(area)}
                    aria-pressed={profile.practiceAreas.includes(area)}
                    className="l-filter"
                  >
                    {profile.practiceAreas.includes(area) && <CheckCircle2 aria-hidden="true" className="w-4 h-4 inline -mt-0.5 mr-1" />}
                    {area}
                  </button>
                ))}
              </div>
              {errors.practiceAreas && <p className="m-0 text-sm text-destructive">{errors.practiceAreas}</p>}
              <p className="m-0 text-sm l-muted">
                Selected: {profile.practiceAreas.length > 0 ? profile.practiceAreas.join(', ') : 'None'}
              </p>
            </fieldset>
          </Panel>

          <Panel title="Professional Details *">
            <div className="l-form">
              <p className="m-0 text-sm l-muted">How clients will find and connect with you</p>
              <FieldWithError
                label="Tagline / Headline"
                error={errors.tagline}
                hint="This appears on your profile and helps clients understand your expertise"
                counter={`${profile.tagline.length}/100`}
              >
                {(id, describedBy) => (
                  <input
                    id={id}
                    className="l-dash-input"
                    placeholder="e.g., Expert in criminal defense with 15 years of experience"
                    value={profile.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    maxLength={100}
                    aria-invalid={!!errors.tagline}
                    aria-describedby={describedBy}
                  />
                )}
              </FieldWithError>
              <FieldWithError label="Bio / About You" hint="Optional but recommended for better client matching">
                {(id, describedBy) => (
                  <textarea
                    id={id}
                    className="l-dash-input"
                    placeholder="Tell clients about your background, achievements, and approach to legal practice..."
                    value={profile.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    aria-describedby={describedBy}
                  />
                )}
              </FieldWithError>
            </div>
          </Panel>

          <div className="l-dialog-actions">
            <Link href="/dashboard/chambers-admin/lawyers" className="l-btn l-btn--outline l-btn--compact">
              Cancel
            </Link>
            <button type="submit" className="l-btn l-btn--primary l-btn--compact" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save aria-hidden="true" className="w-4 h-4" /> Save Profile
                </>
              )}
            </button>
          </div>
        </form>

        <p className="m-0 max-w-3xl text-sm l-muted">
          <strong className="l-ink">Tip:</strong> A compelling tagline and bio help clients find the right lawyer. Be specific about your expertise and approach.
        </p>
      </DashPage>
    </ProtectedRoute>
  );
}

/** Label + control + optional hint/error, with ids wired for screen readers. */
function FieldWithError({
  label,
  error,
  hint,
  counter,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  counter?: string;
  children: (id: string, describedBy: string | undefined) => React.ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="l-dash-field">
      <div className="flex justify-between gap-3">
        <label htmlFor={id} className="l-label">
          {label}
        </label>
        {counter && <span className="text-xs l-muted">{counter}</span>}
      </div>
      {children(id, describedBy)}
      {hint && (
        <p id={hintId} className="m-0 text-xs l-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="m-0 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
