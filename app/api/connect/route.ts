import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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

        const { lawyerId, chamberId, message } = await request.json()

        if (!lawyerId || !chamberId || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 2. Use Service Role to bypass RLS
        const serviceSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // A. Create or Update Lead (Only if no active lead/client relationship exists for this client in this chamber)
        const { data: existingLead } = await serviceSupabase
            .from('leads')
            .select('id, status')
            .eq('chamber_id', chamberId)
            .eq('email', user.email)
            .is('deleted_at', null)
            .in('status', ['new', 'contacted', 'consultation', 'converted'])
            .maybeSingle()

        if (!existingLead) {
            const { error: leadError } = await serviceSupabase
                .from('leads')
                .insert({
                    chamber_id: chamberId,
                    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New Client',
                    email: user.email,
                    source: 'Direct Message',
                    status: 'new',
                    assigned_to: lawyerId,
                    notes: `Initial message: ${message.substring(0, 500)}`
                })

            if (leadError) console.warn('Lead creation failed:', leadError)
        } else if (existingLead.status === 'lost') {
            // Re-activate a lost lead if they reach out again
            await serviceSupabase
                .from('leads')
                .update({
                    status: 'new',
                    updated_at: new Date().toISOString(),
                    notes: `Lead reached out again: ${message.substring(0, 500)}`
                })
                .eq('id', existingLead.id)
        } else {
            console.log(`Lead already exists with status: ${existingLead.status}, skipping creation.`)
        }

        // B. Get/Create Thread
        // We search for a thread with exactly these two participants
        const participantIds = [user.id, lawyerId].sort()

        let { data: thread, error: threadError } = await serviceSupabase
            .from('message_threads')
            .select('*')
            .contains('participant_ids', participantIds)
            .is('case_id', null)
            .limit(1)
            .maybeSingle()

        if (!thread) {
            const { data: newThread, error: createThreadError } = await serviceSupabase
                .from('message_threads')
                .insert({
                    subject: 'Direct Message',
                    participant_ids: participantIds,
                    created_by: user.id
                })
                .select()
                .single()

            if (createThreadError) throw createThreadError
            thread = newThread
        }

        // C. Insert Message
        const { error: msgError } = await serviceSupabase
            .from('messages')
            .insert({
                thread_id: thread.id,
                sender_id: user.id,
                content: message
            })

        if (msgError) throw msgError

        // D. Create Notification
        const { error: notifError } = await serviceSupabase
            .from('notifications')
            .insert({
                user_id: lawyerId,
                title: 'New Connection Request',
                message: `${user.user_metadata?.full_name || 'A client'} wants to connect with you.`,
                data: { threadId: thread.id, type: 'connection_request' }
            })

        if (notifError) console.warn('Notification failed:', notifError)

        // E. Update thread timestamp
        await serviceSupabase
            .from('message_threads')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', thread.id)

        return NextResponse.json({ success: true, threadId: thread.id })

    } catch (err: any) {
        console.error('Connection API Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
