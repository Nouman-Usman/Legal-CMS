import { supabase } from './client';

/**
 * Session utilities for debugging and monitoring
 */

export const getSessionInfo = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Error fetching session:', error);
        return null;
    }

    if (!session) {
        return { status: 'No active session' };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = session.expires_at ? session.expires_at - now : 0;

    return {
        status: 'Active',
        user: session.user.email,
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Unknown',
        expiresIn: `${Math.floor(expiresIn / 60)} minutes`,
        accessToken: session.access_token ? '✓ Present' : '✗ Missing',
        refreshToken: session.refresh_token ? '✓ Present' : '✗ Missing',
    };
};

export const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
        console.error('Error refreshing session:', error);
        return { success: false, error };
    }

    return { success: true, session: data.session };
};

export const clearSession = async () => {
    await supabase.auth.signOut();
};
