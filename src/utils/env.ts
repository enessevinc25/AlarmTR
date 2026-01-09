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
 * Google Maps Native API key'ini döndürür (platform-specific)
 * 
 * P0: Native key'ler ASLA genel key'e fallback yapmamalı (Places-only key harita blank yapar)
 * 
 * Öncelik sırası:
 * 1. Platform-specific env vars (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID / EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS)
 * 2. Platform-specific config (extra.googleMapsApiKeyAndroid / extra.googleMapsApiKeyIOS)
 * 
 * Tanımlı değilse hata fırlatır.
 */
export function getGoogleMapsNativeKey(): string {
  const extra = (Constants.expoConfig?.extra as any) ?? {};
  
  // Platform-specific key'leri kontrol et (genel key fallback YOK)
  const platformKey = Platform.OS === 'android'
    ? (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID ?? extra.googleMapsApiKeyAndroid)
    : (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS ?? extra.googleMapsApiKeyIOS);

  if (!platformKey) {
    if (__DEV__) {
      console.error(
        `[env] Google Maps Native API key missing for ${Platform.OS}. ` +
        `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_${Platform.OS === 'android' ? 'ANDROID' : 'IOS'} required. ` +
        `Genel key (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) native harita için kullanılamaz.`
      );
    }
    throw new Error(`Google Maps Native API key is not configured for ${Platform.OS}`);
  }

  return platformKey;
}

/**
 * Google Maps Web API key'ini döndürür (Places vb web services için)
 * 
 * Bu key native harita için kullanılmaz, sadece web services (Places API vb) için.
 */
export function getGoogleMapsWebKey(): string {
  const extra = (Constants.expoConfig?.extra as any) ?? {};
  
  const webKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? extra.googleMapsWebApiKey ?? '';
  
  return webKey;
}

/**
 * @deprecated Use getGoogleMapsNativeKey() instead. This function is kept for backward compatibility.
 * 
 * Google Maps API key'ini döndürür (platform-specific)
 * 
 * Geriye dönük uyumluluk için korunuyor, yeni kod getGoogleMapsNativeKey() kullanmalı.
 */
export function getGoogleMapsApiKey(): string {
  return getGoogleMapsNativeKey();
}

