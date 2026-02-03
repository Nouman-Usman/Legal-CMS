'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Clock, AlertCircle, Calendar, User, ArrowRight, TrendingUp, Eye } from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
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
        // Fetch cases for this client
        const { data: clientCases, error: casesError } = await supabase
          .from('cases')
          .select('*, assigned_lawyer:assigned_to(full_name, email)')
          .eq('client_id', user.id)
          .order('updated_at', { ascending: false });

        if (casesError) throw casesError;

        const activeCasesCount = clientCases?.filter(c => c.status === 'active').length || 0;
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
        setError('Failed to load your cases');
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
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
            <p className="text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      case 'closed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'on_hold':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <ProtectedRoute requiredRole="client">
      <div className="p-8 bg-gradient-to-b from-slate-50 to-slate-50/50 dark:from-slate-950 dark:to-slate-950/50 min-h-screen">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">My Legal Cases</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Track all your legal matters and stay updated</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Total Cases</p>
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalCases}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Active Cases</p>
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.activeCases}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Closed Cases</p>
                    <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.closedCases}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Upcoming Hearings</p>
                    <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.upcomingHearings}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-3 items-start p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Cases List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Cases</h2>
              <span className="text-sm text-slate-600 dark:text-slate-400">{cases.length} case{cases.length !== 1 ? 's' : ''}</span>
            </div>

            {cases.length > 0 ? (
              <div className="space-y-3">
                {cases.map((caseItem: any) => (
                  <Card 
                    key={caseItem.id} 
                    className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{caseItem.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Case #{caseItem.case_number}</p>
                        </div>
                        <Badge className={`text-xs font-bold whitespace-nowrap ${getStatusColor(caseItem.status)}`}>
                          {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">{caseItem.description || 'No description provided'}</p>

                      {/* Case Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Assigned Lawyer</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{caseItem.assigned_lawyer?.full_name || 'Unassigned'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Case Type</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{caseItem.case_type || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Filing Date</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {caseItem.filing_date ? new Date(caseItem.filing_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Priority</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{caseItem.priority || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Next Hearing */}
                      {caseItem.hearing_date && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-lg mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Next Hearing</p>
                          </div>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">
                            {new Date(caseItem.hearing_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button 
                        variant="default"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Case Details
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="pt-12 pb-12 text-center">
                  <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 font-medium">No cases yet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Once your lawyer assigns a case to you, it will appear here</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
