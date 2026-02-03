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
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

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

  const getStatusBadge = (status: string) => {
    const base = "rounded-full px-4 py-1 font-black text-[9px] uppercase tracking-widest border-none inline-block text-center";
    switch (status?.toLowerCase()) {
      case 'active':
        return <span className={cn(base, "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20")}>{status}</span>;
      case 'pending':
        return <span className={cn(base, "bg-amber-500 text-white shadow-lg shadow-amber-500/20")}>{status}</span>;
      case 'inactive':
        return <span className={cn(base, "bg-slate-500 text-white shadow-lg shadow-slate-500/20")}>{status}</span>;
      default:
        return <span className={cn(base, "bg-slate-200 text-slate-500")}>{status}</span>;
    }
  };

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-20">
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 dark:border-slate-800 pb-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white font-black text-[9px] uppercase tracking-[0.3em]">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                Lawyer Management System
              </div>
              <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-none uppercase italic">Firm <span className="text-blue-600">Lawyers</span></h1>
              <p className="text-slate-500 font-medium italic">Managing our network of lawyers and legal professionals.</p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl h-14 px-10 border-none shadow-2xl transition-all hover:scale-105 uppercase tracking-widest text-[10px] items-center gap-2"
              >
                <UserPlus className="w-5 h-5" /> Add New Lawyer
              </Button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Lawyers', value: lawyers.length, icon: Gavel, color: 'text-slate-900 bg-white' },
              { label: 'Active Lawyers', value: lawyers.filter(l => l.status === 'active').length, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Pending Invitations', value: lawyers.filter(l => l.status === 'pending').length, icon: Send, color: 'text-amber-600 bg-amber-50' },
              { label: 'Firm Capacity', value: 'Over 90%', icon: Sparkles, color: 'text-indigo-600 bg-indigo-50' },
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white group hover:shadow-xl transition-all">
                <CardContent className="p-8 space-y-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", stat.color)}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                    <p className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Control Sidebar */}
            <div className="lg:col-span-1 space-y-8">

              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="Search lawyers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-14 pr-4 rounded-[28px] bg-white dark:bg-slate-900 border-none shadow-sm font-bold text-sm"
                />
              </div>

              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5" /> Roster Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-8 space-y-2">
                  {(['all', 'active', 'pending', 'inactive'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "w-full text-left px-5 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-between",
                        statusFilter === status ? "bg-slate-900 text-white shadow-xl" : "text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {status}
                      <span className="text-[9px]">{lawyers.filter(l => status === 'all' ? true : l.status === status).length}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <div className="p-10 rounded-[40px] bg-indigo-950 text-white space-y-6 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                  <Building2 className="w-24 h-24" />
                </div>
                <h3 className="text-xl font-black italic tracking-tighter leading-none uppercase">Lawyer <br /> Management</h3>
                <p className="text-indigo-200 text-xs font-medium leading-relaxed italic">Monitor lawyer performance, case load, and specializations.</p>
              </div>

            </div>

            {/* Roster Grid */}
            <div className="lg:col-span-3 space-y-6">

              <div className="flex items-center justify-between px-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total found: <span className="text-slate-900 dark:text-white">{filteredLawyers.length} Lawyers</span></p>
                <div className="flex gap-2 text-emerald-500 font-black text-[9px] uppercase tracking-widest items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                  <div className="col-span-full py-40 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Syncing Firm Roster...</p>
                  </div>
                ) : filteredLawyers.length === 0 ? (
                  <div className="col-span-full py-40 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <UserPlus className="w-20 h-20 mx-auto text-slate-100" />
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-300">No Lawyers Found</h3>
                      <p className="text-slate-400 font-bold text-xs uppercase italic tracking-widest">Add a new lawyer to get started.</p>
                    </div>
                  </div>
                ) : (
                  filteredLawyers.map((lawyer) => (
                    <Card key={lawyer.id} className="border-none shadow-sm dark:bg-slate-900 rounded-[48px] overflow-hidden bg-white group hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative">
                      <CardContent className="p-10 space-y-8">
                        <div className="flex justify-between items-start">
                          <div className="w-20 h-20 rounded-[32px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl font-black italic text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                            {lawyer.full_name?.charAt(0) || 'L'}
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            {getStatusBadge(lawyer.status)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-2xl w-10 h-10 bg-slate-50 border-none hover:bg-slate-900 hover:text-white transition-all">
                                  <MoreVertical className="w-5 h-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl">
                                <DropdownMenuItem onClick={() => { setViewingLawyer(lawyer); setShowViewModal(true); }} className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-blue-50">
                                  <Eye className="w-4 h-4 mr-2" /> View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditingLawyer(lawyer); setShowEditModal(true); }} className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-amber-50">
                                  <Edit className="w-4 h-4 mr-2" /> Edit Details
                                </DropdownMenuItem>
                                {lawyer.status === 'pending' && (
                                  <DropdownMenuItem onClick={() => handleResendInvite(lawyer)} className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-emerald-50">
                                    <Send className="w-4 h-4 mr-2" /> Resend Invite
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleRemoveLawyer(lawyer.id)} className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer text-rose-600 hover:bg-rose-50">
                                  <Trash2 className="w-4 h-4 mr-2" /> Remove Lawyer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{lawyer.full_name}</h3>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">{lawyer.specialization || 'Counsel-at-Law'}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{lawyer.email}</span>
                          </div>
                          {lawyer.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lawyer.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Bar: {lawyer.bar_number || 'PENDING'}</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => { setViewingLawyer(lawyer); setShowViewModal(true); }}
                          className="w-full h-12 rounded-2xl bg-slate-50 text-slate-900 hover:bg-blue-600 hover:text-white font-black uppercase tracking-widest text-[10px] border-none shadow-inner transition-all gap-2"
                        >
                          View Profile <ChevronRight className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Add Lawyer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg rounded-[48px] border-none shadow-2xl overflow-hidden bg-white">
            <CardHeader className="p-10 pb-6 text-center space-y-2">
              <div className="w-16 h-16 rounded-[24px] bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xl mb-4">
                <UserPlus className="w-8 h-8" />
              </div>
              <CardTitle className="text-3xl font-black italic uppercase tracking-tighter leading-none">Add New Lawyer</CardTitle>
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Enter the lawyer's details to send an invitation.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0">
              <form onSubmit={handleAddLawyer} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Professional Email *</label>
                  <Input
                    type="email"
                    placeholder="counsel@chambers.com"
                    value={newLawyer.email}
                    onChange={(e) => setNewLawyer({ ...newLawyer, email: e.target.value })}
                    required
                    className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Full Name *</label>
                  <Input
                    placeholder="Enter lawyer's full name"
                    value={newLawyer.full_name}
                    onChange={(e) => setNewLawyer({ ...newLawyer, full_name: e.target.value })}
                    required
                    className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-bold text-sm"
                  />
                </div>



                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900"
                  >
                    Cancel Operations
                  </Button>
                  <Button type="submit" className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20" disabled={addingLawyer}>
                    {addingLawyer ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Invite Link"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Lawyer Modal */}
      {showEditModal && editingLawyer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg rounded-[48px] border-none shadow-2xl overflow-hidden bg-white">
            <CardHeader className="p-10 pb-6 text-center space-y-2">
              <div className="w-16 h-16 rounded-[24px] bg-amber-500 text-white flex items-center justify-center mx-auto shadow-xl mb-4">
                <Edit className="w-8 h-8" />
              </div>
              <CardTitle className="text-3xl font-black italic uppercase tracking-tighter leading-none">Edit Lawyer Info</CardTitle>
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Update professional records for {editingLawyer.full_name}</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0">
              <form onSubmit={handleEditLawyer} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Full Name *</label>
                  <Input
                    value={editingLawyer.full_name}
                    onChange={(e) => setEditingLawyer({ ...editingLawyer, full_name: e.target.value })}
                    required
                    className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Phone Number</label>
                    <Input
                      value={editingLawyer.phone || ''}
                      onChange={(e) => setEditingLawyer({ ...editingLawyer, phone: e.target.value })}
                      className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Bar ID</label>
                    <Input
                      value={editingLawyer.bar_number || ''}
                      onChange={(e) => setEditingLawyer({ ...editingLawyer, bar_number: e.target.value })}
                      className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Specialization</label>
                  <Input
                    value={editingLawyer.specialization || ''}
                    onChange={(e) => setEditingLawyer({ ...editingLawyer, specialization: e.target.value })}
                    className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-bold text-sm"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900"
                  >
                    Abort Changes
                  </Button>
                  <Button type="submit" className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-xl" disabled={updatingLawyer}>
                    {updatingLawyer ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Lawyer Profile Modal */}
      {showViewModal && viewingLawyer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl rounded-[48px] border-none shadow-2xl overflow-hidden bg-white">
            <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-[32px] bg-blue-600 text-white flex items-center justify-center text-4xl font-black italic shadow-2xl">
                  {viewingLawyer.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-900">{viewingLawyer.full_name}</h3>
                  <p className="text-blue-600 font-black uppercase tracking-widest text-[10px] mt-2">{viewingLawyer.specialization || 'Strategic Counselor'}</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </CardHeader>
            <CardContent className="p-10 pt-10 space-y-10">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-50 pb-2">Communications Intel</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Mail className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Digital Address</p>
                        <p className="text-sm font-bold text-slate-900">{viewingLawyer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Phone className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Direct Frequency</p>
                        <p className="text-sm font-bold text-slate-900">{viewingLawyer.phone || 'SECURE LINE PENDING'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-50 pb-2">Professional Grade</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Briefcase className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bar Accreditation</p>
                        <p className="text-sm font-bold text-slate-900">{viewingLawyer.bar_number || 'VERIFICATION PENDING'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><ShieldCheck className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Deployment Status</p>
                        <div className="mt-1">{getStatusBadge(viewingLawyer.status)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Enlistment Date</p>
                  <p className="text-sm font-bold text-slate-900">{new Date(viewingLawyer.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <Button className="h-12 px-8 rounded-2xl bg-blue-600 text-white hover:bg-slate-900 transition-all font-black text-[10px] uppercase tracking-widest border-none shadow-xl shadow-blue-500/20">
                  Generate Performance Audit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile/View/Success HUD Alerts */}
      {inviteLink && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md rounded-[32px] border-none shadow-2xl bg-white p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Invite Sent!</h3>
              <p className="text-slate-500 text-sm font-medium">The lawyer can now join using the email we sent. Here is the direct link for reference:</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 break-all text-[10px] font-mono select-all">
              {inviteLink}
            </div>
            <Button onClick={() => setInviteLink('')} className="w-full h-12 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]">
              Close
            </Button>
          </Card>
        </div>
      )}

      {success && (
        <div className="fixed bottom-8 right-8 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-4 px-8 py-4 rounded-[28px] bg-emerald-600 text-white shadow-2xl border border-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-4 opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-8 right-8 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-4 px-8 py-4 rounded-[28px] bg-rose-600 text-white shadow-2xl border border-rose-500">
            <AlertCircle className="w-6 h-6" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">{error}</p>
            <button onClick={() => setError('')} className="ml-4 opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
