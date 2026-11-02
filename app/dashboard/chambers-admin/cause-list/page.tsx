'use client';

import { ProtectedRoute } from '@/lib/components/protected-route';
import { CauseListView } from '@/components/cause-lists/cause-list-view';

export default function ChamberCauseListPage() {
    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <CauseListView canManage casePath={(id) => `/dashboard/chambers-admin/cases/${id}`} />
        </ProtectedRoute>
    );
}
