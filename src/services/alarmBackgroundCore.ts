/**
 * Background Alarm Core - Network-Free Implementation
 * 
 * Bu modül background task içinde çalışır ve network/Firestore kullanmaz.
 * Sadece AsyncStorage, math, ve notification kullanır.
 * 
 * Firestore sync işlemleri alarmBackgroundSync.ts'de foreground'da yapılır.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDistanceInMeters } from '../utils/distance';
import { scheduleAlarmNotification } from './alarmService';
import {
  ACTIVE_ALARM_STORAGE_KEY,
  ActiveAlarmStateSnapshot,
} from '../context/AlarmContext';
import { diagLog } from './alarmDiagnostics';
import {
  updateAccuracyState,
  createAccuracyState,
  loadAccuracyState,
  saveAccuracyState,
  DEFAULT_ACC_CFG,
  type AccuracyState,
} from './alarmAccuracyEngine';
import { getFeatureFlag } from './featureFlags';

const PENDING_SYNC_EVENTS_KEY = '@laststop/pendingSyncEvents';
const HEARTBEAT_LOG_KEY = '@laststop/heartbeatLog';

export interface PendingSyncEvent {
  type: 'TRIGGERED' | 'DISTANCE_UPDATE';
  sessionId: string;
  timestamp: number;
  data: {
    triggeredAt?: number;
    lastKnownDistanceMeters?: number;
  };
}

interface HeartbeatLogEntry {
  timestamp: number;
  distance: number | null;
  accuracy: number | undefined;
  triggered: boolean;
}

/**
 * Background task'tan gelen konum güncellemesini işler.
 * Network kullanmaz, sadece lokal hesaplama ve notification yapar.
 */
export async function processBackgroundLocationUpdate(
  coords: { latitude: number; longitude: number; accuracy?: number },
): Promise<{ triggered: boolean; distance: number | null }> {
  try {
    // Snapshot'ı oku
    const snapshotJson = await AsyncStorage.getItem(ACTIVE_ALARM_STORAGE_KEY);
    if (!snapshotJson) {
      return { triggered: false, distance: null };
    }

    let snapshot: ActiveAlarmStateSnapshot;
    try {
      snapshot = JSON.parse(snapshotJson);
    } catch (parseError) {
      // Parse hatası: snapshot bozuk, skip et
      return { triggered: false, distance: null };
    }

    // Guard: TRIGGERED veya CANCELLED durumunda hemen çık
    if (snapshot.status === 'TRIGGERED' || snapshot.status === 'CANCELLED') {
      return { triggered: false, distance: null };
    }

    // Mesafe hesapla
    const distance = getDistanceInMeters(
      coords.latitude,
      coords.longitude,
      snapshot.targetLat,
      snapshot.targetLon,
    );

    if (!Number.isFinite(distance) || distance <= 0) {
      return { triggered: false, distance: null };
    }

    // Accuracy Engine: State yükle veya oluştur
    let accuracyState: AccuracyState | null = await loadAccuracyState(snapshot.sessionId);
    if (!accuracyState) {
      accuracyState = createAccuracyState(snapshot.sessionId);
    }

    // Accuracy Engine: Karar ver
    const nowMs = Date.now();
    const decision = updateAccuracyState(
      accuracyState,
      {
        nowMs,
        targetRadiusMeters: snapshot.distanceThresholdMeters,
        distanceMeters: distance,
        locationTimestampMs: coords.timestamp,
        accuracyMeters: coords.accuracy,
      },
      DEFAULT_ACC_CFG,
    );

    // State'i kaydet
    await saveAccuracyState(decision.nextState).catch(() => {
      // Ignore save errors
    });

    // Mesafeyi yuvarla (privacy: hassas veri yok)
    const distanceRounded = Math.round(distance / 10) * 10; // 10m'lik yuvarlama
    
    // Accuracy bucket (privacy: hassas sayı yok)
    let accuracyBucket: 'high' | 'mid' | 'low' = 'mid';
    if (coords.accuracy !== undefined) {
      if (coords.accuracy <= 20) {
        accuracyBucket = 'high';
      } else if (coords.accuracy > 50) {
        accuracyBucket = 'low';
      }
    }
    
    // Location timestamp age (eğer varsa)
    const locationAgeSec = coords.timestamp
      ? (nowMs - coords.timestamp) / 1000
      : 0;

    // Diagnostic: LOCATION_UPDATE
    diagLog(snapshot.sessionId, {
      level: 'info',
      type: 'LOCATION_UPDATE',
      data: {
        ageSec: locationAgeSec,
        accuracyBucket,
        acceptedSample,
        reason,
      },
    }).catch(() => {
      // Ignore diagnostic errors
    });

    // Diagnostic: DISTANCE_UPDATE
    diagLog(snapshot.sessionId, {
      level: 'info',
      type: 'DISTANCE_UPDATE',
      data: {
        distMetersRounded: distanceRounded,
        smoothedDistanceMeters: Math.round(smoothedDistanceMeters / 5) * 5, // 5m bucket
        isInside,
        insideStreak,
      },
    }).catch(() => {
      // Ignore diagnostic errors
    });

    // Heartbeat log (eski format korunuyor, backward compatibility için)
    logHeartbeat(snapshot.sessionId, distance, coords.accuracy, shouldTrigger);

    // Trigger kontrolü: Accuracy Engine kararına göre
    if (shouldTrigger) {
      // Idempotency: aynı alarm 2 kez tetiklenmesin
      // Status zaten guard'da kontrol edildi, burada sadece 'ACTIVE' olabilir
      // Ama yine de double-check yap (race condition için)
      if (snapshot.status !== 'ACTIVE') {
        return { triggered: false, distance };
      }

      // Notification gönder (Android: seconds:1 + channelId)
      await scheduleAlarmNotification({
        title: 'Durağa yaklaşıyorsun!',
        body: `${snapshot.targetName} durağına yaklaştın.`,
      });
      
      // Diagnostic: NOTIFICATION_FIRED
      diagLog(snapshot.sessionId, {
        level: 'info',
        type: 'NOTIFICATION_FIRED',
        msg: 'Alarm notification fired',
        data: {
          reason,
          smoothedDistanceMeters: Math.round(smoothedDistanceMeters / 5) * 5,
          insideStreak,
        },
      }).catch(() => {
        // Ignore diagnostic errors
      });

      // Snapshot'ı TRIGGERED olarak güncelle (lokal)
      const updatedSnapshot: ActiveAlarmStateSnapshot = {
        ...snapshot,
        status: 'TRIGGERED',
      };
      await AsyncStorage.setItem(ACTIVE_ALARM_STORAGE_KEY, JSON.stringify(updatedSnapshot));

      // Pending sync event ekle (foreground'da Firestore'a yazılacak)
      await addPendingSyncEvent({
        type: 'TRIGGERED',
        sessionId: snapshot.sessionId,
        timestamp: Date.now(),
        data: {
          triggeredAt: Date.now(),
        },
      });

      return { triggered: true, distance };
    } else {
      // Mesafe güncellemesi (throttle: sadece önemli değişikliklerde sync et)
      // Background'da her update'i sync etmek gereksiz, sadece önemli değişikliklerde
      const lastDistance = snapshot.lastKnownDistanceMeters;
      const distanceDiff = lastDistance !== undefined ? Math.abs(distance - lastDistance) : Infinity;
      
      // Önemli değişiklik: 50m'den fazla fark varsa sync et
      if (distanceDiff > 50) {
        await addPendingSyncEvent({
          type: 'DISTANCE_UPDATE',
          sessionId: snapshot.sessionId,
          timestamp: Date.now(),
          data: {
            lastKnownDistanceMeters: distance,
          },
        });
      }

      // Snapshot'ı güncelle (lokal)
      const updatedSnapshot: ActiveAlarmStateSnapshot = {
        ...snapshot,
        lastKnownDistanceMeters: distance,
      };
      await AsyncStorage.setItem(ACTIVE_ALARM_STORAGE_KEY, JSON.stringify(updatedSnapshot));

      return { triggered: false, distance };
    }
  } catch (error) {
    // Background task'ta error handling: sadece log, crash etme
    // Sentry'ye göndermek için captureError kullanabiliriz ama network gerektirir
    // Bu yüzden sadece AsyncStorage'a log yaz
    await logError('processBackgroundLocationUpdate', error);
    return { triggered: false, distance: null };
  }
}

/**
 * Pending sync event ekle (foreground'da Firestore'a yazılacak)
 */
async function addPendingSyncEvent(event: PendingSyncEvent): Promise<void> {
  try {
    const existingJson = await AsyncStorage.getItem(PENDING_SYNC_EVENTS_KEY);
    const existing: PendingSyncEvent[] = existingJson ? JSON.parse(existingJson) : [];
    
    // Duplicate kontrolü: aynı sessionId + type için son 5 dakika içinde event varsa skip et
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const isDuplicate = existing.some(
      (e) =>
        e.sessionId === event.sessionId &&
        e.type === event.type &&
        e.timestamp > fiveMinutesAgo,
    );
    
    if (!isDuplicate) {
      existing.push(event);
      // Son 100 event'i tut (memory limit)
      const trimmed = existing.slice(-100);
      await AsyncStorage.setItem(PENDING_SYNC_EVENTS_KEY, JSON.stringify(trimmed));
    }
  } catch (error) {
    // AsyncStorage hatası: skip et, crash etme
    await logError('addPendingSyncEvent', error);
  }
}

/**
 * Heartbeat log (diagnostics için)
 */
async function logHeartbeat(
  sessionId: string,
  distance: number | null,
  accuracy: number | undefined,
  triggered: boolean,
): Promise<void> {
  try {
    const entry: HeartbeatLogEntry = {
      timestamp: Date.now(),
      distance,
      accuracy,
      triggered,
    };
    
    const existingJson = await AsyncStorage.getItem(HEARTBEAT_LOG_KEY);
    const existing: HeartbeatLogEntry[] = existingJson ? JSON.parse(existingJson) : [];
    
    existing.push(entry);
    // Son 200 entry'yi tut
    const trimmed = existing.slice(-200);
    await AsyncStorage.setItem(HEARTBEAT_LOG_KEY, JSON.stringify(trimmed));
  } catch (error) {
    // Log hatası: skip et
  }
}

/**
 * Error log (diagnostics için)
 */
async function logError(context: string, error: any): Promise<void> {
  try {
    const errorLogKey = '@laststop/errorLog';
    const entry = {
      timestamp: Date.now(),
      context,
      error: error?.message || String(error),
    };
    
    const existingJson = await AsyncStorage.getItem(errorLogKey);
    const existing: any[] = existingJson ? JSON.parse(existingJson) : [];
    
    existing.push(entry);
    // Son 50 error'u tut
    const trimmed = existing.slice(-50);
    await AsyncStorage.setItem(errorLogKey, JSON.stringify(trimmed));
  } catch {
    // Error log hatası: skip et
  }
}

/**
 * Pending sync events'i oku (foreground sync için)
 */
export async function getPendingSyncEvents(): Promise<PendingSyncEvent[]> {
  try {
    const json = await AsyncStorage.getItem(PENDING_SYNC_EVENTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

/**
 * Pending sync events'i temizle (sync tamamlandıktan sonra)
 */
export async function clearPendingSyncEvents(eventsToRemove: PendingSyncEvent[]): Promise<void> {
  try {
    const existing = await getPendingSyncEvents();
    const eventIds = new Set(
      eventsToRemove.map((e) => `${e.sessionId}:${e.type}:${e.timestamp}`),
    );
    const filtered = existing.filter(
      (e) => !eventIds.has(`${e.sessionId}:${e.type}:${e.timestamp}`),
    );
    await AsyncStorage.setItem(PENDING_SYNC_EVENTS_KEY, JSON.stringify(filtered));
  } catch {
    // Clear hatası: skip et
  }
}

/**
 * Heartbeat log'u oku (diagnostics için)
 */
export async function getHeartbeatLog(): Promise<HeartbeatLogEntry[]> {
  try {
    const json = await AsyncStorage.getItem(HEARTBEAT_LOG_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

