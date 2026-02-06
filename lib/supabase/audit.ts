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
    const { data, error } = await supabase
        .from('audit_logs')
        .select(`
            *,
            user:users!audit_logs_user_id_fkey(full_name, email, role, chamber_id)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    // We need to filter by chamber_id on the joined user because audit_logs doesn't have chamber_id directly
    // Ideally, RLS handles this, but for extra safety or client-side filtering:

    // Note: If we rely on RLS, we just select. 
    // BUT, the foreign key relationship in schema might be named differently.
    // Schema: users public_users? @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
    // Relation name is default.

    if (error) return { logs: [], error };

    // Filter specifically for users in this chamber
    // If RLS is set up correctly for 'chamber_admin' to see logs of users in THEIR chamber, this is implicit.
    // However, without RLS on join, we get all. 
    // The current query might return null for user if they don't match or permissions fail.

    const filtered = data?.filter((log: any) => log.user?.chamber_id === chamberId);

    return { logs: filtered || [], error: null };
}
