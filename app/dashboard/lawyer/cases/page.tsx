'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { getCasesByFilter } from '@/lib/supabase/cases';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { CaseDetail } from '@/components/shared/case-detail';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Search,
  Filter,
  Briefcase,
  Clock,
  Scale,
  ChevronRight,
  MoreVertical,
  Plus,
  LayoutGrid,
  List as ListIcon,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Case {
  id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  next_hearing_date: string | null;
}

export default function LawyerCasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const loadCases = async () => {
      if (!user) return;

      try {
        const { cases: data, error } = await getCasesByFilter({
          assigned_to: user.id,
        });

        if (error) throw error;
        setCases(data || []);

        if (data && data.length > 0) {
          setSelectedCaseId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load cases', err);
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, [user]);

  const filteredCases = cases.filter(c =>
    (activeTab === 'all' || c.status === activeTab) &&
    (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.case_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-rose-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-emerald-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <ProtectedRoute requiredRole="lawyer">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex h-screen overflow-hidden">

          {/* Main List Sidebar */}
          <aside className="w-full lg:w-[450px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
            {/* Header */}
            <div className="p-8 pb-6 border-b border-slate-100 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">Case Vault</h1>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Management Cockpit</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="rounded-xl border border-slate-100 dark:border-slate-800">
                    <LayoutGrid className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="Search file # or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm shadow-inner"
                />
              </div>

              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {['all', 'open', 'pending', 'closed'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      activeTab === tab
                        ? "bg-slate-900 text-white dark:bg-blue-600 shadow-lg"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Repository...</p>
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-20 px-8">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-100" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter italic">No legal records match your active filters.</p>
                </div>
              ) : (
                filteredCases.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={cn(
                      "w-full p-5 rounded-[32px] text-left transition-all relative overflow-hidden group border",
                      selectedCaseId === c.id
                        ? "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900 shadow-2xl shadow-blue-500/10"
                        : "bg-slate-50/50 dark:bg-slate-800/20 border-transparent hover:bg-white dark:hover:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700"
                    )}
                  >
                    {selectedCaseId === c.id && <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600" />}

                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <Badge className={cn("rounded-full px-2 py-0 border-none font-bold text-[9px] uppercase tracking-widest", getPriorityColor(c.priority))}>
                          {c.priority}
                        </Badge>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{c.case_number}</span>
                      </div>

                      <h3 className={cn(
                        "font-black text-lg leading-tight line-clamp-2",
                        selectedCaseId === c.id ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                      )}>{c.title}</h3>

                      <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                            {c.next_hearing_date ? new Date(c.next_hearing_date).toLocaleDateString() : 'NO SCHEDULE'}
                          </span>
                        </div>
                        {selectedCaseId === c.id && (
                          <div className="flex gap-2 ml-auto">
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Bottom Insight */}
            <div className="p-6 bg-slate-900 text-white relative overflow-hidden shrink-0">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Managed Space</p>
                  <p className="text-2xl font-black italic">{cases.length} <span className="text-slate-500 text-sm not-italic font-bold">Files</span></p>
                </div>
                <Button className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-tight">
                  Add Manual File
                </Button>
              </div>
            </div>
          </aside>

          {/* Details Pane */}
          <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 p-10 relative">
            {selectedCaseId ? (
              <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
                <CaseDetail caseId={selectedCaseId} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-32 h-32 rounded-[48px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center shadow-inner">
                  <Scale className="w-16 h-16 text-slate-200" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Review Intelligence</h2>
                  <p className="text-slate-500 font-medium max-w-sm">Select a case dossier from the left panel to begin deep-dive review and action planning.</p>
                </div>
              </div>
            )}
          </main>

        </div>
      </div>
    </ProtectedRoute>
  );
}
