'use client';

import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    GripVertical,
    Type,
    Calendar,
    AlignLeft,
    Save,
    Trash2,
    FileText,
    CornerDownRight,
    Settings2,
    MousePointerClick,
    Heading,
    Image as ImageIcon,
    MoreHorizontal,
    Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- Types ---
type BlockType = 'text' | 'input' | 'textarea' | 'date' | 'header' | 'image';

interface TemplateBlock {
    id: string;
    type: BlockType;
    label: string;
    placeholder?: string;
    content?: string;
    required?: boolean;
}

// --- Draggable Sidebar Item (Toolbox) ---
function SidebarItem({ type, icon: Icon, label }: { type: BlockType; icon: any; label: string }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `sidebar-${type}`,
        data: { type, isSidebarItem: true, label }
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                "flex items-center gap-3 p-2.5 rounded-md border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 cursor-grab transition-all group",
                isDragging && "opacity-50 ring-2 ring-blue-500"
            )}
        >
            <Icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
            <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{label}</span>
        </div>
    );
}

// --- Sortable Canvas Item (Preview) ---
function SortableBlock({
    block,
    isSelected,
    onClick
}: {
    block: TemplateBlock;
    isSelected: boolean;
    onClick: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                "relative group px-1 py-1 transition-all border border-transparent rounded-sm", // Tighter padding for doc feel
                isSelected
                    ? "border-blue-400 bg-blue-50/20 z-10 ring-1 ring-blue-400"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                isDragging && "opacity-50 z-50 scale-105"
            )}
        >
            {/* Drag Handle - Floating on hover/select */}
            <div
                {...attributes}
                {...listeners}
                className={cn(
                    "absolute -left-10 top-1/2 -translate-y-1/2 p-2 cursor-grab text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
                    isSelected && "opacity-100 text-blue-500"
                )}
            >
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="space-y-2 pointer-events-none w-full">

                {block.type === 'header' && (
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                        {block.content || block.label}
                    </h1>
                )}

                {block.type === 'text' && (
                    <p className="text-[11pt] text-slate-800 dark:text-slate-300 leading-relaxed font-serif">
                        {block.content || "Start typing your document text here..."}
                    </p>
                )}

                {block.type === 'image' && (
                    <div className="w-full flex justify-center py-4 bg-slate-50 dark:bg-slate-900 rounded border border-dashed border-slate-300 dark:border-slate-700">
                        {block.content ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={block.content} alt={block.label} className="max-w-full max-h-[400px] object-contain shadow-sm" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400 py-8">
                                <ImageIcon className="w-12 h-12 stroke-1" />
                                <span className="text-sm">Image Placeholder</span>
                            </div>
                        )}
                    </div>
                )}

                {(block.type === 'input' || block.type === 'date' || block.type === 'textarea') && (
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {block.label} {block.required && <span className="text-red-500">*</span>}
                        </Label>
                        {block.type === 'textarea' ? (
                            <div className="w-full border-b border-slate-300 dark:border-slate-700 bg-transparent py-1 text-[11pt] text-slate-400 font-serif italic">
                                {block.placeholder || "Enter details..."}
                            </div>
                        ) : (
                            <div className="w-full border-b border-slate-300 dark:border-slate-700 bg-transparent py-1 text-[11pt] flex items-center text-slate-400 font-serif italic">
                                {block.type === 'date' ? (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Select date...</span>
                                    </div>
                                ) : (
                                    <span>{block.placeholder || "Enter text..."}</span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Properties Panel ---
function PropertiesPanel({
    block,
    onUpdate,
    onDelete
}: {
    block: TemplateBlock | null;
    onUpdate: (id: string, updates: Partial<TemplateBlock>) => void;
    onDelete: (id: string) => void;
}) {
    if (!block) {
        return (
            <div className="p-8 text-center h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <MousePointerClick className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Select an element to edit</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    {block.type.toUpperCase()}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(block.id)}
                    className="text-slate-400 hover:text-red-500 h-7 w-7"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Image Specific Props */}
                {block.type === 'image' && (
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Image Source (URL)</Label>
                        <Textarea
                            value={block.content || ''}
                            onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                            className="text-xs font-mono"
                            placeholder="https://example.com/image.png"
                        />
                        <p className="text-[10px] text-slate-400">Paste a direct image link to preview.</p>
                    </div>
                )}

                {/* Common: Label / Content */}
                <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {block.type === 'header' || block.type === 'text' ? 'Text Content' : 'Field Label'}
                    </Label>
                    {(block.type === 'header' || block.type === 'text') ? (
                        <Textarea
                            value={block.content || ''}
                            onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                            className="min-h-[120px] resize-none text-sm"
                            placeholder="Enter display text..."
                        />
                    ) : (
                        <Input
                            value={block.label}
                            onChange={(e) => onUpdate(block.id, { label: e.target.value })}
                            placeholder="e.g. Client Name"
                        />
                    )}
                </div>

                {/* Placeholder (Inputs only) */}
                {(block.type !== 'header' && block.type !== 'text' && block.type !== 'image') && (
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Placeholder Text</Label>
                        <Input
                            value={block.placeholder || ''}
                            onChange={(e) => onUpdate(block.id, { placeholder: e.target.value })}
                            placeholder="e.g. Enter full legal name..."
                        />
                    </div>
                )}

                {/* Required Toggle (Inputs only) */}
                {(block.type !== 'header' && block.type !== 'text' && block.type !== 'image') && (
                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Required</Label>
                            <p className="text-[10px] text-slate-500">Mandatory field</p>
                        </div>
                        <Switch
                            checked={block.required || false}
                            onCheckedChange={(checked) => onUpdate(block.id, { required: checked })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Main Builder Component ---
export default function TemplateBuilder() {
    const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
    const [templateName, setTemplateName] = useState('Untitled Document');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const { setNodeRef: setCanvasRef } = useDroppable({
        id: 'canvas-droppable',
    });

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
        if (event.active.data.current?.isSidebarItem) {
            setSelectedBlockId(null);
        }
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        if (active.data.current?.isSidebarItem) {
            const type = active.data.current.type;
            const newId = `block-${Date.now()}`;
            const newBlock: TemplateBlock = {
                id: newId,
                type,
                label: active.data.current.label,
                placeholder: '',
                content: type === 'header' ? 'Untitled Section' : type === 'text' ? 'Click to edit this text paragraph.' : '',
                required: false
            };
            setBlocks((items) => [...items, newBlock]);
            setSelectedBlockId(newId);
            toast.success('Element added');
            return;
        }

        if (active.id !== over.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const updateBlock = (id: string, updates: Partial<TemplateBlock>) => {
        setBlocks(items => items.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const deleteBlock = (id: string) => {
        setBlocks(items => items.filter(b => b.id !== id));
        if (selectedBlockId === id) setSelectedBlockId(null);
        toast.info("Element deleted");
    };

    const handleSave = () => {
        if (blocks.length === 0) {
            toast.error("Document is empty!");
            return;
        }
        console.log("Saving Template:", { name: templateName, structure: blocks });
        toast.success("Template saved successfully!");
    };

    const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

    return (
        <div className="h-screen flex flex-col bg-[#F9FBFD] dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden">
            {/* Google Docs Style Header */}
            <header className="h-auto shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-sm">
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-600 rounded text-white">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <Input
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="h-6 text-lg font-medium bg-transparent border-none focus-visible:ring-0 p-0 placeholder:text-slate-300 w-[300px] text-slate-800 dark:text-white"
                                placeholder="Untitled Document"
                            />
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                                <span className="hover:text-slate-800 cursor-pointer">File</span>
                                <span className="hover:text-slate-800 cursor-pointer">Edit</span>
                                <span className="hover:text-slate-800 cursor-pointer">View</span>
                                <span className="hover:text-slate-800 cursor-pointer">Insert</span>
                                <span className="hover:text-slate-800 cursor-pointer">Format</span>
                                <span className="hover:text-slate-800 cursor-pointer">Tools</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 font-semibold shadow-sm h-9">
                            Share
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreHorizontal className="w-5 h-5 text-slate-500" />
                        </Button>
                    </div>
                </div>
                {/* Toolbar */}
                <div className="px-4 py-1.5 flex items-center gap-2 bg-[#EDF2FA] dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => toast.info("Undo")}>
                            <CornerDownRight className="w-4 h-4 -scale-x-100" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => toast.info("Redo")}>
                            <CornerDownRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => toast.info("Print")}>
                        <Printer className="w-4 h-4" />
                    </Button>
                    {/* Placeholder for more toolbar items */}
                    <div className="text-xs text-slate-500 ml-4 font-medium italic">
                        Mock Toolbar - Use sidebar to add elements
                    </div>
                </div>
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 flex overflow-hidden">

                    {/* Left Panel: Toolbox (Clean List) */}
                    <div className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 py-4 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                        <div className="px-4 mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Insert</h3>
                        </div>
                        <div className="px-2 space-y-1">
                            <SidebarItem type="header" icon={Heading} label="Heading" />
                            <SidebarItem type="text" icon={AlignLeft} label="Text Paragraph" />
                            <SidebarItem type="image" icon={ImageIcon} label="Image" />
                            <div className="my-2 border-t border-slate-100 dark:border-slate-800 mx-2" />
                            <SidebarItem type="input" icon={Type} label="Text Field" />
                            <SidebarItem type="textarea" icon={AlignLeft} label="Text Area" />
                            <SidebarItem type="date" icon={Calendar} label="Date Field" />
                        </div>
                    </div>

                    {/* Center Panel: Canvas (Page View) */}
                    <div
                        className="flex-1 overflow-y-auto bg-[#F9FBFD] dark:bg-slate-950 p-8 flex justify-center cursor-default"
                        onClick={() => setSelectedBlockId(null)}
                    >
                        <div
                            ref={setCanvasRef}
                            className="w-[816px] min-h-[1056px] bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col relative transition-all duration-300 isolate"
                            onClick={(e) => e.stopPropagation()}
                            style={{ padding: '96px' }} // Standard ~1 inch margins
                        >
                            {blocks.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center text-slate-300">
                                        <p className="text-lg font-medium">Blank Page</p>
                                        <p className="text-sm">Drag items from the left to start</p>
                                    </div>
                                </div>
                            )}

                            <SortableContext
                                items={blocks.map(b => b.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-4 min-h-full">
                                    {blocks.map((block) => (
                                        <SortableBlock
                                            key={block.id}
                                            block={block}
                                            isSelected={selectedBlockId === block.id}
                                            onClick={() => setSelectedBlockId(block.id)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>

                        </div>
                    </div>

                    {/* Right Panel: Properties */}
                    <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 transition-all duration-300">
                        <PropertiesPanel
                            block={selectedBlock}
                            onUpdate={updateBlock}
                            onDelete={deleteBlock}
                        />
                    </div>

                </div>

                <DragOverlay>
                    {activeId ? (
                        <div className="opacity-90 scale-105 shadow-xl rotate-2 cursor-grabbing p-3 bg-white border border-blue-500 text-blue-700 rounded-lg font-bold w-[200px] flex items-center gap-3">
                            <div className="p-1.5 bg-blue-50 rounded">
                                <MousePointerClick className="w-4 h-4" />
                            </div>
                            <span className="text-sm">Dragging...</span>
                        </div>
                    ) : null}
                </DragOverlay>

            </DndContext>
        </div>
    );
}

