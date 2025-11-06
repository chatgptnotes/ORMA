/**
 * useNotifications Hook
 * React hook for managing real-time notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationService, type Notification } from '../services/notificationService';
import { getCurrentUser } from '../lib/supabase';
import { authAPI } from '../services/api';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

/**
 * Hook to manage notifications with real-time updates
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notifications from backend
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [notifs, count] = await Promise.all([
        notificationService.getAll(),
        notificationService.getUnreadCount(),
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize notifications and subscribe to real-time updates
   */
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initialize = async () => {
      try {
        // Check if user is authenticated with Django
        const isDjangoAuth = authAPI.isAuthenticated();

        if (!isDjangoAuth) {
          console.log('No user logged in (Django), skipping notification initialization');
          setIsLoading(false);
          return;
        }

        console.log('✅ User authenticated with Django, fetching notifications...');

        // Try to initialize Supabase real-time (optional, for future use)
        try {
          const supabaseUser = await getCurrentUser();
          if (supabaseUser) {
            console.log('✅ Supabase user found, enabling real-time updates');
            await notificationService.initialize(supabaseUser.id);

            // Subscribe to new notifications
            unsubscribe = notificationService.subscribe((notification) => {
              console.log('🔔 Received notification via hook:', notification);

              // Add new notification to list
              setNotifications((prev) => [notification, ...prev]);

              // Update unread count if notification is unread
              if (!notification.is_read) {
                setUnreadCount((prev) => prev + 1);
              }

              // Show browser notification if permission granted
              showBrowserNotification(notification);
            });
          } else {
            console.log('ℹ️ No Supabase user, real-time updates disabled (Django only mode)');
          }
        } catch (supabaseError) {
          console.log('ℹ️ Supabase not configured or user not logged in with Supabase, continuing with Django only');
        }

        // Fetch initial notifications from Django API
        await fetchNotifications();
      } catch (err) {
        console.error('Failed to initialize notifications:', err);
        setError('Failed to initialize notifications');
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      notificationService.cleanup();
    };
  }, [fetchNotifications]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, is_read: true, read_at: new Date().toISOString() } : notif
        )
      );

      // Decrease unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
      throw err;
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          is_read: true,
          read_at: notif.read_at || new Date().toISOString(),
        }))
      );

      // Reset unread count
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
      throw err;
    }
  }, []);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.delete(id);

      // Update local state
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === id);
        if (notification && !notification.is_read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  }, []);

  /**
   * Refresh notifications
   */
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };
}

/**
 * Show browser notification if permission granted
 */
function showBrowserNotification(notification: Notification): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
    });
  }
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if ('Notification' in window) {
    return await Notification.requestPermission();
  }
  return 'denied';
}
