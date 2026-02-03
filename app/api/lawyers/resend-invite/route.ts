import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing in environment variables');
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        if (!serviceRoleKey) {
            throw new Error('Server configuration error: Missing Service Role Key');
        }

        const body = await request.json();
        const { lawyer_id, email } = body;

        if (!lawyer_id || !email) {
            return NextResponse.json(
                { error: 'Lawyer ID and email are required' },
                { status: 400 }
            );
        }

        // Verify the lawyer exists and belongs to a chamber
        const { data: lawyer, error: lawyerError } = await supabaseAdmin
            .from('users')
            .select('id, email, status, chamber_id, full_name')
            .eq('id', lawyer_id)
            .eq('role', 'lawyer')
            .single();

        if (lawyerError || !lawyer) {
            return NextResponse.json(
                { error: 'Lawyer not found' },
                { status: 404 }
            );
        }

        // Send invitation email (using reset password flow as it acts as magic link)
        const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/onboarding`;

        const { error: emailError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
        });

        if (emailError) {
            console.error('Failed to send invite email:', emailError);
            return NextResponse.json(
                { error: 'Failed to send invitation email' },
                { status: 500 }
            );
        }

        // Update the lawyer's status to pending if it was inactive
        if (lawyer.status === 'inactive') {
            await supabaseAdmin
                .from('users')
                .update({ status: 'pending' })
                .eq('id', lawyer_id);
        }

        console.log(`Resend invite: Email sent to ${email}`);

        return NextResponse.json({
            success: true,
            message: 'Invitation email sent successfully'
        });

    } catch (error: any) {
        console.error('Error resending invitation:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to resend invitation' },
            { status: 500 }
        );
    }
}
