'use client';

import { useAuth } from '@/lib/contexts/auth-context';
import { DocketView } from '@/components/hearings/docket-view';
import { ChamberDeadlines } from '@/components/deadlines/deadline-list';
import { munshiCasePath } from '@/lib/dashboard/munshi-paths';

/** Today: the chamber's cause list, plus filings and replies due. */
export default function MunshiTodayPage() {
    const { user } = useAuth();
    return (
        <DocketView scope="chamber" casePath={munshiCasePath}>
            <ChamberDeadlines chamberId={user?.chamber_id} days={0} title="Deadlines due today" allHref="/dashboard/munshi/deadlines" casePath={munshiCasePath} />
        </DocketView>
    );
}
