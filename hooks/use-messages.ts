'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribeToChannel } from '@/lib/realtime';
import { getConversationMessages, sendMessage, getOrCreateConversation } from '@/lib/supabase/messages';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load initial messages
  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      try {
        const { messages: data, error: err } = await getConversationMessages(conversationId);
        if (err) throw err;
        setMessages((data || []).reverse());
        setLoading(false);
      } catch (err) {
        setError('Failed to load messages');
        console.error(err);
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // Subscribe to real-time messages via Supabase Realtime
  useEffect(() => {
    if (!conversationId) return;

    const { unsubscribe } = subscribeToChannel(
      `conversation-${conversationId}`,
      'message',
      (data: Message) => {
        setMessages((prev) => [...prev, data]);
      }
    );

    return unsubscribe;
  }, [conversationId]);

  const send = useCallback(
    async (senderId: string, content: string) => {
      if (!conversationId) return { error: 'No conversation selected' };

      try {
        const { message, error } = await sendMessage(conversationId, senderId, content);
        if (error) throw error;
        return { message, error: null };
      } catch (err) {
        return { message: null, error: err };
      }
    },
    [conversationId]
  );

  return { messages, loading, error, send };
}

export async function useConversation(participantIds: string[]) {
  try {
    const { conversation, error } = await getOrCreateConversation(participantIds);
    if (error) throw error;
    return { conversation, error: null };
  } catch (error) {
    return { conversation: null, error };
  }
}
