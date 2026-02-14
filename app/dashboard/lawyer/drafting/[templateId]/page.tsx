'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LEGAL_TEMPLATES, TemplateField } from '@/lib/data/legal-templates';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    ChevronLeft,
    Printer,
    Copy,
    FileCheck,
    Save,
    Maximize2,
    Type,
    Download,
    FileEdit,
    Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AIEditorToolbar } from '@/components/shared/ai-editor-toolbar';

export default function DraftingEditorPage() {
    const params = useParams();
    const router = useRouter();
    const templateId = params.templateId as string;
    const template = LEGAL_TEMPLATES[templateId];

    const [formData, setFormData] = useState<Record<string, string>>({});
    const [draftContent, setDraftContent] = useState('');

    useEffect(() => {
        if (!template) return;

        // Initialize Draft Content
        let content = template.content;

        // Replace placeholders with current form data or placeholders
        Object.keys(formData).forEach(key => {
            if (formData[key]) {
                // Simple regex to replace all instances
                const regex = new RegExp(`{{${key}}}`, 'g');
                content = content.replace(regex, formData[key]);
            }
        });

        // Find remaining placeholders to visually indicate them (optional)
        // For now just setting content
        setDraftContent(content);

    }, [formData, template]);

    if (!template) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-900">Template Not Found</h2>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </div>
            </div>
        );
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(draftContent);
        toast.success("Document copied to clipboard!");
        // We'll assume a toast mechanism or just alert for now if toast not set up
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('draft-ref-content');
        if (!element) return;

        const toastId = toast.loading('Generating PDF...');
        let container: HTMLElement | null = null;

        try {
            // @ts-ignore
            const { jsPDF } = await import('jspdf');

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            // Create a temporary container to sanitize styles
            container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '800px'; // Forced A4-like width
            document.body.appendChild(container);

            // Re-construct the document entirely from data (Synthetic DOM)
            // This avoids cloning ANY existing DOM nodes that might have computed styles from global CSS
            const syntheticRef = document.createElement('div');
            syntheticRef.style.backgroundColor = '#ffffff';
            syntheticRef.style.color = '#0f172a';
            syntheticRef.style.padding = '3rem';
            syntheticRef.style.fontFamily = 'serif';
            syntheticRef.style.lineHeight = '1.625';
            syntheticRef.style.whiteSpace = 'pre-wrap';
            syntheticRef.style.fontSize = '16px'; // Explicit px

            // Re-run the split logic on the original content string
            const parts = draftContent.split('{{');
            parts.forEach((part, index) => {
                if (index === 0) {
                    syntheticRef.appendChild(document.createTextNode(part));
                    return;
                };

                const split = part.split('}}');
                const key = split[0];
                const rest = split[1];

                // Create the highlighted span purely synthetically
                const span = document.createElement('span');
                span.textContent = key.replace(/_/g, ' ');
                // Explicit inline hex styles
                span.style.backgroundColor = '#fef3c7';
                span.style.color = '#b45309';
                span.style.border = '1px dashed #fcd34d';
                span.style.fontWeight = 'bold';
                span.style.padding = '0 4px';
                span.style.borderRadius = '4px';
                span.style.margin = '0 2px';

                syntheticRef.appendChild(span);
                syntheticRef.appendChild(document.createTextNode(rest));
            });

            container.appendChild(syntheticRef);

            const pdfWidth = 595.28;
            const margin = 40;

            await doc.html(syntheticRef, {
                callback: function (pdf) {
                    pdf.save(`${template?.title.replace(/\s+/g, '_')}_Draft.pdf`);
                    if (container && document.body.contains(container)) {
                        document.body.removeChild(container);
                    }
                },
                x: margin,
                y: margin,
                width: pdfWidth - (margin * 2),
                windowWidth: 800,
                autoPaging: 'text',
                margin: [40, 40, 40, 40]
            });

            toast.dismiss(toastId);
            toast.success('PDF downloaded successfully!');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            if (container && document.body.contains(container)) {
                document.body.removeChild(container);
            }
            toast.dismiss(toastId);
            toast.error('Failed to generate PDF');
        }
    };

    const [mode, setMode] = useState<'form' | 'editor'>('form');
    const [isGenerating, setIsGenerating] = useState(false);

    // AI Simulation Handler
    const handleAIAction = async (action: string) => {
        setIsGenerating(true);
        const toastId = toast.loading('AI is processing...');

        // Simulate Network Delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        let newContent = draftContent;

        // Simple Heuristic Simulation (In real app, call API here)
        switch (action) {
            case 'improve':
                newContent = "Your refined draft:\n\n" + newContent.replace(/\s+/g, ' ').trim();
                toast.success('Document enhanced for clarity!', { id: toastId });
                break;
            case 'grammar':
                toast.success('Grammar check complete. No critical errors found.', { id: toastId });
                break;
            case 'simplify':
                newContent = newContent.replace(/terms and conditions/gi, 'terms').replace(/undertake/gi, 'promise');
                toast.success('Legalese simplified where applicable.', { id: toastId });
                break;
            case 'tone_formal':
                newContent = "RESPECTFULLY SHEWETH:\n\n" + newContent;
                toast.success('Tone adjusted to Formal Legal.', { id: toastId });
                break;
            case 'expand':
                newContent += "\n\nFURTHERMORE, the party acknowledges that all statements made herein are true to the best of their knowledge and belief, and any misrepresentation shall be grounds for immediate dismissal.";
                toast.success('Expanded with standard clauses.', { id: toastId });
                break;
            case 'shorten':
                newContent = newContent.split('\n').filter(line => line.trim().length > 0).slice(0, 3).join('\n') + "\n...[Summary Ends]";
                toast.success('Summarized key points.', { id: toastId });
                break;
        }

        setDraftContent(newContent);
        setIsGenerating(false);
    };

    return (
        <ProtectedRoute requiredRole="lawyer">
            <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
                {/* Header */}
                <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
                            <ChevronLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                {template.title}
                                <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{template.category}</Badge>
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Drafting Mode</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <Button
                            variant={mode === 'form' ? 'secondary' : 'ghost'}
                            onClick={() => setMode('form')}
                            size="sm"
                            className={cn("text-xs font-bold gap-2", mode === 'form' && "shadow-sm bg-white dark:bg-slate-700")}
                        >
                            <Type className="w-3 h-3" />
                            Smart Form
                        </Button>
                        <Button
                            variant={mode === 'editor' ? 'secondary' : 'ghost'}
                            onClick={() => setMode('editor')}
                            size="sm"
                            className={cn("text-xs font-bold gap-2", mode === 'editor' && "shadow-sm bg-white dark:bg-slate-700")}
                        >
                            <FileEdit className="w-3 h-3" />
                            AI Editor
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleCopy} className="gap-2 rounded-xl font-bold h-9 text-xs">
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                        </Button>
                        <Button onClick={handleDownloadPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2 h-9 text-xs">
                            <Download className="w-3.5 h-3.5" />
                            Download
                        </Button>
                    </div>
                </header>

                {/* Main Workspace */}
                <div className="flex-1 flex overflow-hidden">

                    {mode === 'form' ? (
                        <>
                            {/* Left: Input Form */}
                            <div className="w-1/3 min-w-[320px] max-w-[400px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 animate-in slide-in-from-left duration-300">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Type className="w-3 h-3" />
                                        Template Variables
                                    </h2>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {template.fields.map(field => (
                                        <div key={field.id} className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">
                                                {field.label}
                                            </Label>
                                            {field.type === 'textarea' ? (
                                                <Textarea
                                                    placeholder={field.placeholder || `Enter ${field.label}...`}
                                                    value={formData[field.id] || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                    className="min-h-[100px] rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-indigo-500 font-medium text-sm"
                                                />
                                            ) : (
                                                <Input
                                                    type={field.type === 'money' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                    placeholder={field.placeholder || `Enter ${field.label}...`}
                                                    value={formData[field.id] || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                    className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-indigo-500 font-medium text-sm"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Preview (Read Only) */}
                            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-8 flex flex-col overflow-hidden relative">
                                <div className="max-w-3xl mx-auto w-full h-full flex flex-col bg-white shadow-xl shadow-slate-200/50 rounded-sm overflow-hidden border border-slate-200">
                                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-2 flex justify-between items-center text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                                        <span>Preview Mode</span>
                                        <span>Auto-Updating</span>
                                    </div>
                                    <div
                                        id="draft-ref-content"
                                        className="flex-1 p-12 font-serif text-base leading-relaxed overflow-y-auto bg-white text-slate-900 whitespace-pre-wrap select-text"
                                    >
                                        {draftContent.split('{{').map((part, index) => {
                                            if (index === 0) return part;
                                            const split = part.split('}}');
                                            const key = split[0];
                                            const rest = split[1];
                                            return (
                                                <React.Fragment key={index}>
                                                    <span className="bg-yellow-100 text-yellow-800 border-b-2 border-yellow-300 font-bold px-1 rounded mx-0.5">
                                                        {key.replace(/_/g, ' ')}
                                                    </span>
                                                    {rest}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // AI Editor Mode
                        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-300">
                            <div className="max-w-5xl mx-auto w-full h-full flex flex-col p-6 gap-4">

                                <AIEditorToolbar onAction={handleAIAction} isGenerating={isGenerating} />

                                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative">
                                    {isGenerating && (
                                        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3 animate-in zoom-in-95">
                                                <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">AI is crafting...</p>
                                            </div>
                                        </div>
                                    )}
                                    <Textarea
                                        value={draftContent}
                                        onChange={(e) => setDraftContent(e.target.value)}
                                        className="flex-1 p-8 text-base font-serif leading-relaxed border-none focus:ring-0 resize-none rounded-none text-slate-800 dark:text-slate-200 selection:bg-indigo-100 selection:text-indigo-900"
                                        placeholder="Start typing or let AI help you..."
                                    />
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono flex justify-between">
                                        <span>{draftContent.length} chars</span>
                                        <span>{draftContent.split(/\s+/).length} words</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </ProtectedRoute>
    );
}
