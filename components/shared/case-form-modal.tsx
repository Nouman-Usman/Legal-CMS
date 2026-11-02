'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { getChamberLawyers } from '@/lib/supabase/hearings';
import { createClient as createChamberClient, getClientOptions } from '@/lib/supabase/clients';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface CaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  caseData?: any;
  isEditing?: boolean;
}

const CASE_TYPES = [
  'Criminal',
  'Civil',
  'Corporate',
  'Real Estate',
  'Labor',
  'Family',
  'Tax',
  'IP',
  'Other',
];

export function CaseFormModal({
  isOpen,
  onClose,
  onSuccess,
  caseData,
  isEditing = false,
}: CaseFormModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [clientOptions, setClientOptions] = useState<Array<{ id: string; full_name: string; phone: string | null }>>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    case_number: '',
    title: '',
    description: '',
    client_id: '',
    chamber_client_id: '',
    client_name: '',
    client_phone: '',
    assigned_to: '',
    case_type: '',
    priority: 'medium',
    status: 'open',
    filing_date: '',
    next_hearing_date: '',
  });

  // Fetch clients and lawyers
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.chamber_id) return;

      try {
        // Lawyers come from chamber membership (there is no users.chamber_id column)
        const { lawyers: chamberLawyers } = await getChamberLawyers(user.chamber_id);
        const lawyersData = chamberLawyers.map((l) => ({ id: l.id, full_name: l.name }));

        setLawyers(lawyersData || []);
        const { options } = await getClientOptions(user.chamber_id);
        setClientOptions(options);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [user?.chamber_id]);

  // Load existing case data
  useEffect(() => {
    if (isEditing && caseData) {
      setFormData({
        case_number: caseData.case_number || '',
        title: caseData.title || '',
        description: caseData.description || '',
        client_id: caseData.client_id || '',
        chamber_client_id: caseData.chamber_client_id || '',
        client_name: caseData.client_name || '',
        client_phone: caseData.client_phone || '',
        assigned_to: caseData.assigned_to || '',
        case_type: caseData.case_type || '',
        priority: caseData.priority || 'medium',
        status: caseData.status || 'open',
        filing_date: caseData.filing_date || '',
        next_hearing_date: caseData.next_hearing_date || '',
      });
    }
  }, [isEditing, caseData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.case_number.trim()) {
      setError('Case number is required');
      return false;
    }
    if (!formData.title.trim()) {
      setError('Case title is required');
      return false;
    }
    if (!formData.client_name.trim()) {
      setError('Client name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!user?.chamber_id) return;

    try {
      setLoading(true);
      setError('');

      const blankToNull = (v: string | null | undefined) => (v && String(v).trim() ? v : null);

      // A new client is saved to the chamber's client list first, then linked.
      let chamberClientId = formData.chamber_client_id;
      if (!chamberClientId) {
        const { client, error: clientError } = await createChamberClient({
          chamber_id: user.chamber_id,
          full_name: formData.client_name,
          phone: formData.client_phone,
        });
        if (clientError || !client) throw clientError || new Error('Could not save the client');
        chamberClientId = client.id;
      }
      const payload = {
        ...formData,
        client_id: blankToNull(formData.client_id),
        chamber_client_id: chamberClientId,
        client_name: formData.client_name.trim(),
        client_phone: blankToNull(formData.client_phone),
        assigned_to: blankToNull(formData.assigned_to),
        filing_date: blankToNull(formData.filing_date),
        next_hearing_date: blankToNull(formData.next_hearing_date),
        chamber_id: user.chamber_id,
      };

      if (isEditing && caseData?.id) {
        // Update existing case
        const { error: updateError } = await supabase
          .from('cases')
          .update(payload)
          .eq('id', caseData.id);

        if (updateError) throw updateError;
        setSuccess('Case updated successfully!');
      } else {
        // Create new case
        const { error: insertError } = await supabase.from('cases').insert([payload]);

        if (insertError) throw insertError;
        setSuccess('Case created successfully!');
      }

      setTimeout(() => {
        setSuccess('');
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('Error saving case:', err);
      setError(err instanceof Error ? err.message : 'Failed to save case');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-border bg-card max-h-[90vh] overflow-y-auto rounded-[22px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-card border-b border-border z-10">
          <div>
            <CardTitle>{isEditing ? 'Edit Case' : 'Create New Case'}</CardTitle>
            <CardDescription>
              {isEditing ? 'Update case information' : 'Add a new case to your chamber'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/40">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/40">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm text-primary">{success}</p>
              </div>
            )}

            {/* Case Number and Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="case_number">Case Number *</Label>
                <Input
                  id="case_number"
                  placeholder="e.g., CASE-2024-001"
                  value={formData.case_number}
                  onChange={(e) => handleInputChange('case_number', e.target.value)}
                  className="bg-secondary border-input min-h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="case_type">Case Type</Label>
                <Select value={formData.case_type} onValueChange={(value) => handleInputChange('case_type', value)}>
                  <SelectTrigger className="bg-secondary border-input min-h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Case Title *</Label>
              <Input
                id="title"
                placeholder="Enter case title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-secondary border-input min-h-11"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter case details and description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="bg-secondary border-input min-h-11"
              />
            </div>

            {/* Client and Lawyer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="chamber_client">Client</Label>
                <Select
                  value={formData.chamber_client_id || 'new'}
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setFormData((prev) => ({ ...prev, chamber_client_id: '', client_name: '', client_phone: '' }));
                    } else {
                      const picked = clientOptions.find((c) => c.id === value);
                      setFormData((prev) => ({
                        ...prev,
                        chamber_client_id: value,
                        client_name: picked?.full_name || '',
                        client_phone: picked?.phone || '',
                      }));
                    }
                    setError('');
                  }}
                >
                  <SelectTrigger id="chamber_client" className="bg-secondary border-input min-h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ New client</SelectItem>
                    {clientOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name}
                        {c.phone ? ` · ${c.phone}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_name">Client name *</Label>
                <Input
                  id="client_name"
                  placeholder="e.g. Muhammad Ali"
                  value={formData.client_name}
                  onChange={(e) => handleInputChange('client_name', e.target.value)}
                  readOnly={!!formData.chamber_client_id}
                  className="bg-secondary border-input min-h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">Client phone (WhatsApp)</Label>
                <Input
                  id="client_phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+92 300 1234567"
                  value={formData.client_phone}
                  onChange={(e) => handleInputChange('client_phone', e.target.value)}
                  readOnly={!!formData.chamber_client_id}
                  className="bg-secondary border-input min-h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign Lawyer</Label>
                <Select value={formData.assigned_to || 'none'} onValueChange={(value) => handleInputChange('assigned_to', value === 'none' ? null : value)}>
                  <SelectTrigger className="bg-secondary border-input min-h-11">
                    <SelectValue placeholder="Select lawyer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {lawyers.map((lawyer) => (
                      <SelectItem key={lawyer.id} value={lawyer.id}>
                        {lawyer.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger className="bg-secondary border-input min-h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="bg-secondary border-input min-h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filing_date">Filing Date</Label>
                <Input
                  id="filing_date"
                  type="date"
                  value={formData.filing_date}
                  onChange={(e) => handleInputChange('filing_date', e.target.value)}
                  className="bg-secondary border-input min-h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_hearing_date">Next Hearing Date</Label>
                <Input
                  id="next_hearing_date"
                  type="date"
                  value={formData.next_hearing_date}
                  onChange={(e) => handleInputChange('next_hearing_date', e.target.value)}
                  className="bg-secondary border-input min-h-11"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-border">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 min-h-11"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? 'Update Case' : 'Create Case'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
