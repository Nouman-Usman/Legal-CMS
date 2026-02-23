'use client';

import { Editor } from '@tiptap/react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
    User, Calendar, Hash, Building2,
    Scale, FileText, Mail, Phone,
    MapPin, Gavel, Stamp, PenTool,
    Fingerprint, CheckSquare, GripVertical,
    Info, Copy, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

const LEGAL_VARIABLES = [
    {
        category: 'Party Information',
        icon: User,
        description: 'Auto-fills with client & party details',
        items: [
            {
                key: 'client_name',
                label: 'Client Name',
                icon: User,
                description: 'Full legal name of the client',
                example: 'e.g. Muhammad Ali Khan',
            },
            {
                key: 'client_email',
                label: 'Client Email',
                icon: Mail,
                description: 'Primary email address',
                example: 'e.g. ali@example.com',
            },
            {
                key: 'client_phone',
                label: 'Client Phone',
                icon: Phone,
                description: 'Contact phone number',
                example: 'e.g. +92 300 1234567',
            },
            {
                key: 'client_address',
                label: 'Client Address',
                icon: MapPin,
                description: 'Full residential/business address',
                example: 'e.g. 123 Main St, Lahore',
            },
            {
                key: 'opposing_party',
                label: 'Opposing Party',
                icon: User,
                description: 'Name of the opposing party',
                example: 'e.g. XYZ Corporation Ltd.',
            },
        ],
    },
    {
        category: 'Case Details',
        icon: Scale,
        description: 'Auto-fills with case & court information',
        items: [
            {
                key: 'case_number',
                label: 'Case Number',
                icon: Hash,
                description: 'Official case reference number',
                example: 'e.g. CIV-2026-00142',
            },
            {
                key: 'case_title',
                label: 'Case Title',
                icon: FileText,
                description: 'Full title of the case',
                example: 'e.g. Khan vs. XYZ Corp',
            },
            {
                key: 'court_name',
                label: 'Court Name',
                icon: Gavel,
                description: 'Name of the presiding court',
                example: 'e.g. Lahore High Court',
            },
            {
                key: 'filing_date',
                label: 'Filing Date',
                icon: Calendar,
                description: 'Date the case was filed',
                example: 'e.g. February 23, 2026',
            },
            {
                key: 'hearing_date',
                label: 'Hearing Date',
                icon: Calendar,
                description: 'Next scheduled hearing date',
                example: 'e.g. March 15, 2026',
            },
        ],
    },
    {
        category: 'Firm Details',
        icon: Building2,
        description: 'Auto-fills with your firm information',
        items: [
            {
                key: 'firm_name',
                label: 'Firm Name',
                icon: Building2,
                description: 'Name of the law firm / chamber',
                example: 'e.g. Khan & Associates',
            },
            {
                key: 'attorney_name',
                label: 'Attorney Name',
                icon: User,
                description: 'Name of the assigned attorney',
                example: 'e.g. Barrister Ahmed',
            },
            {
                key: 'bar_number',
                label: 'Bar Number',
                icon: Hash,
                description: 'Attorney bar license number',
                example: 'e.g. PBC-12345',
            },
            {
                key: 'firm_address',
                label: 'Firm Address',
                icon: MapPin,
                description: 'Registered firm address',
                example: 'e.g. Suite 5, Legal Tower',
            },
        ],
    },
    {
        category: 'Dates & Numbers',
        icon: Calendar,
        description: 'Dynamic dates and numeric values',
        items: [
            {
                key: 'current_date',
                label: 'Current Date',
                icon: Calendar,
                description: 'Today\'s date (auto-generated)',
                example: 'e.g. February 23, 2026',
            },
            {
                key: 'contract_date',
                label: 'Contract Date',
                icon: Calendar,
                description: 'Date of contract execution',
                example: 'e.g. January 1, 2026',
            },
            {
                key: 'expiry_date',
                label: 'Expiry Date',
                icon: Calendar,
                description: 'Contract/agreement expiry date',
                example: 'e.g. December 31, 2027',
            },
            {
                key: 'amount',
                label: 'Amount',
                icon: Hash,
                description: 'Monetary amount or figure',
                example: 'e.g. PKR 500,000',
            },
        ],
    },
];

const SIGNATURE_FIELDS = [
    {
        key: 'signature',
        label: 'Signature Block',
        icon: PenTool,
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        description: 'Full signature area for signing',
    },
    {
        key: 'initials',
        label: 'Initials',
        icon: Fingerprint,
        color: '#10B981',
        bgColor: '#ECFDF5',
        description: 'Small space for initials only',
    },
    {
        key: 'date_signed',
        label: 'Date Signed',
        icon: Calendar,
        color: '#F59E0B',
        bgColor: '#FFFBEB',
        description: 'Auto-fill date when signed',
    },
    {
        key: 'stamp',
        label: 'Stamp / Seal',
        icon: Stamp,
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
        description: 'Official seal or stamp area',
    },
    {
        key: 'checkbox',
        label: 'Checkbox',
        icon: CheckSquare,
        color: '#EC4899',
        bgColor: '#FDF2F8',
        description: 'Agreement / selection checkbox',
    },
];

// ── Draggable Signing Field ──
function DraggableSigningField({
    field,
    onClickInsert,
}: {
    field: typeof SIGNATURE_FIELDS[0];
    onClickInsert: (type: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `signing-field-${field.key}`,
        data: {
            type: 'signing-field',
            fieldType: field.key,
        },
    });

    const style = transform
        ? {
            transform: CSS.Translate.toString(transform),
            zIndex: 1000,
        }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all border cursor-grab active:cursor-grabbing select-none',
                isDragging
                    ? 'opacity-50 shadow-2xl scale-105 ring-2'
                    : 'hover:shadow-md hover:-translate-y-0.5'
            )}
            {...listeners}
            {...attributes}
        >
            {/* Drag handle */}
            <div className="flex items-center gap-2 flex-1">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: field.bgColor }}
                >
                    <field.icon className="w-4 h-4" style={{ color: field.color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-xs" style={{ color: field.color }}>{field.label}</span>
                    <p className="text-[10px] text-slate-400 leading-tight truncate">{field.description}</p>
                </div>
            </div>

            {/* Grip icon */}
            <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />

            {/* Click overlay for inserting on click too */}
            <button
                className="absolute inset-0 rounded-xl opacity-0"
                onClick={(e) => {
                    e.stopPropagation();
                    onClickInsert(field.key);
                }}
                onPointerDown={(e) => e.stopPropagation()}
            />
        </div>
    );
}


// ── Legal Variable Item ──
function LegalVariableItem({
    item,
    onInsert,
}: {
    item: { key: string; label: string; icon: any; description: string; example: string };
    onInsert: (key: string) => void;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`{{${item.key}}}`);
        setCopied(true);
        toast.success(`Copied {{${item.key}}} to clipboard`);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onInsert(item.key)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onInsert(item.key); }}
            className="group flex items-start gap-2.5 w-full px-3 py-2.5 rounded-xl text-left cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 transition-all hover:shadow-sm border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
        >
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors mt-0.5">
                <item.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                        {item.label}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                        title="Copy variable"
                    >
                        {copied
                            ? <Sparkles className="w-3 h-3 text-green-500" />
                            : <Copy className="w-3 h-3 text-slate-400" />
                        }
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                    {item.description}
                </p>
                <span className="inline-block mt-1 text-[10px] font-mono text-blue-500/70 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-md">
                    {item.example}
                </span>
            </div>
            {/* Variable tag */}
            <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                {`{{${item.key}}}`}
            </span>
        </div>
    );
}


interface LegalVariablesPanelProps {
    editor: Editor | null;
    mode: 'editor' | 'pdf';
    onInsertSignatureField?: (type: string) => void;
}

export default function LegalVariablesPanel({
    editor,
    mode,
    onInsertSignatureField,
}: LegalVariablesPanelProps) {
    const [expandedCategories, setExpandedCategories] = useState<string[]>(
        LEGAL_VARIABLES.map(c => c.category)
    );

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const insertVariable = (key: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent([
            {
                type: 'legalVariable',
                attrs: { variable: key }
            },
            {
                type: 'text',
                text: ' '
            }
        ]).run();
        toast.success(`Inserted {{${key}}} into document`);
    };

    const handleClickInsert = (type: string) => {
        if (mode === 'pdf' && onInsertSignatureField) {
            onInsertSignatureField(type);
            return;
        }
        if (!editor) return;

        if (type === 'date_signed') {
            editor.chain().focus().insertContent([
                {
                    type: 'legalVariable',
                    attrs: { variable: 'date_signed' }
                },
                {
                    type: 'text',
                    text: ' '
                }
            ]).run();
            toast.success(`Date Signed inserted`);
            return;
        }

        const signatureHtml: Record<string, string> = {
            signature: `
                <div class="signature-block" data-type="signature" contenteditable="false">
                    <div style="border-bottom: 2px solid #333; width: 300px; height: 60px; margin: 20px 0 5px 0; display: flex; align-items: flex-end; justify-content: center; color: #aaa; font-size: 12px;">
                        Sign Here
                    </div>
                    <p style="font-size: 11px; color: #666; margin: 0;">Signature</p>
                </div>
            `,
            initials: `
                <div class="signature-block" data-type="initials" contenteditable="false">
                    <div style="border-bottom: 2px solid #333; width: 80px; height: 40px; margin: 10px 0 5px 0; display: flex; align-items: flex-end; justify-content: center; color: #aaa; font-size: 10px;">
                        Initials
                    </div>
                </div>
            `,
            stamp: `
                <div class="signature-block" data-type="stamp" contenteditable="false">
                    <div style="width: 120px; height: 120px; border: 3px dashed #999; border-radius: 50%; margin: 15px 0; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 11px; text-align: center;">
                        Official<br/>Stamp
                    </div>
                </div>
            `,
            checkbox: `
                <span class="signature-block" data-type="checkbox" contenteditable="false" style="display: inline-block; width: 18px; height: 18px; border: 2px solid #333; border-radius: 3px; vertical-align: middle; margin: 0 4px;"></span>
            `,
        };

        const html = signatureHtml[type];
        if (html) {
            editor.chain().focus().insertContent(html).run();
            toast.success(`${type.replace('_', ' ')} block inserted`);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* ── Signing Fields (Draggable) ── */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Signing Fields
                    </h3>
                </div>
                <p className="text-[10px] text-slate-400 mb-3">
                    {mode === 'pdf'
                        ? 'Drag fields onto the PDF or click to add'
                        : 'Click to insert into the document'}
                </p>
                <div className="space-y-1.5">
                    {SIGNATURE_FIELDS.map(field => (
                        <DraggableSigningField
                            key={field.key}
                            field={field}
                            onClickInsert={handleClickInsert}
                        />
                    ))}
                </div>
            </div>

            {/* ── Legal Variables ── */}
            <div className="p-4 space-y-3 flex-1">
                <div className="mb-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Legal Variables
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Click a variable to insert it. Values are auto-filled when the document is used.
                    </p>
                </div>

                {LEGAL_VARIABLES.map(category => {
                    const isExpanded = expandedCategories.includes(category.category);
                    return (
                        <div key={category.category} className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.category)}
                                className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
                                    <category.icon className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <div className="flex-1 text-left">
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        {category.category}
                                    </span>
                                    <p className="text-[9px] text-slate-400 leading-tight">
                                        {category.description}
                                    </p>
                                </div>
                                <svg
                                    className={cn(
                                        'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
                                        isExpanded && 'rotate-180'
                                    )}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Items */}
                            {isExpanded && (
                                <div className="py-1.5 px-1.5 space-y-0.5 bg-white dark:bg-slate-950/30">
                                    {category.items.map(item => (
                                        <LegalVariableItem
                                            key={item.key}
                                            item={item}
                                            onInsert={insertVariable}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export { SIGNATURE_FIELDS };
