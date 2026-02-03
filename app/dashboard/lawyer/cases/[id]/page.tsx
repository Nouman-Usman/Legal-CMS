'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CaseDetail } from '@/components/shared/case-detail';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function LawyerCaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const caseId = params.id as string;

    return (
        <ProtectedRoute requiredRole="lawyer">
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
                <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4 pl-0 hover:pl-2 transition-all gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Cases
                    </Button>

                    <CaseDetail caseId={caseId} />
                </div>
            </div>
        </ProtectedRoute>
    );
}
