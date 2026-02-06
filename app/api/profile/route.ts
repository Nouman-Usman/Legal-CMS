import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/profile - fetch current user's profile
export async function GET() {
  try {
    const cookieStore = await cookies()

    // Create authenticated client to get user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {}, // Read-only for GET
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Use service role to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch user profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ profile: null, exists: false })
    }

    // Fetch lawyer profile
    const { data: lawyerProfile } = await serviceSupabase
      .from('lawyers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Fetch client profile
    const { data: clientProfile } = await serviceSupabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Fetch chamber memberships
    const { data: chambers } = await serviceSupabase
      .from('chamber_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    return NextResponse.json({
      profile: {
        ...profile,
        lawyerProfile: lawyerProfile || undefined,
        clientProfile: clientProfile || undefined,
        chambers: chambers || [],
      },
      exists: true,
    })
  } catch (err: any) {
    console.error('Profile API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/profile - create or update profile
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    // Use service role to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const validRoles = ['chamber_admin', 'lawyer', 'client']
    const role = validRoles.includes(body.role || user.user_metadata?.role)
      ? (body.role || user.user_metadata?.role)
      : 'client'

    const { data: profile, error: upsertError } = await serviceSupabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: body.full_name || user.user_metadata?.full_name || '',
        role: role,
      }, { onConflict: 'id' })
      .select()
      .maybeSingle()

    if (upsertError) {
      console.error('Profile upsert error:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ profile, exists: true })
  } catch (err: any) {
    console.error('Profile create API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
