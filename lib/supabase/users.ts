import { supabase } from './client';

export interface UserProfileUpdate {
    full_name?: string;
    phone?: string;
    specialization?: string;
    bar_number?: string;
    lawyer_profile?: any;
    avatar_url?: string;
}

export async function updateUserProfile(userId: string, updates: UserProfileUpdate) {
    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating user profile:', error);
        return { data: null, error };
    }
}

export async function getUserProfile(userId: string) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return { data: null, error };
    }
}
