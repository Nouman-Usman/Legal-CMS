'use client';

import { useState, useEffect } from 'react';
import { pusherClient } from '@/lib/pusher';
import { getUserNotifications, markNotificationAsRead } from '@/lib/supabase/messages';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load initial notifications
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        const { notifications: data, error: err } = await getUserNotifications(userId);
        if (err) throw err;
        setNotifications(data || []);
        setUnreadCount((data || []).filter((n: any) => !n.is_read).length);
        setLoading(false);
      } catch (err) {
        setError('Failed to load notifications');
        console.error(err);
        setLoading(false);
      }
    };

    loadNotifications();
  }, [userId]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId) return;

    if (!pusherClient.subscribe) return;
    const channel = pusherClient.subscribe(`user-${userId}`);

    const handleNotification = (data: Notification) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    channel.bind('notification', handleNotification);

    return () => {
      channel.unbind('notification', handleNotification);
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
  };
}
