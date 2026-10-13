import { Platform, PermissionsAndroid } from 'react-native';
import {
  getMessaging,
  requestPermission,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  RemoteMessage,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { supabase } from '../../config/supabase';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data: {
    requestId?: string;
    bloodGroup?: string;
    remainingGap?: string | number;
    ephemeralToken?: string;
    type?: 'DISPATCH_INVITE' | 'GAP_FULFILLED_KILL' | 'REMINDER' | 'STATUS_UPDATE';
    [key: string]: any;
  };
}

export type NotificationCallback = (payload: PushNotificationPayload) => void;

class FCMService {
  private deviceToken: string | null = null;
  private listeners: NotificationCallback[] = [];
  private isInitialized = false;

  /**
   * Request push notification permission & retrieve real device token from Firebase.
   */
  public async requestPermissionAndGetToken(userId?: string): Promise<string | null> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[FCM] Android POST_NOTIFICATIONS permission not granted');
        }
      }

      const messaging = getMessaging();
      const authStatus = await requestPermission(messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('[FCM] User notification permission rejected or denied');
      }

      // Retrieve device token from Firebase Cloud Messaging
      const token = await getToken(messaging);
      this.deviceToken = token;
      console.log('[FCM] Registered device token:', token ? `${token.substring(0, 15)}...` : 'none');

      // Update token in Supabase user profile if user is provided
      if (userId && token) {
        await this.syncTokenToSupabase(userId, token);
      }

      this.initListeners();
      return this.deviceToken;
    } catch (error) {
      console.warn('[FCM] Push token initialization notice (fallback mock active):', error);
      const fallbackToken = `fcm_fallback_${Platform.OS}_${Date.now().toString(36)}`;
      this.deviceToken = fallbackToken;
      return fallbackToken;
    }
  }

  /**
   * Sync device FCM token to Supabase profiles table
   */
  public async syncTokenToSupabase(userId: string, token: string): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ fcm_token: token, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (err) {
      console.warn('[FCM] Failed to sync FCM token to Supabase profile:', err);
    }
  }

  /**
   * Initialize foreground message listening
   */
  private initListeners() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const messaging = getMessaging();

      // Foreground push notification handler
      onMessage(messaging, async (remoteMessage: RemoteMessage) => {
        console.log('[FCM] Foreground notification received:', remoteMessage.notification?.title);
        const payload: PushNotificationPayload = {
          title: remoteMessage.notification?.title || 'Emergency Blood Alert',
          body: remoteMessage.notification?.body || '',
          data: (remoteMessage.data as any) || {},
        };
        this.dispatchNotification(payload);
      });

      // User tapped notification from background state
      onNotificationOpenedApp(messaging, (remoteMessage: RemoteMessage) => {
        console.log('[FCM] App opened from background via notification:', remoteMessage.notification?.title);
      });
    } catch (e) {
      console.warn('[FCM] Listener init error:', e);
    }
  }

  /**
   * Get current cached device token.
   */
  public getDeviceToken(): string | null {
    return this.deviceToken;
  }

  /**
   * Register a callback listener for incoming foreground push notifications.
   */
  public onMessage(callback: NotificationCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Dispatch notification to all active listeners.
   */
  public dispatchNotification(payload: PushNotificationPayload): void {
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error('[FCM] Listener execution error:', err);
      }
    }
  }
}

export const fcmService = new FCMService();
