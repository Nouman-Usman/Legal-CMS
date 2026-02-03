'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { getClients, getClientStats } from '@/lib/supabase/clients';
import { ClientFormModal } from '@/components/shared/client-form-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
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

    const getStatusBadge = (status: string) => {
        const base = "rounded-full px-4 py-1 font-black text-[9px] uppercase tracking-widest border-none inline-block text-center";
        switch (status?.toLowerCase()) {
            case 'active':
                return <span className={cn(base, "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20")}>{status}</span>;
            case 'inactive':
                return <span className={cn(base, "bg-slate-500 text-white shadow-lg shadow-slate-500/20")}>{status}</span>;
            default:
                return <span className={cn(base, "bg-amber-500 text-white shadow-lg shadow-amber-500/20")}>{status}</span>;
        }
    };

    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-20">
                <div className="max-w-7xl mx-auto space-y-10">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 dark:border-slate-800 pb-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white font-black text-[9px] uppercase tracking-[0.3em]">
                                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                Relationship Management Core
                            </div>
                            <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-none uppercase italic">Client <span className="text-blue-600">Vault</span></h1>
                            <p className="text-slate-500 font-medium italic">Overseeing firm-wide legal partnerships and representative outcomes.</p>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl h-14 px-10 border-none shadow-2xl transition-all hover:scale-105 uppercase tracking-widest text-[10px] items-center gap-2"
                            >
                                <UserPlus className="w-5 h-5" /> Execute New Onboarding
                            </Button>
                        </div>
                    </div>

                    {/* Stats HUD */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Total Partnerships', value: stats.total, icon: Users, color: 'text-slate-900 bg-white' },
                            { label: 'Growth Vector', value: stats.thisMonth, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Satisfaction Index', value: '98%', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
                        ].map((stat, i) => (
                            <Card key={i} className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white group hover:shadow-xl transition-all">
                                <CardContent className="p-8 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                                        <p className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white">{stat.value}</p>
                                    </div>
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", stat.color)}>
                                        <stat.icon className="w-7 h-7" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

                        {/* Control Interface */}
                        <aside className="lg:col-span-1 space-y-8">

                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <Input
                                    placeholder="Partner Identity Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-14 pl-14 pr-4 rounded-[28px] bg-white dark:bg-slate-900 border-none shadow-sm font-bold text-sm"
                                />
                            </div>

                            <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2">
                                        <Filter className="w-3.5 h-3.5" /> Sector Filtering
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-8 space-y-2">
                                    {['all', 'active', 'inactive'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={cn(
                                                "w-full text-left px-5 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-between",
                                                statusFilter === status ? "bg-slate-900 text-white shadow-xl" : "text-slate-500 hover:bg-slate-100"
                                            )}
                                        >
                                            {status}
                                            <span className="text-[9px] opacity-50">{clients.filter(c => status === 'all' ? true : c.status === status).length}</span>
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white">
                                <CardHeader className="p-8 pb-0">
                                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest italic">Acquisition Trajectory</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 pt-6">
                                    <div className="h-[150px] w-full px-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={acquisitionData}>
                                                <defs>
                                                    <linearGradient id="colorClientsPulse" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" hide />
                                                <YAxis hide />
                                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fill="url(#colorClientsPulse)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="p-10 rounded-[40px] bg-blue-600 text-white space-y-6 relative overflow-hidden group shadow-2xl shadow-blue-600/20">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-24 h-24" />
                                </div>
                                <h3 className="text-xl font-black italic tracking-tighter leading-none uppercase text-white">Relationship <br /> Intelligence</h3>
                                <p className="text-blue-100 text-xs font-medium leading-relaxed italic">Identify high-value partnerships and optimize lifecycle touchpoints for maximum legal output.</p>
                            </div>

                        </aside>

                        {/* Partnership Roster */}
                        <main className="lg:col-span-3 space-y-6">

                            <div className="flex items-center justify-between px-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Inventory identified: <span className="text-slate-900 dark:text-white">{filteredClients.length} Registered Partners</span></p>
                                <div className="flex gap-4 items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Updated Today</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-40 space-y-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Syncing Partnership Data...</p>
                                    </div>
                                ) : filteredClients.length === 0 ? (
                                    <div className="py-40 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[56px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                        <Users className="w-20 h-20 mx-auto text-slate-100" />
                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-300">Vault Depleted</h3>
                                            <p className="text-slate-400 font-bold text-xs uppercase italic tracking-widest">No partnerships identified under current indexing parameters.</p>
                                        </div>
                                    </div>
                                ) : (
                                    filteredClients.map((client) => (
                                        <div
                                            key={client.id}
                                            className="group flex flex-col md:flex-row md:items-center justify-between p-10 rounded-[56px] bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative overflow-hidden"
                                        >
                                            {client.status === 'active' && <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />}

                                            <div className="flex items-start gap-8">
                                                <div className="w-20 h-20 rounded-[32px] bg-slate-50 dark:bg-slate-800 shadow-inner flex items-center justify-center text-3xl font-black italic text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-110">
                                                    {client.full_name?.charAt(0)}
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        {getStatusBadge(client.status)}
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Identity Established: {new Date(client.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">{client.full_name}</h3>
                                                    <div className="flex flex-wrap items-center gap-8 pt-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <Mail className="w-4 h-4 text-slate-400" />
                                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest italic">{client.email}</span>
                                                        </div>
                                                        {client.phone && (
                                                            <div className="flex items-center gap-2.5">
                                                                <Phone className="w-4 h-4 text-slate-400" />
                                                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest italic">{client.phone}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2.5">
                                                            <Briefcase className="w-4 h-4 text-blue-600" />
                                                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest italic">{client.cases?.length || 0} Dossiers Active</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 mt-10 md:mt-0 pt-8 md:pt-0 border-t md:border-t-0 border-slate-50">
                                                <div className="flex gap-2">
                                                    <Button size="icon" variant="ghost" className="rounded-2xl w-14 h-14 bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 hover:text-white transition-all">
                                                        <MessageSquare className="w-6 h-6" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="rounded-2xl w-14 h-14 bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 hover:text-white transition-all">
                                                                <MoreVertical className="w-6 h-6" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl">
                                                            <DropdownMenuItem className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-blue-50">
                                                                <Eye className="w-4 h-4 mr-2" /> Inspect Identity
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-amber-50">
                                                                <Edit className="w-4 h-4 mr-2" /> Modify Profile
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer text-rose-600 hover:bg-rose-50">
                                                                <Trash2 className="w-4 h-4 mr-2" /> Purge Relationship
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <Button
                                                    className="rounded-2xl h-14 px-8 bg-slate-900 dark:bg-slate-800 text-white hover:bg-blue-600 font-black uppercase tracking-widest text-[10px] border-none shadow-xl transition-all group-hover:scale-105 gap-2"
                                                >
                                                    Analyze Partner <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </main>

                    </div>

                </div>

                <ClientFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={loadData}
                />
            </div>
        </ProtectedRoute>
    );
}
