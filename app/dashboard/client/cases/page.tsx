'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Calendar,
  User,
  AlertCircle,
  Phone,
  Mail,
  Download,
  MessageSquare,
  Clock,
  Search,
  ChevronRight,
  Gavel,
  ShieldCheck,
  History,
  Scale,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Lock,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UploadDocumentModal } from '@/components/client/upload-document-modal';
import { ClientDocumentList } from '@/components/client/client-document-list';

interface Case {
  id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  filing_date: string | null;
  description: string;
  case_type: string;
  hearing_date: string | null;
  assigned_lawyer: {
    full_name: string;
    email: string;
  } | null;
}

export default function ClientCasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const loadCases = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('*, assigned_lawyer:assigned_to(full_name, email)')
          .eq('client_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setCases(data || []);
        if (data && data.length > 0) {
          setSelectedCase(data[0]);
        }
      } catch (err) {
        console.error('Failed to load legal files:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCases();
  }, [user]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!selectedCase) return;

      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('case_id', selectedCase.id)
        .order('created_at', { ascending: false });

      if (data) setDocuments(data);
    };
    fetchDocuments();
  }, [selectedCase]);

  const refreshDocuments = async () => {
    if (!selectedCase) return;
    const { data } = await supabase
      .from('case_documents')
      .select('*')
      .eq('case_id', selectedCase.id)
      .order('created_at', { ascending: false });
    if (data) setDocuments(data);
  };

  const filteredCases = cases.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.case_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-rose-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-emerald-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-none";
    switch (status?.toLowerCase()) {
      case 'open':
      case 'active':
        return cn(base, "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400");
      case 'closed':
        return cn(base, "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400");
      case 'pending':
        return cn(base, "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400");
      default:
        return cn(base, "bg-slate-100 dark:bg-slate-800 text-slate-500");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="client">
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Accessing Secure Vault...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden">

          {/* File Explorer Sidebar */}
          <aside className="w-full lg:w-[450px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
            <div className="p-8 pb-6 border-b border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none italic">Legal Dossiers</h1>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Management Cockpit</p>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="Search file index..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm shadow-inner"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {filteredCases.length === 0 ? (
                <div className="text-center py-20 px-8 space-y-4">
                  <ShieldCheck className="w-16 h-16 mx-auto text-slate-100" />
                  <p className="text-xs font-bold text-slate-400 uppercase italic tracking-tighter">No legal records match your active query.</p>
                </div>
              ) : (
                filteredCases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={cn(
                      "w-full p-6 rounded-[32px] text-left transition-all relative overflow-hidden group border",
                      selectedCase?.id === c.id
                        ? "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900 shadow-2xl shadow-blue-500/10"
                        : "bg-slate-50/50 dark:bg-slate-800/20 border-transparent hover:bg-white dark:hover:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700"
                    )}
                  >
                    {selectedCase?.id === c.id && <div className="absolute top-0 right-0 w-2 h-full bg-blue-600" />}
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <Badge className={cn("rounded-full px-2 py-0 border-none font-black text-[9px] uppercase tracking-widest leading-none h-5", getPriorityColor(c.priority))}>
                          {c.priority}
                        </Badge>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{c.case_number}</span>
                      </div>
                      <h3 className={cn(
                        "font-black text-lg leading-tight line-clamp-2 uppercase italic tracking-tighter",
                        selectedCase?.id === c.id ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                      )}>{c.title}</h3>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.hearing_date ? new Date(c.hearing_date).toLocaleDateString() : 'NO SCHEDULE'}</span>
                        <ChevronRight className={cn("w-4 h-4 transition-transform", selectedCase?.id === c.id ? "rotate-0 text-blue-600" : "text-slate-300")} />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-8 bg-slate-900 text-white shrink-0 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Lock className="w-12 h-12" />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure Access Level</p>
                  <p className="text-xl font-black italic">CLIENT_PRIVELEGED</p>
                </div>
                <ShieldCheck className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </aside>

          {/* Detailed View Pane */}
          <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 px-10 py-12 relative animate-in fade-in duration-700">
            {selectedCase ? (
              <div className="max-w-4xl mx-auto space-y-10">

                {/* Dossier Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 dark:border-slate-800 pb-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={getStatusBadge(selectedCase.status)}>
                        {selectedCase.status}
                      </span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">REF: {selectedCase.case_number}</span>
                    </div>
                    <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-[0.9] uppercase">{selectedCase.title}</h2>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filing Date</p>
                    <p className="text-2xl font-black italic text-slate-900 dark:text-white">
                      {selectedCase.filing_date ? new Date(selectedCase.filing_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'ARCHIVE_PENDING'}
                    </p>
                  </div>
                </div>

                {/* Tactical Stats Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Asset Class', value: selectedCase.case_type || 'General', icon: Scale },
                    { label: 'Strategy Priority', value: selectedCase.priority || 'Normal', icon: TrendingUp },
                    { label: 'Lead Counsel', value: selectedCase.assigned_lawyer?.full_name || 'Unassigned', icon: User },
                    { label: 'Next Session', value: selectedCase.hearing_date ? new Date(selectedCase.hearing_date).toLocaleDateString() : 'N/A', icon: Clock },
                  ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed Tabs */}
                <Tabs defaultValue="intel" className="space-y-8">
                  <TabsList className="bg-transparent border-b border-slate-100 dark:border-slate-800 p-0 h-14 w-full flex justify-start gap-8">
                    {['intel', 'documents', 'counsel'].map(tab => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="bg-transparent border-none rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 text-xs font-black uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white transition-all h-full"
                      >
                        {tab === 'intel' ? 'Overview & Intel' : tab === 'counsel' ? 'Counsel Profile' : tab.toUpperCase()}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="intel" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                    <Card className="border-none shadow-none bg-transparent">
                      <CardHeader className="px-0">
                        <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Case Brief</CardTitle>
                      </CardHeader>
                      <CardContent className="px-0">
                        <p className="text-lg font-medium text-slate-600 dark:text-slate-400 leading-relaxed border-l-4 border-blue-600/20 pl-8 italic">
                          {selectedCase.description || 'No formal description has been indexed for this dossier yet. Please check with your lead counsel for detailed strategy notes.'}
                        </p>
                      </CardContent>
                    </Card>

                    <div className="p-10 rounded-[48px] bg-slate-900 text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                        <History className="w-24 h-24" />
                      </div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Recent Progression</h3>
                      <div className="space-y-6 relative z-10">
                        {[
                          { date: 'Recent', action: 'Dossier Access Logged', info: 'Client reviewed file state' },
                          { date: selectedCase.filing_date, action: 'File Officially Indexed', info: 'Case structure created in vault' }
                        ].map((update, i) => (
                          <div key={i} className="flex gap-6 items-start">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 w-24 shrink-0">{update.date ? new Date(update.date).toLocaleDateString() : 'N/A'}</span>
                            <div className="space-y-1">
                              <p className="text-sm font-black uppercase tracking-tight">{update.action}</p>
                              <p className="text-xs text-slate-500 font-medium">{update.info}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Case Vault</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{documents.length} Secure Files</p>
                      </div>
                      <UploadDocumentModal
                        caseId={selectedCase?.id}
                        userId={user?.id || ''}
                        existingDocuments={documents}
                        onUploadComplete={refreshDocuments}
                      />
                    </div>

                    <ClientDocumentList documents={documents} />
                  </TabsContent>

                  <TabsContent value="counsel" className="animate-in slide-in-from-bottom-2 duration-500">
                    <div className="p-10 rounded-[48px] bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-blue-600/20">
                      <div className="w-32 h-32 rounded-[40px] bg-white/10 backdrop-blur-xl flex items-center justify-center text-4xl font-black italic shadow-inner">
                        {selectedCase.assigned_lawyer?.full_name?.charAt(0) || <User className="w-12 h-12" />}
                      </div>
                      <div className="space-y-6 flex-1 text-center md:text-left">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">Lead Counsel Office</p>
                          <h3 className="text-4xl font-black italic tracking-tighter uppercase">{selectedCase.assigned_lawyer?.full_name || 'Assignment in Progress'}</h3>
                          <p className="text-blue-100 font-medium text-sm mt-2">{selectedCase.assigned_lawyer?.email || 'Awaiting synchronization of contact protocols.'}</p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                          <Button className="bg-white text-blue-700 hover:bg-blue-50 font-black rounded-2xl h-12 px-8 border-none shadow-xl uppercase tracking-tight text-xs">
                            <MessageSquare className="w-4 h-4 mr-2" /> Quick Message
                          </Button>
                          <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl h-12 px-8 border-white/20 backdrop-blur-sm uppercase tracking-tight text-xs">
                            <Phone className="w-4 h-4 mr-2" /> Voice Brief
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-sm mx-auto">
                <div className="w-40 h-40 rounded-[64px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-20 h-20 text-slate-100" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Access Control</h2>
                  <p className="text-slate-500 font-medium italic">Select a legal file from the index to decrypt progression intel and shared discovery materials.</p>
                </div>
              </div>
            )}
          </main>

        </div>
      </div>
    </ProtectedRoute>
  );
}
