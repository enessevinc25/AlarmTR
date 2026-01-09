/**
 * Background Alarm Sync - Foreground Network Operations
 * 
 * Bu modül foreground'da çalışır ve pending sync events'leri Firestore'a yazar.
 * Background task tarafından çağrılmaz.
 */

import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  getPendingSyncEvents,
  clearPendingSyncEvents,
  PendingSyncEvent,
} from './alarmBackgroundCore';
import { captureError } from '../utils/errorReporting';
import { isLocalSessionId } from './offlineQueueService';

/**
 * Pending sync events'leri Firestore'a yaz.
 * Foreground'da çağrılmalı (app açıkken, online olunca, AlarmTriggered ekranında).
 */
export async function syncPendingEventsToFirestore(): Promise<void> {
  try {
    const events = await getPendingSyncEvents();
    if (events.length === 0) {
      return;
    }

    const syncedEvents: PendingSyncEvent[] = [];

    for (const event of events) {
      try {
        // Local session kontrolü
        if (isLocalSessionId(event.sessionId)) {
          // Local session: Firestore'a yazma, sadece event'i temizle
          syncedEvents.push(event);
          continue;
        }

        const sessionRef = doc(db, 'alarmSessions', event.sessionId);

        if (event.type === 'TRIGGERED') {
          // Mevcut durumu kontrol et (idempotent trigger için)
          const sessionDoc = await getDoc(sessionRef);
          
          if (!sessionDoc.exists()) {
            // Session yok: event'i skip et
            syncedEvents.push(event);
            continue;
          }

          const currentStatus = sessionDoc.data().status;
          if (currentStatus === 'TRIGGERED' || currentStatus === 'CANCELLED') {
            // Zaten tetiklenmiş: event'i skip et
            syncedEvents.push(event);
            continue;
          }

          // Trigger update
          await updateDoc(sessionRef, {
            status: 'TRIGGERED',
            triggeredAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastKnownDistanceMeters: event.data.lastKnownDistanceMeters,
          });

          syncedEvents.push(event);
        } else if (event.type === 'DISTANCE_UPDATE') {
          // Distance update (throttle: sadece önemli değişikliklerde)
          const sessionDoc = await getDoc(sessionRef);
          
          if (!sessionDoc.exists()) {
            syncedEvents.push(event);
            continue;
          }

          const currentStatus = sessionDoc.data().status;
          if (currentStatus === 'ACTIVE') {
            await updateDoc(sessionRef, {
              lastKnownDistanceMeters: event.data.lastKnownDistanceMeters,
              updatedAt: serverTimestamp(),
            });
          }

          syncedEvents.push(event);
        }
      } catch (error) {
        // Tek bir event başarısız olsa bile diğerlerini dene
        if (__DEV__) {
          console.warn('[alarmBackgroundSync] Event sync hatası', error);
        }
        captureError(error, 'alarmBackgroundSync/syncEvent');
        // Başarısız event'i temizleme (retry için tutulabilir ama şimdilik temizle)
        syncedEvents.push(event);
      }
    }

    // Başarıyla sync edilen event'leri temizle
    if (syncedEvents.length > 0) {
      await clearPendingSyncEvents(syncedEvents);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmBackgroundSync] Sync hatası', error);
    }
    captureError(error, 'alarmBackgroundSync/syncPendingEvents');
  }
}

