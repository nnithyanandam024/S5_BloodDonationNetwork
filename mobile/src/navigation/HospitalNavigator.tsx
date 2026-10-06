import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HospitalHomeScreen } from '../screens/hospital/HospitalHomeScreen';
import { HospitalRequestsScreen } from '../screens/hospital/HospitalRequestsScreen';
import { CreateRequestScreen } from '../screens/hospital/CreateRequestScreen';
import { RequestDetailsScreen } from '../screens/hospital/RequestDetailsScreen';
import { HospitalInventoryScreen } from '../screens/hospital/HospitalInventoryScreen';
import { HospitalProfileScreen } from '../screens/hospital/HospitalProfileScreen';
import { CustomBottomTabBar } from './CustomBottomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HospitalTabs = ({ navigation }: any) => {
  return (
    <Tab.Navigator
      tabBar={(props) => (
        <CustomBottomTabBar
          {...props}
          onCenterPress={() => navigation.navigate('CreateRequest')}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={HospitalHomeScreen} />
      <Tab.Screen name="Requests" component={HospitalRequestsScreen} />
      <Tab.Screen name="Inventory" component={HospitalInventoryScreen} />
      <Tab.Screen name="Profile" component={HospitalProfileScreen} />
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
