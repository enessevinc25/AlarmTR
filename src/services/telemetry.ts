/**
 * Telemetry Service - Centralized app event logging
 * 
 * PII-free logging: no email, userId, coordinates, full addresses, or full query text.
 * Ring buffer: max 1500 events (JSONL format)
 * Write throttle: flush every 2000ms
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform, AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import { captureError } from '../utils/errorReporting';
import { getGoogleMapsNativeKey } from '../utils/env';

export type TelemetryLevel = 'debug' | 'info' | 'warn' | 'error';

export type TelemetryEventName =
  | 'APP_LAUNCH'
  | 'APP_READY'
  | 'APP_BACKGROUND'
  | 'APP_FOREGROUND'
  | 'AUTH_STATE'
  | 'SCREEN_VIEW'
  | 'NAV_ACTION'
  | 'MAP_MOUNT'
  | 'MAP_READY'
  | 'MAP_ERROR'
  | 'MAP_REGION_CHANGE'
  | 'MAP_MARKERS_RENDER'
  | 'STOP_SEARCH_OPEN'
  | 'STOP_SEARCH_INPUT'
  | 'STOP_SEARCH_SUBMIT'
  | 'STOP_SEARCH_RESULTS'
  | 'STOP_SEARCH_ERROR'
  | 'LINE_SEARCH_INPUT'
  | 'LINE_SEARCH_SUBMIT'
  | 'LINE_SEARCH_RESULTS'
  | 'LINE_SEARCH_ERROR'
  | 'FAVORITES_LOAD'
  | 'FAVORITE_ADD'
  | 'FAVORITE_REMOVE'
  | 'FAVORITES_ERROR'
  | 'STOP_PICK_FROM_MAP'
  | 'STOP_PICK_FROM_LIST'
  | 'QUICK_ALARM_OPEN'
  | 'QUICK_ALARM_START'
  | 'ALARM_SESSION_START'
  | 'ALARM_SESSION_ACTIVE'
  | 'ALARM_SESSION_STOP'
  | 'TRACKING_START'
  | 'TRACKING_STOP'
  | 'GEOFENCE_START'
  | 'GEOFENCE_STOP'
  | 'LOCATION_TASK_TICK'
  | 'LOCATION_UPDATE'
  | 'DISTANCE_UPDATE'
  | 'TRIGGER_DECISION'
  | 'ALARM_TRIGGERED'
  | 'PERMISSIONS_SNAPSHOT'
  | 'PERMISSION_WARNING'
  | 'FIRESTORE_READ'
  | 'FIRESTORE_WRITE'
  | 'API_REQUEST'
  | 'API_RESPONSE'
  | 'ERROR_CAUGHT';

export interface TelemetryEvent {
  t: number; // Date.now()
  iso: string; // new Date().toISOString()
  level: TelemetryLevel;
  name: TelemetryEventName;
  sessionId: string; // app session id (uuid)
  alarmSessionId?: string; // optional alarm session id
  screen?: string; // current route
  actionId: number; // incremental
  durationMs?: number; // optional
  data?: Record<string, any>; // sanitized meta
}

const MAX_EVENTS = 1500;
const STORAGE_KEY = '@laststop/telemetry_events_v1';
const FLUSH_THROTTLE_MS = 2000;

// State
let appSessionId: string = '';
let actionId: number = 0;
let currentScreen: string = '';
let alarmSessionId: string | undefined = undefined;
let eventQueue: TelemetryEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

/**
 * Generate UUID v4 (simple implementation)
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Simple hash function (FNV-1a) for query hashing
 * Not cryptographically secure, but good enough for telemetry
 */
function simpleHash(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Sanitize data: remove PII and sensitive information
 */
function sanitize(data: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const sanitized: Record<string, any> = {};
  const dropKeys = [
    'email',
    'userId',
    'uid',
    'lat',
    'lng',
    'latitude',
    'longitude',
    'address',
    'fullText',
    'queryRaw',
    'fullAddress',
    'phoneNumber',
    'phone',
    'token',
    'apiKey',
    'password',
  ];

  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();

    // Drop sensitive keys
    if (dropKeys.some((dropKey) => keyLower.includes(dropKey.toLowerCase()))) {
      continue;
    }

    // Handle query-like fields
    if (keyLower.includes('query') && typeof value === 'string') {
      sanitized[`${key}Len`] = value.length;
      sanitized[`${key}Hash`] = simpleHash(value + 'telemetry_salt_2024');
      continue;
    }

    // Handle stopId-like fields (hash them)
    // But don't hash if it's already a hash (e.g., stopIdHash)
    if (keyLower.includes('stopid') && typeof value === 'string' && !keyLower.includes('hash')) {
      sanitized[`${key}Hash`] = simpleHash(value);
      continue;
    }
    
    // If it's already a hash (like stopIdHash), keep it as is (don't double-hash)
    if (keyLower.includes('stopid') && keyLower.includes('hash') && typeof value === 'string') {
      sanitized[key] = value;
      continue;
    }

    // Handle distance/accuracy rounding
    if (key === 'distanceMeters' && typeof value === 'number') {
      sanitized[key] = Math.round(value / 10) * 10; // Round to 10m
      continue;
    }

    if (key === 'accuracyMeters' && typeof value === 'number') {
      // Bucket: high (<25), mid (25-80), low (>80)
      if (value < 25) {
        sanitized[key] = 'high';
      } else if (value <= 80) {
        sanitized[key] = 'mid';
      } else {
        sanitized[key] = 'low';
      }
      continue;
    }

    // String max length
    if (typeof value === 'string' && value.length > 200) {
      sanitized[key] = value.substring(0, 200) + '...';
      continue;
    }

    // Nested objects (max depth 2)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      try {
        const nested = sanitize(value);
        if (nested && Object.keys(nested).length > 0) {
          sanitized[key] = nested;
        }
      } catch {
        // Skip nested sanitization errors
      }
      continue;
    }

    // Arrays: sanitize first 10 items
    if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, 10).map((item) => {
        if (typeof item === 'object' && item !== null) {
          return sanitize(item);
        }
        return typeof item === 'string' && item.length > 200
          ? item.substring(0, 200) + '...'
          : item;
      });
      continue;
    }

    // Default: keep as is
    sanitized[key] = value;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Load events from AsyncStorage
 */
async function loadEvents(): Promise<TelemetryEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const events = JSON.parse(raw) as TelemetryEvent[];
    // Ensure ring buffer limit
    return events.slice(-MAX_EVENTS);
  } catch (error) {
    if (__DEV__) {
      console.warn('[telemetry] Load events failed:', error);
    }
    captureError(error, 'telemetry/loadEvents');
    return [];
  }
}

/**
 * Save events to AsyncStorage (throttled)
 */
async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) {
    return;
  }

  try {
    const existing = await loadEvents();
    const combined = [...existing, ...eventQueue].slice(-MAX_EVENTS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
    eventQueue = [];
  } catch (error) {
    if (__DEV__) {
      console.warn('[telemetry] Flush events failed:', error);
    }
    captureError(error, 'telemetry/flushEvents');
  }
}

/**
 * Schedule flush (throttled)
 */
function scheduleFlush(): void {
  if (flushTimer) {
    return; // Already scheduled
  }

  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents().catch(() => {
      // Ignore flush errors
    });
  }, FLUSH_THROTTLE_MS) as ReturnType<typeof setTimeout>;
}

/**
 * Initialize telemetry
 */
export function telemetryInit(): void {
  if (initialized) {
    return;
  }

  appSessionId = generateUUID();
  actionId = 0;
  eventQueue = [];
  initialized = true;

  // Load existing events
  loadEvents().catch(() => {
    // Ignore load errors
  });

  // Log APP_LAUNCH
  logEvent('APP_LAUNCH', {
    platform: Platform.OS,
    appVersion: Application.nativeApplicationVersion || 'unknown',
    buildNumber: Application.nativeBuildVersion || 'unknown',
  });
}

/**
 * Set current screen name
 */
export function setCurrentScreen(screenName: string): void {
  currentScreen = screenName;
}

/**
 * Set alarm session ID
 */
export function setAlarmSessionId(sessionId?: string): void {
  alarmSessionId = sessionId;
}

/**
 * Log event
 */
export function logEvent(
  name: TelemetryEventName,
  data?: Record<string, any>,
  level: TelemetryLevel = 'info',
): void {
  if (!initialized) {
    telemetryInit();
  }

  actionId++;

  const event: TelemetryEvent = {
    t: Date.now(),
    iso: new Date().toISOString(),
    level,
    name,
    sessionId: appSessionId,
    alarmSessionId,
    screen: currentScreen || undefined,
    actionId,
    data: sanitize(data),
  };

  eventQueue.push(event);

  // Ring buffer: keep only last MAX_EVENTS in queue
  if (eventQueue.length > MAX_EVENTS) {
    eventQueue = eventQueue.slice(-MAX_EVENTS);
  }

  scheduleFlush();

  // Debug logging
  if (__DEV__ && level === 'error') {
    console.error(`[telemetry] ${name}`, data);
  }
}

/**
 * Force flush telemetry
 */
export async function flushTelemetry(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flushEvents();
}

/**
 * Clear all telemetry
 */
export async function clearTelemetry(): Promise<void> {
  eventQueue = [];
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    if (__DEV__) {
      console.warn('[telemetry] Clear failed:', error);
    }
  }
}

/**
 * Get permissions snapshot
 */
async function getPermissionsSnapshot(): Promise<Record<string, any>> {
  try {
    const [notifPerms, fgLocationPerms, bgLocationPerms] = await Promise.all([
      Notifications.getPermissionsAsync().catch(() => ({ granted: false })),
      Location.getForegroundPermissionsAsync().catch(() => ({ status: 'denied' as const })),
      Location.getBackgroundPermissionsAsync().catch(() => ({ status: 'denied' as const })),
    ]);

    return {
      notifications: {
        granted: notifPerms.granted || ('status' in notifPerms && notifPerms.status === 'granted'),
      },
      locationForeground: {
        status: fgLocationPerms.status,
      },
      locationBackground: {
        status: bgLocationPerms.status,
      },
    };
  } catch (error) {
    return {};
  }
}

/**
 * Get Google Maps key status
 */
function getMapsKeyStatus(): Record<string, boolean> {
  try {
    const extra = (Constants.expoConfig?.extra as any) ?? {};
    return {
      hasAndroidKey: extra.hasGoogleMapsAndroidKey ?? false,
      hasIOSKey: extra.hasGoogleMapsIOSKey ?? false,
      hasWebKey: extra.hasGoogleWebKey ?? false,
    };
  } catch {
    return {
      hasAndroidKey: false,
      hasIOSKey: false,
      hasWebKey: false,
    };
  }
}

/**
 * Get telemetry bundle text
 */
export async function getTelemetryBundleText(opts?: {
  includeJsonl?: boolean;
  includeAllSessions?: boolean;
}): Promise<string> {
  await flushTelemetry(); // Ensure all events are saved

  const allEvents = await loadEvents();
  
  // Session filtering: default to current session only
  const includeAllSessions = opts?.includeAllSessions ?? false;
  const events = includeAllSessions
    ? allEvents
    : allEvents.filter((event) => event.sessionId === appSessionId);
  
  // Count unique sessions
  const uniqueSessions = new Set(allEvents.map((e) => e.sessionId));
  const includedSessions = includeAllSessions
    ? uniqueSessions.size
    : 1;
  
  const lines: string[] = [];

  lines.push('=== TELEMETRY SUMMARY ===');
  lines.push('');
  lines.push('Nasıl yorumlanır?');
  lines.push('- SCREEN_VIEW akışından hangi ekranda kaldı anlaşılır');
  lines.push('- MAP_MOUNT var ama MAP_READY yoksa harita init sorunu');
  lines.push('- STOP_SEARCH_RESULTS count=0 ise arama sonuç vermedi');
  lines.push('- ALARM_SESSION_START var ama TRACKING_START yoksa tracking başlamadı');
  lines.push('- TRIGGER_DECISION + ALARM_TRIGGERED akışı alarm tetiklenmesini gösterir');
  lines.push('');

  // App & Device info
  const appVersion = Application.nativeApplicationVersion || 'unknown';
  const buildNumber = Application.nativeBuildVersion || 'unknown';
  const platform = Platform.OS;
  const osVersion = Device.osVersion || 'unknown';
  const modelName = Device.modelName || 'unknown';
  const manufacturer = Device.manufacturer || 'unknown';

  lines.push(`App Version: ${appVersion} (${buildNumber})`);
  lines.push(`Device: ${manufacturer} ${modelName}`);
  lines.push(`Platform: ${platform} ${osVersion}`);
  lines.push('');

  // Permissions snapshot
  const perms = await getPermissionsSnapshot();
  lines.push('=== PERMISSIONS ===');
  lines.push(`Notifications: ${perms.notifications?.granted ? 'GRANTED' : 'DENIED'}`);
  lines.push(`Location FG: ${perms.locationForeground?.status || 'UNKNOWN'}`);
  lines.push(`Location BG: ${perms.locationBackground?.status || 'UNKNOWN'}`);
  lines.push('');

  // Maps key status
  const mapsKeys = getMapsKeyStatus();
  lines.push('=== MAPS KEYS ===');
  lines.push(`Android Key: ${mapsKeys.hasAndroidKey ? 'YES' : 'NO'}`);
  lines.push(`iOS Key: ${mapsKeys.hasIOSKey ? 'YES' : 'NO'}`);
  lines.push(`Web Key: ${mapsKeys.hasWebKey ? 'YES' : 'NO'}`);
  lines.push('');

  // Session info
  lines.push(`App Session ID: ${appSessionId}`);
  lines.push(`Included Sessions: ${includedSessions}/${uniqueSessions.size}`);
  if (!includeAllSessions) {
    lines.push('Only current session included');
  }
  lines.push(`Total Events: ${events.length} (of ${allEvents.length} total)`);
  lines.push('');

  // Last 50 events
  lines.push('=== LAST 50 EVENTS ===');
  const lastEvents = events.slice(-50);
  if (lastEvents.length === 0) {
    lines.push('No events recorded.');
  } else {
    lastEvents.forEach((event) => {
      const timeStr = new Date(event.t).toISOString();
      const levelStr = event.level.toUpperCase().padEnd(5);
      const screenStr = event.screen ? ` [${event.screen}]` : '';
      lines.push(`[${timeStr}] ${levelStr} ${event.name}${screenStr} (actionId: ${event.actionId})`);
      if (event.durationMs !== undefined) {
        lines.push(`  Duration: ${event.durationMs}ms`);
      }
      if (event.data && Object.keys(event.data).length > 0) {
        lines.push(`  Data: ${JSON.stringify(event.data, null, 2)}`);
      }
    });
  }
  lines.push('');

  // JSONL export (if requested)
  if (opts?.includeJsonl) {
    lines.push('=== JSONL ===');
    events.forEach((event) => {
      lines.push(JSON.stringify(event));
    });
  }

  lines.push('=== END ===');

  return lines.join('\n');
}
