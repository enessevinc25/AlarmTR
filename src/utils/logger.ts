/**
 * Production Logger (P0)
 * 
 * Prod'da debug spam yok ama kritik hatalar yakalanıp raporlanabilir.
 * Son 200 log ring buffer AsyncStorage'da tutulur.
 * PII yok: email, tam konum, adres, userId yazma.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Application from 'expo-application';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  t: number; // Date.now()
  level: LogLevel;
  message: string;
  data?: Record<string, any>; // sanitized
}

const MAX_LOGS = 200;
const LOG_STORAGE_KEY = 'app_logs_ring';

// Ring buffer: son MAX_LOGS log
let logBuffer: LogEntry[] = [];
let bufferLoaded = false;

/**
 * Data sanitize: PII ve hassas veri temizle
 */
function sanitize(data: any): Record<string, any> | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const sanitized: Record<string, any> = {};
  const keysToDrop = [
    'email',
    'userId',
    'userEmail',
    'password',
    'token',
    'apiKey',
    'latitude',
    'longitude',
    'lat',
    'lon',
    'address',
    'fullAddress',
    'phoneNumber',
    'phone',
  ];

  for (const [key, value] of Object.entries(data)) {
    // Hassas alanları drop et
    if (keysToDrop.some((dropKey) => key.toLowerCase().includes(dropKey.toLowerCase()))) {
      continue;
    }

    // String uzunluğunu sınırla
    if (typeof value === 'string' && value.length > 300) {
      sanitized[key] = value.substring(0, 300) + '...';
    } else if (typeof value === 'object' && value !== null) {
      // Nested object'leri recursive sanitize et (max depth 2)
      try {
        const nested = sanitize(value);
        if (nested && Object.keys(nested).length > 0) {
          sanitized[key] = nested;
        }
      } catch {
        // Sanitize hatası: skip
      }
    } else {
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Ring buffer'a log ekle ve persist et
 */
async function addToBuffer(entry: LogEntry): Promise<void> {
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer = logBuffer.slice(-MAX_LOGS);
  }

  // AsyncStorage'a persist et (throttle: her log'ta yazma, batch yap)
  try {
    await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logBuffer));
  } catch (error) {
    // Log persist hatası: ignore (log yazamıyoruz, log yazamayız)
    if (__DEV__) {
      console.warn('[logger] Failed to persist log:', error);
    }
  }
}

/**
 * Log buffer'ı yükle
 */
async function loadBuffer(): Promise<void> {
  if (bufferLoaded) {
    return;
  }

  try {
    const raw = await AsyncStorage.getItem(LOG_STORAGE_KEY);
    if (raw) {
      logBuffer = JSON.parse(raw) as LogEntry[];
      // MAX_LOGS'u aşmışsa trim et
      if (logBuffer.length > MAX_LOGS) {
        logBuffer = logBuffer.slice(-MAX_LOGS);
        await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logBuffer));
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[logger] Failed to load log buffer:', error);
    }
    logBuffer = [];
  }
  bufferLoaded = true;
}

/**
 * Log yaz
 */
export async function log(level: LogLevel, message: string, data?: any): Promise<void> {
  // Prod'da debug logları kapalı
  if (level === 'debug' && !__DEV__) {
    return;
  }

  // Buffer'ı yükle (ilk çağrıda)
  if (!bufferLoaded) {
    await loadBuffer();
  }

  const entry: LogEntry = {
    t: Date.now(),
    level,
    message,
    data: data ? sanitize(data) : undefined,
  };

  // Ring buffer'a ekle
  await addToBuffer(entry);

  // __DEV__ ise console'a bas
  if (__DEV__) {
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    if (data) {
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data);
    } else {
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`);
    }
  } else {
    // Prod'da sadece error console'a bas
    if (level === 'error') {
      console.error(`[ERROR] ${message}`, data ? sanitize(data) : '');
    }
  }
}

/**
 * Son logları okunabilir metne çevir
 */
export async function getRecentLogsText(): Promise<string> {
  if (!bufferLoaded) {
    await loadBuffer();
  }

  const lines: string[] = [];
  lines.push('=== APPLICATION LOGS ===');
  lines.push('');

  // App info
  const appVersion = Application.nativeApplicationVersion || 'unknown';
  const buildNumber = Application.nativeBuildVersion || 'unknown';
  lines.push(`App Version: ${appVersion} (${buildNumber})`);
  lines.push(`Platform: ${Platform.OS} ${Platform.Version}`);
  lines.push('');

  // Logs
  const recentLogs = logBuffer.slice(-50); // Son 50 log
  if (recentLogs.length === 0) {
    lines.push('No logs available.');
  } else {
    lines.push(`Showing last ${recentLogs.length} of ${logBuffer.length} logs:`);
    lines.push('');
    recentLogs.forEach((entry) => {
      const timeStr = new Date(entry.t).toISOString();
      const levelStr = entry.level.toUpperCase().padEnd(5);
      lines.push(`[${timeStr}] ${levelStr} ${entry.message}`);
      if (entry.data && Object.keys(entry.data).length > 0) {
        lines.push(`  Data: ${JSON.stringify(entry.data, null, 2)}`);
      }
    });
  }
  lines.push('');
  lines.push('=== END ===');

  return lines.join('\n');
}

/**
 * Log buffer'ı temizle
 */
export async function clearLogs(): Promise<void> {
  logBuffer = [];
  bufferLoaded = true;
  try {
    await AsyncStorage.removeItem(LOG_STORAGE_KEY);
  } catch (error) {
    if (__DEV__) {
      console.warn('[logger] Failed to clear logs:', error);
    }
  }
}

/**
 * Convenience functions
 */
export const logger = {
  debug: (message: string, data?: any) => log('debug', message, data),
  info: (message: string, data?: any) => log('info', message, data),
  warn: (message: string, data?: any) => log('warn', message, data),
  error: (message: string, data?: any) => log('error', message, data),
};
