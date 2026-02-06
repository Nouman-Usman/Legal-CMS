'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    FileText,
    Download,
    Eye,
    ChevronDown,
    ChevronRight,
    Clock,
    History,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Document {
    id: string;
    name: string;
    url: string;
    size: any;
    created_at: string;
    type?: string;
}

interface ClientDocumentListProps {
    documents: Document[];
}

export function ClientDocumentList({ documents }: ClientDocumentListProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Helper to group documents
    const groupedDocs = documents.reduce((acc, doc) => {
        // Regex to extract base name from "Name (vX).ext" or just "Name.ext"
        // Matches "Base Name" then optional " (v2)" then ".ext"
        const match = doc.name.match(/^(.*?)(?:\s\(v\d+\))?(\.[^.]*)?$/);
        const baseName = match ? match[1] + (match[2] || '') : doc.name;

        if (!acc[baseName]) {
            acc[baseName] = [];
        }
        acc[baseName].push(doc);
        return acc;
    }, {} as Record<string, Document[]>);

    // Toggle Expand
    const toggleExpand = (baseName: string) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(baseName)) {
            newSet.delete(baseName);
        } else {
            newSet.add(baseName);
        }
        setExpandedGroups(newSet);
    };

    if (documents.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No Secure Documents Found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {Object.entries(groupedDocs).map(([baseName, groupDocs]) => {
                // Sort by creation date descending to find latest
                const sorted = [...groupDocs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                const latest = sorted[0];
                const versions = sorted.slice(1);
                const hasVersions = versions.length > 0;
                const isExpanded = expandedGroups.has(baseName);

                return (
                    <div key={baseName} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
                        {/* Main Row (Latest) */}
                        <div className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-slate-900 dark:text-white font-black italic truncate">{latest.name}</h4>
                                    {hasVersions && (
                                        <Badge variant="secondary" className="text-[9px] uppercase tracking-widest bg-slate-100 text-slate-500">
                                            v{versions.length + 1}
                                        </Badge>
                                    )}
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none text-[9px] uppercase tracking-widest">
                                        Latest
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(latest.created_at).toLocaleDateString()}
                                    </span>
                                    <span>•</span>
                                    <span>{(Number(latest.size) / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => window.open(latest.url, '_blank')}>
                                    <Download className="w-4 h-4 text-slate-500" />
                                </Button>
                                {hasVersions && (
                                    <Button
                                        onClick={() => toggleExpand(baseName)}
                                        variant="ghost"
                                        className={cn("gap-2 rounded-xl text-xs font-bold uppercase", isExpanded && "bg-slate-100 dark:bg-slate-800")}
                                    >
                                        <History className="w-4 h-4" />
                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Versions List */}
                        {isExpanded && hasVersions && (
                            <div className="bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 p-4 space-y-2">
                                <p className="text-[10px] font-black pointer-events-none uppercase tracking-widest text-slate-400 px-2 mb-2">Previous Versions</p>
                                {versions.map((ver, idx) => (
                                    <div key={ver.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{ver.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(ver.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(ver.url, '_blank')}>
                                            <Eye className="w-3 h-3 text-slate-400" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
