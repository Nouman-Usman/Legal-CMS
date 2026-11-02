'use client';

import { useAuth } from '@/lib/contexts/auth-context';
import { DashPage, PageHeader } from '@/components/dashboard/ui';
import { ChamberDeadlines } from '@/components/deadlines/deadline-list';
import { munshiCasePath } from '@/lib/dashboard/munshi-paths';

export default function MunshiDeadlinesPage() {
    const { user } = useAuth();
    return (
        <DashPage>
            <PageHeader eyebrow="Diary" title="Deadlines" description="Every open filing, reply, compliance and appeal date in the chamber, overdue first." />
            <ChamberDeadlines chamberId={user?.chamber_id} title="Open deadlines" casePath={munshiCasePath} />
        </DashPage>
    );
}
