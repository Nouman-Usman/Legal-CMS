import PusherServer from 'pusher';
const pusherAppId = process.env.PUSHER_APP_ID;
const pusherSecret = process.env.PUSHER_SECRET;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!pusherAppId || !pusherSecret || !pusherCluster) {
  throw new Error('Missing Pusher environment variables on server');
}

// Server-side Pusher instance (only used in API routes)
export const pusherServer = new PusherServer({
  appId: pusherAppId,
  key: process.env.PUSHER_KEY || 'pusher-key',
  secret: pusherSecret,
  cluster: pusherCluster,
  useTLS: true,
});

export default pusherServer;
