import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const cookieStore = await cookies()

        // 1. Verify User Session
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll() { },
                },
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // 2. Use Service Role to bypass RLS
        const serviceSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 3. Verify user is a chamber admin
        const { data: membership, error: memberError } = await serviceSupabase
            .from('chamber_members')
            .select('chamber_id, role')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .eq('role', 'admin')
            .maybeSingle()

        if (memberError || !membership) {
            return NextResponse.json({ error: 'Administrator access required' }, { status: 403 })
        }

        const chamberId = membership.chamber_id

        // 4. Get all members of this chamber
        const { data: members, error: membersError } = await serviceSupabase
            .from('chamber_members')
            .select('user_id')
            .eq('chamber_id', chamberId)
            .eq('is_active', true)

        if (membersError) throw membersError
        const memberIds = members.map(m => m.user_id)

        // 5. Fetch ALL threads and filter by chamber participants
        // This is necessary because message_threads doesn't have chamber_id
        const { data: allThreads, error: threadsError } = await serviceSupabase
            .from('message_threads')
            .select('*')
            .order('updated_at', { ascending: false })

        if (threadsError) throw threadsError

        const chamberThreads = allThreads.filter((t: any) =>
            t.participant_ids.some((id: string) => memberIds.includes(id))
        )

        if (chamberThreads.length === 0) {
            return NextResponse.json({ conversations: [] })
        }

        // 6. Get participant profiles
        const allParticipantIds = Array.from(
            new Set(chamberThreads.flatMap((t: any) => t.participant_ids))
        )

        const { data: users, error: usersError } = await serviceSupabase
            .from('users')
            .select('id, full_name, role, avatar_url')
            .in('id', allParticipantIds)

        if (usersError) throw usersError

        const conversations = chamberThreads.map((thread: any) => {
            const participants = users?.filter(u => thread.participant_ids.includes(u.id)) || []
            const client = participants.find(p => p.role === 'client')
            const lawyer = participants.find(p => p.role === 'lawyer')

            return {
                ...thread,
                participants,
                client,
                lawyer
            }
        })

        return NextResponse.json({ conversations })

    } catch (err: any) {
        console.error('Chamber Conversations API Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
