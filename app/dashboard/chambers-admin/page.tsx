'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Users, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ChambersAdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<{
    lawyersCount: number;
    casesCount: number;
    clientsCount: number;
    recentCases: any[];
  }>({
    lawyersCount: 0,
    casesCount: 0,
    clientsCount: 0,
    recentCases: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Note: Removed auto-redirect to setup to prevent potential loops
  // Users without a chamber will see the dashboard but with limited functionality

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (authLoading) return;

        if (!user) {
          setLoading(false);
          return;
        }

        // If no chamber, we can't fetch stats yet
        if (!user.chamber_id) {
          setLoading(false);
          return;
        }

        const chamberId = user.chamber_id;

        // Fetch lawyers count
        const { count: lawyersCount, error: lawyersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('chamber_id', chamberId)
          .eq('role', 'lawyer')
          .is('deleted_at', null);

        // Fetch cases count
        const { count: casesCount, error: casesError } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('chamber_id', chamberId)
          .is('deleted_at', null);

        // Fetch clients count (approximate via distinct client_id in cases)
        const { data: caseClients, error: clientsError } = await supabase
          .from('cases')
          .select('client_id')
          .eq('chamber_id', chamberId)
          .is('deleted_at', null);

        const uniqueClients = new Set(caseClients?.map(c => c.client_id).filter(Boolean)).size;

        // Fetch recent cases
        const { data: recentCases, error: casesDataError } = await supabase
          .from('cases')
          .select('*, assigned_lawyer:assigned_to(full_name)')
          .eq('chamber_id', chamberId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (lawyersError || casesError || clientsError || casesDataError) {
          console.error("Dashboard fetch error:", { lawyersError, casesError, clientsError, casesDataError });
        }

        setStats({
          lawyersCount: lawyersCount || 0,
          casesCount: casesCount || 0,
          clientsCount: uniqueClients || 0,
          recentCases: recentCases || [],
        });
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError('Failed to load dashboard data');
      } finally {
        if (!authLoading && user) {
          setLoading(false);
        }
      }
    };

    fetchStats();
  }, [user, authLoading]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="chamber_admin">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <div className="p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Chambers Dashboard</h1>
              <p className="text-muted-foreground">Manage your law firm operations</p>
            </div>
            <Button className="flex gap-2">
              <Plus className="w-4 h-4" />
              New Case
            </Button>
          </div>

          {/* Setup Prompt if no chamber */}
          {!user?.chamber_id && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Complete Your Setup</h3>
                    <p className="text-muted-foreground text-sm">
                      Set up your chamber to start managing lawyers and cases
                    </p>
                  </div>
                  <Link href="/dashboard/chambers-admin/setup">
                    <Button>Set Up Chamber</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Lawyers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-3xl font-bold">{stats.lawyersCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-3xl font-bold">{stats.casesCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-3xl font-bold">{stats.clientsCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 items-start p-4 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Recent Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Cases</CardTitle>
              <CardDescription>Latest cases in your chamber</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentCases.length > 0 ? (
                  stats.recentCases.map((caseItem: any) => (
                    <div key={caseItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{caseItem.case_number}</p>
                        <p className="text-sm text-muted-foreground">{caseItem.title}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No cases yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
