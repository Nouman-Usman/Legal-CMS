import { supabase } from './client';

export type TimeEntry = {
    id: string;
    case_id?: string;
    user_id: string;
    description: string;
    minutes: number;
    billable: boolean;
    rate: number;
    created_at: string;
    case?: {
        title: string;
        case_number: string;
    };
};

export const createTimeEntry = async (entry: Partial<TimeEntry>) => {
    const { data, error } = await supabase
        .from('time_entries')
        .insert(entry)
        .select()
        .single();

    return { data, error };
};

export const getTimeEntries = async (userId: string, chamberId: string) => {
    // Fetch entries for the user, plus any entries from the chamber if admin
    // For now, simpler: fetch entries where user is owner OR (admin & same chamber)
    // But RLS handles security. We just need to filter by helpful params.

    const { data, error } = await supabase
        .from('time_entries')
        .select(`
      *,
      case:cases (
        title,
        case_number,
        chamber_id
      )
    `)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    return { entries: data, error };
};

export const getChamberTimeEntries = async (chamberId: string) => {
    const { data, error } = await supabase
        .from('time_entries')
        .select(`
      *,
      case:cases!inner (
        title,
        case_number,
        chamber_id
      ),
      user:users (
        full_name,
        email
      )
    `)
        .eq('case.chamber_id', chamberId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    return { entries: data, error };
};

export const updateTimeEntry = async (id: string, updates: Partial<TimeEntry>) => {
    const { data, error } = await supabase
        .from('time_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    return { data, error };
};

export const deleteTimeEntry = async (id: string) => {
    const { error } = await supabase
        .from('time_entries')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    return { error };
};
