import { supabase } from './client';

export async function getChamberDetails(chamberId: string) {
    try {
        const { data, error } = await supabase
            .from('chambers')
            .select('*, chamber_settings(*)')
            .eq('id', chamberId)
            .single();

        if (error) throw error;
        return { chamber: data, error: null };
    } catch (error) {
        console.error('Error fetching chamber details:', error);
        return { chamber: null, error };
    }
}

export async function updateChamberDetails(chamberId: string, updates: any) {
    try {
        const { data, error } = await supabase
            .from('chambers')
            .update(updates)
            .eq('id', chamberId)
            .select()
            .single();

        if (error) throw error;
        return { chamber: data, error: null };
    } catch (error) {
        return { chamber: null, error };
    }
}

export async function updateChamberSettings(chamberId: string, settings: any) {
    try {
        const { data, error } = await supabase
            .from('chamber_settings')
            .upsert({ chamber_id: chamberId, ...settings })
            .select()
            .single();

        if (error) throw error;
        return { settings: data, error: null };
    } catch (error) {
        return { settings: null, error };
    }
}
