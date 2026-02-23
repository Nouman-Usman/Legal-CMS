'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useDroppable } from '@dnd-kit/core';
import {
    PenTool, Fingerprint, Calendar, Stamp,
    CheckSquare, Trash2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Set the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface PdfOverlayField {
    id: string;
    type: 'signature' | 'initials' | 'date_signed' | 'stamp' | 'checkbox';
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    label: string;
    required: boolean;
}

const FIELD_DEFAULTS: Record<string, { w: number; h: number; label: string }> = {
    signature: { w: 200, h: 60, label: 'Signature' },
    initials: { w: 80, h: 50, label: 'Initials' },
    date_signed: { w: 160, h: 36, label: 'Date Signed' },
    stamp: { w: 120, h: 120, label: 'Stamp / Seal' },
    checkbox: { w: 24, h: 24, label: 'Checkbox' },
};

const FIELD_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    signature: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.5)', text: '#3B82F6' },
    initials: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.5)', text: '#10B981' },
    date_signed: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.5)', text: '#F59E0B' },
    stamp: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.5)', text: '#8B5CF6' },
    checkbox: { bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.5)', text: '#EC4899' },
};

// ── Per-Page Droppable Wrapper ──
function PdfPageDropZone({
    pageNumber,
    pageWidth,
    fields,
    selectedFieldId,
    onSelectField,
    onFieldsChange,
    allFields,
    isOver: parentIsOver,
}: {
    pageNumber: number;
    pageWidth: number;
    fields: PdfOverlayField[];
    selectedFieldId: string | null;
    onSelectField: (id: string | null) => void;
    onFieldsChange: (fields: PdfOverlayField[]) => void;
    allFields: PdfOverlayField[];
    isOver?: boolean;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `pdf-page-${pageNumber}`,
        data: {
            type: 'pdf-page',
            pageNumber,
        },
    });

    // Track dragging existing fields
    const [dragging, setDragging] = useState<{
        id: string;
        startX: number;
        startY: number;
        origX: number;
        origY: number;
    } | null>(null);

    // Track resizing
    const [resizing, setResizing] = useState<{
        id: string;
        startX: number;
        startY: number;
        origW: number;
        origH: number;
    } | null>(null);

    useEffect(() => {
        if (!dragging && !resizing) return;

        const handleMove = (e: MouseEvent) => {
            if (dragging) {
                const dx = e.clientX - dragging.startX;
                const dy = e.clientY - dragging.startY;
                onFieldsChange(
                    allFields.map(f =>
                        f.id === dragging.id
                            ? { ...f, x: Math.max(0, dragging.origX + dx), y: Math.max(0, dragging.origY + dy) }
                            : f
                    )
                );
            }
            if (resizing) {
                const dx = e.clientX - resizing.startX;
                const dy = e.clientY - resizing.startY;
                onFieldsChange(
                    allFields.map(f =>
                        f.id === resizing.id
                            ? {
                                ...f,
                                width: Math.max(30, resizing.origW + dx),
                                height: Math.max(20, resizing.origH + dy),
                            }
                            : f
                    )
                );
            }
        };

        const handleUp = () => {
            setDragging(null);
            setResizing(null);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [dragging, resizing, allFields, onFieldsChange]);

    const deleteField = useCallback((id: string) => {
        onFieldsChange(allFields.filter(f => f.id !== id));
        if (selectedFieldId === id) onSelectField(null);
    }, [allFields, selectedFieldId, onFieldsChange, onSelectField]);

    const renderFieldContent = (field: PdfOverlayField) => {
        const colors = FIELD_COLORS[field.type] || FIELD_COLORS.signature;

        switch (field.type) {
            case 'signature':
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-1">
                        <PenTool className="w-5 h-5 opacity-40" style={{ color: colors.text }} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60"
                            style={{ color: colors.text }}>Sign Here</span>
                    </div>
                );
            case 'initials':
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-0.5">
                        <Fingerprint className="w-4 h-4 opacity-40" style={{ color: colors.text }} />
                        <span className="text-[9px] font-bold uppercase opacity-60"
                            style={{ color: colors.text }}>Initials</span>
                    </div>
                );
            case 'stamp':
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-1">
                        <Stamp className="w-6 h-6 opacity-30" style={{ color: colors.text }} />
                        <span className="text-[10px] font-semibold uppercase opacity-50"
                            style={{ color: colors.text }}>Stamp</span>
                    </div>
                );
            case 'checkbox':
                return (
                    <div className="flex items-center justify-center h-full">
                        <CheckSquare className="w-4 h-4 opacity-50" style={{ color: colors.text }} />
                    </div>
                );
            case 'date_signed':
                return (
                    <div className="flex items-center gap-2 px-2 h-full">
                        <Calendar className="w-3.5 h-3.5 opacity-40" style={{ color: colors.text }} />
                        <span className="text-xs opacity-50" style={{ color: colors.text }}>MM/DD/YYYY</span>
                    </div>
                );
            default:
                return null;
        }
    };

    const isDropTarget = isOver || parentIsOver;

    return (
        <div className="relative mb-6" key={pageNumber}>
            {/* Page label */}
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Page {pageNumber}
                </span>
                <span className="text-[10px] text-slate-400">
                    {fields.length} field{fields.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    'relative shadow-2xl transition-all duration-200',
                    isDropTarget && 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-950',
                )}
                onClick={() => onSelectField(null)}
            >
                <Page
                    pageNumber={pageNumber}
                    width={pageWidth}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                />

                {/* Drop indicator overlay */}
                {isDropTarget && (
                    <div className="absolute inset-0 bg-blue-500/5 border-2 border-dashed border-blue-400 rounded-sm pointer-events-none z-40 flex items-center justify-center">
                        <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            Drop here — Page {pageNumber}
                        </div>
                    </div>
                )}

                {/* Overlay Fields for this page */}
                {fields.map(field => {
                    const colors = FIELD_COLORS[field.type] || FIELD_COLORS.signature;
                    const isSelected = selectedFieldId === field.id;

                    return (
                        <div
                            key={field.id}
                            className={cn(
                                'absolute select-none transition-shadow',
                                isSelected && 'ring-2',
                                dragging?.id === field.id && 'opacity-80'
                            )}
                            style={{
                                left: field.x,
                                top: field.y,
                                width: field.width,
                                height: field.height,
                                backgroundColor: colors.bg,
                                borderColor: colors.border,
                                borderWidth: isSelected ? 2 : 1,
                                borderStyle: field.type === 'signature' || field.type === 'initials' || field.type === 'stamp'
                                    ? 'dashed' : 'solid',
                                borderRadius: field.type === 'checkbox' ? 4 : 6,
                                cursor: dragging ? 'grabbing' : 'grab',
                                zIndex: isSelected ? 50 : 10,
                                boxShadow: isSelected
                                    ? `0 0 0 3px ${colors.border}`
                                    : '0 1px 3px rgba(0,0,0,0.08)',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectField(field.id);
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onSelectField(field.id);
                                setDragging({
                                    id: field.id,
                                    startX: e.clientX,
                                    startY: e.clientY,
                                    origX: field.x,
                                    origY: field.y,
                                });
                            }}
                        >
                            {/* Label badge */}
                            {isSelected && (
                                <div
                                    className="absolute -top-5 left-0 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-t whitespace-nowrap flex items-center gap-1"
                                    style={{ backgroundColor: colors.text }}
                                >
                                    {field.label} (p.{field.page})
                                    <button
                                        className="ml-1 hover:opacity-70"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteField(field.id);
                                        }}
                                    >
                                        <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            )}

                            {renderFieldContent(field)}

                            {/* Resize handle */}
                            {isSelected && field.type !== 'checkbox' && (
                                <div
                                    className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full cursor-se-resize z-50"
                                    style={{ backgroundColor: colors.text }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setResizing({
                                            id: field.id,
                                            startX: e.clientX,
                                            startY: e.clientY,
                                            origW: field.width,
                                            origH: field.height,
                                        });
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// ── Main PdfViewer ──
interface PdfViewerProps {
    fileUrl: string;
    fields: PdfOverlayField[];
    onFieldsChange: (fields: PdfOverlayField[]) => void;
    selectedFieldId: string | null;
    onSelectField: (id: string | null) => void;
}

export default function PdfViewer({
    fileUrl,
    fields,
    onFieldsChange,
    selectedFieldId,
    onSelectField,
}: PdfViewerProps) {
    const [numPages, setNumPages] = useState(0);
    const [pageWidth, setPageWidth] = useState(816);
    const containerRef = useRef<HTMLDivElement>(null);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    // Fit page width to container
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                const w = containerRef.current.clientWidth - 80;
                setPageWidth(Math.min(w, 900));
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

    return (
        <div className="flex flex-col h-full">
            {/* Page count summary bar */}
            {numPages > 0 && (
                <div className="flex items-center justify-between gap-3 px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {numPages} page{numPages > 1 ? 's' : ''} • {fields.length} field{fields.length !== 1 ? 's' : ''} placed
                    </span>
                    <span className="text-[10px] text-slate-400">
                        Scroll to any page & drag fields from the sidebar
                    </span>
                </div>
            )}

            {/* All pages — scrollable */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                }}
            >
                <div className="flex flex-col items-center py-8 px-10">
                    <Document
                        file={fileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div className="flex items-center justify-center" style={{ width: pageWidth, height: pageWidth * 1.414 }}>
                                <div className="text-sm text-slate-400">Loading PDF...</div>
                            </div>
                        }
                    >
                        {pageNumbers.map(pageNum => (
                            <PdfPageDropZone
                                key={pageNum}
                                pageNumber={pageNum}
                                pageWidth={pageWidth}
                                fields={fields.filter(f => f.page === pageNum)}
                                selectedFieldId={selectedFieldId}
                                onSelectField={onSelectField}
                                onFieldsChange={onFieldsChange}
                                allFields={fields}
                            />
                        ))}
                    </Document>
                </div>
            </div>
        </div>
    );
}

// Export the defaults and types
export { FIELD_DEFAULTS, FIELD_COLORS };
