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
  Plus,
  Users,
  FileText,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Filter,
  ChevronRight,
  Gavel,
  ShieldCheck,
  Building2,
  Calendar,
  LayoutGrid,
  Scale,
  Settings,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Search,
  Users2,
  ArrowUpRight,
  ArrowDownRight,
  Circle
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';

export default function ChambersAdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<{
    lawyersCount: number;
    casesCount: number;
    clientsCount: number;
    recentCases: any[];
    statusDistribution: any[];
    priorityDistribution: any[];
    monthlyTrend: any[];
  }>({
    lawyersCount: 0,
    casesCount: 0,
    clientsCount: 0,
    recentCases: [],
    statusDistribution: [],
    priorityDistribution: [],
    monthlyTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (authLoading) return;
        if (!user?.chamber_id) {
          setLoading(false);
          return;
        }

        const chamberId = user.chamber_id;

        // 1. Fetch Basic Counts & All Cases for analytical processing
        const [lawyersRes, casesCountRes, allCasesRes] = await Promise.all([
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('chamber_id', chamberId)
            .eq('role', 'lawyer')
            .is('deleted_at', null),
          supabase
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('chamber_id', chamberId)
            .is('deleted_at', null),
          supabase
            .from('cases')
            .select('id, status, priority, created_at, client_id')
            .eq('chamber_id', chamberId)
            .is('deleted_at', null)
        ]);

        if (lawyersRes.error) throw lawyersRes.error;
        if (casesCountRes.error) throw casesCountRes.error;
        if (allCasesRes.error) throw allCasesRes.error;

        const allCases = allCasesRes.data || [];

        // 2. Process Status Distribution
        const statusMap: Record<string, number> = {};
        allCases.forEach(c => {
          const s = c.status || 'unknown';
          statusMap[s] = (statusMap[s] || 0) + 1;
        });
        const statusDistribution = Object.entries(statusMap).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        }));

        // 3. Process Priority Distribution
        const priorityOrder = ['low', 'medium', 'high', 'critical'];
        const priorityMap: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
        allCases.forEach(c => {
          if (c.priority) priorityMap[c.priority] = (priorityMap[c.priority] || 0) + 1;
        });
        const priorityDistribution = priorityOrder.map(p => ({
          name: p.charAt(0).toUpperCase() + p.slice(1),
          count: priorityMap[p]
        }));

        // 4. Process Monthly Trend (Last 6 months)
        const monthlyMap: Record<string, number> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = d.toLocaleString('default', { month: 'short' });
          monthlyMap[monthKey] = 0;
        }

        allCases.forEach(c => {
          const created = new Date(c.created_at);
          const monthKey = created.toLocaleString('default', { month: 'short' });
          if (monthlyMap[monthKey] !== undefined) {
            monthlyMap[monthKey]++;
          }
        });

        const monthlyTrend = Object.entries(monthlyMap).map(([name, count]) => ({ name, count }));

        // 5. Fetch Recent Cases with enriched data
        const { data: recentCases } = await supabase
          .from('cases')
          .select('*, assigned_lawyer:assigned_to(full_name)')
          .eq('chamber_id', chamberId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5);

        // 6. Unique Clients
        const uniqueClients = new Set(allCases.map(c => c.client_id).filter(Boolean)).size;

        setStats({
          lawyersCount: lawyersRes.count || 0,
          casesCount: casesCountRes.count || 0,
          clientsCount: uniqueClients || 0,
          recentCases: recentCases || [],
          statusDistribution,
          priorityDistribution,
          monthlyTrend,
        });

      } catch (err) {
        console.error("Dashboard enhancement error:", err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, authLoading]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="chamber_admin">
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Loading Dashboard...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-20">
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Top Banner - Firm HQ Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <div className="lg:col-span-2 p-10 rounded-[48px] bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white relative overflow-hidden shadow-2xl border border-white/5">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10 space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white font-black text-[9px] uppercase tracking-[0.3em] border border-white/10 backdrop-blur-md">
                  <Building2 className="w-3 h-3 text-blue-400" />
                  Firm Status: Active
                </div>
                <div>
                  <h1 className="text-5xl font-black tracking-tighter leading-[0.9] italic uppercase">
                    Chambers <br />
                    <span className="text-blue-500">Dashboard</span>
                  </h1>
                  <p className="text-slate-400 font-medium mt-4 text-lg max-w-md">
                    Firm-wide oversight active. Managing <span className="text-white font-bold">{stats.lawyersCount} lawyers</span> across <span className="text-white font-bold">{stats.casesCount} active cases</span>.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Link href="/dashboard/chambers-admin/lawyers/">
                    <Button className="bg-white text-slate-900 hover:bg-blue-50 font-black rounded-2xl h-12 px-8 border-none shadow-xl transition-all hover:scale-105 uppercase tracking-tight text-xs">
                      Add New Lawyer
                    </Button>
                  </Link>
                  <Link href="/dashboard/chambers-admin/cases">
                    <Button variant="outline" className="bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl h-12 px-8 border-white/20 backdrop-blur-sm uppercase tracking-tight text-xs">
                      View All Cases
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 hidden xl:block translate-y-1/4 translate-x-1/4">
                <Gavel className="w-[450px] h-[450px] text-white" />
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden flex-1 group hover:shadow-xl transition-all h-1/2 bg-white">
                <CardContent className="p-8 flex items-center justify-between h-full">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none">Firm Revenue</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">$42.8k</p>
                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-[10px] uppercase pt-2">
                      <ArrowUpRight className="w-3 h-3" /> 12% vs last month
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <div className="text-2xl font-black italic">$</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden flex-1 group hover:shadow-xl transition-all h-1/2 bg-white">
                <CardContent className="p-8 flex items-center justify-between h-full">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none">Firm Capacity</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">82%</p>
                    <div className="flex items-center gap-1 text-blue-500 font-bold text-[10px] uppercase pt-2">
                      <Circle className="w-3 h-3 fill-blue-500" /> Optimal Workload
                    </div>
                  </div>
                  <div className="w-16 h-14 rounded-[24px] bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Users2 className="w-8 h-8" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* KPI Dashboard Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Lawyers', value: stats.lawyersCount, icon: Gavel, color: 'bg-indigo-600', trend: 'Growing' },
              { label: 'Total Cases', value: stats.casesCount, icon: Briefcase, color: 'bg-blue-600', trend: 'Active' },
              { label: 'Firm Clients', value: stats.clientsCount, icon: Users, color: 'bg-emerald-600', trend: 'Loyal' },
              { label: 'New Leads', value: '14', icon: TrendingUp, color: 'text-white bg-rose-600', trend: 'High Priority' },
            ].map((kpi, i) => (
              <div key={i} className="p-8 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col gap-6 shadow-sm group hover:border-blue-500 transition-all">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform", kpi.color)}>
                  <kpi.icon className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-full">{kpi.trend}</span>
                  </div>
                  <p className="text-4xl font-black italic text-slate-900 dark:text-white tracking-tighter">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Operational Intelligence Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Left Col: Core Analytics */}
            <div className="lg:col-span-2 space-y-10">

              {/* Performance Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[48px] overflow-hidden bg-white">
                  <CardHeader className="p-10 pb-0">
                    <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Case Trends</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly case registration</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 pt-6">
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.monthlyTrend}>
                          <defs>
                            <linearGradient id="firmInflow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                          <YAxis hide />
                          <Tooltip cursor={{ stroke: '#3b82f6', strokeWidth: 2 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#firmInflow)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[48px] overflow-hidden bg-white">
                  <CardHeader className="p-10 pb-0">
                    <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Case Status</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distribution by current status</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 pt-6 flex flex-col items-center">
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={80}
                            paddingAngle={6}
                            dataKey="value"
                          >
                            {stats.statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {stats.statusDistribution.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Master Audit Logs - Recent Cases */}
              <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[48px] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl font-black tracking-tight leading-none uppercase italic">Recent Activity</CardTitle>
                      <CardDescription className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Recent case activity across the firm</CardDescription>
                    </div>
                    <Link href="/dashboard/chambers-admin/cases">
                      <Button variant="ghost" className="rounded-xl font-black gap-2 text-blue-600 hover:bg-blue-50 uppercase tracking-widest text-[10px]">
                        All Cases <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-10 pt-4 space-y-4">
                  {stats.recentCases.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
                      <Briefcase className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No recent activity found.</p>
                    </div>
                  ) : (
                    stats.recentCases.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className="group flex flex-col md:flex-row md:items-center justify-between p-8 rounded-[40px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:bg-white transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => router.push(`/dashboard/chambers-admin/cases/${caseItem.id}`)}
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{caseItem.case_number}</span>
                              <Badge className="bg-emerald-500/10 text-emerald-600 font-black text-[8px] uppercase tracking-widest border-none px-2 h-4">{caseItem.status}</Badge>
                            </div>
                            <h4 className="text-lg font-black italic tracking-tighter uppercase leading-none group-hover:text-blue-600 transition-colors">{caseItem.title}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-10 mt-6 md:mt-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Assigned Lawyer</p>
                            <p className="text-sm font-black italic uppercase tracking-tighter truncate max-w-[120px]">{caseItem.assigned_lawyer?.full_name || 'NOT ASSIGNED'}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="rounded-2xl w-12 h-12 bg-white flex-shrink-0">
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Col: Firm Hubs */}
            <div className="space-y-10">

              {/* Tactical Hubs Grid */}
              <div className="grid grid-cols-1 gap-6">
                {[
                  { label: 'Manage Lawyers', href: '/dashboard/chambers-admin/lawyers', icon: Gavel, color: 'bg-indigo-600' },
                  { label: 'Manage Clients', href: '/dashboard/chambers-admin/clients', icon: Users, color: 'bg-blue-600' },
                  { label: 'Manage Leads', href: '/dashboard/chambers-admin/leads', icon: Users2, color: 'bg-emerald-600' },
                  { label: 'General Settings', href: '/dashboard/chambers-admin/settings', icon: Settings, color: 'bg-slate-900' },
                ].map((hub, i) => (
                  <Link href={hub.href} key={i}>
                    <button className="w-full p-8 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/5 transition-all">
                      <div className="flex items-center gap-6">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform", hub.color)}>
                          <hub.icon className="w-7 h-7" />
                        </div>
                        <span className="text-xl font-black italic uppercase tracking-tighter italic">{hub.label}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  </Link>
                ))}
              </div>

              {/* Firm Promo / Support */}
              <div className="p-10 rounded-[48px] bg-blue-600 text-white space-y-8 relative overflow-hidden group shadow-2xl shadow-blue-600/30">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                  <ShieldCheck className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-6">
                  <h3 className="text-3xl font-black italic tracking-tighter leading-none">Expand Your Firm</h3>
                  <p className="text-blue-100 font-medium text-sm leading-relaxed">
                    Expand your legal firm's capabilities with integrated AI research and drafting tools for all associates.
                  </p>
                  <Button variant="ghost" className="w-full justify-between rounded-2xl bg-white/20 hover:bg-white text-white hover:text-blue-600 h-14 px-8 font-black uppercase tracking-[0.2em] text-[10px] border-none shadow-xl backdrop-blur-md">
                    View Upgrade <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

            </div>
          </div >

        </div >
      </div >

      {/* HUD Error Alerts */}
      {
        error && (
          <div className="fixed bottom-8 right-8 animate-in slide-in-from-bottom-10">
            <div className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-rose-600 text-white shadow-2xl border border-rose-500">
              <AlertCircle className="w-5 h-5" />
              <p className="text-xs font-black uppercase tracking-widest">{error}</p>
            </div>
          </div>
        )
      }
    </ProtectedRoute >
  );
}
