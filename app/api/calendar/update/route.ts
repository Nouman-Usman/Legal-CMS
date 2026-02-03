import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
    try {
        const { id, type, title, date, time, location, description, priority } = await request.json();

        if (!id || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const eventDateTime = date && time ? new Date(`${date}T${time}`).toISOString() : undefined;

        let result;

        if (type === 'hearing') {
            const updateData: any = {};
            if (eventDateTime) updateData.hearing_date = eventDateTime;
            if (location !== undefined) updateData.court_name = location;
            if (description !== undefined) updateData.description = description;

            const { data, error } = await supabase
                .from('hearings')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) throw error;
            result = data;
        } else if (type === 'task') {
            const updateData: any = {};
            if (title !== undefined) updateData.title = title;
            if (eventDateTime) updateData.due_date = eventDateTime;
            if (description !== undefined) updateData.description = description;
            if (priority !== undefined) updateData.priority = priority;

            const { data, error } = await supabase
                .from('case_tasks')
                .update(updateData)
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
        console.error('Error updating event:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
