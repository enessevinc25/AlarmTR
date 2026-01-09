import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

import ScreenContainer from '../../components/common/ScreenContainer';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAppTheme } from '../../theme/useAppTheme';
import { HomeStackParamList } from '../../navigation/navigationTypes';
import { useAlarm } from '../../context/AlarmContext';
import { runAlarmPreflight, PreflightItem, PreflightResult } from '../../services/alarmPreflight';
import { goToPermissionsHelp, goToSamsungBatteryHelp } from '../../navigation/navigationService';
import { captureError } from '../../utils/errorReporting';
import { StartAlarmSessionParams } from '../../context/AlarmContext';
import { TransitStop, UserTarget } from '../../types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'AlarmPreflight'>;

const AlarmPreflightScreen = ({ route, navigation }: Props) => {
  const { startPayload } = route.params;
  const { startAlarmSession } = useAlarm();
  const { colors } = useAppTheme();
  const [preflightResult, setPreflightResult] = useState<PreflightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [startingAlarm, setStartingAlarm] = useState(false);

  // Samsung cihaz tespiti
  const isSamsung = Platform.OS === 'android' && (Device.manufacturer?.toLowerCase().includes('samsung') ?? false);

  // İlk yüklemede preflight çalıştır
  useEffect(() => {
    checkPreflight();
  }, []);

  const checkPreflight = async () => {
    setChecking(true);
    try {
      const result = await runAlarmPreflight();
      setPreflightResult(result);
    } catch (error) {
      if (__DEV__) {
        console.warn('[AlarmPreflightScreen] Preflight check failed:', error);
      }
      captureError(error, 'AlarmPreflightScreen/checkPreflight');
      Alert.alert('Hata', 'Kontrol yapılırken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const handleCTA = async (item: PreflightItem) => {
    try {
      switch (item.key) {
        case 'notification':
          if (item.ctaPrimaryLabel === 'İzin Ver') {
            await Notifications.requestPermissionsAsync();
            // İzin verildikten sonra tekrar kontrol et
            await checkPreflight();
          } else if (item.ctaSecondaryLabel === 'Ayarları Aç') {
            await Linking.openSettings();
          }
          break;

        case 'location_foreground':
          if (item.ctaPrimaryLabel === 'İzin Ver') {
            await Location.requestForegroundPermissionsAsync();
            await checkPreflight();
          } else if (item.ctaSecondaryLabel === 'Ayarları Aç') {
            await Linking.openSettings();
          }
          break;

        case 'location_background':
          if (item.ctaPrimaryLabel === 'Her Zaman İzin Ver') {
            await Location.requestBackgroundPermissionsAsync();
            await checkPreflight();
          } else if (item.ctaSecondaryLabel === 'Ayarları Aç') {
            await Linking.openSettings();
          }
          break;

        case 'battery_optimization':
          if (item.ctaPrimaryLabel === 'Rehberi Aç') {
            goToPermissionsHelp();
          }
          break;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[AlarmPreflightScreen] CTA action failed:', error);
      }
      captureError(error, 'AlarmPreflightScreen/handleCTA');
      Alert.alert('Hata', 'İşlem tamamlanamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleStartAlarm = async () => {
    if (!preflightResult || !preflightResult.canProceed) {
      Alert.alert('Eksik İzinler', 'Eksik izinler tamamlanmadan devam edemezsiniz.');
      return;
    }

    // Son bir kez kontrol et
    setStartingAlarm(true);
    try {
      const latestPreflight = await runAlarmPreflight();
      if (!latestPreflight.canProceed) {
        Alert.alert('Eksik İzinler', 'Eksik izinler tamamlanmadan devam edemezsiniz.');
        setPreflightResult(latestPreflight);
        return;
      }

      // Alarmı başlat
      const session = await startAlarmSession(startPayload);
      navigation.replace('ActiveAlarm', { alarmSessionId: session.id });
    } catch (error) {
      if (__DEV__) {
        console.warn('[AlarmPreflightScreen] Start alarm failed:', error);
      }
      captureError(error, 'AlarmPreflightScreen/handleStartAlarm');
      Alert.alert('Hata', 'Alarm başlatılırken bir sorun oluştu.');
    } finally {
      setStartingAlarm(false);
    }
  };

  const getStatusIcon = (status: PreflightItem['status']) => {
    switch (status) {
      case 'ok':
        return '✅';
      case 'warn':
        return '⚠️';
      case 'block':
        return '⛔';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: PreflightItem['status']) => {
    switch (status) {
      case 'ok':
        return colors.success || '#10b981';
      case 'warn':
        return colors.warning || '#f59e0b';
      case 'block':
        return colors.danger || '#ef4444';
      default:
        return colors.textMuted;
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text }}>Kontrol ediliyor...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!preflightResult) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text }}>Kontrol sonucu alınamadı.</Text>
          <PrimaryButton title="Tekrar Dene" onPress={checkPreflight} style={{ marginTop: 16 }} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>Alarmı Başlatmadan Önce</Text>
        <Text style={{ color: colors.textMuted, marginTop: 8 }}>
          Aşağıdakiler tamamlanırsa alarm daha güvenilir çalışır.
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {preflightResult.items.map((item) => (
          <View
            key={item.key}
            style={[
              styles.itemCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: getStatusColor(item.status),
                borderWidth: item.status === 'block' ? 2 : 1,
                marginBottom: 16,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>{getStatusIcon(item.status)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.itemDescription, { color: colors.textMuted, marginTop: 4 }]}>
                  {item.description}
                </Text>
              </View>
            </View>

            {/* CTA Butonları */}
            {(item.ctaPrimaryLabel || item.ctaSecondaryLabel) && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {item.ctaPrimaryLabel && (
                  <TouchableOpacity
                    onPress={() => handleCTA(item)}
                    style={[styles.ctaButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.ctaButtonText, { color: colors.white }]}>{item.ctaPrimaryLabel}</Text>
                  </TouchableOpacity>
                )}
                {item.ctaSecondaryLabel && (
                  <TouchableOpacity
                    onPress={() => handleCTA(item)}
                    style={[styles.ctaButton, { backgroundColor: colors.gray800 }]}
                  >
                    <Text style={[styles.ctaButtonText, { color: colors.white }]}>{item.ctaSecondaryLabel}</Text>
                  </TouchableOpacity>
                )}
                {/* Battery optimization için Samsung rehberi butonu */}
                {item.key === 'battery_optimization' && isSamsung && (
                  <TouchableOpacity
                    onPress={goToSamsungBatteryHelp}
                    style={[styles.ctaButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.ctaButtonText, { color: colors.white }]}>Samsung Rehberi</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Alt Butonlar */}
      <View style={{ marginTop: 24 }}>
        <PrimaryButton
          title={startingAlarm ? 'Başlatılıyor...' : 'Alarmı Başlat'}
          onPress={handleStartAlarm}
          disabled={!preflightResult.canProceed || startingAlarm}
          style={{ marginBottom: 12 }}
        />
        <PrimaryButton
          title={checking ? 'Kontrol Ediliyor...' : 'Yeniden Kontrol Et'}
          onPress={checkPreflight}
          disabled={checking}
          style={{ backgroundColor: colors.gray800, marginBottom: 12 }}
        />
        <TouchableOpacity onPress={goToPermissionsHelp} style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ color: colors.primary, fontSize: 14 }}>Neden gerekli?</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AlarmPreflightScreen;
