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
  ChevronRight,
  Fingerprint,
  Zap,
  Activity,
  UserCircle,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [chamberData, setChamberData] = useState<any>(null);
  const [settingsData, setSettingsData] = useState<any>(null);

  const chamberId = user?.chambers?.[0]?.chamber_id;

  useEffect(() => {
    async function loadData() {
      if (!chamberId) return;
      setLoading(true);
      const { chamber } = await getChamberDetails(chamberId);
      if (chamber) {
        setChamberData(chamber);
        setSettingsData(chamber.chamber_settings || {});
      }
      setLoading(false);
    }
    loadData();
  }, [chamberId]);

  const handleChamberUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chamberId) return;
    setSaving(true);

    const { error } = await updateChamberDetails(chamberId, {
      name: chamberData.name,
      email: chamberData.email,
      phone: chamberData.phone,
      address: chamberData.address,
      website: chamberData.website,
      description: chamberData.description,
    });

    if (error) {
      toast.error('Tactical update failed. Check system logs.');
    } else {
      toast.success('Institutional profiles synchronized successfully.');
    }
    setSaving(false);
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chamberId) return;
    setSaving(true);

    const { error } = await updateChamberSettings(chamberId, {
      default_hourly_rate: settingsData.default_hourly_rate,
      currency: settingsData.currency,
      invoice_prefix: settingsData.invoice_prefix,
      timezone: settingsData.timezone,
    });

    if (error) {
      toast.error('Billing protocol update rejected by server.');
    } else {
      toast.success('Financial parameters recalculated and secured.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#020617]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-blue-600/10 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-3xl border-2 border-blue-600 animate-ping opacity-20" />
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Initializing Oversight Console...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <div className="flex flex-col h-screen w-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden font-sans antialiased text-slate-900 dark:text-slate-100">

        {/* Global Control Header */}
        <header className="h-24 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-10 flex items-center justify-between z-30">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-2xl shadow-slate-900/20">
              <Settings2 className="w-7 h-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">System.<span className="text-blue-600 italic">CORE</span></h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Global Configuration & Identity Management</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Authorized Admin</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-sm font-black italic uppercase tracking-tight">{user?.full_name || 'Root Administrator'}</span>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                  {user?.full_name?.[0] || 'A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden p-10 flex gap-10">

          {/* Tactical Navigation Sidebar */}
          <aside className="w-80 shrink-0 flex flex-col gap-4">
            <div className="flex flex-col gap-2 p-2 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              {[
                { id: 'general', label: 'Institutional Profile', icon: Building2 },
                { id: 'billing', label: 'Financial Protocols', icon: CreditCard },
                { id: 'branding', label: 'Aesthetic Interface', icon: Palette },
                { id: 'security', label: 'Global Compliance', icon: ShieldCheck },
                { id: 'notifications', label: 'Alert Intelligence', icon: Bell },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-4 w-full p-5 rounded-[2rem] transition-all duration-300 text-left relative group",
                      isActive
                        ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/40"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <tab.icon className={cn("w-5 h-5", isActive ? "text-blue-500" : "group-hover:scale-110 transition-transform")} />
                    <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                )
              })}
            </div>

            {/* System Health Card */}
            <div className="p-8 rounded-[2.5rem] bg-blue-600 text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden group">
              <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform duration-700" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">System Version</p>
              <h3 className="text-2xl font-black italic tracking-tighter mt-1 leading-none">Oversight 2.1</h3>
              <div className="mt-6 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Core Status: Optimal</span>
              </div>
            </div>
          </aside>

          {/* Configuration Workspace */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none opacity-50" />

            <div className="relative flex-1 flex flex-col overflow-hidden">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-12">

                {activeTab === 'general' && (
                  <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div>
                      <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Institutional <span className="text-blue-600">Profile</span></h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium italic mt-4 max-w-xl">Initialize and synchronize your chamber's public identity across the legal ecosystem.</p>
                    </div>

                    <form onSubmit={handleChamberUpdate} className="space-y-10">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Chamber Identification</Label>
                          <div className="relative group">
                            <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                            <Input
                              value={chamberData?.name || ''}
                              onChange={(e) => setChamberData({ ...chamberData, name: e.target.value })}
                              className="h-16 pl-16 pr-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none px-4 font-bold text-lg focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Compliance Email</Label>
                          <div className="relative group">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                            <Input
                              type="email"
                              value={chamberData?.email || ''}
                              onChange={(e) => setChamberData({ ...chamberData, email: e.target.value })}
                              className="h-16 pl-16 pr-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none px-4 font-bold text-lg focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Communication Line</Label>
                          <Input
                            value={chamberData?.phone || ''}
                            onChange={(e) => setChamberData({ ...chamberData, phone: e.target.value })}
                            className="h-16 px-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none font-bold text-lg focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Global Website</Label>
                          <div className="relative group">
                            <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                            <Input
                              value={chamberData?.website || ''}
                              onChange={(e) => setChamberData({ ...chamberData, website: e.target.value })}
                              className="h-16 pl-16 pr-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none font-bold text-lg focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">High-Level Narrative / Description</Label>
                        <Textarea
                          value={chamberData?.description || ''}
                          onChange={(e) => setChamberData({ ...chamberData, description: e.target.value })}
                          className="min-h-[160px] rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border-none p-8 font-bold text-lg focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed"
                          placeholder="Articulate your chamber's expertise and mission..."
                        />
                      </div>

                      <div className="pt-6">
                        <Button disabled={saving} className="h-16 px-12 rounded-[2rem] bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-900 transition-all shadow-2xl shadow-blue-600/20 border-none group">
                          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Save className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />}
                          Commit Changes to Core
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'billing' && (
                  <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div>
                      <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Financial <span className="text-blue-600">Protocols</span></h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium italic mt-4 max-w-xl">Calibrate billing cycles, currency standards, and fiscal compliance rules.</p>
                    </div>

                    <form onSubmit={handleSettingsUpdate} className="space-y-10">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Standard Hourly Yield</Label>
                          <div className="relative group">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-blue-600 text-xl italic">$</span>
                            <Input
                              type="number"
                              value={settingsData?.default_hourly_rate || 0}
                              onChange={(e) => setSettingsData({ ...settingsData, default_hourly_rate: Number(e.target.value) })}
                              className="h-16 pl-12 pr-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none font-black text-2xl tracking-tighter italic focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Primary Settlement Currency</Label>
                          <Select
                            value={settingsData?.currency || 'PKR'}
                            onValueChange={(val) => setSettingsData({ ...settingsData, currency: val })}
                          >
                            <SelectTrigger className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none font-black text-lg px-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-[2rem] border-slate-100 dark:border-slate-800 p-2">
                              <SelectItem value="PKR" className="rounded-2xl font-bold">PKR - Pakistan Rupee</SelectItem>
                              <SelectItem value="USD" className="rounded-2xl font-bold">USD - US Dollar</SelectItem>
                              <SelectItem value="GBP" className="rounded-2xl font-bold">GBP - British Pound</SelectItem>
                              <SelectItem value="EUR" className="rounded-2xl font-bold">EUR - Euro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Institutional Invoice Prefix</Label>
                          <Input
                            value={settingsData?.invoice_prefix || ''}
                            onChange={(e) => setSettingsData({ ...settingsData, invoice_prefix: e.target.value })}
                            placeholder="e.g. LAW-HUB-"
                            className="h-16 px-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none font-black text-xl italic focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-1">Operational Timezone</Label>
                          <Select
                            value={settingsData?.timezone || 'Asia/Karachi'}
                            onValueChange={(val) => setSettingsData({ ...settingsData, timezone: val })}
                          >
                            <SelectTrigger className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none font-black text-lg px-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-[2rem] border-slate-100 dark:border-slate-800 p-2">
                              <SelectItem value="Asia/Karachi" className="rounded-2xl font-bold">Islamabad/Karachi (GMT+5)</SelectItem>
                              <SelectItem value="UTC" className="rounded-2xl font-bold">Universal (UTC)</SelectItem>
                              <SelectItem value="America/New_York" className="rounded-2xl font-bold">New York (EST)</SelectItem>
                              <SelectItem value="Europe/London" className="rounded-2xl font-bold">London (GMT)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="p-8 rounded-[3rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 border-dashed">
                        <div className="flex items-start gap-6">
                          <Info className="w-8 h-8 text-blue-600 mt-1" />
                          <div className="space-y-2">
                            <h4 className="text-lg font-black italic tracking-tighter uppercase">Protocol Impact Analysis</h4>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Changing financial parameters will instantly recalibrate future invoice generation logic. Existing settlement records will remain locked to their historical benchmarks.</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6">
                        <Button disabled={saving} className="h-16 px-12 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600 transition-all shadow-2xl shadow-slate-900/20 border-none">
                          Synchronize Billing Protocols
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Placeholder content for other tabs to keep layout clean */}
                {['branding', 'security', 'notifications'].includes(activeTab) && (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-10 animate-in fade-in zoom-in duration-500">
                    <div className="w-48 h-48 rounded-[4rem] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center relative overflow-hidden group">
                      <Fingerprint className="w-20 h-20 text-slate-200 dark:text-slate-700 group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                    </div>
                    <div className="space-y-4 max-w-sm">
                      <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-tight">Advanced <span className="text-blue-600 italic">Interface</span></h3>
                      <p className="text-slate-400 font-medium italic text-sm leading-relaxed px-6">This operational sector is currently under synchronization. Global rollout expected in Version 2.2.</p>
                    </div>
                    <Badge variant="outline" className="h-10 px-6 rounded-xl border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">Restricted Access Module</Badge>
                  </div>
                )}

              </div>

              {/* Oversight Footer Indicator */}
              <footer className="h-20 px-12 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Oversite Identity Engine : active</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">High-Trust configuration environment established</p>
                </div>
              </footer>
            </div>
          </div>

        </main>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.1);
            border-radius: 20px;
            border: 3px solid transparent;
            background-clip: padding-box;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.3);
            background-clip: padding-box;
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
