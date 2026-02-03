'use client';

import React, { useState, useEffect } from 'react';
import { getCaseById, getCaseDocuments, getTasksByCase, getCaseNotes } from '@/lib/supabase/cases';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, CheckSquare2, StickyNote, AlertCircle, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CaseDetailProps {
  caseId: string;
}

export function CaseDetail({ caseId }: CaseDetailProps) {
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadCaseDetails = async () => {
      try {
        const [caseResult, docsResult, tasksResult, notesResult] = await Promise.all([
          getCaseById(caseId),
          getCaseDocuments(caseId),
          getTasksByCase(caseId),
          getCaseNotes(caseId, user?.id),
        ]);

        if (caseResult.error) throw caseResult.error;

        setCaseData(caseResult.case);
        setDocuments(docsResult.documents || []);
        setTasks(tasksResult.tasks || []);
        setNotes(notesResult.notes || []);
      } catch (err) {
        setError('Failed to load case details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCaseDetails();
  }, [caseId, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 items-center text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>{error || 'Case not found'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColors = {
    active: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
    pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    on_hold: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    closed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-800 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-3xl text-slate-900 dark:text-white">{caseData.title}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">Case #{caseData.case_number}</CardDescription>
            </div>
            <span className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${statusColors[caseData.status] || 'bg-slate-100 dark:bg-slate-800'}`}>
              {caseData.status?.toUpperCase()}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Type</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{caseData.case_type || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Priority</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white capitalize">{caseData.priority}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Filing Date</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{caseData.filing_date ? new Date(caseData.filing_date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Assigned Lawyer</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{caseData.assigned_lawyer?.full_name || 'Unassigned'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <TabsTrigger value="overview" className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Notes ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Description</p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{caseData.description}</p>
              </div>
              {caseData.hearing_date && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Next Hearing
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{new Date(caseData.hearing_date).toLocaleDateString()}</p>
                </div>
              )}
              {caseData.expected_closure_date && (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Expected Closure</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{new Date(caseData.expected_closure_date).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Case Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 py-8 text-center">No documents uploaded</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc: any) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 group"
                    >
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0">Download</span>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Case Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 py-8 text-center">No tasks</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <CheckSquare2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        task.status === 'completed' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {task.status?.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Case Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 py-8 text-center">No notes</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note: any) => (
                    <div key={note.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{note.content}</p>
                        {note.is_private && (
                          <span className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full flex-shrink-0 ml-3 font-semibold">Private</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>\n      </Tabs>
    </div>
  );
}
