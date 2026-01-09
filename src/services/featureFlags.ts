/**
 * Feature Flags Service (P0)
 * 
 * Firestore üzerinden uzaktan kontrol edilebilen feature flags.
 * Cache AsyncStorage'da tutulur, Firestore erişemezse cache + fallback kullanılır.
 */

import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { logger } from '../utils/logger';

const FEATURE_FLAGS_DOC_PATH = 'appConfig/public';
const CACHE_KEY = 'appFlags_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 dakika

interface FeatureFlags {
  enableAlarmPreflight: boolean;
  enableDiagnostics: boolean;
  enableAccuracyEngine: boolean;
  enableForegroundSurvivalAndroid: boolean;
}

interface AppConfigDoc {
  flags: FeatureFlags;
  minSupportedVersion: string;
  message?: {
    enabled: boolean;
    text: string;
  };
}

// Default flags (fallback)
const DEFAULT_FLAGS: FeatureFlags = {
  enableAlarmPreflight: true,
  enableDiagnostics: true,
  enableAccuracyEngine: true,
  enableForegroundSurvivalAndroid: true,
};

let cachedFlags: FeatureFlags | null = null;
let cacheTimestamp: number = 0;
let unsubscribe: Unsubscribe | null = null;

/**
 * Cache'den flags oku
 */
async function loadCachedFlags(): Promise<FeatureFlags | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw) as { flags: FeatureFlags; timestamp: number };
    const age = Date.now() - cached.timestamp;

    // Cache TTL kontrolü
    if (age > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cached.flags;
  } catch (error) {
    if (__DEV__) {
      console.warn('[featureFlags] Failed to load cache:', error);
    }
    return null;
  }
}

/**
 * Flags'ı cache'e yaz
 */
async function saveCachedFlags(flags: FeatureFlags): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        flags,
        timestamp: Date.now(),
      }),
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[featureFlags] Failed to save cache:', error);
    }
  }
}

/**
 * Firestore'dan flags çek ve cache'e yaz
 */
async function fetchFlagsFromFirestore(): Promise<FeatureFlags> {
  try {
    const docRef = doc(db, FEATURE_FLAGS_DOC_PATH);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as AppConfigDoc;
      const flags = data.flags || DEFAULT_FLAGS;
      await saveCachedFlags(flags);
      cachedFlags = flags;
      cacheTimestamp = Date.now();
      return flags;
    } else {
      // Doc yoksa default kullan
      await saveCachedFlags(DEFAULT_FLAGS);
      cachedFlags = DEFAULT_FLAGS;
      cacheTimestamp = Date.now();
      return DEFAULT_FLAGS;
    }
  } catch (error) {
    logger.warn('Failed to fetch feature flags from Firestore', {
      error: error instanceof Error ? error.message : String(error),
    }).catch(() => {
      // Logger hatası: ignore
    });

    // Firestore hatası: cache'den oku veya default kullan
    const cached = await loadCachedFlags();
    if (cached) {
      cachedFlags = cached;
      cacheTimestamp = Date.now();
      return cached;
    }

    return DEFAULT_FLAGS;
  }
}

/**
 * Feature flag değerini al
 */
export async function getFeatureFlag<K extends keyof FeatureFlags>(
  key: K,
  fallback: FeatureFlags[K] = DEFAULT_FLAGS[key],
): Promise<FeatureFlags[K]> {
  // Cache'den oku (eğer yüklüyse)
  if (cachedFlags) {
    return cachedFlags[key] ?? fallback;
  }

  // Cache'den yükle
  const cached = await loadCachedFlags();
  if (cached) {
    cachedFlags = cached;
    cacheTimestamp = Date.now();
    return cached[key] ?? fallback;
  }

  // Firestore'dan çek
  const flags = await fetchFlagsFromFirestore();
  return flags[key] ?? fallback;
}

/**
 * Feature flags'ı subscribe et (real-time updates)
 */
export function subscribeFeatureFlags(
  callback: (flags: FeatureFlags) => void,
): () => void {
  // İlk callback'i çağır (cache'den veya Firestore'dan)
  getFeatureFlag('enableAlarmPreflight').then(() => {
    if (cachedFlags) {
      callback(cachedFlags);
    }
  });

  // Firestore real-time listener
  try {
    const docRef = doc(db, FEATURE_FLAGS_DOC_PATH);
    unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as AppConfigDoc;
          const flags = data.flags || DEFAULT_FLAGS;
          cachedFlags = flags;
          cacheTimestamp = Date.now();
          saveCachedFlags(flags).catch(() => {
            // Cache save hatası: ignore
          });
          callback(flags);
        } else {
          // Doc yoksa default kullan
          cachedFlags = DEFAULT_FLAGS;
          cacheTimestamp = Date.now();
          callback(DEFAULT_FLAGS);
        }
      },
      (error) => {
        logger.warn('Feature flags subscription error', {
          error: error.message,
        }).catch(() => {
          // Logger hatası: ignore
        });

        // Hata durumunda cache'den oku
        loadCachedFlags().then((cached) => {
          if (cached) {
            cachedFlags = cached;
            cacheTimestamp = Date.now();
            callback(cached);
          } else {
            callback(DEFAULT_FLAGS);
          }
        });
      },
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  } catch (error) {
    logger.warn('Failed to subscribe feature flags', {
      error: error instanceof Error ? error.message : String(error),
    }).catch(() => {
      // Logger hatası: ignore
    });

    // Fallback: cache'den oku
    loadCachedFlags().then((cached) => {
      if (cached) {
        callback(cached);
      } else {
        callback(DEFAULT_FLAGS);
      }
    });

    return () => {
      // No-op unsubscribe
    };
  }
}

/**
 * Minimum desteklenen versiyonu al
 */
export async function getMinSupportedVersion(): Promise<string> {
  try {
    const docRef = doc(db, FEATURE_FLAGS_DOC_PATH);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as AppConfigDoc;
      return data.minSupportedVersion || '1.0.0';
    }

    return '1.0.0';
  } catch (error) {
    logger.warn('Failed to get min supported version', {
      error: error instanceof Error ? error.message : String(error),
    }).catch(() => {
      // Logger hatası: ignore
    });
    return '1.0.0';
  }
}

/**
 * Tüm flags'ı al (sync, cache'den)
 */
export function getFeatureFlagsSync(): FeatureFlags {
  return cachedFlags || DEFAULT_FLAGS;
}
