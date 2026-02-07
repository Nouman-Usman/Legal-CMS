import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check for service key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing in environment variables');
}

// Use service role key for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey || '', // Fallback to empty string to allow build, but will fail if used
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Helper to generate a strong random password
function generatePassword(length = 16) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

export async function POST(request: NextRequest) {
    try {
        if (!serviceRoleKey) {
            throw new Error('Server configuration error: Missing Service Role Key');
        }

        const body = await request.json();
        const { email, full_name, phone, specialization, bar_number, chamber_id } = body;

        if (!email || !full_name) {
            return NextResponse.json(
                { error: 'Email and full name are required' },
                { status: 400 }
            );
        }

        if (!chamber_id) {
            return NextResponse.json(
                { error: 'Chamber ID is required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('users')
            .select('id, role')
            .eq('email', email)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Database check error:', checkError);
            throw checkError;
        }

        if (existingUser) {
            // Check if already a member of this chamber
            const { data: existingMembership } = await supabaseAdmin
                .from('chamber_members')
                .select('id')
                .eq('user_id', existingUser.id)
                .eq('chamber_id', chamber_id)
                .single();

            if (existingMembership) {
                return NextResponse.json(
                    { error: 'This user is already a member of this chamber' },
                    { status: 400 }
                );
            }

            // Add existing user to chamber
            const { error: memberError } = await supabaseAdmin
                .from('chamber_members')
                .insert({
                    user_id: existingUser.id,
                    chamber_id,
                    role: 'member',
                    is_active: true
                });

            if (memberError) {
                console.error('Chamber member insert error:', memberError);
                throw memberError;
            }

            // Create or update lawyer profile if needed
            if (existingUser.role === 'lawyer' && (specialization || bar_number)) {
                await supabaseAdmin
                    .from('lawyers')
                    .upsert({
                        user_id: existingUser.id,
                        specialization,
                        bar_number
                    }, { onConflict: 'user_id' });
            }

            // Send invitation email for existing user
            const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/onboarding`;
            await supabaseAdmin.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl
            });

            return NextResponse.json({
                success: true,
                message: 'Existing user added to chamber and invitation email sent',
                user_id: existingUser.id
            });
        }

        // Create a new user and send invitation email
        const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`;

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            email,
            {
                data: {
                    full_name,
                    role: 'lawyer'
                },
                redirectTo: redirectUrl
            }
        );

        if (authError) {
            console.error('Auth invite error:', authError);
            if (authError.message.includes('already been registered')) {
                return NextResponse.json(
                    { error: 'An account with this email already exists.' },
                    { status: 400 }
                );
            }
            throw authError;
        }

        if (!authData.user) {
            throw new Error('Failed to create user');
        }

        // Create user profile in users table
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: authData.user.id,
                email,
                full_name,
                role: 'lawyer',
                phone
            });

        if (profileError) {
            console.error('Profile create error:', profileError);
            throw profileError;
        }

        // Create lawyer profile
        const { error: lawyerError } = await supabaseAdmin
            .from('lawyers')
            .insert({
                user_id: authData.user.id,
                specialization,
                bar_number
            });

        if (lawyerError) {
            console.error('Lawyer profile create error:', lawyerError);
            // Continue anyway, not critical
        }

        // Create chamber membership
        const { error: memberError } = await supabaseAdmin
            .from('chamber_members')
            .insert({
                user_id: authData.user.id,
                chamber_id,
                role: 'member',
                is_active: true
            });

        if (memberError) {
            console.error('Chamber member create error:', memberError);
            throw memberError;
        }

        console.log(`Lawyer invited successfully: ${email}`);

        return NextResponse.json({
            success: true,
            message: 'Lawyer invited and email sent successfully.',
            user_id: authData.user.id
        });

    } catch (error: any) {
        console.error('Error inviting lawyer (Full details):', error);
        return NextResponse.json(
            { error: error.message || 'Failed to invite lawyer' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const chamber_id = searchParams.get('chamber_id');

        if (!chamber_id) {
            return NextResponse.json(
                { error: 'Chamber ID is required' },
                { status: 400 }
            );
        }

        // Query chamber_members joined with users and lawyers tables
        const { data, error } = await supabaseAdmin
            .from('chamber_members')
            .select(`
                id,
                user_id,
                role,
                is_active,
                joined_at,
                users:user_id (
                    id,
                    email,
                    full_name,
                    phone,
                    role,
                    created_at,
                    lawyer_profile:lawyers (
                        specialization,
                        bar_number
                    )
                )
            `)
            .eq('chamber_id', chamber_id)
            .order('joined_at', { ascending: false });

        if (error) throw error;

        // Transform data to match expected format
        const lawyers = (data || [])
            .filter((member: any) => member.users?.role === 'lawyer')
            .map((member: any) => ({
                id: member.users.id,
                member_id: member.id,
                email: member.users.email,
                full_name: member.users.full_name || 'Unknown',
                phone: member.users.phone,
                specialization: member.users.lawyer_profile?.[0]?.specialization,
                bar_number: member.users.lawyer_profile?.[0]?.bar_number,
                status: member.is_active ? 'active' : 'inactive',
                is_active: member.is_active,
                created_at: member.users.created_at,
            }));

        return NextResponse.json({ lawyers });

    } catch (error: any) {
        console.error('Error fetching lawyers:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch lawyers' },
            { status: 500 }
        );
    }
}
