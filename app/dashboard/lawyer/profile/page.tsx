'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { updateUserProfile, getUserProfile } from '@/lib/supabase/users';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    User,
    Mail,
    Phone,
    Briefcase,
    Award,
    FileText,
    Save,
    Loader2,
    CheckCircle2,
    Shield,
    Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export default function LawyerProfilePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        specialization: '',
        bar_number: '',
        bio: '', // stored in lawyer_profile json
        experience_years: '' // stored in lawyer_profile json
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            setLoading(true);
            const { data } = await getUserProfile(user.id);
            if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    specialization: data.specialization || '',
                    bar_number: data.bar_number || '',
                    bio: data.lawyer_profile?.bio || '',
                    experience_years: data.lawyer_profile?.experience_years || ''
                });
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user?.id]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user?.id) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const supabase = createClient();

        // 1. Upload to Storage (Assuming 'avatars' bucket exists)
        // If not, this might fail, but we'll try standard Supabase storage pattern
        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update User Profile
            await updateUserProfile(user.id, { avatar_url: publicUrl });

            // Reload page or update context (would need context refresh logic)
            window.location.reload();
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to update avatar. Ensure you have an "avatars" public bucket.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        if (!user?.id) return;

        const { bio, experience_years, ...coreData } = formData;

        const updates = {
            ...coreData,
            lawyer_profile: {
                bio,
                experience_years
            }
        };

        const { error } = await updateUserProfile(user.id, updates);

        if (!error) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } else {
            console.error(error);
        }
        setSaving(false);
    };

    return (
        <ProtectedRoute requiredRole="lawyer">
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 font-sans">
                <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                                <User className="w-10 h-10 text-indigo-600" />
                                Lawyer Profile
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                Manage your professional identity and credentials.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {success && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 px-4 py-1.5 font-bold uppercase tracking-widest gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Saved Successfully
                                </Badge>
                            )}
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 gap-2 min-w-[140px]"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left Column: Avatar & Basic Info */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl relative">
                                            {/* We rely on Auth Context for current avatar, or fallback */}
                                            {/* Note: Real app would need optimistic UI update here */}
                                            <img
                                                src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name}&background=6366f1&color=fff`}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleAvatarUpload}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.full_name}</h3>
                                        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">Associate Attorney</p>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-2" />

                                    <div className="w-full space-y-3">
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                            <Mail className="w-4 h-4 text-indigo-500" />
                                            <span className="truncate">{user?.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                            <Shield className="w-4 h-4 text-emerald-500" />
                                            <span>Lawyer Verified</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Edit Forms */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Personal Details */}
                            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[32px]">
                                <CardHeader className="px-8 pt-8 pb-0">
                                    <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight">
                                        <User className="w-5 h-5 text-indigo-600" />
                                        Personal Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name" className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Full Name</Label>
                                            <Input
                                                id="full_name"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Professional Details */}
                            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[32px]">
                                <CardHeader className="px-8 pt-8 pb-0">
                                    <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight">
                                        <Briefcase className="w-5 h-5 text-indigo-600" />
                                        Professional Credentials
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="specialization" className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Specialization</Label>
                                            <Input
                                                id="specialization"
                                                placeholder="e.g. Criminal Law, Corporate"
                                                value={formData.specialization}
                                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bar_number" className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Bar License No.</Label>
                                            <Input
                                                id="bar_number"
                                                value={formData.bar_number}
                                                onChange={(e) => setFormData({ ...formData, bar_number: e.target.value })}
                                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="experience" className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Years of Experience</Label>
                                            <Input
                                                id="experience"
                                                type="number"
                                                value={formData.experience_years}
                                                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bio" className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-1">Professional Bio</Label>
                                        <Textarea
                                            id="bio"
                                            placeholder="Tell us about your expertise and background..."
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="min-h-[120px] rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:ring-2 focus:ring-indigo-500 p-4"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                </form>
            </div>
        </ProtectedRoute>
    );
}
