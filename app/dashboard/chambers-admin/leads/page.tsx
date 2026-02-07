'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { getLeads, updateLeadStatus, deleteLead, type Lead } from '@/lib/supabase/leads';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    Sparkles,
    MessageSquare
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
import { cn } from '@/lib/utils';

export default function LeadsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchLeads = async () => {
        if (!user) return;

        const activeChamberId = user.chambers?.[0]?.chamber_id;

        if (!activeChamberId) {
            console.warn('User has no active chamber, cannot fetch leads');
            setLoading(false);
            return;
        }

        setLoading(true);
        const { leads: data, error } = await getLeads(activeChamberId);
        if (!error && data) {
            setLeads(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLeads();
    }, [user]);

    // Realtime subscription for leads updates
    useEffect(() => {
        if (!user) return;
        const activeChamberId = user.chambers?.[0]?.chamber_id;
        if (!activeChamberId) return;

        console.log('Setting up realtime subscription for leads');
        const channel = supabase
            .channel(`leads_updates_${activeChamberId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads',
                    filter: `chamber_id=eq.${activeChamberId}`
                },
                (payload) => {
                    console.log('Realtime lead update received:', payload);
                    fetchLeads();
                }
            )
            .subscribe();

        return () => {
            console.log('Cleaning up realtime subscription for leads');
            supabase.removeChannel(channel);
        };
    }, [user?.chambers]);

    const handleStatusUpdate = async (id: string, status: Lead['status']) => {
        setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
        await updateLeadStatus(id, status);
    };

    const getStatusBadge = (status: string) => {
        const base = "rounded-full px-4 py-1.5 font-black text-[9px] uppercase tracking-widest border-none transition-all inline-block text-center";
        switch (status?.toLowerCase()) {
            case 'new':
                return <span className={cn(base, "bg-blue-600 text-white shadow-lg shadow-blue-500/20")}>{status}</span>;
            case 'contacted':
                return <span className={cn(base, "bg-amber-500 text-white shadow-lg shadow-amber-500/20")}>{status}</span>;
            case 'consultation':
                return <span className={cn(base, "bg-purple-600 text-white shadow-lg shadow-purple-500/20")}>{status}</span>;
            case 'converted':
                return <span className={cn(base, "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20")}>{status}</span>;
            case 'lost':
                return <span className={cn(base, "bg-slate-500 text-white shadow-lg shadow-slate-500/20")}>{status}</span>;
            default:
                return <span className={cn(base, "bg-slate-200 text-slate-500")}>{status}</span>;
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.assignee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
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
            <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-20">
                <div className="max-w-7xl mx-auto space-y-10">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 dark:border-slate-800 pb-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white font-black text-[9px] uppercase tracking-[0.3em]">
                                <Zap className="w-3.5 h-3.5 text-blue-400" />
                                Client Acquisition Pipeline
                            </div>
                            <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-none uppercase italic">Growth <span className="text-blue-600">Engine</span></h1>
                            <p className="text-slate-500 font-medium italic">Accelerating firm expansion through intelligent intake and conversion tracking.</p>
                        </div>
                        <div className="flex gap-4">
                            <CreateLeadDialog onSuccess={fetchLeads} />
                        </div>
                    </div>

                    {/* Funnel Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Prospects', value: stats.total, icon: Users, color: 'text-slate-900 bg-white' },
                            { label: 'Fresh Inquiries', value: stats.new, icon: Zap, color: 'text-blue-600 bg-blue-50' },
                            { label: 'Active Pipeline', value: stats.active, icon: Target, color: 'text-amber-600 bg-amber-50' },
                            { label: 'Conversion Rate', value: stats.total > 0 ? `${Math.round((stats.converted / stats.total) * 100)}%` : '0%', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
                        ].map((stat, i) => (
                            <Card key={i} className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white group hover:shadow-xl transition-all">
                                <CardContent className="p-8 space-y-4">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", stat.color)}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                                        <p className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white mt-1">{stat.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

                        {/* Pipeline Controls */}
                        <aside className="lg:col-span-1 space-y-8">

                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <Input
                                    placeholder="Lead Intelligence Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-14 pl-14 pr-4 rounded-[28px] bg-white dark:bg-slate-900 border-none shadow-sm font-bold text-sm"
                                />
                            </div>

                            <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2">
                                        <Filter className="w-3.5 h-3.5" /> Pipeline Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-8 space-y-2">
                                    {['all', 'new', 'contacted', 'consultation', 'converted', 'lost'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={cn(
                                                "w-full text-left px-5 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-between",
                                                statusFilter === status ? "bg-slate-900 text-white shadow-xl" : "text-slate-500 hover:bg-slate-100"
                                            )}
                                        >
                                            {status}
                                            <span className="text-[9px] opacity-50">{leads.filter(l => status === 'all' ? true : l.status === status).length}</span>
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>

                            <div className="p-10 rounded-[40px] bg-emerald-950 text-white space-y-6 relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-24 h-24" />
                                </div>
                                <h3 className="text-xl font-black italic tracking-tighter leading-none uppercase">Acquisition <br /> Protocol</h3>
                                <p className="text-emerald-200 text-xs font-medium leading-relaxed italic">Systematic conversion of inquiries into long-term legal partnerships through automated follow-ups.</p>
                                <Button className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black uppercase tracking-widest text-[10px] border-none">
                                    Run Outreach AI
                                </Button>
                            </div>

                        </aside>

                        {/* Pipeline Feed */}
                        <main className="lg:col-span-3 space-y-6">

                            <div className="flex items-center justify-between px-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Inquiry set: <span className="text-slate-900 dark:text-white">{filteredLeads.length} Registered Leads</span></p>
                                <div className="flex gap-4 items-center">
                                    <Badge className="bg-blue-600 text-white font-black text-[9px] uppercase tracking-[0.2em] border-none px-4 h-6">Live Pipeline</Badge>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-40 space-y-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Syncing Intake Database...</p>
                                    </div>
                                ) : filteredLeads.length === 0 ? (
                                    <div className="py-40 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[56px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                        <Zap className="w-20 h-20 mx-auto text-slate-100" />
                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-300">Pipeline Inert</h3>
                                            <p className="text-slate-400 font-bold text-xs uppercase italic tracking-widest">Awaiting new inquiries from active firm outreach programs.</p>
                                        </div>
                                    </div>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            className="group flex flex-col md:flex-row md:items-center justify-between p-10 rounded-[56px] bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative overflow-hidden"
                                        >
                                            <div className="flex items-start gap-8">
                                                <div className="w-16 h-16 rounded-[28px] bg-slate-50 dark:bg-slate-800 shadow-inner flex items-center justify-center text-2xl font-black italic text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-110">
                                                    {lead.name?.charAt(0)}
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-4">
                                                        {getStatusBadge(lead.status)}
                                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5" /> {new Date(lead.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{lead.name}</h3>
                                                    <div className="flex flex-wrap items-center gap-8 pt-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <Mail className="w-4 h-4 text-slate-400" />
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{lead.email || 'NO EMAIL'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <Users className="w-4 h-4 text-blue-600" />
                                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic font-bold">Assigned: {lead.assignee?.full_name || 'PENDING'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <ArrowUpRight className="w-4 h-4 text-blue-600" />
                                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Source: {lead.source || 'DIRECT'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 mt-10 md:mt-0 pt-8 md:pt-0 border-t md:border-t-0 border-slate-50">
                                                <Button
                                                    onClick={() => window.location.href = `/dashboard/chambers-admin/messages`}
                                                    variant="outline"
                                                    className="rounded-[24px] h-14 px-8 border-2 border-slate-100 dark:border-slate-800 hover:bg-slate-900 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all group-hover:scale-105 gap-2"
                                                >
                                                    Open Intelligence Stream <MessageSquare className="w-4 h-4" />
                                                </Button>
                                                <div className="flex gap-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="rounded-2xl w-14 h-14 bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 hover:text-white transition-all">
                                                                <MoreVertical className="w-6 h-6" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl">
                                                            <DropdownMenuLabel className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Conversion Protocol</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleStatusUpdate(lead.id, 'consultation')} className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-purple-50">
                                                                <Sparkles className="w-4 h-4 mr-2" /> Mark Consultation
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleStatusUpdate(lead.id, 'converted')} className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-emerald-50">
                                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Execute Conversion
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-slate-50" />
                                                            <DropdownMenuItem onClick={() => handleStatusUpdate(lead.id, 'lost')} className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer text-rose-600 hover:bg-rose-50">
                                                                <XCircle className="w-4 h-4 mr-2" /> Terminate Lead
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <Button
                                                    className="rounded-[24px] h-14 px-8 bg-slate-900 dark:bg-slate-800 text-white hover:bg-blue-600 font-black uppercase tracking-widest text-[10px] border-none shadow-xl transition-all group-hover:scale-105 gap-2"
                                                >
                                                    Analyze Interest <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </main>

                    </div>

                </div>
            </div>
        </ProtectedRoute>
    );
}
