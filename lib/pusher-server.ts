/**
 * Supabase Realtime Broadcast Server
 * Replaces Pusher Server
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
}

// Create admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Broadcast an event to a channel using Supabase Realtime
 */
export async function broadcastEvent(
  channelName: string,
  event: string,
  data: any
): Promise<void> {
  try {
    const channel = supabaseAdmin.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });

    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event,
      payload: data,
    });

    await channel.unsubscribe();
  } catch (error) {
    console.error('Failed to broadcast event:', error);
    throw error;
  }
}

export default { broadcastEvent, supabaseAdmin };

