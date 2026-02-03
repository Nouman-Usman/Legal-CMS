import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';

/**
 * Hook to enforce lawyer onboarding completion
 * Redirects lawyers to onboarding if they haven't completed it
 * Allows access to onboarding and auth pages
 */
export function useOnboardingCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole } = useAuth();

  useEffect(() => {
    // Only apply to lawyers
    if (userRole !== 'lawyer') {
      return;
    }

    // Pages that don't require onboarding check
    const exceptionPaths = [
      '/dashboard/lawyer/onboard',
      '/auth',
      '/api',
      '/logout',
    ];

    // Check if current path is an exception
    const isExceptionPath = exceptionPaths.some(path => pathname?.startsWith(path));
    if (isExceptionPath) {
      return;
    }

    // Check if lawyer has completed onboarding
    // This would typically be done by checking user.onboarding_completed
    const hasCompletedOnboarding = user?.user_metadata?.onboarding_completed || false;

    if (!hasCompletedOnboarding && pathname !== '/dashboard/lawyer/onboard') {
      // Redirect to onboarding
      router.push('/dashboard/lawyer/onboard');
    }
  }, [user, userRole, pathname, router]);
}
