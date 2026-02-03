import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey || ''
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        // 1. Check Auth User
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = authUsers?.users.find(u => u.email === email);

        if (!authUser) {
            return NextResponse.json({ status: 'User not found in Auth' });
        }

        // 2. Check Public Profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

        return NextResponse.json({
            auth_user: {
                id: authUser.id,
                email: authUser.email,
                metadata: authUser.user_metadata,
                confirmed_at: authUser.email_confirmed_at
            },
            public_profile: profile,
            profile_error: profileError
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
