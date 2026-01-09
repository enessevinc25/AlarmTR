import { useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import ScreenContainer from '../../components/common/ScreenContainer';
import { captureError } from '../../utils/errorReporting';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAlarm } from '../../context/AlarmContext';
import { HomeStackParamList } from '../../navigation/navigationTypes';
import { goToPermissionsHelp, goToSamsungBatteryHelp } from '../../navigation/navigationService';
import { useAppTheme } from '../../theme/useAppTheme';
import { AlarmSession, TransitStop, UserTarget } from '../../types/models';
import { getUserTargetById } from '../../services/stopsService';
import { fetchStopById } from '../../services/transitProvider';
import { useNetwork } from '../../context/NetworkContext';
import { db } from '../../services/firebase';
import {
  LOCATION_TASK_NAME,
  startForegroundLocationTracking,
  stopForegroundLocationTracking,
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  startGeofencing,
  stopGeofencing,
} from '../../services/locationService';
import { getDistanceInMeters } from '../../utils/distance';
import { shouldWriteSessionUpdate } from '../../utils/telemetryThrottle';
import { triggerImmediateAlarmNotification } from '../../services/alarmService';
import { isLocalSessionId } from '../../services/offlineQueueService';
import {
  ensureNotificationPermissions,
  showNotificationPermissionDeniedDialog,
} from '../../services/notificationService';
import { syncPendingEventsToFirestore } from '../../services/alarmBackgroundSync';

type Props = NativeStackScreenProps<HomeStackParamList, 'ActiveAlarm'>;

const BATTERY_WARNING_SHOWN_KEY = 'LASTSTOP_BATTERY_WARNING_SHOWN';

const ActiveAlarmScreen = ({ route, navigation }: Props) => {
  const { alarmSessionId } = route.params;
  const {
    activeAlarmSession,
    refreshAlarmSession,
    cancelAlarmSession,
    markAlarmTriggered,
    clearActiveAlarm,
  } = useAlarm();
  const { isOnline } = useNetwork();
  const { colors } = useAppTheme();
  
  // Samsung cihaz tespiti
  const isSamsung = Platform.OS === 'android' && (Device.manufacturer?.toLowerCase().includes('samsung') ?? false);

  const [session, setSession] = useState<AlarmSession | null>(null);
  const [target, setTarget] = useState<TransitStop | UserTarget | null>(null);
  const [lastKnownDistanceMeters, setLastKnownDistanceMeters] = useState<number | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [backgroundTrackingEnabled, setBackgroundTrackingEnabled] = useState<boolean | null>(null);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<
    boolean | null
  >(null);
  const [showBatteryWarning, setShowBatteryWarning] = useState(false);
  const [lowAccuracyWarning, setLowAccuracyWarning] = useState(false);
  const [backgroundPermissionWarning, setBackgroundPermissionWarning] = useState(false);
  const triggeredRef = useRef(false);
  const lastTelemetryUpdateRef = useRef(0);
  const lastTelemetryLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lowAccuracyWarningShownRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const loadSessionAndTarget = async () => {
      try {
        let sessionData =
          activeAlarmSession && activeAlarmSession.id === alarmSessionId
            ? activeAlarmSession
            : await refreshAlarmSession(alarmSessionId);
        if (!mounted) {
          return;
        }
        setSession(sessionData ?? null);
        if (sessionData) {
          // Fallback target üret (offline veya fetch başarısız olursa)
          let targetData: TransitStop | UserTarget | null = null;
          
          // Offline veya targetId boş ise direkt fallback target set et
          if (!isOnline || !sessionData.targetId) {
            if (sessionData.targetType === 'STOP') {
              targetData = {
                id: sessionData.targetId || 'fallback-stop',
                name: sessionData.targetName,
                latitude: sessionData.targetLat,
                longitude: sessionData.targetLon,
                city: undefined,
                addressDescription: undefined,
                lineIds: [],
              };
            } else {
              targetData = {
                id: sessionData.targetId || 'fallback-custom',
                userId: sessionData.userId,
                name: sessionData.targetName,
                lat: sessionData.targetLat,
                lon: sessionData.targetLon,
                radiusMeters: sessionData.distanceThresholdMeters,
                createdAt: sessionData.createdAt || Date.now(),
                updatedAt: sessionData.updatedAt || Date.now(),
              };
            }
          } else {
            // Online ise fetch dene, hata olursa fallback'a düş
            try {
              targetData =
                sessionData.targetType === 'STOP'
                  ? await fetchStopById(sessionData.targetId)
                  : await getUserTargetById(sessionData.targetId);
            } catch (fetchError) {
              if (__DEV__) {
                console.warn('[ActiveAlarmScreen] Target fetch hatası, fallback kullanılıyor', fetchError);
              }
              // Fallback target oluştur
              if (sessionData.targetType === 'STOP') {
                targetData = {
                  id: sessionData.targetId,
                  name: sessionData.targetName,
                  latitude: sessionData.targetLat,
                  longitude: sessionData.targetLon,
                  city: undefined,
                  addressDescription: undefined,
                  lineIds: [],
                };
              } else {
                targetData = {
                  id: sessionData.targetId,
                  userId: sessionData.userId,
                  name: sessionData.targetName,
                  lat: sessionData.targetLat,
                  lon: sessionData.targetLon,
                  radiusMeters: sessionData.distanceThresholdMeters,
                  createdAt: sessionData.createdAt || Date.now(),
                  updatedAt: sessionData.updatedAt || Date.now(),
                };
              }
            }
          }
          
          if (mounted) {
            setTarget(targetData);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(error);
        }
        captureError(error, 'ActiveAlarmScreen/loadSessionAndTarget');
        if (mounted) {
          setTrackingError('Alarm verisi alınamadı.');
        }
      }
    };
    loadSessionAndTarget();
    return () => {
      mounted = false;
    };
  }, [activeAlarmSession, alarmSessionId, refreshAlarmSession, isOnline]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const bgStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (mounted) {
          setBackgroundTrackingEnabled(bgStarted);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Background tracking durumu okunamadı', error);
        }
        captureError(error, 'ActiveAlarmScreen/checkBackgroundTracking');
      }

      const notifResult = await ensureNotificationPermissions();
      if (mounted) {
        setNotificationPermissionGranted(notifResult.granted);
        // İzin reddedildiyse ve tekrar sorulamıyorsa diyalog göster
        if (!notifResult.granted && !notifResult.canAskAgain) {
          showNotificationPermissionDeniedDialog();
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(BATTERY_WARNING_SHOWN_KEY);
        if (mounted) {
          setShowBatteryWarning(stored !== 'true');
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Pil uyarısı durumu okunamadı', error);
        }
        captureError(error, 'ActiveAlarmScreen/checkBatteryWarning');
        if (mounted) {
          setShowBatteryWarning(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!session || !target) {
      // Session veya target yoksa location tracking başlatma
      return;
    }

    // Session status kontrolü - sadece ACTIVE session'lar için tracking başlat
    if (session.status !== 'ACTIVE') {
      if (__DEV__) {
        console.warn('[ActiveAlarmScreen] Session status is not ACTIVE, skipping location tracking:', session.status);
      }
      return;
    }

    let canceled = false;

    const startTracking = async () => {
      lastTelemetryUpdateRef.current = 0;
      try {
        // İlk mesafe hesaplaması (dinamik interval için)
        const targetLat = 'latitude' in target ? target.latitude : target.lat;
        const targetLon = 'longitude' in target ? target.longitude : target.lon;
        
        // İlk konum al ve mesafe hesapla (hemen göster)
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const initialDistance = getDistanceInMeters(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            targetLat,
            targetLon,
          );
          if (!canceled) {
            setLastKnownDistanceMeters(initialDistance);
          }
        } catch (locationError) {
          if (__DEV__) {
            console.warn('[ActiveAlarmScreen] İlk konum alınamadı, tracking devam edecek:', locationError);
          }
          // İlk konum alınamazsa tracking devam eder, mesafe sonra güncellenir
        }
        
        const initialDistanceForInterval = session.lastKnownDistanceMeters || session.distanceThresholdMeters * 2;

        // Background tracking opsiyonel: izin reddedilirse foreground devam eder
        try {
          await startBackgroundLocationTracking(initialDistanceForInterval);
          if (!canceled) {
            setBackgroundTrackingEnabled(true);
          }
          
          // Geofencing fallback ekle (Samsung throttling'e karşı)
          try {
            await startGeofencing(targetLat, targetLon, session.distanceThresholdMeters);
          } catch (geofenceError) {
            // Geofencing başarısız olsa bile location tracking devam eder
            if (__DEV__) {
              console.warn('[ActiveAlarmScreen] Geofencing başlatılamadı', geofenceError);
            }
          }
        } catch (bgError: any) {
          // Expo Go'da bu hata beklenir
          if (bgError?.message?.includes('Expo Go')) {
            if (__DEV__) {
              console.log('[ActiveAlarmScreen] Background tracking Expo Go\'da desteklenmiyor, sadece foreground tracking kullanılacak');
            }
            setBackgroundTrackingEnabled(false);
          } else if (
            bgError?.message?.includes('permission') ||
            bgError?.message?.includes('Permission') ||
            bgError?.message?.includes('izin') ||
            bgError?.message?.includes('Background location izni verilmedi')
          ) {
            // Background izin reddedildi: foreground tracking devam eder
            if (__DEV__) {
              console.log('[ActiveAlarmScreen] Background location izni reddedildi, sadece foreground tracking kullanılacak');
            }
            setBackgroundTrackingEnabled(false);
            // Kullanıcıya küçük bir uyarı göster
            setBackgroundPermissionWarning(true);
          } else {
            // Diğer hatalar: logla ama foreground tracking devam etsin
            if (__DEV__) {
              console.warn('[ActiveAlarmScreen] Background tracking başlatılamadı:', bgError);
            }
            captureError(bgError, 'ActiveAlarmScreen/startBackgroundTracking');
            setBackgroundTrackingEnabled(false);
          }
        }
        // Foreground location tracking başlat (dinamik interval ile)
        await startForegroundLocationTracking(async (location) => {
          if (canceled) {
            return;
          }

          // Session ve target kontrolü (cleanup sırasında null olabilir)
          if (!session || !target) {
            if (__DEV__) {
              console.warn('[ActiveAlarmScreen] Session or target is null, skipping location update');
            }
            return;
          }

          // GPS accuracy kontrolü (P0: yanlış tetikleme riskini azalt)
          const accuracy = location.coords.accuracy ?? null;
          const ACCURACY_THRESHOLD = 50; // metre

          if (accuracy !== null && accuracy > ACCURACY_THRESHOLD) {
            // Düşük accuracy: tetikleme ve telemetry'yi skip et
            if (__DEV__) {
              console.log(
                `[ActiveAlarmScreen] GPS accuracy düşük (${accuracy.toFixed(1)}m > ${ACCURACY_THRESHOLD}m), location update skip edildi`
              );
            }

            // Kullanıcıya spam yapmadan bir kere uyarı göster
            if (!lowAccuracyWarningShownRef.current) {
              setLowAccuracyWarning(true);
              lowAccuracyWarningShownRef.current = true;
              // 30 saniye sonra uyarıyı gizle (tekrar accuracy düzelirse tekrar gösterilebilir)
              setTimeout(() => {
                if (accuracy <= ACCURACY_THRESHOLD) {
                  setLowAccuracyWarning(false);
                  lowAccuracyWarningShownRef.current = false;
                }
              }, 30000);
            }
            return; // Bu location update'i skip et
          } else {
            // Accuracy iyi veya null: uyarıyı temizle (null ise normal akışa devam et)
            if (lowAccuracyWarningShownRef.current) {
              setLowAccuracyWarning(false);
              lowAccuracyWarningShownRef.current = false;
            }
          }

          const targetLat = 'latitude' in target ? target.latitude : target.lat;
          const targetLon = 'longitude' in target ? target.longitude : target.lon;
          
          const distance = getDistanceInMeters(
            location.coords.latitude,
            location.coords.longitude,
            targetLat,
            targetLon,
          );
          
          if (!canceled) {
            setLastKnownDistanceMeters(distance);
          }
          
          // Dinamik interval güncellemesi (mesafe değiştiğinde)
          // Not: React Native Location API'si interval'ı runtime'da değiştiremez
          // Bu yüzden sadece ilk başlatmada kullanılıyor

          // Telemetry throttle kontrolü
          const shouldWrite = shouldWriteSessionUpdate(
            lastTelemetryUpdateRef.current,
            lastTelemetryLocationRef.current,
            { latitude: location.coords.latitude, longitude: location.coords.longitude },
            session.status
          );

          if (shouldWrite) {
            const now = Date.now();
            lastTelemetryUpdateRef.current = now;
            lastTelemetryLocationRef.current = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            // Local session kontrolü (P0: offline queue)
            if (!isLocalSessionId(session.id)) {
              try {
                await updateDoc(doc(db, 'alarmSessions', session.id), {
                  lastKnownDistanceMeters: distance,
                  updatedAt: serverTimestamp(),
                });
              } catch (err) {
                captureError(err, 'ActiveAlarmScreen/updateTelemetry');
              }
            }
          }

          if (!triggeredRef.current && distance <= session.distanceThresholdMeters) {
            triggeredRef.current = true;
            stopForegroundLocationTracking();
            await stopBackgroundLocationTracking();
            await stopGeofencing();
            setBackgroundTrackingEnabled(false);
            // markAlarmTriggered her durumda çağrılmalı (local/remote ayrımı AlarmContext'te yapılıyor)
            await markAlarmTriggered(session.id);
            await triggerImmediateAlarmNotification(session);
            navigation.replace('AlarmTriggered', { alarmSessionId: session.id });
          }
        });
      } catch (error) {
        if (__DEV__) {
          console.warn(error);
        }
        captureError(error, 'ActiveAlarmScreen/startTracking');
        setTrackingError('Konum takibi başlatılamadı.');
        setBackgroundTrackingEnabled(false);
      }
    };

    startTracking();

    return () => {
      canceled = true;
      stopForegroundLocationTracking();
      void stopBackgroundLocationTracking().finally(() => setBackgroundTrackingEnabled(false));
      void stopGeofencing();
    };
  }, [session, target, markAlarmTriggered, navigation]);

  const handleDismissBatteryWarning = async () => {
    setShowBatteryWarning(false);
    try {
      await AsyncStorage.setItem(BATTERY_WARNING_SHOWN_KEY, 'true');
    } catch (error) {
      if (__DEV__) {
        console.warn('Pil uyarısı kaydedilemedi', error);
      }
      captureError(error, 'ActiveAlarmScreen/dismissBatteryWarning');
    }
  };

  const handleCancel = async () => {
    await cancelAlarmSession(alarmSessionId);
    clearActiveAlarm();
    stopForegroundLocationTracking();
    await stopBackgroundLocationTracking();
    await stopGeofencing();
    setBackgroundTrackingEnabled(false);
    navigation.popToTop();
  };

  if (!session || !target) {
    return (
      <ScreenContainer>
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, color: colors.textMuted }}>Hedef</Text>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>{target.name}</Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          Mesafe eşiği: {session.distanceThresholdMeters} m
        </Text>
        {isLocalSessionId(session.id) && (
          <View style={styles.offlineSyncWarning}>
            <Text style={styles.offlineSyncWarningText}>
              🔄 Çevrimdışı: Senkron bekliyor
            </Text>
          </View>
        )}
      </View>

      <View
        style={{
          padding: 24,
          borderRadius: 16,
          backgroundColor: colors.primary,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: colors.primarySoft, textAlign: 'center' }}>Hedefe kalan mesafe</Text>
        <Text style={{ fontSize: 48, fontWeight: '800', color: colors.white, textAlign: 'center' }}>
          {lastKnownDistanceMeters !== null ? `${lastKnownDistanceMeters} m` : '---'}
        </Text>
      </View>

      {showBatteryWarning ? (
        <View style={[styles.batteryWarning, { backgroundColor: colors.warningSoft }]}>
          <Text style={[styles.batteryWarningTitle, { color: colors.warning }]}>Önemli Hatırlatma</Text>
          <Text style={[styles.batteryWarningText, { color: colors.text }]}>
            Bazı Android cihazlar arka plandaki uygulamaları otomatik olarak kapatabilir. Lütfen
            LastStop Alarm TR için pil/arka plan optimizasyonlarını kapatın ve uygulamayı son
            uygulamalar ekranından temizlemeyin. Aksi halde alarm sizi uyandıramayabilir.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              onPress={goToPermissionsHelp}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.actionButtonText, { color: colors.white }]}>Ayarları Aç</Text>
            </TouchableOpacity>
            {isSamsung && (
              <TouchableOpacity
                onPress={goToSamsungBatteryHelp}
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.actionButtonText, { color: colors.white }]}>Samsung Rehberi</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={handleDismissBatteryWarning}
            style={[styles.batteryWarningButton, { backgroundColor: colors.gray800 }]}
          >
            <Text style={[styles.batteryWarningButtonText, { color: colors.white }]}>Anladım</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {lowAccuracyWarning ? (
        <View style={styles.lowAccuracyWarning}>
          <Text style={styles.lowAccuracyWarningText}>
            ⚠️ GPS sinyali zayıf. Alarm doğruluğu etkilenebilir.
          </Text>
        </View>
      ) : null}

      {backgroundPermissionWarning ? (
        <View style={[styles.backgroundPermissionWarning, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.backgroundPermissionWarningText, { color: colors.text }]}>
            ℹ️ Arka planda çalışması için "Her zaman izin ver" önerilir; ekran açıkken çalışmaya devam eder.
          </Text>
          <TouchableOpacity
            onPress={goToPermissionsHelp}
            style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 12 }]}
          >
            <Text style={[styles.actionButtonText, { color: colors.white }]}>İzinleri Düzenle</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {notificationPermissionGranted === false ? (
        <View style={[styles.notificationWarning, { backgroundColor: colors.dangerSoft }]}>
          <Text style={[styles.notificationWarningText, { color: colors.text }]}>
            🔔 Bildirim izni kapalı. Alarmın sizi uyandırabilmesi için bildirim iznini açın.
          </Text>
          <TouchableOpacity
            onPress={goToPermissionsHelp}
            style={[styles.actionButton, { backgroundColor: colors.danger, marginTop: 12 }]}
          >
            <Text style={[styles.actionButtonText, { color: colors.white }]}>Bildirimi Aç</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {__DEV__ && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>Alarm Durumu</Text>
          <Text style={styles.debugItem}>
            Arka plan konum takibi:{' '}
            {backgroundTrackingEnabled === null
              ? 'Kontrol ediliyor...'
              : backgroundTrackingEnabled
                ? 'AÇIK'
                : 'KAPALI'}
          </Text>
          <Text style={styles.debugItem}>
            Bildirim izni:{' '}
            {notificationPermissionGranted === null
              ? 'Kontrol ediliyor...'
              : notificationPermissionGranted
                ? 'VAR'
                : 'YOK (Bildirimler kapalı olabilir)'}
          </Text>
          <Text style={styles.debugItem}>
            Son bilinen mesafe:{' '}
            {lastKnownDistanceMeters != null ? `${lastKnownDistanceMeters} m` : 'Henüz hesaplanmadı'}
          </Text>
          {trackingError ? <Text style={styles.debugError}>{trackingError}</Text> : null}
        </View>
      )}

      <PrimaryButton
        title="Alarmı İptal Et"
        onPress={handleCancel}
        style={{ backgroundColor: '#be123c' }}
      />
    </ScreenContainer>
  );
};

export default ActiveAlarmScreen;

const styles = StyleSheet.create({
  batteryWarning: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f97316',
  },
  batteryWarningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2933',
    marginBottom: 4,
  },
  batteryWarningText: {
    fontSize: 12,
    color: '#111827',
  },
  batteryWarningButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1f2937',
  },
  batteryWarningButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f9fafb',
  },
  debugPanel: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  debugItem: {
    fontSize: 12,
    color: '#cbd5f5',
    marginTop: 2,
  },
  debugError: {
    fontSize: 12,
    color: '#f97373',
    marginTop: 8,
  },
  lowAccuracyWarning: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fbbf24',
  },
  lowAccuracyWarningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2933',
    textAlign: 'center',
  },
  backgroundPermissionWarning: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  backgroundPermissionWarningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  notificationWarning: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
  },
  notificationWarningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  offlineSyncWarning: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  offlineSyncWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});


