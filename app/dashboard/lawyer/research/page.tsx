'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    BookOpen,
    Scale,
    Gavel,
    ShieldCheck,
    Bookmark,
    Share2,
    History,
    ChevronRight,
    Filter,
    Sparkles,
    Command,
    FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const RESEARCH_RESULTS = [
    {
        id: 'r1',
        title: 'PLD 2023 SC 45: Interpretation of Guardianship Laws',
        court: 'Supreme Court of Pakistan',
        date: 'Jan 15, 2023',
        relevance: 98,
        tags: ['Family Law', 'Guardianship', 'Minor Rights'],
        snippet: 'The court held that the welfare of the child is the paramount consideration and supersedes the technicalities of traditional custodial rights...'
    },
    {
        id: 'r2',
        title: '2022 SCMR 892: Admissibility of Digital Evidence',
        court: 'Supreme Court of Pakistan',
        date: 'Oct 10, 2022',
        relevance: 85,
        tags: ['Evidence', 'Cyber Law', 'Admissibility'],
        snippet: 'Digital logs must be verified through the proper channel of custody before being accepted as primary evidence in criminal proceedings...'
    },
    {
        id: 'r3',
        title: 'PLD 2021 Lahore 156: Injunctions in Property Disputes',
        court: 'Lahore High Court',
        date: 'Mar 22, 2021',
        relevance: 72,
        tags: ['Civil Law', 'Property', 'Injunction'],
        snippet: 'A party seeking a temporary injunction must prove a prima facie case, irreparable loss, and balance of convenience in their favor...'
    },
];

const SEARCH_HISTORY = [
    'Guardianship rights of mother',
    'Section 42 recovery of money',
    'Admissibility of CCTV footage',
    'Pre-arrest bail in NAB cases'
];

export default function ResearchPage() {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;
        setIsSearching(true);
        setTimeout(() => setIsSearching(false), 1500);
    };

    return (
        <ProtectedRoute requiredRole="lawyer">
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
                <div className="max-w-7xl mx-auto space-y-10">

                    {/* Header & Main Search */}
                    <div className="text-center space-y-6 max-w-3xl mx-auto py-8">
                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest animate-in zoom-in-50">
                            <Sparkles className="w-3 h-3" />
                            AI Powered Legal Research
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-[1.1]">
                            Find Precedents & <span className="text-blue-600">Statutes</span> in Seconds.
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                            Search across Supreme Court, High Courts, and Federal Gazettes using our intelligent legal database.
                        </p>

                        <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto pt-4">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                {isSearching ? <Loader2 className="w-full h-full animate-spin" /> : <Search className="w-full h-full" />}
                            </div>
                            <Input
                                placeholder="Ask a legal question or search citations (e.g., 'PLD 2023 SC 45')..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="h-16 pl-16 pr-24 rounded-[32px] bg-white dark:bg-slate-900 border-none shadow-2xl shadow-blue-500/10 focus:ring-4 focus:ring-blue-500/20 text-lg font-medium"
                            />
                            <Button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                                Search
                            </Button>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                        {/* Left Sidebar: Filters & History */}
                        <div className="lg:col-span-1 space-y-8">

                            {/* Context Filters */}
                            <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <Filter className="w-4 h-4" />
                                        Filters
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jurisdiction</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Supreme Court', 'High Court', 'Tribunals', 'Foreign'].map(j => (
                                                <Badge key={j} variant="secondary" className="px-3 py-1 cursor-pointer hover:bg-blue-600 hover:text-white transition-colors">{j}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Year Range</Label>
                                        <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl h-10 px-3 text-sm font-bold outline-none">
                                            <option>Last 5 Years</option>
                                            <option>Last 10 Years</option>
                                            <option>All History</option>
                                        </select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Research History */}
                            <Card className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] overflow-hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <History className="w-4 h-4" />
                                        Recent Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {SEARCH_HISTORY.map((h, i) => (
                                        <div key={i} className="flex justify-between items-center group cursor-pointer">
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 truncate">{h}</p>
                                            <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Saved Precedents */}
                            <div className="p-8 rounded-[32px] bg-slate-900 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Bookmark className="w-24 h-24" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tight">Saved Precedents</h3>
                                <p className="text-slate-400 text-sm mt-1 font-medium">Access your bookmarked citations instantly.</p>
                                <Button variant="ghost" className="mt-6 p-0 text-blue-400 hover:text-blue-300 font-bold flex items-center gap-2 bg-transparent border-none">
                                    Go to Library <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Main Content: Results Area */}
                        <div className="lg:col-span-3 space-y-6">

                            <div className="flex justify-between items-center px-4">
                                <p className="text-sm font-bold text-slate-500">Showing <span className="text-slate-900 dark:text-white">45 results</span> for legal precedents</p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2 text-slate-500">
                                        <Share2 className="w-4 h-4" /> Share
                                    </Button>
                                    <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2 text-slate-500">
                                        <FileText className="w-4 h-4" /> Export
                                    </Button>
                                </div>
                            </div>

                            {/* Result Cards */}
                            <div className="space-y-6">
                                {RESEARCH_RESULTS.map((res) => (
                                    <Card key={res.id} className="border-none shadow-sm dark:bg-slate-900 rounded-[32px] group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                        {res.title}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                                        <span className="flex items-center gap-1"><Gavel className="w-3 h-3 text-blue-500" /> {res.court}</span>
                                                        <span className="flex items-center gap-1"><History className="w-3 h-3" /> {res.date}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                        {res.relevance}% Match
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Bookmark className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-8">
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl italic border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-2">
                                                "{res.snippet}"
                                            </p>
                                            <div className="flex items-center justify-between mt-6">
                                                <div className="flex gap-2">
                                                    {res.tags.map(tag => (
                                                        <Badge key={tag} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none font-bold text-[10px] uppercase tracking-wider">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <Button className="rounded-xl h-10 px-6 font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all gap-2">
                                                    Read Full Journal
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Quick Knowledge Base / Statutes */}
                            <div className="pt-8">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-4 mb-4">Popular Statutes</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { name: 'Pakistan Penal Code', code: 'PPC 1860' },
                                        { name: 'Code of Civil Procedure', code: 'CPC 1908' },
                                        { name: 'Family Courts Act', code: 'FCA 1964' }
                                    ].map((s) => (
                                        <div key={s.name} className="p-6 rounded-[24px] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 group cursor-pointer hover:border-blue-500 transition-all">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Scale className="w-5 h-5" />
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">{s.name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.code}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        </ProtectedRoute>
    );
}

function Loader2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("animate-spin", props.className)}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}

function ArrowRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}>{children}</label>;
}
