'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export type UserRole = 'chamber_admin' | 'lawyer' | 'client';

export interface UserProfile extends User {
  role: UserRole;
  full_name: string;
  chamber_id?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch or create profile
  const getProfileWithRetry = async (currentUser: User) => {
    try {
      console.log('Fetching profile for:', currentUser.id);

      // 1. Attempt to fetch existing profile regarding deleted status
      // We want to see our own profile even if soft deleted
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
      }

      // 2. If profile exists, return it
      if (profile) {
        console.log('Profile found:', profile.email);
        return profile;
      }

      // 3. Profile doesn't exist - create it
      console.log('Profile missing. Creating profile...');

      const validRoles: UserRole[] = ['chamber_admin', 'lawyer', 'client'];
      const metadataRole = currentUser.user_metadata?.role;
      const role: UserRole = validRoles.includes(metadataRole) ? metadataRole : 'client';

      // Use upsert to create or update profile
      const { data: upsertedProfile, error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: currentUser.id,
          email: currentUser.email!,
          full_name: currentUser.user_metadata?.full_name || '',
          role: role
        }, {
          onConflict: 'id'
        })
        .select()
        .maybeSingle();

      if (upsertError) {
        console.error("Failed to upsert profile:", {
          message: upsertError.message,
          code: upsertError.code,
          details: upsertError.details,
          hint: upsertError.hint
        });
        return null;
      }

      console.log('Profile created successfully:', upsertedProfile?.email);
      return upsertedProfile;
    } catch (err) {
      console.error('Unexpected error in getProfileWithRetry:', err);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    console.log('AuthProvider mounted');

    // Global safety valve: force loading=false after 6s no matter what
    const globalTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Global auth timeout - forcing loading=false');
        setLoading(false);
      }
    }, 6000);

    const initializeAuth = async () => {
      try {
        // 1. Check for recovery token in hash (from email invitation links)
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        console.log('Hash on init:', hash ? `present (${hash.length} chars)` : 'empty');
        
        if (hash && hash.includes('access_token')) {
          console.log('Processing recovery token from hash...');
          
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');
          
          console.log('Token type:', type);
          
          if (accessToken && type === 'recovery') {
            try {
              console.log('Calling setSession with recovery token...');
              const { data, error: setSessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              
              if (setSessionError) {
                console.error('setSession error:', setSessionError);
              } else if (data.session) {
                console.log('Recovery session set successfully!');
                if (isMounted) {
                  window.history.replaceState({}, document.title, window.location.pathname);
                  await handleUserSession(data.session.user);
                  return;
                }
              }
            } catch (err: any) {
              console.error('Error setting recovery session:', err);
            }
          }
        }
        
        // 2. Check session immediately
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial getSession result:', session?.user?.id, error);

        if (isMounted) {
          if (session?.user) {
            await handleUserSession(session.user);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Initial session check failed:', err);
        if (isMounted) setLoading(false);
      }
    };

    const handleUserSession = async (currentUser: User) => {
      try {
        // Wrap profile fetch with timeout
        const profilePromise = getProfileWithRetry(currentUser);
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.warn('Profile fetch timed out after 4s');
            resolve(null);
          }, 4000);
        });

        const profile = await Promise.race([profilePromise, timeoutPromise]);

        if (!isMounted) return;

        if (profile) {
          setUser({
            ...currentUser,
            ...profile,
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
        if (isMounted) setLoading(false);
      }
    };

    // 2. Set up listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthStateChange:', event, session?.user?.id);
        if (!isMounted) return;

        if (session?.user) {
          // If we already have the same user loaded, don't re-fetch profile unless it's a specific event
          // checking user.id against session.user.id would require valid closure or ref
          await handleUserSession(session.user);
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
  }, []);

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
            console.log('Proactively refreshing session...');
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              console.error('Session refresh error:', error);
            } else {
              console.log('Session refreshed successfully');
            }
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut: handleSignOut,
        userRole: user?.role || null,
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
