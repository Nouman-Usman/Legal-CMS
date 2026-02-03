import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/supabase/messages';

export async function POST(request: NextRequest) {
  try {
    const { conversationId, senderId, content } = await request.json();

    if (!conversationId || !senderId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { message, error } = await sendMessage(
      conversationId,
      senderId,
      content
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Failed to send message', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
