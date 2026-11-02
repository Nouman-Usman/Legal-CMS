'use client';

import { ProtectedRoute } from '@/lib/components/protected-route';
import { DashScope } from '@/components/dashboard/dash-scope';

/** The munshi (chamber clerk) app: phone-first docket, files, deadlines and collections. */
export default function MunshiLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="munshi">
            <DashScope>{children}</DashScope>
        </ProtectedRoute>
    );
}
