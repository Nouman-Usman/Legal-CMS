'use client';

import { useParams } from 'next/navigation';
import { CaseDetail } from '@/components/shared/case-detail';

export default function MunshiCasePage() {
    const { id } = useParams<{ id: string }>();
    return (
        <div className="l-dash-page">
            <CaseDetail caseId={id} />
        </div>
    );
}
