import AsyncStorage from '@react-native-async-storage/async-storage';

const CRASH_LOG_KEY = '@laststop/lastCrash';

export type CrashLogEntry = {
  ts: number;
  name?: string;
  message: string;
  stack?: string;
  isFatal?: boolean;
  extra?: Record<string, any>;
};

/**
 * Crash log entry'sini AsyncStorage'a yazar.
 * @param entry Crash log entry
 */
export async function writeCrashLog(entry: CrashLogEntry): Promise<void> {
  try {
    const entryToSave: CrashLogEntry = {
      ...entry,
      ts: entry.ts || Date.now(),
    };
    await AsyncStorage.setItem(CRASH_LOG_KEY, JSON.stringify(entryToSave));
  } catch (error) {
    // AsyncStorage hatası olsa bile uygulamayı çalıştırmaya devam et
    if (__DEV__) {
      console.warn('[crashLog] writeCrashLog hatası:', error);
    }
  }
}

/**
 * Son crash log entry'sini AsyncStorage'dan okur.
 * @returns Crash log entry veya null
 */
export async function readCrashLog(): Promise<CrashLogEntry | null> {
  try {
    const json = await AsyncStorage.getItem(CRASH_LOG_KEY);
    if (!json) {
      return null;
    }
    const entry = JSON.parse(json) as CrashLogEntry;
    return entry;
  } catch (error) {
    if (__DEV__) {
      console.warn('[crashLog] readCrashLog hatası:', error);
    }
    return null;
  }
}

/**
 * Crash log entry'sini AsyncStorage'dan siler.
 */
export async function clearCrashLog(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CRASH_LOG_KEY);
  } catch (error) {
    if (__DEV__) {
      console.warn('[crashLog] clearCrashLog hatası:', error);
    }
  }
}

