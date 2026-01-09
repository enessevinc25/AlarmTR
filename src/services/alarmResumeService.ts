/**
 * Alarm Resume Service
 * 
 * App açıldığında ACTIVE alarm varsa tracking'i otomatik olarak toparlar.
 * İzinler varsa background location tracking ve geofencing'i yeniden başlatır.
 */

import * as Location from 'expo-location';
import { isExpoGo } from '../utils/expoEnvironment';
import { captureError } from '../utils/errorReporting';
import {
  startBackgroundLocationTracking,
  startGeofencing,
  LOCATION_TASK_NAME,
  GEOFENCE_TASK_NAME,
} from './locationService';
import { ActiveAlarmStateSnapshot } from '../context/AlarmContext';

/**
 * ACTIVE alarm varsa tracking'i yeniden başlatır.
 * 
 * Guard'lar:
 * - snapshot.status !== 'ACTIVE' => return
 * - isExpoGo() => return (hata fırlatmasın)
 * - Background permission GRANTED değilse => return (sessizce geç)
 * 
 * @param snapshot Active alarm snapshot
 */
export async function resumeTrackingIfNeeded(
  snapshot: ActiveAlarmStateSnapshot,
): Promise<void> {
  // Guard: Sadece ACTIVE alarmlar için çalış
  if (snapshot.status !== 'ACTIVE') {
    return;
  }

  // Guard: Expo Go'da background tracking desteklenmez
  if (isExpoGo()) {
    return;
  }

  try {
    // Permission check: Background location izni gerekli
    const perm = await Location.getBackgroundPermissionsAsync();
    if (perm.status !== Location.PermissionStatus.GRANTED) {
      // İzin yoksa sessizce geç; ActiveAlarmScreen zaten kullanıcıyı yönlendirir
      return;
    }

    // Location tracking check: Başlamamışsa başlat
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(
      () => false,
    );
    if (!started) {
      await startBackgroundLocationTracking(snapshot.lastKnownDistanceMeters ?? undefined);
    }

    // Geofence check: Başlamamışsa başlat
    const geoStarted = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME).catch(
      () => false,
    );
    if (!geoStarted) {
      await startGeofencing(
        snapshot.targetLat,
        snapshot.targetLon,
        snapshot.distanceThresholdMeters,
      );
    }
  } catch (error) {
    // Hata olsa bile crash oluşturma; sadece raporla
    captureError(error, 'alarmResumeService/resumeTrackingIfNeeded');
  }
}
