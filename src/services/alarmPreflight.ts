import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { captureError } from '../utils/errorReporting';

export type PreflightItemKey =
  | 'notification'
  | 'location_foreground'
  | 'location_background'
  | 'battery_optimization';

export type PreflightStatus = 'ok' | 'warn' | 'block';

export interface PreflightItem {
  key: PreflightItemKey;
  status: PreflightStatus;
  title: string;
  description: string;
  ctaPrimaryLabel?: string;
  ctaSecondaryLabel?: string;
}

export interface PreflightResult {
  items: PreflightItem[];
  canProceed: boolean; // true => alarm başlatılabilir
}

/**
 * Alarm başlatmadan önce gerekli izinleri ve şartları kontrol eder
 * 
 * Block: Alarm başlatılamaz (kritik izin eksik)
 * Warn: Alarm başlatılabilir ama güvenilirlik düşük (önerilen izin eksik)
 * Ok: İzin mevcut
 */
export async function runAlarmPreflight(): Promise<PreflightResult> {
  const items: PreflightItem[] = [];

  // A) Bildirim izni kontrolü
  try {
    const notifSettings = await Notifications.getPermissionsAsync();
    const granted = notifSettings.granted || notifSettings.status === 'granted';
    
    if (!granted) {
      items.push({
        key: 'notification',
        status: 'block', // Bildirim izni alarm için kritik
        title: 'Bildirim İzni Gerekli',
        description: notifSettings.canAskAgain
          ? 'Alarmın sizi uyandırabilmesi için bildirim iznini açmalısınız.'
          : 'Bildirim izni kapalı. Ayarlar\'dan açmalısınız.',
        ctaPrimaryLabel: notifSettings.canAskAgain ? 'İzin Ver' : undefined,
        ctaSecondaryLabel: 'Ayarları Aç',
      });
    } else {
      items.push({
        key: 'notification',
        status: 'ok',
        title: 'Bildirim İzni',
        description: 'Bildirim izni aktif.',
      });
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmPreflight] Notification permission check failed:', error);
    }
    captureError(error, 'alarmPreflight/notification');
    // Hata durumunda block olarak işaretle (güvenli tarafta kal)
    items.push({
      key: 'notification',
      status: 'block',
      title: 'Bildirim İzni Kontrol Edilemedi',
      description: 'Bildirim izni kontrol edilemedi. Lütfen tekrar deneyin.',
    });
  }

  // B) Foreground konum izni kontrolü
  try {
    const locationForeground = await Location.getForegroundPermissionsAsync();
    
    if (locationForeground.status !== Location.PermissionStatus.GRANTED) {
      items.push({
        key: 'location_foreground',
        status: 'block', // Foreground konum izni alarm için kritik
        title: 'Konum İzni Gerekli',
        description: 'Alarmın çalışabilmesi için konum iznini açmalısınız.',
        ctaPrimaryLabel: locationForeground.canAskAgain ? 'İzin Ver' : undefined,
        ctaSecondaryLabel: 'Ayarları Aç',
      });
    } else {
      items.push({
        key: 'location_foreground',
        status: 'ok',
        title: 'Konum İzni',
        description: 'Konum izni aktif.',
      });
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmPreflight] Foreground location permission check failed:', error);
    }
    captureError(error, 'alarmPreflight/locationForeground');
    items.push({
      key: 'location_foreground',
      status: 'block',
      title: 'Konum İzni Kontrol Edilemedi',
      description: 'Konum izni kontrol edilemedi. Lütfen tekrar deneyin.',
    });
  }

  // C) Background konum izni kontrolü
  try {
    const locationBackground = await Location.getBackgroundPermissionsAsync();
    
    if (locationBackground.status !== Location.PermissionStatus.GRANTED) {
      // Android'de block, iOS'ta warn (iOS'ta background location daha az kritik)
      const status: PreflightStatus = Platform.OS === 'android' ? 'block' : 'warn';
      
      items.push({
        key: 'location_background',
        status,
        title: 'Arka Plan Konum İzni',
        description: Platform.OS === 'android'
          ? 'Alarmın ekran kapalıyken çalışabilmesi için "Her zaman izin ver" seçeneğini açmalısınız.'
          : 'Arka planda çalışması için "Her zaman izin ver" önerilir; ekran açıkken çalışmaya devam eder.',
        ctaPrimaryLabel: locationBackground.canAskAgain ? 'Her Zaman İzin Ver' : undefined,
        ctaSecondaryLabel: 'Ayarları Aç',
      });
    } else {
      items.push({
        key: 'location_background',
        status: 'ok',
        title: 'Arka Plan Konum İzni',
        description: 'Arka plan konum izni aktif.',
      });
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[alarmPreflight] Background location permission check failed:', error);
    }
    captureError(error, 'alarmPreflight/locationBackground');
    // Hata durumunda warn olarak işaretle (background izin kritik değil)
    items.push({
      key: 'location_background',
      status: 'warn',
      title: 'Arka Plan Konum İzni Kontrol Edilemedi',
      description: 'Arka plan konum izni kontrol edilemedi.',
    });
  }

  // D) Android Pil optimizasyonu kontrolü (sadece Android)
  if (Platform.OS === 'android') {
    items.push({
      key: 'battery_optimization',
      status: 'warn', // Pil optimizasyonu kritik değil ama önerilir
      title: 'Pil Optimizasyonu',
      description: 'Alarmın arka planda stabil çalışması için pil optimizasyonundan hariç tut.',
      ctaPrimaryLabel: 'Rehberi Aç',
      ctaSecondaryLabel: undefined, // Samsung için ekran tarafında eklenir
    });
  }

  // canProceed: block olan item yoksa true
  const canProceed = items.every((item) => item.status !== 'block');

  return {
    items,
    canProceed,
  };
}
