import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler for FCM push notifications
try {
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    console.log('[FCM Background Message]', remoteMessage?.notification?.title || remoteMessage?.data);
  });
} catch (e) {
  console.warn('[FCM Background Handler Setup Warning]', e);
}

AppRegistry.registerComponent(appName, () => App);
