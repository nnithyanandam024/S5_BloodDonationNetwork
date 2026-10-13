import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppNotification, NotificationType, BloodGroup } from '../types';
import { useAuth } from './AuthContext';
import { supabaseNotificationsService } from '../services/supabase/supabaseNotifications';
import { fcmService, PushNotificationPayload } from '../services/notifications/fcm';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  activeBanner: AppNotification | null;
  dismissBanner: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  pushLocalAlert: (title: string, body: string, options?: Partial<AppNotification>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeBanner, setActiveBanner] = useState<AppNotification | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    const list = await supabaseNotificationsService.getNotifications(user.id);
    setNotifications(list);
  }, [user?.id]);

  // Initial load and Realtime / FCM synchronization
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setActiveBanner(null);
      return;
    }

    // 1. Initialize FCM & register token in Supabase
    fcmService.requestPermissionAndGetToken(user.id);

    // 2. Fetch existing notifications
    refreshNotifications();

    // 3. Subscribe to Supabase Realtime changes
    const unsubRealtime = supabaseNotificationsService.subscribeToNotifications(
      user.id,
      (newNotif) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        setActiveBanner(newNotif);
      }
    );

    // 4. Subscribe to FCM foreground push messages
    const unsubFcm = fcmService.onMessage((payload: PushNotificationPayload) => {
      const type: NotificationType =
        (payload.data?.type as NotificationType) || 'SYSTEM';

      const newNotif: AppNotification = {
        id: `fcm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: user.id,
        title: payload.title,
        body: payload.body,
        type,
        requestId: payload.data?.requestId,
        bloodGroup: payload.data?.bloodGroup as BloodGroup,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setActiveBanner(newNotif);
    });

    return () => {
      unsubRealtime();
      unsubFcm();
    };
  }, [user?.id, refreshNotifications]);

  const dismissBanner = useCallback(() => {
    setActiveBanner(null);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await supabaseNotificationsService.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await supabaseNotificationsService.markAllAsRead(user.id);
  }, [user?.id]);

  const pushLocalAlert = useCallback(
    (title: string, body: string, options?: Partial<AppNotification>) => {
      const notif: AppNotification = {
        id: `local-${Date.now()}`,
        userId: user?.id || 'guest',
        title,
        body,
        type: options?.type || 'SYSTEM',
        requestId: options?.requestId,
        bloodGroup: options?.bloodGroup,
        isRead: false,
        createdAt: new Date().toISOString(),
        ...options,
      };

      setNotifications((prev) => [notif, ...prev]);
      setActiveBanner(notif);
    },
    [user?.id]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeBanner,
        dismissBanner,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        pushLocalAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
