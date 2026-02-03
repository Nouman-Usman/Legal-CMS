'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  // Form state for adding lawyer
  const [newLawyer, setNewLawyer] = useState({
    email: '',
    full_name: '',
    phone: '',
    specialization: '',
    bar_number: '',
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
        (payload) => {
          console.log('Lawyer data changed:', payload);
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
      // Try direct query first (works if user can view lawyers via RLS)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'lawyer')
        .eq('chamber_id', user.chamber_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lawyers:', error);
        // If RLS blocks us, just show empty state - lawyers can be added via the invite API
        setLawyers([]);
      } else {
        setLawyers(data || []);
      }
    } catch (err) {
      console.error('Error fetching lawyers:', err);
      setLawyers([]);
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
      // Call the API to invite/add a lawyer
      const response = await fetch('/api/lawyers/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newLawyer,
          chamber_id: user?.chamber_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add lawyer');
      }

      setSuccess('Lawyer invitation email sent successfully!');

      setNewLawyer({
        email: '',
        full_name: '',
        phone: '',
        specialization: '',
        bar_number: '',
      });
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
      console.error('Error updating lawyer:', err);
      setError(err.message || 'Failed to update lawyer');
    } finally {
      setUpdatingLawyer(false);
    }
  };

  const openEditModal = (lawyer: Lawyer) => {
    setEditingLawyer(lawyer);
    setShowEditModal(true);
  };

  const handleResendInvite = async (lawyer: Lawyer) => {
    if (!confirm(`Resend invitation to ${lawyer.full_name} (${lawyer.email})?`)) return;

    setResendingInvite(lawyer.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/lawyers/resend-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lawyer_id: lawyer.id,
          email: lawyer.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invitation');
      }

      setSuccess(`Invitation email sent to ${lawyer.full_name}`);

      // Update status to pending if it was inactive
      if (lawyer.status === 'inactive') {
        setLawyers(prev =>
          prev.map(l => l.id === lawyer.id ? { ...l, status: 'pending' } : l)
        );
      }
    } catch (err: any) {
      console.error('Error resending invitation:', err);
      setError(err.message || 'Failed to resend invitation');
    } finally {
      setResendingInvite(null);
    }
  };

  const handleUpdateStatus = async (lawyerId: string, newStatus: 'active' | 'inactive') => {
    try {
      const response = await fetch(`/api/lawyers/${lawyerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update lawyer status');
      }

      setLawyers(prev =>
        prev.map(l => l.id === lawyerId ? { ...l, status: newStatus } : l)
      );
      setSuccess(`Lawyer status updated to ${newStatus}`);
    } catch (err: any) {
      console.error('Error updating lawyer status:', err);
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

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <div className="p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Lawyers Management</h1>
              <p className="text-muted-foreground">Manage lawyers in your chamber</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/dashboard/chambers-admin/lawyers/onboard';
                  }
                }}
                variant="outline"
                className="flex gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Lawyer Onboarding
              </Button>
              <Button onClick={() => setShowAddModal(true)} className="flex gap-2">
                <UserPlus className="w-4 h-4" />
                Add Lawyer
              </Button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="flex gap-2 items-center p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
              <Check className="w-5 h-5" />
              <p className="text-sm">{success}</p>
              <button onClick={() => setSuccess('')} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {error && (
            <div className="flex gap-2 items-center p-4 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
              <button onClick={() => setError('')} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search lawyers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'pending', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-background/20 text-xs">
                    {lawyers.filter(l => l.status === status).length}
                  </span>
                )}
                {status === 'all' && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-background/20 text-xs">
                    {lawyers.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Lawyers List */}
          <Card>
            <CardHeader>
              <CardTitle>Lawyers Directory</CardTitle>
              <CardDescription>
                {filteredLawyers.length} lawyer{filteredLawyers.length !== 1 ? 's' : ''} in your chamber
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredLawyers.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No lawyers in your chamber yet</p>
                  <Button onClick={() => setShowAddModal(true)} variant="outline">
                    Add Your First Lawyer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLawyers.map((lawyer) => (
                    <div
                      key={lawyer.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {lawyer.full_name?.charAt(0)?.toUpperCase() || 'L'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{lawyer.full_name || 'Unnamed'}</p>
                            {getStatusBadge(lawyer.status)}
                          </div>
                          <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {lawyer.email}
                            </span>
                            {lawyer.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lawyer.phone}
                              </span>
                            )}
                            {lawyer.specialization && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {lawyer.specialization}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setViewingLawyer(lawyer);
                            setShowViewModal(true);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(lawyer)}>
                            Edit Details
                          </DropdownMenuItem>
                          {lawyer.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => handleResendInvite(lawyer)}
                              disabled={resendingInvite === lawyer.id}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {resendingInvite === lawyer.id ? 'Sending...' : 'Resend Invite'}
                            </DropdownMenuItem>
                          )}
                          {lawyer.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lawyer.id, 'inactive')}>
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lawyer.id, 'active')}>
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleRemoveLawyer(lawyer.id)}
                            className="text-destructive"
                          >
                            Remove from Chamber
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Lawyer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Add New Lawyer</CardTitle>
                  <button onClick={() => setShowAddModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <CardDescription>
                  Invite a lawyer to join your chamber. They will receive an email invitation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddLawyer} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      placeholder="lawyer@example.com"
                      value={newLawyer.email}
                      onChange={(e) => setNewLawyer({ ...newLawyer, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input
                      placeholder="John Doe"
                      value={newLawyer.full_name}
                      onChange={(e) => setNewLawyer({ ...newLawyer, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input
                        placeholder="+92 300 1234567"
                        value={newLawyer.phone}
                        onChange={(e) => setNewLawyer({ ...newLawyer, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bar Number</label>
                      <Input
                        placeholder="BAR-12345"
                        value={newLawyer.bar_number}
                        onChange={(e) => setNewLawyer({ ...newLawyer, bar_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Specialization</label>
                    <Input
                      placeholder="e.g., Corporate Law, Family Law"
                      value={newLawyer.specialization}
                      onChange={(e) => setNewLawyer({ ...newLawyer, specialization: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={addingLawyer}>
                      {addingLawyer ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Invite...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Lawyer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {/* Edit Lawyer Modal */}
      {showEditModal && editingLawyer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Edit Lawyer Details</CardTitle>
                <button onClick={() => setShowEditModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription>
                Update information for {editingLawyer.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditLawyer} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={editingLawyer.email}
                    disabled
                    className="bg-muted opacity-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    value={editingLawyer.full_name}
                    onChange={(e) => setEditingLawyer({ ...editingLawyer, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={editingLawyer.phone || ''}
                      onChange={(e) => setEditingLawyer({ ...editingLawyer, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bar Number</label>
                    <Input
                      value={editingLawyer.bar_number || ''}
                      onChange={(e) => setEditingLawyer({ ...editingLawyer, bar_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Specialization</label>
                  <Input
                    value={editingLawyer.specialization || ''}
                    onChange={(e) => setEditingLawyer({ ...editingLawyer, specialization: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={updatingLawyer}>
                    {updatingLawyer ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Lawyer Profile Modal */}
      {showViewModal && viewingLawyer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Lawyer Profile</CardTitle>
                <button onClick={() => setShowViewModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-semibold text-primary">
                      {viewingLawyer.full_name?.charAt(0)?.toUpperCase() || 'L'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{viewingLawyer.full_name}</h3>
                    <div className="mt-2">
                      {getStatusBadge(viewingLawyer.status)}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{viewingLawyer.email}</p>
                      </div>
                    </div>
                    {viewingLawyer.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{viewingLawyer.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Professional Details</h4>
                  <div className="space-y-3">
                    {viewingLawyer.specialization && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Specialization</p>
                          <p className="font-medium">{viewingLawyer.specialization}</p>
                        </div>
                      </div>
                    )}
                    {viewingLawyer.bar_number && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Bar Number</p>
                          <p className="font-medium">{viewingLawyer.bar_number}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <UserPlus className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Joined</p>
                        <p className="font-medium">
                          {new Date(viewingLawyer.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowViewModal(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowViewModal(false);
                      openEditModal(viewingLawyer);
                    }}
                    className="flex-1"
                  >
                    Edit Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ProtectedRoute >
  );
}
