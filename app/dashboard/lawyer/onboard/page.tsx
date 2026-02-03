'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, AlertCircle, CheckCircle2, Briefcase, LogOut } from 'lucide-react';

// Practice areas extracted dynamically
const practiceAreas = [
    'Criminal Law',
    'Custody Cases',
    'Divorce',
    'DUI Defense',
    'Business Formation',
    'Corporate Law',
    'Family Law',
    'Immigration',
    'M&A',
    'Medical Malpractice',
    'Personal Injury',
    'Real Estate',
].sort((a, b) => a.localeCompare(b));

// Punjab cities
const punjabCities = [
    'Lahore',
    'Faisalabad',
    'Rawalpindi',
    'Multan',
    'Gujranwala',
    'Sialkot',
    'Bahawalpur',
    'Sargodha',
    'Gujrat',
    'Jhelum',
    'Sheikhupura',
    'Okara',
    'Kasur',
    'Wazirabad',
    'Jhang',
    'Rahim Yar Khan',
    'Sahiwal',
    'Attock',
    'Chakwal',
    'Chiniot',
].sort((a, b) => a.localeCompare(b));

interface LawyerProfile {
    licenseNumber: string;
    practiceAreas: string[];
    tagline: string;
    location?: string;
    bio?: string;
    yearsOfExperience?: number;
    phone?: string;
}

export default function LawyerOnboardingPage() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<LawyerProfile>({
        licenseNumber: '',
        practiceAreas: [],
        tagline: '',
        location: '',
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

        if (!profile.location?.trim()) {
            newErrors.location = 'Location is required';
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
        <ProtectedRoute requiredRole="lawyer">
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-50/50 dark:from-slate-950 dark:to-slate-950/50 p-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Welcome to Apna Waqeel</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">Complete your professional profile to start accepting cases</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Success Alert */}
                        {success && (
                            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertDescription className="text-green-800 dark:text-green-400">
                                    Profile saved successfully! Redirecting...
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Error Alert */}
                        {errors.submit && (
                            <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <AlertDescription className="text-red-800 dark:text-red-400">
                                    {errors.submit}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* License Information Card */}
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Briefcase className="w-5 h-5" />
                                    License Information
                                </CardTitle>
                                <CardDescription>Your professional credentials</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="licenseNumber" className="text-slate-700 dark:text-slate-300 font-medium">
                                        License Number *
                                    </Label>
                                    <Input
                                        id="licenseNumber"
                                        placeholder="e.g., BAR-001234"
                                        value={profile.licenseNumber}
                                        onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                                        className={`bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${errors.licenseNumber ? 'border-red-500' : ''
                                            }`}
                                    />
                                    {errors.licenseNumber && (
                                        <p className="text-sm text-red-600 dark:text-red-400">{errors.licenseNumber}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="yearsOfExperience" className="text-slate-700 dark:text-slate-300 font-medium">
                                            Years of Experience
                                        </Label>
                                        <Input
                                            id="yearsOfExperience"
                                            type="number"
                                            placeholder="e.g., 10"
                                            value={profile.yearsOfExperience || ''}
                                            onChange={(e) => handleInputChange('yearsOfExperience', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                        />
                                        {errors.yearsOfExperience && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errors.yearsOfExperience}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium">
                                            Phone Number
                                        </Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="e.g., +1-555-0123"
                                            value={profile.phone || ''}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-slate-700 dark:text-slate-300 font-medium">
                                        Location (Punjab) *
                                    </Label>
                                    <select
                                        id="location"
                                        value={profile.location || ''}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a city...</option>
                                        {punjabCities.map((city) => (
                                            <option key={city} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.location && (
                                        <p className="text-sm text-red-600 dark:text-red-400">{errors.location}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Practice Areas Card */}
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-900 dark:text-white">Practice Areas *</CardTitle>
                                <CardDescription>Select all areas you specialize in</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {practiceAreas.map((area) => (
                                        <button
                                            key={area}
                                            type="button"
                                            onClick={() => togglePracticeArea(area)}
                                            className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${profile.practiceAreas.includes(area)
                                                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${profile.practiceAreas.includes(area)
                                                        ? 'border-blue-600 dark:border-blue-500 bg-blue-600 dark:bg-blue-500'
                                                        : 'border-slate-300 dark:border-slate-600'
                                                    }`}>
                                                    {profile.practiceAreas.includes(area) && (
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {area}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {errors.practiceAreas && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.practiceAreas}</p>
                                )}
                                <div className="pt-2">
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Selected: {profile.practiceAreas.length > 0 ? profile.practiceAreas.join(', ') : 'None'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Professional Details Card */}
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-lg text-slate-900 dark:text-white">Professional Details *</CardTitle>
                                <CardDescription>How clients will find and connect with you</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <Label htmlFor="tagline" className="text-slate-700 dark:text-slate-300 font-medium">
                                            Tagline / Headline
                                        </Label>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {profile.tagline.length}/100
                                        </span>
                                    </div>
                                    <Input
                                        id="tagline"
                                        placeholder="e.g., Expert in criminal defense with 15 years of experience"
                                        value={profile.tagline}
                                        onChange={(e) => handleInputChange('tagline', e.target.value)}
                                        maxLength={100}
                                        className={`bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${errors.tagline ? 'border-red-500' : ''
                                            }`}
                                    />
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        This appears on your profile and helps clients understand your expertise
                                    </p>
                                    {errors.tagline && (
                                        <p className="text-sm text-red-600 dark:text-red-400">{errors.tagline}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio" className="text-slate-700 dark:text-slate-300 font-medium">
                                        Bio / About You
                                    </Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Tell clients about your background, achievements, and approach to legal practice..."
                                        value={profile.bio || ''}
                                        onChange={(e) => handleInputChange('bio', e.target.value)}
                                        rows={4}
                                        className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Optional but recommended for better client matching
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Form Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={signOut}
                                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Complete Onboarding
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Info Box */}
                    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                        <CardContent className="pt-6">
                            <p className="text-sm text-blue-900 dark:text-blue-400">
                                <span className="font-semibold">💡 Tip:</span> Complete your onboarding to become visible to clients. A compelling tagline and bio help clients find the right lawyer for their needs.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    );
}
