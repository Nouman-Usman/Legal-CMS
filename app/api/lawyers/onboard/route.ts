import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            user_id, 
            bar_number, 
            specialization, 
            bio, 
            experience_years, 
            phone, 
            location, 
            tagline,
            avatar_url 
        } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        if (!bar_number) {
            return NextResponse.json(
                { error: 'Bar/License number is required' },
                { status: 400 }
            );
        }

        // Update user profile
        const userUpdate: Record<string, any> = {
            phone: phone || null,
            onboarding_completed: true,
        };

        if (avatar_url) {
            userUpdate.avatar_url = avatar_url;
        }

        const { error: userError } = await supabaseAdmin
            .from('users')
            .update(userUpdate)
            .eq('id', user_id);

        if (userError) {
            console.error('Error updating user:', userError);
            throw userError;
        }

        // Upsert lawyer profile
        const { error: lawyerError } = await supabaseAdmin
            .from('lawyers')
            .upsert({
                user_id,
                bar_number,
                specialization,
                bio: bio || null,
                experience_years: experience_years || 0,
            }, { onConflict: 'user_id' });

        if (lawyerError) {
            console.error('Error updating lawyer profile:', lawyerError);
            throw lawyerError;
        }

        // Store additional profile data in user metadata or a separate field
        // For now, we'll store tagline and location in the lawyers table as part of bio or a JSON field
        // Or we can add these columns to lawyers table if they don't exist

        console.log(`Lawyer onboarding completed for user: ${user_id}`);

        return NextResponse.json({
            success: true,
            message: 'Lawyer profile saved successfully',
        });

    } catch (error: any) {
        console.error('Error in lawyer onboarding:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save lawyer profile' },
            { status: 500 }
        );
    }
}
