'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { CaseDetail } from '@/components/shared/case-detail';

export default function CaseDetailsPage() {
    const params = useParams();
    const id = params?.id as string;

    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <div className="p-8 bg-gradient-to-b from-slate-50 to-slate-50/50 dark:from-slate-950 dark:to-slate-950/50 min-h-screen">
                <CaseDetail caseId={id} />
            </div>
        </ProtectedRoute>
    );
}
