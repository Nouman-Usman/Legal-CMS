'use client';

import { ProtectedRoute } from '@/lib/components/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { DashPage, PageHeader } from '@/components/dashboard/ui';
import { ChamberDeadlines } from '@/components/deadlines/deadline-list';
import { HolidaysPanel } from '@/components/deadlines/holidays-panel';

export default function DeadlinesPage() {
    const { user } = useAuth();
    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <DashPage>
                <PageHeader
                    eyebrow="Diary"
                    title="Deadlines"
                    description="Every open filing, reply, compliance and appeal date across the chamber. Add deadlines from a case's Deadlines tab."
                />
                <ChamberDeadlines chamberId={user?.chamber_id} title="Open deadlines" />
                <HolidaysPanel chamberId={user?.chamber_id} />
            </DashPage>
        </ProtectedRoute>
    );
}
