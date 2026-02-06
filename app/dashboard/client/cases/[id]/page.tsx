'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, useRouter } from 'next/navigation';
import { UploadDocumentModal } from '@/components/client/upload-document-modal';
import { ClientDocumentList } from '@/components/client/client-document-list';
import {
    FileText,
    Calendar,
    User,
    AlertCircle,
    Download,
    MessageSquare,
    Clock,
    ChevronLeft,
    Gavel,
    ShieldCheck,
    History,
    Scale,
    MapPin,
    TrendingUp,
    Loader2,
    Lock,
    Phone,
    Mail,
    FolderOpen,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Case {
    id: string;
    case_number: string;
    title: string;
    status: string;
    priority: string;
    filing_date: string | null;
    description: string;
    case_type: string;
    hearing_date: string | null;
    assigned_lawyer: {
        full_name: string;
        email: string;
    } | null;
}

export default function ClientCaseDetailPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState<any[]>([]);

    useEffect(() => {
        const fetchCaseData = async () => {
            if (!user || !params.id) return;
            try {
                // Fetch Case
                const { data: cData, error: cError } = await supabase
                    .from('cases')
                    .select('*, assigned_lawyer:assigned_to(full_name, email)')
                    .eq('id', params.id)
                    .single();

                if (cError) throw cError;
                setCaseData(cData);

                // Fetch Documents
                const { data: dData, error: dError } = await supabase
                    .from('case_documents')
                    .select('*')
                    .eq('case_id', params.id)
                    .order('created_at', { ascending: false });

                if (dData) setDocuments(dData);

            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCaseData();
    }, [user, params.id]);

    const refreshDocuments = async () => {
        if (!params.id) return;
        const { data } = await supabase
            .from('case_documents')
            .select('*')
            .eq('case_id', params.id)
            .order('created_at', { ascending: false });
        if (data) setDocuments(data);
    };

    if (loading) {
        return (
            <ProtectedRoute requiredRole="client">
                <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Decrypting Dossier Intel...</p>
                </div>
            </ProtectedRoute>
        );
    }

    if (!caseData) {
        return (
            <ProtectedRoute requiredRole="client">
                <div className="flex flex-col items-center justify-center h-[80vh] gap-6 text-center px-6">
                    <AlertCircle className="w-20 h-20 text-rose-500" />
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white leading-none">Access Denied</h2>
                        <p className="text-slate-500 font-medium italic">Case record not found or access restricted.</p>
                    </div>
                    <Button onClick={() => router.push('/dashboard/client/cases')} className="bg-slate-900 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl">Back to Vault</Button>
                </div>
            </ProtectedRoute>
        );
    }

    const getStatusBadge = (status: string) => {
        const base = "rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-none";
        switch (status?.toLowerCase()) {
            case 'open':
            case 'active':
                return cn(base, "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400");
            case 'closed':
                return cn(base, "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400");
            default:
                return cn(base, "bg-slate-100 dark:bg-slate-800 text-slate-500");
        }
    };

    return (
        <ProtectedRoute requiredRole="client">
            <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-8 pb-32">
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard/client/cases">
                            <Button variant="ghost" className="rounded-xl font-black gap-2 text-slate-500 hover:text-blue-600 uppercase tracking-widest text-[10px]">
                                <ChevronLeft className="w-4 h-4" /> Back to Files
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Badge className="bg-indigo-950 text-white font-black text-[9px] uppercase tracking-[0.2em] border-none px-4 py-1.5 h-auto">Dossier #{caseData.case_number}</Badge>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl mb-8 items-center justify-start flex w-fit">
                            <TabsTrigger value="overview" className="rounded-xl h-10 px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-blue-600 shadow-sm transition-all">Overview</TabsTrigger>
                            <TabsTrigger value="documents" className="rounded-xl h-10 px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-blue-600 shadow-sm transition-all">Secure Documents</TabsTrigger>
                            <TabsTrigger value="messages" className="rounded-xl h-10 px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-blue-600 shadow-sm transition-all">Direct Line</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Dossier Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-slate-100 dark:border-slate-800 pb-12">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className={getStatusBadge(caseData.status)}>
                                            {caseData.status}
                                        </span>
                                        <span className="text-xs font-black text-blue-600 uppercase tracking-[0.5em]">{caseData.priority} PRIORITY</span>
                                    </div>
                                    <h1 className="text-7xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-[0.85] uppercase">{caseData.title}</h1>
                                </div>
                                <div className="flex flex-col items-end gap-3 shrink-0">
                                    <div className="w-20 h-20 rounded-[32px] bg-slate-900 text-white flex items-center justify-center text-3xl font-black italic shadow-2xl">
                                        <Scale className="w-10 h-10" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tactical Grade Case</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="lg:col-span-2 space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { label: 'Category', value: caseData.case_type || 'General Litigation', icon: Gavel },
                                            { label: 'Next Hearing', value: caseData.hearing_date ? new Date(caseData.hearing_date).toLocaleDateString() : 'Unscheduled', icon: Clock },
                                        ].map((item, i) => (
                                            <div key={i} className="p-8 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-6 shadow-sm">
                                                <div className="w-16 h-16 rounded-[24px] bg-blue-600/10 text-blue-600 flex items-center justify-center">
                                                    <item.icon className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
                                                    <p className="text-xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter mt-1">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                                            <FileText className="w-6 h-6 text-blue-600" />
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Strategical Overview</h3>
                                        </div>
                                        <p className="text-xl font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-blue-600/20 pl-10">
                                            {caseData.description || 'Proceeding with standard legal protocols. Detailed strategy notes are being compiled by lead counsel for this specific dossier phase.'}
                                        </p>
                                    </div>
                                    {/* Recent Activity Panel */}
                                    <div className="p-12 rounded-[56px] bg-slate-900 text-white relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 p-10 opacity-10">
                                            <History className="w-32 h-32" />
                                        </div>
                                        <div className="relative z-10 space-y-8">
                                            <h3 className="text-3xl font-black italic uppercase tracking-tighter">Vault Activity</h3>
                                            <div className="space-y-8">
                                                {[
                                                    { step: 'Dossier Initialized', date: caseData.filing_date, desc: 'Secure case structure created in verified vault.' },
                                                    { step: 'Strategy Finalized', date: 'Recent', desc: 'Counsel has calibrated the objective parameters.' }
                                                ].map((step, i) => (
                                                    <div key={i} className="flex gap-8 items-start group">
                                                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                                                        <div className="space-y-1">
                                                            <p className="text-lg font-black italic uppercase tracking-tighter">{step.step}</p>
                                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{step.date ? new Date(step.date).toLocaleDateString() : 'Pending'}</p>
                                                            <p className="text-sm text-slate-400 mt-2">{step.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[48px] overflow-hidden bg-white">
                                        <CardHeader className="p-10 pb-6 text-center">
                                            <div className="w-24 h-24 rounded-[40px] bg-blue-600 mx-auto flex items-center justify-center text-4xl font-black italic text-white shadow-xl mb-6">
                                                {caseData.assigned_lawyer?.full_name?.charAt(0) || <User className="w-12 h-12" />}
                                            </div>
                                            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">{caseData.assigned_lawyer?.full_name || 'Counsel Pending'}</CardTitle>
                                            <CardDescription className="text-blue-600 font-black text-[9px] uppercase tracking-[0.3em] mt-2">Strategical Lead</CardDescription>
                                        </CardHeader>
                                        <CardContent className="px-10 pb-10 space-y-6">
                                            <div className="space-y-4">
                                                <Button className="w-full h-14 rounded-3xl bg-slate-50 text-slate-900 hover:bg-blue-600 hover:text-white font-black uppercase tracking-widest text-[10px] border-none shadow-inner transition-all gap-2" onClick={() => router.push('/dashboard/client/messages')}>
                                                    <MessageSquare className="w-4 h-4" /> Direct Messenger
                                                </Button>
                                                <Button variant="outline" className="w-full h-14 rounded-3xl border-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all gap-2">
                                                    <Phone className="w-4 h-4" /> Request Voice Brief
                                                </Button>
                                            </div>
                                            <div className="pt-6 border-t border-slate-50 flex items-center justify-center gap-4 text-slate-300">
                                                <Mail className="w-5 h-5 hover:text-blue-600 cursor-pointer" />
                                                <ShieldCheck className="w-5 h-5 hover:text-emerald-500 cursor-pointer" />
                                                <Lock className="w-5 h-5 hover:text-slate-900 cursor-pointer" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Sidebar Discovery Snippet */}
                                    <div className="p-10 rounded-[48px] bg-indigo-950 text-white space-y-8 relative overflow-hidden group shadow-2xl">
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl" />
                                        <div className="relative z-10 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <FolderOpen className="w-6 h-6 text-blue-400" />
                                                <h3 className="text-xl font-black italic uppercase italic tracking-tighter leading-none">Discovery Vault</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {documents.slice(0, 3).map((doc, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group/item">
                                                        <p className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">{doc.name}</p>
                                                        <Download className="w-4 h-4 text-slate-500 group-hover/item:text-blue-400 transition-colors" />
                                                    </div>
                                                ))}
                                                {documents.length === 0 && (
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">No files in vault.</p>
                                                )}
                                            </div>
                                            <Button variant="ghost" className="w-full text-blue-400 font-black uppercase tracking-[0.3em] text-[8px] hover:bg-white/5" onClick={() => { }}>View Full Archive <ArrowRight className="w-3 h-3 ml-2" /></Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Secure Dossier Vault</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Encrypted Legal Evidence & Filings</p>
                                </div>
                                <UploadDocumentModal
                                    caseId={caseData.id}
                                    userId={user?.id || ''}
                                    existingDocuments={documents}
                                    onUploadComplete={refreshDocuments}
                                />
                            </div>

                            <ClientDocumentList documents={documents} />
                        </TabsContent>

                        <TabsContent value="messages" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center py-24 bg-slate-50 dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Secure Line Active</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Proceed to Direct Messenger for Counsel Comms</p>
                                <Button className="mt-6 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl" onClick={() => router.push('/dashboard/client/messages')}>
                                    Open Comm Link
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>

                </div>
            </div>
        </ProtectedRoute>
    );
}
