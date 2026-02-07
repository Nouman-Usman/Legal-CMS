'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export type UserRole = 'chamber_admin' | 'lawyer' | 'client';

export interface UserProfile extends User {
  role: UserRole;
  onboarding_completed?: boolean;
  full_name: string;
  chamber_id?: string; // Legacy/convenience property for primary chamber
  lawyer_profile?: {
    id: string;
    bar_number?: string;
    specialization?: string;
    bio?: string;
    experience_years?: number;
    license_verification_status?: string;
  };
  client_profile?: {
    id: string;
    company_name?: string;
    contact_person?: string;
  };
  chambers?: Array<{
    id: string;
    chamber_id: string;
    role: string;
    is_active: boolean;
  }>;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: UserRole | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetchLock = React.useRef<string | null>(null);
  const lastFetchedUserId = React.useRef<string | null>(null);

  // Helper to fetch or create profile via server-side API (bypasses RLS)
  const getProfileWithRetry = async (currentUser: User) => {
    try {

      // Use server-side API route which uses service_role key (bypasses RLS)
      const fetchRes = await fetch('/api/profile', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (fetchRes.ok) {
        const data = await fetchRes.json();
        if (data.exists && data.profile) {
          return data.profile;
        }
      } else {
        console.error('Profile API fetch failed:', fetchRes.status, await fetchRes.text().catch(() => ''));
      }

      const validRoles: UserRole[] = ['chamber_admin', 'lawyer', 'client'];
      const metadataRole = currentUser.user_metadata?.role;
      const role: UserRole = validRoles.includes(metadataRole) ? metadataRole : 'client';

      const createRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: currentUser.user_metadata?.full_name || '',
          role: role,
        }),
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        if (createData.profile) {
          return createData.profile;
        }
      } else {
        console.error('Profile API create failed:', createRes.status, await createRes.text().catch(() => ''));
      }
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Direct fetch also failed:', error.message, error.code);
      }

      if (profile) {
        return profile;
      }

      return null;
    } catch (err) {
      console.error('Unexpected error in getProfileWithRetry:', err);
      return null;
    }
  };

  const handleUserSession = async (currentUser: User, forceFetch = false) => {
    // 1. Avoid redundant fetches for same user
    if (!forceFetch && lastFetchedUserId.current === currentUser.id && user) {
      return;
    }

    // 2. Atomic lock to prevent parallel fetches
    if (profileFetchLock.current === currentUser.id) return;
    profileFetchLock.current = currentUser.id;

    try {
      // Try local storage cache first for speed
      const cacheKey = `auth_profile_${currentUser.id}`;
      const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;

      if (!forceFetch && cached) {
        const cachedProfile = JSON.parse(cached);
        setUser({
          ...currentUser,
          ...cachedProfile,
          chamber_id: cachedProfile.chambers?.[0]?.chamber_id || cachedProfile.chamber_id
        } as UserProfile);
        setLoading(false);
        // Still fetch in background to sync
      }

      const profile = await getProfileWithRetry(currentUser);

      if (profile) {
        lastFetchedUserId.current = currentUser.id;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(profile));
        }
        setUser({
          ...currentUser,
          ...profile,
          chamber_id: profile.chambers?.[0]?.chamber_id
        } as UserProfile);
      } else {
        // Fallback to metadata
        const validRoles: UserRole[] = ['chamber_admin', 'lawyer', 'client'];
        const metadataRole = currentUser.user_metadata?.role;
        const role: UserRole = validRoles.includes(metadataRole) ? metadataRole : 'client';

        setUser({
          ...currentUser,
          role: role,
          full_name: currentUser.user_metadata?.full_name || currentUser.email || '',
        } as UserProfile);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error in handleUserSession:', err);
      setLoading(false);
    } finally {
      profileFetchLock.current = null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Global safety valve: force loading=false after 6s no matter what
    const globalTimeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 6000);

    const initializeAuth = async () => {
      try {
        // 1. Check for recovery token in hash (from email invitation links)
        const hash = typeof window !== 'undefined' ? window.location.hash : '';

        if (hash && hash.includes('access_token')) {

          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          if (accessToken && (type === 'recovery' || type === 'magiclink')) {
            try {
              const { data, error: setSessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });

              if (setSessionError) {
                console.error('setSession error:', setSessionError);
              } else if (data.session) {
                if (isMounted) {
                  window.history.replaceState({}, document.title, window.location.pathname);
                  // onAuthStateChange will handle handleUserSession
                  return;
                }
              }
            } catch (err: any) {
              console.error('Error setting recovery session:', err);
            }
          }
        }

        // 2. Initial state - just check if we have a session to set initial loading state
        const { data: { session } } = await supabase.auth.getSession();

        if (isMounted && !session) {
          setLoading(false);
        }
        // onAuthStateChange handles the rest
      } catch (err) {
        console.error('Initial session check failed:', err);
        if (isMounted) setLoading(false);
      }
    };

    // 2. Set up listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (session?.user) {
          // Only fetch on sign-in or session-start
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || !user) {
            await handleUserSession(session.user);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Run the explicit check
    initializeAuth();

    return () => {
      isMounted = false;
      clearTimeout(globalTimeout);
      subscription?.unsubscribe();
    };
  }, [user]);

  // Session monitoring - check and refresh tokens proactively
  useEffect(() => {
    if (!user) return;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && session.expires_at) {
          const expiresIn = session.expires_at - Math.floor(Date.now() / 1000);

          // If session expires in less than 10 minutes, refresh it
          if (expiresIn < 600) {
            const { data, error } = await supabase.auth.refreshSession();
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    // Check session immediately and then every 5 minutes
    checkSession();
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshProfile = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await handleUserSession(authUser, true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut: handleSignOut,
        userRole: user?.role || null,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
