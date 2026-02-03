'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { getCasesByFilter } from '@/lib/supabase/cases';
import { CaseForm } from '@/components/shared/case-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const loadCases = async () => {
      try {
        const filter: any = {};
        if (statusFilter !== 'all') filter.status = statusFilter;
        if (priorityFilter !== 'all') filter.priority = priorityFilter;

        const { cases: data, error } = await getCasesByFilter(filter);
        if (error) throw error;
        setCases(data || []);
      } catch (err) {
        console.error('Failed to load cases', err);
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, [statusFilter, priorityFilter]);

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <div className="p-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Cases Management</h1>
              <p className="text-muted-foreground">View and manage all cases</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </div>

          {showForm && (
            <CaseForm onSuccess={() => {
              setShowForm(false);
              // Reload cases
              window.location.reload();
            }} />
          )}

          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Cases ({cases.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {cases.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No cases found</p>
                ) : (
                  <div className="space-y-2">
                    {cases.map((caseItem: any) => (
                      <div key={caseItem.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{caseItem.title}</p>
                          <p className="text-sm text-muted-foreground">Case #{caseItem.case_number}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${caseItem.status === 'open' ? 'bg-blue-100 text-blue-700' :
                              caseItem.status === 'closed' ? 'bg-green-100 text-green-700' :
                                caseItem.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                            }`}>
                            {caseItem.status}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${caseItem.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              caseItem.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {caseItem.priority}
                          </span>
                          <Button variant="outline" size="sm">View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
