'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, userRole } = useAuth();

  useEffect(() => {
    if (!loading && user && userRole) {
      // Route to role-specific dashboard
      switch (userRole) {
        case 'chamber_admin':
          router.push('/dashboard/chambers-admin');
          break;
        case 'lawyer':
          router.push('/dashboard/lawyer');
          break;
        case 'client':
          router.push('/dashboard/client');
          break;
      }
    }
  }, [user, loading, userRole, router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Redirecting to your dashboard...</p>

        {/* Failsafe links if redirect hangs */}
        {!loading && user && userRole && (
          <div className="mt-8 flex flex-col gap-2 text-center">
            <p className="text-sm text-red-500 mb-2">Taking longer than expected?</p>
            <button
              onClick={() => window.location.href = `/dashboard/${userRole === 'chamber_admin' ? 'chambers-admin' : userRole}`}
              className="text-primary hover:underline underline-offset-4"
            >
              Click here to go to {userRole} dashboard
            </button>
          </div>
        )}

        {!loading && user && !userRole && (
          <div className="text-center text-destructive">
            <p>User authenticated but no role assigned.</p>
            <p className="text-sm text-muted-foreground mt-2">Please contact support or ensure you ran the database setup scripts.</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
