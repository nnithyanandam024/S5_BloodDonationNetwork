import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HospitalHomeScreen } from '../screens/hospital/HospitalHomeScreen';
import { CreateRequestScreen } from '../screens/hospital/CreateRequestScreen';
import { RequestDetailsScreen } from '../screens/hospital/RequestDetailsScreen';
import { HospitalInventoryScreen } from '../screens/hospital/HospitalInventoryScreen';
import { colors } from '../theme';
import { Icon } from '../components/Icon/Icon';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HospitalTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.violetPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color }) => {
          let iconName: 'hospital' | 'plus' | 'flask' = 'hospital';
          if (route.name === 'Dashboard') iconName = 'hospital';
          else if (route.name === 'New Request') iconName = 'plus';
          else if (route.name === 'Inventory') iconName = 'flask';
          return <Icon name={iconName} size={22} color={color} strokeWidth={2} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={HospitalHomeScreen} />
      <Tab.Screen name="New Request" component={CreateRequestScreen} />
      <Tab.Screen name="Inventory" component={HospitalInventoryScreen} />
    </Tab.Navigator>
  );
};

export const HospitalNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HospitalTabs" component={HospitalTabs} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} />
      <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
    </Stack.Navigator>
  );
};
