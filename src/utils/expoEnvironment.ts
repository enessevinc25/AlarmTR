import Constants from 'expo-constants';

/**
 * Expo Environment Detection
 * 
 * Uygulamanın hangi ortamda çalıştığını tespit eder:
 * - Expo Go: Expo Go uygulaması içinde çalışıyor
 * - Development Build: expo-dev-client ile build edilmiş development build
 * - Standalone: Production build (APK/IPA)
 */

export type ExpoEnvironment = 'expo-go' | 'development-build' | 'standalone';

/**
 * Uygulamanın çalıştığı ortamı tespit eder
 */
export function getExpoEnvironment(): ExpoEnvironment {
  // Expo Go'da Constants.executionEnvironment === 'storeClient'
  if (Constants.executionEnvironment === 'storeClient') {
    return 'expo-go';
  }

  // Development build'de Constants.executionEnvironment === 'standalone' ama __DEV__ true
  // Standalone production build'de __DEV__ false
  if (__DEV__) {
    return 'development-build';
  }

  return 'standalone';
}

/**
 * Expo Go'da çalışıp çalışmadığını kontrol eder
 */
export function isExpoGo(): boolean {
  return getExpoEnvironment() === 'expo-go';
}

/**
 * Development build'de çalışıp çalışmadığını kontrol eder
 */
export function isDevelopmentBuild(): boolean {
  return getExpoEnvironment() === 'development-build';
}

/**
 * Standalone (production) build'de çalışıp çalışmadığını kontrol eder
 */
export function isStandalone(): boolean {
  return getExpoEnvironment() === 'standalone';
}

/**
 * Native modüllerin kullanılabilir olup olmadığını kontrol eder
 * Expo Go'da bazı native modüller çalışmaz (background location, task manager vb.)
 */
export function areNativeModulesAvailable(): boolean {
  return !isExpoGo();
}

