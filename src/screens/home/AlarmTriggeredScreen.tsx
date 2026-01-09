import { useEffect, useState, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ScreenContainer from '../../components/common/ScreenContainer';
import PrimaryButton from '../../components/common/PrimaryButton';
import { HomeStackParamList } from '../../navigation/navigationTypes';
import { useAlarm, ACTIVE_ALARM_STORAGE_KEY, ActiveAlarmStateSnapshot } from '../../context/AlarmContext';
import { AlarmSession, TransitStop, UserTarget } from '../../types/models';
import { getUserTargetById } from '../../services/stopsService';
import { fetchStopById } from '../../services/transitProvider';
import { isLocalSessionId } from '../../services/offlineQueueService';
import { syncPendingEventsToFirestore } from '../../services/alarmBackgroundSync';
import { scheduleAlarmNotification } from '../../services/alarmService';

type Props = NativeStackScreenProps<HomeStackParamList, 'AlarmTriggered'>;

const AlarmTriggeredScreen = ({ route, navigation }: Props) => {
  const { alarmSessionId } = route.params;
  const { activeAlarmSession, refreshAlarmSession, clearActiveAlarm } = useAlarm();
  const [session, setSession] = useState<AlarmSession | null>(null);
  const [target, setTarget] = useState<TransitStop | UserTarget | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const load = async () => {
      // Pending sync events'leri sync et (foreground'da)
      try {
        await syncPendingEventsToFirestore();
      } catch (syncError) {
        if (__DEV__) {
          console.warn('[AlarmTriggeredScreen] Sync hatası', syncError);
        }
      }
      // Local session kontrolü: Firestore'a gitme
      if (isLocalSessionId(alarmSessionId)) {
        // activeAlarmSession varsa onu kullan
        if (activeAlarmSession && activeAlarmSession.id === alarmSessionId) {
          setSession(activeAlarmSession);
          // AsyncStorage'dan snapshot oku ve targetType'a göre target oluştur
          try {
            const raw = await AsyncStorage.getItem(ACTIVE_ALARM_STORAGE_KEY);
            if (raw) {
              const stored = JSON.parse(raw) as ActiveAlarmStateSnapshot;
              const targetType = stored.targetType ?? activeAlarmSession.targetType ?? 'CUSTOM';
              const targetId = stored.targetId ?? activeAlarmSession.targetId ?? stored.sessionId;
              
              if (targetType === 'STOP') {
                const minimalTarget: TransitStop = {
                  id: targetId,
                  name: stored.targetName ?? 'Durak',
                  latitude: activeAlarmSession.targetLat,
                  longitude: activeAlarmSession.targetLon,
                  lineIds: [],
                  addressDescription: undefined,
                };
                setTarget(minimalTarget);
              } else {
                const minimalTarget: UserTarget = {
                  id: targetId,
                  userId: stored.userId,
                  name: stored.targetName ?? 'Hedef',
                  lat: activeAlarmSession.targetLat,
                  lon: activeAlarmSession.targetLon,
                  radiusMeters: activeAlarmSession.distanceThresholdMeters,
                  createdAt: typeof activeAlarmSession.createdAt === 'number' ? activeAlarmSession.createdAt : Date.now(),
                };
                setTarget(minimalTarget);
              }
            }
          } catch (error) {
            if (__DEV__) {
              console.warn('[AlarmTriggeredScreen] AsyncStorage okuma hatası', error);
            }
          }
        } else {
          // AsyncStorage'dan snapshot oku
          try {
            const raw = await AsyncStorage.getItem(ACTIVE_ALARM_STORAGE_KEY);
            if (raw) {
              const stored = JSON.parse(raw) as ActiveAlarmStateSnapshot;
              if (stored.sessionId === alarmSessionId) {
                const targetType = stored.targetType ?? 'CUSTOM';
                const targetId = stored.targetId ?? stored.sessionId;
                
                const localSession: AlarmSession = {
                  id: stored.sessionId,
                  userId: stored.userId,
                  targetType,
                  targetId,
                  distanceThresholdMeters: stored.distanceThresholdMeters,
                  status: stored.status,
                  targetName: stored.targetName,
                  targetLat: stored.targetLat,
                  targetLon: stored.targetLon,
                  transportMode: stored.transportMode ?? undefined,
                  minutesBefore: stored.minutesBefore ?? undefined,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                setSession(localSession);
                
                if (targetType === 'STOP') {
                  const minimalTarget: TransitStop = {
                    id: targetId,
                    name: stored.targetName ?? 'Durak',
                    latitude: stored.targetLat,
                    longitude: stored.targetLon,
                    lineIds: [],
                    addressDescription: undefined,
                  };
                  setTarget(minimalTarget);
                } else {
                  const minimalTarget: UserTarget = {
                    id: targetId,
                    userId: stored.userId,
                    name: stored.targetName ?? 'Hedef',
                    lat: stored.targetLat,
                    lon: stored.targetLon,
                    radiusMeters: stored.distanceThresholdMeters,
                    createdAt: Date.now(),
                  };
                  setTarget(minimalTarget);
                }
              }
            }
          } catch (error) {
            if (__DEV__) {
              console.warn('[AlarmTriggeredScreen] AsyncStorage okuma hatası', error);
            }
          }
        }
        return;
      }

      // Remote session: Firestore'dan oku
      const sessionData = await refreshAlarmSession(alarmSessionId);
      setSession(sessionData);
      if (sessionData) {
        const targetData =
          sessionData.targetType === 'STOP'
            ? await fetchStopById(sessionData.targetId)
            : await getUserTargetById(sessionData.targetId);
        setTarget(targetData);
      }
    };
    load();
  }, [alarmSessionId, refreshAlarmSession, activeAlarmSession]);

  // Tetiklenen alarm durdurana kadar çalmalı - interval ile tekrar tekrar notification gönder
  useEffect(() => {
    if (!session || !target) {
      return;
    }

    // İlk notification'ı hemen gönder
    scheduleAlarmNotification({
      title: 'Durağa yaklaşıyorsun!',
      body: `${target.name} durağına çok az kaldı. İnmek için hazırlan.`,
    }).catch(() => {
      // Ignore notification errors
    });

    // Her 3 saniyede bir notification gönder (alarm durdurana kadar)
    alarmIntervalRef.current = setInterval(() => {
      scheduleAlarmNotification({
        title: 'Durağa yaklaşıyorsun!',
        body: `${target.name} durağına çok az kaldı. İnmek için hazırlan.`,
      }).catch(() => {
        // Ignore notification errors
      });
    }, 3000); // 3 saniye

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };
  }, [session, target]);

  const handleDismiss = () => {
    // Interval'i temizle
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    clearActiveAlarm();
    navigation.popToTop();
  };

  return (
    <ScreenContainer backgroundColor="#0f172a">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fbbf24', fontSize: 18, letterSpacing: 2, marginBottom: 12 }}>
          ALARM
        </Text>
        <Text
          style={{ color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}
        >
          Durağa yaklaştın!
        </Text>
        <Text style={{ color: '#e2e8f0', fontSize: 18, textAlign: 'center', marginBottom: 12 }}>
          {target?.name ?? 'Hedef'} için alarm çalıyor
        </Text>
        {session ? (
          <Text style={{ color: '#94a3b8' }}>
            Eşik: {session.distanceThresholdMeters} m • Durum: {session.status}
          </Text>
        ) : null}
      </View>

      <PrimaryButton
        title="Alarmı Durdur"
        onPress={handleDismiss}
        style={{ backgroundColor: '#f59e0b' }}
      />
    </ScreenContainer>
  );
};

export default AlarmTriggeredScreen;

