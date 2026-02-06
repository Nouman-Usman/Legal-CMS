'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Loader2, 
    Building2, 
    Check, 
    AlertCircle,
    Globe,
    Phone,
    Mail,
    MapPin,
    FileText,
    Upload,
    X
} from 'lucide-react';

interface ChamberFormData {
    name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    website: string;
    description: string;
    license_number: string;
    logo_url?: string;
}

export default function ChamberSetupPage() {
    const router = useRouter();
    const { user, loading: authLoading, userRole } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [step, setStep] = useState<'basic' | 'details'>('basic');
    const [chamber, setChamber] = useState<ChamberFormData>({
        name: '',
        address: '',
        city: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        description: '',
        license_number: '',
        logo_url: '',
    });

    useEffect(() => {
        // If not authenticated, redirect to login
        if (!authLoading && !user) {
            router.push('/auth/login');
            return;
        }

        // If not a chamber admin, redirect to main dashboard
        if (!authLoading && user && userRole !== 'chamber_admin') {
            router.push('/dashboard');
            return;
        }

        // If user already has active chamber membership, redirect to dashboard
        if (!authLoading && user && user.chambers && user.chambers.length > 0) {
            router.push('/dashboard/chambers-admin');
            return;
        }

        // Pre-fill email with user's email
        if (user?.email && !chamber.email) {
            setChamber(prev => ({ ...prev, email: user.email || '' }));
        }
    }, [user, authLoading, userRole, router, chamber.email]);

    const validateBasicStep = () => {
        return chamber.name.trim().length > 0;
    };

    const handleBasicStepSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateBasicStep()) {
            setStep('details');
        }
    };

    const handleFullSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!chamber.name.trim()) {
                throw new Error('Chamber name is required');
            }

            // Create the chamber with all details
            const { data: chamberData, error: chamberError } = await supabase
                .from('chambers')
                .insert({
                    name: chamber.name,
                    address: chamber.address || null,
                    city: chamber.city || null,
                    country: chamber.country || null,
                    phone: chamber.phone || null,
                    email: chamber.email || user?.email,
                    website: chamber.website || null,
                    description: chamber.description || null,
                    license_number: chamber.license_number || null,
                    logo_url: chamber.logo_url || null,
                    admin_id: user?.id,
                })
                .select()
                .single();

            if (chamberError) throw chamberError;

            // Update the user's chamber_id
            const { error: userError } = await supabase
                .from('users')
                .update({ 
                    onboarding_completed: true
                })
                .eq('id', user?.id);

            if (userError) throw userError;

            // Create chamber membership
            const { error: membershipError } = await supabase
                .from('chamber_members')
                .insert({
                    chamber_id: chamberData.id,
                    user_id: user?.id,
                    role: 'admin',
                    is_active: true
                });

            if (membershipError) throw membershipError;

            setSuccess(true);
            // Redirect after brief success message
            setTimeout(() => {
                router.push('/dashboard/chambers-admin');
                router.refresh();
            }, 1500);
        } catch (err: any) {
            console.error('Error creating chamber:', err);
            setError(err.message || 'Failed to create chamber');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Logo file must be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `chamber-${Date.now()}.${fileExt}`;
            const filePath = `chamber-logos/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError, data } = await supabase.storage
                .from('chamber-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data: publicData } = supabase.storage
                .from('chamber-assets')
                .getPublicUrl(filePath);

            if (publicData?.publicUrl) {
                setChamber(prev => ({ ...prev, logo_url: publicData.publicUrl }));
            }
        } catch (err: any) {
            console.error('Error uploading logo:', err);
            setError('Failed to upload logo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    // If not authenticated or wrong role, don't render (will redirect)
    if (!user || userRole !== 'chamber_admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-3xl">
                {/* Header Section */}
                <div className="mb-12">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg mb-4">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 mb-3">
                            Establish Your Chamber
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
                            Set up your professional law firm workspace in just a few steps
                        </p>
                    </div>

                    {/* Progress Indicator */}
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
                                }`}></div>
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
                                    Basic Information
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Chamber name & credentials</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-bold transition-colors ${step === 'details' ? 'text-blue-600' : 'text-slate-400'}`}>
                                    Business Details
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Location & contact info</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
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
                                            Chamber created successfully! Setting up your dashboard...
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
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <Building2 className="w-3 h-3 text-blue-600" />
                                        </div>
                                        Chamber / Law Firm Name
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="e.g., Khan & Associates Law Firm"
                                        value={chamber.name}
                                        onChange={(e) => setChamber({ ...chamber, name: e.target.value })}
                                        className="h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        required
                                        autoFocus
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px]">ℹ</span>
                                        This is the primary name your clients will see
                                    </p>
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
                                {/* Location Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">Location Information</h3>
                                            <p className="text-xs text-slate-500">Where your chambers are located</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Input
                                            placeholder="Street address"
                                            value={chamber.address}
                                            onChange={(e) => setChamber({ ...chamber, address: e.target.value })}
                                            className="h-11 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                placeholder="City"
                                                value={chamber.city}
                                                onChange={(e) => setChamber({ ...chamber, city: e.target.value })}
                                                className="h-11 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                            />
                                            <Input
                                                placeholder="Country"
                                                value={chamber.country}
                                                onChange={(e) => setChamber({ ...chamber, country: e.target.value })}
                                                className="h-11 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                            <Phone className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">Contact Information</h3>
                                            <p className="text-xs text-slate-500">How clients can reach you</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Input
                                            type="tel"
                                            placeholder="+92 42 1234567"
                                            value={chamber.phone}
                                            onChange={(e) => setChamber({ ...chamber, phone: e.target.value })}
                                            className="h-11 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        />
                                        <div>
                                            <Input
                                                type="email"
                                                placeholder="chamber@lawfirm.com"
                                                value={chamber.email}
                                                disabled
                                                className="h-11 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-not-allowed opacity-75"
                                            />
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                                                <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-[10px]">ℹ</span>
                                                Chamber email is the same as your account email
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Business Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                                            <Globe className="w-5 h-5 text-cyan-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">Business Information</h3>
                                            <p className="text-xs text-slate-500">Legal details & credentials</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Input
                                            placeholder="Website (optional)"
                                            type="url"
                                            value={chamber.website}
                                            onChange={(e) => setChamber({ ...chamber, website: e.target.value })}
                                            className="h-11 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                        />
                                        <Input
                                            placeholder="Bar/License Number (optional)"
                                            value={chamber.license_number}
                                            onChange={(e) => setChamber({ ...chamber, license_number: e.target.value })}
                                            className="h-11 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Logo Upload Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <Upload className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">Chamber Logo</h3>
                                            <p className="text-xs text-slate-500">Upload your firm's logo (optional)</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                        {chamber.logo_url ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <img 
                                                            src={chamber.logo_url} 
                                                            alt="Chamber Logo" 
                                                            className="h-16 w-16 object-contain rounded-lg border-2 border-slate-200 dark:border-slate-600"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Logo uploaded</p>
                                                            <p className="text-xs text-slate-500">Your chamber logo is ready</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setChamber(prev => ({ ...prev, logo_url: '' }))}
                                                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                                    </button>
                                                </div>
                                                <label className="block">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleLogoUpload}
                                                        disabled={uploading}
                                                        className="hidden"
                                                    />
                                                    <div className="py-3 px-4 bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer text-center">
                                                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                            {uploading ? 'Uploading...' : 'Replace logo'}
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <label className="block cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    disabled={uploading}
                                                    className="hidden"
                                                />
                                                <div className="py-8 px-4 bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                            <Upload className="w-6 h-6 text-indigo-600" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                {uploading ? 'Uploading logo...' : 'Click to upload logo'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                PNG, JPG, GIF up to 5MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Description Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">About Your Chamber</h3>
                                            <p className="text-xs text-slate-500">Public profile information</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Textarea
                                            placeholder="Brief description of your law firm, specializations, and values (optional)"
                                            value={chamber.description}
                                            onChange={(e) => setChamber({ ...chamber, description: e.target.value })}
                                            rows={4}
                                            className="rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1">
                                            <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-[10px]">ℹ</span>
                                            This will be visible on your public chamber profile
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition-all"
                                        onClick={() => setStep('basic')}
                                        disabled={loading}
                                    >
                                        Back to Basics
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={loading || !chamber.name.trim()}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Creating Chamber...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Create Chamber
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Help Text */}
                <div className="mt-10 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                        </svg>
                        You can update all these details later in your chamber settings
                    </p>
                </div>
            </div>
        </div>
    );
}

function ArrowRight({ className }: { className: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );
}
