/**
 * Background Alarm Service - Task Wiring
 * 
 * Bu modül TaskManager.defineTask içinde çağrılır ve network-free core'u kullanır.
 * Firestore/network işlemleri yapılmaz.
 */

import { processBackgroundLocationUpdate } from './alarmBackgroundCore';

interface BackgroundLocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

/**
 * Background görevinden gelen konum güncellemelerini işler.
 * Network kullanmaz, sadece lokal hesaplama ve notification yapar.
 * Firestore sync işlemleri alarmBackgroundSync.ts'de foreground'da yapılır.
 */
export async function handleBackgroundLocationUpdate(coords: BackgroundLocationCoords) {
  // Network-free core'u çağır
  await processBackgroundLocationUpdate(coords);
}

