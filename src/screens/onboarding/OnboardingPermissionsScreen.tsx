import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';

import ScreenContainer from '../../components/common/ScreenContainer';
import { captureError } from '../../utils/errorReporting';
import PrimaryButton from '../../components/common/PrimaryButton';
import {
  ensureNotificationPermissions,
  showNotificationPermissionDeniedDialog,
} from '../../services/notificationService';
import { useOnboarding } from '../../context/OnboardingContext';
import { initializeNotifications } from '../../services/alarmService';
import { useAppTheme } from '../../theme/useAppTheme';

const OnboardingPermissionsScreen = () => {
  const { markOnboardingCompleted } = useOnboarding();
  const { colors } = useAppTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // İzinleri kontrol et ve otomatik devam et (ayarlardan dönünce)
  const checkPermissionsAndContinue = useCallback(async () => {
    try {
      if (__DEV__) {
        console.log('[OnboardingPermissions] İzinler otomatik kontrol ediliyor...');
      }

      // Konum izinleri kontrolü
      const foreground = await Location.getForegroundPermissionsAsync();
      if (__DEV__) {
        console.log('[OnboardingPermissions] Foreground konum izni:', foreground.status);
      }
      if (foreground.status !== Location.PermissionStatus.GRANTED) {
        if (__DEV__) {
          console.log('[OnboardingPermissions] Foreground konum izni henüz verilmemiş');
        }
        return; // Henüz izin verilmemiş
      }

      let backgroundGranted = true;
      if (Platform.OS === 'android') {
        const background = await Location.getBackgroundPermissionsAsync();
        if (__DEV__) {
          console.log('[OnboardingPermissions] Background konum izni:', background.status);
        }
        backgroundGranted = background.status === Location.PermissionStatus.GRANTED;
      }

      if (!backgroundGranted) {
        if (__DEV__) {
          console.log('[OnboardingPermissions] Background konum izni henüz verilmemiş (opsiyonel, devam ediliyor)');
        }
        // Arka plan izni opsiyonel - devam et
      }

      // Bildirim izni kontrolü
      await initializeNotifications();
      const notificationResult = await ensureNotificationPermissions();
      
      if (__DEV__) {
        console.log('[OnboardingPermissions] Bildirim izni:', {
          granted: notificationResult.granted,
          canAskAgain: notificationResult.canAskAgain,
        });
      }
      
      // Bildirim izni zorunlu
      if (!notificationResult.granted) {
        if (__DEV__) {
          console.log('[OnboardingPermissions] Bildirim izni henüz verilmemiş');
        }
        return; // Bildirim izni henüz verilmemiş
      }

      // Tüm zorunlu izinler verilmiş - onboarding'i tamamla
      if (__DEV__) {
        console.log('[OnboardingPermissions] Tüm zorunlu izinler verilmiş, onboarding tamamlanıyor...');
      }
      await markOnboardingCompleted();
      if (__DEV__) {
        console.log('[OnboardingPermissions] Onboarding tamamlandı!');
      }
    } catch (err) {
      // Hata yakala ve logla
      if (__DEV__) {
        console.warn('[OnboardingPermissions] Auto-check hatası:', err);
      }
      captureError(err, 'OnboardingPermissionsScreen/checkPermissionsAndContinue');
    }
  }, [markOnboardingCompleted]);

  // Ekran focus olduğunda izinleri kontrol et (ayarlardan dönünce)
  useFocusEffect(
    useCallback(() => {
      // Kısa bir delay ile kontrol et (ekran render olsun)
      const timeoutId = setTimeout(() => {
        checkPermissionsAndContinue();
      }, 500);

      return () => {
        clearTimeout(timeoutId);
      };
    }, [checkPermissionsAndContinue])
  );

  // AppState değiştiğinde de kontrol et (background'dan foreground'a dönünce)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Uygulama foreground'a döndü - izinleri kontrol et
        checkPermissionsAndContinue();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermissionsAndContinue]);

  const handleOpenSettings = () => {
    Linking.openSettings().catch(() => {
      setError('Ayarlar açılamadı. Lütfen cihazının ayarlar menüsünden izinleri aç.');
    });
  };

  const handleEnablePermissions = async () => {
    setError(null);
    setLoading(true);
    try {
      // Önce mevcut izin durumunu kontrol et
      let foreground = await Location.getForegroundPermissionsAsync();
      
      // Eğer izin verilmemişse iste
      if (foreground.status !== Location.PermissionStatus.GRANTED) {
        foreground = await Location.requestForegroundPermissionsAsync();
      }
      
      // Hala izin verilmemişse hata göster
      if (foreground.status !== Location.PermissionStatus.GRANTED) {
        setError(
          'Konum izni olmadan durağa yaklaşmanı takip edemeyiz. Lütfen izin ver veya cihaz ayarlarından aç.',
        );
        setLoading(false);
        return;
      }

      // Android için arka plan konum izni
      if (Platform.OS === 'android') {
        let background = await Location.getBackgroundPermissionsAsync();
        
        // Eğer izin verilmemişse iste
        if (background.status !== Location.PermissionStatus.GRANTED) {
          background = await Location.requestBackgroundPermissionsAsync();
        }
        
        // Hala izin verilmemişse hata göster (ama devam et - opsiyonel)
        if (background.status !== Location.PermissionStatus.GRANTED) {
          setError(
            'Arka plan konum izni olmadan ekran kapalıyken alarm çalışmayabilir. Ayarlardan izin verebilirsin.',
          );
          // Arka plan izni opsiyonel - devam et
        }
      }

      // Bildirim izinleri
      await initializeNotifications();
      const notificationResult = await ensureNotificationPermissions();
      
      // Bildirim izni kontrolü - zorunlu
      if (!notificationResult.granted) {
        if (!notificationResult.canAskAgain) {
          showNotificationPermissionDeniedDialog();
        }
        setError(
          'Bildirim izni olmadan alarm sesi ve titreşimi gönderemeyiz. Ayarlardan bildirime izin ver.',
        );
        setLoading(false);
        return;
      }

      // Tüm zorunlu izinler başarılı - onboarding'i tamamla
      await markOnboardingCompleted();
    } catch (err) {
      if (__DEV__) {
        console.warn('İzinler alınırken hata oluştu', err);
      }
      captureError(err, 'OnboardingPermissionsScreen/enablePermissions');
      setError('İzinleri alırken bir sorun oluştu. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={[styles.heading, { color: colors.text }]}>İzinleri Aç ve Başla</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          LastStop Alarm TR sadece durağa yaklaşınca seni uyandırmak için konumunu arka planda takip
          eder ve bildirim gönderir. Verdiğin izinler başka amaçla kullanılmaz.
        </Text>
        <View style={styles.list}>
          <Text style={[styles.listItem, { color: colors.text }]}>• Konum: Durağa olan mesafeni hesaplamak için.</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>
            • Bildirim: Alarm çaldığında ses ve titreşim gönderebilmek için.
          </Text>
        </View>
        {error ? (
          <Text style={error.startsWith('Uyarı:') ? [styles.warning, { color: colors.warning }] : [styles.error, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}
      </View>
      <PrimaryButton
        title="İzinleri Etkinleştir"
        onPress={handleEnablePermissions}
        disabled={loading}
      />
      <Text style={[styles.secondaryAction, { color: colors.primary }]} onPress={handleOpenSettings}>
        İzinleri daha sonra Ayarlar'dan aç
      </Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
  list: {
    marginTop: 20,
    gap: 8,
  },
  listItem: {
    fontSize: 15,
  },
  error: {
    marginTop: 16,
  },
  warning: {
    marginTop: 16,
  },
  secondaryAction: {
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default OnboardingPermissionsScreen;


