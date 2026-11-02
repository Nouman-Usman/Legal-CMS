import { supabase } from './client';

/**
 * A chamber's client record (public.chamber_clients). Most clients never get an app
 * login, so they are not public.users rows. `status` is derived: a client with an
 * open case is active.
 */
export interface ChamberClient {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    created_at: string;
    cases: Array<{ id: string; status: string | null }>;
    status: 'active' | 'inactive';
}

const CLOSED = new Set(['closed', 'archived']);

export async function getClients(chamberId: string) {
    try {
        const { data, error } = await supabase
            .from('chamber_clients')
            .select('id, full_name, phone, email, notes, created_at, cases:cases!chamber_client_id(id, status)')
            .eq('chamber_id', chamberId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;
        const clients: ChamberClient[] = (data ?? []).map((c: any) => ({
            ...c,
            cases: c.cases ?? [],
            status: (c.cases ?? []).some((k: any) => !CLOSED.has(k.status)) ? 'active' : 'inactive',
        }));
        return { clients, error: null };
    } catch (error) {
        return { clients: null, error };
    }
}

export async function getClientStats(chamberId: string) {
    try {
        const { data: clients, error } = await supabase
            .from('chamber_clients')
            .select('id, created_at')
            .eq('chamber_id', chamberId)
            .is('deleted_at', null);

        if (error) throw error;

        const total = clients.length;
        const now = new Date();
        const thisMonth = clients.filter((c) => {
            const created = new Date(c.created_at);
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length;

        return { stats: { total, thisMonth }, error: null };
    } catch (error) {
        return { stats: null, error };
    }
}

/** Lightweight list for pickers (case form). */
export async function getClientOptions(chamberId: string) {
    const { data, error } = await supabase
        .from('chamber_clients')
        .select('id, full_name, phone')
        .eq('chamber_id', chamberId)
        .is('deleted_at', null)
        .order('full_name');
    return { options: (data ?? []) as Array<{ id: string; full_name: string; phone: string | null }>, error };
}

export async function createClient(clientData: { full_name: string; phone?: string; email?: string; notes?: string; chamber_id: string }) {
    try {
        const { data, error } = await supabase
            .from('chamber_clients')
            .insert({
                chamber_id: clientData.chamber_id,
                full_name: clientData.full_name.trim(),
                phone: clientData.phone?.trim() || null,
                email: clientData.email?.trim() || null,
                notes: clientData.notes?.trim() || null,
            })
            .select('id, full_name, phone')
            .single();

        if (error) throw error;
        return { client: data as { id: string; full_name: string; phone: string | null }, error: null };
    } catch (error) {
        return { client: null, error };
    }
}
