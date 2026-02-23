'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Heading1, Heading2, Heading3,
    Undo2, Redo2, Minus, Quote, Table as TableIcon,
    Highlighter, ChevronDown, Plus, Minus as MinusIcon,
    Type, Palette, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
    editor: Editor | null;
}

// ── Legal-grade font families ──
const FONT_FAMILIES = [
    { label: 'Times New Roman', value: 'Times New Roman', style: "'Times New Roman', Times, serif" },
    { label: 'Garamond', value: 'EB Garamond', style: "'EB Garamond', Garamond, serif" },
    { label: 'Georgia', value: 'Georgia', style: "Georgia, 'Times New Roman', serif" },
    { label: 'Merriweather', value: 'Merriweather', style: "'Merriweather', Georgia, serif" },
    { label: 'Lora', value: 'Lora', style: "'Lora', Georgia, serif" },
    { label: 'Libre Baskerville', value: 'Libre Baskerville', style: "'Libre Baskerville', Georgia, serif" },
    { label: 'Crimson Text', value: 'Crimson Text', style: "'Crimson Text', Georgia, serif" },
    { label: 'Playfair Display', value: 'Playfair Display', style: "'Playfair Display', Georgia, serif" },
    { label: 'Inter', value: 'Inter', style: "'Inter', Helvetica, Arial, sans-serif" },
    { label: 'Roboto', value: 'Roboto', style: "'Roboto', Helvetica, Arial, sans-serif" },
    { label: 'Arial', value: 'Arial', style: "Arial, Helvetica, sans-serif" },
    { label: 'Courier New', value: 'Courier New', style: "'Courier New', Courier, monospace" },
];

// ── Font sizes (in pt) ──
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72];

// ── Heading styles (Google Docs-like) ──
const PARAGRAPH_STYLES = [
    { label: 'Normal text', value: 'paragraph' },
    { label: 'Heading 1', value: 'heading-1' },
    { label: 'Heading 2', value: 'heading-2' },
    { label: 'Heading 3', value: 'heading-3' },
];

function ToolbarButton({
    onClick,
    isActive,
    icon: Icon,
    title,
    disabled,
    className,
}: {
    onClick: () => void;
    isActive?: boolean;
    icon: any;
    title: string;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                'h-7 w-7 flex items-center justify-center rounded transition-colors',
                isActive
                    ? 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                disabled && 'opacity-40 cursor-not-allowed',
                className,
            )}
        >
            <Icon className="w-[15px] h-[15px]" />
        </button>
    );
}

function ToolbarDivider() {
    return <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />;
}

// ── Dropdown Component ──
function ToolbarDropdown({
    value,
    options,
    onChange,
    width = 'w-40',
    renderOption,
    title,
}: {
    value: string;
    options: { label: string; value: string; style?: string }[];
    onChange: (value: string) => void;
    width?: string;
    renderOption?: (option: { label: string; value: string; style?: string }, isSelected: boolean) => React.ReactNode;
    title: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || value || options[0]?.label;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                title={title}
                className={cn(
                    'flex items-center gap-1 h-7 px-2 rounded text-xs font-medium transition-colors border',
                    open
                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
                    width,
                )}
            >
                <span className="truncate flex-1 text-left">{selectedLabel}</span>
                <ChevronDown className={cn('w-3 h-3 shrink-0 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[60] py-1 max-h-64 overflow-y-auto min-w-full"
                    style={{ minWidth: '180px' }}
                >
                    {options.map(opt => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={cn(
                                    'flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm transition-colors',
                                    isSelected
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50',
                                )}
                            >
                                {renderOption ? renderOption(opt, isSelected) : (
                                    <>
                                        <span className="flex-1" style={opt.style ? { fontFamily: opt.style } : {}}>{opt.label}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Font Size Input (Google Docs-style) ──
function FontSizeControl({ editor }: { editor: Editor }) {
    const [inputValue, setInputValue] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get current font size
    const getCurrentSize = useCallback(() => {
        const attrs = editor.getAttributes('textStyle');
        if (attrs.fontSize) {
            return parseInt(attrs.fontSize.replace('pt', '').replace('px', ''), 10);
        }
        return 12; // default
    }, [editor]);

    useEffect(() => {
        if (!isEditing) {
            setInputValue(String(getCurrentSize()));
        }
    }, [editor.state.selection, isEditing, getCurrentSize]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const applySize = (size: number) => {
        const clampedSize = Math.max(6, Math.min(96, size));
        editor.chain().focus().setMark('textStyle', { fontSize: `${clampedSize}pt` }).run();
        setInputValue(String(clampedSize));
        setIsEditing(false);
        setShowDropdown(false);
    };

    const increment = () => {
        const current = getCurrentSize();
        const nextIdx = FONT_SIZES.findIndex(s => s > current);
        applySize(nextIdx >= 0 ? FONT_SIZES[nextIdx] : current + 2);
    };

    const decrement = () => {
        const current = getCurrentSize();
        const prevSizes = FONT_SIZES.filter(s => s < current);
        applySize(prevSizes.length > 0 ? prevSizes[prevSizes.length - 1] : Math.max(6, current - 2));
    };

    return (
        <div className="flex items-center" ref={dropdownRef}>
            {/* Decrease button */}
            <button
                onClick={decrement}
                title="Decrease font size"
                className="h-7 w-6 flex items-center justify-center rounded-l border border-r-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
                <MinusIcon className="w-3 h-3" />
            </button>

            {/* Size input */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onFocus={() => { setIsEditing(true); setShowDropdown(true); inputRef.current?.select(); }}
                    onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const num = parseInt(inputValue, 10);
                            if (!isNaN(num)) applySize(num);
                        }
                        if (e.key === 'Escape') {
                            setIsEditing(false);
                            setShowDropdown(false);
                            setInputValue(String(getCurrentSize()));
                        }
                    }}
                    onBlur={() => {
                        setIsEditing(false);
                        const num = parseInt(inputValue, 10);
                        if (!isNaN(num)) applySize(num);
                    }}
                    className="h-7 w-10 text-center text-xs font-medium border-y border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                    title="Font size"
                />
                {/* Dropdown */}
                {showDropdown && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[60] py-1 max-h-48 overflow-y-auto w-16">
                        {FONT_SIZES.map(size => (
                            <button
                                key={size}
                                onMouseDown={(e) => { e.preventDefault(); applySize(size); }}
                                className={cn(
                                    'w-full px-2 py-1 text-xs text-center transition-colors',
                                    getCurrentSize() === size
                                        ? 'bg-blue-50 text-blue-700 font-bold'
                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700',
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Increase button */}
            <button
                onClick={increment}
                title="Increase font size"
                className="h-7 w-6 flex items-center justify-center rounded-r border border-l-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
                <Plus className="w-3 h-3" />
            </button>
        </div>
    );
}


export default function EditorToolbar({ editor }: EditorToolbarProps) {
    if (!editor) return null;

    // Current font family
    const currentFont = editor.getAttributes('textStyle').fontFamily || 'Times New Roman';

    // Current paragraph style
    const getCurrentStyle = () => {
        if (editor.isActive('heading', { level: 1 })) return 'heading-1';
        if (editor.isActive('heading', { level: 2 })) return 'heading-2';
        if (editor.isActive('heading', { level: 3 })) return 'heading-3';
        return 'paragraph';
    };

    const applyParagraphStyle = (value: string) => {
        switch (value) {
            case 'heading-1': editor.chain().focus().toggleHeading({ level: 1 }).run(); break;
            case 'heading-2': editor.chain().focus().toggleHeading({ level: 2 }).run(); break;
            case 'heading-3': editor.chain().focus().toggleHeading({ level: 3 }).run(); break;
            default: editor.chain().focus().setParagraph().run(); break;
        }
    };

    const applyFont = (fontValue: string) => {
        const font = FONT_FAMILIES.find(f => f.value === fontValue);
        if (font) {
            editor.chain().focus().setFontFamily(font.style).run();
        }
    };

    return (
        <div className="flex items-center gap-1 px-3 py-1 bg-[#f9fbfd] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-wrap min-h-[40px]">
            {/* Undo / Redo */}
            <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                icon={Undo2}
                title="Undo (Ctrl+Z)"
                disabled={!editor.can().undo()}
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                icon={Redo2}
                title="Redo (Ctrl+Y)"
                disabled={!editor.can().redo()}
            />

            <ToolbarDivider />

            {/* Paragraph Style Dropdown */}
            <ToolbarDropdown
                value={getCurrentStyle()}
                options={PARAGRAPH_STYLES}
                onChange={applyParagraphStyle}
                width="w-28"
                title="Text style"
                renderOption={(opt, isSelected) => (
                    <>
                        <span className={cn(
                            'flex-1',
                            opt.value === 'heading-1' && 'text-lg font-bold',
                            opt.value === 'heading-2' && 'text-base font-semibold',
                            opt.value === 'heading-3' && 'text-sm font-semibold',
                            opt.value === 'paragraph' && 'text-sm',
                        )}>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </>
                )}
            />

            <ToolbarDivider />

            {/* Font Family Dropdown */}
            <ToolbarDropdown
                value={FONT_FAMILIES.find(f => currentFont.includes(f.value))?.value || 'Times New Roman'}
                options={FONT_FAMILIES}
                onChange={applyFont}
                width="w-40"
                title="Font"
                renderOption={(opt, isSelected) => (
                    <>
                        <span className="flex-1" style={{ fontFamily: opt.style }}>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </>
                )}
            />

            <ToolbarDivider />

            {/* Font Size */}
            <FontSizeControl editor={editor} />

            <ToolbarDivider />

            {/* Text formatting */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                icon={Bold}
                title="Bold (Ctrl+B)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                icon={Italic}
                title="Italic (Ctrl+I)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                icon={UnderlineIcon}
                title="Underline (Ctrl+U)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                icon={Strikethrough}
                title="Strikethrough"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                isActive={editor.isActive('highlight')}
                icon={Highlighter}
                title="Highlight"
            />

            <ToolbarDivider />

            {/* Alignment */}
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                icon={AlignLeft}
                title="Align left"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                icon={AlignCenter}
                title="Center"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                icon={AlignRight}
                title="Align right"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                icon={AlignJustify}
                title="Justify"
            />

            <ToolbarDivider />

            {/* Lists */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                icon={List}
                title="Bulleted list"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                icon={ListOrdered}
                title="Numbered list"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                icon={Quote}
                title="Blockquote"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                icon={Minus}
                title="Horizontal line"
            />

            <ToolbarDivider />

            {/* Table */}
            <ToolbarButton
                onClick={() =>
                    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                }
                icon={TableIcon}
                title="Insert table"
            />
        </div>
    );
}
