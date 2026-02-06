import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()

    // Verify the user is authenticated
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

    const body = await request.json()

    // Use service role to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create address record if address fields are provided
    let addressId: string | null = null
    if (body.street_address || body.city || body.country) {
      const { data: addressData, error: addressError } = await serviceSupabase
        .from('addresses')
        .insert({
          street_address: body.street_address || '',
          city: body.city || '',
          country: body.country || '',
        })
        .select()
        .single()

      if (addressError) {
        console.error('Address creation error:', addressError)
        return NextResponse.json({ error: addressError.message }, { status: 500 })
      }
      addressId = addressData.id
    }

    // Create the chamber
    const { data: chamberData, error: chamberError } = await serviceSupabase
      .from('chambers')
      .insert({
        name: body.name,
        phone: body.phone || null,
        email: body.email || user.email,
        website: body.website || null,
        description: body.description || null,
        logo_url: body.logo_url || null,
        admin_id: user.id,
        address_id: addressId,
      })
      .select()
      .single()

    if (chamberError) {
      console.error('Chamber creation error:', chamberError)
      return NextResponse.json({ error: chamberError.message }, { status: 500 })
    }

    // Update user's onboarding status
    const { error: userError } = await serviceSupabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', user.id)

    if (userError) {
      console.error('User update error:', userError)
      // Don't fail the whole operation for this
    }

    // Create chamber membership
    const { error: membershipError } = await serviceSupabase
      .from('chamber_members')
      .insert({
        chamber_id: chamberData.id,
        user_id: user.id,
        role: 'admin',
        is_active: true,
      })

    if (membershipError) {
      console.error('Membership creation error:', membershipError)
      return NextResponse.json({ error: membershipError.message }, { status: 500 })
    }

    return NextResponse.json({ chamber: chamberData, success: true })
  } catch (err: any) {
    console.error('Chamber API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
