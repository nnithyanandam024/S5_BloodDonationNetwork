import { Platform } from 'react-native';

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

  /**
   * Request push notification permission & retrieve mock/real device token.
   */
  public async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      // In production bare RN: @react-native-firebase/messaging messaging().getToken()
      // Fallback robust mock token for testing and standard environments
      const timestamp = Date.now().toString(36);
      this.deviceToken = `fcm_token_${Platform.OS}_${timestamp}`;
      return this.deviceToken;
    } catch (error) {
      console.warn('[FCM] Permission or token retrieval failed:', error);
      return null;
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
   * Simulate or dispatch incoming notification to all active listeners.
   */
  public dispatchNotification(payload: PushNotificationPayload): void {
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error('[FCM] Listener error:', err);
      }
    }
  }
}

export const fcmService = new FCMService();
