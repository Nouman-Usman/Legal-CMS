import { supabase } from './client';

export type AuditLogEntry = {
    id: string;
    user_id: string;
    action: string;
    entity: string | null;
    entity_id: string | null;
    metadata: any;
    ip_address: string | null;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
        role: string;
    };
};

export async function logAction(
    action: string,
    entity: string,
    entityId: string,
    metadata: any = {}
) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('audit_logs').insert({
            user_id: user.id,
            action,
            entity,
            entity_id: entityId,
            metadata,
            ip_address: 'unknown' // Client-side, usually IP is captured by edge function or middleware, but we can try basic capture if needed or rely on server headers if we were server-side.
        });
    } catch (error) {
        console.error('Failed to log audit action:', error);
    }
}

export async function getChamberAuditLogs(chamberId: string, limit = 100) {
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select(`
            *,
            user:users!audit_logs_user_id_fkey(full_name, email, role)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching audit logs:', error);
        return { logs: [], error };
    }

    // Since RLS now filters logs based on chamber membership, we can return the data directly.
    return { logs: logs || [], error: null };
}
