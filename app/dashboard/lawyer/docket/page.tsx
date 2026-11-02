'use client';

import { ProtectedRoute } from '@/lib/components/protected-route';
import { DashScope } from '@/components/dashboard/dash-scope';
import { DocketView } from '@/components/hearings/docket-view';

export default function LawyerDocketPage() {
    return (
        <ProtectedRoute requiredRole="lawyer">
            <DashScope>
                <DocketView scope="lawyer" casePath={(id) => `/dashboard/lawyer/cases/${id}`} />
            </DashScope>
        </ProtectedRoute>
    );
}
