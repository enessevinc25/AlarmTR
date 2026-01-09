import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureError } from '../utils/errorReporting';

const PENDING_ALARM_SESSION_CREATES_KEY = '@laststop/pendingAlarmSessionCreates';

export interface PendingAlarmSessionCreate {
  localSessionId: string;
  userId: string;
  payload: {
    targetType: 'STOP' | 'CUSTOM';
    targetId: string;
    distanceThresholdMeters: number;
    status: 'ACTIVE';
    targetName: string;
    targetLat: number;
    targetLon: number;
    transportMode?: string | null;
    minutesBefore?: number | null;
  };
  createdAt: number;
}

/**
 * Pending alarm session create request'lerini queue'ya ekler
 */
export async function addPendingAlarmSessionCreate(
  item: PendingAlarmSessionCreate
): Promise<void> {
  try {
    const existing = await getPendingAlarmSessionCreates();
    existing.push(item);
    await AsyncStorage.setItem(PENDING_ALARM_SESSION_CREATES_KEY, JSON.stringify(existing));
    if (__DEV__) {
      console.log('[offlineQueueService] Pending alarm session create eklendi:', item.localSessionId);
    }
  } catch (error) {
    captureError(error, 'offlineQueueService/addPendingAlarmSessionCreate');
    throw error;
  }
}

/**
 * Tüm pending alarm session create request'lerini döndürür
 */
export async function getPendingAlarmSessionCreates(): Promise<PendingAlarmSessionCreate[]> {
  try {
    const json = await AsyncStorage.getItem(PENDING_ALARM_SESSION_CREATES_KEY);
    if (!json) {
      return [];
    }
    return JSON.parse(json) as PendingAlarmSessionCreate[];
  } catch (error) {
    captureError(error, 'offlineQueueService/getPendingAlarmSessionCreates');
    return [];
  }
}

/**
 * Belirli bir localSessionId'ye sahip pending item'ı queue'dan kaldırır
 */
export async function removePendingAlarmSessionCreate(localSessionId: string): Promise<void> {
  try {
    const existing = await getPendingAlarmSessionCreates();
    const filtered = existing.filter((item) => item.localSessionId !== localSessionId);
    await AsyncStorage.setItem(PENDING_ALARM_SESSION_CREATES_KEY, JSON.stringify(filtered));
    if (__DEV__) {
      console.log('[offlineQueueService] Pending alarm session create kaldırıldı:', localSessionId);
    }
  } catch (error) {
    captureError(error, 'offlineQueueService/removePendingAlarmSessionCreate');
    throw error;
  }
}

/**
 * Tüm pending alarm session create request'lerini temizler
 */
export async function clearPendingAlarmSessionCreates(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_ALARM_SESSION_CREATES_KEY);
    if (__DEV__) {
      console.log('[offlineQueueService] Tüm pending alarm session creates temizlendi');
    }
  } catch (error) {
    captureError(error, 'offlineQueueService/clearPendingAlarmSessionCreates');
    throw error;
  }
}

/**
 * Local session ID'nin geçerli olup olmadığını kontrol eder (local- prefix'i ile başlıyorsa local'dir)
 */
export function isLocalSessionId(sessionId: string): boolean {
  return sessionId.startsWith('local-');
}

