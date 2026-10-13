import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi, RegisterParams, GoogleAuthParams, apiClient, donorsApi } from '../services/api';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth, GoogleAuthProvider, signInWithCredential, signOut } from '@react-native-firebase/auth';

export const GOOGLE_WEB_CLIENT_ID = '806709963338-83oetda609m6cbnv9hb9pdkthba975tv.apps.googleusercontent.com';

interface GoogleLoginResult {
  isNewUser: boolean;
  googleData?: {
    uid: string;
    email: string;
    name: string;
    picture: string;
  };
  firebaseIdToken?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  loginWithGoogle: () => Promise<GoogleLoginResult>;
  completeGoogleRegistration: (params: GoogleAuthParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  toggleAvailability: (isAvailable: boolean) => Promise<void>;
  switchUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false,
      });
    } catch (err) {
      console.warn('[GoogleSignin] Configuration notice:', err);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (params: RegisterParams) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(params);
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<GoogleLoginResult> => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In was cancelled or failed to return credentials.');
      }

      // Authenticate with Firebase Auth
      const authInstance = getAuth();
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(authInstance, googleCredential);
      const firebaseIdToken = await userCredential.user.getIdToken();

      // Verify on Backend and fetch / create user session
      const res = await authApi.googleAuth({ idToken: firebaseIdToken });

      if (res.isNewUser) {
        return {
          isNewUser: true,
          googleData: res.googleData,
          firebaseIdToken,
        };
      } else if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        return { isNewUser: false };
      } else {
        throw new Error('Invalid authentication response from BloodLink server');
      }
    } catch (err: any) {
      throw err;
    }
  };

  const completeGoogleRegistration = async (params: GoogleAuthParams) => {
    setIsLoading(true);
    try {
      const res = await authApi.googleAuth(params);
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
      } else {
        throw new Error('Profile registration could not be completed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(getAuth());
      await GoogleSignin.signOut();
    } catch {
      // Ignored if user was not logged in via Google
    }
    apiClient.setToken(null);
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await authApi.getMe();
      setUser(res.user);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const toggleAvailability = async (isAvailable: boolean) => {
    try {
      const res = await donorsApi.updateAvailability(isAvailable);
      setUser(res.profile);
    } catch (err) {
      console.error('Failed to update availability:', err);
      throw err;
    }
  };

  const switchUserRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginWithGoogle,
        completeGoogleRegistration,
        logout,
        refreshUser,
        toggleAvailability,
        switchUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
