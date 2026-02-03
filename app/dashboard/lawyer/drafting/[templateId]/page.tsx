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
    Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleCopy} className="gap-2 rounded-xl font-bold">
                            <Copy className="w-4 h-4" />
                            Copy Text
                        </Button>
                        <Button onClick={handleDownloadPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2">
                            <Download className="w-4 h-4" />
                            Download PDF
                        </Button>
                    </div>
                </header>

                {/* Main Workspace */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left: Input Form */}
                    <div className="w-1/3 min-w-[320px] max-w-[480px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Type className="w-4 h-4" />
                                Variable Inputs
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {template.fields.map(field => (
                                <div key={field.id} className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                                    <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                                        {field.label}
                                    </Label>
                                    {field.type === 'textarea' ? (
                                        <Textarea
                                            placeholder={field.placeholder || `Enter ${field.label}...`}
                                            value={formData[field.id] || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                                            className="min-h-[100px] rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                                        />
                                    ) : (
                                        <Input
                                            type={field.type === 'money' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                            placeholder={field.placeholder || `Enter ${field.label}...`}
                                            value={formData[field.id] || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-8 flex flex-col overflow-hidden relative">
                        <div className="max-w-4xl mx-auto w-full h-full flex flex-col bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-200">
                            {/* Paper Header */}
                            <div className="bg-slate-50 border-b border-slate-100 px-8 py-3 flex justify-between items-center text-xs text-slate-400 font-mono">
                                <span>A4 Size</span>
                                <span>Draft Preview</span>
                            </div>

                            {/* Paper Content */}
                            <div
                                id="draft-ref-content"
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    padding: '3rem',
                                    fontFamily: 'serif',
                                    lineHeight: '1.625',
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '1rem',
                                    overflowY: 'auto',
                                    flex: '1 1 0%'
                                }}
                            >
                                {draftContent.split('{{').map((part, index) => {
                                    if (index === 0) return part;
                                    const split = part.split('}}');
                                    const key = split[0];
                                    const rest = split[1];
                                    return (
                                        <React.Fragment key={index}>
                                            <span
                                                style={{
                                                    backgroundColor: '#fef3c7', // bg-amber-100
                                                    color: '#b45309',           // text-amber-700
                                                    borderColor: '#fcd34d',      // border-amber-300
                                                    borderWidth: '1px',
                                                    borderStyle: 'dashed',
                                                    fontWeight: 'bold',
                                                    padding: '0 4px',
                                                    borderRadius: '4px',
                                                    margin: '0 2px'
                                                }}
                                            >
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                            {rest}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </ProtectedRoute>
    );
}
