import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HospitalHomeScreen } from '../screens/hospital/HospitalHomeScreen';
import { CreateRequestScreen } from '../screens/hospital/CreateRequestScreen';
import { RequestDetailsScreen } from '../screens/hospital/RequestDetailsScreen';
import { HospitalInventoryScreen } from '../screens/hospital/HospitalInventoryScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HospitalTabs = () => {
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
        tabBarIcon: () => {
          let icon = '🏥';
          if (route.name === 'Dashboard') icon = '🏥';
          else if (route.name === 'New Request') icon = '➕';
          else if (route.name === 'Inventory') icon = '🧪';
          return <Text style={{ fontSize: 20 }}>{icon}</Text>;
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
