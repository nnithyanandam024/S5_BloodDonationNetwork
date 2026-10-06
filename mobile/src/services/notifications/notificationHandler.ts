import { Alert } from 'react-native';
import { PushNotificationPayload } from './fcm';

export interface ParsedAFGCNotification {
  requestId: string;
  type: 'DISPATCH_INVITE' | 'GAP_FULFILLED_KILL' | 'REMINDER' | 'STATUS_UPDATE';
  bloodGroup?: string;
  remainingGap?: number;
  ephemeralToken?: string;
  hospitalName?: string;
  message: string;
}

export class NotificationHandler {
  /**
   * Parse incoming FCM data payload into typed AFGC event.
   */
  public parsePayload(payload: PushNotificationPayload): ParsedAFGCNotification {
    const data = payload.data || {};
    const type = data.type || (data.requestId ? 'DISPATCH_INVITE' : 'STATUS_UPDATE');

    return {
      requestId: data.requestId || '',
      type,
      bloodGroup: data.bloodGroup,
      remainingGap: data.remainingGap !== undefined ? Number(data.remainingGap) : undefined,
      ephemeralToken: data.ephemeralToken,
      hospitalName: data.hospitalName || 'Emergency Hospital',
      message: payload.body || payload.title,
    };
  }

  /**
   * Handle incoming AFGC notification in the foreground.
   * If type is GAP_FULFILLED_KILL, alert the user that the request was met and their journey is not needed.
   */
  public handleForegroundNotification(
    payload: PushNotificationPayload,
    onNavigateToRequest?: (requestId: string) => void
  ): void {
    const parsed = this.parsePayload(payload);

    if (parsed.type === 'GAP_FULFILLED_KILL') {
      Alert.alert(
        'Requirement Met',
        `The emergency request for ${parsed.bloodGroup || 'blood'} has been fulfilled by another donor. Thank you for your readiness!`,
        [{ text: 'Dismiss', style: 'cancel' }]
      );
      return;
    }

    if (parsed.type === 'DISPATCH_INVITE') {
      Alert.alert(
        'Emergency Blood Dispatch',
        `${parsed.message}\nRequirement Gap: ${parsed.remainingGap ?? 'Urgent'} units remaining.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'View Request',
            onPress: () => {
              if (parsed.requestId && onNavigateToRequest) {
                onNavigateToRequest(parsed.requestId);
              }
            },
          },
        ]
      );
      return;
    }

    // Default info alert
    Alert.alert(payload.title || 'BloodLink Notification', payload.body || '');
  }
}

export const notificationHandler = new NotificationHandler();
