import { Platform } from 'react-native';

export interface MobileEnvironment {
  apiBaseUrl: string;
  apiTimeoutMs: number;
  enableDebugLogging: boolean;
  appVersion: string;
}

// 10.0.2.2 is default Android emulator loopback alias to host machine localhost
// In USB debugging mode with `adb reverse tcp:5000 tcp:5000`, localhost:5000 is used directly
const getDevApiUrl = (): string => {
  return 'http://localhost:5000/api';
};

export const environment: MobileEnvironment = {
  apiBaseUrl: getDevApiUrl(),
  apiTimeoutMs: 10000,
  enableDebugLogging: __DEV__,
  appVersion: '1.0.0-afgc',
};
