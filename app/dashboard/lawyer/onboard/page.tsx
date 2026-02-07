'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Loader2,
    Check,
    AlertCircle,
    MapPin,
    FileText,
    Upload,
    X,
    Briefcase,
    Scale,
    Award,
    User,
    ArrowRight,
} from 'lucide-react';

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
    location: string;
    bio: string;
    yearsOfExperience: number | undefined;
    phone: string;
}

export default function LawyerOnboardingPage() {
    const router = useRouter();
    const { user, loading: authLoading, refreshProfile, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState<'basic' | 'details'>('basic');

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');

    const [profile, setProfile] = useState<LawyerProfile>({
        licenseNumber: '',
        practiceAreas: [],
        tagline: '',
        location: '',
        bio: '',
        yearsOfExperience: undefined,
        phone: '',
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    const validateBasicStep = () => profile.licenseNumber.trim().length > 0 && profile.location.trim().length > 0;

    const handleBasicStepSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateBasicStep()) {
            setStep('details');
        }
    };

    const togglePracticeArea = (area: string) => {
        setProfile(prev => ({
            ...prev,
            practiceAreas: prev.practiceAreas.includes(area)
                ? prev.practiceAreas.filter(a => a !== area)
                : [...prev.practiceAreas, area],
        }));
    };

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('Profile picture must be less than 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        setError('');
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
            setAvatarPreview('');
        }
    };

    const handleFullSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            if (!profile.licenseNumber.trim()) {
                throw new Error('License number is required');
            }

            if (profile.practiceAreas.length === 0) {
                throw new Error('Select at least one practice area');
            }

            if (!profile.tagline.trim()) {
                throw new Error('Tagline is required');
            }

            let avatarUrl: string | null = null;
            if (avatarFile) {
                setUploading(true);
                const fileExt = avatarFile.name.split('.').pop() || 'jpg';
                const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const formData = new FormData();
                formData.append('file', avatarFile);
                formData.append('bucket', 'avatars');
                formData.append('path', filePath);

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Avatar upload failed');
                }

                const uploadData = await res.json();
                avatarUrl = uploadData.url || null;
                setUploading(false);
            }

            const res = await fetch('/api/lawyers/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    user_id: user.id,
                    bar_number: profile.licenseNumber,
                    specialization: profile.practiceAreas.join(', '),
                    bio: profile.bio || null,
                    experience_years: profile.yearsOfExperience || 0,
                    phone: profile.phone || null,
                    location: profile.location,
                    tagline: profile.tagline,
                    avatar_url: avatarUrl,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to save profile');
            }

            setSuccess(true);
            await refreshProfile();
            setTimeout(() => {
                router.push('/dashboard/lawyer');
                router.refresh();
            }, 1500);
        } catch (err: any) {
            console.error('Error saving profile:', err);
            setError(err.message || 'Failed to save profile');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <ProtectedRoute requiredRole="lawyer">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8 flex items-center justify-center">
                <div className="w-full max-w-3xl">
                    <div className="mb-12">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg mb-4">
                                <Scale className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 mb-3">
                                Complete Your Profile
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
                                Set up your professional lawyer profile to start accepting cases
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-sm transition-all duration-300 ${
                                    step === 'basic'
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg scale-110'
                                        : 'bg-gradient-to-br from-green-600 to-green-700 text-white'
                                }`}>
                                    {step === 'details' ? <Check className="w-6 h-6" /> : '1'}
                                </div>
                                <div className="h-1.5 flex-1 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full overflow-hidden">
                                    <div className={`h-full bg-gradient-to-r from-blue-600 to-green-600 rounded-full transition-all duration-500 ease-out ${
                                        step === 'details' ? 'w-full' : 'w-0'
                                    }`} />
                                </div>
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-sm transition-all duration-300 ${
                                    step === 'details'
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg scale-110'
                                        : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                                }`}>
                                    2
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <div>
                                    <p className={`text-sm font-bold transition-colors ${step === 'basic' ? 'text-blue-600' : 'text-slate-400'}`}>
                                        License & Location
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">Your professional credentials</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold transition-colors ${step === 'details' ? 'text-blue-600' : 'text-slate-400'}`}>
                                        Profile Details
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">Experience & specializations</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Card className="shadow-2xl border-0 dark:bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-8 md:p-10">
                            {success && (
                                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-5 w-5 text-white" />
                                            </div>
                                            <AlertDescription className="text-green-900 dark:text-green-200 font-semibold">
                                                Profile saved successfully! Setting up your dashboard...
                                            </AlertDescription>
                                        </div>
                                    </Alert>
                                </div>
                            )}

                            {error && (
                                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <Alert className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                                                <AlertCircle className="h-5 w-5 text-white" />
                                            </div>
                                            <AlertDescription className="text-red-900 dark:text-red-200 font-semibold">
                                                {error}
                                            </AlertDescription>
                                        </div>
                                    </Alert>
                                </div>
                            )}

                            {step === 'basic' ? (
                                <form onSubmit={handleBasicStepSubmit} className="space-y-8 animate-in fade-in duration-300">
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <Award className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">License Information</h3>
                                                <p className="text-xs text-slate-500">Your professional credentials</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4 bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div>
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                                                    Bar/License Number <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    placeholder="e.g., BAR-001234"
                                                    value={profile.licenseNumber}
                                                    onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                                                    className="h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                                                        Years of Experience
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g., 10"
                                                        value={profile.yearsOfExperience || ''}
                                                        onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value ? parseInt(e.target.value) : undefined })}
                                                        className="h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                                                        Phone Number
                                                    </label>
                                                    <Input
                                                        type="tel"
                                                        placeholder="+92 300 1234567"
                                                        value={profile.phone || ''}
                                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                        className="h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                                <MapPin className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">Practice Location</h3>
                                                <p className="text-xs text-slate-500">Where you practice law</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                                                City (Punjab) <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={profile.location || ''}
                                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                                required
                                            >
                                                <option value="">Select a city...</option>
                                                {punjabCities.map((city) => (
                                                    <option key={city} value={city}>
                                                        {city}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!validateBasicStep()}
                                    >
                                        Continue to Details
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleFullSubmit} className="space-y-8 animate-in fade-in duration-300">
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                <User className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">Profile Picture</h3>
                                                <p className="text-xs text-slate-500">Upload a professional photo (optional)</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                            {avatarPreview ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <img
                                                                src={avatarPreview}
                                                                alt="Profile Picture"
                                                                className="h-20 w-20 object-cover rounded-full border-4 border-white dark:border-slate-600 shadow-lg"
                                                            />
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Photo selected</p>
                                                                <p className="text-xs text-slate-500">Will be uploaded when you submit</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveAvatar}
                                                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                        >
                                                            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                                        </button>
                                                    </div>
                                                    <label className="block">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleAvatarSelect}
                                                            className="hidden"
                                                        />
                                                        <div className="py-3 px-4 bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer text-center">
                                                            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                                Replace photo
                                                            </p>
                                                        </div>
                                                    </label>
                                                </div>
                                            ) : (
                                                <label className="block cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleAvatarSelect}
                                                        className="hidden"
                                                    />
                                                    <div className="py-8 px-4 bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                                <Upload className="w-7 h-7 text-indigo-600" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                    Click to upload photo
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    PNG, JPG up to 5MB
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                <Briefcase className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">Practice Areas <span className="text-red-500">*</span></h3>
                                                <p className="text-xs text-slate-500">Select all areas you specialize in</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {practiceAreas.map((area) => (
                                                    <button
                                                        key={area}
                                                        type="button"
                                                        onClick={() => togglePracticeArea(area)}
                                                        className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                                                            profile.practiceAreas.includes(area)
                                                                ? 'border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400'
                                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-700'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                                                profile.practiceAreas.includes(area)
                                                                    ? 'border-purple-600 dark:border-purple-500 bg-purple-600 dark:bg-purple-500'
                                                                    : 'border-slate-300 dark:border-slate-600'
                                                            }`}>
                                                                {profile.practiceAreas.includes(area) && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                            {area}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                                    Selected: {profile.practiceAreas.length > 0 ? profile.practiceAreas.join(', ') : 'None'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-rose-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">Professional Details</h3>
                                                <p className="text-xs text-slate-500">How clients will find and connect with you</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4 bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                        Tagline / Headline <span className="text-red-500">*</span>
                                                    </label>
                                                    <span className="text-xs text-slate-500">{profile.tagline.length}/100</span>
                                                </div>
                                                <Input
                                                    placeholder="e.g., Expert in criminal defense with 15 years of experience"
                                                    value={profile.tagline}
                                                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                                                    maxLength={100}
                                                    className="h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                                                    required
                                                />
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                                                    <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-[10px]">ℹ</span>
                                                    This appears on your profile and helps clients understand your expertise
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                                                    Bio / About You
                                                </label>
                                                <Textarea
                                                    placeholder="Tell clients about your background, achievements, and approach to legal practice..."
                                                    value={profile.bio || ''}
                                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                    rows={4}
                                                    className="rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition-all"
                                            onClick={() => setStep('basic')}
                                            disabled={loading}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={loading || uploading || profile.practiceAreas.length === 0 || !profile.tagline.trim()}
                                        >
                                            {loading || uploading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    {uploading ? 'Uploading Photo...' : 'Saving Profile...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Complete Onboarding
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-10 text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                            <span className="text-blue-500">💡</span>
                            You can update all these details later in your profile settings
                        </p>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}