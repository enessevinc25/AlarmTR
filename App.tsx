// Background tasks bootstrap - app cold start'ta TaskManager.defineTask register olsun
import './src/bootstrap/backgroundTasks';

// Global error handling bootstrap - unhandled errors yakalama
import './src/bootstrap/errorHandling';

// Resume active alarm - app açılışında aktif alarm varsa location tracking'i yeniden başlat
import { resumeActiveAlarmIfNeeded } from './src/bootstrap/resumeActiveAlarm';

import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';

import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { AuthProvider } from './src/context/AuthContext';
import { AlarmProvider } from './src/context/AlarmContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { AlarmSettingsProvider } from './src/context/AlarmSettingsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import OfflineBanner from './src/components/common/OfflineBanner';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { ensureNotificationPermissions } from './src/services/notificationService';
import { initializeNotifications } from './src/services/alarmService';
import { isExpoGo } from './src/utils/expoEnvironment';
import { getTransitApiBaseUrl } from './src/utils/env';
import { installGlobalErrorHandlers } from './src/utils/installGlobalErrorHandlers';

// Sentry initialization - Expo Go'da bazı sorunlar çıkarabilir, bu yüzden try-catch ile sarmalıyoruz
type SentryModule = {
  init: (options: { dsn?: string; enableInExpoDevelopment?: boolean; debug?: boolean; environment?: string }) => void;
  Native: {
    captureException: (error: Error, context?: any) => void;
  };
};
let Sentry: SentryModule | null = null;
try {
  Sentry = require('sentry-expo') as SentryModule;
  // isExpoGo() modül seviyesinde çağrılamayabilir, bu yüzden try-catch ile sarmalıyoruz
  let isExpoGoEnv = false;
  try {
    isExpoGoEnv = isExpoGo();
  } catch {
    // isExpoGo() çağrılamadı, muhtemelen Expo Go'dayız
    isExpoGoEnv = true;
  }
  
  const env = Constants.expoConfig?.extra?.environment ?? 'development';
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN || Constants.expoConfig?.extra?.sentryDsn || '';

  if (sentryDsn && Sentry && !isExpoGoEnv) {
    // Expo Go'da Sentry initialization bazen sorun çıkarabilir
    Sentry.init({
      dsn: sentryDsn,
      enableInExpoDevelopment: true,
      debug: env !== 'production',
      environment: env,
    });
  }
} catch (error) {
  // Sentry mevcut değil veya initialization başarısız, bu normal (özellikle Expo Go'da)
  console.log('[App] Sentry initialization atlandı (Expo Go olabilir)');
}

function AppContent() {
  const { isDark, colors } = useTheme();
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<
    boolean | null
  >(null);
  
  // Global error handler'ları kur (ilk mount'ta bir kere)
  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);

  // Resume active alarm on app start
  useEffect(() => {
    resumeActiveAlarmIfNeeded().catch((error) => {
      if (__DEV__) {
        console.warn('[App] Failed to resume active alarm:', error);
      }
    });
  }, []);
  
  // React Navigation theme objesi (dark mode desteği için)
  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.cardBackground,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '800' as const,
      },
    },
  };

  // Environment variable'ları uygulama başlangıcında kontrol et ve logla
  useEffect(() => {
    try {
      const transitApiUrl = getTransitApiBaseUrl();
      console.log('[App] Environment check - Transit API URL:', transitApiUrl);
      
      const constantsExtra = Constants.expoConfig?.extra as any;
      console.log('[App] Environment check - Constants.expoConfig.extra:', {
        transitApiBaseUrl: constantsExtra?.transitApiBaseUrl || 'hardcoded',
        environment: constantsExtra?.environment,
        hasGoogleMapsApiKey: !!constantsExtra?.googleMapsApiKey,
      });
      
      console.log('[App] Environment check - process.env:', {
        EXPO_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || 'NOT SET',
        EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET',
      });
    } catch (error: any) {
      console.error('[App] Environment check hatası:', error?.message);
      // Hata olsa bile uygulamayı çalıştırmaya devam et
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await ensureNotificationPermissions();
        if (mounted) {
          setNotificationPermissionGranted(result.granted);
        }
      } catch (error) {
        console.warn('[App] Bildirim izni kontrolü hatası', error);
        if (Sentry?.Native) {
          Sentry.Native.captureException(error instanceof Error ? error : new Error(String(error)));
        }
        if (mounted) {
          setNotificationPermissionGranted(false);
        }
      }
      try {
        await initializeNotifications();
      } catch (error) {
        console.warn('[App] Bildirim initialization hatası', error);
        if (Sentry?.Native) {
          Sentry.Native.captureException(error instanceof Error ? error : new Error(String(error)));
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (notificationPermissionGranted === false) {
      console.warn('Bildirim izni verilmedi; alarm bildirimleri gösterilemeyebilir.');
    }
  }, [notificationPermissionGranted]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NetworkProvider>
          <AuthProvider>
            <OnboardingProvider>
              <AlarmSettingsProvider>
                <AlarmProvider>
                  <OfflineBanner />
                  <NavigationContainer ref={navigationRef} theme={navigationTheme}>
                    <StatusBar style={isDark ? 'light' : 'dark'} />
                    <RootNavigator />
                  </NavigationContainer>
                </AlarmProvider>
              </AlarmSettingsProvider>
            </OnboardingProvider>
          </AuthProvider>
        </NetworkProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
