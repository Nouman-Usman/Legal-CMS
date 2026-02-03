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
    { params }: { params: { id: string } }
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

        // Verify the lawyer exists and is actually a lawyer
        const { data: lawyer, error: checkError } = await supabaseAdmin
            .from('users')
            .select('id, role, chamber_id')
            .eq('id', lawyerId)
            .single();

        if (checkError || !lawyer) {
            return NextResponse.json(
                { error: 'Lawyer not found' },
                { status: 404 }
            );
        }

        if (lawyer.role !== 'lawyer') {
            return NextResponse.json(
                { error: 'User is not a lawyer' },
                { status: 400 }
            );
        }

        // Remove lawyer from chamber (set chamber_id to null and status to inactive)
        // OR completely delete the user from auth and database

        // Option 1: Soft delete - just remove from chamber (keep their account)
        // const { error: updateError } = await supabaseAdmin
        //     .from('users')
        //     .update({ 
        //         chamber_id: null, 
        //         status: 'inactive' 
        //     })
        //     .eq('id', lawyerId);

        // Option 2: Hard delete - completely remove user from auth and database

        // First, delete from users table with soft delete (set deleted_at)
        const { error: softDeleteError } = await supabaseAdmin
            .from('users')
            .update({
                deleted_at: new Date().toISOString(),
                chamber_id: null,
                status: 'inactive'
            })
            .eq('id', lawyerId);

        if (softDeleteError) {
            console.error('Error soft deleting lawyer from users table:', softDeleteError);
            throw softDeleteError;
        }

        // Then, delete from Supabase Auth (this is permanent)
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
            lawyerId
        );

        if (authDeleteError) {
            console.error('Error deleting lawyer from auth:', authDeleteError);
            // Rollback the soft delete if auth deletion fails
            await supabaseAdmin
                .from('users')
                .update({
                    deleted_at: null,
                    status: 'active'
                })
                .eq('id', lawyerId);
            throw authDeleteError;
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
    { params }: { params: { id: string } }
) {
    try {
        if (!serviceRoleKey) {
            throw new Error('Server configuration error: Missing Service Role Key');
        }

        const { id: lawyerId } = await params;
        const body = await request.json();
        const { status } = body;

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

        // Update lawyer status
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ status })
            .eq('id', lawyerId)
            .eq('role', 'lawyer');

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
