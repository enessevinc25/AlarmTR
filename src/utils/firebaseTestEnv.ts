/**
 * Firebase Test Environment Helper
 * 
 * Test ortamında Firebase emulator'lara bağlanmak için kullanılır.
 * 
 * Kullanım:
 *   - Test ortamında FIREBASE_EMULATOR_HOST env var set edilirse
 *     Firebase client'ları otomatik olarak emulator'lara bağlanır.
 *   - Production'da normal Firebase projesine bağlanır.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Firebase emulator host kontrolü
 * Test ortamında FIREBASE_EMULATOR_HOST env var set edilirse emulator'lara bağlanır
 */
const isEmulatorMode = (): boolean => {
  return process.env.FIREBASE_EMULATOR_HOST !== undefined ||
         process.env.FIREBASE_AUTH_EMULATOR_HOST !== undefined ||
         process.env.FIREBASE_FIRESTORE_EMULATOR_HOST !== undefined;
};

/**
 * Firebase App'i başlatır (emulator modunda ise emulator'lara bağlanır)
 */
export function initializeFirebaseTestApp(config?: {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  appId?: string;
}): FirebaseApp {
  if (app) {
    return app;
  }

  // Test config (emulator için minimal config yeterli)
  const testConfig = {
    apiKey: config?.apiKey || 'dummy-api-key',
    authDomain: config?.authDomain || 'test.firebaseapp.com',
    projectId: config?.projectId || 'alarmtr-test',
    appId: config?.appId || (config?.projectId ? `1:${config.projectId}:web:test` : '1:alarmtr-test:web:test'),
  };

  if (getApps().length === 0) {
    app = initializeApp(testConfig);
  } else {
    app = getApp();
  }

  return app;
}

/**
 * Firebase Auth'u başlatır ve emulator modunda ise emulator'a bağlanır
 */
export function initializeFirebaseTestAuth(app: FirebaseApp): Auth {
  if (auth) {
    return auth;
  }

  auth = getAuth(app);

  // Emulator modunda ise emulator'a bağlan
  // Auth emulator host kontrolü
  const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (authEmulatorHost) {
    try {
      // Sadece bir kez bağlan (zaten bağlıysa tekrar bağlanma)
      if (!(auth as any)._delegate?._config?.emulator) {
        connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true });
      }
    } catch (error) {
      // Zaten bağlıysa hata verme
      if (!(error as Error).message.includes('already been called')) {
        throw error;
      }
    }
  }

  return auth;
}

/**
 * Firestore'u başlatır ve emulator modunda ise emulator'a bağlanır
 */
export function initializeFirebaseTestFirestore(app: FirebaseApp): Firestore {
  if (db) {
    return db;
  }

  db = getFirestore(app);

  // Emulator modunda ise emulator'a bağlan
  const firestoreEmulatorHost = process.env.FIREBASE_FIRESTORE_EMULATOR_HOST;
  if (firestoreEmulatorHost) {
    try {
      // Sadece bir kez bağlan (zaten bağlıysa tekrar bağlanma)
      const [host, port] = firestoreEmulatorHost.split(':');
      if (!(db as any)._delegate?._settings?.host?.includes('localhost') && 
          !(db as any)._delegate?._settings?.host?.includes('127.0.0.1')) {
        connectFirestoreEmulator(db, host || '127.0.0.1', parseInt(port || '8085'));
      }
    } catch (error) {
      // Zaten bağlıysa hata verme
      if (!(error as Error).message.includes('already been called')) {
        throw error;
      }
    }
  }

  return db;
}

/**
 * Tüm Firebase servislerini başlatır (test ortamı için)
 */
export function initializeFirebaseTestServices(config?: {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  appId?: string;
}): { app: FirebaseApp; auth: Auth; db: Firestore } {
  const firebaseApp = initializeFirebaseTestApp(config);
  const firebaseAuth = initializeFirebaseTestAuth(firebaseApp);
  const firestore = initializeFirebaseTestFirestore(firebaseApp);

  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firestore,
  };
}

/**
 * Test ortamını temizler
 */
export function cleanupFirebaseTestServices(): void {
  app = null;
  auth = null;
  db = null;
}

