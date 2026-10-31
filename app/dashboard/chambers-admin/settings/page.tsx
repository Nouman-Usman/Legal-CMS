'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { getChamberDetails, updateChamberDetails, updateChamberSettings } from '@/lib/supabase/chambers';
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
import { DashAlert, DashField, DashPage, PageHeader, Panel } from '@/components/dashboard/ui';

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
      <DashPage>
        <div className="l-empty" role="status">
          <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin" />
          <span className="sr-only">Loading settings</span>
        </div>
      </DashPage>
    );
  }

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <DashPage>
        <PageHeader title="Chamber Settings" description="Configure your firm's identity, billing preferences, and security." />

        {message.text &&
          (message.type === 'success' ? (
            <p className="l-dash-alert l-dash-alert--ok" role="status">
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 shrink-0" /> {message.text}
            </p>
          ) : (
            <DashAlert>{message.text}</DashAlert>
          ))}

        <Tabs defaultValue="general" className="flex flex-col gap-5">
          <TabsList className="l-tabs">
            <TabsTrigger value="general">
              <Building2 aria-hidden="true" className="w-4 h-4" /> General
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard aria-hidden="true" className="w-4 h-4" /> Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="l-grid l-grid--main">
              <Panel title="Firm Details">
                <form onSubmit={handleChamberUpdate} className="l-form">
                  <p className="m-0 text-sm l-muted">Update your chamber&apos;s public profile and contact info.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DashField label="Chamber Name" value={chamberData?.name || ''} onChange={(e) => setChamberData({ ...chamberData, name: e.target.value })} />
                    <DashField label="Email Address" type="email" value={chamberData?.email || ''} onChange={(e) => setChamberData({ ...chamberData, email: e.target.value })} />
                    <DashField label="Phone Number" value={chamberData?.phone || ''} onChange={(e) => setChamberData({ ...chamberData, phone: e.target.value })} />
                    <DashField label="Website" value={chamberData?.website || ''} onChange={(e) => setChamberData({ ...chamberData, website: e.target.value })} />
                  </div>
                  <DashField label="Office Address" value={chamberData?.address || ''} onChange={(e) => setChamberData({ ...chamberData, address: e.target.value })} />
                  <div className="l-dash-field">
                    <label htmlFor="chamber-bio" className="l-label">
                      Bio / Description
                    </label>
                    <textarea
                      id="chamber-bio"
                      className="l-dash-input"
                      value={chamberData?.description || ''}
                      onChange={(e) => setChamberData({ ...chamberData, description: e.target.value })}
                    />
                  </div>
                  <div className="l-dialog-actions">
                    <button type="submit" disabled={saving} className="l-btn l-btn--primary l-btn--compact">
                      {saving ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Save aria-hidden="true" className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </Panel>

              <Panel title="Chamber">
                <div className="flex flex-col items-start gap-4">
                  {chamberData?.logo_url ? (
                    <img src={chamberData.logo_url} alt={`${chamberData?.name || 'Chamber'} logo`} className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <span className="l-empty__icon" aria-hidden="true">
                      <Building2 className="w-6 h-6" />
                    </span>
                  )}
                  <div className="flex flex-col gap-1">
                    <h3 className="m-0 text-lg font-semibold">{chamberData?.name || 'Your Chamber'}</h3>
                    <p className="m-0 text-sm l-muted">Official Chamber ID: {user?.chamber_id?.slice(0, 8)}...</p>
                  </div>
                  <p className="m-0 text-sm l-muted">
                    Managed by: <strong className="l-ink capitalize">{user?.role?.replace('_', ' ')}</strong>
                  </p>
                </div>
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <div className="l-grid l-grid--main">
              <Panel title="Financial Preferences">
                <form onSubmit={handleSettingsUpdate} className="l-form">
                  <p className="m-0 text-sm l-muted">Configure how you charge for your expert services.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DashField
                      label="Base Hourly Rate"
                      type="number"
                      value={settingsData?.default_hourly_rate || 0}
                      onChange={(e) => setSettingsData({ ...settingsData, default_hourly_rate: Number(e.target.value) })}
                    />
                    <div className="l-dash-field">
                      <span className="l-label" id="currency-label">
                        Primary Currency
                      </span>
                      <Select value={settingsData?.currency || 'PKR'} onValueChange={(val) => setSettingsData({ ...settingsData, currency: val })}>
                        <SelectTrigger className="min-h-11 bg-secondary border-input" aria-labelledby="currency-label">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PKR">PKR - Pakistan Rupee</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DashField
                      label="Invoice ID Prefix"
                      value={settingsData?.invoice_prefix || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, invoice_prefix: e.target.value })}
                      placeholder="e.g. LAW-"
                    />
                    <div className="l-dash-field">
                      <span className="l-label" id="timezone-label">
                        Local Timezone
                      </span>
                      <Select value={settingsData?.timezone || 'Asia/Karachi'} onValueChange={(val) => setSettingsData({ ...settingsData, timezone: val })}>
                        <SelectTrigger className="min-h-11 bg-secondary border-input" aria-labelledby="timezone-label">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Karachi">Islamabad/Karachi (GMT+5)</SelectItem>
                          <SelectItem value="UTC">Universal Coordinated Time (UTC)</SelectItem>
                          <SelectItem value="America/New_York">New York (EST)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="l-dialog-actions">
                    <button type="submit" disabled={saving} className="l-btn l-btn--primary l-btn--compact">
                      Update Billing Rules
                    </button>
                  </div>
                </form>
              </Panel>

              <Panel title="Why these settings matter?">
                <p className="m-0 text-sm l-muted leading-relaxed">
                  Your hourly rates and invoice prefixes are used for all automated billing cycles. Changing them will affect future invoices only.
                </p>
              </Panel>
            </div>
          </TabsContent>
        </Tabs>
      </DashPage>
    </ProtectedRoute>
  );
}
