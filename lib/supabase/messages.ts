import { supabase } from './client';

// Helper function to call the Pusher API route
async function triggerPusherEvent(channel: string, event: string, data: any) {
  try {
    await fetch('/api/pusher/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel, event, data }),
    });
  } catch (error) {
    console.error('Failed to trigger Pusher event:', error);
  }
}
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
  try {
    // Insert message into database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger Pusher event for real-time delivery via API route
    await triggerPusherEvent(
      `conversation-${conversationId}`,
      'message',
      {
        id: data.id,
        content: data.content,
        sender_id: data.sender_id,
        created_at: data.created_at,
      }
    );

    return { message: data, error: null };
  } catch (error) {
    return { message: null, error };
  }
}

export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  offset = 0
) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { messages: data, error: null };
  } catch (error) {
    return { messages: null, error };
  }
}

export async function getOrCreateConversation(
  participantIds: string[]
) {
  try {
    // Try to find existing conversation with these participants
    const { data: existing, error: searchError } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', participantIds);

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }

    if (existing && existing.length > 0) {
      return { conversation: existing[0], error: null };
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participants: participantIds,
      })
      .select()
      .single();

    if (error) throw error;

    return { conversation: data, error: null };
  } catch (error) {
    return { conversation: null, error };
  }
}

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
) {
  try {
    // Insert notification into database
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        data,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger Pusher event for real-time notification via API route
    await triggerPusherEvent(
      `user-${userId}`,
      'notification',
      {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        created_at: notification.created_at,
      }
    );

    return { notification, error: null };
  } catch (error) {
    return { notification: null, error };
  }
}

export async function getUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { notifications: data, error: null };
  } catch (error) {
    return { notifications: null, error };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error };
  }
}
