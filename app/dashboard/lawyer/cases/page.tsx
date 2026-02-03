'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { getCasesByFilter } from '@/lib/supabase/cases';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { CaseDetail } from '@/components/shared/case-detail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function LawyerCasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCases = async () => {
      if (!user) return;

      try {
        const { cases: data, error } = await getCasesByFilter({
          assigned_to: user.id,
        });
        
        if (error) throw error;
        setCases(data || []);
        
        // Auto-select first case
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

  return (
    <ProtectedRoute requiredRole="lawyer">
      <div className="p-8 bg-gradient-to-b from-slate-50 to-slate-50/50 dark:from-slate-950 dark:to-slate-950/50 min-h-screen">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">My Cases</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Manage and track all your assigned legal cases</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                <p className="text-slate-600 dark:text-slate-400">Loading your cases...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cases List */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm">
                      {cases.length}
                    </span>
                    Your Cases
                  </h3>
                  {cases.length === 0 ? (
                    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <CardContent className="pt-8 text-center text-slate-500 dark:text-slate-400 pb-8">
                        <p className="font-medium">No cases assigned yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {cases.map((caseItem: any) => (
                        <button
                          key={caseItem.id}
                          onClick={() => setSelectedCaseId(caseItem.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 border ${
                            selectedCaseId === caseItem.id
                              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{caseItem.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Case #{caseItem.case_number}</p>
                          {caseItem.status && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 capitalize px-2 py-1 w-fit rounded bg-slate-100 dark:bg-slate-800 mt-2">
                              {caseItem.status}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Case Details */}
              <div className="lg:col-span-2">
                {selectedCaseId ? (
                  <CaseDetail caseId={selectedCaseId} />
                ) : (
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardContent className="pt-12 text-center text-slate-500 dark:text-slate-400 pb-12">
                      <p className="text-lg font-medium">Select a case to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
