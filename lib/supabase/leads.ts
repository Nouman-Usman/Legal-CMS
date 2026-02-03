import { supabase } from './client';

export type Lead = {
    id: string;
    chamber_id: string;
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    status: 'new' | 'contacted' | 'consultation' | 'converted' | 'lost';
    notes?: string;
    assigned_to?: string;
    created_at: string;
    updated_at: string;
};

export const getLeads = async (chamber_id: string) => {
    const { data, error } = await supabase
        .from('leads')
        .select(`
      *,
      assignee:assigned_to(full_name)
    `)
        .eq('chamber_id', chamber_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    return { leads: data, error };
};

export const createLead = async (lead: Partial<Lead>) => {
    const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();

    return { lead: data, error };
};

export const updateLeadStatus = async (id: string, status: Lead['status']) => {
    const { data, error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    return { lead: data, error };
};

export const deleteLead = async (id: string) => {
    // Soft delete
    const { error } = await supabase
        .from('leads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    return { error };
};
