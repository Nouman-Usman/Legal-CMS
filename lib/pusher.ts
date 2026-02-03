'use client';

import PusherClient from 'pusher-js';

// Note: NEXT_PUBLIC_PUSHER_APP_KEY is intentionally public and safe to expose to the client.
// Pusher's architecture requires the app key to be available on the client for real-time messaging.
// The PUSHER_SECRET is kept server-side only in pusher-server.ts.
// eslint-disable-next-line @next/next/no-process-env
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
// eslint-disable-next-line @next/next/no-process-env
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!pusherKey || !pusherCluster) {
  console.error('Missing Pusher environment variables: NEXT_PUBLIC_PUSHER_APP_KEY and NEXT_PUBLIC_PUSHER_CLUSTER');
}

// Client-side Pusher instance
// If keys are missing, we return a mock-like object (or simply the client if it handles missing keys gracefully, but it usually throws)
// To be safe, we only instantiate if keys are present.
export const pusherClient = (pusherKey && pusherCluster) ? new PusherClient(pusherKey, {
  cluster: pusherCluster,
  enabledTransports: ['ws', 'wss'],
  disabledTransports: [],
}) : {} as PusherClient;
