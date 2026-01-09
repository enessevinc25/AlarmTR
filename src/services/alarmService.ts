import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { AlarmSession } from '../types/models';
import {
  AlarmSettings,
  AlarmSoundProfile,
  AlarmVibrationProfile,
  getCachedAlarmSettings,
} from '../context/AlarmSettingsContext';

let notificationsInitialized = false;

// Export reset function for testing only
if (__DEV__) {
  (global as any).__resetNotificationsInitialized = () => {
    notificationsInitialized = false;
  };
}

type SoundConfig = {
  label: string;
  sound: string | null;
  importance: Notifications.AndroidImportance;
};

type VibrationConfig = {
  label: string;
  pattern: number[];
};

const SOUND_CONFIG: Record<AlarmSoundProfile, SoundConfig> = {
  device: {
    label: 'Cihaz zil sesi',
    sound: null, // Android'de null kullanarak sistem varsayılan sesini kullanır
    importance: Notifications.AndroidImportance.MAX,
  },
  default: {
    label: 'Varsayılan',
    sound: Platform.select({ ios: 'alarm_default.wav', android: 'alarm_default.wav' }) ?? null,
    importance: Notifications.AndroidImportance.MAX,
  },
  soft: {
    label: 'Yumuşak',
    sound: Platform.select({ ios: 'alarm_soft.wav', android: 'alarm_soft.wav' }) ?? null,
    importance: Notifications.AndroidImportance.HIGH,
  },
  loud: {
    label: 'Yüksek',
    sound: Platform.select({ ios: 'alarm_loud.wav', android: 'alarm_loud.wav' }) ?? null,
    importance: Notifications.AndroidImportance.MAX,
  },
  silent: {
    label: 'Sessiz',
    sound: null,
    importance: Notifications.AndroidImportance.DEFAULT,
  },
};

const VIBRATION_CONFIG: Record<AlarmVibrationProfile, VibrationConfig> = {
  off: {
    label: 'Titreşim yok',
    pattern: [0],
  },
  short: {
    label: 'Kısa titreşim',
    pattern: [0, 180, 120, 180],
  },
  intense: {
    label: 'Yoğun titreşim',
    pattern: [0, 400, 200, 400, 200, 400],
  },
};

const buildChannelId = (sound: AlarmSoundProfile, vibration: AlarmVibrationProfile) =>
  `alarm_${sound}_${vibration}`;

export function getNotificationConfigForSettings(settings: AlarmSettings) {
  const soundConfig = SOUND_CONFIG[settings.soundProfile];
  return {
    androidChannelId: buildChannelId(settings.soundProfile, settings.vibrationProfile),
    iosSound: soundConfig.sound,
    playSound: soundConfig.sound !== null,
  };
}

export async function initializeNotifications() {
  if (notificationsInitialized) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    for (const soundKey of Object.keys(SOUND_CONFIG) as AlarmSoundProfile[]) {
      for (const vibrationKey of Object.keys(VIBRATION_CONFIG) as AlarmVibrationProfile[]) {
        const soundConfig = SOUND_CONFIG[soundKey];
        const vibrationConfig = VIBRATION_CONFIG[vibrationKey];
        await Notifications.setNotificationChannelAsync(
          buildChannelId(soundKey, vibrationKey),
          {
            name: `LastStop Alarm – ${soundConfig.label} / ${vibrationConfig.label}`,
            importance: soundConfig.importance,
            sound: soundConfig.sound ?? undefined,
            vibrationPattern: vibrationConfig.pattern,
            enableVibrate: vibrationKey !== 'off',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          },
        );
      }
    }
  }

  notificationsInitialized = true;
}

export async function scheduleAlarmNotification(
  content: { title: string; body: string },
  settingsOverride?: AlarmSettings,
) {
  await initializeNotifications();
  const settings = settingsOverride ?? getCachedAlarmSettings();
  const config = getNotificationConfigForSettings(settings);

  // Android'de background task içinden bildirim göndermek için time-interval trigger kullanıyoruz
  // trigger:null background task'te güvenilir değil, Android'de 1sn time-interval kullanıyoruz
  // iOS'te trigger:null kullanıyoruz (hemen göster)
  const trigger = Platform.OS === 'android' 
    ? { seconds: 1, channelId: config.androidChannelId }
    : null;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      sound: config.iosSound ?? undefined,
      data: {
        soundProfile: settings.soundProfile,
        vibrationProfile: settings.vibrationProfile,
      },
    },
    trigger,
  });
}

export async function triggerImmediateAlarmNotification(alarmSession: AlarmSession) {
  await scheduleAlarmNotification({
    title: 'Durağa yaklaşıyorsun!',
    body: `${alarmSession.targetName} durağına çok az kaldı. İnmek için hazırlan.`,
  });
}

