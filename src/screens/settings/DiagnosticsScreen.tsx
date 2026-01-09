import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform, Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import ScreenContainer from '../../components/common/ScreenContainer';
import { SettingsStackParamList } from '../../navigation/navigationTypes';
import { useAppTheme } from '../../theme/useAppTheme';
import { LOCATION_TASK_NAME, GEOFENCE_TASK_NAME } from '../../services/locationService';
import { getHeartbeatLog } from '../../services/alarmBackgroundCore';
import { scheduleAlarmNotification } from '../../services/alarmService';
import PrimaryButton from '../../components/common/PrimaryButton';
import { readCrashLog, clearCrashLog, CrashLogEntry } from '../../utils/crashLog';
import { formatDate } from '../../utils/date';
import { getLastSessionId, diagGet, diagSummarize, diagClearAll } from '../../services/alarmDiagnostics';
import { Alert, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Diagnostics'>;

const DiagnosticsScreen = ({ navigation }: Props) => {
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [alarmDiagSummary, setAlarmDiagSummary] = useState<string | null>(null);
  const [alarmDiagLoading, setAlarmDiagLoading] = useState(false);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      // Device info
      const deviceInfo = {
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platform: Platform.OS,
      };

      // Permissions
      const [fgLocation, bgLocation, notifications] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
        Notifications.getPermissionsAsync(),
      ]);

      // Location tracking status
      const [hasStartedLocation, isTaskRegistered, hasStartedGeofence] = await Promise.all([
        Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false),
        (async () => {
          try {
            const TaskManager = require('expo-task-manager');
            return TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME).catch(() => false);
          } catch {
            return false;
          }
        })(),
        Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME).catch(() => false),
      ]);

      // Heartbeat log
      const heartbeatLog = await getHeartbeatLog();
      const lastHeartbeat = heartbeatLog.length > 0 ? heartbeatLog[heartbeatLog.length - 1] : null;

      // Active alarm snapshot
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const snapshotJson = await AsyncStorage.getItem('@laststop/activeAlarmState');
      const snapshot = snapshotJson ? JSON.parse(snapshotJson) : null;

      // Last crash log
      const lastCrash = await readCrashLog();

      // Alarm diagnostics
      const lastSessionId = await getLastSessionId();
      let alarmDiagSummaryText: string | null = null;
      if (lastSessionId) {
        try {
          alarmDiagSummaryText = await diagSummarize(lastSessionId);
        } catch (error) {
          if (__DEV__) {
            console.warn('[DiagnosticsScreen] Alarm diag summary failed:', error);
          }
        }
      }

      setDiagnostics({
        deviceInfo,
        permissions: {
          foregroundLocation: fgLocation.status,
          backgroundLocation: bgLocation.status,
          notifications: notifications.status,
        },
        tracking: {
          hasStartedLocation,
          isTaskRegistered,
          hasStartedGeofence,
        },
        heartbeat: {
          lastEntry: lastHeartbeat,
          totalEntries: heartbeatLog.length,
        },
        activeAlarm: snapshot,
        lastCrash,
        lastAlarmSessionId: lastSessionId,
      });
      setAlarmDiagSummary(alarmDiagSummaryText);
    } catch (error) {
      if (__DEV__) {
        console.warn('[DiagnosticsScreen] Load hatası', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAlarmDiag = async () => {
    if (!alarmDiagSummary) {
      return;
    }
    try {
      await Clipboard.setStringAsync(alarmDiagSummary);
      Alert.alert('Başarılı', 'Diagnostik bilgileri kopyalandı.');
    } catch (error) {
      if (__DEV__) {
        console.warn('[DiagnosticsScreen] Copy failed:', error);
      }
      Alert.alert('Hata', 'Kopyalama başarısız oldu.');
    }
  };

  const handleShareAlarmDiag = async () => {
    if (!alarmDiagSummary) {
      return;
    }
    try {
      await Share.share({
        message: alarmDiagSummary,
        title: 'Alarm Diagnostik Bilgileri',
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[DiagnosticsScreen] Share failed:', error);
      }
    }
  };

  const handleClearAlarmDiag = async () => {
    Alert.alert(
      'Temizle',
      'Tüm alarm diagnostik verilerini silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            try {
              await diagClearAll();
              setAlarmDiagSummary(null);
              await loadDiagnostics();
              Alert.alert('Başarılı', 'Diagnostik veriler temizlendi.');
            } catch (error) {
              if (__DEV__) {
                console.warn('[DiagnosticsScreen] Clear failed:', error);
              }
              Alert.alert('Hata', 'Temizleme başarısız oldu.');
            }
          },
        },
      ],
    );
  };

  const handleTestNotification = async () => {
    try {
      await scheduleAlarmNotification({
        title: 'Test Bildirimi',
        body: 'Bu bir test bildirimidir. Eğer bunu görüyorsanız bildirim sistemi çalışıyor.',
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[DiagnosticsScreen] Test notification hatası', error);
      }
    }
  };

  const handleTestTrigger = async () => {
    if (__DEV__ === false) {
      return;
    }
    // Debug: test trigger (yalnızca dev modda)
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const snapshotJson = await AsyncStorage.getItem('@laststop/activeAlarmState');
      if (snapshotJson) {
        const snapshot = JSON.parse(snapshotJson);
        const { processBackgroundLocationUpdate } = require('../../services/alarmBackgroundCore');
        await processBackgroundLocationUpdate({
          latitude: snapshot.targetLat,
          longitude: snapshot.targetLon,
          accuracy: 10,
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[DiagnosticsScreen] Test trigger hatası', error);
      }
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      </ScreenContainer>
    );
  }

  if (!diagnostics) {
    return (
      <ScreenContainer>
        <View style={{ padding: 16 }}>
          <Text style={{ color: colors.text }}>Diagnostics yüklenemedi.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <ScrollView>
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 }}>
            Diagnostics
          </Text>

          {/* Device Info */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Cihaz Bilgileri
            </Text>
            <Text style={{ color: colors.text, marginBottom: 4 }}>
              Üretici: {diagnostics.deviceInfo.manufacturer || 'Bilinmiyor'}
            </Text>
            <Text style={{ color: colors.text, marginBottom: 4 }}>
              Model: {diagnostics.deviceInfo.modelName || 'Bilinmiyor'}
            </Text>
            <Text style={{ color: colors.text, marginBottom: 4 }}>
              OS: {diagnostics.deviceInfo.osName} {diagnostics.deviceInfo.osVersion}
            </Text>
            <Text style={{ color: colors.text }}>
              Platform: {diagnostics.deviceInfo.platform}
            </Text>
          </View>

          {/* Permissions */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              İzinler
            </Text>
            <Text
              style={{
                color:
                  diagnostics.permissions.foregroundLocation === 'granted'
                    ? colors.success || '#22c55e'
                    : colors.danger,
                marginBottom: 4,
              }}
            >
              Foreground Location: {diagnostics.permissions.foregroundLocation}
            </Text>
            <Text
              style={{
                color:
                  diagnostics.permissions.backgroundLocation === 'granted'
                    ? colors.success || '#22c55e'
                    : colors.danger,
                marginBottom: 4,
              }}
            >
              Background Location: {diagnostics.permissions.backgroundLocation}
            </Text>
            <Text
              style={{
                color:
                  diagnostics.permissions.notifications === 'granted'
                    ? colors.success || '#22c55e'
                    : colors.danger,
              }}
            >
              Notifications: {diagnostics.permissions.notifications}
            </Text>
          </View>

          {/* Tracking Status */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Takip Durumu
            </Text>
            <Text
              style={{
                color: diagnostics.tracking.hasStartedLocation ? colors.success || '#22c55e' : colors.danger,
                marginBottom: 4,
              }}
            >
              Location Updates: {diagnostics.tracking.hasStartedLocation ? 'Aktif' : 'Pasif'}
            </Text>
            <Text
              style={{
                color: diagnostics.tracking.isTaskRegistered ? colors.success || '#22c55e' : colors.danger,
                marginBottom: 4,
              }}
            >
              Task Registered: {diagnostics.tracking.isTaskRegistered ? 'Evet' : 'Hayır'}
            </Text>
            <Text
              style={{
                color: diagnostics.tracking.hasStartedGeofence ? colors.success || '#22c55e' : colors.danger,
              }}
            >
              Geofencing: {diagnostics.tracking.hasStartedGeofence ? 'Aktif' : 'Pasif'}
            </Text>
          </View>

          {/* Heartbeat */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Heartbeat
            </Text>
            <Text style={{ color: colors.text, marginBottom: 4 }}>
              Toplam Entry: {diagnostics.heartbeat.totalEntries}
            </Text>
            {diagnostics.heartbeat.lastEntry ? (
              <>
                <Text style={{ color: colors.text, marginBottom: 4 }}>
                  Son Entry: {formatDate(diagnostics.heartbeat.lastEntry.timestamp)}
                </Text>
                <Text style={{ color: colors.text, marginBottom: 4 }}>
                  Mesafe: {diagnostics.heartbeat.lastEntry.distance?.toFixed(1) || 'N/A'} m
                </Text>
                <Text style={{ color: colors.text, marginBottom: 4 }}>
                  Accuracy: {diagnostics.heartbeat.lastEntry.accuracy?.toFixed(1) || 'N/A'} m
                </Text>
                <Text style={{ color: colors.text }}>
                  Tetiklendi: {diagnostics.heartbeat.lastEntry.triggered ? 'Evet' : 'Hayır'}
                </Text>
              </>
            ) : (
              <Text style={{ color: colors.textMuted }}>Henüz heartbeat yok</Text>
            )}
          </View>

          {/* Active Alarm */}
          {diagnostics.activeAlarm && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
                Aktif Alarm
              </Text>
              <Text style={{ color: colors.text, marginBottom: 4 }}>
                Session ID: {diagnostics.activeAlarm.sessionId}
              </Text>
              <Text style={{ color: colors.text, marginBottom: 4 }}>
                Durum: {diagnostics.activeAlarm.status}
              </Text>
              <Text style={{ color: colors.text, marginBottom: 4 }}>
                Hedef: {diagnostics.activeAlarm.targetName}
              </Text>
              <Text style={{ color: colors.text }}>
                Eşik: {diagnostics.activeAlarm.distanceThresholdMeters} m
              </Text>
            </View>
          )}

          {/* Last Crash */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Last Crash
            </Text>
            {diagnostics.lastCrash ? (
              <>
                <Text style={{ color: colors.text, marginBottom: 4 }}>
                  Tarih: {formatDate(diagnostics.lastCrash.ts)}
                </Text>
                <Text style={{ color: colors.text, marginBottom: 4 }}>
                  Fatal: {diagnostics.lastCrash.isFatal ? 'Evet' : 'Hayır'}
                </Text>
                {diagnostics.lastCrash.name && (
                  <Text style={{ color: colors.text, marginBottom: 4 }}>
                    Name: {diagnostics.lastCrash.name}
                  </Text>
                )}
                <Text style={{ color: colors.text, marginBottom: 8 }}>
                  Message: {diagnostics.lastCrash.message}
                </Text>
                {diagnostics.lastCrash.stack && (
                  <ScrollView
                    style={{
                      backgroundColor: colors.cardBackground || '#f5f5f5',
                      padding: 12,
                      borderRadius: 8,
                      maxHeight: 200,
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      selectable
                      style={{
                        color: colors.text,
                        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {diagnostics.lastCrash.stack}
                    </Text>
                  </ScrollView>
                )}
                {diagnostics.lastCrash.extra && Object.keys(diagnostics.lastCrash.extra).length > 0 && (
                  <Text style={{ color: colors.textMuted, marginBottom: 12, fontSize: 12 }}>
                    Extra: {JSON.stringify(diagnostics.lastCrash.extra, null, 2)}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await clearCrashLog();
                        await loadDiagnostics();
                      } catch (error) {
                        if (__DEV__) {
                          console.warn('[DiagnosticsScreen] Clear crash log hatası:', error);
                        }
                      }
                    }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: colors.danger,
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: '600' }}>Temizle</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={{ color: colors.textMuted }}>Kayıt yok</Text>
            )}
          </View>

          {/* Alarm Diagnostics */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Son Alarm Diagnostiği
            </Text>
            {diagnostics.lastAlarmSessionId ? (
              <>
                <Text style={{ color: colors.text, marginBottom: 8 }}>
                  Session ID: {diagnostics.lastAlarmSessionId}
                </Text>
                {alarmDiagSummary ? (
                  <>
                    <ScrollView
                      style={{
                        backgroundColor: colors.cardBackground || '#f5f5f5',
                        padding: 12,
                        borderRadius: 8,
                        maxHeight: 300,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        selectable
                        style={{
                          color: colors.text,
                          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                          fontSize: 12,
                        }}
                      >
                        {alarmDiagSummary}
                      </Text>
                    </ScrollView>
                    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                      <TouchableOpacity
                        onPress={handleCopyAlarmDiag}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor: colors.primary,
                        }}
                      >
                        <Text style={{ color: colors.white, fontWeight: '600' }}>Kopyala</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleShareAlarmDiag}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor: colors.gray800,
                        }}
                      >
                        <Text style={{ color: colors.white, fontWeight: '600' }}>Paylaş</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleClearAlarmDiag}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor: colors.danger,
                        }}
                      >
                        <Text style={{ color: colors.white, fontWeight: '600' }}>Temizle</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <Text style={{ color: colors.textMuted, marginBottom: 12 }}>
                    Diagnostik özeti yükleniyor...
                  </Text>
                )}
              </>
            ) : (
              <Text style={{ color: colors.textMuted }}>Henüz alarm diagnostik verisi yok</Text>
            )}
          </View>

          {/* Test Buttons */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Test
            </Text>
            <PrimaryButton
              title="Test Bildirimi Gönder"
              onPress={handleTestNotification}
              style={{ marginBottom: 12 }}
            />
            {__DEV__ && (
              <PrimaryButton
                title="Test Trigger (Debug)"
                onPress={handleTestTrigger}
                style={{ backgroundColor: colors.danger }}
              />
            )}
          </View>

          <PrimaryButton title="Yenile" onPress={loadDiagnostics} style={{ marginTop: 24 }} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

export default DiagnosticsScreen;

