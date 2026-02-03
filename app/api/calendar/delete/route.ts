import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
    try {
        const { id, type } = await request.json();

        if (!id || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        let result;

        if (type === 'hearing') {
            const { data, error } = await supabase
                .from('hearings')
                .delete()
                .eq('id', id)
                .select();

            if (error) throw error;
            result = data;
        } else if (type === 'task') {
            const { data, error } = await supabase
                .from('case_tasks')
                .delete()
                .eq('id', id)
                .select();

            if (error) throw error;
            result = data;
        } else {
            return NextResponse.json(
                { error: 'Invalid event type' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Error deleting event:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
