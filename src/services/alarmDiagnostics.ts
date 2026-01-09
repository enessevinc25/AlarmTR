import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { captureError } from '../utils/errorReporting';
import { ACTIVE_ALARM_STORAGE_KEY, ActiveAlarmStateSnapshot } from '../context/AlarmContext';

export type DiagLevel = 'info' | 'warn' | 'error';

export type DiagEventType =
  | 'SESSION_START'
  | 'SESSION_STOP'
  | 'PERMISSIONS_SNAPSHOT'
  | 'TASK_REGISTERED'
  | 'TASK_TICK'
  | 'GEOFENCE_EVENT'
  | 'LOCATION_UPDATE'
  | 'DISTANCE_UPDATE'
  | 'NOTIFICATION_SCHEDULED'
  | 'NOTIFICATION_FIRED'
  | 'WARNING_BATTERY_OPTIMIZATION'
  | 'WARNING_BG_PERMISSION'
  | 'ERROR';

export interface DiagEvent {
  t: number; // Date.now()
  level: DiagLevel;
  type: DiagEventType;
  msg?: string;
  data?: Record<string, any>; // sadece teknik meta
}

export interface AlarmDiagSession {
  sessionId: string;
  startedAt: number;
  lastUpdatedAt: number;
  events: DiagEvent[]; // ring buffer
  counters: Record<string, number>; // tickCount, locationCount...
  snapshot?: Record<string, any>; // permissions + device + app info
}

const MAX_EVENTS = 200;
const DIAG_STORAGE_PREFIX = 'alarm_diag_session_';
const LAST_SESSION_ID_KEY = 'alarm_diag_last_session_id';

// Throttle için: son persist zamanı
let lastPersistTime: Record<string, number> = {};
const PERSIST_THROTTLE_MS = 2000; // 2 saniye

// Memory'de pending events (throttle sırasında)
let pendingEvents: Record<string, DiagEvent[]> = {};

/**
 * Ring buffer uygula: MAX_EVENTS'ten fazla event varsa en eskileri sil
 */
function applyRingBuffer(events: DiagEvent[]): DiagEvent[] {
  if (events.length <= MAX_EVENTS) {
    return events;
  }
  // En eski event'leri sil
  return events.slice(-MAX_EVENTS);
}

/**
 * Session'ı AsyncStorage'dan yükle
 */
async function loadSession(sessionId: string): Promise<AlarmDiagSession | null> {
  try {
    const key = `${DIAG_STORAGE_PREFIX}${sessionId}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AlarmDiagSession;
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmDiagnostics] Load session failed:', error);
    }
    captureError(error, 'alarmDiagnostics/loadSession');
    return null;
  }
}

/**
 * Session'ı AsyncStorage'a kaydet (throttle uygula)
 */
async function persistSession(session: AlarmDiagSession, force = false): Promise<void> {
  try {
    const now = Date.now();
    const lastPersist = lastPersistTime[session.sessionId] || 0;
    
    // Throttle kontrolü
    if (!force && now - lastPersist < PERSIST_THROTTLE_MS) {
      // Throttle: pending events'e ekle, persist etme
      if (!pendingEvents[session.sessionId]) {
        pendingEvents[session.sessionId] = [];
      }
      // Bu event zaten session.events'e eklenmiş, sadece persist'i geciktiriyoruz
      return;
    }

    // Pending events varsa onları da ekle
    if (pendingEvents[session.sessionId] && pendingEvents[session.sessionId].length > 0) {
      session.events = [...session.events, ...pendingEvents[session.sessionId]];
      session.events = applyRingBuffer(session.events);
      pendingEvents[session.sessionId] = [];
    }

    const key = `${DIAG_STORAGE_PREFIX}${session.sessionId}`;
    await AsyncStorage.setItem(key, JSON.stringify(session));
    lastPersistTime[session.sessionId] = now;
    
    // Last session ID'yi güncelle
    await AsyncStorage.setItem(LAST_SESSION_ID_KEY, session.sessionId);
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmDiagnostics] Persist session failed:', error);
    }
    captureError(error, 'alarmDiagnostics/persistSession');
  }
}

/**
 * Snapshot oluştur: app, device, permissions, alarm config
 */
async function createSnapshot(sessionId: string): Promise<Record<string, any>> {
  try {
    // App info
    const appVersion = Application.nativeApplicationVersion || 'unknown';
    const buildNumber = Application.nativeBuildVersion || 'unknown';

    // Device info
    const platform = Platform.OS;
    const osVersion = Device.osVersion || 'unknown';
    const modelName = Device.modelName || 'unknown';
    const manufacturer = Device.manufacturer || 'unknown';

    // Permissions
    const [notifPerms, fgLocationPerms, bgLocationPerms] = await Promise.all([
      Notifications.getPermissionsAsync().catch(() => ({ granted: false, canAskAgain: false })),
      Location.getForegroundPermissionsAsync().catch(() => ({ status: 'denied' as const, canAskAgain: false })),
      Location.getBackgroundPermissionsAsync().catch(() => ({ status: 'denied' as const, canAskAgain: false })),
    ]);

    // Alarm config (AsyncStorage'dan aktif alarm snapshot'ını oku)
    let alarmConfig: Record<string, any> = {};
    try {
      const raw = await AsyncStorage.getItem(ACTIVE_ALARM_STORAGE_KEY);
      if (raw) {
        const snapshot: ActiveAlarmStateSnapshot = JSON.parse(raw);
        alarmConfig = {
          targetId: snapshot.targetId,
          radiusMeters: snapshot.distanceThresholdMeters,
          targetType: snapshot.targetType,
        };
      }
    } catch (e) {
      // Ignore
    }

    return {
      app: {
        appVersion,
        buildNumber,
      },
      device: {
        platform,
        osVersion,
        modelName,
        manufacturer,
      },
      permissions: {
        notifications: {
          granted: notifPerms.granted || notifPerms.status === 'granted',
          canAskAgain: notifPerms.canAskAgain ?? true,
        },
        locationForeground: {
          status: fgLocationPerms.status,
          canAskAgain: fgLocationPerms.canAskAgain ?? true,
        },
        locationBackground: {
          status: bgLocationPerms.status,
          canAskAgain: bgLocationPerms.canAskAgain ?? true,
        },
      },
      alarmConfig,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmDiagnostics] Create snapshot failed:', error);
    }
    captureError(error, 'alarmDiagnostics/createSnapshot');
    return {};
  }
}

/**
 * Diagnostic session başlat
 */
export async function diagStart(sessionId: string): Promise<void> {
  // Feature flag kontrolü: enableDiagnostics
  const enableDiagnostics = await getFeatureFlag('enableDiagnostics', true);
  if (!enableDiagnostics) {
    return; // No-op if disabled
  }
  try {
    const snapshot = await createSnapshot(sessionId);
    const now = Date.now();
    
    const session: AlarmDiagSession = {
      sessionId,
      startedAt: now,
      lastUpdatedAt: now,
      events: [],
      counters: {
        tickCount: 0,
        locationCount: 0,
        distanceCount: 0,
        errorCount: 0,
      },
      snapshot,
    };

    // SESSION_START event ekle
    session.events.push({
      t: now,
      level: 'info',
      type: 'SESSION_START',
      msg: 'Alarm session started',
    });

    // PERMISSIONS_SNAPSHOT event ekle
    session.events.push({
      t: now,
      level: 'info',
      type: 'PERMISSIONS_SNAPSHOT',
      data: snapshot.permissions,
    });

    await persistSession(session, true); // Force persist on start
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmDiagnostics] diagStart failed:', error);
    }
    captureError(error, 'alarmDiagnostics/diagStart');
  }
}

/**
 * Diagnostic session durdur
 */
export async function diagStop(sessionId: string, reason: string): Promise<void> {
  // Feature flag kontrolü: enableDiagnostics
  const enableDiagnostics = await getFeatureFlag('enableDiagnostics', true);
  if (!enableDiagnostics) {
    return; // No-op if disabled
  }
  try {
    const session = await loadSession(sessionId);
    if (!session) {
      return;
    }

    session.events.push({
      t: Date.now(),
      level: 'info',
      type: 'SESSION_STOP',
      msg: `Session stopped: ${reason}`,
      data: { reason },
    });

    session.lastUpdatedAt = Date.now();
    await persistSession(session, true); // Force persist on stop
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmDiagnostics] diagStop failed:', error);
    }
    captureError(error, 'alarmDiagnostics/diagStop');
  }
}

/**
 * Diagnostic event logla
 */
export async function diagLog(sessionId: string, event: Omit<DiagEvent, 't'>): Promise<void> {
  try {
    let session = await loadSession(sessionId);
    if (!session) {
      // Session yoksa oluştur (geç başlatma durumu)
      await diagStart(sessionId);
      session = await loadSession(sessionId);
      if (!session) {
        return;
      }
    }

    const fullEvent: DiagEvent = {
      ...event,
      t: Date.now(),
    };

    session.events.push(fullEvent);
    session.events = applyRingBuffer(session.events);
    session.lastUpdatedAt = fullEvent.t;

    // Counter'ları güncelle
    if (event.type === 'TASK_TICK') {
      session.counters.tickCount = (session.counters.tickCount || 0) + 1;
    } else if (event.type === 'LOCATION_UPDATE') {
      session.counters.locationCount = (session.counters.locationCount || 0) + 1;
    } else if (event.type === 'DISTANCE_UPDATE') {
      session.counters.distanceCount = (session.counters.distanceCount || 0) + 1;
    } else if (event.type === 'ERROR' || event.level === 'error') {
      session.counters.errorCount = (session.counters.errorCount || 0) + 1;
    }

    await persistSession(session, false); // Throttle uygula
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmDiagnostics] diagLog failed:', error);
    }
    captureError(error, 'alarmDiagnostics/diagLog');
  }
}

/**
 * Diagnostic session'ı getir
 */
export async function diagGet(sessionId: string): Promise<AlarmDiagSession | null> {
  return loadSession(sessionId);
}

/**
 * Aktif alarm session ID'sini AsyncStorage'dan oku
 */
export async function getActiveAlarmSessionId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_ALARM_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const snapshot: ActiveAlarmStateSnapshot = JSON.parse(raw);
    return snapshot.sessionId || null;
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmDiagnostics] getActiveAlarmSessionId failed:', error);
    }
    return null;
  }
}

/**
 * Son session ID'sini getir
 */
export async function getLastSessionId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SESSION_ID_KEY);
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmDiagnostics] getLastSessionId failed:', error);
    }
    return null;
  }
}

/**
 * Diagnostic summary oluştur (okunabilir metin)
 */
export async function diagSummarize(sessionId: string): Promise<string> {
  try {
    const session = await loadSession(sessionId);
    if (!session) {
      return `Diagnostic session not found: ${sessionId}`;
    }

    const lines: string[] = [];
    lines.push('=== ALARM DIAGNOSTIC SUMMARY ===');
    lines.push('');
    
    // App & Device
    if (session.snapshot?.app) {
      lines.push(`App Version: ${session.snapshot.app.appVersion} (${session.snapshot.app.buildNumber})`);
    }
    if (session.snapshot?.device) {
      lines.push(`Device: ${session.snapshot.device.manufacturer} ${session.snapshot.device.modelName}`);
      lines.push(`Platform: ${session.snapshot.device.platform} ${session.snapshot.device.osVersion}`);
    }
    lines.push('');

    // Permissions
    if (session.snapshot?.permissions) {
      lines.push('=== PERMISSIONS ===');
      const perms = session.snapshot.permissions;
      lines.push(`Notifications: ${perms.notifications?.granted ? 'GRANTED' : 'DENIED'} (canAskAgain: ${perms.notifications?.canAskAgain})`);
      lines.push(`Location FG: ${perms.locationForeground?.status} (canAskAgain: ${perms.locationForeground?.canAskAgain})`);
      lines.push(`Location BG: ${perms.locationBackground?.status} (canAskAgain: ${perms.locationBackground?.canAskAgain})`);
      lines.push('');
    }

    // Counters
    lines.push('=== COUNTERS ===');
    lines.push(`Tick Count: ${session.counters.tickCount || 0}`);
    lines.push(`Location Updates: ${session.counters.locationCount || 0}`);
    lines.push(`Distance Updates: ${session.counters.distanceCount || 0}`);
    lines.push(`Errors: ${session.counters.errorCount || 0}`);
    lines.push('');

    // Session timing
    const durationMs = session.lastUpdatedAt - session.startedAt;
    const durationSec = Math.round(durationMs / 1000);
    lines.push(`Session Duration: ${durationSec}s`);
    lines.push(`Started: ${new Date(session.startedAt).toISOString()}`);
    lines.push(`Last Updated: ${new Date(session.lastUpdatedAt).toISOString()}`);
    lines.push('');

    // Last 10 events
    lines.push('=== LAST 10 EVENTS ===');
    const lastEvents = session.events.slice(-10);
    lastEvents.forEach((event) => {
      const timeStr = new Date(event.t).toISOString();
      const levelStr = event.level.toUpperCase().padEnd(5);
      lines.push(`[${timeStr}] ${levelStr} ${event.type}${event.msg ? `: ${event.msg}` : ''}`);
      if (event.data && Object.keys(event.data).length > 0) {
        lines.push(`  Data: ${JSON.stringify(event.data)}`);
      }
    });
    lines.push('');
    lines.push('=== END ===');

    return lines.join('\n');
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmDiagnostics] diagSummarize failed:', error);
    }
    captureError(error, 'alarmDiagnostics/diagSummarize');
    return `Error generating summary: ${error}`;
  }
}

/**
 * Diagnostic session'ı temizle
 */
export async function diagClear(sessionId: string): Promise<void> {
  try {
    const key = `${DIAG_STORAGE_PREFIX}${sessionId}`;
    await AsyncStorage.removeItem(key);
    delete lastPersistTime[sessionId];
    delete pendingEvents[sessionId];
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmDiagnostics] diagClear failed:', error);
    }
    captureError(error, 'alarmDiagnostics/diagClear');
  }
}

/**
 * Tüm diagnostic session'ları temizle
 */
export async function diagClearAll(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const diagKeys = keys.filter((key) => key.startsWith(DIAG_STORAGE_PREFIX));
    await AsyncStorage.multiRemove(diagKeys);
    await AsyncStorage.removeItem(LAST_SESSION_ID_KEY);
    lastPersistTime = {};
    pendingEvents = {};
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmDiagnostics] diagClearAll failed:', error);
    }
    captureError(error, 'alarmDiagnostics/diagClearAll');
  }
}
