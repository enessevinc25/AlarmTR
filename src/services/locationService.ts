import * as Location from 'expo-location';

import { handleBackgroundLocationUpdate } from './alarmBackgroundService';
import { processBackgroundLocationUpdate } from './alarmBackgroundCore';
import { areNativeModulesAvailable, isExpoGo } from '../utils/expoEnvironment';
import { captureError } from '../utils/errorReporting';

export const LOCATION_TASK_NAME = 'LASTSTOP_LOCATION_TASK';
export const GEOFENCE_TASK_NAME = 'LASTSTOP_GEOFENCE_TASK';

type LocationTaskData = {
  locations?: Location.LocationObject[];
};

// Task Manager sadece development build veya standalone build'de çalışır
// Expo Go'da background location tracking desteklenmez
// Expo Go'da TaskManager modülü mevcut olmayabilir, bu yüzden try-catch ile sarmalıyoruz
let TaskManager: typeof import('expo-task-manager') | null = null;

try {
  // Expo Go'da bu import başarısız olabilir
  TaskManager = require('expo-task-manager');
  
  if (areNativeModulesAvailable() && TaskManager && !TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
    TaskManager.defineTask(
      LOCATION_TASK_NAME,
      async ({ data, error }: any) => {
        if (error) {
          if (__DEV__) {
            console.error('Location task error:', error);
          }
          captureError(error, 'locationService/taskError');
          return;
        }
        const { locations } = (data as LocationTaskData) ?? {};
        if (!locations || locations.length === 0) {
          return;
        }
        const latest = locations[locations.length - 1];
        await handleBackgroundLocationUpdate({
          latitude: latest.coords.latitude,
          longitude: latest.coords.longitude,
          accuracy: latest.coords.accuracy ?? undefined, // GPS accuracy kontrolü için geçir
        });
      },
    );
    if (__DEV__) {
      console.log('[tasks] Location task registered:', LOCATION_TASK_NAME);
    }
  }
  } catch (error) {
    // Expo Go'da TaskManager mevcut değil, bu normal
    if (__DEV__) {
      console.log('[locationService] TaskManager mevcut değil (Expo Go olabilir)');
    }
  }

// Geofencing task (fallback mechanism)
try {
  if (areNativeModulesAvailable() && TaskManager && !TaskManager.isTaskDefined(GEOFENCE_TASK_NAME)) {
    TaskManager.defineTask(
      GEOFENCE_TASK_NAME,
      async ({ data, error }: any) => {
        if (error) {
          if (__DEV__) {
            console.error('Geofence task error:', error);
          }
          captureError(error, 'locationService/geofenceTaskError');
          return;
        }
        const { eventType, region } = data ?? {};
        if (eventType === Location.GeofencingEventType.Enter) {
          // Region'a girildi: alarm core'u tetikle
          // Geofence event'inde coords yok, bu yüzden region center'ı kullan
          if (region) {
            await processBackgroundLocationUpdate({
              latitude: region.latitude,
              longitude: region.longitude,
              accuracy: region.radius, // Radius'u accuracy olarak kullan (yaklaşık)
            });
          }
        }
      },
    );
    if (__DEV__) {
      console.log('[tasks] Geofence task registered:', GEOFENCE_TASK_NAME);
    }
  }
} catch (error) {
  if (__DEV__) {
    console.log('[locationService] Geofence TaskManager mevcut değil');
  }
}

let locationSubscription: Location.LocationSubscription | null = null;

export async function getCurrentLocation() {
  try {
    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      return null;
    }
    return Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('Konum alınamadı', error);
    }
    captureError(error, 'locationService/getCurrentLocation');
    return null;
  }
}

export async function startForegroundLocationTracking(
  onLocationChange: (location: Location.LocationObject) => void,
  distanceMeters?: number,
) {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      throw new Error('Konum izni verilmedi');
    }

    if (locationSubscription) {
      locationSubscription.remove();
    }

    // Dinamik interval kullan (mesafe bilgisi varsa)
    const interval = distanceMeters !== undefined 
      ? getDynamicInterval(distanceMeters)
      : { timeInterval: 2000, distanceInterval: 5 }; // Varsayılan

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: interval.timeInterval,
        distanceInterval: interval.distanceInterval,
      },
      onLocationChange,
    );
    return locationSubscription;
  } catch (error) {
    captureError(error, 'locationService/startForegroundLocationTracking');
    throw error;
  }
}

export function stopForegroundLocationTracking() {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
}

/**
 * Mesafeye göre dinamik interval hesaplar (Samsung throttling'e takılmayacak şekilde optimize edildi)
 * Samsung One UI'da çok agresif interval'lar throttling'e takılır.
 * 
 * Optimize edilmiş değerler:
 * - Yakın (<=1km): 5-10s, 10-25m (Samsung'da 2s çok agresif)
 * - Orta: 15-30s, 50-100m
 * - Uzak: 30-60s, 150-300m
 */
function getDynamicInterval(distanceMeters: number): { timeInterval: number; distanceInterval: number } {
  if (distanceMeters > 1000) {
    // Uzak mesafe: 30-60 saniye, 150-300 metre
    return { timeInterval: 45000, distanceInterval: 200 };
  } else if (distanceMeters > 500) {
    // Orta-uzak: 20-30 saniye, 100-150 metre
    return { timeInterval: 25000, distanceInterval: 125 };
  } else if (distanceMeters > 200) {
    // Orta mesafe: 15-20 saniye, 50-100 metre
    return { timeInterval: 17500, distanceInterval: 75 };
  } else {
    // Yakın mesafe: 5-10 saniye, 10-25 metre (Samsung throttling'e takılmamak için 2s yerine 7.5s)
    return { timeInterval: 7500, distanceInterval: 17 };
  }
}

export async function startBackgroundLocationTracking(distanceMeters?: number) {
  // Expo Go'da background location tracking desteklenmez
  if (isExpoGo()) {
    throw new Error(
      'Background location tracking Expo Go\'da desteklenmez. Development build veya APK kullanın.',
    );
  }

  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      return;
    }

    // Background permission kontrolü - Android ve iOS için güvenli
    let permission = await Location.getBackgroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      try {
        permission = await Location.requestBackgroundPermissionsAsync();
      } catch (permError) {
        // Bazı Android sürümlerinde veya iOS'ta background permission request başarısız olabilir
        if (__DEV__) {
          console.warn('[locationService] Background permission request failed:', permError);
        }
        captureError(permError, 'locationService/requestBackgroundPermissions');
        // Hata olsa bile devam et - foreground tracking çalışabilir
      }
    }

    if (permission.status !== Location.PermissionStatus.GRANTED) {
      throw new Error('Background location izni verilmedi');
    }

    // Dinamik interval kullan (mesafe bilgisi varsa)
    const interval = distanceMeters !== undefined 
      ? getDynamicInterval(distanceMeters)
      : { timeInterval: 2000, distanceInterval: 5 }; // Varsayılan

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: interval.timeInterval,
      distanceInterval: interval.distanceInterval,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'LastStop Alarm TR',
        notificationBody: 'Durağa yaklaşım için konumunuz izleniyor. Ekran kilitliyken de çalışır.',
        notificationColor: '#0E7490',
      },
      });
  } catch (error) {
    if (__DEV__) {
      console.warn('Background tracking başlatılamadı', error);
    }
    captureError(error, 'locationService/startBackgroundLocationTracking');
    throw error;
  }
}

export async function stopBackgroundLocationTracking() {
  // Expo Go'da background location tracking desteklenmez
  if (isExpoGo()) {
    return;
  }

  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Background tracking durdurulamadı', error);
    }
    captureError(error, 'locationService/stopBackgroundLocationTracking');
  }
}

/**
 * Geofencing fallback - Samsung throttling'e karşı ek güvenlik
 * Alarm kurulduğunda target çevresinde geofence region ekle.
 */
export async function startGeofencing(
  targetLat: number,
  targetLon: number,
  radiusMeters: number,
): Promise<void> {
  if (isExpoGo()) {
    return;
  }

  try {
    // Background permission kontrolü
    let permission = await Location.getBackgroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      try {
        permission = await Location.requestBackgroundPermissionsAsync();
      } catch (permError) {
        if (__DEV__) {
          console.warn('[locationService] Background permission request failed for geofencing:', permError);
        }
        return;
      }
    }

    if (permission.status !== Location.PermissionStatus.GRANTED) {
      return;
    }

    // Radius floor: çok küçük radius event kaçırabilir
    const minRadius = Math.max(radiusMeters, 150);
    
    const regions: Location.LocationRegion[] = [
      {
        identifier: 'alarm-target-geofence',
        latitude: targetLat,
        longitude: targetLon,
        radius: minRadius,
        notifyOnEnter: true,
        notifyOnExit: false,
      },
    ];

    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
  } catch (error) {
    if (__DEV__) {
      console.warn('Geofencing başlatılamadı', error);
    }
    captureError(error, 'locationService/startGeofencing');
  }
}

/**
 * Geofencing'i durdur
 */
export async function stopGeofencing(): Promise<void> {
  if (isExpoGo()) {
    return;
  }

  try {
    await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
  } catch (error) {
    if (__DEV__) {
      console.warn('Geofencing durdurulamadı', error);
    }
    captureError(error, 'locationService/stopGeofencing');
  }
}

