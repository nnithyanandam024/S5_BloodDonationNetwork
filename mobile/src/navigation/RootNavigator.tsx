import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { DonorNavigator } from './DonorNavigator';
import { HospitalNavigator } from './HospitalNavigator';

export const RootNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : user.role === 'HOSPITAL' ? (
        <HospitalNavigator />
      ) : (
        <DonorNavigator />
      )}
    </NavigationContainer>
  );
};
