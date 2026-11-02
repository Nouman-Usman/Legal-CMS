'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
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
import { CHART } from '@/lib/dashboard/chart';
import { TodayHearingsPanel } from '@/components/hearings/today-panel';
import { DuesPanel } from '@/components/fees/dues-panel';
import { DashAlert, DashPage, EmptyState, PageHeader, Panel, StatTile, StatusChip } from '@/components/dashboard/ui';

export default function ChambersAdminDashboard() {
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

  const COLORS = [CHART.lime, CHART.violet, 'rgb(245 245 242 / 0.6)', '#626262', '#d9b3fb', 'rgb(245 245 242 / 0.3)'];

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
          // Lawyers are chamber members whose account role is lawyer (no users.chamber_id column)
          supabase
            .from('chamber_members')
            .select('user_id, users:user_id!inner(role)', { count: 'exact', head: true })
            .eq('chamber_id', chamberId)
            .neq('is_active', false)
            .eq('users.role', 'lawyer'),
          supabase
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('chamber_id', chamberId)
            .is('deleted_at', null),
          supabase
            .from('cases')
            .select('id, status, priority, created_at, client_id, client_name')
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
        // Clients are mostly name/phone on the case; a linked account counts by id.
        const uniqueClients = new Set(allCases.map(c => c.client_id || c.client_name?.trim().toLowerCase()).filter(Boolean)).size;

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
        <DashPage>
          <div className="l-empty" role="status">
            <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin" />
            <span className="l-label">Loading Dashboard...</span>
          </div>
        </DashPage>
      </ProtectedRoute>
    );
  }

  const quickLinks = [
    { label: 'Manage Lawyers', href: '/dashboard/chambers-admin/lawyers', icon: Gavel },
    { label: 'Manage Clients', href: '/dashboard/chambers-admin/clients', icon: Users },
    { label: 'Manage Leads', href: '/dashboard/chambers-admin/leads', icon: Users2 },
    { label: 'General Settings', href: '/dashboard/chambers-admin/settings', icon: Settings },
  ];

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <DashPage>
        <PageHeader
          eyebrow="Chamber"
          title="Chambers Dashboard"
          description={
            <>
              Firm-wide oversight active. Managing <strong>{stats.lawyersCount} lawyers</strong> across <strong>{stats.casesCount} active cases</strong>.
            </>
          }
          actions={
            <>
              <Link href="/dashboard/chambers-admin/lawyers/" className="l-btn l-btn--primary l-btn--compact">
                <Plus aria-hidden="true" className="w-4 h-4" /> Add New Lawyer
              </Link>
              <Link href="/dashboard/chambers-admin/cases" className="l-btn l-btn--outline l-btn--compact">
                View All Cases
              </Link>
            </>
          }
        />

        {error && (
          <DashAlert>{error}</DashAlert>
        )}

        <div className="l-stats">
          <StatTile label="Total Lawyers" value={stats.lawyersCount} icon={Gavel} />
          <StatTile label="Total Cases" value={stats.casesCount} icon={Briefcase} />
          <StatTile label="Firm Clients" value={stats.clientsCount} icon={Users} />
        </div>

        <div className="l-grid l-grid--main">
          <div className="l-grid">
            <div className="l-grid l-grid--2">
              <Panel title="Case Trends" action={<span className="l-label">Monthly case registration</span>}>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyTrend}>
                      <defs>
                        <linearGradient id="firmInflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART.lime} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={CHART.lime} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: CHART.muted, fontSize: 11, fontWeight: 600 }} />
                      <YAxis hide />
                      <Tooltip cursor={{ stroke: CHART.lime, strokeWidth: 1 }} contentStyle={CHART.tooltip} labelStyle={{ color: CHART.ink }} itemStyle={{ color: CHART.ink }} />
                      <Area type="monotone" dataKey="count" stroke={CHART.lime} strokeWidth={3} fillOpacity={1} fill="url(#firmInflow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Case Status" action={<span className="l-label">By current status</span>}>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.statusDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                        {stats.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART.tooltip} itemStyle={{ color: CHART.ink }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm">
                  {stats.statusDistribution.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span>{item.name}</span>
                      <span className="l-muted">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            <Panel
              title="Recent Activity"
              flush
              action={
                <Link href="/dashboard/chambers-admin/cases" className="l-link text-sm">
                  All Cases
                </Link>
              }
            >
              {stats.recentCases.length === 0 ? (
                <EmptyState icon={Briefcase} title="No recent activity found." />
              ) : (
                <ul className="l-rows">
                  {stats.recentCases.map((caseItem) => (
                    <li key={caseItem.id}>
                      <Link href={`/dashboard/chambers-admin/cases/${caseItem.id}`} className="flex items-center gap-4 -my-1 py-1">
                        <FileText aria-hidden="true" className="w-5 h-5 shrink-0 l-muted" />
                        <span className="flex flex-col gap-1 min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="l-label">{caseItem.case_number}</span>
                            <StatusChip status={caseItem.status} />
                          </span>
                          <span className="font-semibold truncate">{caseItem.title}</span>
                          <span className="text-sm l-muted">
                            Assigned Lawyer: {caseItem.assigned_lawyer?.full_name || 'Not assigned'}
                          </span>
                        </span>
                        <ChevronRight aria-hidden="true" className="w-5 h-5 shrink-0 l-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="l-grid">
          <TodayHearingsPanel docketHref="/dashboard/chambers-admin/docket" casePath={(id) => `/dashboard/chambers-admin/cases/${id}`} />
          <DuesPanel chamberId={user?.chamber_id} limit={5} />
          <Panel title="Quick Links" flush>
            <ul className="l-rows">
              {quickLinks.map((hub) => (
                <li key={hub.href}>
                  <Link href={hub.href} className="flex items-center gap-3 min-h-11">
                    <hub.icon aria-hidden="true" className="w-5 h-5 shrink-0 l-muted" />
                    <span className="flex-1 font-medium">{hub.label}</span>
                    <ArrowRight aria-hidden="true" className="w-4 h-4 l-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          </div>
        </div>
      </DashPage>
    </ProtectedRoute>
  );
}
