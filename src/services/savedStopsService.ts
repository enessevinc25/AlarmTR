import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { captureError } from '../utils/errorReporting';
import { TransitStop, UserSavedStop } from '../types/models';
import { logEvent } from './telemetry';

// Simple hash for stopId
function hashStopId(stopId: string): string {
  let hash = 2166136261;
  for (let i = 0; i < stopId.length; i++) {
    hash ^= stopId.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const COLLECTION = 'userSavedStops';

export async function addSavedStop(userId: string, stop: TransitStop): Promise<UserSavedStop> {
  try {
    // Duplicate kontrolü - aynı durak zaten favori mi?
    const existingSnap = await getDocs(
      query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('stopId', '==', stop.id),
      ),
    );

    if (!existingSnap.empty) {
      // Zaten favori, mevcut olanı döndür
      const existingDoc = existingSnap.docs[0];
      const data = existingDoc.data();
      
      // Timestamp'i number'a çevir
      let createdAtValue: any = data.createdAt;
      if (createdAtValue && typeof createdAtValue === 'object') {
        if ('toMillis' in createdAtValue) {
          createdAtValue = (createdAtValue as any).toMillis();
        } else if ('seconds' in createdAtValue) {
          createdAtValue = (createdAtValue as any).seconds * 1000;
        }
      }
      
      return {
        id: existingDoc.id,
        userId: data.userId,
        stopId: data.stopId,
        stopName: data.stopName,
        latitude: data.latitude,
        longitude: data.longitude,
        addressDescription: data.addressDescription,
        city: data.city,
        lineIds: data.lineIds ?? [],
        defaultDistanceMeters: data.defaultDistanceMeters,
        createdAt: createdAtValue,
      } as UserSavedStop;
    }

    const payload = {
      userId,
      stopId: stop.id,
      stopName: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      addressDescription: stop.addressDescription ?? null,
      city: stop.city ?? null,
      lineIds: stop.lineIds ?? [],
      defaultDistanceMeters: stop.radiusMeters ?? 400,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);

    // Log favorite add
    logEvent('FAVORITE_ADD', {
      stopIdHash: hashStopId(stop.id),
    });

    return {
      id: ref.id,
      userId: payload.userId,
      stopId: payload.stopId,
      stopName: payload.stopName,
      latitude: payload.latitude,
      longitude: payload.longitude,
      addressDescription: payload.addressDescription ?? undefined,
      city: payload.city ?? undefined,
      lineIds: payload.lineIds,
      defaultDistanceMeters: payload.defaultDistanceMeters,
      // createdAt serverTimestamp() olduğu için return edilemez
      // Firestore'dan okunduğunda gerçek Timestamp değeri gelecek
    };
  } catch (error) {
    captureError(error, 'savedStopsService/addSavedStop');
    logEvent('FAVORITES_ERROR', {
      code: (error as any)?.code || 'UNKNOWN',
      messageShort: (error as any)?.message?.substring(0, 100) || 'Unknown error',
    }, 'error');
    throw error;
  }
}

export async function removeSavedStop(savedStopId: string): Promise<void> {
  try {
    // Get stopId before deleting for logging
    let stopIdHash: string | undefined;
    try {
      const stopDocSnap = await getDoc(doc(db, COLLECTION, savedStopId));
      if (stopDocSnap.exists()) {
        const stopId = stopDocSnap.data().stopId;
        if (stopId) {
          stopIdHash = hashStopId(stopId);
        }
      }
    } catch {
      // Ignore read errors, just proceed with delete
    }
    
    await deleteDoc(doc(db, COLLECTION, savedStopId));
    
    // Log favorite remove
    if (stopIdHash) {
      logEvent('FAVORITE_REMOVE', { stopIdHash });
    }
  } catch (error) {
    captureError(error, 'savedStopsService/removeSavedStop');
    logEvent('FAVORITES_ERROR', {
      code: (error as any)?.code || 'UNKNOWN',
      messageShort: (error as any)?.message?.substring(0, 100) || 'Unknown error',
    }, 'error');
    throw error;
  }
}

export async function listUserSavedStops(userId: string): Promise<UserSavedStop[]> {
  try {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    const stops = snap.docs
      .map((docSnap) => {
        try {
          const data = docSnap.data();
          
          // createdAt Timestamp ise number'a çevir
          let createdAtValue: any = data.createdAt;
          if (createdAtValue && typeof createdAtValue === 'object') {
            if ('toMillis' in createdAtValue) {
              // Firestore Timestamp
              createdAtValue = (createdAtValue as any).toMillis();
            } else if ('seconds' in createdAtValue) {
              // Firestore Timestamp (alternatif format)
              createdAtValue = (createdAtValue as any).seconds * 1000;
            }
          }
          
          // Güvenli data mapping
          const stop: UserSavedStop = {
      id: docSnap.id,
            userId: typeof data.userId === 'string' ? data.userId : '',
            stopId: typeof data.stopId === 'string' ? data.stopId : '',
            stopName: typeof data.stopName === 'string' ? data.stopName : '',
            latitude: typeof data.latitude === 'number' ? data.latitude : 0,
            longitude: typeof data.longitude === 'number' ? data.longitude : 0,
            addressDescription: typeof data.addressDescription === 'string' ? data.addressDescription : undefined,
            city: typeof data.city === 'string' ? data.city : undefined,
            lineIds: Array.isArray(data.lineIds) ? data.lineIds : [],
            defaultDistanceMeters: typeof data.defaultDistanceMeters === 'number' ? data.defaultDistanceMeters : undefined,
            createdAt: createdAtValue,
          };
          
          // Güvenlik kontrolleri - kritik field'lar eksikse null döndür
          if (!stop.id || !stop.stopId || !stop.userId || !stop.stopName) {
            if (__DEV__) {
              console.warn(`[savedStopsService] Invalid stop data in listUserSavedStops (${docSnap.id}):`, stop);
            }
            return null;
          }
          
          return stop;
        } catch (docError) {
          if (__DEV__) {
            console.warn(`[savedStopsService] Doc parse hatası in listUserSavedStops (${docSnap.id}):`, docError);
          }
          captureError(docError, 'savedStopsService/listUserSavedStops/docParse');
          return null;
        }
      })
      .filter((stop): stop is UserSavedStop => stop !== null && stop !== undefined);
    
    // Log favorites load
    logEvent('FAVORITES_LOAD', { count: stops.length });
    
    return stops;
  } catch (error) {
    captureError(error, 'savedStopsService/listUserSavedStops');
    logEvent('FAVORITES_ERROR', {
      code: (error as any)?.code || 'UNKNOWN',
      messageShort: (error as any)?.message?.substring(0, 100) || 'Unknown error',
    }, 'error');
    throw error;
  }
}

export function subscribeUserSavedStops(
  userId: string,
  callback: (stops: UserSavedStop[]) => void,
): () => void {
  let unsubscribeFn: (() => void) | null = null;
  
  try {
    // orderBy kullanmayı dene, hata olursa fallback yap
    let q;
    try {
      q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    } catch (orderByError) {
      // orderBy hatası (muhtemelen index eksik veya createdAt Timestamp değil)
      // Sadece where ile query yapıp, client-side sort yapacağız
      if (__DEV__) {
        console.warn('[savedStopsService] orderBy hatası, where-only query kullanılıyor:', orderByError);
      }
      q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
      );
    }
    
    unsubscribeFn = onSnapshot(
      q,
      (snapshot) => {
        try {
          const stops = snapshot.docs
            .map((docSnap) => {
              try {
                const data = docSnap.data();
                
                // createdAt Timestamp ise number'a çevir
                let createdAtValue: any = data.createdAt;
                if (createdAtValue && typeof createdAtValue === 'object') {
                  if ('toMillis' in createdAtValue) {
                    // Firestore Timestamp
                    createdAtValue = (createdAtValue as any).toMillis();
                  } else if ('seconds' in createdAtValue) {
                    // Firestore Timestamp (alternatif format)
                    createdAtValue = (createdAtValue as any).seconds * 1000;
                  }
                }
                
                // Güvenli data mapping
                const stop: UserSavedStop = {
                  id: docSnap.id,
                  userId: typeof data.userId === 'string' ? data.userId : '',
                  stopId: typeof data.stopId === 'string' ? data.stopId : '',
                  stopName: typeof data.stopName === 'string' ? data.stopName : '',
                  latitude: typeof data.latitude === 'number' ? data.latitude : 0,
                  longitude: typeof data.longitude === 'number' ? data.longitude : 0,
                  addressDescription: typeof data.addressDescription === 'string' ? data.addressDescription : undefined,
                  city: typeof data.city === 'string' ? data.city : undefined,
                  lineIds: Array.isArray(data.lineIds) ? data.lineIds : [],
                  defaultDistanceMeters: typeof data.defaultDistanceMeters === 'number' ? data.defaultDistanceMeters : undefined,
                  createdAt: createdAtValue,
                };
                
                // Güvenlik kontrolleri - kritik field'lar eksikse null döndür
                if (!stop.id || !stop.stopId || !stop.userId || !stop.stopName) {
                  if (__DEV__) {
                    console.warn(`[savedStopsService] Invalid stop data (${docSnap.id}):`, stop);
                  }
                  return null;
                }
                
                return stop;
              } catch (docError) {
                if (__DEV__) {
                  console.warn(`[savedStopsService] Doc parse hatası (${docSnap.id}):`, docError);
                }
                captureError(docError, 'savedStopsService/subscribeUserSavedStops/docParse');
                return null;
              }
            })
            .filter((stop): stop is UserSavedStop => stop !== null && stop !== undefined);
          
          // Client-side sort (eğer orderBy kullanılamadıysa veya ek güvenlik için)
          stops.sort((a, b) => {
            const aTime = a.createdAt && typeof a.createdAt === 'number' ? a.createdAt : 0;
            const bTime = b.createdAt && typeof b.createdAt === 'number' ? b.createdAt : 0;
            return bTime - aTime; // desc order
          });
          
          // Log favorites load (on subscription)
          logEvent('FAVORITES_LOAD', { count: stops.length });
          
          callback(stops);
        } catch (mapError) {
          if (__DEV__) {
            console.warn('[savedStopsService] Snapshot map hatası', mapError);
          }
          captureError(mapError, 'savedStopsService/subscribeUserSavedStops/map');
          callback([]);
        }
      },
      (error) => {
        if (__DEV__) {
          console.warn('[savedStopsService] Favori duraklar dinlenirken hata oluştu', error);
        }
        captureError(error, 'savedStopsService/subscribeUserSavedStops');
        callback([]);
      },
    );
    
    return () => {
      if (unsubscribeFn && typeof unsubscribeFn === 'function') {
        try {
          unsubscribeFn();
        } catch (cleanupError) {
          if (__DEV__) {
            console.warn('[savedStopsService] Cleanup hatası', cleanupError);
          }
        }
      }
    };
  } catch (queryError) {
    if (__DEV__) {
      console.warn('[savedStopsService] Query oluşturma hatası', queryError);
    }
    captureError(queryError, 'savedStopsService/subscribeUserSavedStops/query');
    // Hata durumunda boş callback çağır ve cleanup fonksiyonu döndür
    callback([]);
    return () => {}; // No-op cleanup
  }
}

export async function toggleUserSavedStop(userId: string, stop: TransitStop): Promise<void> {
  try {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      const error = new Error('Invalid userId');
      captureError(error, 'savedStopsService/toggleUserSavedStop/invalidUserId');
      throw error;
    }
    
    if (!stop || !stop.id || typeof stop.id !== 'string' || stop.id.trim().length === 0) {
      const error = new Error('Invalid stop data');
      captureError(error, 'savedStopsService/toggleUserSavedStop/invalidStop');
      throw error;
    }

    // Duplicate kontrolü - aynı durak zaten favori mi?
    const existingSnap = await getDocs(
      query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('stopId', '==', stop.id),
      ),
    );

    if (!existingSnap.empty) {
      // Tüm duplicate'leri sil (birden fazla olabilir - güvenlik için)
      const deletePromises = existingSnap.docs.map((docSnap) =>
        deleteDoc(doc(db, COLLECTION, docSnap.id)),
      );
      await Promise.all(deletePromises);
      
      if (__DEV__ && existingSnap.docs.length > 1) {
        console.warn(
          `[savedStopsService] ${existingSnap.docs.length} duplicate favori durak bulundu ve silindi (stopId: ${stop.id})`,
        );
      }
      
      // Log favorite remove
      logEvent('FAVORITE_REMOVE', {
        stopIdHash: hashStopId(stop.id),
      });
      
      return;
    }

    // Handle both lineIds and lines fields (TransitStop can have either)
    const resolvedLineIds = stop.lineIds ?? stop.lines ?? [];
    
    // Payload validation
    if (typeof stop.latitude !== 'number' || isNaN(stop.latitude)) {
      const error = new Error('Invalid latitude');
      captureError(error, 'savedStopsService/toggleUserSavedStop/invalidLatitude');
      throw error;
    }
    
    if (typeof stop.longitude !== 'number' || isNaN(stop.longitude)) {
      const error = new Error('Invalid longitude');
      captureError(error, 'savedStopsService/toggleUserSavedStop/invalidLongitude');
      throw error;
    }
    
    const payload = {
      userId,
      stopId: stop.id,
      stopName: stop.name || 'Unknown Stop',
      latitude: stop.latitude,
      longitude: stop.longitude,
      addressDescription: stop.addressDescription ?? null,
      city: stop.city ?? null,
      lineIds: Array.isArray(resolvedLineIds) ? resolvedLineIds : [],
      defaultDistanceMeters: typeof stop.radiusMeters === 'number' && !isNaN(stop.radiusMeters) ? stop.radiusMeters : 400,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await addDoc(collection(db, COLLECTION), payload);
    
    // Log favorite add
    logEvent('FAVORITE_ADD', {
      stopIdHash: hashStopId(stop.id),
    });
  } catch (error) {
    const errorCode = (error as any)?.code || 'UNKNOWN';
    const errorMessage = (error as any)?.message || 'Unknown error';
    
    // Permission denied hatası için özel log
    if (errorCode === 'permission-denied') {
      logEvent('FAVORITES_ERROR', {
        code: errorCode,
        messageShort: 'Permission denied - check Firebase rules',
        userId: userId?.substring(0, 8) || 'unknown',
      }, 'error');
    } else {
      logEvent('FAVORITES_ERROR', {
        code: errorCode,
        messageShort: errorMessage.substring(0, 100),
        userId: userId?.substring(0, 8) || 'unknown',
      }, 'error');
    }
    
    captureError(error, 'savedStopsService/toggleUserSavedStop');
    throw error;
  }
}

