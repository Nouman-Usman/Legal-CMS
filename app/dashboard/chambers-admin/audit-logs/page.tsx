'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { getChamberAuditLogs, type AuditLogEntry } from '@/lib/supabase/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Activity,
    Search,
    ShieldCheck,
    Clock,
    User,
    FileText,
    Database,
    Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function AuditLogsPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchLogs = async () => {
        if (!user?.chamber_id) return;
        setLoading(true);
        const { logs: data, error } = await getChamberAuditLogs(user.chamber_id);
        if (!error && data) {
            setLogs(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, [user]);

    const filteredLogs = logs.filter(log => {
        const searchLower = searchQuery.toLowerCase();
        return (
            log.action.toLowerCase().includes(searchLower) ||
            log.user?.full_name.toLowerCase().includes(searchLower) ||
            log.entity?.toLowerCase().includes(searchLower)
        );
    });

    const getActionIcon = (action: string) => {
        if (action.includes('login') || action.includes('auth')) return Lock;
        if (action.includes('create')) return FileText;
        if (action.includes('update')) return Database;
        if (action.includes('delete')) return Activity;
        return Activity;
    };

    const getActionColor = (action: string) => {
        if (action.includes('delete')) return 'text-rose-500 bg-rose-50';
        if (action.includes('create')) return 'text-emerald-600 bg-emerald-50';
        if (action.includes('update')) return 'text-blue-600 bg-blue-50';
        return 'text-slate-500 bg-slate-50';
    };

    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-20">
                <div className="max-w-6xl mx-auto space-y-10">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 dark:border-slate-800 pb-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white font-black text-[9px] uppercase tracking-[0.3em]">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                Compliance Core
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-none uppercase italic">System <span className="text-blue-600">Audit Logs</span></h1>
                            <p className="text-slate-500 font-medium italic">Immutable record of all chamber activities, access modifications, and data interactions.</p>
                        </div>
                    </div>

                    <Card className="border-none shadow-xl dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white">
                        <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-slate-400" />
                                <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Activity Stream</span>
                            </div>
                            <div className="relative w-72">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search logs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-medium text-sm"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-20 text-center text-slate-400 italic">Decrypting logs...</div>
                            ) : filteredLogs.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 mx-auto flex items-center justify-center">
                                        <ShieldCheck className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-bold text-xs uppercase italic tracking-widest">No matching records found in audit trail.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredLogs.map((log) => {
                                        const Icon = getActionIcon(log.action);
                                        const color = getActionColor(log.action);

                                        return (
                                            <div key={log.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                        <h4 className="font-bold text-slate-900 dark:text-white uppercase text-sm tracking-tight">{log.action.replace(/_/g, ' ')}</h4>
                                                        <span className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider rounded-md h-5 px-1.5 border-slate-200 text-slate-500 font-bold bg-white">
                                                            {log.entity || 'SYSTEM'}
                                                        </Badge>
                                                        <span className="text-xs text-slate-500 truncate">
                                                            Performed by <span className="font-semibold text-slate-700 dark:text-slate-300">{log.user?.full_name || 'System'}</span>
                                                        </span>
                                                    </div>
                                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs font-mono text-slate-500 overflow-x-auto">
                                                            {JSON.stringify(log.metadata, null, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </ProtectedRoute>
    );
}
