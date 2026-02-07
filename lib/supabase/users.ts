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
        const { lawyer_profile, specialization, bar_number, ...userUpdates } = updates;

        // 1. Update basic user info
        const { data: userData, error: userError } = await supabase
            .from('users')
            .update(userUpdates)
            .eq('id', userId)
            .select()
            .single();

        if (userError) throw userError;

        // 2. If it's a lawyer, update/upsert specialized record
        // We check for specialization/bar_number or explicit lawyer_profile object
        if (specialization !== undefined || bar_number !== undefined || lawyer_profile !== undefined) {
            const lawyerUpdates: any = {
                user_id: userId,
                updated_at: new Date().toISOString()
            };

            if (specialization !== undefined) lawyerUpdates.specialization = specialization;
            if (bar_number !== undefined) lawyerUpdates.bar_number = bar_number;

            if (lawyer_profile) {
                if (lawyer_profile.bio !== undefined) lawyerUpdates.bio = lawyer_profile.bio;
                if (lawyer_profile.experience_years !== undefined) lawyerUpdates.experience_years = lawyer_profile.experience_years;
            }

            const { error: lawyerError } = await supabase
                .from('lawyers')
                .upsert(lawyerUpdates, { onConflict: 'user_id' });

            if (lawyerError) throw lawyerError;
        }

        return { data: userData, error: null };
    } catch (error) {
        console.error('Error updating user profile:', error);
        return { data: null, error };
    }
}

export async function getUserProfile(userId: string) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                lawyer_profile:lawyers(*)
            `)
            .eq('id', userId)
            .single();

        if (error) throw error;

        // Flatten lawyer_profile if it exists (it comes as an array from the join)
        if (data && data.lawyer_profile && Array.isArray(data.lawyer_profile)) {
            const profile = data.lawyer_profile[0];
            data.lawyer_profile = profile;
            // For backward compatibility/simplicity, also map specialization/bar_number to top level
            if (profile) {
                data.specialization = profile.specialization;
                data.bar_number = profile.bar_number;
            }
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return { data: null, error };
    }
}
