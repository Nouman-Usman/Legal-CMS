'use client';

import { ProtectedRoute } from '@/lib/components/protected-route';
import { DocketView } from '@/components/hearings/docket-view';

export default function ChamberDocketPage() {
    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <DocketView scope="chamber" casePath={(id) => `/dashboard/chambers-admin/cases/${id}`} />
        </ProtectedRoute>
    );
}
