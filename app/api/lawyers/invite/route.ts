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

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('users')
            .select('id, chamber_id')
            .eq('email', email)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Database check error:', checkError);
            throw checkError;
        }

        if (existingUser) {
            // User exists - check if they're already in a chamber
            if (existingUser.chamber_id) {
                return NextResponse.json(
                    { error: 'This lawyer is already associated with a chamber' },
                    { status: 400 }
                );
            }

            // Update existing user to join this chamber
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                    chamber_id,
                    phone,
                    specialization,
                    bar_number,
                    role: 'lawyer',
                    status: 'active'
                })
                .eq('id', existingUser.id);

            if (updateError) {
                console.error('Database update error:', updateError);
                throw updateError;
            }

            // Send invitation email (via password reset) for existing user
            const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/onboarding`;

            // We use the supabaseAdmin client but call resetPasswordForEmail
            // Note: This sends a "Reset Password" email, which acts as the invitation/setup link
            const { error: emailError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl
            });

            if (emailError) {
                console.warn('Failed to send invitation email to existing user:', emailError);
            }

            return NextResponse.json({
                success: true,
                message: 'Existing user added to chamber and invitation email sent',
                user_id: existingUser.id
            });
        }

        // Create a new user and send them an invitation email
        // Direct to onboarding page to handle client-side hash (Implicit Flow)
        const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/onboarding`;

        // Use inviteUserByEmail which sends the email automatically
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
                // Should have been caught by existingUser check, but just in case
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

        // Create or update the user profile
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: authData.user.id,
                email,
                full_name,
                role: 'lawyer',
                chamber_id,
                phone,
                specialization,
                bar_number,
                status: 'pending'
            });

        if (profileError) {
            console.error('Profile create error:', profileError);
            // Don't rollback auth user as the email is already sent
            throw profileError;
        }

        console.log(`User invited successfully: ${email}`);

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

        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('role', 'lawyer')
            .eq('chamber_id', chamber_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ lawyers: data });

    } catch (error: any) {
        console.error('Error fetching lawyers:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch lawyers' },
            { status: 500 }
        );
    }
}
