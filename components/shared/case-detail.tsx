'use client';

import React, { useState, useEffect } from 'react';
import { getCaseById, getCaseDocuments, getTasksByCase, getCaseNotes, createCaseNote, addCaseDocument } from '@/lib/supabase/cases';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, CheckSquare2, StickyNote, AlertCircle, Calendar, Plus, Upload, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskModal } from '@/components/shared/task-modal';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface CaseDetailProps {
  caseId: string;
}

export function CaseDetail({ caseId }: CaseDetailProps) {
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Action states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    loadCaseDetails();
  }, [caseId, user?.id]);

  const handleCreateNote = async () => {
    if (!noteContent.trim() || !user) return;

    try {
      setSubmittingNote(true);
      const { note, error } = await createCaseNote(caseId, {
        content: noteContent,
        created_by: user.id
      });

      if (error) throw error;

      setNoteContent('');
      // Refresh notes
      const { notes: updatedNotes } = await getCaseNotes(caseId, user.id);
      setNotes(updatedNotes || []);
    } catch (err) {
      console.error('Error creating note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);

      // Mocking URL for demonstration as storage is not guaranteed to be setup
      const fileName = `${caseId}/${Date.now()}-${file.name}`;
      const publicUrl = `https://placeholder.com/${fileName}`;

      const { document, error } = await addCaseDocument(caseId, {
        name: file.name,
        type: file.type,
        url: publicUrl,
        uploaded_by: user.id
      });

      if (error) throw error;

      // Refresh documents
      const { documents: updatedDocs } = await getCaseDocuments(caseId);
      setDocuments(updatedDocs || []);

    } catch (err) {
      console.error('Error uploading document:', err);
    } finally {
      setUploading(false);
    }
  };

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

  const statusColors: any = {
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-white">Case Documents</CardTitle>
              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={uploading}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Document
                </Button>
              </div>
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
                          {new Date(doc.created_at || doc.uploaded_at).toLocaleDateString()}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-white">Case Tasks</CardTitle>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowTaskModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 mb-4">No tasks yet</p>
                  <Button variant="outline" size="sm" onClick={() => setShowTaskModal(true)}>
                    Create your first task
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <CheckSquare2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'
                        }`} />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                        {task.assigned_user?.full_name && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Assigned: {task.assigned_user.full_name}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${task.status === 'completed'
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
              <CardTitle className="text-slate-900 dark:text-white">Case Notes & Discussions</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add Note Input */}
              <div className="mb-6 flex gap-2">
                <Textarea
                  placeholder="Type a note or message here..."
                  className="min-h-[80px]"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <Button
                  className="h-auto self-end bg-blue-600 hover:bg-blue-700"
                  onClick={handleCreateNote}
                  disabled={submittingNote || !noteContent.trim()}
                >
                  {submittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>

              {notes.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 py-8 text-center">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note: any) => (
                    <div key={note.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="w-full">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{note.sender?.full_name || 'Unknown User'}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(note.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSuccess={() => {
          loadCaseDetails();
        }}
        caseId={caseId}
      />
    </div>
  );
}
