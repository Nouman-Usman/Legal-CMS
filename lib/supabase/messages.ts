import { supabase } from './client';

// Helper function to call the Realtime broadcast API route
async function triggerRealtimeEvent(channel: string, event: string, data: any) {
  // Fire and forget realtime events to avoid blocking the main UI/DB flow
  fetch('/api/pusher/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, event, data }),
  }).catch(error => {
    console.warn('Realtime broadcast trigger failed:', error);
  });
}
export async function sendMessage(
  threadId: string,
  senderId: string,
  content: string
) {
  try {
    // Insert message into database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger Realtime event for real-time delivery via API route
    await triggerRealtimeEvent(
      `thread-${threadId}`,
      'message',
      {
        id: data.id,
        content: data.content,
        sender_id: data.sender_id,
        created_at: data.created_at,
      }
    );

    // Update the thread's updated_at timestamp
    await supabase.from('message_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);

    return { message: data, error: null };
  } catch (error) {
    return { message: null, error };
  }
}

export async function getConversationMessages(
  threadId: string,
  limit = 50,
  offset = 0
) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
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
    // 1. Direct search on participant_ids array (Flat, Non-recursive)
    const { data: existing, error: searchError } = await supabase
      .from('message_threads')
      .select('*')
      .contains('participant_ids', participantIds)
      .is('case_id', null)
      .limit(1)
      .maybeSingle();

    if (searchError) throw searchError;

    if (existing) {
      return { conversation: existing, error: null };
    }

    // 2. Create new thread with participant_ids explicitly set for RLS
    const { data: newThread, error: createError } = await supabase
      .from('message_threads')
      .insert({
        subject: 'Direct Message',
        participant_ids: participantIds,
        created_by: participantIds[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) throw createError;

    // 3. Keep thread_reads in sync for legacy compatibility and read tracking
    const readEntries = participantIds.map(userId => ({
      thread_id: newThread.id,
      user_id: userId,
      last_read_at: new Date().toISOString()
    }));

    const { error: readError } = await supabase
      .from('thread_reads')
      .insert(readEntries);

    if (readError) {
      console.warn('Failed to create initial thread_reads (non-critical):', readError);
    }

    return { conversation: newThread, error: null };
  } catch (error: any) {
    console.error('getOrCreateConversation error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      error
    });
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

    // Trigger Realtime event for real-time notification via API route
    await triggerRealtimeEvent(
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

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { user: data, error };
}

export async function getUserConversations(userId: string) {
  try {
    // 1. Get threads where user is a participant
    const { data: threads, error: threadsError } = await supabase
      .from('message_threads')
      .select('*')
      .contains('participant_ids', [userId])
      .order('updated_at', { ascending: false });

    if (threadsError) throw threadsError;

    if (!threads || threads.length === 0) return { conversations: [], error: null };

    // 2. Get unique participant IDs
    const allParticipantIds = Array.from(
      new Set(threads.flatMap((t: any) => t.participant_ids))
    );

    // 3. Fetch user profiles for these participants
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, role, avatar_url, chamber_id')
      .in('id', allParticipantIds);

    if (usersError) throw usersError;

    // 4. Map threads to a richer format including the "other" participant
    const conversations = threads.map((thread: any) => {
      const otherId = thread.participant_ids.find((id: string) => id !== userId) || thread.participant_ids[0];
      const otherUser = users?.find(u => u.id === otherId);

      return {
        ...thread,
        otherUser,
        participants: users?.filter(u => thread.participant_ids.includes(u.id))
      };
    });

    return { conversations, error: null };
  } catch (error) {
    console.error('getUserConversations error:', error);
    return { conversations: null, error };
  }
}
