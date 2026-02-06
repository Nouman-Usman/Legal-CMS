'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientDocumentList } from '@/components/client/client-document-list';
import { UploadDocumentModal } from '@/components/client/upload-document-modal';
import {
    Search,
    Filter,
    Lock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ClientDocumentsPage() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user) return;
        try {
            setLoading(true);

            // 1. Fetch Client's Cases first
            const { data: casesData, error: casesError } = await supabase
                .from('cases')
                .select('id, title, case_number')
                .eq('client_id', user.id);

            if (casesError) throw casesError;
            setCases(casesData || []);

            if (casesData && casesData.length > 0) {
                const caseIds = casesData.map(c => c.id);

                // 2. Fetch Documents involved in these cases
                const { data: docsData, error: docsError } = await supabase
                    .from('case_documents')
                    .select('*')
                    .in('case_id', caseIds)
                    .order('created_at', { ascending: false });

                if (docsError) throw docsError;
                setDocuments(docsData || []);
            } else {
                setDocuments([]);
            }

        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Simple Filter Logic
    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <ProtectedRoute requiredRole="client">
                <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Vault...</p>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requiredRole="client">
            <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-20">
                <div className="max-w-7xl mx-auto space-y-10">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-1">
                            <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-none">
                                File <span className="text-blue-600">Archive</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Your entire legal discovery vault</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <UploadDocumentModal
                                userId={user?.id || ''}
                                cases={cases}
                                existingDocuments={documents}
                                onUploadComplete={fetchData}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                        {/* Sidebar: Vault Filters */}
                        <div className="lg:col-span-1 space-y-6">

                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <Input
                                    placeholder="Search filenames..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm font-bold text-sm"
                                />
                            </div>

                            <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white">
                                <CardHeader className="pb-3 pt-6 px-6">
                                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest italic">Document Segments</CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-6 space-y-1">
                                    {['All Vaults', 'Court Filings', 'Discovery', 'Evidence Bundles', 'Legal Drafts'].map((cat) => (
                                        <button
                                            key={cat}
                                            className={cn(
                                                "w-full text-left px-4 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-between group",
                                                cat === 'All Vaults'
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <span>{cat}</span>
                                            <ChevronRight className={cn("w-3.5 h-3.5", cat === 'All Vaults' ? "text-white" : "text-slate-300")} />
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Secure Card */}
                            <div className="p-8 rounded-[40px] bg-indigo-950 text-white space-y-6 relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <Lock className="w-24 h-24" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <div className="inline-flex px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/30">
                                        AES-256 Encrypted
                                    </div>
                                    <h3 className="text-xl font-black italic tracking-tighter leading-none uppercase">Military Grade <br /> Security</h3>
                                    <p className="text-indigo-200 text-xs font-medium leading-relaxed">Your legal data is stored in partitioned secure vaults with restricted lawyer-client access only.</p>
                                </div>
                            </div>

                        </div>

                        {/* Main Content: File Grid/List */}
                        <div className="lg:col-span-3 space-y-6">

                            <div className="flex items-center justify-between px-4">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Vault Inventory: <span className="text-slate-900 dark:text-white">{filteredDocs.length} Objects</span></p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2 text-slate-500">
                                        <Filter className="w-4 h-4" /> Filters
                                    </Button>
                                </div>
                            </div>

                            <ClientDocumentList documents={filteredDocs} />

                            {/* Capacity Overview */}
                            <div className="pt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] p-8 flex items-center gap-6 bg-white">
                                    <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Scanned Discovery</p>
                                        <p className="text-4xl font-black italic tracking-tighter mt-1">100% Verified</p>
                                    </div>
                                </Card>
                                <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] p-8 flex items-center gap-6 bg-white">
                                    <div className="w-16 h-16 rounded-[24px] bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                        <AlertCircle className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Unread Updates</p>
                                        <p className="text-4xl font-black italic tracking-tighter mt-1">{filteredDocs.length} Secure Files</p>
                                    </div>
                                </Card>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </ProtectedRoute>
    );
}
