/**
 * Alarm Survival Service (P0)
 * 
 * Android'de alarm aktifken foreground service ile location tracking'i
 * daha güvenilir hale getirir.
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { LOCATION_TASK_NAME } from './locationService';
import { diagLog } from './alarmDiagnostics';

/**
 * Alarm aktifken location tracking'i foreground service ile başlat
 */
export async function ensureLocationTrackingForAlarm(sessionId: string): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  // Feature flag kontrolü: enableForegroundSurvivalAndroid
  const enableSurvival = await getFeatureFlag('enableForegroundSurvivalAndroid', true);
  if (!enableSurvival) {
    if (__DEV__) {
      console.log('[alarmSurvivalService] Foreground survival disabled by feature flag');
    }
    return;
  }

  try {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (started) {
      if (__DEV__) {
        console.log('[alarmSurvivalService] Location tracking already started');
      }
      return;
    }

    // Alarm aktifken foreground service ile start
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced, // Projenin mevcut accuracy tercihi
      timeInterval: 5000, // 5 saniye interval
      distanceInterval: 0, // Her mesafe değişikliğinde update
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: false, // iOS için; android'de etkisiz
      foregroundService: {
        notificationTitle: 'LastStop Alarm aktif',
        notificationBody: 'Alarm çalışıyor. Konum takibi arka planda devam ediyor.',
        notificationColor: undefined, // Renk belirtme (sistem default)
      },
    });

    // Diagnostic log
    try {
      await diagLog(sessionId, {
        level: 'info',
        type: 'TASK_REGISTERED',
        msg: 'ensureLocationTrackingForAlarm started (foregroundService)',
      });
    } catch {
      // Ignore diagnostic errors
    }

    if (__DEV__) {
      console.log('[alarmSurvivalService] Location tracking started with foreground service');
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmSurvivalService] Failed to start location tracking:', error);
    }
    // Hata durumunda normal tracking'i dene (fallback)
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 0,
        pausesUpdatesAutomatically: false,
      });
    } catch (fallbackError) {
      if (__DEV__) {
        console.warn('[alarmSurvivalService] Fallback start also failed:', fallbackError);
      }
    }
  }
}

/**
 * Alarm durdurulunca location tracking'i durdur
 */
export async function stopLocationTrackingForAlarm(sessionId: string): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (!started) {
      return;
    }

    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

    // Diagnostic log
    try {
      await diagLog(sessionId, {
        level: 'info',
        type: 'SESSION_STOP',
        msg: 'stopLocationTrackingForAlarm stopLocationUpdatesAsync',
      });
    } catch {
      // Ignore diagnostic errors
    }

    if (__DEV__) {
      console.log('[alarmSurvivalService] Location tracking stopped');
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmSurvivalService] Failed to stop location tracking:', error);
    }
  }
}

/**
 * Self-heal: App açıkken location tracking'in çalıştığını kontrol et ve gerekirse yeniden başlat
 */
export async function healthCheckLocationTracking(sessionId: string): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (!started) {
      if (__DEV__) {
        console.warn('[alarmSurvivalService] Health check: location updates not started, restarting');
      }
      
      // Diagnostic log
      try {
        await diagLog(sessionId, {
          level: 'warn',
          type: 'ERROR',
          msg: 'healthCheck: location updates not started, restarting',
        });
      } catch {
        // Ignore diagnostic errors
      }

      await ensureLocationTrackingForAlarm(sessionId);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmSurvivalService] Health check failed:', error);
    }
  }
}
