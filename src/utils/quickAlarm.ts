/**
 * Quick Alarm Utility
 * 
 * Geçmiş alarm session'larından hızlı alarm kurmak için helper fonksiyonlar.
 */

import { AlarmSession, TransitStop, UserTarget } from '../types/models';
import { fetchStopById } from '../services/transitProvider';
import { getUserTargetById } from '../services/stopsService';
import { captureError } from './errorReporting';
import { getCurrentLocation } from '../services/locationService';
import * as Location from 'expo-location';

/**
 * AlarmSession'dan target snapshot oluşturur
 * STOP için TransitStop, CUSTOM için UserTarget döner
 * Optimizasyon: Session'dan snapshot oluşturulabilirse fetch yapmaz
 */
export async function buildTargetSnapshotFromSession(
  session: AlarmSession,
): Promise<TransitStop | UserTarget | null> {
  try {
    if (session.targetType === 'STOP') {
      // Session'dan snapshot oluştur (fetch'ten daha hızlı)
      // Eğer session'da yeterli bilgi varsa direkt snapshot oluştur
      if (session.targetLat && session.targetLon && session.targetName) {
        const stopSnapshot: TransitStop = {
          id: session.targetId,
          name: session.targetName,
          latitude: session.targetLat,
          longitude: session.targetLon,
          city: undefined,
          addressDescription: undefined,
          lineIds: [],
        };
        // Fetch'i arka planda yap ama snapshot'ı hemen döndür (optimizasyon)
        fetchStopById(session.targetId).catch(() => {
          // Hata olursa sessizce ignore et, snapshot zaten döndürüldü
        });
        return stopSnapshot;
      }
      // Session'da yeterli bilgi yoksa fetch yap
      const stop = await fetchStopById(session.targetId);
      if (!stop) {
        return null;
      }
      return stop;
    } else {
      // CUSTOM target - session'dan snapshot oluştur
      if (session.targetLat && session.targetLon && session.targetName) {
        const targetSnapshot: UserTarget = {
          id: session.targetId,
          userId: session.userId,
          name: session.targetName,
          lat: session.targetLat,
          lon: session.targetLon,
          radiusMeters: session.distanceThresholdMeters ?? 400,
          createdAt: typeof session.createdAt === 'number' ? session.createdAt : Date.now(),
          updatedAt: typeof session.updatedAt === 'number' ? session.updatedAt : Date.now(),
        };
        // Fetch'i arka planda yap ama snapshot'ı hemen döndür (optimizasyon)
        getUserTargetById(session.targetId).catch(() => {
          // Hata olursa sessizce ignore et, snapshot zaten döndürüldü
        });
        return targetSnapshot;
      }
      // Session'da yeterli bilgi yoksa fetch yap
      const target = await getUserTargetById(session.targetId);
      if (!target) {
        return null;
      }
      return target;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[quickAlarm] Target snapshot oluşturulamadı', error);
    }
    captureError(error, 'quickAlarm/buildTargetSnapshotFromSession');
    return null;
  }
}

/**
 * StartAlarmSessionParams için gerekli parametreleri session'dan oluşturur
 * Güncel konum alınır ve hedef ile mesafe hesaplanır
 */
export async function buildStartAlarmParamsFromSession(session: AlarmSession) {
  // Güncel konumu al
  let currentLocation: Location.LocationObject | null = null;
  try {
    currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      if (__DEV__) {
        console.warn('[quickAlarm] Güncel konum alınamadı, session parametreleri kullanılacak');
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[quickAlarm] Konum alma hatası:', error);
    }
    captureError(error, 'quickAlarm/getCurrentLocation');
  }

  // Eğer güncel konum alındıysa ve hedef konumu varsa mesafe kontrolü yap
  // (Bu bilgiyi kullanıcıya gösterebiliriz ama alarm parametrelerini değiştirmiyoruz)
  if (currentLocation && session.targetLat && session.targetLon) {
    const distance = calculateDistance(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
      session.targetLat,
      session.targetLon,
    );
    if (__DEV__) {
      console.log(`[quickAlarm] Güncel konumdan hedefe mesafe: ${Math.round(distance)}m`);
    }
  }

  return {
    targetType: session.targetType,
    targetId: session.targetId,
    distanceThresholdMeters: session.distanceThresholdMeters,
    transportMode: session.transportMode,
    minutesBefore: session.minutesBefore,
  };
}

/**
 * İki koordinat arasındaki mesafeyi metre cinsinden hesaplar (Haversine formülü)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Dünya yarıçapı (metre)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

