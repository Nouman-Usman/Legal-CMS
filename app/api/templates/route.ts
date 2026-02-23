import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'

async function getAuthenticatedUser() {
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
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
}

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// GET /api/templates or GET /api/templates?id=xxx
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

        const db = getServiceClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        // Get user's chamber
        const { data: membership } = await db
            .from('chamber_members')
            .select('chamber_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No chamber found' }, { status: 404 })
        }

        if (id) {
            // Fetch single template
            const { data: template, error } = await db
                .from('document_templates')
                .select('*')
                .eq('id', id)
                .eq('chamber_id', membership.chamber_id)
                .single()

            if (error || !template) {
                return NextResponse.json({ error: 'Template not found' }, { status: 404 })
            }
            return NextResponse.json({ template })
        }

        // Fetch all templates for chamber
        const { data: templates, error } = await db
            .from('document_templates')
            .select('*')
            .eq('chamber_id', membership.chamber_id)
            .order('updated_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ templates: templates || [] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST /api/templates — Create new template
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

        const db = getServiceClient()
        const body = await request.json()

        const { data: membership } = await db
            .from('chamber_members')
            .select('chamber_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No chamber found' }, { status: 404 })
        }

        const { data: template, error } = await db
            .from('document_templates')
            .insert({
                name: body.name || 'Untitled Template',
                description: body.description || '',
                fields: body.fields || [],
                roles: body.roles || [],
                chamber_id: membership.chamber_id,
                created_by: user.id,
                status: body.status || 'draft',
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ template, success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PUT /api/templates — Update existing template
export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

        const db = getServiceClient()
        const body = await request.json()

        if (!body.id) {
            return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
        }

        const { data: membership } = await db
            .from('chamber_members')
            .select('chamber_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No chamber found' }, { status: 404 })
        }

        const { data: template, error } = await db
            .from('document_templates')
            .update({
                name: body.name,
                description: body.description,
                fields: body.fields,
                roles: body.roles,
                status: body.status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', body.id)
            .eq('chamber_id', membership.chamber_id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ template, success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE /api/templates?id=xxx
export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

        const db = getServiceClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
        }

        const { data: membership } = await db
            .from('chamber_members')
            .select('chamber_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No chamber found' }, { status: 404 })
        }

        const { error } = await db
            .from('document_templates')
            .delete()
            .eq('id', id)
            .eq('chamber_id', membership.chamber_id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
