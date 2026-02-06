/**
 * Supabase Realtime Module
 * Replaces Pusher with Supabase's built-in Realtime functionality
 */

import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Map to store active channels
const channels = new Map<string, RealtimeChannel>();

/**
 * Subscribe to a realtime channel and listen for broadcast events
 */
export function subscribeToChannel(
  channelName: string,
  event: string,
  callback: (data: any) => void
): { unsubscribe: () => void } {
  // Create or get existing channel
  let channel = channels.get(channelName);

  if (!channel) {
    channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });
    channels.set(channelName, channel);
  }

  // Subscribe to the event
  channel.on('broadcast', { event }, (payload) => {
    callback(payload.payload);
  });

  // Subscribe to the channel
  channel.subscribe();

  // Return unsubscribe function
  return {
    unsubscribe: () => {
      channel?.unsubscribe();
      channels.delete(channelName);
    },
  };
}

/**
 * Broadcast an event to a channel
 * This should be called from the server or client
 */
export async function broadcastEvent(
  channelName: string,
  event: string,
  data: any
): Promise<void> {
  // Get or create channel for broadcasting
  let channel = channels.get(`broadcast-${channelName}`);

  if (!channel) {
    channel = supabase.channel(`${channelName}`, {
      config: {
        broadcast: { self: true },
      },
    });
    channels.set(`broadcast-${channelName}`, channel);
  }

  // Subscribe if not already subscribed
  if (channel.state !== 'joined') {
    await channel.subscribe();
  }

  // Broadcast the event using the new broadcast API
  await channel.send({
    type: 'broadcast',
    event,
    payload: data,
  });
}

/**
 * Subscribe to database changes (useful for real-time updates)
 */
export function subscribeToTable(
  tableName: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  filter?: string,
  callback?: (payload: any) => void
): { unsubscribe: () => void } {
  const channelName = `${tableName}:${event}`;
  const channel = supabase
    .channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    })
    .on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table: tableName,
        filter,
      },
      (payload) => {
        callback?.(payload);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      channel?.unsubscribe();
    },
  };
}

export default {
  subscribeToChannel,
  broadcastEvent,
  subscribeToTable,
};
