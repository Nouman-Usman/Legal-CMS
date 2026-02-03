import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher-server';

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

        await pusherServer.trigger(channel, event, data);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Pusher trigger error:', error);
        return NextResponse.json(
            { error: 'Failed to trigger Pusher event' },
            { status: 500 }
        );
    }
}
