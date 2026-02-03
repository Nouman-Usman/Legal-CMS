'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  MapPin,
  DollarSign
} from 'lucide-react';

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

interface TimeEntry {
  id: string;
  case_id: string;
  minutes: number;
  billable: boolean;
  rate: number | null;
  created_at: string;
  case: Case;
}

export default function LawyerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<Hearing[]>([]);
  const [recentTimeEntries, setRecentTimeEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    pendingTasks: 0,
    hoursLogged: 0,
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

        // Fetch recent time entries (last 7 days)
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const { data: timeEntries, error: timeError } = await supabase
          .from('time_entries')
          .select(`
            *,
            case:cases(*)
          `)
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        if (timeError) throw timeError;
        setRecentTimeEntries(timeEntries || []);

        // Calculate stats
        const { data: allCases, error: allCasesError } = await supabase
          .from('cases')
          .select('*', { count: 'exact' })
          .eq('assigned_to', user.id)
          .neq('status', 'archived');

        if (!allCasesError) {
          const totalHours = (timeEntries || []).reduce((sum, entry) => sum + (entry.minutes / 60), 0);
          
          setStats({
            totalCases: allCases?.length || 0,
            activeCases: cases?.length || 0,
            pendingTasks: tasksData?.length || 0,
            hoursLogged: Math.round(totalHours * 10) / 10,
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
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'closed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <ProtectedRoute requiredRole="lawyer">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                Welcome, {user?.full_name?.split(' ')[0] || 'Lawyer'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your cases, tasks, and time tracking
              </p>
            </div>
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              Log Time
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{stats.totalCases}</span>
                  <FileText className="w-8 h-8 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Active Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-green-600">{stats.activeCases}</span>
                  <CheckCircle2 className="w-8 h-8 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Pending Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-orange-600">{stats.pendingTasks}</span>
                  <AlertCircle className="w-8 h-8 text-orange-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Hours Logged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-purple-600">{stats.hoursLogged}</span>
                  <Clock className="w-8 h-8 text-purple-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-teal-600">{stats.unreadMessages}</span>
                  <MessageSquare className="w-8 h-8 text-teal-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Cases and Tasks */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Active Cases */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Active Cases</CardTitle>
                      <CardDescription>Cases assigned to you</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeCases.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No active cases</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeCases.map((caseItem) => (
                        <div
                          key={caseItem.id}
                          className="flex items-start justify-between p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold">{caseItem.title}</h3>
                              <Badge className={getPriorityColor(caseItem.priority)}>
                                {caseItem.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Case #{caseItem.case_number}
                            </p>
                            {caseItem.next_hearing_date && (
                              <div className="flex items-center gap-1 mt-2 text-sm text-slate-600 dark:text-slate-400">
                                <Calendar className="w-4 h-4" />
                                {new Date(caseItem.next_hearing_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Tasks */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pending Tasks</CardTitle>
                      <CardDescription>Tasks assigned to you</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No pending tasks</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.due_date && (
                              <p className="text-xs text-slate-500 mt-1">
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Badge className={getTaskStatusBadge(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Hearings and Time Tracking */}
            <div className="space-y-6">
              
              {/* Upcoming Hearings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Hearings
                  </CardTitle>
                  <CardDescription>Next 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingHearings.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No upcoming hearings</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingHearings.map((hearing) => (
                        <div key={hearing.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-l-4 border-blue-500">
                          <p className="font-semibold text-sm">{hearing.case?.title}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(hearing.hearing_date).toLocaleDateString()}
                          </div>
                          {hearing.court_name && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-600 dark:text-slate-400">
                              <MapPin className="w-3 h-3" />
                              {hearing.court_name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Time Tracking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Time Entries
                  </CardTitle>
                  <CardDescription>Last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTimeEntries.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No time entries yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentTimeEntries.map((entry) => (
                        <div key={entry.id} className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">{entry.case?.title}</p>
                            <span className="text-slate-600 dark:text-slate-400 font-semibold">
                              {(entry.minutes / 60).toFixed(1)}h
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-500 mt-1">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
                    <TrendingUp className="w-5 h-5" />
                    Billable Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.hoursLogged}h
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-500 mt-2">
                    This week
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {error && (
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
