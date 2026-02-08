import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies()

        // 1. Verify Authentication
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll() { },
                },
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // 2. Setup Admin Access
        const serviceSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 3. Get User's Admin Chambers
        // We only want to return leads for chambers where this user is an admin
        const { data: memberships, error: memberError } = await serviceSupabase
            .from('chamber_members')
            .select('chamber_id, role')
            .eq('user_id', user.id)
            .eq('is_active', true)

        if (memberError) throw memberError

        // Filter for admin roles only (assuming 'admin' is the role key for chamber admins)
        // Adjust 'admin' string if your role system uses different keys (e.g. 'owner', 'chamber_admin')
        const adminChamberIds = memberships
            .filter((m: any) => m.role === 'admin' || m.role === 'owner')
            .map((m: any) => m.chamber_id)

        if (adminChamberIds.length === 0) {
            return NextResponse.json({ leads: [] })
        }

        // 4. Fetch Leads for these chambers
        const { data: leads, error: leadsError } = await serviceSupabase
            .from('leads')
            .select(`
                *,
                assignee:assigned_to(full_name, avatar_url)
            `)
            .in('chamber_id', adminChamberIds)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

        if (leadsError) throw leadsError

        return NextResponse.json({ leads })

    } catch (err: any) {
        console.error('Leads API Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
