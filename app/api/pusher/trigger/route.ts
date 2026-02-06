import { NextResponse } from 'next/server';
import { broadcastEvent } from '@/lib/realtime';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { channel, event, data } = body;

        if (!channel || !event || !data) {
            return NextResponse.json(
                { error: 'Missing required fields: channel, event, data' },
                { status: 400 }
            );
        }

        await broadcastEvent(channel, event, data);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Supabase Realtime broadcast error:', {
            message: error.message,
            stack: error.stack,
            error: error
        });
        return NextResponse.json(
            { error: 'Failed to broadcast event', details: error.message },
            { status: 500 }
        );
    }
}
