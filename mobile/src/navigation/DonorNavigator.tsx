import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { DonorHomeScreen } from '../screens/donor/DonorHomeScreen';
import { DonorRequestsScreen } from '../screens/donor/DonorRequestsScreen';
import { DonationHistoryScreen } from '../screens/donor/DonationHistoryScreen';
import { DonorProfileScreen } from '../screens/donor/DonorProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export const DonorNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color }) => {
          let icon = '🏠';
          if (route.name === 'Home') icon = '🏠';
          else if (route.name === 'Requests') icon = '🚨';
          else if (route.name === 'History') icon = '📋';
          else if (route.name === 'Profile') icon = '👤';
          return <Text style={{ fontSize: 20 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={DonorHomeScreen} />
      <Tab.Screen name="Requests" component={DonorRequestsScreen} />
      <Tab.Screen name="History" component={DonationHistoryScreen} />
      <Tab.Screen name="Profile" component={DonorProfileScreen} />
    </Tab.Navigator>
  );
};
