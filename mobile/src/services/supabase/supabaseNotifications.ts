import { supabase } from '../../config/supabase';
import { AppNotification, NotificationType } from '../../types';

export class SupabaseNotificationsService {
  /**
   * Fetch all notifications for a user, sorted newest first
   */
  async getNotifications(userId: string): Promise<AppNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Table might not exist yet before SQL migration is applied
        console.warn('[SupabaseNotifications] Fetch notice:', error.message);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        body: row.body,
        type: (row.type as NotificationType) || 'SYSTEM',
        requestId: row.request_id || undefined,
        bloodGroup: row.blood_group || undefined,
        isRead: !!row.is_read,
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.warn('[SupabaseNotifications] Fetch error:', err);
      return [];
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch (err) {
      console.warn('[SupabaseNotifications] Mark as read notice:', err);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);
    } catch (err) {
      console.warn('[SupabaseNotifications] Mark all read notice:', err);
    }
  }

  /**
   * Send/Insert a notification into Supabase
   */
  async createNotification(params: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    requestId?: string;
    bloodGroup?: string;
  }): Promise<AppNotification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          title: params.title,
          body: params.body,
          type: params.type,
          request_id: params.requestId,
          blood_group: params.bloodGroup,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.warn('[SupabaseNotifications] Create notice:', error.message);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        body: data.body,
        type: data.type as NotificationType,
        requestId: data.request_id,
        bloodGroup: data.blood_group,
        isRead: data.is_read,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.warn('[SupabaseNotifications] Create error:', err);
      return null;
    }
  }

  /**
   * Subscribe to Supabase Realtime notifications for the current user
   */
  subscribeToNotifications(
    userId: string,
    onNewNotification: (notif: AppNotification) => void
  ): () => void {
    const channelName = `notifications-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row) {
            const notif: AppNotification = {
              id: row.id,
              userId: row.user_id,
              title: row.title,
              body: row.body,
              type: (row.type as NotificationType) || 'SYSTEM',
              requestId: row.request_id || undefined,
              bloodGroup: row.blood_group || undefined,
              isRead: false,
              createdAt: row.created_at || new Date().toISOString(),
            };
            onNewNotification(notif);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseNotificationsService = new SupabaseNotificationsService();
