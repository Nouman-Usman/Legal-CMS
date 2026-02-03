import { NextRequest, NextResponse } from 'next/server';
import { sendNotification } from '@/lib/supabase/messages';

export async function POST(request: NextRequest) {
  try {
    const { userId, title, message, data } = await request.json();

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { notification, error } = await sendNotification(
      userId,
      title,
      message,
      data
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Failed to send notification', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
