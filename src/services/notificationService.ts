import { Platform, Linking, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { captureError } from '../utils/errorReporting';

/**
 * Ensures the app has foreground notification permissions.
 * Returns true if notifications are allowed (including provisional on iOS).
 */
export async function ensureNotificationPermissions(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  try {
    // Android'de notification channel kontrolü (Android 13+ için önemli)
    if (Platform.OS === 'android') {
      const channels = await Notifications.getNotificationChannelsAsync();
      if (__DEV__) {
        console.log('[notificationService] Notification channels count:', channels.length);
      }
      
      // Channel yoksa default channel oluştur
      if (channels.length === 0) {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
        if (__DEV__) {
          console.log('[notificationService] Default notification channel created');
        }
      }
    }

    // Bildirim izni kontrolü
    let settings = await Notifications.getPermissionsAsync();
    
    if (__DEV__) {
      console.log('[notificationService] Notification permission settings:', {
        granted: settings.granted,
        status: settings.status,
        canAskAgain: settings.canAskAgain,
        iosStatus: settings.ios?.status,
      });
    }
    
    // Granted hesaplama (Android'de status kontrolü de dahil)
    let granted =
      settings.granted ||
      settings.status === 'granted' ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    
    // Eğer granted değilse izin iste
    if (!granted) {
      settings = await Notifications.requestPermissionsAsync();
      
      // Tekrar granted hesapla
      granted =
        settings.granted ||
        settings.status === 'granted' ||
        settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }
    
    const canAskAgain = settings.canAskAgain ?? true;
    
    // Bildirim izni verilmemişse direkt dön
    if (!granted) {
      if (__DEV__) {
        console.warn('[notificationService] Bildirim izni verilmedi');
      }
      return {
        granted: false,
        canAskAgain,
      };
    }
    
    // Bildirim izni verilmişse granted: true dön
    return {
      granted: true,
      canAskAgain,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[notificationService] Bildirim izni kontrol edilirken hata oluştu', error);
    }
    captureError(error, 'notificationService/ensureNotificationPermissions');
    return {
      granted: false,
      canAskAgain: true,
    };
  }
}

/**
 * Kullanıcıya bildirim izni reddedildiğinde ayarlara yönlendirme diyalogu gösterir.
 * iOS ve Android için farklı mesajlar kullanır.
 */
export function showNotificationPermissionDeniedDialog() {
  const platform = Platform.OS;
  const title = 'Bildirim İzni Gerekli';
  const message =
    platform === 'ios'
      ? 'Alarm bildirimlerini alabilmek için bildirim iznine ihtiyacımız var. Lütfen Ayarlar\'dan bildirim iznini açın.'
      : 'Alarm bildirimlerini alabilmek için bildirim iznine ihtiyacımız var. Lütfen Ayarlar\'dan bildirim iznini açın.';
  
  Alert.alert(
    title,
    message,
    [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Ayarlara Git',
        onPress: async () => {
          try {
            await Linking.openSettings();
          } catch (error) {
            if (__DEV__) {
              console.warn('Ayarlar açılamadı', error);
            }
            captureError(error, 'notificationService/openSettings');
          }
        },
      },
    ],
  );
}


