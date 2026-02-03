import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { caseId, type, title, date, time, location, description, priority, caseNumber } = await request.json();

        // Validate required fields
        if (!caseId || !type || !title || !date) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Combine date and time
        const eventDateTime = new Date(`${date}T${time || '00:00:00'}`);

        let result;

        if (type === 'hearing') {
            const { data, error } = await supabase.from('hearings').insert([{
                case_id: caseId,
                hearing_date: eventDateTime.toISOString(),
                court_name: location || '',
                description: description || ''
            }]).select();

            if (error) throw error;
            result = data;
        } else if (type === 'task') {
            const { data, error } = await supabase.from('case_tasks').insert([{
                case_id: caseId,
                title: title,
                due_date: eventDateTime.toISOString(),
                description: description || '',
                priority: priority || 'medium',
                status: 'pending'
            }]).select();

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
        console.error('Error creating event:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
