import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let admin: SupabaseClient | null = null;

/** Service-role client: bypasses RLS, so every route using it must authorise the caller first. */
export function supabaseAdmin() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error('Server configuration error: missing SUPABASE_SERVICE_ROLE_KEY');
    if (!admin) {
        admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { autoRefreshToken: false, persistSession: false } });
    }
    return admin;
}

export class HttpError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
    }
}

/**
 * The signed-in caller, who must be an active admin of a chamber. The chamber comes
 * from their membership, never from the request body.
 */
export async function requireChamberAdmin() {
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: () => {},
        },
    });
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new HttpError(401, 'Sign in required');

    const { data: membership } = await supabaseAdmin()
        .from('chamber_members')
        .select('chamber_id, chambers:chamber_id(name)')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .neq('is_active', false)
        .limit(1)
        .maybeSingle();
    if (!membership) throw new HttpError(403, 'Only a chamber admin can manage lawyers');

    return {
        adminId: user.id,
        chamberId: membership.chamber_id as string,
        chamberName: ((membership as any).chambers?.name as string) || 'Your chamber',
    };
}

/** The lawyer or munshi must be a member (any state) of the admin's chamber. */
/** Accounts an admin invites and manages: lawyers and munshis (clerks). */
export const TEAM_ROLES = ['lawyer', 'munshi'] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export async function requireMemberLawyer(chamberId: string, lawyerId: string) {
    const { data } = await supabaseAdmin()
        .from('chamber_members')
        .select('id, is_active, users:user_id!inner(id, email, full_name, role, onboarding_completed)')
        .eq('chamber_id', chamberId)
        .eq('user_id', lawyerId)
        .maybeSingle();
    const user = (data as any)?.users;
    if (!data || !TEAM_ROLES.includes(user?.role)) throw new HttpError(404, 'Team member not found in your chamber');
    return { membershipId: data.id as string, isActive: data.is_active !== false, user };
}

export function errorResponse(error: unknown) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof HttpError ? error.message : 'Something went wrong';
    if (!(error instanceof HttpError)) console.error(error);
    return Response.json({ error: message }, { status });
}

/** Where invite links land: the onboarding page sets the password and profile. */
export function onboardingUrl() {
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/onboarding`;
}
