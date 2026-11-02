'use client';

import { ProtectedRoute } from '@/lib/components/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { DocketView } from '@/components/hearings/docket-view';
import { ChamberDeadlines } from '@/components/deadlines/deadline-list';

export default function ChamberDocketPage() {
    const { user } = useAuth();
    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <DocketView scope="chamber" casePath={(id) => `/dashboard/chambers-admin/cases/${id}`}>
                <ChamberDeadlines chamberId={user?.chamber_id} days={0} title="Deadlines due today" allHref="/dashboard/chambers-admin/deadlines" />
            </DocketView>
        </ProtectedRoute>
    );
}
