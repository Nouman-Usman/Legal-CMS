import { supabase } from './client';

export async function getClients(chamberId: string) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
        *,
        cases:cases!client_id(id, status)
      `)
            .eq('chamber_id', chamberId)
            .eq('role', 'client')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { clients: data, error: null };
    } catch (error) {
        return { clients: null, error };
    }
}

export async function getClientStats(chamberId: string) {
    try {
        const { data: clients, error } = await supabase
            .from('users')
            .select('id, created_at')
            .eq('chamber_id', chamberId)
            .eq('role', 'client')
            .is('deleted_at', null);

        if (error) throw error;

        const total = clients.length;
        const now = new Date();
        const thisMonth = clients.filter(c => {
            const created = new Date(c.created_at);
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length;

        return { stats: { total, thisMonth }, error: null };
    } catch (error) {
        return { stats: null, error };
    }
}

export async function createClient(clientData: {
    email: string;
    full_name: string;
    phone?: string;
    chamber_id: string;
}) {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert({
                ...clientData,
                role: 'client',
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;
        return { client: data, error: null };
    } catch (error) {
        return { client: null, error };
    }
}
