'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    FolderOpen,
    Search,
    Download,
    FileText,
    Clock,
    Filter,
    ShieldCheck,
    ChevronRight,
    MoreVertical,
    Plus,
    ArrowRight,
    Sparkles,
    Lock,
    Eye,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DOCUMENTS = [
    { id: '1', name: 'Court Filing - Civil 452.pdf', case: 'Smith vs. Johnson', date: '2 hours ago', size: '1.2 MB', category: 'Legal' },
    { id: '2', name: 'Property Deed Scan.jpg', case: 'Real Estate Portfolio', date: 'Yesterday', size: '4.5 MB', category: 'Evidence' },
    { id: '3', name: 'Settlement Draft v2.docx', case: 'Corporate Merger', date: '3 days ago', size: '450 KB', category: 'Draft' },
    { id: '4', name: 'Witness Statement.pdf', case: 'Smith vs. Johnson', date: '1 week ago', size: '890 KB', category: 'Discovery' },
    { id: '5', name: 'Power of Attorney.pdf', case: 'General Legal', date: '2 weeks ago', size: '1.1 MB', category: 'Administrative' },
];

export default function ClientDocumentsPage() {
    const [searchQuery, setSearchQuery] = useState('');

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
                            <Button className="bg-slate-900 dark:bg-slate-800 text-white font-black rounded-2xl h-12 px-8 border-none shadow-xl transition-all hover:scale-105 uppercase tracking-tight text-xs">
                                <Plus className="w-4 h-4 mr-2" /> Upload for Review
                            </Button>
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
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Vault Inventory: <span className="text-slate-900 dark:text-white">{DOCUMENTS.length} Objects</span></p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2 text-slate-500">
                                        <Filter className="w-4 h-4" /> Filters
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {DOCUMENTS.map((doc) => (
                                    <Card key={doc.id} className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden bg-white group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300">
                                        <CardContent className="p-8">
                                            <div className="flex items-start gap-4">
                                                <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-inner">
                                                    <FileText className="w-8 h-8" />
                                                </div>
                                                <div className="flex-1 space-y-4 pt-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight uppercase italic tracking-tighter">{doc.name}</h3>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Case: <span className="text-blue-600">{doc.case}</span></p>
                                                        </div>
                                                        <button className="text-slate-300 hover:text-slate-900 dark:hover:text-white">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {doc.date}</span>
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">|</span>
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{doc.size}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button size="icon" variant="ghost" className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white transition-all">
                                                                <Download className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white transition-all">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {/* Secure Dropzone Card */}
                                <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent rounded-[32px] flex flex-col items-center justify-center p-10 text-center space-y-6 hover:border-blue-400 hover:bg-blue-50/10 transition-all cursor-pointer group">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                                        <Plus className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm leading-none italic">Secure Dropzone</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Drag files here for legal indexing</p>
                                    </div>
                                </Card>
                            </div>

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
                                        <p className="text-4xl font-black italic tracking-tighter mt-1">2 Secure Files</p>
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
