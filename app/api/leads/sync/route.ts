import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { threadId } = await request.json()
        if (!threadId) return NextResponse.json({ error: 'Thread ID required' }, { status: 400 })

        const cookieStore = await cookies()
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
        if (authError || !user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

        const serviceSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Get Thread Info
        const { data: thread, error: threadError } = await serviceSupabase
            .from('message_threads')
            .select('*')
            .eq('id', threadId)
            .single()

        if (threadError || !thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

        // 2. Identify Lawyer and Client
        const participants = thread.participant_ids || []
        if (participants.length !== 2) return NextResponse.json({ message: 'Not a direct message' })

        // Find the other participant
        const lawyerId = participants.find((id: string) => id !== user.id)
        if (!lawyerId) return NextResponse.json({ error: 'Other participant not found' }, { status: 400 })

        // 3. Get Lawyer's Chamber
        const { data: membership, error: memberError } = await serviceSupabase
            .from('chamber_members')
            .select('chamber_id')
            .eq('user_id', lawyerId)
            .eq('is_active', true)
            .maybeSingle()

        if (memberError || !membership) return NextResponse.json({ message: 'No active chamber for lawyer' })

        const chamberId = membership.chamber_id

        // 4. Create Lead if it doesn't exist
        const { data: existingLead } = await serviceSupabase
            .from('leads')
            .select('id, status')
            .eq('chamber_id', chamberId)
            .eq('email', user.email)
            .is('deleted_at', null)
            .maybeSingle()

        if (!existingLead) {
            await serviceSupabase
                .from('leads')
                .insert({
                    chamber_id: chamberId,
                    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Client',
                    email: user.email,
                    source: 'Direct Message',
                    status: 'new',
                    assigned_to: lawyerId,
                    notes: `Lead captured from direct message thread: ${threadId}`
                })
            return NextResponse.json({ success: true, action: 'lead_created' })
        }

        return NextResponse.json({ success: true, action: 'already_exists' })

    } catch (err: any) {
        console.error('Lead Sync API Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
