'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { DashPage, EmptyState, PageHeader, Panel, SearchInput, StatusChip } from '@/components/dashboard/ui';
import { munshiCasePath } from '@/lib/dashboard/munshi-paths';

interface CaseRow {
    id: string;
    case_number: string | null;
    title: string;
    client_name: string | null;
    court: string | null;
    status: string | null;
    next_hearing_date: string | null;
}

/** Find a file fast: search by number, title, client or court. */
export default function MunshiCasesPage() {
    const { user } = useAuth();
    const [cases, setCases] = useState<CaseRow[] | null>(null);
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (!user?.chamber_id) return;
        supabase
            .from('cases')
            .select('id, case_number, title, client_name, court, status, next_hearing_date')
            .eq('chamber_id', user.chamber_id)
            .is('deleted_at', null)
            .order('next_hearing_date', { ascending: true, nullsFirst: false })
            .then(({ data }) => setCases((data ?? []) as CaseRow[]));
    }, [user?.chamber_id]);

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!cases || !q) return cases;
        return cases.filter((c) => [c.case_number, c.title, c.client_name, c.court].some((v) => v?.toLowerCase().includes(q)));
    }, [cases, query]);

    return (
        <DashPage>
            <PageHeader eyebrow="Files" title="Cases" description="Open a case to record a hearing, upload an order or take a payment." />
            <SearchInput label="Search cases" placeholder="Case no., title, client or court" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Panel flush>
                {shown === null ? (
                    <p className="m-0 p-5 text-sm l-muted">Loading...</p>
                ) : shown.length === 0 ? (
                    <EmptyState icon={Briefcase} title={query ? 'No matching cases' : 'No cases yet'} />
                ) : (
                    <ul className="l-rows">
                        {shown.map((c) => (
                            <li key={c.id}>
                                <Link href={munshiCasePath(c.id)} className="flex items-center justify-between gap-3 min-h-11">
                                    <span className="flex flex-col min-w-0">
                                        <span className="font-semibold truncate">{[c.case_number, c.title].filter(Boolean).join(' · ')}</span>
                                        <span className="text-sm l-muted truncate">
                                            {c.client_name ?? 'No client'}
                                            {c.court ? ` · ${c.court}` : ''}
                                            {c.next_hearing_date ? ` · next ${new Date(c.next_hearing_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-2 shrink-0">
                                        <StatusChip status={c.status} />
                                        <ChevronRight aria-hidden="true" className="w-4 h-4 l-muted" />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </DashPage>
    );
}
