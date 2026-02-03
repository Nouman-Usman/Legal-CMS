'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  FileText,
  Clock,
  AlertCircle,
  Calendar,
  User,
  ArrowRight,
  TrendingUp,
  Eye,
  Gavel,
  ShieldCheck,
  MessageSquare,
  Search,
  ExternalLink,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Case {
  id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  hearing_date: string | null;
  description: string;
  case_type: string;
  assigned_lawyer: {
    full_name: string;
    email: string;
  } | null;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    closedCases: 0,
    upcomingHearings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      if (!user) return;

      try {
        const { data: clientCases, error: casesError } = await supabase
          .from('cases')
          .select('*, assigned_lawyer:assigned_to(full_name, email)')
          .eq('client_id', user.id)
          .order('updated_at', { ascending: false });

        if (casesError) throw casesError;

        const activeCasesCount = clientCases?.filter(c => c.status === 'open' || c.status === 'active').length || 0;
        const closedCasesCount = clientCases?.filter(c => c.status === 'closed').length || 0;
        const upcomingHearingsCount = clientCases?.filter(c => c.hearing_date && new Date(c.hearing_date) > new Date()).length || 0;

        setCases(clientCases || []);
        setStats({
          totalCases: clientCases?.length || 0,
          activeCases: activeCasesCount,
          closedCases: closedCasesCount,
          upcomingHearings: upcomingHearingsCount,
        });
      } catch (err) {
        setError('Failed to load your legal profile data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [user]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="client">
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Case Data...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-rose-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-emerald-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const activeCases = cases.filter(c => c.status === 'open' || c.status === 'active');

  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-20">
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Top Banner - Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <div className="lg:col-span-2 p-10 rounded-[48px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10 space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white font-black text-[9px] uppercase tracking-widest border border-white/10 backdrop-blur-md">
                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                  Your Legal Guard is Active
                </div>
                <div>
                  <h1 className="text-5xl font-black tracking-tighter leading-none italic">
                    Welcome back, <br />
                    <span className="text-blue-400">Guardian Mode</span> Active.
                  </h1>
                  <p className="text-slate-400 font-medium mt-4 text-lg max-w-md">
                    You have <span className="text-white font-bold">{stats.activeCases} active matters</span> being handled by our expert legal network.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/dashboard/client/cases">
                    <Button className="bg-white text-slate-900 hover:bg-blue-50 font-black rounded-2xl h-12 px-8 border-none shadow-xl transition-all hover:scale-105 uppercase tracking-tight text-xs">
                      View All Files
                    </Button>
                  </Link>
                  <Link href="/dashboard/client/messages">
                    <Button variant="outline" className="bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl h-12 px-8 border-white/20 backdrop-blur-sm uppercase tracking-tight text-xs">
                      Chat with Lawyer
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 hidden xl:block translate-y-1/4 translate-x-1/4">
                <ShieldCheck className="w-[400px] h-[400px] text-white" />
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden flex-1 group hover:shadow-xl transition-all">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none">Hearing Radar</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.upcomingHearings}</p>
                    <div className="flex items-center gap-1 text-orange-500 font-bold text-[10px] uppercase pt-2">
                      <Clock className="w-3 h-3" /> Scheduled Soon
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-[24px] bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                    <Calendar className="w-8 h-8" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden flex-1 group hover:shadow-xl transition-all">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none">Legal Files</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.totalCases}</p>
                    <div className="flex items-center gap-1 text-blue-500 font-bold text-[10px] uppercase pt-2">
                      <CheckCircle2 className="w-3 h-3" /> In Management
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-[24px] bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Layers className="w-8 h-8" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick CMS Access Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'My Case Vault', icon: Gavel, color: 'bg-indigo-600', href: '/dashboard/client/cases' },
              { name: 'Doc Center', icon: FileText, color: 'bg-blue-600', href: '/dashboard/client/documents' },
              { name: 'Lawyer Chat', icon: MessageSquare, color: 'bg-emerald-600', href: '/dashboard/client/messages' },
              { name: 'Lawyer Search', icon: Search, color: 'bg-rose-600', href: '/dashboard/client/find-lawyers' },
            ].map((action) => (
              <Link key={action.name} href={action.href}>
                <button className="w-full p-6 rounded-[32px] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4 transition-all hover:shadow-2xl hover:border-blue-500 group text-left">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform", action.color)}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm leading-none">{action.name}</span>
                </button>
              </Link>
            ))}
          </div>

          {/* Main Content: Tracking Board */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Active Matters Tracking */}
            <div className="lg:col-span-2 space-y-8">

              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[48px] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl font-black tracking-tight leading-none uppercase italic">Active Operations</CardTitle>
                      <CardDescription className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Real-time case progression status</CardDescription>
                    </div>
                    <Link href="/dashboard/client/cases">
                      <Button variant="ghost" className="rounded-xl font-bold gap-2 text-blue-600 hover:bg-blue-50">
                        File Explorer <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-10 pt-4">
                  {activeCases.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50 dark:bg-slate-800/30 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <Gavel className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">No active legal operations detected.</p>
                      <Link href="/dashboard/client/find-lawyers">
                        <Button className="mt-6 bg-slate-900 text-white rounded-xl font-bold px-6">Hire a Lawyer</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {activeCases.map((caseItem) => (
                        <div
                          key={caseItem.id}
                          className="group p-8 rounded-[40px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-pointer relative overflow-hidden"
                          onClick={() => window.location.href = `/dashboard/client/cases/${caseItem.id}`}
                        >
                          <div className={`absolute top-0 right-0 w-2 h-full ${getPriorityColor(caseItem.priority)}`} />
                          <div className="space-y-6">
                            <div className="flex justify-between items-start">
                              <Badge className={cn("rounded-full px-3 py-0.5 border-none font-black text-[10px] uppercase tracking-widest", getPriorityColor(caseItem.priority))}>
                                {caseItem.priority} Priority
                              </Badge>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{caseItem.case_number}</span>
                            </div>

                            <div className="space-y-1">
                              <h3 className="font-black text-slate-900 dark:text-white text-2xl leading-tight group-hover:text-blue-600 transition-colors uppercase italic tracking-tighter">{caseItem.title}</h3>
                              <p className="text-slate-500 font-medium text-sm line-clamp-1">{caseItem.description || 'Proceeding with standard legal protocols.'}</p>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                              <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategy Lead</p>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                    {caseItem.assigned_lawyer?.full_name?.charAt(0) || 'U'}
                                  </div>
                                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{caseItem.assigned_lawyer?.full_name || 'Counsel Assignment Pending'}</p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Field Type</p>
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{caseItem.case_type || 'General Litigation'}</p>
                              </div>
                              <div className="space-y-1 hidden lg:block">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Hearing Radar</p>
                                <div className="flex items-center gap-1.5 text-blue-600 font-black text-xs">
                                  <Clock className="w-3.5 h-3.5" />
                                  {caseItem.hearing_date ? new Date(caseItem.hearing_date).toLocaleDateString() : 'TBD'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column: Schedule & Legal Intelligence */}
            <div className="space-y-8">

              {/* Upcoming Hearing Radar */}
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[48px] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="text-2xl font-black tracking-tight leading-none uppercase italic flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    Radar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-4 space-y-8">
                  {cases.filter(c => c.hearing_date).length === 0 ? (
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center italic">No upcoming session radar.</p>
                  ) : (
                    <div className="space-y-6">
                      {cases.filter(c => c.hearing_date).slice(0, 3).map((c) => (
                        <div key={c.id} className="relative pl-6 border-l-2 border-blue-600/30 group cursor-pointer hover:border-blue-600 transition-colors">
                          <div className="absolute top-0 -left-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 group-hover:scale-125 transition-transform" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{new Date(c.hearing_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            <h4 className="font-black text-slate-900 dark:text-white text-sm leading-tight line-clamp-1 italic uppercase tracking-tighter">{c.title}</h4>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              <MapPin className="w-3 h-3 text-rose-500" /> District Courtroom B
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button className="w-full h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 text-blue-600 hover:bg-blue-100 font-black uppercase tracking-widest text-[10px] border-none shadow-sm">
                    View Full Schedule
                  </Button>
                </CardContent>
              </Card>

              {/* Legal Support Promotional card */}
              <div className="p-10 rounded-[48px] bg-blue-600 text-white space-y-8 relative overflow-hidden group shadow-2xl shadow-blue-600/20">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-6">
                  <h3 className="text-3xl font-black italic tracking-tighter leading-none">Need Expert Counsel?</h3>
                  <p className="text-blue-100 font-medium text-sm leading-relaxed">
                    Our high-tier legal network is ready to defend your rights. Browse verified top-rated lawyers nearby.
                  </p>
                  <Link href="/dashboard/client/find-lawyers" className="block">
                    <Button variant="ghost" className="w-full justify-between rounded-2xl bg-white/20 hover:bg-white text-white hover:text-blue-600 h-12 px-6 font-black uppercase tracking-tight text-xs border-none shadow-lg backdrop-blur-md">
                      Find Experts <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
