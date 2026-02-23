'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';

import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, useDroppable } from '@dnd-kit/core';
import { Node, mergeAttributes } from '@tiptap/core';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    FileText, Save, ArrowLeft, Upload, FileEdit,
    Loader2, Eye, Download, ZoomIn, ZoomOut,
    PanelLeftClose, PanelRightClose, ChevronDown,
    PenTool, Fingerprint, Calendar, Stamp, CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import EditorToolbar from './EditorToolbar';
import LegalVariablesPanel, { SIGNATURE_FIELDS } from './LegalVariablesPanel';
import PdfViewer, { PdfOverlayField, FIELD_DEFAULTS } from './PdfViewer';

import './editor-styles.css';

// ── Custom FontSize Extension (TipTap has no built-in) ──
const FontSize = Extension.create({
    name: 'fontSize',
    addGlobalAttributes() {
        return [
            {
                types: ['textStyle'],
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element: HTMLElement) => element.style.fontSize || null,
                        renderHTML: (attributes: Record<string, any>) => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}` };
                        },
                    },
                },
            },
        ];
    },
});

// ── Custom LegalVariable Node ──
const LegalVariable = Node.create({
    name: 'legalVariable',
    group: 'inline',
    inline: true,
    selectable: true,
    atom: true,
    addAttributes() {
        return {
            variable: {
                default: null,
            },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'span[data-variable]',
                getAttrs: (dom: HTMLElement) => ({
                    variable: dom.getAttribute('data-variable'),
                }),
            },
        ];
    },
    renderHTML({ HTMLAttributes, node }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                class: 'legal-variable',
                'data-variable': node.attrs.variable,
            }),
            `{{${node.attrs.variable}}}`,
        ];
    },
});

// ── Google Fonts for legal documents ──
const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Roboto:wght@300;400;500;700&display=swap';

const DRAG_FIELD_ICONS: Record<string, any> = {
    signature: PenTool,
    initials: Fingerprint,
    date_signed: Calendar,
    stamp: Stamp,
    checkbox: CheckSquare,
};

const DRAG_FIELD_COLORS: Record<string, string> = {
    signature: '#3B82F6',
    initials: '#10B981',
    date_signed: '#F59E0B',
    stamp: '#8B5CF6',
    checkbox: '#EC4899',
};

type BuilderMode = 'editor' | 'pdf';

const LEGAL_TEMPLATES = [
    {
        name: 'Non-Disclosure Agreement',
        content: `<h1 style="text-align: center">NON-DISCLOSURE AGREEMENT</h1>
<p style="text-align: center; color: #666; font-size: 14px;">Confidentiality Agreement</p>
<hr/>
<p>This Non-Disclosure Agreement ("Agreement") is entered into as of <span class="legal-variable" data-variable="contract_date">{{contract_date}}</span>, by and between:</p>
<p><strong>Disclosing Party:</strong> <span class="legal-variable" data-variable="client_name">{{client_name}}</span>, residing at <span class="legal-variable" data-variable="client_address">{{client_address}}</span></p>
<p><strong>Receiving Party:</strong> <span class="legal-variable" data-variable="opposing_party">{{opposing_party}}</span></p>
<h2>1. Definition of Confidential Information</h2>
<p>For purposes of this Agreement, "Confidential Information" means any data or information that is proprietary to the Disclosing Party and not generally known to the public, whether in tangible or intangible form.</p>
<h2>2. Obligations of Receiving Party</h2>
<p>The Receiving Party agrees to:</p>
<ul>
<li>Hold and maintain the Confidential Information in strict confidence</li>
<li>Not disclose any Confidential Information to any third parties</li>
<li>Not use Confidential Information for any purpose except as authorized by the Disclosing Party</li>
</ul>
<h2>3. Term</h2>
<p>This Agreement shall remain in effect for a period of two (2) years from the date of execution, unless terminated earlier by mutual written consent.</p>
<h2>4. Governing Law</h2>
<p>This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Disclosing Party resides.</p>
<br/><br/>
<p><strong>IN WITNESS WHEREOF</strong>, the parties have executed this Agreement as of the date first written above.</p>
<br/>
<div class="signature-block" data-type="signature" contenteditable="false">
<div style="border-bottom: 2px solid #333; width: 300px; height: 60px; margin: 20px 0 5px 0; display: flex; align-items: flex-end; justify-content: center; color: #aaa; font-size: 12px;">Sign Here</div>
<p style="font-size: 11px; color: #666; margin: 0;">Disclosing Party Signature</p>
</div>
<p>Name: <span class="legal-variable" data-variable="client_name">{{client_name}}</span></p>
<p>Date: <span class="legal-variable" data-variable="date_signed">{{date_signed}}</span></p>`,
    },
    {
        name: 'Power of Attorney',
        content: `<h1 style="text-align: center">POWER OF ATTORNEY</h1>
<hr/>
<p>I, <span class="legal-variable" data-variable="client_name">{{client_name}}</span>, residing at <span class="legal-variable" data-variable="client_address">{{client_address}}</span>, do hereby appoint:</p>
<p><strong><span class="legal-variable" data-variable="attorney_name">{{attorney_name}}</span></strong>, Bar Number: <span class="legal-variable" data-variable="bar_number">{{bar_number}}</span>, of <span class="legal-variable" data-variable="firm_name">{{firm_name}}</span></p>
<p>as my true and lawful Attorney-in-Fact to act on my behalf in the following matters:</p>
<ol>
<li>To represent me in all legal proceedings related to Case No. <span class="legal-variable" data-variable="case_number">{{case_number}}</span></li>
<li>To sign documents and contracts on my behalf</li>
<li>To negotiate settlements and agreements</li>
</ol>
<p>This Power of Attorney shall become effective immediately and shall remain in full force until revoked by me in writing.</p>
<br/>
<div class="signature-block" data-type="signature" contenteditable="false">
<div style="border-bottom: 2px solid #333; width: 300px; height: 60px; margin: 20px 0 5px 0; display: flex; align-items: flex-end; justify-content: center; color: #aaa; font-size: 12px;">Sign Here</div>
<p style="font-size: 11px; color: #666; margin: 0;">Principal Signature</p>
</div>
<p>Date: <span class="legal-variable" data-variable="date_signed">{{date_signed}}</span></p>`,
    },
    {
        name: 'Blank Document',
        content: `<h1>Document Title</h1><p>Start typing your legal document here...</p>`,
    },
];

// ── Editor Drop Zone ──
function EditorDropZone({ zoom, editor, isActive }: { zoom: number; editor: any; isActive: boolean }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'editor-drop-zone',
        data: { type: 'editor-canvas' },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'h-full overflow-auto transition-colors duration-200',
                isOver && 'bg-blue-50/40 dark:bg-blue-950/20',
            )}
            style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
                backgroundSize: '20px 20px',
            }}
        >
            {/* Drop indicator */}
            {isOver && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-[100] flex items-center gap-2 animate-bounce">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Drop to insert into document
                </div>
            )}
            <div className="flex justify-center py-8 px-4">
                <div
                    className={cn(
                        'bg-white dark:bg-slate-900 shadow-xl border w-full transition-all',
                        isOver
                            ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-800'
                            : 'border-slate-200 dark:border-slate-800',
                        isActive && !isOver && 'border-dashed border-blue-200 dark:border-blue-800',
                    )}
                    style={{
                        maxWidth: 816,
                        minHeight: 1056,
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                    }}
                >
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}

export default function TemplateBuilderContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const templateId = searchParams.get('id');

    const [mode, setMode] = useState<BuilderMode>('editor');
    const [templateName, setTemplateName] = useState('Untitled Template');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!!templateId);
    const [showSidebar, setShowSidebar] = useState(true);
    const [zoom, setZoom] = useState(100);

    // PDF mode state
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfFields, setPdfFields] = useState<PdfOverlayField[]>([]);
    const [selectedPdfField, setSelectedPdfField] = useState<string | null>(null);
    const [showTemplateChooser, setShowTemplateChooser] = useState(false);

    // Drag state for DragOverlay
    const [activeDragType, setActiveDragType] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // DnD sensors — require 5px of movement before starting drag to allow clicks
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // Inject Google Fonts link
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const existingLink = document.querySelector('link[data-legal-fonts]');
        if (existingLink) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = GOOGLE_FONTS_URL;
        link.setAttribute('data-legal-fonts', 'true');
        document.head.appendChild(link);
    }, []);

    // TipTap Editor
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({
                placeholder: 'Start typing your legal document...',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Highlight.configure({ multicolor: true }),
            TextStyle,
            FontFamily,
            FontSize,
            LegalVariable,
            Underline,
            Color,
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
        ],
        content: '<h1>Document Title</h1><p>Start typing your legal document here...</p>',
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[900px] px-[72px] py-[72px]',
                style: "font-family: 'Times New Roman', Times, serif;",
            },
        },
    });

    // Load template if ?id= is present
    useEffect(() => {
        if (!templateId) {
            setLoading(false);
            return;
        }
        const loadTemplate = async () => {
            try {
                const res = await fetch(`/api/templates?id=${templateId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.template) {
                        setTemplateName(data.template.name || 'Untitled Template');
                        if (data.template.fields?.editorContent && editor) {
                            editor.commands.setContent(data.template.fields.editorContent);
                        }
                        if (data.template.fields?.pdfFields) {
                            setPdfFields(data.template.fields.pdfFields);
                        }
                        if (data.template.fields?.pdfUrl) {
                            setPdfUrl(data.template.fields.pdfUrl);
                            setMode('pdf');
                        }
                        if (data.template.fields?.mode) {
                            setMode(data.template.fields.mode);
                        }
                    }
                }
            } catch (err) {
                toast.error('Failed to load template');
            } finally {
                setLoading(false);
            }
        };
        loadTemplate();
    }, [templateId, editor]);

    // File upload handler
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
            const url = URL.createObjectURL(file);
            setPdfUrl(url);
            setMode('pdf');
            setPdfFields([]);
            setTemplateName(file.name.replace(/\.[^/.]+$/, ''));
            toast.success('PDF loaded! Now add signing fields.');
        } else if (
            file.type === 'application/msword' ||
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            toast.info('DOC/DOCX support coming soon. Please upload a PDF for now.');
        } else {
            toast.error('Please upload a PDF or DOC file');
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleInsertSignatureField = useCallback((type: string) => {
        const defaults = FIELD_DEFAULTS[type];
        if (!defaults) return;
        const newField: PdfOverlayField = {
            id: `pdf-field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: type as PdfOverlayField['type'],
            x: 100,
            y: 100 + pdfFields.length * 30,
            width: defaults.w,
            height: defaults.h,
            page: 1,
            label: defaults.label,
            required: true,
        };
        setPdfFields(prev => [...prev, newField]);
        setSelectedPdfField(newField.id);
    }, [pdfFields.length]);

    // Save handler
    const handleSave = useCallback(async () => {
        const isNew = !templateId || templateId === 'new_template';
        setSaving(true);
        try {
            const templateData = {
                editorContent: editor?.getHTML() || '',
                pdfFields,
                pdfUrl: pdfUrl || null,
                mode,
            };
            const payload = {
                id: isNew ? undefined : templateId,
                name: templateName,
                fields: templateData,
                roles: [],
                status: 'draft',
            };
            const method = isNew ? 'POST' : 'PUT';
            const res = await fetch('/api/templates', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = await res.json();
                // toast.success('Template saved!'); // Optional: silent save for autosave
                if (isNew && data.template?.id) {
                    router.replace(`/dashboard/chambers-admin/templates/builder?id=${data.template.id}`);
                }
            } else {
                const err = await res.json();
                console.error('Save error:', err);
                toast.error(err.error || 'Failed to save');
            }
        } catch (err) {
            console.error('Failed to save:', err);
            toast.error('Failed to save template');
        } finally {
            setSaving(false);
        }
    }, [templateId, templateName, editor, pdfFields, pdfUrl, mode, router]);

    // ── Autosave Functionality (every 3 seconds) ──
    const lastSavedData = useRef<string>('');

    useEffect(() => {
        if (!editor || loading) return;

        const interval = setInterval(() => {
            const currentData = JSON.stringify({
                html: editor.getHTML(),
                fields: pdfFields,
                name: templateName,
                mode,
                url: pdfUrl
            });

            if (currentData !== lastSavedData.current) {
                handleSave();
                lastSavedData.current = currentData;
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [editor, pdfFields, templateName, mode, pdfUrl, handleSave, loading]);

    const applyTemplate = useCallback((content: string, name: string) => {
        if (editor) {
            editor.commands.setContent(content);
            setTemplateName(name);
        }
        setShowTemplateChooser(false);
        setMode('editor');
    }, [editor]);

    // ── DnD Handlers ──
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const data = event.active.data.current;
        if (data?.type === 'signing-field') {
            setActiveDragType(data.fieldType);
        }
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveDragType(null);
        const { active, over } = event;
        if (!active || !over) return;

        const data = active.data.current;
        if (data?.type !== 'signing-field') return;

        const fieldType = data.fieldType as string;
        const defaults = FIELD_DEFAULTS[fieldType];
        if (!defaults) return;

        const overId = String(over.id);

        // Dropped on a specific PDF page (pdf-page-1, pdf-page-2, etc.)
        if (overId.startsWith('pdf-page-') && mode === 'pdf') {
            const pageNumber = over.data.current?.pageNumber || parseInt(overId.replace('pdf-page-', ''), 10) || 1;

            // Calculate drop position relative to the page
            const dropRect = over.rect;
            const delta = event.delta;
            const activeRect = event.active.rect.current?.initial;

            let dropX = 100;
            let dropY = 80;

            if (activeRect && dropRect) {
                dropX = Math.max(10, Math.min(
                    (activeRect.left + delta.x) - dropRect.left,
                    dropRect.width - defaults.w - 10
                ));
                dropY = Math.max(10, Math.min(
                    (activeRect.top + delta.y) - dropRect.top,
                    dropRect.height - defaults.h - 10
                ));
            }

            const newField: PdfOverlayField = {
                id: `pdf-field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                type: fieldType as PdfOverlayField['type'],
                x: dropX,
                y: dropY,
                width: defaults.w,
                height: defaults.h,
                page: pageNumber,
                label: defaults.label,
                required: true,
            };
            setPdfFields(prev => [...prev, newField]);
            setSelectedPdfField(newField.id);
            toast.success(`${defaults.label} placed on page ${pageNumber}`);
            return;
        }

        // Dropped on editor canvas
        if (overId === 'editor-drop-zone' && mode === 'editor') {
            handleInsertSignatureField(fieldType);
            toast.success(`${defaults.label} inserted into document`);
            return;
        }
    }, [mode, handleInsertSignatureField]);

    const handleDragCancel = useCallback(() => {
        setActiveDragType(null);
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#f8f9fa] z-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-sm text-slate-500">Loading template...</p>
                </div>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="fixed inset-0 flex flex-col bg-[#f0f2f5] dark:bg-slate-950 z-50">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                />

                {/* ── Top Header ── */}
                <header className="h-14 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-30 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-slate-800"
                            onClick={() => router.push('/dashboard/chambers-admin/templates')}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="h-5 w-px bg-slate-200" />
                        <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="h-8 text-sm font-semibold bg-transparent border-none focus-visible:ring-1 focus-visible:ring-blue-500/50 px-2 w-[280px] text-slate-800 dark:text-white"
                            placeholder="Template Name..."
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mode Switcher */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                            <button
                                onClick={() => setMode('editor')}
                                disabled={!!pdfUrl}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                                    mode === 'editor'
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700',
                                    pdfUrl && 'opacity-50 cursor-not-allowed hidden'
                                )}
                            >
                                <FileEdit className="w-3.5 h-3.5" />
                                Editor
                            </button>
                            <button
                                onClick={() => {
                                    if (!pdfUrl) {
                                        fileInputRef.current?.click();
                                    } else {
                                        setMode('pdf');
                                    }
                                }}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                                    mode === 'pdf'
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                <Upload className="w-3.5 h-3.5" />
                                {pdfUrl ? 'PDF View' : 'Upload PDF'}
                            </button>
                        </div>

                        {/* Hidden Editor Divider - if PDF uploaded, we only show Upload button if they want to change PDF */}
                        {!pdfUrl && <div className="h-5 w-px bg-slate-200" />}

                        {/* Upload button */}
                        {!pdfUrl && (
                            <Button
                                variant="ghost" size="sm"
                                className="text-slate-500 hover:text-slate-700 gap-1.5 h-8"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-3.5 h-3.5" />
                                <span className="text-xs">Upload</span>
                            </Button>
                        )}

                        {/* Templates */}
                        <div className="relative">
                            <Button
                                variant="ghost" size="sm"
                                className="text-slate-500 hover:text-slate-700 gap-1.5 h-8"
                                onClick={() => setShowTemplateChooser(!showTemplateChooser)}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span className="text-xs">Templates</span>
                                <ChevronDown className="w-3 h-3" />
                            </Button>

                            {showTemplateChooser && (
                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 w-72 py-2">
                                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                                            Legal Templates
                                        </p>
                                    </div>
                                    {LEGAL_TEMPLATES.map((tmpl) => (
                                        <button
                                            key={tmpl.name}
                                            onClick={() => applyTemplate(tmpl.content, tmpl.name)}
                                            className="flex items-center gap-2.5 px-3 py-2.5 w-full text-left hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{tmpl.name}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="h-5 w-px bg-slate-200" />

                        {/* Sidebar toggle */}
                        <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-slate-400"
                            onClick={() => setShowSidebar(!showSidebar)}
                        >
                            {showSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                        </Button>

                        {/* Save */}
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-8 px-5 text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/20 gap-1.5 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </header>

                {/* ── Editor Toolbar (only in editor mode) ── */}
                {mode === 'editor' && <EditorToolbar editor={editor} />}

                {/* ── Main Content ── */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Center — Editor or PDF */}
                    <div className="flex-1 overflow-hidden">
                        {mode === 'editor' ? (
                            <EditorDropZone zoom={zoom} editor={editor} isActive={!!activeDragType} />
                        ) : pdfUrl ? (
                            <PdfViewer
                                fileUrl={pdfUrl}
                                fields={pdfFields}
                                onFieldsChange={setPdfFields}
                                selectedFieldId={selectedPdfField}
                                onSelectField={setSelectedPdfField}
                            />
                        ) : (
                            /* Upload prompt */
                            <div className="h-full flex items-center justify-center">
                                <div
                                    className="text-center cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="w-24 h-24 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                                        <Upload className="w-10 h-10 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                                        Upload a Document
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-4 max-w-sm">
                                        Upload a PDF to start adding signature fields,
                                        initials, dates, and other signing elements.
                                    </p>
                                    <Button className="gap-2">
                                        <Upload className="w-4 h-4" />
                                        Choose File
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar — Legal Variables & Signing Fields */}
                    {showSidebar && (
                        <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shrink-0 overflow-hidden flex flex-col">
                            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    {mode === 'editor' ? 'Document Fields' : 'PDF Signing Fields'}
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <LegalVariablesPanel
                                    editor={editor}
                                    mode={mode}
                                    onInsertSignatureField={handleInsertSignatureField}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Close template chooser on outside click */}
                {showTemplateChooser && (
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowTemplateChooser(false)}
                    />
                )}
            </div>

            {/* Drag Overlay — shows the field being dragged */}
            <DragOverlay dropAnimation={null}>
                {activeDragType && (() => {
                    const Icon = DRAG_FIELD_ICONS[activeDragType] || PenTool;
                    const color = DRAG_FIELD_COLORS[activeDragType] || '#3B82F6';
                    const label = FIELD_DEFAULTS[activeDragType]?.label || 'Field';
                    return (
                        <div
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl border-2 backdrop-blur-sm"
                            style={{
                                backgroundColor: `${color}15`,
                                borderColor: color,
                                color: color,
                            }}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-xs font-bold">{label}</span>
                        </div>
                    );
                })()}
            </DragOverlay>
        </DndContext>
    );
}
