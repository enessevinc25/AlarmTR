// CRITICAL: Mock react-native to avoid loading native modules (DevMenu etc.)
// Minimal mock that only provides Platform for alarmService.ts
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn((obj: any) => obj.android ?? obj.default ?? obj.ios ?? null),
    Version: 34,
  },
}));
jest.mock('../context/AlarmSettingsContext', () => ({
  getCachedAlarmSettings: jest.fn(),
}));

import { initializeNotifications, scheduleAlarmNotification, getNotificationConfigForSettings } from '../services/alarmService';
import * as Notifications from 'expo-notifications';
import { getCachedAlarmSettings } from '../context/AlarmSettingsContext';

describe('alarmService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Notifications.setNotificationHandler as jest.Mock).mockClear();
    (Notifications.setNotificationChannelAsync as jest.Mock).mockClear();
    (getCachedAlarmSettings as jest.Mock).mockReturnValue({
      soundProfile: 'default',
      vibrationProfile: 'short',
    });
  });

  describe('initializeNotifications', () => {
    it('should initialize notifications only once', async () => {
      (Notifications.setNotificationHandler as jest.Mock).mockResolvedValue(undefined);
      (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);

      await initializeNotifications();
      await initializeNotifications(); // Second call should not re-initialize

      expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    });

    it('should create notification channels on Android', async () => {
      // Reset notificationsInitialized flag for this test
      if ((global as any).__resetNotificationsInitialized) {
        (global as any).__resetNotificationsInitialized();
      }
      
      // Platform.OS should be 'android' (from mock)
      // Platform is already mocked globally, no need to require
      // expect(Platform.OS).toBe('android'); // Verify mock is working
      
      (Notifications.setNotificationHandler as jest.Mock).mockResolvedValue(undefined);
      (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);

      await initializeNotifications();

      // Android'de tüm sound/vibration kombinasyonları için channel oluşturulmalı
      // 5 sound profiles * 3 vibration profiles = 15 channels
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledTimes(15);
    });
  });

  describe('getNotificationConfigForSettings', () => {
    it('should return correct config for default settings', () => {
      const settings = {
        soundProfile: 'default' as const,
        vibrationProfile: 'short' as const,
      };

      const config = getNotificationConfigForSettings(settings);

      expect(config.androidChannelId).toBe('alarm_default_short');
      expect(config.iosSound).toBe('alarm_default.wav');
      expect(config.playSound).toBe(true);
    });

    it('should return correct config for silent profile', () => {
      const settings = {
        soundProfile: 'silent' as const,
        vibrationProfile: 'off' as const,
      };

      const config = getNotificationConfigForSettings(settings);

      expect(config.androidChannelId).toBe('alarm_silent_off');
      expect(config.playSound).toBe(false);
    });
  });

  describe('scheduleAlarmNotification', () => {
    it('should schedule notification with correct content', async () => {
      // initializeNotifications'ı mock etme, gerçek fonksiyonu çağırsın
      (Notifications.setNotificationHandler as jest.Mock).mockResolvedValue(undefined);
      (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');

      await scheduleAlarmNotification({
        title: 'Test Alarm',
        body: 'Test body',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Test Alarm',
            body: 'Test body',
          }),
          // Android'de time-interval trigger (seconds: 1, channelId), iOS'te null
          trigger: expect.objectContaining({
            seconds: 1,
            channelId: expect.any(String),
          }),
        })
      );
    });

    it('should use override settings when provided', async () => {
      // initializeNotifications'ı mock etme, gerçek fonksiyonu çağırsın
      (Notifications.setNotificationHandler as jest.Mock).mockResolvedValue(undefined);
      (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');

      const overrideSettings = {
        soundProfile: 'loud' as const,
        vibrationProfile: 'intense' as const,
      };

      await scheduleAlarmNotification(
        {
          title: 'Test Alarm',
          body: 'Test body',
        },
        overrideSettings
      );

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          // Android'de trigger içinde channelId olmalı
          trigger: expect.objectContaining({
            seconds: 1,
            channelId: 'alarm_loud_intense',
          }),
        })
      );
    });
  });
});
