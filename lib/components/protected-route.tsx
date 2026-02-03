'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/contexts/auth-context';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, userRole } = useAuth();

  if (typeof window !== 'undefined') {
    console.log('ProtectedRoute:', { loading, hasUser: !!user, role: userRole, required: requiredRole });
  }

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    if (!loading && user && requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(userRole!)) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, userRole, requiredRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(userRole!)) {
      return null;
    }
  }

  return <>{children}</>;
}
