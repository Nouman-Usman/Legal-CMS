'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MessageSquare,
  ArrowRight,
  MapPin,
  Search,
  PenTool,
  Plus,
  Briefcase,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Case {
  id: string;
  case_number: string;
  title: string;
  status: 'open' | 'closed' | 'pending' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  next_hearing_date: string | null;
  assigned_to: string;
}

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'review';
  priority: string;
  due_date: string | null;
  case_id: string;
}

interface Hearing {
  id: string;
  case_id: string;
  hearing_date: string;
  court_name: string;
  judge_name: string;
  case: Case;
}

export default function LawyerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<Hearing[]>([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    pendingTasks: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user?.id) return;

      try {
        const { data } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (data && !data.onboarding_completed) {
          router.push('/dashboard/lawyer/onboard');
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      }
    };

    checkOnboarding();
  }, [user?.id, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch active cases for this lawyer
        const { data: cases, error: casesError } = await supabase
          .from('cases')
          .select('*')
          .eq('assigned_to', user.id)
          .eq('status', 'open')
          .order('next_hearing_date', { ascending: true })
          .limit(10);

        if (casesError) throw casesError;
        setActiveCases(cases || []);

        // Fetch pending tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('case_tasks')
          .select('*')
          .eq('assigned_to', user.id)
          .neq('status', 'done')
          .order('due_date', { ascending: true })
          .limit(8);

        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        // Fetch upcoming hearings (next 30 days)
        const today = new Date();
        const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        const { data: hearings, error: hearingsError } = await supabase
          .from('hearings')
          .select(`
            *,
            case:cases(*)
          `)
          .gte('hearing_date', today.toISOString())
          .lte('hearing_date', thirtyDaysLater.toISOString())
          .eq('cases.assigned_to', user.id)
          .order('hearing_date', { ascending: true })
          .limit(5);

        if (hearingsError) throw hearingsError;
        setUpcomingHearings(hearings || []);

        // Calculate stats
        const { data: allCases, error: allCasesError } = await supabase
          .from('cases')
          .select('*', { count: 'exact' })
          .eq('assigned_to', user.id)
          .neq('status', 'archived');

        if (!allCasesError) {
          setStats({
            totalCases: allCases?.length || 0,
            activeCases: cases?.length || 0,
            pendingTasks: tasksData?.length || 0,
            unreadMessages: 0, // TODO: implement when messages are ready
          });
        }
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="lawyer">
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-500 font-medium animate-pulse">Syncing your legal dashboard...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-emerald-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <ProtectedRoute requiredRole="lawyer">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-12">
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Top Banner section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <div className="lg:col-span-2 p-8 rounded-[40px] bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-900 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10 space-y-6">
                <div>
                  <h1 className="text-5xl font-black tracking-tighter leading-none italic">
                    Focus Mode <span className="text-blue-200">ON.</span>
                  </h1>
                  <p className="text-blue-100/80 font-medium mt-4 text-lg max-w-md">
                    You have <span className="text-white font-bold">{stats.activeCases} active cases</span> and <span className="text-white font-bold">{upcomingHearings.length} hearings</span> scheduled for this month. Stay sharp, Counsel.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/dashboard/lawyer/drafting">
                    <Button className="bg-white text-blue-700 hover:bg-blue-50 font-black rounded-2xl h-12 px-8 border-none shadow-xl transition-all hover:scale-105 uppercase tracking-tight text-xs">
                      Resume Drafting
                    </Button>
                  </Link>
                  <Link href="/dashboard/lawyer/research">
                    <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl h-12 px-8 border-white/20 backdrop-blur-sm uppercase tracking-tight text-xs">
                      Start Research
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-20 hidden xl:block">
                <Briefcase className="w-64 h-64 text-white rotate-12" />
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden flex-1 group hover:shadow-xl transition-all cursor-pointer">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase text-slate-400 tracking-widest leading-none">Firm Revenue</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">$12,450</p>
                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs uppercase pt-2">
                      <TrendingUp className="w-3 h-3" /> +12% this month
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden flex-1 group hover:shadow-xl transition-all cursor-pointer">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase text-slate-400 tracking-widest leading-none">Pending Tasks</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{stats.pendingTasks}</p>
                    <div className="flex items-center gap-1 text-blue-500 font-bold text-xs uppercase pt-2">
                      <Clock className="w-3 h-3" /> 2 Due Today
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Research Center', icon: Search, color: 'bg-indigo-600', href: '/dashboard/lawyer/research' },
              { name: 'Doc Lab', icon: PenTool, color: 'bg-indigo-600', href: '/dashboard/lawyer/drafting' },
              { name: 'Messenger', icon: MessageSquare, color: 'bg-indigo-600', href: '/dashboard/lawyer/messages' },
              { name: 'Cases Root', icon: Briefcase, color: 'bg-indigo-600', href: '/dashboard/lawyer/cases' },
            ].map((action) => (
              <Link key={action.name} href={action.href}>
                <button className="w-full p-6 rounded-[32px] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-all hover:shadow-lg hover:border-indigo-500 group">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform", action.color)}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm leading-none">{action.name}</span>
                </button>
              </Link>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column - Critical Cases & Tasks */}
            <div className="lg:col-span-2 space-y-8">

              {/* Active Cases Board */}
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[40px] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black tracking-tight leading-none uppercase">Current Caseload</CardTitle>
                      <CardDescription className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Your active legal files</CardDescription>
                    </div>
                    <Link href="/dashboard/lawyer/cases">
                      <Button variant="ghost" className="rounded-xl font-bold gap-2 text-indigo-600 hover:bg-indigo-50">
                        Explore All <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  {activeCases.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active cases found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeCases.map((caseItem) => (
                        <div
                          key={caseItem.id}
                          className="group p-6 rounded-[32px] bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer relative overflow-hidden"
                          onClick={() => router.push(`/dashboard/lawyer/cases/${caseItem.id}`)}
                        >
                          <div className={`absolute top-0 right-0 w-1.5 h-full ${getPriorityColor(caseItem.priority)}`} />
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <Badge className={cn("rounded-full px-2 py-0 border-none font-bold text-[9px] uppercase tracking-widest", getPriorityColor(caseItem.priority))}>
                                {caseItem.priority}
                              </Badge>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{caseItem.case_number}</span>
                            </div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight line-clamp-2">{caseItem.title}</h3>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                  {caseItem.next_hearing_date ? new Date(caseItem.next_hearing_date).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Workboard/Tasks */}
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[40px] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black tracking-tight leading-none uppercase">Daily Actions</CardTitle>
                      <CardDescription className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Your tactical operation list</CardDescription>
                    </div>
                    <Button variant="outline" className="rounded-xl font-bold gap-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-10 px-6">
                      <Plus className="w-4 h-4" /> New Action
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  {tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting assignments</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-5 rounded-[24px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-2.5 h-2.5 rounded-full",
                              task.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                            )} />
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{task.title}</p>
                              {task.due_date && (
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" /> Due: {new Date(task.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="rounded-lg px-2 h-6 border-slate-200 dark:border-slate-700 font-black text-[9px] uppercase tracking-widest text-slate-500">
                              {task.status}
                            </Badge>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Schedule & CMS Tools */}
            <div className="space-y-8">

              {/* Hearing Radar */}
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[40px] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black tracking-tight leading-none uppercase flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                    Hearings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  {upcomingHearings.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm font-bold text-slate-400 capitalize">Clear courtroom schedule</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingHearings.map((hearing) => (
                        <div key={hearing.id} className="p-5 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                          <h4 className="font-black text-slate-900 dark:text-white text-sm leading-tight line-clamp-1">{hearing.case?.title}</h4>
                          <div className="flex flex-col gap-2 mt-4">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{new Date(hearing.hearing_date).toLocaleDateString()}</span>
                            </div>
                            {hearing.court_name && (
                              <div className="flex items-center gap-2 text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest line-clamp-1">{hearing.court_name}</span>
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="w-full mt-4 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest border-none hover:bg-indigo-600 hover:text-white transition-all">
                            Hearing Brief
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link href="/dashboard/lawyer/calendar">
                    <Button className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] mt-4">
                      Open Full Calendar
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Research & Drafting Promo Card */}
              <div className="p-8 rounded-[40px] bg-slate-900 text-white space-y-8 relative overflow-hidden group border border-slate-800 shadow-2xl">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                  <Search className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">
                    CMS Core Feature
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter leading-none">Legal Intelligence.</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">
                    Access precedents across all jurisdictions and draft complex petitions in minutes.
                  </p>
                  <div className="flex flex-col gap-2 pt-2">
                    <Link href="/dashboard/lawyer/research">
                      <Button variant="ghost" className="w-full justify-between rounded-xl bg-white/5 hover:bg-white/10 text-white h-11 px-4 font-bold border-none">
                        Legal Research <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/dashboard/lawyer/drafting">
                      <Button variant="ghost" className="w-full justify-between rounded-xl bg-white/5 hover:bg-white/10 text-white h-11 px-4 font-bold border-none">
                        Template Lab <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {error && (
            <div className="fixed bottom-8 right-8 flex items-center gap-3 p-4 rounded-2xl bg-rose-600 text-white shadow-2xl animate-in slide-in-from-bottom-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold tracking-tight">{error}</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
