'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { getChamberDetails, updateChamberDetails, updateChamberSettings } from '@/lib/supabase/chambers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Settings2,
  Globe,
  ShieldCheck,
  Bell,
  Palette,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Camera,
  Smartphone,
  Mail,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [chamberData, setChamberData] = useState<any>(null);
  const [settingsData, setSettingsData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!user?.chamber_id) return;
      setLoading(true);
      const { chamber } = await getChamberDetails(user.chamber_id);
      if (chamber) {
        setChamberData(chamber);
        setSettingsData(chamber.chamber_settings || {});
      }
      setLoading(false);
    }
    loadData();
  }, [user?.chamber_id]);

  const handleChamberUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.chamber_id) return;
    setSaving(true);
    const { error } = await updateChamberDetails(user.chamber_id, {
      name: chamberData.name,
      email: chamberData.email,
      phone: chamberData.phone,
      address: chamberData.address,
      website: chamberData.website,
      description: chamberData.description,
    });

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update chamber details.' });
    } else {
      setMessage({ type: 'success', text: 'Chamber details updated successfully!' });
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.chamber_id) return;
    setSaving(true);
    const { error } = await updateChamberSettings(user.chamber_id, {
      default_hourly_rate: settingsData.default_hourly_rate,
      currency: settingsData.currency,
      invoice_prefix: settingsData.invoice_prefix,
      timezone: settingsData.timezone,
    });

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update settings.' });
    } else {
      setMessage({ type: 'success', text: 'Chamber settings updated successfully!' });
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Chamber Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Configure your firm's identity, billing preferences, and security.</p>
          </div>

          {message.text && (
            <div className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg",
              message.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            )}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold text-sm tracking-wide">{message.text}</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="general" className="space-y-8">
          <TabsList className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex w-fit gap-2">
            <TabsTrigger value="general" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all">
              <Building2 className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="branding" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all">
              <Palette className="w-4 h-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                <Card className="border-none shadow-2xl shadow-indigo-500/5 dark:bg-slate-900 rounded-[32px]">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-indigo-600" />
                      Firm Details
                    </CardTitle>
                    <CardDescription>Update your chamber's public profile and contact info.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChamberUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Chamber Name</Label>
                          <Input
                            value={chamberData?.name || ''}
                            onChange={(e) => setChamberData({ ...chamberData, name: e.target.value })}
                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Email Address</Label>
                          <Input
                            type="email"
                            value={chamberData?.email || ''}
                            onChange={(e) => setChamberData({ ...chamberData, email: e.target.value })}
                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Phone Number</Label>
                          <Input
                            value={chamberData?.phone || ''}
                            onChange={(e) => setChamberData({ ...chamberData, phone: e.target.value })}
                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              value={chamberData?.website || ''}
                              onChange={(e) => setChamberData({ ...chamberData, website: e.target.value })}
                              className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none pl-12 pr-4 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Office Address</Label>
                        <Input
                          value={chamberData?.address || ''}
                          onChange={(e) => setChamberData({ ...chamberData, address: e.target.value })}
                          className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Bio / Description</Label>
                        <Textarea
                          value={chamberData?.description || ''}
                          onChange={(e) => setChamberData({ ...chamberData, description: e.target.value })}
                          className="min-h-[120px] rounded-xl bg-slate-50 dark:bg-slate-800 border-none p-4 font-medium resize-none"
                        />
                      </div>
                      <div className="pt-4 flex justify-end">
                        <Button disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl font-bold shadow-lg shadow-indigo-500/20 gap-2">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 rounded-[32px] overflow-hidden">
                  <div className="h-32 bg-indigo-600 relative">
                    <div className="absolute -bottom-12 left-8 w-24 h-24 rounded-[24px] bg-white dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center shadow-lg group cursor-pointer overflow-hidden">
                      {chamberData?.logo_url ? (
                        <img src={chamberData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-indigo-200" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-16 pb-8 px-8">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{chamberData?.name || 'Your Chamber'}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-tighter italic">Official Chamber ID: {user?.chamber_id?.slice(0, 8)}...</p>

                    <div className="mt-8 space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/20">
                        <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Status</span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Verified Professional</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 leading-relaxed font-medium capitalize">
                          Managed by: <strong>{user?.role?.replace('_', ' ')}</strong>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 dark:bg-slate-900 rounded-[32px]">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 gap-3">
                      <Mail className="w-4 h-4" /> Verify Secondary Email
                    </Button>
                    <Button variant="ghost" className="w-full justify-start rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 gap-3">
                      <Lock className="w-4 h-4" /> Force MFA Reset
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="border-none shadow-2xl shadow-indigo-500/5 dark:bg-slate-900 rounded-[32px] overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 lg:p-12 space-y-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Financial Preferences</h2>
                    <p className="text-slate-500 font-medium mt-1">Configure how you charge for your expert services.</p>
                  </div>

                  <form onSubmit={handleSettingsUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Base Hourly Rate</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                          <Input
                            type="number"
                            value={settingsData?.default_hourly_rate || 0}
                            onChange={(e) => setSettingsData({ ...settingsData, default_hourly_rate: Number(e.target.value) })}
                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none pl-12 font-bold text-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Primary Currency</Label>
                        <Select
                          value={settingsData?.currency || 'PKR'}
                          onValueChange={(val) => setSettingsData({ ...settingsData, currency: val })}
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100">
                            <SelectItem value="PKR">PKR - Pakistan Rupee</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Invoice ID Prefix</Label>
                      <Input
                        value={settingsData?.invoice_prefix || ''}
                        onChange={(e) => setSettingsData({ ...settingsData, invoice_prefix: e.target.value })}
                        placeholder="e.g. LAW-"
                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Local Timezone</Label>
                      <Select
                        value={settingsData?.timezone || 'Asia/Karachi'}
                        onValueChange={(val) => setSettingsData({ ...settingsData, timezone: val })}
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100">
                          <SelectItem value="Asia/Karachi">Islamabad/Karachi (GMT+5)</SelectItem>
                          <SelectItem value="UTC">Universal Coordinated Time (UTC)</SelectItem>
                          <SelectItem value="America/New_York">New York (EST)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 h-14 px-12 rounded-2xl font-black shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-[10px]">
                        Update Billing Rules
                      </Button>
                    </div>
                  </form>
                </div>
                <div className="bg-indigo-600/5 dark:bg-indigo-900/10 p-8 lg:p-12 flex flex-col justify-center border-l border-slate-100 dark:border-slate-800/50">
                  <div className="max-w-sm space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold dark:text-white">Why these settings matter?</h3>
                      <p className="text-slate-500 font-medium mt-2 leading-relaxed">
                        Your hourly rates and invoice prefixes are used for all automated billing cycles. Changing them will affect future invoices only.
                      </p>
                    </div>
                    <ul className="space-y-3">
                      {[
                        'Automated Tax Calculation',
                        'Custom Invoice Branding',
                        'Multiple Payment Channels',
                        'Secure Vault Storage'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-2xl shadow-indigo-500/5 dark:bg-slate-900 rounded-[32px] p-8">
                <h2 className="text-xl font-bold mb-4">Brand Colors</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600" />
                      <span className="font-bold">Primary Brand Color</span>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg">Change</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white" />
                      <span className="font-bold">Secondary Color</span>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg">Change</Button>
                  </div>
                </div>
              </Card>
              <Card className="border-none shadow-2xl shadow-indigo-500/5 dark:bg-slate-900 rounded-[32px] p-8 bg-indigo-600 text-white flex items-center justify-center text-center">
                <div className="space-y-4">
                  <Palette className="w-12 h-12 mx-auto opacity-50" />
                  <div>
                    <h3 className="text-xl font-bold">Aesthetics Pack</h3>
                    <p className="text-indigo-100 opacity-80 text-sm mt-1">Unlock premium themes and custom icons for your client portal.</p>
                  </div>
                  <Button className="bg-white text-indigo-600 font-bold px-8 h-12 rounded-xl border-none">Upgrade Pro</Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
