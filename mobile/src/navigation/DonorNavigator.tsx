import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DonorHomeScreen } from '../screens/donor/DonorHomeScreen';
import { DonorRequestsScreen } from '../screens/donor/DonorRequestsScreen';
import { DonationHistoryScreen } from '../screens/donor/DonationHistoryScreen';
import { DonorProfileScreen } from '../screens/donor/DonorProfileScreen';
import { CustomBottomTabBar } from './CustomBottomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DonorTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={DonorHomeScreen} />
      <Tab.Screen name="Requests" component={DonorRequestsScreen} />
      <Tab.Screen name="History" component={DonationHistoryScreen} />
      <Tab.Screen name="Profile" component={DonorProfileScreen} />
    </Tab.Navigator>
  );
};

export const DonorNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DonorTabs" component={DonorTabs} />
    </Stack.Navigator>
  );
};
