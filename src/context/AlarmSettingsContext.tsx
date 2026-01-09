import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AlarmSoundProfile = 'device' | 'default' | 'soft' | 'loud' | 'silent';
export type AlarmVibrationProfile = 'off' | 'short' | 'intense';

export interface AlarmSettings {
  soundProfile: AlarmSoundProfile;
  vibrationProfile: AlarmVibrationProfile;
}

const STORAGE_KEY = 'ALARM_SETTINGS_V1';
const DEFAULT_SETTINGS: AlarmSettings = {
  soundProfile: 'default',
  vibrationProfile: 'short',
};

let cachedSettings: AlarmSettings = DEFAULT_SETTINGS;

export const getCachedAlarmSettings = () => cachedSettings;

interface AlarmSettingsContextValue {
  settings: AlarmSettings;
  loading: boolean;
  updateSettings(partial: Partial<AlarmSettings>): Promise<void>;
  resetSettings(): Promise<void>;
}

const AlarmSettingsContext = createContext<AlarmSettingsContextValue | undefined>(undefined);

export const AlarmSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AlarmSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && mounted) {
          const parsed = JSON.parse(stored) as Partial<AlarmSettings>;
          const next = {
            soundProfile: parsed.soundProfile ?? DEFAULT_SETTINGS.soundProfile,
            vibrationProfile: parsed.vibrationProfile ?? DEFAULT_SETTINGS.vibrationProfile,
          } satisfies AlarmSettings;
          cachedSettings = next;
          setSettings(next);
        } else {
          cachedSettings = DEFAULT_SETTINGS;
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Alarm ayarları yüklenemedi', error);
        }
        cachedSettings = DEFAULT_SETTINGS;
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persistSettings = useCallback(async (next: AlarmSettings) => {
    cachedSettings = next;
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      if (__DEV__) {
        console.warn('Alarm ayarları kaydedilemedi', error);
      }
    }
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<AlarmSettings>) => {
      const next: AlarmSettings = {
        ...cachedSettings,
        ...partial,
      };
      await persistSettings(next);
    },
    [persistSettings],
  );

  const resetSettings = useCallback(async () => {
    await persistSettings(DEFAULT_SETTINGS);
  }, [persistSettings]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      updateSettings,
      resetSettings,
    }),
    [loading, resetSettings, settings, updateSettings],
  );

  return <AlarmSettingsContext.Provider value={value}>{children}</AlarmSettingsContext.Provider>;
};

export const useAlarmSettings = () => {
  const context = useContext(AlarmSettingsContext);
  if (!context) {
    throw new Error('useAlarmSettings yalnızca AlarmSettingsProvider içinde kullanılabilir');
  }
  return context;
};


