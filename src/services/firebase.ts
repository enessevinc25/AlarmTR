import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getReactNativePersistence } from '../lib/reactNativeAuthPersistence';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * Firebase Client Configuration
 * 
 * Öncelik sırası:
 * 1. process.env.EXPO_PUBLIC_* (önce .env dosyasından okunur)
 * 2. Constants.expoConfig.extra.firebase (app.config.ts veya app.json'dan)
 * 3. Boş string (fallback)
 * 
 * NOT: Production build'lerde (EAS Build) .env dosyası build zamanında
 * EAS secrets olarak tanımlanmalıdır. Yoksa app.json'daki değerler kullanılır.
 * 
 * Expo Go'da Constants.expoConfig henüz hazır olmayabilir, bu yüzden
 * lazy initialization kullanıyoruz.
 */

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

/**
 * Firebase config'i güvenli bir şekilde alır
 * Expo Go'da Constants.expoConfig henüz hazır olmayabilir
 */
function getFirebaseConfig(): FirebaseConfig {
  // Önce process.env'den dene
  const envConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  };

  // Eğer env'de eksik varsa, Constants.expoConfig'den al
  try {
    const extra = (Constants.expoConfig as any)?.extra ?? {};
    const extraFirebase = extra.firebase ?? {};
    
    return {
      apiKey: envConfig.apiKey || extraFirebase.apiKey || '',
      authDomain: envConfig.authDomain || extraFirebase.authDomain || '',
      projectId: envConfig.projectId || extraFirebase.projectId || '',
      storageBucket: envConfig.storageBucket || extraFirebase.storageBucket || '',
      messagingSenderId: envConfig.messagingSenderId || extraFirebase.messagingSenderId || '',
      appId: envConfig.appId || extraFirebase.appId || '',
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[firebase] Constants.expoConfig okunamadı (Expo Go olabilir), env değerleri kullanılıyor:', error);
    }
    return envConfig;
  }
}

/**
 * Firebase App Initialization
 * 
 * Lazy initialization kullanarak Expo Go uyumluluğunu sağlar.
 * İlk kullanımda initialize edilir.
 */
let appInstance: FirebaseApp | null = null;

function initializeFirebaseApp(): FirebaseApp {
  if (appInstance) {
    return appInstance;
  }

  try {
    // Zaten initialize edilmişse mevcut instance'ı kullan
    if (getApps().length > 0) {
      appInstance = getApp();
      return appInstance;
    }

    // Config'i al
    const firebaseConfig = getFirebaseConfig();

    // Config validation
    const requiredFields: (keyof FirebaseConfig)[] = ['apiKey', 'appId', 'projectId'];
    const missingFields = requiredFields.filter((field) => !firebaseConfig[field]);

    if (missingFields.length > 0) {
      if (__DEV__) {
        console.warn(`[firebase] Firebase config eksik! Eksik alanlar: ${missingFields.join(', ')}. EXPO_PUBLIC_* env veya extra.firebase kontrol et.`);
      }
      
      // app.json'dan tekrar dene
      try {
        const extra = (Constants.expoConfig as any)?.extra ?? {};
        const extraFirebase = extra.firebase ?? {};
        
        if (extraFirebase.apiKey && extraFirebase.appId && extraFirebase.projectId) {
          if (__DEV__) {
            console.log('[firebase] app.json config ile initialize ediliyor...');
          }
          appInstance = initializeApp(extraFirebase as FirebaseConfig);
          return appInstance;
        }
      } catch (configError) {
        if (__DEV__) {
          console.warn('[firebase] app.json config okunamadı:', configError);
        }
      }

      // Son çare: minimal config ile devam et (crash etmemek için)
      if (__DEV__) {
        console.warn('[firebase] Minimal config ile initialize ediliyor. Firebase özellikleri çalışmayabilir.');
      }
      const minimalConfig: FirebaseConfig = {
        apiKey: firebaseConfig.apiKey || 'dummy',
        authDomain: firebaseConfig.authDomain || 'dummy',
        projectId: firebaseConfig.projectId || 'dummy',
        storageBucket: firebaseConfig.storageBucket || 'dummy',
        messagingSenderId: firebaseConfig.messagingSenderId || 'dummy',
        appId: firebaseConfig.appId || 'dummy',
      };
      appInstance = initializeApp(minimalConfig);
      return appInstance;
    }

    // Normal initialization
    appInstance = initializeApp(firebaseConfig);
    if (__DEV__) {
      console.log('[firebase] Firebase app başarıyla initialize edildi.');
    }
    return appInstance;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[firebase] Firebase app initialization hatası:', error);
    }
    
    // Fallback: mevcut app varsa onu kullan
    try {
      if (getApps().length > 0) {
        appInstance = getApp();
        return appInstance;
      }
    } catch (fallbackError) {
      if (__DEV__) {
        console.error('[firebase] Fallback initialization da başarısız:', fallbackError);
      }
    }

    // Son çare: minimal config ile başlat
    try {
      const minimalConfig: FirebaseConfig = {
        apiKey: 'dummy',
        authDomain: 'dummy',
        projectId: 'dummy',
        storageBucket: 'dummy',
        messagingSenderId: 'dummy',
        appId: 'dummy',
      };
      appInstance = initializeApp(minimalConfig);
      if (__DEV__) {
        console.warn('[firebase] Minimal config ile initialize edildi (son çare). Firebase özellikleri çalışmayabilir.');
      }
      return appInstance;
    } catch (finalError) {
      if (__DEV__) {
        console.error('[firebase] Tüm initialization denemeleri başarısız:', finalError);
      }
      throw new Error('Firebase initialization başarısız');
    }
  }
}

/**
 * Firebase Auth Initialization
 * 
 * Lazy initialization kullanarak Expo Go uyumluluğunu sağlar.
 */
let authInstance: Auth | null = null;

function initializeFirebaseAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }

  const firebaseApp = initializeFirebaseApp();

  try {
    authInstance = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    if (__DEV__) {
      console.log('[firebase] Firebase Auth başarıyla initialize edildi.');
    }
    return authInstance;
  } catch (e: any) {
    // Auth zaten initialize edilmişse mevcut instance'ı kullan
    if (e?.code === 'auth/already-initialized') {
      authInstance = getAuth(firebaseApp);
      return authInstance;
    } else {
      if (__DEV__) {
        console.error('[firebase] Auth initialization hatası:', e);
      }
      // Expo Go'da bazı durumlarda initializeAuth başarısız olabilir, getAuth ile devam et
      try {
        authInstance = getAuth(firebaseApp);
        return authInstance;
      } catch (getAuthError) {
        if (__DEV__) {
          console.error('[firebase] getAuth da başarısız:', getAuthError);
        }
        // Son çare: app'ten auth al
        authInstance = getAuth(firebaseApp);
        return authInstance;
      }
    }
  }
}

/**
 * Firestore Initialization
 * 
 * Lazy initialization kullanarak Expo Go uyumluluğunu sağlar.
 */
let dbInstance: Firestore | null = null;

function initializeFirestore(): Firestore {
  if (dbInstance) {
    return dbInstance;
  }

  const firebaseApp = initializeFirebaseApp();

  try {
    dbInstance = getFirestore(firebaseApp);
    if (__DEV__) {
      console.log('[firebase] Firestore başarıyla initialize edildi.');
    }
    return dbInstance;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[firebase] Firestore initialization hatası:', error);
    }
    // Firestore initialization hatası durumunda tekrar deneme
    try {
      dbInstance = getFirestore(firebaseApp);
      return dbInstance;
    } catch (retryError) {
      if (__DEV__) {
        console.error('[firebase] Firestore retry initialization hatası:', retryError);
      }
      // Son çare: mevcut app instance'ından Firestore al
      try {
        dbInstance = getFirestore(firebaseApp);
        return dbInstance;
      } catch (finalError) {
        if (__DEV__) {
          console.error('[firebase] Firestore final initialization hatası:', finalError);
        }
        // Expo Go'da Firestore başlatılamazsa bile uygulama crash etmemeli
        // Bu durumda db null olabilir ama type safety için getFirestore'u tekrar çağırıyoruz
        dbInstance = getFirestore(firebaseApp);
        return dbInstance;
      }
    }
  }
}

// Export'lar - lazy initialization kullanarak
// İlk kullanımda initialize edilir, böylece Expo Go'da modül seviyesinde sorun çıkmaz
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

// Internal getter function'lar
function getAppInstance(): FirebaseApp {
  if (!_app) {
    _app = initializeFirebaseApp();
  }
  return _app;
}

function getAuthInstance(): Auth {
  if (!_auth) {
    _auth = initializeFirebaseAuth();
  }
  return _auth;
}

function getDbInstance(): Firestore {
  if (!_db) {
    _db = initializeFirestore();
  }
  return _db;
}

// Export'lar - ilk erişimde initialize edilir
// Expo Go'da modül seviyesinde initialization sorunlarını önlemek için
// try-catch ile sarmalıyoruz
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getAppInstance();
  auth = getAuthInstance();
  db = getDbInstance();
} catch (error) {
  if (__DEV__) {
    console.error('[firebase] Module-level initialization hatası (Expo Go olabilir):', error);
  }
  // Hata durumunda lazy initialization kullanılacak
  // Export'lar getter function'lar gibi çalışacak
  app = getAppInstance();
  auth = getAuthInstance();
  db = getDbInstance();
}

export { app, auth, db };
