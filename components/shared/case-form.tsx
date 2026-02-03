'use client';

import React, { useState } from 'react';
import { createCase } from '@/lib/supabase/cases';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';

interface CaseFormProps {
  clientId?: string;
  onSuccess?: () => void;
}

export function CaseForm({ clientId, onSuccess }: CaseFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    case_number: '',
    title: '',
    description: '',
    client_id: clientId || '',
    assigned_to: user?.id || '',
    status: 'active',
    priority: 'medium',
    case_type: '',
    filing_date: '',
    hearing_date: '',
    expected_closure_date: '',
  });
  const [clients, setClients] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Load clients
        const { data: clientsData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('role', 'client');

        // Load lawyers
        const { data: lawyersData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('role', 'lawyer');

        setClients(clientsData || []);
        setLawyers(lawyersData || []);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { case: newCase, error } = await createCase(formData);
      if (error) throw error;
      
      onSuccess?.();
      // Reset form
      setFormData({
        case_number: '',
        title: '',
        description: '',
        client_id: clientId || '',
        assigned_to: user?.id || '',
        status: 'active',
        priority: 'medium',
        case_type: '',
        filing_date: '',
        hearing_date: '',
        expected_closure_date: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to create case');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Case</CardTitle>
        <CardDescription>Add a new legal case to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex gap-2 items-start p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Case Number *</label>
              <Input
                placeholder="CASE-2024-001"
                value={formData.case_number}
                onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Case Type</label>
              <Input
                placeholder="e.g., Civil, Criminal, Corporate"
                value={formData.case_type}
                onChange={(e) => setFormData({ ...formData, case_type: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input
              placeholder="Case title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Detailed description of the case"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client *</label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To</label>
              <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lawyer" />
                </SelectTrigger>
                <SelectContent>
                  {lawyers.map((lawyer) => (
                    <SelectItem key={lawyer.id} value={lawyer.id}>
                      {lawyer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filing Date</label>
              <Input
                type="date"
                value={formData.filing_date}
                onChange={(e) => setFormData({ ...formData, filing_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hearing Date</label>
              <Input
                type="date"
                value={formData.hearing_date}
                onChange={(e) => setFormData({ ...formData, hearing_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Expected Closure</label>
              <Input
                type="date"
                value={formData.expected_closure_date}
                onChange={(e) => setFormData({ ...formData, expected_closure_date: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Case'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
