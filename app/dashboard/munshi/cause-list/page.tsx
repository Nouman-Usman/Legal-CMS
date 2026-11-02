'use client';

import { CauseListView } from '@/components/cause-lists/cause-list-view';
import { munshiCasePath } from '@/lib/dashboard/munshi-paths';

export default function MunshiCauseListPage() {
    return <CauseListView canManage={false} casePath={munshiCasePath} />;
}
