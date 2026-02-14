
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    Wand2,
    CheckCircle2,
    AlignLeft,
    RefreshCw,
    Languages,
    Eraser
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface AIEditorToolbarProps {
    onAction: (action: string, prompt?: string) => void;
    isGenerating: boolean;
}

export function AIEditorToolbar({ onAction, isGenerating }: AIEditorToolbarProps) {
    return (
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm mb-4">
            <div className="flex items-center gap-2 px-2 border-r border-slate-200 dark:border-slate-800 mr-2">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Assistant
                </span>
            </div>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction('improve')}
                disabled={isGenerating}
                className="gap-2 text-slate-600 hover:text-indigo-600"
            >
                <Wand2 className="w-4 h-4" />
                Improve Writing
            </Button>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction('grammar')}
                disabled={isGenerating}
                className="gap-2 text-slate-600 hover:text-emerald-600"
            >
                <CheckCircle2 className="w-4 h-4" />
                Fix Grammar
            </Button>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction('simplify')}
                disabled={isGenerating}
                className="gap-2 text-slate-600 hover:text-blue-600"
            >
                <AlignLeft className="w-4 h-4" />
                Simplify
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={isGenerating} className="gap-2 text-slate-600">
                        <RefreshCw className="w-4 h-4" />
                        Rephrase / Tone
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => onAction('tone_formal')}>
                        Make it Formal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('tone_persuasive')}>
                        Make it Persuasive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('tone_urgent')}>
                        Make it Urgent
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onAction('expand')}>
                        Expand Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('shorten')}>
                        Shorten / Summarize
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction('clear')}
                className="text-slate-400 hover:text-red-500"
            >
                <Eraser className="w-4 h-4" />
            </Button>
        </div>
    );
}
