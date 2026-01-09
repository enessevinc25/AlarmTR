/**
 * Firebase Admin SDK Initialization
 * 
 * Bu modül, diğer admin script'ler tarafından kullanılmak üzere
 * Firebase Admin SDK'yı initialize eder ve Firestore instance'ını export eder.
 * 
 * 🔐 Service Account Authentication:
 * - Service account key dosyası repoya KONULMAMALIDIR
 * - GOOGLE_APPLICATION_CREDENTIALS ortam değişkeni ile dışarıdan verilir
 * - Örnek (PowerShell): $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"
 * - Örnek (Bash): export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
 * - applicationDefault() credential bu ortam değişkenini otomatik okur
 * 
 * Kullanım:
 *   import { db } from './firebaseAdmin';
 *   await db.collection('users').doc('123').get();
 */

import admin from 'firebase-admin';

// NOT: Service account key, GOOGLE_APPLICATION_CREDENTIALS ortam değişkeniyle dışarıdan verilir.
// Bu projede JSON dosyası repoya konulmaz.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const db = admin.firestore();