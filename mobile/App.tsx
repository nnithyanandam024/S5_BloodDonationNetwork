/**
 * Emergency Blood Donation Application
 * Bare React Native CLI (TypeScript)
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/store/AuthContext';
import { NotificationProvider, useNotification } from './src/store/NotificationContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { NotificationBanner } from './src/components/NotificationBanner';

const AppContent = () => {
  const { activeBanner, dismissBanner } = useNotification();

  return (
    <>
      <RootNavigator />
      <NotificationBanner
        notification={activeBanner}
        onDismiss={dismissBanner}
      />
    </>
  );
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
