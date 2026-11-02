'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { DashPage, PageHeader, StatTile } from '@/components/dashboard/ui';
import { DuesPanel } from '@/components/fees/dues-panel';
import { formatMoney } from '@/lib/fees/ledger';
import { getCollectedThisMonth, type DueRow } from '@/lib/supabase/fees';
import { munshiCasePath } from '@/lib/dashboard/munshi-paths';

/** Dues to collect, with a WhatsApp reminder per case. Payments are recorded on the case. */
export default function MunshiCollectPage() {
    const { user } = useAuth();
    const [dues, setDues] = useState<DueRow[] | null>(null);
    const [collected, setCollected] = useState<number | null>(null);

    useEffect(() => {
        if (user?.chamber_id) getCollectedThisMonth(user.chamber_id).then(setCollected);
    }, [user?.chamber_id]);

    return (
        <DashPage>
            <PageHeader eyebrow="Money" title="To collect" description="Open a case to record a payment and send the receipt." />
            <div className="l-stats">
                <StatTile label="Outstanding" value={dues ? formatMoney(dues.reduce((s, d) => s + d.balance, 0)) : '…'} icon={Wallet} />
                <StatTile label="Collected this month" value={collected == null ? '…' : formatMoney(collected)} icon={TrendingUp} />
            </div>
            <DuesPanel chamberId={user?.chamber_id} onLoaded={setDues} casePath={munshiCasePath} />
        </DashPage>
    );
}
