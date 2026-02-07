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

// DELETE - Remove lawyer from chamber
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!serviceRoleKey) {
            throw new Error('Server configuration error: Missing Service Role Key');
        }

        const { id: lawyerId } = await params;

        if (!lawyerId) {
            return NextResponse.json(
                { error: 'Lawyer ID is required' },
                { status: 400 }
            );
        }

        // Verify the lawyer exists
        const { data: lawyer, error: checkError } = await supabaseAdmin
            .from('users')
            .select('id, role')
            .eq('id', lawyerId)
            .single();

        if (checkError || !lawyer) {
            return NextResponse.json(
                { error: 'Lawyer not found' },
                { status: 404 }
            );
        }

        // Get chamber_id from query params if available
        const { searchParams } = new URL(request.url);
        const chamberId = searchParams.get('chamber_id');

        let memberQuery = supabaseAdmin
            .from('chamber_members')
            .delete()
            .eq('user_id', lawyerId);

        if (chamberId) {
            memberQuery = memberQuery.eq('chamber_id', chamberId);
        }

        const { error: deleteError } = await memberQuery;

        if (deleteError) {
             console.error('Error removing lawyer from chamber:', deleteError);
             throw deleteError;
        }

        return NextResponse.json({
            success: true,
            message: 'Lawyer removed from chamber successfully'
        });

    } catch (error: any) {
        console.error('Error in DELETE /api/lawyers/[id]:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to remove lawyer' },
            { status: 500 }
        );
    }
}

// PATCH - Update lawyer status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!serviceRoleKey) {
            throw new Error('Server configuration error: Missing Service Role Key');
        }

        const { id: lawyerId } = await params;
        const body = await request.json();
        const { status, chamber_id } = body;

        if (!lawyerId) {
            return NextResponse.json(
                { error: 'Lawyer ID is required' },
                { status: 400 }
            );
        }

        if (!status || !['active', 'inactive', 'pending'].includes(status)) {
            return NextResponse.json(
                { error: 'Valid status is required (active, inactive, pending)' },
                { status: 400 }
            );
        }

        // Map status string to is_active boolean
        const isActive = status === 'active';

        // Update chamber member status
        let updateQuery = supabaseAdmin
            .from('chamber_members')
            .update({ is_active: isActive })
            .eq('user_id', lawyerId);

        if (chamber_id) {
            updateQuery = updateQuery.eq('chamber_id', chamber_id);
        }

        const { error: updateError } = await updateQuery;

        if (updateError) {
            console.error('Error updating lawyer status:', updateError);
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            message: `Lawyer status updated to ${status}`
        });

    } catch (error: any) {
        console.error('Error in PATCH /api/lawyers/[id]:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update lawyer status' },
            { status: 500 }
        );
    }
}
