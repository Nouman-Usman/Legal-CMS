'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import {
  Loader2,
  Plus,
  UserPlus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Briefcase,
  X,
  Check,
  AlertCircle,
  Send,
  Eye,
  ShieldCheck,
  ChevronRight,
  Gavel,
  CheckCircle2,
  Trash2,
  Edit,
  Building2,
  Award,
  Sparkles,
  Filter,
  Calendar,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashDialog, DashField, DashPage, DashToast, EmptyState, PageHeader, Panel, SearchInput, StatTile, StatusChip } from '@/components/dashboard/ui';

interface Lawyer {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  specialization?: string;
  bar_number?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

export default function LawyersPage() {
  const { user } = useAuth();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  // Form state for adding lawyer
  const [newLawyer, setNewLawyer] = useState({
    email: '',
    full_name: '',
  });
  const [addingLawyer, setAddingLawyer] = useState(false);

  // Form state for editing lawyer
  const [editingLawyer, setEditingLawyer] = useState<Lawyer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingLawyer, setUpdatingLawyer] = useState(false);

  // Form state for viewing lawyer
  const [viewingLawyer, setViewingLawyer] = useState<Lawyer | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');

  useEffect(() => {
    fetchLawyers();
  }, [user]);

  // Auto-refresh when lawyers are updated via status changes
  useEffect(() => {
    if (!user?.chamber_id) return;

    const channel = supabase
      .channel('lawyers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `chamber_id=eq.${user.chamber_id}`,
        },
        () => {
          fetchLawyers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.chamber_id]);

  const fetchLawyers = async () => {
    if (!user || !user.chamber_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'lawyer')
        .eq('chamber_id', user.chamber_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLawyers(data || []);
    } catch (err) {
      console.error('Error fetching lawyers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLawyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAddingLawyer(true);

    try {
      const response = await fetch('/api/lawyers/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLawyer, chamber_id: user?.chamber_id }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add lawyer');

      setSuccess('Lawyer invitation email sent successfully!');
      if (result.inviteLink) setInviteLink(result.inviteLink);
      setNewLawyer({ email: '', full_name: '' });
      setShowAddModal(false);
      fetchLawyers();
    } catch (err: any) {
      setError(err.message || 'Failed to add lawyer');
    } finally {
      setAddingLawyer(false);
    }
  };

  const handleEditLawyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLawyer) return;

    setError('');
    setSuccess('');
    setUpdatingLawyer(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editingLawyer.full_name,
          phone: editingLawyer.phone,
          specialization: editingLawyer.specialization,
          bar_number: editingLawyer.bar_number,
        })
        .eq('id', editingLawyer.id);

      if (error) throw error;

      setSuccess('Lawyer updated successfully');
      setLawyers(prev => prev.map(l => l.id === editingLawyer.id ? editingLawyer : l));
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update lawyer');
    } finally {
      setUpdatingLawyer(false);
    }
  };

  const handleResendInvite = async (lawyer: Lawyer) => {
    setResendingInvite(lawyer.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/lawyers/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lawyer_id: lawyer.id, email: lawyer.email }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to resend invitation');

      setSuccess(`Invitation email sent to ${lawyer.full_name}`);
      if (lawyer.status === 'inactive') {
        setLawyers(prev => prev.map(l => l.id === lawyer.id ? { ...l, status: 'pending' } : l));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend invitation');
    } finally {
      setResendingInvite(null);
    }
  };

  const handleUpdateStatus = async (lawyerId: string, newStatus: 'active' | 'inactive') => {
    try {
      const response = await fetch(`/api/lawyers/${lawyerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update lawyer status');

      setLawyers(prev => prev.map(l => l.id === lawyerId ? { ...l, status: newStatus } : l));
      setSuccess(`Lawyer status updated to ${newStatus}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update lawyer status');
    }
  };

  const handleRemoveLawyer = async (lawyerId: string) => {
    if (!confirm('Are you sure you want to remove this lawyer from your chamber?')) return;

    try {
      const response = await fetch(`/api/lawyers/${lawyerId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove lawyer');
      }

      setLawyers(prev => prev.filter(l => l.id !== lawyerId));
      setSuccess('Lawyer removed from chamber');
    } catch (err: any) {
      console.error('Error removing lawyer:', err);
      setError(err.message || 'Failed to remove lawyer');
    }
  };

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSearch = lawyer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lawyer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ['all', 'active', 'pending', 'inactive'] as const;

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <DashPage>
        <PageHeader
          eyebrow="Lawyer Management System"
          title="Firm Lawyers"
          description="Managing our network of lawyers and legal professionals."
          actions={
            <button type="button" onClick={() => setShowAddModal(true)} className="l-btn l-btn--primary l-btn--compact">
              <UserPlus aria-hidden="true" className="w-4 h-4" /> Add New Lawyer
            </button>
          }
        />

        <div className="l-stats">
          <StatTile label="Total Lawyers" value={lawyers.length} icon={Gavel} />
          <StatTile label="Active Lawyers" value={lawyers.filter((l) => l.status === 'active').length} icon={ShieldCheck} />
          <StatTile label="Pending Invitations" value={lawyers.filter((l) => l.status === 'pending').length} icon={Send} />
        </div>

        <div className="l-grid l-grid--side">
          <Panel title="Roster Filters">
            <div className="flex flex-col gap-5">
              <SearchInput label="Search lawyers" placeholder="Search lawyers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
                {statusOptions.map((status) => (
                  <button key={status} type="button" onClick={() => setStatusFilter(status)} aria-pressed={statusFilter === status} className="l-filter">
                    {status} <span className="l-muted">{lawyers.filter((l) => (status === 'all' ? true : l.status === status)).length}</span>
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel
            title="Roster"
            flush
            action={
              <span className="text-sm l-muted">
                Total found: <strong className="l-ink">{filteredLawyers.length} Lawyers</strong>
              </span>
            }
          >
            {loading ? (
              <div className="l-empty" role="status">
                <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin" />
                <span className="l-label">Syncing Firm Roster...</span>
              </div>
            ) : filteredLawyers.length === 0 ? (
              <EmptyState icon={UserPlus} title="No Lawyers Found" hint="Add a new lawyer to get started." />
            ) : (
              <ul className="l-people m-0 list-none">
                {filteredLawyers.map((lawyer) => (
                  <li key={lawyer.id} className="l-person">
                    <div className="flex items-start justify-between gap-3">
                      <span className="l-avatar" aria-hidden="true">
                        {lawyer.full_name?.charAt(0) || 'L'}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusChip status={lawyer.status} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="l-icon-btn" aria-label={`Actions for ${lawyer.full_name}`}>
                              <MoreVertical aria-hidden="true" className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setViewingLawyer(lawyer); setShowViewModal(true); }}>
                              <Eye aria-hidden="true" className="w-4 h-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditingLawyer(lawyer); setShowEditModal(true); }}>
                              <Edit aria-hidden="true" className="w-4 h-4" /> Edit Details
                            </DropdownMenuItem>
                            {lawyer.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleResendInvite(lawyer)} disabled={resendingInvite === lawyer.id}>
                                <Send aria-hidden="true" className="w-4 h-4" /> Resend Invite
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleRemoveLawyer(lawyer.id)} className="text-destructive">
                              <Trash2 aria-hidden="true" className="w-4 h-4" /> Remove Lawyer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <h3 className="m-0 text-base font-semibold truncate">{lawyer.full_name}</h3>
                      <p className="m-0 text-sm l-muted">{lawyer.specialization || 'Counsel-at-Law'}</p>
                    </div>
                    <ul className="flex flex-col gap-1.5 m-0 p-0 list-none text-sm l-muted">
                      <li className="flex items-center gap-2 min-w-0">
                        <Mail aria-hidden="true" className="w-4 h-4 shrink-0" /> <span className="truncate">{lawyer.email}</span>
                      </li>
                      {lawyer.phone && (
                        <li className="flex items-center gap-2">
                          <Phone aria-hidden="true" className="w-4 h-4 shrink-0" /> {lawyer.phone}
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <Briefcase aria-hidden="true" className="w-4 h-4 shrink-0" /> Bar: {lawyer.bar_number || 'PENDING'}
                      </li>
                    </ul>
                    <button
                      type="button"
                      className="l-btn l-btn--outline l-btn--compact mt-auto"
                      onClick={() => { setViewingLawyer(lawyer); setShowViewModal(true); }}
                    >
                      View Profile <ChevronRight aria-hidden="true" className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </DashPage>

      <DashDialog open={showAddModal} onOpenChange={setShowAddModal} title="Add New Lawyer" description="Enter the lawyer's details to send an invitation.">
        <form onSubmit={handleAddLawyer} className="l-form">
          <DashField
            label="Professional Email *"
            type="email"
            placeholder="counsel@chambers.com"
            value={newLawyer.email}
            onChange={(e) => setNewLawyer({ ...newLawyer, email: e.target.value })}
            required
          />
          <DashField
            label="Full Name *"
            placeholder="Enter lawyer's full name"
            value={newLawyer.full_name}
            onChange={(e) => setNewLawyer({ ...newLawyer, full_name: e.target.value })}
            required
          />
          <div className="l-dialog-actions">
            <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => setShowAddModal(false)}>
              Cancel Operations
            </button>
            <button type="submit" className="l-btn l-btn--primary l-btn--compact" disabled={addingLawyer}>
              {addingLawyer ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : 'Send Invite Link'}
            </button>
          </div>
        </form>
      </DashDialog>

      <DashDialog
        open={showEditModal && !!editingLawyer}
        onOpenChange={setShowEditModal}
        title="Edit Lawyer Info"
        description={editingLawyer ? `Update professional records for ${editingLawyer.full_name}` : undefined}
      >
        {editingLawyer && (
          <form onSubmit={handleEditLawyer} className="l-form">
            <DashField label="Full Name *" value={editingLawyer.full_name} onChange={(e) => setEditingLawyer({ ...editingLawyer, full_name: e.target.value })} required />
            <DashField label="Phone Number" value={editingLawyer.phone || ''} onChange={(e) => setEditingLawyer({ ...editingLawyer, phone: e.target.value })} />
            <DashField label="Bar ID" value={editingLawyer.bar_number || ''} onChange={(e) => setEditingLawyer({ ...editingLawyer, bar_number: e.target.value })} />
            <DashField label="Specialization" value={editingLawyer.specialization || ''} onChange={(e) => setEditingLawyer({ ...editingLawyer, specialization: e.target.value })} />
            <div className="l-dialog-actions">
              <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => setShowEditModal(false)}>
                Abort Changes
              </button>
              <button type="submit" className="l-btn l-btn--primary l-btn--compact" disabled={updatingLawyer}>
                {updatingLawyer ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </DashDialog>

      <DashDialog
        open={showViewModal && !!viewingLawyer}
        onOpenChange={setShowViewModal}
        title={viewingLawyer?.full_name || ''}
        description={viewingLawyer?.specialization || 'Strategic Counselor'}
      >
        {viewingLawyer && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 m-0">
            {[
              { term: 'Digital Address', value: viewingLawyer.email, icon: Mail },
              { term: 'Direct Frequency', value: viewingLawyer.phone || 'SECURE LINE PENDING', icon: Phone },
              { term: 'Bar Accreditation', value: viewingLawyer.bar_number || 'VERIFICATION PENDING', icon: Briefcase },
              {
                term: 'Enlistment Date',
                value: new Date(viewingLawyer.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
                icon: Calendar,
              },
            ].map((fact) => (
              <div key={fact.term} className="flex flex-col gap-1 rounded-2xl border border-border bg-secondary p-4">
                <dt className="l-label inline-flex items-center gap-1.5">
                  <fact.icon aria-hidden="true" className="w-3.5 h-3.5" /> {fact.term}
                </dt>
                <dd className="m-0 font-medium break-words">{fact.value}</dd>
              </div>
            ))}
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-secondary p-4">
              <dt className="l-label inline-flex items-center gap-1.5">
                <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5" /> Deployment Status
              </dt>
              <dd className="m-0">
                <StatusChip status={viewingLawyer.status} />
              </dd>
            </div>
          </dl>
        )}
      </DashDialog>

      <DashDialog open={!!inviteLink} onOpenChange={(open) => !open && setInviteLink('')} title="Invite Sent!" description="The lawyer can now join using the email we sent. Here is the direct link for reference:">
        <code className="block rounded-xl border border-border bg-secondary p-3 text-sm break-all">{inviteLink}</code>
        <div className="l-dialog-actions">
          <button type="button" className="l-btn l-btn--primary l-btn--compact" onClick={() => setInviteLink('')}>
            Close
          </button>
        </div>
      </DashDialog>

      {success && <DashToast onClose={() => setSuccess('')}>{success}</DashToast>}
      {error && (
        <DashToast tone="error" onClose={() => setError('')}>
          {error}
        </DashToast>
      )}
    </ProtectedRoute>
  );
}
