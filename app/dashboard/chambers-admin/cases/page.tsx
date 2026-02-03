'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { CaseFormModal } from '@/components/shared/case-form-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  FileText,
  Users,
  Calendar,
  Loader2,
  MoreVertical,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  GripHorizontal,
  Gavel,
  ShieldCheck,
  Scale,
  History,
  Clock,
  ArrowRight,
  Sparkles,
  Archive,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Case {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  client_id: string;
  assigned_to?: string;
  status: 'open' | 'closed' | 'pending' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  case_type?: string;
  filing_date?: string;
  next_hearing_date?: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  lawyer_name?: string;
}

export default function CasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal states
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Handlers for modal
  const handleEditCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsEditing(true);
    setShowNewCaseModal(true);
  };

  const handleCreateCase = () => {
    setSelectedCase(null);
    setIsEditing(false);
    setShowNewCaseModal(true);
  };

  const closeModal = () => {
    setShowNewCaseModal(false);
    setSelectedCase(null);
    setIsEditing(false);
  };

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      if (!user?.chamber_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('chamber_id', user.chamber_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrich with client and lawyer names in parallel for performance
        const enrichedCases = await Promise.all(
          (data || []).map(async (caseItem: any) => {
            let clientName = '';
            let lawyerName = '';

            if (caseItem.client_id) {
              const { data: clientData } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', caseItem.client_id)
                .single();
              clientName = clientData?.full_name || 'Unknown';
            }

            if (caseItem.assigned_to) {
              const { data: lawyerData } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', caseItem.assigned_to)
                .single();
              lawyerName = lawyerData?.full_name || 'Unassigned';
            }

            return {
              ...caseItem,
              client_name: clientName,
              lawyer_name: lawyerName || 'Unassigned',
            };
          })
        );

        setCases(enrichedCases);
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [user?.chamber_id]);

  // Filter cases
  useEffect(() => {
    let filtered = cases;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((c) => c.priority === priorityFilter);
    }

    setFilteredCases(filtered);
  }, [cases, searchQuery, statusFilter, priorityFilter]);

  const getStatusBadge = (status: string) => {
    const base = "rounded-full px-4 py-1 font-black text-[9px] uppercase tracking-widest border-none inline-block text-center";
    switch (status?.toLowerCase()) {
      case 'open':
        return <span className={cn(base, "bg-blue-600 text-white shadow-lg shadow-blue-500/20")}>{status}</span>;
      case 'pending':
        return <span className={cn(base, "bg-amber-500 text-white shadow-lg shadow-amber-500/20")}>{status}</span>;
      case 'closed':
        return <span className={cn(base, "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20")}>{status}</span>;
      case 'archived':
        return <span className={cn(base, "bg-slate-500 text-white shadow-lg shadow-slate-500/20")}>{status}</span>;
      default:
        return <span className={cn(base, "bg-slate-200 text-slate-500")}>{status}</span>;
    }
  };

  const caseStats = {
    total: cases.length,
    open: cases.filter((c) => c.status === 'open').length,
    pending: cases.filter((c) => c.status === 'pending').length,
    closed: cases.filter((c) => c.status === 'closed').length,
    critical: cases.filter((c) => c.priority === 'critical').length,
  };

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-20">
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 dark:border-slate-800 pb-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white font-black text-[9px] uppercase tracking-[0.3em]">
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                Matter Registry System
              </div>
              <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-none uppercase italic">Firm <span className="text-blue-600">Dossiers</span></h1>
              <p className="text-slate-500 font-medium italic">High-fidelity index of all active legal procedures within the chamber.</p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleCreateCase}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl h-14 px-10 border-none shadow-2xl transition-all hover:scale-105 uppercase tracking-widest text-[10px] items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Initialize New Dossier
              </Button>
            </div>
          </div>

          {/* Intelligence Units */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Firm Inventory', value: caseStats.total, icon: FileText, color: 'text-slate-900 bg-white' },
              { label: 'Active Deployment', value: caseStats.open, icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
              { label: 'Pending Review', value: caseStats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
              { label: 'Resolved Codes', value: caseStats.closed, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Critical Alert', value: caseStats.critical, icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
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

          {/* Tactical Filter Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Control Sidebar */}
            <div className="lg:col-span-1 space-y-8">

              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="Registry Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-14 pr-4 rounded-[28px] bg-white dark:bg-slate-900 border-none shadow-sm font-bold text-sm"
                />
              </div>

              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5" /> Registry Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-8 space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 italic">Status Code</p>
                  {['all', 'open', 'pending', 'closed', 'archived'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "w-full text-left px-5 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-between",
                        statusFilter === status ? "bg-slate-900 text-white shadow-xl" : "text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {status}
                      {statusFilter === status && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </button>
                  ))}

                  <div className="my-6 border-t border-slate-50" />

                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 italic">Priority Tier</p>
                  {['all', 'low', 'medium', 'high', 'critical'].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setPriorityFilter(priority)}
                      className={cn(
                        "w-full text-left px-5 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-between",
                        priorityFilter === priority ? "bg-rose-600 text-white shadow-xl shadow-rose-600/20" : "text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {priority}
                      {priorityFilter === priority && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </button>
                  ))}
                </CardContent>
              </Card>

              <div className="p-10 rounded-[40px] bg-indigo-950 text-white space-y-6 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                  <History className="w-24 h-24" />
                </div>
                <h3 className="text-xl font-black italic tracking-tighter leading-none uppercase">Archive <br /> Purge Protocol</h3>
                <p className="text-indigo-200 text-xs font-medium leading-relaxed italic">Moving inactive dossiers to long-term encrypted storage optimizes current indexed performance.</p>
                <Button className="w-full h-12 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-black uppercase tracking-widest text-[10px] border-none shadow-xl">
                  Run Health Check
                </Button>
              </div>

            </div>

            {/* Registry Feed */}
            <div className="lg:col-span-3 space-y-6">

              <div className="flex items-center justify-between px-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Indexing results: <span className="text-slate-900 dark:text-white">{filteredCases.length} Matching Records</span></p>
                <div className="flex gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 font-black text-[9px] uppercase tracking-widest border border-emerald-500/20">Active Access</Badge>
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Syncing Firm Database...</p>
                  </div>
                ) : filteredCases.length === 0 ? (
                  <div className="py-40 text-center space-y-6">
                    <Archive className="w-20 h-20 mx-auto text-slate-100" />
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-300">Null Set Identified</h3>
                      <p className="text-slate-400 font-bold text-xs uppercase italic tracking-widest">No matching dossiers found for current parameters.</p>
                    </div>
                  </div>
                ) : (
                  filteredCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-10 rounded-[48px] bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative overflow-hidden"
                    >
                      <div className="flex items-start gap-8">
                        <div className="w-16 h-16 rounded-[28px] bg-slate-50 dark:bg-slate-800 shadow-inner flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6 group-hover:scale-110">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">CODE: {caseItem.case_number}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest",
                              caseItem.priority === 'critical' ? "text-rose-600" : "text-blue-600"
                            )}>{caseItem.priority} PRIORITY</span>
                          </div>
                          <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{caseItem.title}</h3>
                          <div className="flex flex-wrap items-center gap-6 pt-2">
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{caseItem.client_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Gavel className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{caseItem.lawyer_name}</span>
                            </div>
                            {caseItem.next_hearing_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">{new Date(caseItem.next_hearing_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-8 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-slate-50">
                        {getStatusBadge(caseItem.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-2xl w-14 h-14 bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 hover:text-white transition-all">
                              <MoreVertical className="w-6 h-6" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/chambers-admin/cases/${caseItem.id}`)} className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-blue-50">
                              <Eye className="w-4 h-4 mr-2" /> Open Dossier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCase(caseItem)} className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-amber-50">
                              <Edit className="w-4 h-4 mr-2" /> Modify Intel
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer text-rose-600 hover:bg-rose-50">
                              <Trash2 className="w-4 h-4 mr-2" /> Purge Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          onClick={() => router.push(`/dashboard/chambers-admin/cases/${caseItem.id}`)}
                          size="icon"
                          variant="ghost"
                          className="rounded-2xl w-14 h-14 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white transition-all transform hover:translate-x-1"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Case Form Modal */}
      <CaseFormModal
        isOpen={showNewCaseModal}
        onClose={closeModal}
        onSuccess={() => {
          closeModal();
          window.location.reload();
        }}
        caseData={selectedCase}
        isEditing={isEditing}
      />
    </ProtectedRoute>
  );
}
