'use client';

import { useEffect, useState } from 'react';
import { Briefcase, TrendingUp, Wallet } from 'lucide-react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { DashPage, PageHeader, StatTile } from '@/components/dashboard/ui';
import { DuesPanel } from '@/components/fees/dues-panel';
import { formatMoney } from '@/lib/fees/ledger';
import { getCollectedThisMonth, type DueRow } from '@/lib/supabase/fees';

export default function FeesPage() {
    const { user } = useAuth();
    const [dues, setDues] = useState<DueRow[] | null>(null);
    const [collected, setCollected] = useState<number | null>(null);

    useEffect(() => {
        if (user?.chamber_id) getCollectedThisMonth(user.chamber_id).then(setCollected);
    }, [user?.chamber_id]);

    const outstanding = dues?.reduce((sum, d) => sum + d.balance, 0);

    return (
        <ProtectedRoute requiredRole="chamber_admin">
            <DashPage>
                <PageHeader eyebrow="Money" title="Fees & Dues" description="What clients owe, what came in this month, and a one-tap WhatsApp reminder for each case." />
                <div className="l-stats">
                    <StatTile label="Outstanding" value={outstanding == null ? '…' : formatMoney(outstanding)} icon={Wallet} />
                    <StatTile label="Collected this month" value={collected == null ? '…' : formatMoney(collected)} icon={TrendingUp} />
                    <StatTile label="Cases with dues" value={dues?.length ?? '…'} icon={Briefcase} />
                </div>
                <DuesPanel chamberId={user?.chamber_id} onLoaded={setDues} />
            </DashPage>
        </ProtectedRoute>
    );
}
