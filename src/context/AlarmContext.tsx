import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../services/firebase';
import { captureError } from '../utils/errorReporting';
import { AlarmSession, AlarmStatus, TransportMode, TransitStop, UserTarget } from '../types/models';
import { getUserTargetById } from '../services/stopsService';
import { fetchStopById } from '../services/transitProvider';
import { useAuth } from './AuthContext';
import { useNetwork } from './NetworkContext';
import {
  addPendingAlarmSessionCreate,
  getPendingAlarmSessionCreates,
  removePendingAlarmSessionCreate,
  isLocalSessionId,
  PendingAlarmSessionCreate,
} from '../services/offlineQueueService';

interface AlarmContextValue {
  activeAlarmSessionId: string | null;
  activeAlarmSession: AlarmSession | null;
  startAlarmSession(params: StartAlarmSessionParams): Promise<AlarmSession>;
  cancelAlarmSession(alarmSessionId: string): Promise<void>;
  markAlarmTriggered(alarmSessionId: string): Promise<void>;
  refreshAlarmSession(alarmSessionId: string): Promise<AlarmSession | null>;
  clearActiveAlarm(): void;
}

export const ACTIVE_ALARM_STORAGE_KEY = '@laststop/activeAlarmState';

export interface ActiveAlarmStateSnapshot {
  sessionId: string;
  userId: string;
  status: AlarmStatus;
  targetName: string;
  targetLat: number;
  targetLon: number;
  distanceThresholdMeters: number;
  // Geriye dönük uyumluluk için optional
  targetType?: 'STOP' | 'CUSTOM';
  targetId?: string;
  transportMode?: TransportMode | null;
  minutesBefore?: number | null;
  lastKnownDistanceMeters?: number; // Background core için
}

interface StartAlarmSessionParams {
  targetType: AlarmSession['targetType'];
  targetId: string;
  distanceThresholdMeters: number;
  transportMode?: TransportMode;
  minutesBefore?: number;
  targetSnapshot?: TransitStop | UserTarget; // Opsiyonel: Eğer target zaten yüklenmişse tekrar fetch etmeye gerek yok
}

const AlarmContext = createContext<AlarmContextValue | undefined>(undefined);

export const AlarmProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const [activeAlarmSessionId, setActiveAlarmSessionId] = useState<string | null>(null);
  const [activeAlarmSession, setActiveAlarmSession] = useState<AlarmSession | null>(null);

  const persistActiveAlarmSnapshot = useCallback(async (session: AlarmSession) => {
    const snapshot: ActiveAlarmStateSnapshot = {
      sessionId: session.id,
      userId: session.userId,
      status: session.status,
      targetName: session.targetName,
      targetLat: session.targetLat,
      targetLon: session.targetLon,
      distanceThresholdMeters: session.distanceThresholdMeters,
      targetType: session.targetType,
      targetId: session.targetId,
      transportMode: session.transportMode ?? null,
      minutesBefore: session.minutesBefore ?? null,
    };
    await AsyncStorage.setItem(ACTIVE_ALARM_STORAGE_KEY, JSON.stringify(snapshot));
  }, []);

  const clearStoredActiveAlarm = useCallback(async () => {
    await AsyncStorage.removeItem(ACTIVE_ALARM_STORAGE_KEY);
  }, []);

  const getLocalSessionPayload = useCallback(
    async (localSessionId: string): Promise<PendingAlarmSessionCreate | null> => {
      try {
        const pending = await getPendingAlarmSessionCreates();
        return pending.find((item) => item.localSessionId === localSessionId) ?? null;
      } catch (error) {
        if (__DEV__) {
          console.warn('[AlarmContext] getLocalSessionPayload hatası', error);
        }
        captureError(error, 'AlarmContext/getLocalSessionPayload');
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (!user) {
      setActiveAlarmSessionId(null);
      setActiveAlarmSession(null);
      clearStoredActiveAlarm().catch((error) => {
        if (__DEV__) {
          console.warn('[AlarmContext] clearStoredActiveAlarm hatası', error);
        }
      });
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }

    const restoreActiveAlarm = async () => {
      try {
        const raw = await AsyncStorage.getItem(ACTIVE_ALARM_STORAGE_KEY);
        if (!raw) {
          return;
        }

        let stored: ActiveAlarmStateSnapshot | null = null;
        try {
          stored = JSON.parse(raw) as ActiveAlarmStateSnapshot;
        } catch (parseError) {
          if (__DEV__) {
            console.warn('[AlarmContext] Stored alarm snapshot parse hatası', parseError);
          }
          await clearStoredActiveAlarm();
          return;
        }

        if (!stored?.sessionId || (stored.userId && stored.userId !== user.uid)) {
          await clearStoredActiveAlarm();
          return;
        }

        // Local session kontrolü: Firestore listener kurma
        if (isLocalSessionId(stored.sessionId)) {
          // Local session: AsyncStorage snapshot + pending queue payload ile AlarmSession oluştur
          const payload = await getLocalSessionPayload(stored.sessionId);
          
          const snapshotToAlarmSession: AlarmSession = {
            id: stored.sessionId,
            userId: stored.userId,
            targetType: stored.targetType ?? payload?.payload.targetType ?? 'CUSTOM',
            targetId: stored.targetId ?? payload?.payload.targetId ?? '',
            distanceThresholdMeters: payload?.payload.distanceThresholdMeters ?? stored.distanceThresholdMeters,
            status: stored.status,
            targetName: payload?.payload.targetName ?? stored.targetName,
            targetLat: payload?.payload.targetLat ?? stored.targetLat,
            targetLon: payload?.payload.targetLon ?? stored.targetLon,
            transportMode: (stored.transportMode ?? payload?.payload.transportMode) as TransportMode | undefined,
            minutesBefore: stored.minutesBefore ?? payload?.payload.minutesBefore ?? undefined,
            createdAt: payload?.createdAt ?? Date.now(),
            updatedAt: Date.now(),
          };
          setActiveAlarmSessionId(stored.sessionId);
          setActiveAlarmSession(snapshotToAlarmSession);
          // Persist/clear mantığı local için de geçerli
          if (stored.status === 'ACTIVE' || stored.status === 'TRIGGERED') {
            persistActiveAlarmSnapshot(snapshotToAlarmSession).catch((error) => {
              if (__DEV__) {
                console.warn('[AlarmContext] persistActiveAlarmSnapshot hatası', error);
              }
            });
          } else {
            clearStoredActiveAlarm().catch((error) => {
              if (__DEV__) {
                console.warn('[AlarmContext] clearStoredActiveAlarm hatası', error);
              }
            });
          }
          return;
        }

        // Remote session: Firestore listener kur
        try {
          const sessionRef = doc(db, 'alarmSessions', stored.sessionId);
          unsubscribe = onSnapshot(
            sessionRef,
            (snap) => {
              try {
                if (!snap.exists()) {
                  setActiveAlarmSessionId(null);
                  setActiveAlarmSession(null);
                  clearStoredActiveAlarm().catch((error) => {
                    if (__DEV__) {
                      console.warn('[AlarmContext] clearStoredActiveAlarm hatası', error);
                    }
                  });
                  return;
                }

                const sessionData = snap.data() as Omit<AlarmSession, 'id'>;
                const session: AlarmSession = {
                  id: snap.id,
                  ...sessionData,
                };

                setActiveAlarmSessionId(session.id);
                setActiveAlarmSession(session);

                if (session.status === 'ACTIVE' || session.status === 'TRIGGERED') {
                  persistActiveAlarmSnapshot(session).catch((error) => {
                    if (__DEV__) {
                      console.warn('[AlarmContext] persistActiveAlarmSnapshot hatası', error);
                    }
                  });
                } else {
                  clearStoredActiveAlarm().catch((error) => {
                    if (__DEV__) {
                      console.warn('[AlarmContext] clearStoredActiveAlarm hatası', error);
                    }
                  });
                }
              } catch (snapshotError) {
                if (__DEV__) {
                  console.warn('[AlarmContext] Snapshot data işleme hatası', snapshotError);
                }
                captureError(snapshotError, 'AlarmContext/snapshotData');
              }
            },
            (error) => {
              if (__DEV__) {
                console.warn('[AlarmContext] active alarm listener error', error);
              }
              captureError(error, 'AlarmContext/onSnapshot');
            },
          );
        } catch (listenerError) {
          if (__DEV__) {
            console.warn('[AlarmContext] Firestore listener oluşturma hatası', listenerError);
          }
          captureError(listenerError, 'AlarmContext/createListener');
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[AlarmContext] restoreActiveAlarm error', error);
        }
        captureError(error, 'AlarmContext/restoreActiveAlarm');
      }
    };

    restoreActiveAlarm();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [clearStoredActiveAlarm, persistActiveAlarmSnapshot, user, getLocalSessionPayload]);

  // Offline queue sync mekanizması (P0: network gelince pending session'ları sync et)
  useEffect(() => {
    if (!isOnline || !user) {
      return;
    }

    let mounted = true;

    const syncPendingAlarmSessions = async () => {
      try {
        const pending = await getPendingAlarmSessionCreates();
        if (pending.length === 0) {
          return;
        }

        if (__DEV__) {
          console.log(`[AlarmContext] ${pending.length} pending alarm session sync ediliyor...`);
        }

        for (const item of pending) {
          if (!mounted) {
            break;
          }

          try {
            // Firestore'a yaz
            const docPayload = {
              ...item.payload,
              userId: item.userId,
              deletedAt: null, // Soft delete için null olarak ekle
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            const ref = await addDoc(collection(db, 'alarmSessions'), docPayload);
            const remoteDocId = ref.id;

            // Eğer aktif alarm session local ise, remote id ile güncelle
            if (
              activeAlarmSessionId === item.localSessionId &&
              isLocalSessionId(item.localSessionId)
            ) {
              // activeAlarmSession null olabilir, bu durumda payload'dan oluştur
              let updatedSession: AlarmSession;
              if (activeAlarmSession) {
                updatedSession = {
                  ...activeAlarmSession,
                  id: remoteDocId,
                };
              } else {
                // activeAlarmSession yoksa payload'dan oluştur
                const now = Date.now();
                updatedSession = {
                  id: remoteDocId,
                  userId: item.userId,
                  targetType: item.payload.targetType,
                  targetId: item.payload.targetId,
                  distanceThresholdMeters: item.payload.distanceThresholdMeters,
                  status: item.payload.status,
                  targetName: item.payload.targetName,
                  targetLat: item.payload.targetLat,
                  targetLon: item.payload.targetLon,
                  transportMode: (item.payload.transportMode as TransportMode | null) ?? undefined,
                  minutesBefore: item.payload.minutesBefore ?? undefined,
                  createdAt: item.createdAt,
                  updatedAt: now,
                };
              }
              setActiveAlarmSessionId(remoteDocId);
              setActiveAlarmSession(updatedSession);
              await persistActiveAlarmSnapshot(updatedSession);

              if (__DEV__) {
                console.log(
                  `[AlarmContext] Local session ${item.localSessionId} -> remote ${remoteDocId} güncellendi`
                );
              }
            }

            // Queue'dan kaldır
            await removePendingAlarmSessionCreate(item.localSessionId);
          } catch (error) {
            // Sync hatası: item'ı queue'da bırak (sonra tekrar dener)
            if (__DEV__) {
              console.warn(
              `[AlarmContext] Pending session sync hatası (${item.localSessionId}):`,
              error
            );
            }
            captureError(error, 'AlarmContext/syncPendingAlarmSessions/item');
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[AlarmContext] Pending alarm sessions sync hatası:', error);
        }
        captureError(error, 'AlarmContext/syncPendingAlarmSessions');
      }
    };

    // Kısa bir delay ile sync et (network state değişikliği stabilize olsun)
    const timeoutId = setTimeout(() => {
      syncPendingAlarmSessions();
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [isOnline, user, activeAlarmSessionId, activeAlarmSession, persistActiveAlarmSnapshot]);

  const startAlarmSession: AlarmContextValue['startAlarmSession'] = useCallback(
    async ({
      targetType,
      targetId,
      distanceThresholdMeters,
      transportMode,
      minutesBefore,
      targetSnapshot, // Opsiyonel: Eğer target zaten yüklenmişse tekrar fetch etmeye gerek yok
    }) => {
      if (!user) {
        throw new Error('Devam etmek için giriş yapmalısın.');
      }

      try {
        // Eğer targetSnapshot verilmişse onu kullan, yoksa fetch et
        let targetData: TransitStop | UserTarget | null = null;
        if (targetSnapshot) {
          targetData = targetSnapshot;
        } else {
          targetData =
            targetType === 'STOP' ? await fetchStopById(targetId) : await getUserTargetById(targetId);
        }
        
        if (!targetData) {
          const error = new Error('Hedef bilgisi alınamadı');
          captureError(error, 'AlarmContext/startAlarmSession/targetData');
          Alert.alert('Hedef bulunamadı', 'Alarm kurulurken hedef bilgisi alınamadı.');
          throw error;
        }

        const now = Date.now();
        const targetLat = 'latitude' in targetData ? targetData.latitude : targetData.lat;
        const targetLon = 'longitude' in targetData ? targetData.longitude : targetData.lon;

        // Offline queue mekanizması (P0: network yokken alarm kurulabilsin)
        if (!isOnline) {
          // Offline: local session oluştur ve queue'ya ekle
          const localSessionId = `local-${Date.now()}`;
          const localSession: AlarmSession = {
            id: localSessionId,
            userId: user.uid,
            targetType,
            targetId,
            distanceThresholdMeters,
            status: 'ACTIVE',
            targetName: targetData.name,
            targetLat,
            targetLon,
            transportMode,
            minutesBefore,
            createdAt: now,
            updatedAt: now,
          };

          // Queue'ya ekle
          await addPendingAlarmSessionCreate({
            localSessionId,
            userId: user.uid,
            payload: {
              targetType,
              targetId,
              distanceThresholdMeters,
              status: 'ACTIVE',
              targetName: targetData.name,
              targetLat,
              targetLon,
              transportMode: transportMode ?? null,
              minutesBefore: minutesBefore ?? null,
            },
            createdAt: now,
          });

          // Local session'ı aktif et
          setActiveAlarmSessionId(localSession.id);
          setActiveAlarmSession(localSession);
          await persistActiveAlarmSnapshot(localSession);

          if (__DEV__) {
            console.log('[AlarmContext] Offline modda alarm session oluşturuldu:', localSessionId);
          }

          return localSession;
        }

        // Online: normal Firestore write
        const docPayload = {
          userId: user.uid,
          targetType,
          targetId,
          distanceThresholdMeters,
          status: 'ACTIVE',
          targetName: targetData.name,
          targetLat,
          targetLon,
          transportMode: transportMode ?? null,
          minutesBefore: minutesBefore ?? null,
          deletedAt: null, // Soft delete için null olarak ekle
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const ref = await addDoc(collection(db, 'alarmSessions'), docPayload);
        const session: AlarmSession = {
          id: ref.id,
          userId: user.uid,
          targetType,
          targetId,
          distanceThresholdMeters,
          status: 'ACTIVE',
          targetName: targetData.name,
          targetLat,
          targetLon,
          transportMode,
          minutesBefore,
          createdAt: now,
          updatedAt: now,
        };
        setActiveAlarmSessionId(session.id);
        setActiveAlarmSession(session);
        await persistActiveAlarmSnapshot(session);
        return session;
      } catch (error) {
        captureError(error, 'AlarmContext/startAlarmSession');
        throw error;
      }
    },
    [persistActiveAlarmSnapshot, user, isOnline],
  );

  const cancelAlarmSession: AlarmContextValue['cancelAlarmSession'] = useCallback(
    async (alarmSessionId) => {
      try {
        // Local session kontrolü: Firestore update yapma
        if (isLocalSessionId(alarmSessionId)) {
          // Queue'dan kaldır
          await removePendingAlarmSessionCreate(alarmSessionId);
          // State'i temizle
          if (activeAlarmSessionId === alarmSessionId) {
            setActiveAlarmSessionId(null);
            setActiveAlarmSession(null);
          }
          // AsyncStorage'ı temizle
          await clearStoredActiveAlarm();
          return;
        }

        // Remote session: Firestore'a yaz
        await updateDoc(doc(db, 'alarmSessions', alarmSessionId), {
          status: 'CANCELLED',
          updatedAt: serverTimestamp(),
        });
        if (activeAlarmSessionId === alarmSessionId) {
          setActiveAlarmSessionId(null);
          setActiveAlarmSession(null);
        }
        await clearStoredActiveAlarm();
      } catch (error) {
        captureError(error, 'AlarmContext/cancelAlarmSession');
        throw error;
      }
    },
    [activeAlarmSessionId, clearStoredActiveAlarm],
  );

  const markAlarmTriggered: AlarmContextValue['markAlarmTriggered'] = useCallback(
    async (alarmSessionId) => {
      try {
        // Local session kontrolü: Firestore update yapma
        if (isLocalSessionId(alarmSessionId)) {
          // Local state'i TRIGGERED yap ve persist et
          if (activeAlarmSessionId === alarmSessionId && activeAlarmSession) {
            const nextSession = { ...activeAlarmSession, status: 'TRIGGERED' as AlarmStatus };
            setActiveAlarmSession(nextSession);
            await persistActiveAlarmSnapshot(nextSession);
          }
          return;
        }

        // Remote session: Firestore'a yaz
        await updateDoc(doc(db, 'alarmSessions', alarmSessionId), {
          status: 'TRIGGERED',
          triggeredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        if (activeAlarmSessionId === alarmSessionId && activeAlarmSession) {
          const nextSession = { ...activeAlarmSession, status: 'TRIGGERED' as AlarmStatus };
          setActiveAlarmSession(nextSession);
          await persistActiveAlarmSnapshot(nextSession);
        }
      } catch (error) {
        captureError(error, 'AlarmContext/markAlarmTriggered');
        throw error;
      }
    },
    [activeAlarmSession, activeAlarmSessionId, persistActiveAlarmSnapshot],
  );

  const refreshAlarmSession: AlarmContextValue['refreshAlarmSession'] = useCallback(
    async (alarmSessionId: string) => {
      // Local session kontrolü: Firestore'a gitme
      if (isLocalSessionId(alarmSessionId)) {
        // AsyncStorage snapshot + pending payload ile AlarmSession oluştur
        try {
          const raw = await AsyncStorage.getItem(ACTIVE_ALARM_STORAGE_KEY);
          if (!raw) {
            return null;
          }
          const stored = JSON.parse(raw) as ActiveAlarmStateSnapshot;
          if (stored.sessionId !== alarmSessionId) {
            return null;
          }
          
          const payload = await getLocalSessionPayload(alarmSessionId);
          
          const session: AlarmSession = {
            id: stored.sessionId,
            userId: stored.userId,
            targetType: stored.targetType ?? payload?.payload.targetType ?? 'CUSTOM',
            targetId: stored.targetId ?? payload?.payload.targetId ?? '',
            distanceThresholdMeters: payload?.payload.distanceThresholdMeters ?? stored.distanceThresholdMeters,
            status: stored.status,
            targetName: payload?.payload.targetName ?? stored.targetName,
            targetLat: payload?.payload.targetLat ?? stored.targetLat,
            targetLon: payload?.payload.targetLon ?? stored.targetLon,
            transportMode: (stored.transportMode ?? payload?.payload.transportMode) as TransportMode | undefined,
            minutesBefore: stored.minutesBefore ?? payload?.payload.minutesBefore ?? undefined,
            createdAt: payload?.createdAt ?? Date.now(),
            updatedAt: Date.now(),
          };
          
          // Remote branch ile aynı mantık: status ACTIVE/TRIGGERED ise persist, değilse clear
          if (session.status === 'ACTIVE' || session.status === 'TRIGGERED') {
            setActiveAlarmSessionId(session.id);
            setActiveAlarmSession(session);
            await persistActiveAlarmSnapshot(session);
          } else {
            await clearStoredActiveAlarm();
          }
          
          return session;
        } catch (error) {
          if (__DEV__) {
            console.warn('[AlarmContext] Local session refresh hatası', error);
          }
          return null;
        }
      }

      // Remote session: Firestore'dan oku
      const snapshot = await getDoc(doc(db, 'alarmSessions', alarmSessionId));
      if (!snapshot.exists()) {
        return null;
      }
      const sessionData = snapshot.data() as Omit<AlarmSession, 'id'>;
      const session: AlarmSession = {
        id: snapshot.id,
        ...sessionData,
      };
      if (session.status === 'ACTIVE' || session.status === 'TRIGGERED') {
        setActiveAlarmSessionId(session.id);
        setActiveAlarmSession(session);
        await persistActiveAlarmSnapshot(session);
      } else {
        await clearStoredActiveAlarm();
      }
      return session;
    },
    [clearStoredActiveAlarm, persistActiveAlarmSnapshot, getLocalSessionPayload],
  );

  const clearActiveAlarm = useCallback(() => {
    setActiveAlarmSessionId(null);
    setActiveAlarmSession(null);
    clearStoredActiveAlarm().catch((error) => {
      if (__DEV__) {
        console.warn('[AlarmContext] clearStoredActiveAlarm hatası', error);
      }
    });
  }, [clearStoredActiveAlarm]);

  const value = useMemo(
    () => ({
      activeAlarmSessionId,
      activeAlarmSession,
      startAlarmSession,
      cancelAlarmSession,
      markAlarmTriggered,
      refreshAlarmSession,
      clearActiveAlarm,
    }),
    [
      activeAlarmSessionId,
      activeAlarmSession,
      startAlarmSession,
      cancelAlarmSession,
      markAlarmTriggered,
      refreshAlarmSession,
      clearActiveAlarm,
    ],
  );

  return <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>;
};

export const useAlarm = () => {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error('useAlarm sadece AlarmProvider içinde kullanılabilir');
  }
  return context;
};

