import { supabase } from './client';

export async function getClients(chamberId: string) {
    try {
        // Get all users in chamber with client role via chamber_members
        const { data, error } = await supabase
            .from('chamber_members')
            .select(`
        users:user_id(id, email, full_name, phone, avatar_url, role),
        id,
        role,
        is_active
      `)
            .eq('chamber_id', chamberId)
            .order('joined_at', { ascending: false });

        if (error) throw error;
        
        // Filter for clients only and structure response
        const clients = data
            .filter((member: any) => member.users?.role === 'client' && member.is_active)
            .map((member: any) => ({
                ...member.users,
                id: member.users.id
            }));
        
        return { clients, error: null };
    } catch (error) {
        return { clients: null, error };
    }
}

export async function getClientStats(chamberId: string) {
    try {
        const { data: members, error } = await supabase
            .from('chamber_members')
            .select(`users:user_id(id, role, created_at)`)
            .eq('chamber_id', chamberId)
            .eq('is_active', true);

        if (error) throw error;

        const clients = members
            .filter((m: any) => m.users?.role === 'client')
            .map((m: any) => m.users);

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
        // Create user with client role
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
                email: clientData.email,
                full_name: clientData.full_name,
                phone: clientData.phone,
                role: 'client'
            })
            .select()
            .single();

        if (userError) throw userError;

        // Create chamber membership
        const { data: membership, error: memberError } = await supabase
            .from('chamber_members')
            .insert({
                chamber_id: clientData.chamber_id,
                user_id: user.id,
                role: 'member',
                is_active: true
            })
            .select()
            .single();

        if (memberError) throw memberError;

        return { client: user, error: null };
    } catch (error) {
        return { client: null, error };
    }
}
