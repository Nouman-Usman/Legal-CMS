'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { getClients, getClientStats } from '@/lib/supabase/clients';
import { ClientFormModal } from '@/components/shared/client-form-modal';
import {
    Search,
    Users,
    Mail,
    Phone,
    Loader2,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    UserPlus,
    TrendingUp,
    ChevronRight,
    ShieldCheck,
    Briefcase,
    Calendar,
    Filter,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Building2,
    MessageSquare
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { CHART } from '@/lib/dashboard/chart';
import { DashPage, EmptyState, PageHeader, Panel, SearchInput, StatTile, StatusChip } from '@/components/dashboard/ui';
import Link from 'next/link';

export default function ClientsPage() {
    const { user } = useAuth();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState({ total: 0, thisMonth: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        if (!user?.chamber_id) return;
        try {
            setLoading(true);
            const [clientsRes, statsRes] = await Promise.all([
                getClients(user.chamber_id),
                getClientStats(user.chamber_id)
            ]);

            if (clientsRes.clients) setClients(clientsRes.clients);
            if (statsRes.stats) setStats(statsRes.stats);
        } catch (err) {
            console.error('Error loading clients:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.chamber_id]);

    const filteredClients = useMemo(() => {
        return clients.filter(c => {
            const matchesSearch =
                c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.phone?.includes(searchQuery);

            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [clients, searchQuery, statusFilter]);

    const acquisitionData = useMemo(() => {
        const months: Record<string, number> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months[d.toLocaleString('default', { month: 'short' })] = 0;
        }

        clients.forEach(c => {
            const created = new Date(c.created_at);
            const key = created.toLocaleString('default', { month: 'short' });
            if (months[key] !== undefined) months[key]++;
        });

        return Object.entries(months).map(([name, count]) => ({ name, count }));
    }, [clients]);

    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <DashPage>
                <PageHeader
                    eyebrow="Relationship Management Core"
                    title="Client Vault"
                    description="Overseeing firm-wide legal partnerships and representative outcomes."
                    actions={
                        <button type="button" onClick={() => setIsModalOpen(true)} className="l-btn l-btn--primary l-btn--compact">
                            <UserPlus aria-hidden="true" className="w-4 h-4" /> Execute New Onboarding
                        </button>
                    }
                />

                <div className="l-stats">
                    <StatTile label="Total Partnerships" value={stats.total} icon={Users} />
                    <StatTile label="Growth Vector" value={stats.thisMonth} icon={TrendingUp} hint="New this month" />
                </div>

                <div className="l-grid l-grid--side">
                    <div className="l-grid">
                        <Panel title="Sector Filtering">
                            <div className="flex flex-col gap-5">
                                <SearchInput
                                    label="Search clients"
                                    placeholder="Partner Identity Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
                                    {['all', 'active', 'inactive'].map((status) => (
                                        <button key={status} type="button" onClick={() => setStatusFilter(status)} aria-pressed={statusFilter === status} className="l-filter">
                                            {status} <span className="l-muted">{clients.filter((c) => (status === 'all' ? true : c.status === status)).length}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Panel>

                        <Panel title="Acquisition Trajectory">
                            <div className="h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={acquisitionData}>
                                        <defs>
                                            <linearGradient id="colorClientsPulse" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART.lime} stopOpacity={0.35} />
                                                <stop offset="95%" stopColor={CHART.lime} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: CHART.muted, fontSize: 11 }} />
                                        <YAxis hide />
                                        <Tooltip contentStyle={CHART.tooltip} itemStyle={{ color: CHART.ink }} labelStyle={{ color: CHART.ink }} />
                                        <Area type="monotone" dataKey="count" stroke={CHART.lime} strokeWidth={3} fill="url(#colorClientsPulse)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Panel>
                    </div>

                    <Panel
                        title="Partnership Roster"
                        flush
                        action={
                            <span className="text-sm l-muted">
                                Inventory identified: <strong className="l-ink">{filteredClients.length} Registered Partners</strong>
                            </span>
                        }
                    >
                        {loading ? (
                            <div className="l-empty" role="status">
                                <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin" />
                                <span className="l-label">Syncing Partnership Data...</span>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <EmptyState icon={Users} title="Vault Depleted" hint="No partnerships identified under current indexing parameters." />
                        ) : (
                            <ul className="l-people m-0 list-none">
                                {filteredClients.map((client) => (
                                    <li key={client.id} className="l-person">
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="l-avatar" aria-hidden="true">
                                                {client.full_name?.charAt(0)}
                                            </span>
                                            <StatusChip status={client.status} />
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <h3 className="m-0 text-base font-semibold truncate">{client.full_name}</h3>
                                            <span className="text-xs l-muted">Identity Established: {new Date(client.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <ul className="flex flex-col gap-1.5 m-0 p-0 list-none text-sm l-muted">
                                            <li className="flex items-center gap-2 min-w-0">
                                                <Mail aria-hidden="true" className="w-4 h-4 shrink-0" /> <span className="truncate">{client.email}</span>
                                            </li>
                                            {client.phone && (
                                                <li className="flex items-center gap-2">
                                                    <Phone aria-hidden="true" className="w-4 h-4 shrink-0" /> {client.phone}
                                                </li>
                                            )}
                                            <li className="flex items-center gap-2">
                                                <Briefcase aria-hidden="true" className="w-4 h-4 shrink-0" /> {client.cases?.length || 0} Dossiers Active
                                            </li>
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>
            </DashPage>

            <ClientFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={loadData} />
        </ProtectedRoute>
    );
}
