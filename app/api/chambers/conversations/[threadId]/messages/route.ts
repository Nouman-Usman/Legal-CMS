import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ threadId: string }> }
) {
    try {
        const { threadId } = await params;
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

        // 3. Verify user is a chamber admin and has access to this thread's chamber
        const { data: membership, error: memberError } = await serviceSupabase
            .from('chamber_members')
            .select('chamber_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .eq('role', 'admin')
            .maybeSingle()

        if (memberError || !membership) {
            return NextResponse.json({ error: 'Administrator access required' }, { status: 403 })
        }

        const chamberId = membership.chamber_id

        // 4. Verify thread belongs to this chamber
        // We do this by checking if ANY participant of the thread is a member of the admin's chamber
        const { data: thread, error: threadError } = await serviceSupabase
            .from('message_threads')
            .select('participant_ids')
            .eq('id', threadId)
            .single()

        if (threadError || !thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
        }

        const { data: chamberMembers, error: membersError } = await serviceSupabase
            .from('chamber_members')
            .select('user_id')
            .eq('chamber_id', chamberId)
            .in('user_id', thread.participant_ids)

        if (membersError || !chamberMembers || chamberMembers.length === 0) {
            return NextResponse.json({ error: 'Access denied to this communication node' }, { status: 403 })
        }

        // 5. Fetch messages and reads
        const [messagesResponse, readsResponse] = await Promise.all([
            serviceSupabase
                .from('messages')
                .select('*')
                .eq('thread_id', threadId)
                .order('created_at', { ascending: false }),
            serviceSupabase
                .from('thread_reads')
                .select('*')
                .eq('thread_id', threadId)
        ])

        return NextResponse.json({
            messages: messagesResponse.data,
            reads: readsResponse.data || []
        })

    } catch (err: any) {
        console.error('Chamber Thread Messages API Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
