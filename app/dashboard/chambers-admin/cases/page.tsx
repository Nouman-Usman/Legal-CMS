'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { CaseFormModal } from '@/components/shared/case-form-modal';
import {
  Search,
  Plus,
  FileText,
  Users,
  Calendar,
  Loader2,
  MoreVertical,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  GripHorizontal,
  Gavel,
  ShieldCheck,
  Scale,
  History,
  Clock,
  ArrowRight,
  Sparkles,
  Archive,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashPage, EmptyState, PageHeader, Panel, SearchInput, StatTile, StatusChip } from '@/components/dashboard/ui';
import Link from 'next/link';

interface Case {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  client_id: string;
  assigned_to?: string;
  status: 'open' | 'closed' | 'pending' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  case_type?: string;
  filing_date?: string;
  next_hearing_date?: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  lawyer_name?: string;
}

export default function CasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal states
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Handlers for modal
  const handleEditCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsEditing(true);
    setShowNewCaseModal(true);
  };

  const handleCreateCase = () => {
    setSelectedCase(null);
    setIsEditing(false);
    setShowNewCaseModal(true);
  };

  const closeModal = () => {
    setShowNewCaseModal(false);
    setSelectedCase(null);
    setIsEditing(false);
  };

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      if (!user?.chamber_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('chamber_id', user.chamber_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrich with client and lawyer names in parallel for performance
        const enrichedCases = await Promise.all(
          (data || []).map(async (caseItem: any) => {
            let clientName = '';
            let lawyerName = '';

            if (caseItem.client_id) {
              const { data: clientData } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', caseItem.client_id)
                .single();
              clientName = clientData?.full_name || 'Unknown';
            }

            if (caseItem.assigned_to) {
              const { data: lawyerData } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', caseItem.assigned_to)
                .single();
              lawyerName = lawyerData?.full_name || 'Unassigned';
            }

            return {
              ...caseItem,
              client_name: clientName,
              lawyer_name: lawyerName || 'Unassigned',
            };
          })
        );

        setCases(enrichedCases);
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [user?.chamber_id]);

  // Filter cases
  useEffect(() => {
    let filtered = cases;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((c) => c.priority === priorityFilter);
    }

    setFilteredCases(filtered);
  }, [cases, searchQuery, statusFilter, priorityFilter]);

  const caseStats = {
    total: cases.length,
    open: cases.filter((c) => c.status === 'open').length,
    pending: cases.filter((c) => c.status === 'pending').length,
    closed: cases.filter((c) => c.status === 'closed').length,
    critical: cases.filter((c) => c.priority === 'critical').length,
  };

  const filterGroups = [
    { label: 'Status Code', options: ['all', 'open', 'pending', 'closed', 'archived'], value: statusFilter, set: setStatusFilter },
    { label: 'Priority Tier', options: ['all', 'low', 'medium', 'high', 'critical'], value: priorityFilter, set: setPriorityFilter },
  ];

  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <DashPage>
        <PageHeader
          eyebrow="Matter Registry System"
          title="Firm Dossiers"
          description="High-fidelity index of all active legal procedures within the chamber."
          actions={
            <button type="button" onClick={handleCreateCase} className="l-btn l-btn--primary l-btn--compact">
              <Plus aria-hidden="true" className="w-4 h-4" /> Initialize New Dossier
            </button>
          }
        />

        <div className="l-stats">
          <StatTile label="Firm Inventory" value={caseStats.total} icon={FileText} />
          <StatTile label="Active Deployment" value={caseStats.open} icon={ShieldCheck} />
          <StatTile label="Pending Review" value={caseStats.pending} icon={Clock} />
          <StatTile label="Resolved Codes" value={caseStats.closed} icon={CheckCircle2} />
          <StatTile label="Critical Alert" value={caseStats.critical} icon={AlertCircle} />
        </div>

        <div className="l-grid l-grid--side">
          <Panel title="Registry Filters">
            <div className="flex flex-col gap-5">
              <SearchInput
                label="Search cases"
                placeholder="Registry Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {filterGroups.map((group) => (
                <div key={group.label} className="flex flex-col gap-2" role="group" aria-label={group.label}>
                  <span className="l-label">{group.label}</span>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => group.set(option)}
                        aria-pressed={group.value === option}
                        className="l-filter"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Registry"
            flush
            action={
              <span className="text-sm l-muted">
                Indexing results: <strong className="l-ink">{filteredCases.length} Matching Records</strong>
              </span>
            }
          >
            {loading ? (
              <div className="l-empty" role="status">
                <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin" />
                <span className="l-label">Syncing Firm Database...</span>
              </div>
            ) : filteredCases.length === 0 ? (
              <EmptyState icon={Archive} title="Null Set Identified" hint="No matching dossiers found for current parameters." />
            ) : (
              <ul className="l-rows">
                {filteredCases.map((caseItem) => (
                  <li key={caseItem.id}>
                    <div className="flex items-start gap-3">
                      <FileText aria-hidden="true" className="w-5 h-5 mt-1 shrink-0 l-muted" />
                      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="l-label">CODE: {caseItem.case_number}</span>
                          <span className={caseItem.priority === 'critical' ? 'l-chip l-chip--danger' : 'l-chip'}>{caseItem.priority} PRIORITY</span>
                        </span>
                        <Link href={`/dashboard/chambers-admin/cases/${caseItem.id}`} className="font-semibold text-base hover:underline underline-offset-4">
                          {caseItem.title}
                        </Link>
                        <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm l-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <Users aria-hidden="true" className="w-4 h-4" /> {caseItem.client_name}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Gavel aria-hidden="true" className="w-4 h-4" /> {caseItem.lawyer_name}
                          </span>
                          {caseItem.next_hearing_date && (
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar aria-hidden="true" className="w-4 h-4" /> {new Date(caseItem.next_hearing_date).toLocaleDateString()}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusChip status={caseItem.status} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="l-icon-btn" aria-label={`Actions for ${caseItem.title}`}>
                              <MoreVertical aria-hidden="true" className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/chambers-admin/cases/${caseItem.id}`)}>
                              <Eye aria-hidden="true" className="w-4 h-4" /> Open Dossier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCase(caseItem)}>
                              <Edit aria-hidden="true" className="w-4 h-4" /> Modify Intel
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 aria-hidden="true" className="w-4 h-4" /> Purge Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </DashPage>

      <CaseFormModal
        isOpen={showNewCaseModal}
        onClose={closeModal}
        onSuccess={() => {
          closeModal();
          window.location.reload();
        }}
        caseData={selectedCase}
        isEditing={isEditing}
      />
    </ProtectedRoute>
  );
}
