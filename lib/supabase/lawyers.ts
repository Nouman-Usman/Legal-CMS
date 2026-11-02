import { supabase } from './client';

/** A lawyer in the chamber roster: chamber_members + users (name, contact) + lawyers (bar, specialization). */
export interface RosterLawyer {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    specialization?: string;
    bar_number?: string;
    status: 'active' | 'inactive' | 'pending';
    created_at: string;
    role: 'lawyer' | 'munshi';
}

export async function getChamberRoster(chamberId: string) {
    const { data, error } = await supabase
        .from('chamber_members')
        .select('is_active, joined_at, users:user_id!inner(id, email, full_name, phone, role, onboarding_completed, created_at, deleted_at)')
        .eq('chamber_id', chamberId)
        .in('users.role', ['lawyer', 'munshi']);
    if (error) return { lawyers: [] as RosterLawyer[], error };

    const ids = (data ?? []).map((m: any) => m.users.id);
    const { data: profiles } = ids.length
        ? await supabase.from('lawyers').select('user_id, bar_number, specialization').in('user_id', ids)
        : { data: [] as any[] };
    const byUser = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

    const lawyers: RosterLawyer[] = (data ?? [])
        .filter((m: any) => !m.users.deleted_at)
        .map((m: any): RosterLawyer => {
            const u = m.users;
            const p = byUser.get(u.id);
            return {
                id: u.id,
                email: u.email,
                full_name: u.full_name,
                phone: u.phone ?? undefined,
                specialization: p?.specialization ?? undefined,
                bar_number: p?.bar_number ?? undefined,
                status: m.is_active === false ? 'inactive' : u.onboarding_completed ? 'active' : 'pending',
                created_at: m.joined_at ?? u.created_at,
                role: u.role === 'munshi' ? 'munshi' : 'lawyer',
            };
        })
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { lawyers, error: null };
}

/** Name and phone live on users; bar number and specialization on the lawyers profile row. */
export async function updateLawyerProfile(lawyer: Pick<RosterLawyer, 'id' | 'full_name' | 'phone' | 'bar_number' | 'specialization'>) {
    const { error: userError } = await supabase
        .from('users')
        .update({ full_name: lawyer.full_name, phone: lawyer.phone || null })
        .eq('id', lawyer.id);
    if (userError) return { error: userError };

    const profile = { bar_number: lawyer.bar_number || null, specialization: lawyer.specialization || null };
    const { data: updated, error: updateError } = await supabase.from('lawyers').update(profile).eq('user_id', lawyer.id).select('id');
    if (updateError) return { error: updateError };
    if (!updated?.length) {
        const { error: insertError } = await supabase.from('lawyers').insert({ user_id: lawyer.id, ...profile });
        if (insertError) return { error: insertError };
    }
    return { error: null };
}

/** A lawyer completing their own onboarding: contact on users, credentials on their lawyers row. */
export async function saveOwnLawyerProfile(
    userId: string,
    profile: { licenseNumber: string; practiceAreas: string[]; tagline?: string; bio?: string; yearsOfExperience?: number; phone?: string },
) {
    const { error: userError } = await supabase
        .from('users')
        .update({ phone: profile.phone || null, onboarding_completed: true })
        .eq('id', userId);
    if (userError) return { error: userError };

    // There is no tagline column: keep it as the first paragraph of the bio.
    const row = {
        bar_number: profile.licenseNumber || null,
        specialization: profile.practiceAreas.join(', ') || null,
        bio: [profile.tagline, profile.bio].map((t) => t?.trim()).filter(Boolean).join('\n\n') || null,
        experience_years: profile.yearsOfExperience ?? null,
    };
    const { data: updated, error: updateError } = await supabase.from('lawyers').update(row).eq('user_id', userId).select('id');
    if (updateError) return { error: updateError };
    if (!updated?.length) {
        const { error: insertError } = await supabase.from('lawyers').insert({ user_id: userId, ...row });
        if (insertError) return { error: insertError };
    }
    return { error: null };
}
