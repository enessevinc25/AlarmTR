import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// AsyncStorage global mock - tüm testler için
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Sentry-expo mock - ESM parse hatasını engellemek için
jest.mock('sentry-expo', () => ({
  init: jest.fn(),
  Native: {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setUser: jest.fn(),
    addBreadcrumb: jest.fn(),
  },
}));

// Platform.select mock - used by some modules that import react-native
// Note: alarmService.test.ts mocks react-native entirely, so this won't affect it
// This is for other tests that use Platform.select
try {
  const RN = require('react-native');
  if (RN.Platform && typeof RN.Platform.select === 'function') {
    const originalSelect = RN.Platform.select;
    RN.Platform.select = jest.fn((obj: any) => {
      // obj.android varsa onu dön, yoksa obj.default veya obj.ios
      return obj.android ?? obj.default ?? obj.ios ?? null;
    });
  }
} catch (e) {
  // react-native might be mocked in test files, ignore
}

// Animated helper mock - native driver uyarılarını bastırmak için
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

// Expo Notifications mock - alarmService.test.ts için gerekli
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, status: 'granted', canAskAgain: false })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, status: 'granted', canAskAgain: false })),
  setNotificationHandler: jest.fn(() => Promise.resolve()),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getNotificationChannelsAsync: jest.fn(() => Promise.resolve([])),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5,
  },
  AndroidNotificationVisibility: {
    PUBLIC: 1,
    PRIVATE: 0,
    SECRET: -1,
  },
  IosAuthorizationStatus: {
    PROVISIONAL: 1,
    AUTHORIZED: 2,
  },
}));

