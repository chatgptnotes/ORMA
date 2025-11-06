/**
 * Notification Service
 * Handles real-time notifications via Supabase and Django backend
 */

import { supabase } from '../lib/supabase';
import api from './api';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id?: string;
  username?: string;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'user' | 'system';
  is_read: boolean;
  read_at?: string;
  related_model?: string;
  related_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

type NotificationCallback = (notification: Notification) => void;

class NotificationService {
  private channel: RealtimeChannel | null = null;
  private listeners: NotificationCallback[] = [];

  /**
   * Initialize real-time notifications for a user
   */
  async initialize(userId: string): Promise<void> {

    // Unsubscribe from any existing channel
    if (this.channel) {
      await this.channel.unsubscribe();
    }

    // Create new channel for user's notifications
    this.channel = supabase
      .channel(`notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 New notification received:', payload);
          const notification = payload.new as Notification;
          this.notifyListeners(notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 Notification updated:', payload);
          const notification = payload.new as Notification;
          this.notifyListeners(notification);
        }
      )
      .subscribe((status) => {
        console.log('📡 Notification channel status:', status);
      });
  }

  /**
   * Clean up and unsubscribe
   */
  async cleanup(): Promise<void> {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
    this.listeners = [];
  }

  /**
   * Subscribe to notification events
   */
  subscribe(callback: NotificationCallback): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all listeners of new notification
   */
  private notifyListeners(notification: Notification): void {
    this.listeners.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Fetch all notifications from Django backend
   */
  async getAll(): Promise<Notification[]> {
    try {
      const response = await api.get('/notifications/');
      // Handle paginated response from DRF
      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      // Handle non-paginated response (plain array)
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Fallback to empty array
      console.warn('Unexpected notification response format:', response.data);
      return [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread_count/');
      return response.data.unread_count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.post(`/notifications/${notificationId}/mark_read/`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await api.post('/notifications/mark_all_read/');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    }
  }

  /**
   * Create a new notification (admin/system only)
   */
  async create(notification: Partial<Notification>): Promise<Notification> {
    try {
      const response = await api.post('/notifications/', notification);
      return response.data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}/`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Create a notification in Supabase (for real-time delivery)
   * This bypasses Django and directly inserts into Supabase
   */
  async createRealtime(notification: Partial<Notification>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id || user.id,
          username: notification.username,
          title: notification.title,
          message: notification.message,
          notification_type: notification.notification_type || 'info',
          is_read: false,
          related_model: notification.related_model,
          related_id: notification.related_id,
          metadata: notification.metadata || {},
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to create realtime notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
