'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    FileText,
    Plus,
    Search,
    MoreHorizontal,
    Clock,
    Trash2,
    Copy,
    Edit3,
    CheckCircle,
    FileEdit,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Template {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'archived';
    fields: any[];
    created_at: string;
    updated_at: string;
}

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates || []);
            }
        } catch (err) {
            console.error('Failed to fetch templates:', err);
        } finally {
            setLoading(false);
        }
    };

    const createTemplate = async () => {
        try {
            const res = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Untitled Template' }),
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/dashboard/chambers-admin/templates/builder?id=${data.template.id}`);
            } else {
                toast.error('Failed to create template');
            }
        } catch (err) {
            toast.error('Failed to create template');
        }
    };

    const deleteTemplate = async (id: string) => {
        try {
            const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTemplates(prev => prev.filter(t => t.id !== id));
                toast.success('Template deleted');
            }
        } catch (err) {
            toast.error('Failed to delete template');
        }
        setActiveMenu(null);
    };

    const duplicateTemplate = async (template: Template) => {
        try {
            const res = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${template.name} (Copy)`,
                    description: template.description,
                    fields: template.fields,
                    status: 'draft',
                }),
            });
            if (res.ok) {
                await fetchTemplates();
                toast.success('Template duplicated');
            }
        } catch (err) {
            toast.error('Failed to duplicate template');
        }
        setActiveMenu(null);
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const statusConfig = {
        draft: { label: 'Draft', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: FileEdit },
        active: { label: 'Active', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
        archived: { label: 'Archived', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', icon: Clock },
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Document Templates
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Create and manage reusable document templates for your chamber
                            </p>
                        </div>
                        <Button
                            onClick={createTemplate}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 h-10 font-semibold rounded-lg shadow-lg shadow-blue-500/20 gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Template
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="mt-5 relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search templates..."
                            className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5">
                            <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                            {search ? 'No templates found' : 'No templates yet'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">
                            {search
                                ? 'Try a different search term'
                                : 'Create your first document template to get started'}
                        </p>
                        {!search && (
                            <Button onClick={createTemplate} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Template
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* New Template Card */}
                        <button
                            onClick={createTemplate}
                            className="group border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all min-h-[200px]"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-sm font-semibold text-slate-500 group-hover:text-blue-600">
                                Blank Template
                            </span>
                        </button>

                        {/* Template Cards */}
                        {filteredTemplates.map(template => {
                            const status = statusConfig[template.status] || statusConfig.draft;
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={template.id}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group relative"
                                    onClick={() =>
                                        router.push(`/dashboard/chambers-admin/templates/builder?id=${template.id}`)
                                    }
                                >
                                    {/* Preview Area */}
                                    <div className="h-28 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-4 flex items-center justify-center border border-slate-100 dark:border-slate-700/50">
                                        <FileText className="w-10 h-10 text-slate-200 dark:text-slate-600" />
                                    </div>

                                    {/* Info */}
                                    <h3 className="font-semibold text-slate-800 dark:text-white truncate mb-1 group-hover:text-blue-600 transition-colors">
                                        {template.name}
                                    </h3>
                                    {template.description && (
                                        <p className="text-xs text-slate-500 truncate mb-3">
                                            {template.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                                                status.color
                                            )}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {template.fields?.length || 0} fields
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(template.updated_at || template.created_at)}
                                        </span>
                                    </div>

                                    {/* Actions Menu */}
                                    <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => setActiveMenu(activeMenu === template.id ? null : template.id)}
                                        >
                                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                        </Button>
                                        {activeMenu === template.id && (
                                            <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 w-40">
                                                <button
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 w-full"
                                                    onClick={() => {
                                                        router.push(`/dashboard/chambers-admin/templates/builder?id=${template.id}`);
                                                    }}
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                    Edit
                                                </button>
                                                <button
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 w-full"
                                                    onClick={() => duplicateTemplate(template)}
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                    Duplicate
                                                </button>
                                                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                                <button
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 w-full"
                                                    onClick={() => deleteTemplate(template.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
