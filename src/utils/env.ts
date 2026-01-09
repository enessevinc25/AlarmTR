import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Environment Utilities
 * 
 * Uygulamanın çalıştığı ortamı (development, staging, production) tespit etmek için.
 */

/**
 * Development veya staging ortamında mı?
 * Production'da false döner.
 */
export const isDevEnv = (): boolean => {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT ?? Constants.expoConfig?.extra?.environment ?? 'development';
  return env !== 'production';
};

/**
 * Development ortamında mı?
 */
export const isDevelopment = (): boolean => {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT ?? Constants.expoConfig?.extra?.environment ?? 'development';
  return env === 'development';
};

/**
 * Staging ortamında mı?
 */
export const isStaging = (): boolean => {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT ?? Constants.expoConfig?.extra?.environment ?? 'development';
  return env === 'staging';
};

/**
 * Production ortamında mı?
 */
export const isProduction = (): boolean => {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT ?? Constants.expoConfig?.extra?.environment ?? 'development';
  return env === 'production';
};

/**
 * Transit API base URL'ini döndürür
 * 
 * Production API URL'i hardcode edilmiştir.
 * Tüm build'ler (development, preview, production) aynı production API'yi kullanır.
 */
export function getTransitApiBaseUrl(): string {
  // Production API URL (hardcoded)
  const PRODUCTION_API_URL = 'https://laststop-alarm-tr-599735223710.europe-west1.run.app';
  
  // Trailing slash'leri temizle
  return PRODUCTION_API_URL.replace(/\/+$/, '');
}

/**
 * Google Maps API key'ini döndürür (platform-specific)
 * 
 * Öncelik sırası:
 * 1. Platform-specific env vars (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID / EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS)
 * 2. Genel env var (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)
 * 3. Platform-specific config (extra.googleMapsApiKeyAndroid / extra.googleMapsApiKeyIOS)
 * 4. Genel config (extra.googleMapsApiKey)
 * 
 * Tanımlı değilse development'ta hata fırlatır.
 */
export function getGoogleMapsApiKey(): string {
  const extra = (Constants.expoConfig?.extra as any) ?? {};
  
  // Platform-specific key'leri kontrol et
  const platformKey = Platform.OS === 'android'
    ? (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID ?? extra.googleMapsApiKeyAndroid)
    : (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS ?? extra.googleMapsApiKeyIOS);
  
  // Fallback: genel key
  const generalKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? extra.googleMapsApiKey;
  
  const key = platformKey ?? generalKey;

  if (!key) {
    if (__DEV__) {
      console.error(
        `[env] Google Maps API key missing for ${Platform.OS}. ` +
        `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_${Platform.OS === 'android' ? 'ANDROID' : 'IOS'} ` +
        `or EXPO_PUBLIC_GOOGLE_MAPS_API_KEY or extra.googleMapsApiKey required.`
      );
    }
    throw new Error('Google Maps API key is not configured');
  }

  return key;
}

