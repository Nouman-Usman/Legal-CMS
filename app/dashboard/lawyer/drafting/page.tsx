'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Search,
    Plus,
    Clock,
    FileEdit,
    Download,
    Copy,
    Trash2,
    ChevronRight,
    Sparkles,
    Layers,
    FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TEMPLATES = [
    { id: '1', title: 'Suit for Recovery', category: 'Civil', description: 'Standard plaint for recovery of money/dues.', popularity: 'High' },
    { id: '2', title: 'Divorce Petition', category: 'Family', description: 'Family court petition for dissolution of marriage.', popularity: 'Active' },
    { id: '3', title: 'Bail Application', category: 'Criminal', description: 'Standard application for post-arrest bail.', popularity: 'Essential' },
    { id: '4', title: 'Power of Attorney', category: 'General', description: 'General legal authorization document.', popularity: 'Common' },
    { id: '5', title: 'Affidavit', category: 'General', description: 'Generic sworn statement template.', popularity: 'Basic' },
    { id: '6', title: 'Stay Application', category: 'Civil', description: 'Application for temporary injunction.', popularity: 'High' },
];

const RECENT_DRAFTS = [
    { id: 'd1', title: 'Recovery - Malik vs Khan', date: '2 hours ago', status: 'Drafting' },
    { id: 'd2', title: 'Bail App - Ahmed Ali', date: 'Yesterday', status: 'Review' },
    { id: 'd3', title: 'NDA - Tech Corp', date: '3 days ago', status: 'Completed' },
];

export default function DraftingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredTemplates = TEMPLATES.filter(t =>
        (selectedCategory === 'All' || t.category === selectedCategory) &&
        (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <ProtectedRoute requiredRole="lawyer">
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                                <FileText className="w-10 h-10 text-blue-600" />
                                Document Drafting
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                Create high-fidelity legal documents using pro templates and AI assistance.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold gap-2">
                                <Clock className="w-4 h-4" />
                                Draft History
                            </Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 gap-2">
                                <Plus className="w-4 h-4" />
                                New Blank Doc
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                        {/* Sidebar: Categories & Recent */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Category Filter */}
                            <Card className="border-none shadow-sm dark:bg-slate-900 rounded-3xl overflow-hidden">
                                <CardHeader className="pb-3 px-6 pt-6">
                                    <CardTitle className="text-sm font-black uppercase text-slate-400 tracking-widest">Categories</CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-6 space-y-1">
                                    {['All', 'Civil', 'Criminal', 'Family', 'Corporate', 'General'].map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "w-full text-left px-4 py-2.5 rounded-xl transition-all font-bold text-sm flex items-center justify-between group",
                                                selectedCategory === cat
                                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <span>{cat}</span>
                                            <ChevronRight className={cn("w-4 h-4 transition-transform", selectedCategory === cat ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Recent Drafts */}
                            <Card className="border-none shadow-sm dark:bg-slate-900 rounded-3xl overflow-hidden">
                                <CardHeader className="pb-3 px-6 pt-6">
                                    <CardTitle className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Recent Drafts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-6 space-y-3">
                                    {RECENT_DRAFTS.map((draft) => (
                                        <div key={draft.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group cursor-pointer hover:border-blue-400/50 transition-all">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{draft.title}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[10px] text-slate-500 font-medium">{draft.date}</span>
                                                <Badge variant="secondary" className="text-[9px] px-1.5 h-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-bold">
                                                    {draft.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="ghost" className="w-full text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-50 dark:hover:bg-blue-900/10">
                                        View All History
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Pro Tip Card */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white space-y-4 shadow-xl shadow-blue-500/10">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-lg leading-tight uppercase tracking-tight">AI Drafting Assistant</h3>
                                <p className="text-blue-100 text-sm leading-relaxed font-medium">
                                    Select a template and use our legal AI to auto-fill parties, facts, and prayers.
                                </p>
                                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-black rounded-xl border-none shadow-lg">
                                    Try AI Draft
                                </Button>
                            </div>
                        </div>

                        {/* Main Content: Template Grid */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Search Bar */}
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Search templates (e.g., 'recovery', 'stay', 'family')..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-14 pl-14 pr-6 rounded-3xl bg-white dark:bg-slate-900 border-none shadow-sm focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                                />
                            </div>

                            {/* Template Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredTemplates.map((template) => (
                                    <Card key={template.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300">
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start">
                                                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                    <Layers className="w-6 h-6" />
                                                </div>
                                                <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-800 font-bold text-[10px] uppercase tracking-widest text-slate-500">
                                                    {template.category}
                                                </Badge>
                                            </div>
                                            <CardTitle className="mt-4 text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {template.title}
                                            </CardTitle>
                                            <CardDescription className="text-sm font-medium text-slate-500 line-clamp-2 mt-1">
                                                {template.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex items-center gap-2 mb-6">
                                                <FileCheck className="w-4 h-4 text-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                                    {template.popularity} Template
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link href={`/dashboard/lawyer/drafting/${template.id}`} className="flex-1">
                                                    <Button className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl font-bold gap-2">
                                                        <FileEdit className="w-4 h-4" />
                                                        Draft
                                                    </Button>
                                                </Link>
                                                <Button variant="outline" size="icon" className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-white flex-shrink-0">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {/* New Template Suggestion Card */}
                                <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent rounded-[32px] flex flex-col items-center justify-center p-8 text-center space-y-4 hover:border-blue-400 hover:bg-blue-50/10 transition-all cursor-pointer">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                        <Plus className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm">Request Template</h3>
                                        <p className="text-xs text-slate-500 font-medium">Missing a specific format? Let us know!</p>
                                    </div>
                                </Card>
                            </div>

                            {/* Statistics/Overview Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                                <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] p-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <FileCheck className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Documents Finalized</p>
                                            <p className="text-4xl font-black text-slate-900 dark:text-white">142</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] p-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[24px] bg-amber-500/10 flex items-center justify-center text-amber-600">
                                            <Clock className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Active Requests</p>
                                            <p className="text-4xl font-black text-slate-900 dark:text-white">08</p>
                                        </div>
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
