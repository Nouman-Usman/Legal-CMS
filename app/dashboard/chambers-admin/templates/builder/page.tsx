'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import TemplateBuilderContent from './TemplateBuilderContent';

export default function TemplateBuilderPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-[#f8f9fa] z-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-sm text-slate-500 font-medium">Loading Template Builder...</p>
                </div>
            </div>
        }>
            <TemplateBuilderContent />
        </Suspense>
    );
}
