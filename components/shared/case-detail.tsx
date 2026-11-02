'use client';

import React, { useState, useEffect } from 'react';
import { getCaseById, getTasksByCase, getCaseNotes, createCaseNote } from '@/lib/supabase/cases';
import { deleteCaseDocument, getCaseDocuments, getDocumentUrl, uploadCaseDocument, type CaseDocument } from '@/lib/supabase/documents';
import { DOCUMENT_ACCEPT } from '@/lib/documents/storage-path';
import { useAuth } from '@/lib/contexts/auth-context';
import { Loader2, FileText, CheckSquare2, Calendar, Plus, Upload, Send, Download, Eye, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskModal } from '@/components/shared/task-modal';
import { DashAlert, DashDialog, EmptyState, Panel, StatusChip } from '@/components/dashboard/ui';
import { HearingLog } from '@/components/hearings/hearing-log';
import { CaseFeesPanel } from '@/components/fees/case-fees-panel';
import { CaseDeadlines } from '@/components/deadlines/deadline-list';
import { getCaseDeadlines, type Deadline } from '@/lib/supabase/deadlines';
import { getCaseParties } from '@/lib/supabase/intake';
import { dueBucket, pkToday } from '@/lib/deadlines/limitation';

interface CaseDetailProps {
  caseId: string;
}

export function CaseDetail({ caseId }: CaseDetailProps) {
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
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
  const [docError, setDocError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<CaseDocument | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [opposing, setOpposing] = useState<string[]>([]);

  const loadCaseDetails = async () => {
    try {
      const [caseResult, docsResult, tasksResult, notesResult, deadlinesResult, partiesResult] = await Promise.all([
        getCaseById(caseId),
        getCaseDocuments(caseId),
        getTasksByCase(caseId),
        getCaseNotes(caseId, user?.id),
        getCaseDeadlines(caseId),
        getCaseParties(caseId),
      ]);

      if (caseResult.error) throw caseResult.error;

      setCaseData(caseResult.case);
      setDocuments(docsResult.documents || []);
      setTasks(tasksResult.tasks || []);
      setNotes(notesResult.notes || []);
      setDeadlines(deadlinesResult.deadlines);
      setOpposing(partiesResult.parties.filter((p) => p.role === 'opposing').map((p) => p.name));
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

  const refreshDocuments = async () => {
    const { documents: updatedDocs } = await getCaseDocuments(caseId);
    setDocuments(updatedDocs);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length || !user || !caseData?.chamber_id) return;

    setUploading(true);
    setDocError('');
    const failed: string[] = [];
    for (const file of files) {
      const { error } = await uploadCaseDocument({ chamberId: caseData.chamber_id, caseId, userId: user.id, file });
      if (error) failed.push(`${file.name}: ${error.message}`);
    }
    await refreshDocuments();
    setUploading(false);
    if (failed.length) setDocError(failed.join(' · '));
  };

  const openDocument = async (doc: CaseDocument, download = false) => {
    // Open the tab during the click so popup blockers allow it, then point it at the signed URL.
    const win = download ? null : window.open('', '_blank');
    const { url, error } = await getDocumentUrl(doc, download);
    if (error || !url) {
      win?.close();
      setDocError(error?.message || 'Could not open the document.');
      return;
    }
    if (win) {
      win.opener = null;
      win.location.href = url;
    } else {
      window.location.href = url;
    }
  };

  const removeDocument = async (doc: CaseDocument) => {
    setDocError('');
    const { error } = await deleteCaseDocument(doc);
    if (error) setDocError(error.message || 'Could not delete the document. Only the uploader or a chamber admin can delete it.');
    await refreshDocuments();
  };

  if (loading) {
    return (
      <div className="l-empty" role="status">
        <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin" />
        <span className="sr-only">Loading case</span>
      </div>
    );
  }

  if (error || !caseData) {
    return <DashAlert>{error || 'Case not found'}</DashAlert>;
  }

  const today = pkToday();
  const openDeadlines = deadlines.filter((d) => d.status === 'open').length;
  const overdue = deadlines.filter((d) => d.status === 'open' && dueBucket(d.due_date, today) === 'overdue').length;

  const facts = [
    { term: 'Type', value: caseData.case_type || 'N/A' },
    { term: 'Priority', value: caseData.priority },
    { term: 'Filing Date', value: caseData.filing_date ? new Date(caseData.filing_date).toLocaleDateString() : 'N/A' },
    { term: 'Assigned Lawyer', value: caseData.assigned_lawyer?.full_name || 'Unassigned' },
    { term: 'Client', value: [caseData.client_name, caseData.client_phone].filter(Boolean).join(' · ') || 'Not set' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="l-panel">
        <div className="l-panel__body flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <span className="l-label">Case #{caseData.case_number}</span>
              <h1 className="l-dash-title">{caseData.title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {overdue > 0 && (
                <button type="button" className="l-chip l-chip--danger" onClick={() => setActiveTab('deadlines')}>
                  {overdue} deadline{overdue === 1 ? '' : 's'} overdue
                </button>
              )}
              <StatusChip status={caseData.status}>{caseData.status?.toUpperCase()}</StatusChip>
            </div>
          </div>
          <dl className="grid grid-cols-2 lg:grid-cols-5 gap-4 m-0">
            {facts.map((fact) => (
              <div key={fact.term} className="flex flex-col gap-1">
                <dt className="l-label">{fact.term}</dt>
                <dd className="m-0 font-semibold capitalize">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
        <TabsList className="l-tabs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hearings">Hearings</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines ({openDeadlines})</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Panel title="Case Details">
            <dl className="flex flex-col gap-5 m-0">
              <div className="flex flex-col gap-1">
                <dt className="l-label">Description</dt>
                <dd className="m-0 leading-relaxed">{caseData.description}</dd>
              </div>
              {opposing.length > 0 && (
                <div className="flex flex-col gap-1">
                  <dt className="l-label">Opposing parties</dt>
                  <dd className="m-0 leading-relaxed">{opposing.join(' · ')}</dd>
                </div>
              )}
              {caseData.hearing_date && (
                <div className="flex flex-col gap-1">
                  <dt className="l-label inline-flex items-center gap-1.5">
                    <Calendar aria-hidden="true" className="w-3.5 h-3.5" /> Next Hearing
                  </dt>
                  <dd className="m-0 font-semibold">{new Date(caseData.hearing_date).toLocaleDateString()}</dd>
                </div>
              )}
              {caseData.expected_closure_date && (
                <div className="flex flex-col gap-1">
                  <dt className="l-label">Expected Closure</dt>
                  <dd className="m-0 font-semibold">{new Date(caseData.expected_closure_date).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </Panel>
        </TabsContent>

        <TabsContent value="hearings">
          <HearingLog
            caseId={caseId}
            chamberId={caseData.chamber_id}
            court={caseData.court}
            onOutcomeSaved={() => getCaseDeadlines(caseId).then(({ deadlines }) => setDeadlines(deadlines))}
          />
        </TabsContent>

        <TabsContent value="deadlines">
          <CaseDeadlines caseId={caseId} chamberId={caseData.chamber_id} onChange={setDeadlines} />
        </TabsContent>

        <TabsContent value="fees">
          <CaseFeesPanel caseInfo={{ ...caseData, chamberName: caseData.chambers?.name }} />
        </TabsContent>

        <TabsContent value="documents">
          <Panel
            title="Case Documents"
            flush
            action={
              <>
                <input
                  type="file"
                  id="file-upload"
                  className="sr-only"
                  multiple
                  accept={DOCUMENT_ACCEPT}
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <button
                  type="button"
                  className="l-btn l-btn--outline l-btn--compact"
                  disabled={uploading}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {uploading ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Upload aria-hidden="true" className="w-4 h-4" />}
                  {uploading ? 'Uploading…' : 'Upload Document'}
                </button>
              </>
            }
          >
            {docError && (
              <div className="px-5 pt-4">
                <DashAlert>{docError}</DashAlert>
              </div>
            )}
            {documents.length === 0 ? (
              <EmptyState icon={FileText} title="No documents uploaded" hint="PDF, photos of orders, Word or Excel. Up to 15 MB each." />
            ) : (
              <ul className="l-rows">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <div className="flex flex-wrap items-center gap-3">
                      <FileText aria-hidden="true" className="w-5 h-5 shrink-0 l-muted" />
                      <span className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">{doc.name}</span>
                        <span className="text-sm l-muted">
                          {new Date(doc.created_at).toLocaleDateString()}
                          {doc.size ? ` · ${formatSize(doc.size)}` : ''}
                          {doc.uploader?.full_name ? ` · ${doc.uploader.full_name}` : ''}
                          {!doc.storage_path && ' · file missing'}
                        </span>
                      </span>
                      {doc.storage_path && (
                        <>
                          <button type="button" className="l-icon-btn" aria-label={`View ${doc.name}`} onClick={() => openDocument(doc)}>
                            <Eye aria-hidden="true" className="w-4 h-4" />
                          </button>
                          <button type="button" className="l-icon-btn" aria-label={`Download ${doc.name}`} onClick={() => openDocument(doc, true)}>
                            <Download aria-hidden="true" className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button type="button" className="l-icon-btn" aria-label={`Delete ${doc.name}`} onClick={() => setConfirmDelete(doc)}>
                        <Trash2 aria-hidden="true" className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <DashDialog
            open={!!confirmDelete}
            onOpenChange={(open) => !open && setConfirmDelete(null)}
            title="Delete document?"
            description={confirmDelete ? `"${confirmDelete.name}" will be removed from this case.` : undefined}
          >
            <div className="l-dialog-actions">
              <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="l-btn l-btn--primary l-btn--compact"
                onClick={async () => {
                  const doc = confirmDelete;
                  setConfirmDelete(null);
                  if (doc) await removeDocument(doc);
                }}
              >
                Delete
              </button>
            </div>
          </DashDialog>
        </TabsContent>

        <TabsContent value="tasks">
          <Panel
            title="Case Tasks"
            flush
            action={
              <button type="button" className="l-btn l-btn--primary l-btn--compact" onClick={() => setShowTaskModal(true)}>
                <Plus aria-hidden="true" className="w-4 h-4" /> Add Task
              </button>
            }
          >
            {tasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare2}
                title="No tasks yet"
                action={
                  <button type="button" className="l-btn l-btn--outline l-btn--compact" onClick={() => setShowTaskModal(true)}>
                    Create your first task
                  </button>
                }
              />
            ) : (
              <ul className="l-rows">
                {tasks.map((task: any) => (
                  <li key={task.id}>
                    <div className="flex items-start gap-3">
                      <CheckSquare2
                        aria-hidden="true"
                        className={`w-5 h-5 shrink-0 mt-0.5 ${task.status === 'completed' ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                      <span className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="font-medium">{task.title}</span>
                        {task.due_date && <span className="text-sm l-muted">Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                        {task.assigned_user?.full_name && <span className="text-sm l-muted">Assigned: {task.assigned_user.full_name}</span>}
                      </span>
                      <StatusChip status={task.status}>{task.status?.toUpperCase()}</StatusChip>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="notes">
          <Panel title="Case Notes & Discussions">
            <div className="flex flex-col gap-5">
              <div className="flex gap-3 items-end">
                <label className="flex-1">
                  <span className="sr-only">New note</span>
                  <textarea
                    className="l-dash-input"
                    placeholder="Type a note or message here..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="l-btn l-btn--primary l-btn--compact"
                  onClick={handleCreateNote}
                  disabled={submittingNote || !noteContent.trim()}
                  aria-label="Send note"
                >
                  {submittingNote ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Send aria-hidden="true" className="w-4 h-4" />}
                </button>
              </div>

              {notes.length === 0 ? (
                <p className="l-muted text-sm">No notes yet</p>
              ) : (
                <ul className="flex flex-col gap-3 m-0 p-0 list-none">
                  {notes.map((note: any) => (
                    <li key={note.id} className="rounded-2xl border border-border bg-secondary p-4 flex flex-col gap-2">
                      <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-semibold">{note.sender?.full_name || 'Unknown User'}</span>
                        <span className="text-xs l-muted">{new Date(note.created_at).toLocaleString()}</span>
                      </span>
                      <p className="m-0 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
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

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
