'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { getLeads, updateLeadStatus, deleteLead, type Lead } from '@/lib/supabase/leads';
import {
    Plus,
    Search,
    Filter,
    Phone,
    Mail,
    MoreHorizontal,
    Loader2,
    TrendingUp,
    Zap,
    Target,
    Users,
    ChevronRight,
    ArrowUpRight,
    Clock,
    MoreVertical,
    CheckCircle2,
    XCircle,
    UserPlus,
    Calendar,
    Sparkles
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { CreateLeadDialog } from '@/components/domain/leads/create-lead-dialog';
import { DashPage, EmptyState, PageHeader, Panel, SearchInput, StatTile, StatusChip } from '@/components/dashboard/ui';

export default function LeadsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchLeads = async () => {
        if (!user?.chamber_id) return;
        setLoading(true);
        const { leads: data, error } = await getLeads(user.chamber_id);
        if (!error && data) {
            setLeads(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLeads();
    }, [user]);

    const handleStatusUpdate = async (id: string, status: Lead['status']) => {
        setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
        await updateLeadStatus(id, status);
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        active: leads.filter(l => ['contacted', 'consultation'].includes(l.status)).length,
        converted: leads.filter(l => l.status === 'converted').length,
    };

    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <DashPage>
                <PageHeader
                    eyebrow="Client Acquisition Pipeline"
                    title="Growth Engine"
                    description="Accelerating firm expansion through intelligent intake and conversion tracking."
                    actions={<CreateLeadDialog onSuccess={fetchLeads} />}
                />

                <div className="l-stats">
                    <StatTile label="Total Prospects" value={stats.total} icon={Users} />
                    <StatTile label="Fresh Inquiries" value={stats.new} icon={Zap} />
                    <StatTile label="Active Pipeline" value={stats.active} icon={Target} />
                    <StatTile
                        label="Conversion Rate"
                        value={stats.total > 0 ? `${Math.round((stats.converted / stats.total) * 100)}%` : '0%'}
                        icon={TrendingUp}
                    />
                </div>

                <div className="l-grid l-grid--side">
                    <Panel title="Pipeline Status">
                        <div className="flex flex-col gap-5">
                            <SearchInput
                                label="Search leads"
                                placeholder="Lead Intelligence Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
                                {['all', 'new', 'contacted', 'consultation', 'converted', 'lost'].map((status) => (
                                    <button key={status} type="button" onClick={() => setStatusFilter(status)} aria-pressed={statusFilter === status} className="l-filter">
                                        {status} <span className="l-muted">{leads.filter((l) => (status === 'all' ? true : l.status === status)).length}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Panel>

                    <Panel
                        title="Pipeline"
                        flush
                        action={
                            <span className="text-sm l-muted">
                                Inquiry set: <strong className="l-ink">{filteredLeads.length} Registered Leads</strong>
                            </span>
                        }
                    >
                        {loading ? (
                            <div className="l-empty" role="status">
                                <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin" />
                                <span className="l-label">Syncing Intake Database...</span>
                            </div>
                        ) : filteredLeads.length === 0 ? (
                            <EmptyState icon={Zap} title="Pipeline Inert" hint="Awaiting new inquiries from active firm outreach programs." />
                        ) : (
                            <ul className="l-people m-0 list-none">
                                {filteredLeads.map((lead) => (
                                    <li key={lead.id} className="l-person">
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="l-avatar" aria-hidden="true">
                                                {lead.name?.charAt(0)}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <StatusChip status={lead.status} />
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button type="button" className="l-icon-btn" aria-label={`Actions for ${lead.name}`}>
                                                            <MoreVertical aria-hidden="true" className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Conversion Protocol</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleStatusUpdate(lead.id, 'consultation')}>
                                                            <Sparkles aria-hidden="true" className="w-4 h-4" /> Mark Consultation
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusUpdate(lead.id, 'converted')}>
                                                            <CheckCircle2 aria-hidden="true" className="w-4 h-4" /> Execute Conversion
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleStatusUpdate(lead.id, 'lost')} className="text-destructive">
                                                            <XCircle aria-hidden="true" className="w-4 h-4" /> Terminate Lead
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <h3 className="m-0 text-base font-semibold truncate">{lead.name}</h3>
                                            <span className="inline-flex items-center gap-1.5 text-xs l-muted">
                                                <Calendar aria-hidden="true" className="w-3.5 h-3.5" /> {new Date(lead.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <ul className="flex flex-col gap-1.5 m-0 p-0 list-none text-sm l-muted">
                                            <li className="flex items-center gap-2 min-w-0">
                                                <Mail aria-hidden="true" className="w-4 h-4 shrink-0" /> <span className="truncate">{lead.email || 'NO EMAIL'}</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Phone aria-hidden="true" className="w-4 h-4 shrink-0" /> {lead.phone || 'NO PHONE'}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <ArrowUpRight aria-hidden="true" className="w-4 h-4 shrink-0" /> Source: {lead.source || 'DIRECT'}
                                            </li>
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>
            </DashPage>
        </ProtectedRoute>
    );
}
