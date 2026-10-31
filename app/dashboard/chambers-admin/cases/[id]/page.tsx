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
            <div className="l-dash-page">
                <CaseDetail caseId={id} />
            </div>
        </ProtectedRoute>
    );
}
